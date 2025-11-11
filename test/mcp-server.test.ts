/**
 * Tests for CamaraServer MCP server core
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { CamaraServer } from '../lib/core/mcp-server.js';
import type { MCPServerConfig } from '../lib/config/index.js';

describe('CamaraServer', () => {
  let config: MCPServerConfig;

  beforeEach(() => {
    config = {
      name: 'test-mcp-camara',
      version: '1.0.0-test',
      transport: 'stdio',
      httpPort: 3000,
      apiBaseUrl: 'https://dadosabertos.camara.leg.br/api/v2',
      cacheEnabled: true,
      cacheTTL: 3600,
      cacheMaxSize: 104857600,
      rateLimitEnabled: false,
      rateLimitPerMinute: 30,
      rateLimitAuthenticatedPerMinute: 100,
      logLevel: 'ERROR', // Suppress logs during tests
    };
  });

  describe('Initialization', () => {
    it('should create a server instance', () => {
      const server = new CamaraServer(config);
      expect(server).toBeDefined();
    });

    it('should initialize and register all 62 tools', async () => {
      const server = new CamaraServer(config);
      await server.initialize();

      const stats = server.getStats();
      expect(stats.toolCount).toBe(62);
      expect(stats.initialized).toBe(true);
    });

    it('should not re-initialize if already initialized', async () => {
      const server = new CamaraServer(config);
      await server.initialize();
      
      const statsBefore = server.getStats();
      await server.initialize(); // Second call
      const statsAfter = server.getStats();

      expect(statsBefore.toolCount).toBe(statsAfter.toolCount);
      expect(statsAfter.initialized).toBe(true);
    });

    it('should throw error if start is called before initialize', async () => {
      const server = new CamaraServer(config);
      
      await expect(server.start()).rejects.toThrow(
        'Server must be initialized before starting'
      );
    });
  });

  describe('Tool Registration', () => {
    it('should allow registering custom tools', async () => {
      const server = new CamaraServer(config);
      await server.initialize();

      const customTool = {
        name: 'custom_test_tool',
        description: 'A custom test tool',
        inputSchema: { parse: (x: any) => x } as any,
        handler: async () => ({ content: [{ type: 'text' as const, text: 'custom' }] }),
        category: 'deputies' as const,
      };

      server.registerTool(customTool);

      const stats = server.getStats();
      expect(stats.toolCount).toBe(63); // 62 + 1 custom
    });
  });

  describe('Tool Invocation', () => {
    it('should handle unknown tool gracefully', async () => {
      const server = new CamaraServer(config);
      await server.initialize();

      const result = await server.handleToolCall('unknown_tool', {});

      expect(result.isError).toBe(true);
      expect(result.content[0]?.text).toContain('Unknown tool');
    });

    it('should handle validation errors', async () => {
      const server = new CamaraServer(config);
      await server.initialize();

      // Try to call deputado_detalhes without required id parameter
      const result = await server.handleToolCall('deputado_detalhes', {});

      expect(result.isError).toBe(true);
      expect(result.content[0]?.text).toContain('Validation error');
    });

    it('should handle validation errors with invalid types', async () => {
      const server = new CamaraServer(config);
      await server.initialize();

      // Try to call deputado_detalhes with invalid id type
      const result = await server.handleToolCall('deputado_detalhes', { id: 'invalid' });

      expect(result.isError).toBe(true);
      expect(result.content[0]?.text).toContain('Validation error');
    });

    it('should validate date format', async () => {
      const server = new CamaraServer(config);
      await server.initialize();

      // Try to call with invalid date format
      const result = await server.handleToolCall('deputado_despesas', {
        id: 123,
        dataInicio: '2024/01/01', // Wrong format
      });

      expect(result.isError).toBe(true);
      expect(result.content[0]?.text).toContain('Validation error');
    });

    it('should validate UF codes', async () => {
      const server = new CamaraServer(config);
      await server.initialize();

      // Try to call with invalid UF
      const result = await server.handleToolCall('deputados_listar', {
        siglaUf: 'XX', // Invalid UF
      });

      expect(result.isError).toBe(true);
      expect(result.content[0]?.text).toContain('Validation error');
    });
  });

  describe('Server Stats', () => {
    it('should return correct stats', async () => {
      const server = new CamaraServer(config);
      
      let stats = server.getStats();
      expect(stats.initialized).toBe(false);
      expect(stats.toolCount).toBe(0);

      await server.initialize();

      stats = server.getStats();
      expect(stats.initialized).toBe(true);
      expect(stats.toolCount).toBe(62);
      expect(stats.config).toEqual(config);
    });
  });

  describe('Server Instance', () => {
    it('should provide access to underlying MCP server', async () => {
      const server = new CamaraServer(config);
      await server.initialize();

      const mcpServer = server.getServer();
      expect(mcpServer).toBeDefined();
    });
  });

  describe('Cache Integration', () => {
    it('should not cache error results', async () => {
      const server = new CamaraServer({ ...config, cacheEnabled: true });
      await server.initialize();

      // Call with invalid input - should return error
      const result1 = await server.handleToolCall('deputado_detalhes', {});
      expect(result1.isError).toBe(true);

      // Second call - should still validate and return error (not cached)
      const result2 = await server.handleToolCall('deputado_detalhes', {});
      expect(result2.isError).toBe(true);
    });

    it('should handle validation errors before cache check', async () => {
      const server = new CamaraServer({ ...config, cacheEnabled: true });
      await server.initialize();

      // Invalid UF should fail validation before cache check
      const result = await server.handleToolCall('deputados_listar', { siglaUf: 'INVALID' });
      expect(result.isError).toBe(true);
      expect(result.content[0]?.text).toContain('Validation error');
    });

    it('should handle unknown tools before cache check', async () => {
      const server = new CamaraServer({ ...config, cacheEnabled: true });
      await server.initialize();

      // Unknown tool should fail before cache check
      const result = await server.handleToolCall('nonexistent_tool', {});
      expect(result.isError).toBe(true);
      expect(result.content[0]?.text).toContain('Unknown tool');
    });
  });
});
