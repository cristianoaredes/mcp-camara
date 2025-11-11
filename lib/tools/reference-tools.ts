/**
 * Reference Data tools implementation
 * Implements 15 tools for querying reference data and lookup tables from the Câmara API
 */

import type { ToolDefinition, ToolContext, ToolResult } from '../core/tools.js';
import {
  ReferenciasSituacoesDeputadoSchema,
  ReferenciasTiposProposicaoSchema,
  ReferenciasTiposEventoSchema,
  ReferenciasUfsSchema,
  ReferenciasTiposOrgaoSchema,
  ReferenciasTiposAutorSchema,
  ReferenciasTiposTramitacaoSchema,
  ReferenciasSituacoesProposicaoSchema,
  ReferenciasSituacoesEventoSchema,
  ReferenciasSituacoesOrgaoSchema,
  ReferenciasCodigosTipoAutorSchema,
  ReferenciasSituacoesMesaSchema,
  ReferenciasSituacoesMembroSchema,
  ReferenciasSituacoesVotacaoSchema,
  ReferenciasLegislaturasSchema,
  validateInput,
} from '../core/validation.js';

/**
 * Helper function to format API response as tool result
 */
function formatResult(data: unknown): ToolResult {
  return {
    content: [{ type: 'text', text: JSON.stringify(data, null, 2) }],
  };
}

/**
 * Helper function to build query parameters, removing undefined values
 */
function buildQueryParams(params: Record<string, unknown>): Record<string, string | number | boolean> {
  const result: Record<string, string | number | boolean> = {};
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined) {
      result[key] = value as string | number | boolean;
    }
  }
  return result;
}

// ============================================================================
// TOOL 1: referencias_situacoes_deputado
// ============================================================================

async function referenciasSituacoesDeputadoHandler(args: unknown, context: ToolContext): Promise<ToolResult> {
  validateInput(ReferenciasSituacoesDeputadoSchema, args);
  
  const response = await context.httpClient.get('/referencias/situacoesDeputado');
  return formatResult(response.data);
}

export const referenciasSituacoesDeputado: ToolDefinition = {
  name: 'referencias_situacoes_deputado',
  description: 'Get valid deputy status codes and their descriptions. Returns all possible status values that can be used to filter deputies.',
  inputSchema: ReferenciasSituacoesDeputadoSchema,
  handler: referenciasSituacoesDeputadoHandler,
  category: 'references',
};

// ============================================================================
// TOOL 2: referencias_tipos_proposicao
// ============================================================================

async function referenciasTiposProposicaoHandler(args: unknown, context: ToolContext): Promise<ToolResult> {
  validateInput(ReferenciasTiposProposicaoSchema, args);
  
  const response = await context.httpClient.get('/referencias/tiposProposicao');
  return formatResult(response.data);
}

export const referenciasTiposProposicao: ToolDefinition = {
  name: 'referencias_tipos_proposicao',
  description: 'Get valid proposition types (bills, amendments, resolutions, etc.) with their codes and descriptions. Essential for filtering propositions by type.',
  inputSchema: ReferenciasTiposProposicaoSchema,
  handler: referenciasTiposProposicaoHandler,
  category: 'references',
};

// ============================================================================
// TOOL 3: referencias_tipos_evento
// ============================================================================

async function referenciasTiposEventoHandler(args: unknown, context: ToolContext): Promise<ToolResult> {
  validateInput(ReferenciasTiposEventoSchema, args);
  
  const response = await context.httpClient.get('/referencias/tiposEvento');
  return formatResult(response.data);
}

export const referenciasTiposEvento: ToolDefinition = {
  name: 'referencias_tipos_evento',
  description: 'Get valid event types (committee meetings, hearings, sessions, etc.) with their codes and descriptions. Used for filtering events.',
  inputSchema: ReferenciasTiposEventoSchema,
  handler: referenciasTiposEventoHandler,
  category: 'references',
};

// ============================================================================
// TOOL 4: referencias_ufs
// ============================================================================

async function referenciasUfsHandler(args: unknown, context: ToolContext): Promise<ToolResult> {
  validateInput(ReferenciasUfsSchema, args);
  
  const response = await context.httpClient.get('/referencias/uf');
  return formatResult(response.data);
}

export const referenciasUfs: ToolDefinition = {
  name: 'referencias_ufs',
  description: 'Get Brazilian state codes (UF) and their full names. Returns all 26 states plus the Federal District with their official abbreviations.',
  inputSchema: ReferenciasUfsSchema,
  handler: referenciasUfsHandler,
  category: 'references',
};

// ============================================================================
// TOOL 5: referencias_tipos_orgao
// ============================================================================

async function referenciasTiposOrgaoHandler(args: unknown, context: ToolContext): Promise<ToolResult> {
  validateInput(ReferenciasTiposOrgaoSchema, args);
  
  const response = await context.httpClient.get('/referencias/tiposOrgao');
  return formatResult(response.data);
}

export const referenciasTiposOrgao: ToolDefinition = {
  name: 'referencias_tipos_orgao',
  description: 'Get valid committee and legislative body types with their codes and descriptions. Used for filtering committees by type.',
  inputSchema: ReferenciasTiposOrgaoSchema,
  handler: referenciasTiposOrgaoHandler,
  category: 'references',
};

// ============================================================================
// TOOL 6: referencias_tipos_autor
// ============================================================================

async function referenciasTiposAutorHandler(args: unknown, context: ToolContext): Promise<ToolResult> {
  validateInput(ReferenciasTiposAutorSchema, args);
  
  const response = await context.httpClient.get('/referencias/tiposAutor');
  return formatResult(response.data);
}

export const referenciasTiposAutor: ToolDefinition = {
  name: 'referencias_tipos_autor',
  description: 'Get valid author types for propositions (deputy, committee, executive branch, etc.) with their codes and descriptions.',
  inputSchema: ReferenciasTiposAutorSchema,
  handler: referenciasTiposAutorHandler,
  category: 'references',
};

// ============================================================================
// TOOL 7: referencias_tipos_tramitacao
// ============================================================================

async function referenciasTiposTramitacaoHandler(args: unknown, context: ToolContext): Promise<ToolResult> {
  validateInput(ReferenciasTiposTramitacaoSchema, args);
  
  const response = await context.httpClient.get('/referencias/tiposTramitacao');
  return formatResult(response.data);
}

export const referenciasTiposTramitacao: ToolDefinition = {
  name: 'referencias_tipos_tramitacao',
  description: 'Get valid processing/tramitacao types for propositions with their codes and descriptions. Shows different stages in the legislative process.',
  inputSchema: ReferenciasTiposTramitacaoSchema,
  handler: referenciasTiposTramitacaoHandler,
  category: 'references',
};

// ============================================================================
// TOOL 8: referencias_situacoes_proposicao
// ============================================================================

async function referenciasSituacoesProposicaoHandler(args: unknown, context: ToolContext): Promise<ToolResult> {
  validateInput(ReferenciasSituacoesProposicaoSchema, args);
  
  const response = await context.httpClient.get('/referencias/situacoesProposicao');
  return formatResult(response.data);
}

export const referenciasSituacoesProposicao: ToolDefinition = {
  name: 'referencias_situacoes_proposicao',
  description: 'Get valid proposition status codes (approved, rejected, under review, etc.) with their descriptions. Used for filtering propositions by status.',
  inputSchema: ReferenciasSituacoesProposicaoSchema,
  handler: referenciasSituacoesProposicaoHandler,
  category: 'references',
};

// ============================================================================
// TOOL 9: referencias_situacoes_evento
// ============================================================================

async function referenciasSituacoesEventoHandler(args: unknown, context: ToolContext): Promise<ToolResult> {
  validateInput(ReferenciasSituacoesEventoSchema, args);
  
  const response = await context.httpClient.get('/referencias/situacoesEvento');
  return formatResult(response.data);
}

export const referenciasSituacoesEvento: ToolDefinition = {
  name: 'referencias_situacoes_evento',
  description: 'Get valid event status codes (scheduled, in progress, completed, cancelled, etc.) with their descriptions.',
  inputSchema: ReferenciasSituacoesEventoSchema,
  handler: referenciasSituacoesEventoHandler,
  category: 'references',
};

// ============================================================================
// TOOL 10: referencias_situacoes_orgao
// ============================================================================

async function referenciasSituacoesOrgaoHandler(args: unknown, context: ToolContext): Promise<ToolResult> {
  validateInput(ReferenciasSituacoesOrgaoSchema, args);
  
  const response = await context.httpClient.get('/referencias/situacoesOrgao');
  return formatResult(response.data);
}

export const referenciasSituacoesOrgao: ToolDefinition = {
  name: 'referencias_situacoes_orgao',
  description: 'Get valid committee/organ status codes (active, inactive, etc.) with their descriptions. Used for filtering committees by status.',
  inputSchema: ReferenciasSituacoesOrgaoSchema,
  handler: referenciasSituacoesOrgaoHandler,
  category: 'references',
};

// ============================================================================
// TOOL 11: referencias_codigos_tipo_autor
// ============================================================================

async function referenciasCodigosTipoAutorHandler(args: unknown, context: ToolContext): Promise<ToolResult> {
  validateInput(ReferenciasCodigosTipoAutorSchema, args);
  
  const response = await context.httpClient.get('/referencias/codigosTipoAutor');
  return formatResult(response.data);
}

export const referenciasCodigosTipoAutor: ToolDefinition = {
  name: 'referencias_codigos_tipo_autor',
  description: 'Get numeric codes for author types with their descriptions. Alternative to referencias_tipos_autor with numeric identifiers.',
  inputSchema: ReferenciasCodigosTipoAutorSchema,
  handler: referenciasCodigosTipoAutorHandler,
  category: 'references',
};

// ============================================================================
// TOOL 12: referencias_situacoes_mesa
// ============================================================================

async function referenciasSituacoesMesaHandler(args: unknown, context: ToolContext): Promise<ToolResult> {
  validateInput(ReferenciasSituacoesMesaSchema, args);
  
  const response = await context.httpClient.get('/referencias/situacoesMesa');
  return formatResult(response.data);
}

export const referenciasSituacoesMesa: ToolDefinition = {
  name: 'referencias_situacoes_mesa',
  description: 'Get valid status codes for Chamber leadership board (Mesa Diretora) positions with their descriptions.',
  inputSchema: ReferenciasSituacoesMesaSchema,
  handler: referenciasSituacoesMesaHandler,
  category: 'references',
};

// ============================================================================
// TOOL 13: referencias_situacoes_membro
// ============================================================================

async function referenciasSituacoesMembroHandler(args: unknown, context: ToolContext): Promise<ToolResult> {
  validateInput(ReferenciasSituacoesMembroSchema, args);
  
  const response = await context.httpClient.get('/referencias/situacoesMembro');
  return formatResult(response.data);
}

export const referenciasSituacoesMembro: ToolDefinition = {
  name: 'referencias_situacoes_membro',
  description: 'Get valid status codes for committee membership (titular, substitute, etc.) with their descriptions.',
  inputSchema: ReferenciasSituacoesMembroSchema,
  handler: referenciasSituacoesMembroHandler,
  category: 'references',
};

// ============================================================================
// TOOL 14: referencias_situacoes_votacao
// ============================================================================

async function referenciasSituacoesVotacaoHandler(args: unknown, context: ToolContext): Promise<ToolResult> {
  validateInput(ReferenciasSituacoesVotacaoSchema, args);
  
  const response = await context.httpClient.get('/referencias/situacoesVotacao');
  return formatResult(response.data);
}

export const referenciasSituacoesVotacao: ToolDefinition = {
  name: 'referencias_situacoes_votacao',
  description: 'Get valid voting status codes (open, closed, cancelled, etc.) with their descriptions.',
  inputSchema: ReferenciasSituacoesVotacaoSchema,
  handler: referenciasSituacoesVotacaoHandler,
  category: 'references',
};

// ============================================================================
// TOOL 15: referencias_legislaturas
// ============================================================================

async function referenciasLegislaturasHandler(args: unknown, context: ToolContext): Promise<ToolResult> {
  const validated = validateInput(ReferenciasLegislaturasSchema, args);
  
  const queryParams = buildQueryParams({
    pagina: validated.pagina,
    itens: validated.itens,
  });

  const response = await context.httpClient.get('/referencias/legislaturas', queryParams);
  return formatResult(response.data);
}

export const referenciasLegislaturas: ToolDefinition = {
  name: 'referencias_legislaturas',
  description: 'Get legislative terms (legislaturas) with their IDs, start dates, and end dates. Each term represents a four-year period of parliamentary activity.',
  inputSchema: ReferenciasLegislaturasSchema,
  handler: referenciasLegislaturasHandler,
  category: 'references',
};

// ============================================================================
// EXPORT ALL REFERENCE TOOLS
// ============================================================================

export const referenceTools: ToolDefinition[] = [
  referenciasSituacoesDeputado,
  referenciasTiposProposicao,
  referenciasTiposEvento,
  referenciasUfs,
  referenciasTiposOrgao,
  referenciasTiposAutor,
  referenciasTiposTramitacao,
  referenciasSituacoesProposicao,
  referenciasSituacoesEvento,
  referenciasSituacoesOrgao,
  referenciasCodigosTipoAutor,
  referenciasSituacoesMesa,
  referenciasSituacoesMembro,
  referenciasSituacoesVotacao,
  referenciasLegislaturas,
];
