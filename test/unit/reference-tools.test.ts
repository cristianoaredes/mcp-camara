/**
 * Tests for reference data tool implementations
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { referenceTools } from '../../lib/tools/reference-tools.js';
import type { ToolContext } from '../../lib/core/tools.js';
import type { CamaraHttpClient } from '../../lib/core/http-client.js';
import type { CacheLayer } from '../../lib/core/cache.js';
import type { Logger } from '../../lib/shared/utils/logger.js';

describe('Reference Tools', () => {
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
    it('should export exactly 15 reference tools', () => {
      expect(referenceTools).toHaveLength(15);
    });

    it('should have all required properties for each tool', () => {
      referenceTools.forEach(tool => {
        expect(tool).toHaveProperty('name');
        expect(tool).toHaveProperty('description');
        expect(tool).toHaveProperty('inputSchema');
        expect(tool).toHaveProperty('handler');
        expect(tool).toHaveProperty('category');
        expect(tool.category).toBe('references');
      });
    });

    it('should have unique tool names', () => {
      const names = referenceTools.map(t => t.name);
      const uniqueNames = new Set(names);
      expect(uniqueNames.size).toBe(names.length);
    });
  });

  describe('referencias_situacoes_deputado', () => {
    it('should call API with correct endpoint', async () => {
      const mockResponse = {
        data: { dados: [{ id: 1, situacao: 'Exercício', descricao: 'Em exercício' }] },
        status: 200,
        headers: {},
      };
      vi.mocked(mockHttpClient.get).mockResolvedValue(mockResponse);

      const tool = referenceTools.find(t => t.name === 'referencias_situacoes_deputado');
      expect(tool).toBeDefined();

      const result = await tool!.handler({}, mockContext);

      expect(mockHttpClient.get).toHaveBeenCalledWith('/referencias/situacoesDeputado');
      expect(result.content[0]?.text).toContain('Exercício');
    });
  });

  describe('referencias_tipos_proposicao', () => {
    it('should call API with correct endpoint', async () => {
      const mockResponse = {
        data: { dados: [{ id: 1, sigla: 'PL', nome: 'Projeto de Lei' }] },
        status: 200,
        headers: {},
      };
      vi.mocked(mockHttpClient.get).mockResolvedValue(mockResponse);

      const tool = referenceTools.find(t => t.name === 'referencias_tipos_proposicao');
      expect(tool).toBeDefined();

      const result = await tool!.handler({}, mockContext);

      expect(mockHttpClient.get).toHaveBeenCalledWith('/referencias/tiposProposicao');
      expect(result.content[0]?.text).toContain('PL');
    });
  });

  describe('referencias_tipos_evento', () => {
    it('should call API with correct endpoint', async () => {
      const mockResponse = {
        data: { dados: [{ id: 1, nome: 'Audiência Pública' }] },
        status: 200,
        headers: {},
      };
      vi.mocked(mockHttpClient.get).mockResolvedValue(mockResponse);

      const tool = referenceTools.find(t => t.name === 'referencias_tipos_evento');
      expect(tool).toBeDefined();

      const result = await tool!.handler({}, mockContext);

      expect(mockHttpClient.get).toHaveBeenCalledWith('/referencias/tiposEvento');
      expect(result.content[0]?.text).toContain('Audiência Pública');
    });
  });

  describe('referencias_ufs', () => {
    it('should call API with correct endpoint', async () => {
      const mockResponse = {
        data: { dados: [{ sigla: 'SP', nome: 'São Paulo' }] },
        status: 200,
        headers: {},
      };
      vi.mocked(mockHttpClient.get).mockResolvedValue(mockResponse);

      const tool = referenceTools.find(t => t.name === 'referencias_ufs');
      expect(tool).toBeDefined();

      const result = await tool!.handler({}, mockContext);

      expect(mockHttpClient.get).toHaveBeenCalledWith('/referencias/uf');
      expect(result.content[0]?.text).toContain('São Paulo');
    });
  });

  describe('referencias_legislaturas', () => {
    it('should call API with correct endpoint', async () => {
      const mockResponse = {
        data: { dados: [{ id: 56, dataInicio: '2019-02-01', dataFim: '2023-01-31' }] },
        status: 200,
        headers: {},
      };
      vi.mocked(mockHttpClient.get).mockResolvedValue(mockResponse);

      const tool = referenceTools.find(t => t.name === 'referencias_legislaturas');
      expect(tool).toBeDefined();

      const result = await tool!.handler({}, mockContext);

      expect(mockHttpClient.get).toHaveBeenCalledWith('/referencias/legislaturas', {});
      expect(result.content[0]?.text).toContain('2019-02-01');
    });
  });

  describe('referencias_tipos_orgao', () => {
    it('should call API with correct endpoint', async () => {
      const mockResponse = {
        data: { dados: [{ id: 1, sigla: 'COMISSAO', nome: 'Comissão' }] },
        status: 200,
        headers: {},
      };
      vi.mocked(mockHttpClient.get).mockResolvedValue(mockResponse);

      const tool = referenceTools.find(t => t.name === 'referencias_tipos_orgao');
      expect(tool).toBeDefined();

      const result = await tool!.handler({}, mockContext);

      expect(mockHttpClient.get).toHaveBeenCalledWith('/referencias/tiposOrgao');
      expect(result.content[0]?.text).toContain('Comissão');
    });
  });

  describe('referencias_tipos_autor', () => {
    it('should call API with correct endpoint', async () => {
      const mockResponse = {
        data: { dados: [{ id: 1, nome: 'Deputado' }] },
        status: 200,
        headers: {},
      };
      vi.mocked(mockHttpClient.get).mockResolvedValue(mockResponse);

      const tool = referenceTools.find(t => t.name === 'referencias_tipos_autor');
      expect(tool).toBeDefined();

      const result = await tool!.handler({}, mockContext);

      expect(mockHttpClient.get).toHaveBeenCalledWith('/referencias/tiposAutor');
      expect(result.content[0]?.text).toContain('Deputado');
    });
  });

  describe('referencias_tipos_tramitacao', () => {
    it('should call API with correct endpoint', async () => {
      const mockResponse = {
        data: { dados: [{ id: 1, nome: 'Despacho' }] },
        status: 200,
        headers: {},
      };
      vi.mocked(mockHttpClient.get).mockResolvedValue(mockResponse);

      const tool = referenceTools.find(t => t.name === 'referencias_tipos_tramitacao');
      expect(tool).toBeDefined();

      const result = await tool!.handler({}, mockContext);

      expect(mockHttpClient.get).toHaveBeenCalledWith('/referencias/tiposTramitacao');
      expect(result.content[0]?.text).toContain('Despacho');
    });
  });

  describe('referencias_situacoes_proposicao', () => {
    it('should call API with correct endpoint', async () => {
      const mockResponse = {
        data: { dados: [{ id: 1, situacao: 'Tramitando' }] },
        status: 200,
        headers: {},
      };
      vi.mocked(mockHttpClient.get).mockResolvedValue(mockResponse);

      const tool = referenceTools.find(t => t.name === 'referencias_situacoes_proposicao');
      expect(tool).toBeDefined();

      const result = await tool!.handler({}, mockContext);

      expect(mockHttpClient.get).toHaveBeenCalledWith('/referencias/situacoesProposicao');
      expect(result.content[0]?.text).toContain('Tramitando');
    });
  });

  describe('referencias_situacoes_evento', () => {
    it('should call API with correct endpoint', async () => {
      const mockResponse = {
        data: { dados: [{ id: 1, situacao: 'Realizada' }] },
        status: 200,
        headers: {},
      };
      vi.mocked(mockHttpClient.get).mockResolvedValue(mockResponse);

      const tool = referenceTools.find(t => t.name === 'referencias_situacoes_evento');
      expect(tool).toBeDefined();

      const result = await tool!.handler({}, mockContext);

      expect(mockHttpClient.get).toHaveBeenCalledWith('/referencias/situacoesEvento');
      expect(result.content[0]?.text).toContain('Realizada');
    });
  });

  describe('referencias_situacoes_orgao', () => {
    it('should call API with correct endpoint', async () => {
      const mockResponse = {
        data: { dados: [{ id: 1, situacao: 'Ativa' }] },
        status: 200,
        headers: {},
      };
      vi.mocked(mockHttpClient.get).mockResolvedValue(mockResponse);

      const tool = referenceTools.find(t => t.name === 'referencias_situacoes_orgao');
      expect(tool).toBeDefined();

      const result = await tool!.handler({}, mockContext);

      expect(mockHttpClient.get).toHaveBeenCalledWith('/referencias/situacoesOrgao');
      expect(result.content[0]?.text).toContain('Ativa');
    });
  });

  describe('referencias_codigos_tipo_autor', () => {
    it('should call API with correct endpoint', async () => {
      const mockResponse = {
        data: { dados: [{ cod: 10000, nome: 'Deputado' }] },
        status: 200,
        headers: {},
      };
      vi.mocked(mockHttpClient.get).mockResolvedValue(mockResponse);

      const tool = referenceTools.find(t => t.name === 'referencias_codigos_tipo_autor');
      expect(tool).toBeDefined();

      const result = await tool!.handler({}, mockContext);

      expect(mockHttpClient.get).toHaveBeenCalledWith('/referencias/codigosTipoAutor');
      expect(result.content[0]?.text).toContain('10000');
    });
  });

  describe('referencias_situacoes_mesa', () => {
    it('should call API with correct endpoint', async () => {
      const mockResponse = {
        data: { dados: [{ id: 1, situacao: 'Exercício' }] },
        status: 200,
        headers: {},
      };
      vi.mocked(mockHttpClient.get).mockResolvedValue(mockResponse);

      const tool = referenceTools.find(t => t.name === 'referencias_situacoes_mesa');
      expect(tool).toBeDefined();

      const result = await tool!.handler({}, mockContext);

      expect(mockHttpClient.get).toHaveBeenCalledWith('/referencias/situacoesMesa');
      expect(result.content[0]?.text).toContain('Exercício');
    });
  });

  describe('referencias_situacoes_membro', () => {
    it('should call API with correct endpoint', async () => {
      const mockResponse = {
        data: { dados: [{ id: 1, situacao: 'Titular' }] },
        status: 200,
        headers: {},
      };
      vi.mocked(mockHttpClient.get).mockResolvedValue(mockResponse);

      const tool = referenceTools.find(t => t.name === 'referencias_situacoes_membro');
      expect(tool).toBeDefined();

      const result = await tool!.handler({}, mockContext);

      expect(mockHttpClient.get).toHaveBeenCalledWith('/referencias/situacoesMembro');
      expect(result.content[0]?.text).toContain('Titular');
    });
  });

  describe('referencias_situacoes_votacao', () => {
    it('should call API with correct endpoint', async () => {
      const mockResponse = {
        data: { dados: [{ id: 1, situacao: 'Encerrada' }] },
        status: 200,
        headers: {},
      };
      vi.mocked(mockHttpClient.get).mockResolvedValue(mockResponse);

      const tool = referenceTools.find(t => t.name === 'referencias_situacoes_votacao');
      expect(tool).toBeDefined();

      const result = await tool!.handler({}, mockContext);

      expect(mockHttpClient.get).toHaveBeenCalledWith('/referencias/situacoesVotacao');
      expect(result.content[0]?.text).toContain('Encerrada');
    });
  });

  describe('Tool Name Verification', () => {
    const expectedToolNames = [
      'referencias_situacoes_deputado',
      'referencias_tipos_proposicao',
      'referencias_tipos_evento',
      'referencias_ufs',
      'referencias_tipos_orgao',
      'referencias_tipos_autor',
      'referencias_tipos_tramitacao',
      'referencias_situacoes_proposicao',
      'referencias_situacoes_evento',
      'referencias_situacoes_orgao',
      'referencias_codigos_tipo_autor',
      'referencias_situacoes_mesa',
      'referencias_situacoes_membro',
      'referencias_situacoes_votacao',
      'referencias_legislaturas',
    ];

    it('should have all expected tool names', () => {
      const actualNames = referenceTools.map(t => t.name);
      expectedToolNames.forEach(name => {
        expect(actualNames).toContain(name);
      });
    });
  });
});
