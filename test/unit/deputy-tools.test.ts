/**
 * Tests for deputy tool implementations
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { deputyTools } from '../../lib/tools/deputy-tools.js';
import type { ToolContext } from '../../lib/core/tools.js';
import type { CamaraHttpClient } from '../../lib/core/http-client.js';
import type { CacheLayer } from '../../lib/core/cache.js';
import type { Logger } from '../../lib/shared/utils/logger.js';

describe('Deputy Tools', () => {
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
    it('should export exactly 15 deputy tools', () => {
      expect(deputyTools).toHaveLength(15);
    });

    it('should have all required properties for each tool', () => {
      deputyTools.forEach(tool => {
        expect(tool).toHaveProperty('name');
        expect(tool).toHaveProperty('description');
        expect(tool).toHaveProperty('inputSchema');
        expect(tool).toHaveProperty('handler');
        expect(tool).toHaveProperty('category');
        expect(tool.category).toBe('deputies');
      });
    });

    it('should have unique tool names', () => {
      const names = deputyTools.map(t => t.name);
      const uniqueNames = new Set(names);
      expect(uniqueNames.size).toBe(names.length);
    });
  });

  describe('deputados_listar', () => {
    it('should call API with correct endpoint and parameters', async () => {
      const mockResponse = {
        data: { dados: [{ id: 1, nome: 'Test Deputy' }] },
        status: 200,
        headers: {},
      };
      vi.mocked(mockHttpClient.get).mockResolvedValue(mockResponse);

      const tool = deputyTools.find(t => t.name === 'deputados_listar');
      expect(tool).toBeDefined();

      const result = await tool!.handler(
        { siglaUf: 'SP', pagina: 1, itens: 10 },
        mockContext
      );

      expect(mockHttpClient.get).toHaveBeenCalledWith('/deputados', {
        siglaUf: 'SP',
        pagina: 1,
        itens: 10,
      });
      expect(result.content[0]?.text).toContain('Test Deputy');
    });

    it('should handle empty filters', async () => {
      const mockResponse = {
        data: { dados: [] },
        status: 200,
        headers: {},
      };
      vi.mocked(mockHttpClient.get).mockResolvedValue(mockResponse);

      const tool = deputyTools.find(t => t.name === 'deputados_listar');
      const result = await tool!.handler({}, mockContext);

      expect(mockHttpClient.get).toHaveBeenCalledWith('/deputados', {});
      expect(result.isError).toBeUndefined();
    });
  });

  describe('deputado_detalhes', () => {
    it('should call API with deputy ID', async () => {
      const mockResponse = {
        data: { dados: { id: 123, nome: 'Test Deputy', cpf: '12345678900' } },
        status: 200,
        headers: {},
      };
      vi.mocked(mockHttpClient.get).mockResolvedValue(mockResponse);

      const tool = deputyTools.find(t => t.name === 'deputado_detalhes');
      expect(tool).toBeDefined();

      const result = await tool!.handler({ id: 123 }, mockContext);

      expect(mockHttpClient.get).toHaveBeenCalledWith('/deputados/123');
      expect(result.content[0]?.text).toContain('Test Deputy');
    });
  });

  describe('deputado_despesas', () => {
    it('should call API with deputy ID and date filters', async () => {
      const mockResponse = {
        data: { dados: [{ ano: 2024, mes: 1, valorDocumento: 1000 }] },
        status: 200,
        headers: {},
      };
      vi.mocked(mockHttpClient.get).mockResolvedValue(mockResponse);

      const tool = deputyTools.find(t => t.name === 'deputado_despesas');
      expect(tool).toBeDefined();

      const result = await tool!.handler(
        { id: 123, dataInicio: '2024-01-01', dataFim: '2024-12-31' },
        mockContext
      );

      expect(mockHttpClient.get).toHaveBeenCalledWith('/deputados/123/despesas', {
        dataInicio: '2024-01-01',
        dataFim: '2024-12-31',
      });
      expect(result.content[0]?.text).toContain('2024');
    });
  });

  describe('deputado_discursos', () => {
    it('should call API with deputy ID', async () => {
      const mockResponse = {
        data: { dados: [{ dataHoraInicio: '2024-01-01T10:00:00', transcricao: 'Speech text' }] },
        status: 200,
        headers: {},
      };
      vi.mocked(mockHttpClient.get).mockResolvedValue(mockResponse);

      const tool = deputyTools.find(t => t.name === 'deputado_discursos');
      expect(tool).toBeDefined();

      const result = await tool!.handler({ id: 123 }, mockContext);

      expect(mockHttpClient.get).toHaveBeenCalledWith('/deputados/123/discursos', {});
      expect(result.content[0]?.text).toContain('Speech text');
    });
  });

  describe('deputado_eventos', () => {
    it('should call API with deputy ID', async () => {
      const mockResponse = {
        data: { dados: [{ id: 1, descricao: 'Committee Meeting' }] },
        status: 200,
        headers: {},
      };
      vi.mocked(mockHttpClient.get).mockResolvedValue(mockResponse);

      const tool = deputyTools.find(t => t.name === 'deputado_eventos');
      expect(tool).toBeDefined();

      const result = await tool!.handler({ id: 123 }, mockContext);

      expect(mockHttpClient.get).toHaveBeenCalledWith('/deputados/123/eventos', {});
      expect(result.content[0]?.text).toContain('Committee Meeting');
    });
  });

  describe('deputado_frentes', () => {
    it('should call API with deputy ID', async () => {
      const mockResponse = {
        data: { dados: [{ id: 1, titulo: 'Parliamentary Front' }] },
        status: 200,
        headers: {},
      };
      vi.mocked(mockHttpClient.get).mockResolvedValue(mockResponse);

      const tool = deputyTools.find(t => t.name === 'deputado_frentes');
      expect(tool).toBeDefined();

      const result = await tool!.handler({ id: 123 }, mockContext);

      expect(mockHttpClient.get).toHaveBeenCalledWith('/deputados/123/frentes', {});
      expect(result.content[0]?.text).toContain('Parliamentary Front');
    });
  });

  describe('deputado_historico', () => {
    it('should call API with deputy ID', async () => {
      const mockResponse = {
        data: { dados: [{ idLegislatura: 56, siglaPartido: 'PT' }] },
        status: 200,
        headers: {},
      };
      vi.mocked(mockHttpClient.get).mockResolvedValue(mockResponse);

      const tool = deputyTools.find(t => t.name === 'deputado_historico');
      expect(tool).toBeDefined();

      const result = await tool!.handler({ id: 123 }, mockContext);

      expect(mockHttpClient.get).toHaveBeenCalledWith('/deputados/123/historico');
      expect(result.content[0]?.text).toContain('56');
    });
  });

  describe('deputado_orgaos', () => {
    it('should call API with deputy ID and date filters', async () => {
      const mockResponse = {
        data: { dados: [{ sigla: 'CCJC', nome: 'Comissão de Constituição e Justiça' }] },
        status: 200,
        headers: {},
      };
      vi.mocked(mockHttpClient.get).mockResolvedValue(mockResponse);

      const tool = deputyTools.find(t => t.name === 'deputado_orgaos');
      expect(tool).toBeDefined();

      const result = await tool!.handler(
        { id: 123, dataInicio: '2024-01-01' },
        mockContext
      );

      expect(mockHttpClient.get).toHaveBeenCalledWith('/deputados/123/orgaos', {
        dataInicio: '2024-01-01',
      });
      expect(result.content[0]?.text).toContain('CCJC');
    });
  });

  describe('deputado_mandatos_externos', () => {
    it('should call API with deputy ID', async () => {
      const mockResponse = {
        data: { dados: [{ cargo: 'Vereador', municipio: 'São Paulo' }] },
        status: 200,
        headers: {},
      };
      vi.mocked(mockHttpClient.get).mockResolvedValue(mockResponse);

      const tool = deputyTools.find(t => t.name === 'deputado_mandatos_externos');
      expect(tool).toBeDefined();

      const result = await tool!.handler({ id: 123 }, mockContext);

      expect(mockHttpClient.get).toHaveBeenCalledWith('/deputados/123/mandatos-externos', {});
      expect(result.content[0]?.text).toContain('Vereador');
    });
  });

  describe('deputado_ocupacoes', () => {
    it('should call API with deputy ID', async () => {
      const mockResponse = {
        data: { dados: [{ titulo: 'Advogado', entidade: 'OAB' }] },
        status: 200,
        headers: {},
      };
      vi.mocked(mockHttpClient.get).mockResolvedValue(mockResponse);

      const tool = deputyTools.find(t => t.name === 'deputado_ocupacoes');
      expect(tool).toBeDefined();

      const result = await tool!.handler({ id: 123 }, mockContext);

      expect(mockHttpClient.get).toHaveBeenCalledWith('/deputados/123/ocupacoes');
      expect(result.content[0]?.text).toContain('Advogado');
    });
  });

  describe('deputado_profissoes', () => {
    it('should call API with deputy ID', async () => {
      const mockResponse = {
        data: { dados: [{ titulo: 'Engenheiro', dataHora: '2020-01-01' }] },
        status: 200,
        headers: {},
      };
      vi.mocked(mockHttpClient.get).mockResolvedValue(mockResponse);

      const tool = deputyTools.find(t => t.name === 'deputado_profissoes');
      expect(tool).toBeDefined();

      const result = await tool!.handler({ id: 123 }, mockContext);

      expect(mockHttpClient.get).toHaveBeenCalledWith('/deputados/123/profissoes');
      expect(result.content[0]?.text).toContain('Engenheiro');
    });
  });

  describe('deputado_mesa', () => {
    it('should call API with deputy ID and date filters', async () => {
      const mockResponse = {
        data: { dados: [{ titulo: 'Presidente', dataInicio: '2023-02-01' }] },
        status: 200,
        headers: {},
      };
      vi.mocked(mockHttpClient.get).mockResolvedValue(mockResponse);

      const tool = deputyTools.find(t => t.name === 'deputado_mesa');
      expect(tool).toBeDefined();

      const result = await tool!.handler(
        { id: 123, dataInicio: '2023-01-01' },
        mockContext
      );

      expect(mockHttpClient.get).toHaveBeenCalledWith('/deputados/123/mesa', {
        dataInicio: '2023-01-01',
      });
      expect(result.content[0]?.text).toContain('Presidente');
    });
  });

  describe('deputado_liderancas', () => {
    it('should call API with deputy ID and date filters', async () => {
      const mockResponse = {
        data: { dados: [{ titulo: 'Líder do PT', dataInicio: '2023-02-01' }] },
        status: 200,
        headers: {},
      };
      vi.mocked(mockHttpClient.get).mockResolvedValue(mockResponse);

      const tool = deputyTools.find(t => t.name === 'deputado_liderancas');
      expect(tool).toBeDefined();

      const result = await tool!.handler(
        { id: 123, dataInicio: '2023-01-01' },
        mockContext
      );

      expect(mockHttpClient.get).toHaveBeenCalledWith('/deputados/123/liderancas', {
        dataInicio: '2023-01-01',
      });
      expect(result.content[0]?.text).toContain('Líder do PT');
    });
  });

  describe('deputado_cargos', () => {
    it('should call API with deputy ID and date filters', async () => {
      const mockResponse = {
        data: { dados: [{ titulo: 'Presidente da Comissão', dataInicio: '2023-02-01' }] },
        status: 200,
        headers: {},
      };
      vi.mocked(mockHttpClient.get).mockResolvedValue(mockResponse);

      const tool = deputyTools.find(t => t.name === 'deputado_cargos');
      expect(tool).toBeDefined();

      const result = await tool!.handler(
        { id: 123, dataInicio: '2023-01-01' },
        mockContext
      );

      expect(mockHttpClient.get).toHaveBeenCalledWith('/deputados/123/cargos', {
        dataInicio: '2023-01-01',
      });
      expect(result.content[0]?.text).toContain('Presidente da Comissão');
    });
  });

  describe('deputado_filiacoes', () => {
    it('should call API with deputy ID and date filters', async () => {
      const mockResponse = {
        data: { dados: [{ siglaPartido: 'PT', dataInicio: '2020-01-01' }] },
        status: 200,
        headers: {},
      };
      vi.mocked(mockHttpClient.get).mockResolvedValue(mockResponse);

      const tool = deputyTools.find(t => t.name === 'deputado_filiacoes');
      expect(tool).toBeDefined();

      const result = await tool!.handler(
        { id: 123, dataInicio: '2020-01-01' },
        mockContext
      );

      expect(mockHttpClient.get).toHaveBeenCalledWith('/deputados/123/filiacoes', {
        dataInicio: '2020-01-01',
      });
      expect(result.content[0]?.text).toContain('PT');
    });
  });

  describe('Tool Name Verification', () => {
    const expectedToolNames = [
      'deputados_listar',
      'deputado_detalhes',
      'deputado_despesas',
      'deputado_discursos',
      'deputado_eventos',
      'deputado_frentes',
      'deputado_historico',
      'deputado_mandatos_externos',
      'deputado_ocupacoes',
      'deputado_orgaos',
      'deputado_profissoes',
      'deputado_mesa',
      'deputado_liderancas',
      'deputado_cargos',
      'deputado_filiacoes',
    ];

    it('should have all expected tool names', () => {
      const actualNames = deputyTools.map(t => t.name);
      expectedToolNames.forEach(name => {
        expect(actualNames).toContain(name);
      });
    });
  });
});
