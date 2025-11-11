/**
 * Input validation utilities using Zod schemas
 * Ensures all tool inputs are valid before making API calls
 */

import { z } from 'zod';
import { ValidationError } from '../shared/utils/errors.js';

// Common validation schemas
export const DeputyIdSchema = z.number().int().positive()
  .describe('Unique identifier for a deputy');

export const DateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/)
  .describe('Date in YYYY-MM-DD format');

export const UFSchema = z.enum([
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO',
  'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI',
  'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
]).describe('Brazilian state code (UF)');

export const PaginationSchema = z.object({
  pagina: z.number().int().positive().optional()
    .describe('Page number (1-indexed)'),
  itens: z.number().int().min(1).max(100).optional()
    .describe('Items per page (max 100)')
});

// ============================================================================
// DEPUTY TOOLS (15 tools)
// ============================================================================

export const DeputadosListarSchema = z.object({
  id: z.number().int().positive().optional(),
  nome: z.string().min(1).optional(),
  siglaUf: UFSchema.optional(),
  siglaPartido: z.string().min(1).optional(),
  siglaSexo: z.enum(['M', 'F']).optional(),
  dataInicio: DateSchema.optional(),
  dataFim: DateSchema.optional(),
  pagina: z.number().int().positive().optional(),
  itens: z.number().int().min(1).max(100).optional()
}).refine(
  data => !data.dataInicio || !data.dataFim || data.dataInicio <= data.dataFim,
  { message: 'dataInicio must be before or equal to dataFim' }
);

export const DeputadoDetalhesSchema = z.object({
  id: DeputyIdSchema
});

export const DeputadoDespesasSchema = z.object({
  id: DeputyIdSchema,
  dataInicio: DateSchema.optional(),
  dataFim: DateSchema.optional(),
  pagina: z.number().int().positive().optional(),
  itens: z.number().int().min(1).max(100).optional()
}).refine(
  data => !data.dataInicio || !data.dataFim || data.dataInicio <= data.dataFim,
  { message: 'dataInicio must be before or equal to dataFim' }
);

export const DeputadoDiscursosSchema = z.object({
  id: DeputyIdSchema,
  dataInicio: DateSchema.optional(),
  dataFim: DateSchema.optional(),
  pagina: z.number().int().positive().optional(),
  itens: z.number().int().min(1).max(100).optional()
}).refine(
  data => !data.dataInicio || !data.dataFim || data.dataInicio <= data.dataFim,
  { message: 'dataInicio must be before or equal to dataFim' }
);

export const DeputadoEventosSchema = z.object({
  id: DeputyIdSchema,
  dataInicio: DateSchema.optional(),
  dataFim: DateSchema.optional(),
  pagina: z.number().int().positive().optional(),
  itens: z.number().int().min(1).max(100).optional()
});

export const DeputadoFrentesSchema = z.object({
  id: DeputyIdSchema,
  pagina: z.number().int().positive().optional(),
  itens: z.number().int().min(1).max(100).optional()
});

export const DeputadoHistoricoSchema = z.object({
  id: DeputyIdSchema
});

export const DeputadoMandatosExternosSchema = z.object({
  id: DeputyIdSchema,
  pagina: z.number().int().positive().optional(),
  itens: z.number().int().min(1).max(100).optional()
});

export const DeputadoOcupacoesSchema = z.object({
  id: DeputyIdSchema
});

export const DeputadoOrgaosSchema = z.object({
  id: DeputyIdSchema,
  dataInicio: DateSchema.optional(),
  dataFim: DateSchema.optional(),
  pagina: z.number().int().positive().optional(),
  itens: z.number().int().min(1).max(100).optional()
});

export const DeputadoProfissoesSchema = z.object({
  id: DeputyIdSchema
});

export const DeputadoMesaSchema = z.object({
  id: DeputyIdSchema,
  dataInicio: DateSchema.optional(),
  dataFim: DateSchema.optional(),
  pagina: z.number().int().positive().optional(),
  itens: z.number().int().min(1).max(100).optional()
});

export const DeputadoLiderancasSchema = z.object({
  id: DeputyIdSchema,
  dataInicio: DateSchema.optional(),
  dataFim: DateSchema.optional(),
  pagina: z.number().int().positive().optional(),
  itens: z.number().int().min(1).max(100).optional()
});

export const DeputadoCargosSchema = z.object({
  id: DeputyIdSchema,
  dataInicio: DateSchema.optional(),
  dataFim: DateSchema.optional(),
  pagina: z.number().int().positive().optional(),
  itens: z.number().int().min(1).max(100).optional()
});

export const DeputadoFiliacoesSchema = z.object({
  id: DeputyIdSchema,
  dataInicio: DateSchema.optional(),
  dataFim: DateSchema.optional(),
  pagina: z.number().int().positive().optional(),
  itens: z.number().int().min(1).max(100).optional()
});

// ============================================================================
// PROPOSITION TOOLS (10 tools)
// ============================================================================

export const ProposicoesListarSchema = z.object({
  siglaTipo: z.string().optional(),
  numero: z.number().int().positive().optional(),
  ano: z.number().int().min(1900).max(new Date().getFullYear()).optional(),
  dataInicio: DateSchema.optional(),
  dataFim: DateSchema.optional(),
  idDeputadoAutor: z.number().int().positive().optional(),
  siglaPartidoAutor: z.string().optional(),
  siglaUfAutor: UFSchema.optional(),
  keywords: z.string().optional(),
  tramitacaoSenado: z.boolean().optional(),
  pagina: z.number().int().positive().optional(),
  itens: z.number().int().min(1).max(100).optional()
});

export const ProposicaoDetalhesSchema = z.object({
  id: z.number().int().positive()
});

export const ProposicaoAutoresSchema = z.object({
  id: z.number().int().positive(),
  pagina: z.number().int().positive().optional(),
  itens: z.number().int().min(1).max(100).optional()
});

export const ProposicaoRelacionadasSchema = z.object({
  id: z.number().int().positive(),
  pagina: z.number().int().positive().optional(),
  itens: z.number().int().min(1).max(100).optional()
});

export const ProposicaoTemasSchema = z.object({
  id: z.number().int().positive()
});

export const ProposicaoTramitacoesSchema = z.object({
  id: z.number().int().positive(),
  pagina: z.number().int().positive().optional(),
  itens: z.number().int().min(1).max(100).optional()
});

export const ProposicaoVotacoesSchema = z.object({
  id: z.number().int().positive(),
  pagina: z.number().int().positive().optional(),
  itens: z.number().int().min(1).max(100).optional()
});

export const ProposicaoTextoSchema = z.object({
  id: z.number().int().positive()
});

export const ProposicaoSituacoesSchema = z.object({
  id: z.number().int().positive(),
  pagina: z.number().int().positive().optional(),
  itens: z.number().int().min(1).max(100).optional()
});

export const ProposicaoApensadasSchema = z.object({
  id: z.number().int().positive(),
  pagina: z.number().int().positive().optional(),
  itens: z.number().int().min(1).max(100).optional()
});

// ============================================================================
// VOTING TOOLS (4 tools)
// ============================================================================

export const VotacoesListarSchema = z.object({
  id: z.string().optional(),
  idProposicao: z.number().int().positive().optional(),
  idOrgao: z.number().int().positive().optional(),
  dataInicio: DateSchema.optional(),
  dataFim: DateSchema.optional(),
  pagina: z.number().int().positive().optional(),
  itens: z.number().int().min(1).max(100).optional()
}).refine(
  data => !data.dataInicio || !data.dataFim || data.dataInicio <= data.dataFim,
  { message: 'dataInicio must be before or equal to dataFim' }
);

export const VotacaoDetalhesSchema = z.object({
  id: z.string()
});

export const VotacaoVotosSchema = z.object({
  id: z.string(),
  pagina: z.number().int().positive().optional(),
  itens: z.number().int().min(1).max(100).optional()
});

export const VotacaoOrientacoesSchema = z.object({
  id: z.string()
});

// ============================================================================
// COMMITTEE TOOLS (5 tools)
// ============================================================================

export const OrgaosListarSchema = z.object({
  id: z.number().int().positive().optional(),
  sigla: z.string().optional(),
  codTipoOrgao: z.number().int().positive().optional(),
  dataInicio: DateSchema.optional(),
  dataFim: DateSchema.optional(),
  pagina: z.number().int().positive().optional(),
  itens: z.number().int().min(1).max(100).optional()
});

export const OrgaoDetalhesSchema = z.object({
  id: z.number().int().positive()
});

export const OrgaoMembrosSchema = z.object({
  id: z.number().int().positive(),
  dataInicio: DateSchema.optional(),
  dataFim: DateSchema.optional(),
  pagina: z.number().int().positive().optional(),
  itens: z.number().int().min(1).max(100).optional()
});

export const OrgaoEventosSchema = z.object({
  id: z.number().int().positive(),
  dataInicio: DateSchema.optional(),
  dataFim: DateSchema.optional(),
  pagina: z.number().int().positive().optional(),
  itens: z.number().int().min(1).max(100).optional()
});

export const OrgaoVotacoesSchema = z.object({
  id: z.number().int().positive(),
  dataInicio: DateSchema.optional(),
  dataFim: DateSchema.optional(),
  pagina: z.number().int().positive().optional(),
  itens: z.number().int().min(1).max(100).optional()
});

// ============================================================================
// PARTY AND BLOC TOOLS (6 tools)
// ============================================================================

export const PartidosListarSchema = z.object({
  sigla: z.string().optional(),
  dataInicio: DateSchema.optional(),
  dataFim: DateSchema.optional(),
  pagina: z.number().int().positive().optional(),
  itens: z.number().int().min(1).max(100).optional()
});

export const PartidoDetalhesSchema = z.object({
  id: z.number().int().positive()
});

export const PartidoMembrosSchema = z.object({
  id: z.number().int().positive(),
  dataInicio: DateSchema.optional(),
  dataFim: DateSchema.optional(),
  pagina: z.number().int().positive().optional(),
  itens: z.number().int().min(1).max(100).optional()
});

export const PartidoLideresSchema = z.object({
  id: z.number().int().positive(),
  dataInicio: DateSchema.optional(),
  dataFim: DateSchema.optional(),
  pagina: z.number().int().positive().optional(),
  itens: z.number().int().min(1).max(100).optional()
});

export const BlocosListarSchema = z.object({
  idLegislatura: z.number().int().positive().optional(),
  pagina: z.number().int().positive().optional(),
  itens: z.number().int().min(1).max(100).optional()
});

export const BlocoDetalhesSchema = z.object({
  id: z.number().int().positive()
});

// ============================================================================
// EVENT TOOLS (7 tools)
// ============================================================================

export const EventosListarSchema = z.object({
  id: z.number().int().positive().optional(),
  idOrgao: z.number().int().positive().optional(),
  codTipoEvento: z.number().int().positive().optional(),
  dataInicio: DateSchema.optional(),
  dataFim: DateSchema.optional(),
  horaInicio: z.string().regex(/^\d{2}:\d{2}$/).optional().describe('Time in HH:MM format'),
  horaFim: z.string().regex(/^\d{2}:\d{2}$/).optional().describe('Time in HH:MM format'),
  pagina: z.number().int().positive().optional(),
  itens: z.number().int().min(1).max(100).optional()
}).refine(
  data => !data.dataInicio || !data.dataFim || data.dataInicio <= data.dataFim,
  { message: 'dataInicio must be before or equal to dataFim' }
);

export const EventoDetalhesSchema = z.object({
  id: z.number().int().positive()
});

export const EventoPautaSchema = z.object({
  id: z.number().int().positive(),
  pagina: z.number().int().positive().optional(),
  itens: z.number().int().min(1).max(100).optional()
});

export const EventoDeputadosSchema = z.object({
  id: z.number().int().positive(),
  pagina: z.number().int().positive().optional(),
  itens: z.number().int().min(1).max(100).optional()
});

export const EventoOrgaosSchema = z.object({
  id: z.number().int().positive()
});

export const EventoVotacoesSchema = z.object({
  id: z.number().int().positive(),
  pagina: z.number().int().positive().optional(),
  itens: z.number().int().min(1).max(100).optional()
});

export const EventoSituacoesSchema = z.object({
  id: z.number().int().positive()
});

// ============================================================================
// REFERENCE DATA TOOLS (15 tools)
// ============================================================================

export const ReferenciasSituacoesDeputadoSchema = z.object({});

export const ReferenciasTiposProposicaoSchema = z.object({});

export const ReferenciasTiposEventoSchema = z.object({});

export const ReferenciasUfsSchema = z.object({});

export const ReferenciasTiposOrgaoSchema = z.object({});

export const ReferenciasTiposAutorSchema = z.object({});

export const ReferenciasTiposTramitacaoSchema = z.object({});

export const ReferenciasSituacoesProposicaoSchema = z.object({});

export const ReferenciasSituacoesEventoSchema = z.object({});

export const ReferenciasSituacoesOrgaoSchema = z.object({});

export const ReferenciasCodigosTipoAutorSchema = z.object({});

export const ReferenciasSituacoesMesaSchema = z.object({});

export const ReferenciasSituacoesMembroSchema = z.object({});

export const ReferenciasSituacoesVotacaoSchema = z.object({});

export const ReferenciasLegislaturasSchema = z.object({
  pagina: z.number().int().positive().optional(),
  itens: z.number().int().min(1).max(100).optional()
});

// ============================================================================
// SCHEMA REGISTRY
// ============================================================================

/**
 * Registry mapping tool names to their validation schemas
 * This allows for easy lookup and validation of tool inputs
 */
export const ToolSchemas = {
  // Deputy tools
  deputados_listar: DeputadosListarSchema,
  deputado_detalhes: DeputadoDetalhesSchema,
  deputado_despesas: DeputadoDespesasSchema,
  deputado_discursos: DeputadoDiscursosSchema,
  deputado_eventos: DeputadoEventosSchema,
  deputado_frentes: DeputadoFrentesSchema,
  deputado_historico: DeputadoHistoricoSchema,
  deputado_mandatos_externos: DeputadoMandatosExternosSchema,
  deputado_ocupacoes: DeputadoOcupacoesSchema,
  deputado_orgaos: DeputadoOrgaosSchema,
  deputado_profissoes: DeputadoProfissoesSchema,
  deputado_mesa: DeputadoMesaSchema,
  deputado_liderancas: DeputadoLiderancasSchema,
  deputado_cargos: DeputadoCargosSchema,
  deputado_filiacoes: DeputadoFiliacoesSchema,
  
  // Proposition tools
  proposicoes_listar: ProposicoesListarSchema,
  proposicao_detalhes: ProposicaoDetalhesSchema,
  proposicao_autores: ProposicaoAutoresSchema,
  proposicao_relacionadas: ProposicaoRelacionadasSchema,
  proposicao_temas: ProposicaoTemasSchema,
  proposicao_tramitacoes: ProposicaoTramitacoesSchema,
  proposicao_votacoes: ProposicaoVotacoesSchema,
  proposicao_texto: ProposicaoTextoSchema,
  proposicao_situacoes: ProposicaoSituacoesSchema,
  proposicao_apensadas: ProposicaoApensadasSchema,
  
  // Voting tools
  votacoes_listar: VotacoesListarSchema,
  votacao_detalhes: VotacaoDetalhesSchema,
  votacao_votos: VotacaoVotosSchema,
  votacao_orientacoes: VotacaoOrientacoesSchema,
  
  // Committee tools
  orgaos_listar: OrgaosListarSchema,
  orgao_detalhes: OrgaoDetalhesSchema,
  orgao_membros: OrgaoMembrosSchema,
  orgao_eventos: OrgaoEventosSchema,
  orgao_votacoes: OrgaoVotacoesSchema,
  
  // Party and bloc tools
  partidos_listar: PartidosListarSchema,
  partido_detalhes: PartidoDetalhesSchema,
  partido_membros: PartidoMembrosSchema,
  partido_lideres: PartidoLideresSchema,
  blocos_listar: BlocosListarSchema,
  bloco_detalhes: BlocoDetalhesSchema,
  
  // Event tools
  eventos_listar: EventosListarSchema,
  evento_detalhes: EventoDetalhesSchema,
  evento_pauta: EventoPautaSchema,
  evento_deputados: EventoDeputadosSchema,
  evento_orgaos: EventoOrgaosSchema,
  evento_votacoes: EventoVotacoesSchema,
  evento_situacoes: EventoSituacoesSchema,
  
  // Reference data tools
  referencias_situacoes_deputado: ReferenciasSituacoesDeputadoSchema,
  referencias_tipos_proposicao: ReferenciasTiposProposicaoSchema,
  referencias_tipos_evento: ReferenciasTiposEventoSchema,
  referencias_ufs: ReferenciasUfsSchema,
  referencias_tipos_orgao: ReferenciasTiposOrgaoSchema,
  referencias_tipos_autor: ReferenciasTiposAutorSchema,
  referencias_tipos_tramitacao: ReferenciasTiposTramitacaoSchema,
  referencias_situacoes_proposicao: ReferenciasSituacoesProposicaoSchema,
  referencias_situacoes_evento: ReferenciasSituacoesEventoSchema,
  referencias_situacoes_orgao: ReferenciasSituacoesOrgaoSchema,
  referencias_codigos_tipo_autor: ReferenciasCodigosTipoAutorSchema,
  referencias_situacoes_mesa: ReferenciasSituacoesMesaSchema,
  referencias_situacoes_membro: ReferenciasSituacoesMembroSchema,
  referencias_situacoes_votacao: ReferenciasSituacoesVotacaoSchema,
  referencias_legislaturas: ReferenciasLegislaturasSchema,
} as const;

/**
 * Type for valid tool names
 */
export type ToolName = keyof typeof ToolSchemas;

/**
 * Validation helper with detailed error messages
 * 
 * @param schema - Zod schema to validate against
 * @param input - Input data to validate
 * @returns Validated and typed data
 * @throws ValidationError with descriptive message if validation fails
 */
export function validateInput<T>(schema: z.ZodSchema<T>, input: unknown): T {
  try {
    return schema.parse(input);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const firstError = error.errors[0];
      const field = firstError?.path.join('.') || 'unknown';
      const message = error.errors.map(e =>
        `${e.path.join('.')}: ${e.message}`
      ).join('; ');
      throw new ValidationError(message, field, input);
    }
    throw error;
  }
}

/**
 * Validate tool input by tool name
 * 
 * @param toolName - Name of the tool
 * @param input - Input data to validate
 * @returns Validated and typed data
 * @throws ValidationError if validation fails
 */
export function validateToolInput(toolName: ToolName, input: unknown): unknown {
  const schema = ToolSchemas[toolName];
  if (!schema) {
    throw new ValidationError(
      `Unknown tool: ${toolName}`,
      'toolName',
      toolName
    );
  }
  return validateInput(schema, input);
}
