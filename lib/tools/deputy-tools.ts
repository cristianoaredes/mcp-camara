/**
 * Deputy tools implementation
 * Implements 15 tools for querying deputy information from the Câmara API
 */

import type { ToolDefinition, ToolContext, ToolResult } from '../core/tools.js';
import {
  DeputadosListarSchema,
  DeputadoDetalhesSchema,
  DeputadoDespesasSchema,
  DeputadoDiscursosSchema,
  DeputadoEventosSchema,
  DeputadoFrentesSchema,
  DeputadoHistoricoSchema,
  DeputadoMandatosExternosSchema,
  DeputadoOcupacoesSchema,
  DeputadoOrgaosSchema,
  DeputadoProfissoesSchema,
  DeputadoMesaSchema,
  DeputadoLiderancasSchema,
  DeputadoCargosSchema,
  DeputadoFiliacoesSchema,
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
// TOOL 1: deputados_listar
// ============================================================================

async function deputadosListarHandler(args: unknown, context: ToolContext): Promise<ToolResult> {
  const validated = validateInput(DeputadosListarSchema, args);
  
  const queryParams = buildQueryParams({
    id: validated.id,
    nome: validated.nome,
    siglaUf: validated.siglaUf,
    siglaPartido: validated.siglaPartido,
    siglaSexo: validated.siglaSexo,
    dataInicio: validated.dataInicio,
    dataFim: validated.dataFim,
    pagina: validated.pagina,
    itens: validated.itens,
  });

  const response = await context.httpClient.get('/deputados', queryParams);
  return formatResult(response.data);
}

export const deputadosListar: ToolDefinition = {
  name: 'deputados_listar',
  description: 'List deputies with optional filters including name, state (UF), party, gender, and date range. Returns paginated results.',
  inputSchema: DeputadosListarSchema,
  handler: deputadosListarHandler,
  category: 'deputies',
};

// ============================================================================
// TOOL 2: deputado_detalhes
// ============================================================================

async function deputadoDetalhesHandler(args: unknown, context: ToolContext): Promise<ToolResult> {
  const validated = validateInput(DeputadoDetalhesSchema, args);
  
  const response = await context.httpClient.get(`/deputados/${validated.id}`);
  return formatResult(response.data);
}

export const deputadoDetalhes: ToolDefinition = {
  name: 'deputado_detalhes',
  description: 'Get detailed information about a specific deputy including personal data, current status, office location, and contact information.',
  inputSchema: DeputadoDetalhesSchema,
  handler: deputadoDetalhesHandler,
  category: 'deputies',
};

// ============================================================================
// TOOL 3: deputado_despesas
// ============================================================================

async function deputadoDespesasHandler(args: unknown, context: ToolContext): Promise<ToolResult> {
  const validated = validateInput(DeputadoDespesasSchema, args);
  
  const queryParams = buildQueryParams({
    dataInicio: validated.dataInicio,
    dataFim: validated.dataFim,
    pagina: validated.pagina,
    itens: validated.itens,
  });

  const response = await context.httpClient.get(`/deputados/${validated.id}/despesas`, queryParams);
  return formatResult(response.data);
}

export const deputadoDespesas: ToolDefinition = {
  name: 'deputado_despesas',
  description: 'Get expense records for a deputy including parliamentary allowance expenditures. Can be filtered by date range and supports pagination.',
  inputSchema: DeputadoDespesasSchema,
  handler: deputadoDespesasHandler,
  category: 'deputies',
};

// ============================================================================
// TOOL 4: deputado_discursos
// ============================================================================

async function deputadoDiscursosHandler(args: unknown, context: ToolContext): Promise<ToolResult> {
  const validated = validateInput(DeputadoDiscursosSchema, args);
  
  const queryParams = buildQueryParams({
    dataInicio: validated.dataInicio,
    dataFim: validated.dataFim,
    pagina: validated.pagina,
    itens: validated.itens,
  });

  const response = await context.httpClient.get(`/deputados/${validated.id}/discursos`, queryParams);
  return formatResult(response.data);
}

export const deputadoDiscursos: ToolDefinition = {
  name: 'deputado_discursos',
  description: 'Get speeches made by a deputy in plenary sessions. Includes transcriptions, keywords, and summaries. Can be filtered by date range.',
  inputSchema: DeputadoDiscursosSchema,
  handler: deputadoDiscursosHandler,
  category: 'deputies',
};

// ============================================================================
// TOOL 5: deputado_eventos
// ============================================================================

async function deputadoEventosHandler(args: unknown, context: ToolContext): Promise<ToolResult> {
  const validated = validateInput(DeputadoEventosSchema, args);
  
  const queryParams = buildQueryParams({
    dataInicio: validated.dataInicio,
    dataFim: validated.dataFim,
    pagina: validated.pagina,
    itens: validated.itens,
  });

  const response = await context.httpClient.get(`/deputados/${validated.id}/eventos`, queryParams);
  return formatResult(response.data);
}

export const deputadoEventos: ToolDefinition = {
  name: 'deputado_eventos',
  description: 'Get events that a deputy participated in, including committee meetings, hearings, and other parliamentary activities.',
  inputSchema: DeputadoEventosSchema,
  handler: deputadoEventosHandler,
  category: 'deputies',
};

// ============================================================================
// TOOL 6: deputado_frentes
// ============================================================================

async function deputadoFrentesHandler(args: unknown, context: ToolContext): Promise<ToolResult> {
  const validated = validateInput(DeputadoFrentesSchema, args);
  
  const queryParams = buildQueryParams({
    pagina: validated.pagina,
    itens: validated.itens,
  });

  const response = await context.httpClient.get(`/deputados/${validated.id}/frentes`, queryParams);
  return formatResult(response.data);
}

export const deputadoFrentes: ToolDefinition = {
  name: 'deputado_frentes',
  description: 'Get parliamentary fronts (frentes parlamentares) that a deputy is a member of. Parliamentary fronts are groups organized around specific themes.',
  inputSchema: DeputadoFrentesSchema,
  handler: deputadoFrentesHandler,
  category: 'deputies',
};

// ============================================================================
// TOOL 7: deputado_historico
// ============================================================================

async function deputadoHistoricoHandler(args: unknown, context: ToolContext): Promise<ToolResult> {
  const validated = validateInput(DeputadoHistoricoSchema, args);
  
  const response = await context.httpClient.get(`/deputados/${validated.id}/historico`);
  return formatResult(response.data);
}

export const deputadoHistorico: ToolDefinition = {
  name: 'deputado_historico',
  description: 'Get the complete mandate history for a deputy, including all legislative terms and positions held.',
  inputSchema: DeputadoHistoricoSchema,
  handler: deputadoHistoricoHandler,
  category: 'deputies',
};

// ============================================================================
// TOOL 8: deputado_mandatos_externos
// ============================================================================

async function deputadoMandatosExternosHandler(args: unknown, context: ToolContext): Promise<ToolResult> {
  const validated = validateInput(DeputadoMandatosExternosSchema, args);
  
  const queryParams = buildQueryParams({
    pagina: validated.pagina,
    itens: validated.itens,
  });

  const response = await context.httpClient.get(`/deputados/${validated.id}/mandatos-externos`, queryParams);
  return formatResult(response.data);
}

export const deputadoMandatosExternos: ToolDefinition = {
  name: 'deputado_mandatos_externos',
  description: 'Get external mandates held by a deputy, such as positions in state legislatures or municipal councils.',
  inputSchema: DeputadoMandatosExternosSchema,
  handler: deputadoMandatosExternosHandler,
  category: 'deputies',
};

// ============================================================================
// TOOL 9: deputado_ocupacoes
// ============================================================================

async function deputadoOcupacoesHandler(args: unknown, context: ToolContext): Promise<ToolResult> {
  const validated = validateInput(DeputadoOcupacoesSchema, args);
  
  const response = await context.httpClient.get(`/deputados/${validated.id}/ocupacoes`);
  return formatResult(response.data);
}

export const deputadoOcupacoes: ToolDefinition = {
  name: 'deputado_ocupacoes',
  description: 'Get occupations declared by a deputy, representing their professional background and work experience.',
  inputSchema: DeputadoOcupacoesSchema,
  handler: deputadoOcupacoesHandler,
  category: 'deputies',
};

// ============================================================================
// TOOL 10: deputado_orgaos
// ============================================================================

async function deputadoOrgaosHandler(args: unknown, context: ToolContext): Promise<ToolResult> {
  const validated = validateInput(DeputadoOrgaosSchema, args);
  
  const queryParams = buildQueryParams({
    dataInicio: validated.dataInicio,
    dataFim: validated.dataFim,
    pagina: validated.pagina,
    itens: validated.itens,
  });

  const response = await context.httpClient.get(`/deputados/${validated.id}/orgaos`, queryParams);
  return formatResult(response.data);
}

export const deputadoOrgaos: ToolDefinition = {
  name: 'deputado_orgaos',
  description: 'Get committees and legislative bodies (órgãos) that a deputy is or was a member of. Can be filtered by date range.',
  inputSchema: DeputadoOrgaosSchema,
  handler: deputadoOrgaosHandler,
  category: 'deputies',
};

// ============================================================================
// TOOL 11: deputado_profissoes
// ============================================================================

async function deputadoProfissoesHandler(args: unknown, context: ToolContext): Promise<ToolResult> {
  const validated = validateInput(DeputadoProfissoesSchema, args);
  
  const response = await context.httpClient.get(`/deputados/${validated.id}/profissoes`);
  return formatResult(response.data);
}

export const deputadoProfissoes: ToolDefinition = {
  name: 'deputado_profissoes',
  description: 'Get professions declared by a deputy, representing their professional qualifications and career background.',
  inputSchema: DeputadoProfissoesSchema,
  handler: deputadoProfissoesHandler,
  category: 'deputies',
};

// ============================================================================
// TOOL 12: deputado_mesa
// ============================================================================

async function deputadoMesaHandler(args: unknown, context: ToolContext): Promise<ToolResult> {
  const validated = validateInput(DeputadoMesaSchema, args);
  
  const queryParams = buildQueryParams({
    dataInicio: validated.dataInicio,
    dataFim: validated.dataFim,
    pagina: validated.pagina,
    itens: validated.itens,
  });

  const response = await context.httpClient.get(`/deputados/${validated.id}/mesa`, queryParams);
  return formatResult(response.data);
}

export const deputadoMesa: ToolDefinition = {
  name: 'deputado_mesa',
  description: 'Get leadership positions held by a deputy in the Chamber\'s directing board (Mesa Diretora). Can be filtered by date range.',
  inputSchema: DeputadoMesaSchema,
  handler: deputadoMesaHandler,
  category: 'deputies',
};

// ============================================================================
// TOOL 13: deputado_liderancas
// ============================================================================

async function deputadoLiderancasHandler(args: unknown, context: ToolContext): Promise<ToolResult> {
  const validated = validateInput(DeputadoLiderancasSchema, args);
  
  const queryParams = buildQueryParams({
    dataInicio: validated.dataInicio,
    dataFim: validated.dataFim,
    pagina: validated.pagina,
    itens: validated.itens,
  });

  const response = await context.httpClient.get(`/deputados/${validated.id}/liderancas`, queryParams);
  return formatResult(response.data);
}

export const deputadoLiderancas: ToolDefinition = {
  name: 'deputado_liderancas',
  description: 'Get party leadership roles held by a deputy, such as party leader or whip positions. Can be filtered by date range.',
  inputSchema: DeputadoLiderancasSchema,
  handler: deputadoLiderancasHandler,
  category: 'deputies',
};

// ============================================================================
// TOOL 14: deputado_cargos
// ============================================================================

async function deputadoCargosHandler(args: unknown, context: ToolContext): Promise<ToolResult> {
  const validated = validateInput(DeputadoCargosSchema, args);
  
  const queryParams = buildQueryParams({
    dataInicio: validated.dataInicio,
    dataFim: validated.dataFim,
    pagina: validated.pagina,
    itens: validated.itens,
  });

  const response = await context.httpClient.get(`/deputados/${validated.id}/cargos`, queryParams);
  return formatResult(response.data);
}

export const deputadoCargos: ToolDefinition = {
  name: 'deputado_cargos',
  description: 'Get positions and roles held by a deputy within the Chamber, including committee positions and other assignments.',
  inputSchema: DeputadoCargosSchema,
  handler: deputadoCargosHandler,
  category: 'deputies',
};

// ============================================================================
// TOOL 15: deputado_filiacoes
// ============================================================================

async function deputadoFiliacoesHandler(args: unknown, context: ToolContext): Promise<ToolResult> {
  const validated = validateInput(DeputadoFiliacoesSchema, args);
  
  const queryParams = buildQueryParams({
    dataInicio: validated.dataInicio,
    dataFim: validated.dataFim,
    pagina: validated.pagina,
    itens: validated.itens,
  });

  const response = await context.httpClient.get(`/deputados/${validated.id}/filiacoes`, queryParams);
  return formatResult(response.data);
}

export const deputadoFiliacoes: ToolDefinition = {
  name: 'deputado_filiacoes',
  description: 'Get party affiliation history for a deputy, showing all parties they have been affiliated with over time.',
  inputSchema: DeputadoFiliacoesSchema,
  handler: deputadoFiliacoesHandler,
  category: 'deputies',
};

// ============================================================================
// EXPORT ALL DEPUTY TOOLS
// ============================================================================

export const deputyTools: ToolDefinition[] = [
  deputadosListar,
  deputadoDetalhes,
  deputadoDespesas,
  deputadoDiscursos,
  deputadoEventos,
  deputadoFrentes,
  deputadoHistorico,
  deputadoMandatosExternos,
  deputadoOcupacoes,
  deputadoOrgaos,
  deputadoProfissoes,
  deputadoMesa,
  deputadoLiderancas,
  deputadoCargos,
  deputadoFiliacoes,
];
