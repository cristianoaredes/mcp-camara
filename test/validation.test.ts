import { describe, it, expect } from 'vitest';
import {
  DeputyIdSchema,
  DateSchema,
  UFSchema,
  PaginationSchema,
  DeputadosListarSchema,
  DeputadoDespesasSchema,
  DeputadoDetalhesSchema,
  ProposicoesListarSchema,
  ProposicaoDetalhesSchema,
  VotacoesListarSchema,
  VotacaoDetalhesSchema,
  EventosListarSchema,
  EventoDetalhesSchema,
  OrgaosListarSchema,
  OrgaoDetalhesSchema,
  PartidosListarSchema,
  PartidoDetalhesSchema,
  BlocosListarSchema,
  ReferenciasSituacoesDeputadoSchema,
  ReferenciasUfsSchema,
  ReferenciasLegislaturasSchema,
  ToolSchemas,
  validateInput,
  validateToolInput,
  type ToolName,
} from '../lib/core/validation.js';
import { ValidationError } from '../lib/shared/utils/errors.js';

describe('Common Validation Schemas', () => {
  describe('DeputyIdSchema', () => {
    it('should accept positive integers', () => {
      expect(() => validateInput(DeputyIdSchema, 123)).not.toThrow();
      expect(() => validateInput(DeputyIdSchema, 1)).not.toThrow();
      expect(() => validateInput(DeputyIdSchema, 999999)).not.toThrow();
    });

    it('should reject negative numbers', () => {
      expect(() => validateInput(DeputyIdSchema, -1)).toThrow(ValidationError);
      expect(() => validateInput(DeputyIdSchema, -100)).toThrow(ValidationError);
    });

    it('should reject zero', () => {
      expect(() => validateInput(DeputyIdSchema, 0)).toThrow(ValidationError);
    });

    it('should reject non-integers', () => {
      expect(() => validateInput(DeputyIdSchema, 1.5)).toThrow(ValidationError);
      expect(() => validateInput(DeputyIdSchema, 3.14)).toThrow(ValidationError);
    });

    it('should reject non-numbers', () => {
      expect(() => validateInput(DeputyIdSchema, 'abc')).toThrow(ValidationError);
      expect(() => validateInput(DeputyIdSchema, '123')).toThrow(ValidationError);
      expect(() => validateInput(DeputyIdSchema, null)).toThrow(ValidationError);
      expect(() => validateInput(DeputyIdSchema, undefined)).toThrow(ValidationError);
    });
  });

  describe('DateSchema', () => {
    it('should accept valid YYYY-MM-DD dates', () => {
      expect(() => validateInput(DateSchema, '2024-01-15')).not.toThrow();
      expect(() => validateInput(DateSchema, '2023-12-31')).not.toThrow();
      expect(() => validateInput(DateSchema, '2020-02-29')).not.toThrow();
      expect(() => validateInput(DateSchema, '1900-01-01')).not.toThrow();
    });

    it('should reject invalid date formats', () => {
      expect(() => validateInput(DateSchema, '2024/01/15')).toThrow(ValidationError);
      expect(() => validateInput(DateSchema, '15-01-2024')).toThrow(ValidationError);
      expect(() => validateInput(DateSchema, 'invalid')).toThrow(ValidationError);
      expect(() => validateInput(DateSchema, '24-01-15')).toThrow(ValidationError);
      expect(() => validateInput(DateSchema, '2024-1-15')).toThrow(ValidationError);
      expect(() => validateInput(DateSchema, '2024-01-5')).toThrow(ValidationError);
    });

    it('should reject non-string values', () => {
      expect(() => validateInput(DateSchema, 20240115)).toThrow(ValidationError);
      expect(() => validateInput(DateSchema, null)).toThrow(ValidationError);
      expect(() => validateInput(DateSchema, undefined)).toThrow(ValidationError);
    });
  });

  describe('UFSchema', () => {
    it('should accept valid Brazilian state codes', () => {
      expect(() => validateInput(UFSchema, 'SP')).not.toThrow();
      expect(() => validateInput(UFSchema, 'RJ')).not.toThrow();
      expect(() => validateInput(UFSchema, 'DF')).not.toThrow();
      expect(() => validateInput(UFSchema, 'AC')).not.toThrow();
      expect(() => validateInput(UFSchema, 'TO')).not.toThrow();
    });

    it('should reject invalid state codes', () => {
      expect(() => validateInput(UFSchema, 'XX')).toThrow(ValidationError);
      expect(() => validateInput(UFSchema, 'sp')).toThrow(ValidationError);
      expect(() => validateInput(UFSchema, 'ZZ')).toThrow(ValidationError);
      expect(() => validateInput(UFSchema, 'ABC')).toThrow(ValidationError);
    });

    it('should reject non-string values', () => {
      expect(() => validateInput(UFSchema, 123)).toThrow(ValidationError);
      expect(() => validateInput(UFSchema, null)).toThrow(ValidationError);
      expect(() => validateInput(UFSchema, undefined)).toThrow(ValidationError);
    });
  });

  describe('PaginationSchema', () => {
    it('should accept valid pagination parameters', () => {
      expect(() => validateInput(PaginationSchema, { pagina: 1, itens: 50 })).not.toThrow();
      expect(() => validateInput(PaginationSchema, { pagina: 10 })).not.toThrow();
      expect(() => validateInput(PaginationSchema, { itens: 100 })).not.toThrow();
      expect(() => validateInput(PaginationSchema, { itens: 1 })).not.toThrow();
      expect(() => validateInput(PaginationSchema, {})).not.toThrow();
    });

    it('should reject items over 100', () => {
      expect(() => validateInput(PaginationSchema, { itens: 101 })).toThrow(ValidationError);
      expect(() => validateInput(PaginationSchema, { itens: 200 })).toThrow(ValidationError);
    });

    it('should reject items less than 1', () => {
      expect(() => validateInput(PaginationSchema, { itens: 0 })).toThrow(ValidationError);
      expect(() => validateInput(PaginationSchema, { itens: -1 })).toThrow(ValidationError);
    });

    it('should reject zero or negative page numbers', () => {
      expect(() => validateInput(PaginationSchema, { pagina: 0 })).toThrow(ValidationError);
      expect(() => validateInput(PaginationSchema, { pagina: -1 })).toThrow(ValidationError);
    });

    it('should reject non-integer values', () => {
      expect(() => validateInput(PaginationSchema, { pagina: 1.5 })).toThrow(ValidationError);
      expect(() => validateInput(PaginationSchema, { itens: 50.5 })).toThrow(ValidationError);
    });
  });
});

describe('Deputy Tool Schemas', () => {
  describe('DeputadosListarSchema', () => {
    it('should accept valid filter parameters', () => {
      const valid = {
        nome: 'João',
        siglaUf: 'SP' as const,
        siglaPartido: 'PT',
        siglaSexo: 'M' as const,
        pagina: 1,
        itens: 50,
      };
      expect(() => validateInput(DeputadosListarSchema, valid)).not.toThrow();
    });

    it('should accept empty object', () => {
      expect(() => validateInput(DeputadosListarSchema, {})).not.toThrow();
    });

    it('should accept partial parameters', () => {
      expect(() => validateInput(DeputadosListarSchema, { nome: 'Maria' })).not.toThrow();
      expect(() => validateInput(DeputadosListarSchema, { siglaUf: 'RJ' })).not.toThrow();
      expect(() => validateInput(DeputadosListarSchema, { id: 123 })).not.toThrow();
    });

    it('should validate date range', () => {
      const validRange = {
        dataInicio: '2024-01-01',
        dataFim: '2024-12-31',
      };
      expect(() => validateInput(DeputadosListarSchema, validRange)).not.toThrow();

      const invalidRange = {
        dataInicio: '2024-12-31',
        dataFim: '2024-01-01',
      };
      expect(() => validateInput(DeputadosListarSchema, invalidRange)).toThrow(ValidationError);
    });

    it('should reject invalid sex values', () => {
      expect(() => validateInput(DeputadosListarSchema, { siglaSexo: 'X' })).toThrow(ValidationError);
      expect(() => validateInput(DeputadosListarSchema, { siglaSexo: 'm' })).toThrow(ValidationError);
    });

    it('should reject empty string for nome', () => {
      expect(() => validateInput(DeputadosListarSchema, { nome: '' })).toThrow(ValidationError);
    });
  });

  describe('DeputadoDespesasSchema', () => {
    it('should accept valid parameters', () => {
      const valid = {
        id: 123,
        dataInicio: '2024-01-01',
        dataFim: '2024-12-31',
        pagina: 1,
        itens: 50,
      };
      expect(() => validateInput(DeputadoDespesasSchema, valid)).not.toThrow();
    });

    it('should require deputy id', () => {
      expect(() => validateInput(DeputadoDespesasSchema, {})).toThrow(ValidationError);
    });

    it('should validate date range', () => {
      const invalidRange = {
        id: 123,
        dataInicio: '2024-12-31',
        dataFim: '2024-01-01',
      };
      expect(() => validateInput(DeputadoDespesasSchema, invalidRange)).toThrow(ValidationError);
    });
  });

  describe('DeputadoDetalhesSchema', () => {
    it('should accept valid deputy id', () => {
      expect(() => validateInput(DeputadoDetalhesSchema, { id: 123 })).not.toThrow();
    });

    it('should reject missing id', () => {
      expect(() => validateInput(DeputadoDetalhesSchema, {})).toThrow(ValidationError);
    });

    it('should reject invalid id', () => {
      expect(() => validateInput(DeputadoDetalhesSchema, { id: -1 })).toThrow(ValidationError);
      expect(() => validateInput(DeputadoDetalhesSchema, { id: 'abc' })).toThrow(ValidationError);
    });
  });
});

describe('Proposition Tool Schemas', () => {
  describe('ProposicoesListarSchema', () => {
    it('should accept valid filter parameters', () => {
      const valid = {
        siglaTipo: 'PL',
        numero: 1234,
        ano: 2024,
        keywords: 'educação',
        pagina: 1,
        itens: 50,
      };
      expect(() => validateInput(ProposicoesListarSchema, valid)).not.toThrow();
    });

    it('should accept empty object', () => {
      expect(() => validateInput(ProposicoesListarSchema, {})).not.toThrow();
    });

    it('should accept partial parameters', () => {
      expect(() => validateInput(ProposicoesListarSchema, { siglaTipo: 'PEC' })).not.toThrow();
      expect(() => validateInput(ProposicoesListarSchema, { numero: 100 })).not.toThrow();
      expect(() => validateInput(ProposicoesListarSchema, { tramitacaoSenado: true })).not.toThrow();
    });

    it('should reject invalid year', () => {
      expect(() => validateInput(ProposicoesListarSchema, { ano: 1800 })).toThrow(ValidationError);
      expect(() => validateInput(ProposicoesListarSchema, { ano: 2100 })).toThrow(ValidationError);
    });

    it('should accept current year', () => {
      const currentYear = new Date().getFullYear();
      expect(() => validateInput(ProposicoesListarSchema, { ano: currentYear })).not.toThrow();
    });

    it('should reject negative numero', () => {
      expect(() => validateInput(ProposicoesListarSchema, { numero: -1 })).toThrow(ValidationError);
      expect(() => validateInput(ProposicoesListarSchema, { numero: 0 })).toThrow(ValidationError);
    });
  });

  describe('ProposicaoDetalhesSchema', () => {
    it('should accept valid proposition id', () => {
      expect(() => validateInput(ProposicaoDetalhesSchema, { id: 12345 })).not.toThrow();
    });

    it('should reject missing id', () => {
      expect(() => validateInput(ProposicaoDetalhesSchema, {})).toThrow(ValidationError);
    });

    it('should reject invalid id', () => {
      expect(() => validateInput(ProposicaoDetalhesSchema, { id: -1 })).toThrow(ValidationError);
    });
  });
});

describe('Voting Tool Schemas', () => {
  describe('VotacoesListarSchema', () => {
    it('should accept valid filter parameters', () => {
      const valid = {
        idProposicao: 123,
        idOrgao: 456,
        dataInicio: '2024-01-01',
        dataFim: '2024-12-31',
      };
      expect(() => validateInput(VotacoesListarSchema, valid)).not.toThrow();
    });

    it('should accept empty object', () => {
      expect(() => validateInput(VotacoesListarSchema, {})).not.toThrow();
    });

    it('should accept string id', () => {
      expect(() => validateInput(VotacoesListarSchema, { id: '2024-123' })).not.toThrow();
    });

    it('should validate date range', () => {
      const invalidRange = {
        dataInicio: '2024-12-31',
        dataFim: '2024-01-01',
      };
      expect(() => validateInput(VotacoesListarSchema, invalidRange)).toThrow(ValidationError);
    });

    it('should reject invalid idProposicao', () => {
      expect(() => validateInput(VotacoesListarSchema, { idProposicao: -1 })).toThrow(ValidationError);
      expect(() => validateInput(VotacoesListarSchema, { idProposicao: 0 })).toThrow(ValidationError);
    });
  });

  describe('VotacaoDetalhesSchema', () => {
    it('should accept valid voting id', () => {
      expect(() => validateInput(VotacaoDetalhesSchema, { id: '2024-123' })).not.toThrow();
      expect(() => validateInput(VotacaoDetalhesSchema, { id: 'abc-def' })).not.toThrow();
    });

    it('should reject missing id', () => {
      expect(() => validateInput(VotacaoDetalhesSchema, {})).toThrow(ValidationError);
    });

    it('should reject non-string id', () => {
      expect(() => validateInput(VotacaoDetalhesSchema, { id: 123 })).toThrow(ValidationError);
    });
  });
});

describe('Event Tool Schemas', () => {
  describe('EventosListarSchema', () => {
    it('should accept valid filter parameters', () => {
      const valid = {
        idOrgao: 123,
        codTipoEvento: 1,
        dataInicio: '2024-01-01',
        dataFim: '2024-12-31',
        horaInicio: '09:00',
        horaFim: '18:00',
      };
      expect(() => validateInput(EventosListarSchema, valid)).not.toThrow();
    });

    it('should accept empty object', () => {
      expect(() => validateInput(EventosListarSchema, {})).not.toThrow();
    });

    it('should validate time format', () => {
      expect(() => validateInput(EventosListarSchema, { horaInicio: '9:00' })).toThrow(ValidationError);
      expect(() => validateInput(EventosListarSchema, { horaInicio: '09:0' })).toThrow(ValidationError);
      expect(() => validateInput(EventosListarSchema, { horaInicio: 'invalid' })).toThrow(ValidationError);
    });

    it('should accept valid time formats', () => {
      expect(() => validateInput(EventosListarSchema, { horaInicio: '00:00' })).not.toThrow();
      expect(() => validateInput(EventosListarSchema, { horaInicio: '23:59' })).not.toThrow();
      expect(() => validateInput(EventosListarSchema, { horaFim: '12:30' })).not.toThrow();
    });

    it('should validate date range', () => {
      const invalidRange = {
        dataInicio: '2024-12-31',
        dataFim: '2024-01-01',
      };
      expect(() => validateInput(EventosListarSchema, invalidRange)).toThrow(ValidationError);
    });

    it('should reject invalid ids', () => {
      expect(() => validateInput(EventosListarSchema, { id: -1 })).toThrow(ValidationError);
      expect(() => validateInput(EventosListarSchema, { idOrgao: 0 })).toThrow(ValidationError);
    });
  });

  describe('EventoDetalhesSchema', () => {
    it('should accept valid event id', () => {
      expect(() => validateInput(EventoDetalhesSchema, { id: 12345 })).not.toThrow();
    });

    it('should reject missing id', () => {
      expect(() => validateInput(EventoDetalhesSchema, {})).toThrow(ValidationError);
    });

    it('should reject invalid id', () => {
      expect(() => validateInput(EventoDetalhesSchema, { id: -1 })).toThrow(ValidationError);
    });
  });
});

describe('Committee Tool Schemas', () => {
  describe('OrgaosListarSchema', () => {
    it('should accept valid filter parameters', () => {
      const valid = {
        id: 123,
        sigla: 'CCJC',
        codTipoOrgao: 1,
        dataInicio: '2024-01-01',
        dataFim: '2024-12-31',
        pagina: 1,
        itens: 50,
      };
      expect(() => validateInput(OrgaosListarSchema, valid)).not.toThrow();
    });

    it('should accept empty object', () => {
      expect(() => validateInput(OrgaosListarSchema, {})).not.toThrow();
    });

    it('should reject invalid ids', () => {
      expect(() => validateInput(OrgaosListarSchema, { id: -1 })).toThrow(ValidationError);
      expect(() => validateInput(OrgaosListarSchema, { codTipoOrgao: 0 })).toThrow(ValidationError);
    });
  });

  describe('OrgaoDetalhesSchema', () => {
    it('should accept valid committee id', () => {
      expect(() => validateInput(OrgaoDetalhesSchema, { id: 123 })).not.toThrow();
    });

    it('should reject missing id', () => {
      expect(() => validateInput(OrgaoDetalhesSchema, {})).toThrow(ValidationError);
    });
  });
});

describe('Party Tool Schemas', () => {
  describe('PartidosListarSchema', () => {
    it('should accept valid filter parameters', () => {
      const valid = {
        sigla: 'PT',
        dataInicio: '2024-01-01',
        dataFim: '2024-12-31',
        pagina: 1,
        itens: 50,
      };
      expect(() => validateInput(PartidosListarSchema, valid)).not.toThrow();
    });

    it('should accept empty object', () => {
      expect(() => validateInput(PartidosListarSchema, {})).not.toThrow();
    });
  });

  describe('PartidoDetalhesSchema', () => {
    it('should accept valid party id', () => {
      expect(() => validateInput(PartidoDetalhesSchema, { id: 123 })).not.toThrow();
    });

    it('should reject missing id', () => {
      expect(() => validateInput(PartidoDetalhesSchema, {})).toThrow(ValidationError);
    });

    it('should reject invalid id', () => {
      expect(() => validateInput(PartidoDetalhesSchema, { id: -1 })).toThrow(ValidationError);
    });
  });

  describe('BlocosListarSchema', () => {
    it('should accept valid parameters', () => {
      expect(() => validateInput(BlocosListarSchema, { idLegislatura: 56 })).not.toThrow();
      expect(() => validateInput(BlocosListarSchema, {})).not.toThrow();
    });

    it('should reject invalid legislature id', () => {
      expect(() => validateInput(BlocosListarSchema, { idLegislatura: -1 })).toThrow(ValidationError);
    });
  });
});

describe('Reference Tool Schemas', () => {
  describe('ReferenciasSituacoesDeputadoSchema', () => {
    it('should accept empty object', () => {
      expect(() => validateInput(ReferenciasSituacoesDeputadoSchema, {})).not.toThrow();
    });
  });

  describe('ReferenciasUfsSchema', () => {
    it('should accept empty object', () => {
      expect(() => validateInput(ReferenciasUfsSchema, {})).not.toThrow();
    });
  });

  describe('ReferenciasLegislaturasSchema', () => {
    it('should accept valid pagination', () => {
      expect(() => validateInput(ReferenciasLegislaturasSchema, { pagina: 1, itens: 50 })).not.toThrow();
      expect(() => validateInput(ReferenciasLegislaturasSchema, {})).not.toThrow();
    });

    it('should reject invalid pagination', () => {
      expect(() => validateInput(ReferenciasLegislaturasSchema, { pagina: 0 })).toThrow(ValidationError);
      expect(() => validateInput(ReferenciasLegislaturasSchema, { itens: 101 })).toThrow(ValidationError);
    });
  });
});

describe('ToolSchemas Registry', () => {
  it('should contain all 62 tools', () => {
    const toolCount = Object.keys(ToolSchemas).length;
    expect(toolCount).toBe(62);
  });

  it('should have schemas for all deputy tools', () => {
    const deputyTools = [
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

    deputyTools.forEach(tool => {
      expect(ToolSchemas).toHaveProperty(tool);
    });
  });

  it('should have schemas for all proposition tools', () => {
    const propositionTools = [
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

    propositionTools.forEach(tool => {
      expect(ToolSchemas).toHaveProperty(tool);
    });
  });

  it('should have schemas for all voting tools', () => {
    const votingTools = [
      'votacoes_listar',
      'votacao_detalhes',
      'votacao_votos',
      'votacao_orientacoes',
    ];

    votingTools.forEach(tool => {
      expect(ToolSchemas).toHaveProperty(tool);
    });
  });

  it('should have schemas for all committee tools', () => {
    const committeeTools = [
      'orgaos_listar',
      'orgao_detalhes',
      'orgao_membros',
      'orgao_eventos',
      'orgao_votacoes',
    ];

    committeeTools.forEach(tool => {
      expect(ToolSchemas).toHaveProperty(tool);
    });
  });

  it('should have schemas for all party tools', () => {
    const partyTools = [
      'partidos_listar',
      'partido_detalhes',
      'partido_membros',
      'partido_lideres',
      'blocos_listar',
      'bloco_detalhes',
    ];

    partyTools.forEach(tool => {
      expect(ToolSchemas).toHaveProperty(tool);
    });
  });

  it('should have schemas for all event tools', () => {
    const eventTools = [
      'eventos_listar',
      'evento_detalhes',
      'evento_pauta',
      'evento_deputados',
      'evento_orgaos',
      'evento_votacoes',
      'evento_situacoes',
    ];

    eventTools.forEach(tool => {
      expect(ToolSchemas).toHaveProperty(tool);
    });
  });

  it('should have schemas for all reference data tools', () => {
    const referenceTools = [
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

    referenceTools.forEach(tool => {
      expect(ToolSchemas).toHaveProperty(tool);
    });
  });
});

describe('validateToolInput', () => {
  it('should validate input using tool name', () => {
    const validInput = { id: 123 };
    expect(() => validateToolInput('deputado_detalhes', validInput)).not.toThrow();
  });

  it('should throw ValidationError for invalid input', () => {
    const invalidInput = { id: -1 };
    expect(() => validateToolInput('deputado_detalhes', invalidInput)).toThrow(ValidationError);
  });

  it('should throw ValidationError for unknown tool', () => {
    expect(() => validateToolInput('unknown_tool' as ToolName, {})).toThrow(ValidationError);
  });
});

describe('ValidationError details', () => {
  it('should include field name in error', () => {
    try {
      validateInput(DeputyIdSchema, -1);
      expect.fail('Should have thrown ValidationError');
    } catch (error) {
      expect(error).toBeInstanceOf(ValidationError);
      if (error instanceof ValidationError) {
        expect(error.field).toBeDefined();
        expect(error.message).toContain('Number must be greater than 0');
      }
    }
  });

  it('should include descriptive message for invalid UF', () => {
    try {
      validateInput(UFSchema, 'XX');
      expect.fail('Should have thrown ValidationError');
    } catch (error) {
      expect(error).toBeInstanceOf(ValidationError);
      if (error instanceof ValidationError) {
        expect(error.message).toBeDefined();
        expect(error.message).toContain('Invalid enum value');
      }
    }
  });

  it('should include descriptive message for invalid date format', () => {
    try {
      validateInput(DateSchema, '2024/01/15');
      expect.fail('Should have thrown ValidationError');
    } catch (error) {
      expect(error).toBeInstanceOf(ValidationError);
      if (error instanceof ValidationError) {
        expect(error.message).toBeDefined();
        expect(error.field).toBeDefined();
      }
    }
  });

  it('should include field path for nested validation errors', () => {
    try {
      validateInput(PaginationSchema, { pagina: -1 });
      expect.fail('Should have thrown ValidationError');
    } catch (error) {
      expect(error).toBeInstanceOf(ValidationError);
      if (error instanceof ValidationError) {
        expect(error.field).toContain('pagina');
        expect(error.message).toContain('Number must be greater than 0');
      }
    }
  });

  it('should include original input value in error', () => {
    try {
      validateInput(DeputyIdSchema, 'invalid');
      expect.fail('Should have thrown ValidationError');
    } catch (error) {
      expect(error).toBeInstanceOf(ValidationError);
      if (error instanceof ValidationError) {
        expect(error.value).toBe('invalid');
      }
    }
  });

  it('should provide clear message for type mismatch', () => {
    try {
      validateInput(DeputyIdSchema, '123');
      expect.fail('Should have thrown ValidationError');
    } catch (error) {
      expect(error).toBeInstanceOf(ValidationError);
      if (error instanceof ValidationError) {
        expect(error.message).toContain('Expected number');
      }
    }
  });

  it('should provide clear message for missing required field', () => {
    try {
      validateInput(DeputadoDetalhesSchema, {});
      expect.fail('Should have thrown ValidationError');
    } catch (error) {
      expect(error).toBeInstanceOf(ValidationError);
      if (error instanceof ValidationError) {
        expect(error.field).toBe('id');
        expect(error.message).toContain('Required');
      }
    }
  });

  it('should provide clear message for custom refinement failures', () => {
    try {
      validateInput(DeputadosListarSchema, {
        dataInicio: '2024-12-31',
        dataFim: '2024-01-01',
      });
      expect.fail('Should have thrown ValidationError');
    } catch (error) {
      expect(error).toBeInstanceOf(ValidationError);
      if (error instanceof ValidationError) {
        expect(error.message).toContain('dataInicio must be before or equal to dataFim');
      }
    }
  });
});
