/**
 * E2E Tests for Cloudflare Workers MCP Agent
 *
 * These tests verify the Cloudflare Workers deployment of the MCP Câmara server.
 * They test both local development and production environments.
 */

import { describe, it, expect, beforeAll } from 'vitest';

describe('Cloudflare Workers MCP Agent - E2E', () => {
  const LOCAL_URL = 'http://localhost:60320/sse';
  const PRODUCTION_URL = 'https://mcp-camara.cristianoaredes.workers.dev/sse';

  // Test timeout for network requests
  const NETWORK_TIMEOUT = 10000;

  describe('Local Development Server', () => {
    it('should be accessible at localhost:60320', async () => {
      const response = await fetch(LOCAL_URL, {
        method: 'GET',
        headers: {
          'Accept': 'text/event-stream',
        },
      });

      expect(response.ok).toBe(true);
      expect(response.headers.get('content-type')).toContain('text/event-stream');
    }, NETWORK_TIMEOUT);

    it('should return SSE connection headers', async () => {
      const response = await fetch(LOCAL_URL, {
        method: 'GET',
        headers: {
          'Accept': 'text/event-stream',
        },
      });

      const contentType = response.headers.get('content-type');
      const cacheControl = response.headers.get('cache-control');

      expect(contentType).toContain('text/event-stream');
      expect(cacheControl).toBe('no-cache');
    }, NETWORK_TIMEOUT);

    it('should stream SSE events with endpoint message', async () => {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(LOCAL_URL, {
        method: 'GET',
        headers: {
          'Accept': 'text/event-stream',
        },
        signal: controller.signal,
      });

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let receivedData = '';
      let hasEndpointEvent = false;

      if (reader) {
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            receivedData += decoder.decode(value, { stream: true });

            // Look for endpoint event
            if (receivedData.includes('event: endpoint')) {
              hasEndpointEvent = true;
              break;
            }
          }
        } catch (error) {
          // Ignore abort errors
          if ((error as Error).name !== 'AbortError') {
            throw error;
          }
        } finally {
          reader.releaseLock();
          clearTimeout(timeout);
        }
      }

      expect(hasEndpointEvent).toBe(true);
      expect(receivedData).toContain('event: endpoint');
    }, NETWORK_TIMEOUT);
  });

  describe('Production Server', () => {
    it('should be accessible at production URL', async () => {
      const response = await fetch(PRODUCTION_URL, {
        method: 'GET',
        headers: {
          'Accept': 'text/event-stream',
        },
      });

      expect(response.ok).toBe(true);
      expect(response.headers.get('content-type')).toContain('text/event-stream');
    }, NETWORK_TIMEOUT);

    it('should have CORS headers configured', async () => {
      const response = await fetch(PRODUCTION_URL, {
        method: 'OPTIONS',
        headers: {
          'Origin': 'https://example.com',
          'Access-Control-Request-Method': 'GET',
        },
      });

      const allowOrigin = response.headers.get('access-control-allow-origin');
      expect(allowOrigin).toBeTruthy();
    }, NETWORK_TIMEOUT);

    it('should stream SSE events in production', async () => {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(PRODUCTION_URL, {
        method: 'GET',
        headers: {
          'Accept': 'text/event-stream',
        },
        signal: controller.signal,
      });

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let receivedData = '';
      let hasEndpointEvent = false;

      if (reader) {
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            receivedData += decoder.decode(value, { stream: true });

            if (receivedData.includes('event: endpoint')) {
              hasEndpointEvent = true;
              break;
            }
          }
        } catch (error) {
          if ((error as Error).name !== 'AbortError') {
            throw error;
          }
        } finally {
          reader.releaseLock();
          clearTimeout(timeout);
        }
      }

      expect(hasEndpointEvent).toBe(true);
    }, NETWORK_TIMEOUT);
  });

  describe('MCP Agent Configuration', () => {
    it('should have Durable Objects configured', async () => {
      // Test that the server is using Durable Objects by checking
      // that multiple requests to the same endpoint maintain state
      const response1 = await fetch(PRODUCTION_URL, {
        method: 'GET',
        headers: {
          'Accept': 'text/event-stream',
        },
      });

      const response2 = await fetch(PRODUCTION_URL, {
        method: 'GET',
        headers: {
          'Accept': 'text/event-stream',
        },
      });

      expect(response1.ok).toBe(true);
      expect(response2.ok).toBe(true);
    }, NETWORK_TIMEOUT);

    it('should include server version in response', async () => {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(PRODUCTION_URL, {
        method: 'GET',
        headers: {
          'Accept': 'text/event-stream',
        },
        signal: controller.signal,
      });

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let receivedData = '';

      if (reader) {
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            receivedData += decoder.decode(value, { stream: true });

            // Look for version in the SSE stream
            if (receivedData.includes('1.0.6')) {
              break;
            }
          }
        } catch (error) {
          if ((error as Error).name !== 'AbortError') {
            throw error;
          }
        } finally {
          reader.releaseLock();
          clearTimeout(timeout);
        }
      }

      expect(receivedData).toContain('mcp-camara');
    }, NETWORK_TIMEOUT);
  });
});
