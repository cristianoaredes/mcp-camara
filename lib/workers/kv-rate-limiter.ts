/**
 * Cloudflare KV-backed rate limiter
 * Provides distributed rate limiting across Workers instances using KV storage
 */

import { RateLimitError } from '../shared/utils/errors.js';
import type { RateLimiterConfig, RateLimitInfo } from '../infrastructure/rate-limiter.js';

/**
 * Request record stored in KV
 */
interface KVRequestRecord {
  timestamps: number[];
  lastUpdate: number;
}

/**
 * KV-backed rate limiter for Cloudflare Workers
 * Uses KV for distributed state tracking across multiple Workers instances
 */
export class CloudflareKVRateLimiter {
  private kv: KVNamespace;
  private config: RateLimiterConfig;

  constructor(kv: KVNamespace, config: RateLimiterConfig) {
    this.kv = kv;
    this.config = config;
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
    const kvKey = `ratelimit:${identifier}`;

    try {
      // Get current record from KV
      const recordJson = await this.kv.get(kvKey);
      let record: KVRequestRecord;

      if (recordJson) {
        record = JSON.parse(recordJson);
        // Filter out timestamps outside the current window
        record.timestamps = record.timestamps.filter(timestamp => timestamp > windowStart);
      } else {
        record = {
          timestamps: [],
          lastUpdate: now,
        };
      }

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
      record.lastUpdate = now;

      // Store updated record in KV with expiration
      // Set expiration to 2x window to allow for cleanup
      const expirationTtl = Math.ceil((this.config.windowMs * 2) / 1000);
      await this.kv.put(kvKey, JSON.stringify(record), {
        expirationTtl,
      });

      return {
        limit,
        remaining: remaining - 1, // Subtract 1 for the current request
        reset,
      };
    } catch (error) {
      // If it's a RateLimitError, re-throw it
      if (error instanceof RateLimitError) {
        throw error;
      }

      // For other errors (KV failures), log and allow the request
      // This prevents KV issues from blocking all traffic
      console.error('KV rate limiter error:', error);
      return {
        limit,
        remaining: limit,
        reset: now + this.config.windowMs,
      };
    }
  }

  /**
   * Get current rate limit status without recording a request
   * @param identifier - IP address or API key
   * @param isAuthenticated - Whether the request is authenticated
   * @returns Rate limit information
   */
  async getStatus(identifier: string, isAuthenticated: boolean = false): Promise<RateLimitInfo> {
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
    const kvKey = `ratelimit:${identifier}`;

    try {
      const recordJson = await this.kv.get(kvKey);
      
      if (!recordJson) {
        return {
          limit,
          remaining: limit,
          reset: now + this.config.windowMs,
        };
      }

      const record: KVRequestRecord = JSON.parse(recordJson);
      
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
    } catch (error) {
      console.error('KV rate limiter status error:', error);
      return {
        limit,
        remaining: limit,
        reset: now + this.config.windowMs,
      };
    }
  }

  /**
   * Reset rate limit for a specific identifier
   * @param identifier - IP address or API key
   */
  async reset(identifier: string): Promise<void> {
    const kvKey = `ratelimit:${identifier}`;
    
    try {
      await this.kv.delete(kvKey);
    } catch (error) {
      console.error('KV rate limiter reset error:', error);
    }
  }

  /**
   * Reset all rate limits
   * Note: KV doesn't support efficient bulk delete, so this lists and deletes
   */
  async resetAll(): Promise<void> {
    try {
      const list = await this.kv.list({ prefix: 'ratelimit:' });
      
      // Delete all rate limit keys
      await Promise.all(
        list.keys.map(key => this.kv.delete(key.name))
      );
    } catch (error) {
      console.error('KV rate limiter reset all error:', error);
    }
  }

  /**
   * Get statistics about current rate limiter state
   */
  async getStats(): Promise<{
    totalIdentifiers: number;
    enabled: boolean;
  }> {
    try {
      const list = await this.kv.list({ prefix: 'ratelimit:' });
      
      return {
        totalIdentifiers: list.keys.length,
        enabled: this.config.enabled,
      };
    } catch (error) {
      console.error('KV rate limiter stats error:', error);
      return {
        totalIdentifiers: 0,
        enabled: this.config.enabled,
      };
    }
  }

  /**
   * Clean up expired entries
   * Note: KV automatically handles expiration, so this is a no-op
   */
  cleanup(): void {
    // KV automatically expires entries based on expirationTtl
    // No manual cleanup needed
  }
}

/**
 * Create a KV-backed rate limiter with default configuration
 */
export function createKVRateLimiter(
  kv: KVNamespace,
  config: Partial<RateLimiterConfig> = {}
): CloudflareKVRateLimiter {
  const defaultConfig: RateLimiterConfig = {
    enabled: true,
    defaultLimit: 30,
    authenticatedLimit: 100,
    windowMs: 60000, // 1 minute
  };

  return new CloudflareKVRateLimiter(kv, {
    ...defaultConfig,
    ...config,
  });
}
