/**
 * Tests for party and bloc tool implementations
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { partyTools } from '../lib/tools/party-tools.js';
import type { ToolContext } from '../lib/core/tools.js';
import type { CamaraHttpClient } from '../lib/core/http-client.js';
import type { CacheLayer } from '../lib/core/cache.js';
import type { Logger } from '../lib/shared/utils/logger.js';

describe('Party Tools', () => {
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
    it('should export exactly 6 party tools', () => {
      expect(partyTools).toHaveLength(6);
    });

    it('should have all required properties for each tool', () => {
      partyTools.forEach(tool => {
        expect(tool).toHaveProperty('name');
        expect(tool).toHaveProperty('description');
        expect(tool).toHaveProperty('inputSchema');
        expect(tool).toHaveProperty('handler');
        expect(tool).toHaveProperty('category');
        expect(tool.category).toBe('parties');
      });
    });

    it('should have unique tool names', () => {
      const names = partyTools.map(t => t.name);
      const uniqueNames = new Set(names);
      expect(uniqueNames.size).toBe(names.length);
    });
  });

  describe('partidos_listar', () => {
    it('should call API with correct endpoint', async () => {
      const mockResponse = {
        data: { dados: [{ id: 1, sigla: 'PT', nome: 'Partido dos Trabalhadores' }] },
        status: 200,
        headers: {},
      };
      vi.mocked(mockHttpClient.get).mockResolvedValue(mockResponse);

      const tool = partyTools.find(t => t.name === 'partidos_listar');
      expect(tool).toBeDefined();

      const result = await tool!.handler({}, mockContext);

      expect(mockHttpClient.get).toHaveBeenCalledWith('/partidos', {});
      expect(result.content[0]?.text).toContain('PT');
    });
  });

  describe('partido_detalhes', () => {
    it('should call API with party ID', async () => {
      const mockResponse = {
        data: { dados: { id: 123, sigla: 'PT', nome: 'Partido dos Trabalhadores' } },
        status: 200,
        headers: {},
      };
      vi.mocked(mockHttpClient.get).mockResolvedValue(mockResponse);

      const tool = partyTools.find(t => t.name === 'partido_detalhes');
      expect(tool).toBeDefined();

      const result = await tool!.handler({ id: 123 }, mockContext);

      expect(mockHttpClient.get).toHaveBeenCalledWith('/partidos/123');
      expect(result.content[0]?.text).toContain('PT');
    });
  });

  describe('partido_membros', () => {
    it('should call API with party ID and date filters', async () => {
      const mockResponse = {
        data: { dados: [{ nome: 'Deputy Member', siglaUf: 'SP' }] },
        status: 200,
        headers: {},
      };
      vi.mocked(mockHttpClient.get).mockResolvedValue(mockResponse);

      const tool = partyTools.find(t => t.name === 'partido_membros');
      expect(tool).toBeDefined();

      const result = await tool!.handler(
        { id: 123, dataInicio: '2024-01-01' },
        mockContext
      );

      expect(mockHttpClient.get).toHaveBeenCalledWith('/partidos/123/membros', {
        dataInicio: '2024-01-01',
      });
      expect(result.content[0]?.text).toContain('Deputy Member');
    });
  });

  describe('partido_lideres', () => {
    it('should call API with party ID', async () => {
      const mockResponse = {
        data: { dados: [{ nome: 'Party Leader', cargo: 'Líder' }] },
        status: 200,
        headers: {},
      };
      vi.mocked(mockHttpClient.get).mockResolvedValue(mockResponse);

      const tool = partyTools.find(t => t.name === 'partido_lideres');
      expect(tool).toBeDefined();

      const result = await tool!.handler({ id: 123 }, mockContext);

      expect(mockHttpClient.get).toHaveBeenCalledWith('/partidos/123/lideres', {});
      expect(result.content[0]?.text).toContain('Party Leader');
    });
  });

  describe('blocos_listar', () => {
    it('should call API with correct endpoint', async () => {
      const mockResponse = {
        data: { dados: [{ id: 1, nome: 'Bloco Parlamentar', idLegislatura: 56 }] },
        status: 200,
        headers: {},
      };
      vi.mocked(mockHttpClient.get).mockResolvedValue(mockResponse);

      const tool = partyTools.find(t => t.name === 'blocos_listar');
      expect(tool).toBeDefined();

      const result = await tool!.handler({}, mockContext);

      expect(mockHttpClient.get).toHaveBeenCalledWith('/blocos', {});
      expect(result.content[0]?.text).toContain('Bloco Parlamentar');
    });
  });

  describe('bloco_detalhes', () => {
    it('should call API with bloc ID', async () => {
      const mockResponse = {
        data: { dados: { id: 123, nome: 'Bloco Parlamentar', idLegislatura: 56 } },
        status: 200,
        headers: {},
      };
      vi.mocked(mockHttpClient.get).mockResolvedValue(mockResponse);

      const tool = partyTools.find(t => t.name === 'bloco_detalhes');
      expect(tool).toBeDefined();

      const result = await tool!.handler({ id: 123 }, mockContext);

      expect(mockHttpClient.get).toHaveBeenCalledWith('/blocos/123');
      expect(result.content[0]?.text).toContain('Bloco Parlamentar');
    });
  });

  describe('Tool Name Verification', () => {
    const expectedToolNames = [
      'partidos_listar',
      'partido_detalhes',
      'partido_membros',
      'partido_lideres',
      'blocos_listar',
      'bloco_detalhes',
    ];

    it('should have all expected tool names', () => {
      const actualNames = partyTools.map(t => t.name);
      expectedToolNames.forEach(name => {
        expect(actualNames).toContain(name);
      });
    });
  });
});
