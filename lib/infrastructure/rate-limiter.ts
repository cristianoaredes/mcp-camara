/**
 * Rate limiting implementation using sliding window algorithm
 * Tracks requests per IP address or API key to prevent abuse
 */

import { RateLimitError } from '../shared/utils/errors.js';

export interface RateLimiterConfig {
  enabled: boolean;
  defaultLimit: number; // Requests per minute for unauthenticated users
  authenticatedLimit: number; // Requests per minute for authenticated users
  windowMs: number; // Time window in milliseconds (default: 60000 for 1 minute)
}

interface RequestRecord {
  timestamps: number[];
  lastCleanup: number;
}

export interface RateLimitInfo {
  limit: number;
  remaining: number;
  reset: number; // Unix timestamp when the limit resets
  retryAfter?: number; // Seconds to wait before retrying (only when limit exceeded)
}

/**
 * In-memory rate limiter using sliding window algorithm
 * Tracks request counts per identifier (IP address or API key) in rolling time windows
 */
export class RateLimiter {
  private requests: Map<string, RequestRecord>;
  private config: RateLimiterConfig;

  constructor(config: RateLimiterConfig) {
    this.config = config;
    this.requests = new Map();
    
    // Periodically clean up old entries to prevent memory leaks
    if (config.enabled) {
      setInterval(() => this.cleanup(), config.windowMs);
    }
  }

  /**
   * Check if a request should be allowed
   * @param identifier - IP address or API key
   * @param isAuthenticated - Whether the request is authenticated
   * @returns Rate limit information
   * @throws RateLimitError if limit is exceeded
   */
  async checkLimit(identifier: string, isAuthenticated: boolean = false): Promise<RateLimitInfo> {
    // Bypass rate limiting if disabled
    if (!this.config.enabled) {
      return {
        limit: Infinity,
        remaining: Infinity,
        reset: Date.now() + this.config.windowMs,
      };
    }

    const limit = isAuthenticated ? this.config.authenticatedLimit : this.config.defaultLimit;
    const now = Date.now();
    const windowStart = now - this.config.windowMs;

    // Get or create request record for this identifier
    let record = this.requests.get(identifier);
    if (!record) {
      record = {
        timestamps: [],
        lastCleanup: now,
      };
      this.requests.set(identifier, record);
    }

    // Remove timestamps outside the current window (sliding window)
    record.timestamps = record.timestamps.filter(timestamp => timestamp > windowStart);
    record.lastCleanup = now;

    const currentCount = record.timestamps.length;
    const remaining = Math.max(0, limit - currentCount);

    // Calculate reset time (end of current window)
    const oldestTimestamp = record.timestamps[0] || now;
    const reset = oldestTimestamp + this.config.windowMs;

    // Check if limit is exceeded
    if (currentCount >= limit) {
      const retryAfter = Math.ceil((reset - now) / 1000);
      
      throw new RateLimitError(
        `Rate limit exceeded. Limit: ${limit} requests per minute. Try again in ${retryAfter} seconds.`,
        retryAfter
      );
    }

    // Record this request
    record.timestamps.push(now);

    return {
      limit,
      remaining: remaining - 1, // Subtract 1 for the current request
      reset,
    };
  }

  /**
   * Get current rate limit status without recording a request
   * @param identifier - IP address or API key
   * @param isAuthenticated - Whether the request is authenticated
   * @returns Rate limit information
   */
  getStatus(identifier: string, isAuthenticated: boolean = false): RateLimitInfo {
    if (!this.config.enabled) {
      return {
        limit: Infinity,
        remaining: Infinity,
        reset: Date.now() + this.config.windowMs,
      };
    }

    const limit = isAuthenticated ? this.config.authenticatedLimit : this.config.defaultLimit;
    const now = Date.now();
    const windowStart = now - this.config.windowMs;

    const record = this.requests.get(identifier);
    if (!record) {
      return {
        limit,
        remaining: limit,
        reset: now + this.config.windowMs,
      };
    }

    // Count requests in current window
    const validTimestamps = record.timestamps.filter(timestamp => timestamp > windowStart);
    const currentCount = validTimestamps.length;
    const remaining = Math.max(0, limit - currentCount);

    // Calculate reset time
    const oldestTimestamp = validTimestamps[0] || now;
    const reset = oldestTimestamp + this.config.windowMs;

    return {
      limit,
      remaining,
      reset,
    };
  }

  /**
   * Reset rate limit for a specific identifier
   * Useful for testing or manual intervention
   * @param identifier - IP address or API key
   */
  reset(identifier: string): void {
    this.requests.delete(identifier);
  }

  /**
   * Clear all rate limit records
   * Useful for testing or system maintenance
   */
  resetAll(): void {
    this.requests.clear();
  }

  /**
   * Clean up old entries to prevent memory leaks
   * Removes records that haven't been accessed recently
   */
  private cleanup(): void {
    const now = Date.now();
    const cleanupThreshold = now - (this.config.windowMs * 2); // Keep records for 2x window

    for (const [identifier, record] of this.requests.entries()) {
      // Remove if no recent activity
      if (record.lastCleanup < cleanupThreshold) {
        this.requests.delete(identifier);
        continue;
      }

      // Clean up old timestamps
      const windowStart = now - this.config.windowMs;
      record.timestamps = record.timestamps.filter(timestamp => timestamp > windowStart);
      
      // Remove if no timestamps remain
      if (record.timestamps.length === 0) {
        this.requests.delete(identifier);
      }
    }
  }

  /**
   * Get statistics about current rate limiter state
   * Useful for monitoring and debugging
   */
  getStats(): {
    totalIdentifiers: number;
    totalRequests: number;
    enabled: boolean;
  } {
    let totalRequests = 0;
    const now = Date.now();
    const windowStart = now - this.config.windowMs;

    for (const record of this.requests.values()) {
      totalRequests += record.timestamps.filter(t => t > windowStart).length;
    }

    return {
      totalIdentifiers: this.requests.size,
      totalRequests,
      enabled: this.config.enabled,
    };
  }
}

/**
 * Create a rate limiter with default configuration
 */
export function createRateLimiter(config: Partial<RateLimiterConfig> = {}): RateLimiter {
  const defaultConfig: RateLimiterConfig = {
    enabled: true,
    defaultLimit: 30,
    authenticatedLimit: 100,
    windowMs: 60000, // 1 minute
  };

  return new RateLimiter({
    ...defaultConfig,
    ...config,
  });
}
