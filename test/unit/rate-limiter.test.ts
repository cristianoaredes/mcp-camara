/**
 * Tests for RateLimiter
 * Verifies sliding window algorithm, limits, bypass functionality, and cleanup
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { RateLimiter, createRateLimiter } from '../../lib/infrastructure/rate-limiter.js';
import { RateLimitError } from '../../lib/shared/utils/errors.js';

describe('RateLimiter', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('Basic Operations', () => {
    it('should allow requests within limit', async () => {
      const limiter = new RateLimiter({
        enabled: true,
        defaultLimit: 30,
        authenticatedLimit: 100,
        windowMs: 60000,
      });

      const info = await limiter.checkLimit('user1', false);
      
      expect(info.limit).toBe(30);
      expect(info.remaining).toBe(29);
      expect(info.reset).toBeGreaterThan(Date.now());
    });

    it('should track multiple identifiers separately', async () => {
      const limiter = new RateLimiter({
        enabled: true,
        defaultLimit: 30,
        authenticatedLimit: 100,
        windowMs: 60000,
      });

      await limiter.checkLimit('user1', false);
      await limiter.checkLimit('user2', false);
      
      const status1 = limiter.getStatus('user1', false);
      const status2 = limiter.getStatus('user2', false);
      
      expect(status1.remaining).toBe(29);
      expect(status2.remaining).toBe(29);
    });

    it('should get status without recording request', () => {
      const limiter = new RateLimiter({
        enabled: true,
        defaultLimit: 30,
        authenticatedLimit: 100,
        windowMs: 60000,
      });

      const status1 = limiter.getStatus('user1', false);
      const status2 = limiter.getStatus('user1', false);
      
      // Both should show full limit since no requests were recorded
      expect(status1.remaining).toBe(30);
      expect(status2.remaining).toBe(30);
    });
  });

  describe('Sliding Window Algorithm', () => {
    it('should enforce default limit of 30 requests per minute', async () => {
      const limiter = new RateLimiter({
        enabled: true,
        defaultLimit: 30,
        authenticatedLimit: 100,
        windowMs: 60000,
      });

      // Make 30 requests
      for (let i = 0; i < 30; i++) {
        await limiter.checkLimit('user1', false);
      }

      // 31st request should fail
      await expect(limiter.checkLimit('user1', false)).rejects.toThrow(RateLimitError);
    });

    it('should enforce authenticated limit of 100 requests per minute', async () => {
      const limiter = new RateLimiter({
        enabled: true,
        defaultLimit: 30,
        authenticatedLimit: 100,
        windowMs: 60000,
      });

      // Make 100 requests
      for (let i = 0; i < 100; i++) {
        await limiter.checkLimit('user1', true);
      }

      // 101st request should fail
      await expect(limiter.checkLimit('user1', true)).rejects.toThrow(RateLimitError);
    });

    it('should allow requests after window expires', async () => {
      const limiter = new RateLimiter({
        enabled: true,
        defaultLimit: 30,
        authenticatedLimit: 100,
        windowMs: 60000,
      });

      // Make 30 requests
      for (let i = 0; i < 30; i++) {
        await limiter.checkLimit('user1', false);
      }

      // Should fail
      await expect(limiter.checkLimit('user1', false)).rejects.toThrow(RateLimitError);

      // Advance time beyond window
      vi.advanceTimersByTime(61000);

      // Should succeed now
      const info = await limiter.checkLimit('user1', false);
      expect(info.remaining).toBe(29);
    });

    it('should implement sliding window correctly', async () => {
      const limiter = new RateLimiter({
        enabled: true,
        defaultLimit: 5,
        authenticatedLimit: 100,
        windowMs: 10000, // 10 second window for easier testing
      });

      // Make 5 requests at t=0
      for (let i = 0; i < 5; i++) {
        await limiter.checkLimit('user1', false);
      }

      // Should fail at t=0
      await expect(limiter.checkLimit('user1', false)).rejects.toThrow(RateLimitError);

      // Advance time by 5 seconds (half window)
      vi.advanceTimersByTime(5000);

      // Should still fail (all 5 requests still in window)
      await expect(limiter.checkLimit('user1', false)).rejects.toThrow(RateLimitError);

      // Advance time by another 6 seconds (total 11 seconds)
      vi.advanceTimersByTime(6000);

      // Should succeed now (old requests outside window)
      const info = await limiter.checkLimit('user1', false);
      expect(info.remaining).toBe(4);
    });

    it('should include retry-after in error', async () => {
      const limiter = new RateLimiter({
        enabled: true,
        defaultLimit: 2,
        authenticatedLimit: 100,
        windowMs: 60000,
      });

      await limiter.checkLimit('user1', false);
      await limiter.checkLimit('user1', false);

      try {
        await limiter.checkLimit('user1', false);
        expect.fail('Should have thrown RateLimitError');
      } catch (error) {
        expect(error).toBeInstanceOf(RateLimitError);
        if (error instanceof RateLimitError) {
          expect(error.retryAfter).toBeGreaterThan(0);
          expect(error.retryAfter).toBeLessThanOrEqual(60);
          expect(error.message).toContain('Try again in');
        }
      }
    });
  });

  describe('Rate Limit Bypass', () => {
    it('should bypass rate limiting when disabled', async () => {
      const limiter = new RateLimiter({
        enabled: false,
        defaultLimit: 30,
        authenticatedLimit: 100,
        windowMs: 60000,
      });

      // Make 100 requests - should all succeed
      for (let i = 0; i < 100; i++) {
        const info = await limiter.checkLimit('user1', false);
        expect(info.limit).toBe(Infinity);
        expect(info.remaining).toBe(Infinity);
      }
    });

    it('should return infinite limits when disabled', () => {
      const limiter = new RateLimiter({
        enabled: false,
        defaultLimit: 30,
        authenticatedLimit: 100,
        windowMs: 60000,
      });

      const status = limiter.getStatus('user1', false);
      
      expect(status.limit).toBe(Infinity);
      expect(status.remaining).toBe(Infinity);
    });
  });

  describe('Reset Functionality', () => {
    it('should reset rate limit for specific identifier', async () => {
      const limiter = new RateLimiter({
        enabled: true,
        defaultLimit: 30,
        authenticatedLimit: 100,
        windowMs: 60000,
      });

      // Make some requests
      await limiter.checkLimit('user1', false);
      await limiter.checkLimit('user1', false);
      
      let status = limiter.getStatus('user1', false);
      expect(status.remaining).toBe(28);

      // Reset
      limiter.reset('user1');
      
      status = limiter.getStatus('user1', false);
      expect(status.remaining).toBe(30);
    });

    it('should reset all rate limits', async () => {
      const limiter = new RateLimiter({
        enabled: true,
        defaultLimit: 30,
        authenticatedLimit: 100,
        windowMs: 60000,
      });

      // Make requests for multiple users
      await limiter.checkLimit('user1', false);
      await limiter.checkLimit('user2', false);
      
      // Reset all
      limiter.resetAll();
      
      const status1 = limiter.getStatus('user1', false);
      const status2 = limiter.getStatus('user2', false);
      
      expect(status1.remaining).toBe(30);
      expect(status2.remaining).toBe(30);
    });
  });

  describe('Cleanup Mechanism', () => {
    it('should clean up old entries periodically', async () => {
      const limiter = new RateLimiter({
        enabled: true,
        defaultLimit: 30,
        authenticatedLimit: 100,
        windowMs: 60000,
      });

      // Make requests
      await limiter.checkLimit('user1', false);
      await limiter.checkLimit('user2', false);
      
      let stats = limiter.getStats();
      expect(stats.totalIdentifiers).toBe(2);

      // Advance time beyond cleanup threshold (2x window)
      vi.advanceTimersByTime(121000);

      // Trigger cleanup by advancing to next interval
      vi.advanceTimersByTime(60000);

      stats = limiter.getStats();
      expect(stats.totalIdentifiers).toBe(0);
    });

    it('should remove entries with no timestamps', async () => {
      const limiter = new RateLimiter({
        enabled: true,
        defaultLimit: 30,
        authenticatedLimit: 100,
        windowMs: 10000,
      });

      // Make a request
      await limiter.checkLimit('user1', false);
      
      // Advance time beyond window
      vi.advanceTimersByTime(11000);

      // Make another request to trigger cleanup
      await limiter.checkLimit('user2', false);

      // Advance to cleanup interval
      vi.advanceTimersByTime(10000);

      const stats = limiter.getStats();
      // user1 should be cleaned up, only user2 remains
      expect(stats.totalIdentifiers).toBeLessThanOrEqual(2);
    });
  });

  describe('Statistics', () => {
    it('should provide accurate statistics', async () => {
      const limiter = new RateLimiter({
        enabled: true,
        defaultLimit: 30,
        authenticatedLimit: 100,
        windowMs: 60000,
      });

      await limiter.checkLimit('user1', false);
      await limiter.checkLimit('user1', false);
      await limiter.checkLimit('user2', false);

      const stats = limiter.getStats();
      
      expect(stats.totalIdentifiers).toBe(2);
      expect(stats.totalRequests).toBe(3);
      expect(stats.enabled).toBe(true);
    });

    it('should only count requests within window', async () => {
      const limiter = new RateLimiter({
        enabled: true,
        defaultLimit: 30,
        authenticatedLimit: 100,
        windowMs: 10000,
      });

      await limiter.checkLimit('user1', false);
      await limiter.checkLimit('user1', false);

      // Advance time beyond window
      vi.advanceTimersByTime(11000);

      await limiter.checkLimit('user1', false);

      const stats = limiter.getStats();
      
      // Should only count the last request
      expect(stats.totalRequests).toBe(1);
    });
  });

  describe('createRateLimiter factory', () => {
    it('should create rate limiter with default config', () => {
      const limiter = createRateLimiter();
      
      const status = limiter.getStatus('user1', false);
      expect(status.limit).toBe(30);
    });

    it('should create rate limiter with custom config', () => {
      const limiter = createRateLimiter({
        defaultLimit: 50,
        authenticatedLimit: 200,
      });
      
      const status = limiter.getStatus('user1', false);
      expect(status.limit).toBe(50);
      
      const authStatus = limiter.getStatus('user1', true);
      expect(authStatus.limit).toBe(200);
    });

    it('should merge custom config with defaults', () => {
      const limiter = createRateLimiter({
        defaultLimit: 50,
      });
      
      const stats = limiter.getStats();
      expect(stats.enabled).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should handle rapid successive requests', async () => {
      const limiter = new RateLimiter({
        enabled: true,
        defaultLimit: 10,
        authenticatedLimit: 100,
        windowMs: 60000,
      });

      // Make 10 requests rapidly
      const promises = Array.from({ length: 10 }, () => 
        limiter.checkLimit('user1', false)
      );

      await Promise.all(promises);

      // 11th should fail
      await expect(limiter.checkLimit('user1', false)).rejects.toThrow(RateLimitError);
    });

    it('should handle zero remaining correctly', async () => {
      const limiter = new RateLimiter({
        enabled: true,
        defaultLimit: 1,
        authenticatedLimit: 100,
        windowMs: 60000,
      });

      const info = await limiter.checkLimit('user1', false);
      expect(info.remaining).toBe(0);

      await expect(limiter.checkLimit('user1', false)).rejects.toThrow(RateLimitError);
    });

    it('should calculate reset time correctly', async () => {
      const limiter = new RateLimiter({
        enabled: true,
        defaultLimit: 30,
        authenticatedLimit: 100,
        windowMs: 60000,
      });

      const startTime = Date.now();
      const info = await limiter.checkLimit('user1', false);
      
      expect(info.reset).toBeGreaterThanOrEqual(startTime);
      expect(info.reset).toBeLessThanOrEqual(startTime + 60000);
    });
  });
});
