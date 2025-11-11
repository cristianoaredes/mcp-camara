/**
 * Tests for proposition tool implementations
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { propositionTools } from '../lib/tools/proposition-tools.js';
import type { ToolContext } from '../lib/core/tools.js';
import type { CamaraHttpClient } from '../lib/core/http-client.js';
import type { CacheLayer } from '../lib/core/cache.js';
import type { Logger } from '../lib/shared/utils/logger.js';

describe('Proposition Tools', () => {
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
    it('should export exactly 10 proposition tools', () => {
      expect(propositionTools).toHaveLength(10);
    });

    it('should have all required properties for each tool', () => {
      propositionTools.forEach(tool => {
        expect(tool).toHaveProperty('name');
        expect(tool).toHaveProperty('description');
        expect(tool).toHaveProperty('inputSchema');
        expect(tool).toHaveProperty('handler');
        expect(tool).toHaveProperty('category');
        expect(tool.category).toBe('propositions');
      });
    });

    it('should have unique tool names', () => {
      const names = propositionTools.map(t => t.name);
      const uniqueNames = new Set(names);
      expect(uniqueNames.size).toBe(names.length);
    });
  });

  describe('proposicoes_listar', () => {
    it('should call API with correct endpoint and parameters', async () => {
      const mockResponse = {
        data: { dados: [{ id: 1, siglaTipo: 'PL', numero: 1234, ano: 2024 }] },
        status: 200,
        headers: {},
      };
      vi.mocked(mockHttpClient.get).mockResolvedValue(mockResponse);

      const tool = propositionTools.find(t => t.name === 'proposicoes_listar');
      expect(tool).toBeDefined();

      const result = await tool!.handler(
        { siglaTipo: 'PL', ano: 2024, pagina: 1, itens: 10 },
        mockContext
      );

      expect(mockHttpClient.get).toHaveBeenCalledWith('/proposicoes', {
        siglaTipo: 'PL',
        ano: 2024,
        pagina: 1,
        itens: 10,
      });
      expect(result.content[0]?.text).toContain('PL');
    });

    it('should handle empty filters', async () => {
      const mockResponse = {
        data: { dados: [] },
        status: 200,
        headers: {},
      };
      vi.mocked(mockHttpClient.get).mockResolvedValue(mockResponse);

      const tool = propositionTools.find(t => t.name === 'proposicoes_listar');
      const result = await tool!.handler({}, mockContext);

      expect(mockHttpClient.get).toHaveBeenCalledWith('/proposicoes', {});
      expect(result.isError).toBeUndefined();
    });
  });

  describe('proposicao_detalhes', () => {
    it('should call API with proposition ID', async () => {
      const mockResponse = {
        data: { dados: { id: 123, siglaTipo: 'PL', numero: 1234, ementa: 'Test proposition' } },
        status: 200,
        headers: {},
      };
      vi.mocked(mockHttpClient.get).mockResolvedValue(mockResponse);

      const tool = propositionTools.find(t => t.name === 'proposicao_detalhes');
      expect(tool).toBeDefined();

      const result = await tool!.handler({ id: 123 }, mockContext);

      expect(mockHttpClient.get).toHaveBeenCalledWith('/proposicoes/123');
      expect(result.content[0]?.text).toContain('Test proposition');
    });
  });

  describe('proposicao_autores', () => {
    it('should call API with proposition ID', async () => {
      const mockResponse = {
        data: { dados: [{ nome: 'Deputy Author', tipo: 'Deputado' }] },
        status: 200,
        headers: {},
      };
      vi.mocked(mockHttpClient.get).mockResolvedValue(mockResponse);

      const tool = propositionTools.find(t => t.name === 'proposicao_autores');
      expect(tool).toBeDefined();

      const result = await tool!.handler({ id: 123 }, mockContext);

      expect(mockHttpClient.get).toHaveBeenCalledWith('/proposicoes/123/autores', {});
      expect(result.content[0]?.text).toContain('Deputy Author');
    });
  });

  describe('proposicao_tramitacoes', () => {
    it('should call API with proposition ID', async () => {
      const mockResponse = {
        data: { dados: [{ dataHora: '2024-01-01T10:00:00', descricaoTramitacao: 'Sent to committee' }] },
        status: 200,
        headers: {},
      };
      vi.mocked(mockHttpClient.get).mockResolvedValue(mockResponse);

      const tool = propositionTools.find(t => t.name === 'proposicao_tramitacoes');
      expect(tool).toBeDefined();

      const result = await tool!.handler({ id: 123 }, mockContext);

      expect(mockHttpClient.get).toHaveBeenCalledWith('/proposicoes/123/tramitacoes', {});
      expect(result.content[0]?.text).toContain('Sent to committee');
    });
  });

  describe('proposicao_votacoes', () => {
    it('should call API with proposition ID', async () => {
      const mockResponse = {
        data: { dados: [{ id: '1', data: '2024-01-01', aprovacao: 1 }] },
        status: 200,
        headers: {},
      };
      vi.mocked(mockHttpClient.get).mockResolvedValue(mockResponse);

      const tool = propositionTools.find(t => t.name === 'proposicao_votacoes');
      expect(tool).toBeDefined();

      const result = await tool!.handler({ id: 123 }, mockContext);

      expect(mockHttpClient.get).toHaveBeenCalledWith('/proposicoes/123/votacoes', {});
      expect(result.content[0]?.text).toContain('2024-01-01');
    });
  });

  describe('proposicao_relacionadas', () => {
    it('should call API with proposition ID', async () => {
      const mockResponse = {
        data: { dados: [{ id: 456, siglaTipo: 'EMC', numero: 100 }] },
        status: 200,
        headers: {},
      };
      vi.mocked(mockHttpClient.get).mockResolvedValue(mockResponse);

      const tool = propositionTools.find(t => t.name === 'proposicao_relacionadas');
      expect(tool).toBeDefined();

      const result = await tool!.handler({ id: 123 }, mockContext);

      expect(mockHttpClient.get).toHaveBeenCalledWith('/proposicoes/123/relacionadas', {});
      expect(result.content[0]?.text).toContain('EMC');
    });
  });

  describe('proposicao_temas', () => {
    it('should call API with proposition ID', async () => {
      const mockResponse = {
        data: { dados: [{ tema: 'Educação', relevancia: 1 }] },
        status: 200,
        headers: {},
      };
      vi.mocked(mockHttpClient.get).mockResolvedValue(mockResponse);

      const tool = propositionTools.find(t => t.name === 'proposicao_temas');
      expect(tool).toBeDefined();

      const result = await tool!.handler({ id: 123 }, mockContext);

      expect(mockHttpClient.get).toHaveBeenCalledWith('/proposicoes/123/temas');
      expect(result.content[0]?.text).toContain('Educação');
    });
  });

  describe('proposicao_texto', () => {
    it('should call API with proposition ID', async () => {
      const mockResponse = {
        data: { dados: { texto: 'Full text of the bill...', justificativa: 'Justification...' } },
        status: 200,
        headers: {},
      };
      vi.mocked(mockHttpClient.get).mockResolvedValue(mockResponse);

      const tool = propositionTools.find(t => t.name === 'proposicao_texto');
      expect(tool).toBeDefined();

      const result = await tool!.handler({ id: 123 }, mockContext);

      expect(mockHttpClient.get).toHaveBeenCalledWith('/proposicoes/123/texto');
      expect(result.content[0]?.text).toContain('Full text of the bill');
    });
  });

  describe('proposicao_situacoes', () => {
    it('should call API with proposition ID', async () => {
      const mockResponse = {
        data: { dados: [{ descricaoSituacao: 'Aprovada', dataHora: '2024-01-15T10:00:00' }] },
        status: 200,
        headers: {},
      };
      vi.mocked(mockHttpClient.get).mockResolvedValue(mockResponse);

      const tool = propositionTools.find(t => t.name === 'proposicao_situacoes');
      expect(tool).toBeDefined();

      const result = await tool!.handler({ id: 123 }, mockContext);

      expect(mockHttpClient.get).toHaveBeenCalledWith('/proposicoes/123/situacoes', {});
      expect(result.content[0]?.text).toContain('Aprovada');
    });
  });

  describe('proposicao_apensadas', () => {
    it('should call API with proposition ID', async () => {
      const mockResponse = {
        data: { dados: [{ id: 789, siglaTipo: 'PL', numero: 5000 }] },
        status: 200,
        headers: {},
      };
      vi.mocked(mockHttpClient.get).mockResolvedValue(mockResponse);

      const tool = propositionTools.find(t => t.name === 'proposicao_apensadas');
      expect(tool).toBeDefined();

      const result = await tool!.handler({ id: 123 }, mockContext);

      expect(mockHttpClient.get).toHaveBeenCalledWith('/proposicoes/123/apensadas', {});
      expect(result.content[0]?.text).toContain('5000');
    });
  });

  describe('Tool Name Verification', () => {
    const expectedToolNames = [
      'proposicoes_listar',
      'proposicao_detalhes',
      'proposicao_autores',
      'proposicao_relacionadas',
      'proposicao_temas',
      'proposicao_tramitacoes',
      'proposicao_votacoes',
      'proposicao_texto',
      'proposicao_situacoes',
      'proposicao_apensadas',
    ];

    it('should have all expected tool names', () => {
      const actualNames = propositionTools.map(t => t.name);
      expectedToolNames.forEach(name => {
        expect(actualNames).toContain(name);
      });
    });
  });
});
