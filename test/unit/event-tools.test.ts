/**
 * Tests for event tool implementations
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { eventTools } from '../../lib/tools/event-tools.js';
import type { ToolContext } from '../../lib/core/tools.js';
import type { CamaraHttpClient } from '../../lib/core/http-client.js';
import type { CacheLayer } from '../../lib/core/cache.js';
import type { Logger } from '../../lib/shared/utils/logger.js';

describe('Event Tools', () => {
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
    it('should export exactly 7 event tools', () => {
      expect(eventTools).toHaveLength(7);
    });

    it('should have all required properties for each tool', () => {
      eventTools.forEach(tool => {
        expect(tool).toHaveProperty('name');
        expect(tool).toHaveProperty('description');
        expect(tool).toHaveProperty('inputSchema');
        expect(tool).toHaveProperty('handler');
        expect(tool).toHaveProperty('category');
        expect(tool.category).toBe('events');
      });
    });

    it('should have unique tool names', () => {
      const names = eventTools.map(t => t.name);
      const uniqueNames = new Set(names);
      expect(uniqueNames.size).toBe(names.length);
    });
  });

  describe('eventos_listar', () => {
    it('should call API with correct endpoint and parameters', async () => {
      const mockResponse = {
        data: { dados: [{ id: 1, descricao: 'Test Event', dataHoraInicio: '2024-01-15T10:00:00' }] },
        status: 200,
        headers: {},
      };
      vi.mocked(mockHttpClient.get).mockResolvedValue(mockResponse);

      const tool = eventTools.find(t => t.name === 'eventos_listar');
      expect(tool).toBeDefined();

      const result = await tool!.handler(
        { dataInicio: '2024-01-01', dataFim: '2024-12-31', pagina: 1, itens: 10 },
        mockContext
      );

      expect(mockHttpClient.get).toHaveBeenCalledWith('/eventos', {
        dataInicio: '2024-01-01',
        dataFim: '2024-12-31',
        pagina: 1,
        itens: 10,
      });
      expect(result.content[0]?.text).toContain('Test Event');
    });

    it('should handle filters with organ and event type', async () => {
      const mockResponse = {
        data: { dados: [] },
        status: 200,
        headers: {},
      };
      vi.mocked(mockHttpClient.get).mockResolvedValue(mockResponse);

      const tool = eventTools.find(t => t.name === 'eventos_listar');
      const result = await tool!.handler(
        { idOrgao: 123, codTipoEvento: 456 },
        mockContext
      );

      expect(mockHttpClient.get).toHaveBeenCalledWith('/eventos', {
        idOrgao: 123,
        codTipoEvento: 456,
      });
      expect(result.isError).toBeUndefined();
    });

    it('should handle time range filters', async () => {
      const mockResponse = {
        data: { dados: [] },
        status: 200,
        headers: {},
      };
      vi.mocked(mockHttpClient.get).mockResolvedValue(mockResponse);

      const tool = eventTools.find(t => t.name === 'eventos_listar');
      const result = await tool!.handler(
        { horaInicio: '09:00', horaFim: '18:00' },
        mockContext
      );

      expect(mockHttpClient.get).toHaveBeenCalledWith('/eventos', {
        horaInicio: '09:00',
        horaFim: '18:00',
      });
      expect(result.isError).toBeUndefined();
    });
  });

  describe('evento_detalhes', () => {
    it('should call API with event ID', async () => {
      const mockResponse = {
        data: {
          dados: {
            id: 123,
            descricao: 'Committee Meeting',
            dataHoraInicio: '2024-01-15T10:00:00',
            situacao: 'Realizada',
            descricaoTipo: 'Reunião Deliberativa',
          },
        },
        status: 200,
        headers: {},
      };
      vi.mocked(mockHttpClient.get).mockResolvedValue(mockResponse);

      const tool = eventTools.find(t => t.name === 'evento_detalhes');
      expect(tool).toBeDefined();

      const result = await tool!.handler({ id: 123 }, mockContext);

      expect(mockHttpClient.get).toHaveBeenCalledWith('/eventos/123');
      expect(result.content[0]?.text).toContain('Committee Meeting');
      expect(result.content[0]?.text).toContain('Realizada');
    });
  });

  describe('evento_pauta', () => {
    it('should call API with event ID and pagination', async () => {
      const mockResponse = {
        data: {
          dados: [
            { proposicao_: { id: 1, ementa: 'Bill about X' } },
            { proposicao_: { id: 2, ementa: 'Bill about Y' } },
          ],
        },
        status: 200,
        headers: {},
      };
      vi.mocked(mockHttpClient.get).mockResolvedValue(mockResponse);

      const tool = eventTools.find(t => t.name === 'evento_pauta');
      expect(tool).toBeDefined();

      const result = await tool!.handler(
        { id: 123, pagina: 1, itens: 50 },
        mockContext
      );

      expect(mockHttpClient.get).toHaveBeenCalledWith('/eventos/123/pauta', {
        pagina: 1,
        itens: 50,
      });
      expect(result.content[0]?.text).toContain('Bill about X');
    });
  });

  describe('evento_deputados', () => {
    it('should call API with event ID and pagination', async () => {
      const mockResponse = {
        data: {
          dados: [
            { id: 1, nome: 'Deputy A' },
            { id: 2, nome: 'Deputy B' },
          ],
        },
        status: 200,
        headers: {},
      };
      vi.mocked(mockHttpClient.get).mockResolvedValue(mockResponse);

      const tool = eventTools.find(t => t.name === 'evento_deputados');
      expect(tool).toBeDefined();

      const result = await tool!.handler(
        { id: 123, pagina: 1, itens: 50 },
        mockContext
      );

      expect(mockHttpClient.get).toHaveBeenCalledWith('/eventos/123/deputados', {
        pagina: 1,
        itens: 50,
      });
      expect(result.content[0]?.text).toContain('Deputy A');
    });
  });

  describe('evento_orgaos', () => {
    it('should call API with event ID', async () => {
      const mockResponse = {
        data: {
          dados: [
            { id: 1, sigla: 'CCJC', nome: 'Comissão de Constituição e Justiça' },
            { id: 2, sigla: 'CFT', nome: 'Comissão de Finanças e Tributação' },
          ],
        },
        status: 200,
        headers: {},
      };
      vi.mocked(mockHttpClient.get).mockResolvedValue(mockResponse);

      const tool = eventTools.find(t => t.name === 'evento_orgaos');
      expect(tool).toBeDefined();

      const result = await tool!.handler({ id: 123 }, mockContext);

      expect(mockHttpClient.get).toHaveBeenCalledWith('/eventos/123/orgaos');
      expect(result.content[0]?.text).toContain('CCJC');
      expect(result.content[0]?.text).toContain('Comissão de Constituição e Justiça');
    });
  });

  describe('evento_votacoes', () => {
    it('should call API with event ID and pagination', async () => {
      const mockResponse = {
        data: {
          dados: [
            { id: '12345-1', descricao: 'Vote on Bill 123', aprovacao: 1 },
            { id: '12345-2', descricao: 'Vote on Bill 456', aprovacao: 0 },
          ],
        },
        status: 200,
        headers: {},
      };
      vi.mocked(mockHttpClient.get).mockResolvedValue(mockResponse);

      const tool = eventTools.find(t => t.name === 'evento_votacoes');
      expect(tool).toBeDefined();

      const result = await tool!.handler(
        { id: 123, pagina: 1, itens: 50 },
        mockContext
      );

      expect(mockHttpClient.get).toHaveBeenCalledWith('/eventos/123/votacoes', {
        pagina: 1,
        itens: 50,
      });
      expect(result.content[0]?.text).toContain('Vote on Bill 123');
    });
  });

  describe('evento_situacoes', () => {
    it('should call API with event ID', async () => {
      const mockResponse = {
        data: {
          dados: [
            { situacao: 'Convocada', dataHora: '2024-01-10T08:00:00' },
            { situacao: 'Realizada', dataHora: '2024-01-15T10:00:00' },
          ],
        },
        status: 200,
        headers: {},
      };
      vi.mocked(mockHttpClient.get).mockResolvedValue(mockResponse);

      const tool = eventTools.find(t => t.name === 'evento_situacoes');
      expect(tool).toBeDefined();

      const result = await tool!.handler({ id: 123 }, mockContext);

      expect(mockHttpClient.get).toHaveBeenCalledWith('/eventos/123/situacoes');
      expect(result.content[0]?.text).toContain('Convocada');
      expect(result.content[0]?.text).toContain('Realizada');
    });
  });

  describe('Tool Name Verification', () => {
    const expectedToolNames = [
      'eventos_listar',
      'evento_detalhes',
      'evento_pauta',
      'evento_deputados',
      'evento_orgaos',
      'evento_votacoes',
      'evento_situacoes',
    ];

    it('should have all expected tool names', () => {
      const actualNames = eventTools.map(t => t.name);
      expectedToolNames.forEach(name => {
        expect(actualNames).toContain(name);
      });
    });
  });
});
