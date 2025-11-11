/**
 * In-memory cache layer with LRU eviction
 * Provides caching for API responses to improve performance
 */

import { createHash } from 'node:crypto';
import { CacheError } from '../shared/utils/errors.js';
import type { QueryParams } from '../shared/types/index.js';
import type { CacheInterface } from './tools.js';

export interface CacheConfig {
  enabled: boolean;
  ttl: number;
  maxSize: number;
}

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
  size: number;
}

export class CacheLayer implements CacheInterface {
  private cache: Map<string, CacheEntry<unknown>> = new Map();
  private accessOrder: string[] = [];
  private currentSize: number = 0;
  private config: CacheConfig;

  constructor(config: CacheConfig) {
    this.config = config;
  }

  /**
   * Get cached value, returns null if expired or not found
   */
  async get<T>(key: string): Promise<T | null> {
    if (!this.config.enabled) {
      return null;
    }

    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    // Check if expired
    if (Date.now() > entry.expiresAt) {
      this.delete(key);
      return null;
    }

    // Update access order for LRU
    this.updateAccessOrder(key);

    return entry.data as T;
  }

  /**
   * Set cache value with optional custom TTL
   */
  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    if (!this.config.enabled) {
      return;
    }

    const size = this.calculateSize(value);
    const expiresAt = Date.now() + (ttl || this.config.ttl) * 1000;

    // Evict if necessary
    while (this.currentSize + size > this.config.maxSize && this.accessOrder.length > 0) {
      this.evictLRU();
    }

    // If single entry is too large, don't cache it
    if (size > this.config.maxSize) {
      throw new CacheError('Entry too large to cache', 'set');
    }

    const entry: CacheEntry<T> = {
      data: value,
      timestamp: Date.now(),
      expiresAt,
      size,
    };

    // Remove old entry if exists
    if (this.cache.has(key)) {
      this.delete(key);
    }

    this.cache.set(key, entry);
    this.currentSize += size;
    this.updateAccessOrder(key);
  }

  /**
   * Check if key exists and is valid (not expired)
   */
  has(key: string): boolean {
    if (!this.config.enabled) {
      return false;
    }

    const entry = this.cache.get(key);
    
    if (!entry) {
      return false;
    }

    if (Date.now() > entry.expiresAt) {
      this.delete(key);
      return false;
    }

    return true;
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
    this.accessOrder = [];
    this.currentSize = 0;
  }

  /**
   * Generate deterministic cache key from endpoint and params
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
   * Delete a cache entry
   */
  private delete(key: string): void {
    const entry = this.cache.get(key);
    if (entry) {
      this.cache.delete(key);
      this.currentSize -= entry.size;
      this.accessOrder = this.accessOrder.filter(k => k !== key);
    }
  }

  /**
   * Evict least recently used entry
   */
  private evictLRU(): void {
    if (this.accessOrder.length === 0) {
      return;
    }

    const lruKey = this.accessOrder[0];
    if (lruKey) {
      this.delete(lruKey);
    }
  }

  /**
   * Update access order for LRU tracking
   */
  private updateAccessOrder(key: string): void {
    this.accessOrder = this.accessOrder.filter(k => k !== key);
    this.accessOrder.push(key);
  }

  /**
   * Calculate approximate size of data in bytes
   */
  private calculateSize(data: unknown): number {
    try {
      return JSON.stringify(data).length;
    } catch {
      return 0;
    }
  }
}
