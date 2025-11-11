/**
 * Tests for voting tool implementations
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { votingTools } from '../../lib/tools/voting-tools.js';
import type { ToolContext } from '../../lib/core/tools.js';
import type { CamaraHttpClient } from '../../lib/core/http-client.js';
import type { CacheLayer } from '../../lib/core/cache.js';
import type { Logger } from '../../lib/shared/utils/logger.js';

describe('Voting Tools', () => {
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
    it('should export exactly 4 voting tools', () => {
      expect(votingTools).toHaveLength(4);
    });

    it('should have all required properties for each tool', () => {
      votingTools.forEach(tool => {
        expect(tool).toHaveProperty('name');
        expect(tool).toHaveProperty('description');
        expect(tool).toHaveProperty('inputSchema');
        expect(tool).toHaveProperty('handler');
        expect(tool).toHaveProperty('category');
        expect(tool.category).toBe('votings');
      });
    });

    it('should have unique tool names', () => {
      const names = votingTools.map(t => t.name);
      const uniqueNames = new Set(names);
      expect(uniqueNames.size).toBe(names.length);
    });
  });

  describe('votacoes_listar', () => {
    it('should call API with correct endpoint and parameters', async () => {
      const mockResponse = {
        data: { dados: [{ id: '12345-1', data: '2024-01-15', descricao: 'Test Vote' }] },
        status: 200,
        headers: {},
      };
      vi.mocked(mockHttpClient.get).mockResolvedValue(mockResponse);

      const tool = votingTools.find(t => t.name === 'votacoes_listar');
      expect(tool).toBeDefined();

      const result = await tool!.handler(
        { dataInicio: '2024-01-01', dataFim: '2024-12-31', pagina: 1, itens: 10 },
        mockContext
      );

      expect(mockHttpClient.get).toHaveBeenCalledWith('/votacoes', {
        dataInicio: '2024-01-01',
        dataFim: '2024-12-31',
        pagina: 1,
        itens: 10,
      });
      expect(result.content[0]?.text).toContain('Test Vote');
    });

    it('should handle filters with organ and proposition IDs', async () => {
      const mockResponse = {
        data: { dados: [] },
        status: 200,
        headers: {},
      };
      vi.mocked(mockHttpClient.get).mockResolvedValue(mockResponse);

      const tool = votingTools.find(t => t.name === 'votacoes_listar');
      const result = await tool!.handler(
        { idProposicao: 123, idOrgao: 456 },
        mockContext
      );

      expect(mockHttpClient.get).toHaveBeenCalledWith('/votacoes', {
        idProposicao: 123,
        idOrgao: 456,
      });
      expect(result.isError).toBeUndefined();
    });

    it('should handle empty filters', async () => {
      const mockResponse = {
        data: { dados: [] },
        status: 200,
        headers: {},
      };
      vi.mocked(mockHttpClient.get).mockResolvedValue(mockResponse);

      const tool = votingTools.find(t => t.name === 'votacoes_listar');
      const result = await tool!.handler({}, mockContext);

      expect(mockHttpClient.get).toHaveBeenCalledWith('/votacoes', {});
      expect(result.isError).toBeUndefined();
    });
  });

  describe('votacao_detalhes', () => {
    it('should call API with voting ID', async () => {
      const mockResponse = {
        data: {
          dados: {
            id: '12345-1',
            data: '2024-01-15',
            descricao: 'Voting on Bill 123',
            aprovacao: 1,
            votosSim: 300,
            votosNao: 150,
            votosOutros: 50,
          },
        },
        status: 200,
        headers: {},
      };
      vi.mocked(mockHttpClient.get).mockResolvedValue(mockResponse);

      const tool = votingTools.find(t => t.name === 'votacao_detalhes');
      expect(tool).toBeDefined();

      const result = await tool!.handler({ id: '12345-1' }, mockContext);

      expect(mockHttpClient.get).toHaveBeenCalledWith('/votacoes/12345-1');
      expect(result.content[0]?.text).toContain('Voting on Bill 123');
      expect(result.content[0]?.text).toContain('300');
    });
  });

  describe('votacao_votos', () => {
    it('should call API with voting ID and pagination', async () => {
      const mockResponse = {
        data: {
          dados: [
            { deputado_: { id: 1, nome: 'Deputy A' }, tipoVoto: 'Sim' },
            { deputado_: { id: 2, nome: 'Deputy B' }, tipoVoto: 'Não' },
          ],
        },
        status: 200,
        headers: {},
      };
      vi.mocked(mockHttpClient.get).mockResolvedValue(mockResponse);

      const tool = votingTools.find(t => t.name === 'votacao_votos');
      expect(tool).toBeDefined();

      const result = await tool!.handler(
        { id: '12345-1', pagina: 1, itens: 50 },
        mockContext
      );

      expect(mockHttpClient.get).toHaveBeenCalledWith('/votacoes/12345-1/votos', {
        pagina: 1,
        itens: 50,
      });
      expect(result.content[0]?.text).toContain('Deputy A');
      expect(result.content[0]?.text).toContain('Sim');
    });

    it('should handle request without pagination', async () => {
      const mockResponse = {
        data: { dados: [] },
        status: 200,
        headers: {},
      };
      vi.mocked(mockHttpClient.get).mockResolvedValue(mockResponse);

      const tool = votingTools.find(t => t.name === 'votacao_votos');
      const result = await tool!.handler({ id: '12345-1' }, mockContext);

      expect(mockHttpClient.get).toHaveBeenCalledWith('/votacoes/12345-1/votos', {});
      expect(result.isError).toBeUndefined();
    });
  });

  describe('votacao_orientacoes', () => {
    it('should call API with voting ID', async () => {
      const mockResponse = {
        data: {
          dados: [
            { siglaPartido: 'PT', orientacaoVoto: 'Sim' },
            { siglaPartido: 'PSDB', orientacaoVoto: 'Não' },
            { siglaPartido: 'MDB', orientacaoVoto: 'Liberado' },
          ],
        },
        status: 200,
        headers: {},
      };
      vi.mocked(mockHttpClient.get).mockResolvedValue(mockResponse);

      const tool = votingTools.find(t => t.name === 'votacao_orientacoes');
      expect(tool).toBeDefined();

      const result = await tool!.handler({ id: '12345-1' }, mockContext);

      expect(mockHttpClient.get).toHaveBeenCalledWith('/votacoes/12345-1/orientacoes');
      expect(result.content[0]?.text).toContain('PT');
      expect(result.content[0]?.text).toContain('Sim');
      expect(result.content[0]?.text).toContain('Liberado');
    });
  });

  describe('Tool Name Verification', () => {
    const expectedToolNames = [
      'votacoes_listar',
      'votacao_detalhes',
      'votacao_votos',
      'votacao_orientacoes',
    ];

    it('should have all expected tool names', () => {
      const actualNames = votingTools.map(t => t.name);
      expectedToolNames.forEach(name => {
        expect(actualNames).toContain(name);
      });
    });
  });
});
