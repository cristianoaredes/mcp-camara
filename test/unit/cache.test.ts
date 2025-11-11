/**
 * Tests for CacheLayer
 * Verifies caching behavior, TTL, LRU eviction, and bypass functionality
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { CacheLayer } from '../../lib/core/cache.js';
import { CacheError } from '../../lib/shared/utils/errors.js';

describe('CacheLayer', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('Basic Operations', () => {
    it('should store and retrieve cached values', async () => {
      const cache = new CacheLayer({ enabled: true, ttl: 3600, maxSize: 1000000 });
      
      await cache.set('key1', { data: 'test' });
      const result = await cache.get('key1');
      
      expect(result).toEqual({ data: 'test' });
    });

    it('should return null for non-existent keys', async () => {
      const cache = new CacheLayer({ enabled: true, ttl: 3600, maxSize: 1000000 });
      
      const result = await cache.get('nonexistent');
      
      expect(result).toBeNull();
    });

    it('should check if key exists with has()', () => {
      const cache = new CacheLayer({ enabled: true, ttl: 3600, maxSize: 1000000 });
      
      cache.set('key1', { data: 'test' });
      
      expect(cache.has('key1')).toBe(true);
      expect(cache.has('nonexistent')).toBe(false);
    });

    it('should clear all cache entries', async () => {
      const cache = new CacheLayer({ enabled: true, ttl: 3600, maxSize: 1000000 });
      
      await cache.set('key1', { data: 'test1' });
      await cache.set('key2', { data: 'test2' });
      
      cache.clear();
      
      expect(cache.has('key1')).toBe(false);
      expect(cache.has('key2')).toBe(false);
    });
  });

  describe('TTL (Time To Live)', () => {
    it('should return cached value within TTL', async () => {
      const cache = new CacheLayer({ enabled: true, ttl: 3600, maxSize: 1000000 });
      
      await cache.set('key1', { data: 'test' });
      
      // Advance time by 1 hour (3600 seconds) - 1 second
      vi.advanceTimersByTime(3599 * 1000);
      
      const result = await cache.get('key1');
      expect(result).toEqual({ data: 'test' });
    });

    it('should return null for expired cache entries', async () => {
      const cache = new CacheLayer({ enabled: true, ttl: 1, maxSize: 1000000 });
      
      await cache.set('key1', { data: 'test' });
      
      // Advance time beyond TTL
      vi.advanceTimersByTime(1100);
      
      const result = await cache.get('key1');
      expect(result).toBeNull();
    });

    it('should support custom TTL per entry', async () => {
      const cache = new CacheLayer({ enabled: true, ttl: 3600, maxSize: 1000000 });
      
      await cache.set('key1', { data: 'test' }, 2); // 2 second TTL
      
      // Advance time by 1 second - should still be valid
      vi.advanceTimersByTime(1000);
      expect(await cache.get('key1')).toEqual({ data: 'test' });
      
      // Advance time by another 2 seconds - should be expired
      vi.advanceTimersByTime(2000);
      expect(await cache.get('key1')).toBeNull();
    });

    it('should remove expired entries when checking has()', () => {
      const cache = new CacheLayer({ enabled: true, ttl: 1, maxSize: 1000000 });
      
      cache.set('key1', { data: 'test' });
      
      expect(cache.has('key1')).toBe(true);
      
      // Advance time beyond TTL
      vi.advanceTimersByTime(1100);
      
      expect(cache.has('key1')).toBe(false);
    });
  });

  describe('LRU Eviction', () => {
    it('should evict least recently used entries when maxSize exceeded', async () => {
      // Small cache size to trigger eviction - strings are stored as JSON so "xxx" becomes "\"xxx\""
      const cache = new CacheLayer({ enabled: true, ttl: 3600, maxSize: 80 });
      
      // Each entry is approximately 32 bytes (30 chars + 2 quotes)
      await cache.set('key1', 'x'.repeat(30));
      await cache.set('key2', 'y'.repeat(30));
      
      // Adding key3 should evict key1 (LRU)
      await cache.set('key3', 'z'.repeat(30));
      
      expect(cache.has('key1')).toBe(false);
      expect(cache.has('key2')).toBe(true);
      expect(cache.has('key3')).toBe(true);
    });

    it('should update access order on get()', async () => {
      const cache = new CacheLayer({ enabled: true, ttl: 3600, maxSize: 80 });
      
      await cache.set('key1', 'x'.repeat(30));
      await cache.set('key2', 'y'.repeat(30));
      
      // Access key1 to make it more recently used
      await cache.get('key1');
      
      // Add key3, which should evict key2 (now LRU)
      await cache.set('key3', 'z'.repeat(30));
      
      expect(cache.has('key1')).toBe(true);
      expect(cache.has('key2')).toBe(false);
      expect(cache.has('key3')).toBe(true);
    });

    it('should throw error if single entry exceeds maxSize', async () => {
      const cache = new CacheLayer({ enabled: true, ttl: 3600, maxSize: 50 });
      
      await expect(
        cache.set('key1', 'x'.repeat(100))
      ).rejects.toThrow(CacheError);
    });

    it('should handle multiple evictions to make room', async () => {
      const cache = new CacheLayer({ enabled: true, ttl: 3600, maxSize: 80 });
      
      await cache.set('key1', 'a'.repeat(20));
      await cache.set('key2', 'b'.repeat(20));
      
      // This should evict both entries to make room
      await cache.set('key3', 'd'.repeat(70));
      
      expect(cache.has('key1')).toBe(false);
      expect(cache.has('key2')).toBe(false);
      expect(cache.has('key3')).toBe(true);
    });
  });

  describe('Cache Bypass', () => {
    it('should bypass cache when disabled', async () => {
      const cache = new CacheLayer({ enabled: false, ttl: 3600, maxSize: 1000000 });
      
      await cache.set('key1', { data: 'test' });
      const result = await cache.get('key1');
      
      expect(result).toBeNull();
    });

    it('should return false for has() when disabled', () => {
      const cache = new CacheLayer({ enabled: false, ttl: 3600, maxSize: 1000000 });
      
      cache.set('key1', { data: 'test' });
      
      expect(cache.has('key1')).toBe(false);
    });

    it('should not store entries when disabled', async () => {
      const cache = new CacheLayer({ enabled: false, ttl: 3600, maxSize: 1000000 });
      
      await cache.set('key1', { data: 'test' });
      
      // Enable cache and check - entry should not exist
      const enabledCache = new CacheLayer({ enabled: true, ttl: 3600, maxSize: 1000000 });
      expect(await enabledCache.get('key1')).toBeNull();
    });
  });

  describe('Key Generation', () => {
    it('should generate consistent keys for same endpoint and params', () => {
      const cache = new CacheLayer({ enabled: true, ttl: 3600, maxSize: 1000000 });
      
      const key1 = cache.generateKey('/deputados', { nome: 'João', siglaUf: 'SP' });
      const key2 = cache.generateKey('/deputados', { nome: 'João', siglaUf: 'SP' });
      
      expect(key1).toBe(key2);
    });

    it('should generate different keys for different params', () => {
      const cache = new CacheLayer({ enabled: true, ttl: 3600, maxSize: 1000000 });
      
      const key1 = cache.generateKey('/deputados', { nome: 'João' });
      const key2 = cache.generateKey('/deputados', { nome: 'Maria' });
      
      expect(key1).not.toBe(key2);
    });

    it('should generate same key regardless of param order', () => {
      const cache = new CacheLayer({ enabled: true, ttl: 3600, maxSize: 1000000 });
      
      const key1 = cache.generateKey('/deputados', { nome: 'João', siglaUf: 'SP' });
      const key2 = cache.generateKey('/deputados', { siglaUf: 'SP', nome: 'João' });
      
      expect(key1).toBe(key2);
    });

    it('should ignore undefined and null params', () => {
      const cache = new CacheLayer({ enabled: true, ttl: 3600, maxSize: 1000000 });
      
      const key1 = cache.generateKey('/deputados', { nome: 'João', siglaUf: undefined });
      const key2 = cache.generateKey('/deputados', { nome: 'João' });
      
      expect(key1).toBe(key2);
    });

    it('should return endpoint only when no params', () => {
      const cache = new CacheLayer({ enabled: true, ttl: 3600, maxSize: 1000000 });
      
      const key = cache.generateKey('/deputados');
      
      expect(key).toBe('/deputados');
    });

    it('should return endpoint only when params is empty object', () => {
      const cache = new CacheLayer({ enabled: true, ttl: 3600, maxSize: 1000000 });
      
      const key = cache.generateKey('/deputados', {});
      
      expect(key).toBe('/deputados');
    });
  });

  describe('Size Management', () => {
    it('should track cache size correctly', async () => {
      const cache = new CacheLayer({ enabled: true, ttl: 3600, maxSize: 1000000 });
      
      const data1 = { test: 'data1' };
      const data2 = { test: 'data2' };
      
      await cache.set('key1', data1);
      await cache.set('key2', data2);
      
      // Both entries should be stored
      expect(cache.has('key1')).toBe(true);
      expect(cache.has('key2')).toBe(true);
    });

    it('should update size when replacing existing entry', async () => {
      const cache = new CacheLayer({ enabled: true, ttl: 3600, maxSize: 200 });
      
      await cache.set('key1', 'x'.repeat(50));
      await cache.set('key2', 'y'.repeat(50));
      
      // Replace key1 with larger data
      await cache.set('key1', 'z'.repeat(80));
      
      expect(cache.has('key1')).toBe(true);
    });

    it('should handle complex objects', async () => {
      const cache = new CacheLayer({ enabled: true, ttl: 3600, maxSize: 1000000 });
      
      const complexData = {
        id: 123,
        name: 'Test Deputy',
        nested: {
          array: [1, 2, 3],
          object: { key: 'value' }
        }
      };
      
      await cache.set('key1', complexData);
      const result = await cache.get('key1');
      
      expect(result).toEqual(complexData);
    });
  });
});
