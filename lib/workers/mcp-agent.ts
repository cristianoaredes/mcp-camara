/**
 * Câmara MCP Agent for Cloudflare Workers
 * Uses Cloudflare's agents SDK with Durable Objects for persistent state
 */

import { McpAgent } from "agents/mcp";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { allTools } from '../tools/index.js';
import { CamaraHttpClient } from '../core/http-client.js';
import { createKVCache } from './kv-cache.js';
import { Logger } from '../shared/utils/logger.js';
import type { MCPServerConfig } from '../config/index.js';

/**
 * Environment bindings for Câmara MCP Agent
 */
export interface CamaraMCPEnv {
  MCP_CACHE?: KVNamespace;
  RATE_LIMIT_KV?: KVNamespace;
  CAMARA_API_BASE_URL?: string;
  MCP_CACHE_TTL?: string;
  LOG_LEVEL?: string;
  MCP_DISABLE_RATE_LIMIT?: string;
  MCP_API_KEY?: string;
}

/**
 * Câmara MCP Agent
 * Extends McpAgent to provide Brazilian Chamber of Deputies data access
 */
export class CamaraMCP extends McpAgent<CamaraMCPEnv> {
  server = new McpServer({
    name: "mcp-camara",
    version: "1.0.6",
  });

  protected declare env: CamaraMCPEnv;
  private httpClient: CamaraHttpClient | null = null;
  private cache: Awaited<ReturnType<typeof createKVCache>> | null = null;
  private config: MCPServerConfig | null = null;

  /**
   * Initialize the MCP server and register all tools
   */
  async init() {
    console.log('[CamaraMCP] Initializing server...');

    // Create configuration from environment
    this.config = this.createConfig();

    // Create HTTP client for Câmara API
    this.httpClient = new CamaraHttpClient({
      baseURL: this.config.apiBaseUrl,
      timeout: 30000,
      retryAttempts: 3,
      retryDelay: 1000,
      userAgent: `${this.config.name}/${this.config.version}`,
    });

    // Create KV cache if available
    if (this.env.MCP_CACHE) {
      this.cache = createKVCache(this.env.MCP_CACHE, {
        enabled: true,
        ttl: this.config.cacheTTL,
        maxSize: 0,
      });
    }

    // Register all tools
    await this.registerTools();

    console.log(`[CamaraMCP] Initialized with ${allTools.length} tools`);
  }

  /**
   * Create configuration from environment variables
   */
  private createConfig(): MCPServerConfig {
    return {
      name: 'mcp-camara',
      version: '1.0.6',
      transport: 'sse',
      httpPort: 8787,
      apiBaseUrl: this.env.CAMARA_API_BASE_URL || 'https://dadosabertos.camara.leg.br/api/v2',
      cacheEnabled: !!this.env.MCP_CACHE,
      cacheTTL: this.env.MCP_CACHE_TTL ? parseInt(this.env.MCP_CACHE_TTL, 10) : 3600,
      cacheMaxSize: 1000,
      logLevel: (this.env.LOG_LEVEL as MCPServerConfig['logLevel']) || 'INFO',
      rateLimitEnabled: this.env.MCP_DISABLE_RATE_LIMIT !== 'true',
      rateLimitPerMinute: 60,
      rateLimitAuthenticatedPerMinute: 120,
      apiKey: this.env.MCP_API_KEY,
    };
  }

  /**
   * Register all tools with the MCP server
   */
  private async registerTools() {
    if (!this.httpClient || !this.config) {
      throw new Error('HTTP client or config not initialized');
    }

    const toolContext = {
      httpClient: this.httpClient,
      cache: this.cache || {
        get: async () => null,
        set: async () => {},
        delete: async () => {},
        clear: async () => {},
        has: async () => false,
        size: async () => 0,
        generateKey: (endpoint: string, params?: Record<string, string | number | boolean | undefined>) => {
          if (!params) return endpoint;
          const queryString = Object.entries(params)
            .filter(([_, v]) => v !== undefined)
            .map(([k, v]) => `${k}=${v}`)
            .join('&');
          return queryString ? `${endpoint}?${queryString}` : endpoint;
        },
      },
      logger: new Logger(this.config.logLevel),
      config: this.config,
    };

    for (const tool of allTools) {
      // Register tool with just name, description and handler
      // The deprecated signature still works for now
      this.server.tool(
        tool.name,
        tool.description,
        async (args: unknown) => {
          try {
            const result = await tool.handler(args, toolContext);
            return result;
          } catch (error) {
            console.error(`[CamaraMCP] Tool ${tool.name} error:`, error);
            throw error;
          }
        }
      );
    }

    console.log(`[CamaraMCP] Registered ${allTools.length} tools`);
  }
}

/**
 * Export the mounted MCP agent for Cloudflare Workers
 * This is the default export that Wrangler expects
 */
export default CamaraMCP.mount("/sse");
