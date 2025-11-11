/**
 * Voting tools implementation
 * Implements 4 tools for querying voting information from the Câmara API
 */

import type { ToolDefinition, ToolContext, ToolResult } from '../core/tools.js';
import {
  VotacoesListarSchema,
  VotacaoDetalhesSchema,
  VotacaoVotosSchema,
  VotacaoOrientacoesSchema,
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
// TOOL 1: votacoes_listar
// ============================================================================

async function votacoesListarHandler(args: unknown, context: ToolContext): Promise<ToolResult> {
  const validated = validateInput(VotacoesListarSchema, args);
  
  const queryParams = buildQueryParams({
    id: validated.id,
    idProposicao: validated.idProposicao,
    idOrgao: validated.idOrgao,
    dataInicio: validated.dataInicio,
    dataFim: validated.dataFim,
    pagina: validated.pagina,
    itens: validated.itens,
  });

  const response = await context.httpClient.get('/votacoes', queryParams);
  return formatResult(response.data);
}

export const votacoesListar: ToolDefinition = {
  name: 'votacoes_listar',
  description: 'List votes with optional filters including voting ID, proposition ID, organ ID, and date range. Returns paginated results with voting information.',
  inputSchema: VotacoesListarSchema,
  handler: votacoesListarHandler,
  category: 'votings',
};

// ============================================================================
// TOOL 2: votacao_detalhes
// ============================================================================

async function votacaoDetalhesHandler(args: unknown, context: ToolContext): Promise<ToolResult> {
  const validated = validateInput(VotacaoDetalhesSchema, args);
  
  const response = await context.httpClient.get(`/votacoes/${validated.id}`);
  return formatResult(response.data);
}

export const votacaoDetalhes: ToolDefinition = {
  name: 'votacao_detalhes',
  description: 'Get detailed information about a specific voting including date, organ, proposition, description, approval status, and vote counts.',
  inputSchema: VotacaoDetalhesSchema,
  handler: votacaoDetalhesHandler,
  category: 'votings',
};

// ============================================================================
// TOOL 3: votacao_votos
// ============================================================================

async function votacaoVotosHandler(args: unknown, context: ToolContext): Promise<ToolResult> {
  const validated = validateInput(VotacaoVotosSchema, args);
  
  const queryParams = buildQueryParams({
    pagina: validated.pagina,
    itens: validated.itens,
  });

  const response = await context.httpClient.get(`/votacoes/${validated.id}/votos`, queryParams);
  return formatResult(response.data);
}

export const votacaoVotos: ToolDefinition = {
  name: 'votacao_votos',
  description: 'Get individual deputy votes for a specific voting, showing how each deputy voted (yes, no, abstention, etc.). Supports pagination.',
  inputSchema: VotacaoVotosSchema,
  handler: votacaoVotosHandler,
  category: 'votings',
};

// ============================================================================
// TOOL 4: votacao_orientacoes
// ============================================================================

async function votacaoOrientacoesHandler(args: unknown, context: ToolContext): Promise<ToolResult> {
  const validated = validateInput(VotacaoOrientacoesSchema, args);
  
  const response = await context.httpClient.get(`/votacoes/${validated.id}/orientacoes`);
  return formatResult(response.data);
}

export const votacaoOrientacoes: ToolDefinition = {
  name: 'votacao_orientacoes',
  description: 'Get party leadership voting recommendations (orientações) for a specific voting, showing how each party instructed their members to vote.',
  inputSchema: VotacaoOrientacoesSchema,
  handler: votacaoOrientacoesHandler,
  category: 'votings',
};

// ============================================================================
// EXPORT ALL VOTING TOOLS
// ============================================================================

export const votingTools: ToolDefinition[] = [
  votacoesListar,
  votacaoDetalhes,
  votacaoVotos,
  votacaoOrientacoes,
];
