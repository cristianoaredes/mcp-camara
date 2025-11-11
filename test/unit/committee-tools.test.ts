/**
 * Tests for committee tool implementations
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { committeeTools } from '../../lib/tools/committee-tools.js';
import type { ToolContext } from '../../lib/core/tools.js';
import type { CamaraHttpClient } from '../../lib/core/http-client.js';
import type { CacheLayer } from '../../lib/core/cache.js';
import type { Logger } from '../../lib/shared/utils/logger.js';

describe('Committee Tools', () => {
  let mockContext: ToolContext;
  let mockHttpClient: CamaraHttpClient;
  let mockCache: CacheLayer;
  let mockLogger: Logger;

  beforeEach(() => {
    mockHttpClient = {
      get: vi.fn(),
    } as any;

    mockCache = {} as any;
    mockLogger = {} as any;

    mockContext = {
      httpClient: mockHttpClient,
      cache: mockCache,
      config: {} as any,
      logger: mockLogger,
    };
  });

  describe('Tool Definitions', () => {
    it('should export exactly 5 committee tools', () => {
      expect(committeeTools).toHaveLength(5);
    });

    it('should have all required properties for each tool', () => {
      committeeTools.forEach(tool => {
        expect(tool).toHaveProperty('name');
        expect(tool).toHaveProperty('description');
        expect(tool).toHaveProperty('inputSchema');
        expect(tool).toHaveProperty('handler');
        expect(tool).toHaveProperty('category');
        expect(tool.category).toBe('committees');
      });
    });

    it('should have unique tool names', () => {
      const names = committeeTools.map(t => t.name);
      const uniqueNames = new Set(names);
      expect(uniqueNames.size).toBe(names.length);
    });
  });

  describe('orgaos_listar', () => {
    it('should call API with correct endpoint and parameters', async () => {
      const mockResponse = {
        data: { dados: [{ id: 1, sigla: 'CCJC', nome: 'Comissão de Constituição e Justiça' }] },
        status: 200,
        headers: {},
      };
      vi.mocked(mockHttpClient.get).mockResolvedValue(mockResponse);

      const tool = committeeTools.find(t => t.name === 'orgaos_listar');
      expect(tool).toBeDefined();

      const result = await tool!.handler(
        { codTipo: 1, pagina: 1, itens: 10 },
        mockContext
      );

      expect(mockHttpClient.get).toHaveBeenCalledWith('/orgaos', {
        pagina: 1,
        itens: 10,
      });
      expect(result.content[0]?.text).toContain('CCJC');
    });

    it('should handle empty filters', async () => {
      const mockResponse = {
        data: { dados: [] },
        status: 200,
        headers: {},
      };
      vi.mocked(mockHttpClient.get).mockResolvedValue(mockResponse);

      const tool = committeeTools.find(t => t.name === 'orgaos_listar');
      const result = await tool!.handler({}, mockContext);

      expect(mockHttpClient.get).toHaveBeenCalledWith('/orgaos', {});
      expect(result.isError).toBeUndefined();
    });
  });

  describe('orgao_detalhes', () => {
    it('should call API with committee ID', async () => {
      const mockResponse = {
        data: { dados: { id: 123, sigla: 'CCJC', nome: 'Comissão de Constituição e Justiça' } },
        status: 200,
        headers: {},
      };
      vi.mocked(mockHttpClient.get).mockResolvedValue(mockResponse);

      const tool = committeeTools.find(t => t.name === 'orgao_detalhes');
      expect(tool).toBeDefined();

      const result = await tool!.handler({ id: 123 }, mockContext);

      expect(mockHttpClient.get).toHaveBeenCalledWith('/orgaos/123');
      expect(result.content[0]?.text).toContain('CCJC');
    });
  });

  describe('orgao_membros', () => {
    it('should call API with committee ID', async () => {
      const mockResponse = {
        data: { dados: [{ nome: 'Deputy Member', cargo: 'Titular' }] },
        status: 200,
        headers: {},
      };
      vi.mocked(mockHttpClient.get).mockResolvedValue(mockResponse);

      const tool = committeeTools.find(t => t.name === 'orgao_membros');
      expect(tool).toBeDefined();

      const result = await tool!.handler({ id: 123 }, mockContext);

      expect(mockHttpClient.get).toHaveBeenCalledWith('/orgaos/123/membros', {});
      expect(result.content[0]?.text).toContain('Deputy Member');
    });
  });

  describe('orgao_eventos', () => {
    it('should call API with committee ID', async () => {
      const mockResponse = {
        data: { dados: [{ id: 1, descricao: 'Committee Meeting', dataHoraInicio: '2024-01-01T10:00:00' }] },
        status: 200,
        headers: {},
      };
      vi.mocked(mockHttpClient.get).mockResolvedValue(mockResponse);

      const tool = committeeTools.find(t => t.name === 'orgao_eventos');
      expect(tool).toBeDefined();

      const result = await tool!.handler({ id: 123 }, mockContext);

      expect(mockHttpClient.get).toHaveBeenCalledWith('/orgaos/123/eventos', {});
      expect(result.content[0]?.text).toContain('Committee Meeting');
    });
  });

  describe('orgao_votacoes', () => {
    it('should call API with committee ID', async () => {
      const mockResponse = {
        data: { dados: [{ id: '1', data: '2024-01-01', aprovacao: 1 }] },
        status: 200,
        headers: {},
      };
      vi.mocked(mockHttpClient.get).mockResolvedValue(mockResponse);

      const tool = committeeTools.find(t => t.name === 'orgao_votacoes');
      expect(tool).toBeDefined();

      const result = await tool!.handler({ id: 123 }, mockContext);

      expect(mockHttpClient.get).toHaveBeenCalledWith('/orgaos/123/votacoes', {});
      expect(result.content[0]?.text).toContain('2024-01-01');
    });
  });

  describe('Tool Name Verification', () => {
    const expectedToolNames = [
      'orgaos_listar',
      'orgao_detalhes',
      'orgao_membros',
      'orgao_eventos',
      'orgao_votacoes',
    ];

    it('should have all expected tool names', () => {
      const actualNames = committeeTools.map(t => t.name);
      expectedToolNames.forEach(name => {
        expect(actualNames).toContain(name);
      });
    });
  });
});
