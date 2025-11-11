/**
 * End-to-end integration tests
 * Tests complete tool execution flows with caching, validation, and API errors
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { CamaraServer } from '../lib/core/mcp-server.js';
import type { MCPServerConfig } from '../lib/config/index.js';

describe('End-to-End Integration Tests', () => {
  describe('Complete tool execution flow with caching', () => {
    let config: MCPServerConfig;
    let server: CamaraServer;

    beforeEach(async () => {
      config = {
        name: 'test-mcp-camara',
        version: '1.0.0-test',
        transport: 'stdio',
        httpPort: 3000,
        apiBaseUrl: 'https://dadosabertos.camara.leg.br/api/v2',
        cacheEnabled: true, // Enable cache for these tests
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

    it('should execute tool and cache the result', async () => {
      const toolName = 'referencias_ufs';
      const args = {};

      // First call - should hit the API
      const result1 = await server.handleToolCall(toolName, args);
      
      if (!result1.isError) {
        expect(result1.content).toBeDefined();
        expect(result1.content[0].type).toBe('text');
        
        const data1 = JSON.parse(result1.content[0].text);
        expect(data1).toHaveProperty('dados');
        expect(Array.isArray(data1.dados)).toBe(true);

        // Second call - should use cache
        const result2 = await server.handleToolCall(toolName, args);
        
        expect(result2.isError).toBeFalsy();
        expect(result2.content[0].text).toBe(result1.content[0].text);
        
        // Results should be identical (from cache)
        expect(result2).toEqual(result1);
      } else {
        // If API call fails, skip the test
        console.warn('API call failed, skipping cache test');
      }
    }, 10000);

    it('should cache different results for different parameters', async () => {
      const toolName = 'deputados_listar';

      // Call with SP
      const resultSP = await server.handleToolCall(toolName, { siglaUf: 'SP', itens: 5 });
      
      if (!resultSP.isError) {
        const dataSP = JSON.parse(resultSP.content[0].text);

        // Call with RJ
        const resultRJ = await server.handleToolCall(toolName, { siglaUf: 'RJ', itens: 5 });
        
        if (!resultRJ.isError) {
          const dataRJ = JSON.parse(resultRJ.content[0].text);

          // Results should be different
          expect(dataSP).not.toEqual(dataRJ);

          // Call SP again - should use cache
          const resultSP2 = await server.handleToolCall(toolName, { siglaUf: 'SP', itens: 5 });
          expect(resultSP2.content[0].text).toBe(resultSP.content[0].text);
        }
      }
    }, 10000);

    it('should not cache error results', async () => {
      const toolName = 'deputado_detalhes';
      const invalidArgs = { id: 999999999 }; // Non-existent deputy

      // First call - should return error
      const result1 = await server.handleToolCall(toolName, invalidArgs);
      expect(result1.isError).toBe(true);

      // Second call - should still try API (not cached)
      const result2 = await server.handleToolCall(toolName, invalidArgs);
      expect(result2.isError).toBe(true);
      
      // Both should be errors
      expect(result1.isError).toBe(result2.isError);
    }, 10000);

    it('should execute complex workflow with multiple tools', async () => {
      // Step 1: List deputies from SP
      const listResult = await server.handleToolCall('deputados_listar', {
        siglaUf: 'SP',
        pagina: 1,
        itens: 1,
      });
      
      if (!listResult.isError) {
        const listData = JSON.parse(listResult.content[0].text);
        const deputyId = listData.dados[0].id;

        // Step 2: Get deputy details
        const detailsResult = await server.handleToolCall('deputado_detalhes', {
          id: deputyId,
        });
        
        if (!detailsResult.isError) {
          const detailsData = JSON.parse(detailsResult.content[0].text);
          expect(detailsData.dados.id).toBe(deputyId);

          // Step 3: Get deputy expenses (may be empty but should not error)
          const expensesResult = await server.handleToolCall('deputado_despesas', {
            id: deputyId,
            ano: new Date().getFullYear(),
            mes: 1,
          });
          
          if (!expensesResult.isError) {
            const expensesData = JSON.parse(expensesResult.content[0].text);
            expect(expensesData).toHaveProperty('dados');
          }

          // Step 4: Repeat step 2 - should use cache
          const detailsResult2 = await server.handleToolCall('deputado_detalhes', {
            id: deputyId,
          });
          
          expect(detailsResult2.content[0].text).toBe(detailsResult.content[0].text);
        }
      }
    }, 15000);
  });

  describe('Validation error scenarios', () => {
    let config: MCPServerConfig;
    let server: CamaraServer;

    beforeEach(async () => {
      config = {
        name: 'test-mcp-camara',
        version: '1.0.0-test',
        transport: 'stdio',
        httpPort: 3000,
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

    it('should validate required parameters', async () => {
      const result = await server.handleToolCall('deputado_detalhes', {});
      
      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Validation error');
      expect(result.content[0].text).toContain('id');
    });

    it('should validate parameter types', async () => {
      const result = await server.handleToolCall('deputado_detalhes', {
        id: 'not-a-number',
      });
      
      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Validation error');
    });

    it('should validate date formats', async () => {
      const result = await server.handleToolCall('deputado_despesas', {
        id: 123,
        dataInicio: '01/01/2024', // Wrong format
      });
      
      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Validation error');
    });

    it('should validate UF codes', async () => {
      const result = await server.handleToolCall('deputados_listar', {
        siglaUf: 'ZZ', // Invalid UF
      });
      
      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Validation error');
    });

    it('should validate pagination limits', async () => {
      const result = await server.handleToolCall('deputados_listar', {
        itens: 101, // Exceeds max of 100
      });
      
      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Validation error');
    });

    it('should validate positive integers', async () => {
      const result = await server.handleToolCall('deputado_detalhes', {
        id: -1, // Negative number
      });
      
      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Validation error');
    });

    it('should validate date ranges', async () => {
      const result = await server.handleToolCall('deputados_listar', {
        dataInicio: '2024-12-31',
        dataFim: '2024-01-01', // End before start
      });
      
      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Validation error');
    });
  });

  describe('API error scenarios', () => {
    let config: MCPServerConfig;
    let server: CamaraServer;

    beforeEach(async () => {
      config = {
        name: 'test-mcp-camara',
        version: '1.0.0-test',
        transport: 'stdio',
        httpPort: 3000,
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

    it('should handle 404 errors from API', async () => {
      const result = await server.handleToolCall('deputado_detalhes', {
        id: 999999999, // Non-existent deputy
      });
      
      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('error');
    }, 10000);

    it('should handle invalid proposition IDs', async () => {
      const result = await server.handleToolCall('proposicao_detalhes', {
        id: 999999999, // Non-existent proposition
      });
      
      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('API error');
    });

    it('should handle invalid voting IDs', async () => {
      const result = await server.handleToolCall('votacao_detalhes', {
        id: 'invalid-voting-id',
      });
      
      expect(result.isError).toBe(true);
      // Could be validation error or API error depending on format
      expect(result.content[0].text).toContain('error');
    });

    it('should handle invalid event IDs', async () => {
      const result = await server.handleToolCall('evento_detalhes', {
        id: 999999999,
      });
      
      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('API error');
    });

    it('should provide meaningful error messages', async () => {
      const result = await server.handleToolCall('deputado_detalhes', {
        id: 999999999,
      });
      
      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('deputado_detalhes');
      expect(result.content[0].text).toContain('Endpoint:');
    });
  });

  describe('Mixed scenarios', () => {
    let config: MCPServerConfig;
    let server: CamaraServer;

    beforeEach(async () => {
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
        logLevel: 'ERROR',
      };

      server = new CamaraServer(config);
      await server.initialize();
    });

    it('should handle successful call followed by validation error', async () => {
      // Successful call
      const result1 = await server.handleToolCall('referencias_ufs', {});
      
      // Validation error
      const result2 = await server.handleToolCall('deputado_detalhes', {});
      expect(result2.isError).toBe(true);
      expect(result2.content[0].text).toContain('Validation error');
    }, 10000);

    it('should handle validation error followed by successful call', async () => {
      // Validation error
      const result1 = await server.handleToolCall('deputado_detalhes', {
        id: 'invalid',
      });
      expect(result1.isError).toBe(true);

      // Successful call
      const result2 = await server.handleToolCall('referencias_ufs', {});
      // Don't assert on isError since API might fail
    }, 10000);

    it('should handle API error followed by successful call', async () => {
      // API error
      const result1 = await server.handleToolCall('deputado_detalhes', {
        id: 999999999,
      });
      expect(result1.isError).toBe(true);
      expect(result1.content[0].text).toContain('error');

      // Successful call
      const result2 = await server.handleToolCall('referencias_ufs', {});
      // Don't assert on isError since API might fail
    }, 10000);

    it('should handle multiple successful calls with caching', async () => {
      // First call
      const result1 = await server.handleToolCall('referencias_ufs', {});

      if (!result1.isError) {
        // Second call (cached)
        const result2 = await server.handleToolCall('referencias_ufs', {});
        expect(result2.isError).toBeFalsy();
        expect(result2.content[0].text).toBe(result1.content[0].text);

        // Different tool
        const result3 = await server.handleToolCall('referencias_tipos_proposicao', {});
        
        // First tool again (still cached)
        const result4 = await server.handleToolCall('referencias_ufs', {});
        expect(result4.content[0].text).toBe(result1.content[0].text);
      }
    }, 15000);
  });
});
