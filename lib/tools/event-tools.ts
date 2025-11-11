/**
 * Event tools implementation
 * Implements 7 tools for querying event information from the Câmara API
 */

import type { ToolDefinition, ToolContext, ToolResult } from '../core/tools.js';
import {
  EventosListarSchema,
  EventoDetalhesSchema,
  EventoPautaSchema,
  EventoDeputadosSchema,
  EventoOrgaosSchema,
  EventoVotacoesSchema,
  EventoSituacoesSchema,
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
// TOOL 1: eventos_listar
// ============================================================================

async function eventosListarHandler(args: unknown, context: ToolContext): Promise<ToolResult> {
  const validated = validateInput(EventosListarSchema, args);
  
  const queryParams = buildQueryParams({
    id: validated.id,
    idOrgao: validated.idOrgao,
    codTipoEvento: validated.codTipoEvento,
    dataInicio: validated.dataInicio,
    dataFim: validated.dataFim,
    horaInicio: validated.horaInicio,
    horaFim: validated.horaFim,
    pagina: validated.pagina,
    itens: validated.itens,
  });

  const response = await context.httpClient.get('/eventos', queryParams);
  return formatResult(response.data);
}

export const eventosListar: ToolDefinition = {
  name: 'eventos_listar',
  description: 'List events with optional filters including event ID, organ ID, event type code, date range, and time range. Returns paginated results with event information.',
  inputSchema: EventosListarSchema,
  handler: eventosListarHandler,
  category: 'events',
};

// ============================================================================
// TOOL 2: evento_detalhes
// ============================================================================

async function eventoDetalhesHandler(args: unknown, context: ToolContext): Promise<ToolResult> {
  const validated = validateInput(EventoDetalhesSchema, args);
  
  const response = await context.httpClient.get(`/eventos/${validated.id}`);
  return formatResult(response.data);
}

export const eventoDetalhes: ToolDefinition = {
  name: 'evento_detalhes',
  description: 'Get detailed information about a specific event including date, time, status, type, description, location, and organizing committees.',
  inputSchema: EventoDetalhesSchema,
  handler: eventoDetalhesHandler,
  category: 'events',
};

// ============================================================================
// TOOL 3: evento_pauta
// ============================================================================

async function eventoPautaHandler(args: unknown, context: ToolContext): Promise<ToolResult> {
  const validated = validateInput(EventoPautaSchema, args);
  
  const queryParams = buildQueryParams({
    pagina: validated.pagina,
    itens: validated.itens,
  });

  const response = await context.httpClient.get(`/eventos/${validated.id}/pauta`, queryParams);
  return formatResult(response.data);
}

export const eventoPauta: ToolDefinition = {
  name: 'evento_pauta',
  description: 'Get the agenda (pauta) for a specific event, showing propositions and items to be discussed. Supports pagination.',
  inputSchema: EventoPautaSchema,
  handler: eventoPautaHandler,
  category: 'events',
};

// ============================================================================
// TOOL 4: evento_deputados
// ============================================================================

async function eventoDeputadosHandler(args: unknown, context: ToolContext): Promise<ToolResult> {
  const validated = validateInput(EventoDeputadosSchema, args);
  
  const queryParams = buildQueryParams({
    pagina: validated.pagina,
    itens: validated.itens,
  });

  const response = await context.httpClient.get(`/eventos/${validated.id}/deputados`, queryParams);
  return formatResult(response.data);
}

export const eventoDeputados: ToolDefinition = {
  name: 'evento_deputados',
  description: 'Get the list of deputies participating in a specific event. Supports pagination.',
  inputSchema: EventoDeputadosSchema,
  handler: eventoDeputadosHandler,
  category: 'events',
};

// ============================================================================
// TOOL 5: evento_orgaos
// ============================================================================

async function eventoOrgaosHandler(args: unknown, context: ToolContext): Promise<ToolResult> {
  const validated = validateInput(EventoOrgaosSchema, args);
  
  const response = await context.httpClient.get(`/eventos/${validated.id}/orgaos`);
  return formatResult(response.data);
}

export const eventoOrgaos: ToolDefinition = {
  name: 'evento_orgaos',
  description: 'Get the list of committees and legislative bodies (órgãos) organizing or participating in a specific event.',
  inputSchema: EventoOrgaosSchema,
  handler: eventoOrgaosHandler,
  category: 'events',
};

// ============================================================================
// TOOL 6: evento_votacoes
// ============================================================================

async function eventoVotacoesHandler(args: unknown, context: ToolContext): Promise<ToolResult> {
  const validated = validateInput(EventoVotacoesSchema, args);
  
  const queryParams = buildQueryParams({
    pagina: validated.pagina,
    itens: validated.itens,
  });

  const response = await context.httpClient.get(`/eventos/${validated.id}/votacoes`, queryParams);
  return formatResult(response.data);
}

export const eventoVotacoes: ToolDefinition = {
  name: 'evento_votacoes',
  description: 'Get voting records that occurred during a specific event. Supports pagination.',
  inputSchema: EventoVotacoesSchema,
  handler: eventoVotacoesHandler,
  category: 'events',
};

// ============================================================================
// TOOL 7: evento_situacoes
// ============================================================================

async function eventoSituacoesHandler(args: unknown, context: ToolContext): Promise<ToolResult> {
  const validated = validateInput(EventoSituacoesSchema, args);
  
  const response = await context.httpClient.get(`/eventos/${validated.id}/situacoes`);
  return formatResult(response.data);
}

export const eventoSituacoes: ToolDefinition = {
  name: 'evento_situacoes',
  description: 'Get the status history for a specific event, showing all status changes over time.',
  inputSchema: EventoSituacoesSchema,
  handler: eventoSituacoesHandler,
  category: 'events',
};

// ============================================================================
// EXPORT ALL EVENT TOOLS
// ============================================================================

export const eventTools: ToolDefinition[] = [
  eventosListar,
  eventoDetalhes,
  eventoPauta,
  eventoDeputados,
  eventoOrgaos,
  eventoVotacoes,
  eventoSituacoes,
];
