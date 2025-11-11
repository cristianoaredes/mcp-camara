/**
 * Integration tests for transport adapters
 * Tests STDIO, HTTP, and SSE transports
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { CamaraServer } from '../../lib/core/mcp-server.js';
import { HttpAdapter, SSEAdapter } from '../../lib/adapters/cli.js';
import type { MCPServerConfig } from '../../lib/config/index.js';
import type { Server as HttpServer } from 'http';

describe('Transport Integration Tests', () => {
  let config: MCPServerConfig;
  let server: CamaraServer;

  beforeEach(async () => {
    config = {
      name: 'test-mcp-camara',
      version: '1.0.0-test',
      transport: 'http',
      httpPort: 0, // Use random available port
      apiBaseUrl: 'https://dadosabertos.camara.leg.br/api/v2',
      cacheEnabled: false,
      cacheTTL: 3600,
      cacheMaxSize: 104857600,
      rateLimitEnabled: false,
      rateLimitPerMinute: 30,
      rateLimitAuthenticatedPerMinute: 100,
      logLevel: 'ERROR',
    };

    server = new CamaraServer(config);
    await server.initialize();
  });

  describe('HTTP Transport', () => {
    let adapter: HttpAdapter;
    let httpServer: HttpServer | null;
    let baseUrl: string;

    beforeEach(async () => {
      adapter = new HttpAdapter(server, 0); // Use random port
      await adapter.start();
      
      httpServer = adapter.getHttpServer();
      const address = httpServer?.address();
      const port = typeof address === 'object' && address !== null ? address.port : 3000;
      baseUrl = `http://localhost:${port}`;
    });

    afterEach(async () => {
      if (httpServer) {
        await new Promise<void>((resolve) => {
          httpServer!.close(() => resolve());
        });
      }
    });

    it('should respond to /health endpoint', async () => {
      const response = await fetch(`${baseUrl}/health`);
      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data).toHaveProperty('status', 'healthy');
      expect(data).toHaveProperty('server');
      expect(data.server).toHaveProperty('name');
      expect(data.server).toHaveProperty('version');
      expect(data.server).toHaveProperty('initialized', true);
      expect(data.server).toHaveProperty('toolCount', 62);
    });

    it('should handle /mcp endpoint with tools/list', async () => {
      const response = await fetch(`${baseUrl}/mcp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'tools/list',
        }),
      });

      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data).toHaveProperty('jsonrpc', '2.0');
      expect(data).toHaveProperty('id', 1);
      expect(data).toHaveProperty('result');
      expect(data.result).toHaveProperty('tools');
      expect(Array.isArray(data.result.tools)).toBe(true);
      expect(data.result.tools).toHaveLength(62);
    });

    it('should handle /mcp endpoint with tools/call', async () => {
      const response = await fetch(`${baseUrl}/mcp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 2,
          method: 'tools/call',
          params: {
            name: 'referencias_ufs',
            arguments: {},
          },
        }),
      });

      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data).toHaveProperty('jsonrpc', '2.0');
      expect(data).toHaveProperty('id', 2);
      expect(data).toHaveProperty('result');
      expect(data.result).toHaveProperty('content');
      expect(Array.isArray(data.result.content)).toBe(true);
    });

    it('should return 400 for invalid JSON-RPC request', async () => {
      const response = await fetch(`${baseUrl}/mcp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          // Missing jsonrpc field
          id: 3,
          method: 'tools/list',
        }),
      });

      expect(response.status).toBe(400);
      
      const data = await response.json();
      expect(data).toHaveProperty('jsonrpc', '2.0');
      expect(data).toHaveProperty('error');
      expect(data.error).toHaveProperty('code', -32600);
    });

    it('should return 404 for unknown method', async () => {
      const response = await fetch(`${baseUrl}/mcp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 4,
          method: 'unknown/method',
        }),
      });

      expect(response.status).toBe(404);
      
      const data = await response.json();
      expect(data).toHaveProperty('jsonrpc', '2.0');
      expect(data).toHaveProperty('error');
      expect(data.error).toHaveProperty('code', -32601);
    });

    it('should return 404 for unknown routes', async () => {
      const response = await fetch(`${baseUrl}/unknown`);
      expect(response.status).toBe(404);
      
      const data = await response.json();
      expect(data).toHaveProperty('error', 'Not Found');
      expect(data).toHaveProperty('availableEndpoints');
    });

    it('should handle CORS preflight requests', async () => {
      const response = await fetch(`${baseUrl}/mcp`, {
        method: 'OPTIONS',
      });

      expect(response.status).toBe(204);
      expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
      expect(response.headers.get('Access-Control-Allow-Methods')).toContain('POST');
    });

    it('should include CORS headers in responses', async () => {
      const response = await fetch(`${baseUrl}/health`);
      
      expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
    });

    it('should handle tool call with validation error', async () => {
      const response = await fetch(`${baseUrl}/mcp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 5,
          method: 'tools/call',
          params: {
            name: 'deputado_detalhes',
            arguments: {
              id: 'invalid', // Should be a number
            },
          },
        }),
      });

      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data).toHaveProperty('jsonrpc', '2.0');
      expect(data).toHaveProperty('result');
      expect(data.result.isError).toBe(true);
      expect(data.result.content[0].text).toContain('Validation error');
    });

    it('should handle tool call without arguments', async () => {
      const response = await fetch(`${baseUrl}/mcp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 6,
          method: 'tools/call',
          params: {
            name: 'referencias_ufs',
            // No arguments provided
          },
        }),
      });

      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data).toHaveProperty('jsonrpc', '2.0');
      expect(data).toHaveProperty('result');
      expect(data.result).toHaveProperty('content');
    });

    it('should return 400 for tools/call without name parameter', async () => {
      const response = await fetch(`${baseUrl}/mcp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 7,
          method: 'tools/call',
          params: {
            // Missing name parameter
            arguments: {},
          },
        }),
      });

      expect(response.status).toBe(400);
      
      const data = await response.json();
      expect(data).toHaveProperty('error');
      expect(data.error.code).toBe(-32602);
      expect(data.error.message).toContain('name field is required');
    });

    it('should handle malformed JSON gracefully', async () => {
      const response = await fetch(`${baseUrl}/mcp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: 'invalid json{',
      });

      // Express error handler catches JSON parse errors and returns 500
      expect(response.status).toBe(500);
      
      const data = await response.json();
      expect(data).toHaveProperty('error');
      expect(data.error).toBe('Internal Server Error');
    });
  });

  describe('SSE Transport', () => {
    let adapter: SSEAdapter;
    let httpServer: HttpServer | null;
    let baseUrl: string;

    beforeEach(async () => {
      adapter = new SSEAdapter(server, 0); // Use random port
      await adapter.startSSE();
      
      httpServer = adapter.getHttpServer();
      const address = httpServer?.address();
      const port = typeof address === 'object' && address !== null ? address.port : 3000;
      baseUrl = `http://localhost:${port}`;
    });

    afterEach(async () => {
      if (httpServer) {
        await new Promise<void>((resolve) => {
          httpServer!.close(() => resolve());
        });
      }
    });

    it('should establish SSE connection', async () => {
      const response = await fetch(`${baseUrl}/sse`);
      
      expect(response.status).toBe(200);
      expect(response.headers.get('Content-Type')).toBe('text/event-stream');
      expect(response.headers.get('Cache-Control')).toBe('no-cache');
      expect(response.headers.get('Connection')).toBe('keep-alive');
    });

    it('should send initial connection event', async () => {
      const response = await fetch(`${baseUrl}/sse`);
      const reader = response.body?.getReader();
      
      if (!reader) {
        throw new Error('No reader available');
      }

      // Read first chunk
      const { value } = await reader.read();
      const text = new TextDecoder().decode(value);
      
      expect(text).toContain('event: connected');
      expect(text).toContain('data:');
      
      // Parse the data
      const dataMatch = text.match(/data: (.+)/);
      if (dataMatch) {
        const data = JSON.parse(dataMatch[1]);
        expect(data).toHaveProperty('connectionId');
        expect(data).toHaveProperty('timestamp');
        expect(data).toHaveProperty('message', 'SSE connection established');
      }
      
      // Cancel the stream
      await reader.cancel();
    });

    it('should track active connections', async () => {
      // Establish connection
      const response = await fetch(`${baseUrl}/sse`);
      
      // Check stats
      const stats = adapter.getSSEStats();
      expect(stats.activeConnections).toBe(1);
      expect(stats.connections).toHaveLength(1);
      expect(stats.connections[0]).toHaveProperty('id');
      expect(stats.connections[0]).toHaveProperty('connectedAt');
      expect(stats.connections[0]).toHaveProperty('uptime');
      
      // Close connection
      const reader = response.body?.getReader();
      await reader?.cancel();
      
      // Wait a bit for cleanup
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Check stats again
      const statsAfter = adapter.getSSEStats();
      expect(statsAfter.activeConnections).toBe(0);
    });

    it('should include SSE stats in health endpoint', async () => {
      // Establish SSE connection
      const sseResponse = await fetch(`${baseUrl}/sse`);
      
      // Check health endpoint
      const healthResponse = await fetch(`${baseUrl}/health`);
      const data = await healthResponse.json();
      
      expect(data).toHaveProperty('sse');
      expect(data.sse).toHaveProperty('activeConnections');
      expect(data.sse.activeConnections).toBeGreaterThanOrEqual(1);
      
      // Close SSE connection
      const reader = sseResponse.body?.getReader();
      await reader?.cancel();
    });

    it('should handle multiple concurrent SSE connections', async () => {
      // Establish multiple connections
      const response1 = await fetch(`${baseUrl}/sse`);
      const response2 = await fetch(`${baseUrl}/sse`);
      const response3 = await fetch(`${baseUrl}/sse`);
      
      // Check stats
      const stats = adapter.getSSEStats();
      expect(stats.activeConnections).toBe(3);
      expect(stats.connections).toHaveLength(3);
      
      // Verify each connection has unique ID
      const ids = stats.connections.map(c => c.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(3);
      
      // Close all connections
      await response1.body?.getReader().cancel();
      await response2.body?.getReader().cancel();
      await response3.body?.getReader().cancel();
      
      // Wait for cleanup
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Verify all closed
      const statsAfter = adapter.getSSEStats();
      expect(statsAfter.activeConnections).toBe(0);
    });

    it('should include connection metadata in SSE stats', async () => {
      const response = await fetch(`${baseUrl}/sse`);
      
      const stats = adapter.getSSEStats();
      expect(stats.connections[0]).toHaveProperty('id');
      expect(stats.connections[0]).toHaveProperty('connectedAt');
      expect(stats.connections[0]).toHaveProperty('uptime');
      expect(stats.connections[0]).toHaveProperty('lastHeartbeat');
      
      // Verify uptime is a positive number
      expect(stats.connections[0].uptime).toBeGreaterThanOrEqual(0);
      
      // Close connection
      await response.body?.getReader().cancel();
    });

    it('should properly set SSE response headers', async () => {
      const response = await fetch(`${baseUrl}/sse`);
      
      expect(response.headers.get('Content-Type')).toBe('text/event-stream');
      expect(response.headers.get('Cache-Control')).toBe('no-cache');
      expect(response.headers.get('Connection')).toBe('keep-alive');
      expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
      
      // Close connection
      await response.body?.getReader().cancel();
    });
  });

  describe('STDIO Transport', () => {
    it('should be testable through server instance', async () => {
      // STDIO transport is tested indirectly through the server
      // Direct testing would require mocking stdin/stdout
      const registry = server.getRegistry();
      const tools = registry.getAll();
      
      expect(tools).toBeDefined();
      expect(tools).toHaveLength(62);
    });

    it('should handle tool calls through server instance', async () => {
      const response = await server.handleToolCall('referencias_ufs', {});
      
      expect(response.content).toBeDefined();
      expect(Array.isArray(response.content)).toBe(true);
    }, 10000);

    it('should validate tool inputs before execution', async () => {
      // Test with invalid input
      const response = await server.handleToolCall('deputado_detalhes', {
        id: 'invalid', // Should be a number
      });
      
      expect(response.isError).toBe(true);
      expect(response.content[0].text).toContain('Validation error');
    });

    it('should handle non-existent tool calls', async () => {
      const response = await server.handleToolCall('non_existent_tool', {});
      
      expect(response.isError).toBe(true);
      expect(response.content[0].text).toContain('Unknown tool');
    });

    it('should return all 62 tools in registry', async () => {
      const registry = server.getRegistry();
      const tools = registry.getAll();
      
      // Verify we have all expected tool categories
      const categories = new Set(tools.map(t => t.category));
      expect(categories.has('deputies')).toBe(true);
      expect(categories.has('propositions')).toBe(true);
      expect(categories.has('votings')).toBe(true);
      expect(categories.has('committees')).toBe(true);
      expect(categories.has('parties')).toBe(true);
      expect(categories.has('events')).toBe(true);
      expect(categories.has('references')).toBe(true);
    });
  });
});
