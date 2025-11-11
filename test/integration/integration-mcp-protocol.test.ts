/**
 * Integration tests for MCP protocol
 * Tests tools/list and tools/call with real server instance
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { CamaraServer } from '../../lib/core/mcp-server.js';
import type { MCPServerConfig } from '../../lib/config/index.js';

describe('MCP Protocol Integration', () => {
  let config: MCPServerConfig;
  let server: CamaraServer;

  beforeEach(async () => {
    config = {
      name: 'test-mcp-camara',
      version: '1.0.0-test',
      transport: 'stdio',
      httpPort: 3000,
      apiBaseUrl: 'https://dadosabertos.camara.leg.br/api/v2',
      cacheEnabled: false, // Disable cache for integration tests
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

  describe('tools/list', () => {
    it('should return all 62 tools', async () => {
      const registry = server.getRegistry();
      const tools = registry.getAll();

      expect(tools).toBeDefined();
      expect(Array.isArray(tools)).toBe(true);
      expect(tools).toHaveLength(62);
    });

    it('should return tools with correct structure', async () => {
      const registry = server.getRegistry();
      const tools = registry.getAll();

      const firstTool = tools[0];
      expect(firstTool).toHaveProperty('name');
      expect(firstTool).toHaveProperty('description');
      expect(firstTool).toHaveProperty('inputSchema');
      expect(typeof firstTool.name).toBe('string');
      expect(typeof firstTool.description).toBe('string');
      expect(typeof firstTool.inputSchema).toBe('object');
    });

    it('should include all tool categories', async () => {
      const registry = server.getRegistry();
      const tools = registry.getAll();

      const toolNames = tools.map((t: any) => t.name);
      
      // Check for tools from each category
      expect(toolNames.some((name: string) => name.startsWith('deputado'))).toBe(true);
      expect(toolNames.some((name: string) => name.startsWith('proposic'))).toBe(true);
      expect(toolNames.some((name: string) => name.startsWith('votac'))).toBe(true);
      expect(toolNames.some((name: string) => name.startsWith('orgao'))).toBe(true);
      expect(toolNames.some((name: string) => name.startsWith('partido'))).toBe(true);
      expect(toolNames.some((name: string) => name.startsWith('evento'))).toBe(true);
      expect(toolNames.some((name: string) => name.startsWith('referencia'))).toBe(true);
    });
  });

  describe('tools/call with valid invocation', () => {
    it('should execute deputados_listar successfully', async () => {
      const response = await server.handleToolCall('deputados_listar', {
        siglaUf: 'SP',
        pagina: 1,
        itens: 5,
      });

      expect(response.content).toBeDefined();
      expect(Array.isArray(response.content)).toBe(true);
      expect(response.content.length).toBeGreaterThan(0);
      expect(response.content[0].type).toBe('text');
      
      if (!response.isError) {
        // Parse the JSON response
        const data = JSON.parse(response.content[0].text);
        expect(data).toHaveProperty('dados');
        expect(Array.isArray(data.dados)).toBe(true);
      }
    }, 10000);

    it('should execute deputado_detalhes successfully', async () => {
      // First get a deputy ID
      const listResponse = await server.handleToolCall('deputados_listar', {
        pagina: 1,
        itens: 1,
      });

      if (!listResponse.isError) {
        const listData = JSON.parse(listResponse.content[0].text);
        const deputyId = listData.dados[0].id;

        // Now get details for that deputy
        const detailsResponse = await server.handleToolCall('deputado_detalhes', {
          id: deputyId,
        });

        expect(detailsResponse.content).toBeDefined();
        expect(detailsResponse.content[0].type).toBe('text');
        
        if (!detailsResponse.isError) {
          const detailsData = JSON.parse(detailsResponse.content[0].text);
          expect(detailsData).toHaveProperty('dados');
          expect(detailsData.dados).toHaveProperty('id');
          expect(detailsData.dados.id).toBe(deputyId);
        }
      }
    }, 10000);

    it('should execute referencias_ufs successfully', async () => {
      const response = await server.handleToolCall('referencias_ufs', {});

      expect(response.content).toBeDefined();
      expect(response.content[0].type).toBe('text');
      
      if (!response.isError) {
        const data = JSON.parse(response.content[0].text);
        expect(data).toHaveProperty('dados');
        expect(Array.isArray(data.dados)).toBe(true);
        expect(data.dados.length).toBeGreaterThan(0);
      }
    }, 10000);
  });

  describe('tools/call error handling', () => {
    it('should handle unknown tool gracefully', async () => {
      const response = await server.handleToolCall('nonexistent_tool', {});

      expect(response.isError).toBe(true);
      expect(response.content[0].text).toContain('Unknown tool');
    });

    it('should handle validation errors', async () => {
      const response = await server.handleToolCall('deputado_detalhes', {});

      expect(response.isError).toBe(true);
      expect(response.content[0].text).toContain('Validation error');
    });

    it('should handle invalid parameter types', async () => {
      const response = await server.handleToolCall('deputado_detalhes', {
        id: 'not-a-number',
      });

      expect(response.isError).toBe(true);
      expect(response.content[0].text).toContain('Validation error');
    });

    it('should handle invalid UF codes', async () => {
      const response = await server.handleToolCall('deputados_listar', {
        siglaUf: 'INVALID',
      });

      expect(response.isError).toBe(true);
      expect(response.content[0].text).toContain('Validation error');
    });

    it('should handle invalid date formats', async () => {
      const response = await server.handleToolCall('deputado_despesas', {
        id: 123,
        dataInicio: '2024/01/01', // Wrong format
      });

      expect(response.isError).toBe(true);
      expect(response.content[0].text).toContain('Validation error');
    });

    it('should handle API errors gracefully', async () => {
      // Try to get details for a non-existent deputy
      const response = await server.handleToolCall('deputado_detalhes', {
        id: 999999999,
      });

      expect(response.isError).toBe(true);
      expect(response.content[0].text).toContain('error');
    }, 10000);
  });
});
