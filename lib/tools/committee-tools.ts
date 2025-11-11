/**
 * Committee tools implementation
 * Implements 5 tools for querying committee (órgão) information from the Câmara API
 */

import type { ToolDefinition, ToolContext, ToolResult } from '../core/tools.js';
import {
  OrgaosListarSchema,
  OrgaoDetalhesSchema,
  OrgaoMembrosSchema,
  OrgaoEventosSchema,
  OrgaoVotacoesSchema,
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
// TOOL 1: orgaos_listar
// ============================================================================

async function orgaosListarHandler(args: unknown, context: ToolContext): Promise<ToolResult> {
  const validated = validateInput(OrgaosListarSchema, args);
  
  const queryParams = buildQueryParams({
    id: validated.id,
    sigla: validated.sigla,
    codTipoOrgao: validated.codTipoOrgao,
    dataInicio: validated.dataInicio,
    dataFim: validated.dataFim,
    pagina: validated.pagina,
    itens: validated.itens,
  });

  const response = await context.httpClient.get('/orgaos', queryParams);
  return formatResult(response.data);
}

export const orgaosListar: ToolDefinition = {
  name: 'orgaos_listar',
  description: 'List committees and legislative bodies (órgãos) with optional filters including ID, acronym, type code, and date range. Returns paginated results.',
  inputSchema: OrgaosListarSchema,
  handler: orgaosListarHandler,
  category: 'committees',
};

// ============================================================================
// TOOL 2: orgao_detalhes
// ============================================================================

async function orgaoDetalhesHandler(args: unknown, context: ToolContext): Promise<ToolResult> {
  const validated = validateInput(OrgaoDetalhesSchema, args);
  
  const response = await context.httpClient.get(`/orgaos/${validated.id}`);
  return formatResult(response.data);
}

export const orgaoDetalhes: ToolDefinition = {
  name: 'orgao_detalhes',
  description: 'Get detailed information about a specific committee or legislative body including name, acronym, type, and publication name.',
  inputSchema: OrgaoDetalhesSchema,
  handler: orgaoDetalhesHandler,
  category: 'committees',
};

// ============================================================================
// TOOL 3: orgao_membros
// ============================================================================

async function orgaoMembrosHandler(args: unknown, context: ToolContext): Promise<ToolResult> {
  const validated = validateInput(OrgaoMembrosSchema, args);
  
  const queryParams = buildQueryParams({
    dataInicio: validated.dataInicio,
    dataFim: validated.dataFim,
    pagina: validated.pagina,
    itens: validated.itens,
  });

  const response = await context.httpClient.get(`/orgaos/${validated.id}/membros`, queryParams);
  return formatResult(response.data);
}

export const orgaoMembros: ToolDefinition = {
  name: 'orgao_membros',
  description: 'Get the list of members for a specific committee or legislative body. Can be filtered by date range to see historical membership. Supports pagination.',
  inputSchema: OrgaoMembrosSchema,
  handler: orgaoMembrosHandler,
  category: 'committees',
};

// ============================================================================
// TOOL 4: orgao_eventos
// ============================================================================

async function orgaoEventosHandler(args: unknown, context: ToolContext): Promise<ToolResult> {
  const validated = validateInput(OrgaoEventosSchema, args);
  
  const queryParams = buildQueryParams({
    dataInicio: validated.dataInicio,
    dataFim: validated.dataFim,
    pagina: validated.pagina,
    itens: validated.itens,
  });

  const response = await context.httpClient.get(`/orgaos/${validated.id}/eventos`, queryParams);
  return formatResult(response.data);
}

export const orgaoEventos: ToolDefinition = {
  name: 'orgao_eventos',
  description: 'Get events organized by a specific committee or legislative body, including meetings, hearings, and other activities. Can be filtered by date range.',
  inputSchema: OrgaoEventosSchema,
  handler: orgaoEventosHandler,
  category: 'committees',
};

// ============================================================================
// TOOL 5: orgao_votacoes
// ============================================================================

async function orgaoVotacoesHandler(args: unknown, context: ToolContext): Promise<ToolResult> {
  const validated = validateInput(OrgaoVotacoesSchema, args);
  
  const queryParams = buildQueryParams({
    dataInicio: validated.dataInicio,
    dataFim: validated.dataFim,
    pagina: validated.pagina,
    itens: validated.itens,
  });

  const response = await context.httpClient.get(`/orgaos/${validated.id}/votacoes`, queryParams);
  return formatResult(response.data);
}

export const orgaoVotacoes: ToolDefinition = {
  name: 'orgao_votacoes',
  description: 'Get voting records for a specific committee or legislative body. Can be filtered by date range to see historical votes. Supports pagination.',
  inputSchema: OrgaoVotacoesSchema,
  handler: orgaoVotacoesHandler,
  category: 'committees',
};

// ============================================================================
// EXPORT ALL COMMITTEE TOOLS
// ============================================================================

export const committeeTools: ToolDefinition[] = [
  orgaosListar,
  orgaoDetalhes,
  orgaoMembros,
  orgaoEventos,
  orgaoVotacoes,
];
