/**
 * Proposition tools implementation
 * Implements 10 tools for querying proposition information from the Câmara API
 */

import type { ToolDefinition, ToolContext, ToolResult } from '../core/tools.js';
import {
  ProposicoesListarSchema,
  ProposicaoDetalhesSchema,
  ProposicaoAutoresSchema,
  ProposicaoRelacionadasSchema,
  ProposicaoTemasSchema,
  ProposicaoTramitacoesSchema,
  ProposicaoVotacoesSchema,
  ProposicaoTextoSchema,
  ProposicaoSituacoesSchema,
  ProposicaoApensadasSchema,
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
// TOOL 1: proposicoes_listar
// ============================================================================

async function proposicoesListarHandler(args: unknown, context: ToolContext): Promise<ToolResult> {
  const validated = validateInput(ProposicoesListarSchema, args);
  
  const queryParams = buildQueryParams({
    siglaTipo: validated.siglaTipo,
    numero: validated.numero,
    ano: validated.ano,
    dataInicio: validated.dataInicio,
    dataFim: validated.dataFim,
    idDeputadoAutor: validated.idDeputadoAutor,
    siglaPartidoAutor: validated.siglaPartidoAutor,
    siglaUfAutor: validated.siglaUfAutor,
    keywords: validated.keywords,
    tramitacaoSenado: validated.tramitacaoSenado,
    pagina: validated.pagina,
    itens: validated.itens,
  });

  const response = await context.httpClient.get('/proposicoes', queryParams);
  return formatResult(response.data);
}

export const proposicoesListar: ToolDefinition = {
  name: 'proposicoes_listar',
  description: 'List legislative propositions with comprehensive filtering options including type, number, year, author, keywords, and date range. Returns paginated results.',
  inputSchema: ProposicoesListarSchema,
  handler: proposicoesListarHandler,
  category: 'propositions',
};

// ============================================================================
// TOOL 2: proposicao_detalhes
// ============================================================================

async function proposicaoDetalhesHandler(args: unknown, context: ToolContext): Promise<ToolResult> {
  const validated = validateInput(ProposicaoDetalhesSchema, args);
  
  const response = await context.httpClient.get(`/proposicoes/${validated.id}`);
  return formatResult(response.data);
}

export const proposicaoDetalhes: ToolDefinition = {
  name: 'proposicao_detalhes',
  description: 'Get detailed information about a specific proposition including type, number, year, summary, status, authors, and full text URL.',
  inputSchema: ProposicaoDetalhesSchema,
  handler: proposicaoDetalhesHandler,
  category: 'propositions',
};

// ============================================================================
// TOOL 3: proposicao_autores
// ============================================================================

async function proposicaoAutoresHandler(args: unknown, context: ToolContext): Promise<ToolResult> {
  const validated = validateInput(ProposicaoAutoresSchema, args);
  
  const queryParams = buildQueryParams({
    pagina: validated.pagina,
    itens: validated.itens,
  });

  const response = await context.httpClient.get(`/proposicoes/${validated.id}/autores`, queryParams);
  return formatResult(response.data);
}

export const proposicaoAutores: ToolDefinition = {
  name: 'proposicao_autores',
  description: 'Get the list of authors for a specific proposition, including deputies and other entities that authored or co-authored the proposal.',
  inputSchema: ProposicaoAutoresSchema,
  handler: proposicaoAutoresHandler,
  category: 'propositions',
};

// ============================================================================
// TOOL 4: proposicao_relacionadas
// ============================================================================

async function proposicaoRelacionadasHandler(args: unknown, context: ToolContext): Promise<ToolResult> {
  const validated = validateInput(ProposicaoRelacionadasSchema, args);
  
  const queryParams = buildQueryParams({
    pagina: validated.pagina,
    itens: validated.itens,
  });

  const response = await context.httpClient.get(`/proposicoes/${validated.id}/relacionadas`, queryParams);
  return formatResult(response.data);
}

export const proposicaoRelacionadas: ToolDefinition = {
  name: 'proposicao_relacionadas',
  description: 'Get propositions related to a specific proposition, including amendments, substitutes, and other connected legislative proposals.',
  inputSchema: ProposicaoRelacionadasSchema,
  handler: proposicaoRelacionadasHandler,
  category: 'propositions',
};

// ============================================================================
// TOOL 5: proposicao_temas
// ============================================================================

async function proposicaoTemasHandler(args: unknown, context: ToolContext): Promise<ToolResult> {
  const validated = validateInput(ProposicaoTemasSchema, args);
  
  const response = await context.httpClient.get(`/proposicoes/${validated.id}/temas`);
  return formatResult(response.data);
}

export const proposicaoTemas: ToolDefinition = {
  name: 'proposicao_temas',
  description: 'Get thematic areas and subject classifications for a specific proposition, showing which policy areas the proposal addresses.',
  inputSchema: ProposicaoTemasSchema,
  handler: proposicaoTemasHandler,
  category: 'propositions',
};

// ============================================================================
// TOOL 6: proposicao_tramitacoes
// ============================================================================

async function proposicaoTramitacoesHandler(args: unknown, context: ToolContext): Promise<ToolResult> {
  const validated = validateInput(ProposicaoTramitacoesSchema, args);
  
  const queryParams = buildQueryParams({
    pagina: validated.pagina,
    itens: validated.itens,
  });

  const response = await context.httpClient.get(`/proposicoes/${validated.id}/tramitacoes`, queryParams);
  return formatResult(response.data);
}

export const proposicaoTramitacoes: ToolDefinition = {
  name: 'proposicao_tramitacoes',
  description: 'Get the complete processing history for a proposition, showing all steps, committees, and decisions in the legislative process.',
  inputSchema: ProposicaoTramitacoesSchema,
  handler: proposicaoTramitacoesHandler,
  category: 'propositions',
};

// ============================================================================
// TOOL 7: proposicao_votacoes
// ============================================================================

async function proposicaoVotacoesHandler(args: unknown, context: ToolContext): Promise<ToolResult> {
  const validated = validateInput(ProposicaoVotacoesSchema, args);
  
  const queryParams = buildQueryParams({
    pagina: validated.pagina,
    itens: validated.itens,
  });

  const response = await context.httpClient.get(`/proposicoes/${validated.id}/votacoes`, queryParams);
  return formatResult(response.data);
}

export const proposicaoVotacoes: ToolDefinition = {
  name: 'proposicao_votacoes',
  description: 'Get all voting records for a specific proposition, including plenary and committee votes with results and dates.',
  inputSchema: ProposicaoVotacoesSchema,
  handler: proposicaoVotacoesHandler,
  category: 'propositions',
};

// ============================================================================
// TOOL 8: proposicao_texto
// ============================================================================

async function proposicaoTextoHandler(args: unknown, context: ToolContext): Promise<ToolResult> {
  const validated = validateInput(ProposicaoTextoSchema, args);
  
  const response = await context.httpClient.get(`/proposicoes/${validated.id}/texto`);
  return formatResult(response.data);
}

export const proposicaoTexto: ToolDefinition = {
  name: 'proposicao_texto',
  description: 'Get the full text content of a proposition, including the proposal text and justification.',
  inputSchema: ProposicaoTextoSchema,
  handler: proposicaoTextoHandler,
  category: 'propositions',
};

// ============================================================================
// TOOL 9: proposicao_situacoes
// ============================================================================

async function proposicaoSituacoesHandler(args: unknown, context: ToolContext): Promise<ToolResult> {
  const validated = validateInput(ProposicaoSituacoesSchema, args);
  
  const queryParams = buildQueryParams({
    pagina: validated.pagina,
    itens: validated.itens,
  });

  const response = await context.httpClient.get(`/proposicoes/${validated.id}/situacoes`, queryParams);
  return formatResult(response.data);
}

export const proposicaoSituacoes: ToolDefinition = {
  name: 'proposicao_situacoes',
  description: 'Get the status history for a proposition, showing all status changes over time with dates and descriptions.',
  inputSchema: ProposicaoSituacoesSchema,
  handler: proposicaoSituacoesHandler,
  category: 'propositions',
};

// ============================================================================
// TOOL 10: proposicao_apensadas
// ============================================================================

async function proposicaoApensadasHandler(args: unknown, context: ToolContext): Promise<ToolResult> {
  const validated = validateInput(ProposicaoApensadasSchema, args);
  
  const queryParams = buildQueryParams({
    pagina: validated.pagina,
    itens: validated.itens,
  });

  const response = await context.httpClient.get(`/proposicoes/${validated.id}/apensadas`, queryParams);
  return formatResult(response.data);
}

export const proposicaoApensadas: ToolDefinition = {
  name: 'proposicao_apensadas',
  description: 'Get propositions that have been attached (apensadas) to a specific proposition for joint processing.',
  inputSchema: ProposicaoApensadasSchema,
  handler: proposicaoApensadasHandler,
  category: 'propositions',
};

// ============================================================================
// EXPORT ALL PROPOSITION TOOLS
// ============================================================================

export const propositionTools: ToolDefinition[] = [
  proposicoesListar,
  proposicaoDetalhes,
  proposicaoAutores,
  proposicaoRelacionadas,
  proposicaoTemas,
  proposicaoTramitacoes,
  proposicaoVotacoes,
  proposicaoTexto,
  proposicaoSituacoes,
  proposicaoApensadas,
];
