/**
 * Tests for CamaraHttpClient error handling and retry logic
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { CamaraHttpClient } from '../../lib/core/http-client.js';
import { CamaraAPIError, RateLimitError } from '../../lib/shared/utils/errors.js';

describe('CamaraHttpClient', () => {
  let client: CamaraHttpClient;
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    // Mock global fetch
    fetchMock = vi.fn();
    global.fetch = fetchMock;

    client = new CamaraHttpClient({
      baseURL: 'https://api.test',
      timeout: 1000,
      retryAttempts: 3,
      retryDelay: 100,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('buildURL', () => {
    it('should build URL with query parameters', () => {
      const url = client.buildURL('/deputados', { nome: 'João', siglaUf: 'SP' });
      expect(url).toBe('https://api.test/deputados?nome=Jo%C3%A3o&siglaUf=SP');
    });

    it('should handle undefined and null parameters', () => {
      const url = client.buildURL('/deputados', { nome: 'Test', empty: undefined, nullVal: null });
      expect(url).toBe('https://api.test/deputados?nome=Test');
    });

    it('should build URL without parameters', () => {
      const url = client.buildURL('/deputados');
      expect(url).toBe('https://api.test/deputados');
    });

    it('should properly encode special characters in parameters', () => {
      const url = client.buildURL('/deputados', { 
        nome: 'José & Maria',
        keywords: 'saúde+educação'
      });
      expect(url).toContain('Jos%C3%A9');
      expect(url).toContain('%26');
      expect(url).toContain('%2B');
    });

    it('should handle numeric parameters', () => {
      const url = client.buildURL('/deputados', { 
        id: 123,
        pagina: 1,
        itens: 50
      });
      expect(url).toContain('id=123');
      expect(url).toContain('pagina=1');
      expect(url).toContain('itens=50');
    });

    it('should handle boolean parameters', () => {
      const url = client.buildURL('/proposicoes', { 
        tramitacaoSenado: true
      });
      expect(url).toContain('tramitacaoSenado=true');
    });

    it('should handle empty string parameters', () => {
      const url = client.buildURL('/deputados', { nome: '' });
      expect(url).toContain('nome=');
    });
  });

  describe('4xx client errors', () => {
    it('should handle 400 Bad Request with descriptive message', async () => {
      fetchMock.mockResolvedValue({
        ok: false,
        status: 400,
        headers: new Map(),
        json: async () => ({ error: 'Invalid parameter' }),
      });

      await expect(client.get('/deputados')).rejects.toThrow(CamaraAPIError);
      await expect(client.get('/deputados')).rejects.toThrow('Invalid parameter');
    });

    it('should handle 400 with default message when no error in response', async () => {
      fetchMock.mockResolvedValue({
        ok: false,
        status: 400,
        headers: new Map(),
        json: async () => ({}),
      });

      await expect(client.get('/deputados')).rejects.toThrow('Bad Request');
    });

    it('should handle 401 Unauthorized', async () => {
      fetchMock.mockResolvedValue({
        ok: false,
        status: 401,
        headers: new Map(),
        json: async () => ({}),
      });

      await expect(client.get('/deputados')).rejects.toThrow('Unauthorized');
    });

    it('should handle 403 Forbidden', async () => {
      fetchMock.mockResolvedValue({
        ok: false,
        status: 403,
        headers: new Map(),
        json: async () => ({}),
      });

      await expect(client.get('/deputados')).rejects.toThrow('Forbidden');
    });

    it('should handle 404 Not Found with descriptive message', async () => {
      fetchMock.mockResolvedValue({
        ok: false,
        status: 404,
        headers: new Map(),
        json: async () => ({}),
      });

      await expect(client.get('/deputados/999999')).rejects.toThrow(CamaraAPIError);
      await expect(client.get('/deputados/999999')).rejects.toThrow('Not Found');
    });

    it('should handle 422 Unprocessable Entity', async () => {
      fetchMock.mockResolvedValue({
        ok: false,
        status: 422,
        headers: new Map(),
        json: async () => ({ error: 'Validation failed', details: 'Invalid date format' }),
      });

      await expect(client.get('/deputados')).rejects.toThrow('Validation failed');
      await expect(client.get('/deputados')).rejects.toThrow('Invalid date format');
    });

    it('should include error details when provided', async () => {
      fetchMock.mockResolvedValue({
        ok: false,
        status: 400,
        headers: new Map(),
        json: async () => ({ 
          error: 'Invalid request',
          details: 'The parameter "siglaUf" must be a valid state code'
        }),
      });

      try {
        await client.get('/deputados');
      } catch (error) {
        expect(error).toBeInstanceOf(CamaraAPIError);
        if (error instanceof CamaraAPIError) {
          expect(error.message).toContain('Invalid request');
          expect(error.message).toContain('siglaUf');
        }
      }
    });

    it('should not retry on 4xx errors', async () => {
      fetchMock.mockResolvedValue({
        ok: false,
        status: 404,
        headers: new Map(),
        json: async () => ({}),
      });

      await expect(client.get('/deputados/999999')).rejects.toThrow(CamaraAPIError);
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it('should preserve endpoint information in error', async () => {
      fetchMock.mockResolvedValue({
        ok: false,
        status: 404,
        headers: new Map(),
        json: async () => ({}),
      });

      try {
        await client.get('/deputados/123');
      } catch (error) {
        expect(error).toBeInstanceOf(CamaraAPIError);
        if (error instanceof CamaraAPIError) {
          expect(error.endpoint).toBe('/deputados/123');
        }
      }
    });
  });

  describe('5xx server errors', () => {
    it('should handle 500 Internal Server Error with unavailability message', async () => {
      fetchMock.mockResolvedValue({
        ok: false,
        status: 500,
        headers: new Map(),
        json: async () => ({}),
      });

      await expect(client.get('/deputados')).rejects.toThrow(CamaraAPIError);
      await expect(client.get('/deputados')).rejects.toThrow('experiencing technical difficulties');
    });

    it('should handle 502 Bad Gateway', async () => {
      fetchMock.mockResolvedValue({
        ok: false,
        status: 502,
        headers: new Map(),
        json: async () => ({}),
      });

      await expect(client.get('/deputados')).rejects.toThrow('Bad Gateway');
    });

    it('should handle 503 Service Unavailable with descriptive message', async () => {
      fetchMock.mockResolvedValue({
        ok: false,
        status: 503,
        headers: new Map(),
        json: async () => ({}),
      });

      await expect(client.get('/deputados')).rejects.toThrow(CamaraAPIError);
      await expect(client.get('/deputados')).rejects.toThrow('temporarily unavailable');
    });

    it('should handle 504 Gateway Timeout', async () => {
      fetchMock.mockResolvedValue({
        ok: false,
        status: 504,
        headers: new Map(),
        json: async () => ({}),
      });

      await expect(client.get('/deputados')).rejects.toThrow('Gateway Timeout');
    });

    it('should include "try again later" message for 5xx errors', async () => {
      fetchMock.mockResolvedValue({
        ok: false,
        status: 500,
        headers: new Map(),
        json: async () => ({}),
      });

      try {
        await client.get('/deputados');
      } catch (error) {
        expect(error).toBeInstanceOf(CamaraAPIError);
        if (error instanceof CamaraAPIError) {
          expect(error.message).toContain('try again later');
        }
      }
    });

    it('should retry on 5xx errors with exponential backoff', async () => {
      fetchMock
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
          headers: new Map(),
          json: async () => ({}),
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
          headers: new Map(),
          json: async () => ({}),
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          headers: new Map(),
          json: async () => ({ dados: [] }),
        });

      const result = await client.get('/deputados');
      expect(result.data).toEqual({ dados: [] });
      expect(fetchMock).toHaveBeenCalledTimes(3);
    });

    it('should eventually fail after retrying 5xx errors', async () => {
      fetchMock.mockResolvedValue({
        ok: false,
        status: 503,
        headers: new Map(),
        json: async () => ({}),
      });

      await expect(client.get('/deputados')).rejects.toThrow(CamaraAPIError);
      expect(fetchMock).toHaveBeenCalledTimes(3);
    });
  });

  describe('429 rate limit errors', () => {
    it('should handle 429 with retry-after information', async () => {
      const headers = new Map();
      headers.set('Retry-After', '60');

      fetchMock.mockResolvedValue({
        ok: false,
        status: 429,
        headers,
        json: async () => ({ error: 'Rate limit exceeded' }),
      });

      await expect(client.get('/deputados')).rejects.toThrow(RateLimitError);
      
      try {
        await client.get('/deputados');
      } catch (error) {
        expect(error).toBeInstanceOf(RateLimitError);
        if (error instanceof RateLimitError) {
          expect(error.retryAfter).toBe(60);
          expect(error.message).toContain('60 seconds');
        }
      }
    });

    it('should not retry on 429 rate limit errors', async () => {
      const headers = new Map();
      headers.set('Retry-After', '30');

      fetchMock.mockResolvedValue({
        ok: false,
        status: 429,
        headers,
        json: async () => ({}),
      });

      await expect(client.get('/deputados')).rejects.toThrow(RateLimitError);
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });
  });

  describe('network errors', () => {
    it('should handle timeout errors', async () => {
      fetchMock.mockImplementation(() => {
        return new Promise((_, reject) => {
          const error = new Error('The operation was aborted');
          error.name = 'AbortError';
          setTimeout(() => reject(error), 50);
        });
      });

      await expect(client.get('/deputados')).rejects.toThrow(CamaraAPIError);
      await expect(client.get('/deputados')).rejects.toThrow('timeout');
    });

    it('should handle timeout with correct status code', async () => {
      fetchMock.mockImplementation(() => {
        return new Promise((_, reject) => {
          const error = new Error('The operation was aborted');
          error.name = 'AbortError';
          setTimeout(() => reject(error), 50);
        });
      });

      try {
        await client.get('/deputados');
      } catch (error) {
        expect(error).toBeInstanceOf(CamaraAPIError);
        if (error instanceof CamaraAPIError) {
          expect(error.statusCode).toBe(408);
          expect(error.message).toContain('1 seconds');
        }
      }
    });

    it('should not retry on timeout errors', async () => {
      let callCount = 0;
      fetchMock.mockImplementation(() => {
        callCount++;
        return new Promise((_, reject) => {
          const error = new Error('The operation was aborted');
          error.name = 'AbortError';
          setTimeout(() => reject(error), 50);
        });
      });

      await expect(client.get('/deputados')).rejects.toThrow(CamaraAPIError);
      // Timeout errors have 408 status code (4xx), so they are not retried
      expect(callCount).toBe(1);
    });

    it('should handle network connectivity errors', async () => {
      fetchMock.mockRejectedValue(new Error('fetch failed'));

      await expect(client.get('/deputados')).rejects.toThrow(CamaraAPIError);
      await expect(client.get('/deputados')).rejects.toThrow('Unable to connect');
    });

    it('should handle ECONNREFUSED errors', async () => {
      fetchMock.mockRejectedValue(new Error('connect ECONNREFUSED 127.0.0.1:80'));

      await expect(client.get('/deputados')).rejects.toThrow(CamaraAPIError);
      await expect(client.get('/deputados')).rejects.toThrow('Unable to connect');
    });

    it('should handle DNS resolution errors', async () => {
      fetchMock.mockRejectedValue(new Error('getaddrinfo ENOTFOUND api.example.com'));

      await expect(client.get('/deputados')).rejects.toThrow(CamaraAPIError);
      // ENOTFOUND is caught by the earlier network connectivity check
      await expect(client.get('/deputados')).rejects.toThrow('Unable to connect');
    });

    it('should retry on network failures with exponential backoff', async () => {
      fetchMock
        .mockRejectedValueOnce(new Error('fetch failed'))
        .mockRejectedValueOnce(new Error('fetch failed'))
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          headers: new Map(),
          json: async () => ({ dados: [] }),
        });

      const result = await client.get('/deputados');
      expect(result.data).toEqual({ dados: [] });
      expect(fetchMock).toHaveBeenCalledTimes(3);
    });

    it('should use exponential backoff delays', async () => {
      const delays: number[] = [];
      const startTime = Date.now();
      
      fetchMock
        .mockRejectedValueOnce(new Error('fetch failed'))
        .mockImplementationOnce(() => {
          delays.push(Date.now() - startTime);
          return Promise.reject(new Error('fetch failed'));
        })
        .mockImplementationOnce(() => {
          delays.push(Date.now() - startTime);
          return Promise.reject(new Error('fetch failed'));
        });

      await expect(client.get('/deputados')).rejects.toThrow(CamaraAPIError);
      
      // Verify exponential backoff: second delay should be ~2x first delay
      // Allow some tolerance for timing variations
      expect(delays[1]).toBeGreaterThan(delays[0] * 1.5);
    });

    it('should fail after max retry attempts', async () => {
      fetchMock.mockRejectedValue(new Error('fetch failed'));

      await expect(client.get('/deputados')).rejects.toThrow(CamaraAPIError);
      expect(fetchMock).toHaveBeenCalledTimes(3); // Initial + 2 retries
    });
  });

  describe('successful requests', () => {
    it('should make successful GET request', async () => {
      const mockData = { dados: [{ id: 1, nome: 'Test' }] };
      
      fetchMock.mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Map([['content-type', 'application/json']]),
        json: async () => mockData,
      });

      const result = await client.get('/deputados');
      
      expect(result.data).toEqual(mockData);
      expect(result.status).toBe(200);
      expect(fetchMock).toHaveBeenCalledWith(
        'https://api.test/deputados',
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'User-Agent': expect.any(String),
            'Accept': 'application/json',
          }),
        })
      );
    });

    it('should include proper request headers', async () => {
      fetchMock.mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Map(),
        json: async () => ({ dados: [] }),
      });

      await client.get('/deputados');

      expect(fetchMock).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'User-Agent': 'mcp-camara/1.0.0',
            'Accept': 'application/json',
            'Accept-Encoding': 'gzip, deflate',
          }),
        })
      );
    });

    it('should return response headers', async () => {
      const mockHeaders = new Map([
        ['content-type', 'application/json'],
        ['x-rate-limit-remaining', '100'],
      ]);

      fetchMock.mockResolvedValue({
        ok: true,
        status: 200,
        headers: mockHeaders,
        json: async () => ({ dados: [] }),
      });

      const result = await client.get('/deputados');
      
      expect(result.headers).toHaveProperty('content-type', 'application/json');
      expect(result.headers).toHaveProperty('x-rate-limit-remaining', '100');
    });

    it('should make request with query parameters', async () => {
      fetchMock.mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Map(),
        json: async () => ({ dados: [] }),
      });

      await client.get('/deputados', { nome: 'João', siglaUf: 'SP' });

      expect(fetchMock).toHaveBeenCalledWith(
        'https://api.test/deputados?nome=Jo%C3%A3o&siglaUf=SP',
        expect.any(Object)
      );
    });
  });
});
