/**
 * Party and Bloc tools implementation
 * Implements 6 tools for querying party and bloc information from the Câmara API
 */

import type { ToolDefinition, ToolContext, ToolResult } from '../core/tools.js';
import {
  PartidosListarSchema,
  PartidoDetalhesSchema,
  PartidoMembrosSchema,
  PartidoLideresSchema,
  BlocosListarSchema,
  BlocoDetalhesSchema,
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
// TOOL 1: partidos_listar
// ============================================================================

async function partidosListarHandler(args: unknown, context: ToolContext): Promise<ToolResult> {
  const validated = validateInput(PartidosListarSchema, args);
  
  const queryParams = buildQueryParams({
    sigla: validated.sigla,
    dataInicio: validated.dataInicio,
    dataFim: validated.dataFim,
    pagina: validated.pagina,
    itens: validated.itens,
  });

  const response = await context.httpClient.get('/partidos', queryParams);
  return formatResult(response.data);
}

export const partidosListar: ToolDefinition = {
  name: 'partidos_listar',
  description: 'List all political parties in the Brazilian Chamber of Deputies. Can be filtered by party abbreviation (sigla) and date range. Returns paginated results.',
  inputSchema: PartidosListarSchema,
  handler: partidosListarHandler,
  category: 'parties',
};

// ============================================================================
// TOOL 2: partido_detalhes
// ============================================================================

async function partidoDetalhesHandler(args: unknown, context: ToolContext): Promise<ToolResult> {
  const validated = validateInput(PartidoDetalhesSchema, args);
  
  const response = await context.httpClient.get(`/partidos/${validated.id}`);
  return formatResult(response.data);
}

export const partidoDetalhes: ToolDefinition = {
  name: 'partido_detalhes',
  description: 'Get detailed information about a specific political party including full name, abbreviation, and official data.',
  inputSchema: PartidoDetalhesSchema,
  handler: partidoDetalhesHandler,
  category: 'parties',
};

// ============================================================================
// TOOL 3: partido_membros
// ============================================================================

async function partidoMembrosHandler(args: unknown, context: ToolContext): Promise<ToolResult> {
  const validated = validateInput(PartidoMembrosSchema, args);
  
  const queryParams = buildQueryParams({
    dataInicio: validated.dataInicio,
    dataFim: validated.dataFim,
    pagina: validated.pagina,
    itens: validated.itens,
  });

  const response = await context.httpClient.get(`/partidos/${validated.id}/membros`, queryParams);
  return formatResult(response.data);
}

export const partidoMembros: ToolDefinition = {
  name: 'partido_membros',
  description: 'Get the list of deputies who are or were members of a specific party. Can be filtered by date range to see historical membership. Returns paginated results.',
  inputSchema: PartidoMembrosSchema,
  handler: partidoMembrosHandler,
  category: 'parties',
};

// ============================================================================
// TOOL 4: partido_lideres
// ============================================================================

async function partidoLideresHandler(args: unknown, context: ToolContext): Promise<ToolResult> {
  const validated = validateInput(PartidoLideresSchema, args);
  
  const queryParams = buildQueryParams({
    dataInicio: validated.dataInicio,
    dataFim: validated.dataFim,
    pagina: validated.pagina,
    itens: validated.itens,
  });

  const response = await context.httpClient.get(`/partidos/${validated.id}/lideres`, queryParams);
  return formatResult(response.data);
}

export const partidoLideres: ToolDefinition = {
  name: 'partido_lideres',
  description: 'Get the list of party leaders (líderes) for a specific party. Party leaders represent their parties in legislative negotiations and voting orientations. Can be filtered by date range.',
  inputSchema: PartidoLideresSchema,
  handler: partidoLideresHandler,
  category: 'parties',
};

// ============================================================================
// TOOL 5: blocos_listar
// ============================================================================

async function blocosListarHandler(args: unknown, context: ToolContext): Promise<ToolResult> {
  const validated = validateInput(BlocosListarSchema, args);
  
  const queryParams = buildQueryParams({
    idLegislatura: validated.idLegislatura,
    pagina: validated.pagina,
    itens: validated.itens,
  });

  const response = await context.httpClient.get('/blocos', queryParams);
  return formatResult(response.data);
}

export const blocosListar: ToolDefinition = {
  name: 'blocos_listar',
  description: 'List party blocs (blocos partidários) in the Chamber. Party blocs are coalitions of multiple parties that work together. Can be filtered by legislative term (legislatura).',
  inputSchema: BlocosListarSchema,
  handler: blocosListarHandler,
  category: 'parties',
};

// ============================================================================
// TOOL 6: bloco_detalhes
// ============================================================================

async function blocoDetalhesHandler(args: unknown, context: ToolContext): Promise<ToolResult> {
  const validated = validateInput(BlocoDetalhesSchema, args);
  
  const response = await context.httpClient.get(`/blocos/${validated.id}`);
  return formatResult(response.data);
}

export const blocoDetalhes: ToolDefinition = {
  name: 'bloco_detalhes',
  description: 'Get detailed information about a specific party bloc including member parties, formation date, and leadership structure.',
  inputSchema: BlocoDetalhesSchema,
  handler: blocoDetalhesHandler,
  category: 'parties',
};

// ============================================================================
// EXPORT ALL PARTY TOOLS
// ============================================================================

export const partyTools: ToolDefinition[] = [
  partidosListar,
  partidoDetalhes,
  partidoMembros,
  partidoLideres,
  blocosListar,
  blocoDetalhes,
];
