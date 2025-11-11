/**
 * Tool registry and definitions for the MCP server
 * Manages the 62 tools organized into 7 categories
 */

import type { z } from 'zod';
import type { CamaraHttpClient } from './http-client.js';
import type { MCPServerConfig } from '../config/index.js';
import type { Logger } from '../shared/utils/logger.js';

/**
 * Cache-like interface that both CacheLayer and CloudflareKVCache implement
 */
export interface CacheInterface {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, ttl?: number): Promise<void>;
  has(key: string): boolean | Promise<boolean>;
  clear(): void;
  generateKey(endpoint: string, params?: Record<string, string | number | boolean | undefined>): string;
}

/**
 * Tool categories for organizing the 62 tools
 */
export type ToolCategory =
  | 'deputies'       // 15 tools: list, details, expenses, speeches, events, fronts, history, etc.
  | 'propositions'   // 10 tools: list, details, authors, related, themes, processing, votes
  | 'votings'        // 4 tools: list, details, votes, party orientations
  | 'committees'     // 5 tools: list, details, members, events, votes
  | 'parties'        // 6 tools: parties list/details/members/leaders, blocs list/details
  | 'events'         // 7 tools: list, details, agenda, deputies, committees, votes
  | 'references';    // 15 tools: status codes, types, classifications

/**
 * Context provided to tool handlers for executing operations
 */
export interface ToolContext {
  httpClient: CamaraHttpClient;
  cache: CacheInterface;
  config: MCPServerConfig;
  logger: Logger;
}

/**
 * Result returned by tool handlers
 * Matches the MCP SDK's CallToolResult type
 */
export interface ToolResult {
  content: Array<{ type: 'text'; text: string }>;
  isError?: boolean;
  [key: string]: unknown; // Index signature for MCP SDK compatibility
}

/**
 * Handler function for a tool
 * Receives validated arguments and context, returns formatted result
 */
export interface ToolHandler {
  (args: unknown, context: ToolContext): Promise<ToolResult>;
}

/**
 * Complete definition of a tool
 */
export interface ToolDefinition {
  name: string;
  description: string;
  inputSchema: z.ZodSchema;
  handler: ToolHandler;
  category: ToolCategory;
}

/**
 * Tool registry for managing all available tools
 */
export class ToolRegistry {
  private tools: Map<string, ToolDefinition> = new Map();

  /**
   * Register a tool in the registry
   */
  register(tool: ToolDefinition): void {
    if (this.tools.has(tool.name)) {
      throw new Error(`Tool "${tool.name}" is already registered`);
    }
    this.tools.set(tool.name, tool);
  }

  /**
   * Register multiple tools at once
   */
  registerMany(tools: ToolDefinition[]): void {
    for (const tool of tools) {
      this.register(tool);
    }
  }

  /**
   * Get a tool by name
   */
  get(name: string): ToolDefinition | undefined {
    return this.tools.get(name);
  }

  /**
   * Check if a tool exists
   */
  has(name: string): boolean {
    return this.tools.has(name);
  }

  /**
   * Get all registered tools
   */
  getAll(): ToolDefinition[] {
    return Array.from(this.tools.values());
  }

  /**
   * Get tools by category
   */
  getByCategory(category: ToolCategory): ToolDefinition[] {
    return this.getAll().filter(tool => tool.category === category);
  }

  /**
   * Get all tool names
   */
  getNames(): string[] {
    return Array.from(this.tools.keys());
  }

  /**
   * Get count of registered tools
   */
  count(): number {
    return this.tools.size;
  }

  /**
   * Clear all registered tools
   */
  clear(): void {
    this.tools.clear();
  }
}

/**
 * Tool name constants organized by category
 * These represent all 62 tools that will be implemented
 */
export const DEPUTY_TOOLS = [
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
] as const;

export const PROPOSITION_TOOLS = [
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
] as const;

export const VOTING_TOOLS = [
  'votacoes_listar',
  'votacao_detalhes',
  'votacao_votos',
  'votacao_orientacoes',
] as const;

export const COMMITTEE_TOOLS = [
  'orgaos_listar',
  'orgao_detalhes',
  'orgao_membros',
  'orgao_eventos',
  'orgao_votacoes',
] as const;

export const PARTY_TOOLS = [
  'partidos_listar',
  'partido_detalhes',
  'partido_membros',
  'partido_lideres',
  'blocos_listar',
  'bloco_detalhes',
] as const;

export const EVENT_TOOLS = [
  'eventos_listar',
  'evento_detalhes',
  'evento_pauta',
  'evento_deputados',
  'evento_orgaos',
  'evento_votacoes',
  'evento_situacoes',
] as const;

export const REFERENCE_TOOLS = [
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
] as const;

/**
 * All tool names combined (62 total)
 */
export const ALL_TOOLS = [
  ...DEPUTY_TOOLS,
  ...PROPOSITION_TOOLS,
  ...VOTING_TOOLS,
  ...COMMITTEE_TOOLS,
  ...PARTY_TOOLS,
  ...EVENT_TOOLS,
  ...REFERENCE_TOOLS,
] as const;

/**
 * Type for valid tool names
 */
export type ToolName = typeof ALL_TOOLS[number];

/**
 * Verify that we have exactly 62 tools as specified in requirements
 */
const EXPECTED_TOOL_COUNT = 62;
if (ALL_TOOLS.length !== EXPECTED_TOOL_COUNT) {
  throw new Error(
    `Tool count mismatch: Expected ${EXPECTED_TOOL_COUNT} tools, but found ${ALL_TOOLS.length}`
  );
}
