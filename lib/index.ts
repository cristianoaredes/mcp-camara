/**
 * Main entry point for the Câmara dos Deputados MCP Server
 * Exports core components for programmatic usage
 */

export { CamaraServer } from './core/mcp-server.js';
export { CamaraHttpClient } from './core/http-client.js';
export { CacheLayer } from './core/cache.js';
export type { MCPServerConfig } from './config/index.js';
export type { ToolDefinition, ToolContext, ToolResult } from './core/tools.js';
