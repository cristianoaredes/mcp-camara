/**
 * Cloudflare KV-backed cache implementation
 * Provides distributed caching across Workers instances using KV storage
 */

import { createHash } from 'node:crypto';
import type { QueryParams } from '../shared/types/index.js';
import type { CacheConfig } from '../core/cache.js';
import type { CacheInterface } from '../core/tools.js';

/**
 * KV-backed cache layer for Cloudflare Workers
 * Implements the CacheInterface for distributed storage across Workers instances
 */
export class CloudflareKVCache implements CacheInterface {
  private kv: KVNamespace;
  private config: CacheConfig;

  constructor(kv: KVNamespace, config: CacheConfig) {
    this.kv = kv;
    this.config = config;
  }

  /**
   * Get cached value from KV, returns null if expired or not found
   */
  async get<T>(key: string): Promise<T | null> {
    if (!this.config.enabled) {
      return null;
    }

    try {
      const value = await this.kv.get(key, 'json');
      
      if (!value) {
        return null;
      }

      return value as T;
    } catch (error) {
      // Log error but don't fail the request
      console.error('KV cache get error:', error);
      return null;
    }
  }

  /**
   * Set cache value in KV with TTL
   * KV automatically handles expiration based on expirationTtl
   */
  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    if (!this.config.enabled) {
      return;
    }

    try {
      const expirationTtl = ttl || this.config.ttl;
      
      // KV put with automatic expiration
      await this.kv.put(key, JSON.stringify(value), {
        expirationTtl,
      });
    } catch (error) {
      // Log error but don't fail the request
      console.error('KV cache set error:', error);
    }
  }

  /**
   * Check if key exists in KV
   * Note: This requires a get operation in KV, so it's not as efficient as in-memory cache
   * Returns a Promise to match the CacheInterface
   */
  has(key: string): Promise<boolean> {
    if (!this.config.enabled) {
      return Promise.resolve(false);
    }

    return this.kv.get(key)
      .then(value => value !== null)
      .catch(error => {
        console.error('KV cache has error:', error);
        return false;
      });
  }

  /**
   * Clear all cache entries
   * Note: KV doesn't support bulk delete, so this is a no-op
   * Individual entries will expire based on their TTL
   */
  clear(): void {
    // KV doesn't support bulk operations
    // Entries will expire naturally based on TTL
    console.warn('KV cache clear is not supported. Entries will expire based on TTL.');
  }

  /**
   * Generate deterministic cache key from endpoint and params
   * Same implementation as in-memory cache for consistency
   */
  generateKey(endpoint: string, params?: QueryParams): string {
    if (!params || Object.keys(params).length === 0) {
      return endpoint;
    }

    // Sort params for consistent hashing
    const sortedParams = Object.keys(params)
      .sort()
      .reduce((acc, key) => {
        const value = params[key];
        if (value !== undefined && value !== null) {
          acc[key] = value;
        }
        return acc;
      }, {} as QueryParams);

    const paramsHash = createHash('md5')
      .update(JSON.stringify(sortedParams))
      .digest('hex');

    return `${endpoint}:${paramsHash}`;
  }

  /**
   * Delete a specific cache entry from KV
   */
  async delete(key: string): Promise<void> {
    if (!this.config.enabled) {
      return;
    }

    try {
      await this.kv.delete(key);
    } catch (error) {
      console.error('KV cache delete error:', error);
    }
  }

  /**
   * List all keys with a given prefix
   * Useful for debugging or cache management
   */
  async listKeys(prefix?: string): Promise<string[]> {
    try {
      const list = await this.kv.list({ prefix });
      return list.keys.map(key => key.name);
    } catch (error) {
      console.error('KV cache list error:', error);
      return [];
    }
  }

  /**
   * Get cache statistics
   * Note: KV doesn't provide size information, so this is limited
   */
  async getStats(): Promise<{
    enabled: boolean;
    ttl: number;
    keyCount: number;
  }> {
    try {
      const list = await this.kv.list();
      return {
        enabled: this.config.enabled,
        ttl: this.config.ttl,
        keyCount: list.keys.length,
      };
    } catch (error) {
      console.error('KV cache stats error:', error);
      return {
        enabled: this.config.enabled,
        ttl: this.config.ttl,
        keyCount: 0,
      };
    }
  }
}

/**
 * Create a KV-backed cache with default configuration
 */
export function createKVCache(
  kv: KVNamespace,
  config: Partial<CacheConfig> = {}
): CloudflareKVCache {
  const defaultConfig: CacheConfig = {
    enabled: true,
    ttl: 3600, // 1 hour
    maxSize: 0, // Not applicable for KV
  };

  return new CloudflareKVCache(kv, {
    ...defaultConfig,
    ...config,
  });
}
