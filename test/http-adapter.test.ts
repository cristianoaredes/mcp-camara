/**
 * HTTP Adapter Tests
 * Tests for the HTTP transport adapter
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { CamaraServer } from '../lib/core/mcp-server.js';
import { HttpAdapter } from '../lib/adapters/cli.js';
import type { MCPServerConfig } from '../lib/config/index.js';

describe('HttpAdapter', () => {
  let server: CamaraServer;
  let adapter: HttpAdapter;
  const testPort = 3456; // Use a different port to avoid conflicts

  const testConfig: MCPServerConfig = {
    name: 'mcp-camara-test',
    version: '1.0.0',
    transport: 'http',
    httpPort: testPort,
    apiBaseUrl: 'https://dadosabertos.camara.leg.br/api/v2',
    cacheEnabled: false,
    cacheTTL: 3600,
    cacheMaxSize: 104857600,
    rateLimitEnabled: false,
    rateLimitPerMinute: 30,
    rateLimitAuthenticatedPerMinute: 100,
    logLevel: 'ERROR', // Reduce noise in tests
  };

  beforeAll(async () => {
    server = new CamaraServer(testConfig);
    await server.initialize();
    adapter = new HttpAdapter(server, testPort);
    await adapter.start();
  });

  afterAll(async () => {
    const httpServer = adapter.getHttpServer();
    if (httpServer) {
      await new Promise<void>((resolve) => {
        httpServer.close(() => resolve());
      });
    }
  });

  it('should respond to health check endpoint', async () => {
    const response = await fetch(`http://localhost:${testPort}/health`);
    expect(response.status).toBe(200);
    
    const data = await response.json();
    expect(data).toHaveProperty('status', 'healthy');
    expect(data).toHaveProperty('server');
    expect(data.server).toHaveProperty('name', 'mcp-camara-test');
    expect(data.server).toHaveProperty('initialized', true);
  });

  it('should handle CORS preflight requests', async () => {
    const response = await fetch(`http://localhost:${testPort}/mcp`, {
      method: 'OPTIONS',
    });
    
    expect(response.status).toBe(204);
    expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
    expect(response.headers.get('Access-Control-Allow-Methods')).toContain('POST');
  });

  it('should reject invalid JSON-RPC requests', async () => {
    const response = await fetch(`http://localhost:${testPort}/mcp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ invalid: 'request' }),
    });
    
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data).toHaveProperty('error');
    expect(data.error.code).toBe(-32600);
  });

  it('should handle tools/list request', async () => {
    const response = await fetch(`http://localhost:${testPort}/mcp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'tools/list',
        params: {},
      }),
    });
    
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data).toHaveProperty('jsonrpc', '2.0');
    expect(data).toHaveProperty('result');
    expect(data.result).toHaveProperty('tools');
    expect(Array.isArray(data.result.tools)).toBe(true);
    expect(data.result.tools.length).toBeGreaterThan(0);
  });

  it('should return 404 for unknown routes', async () => {
    const response = await fetch(`http://localhost:${testPort}/unknown`);
    expect(response.status).toBe(404);
    
    const data = await response.json();
    expect(data).toHaveProperty('error', 'Not Found');
  });

  it('should include CORS headers in responses', async () => {
    const response = await fetch(`http://localhost:${testPort}/health`);
    expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
  });

  it('should establish SSE connection', async () => {
    const response = await fetch(`http://localhost:${testPort}/sse`);
    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toBe('text/event-stream');
    expect(response.headers.get('Cache-Control')).toBe('no-cache');
    expect(response.headers.get('Connection')).toBe('keep-alive');
  });

  it('should include SSE stats in health check', async () => {
    const response = await fetch(`http://localhost:${testPort}/health`);
    expect(response.status).toBe(200);
    
    const data = await response.json();
    expect(data).toHaveProperty('sse');
    expect(data.sse).toHaveProperty('activeConnections');
    expect(data.sse).toHaveProperty('heartbeatActive');
    expect(typeof data.sse.activeConnections).toBe('number');
    expect(typeof data.sse.heartbeatActive).toBe('boolean');
  });
});
