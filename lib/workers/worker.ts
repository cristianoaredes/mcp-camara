/**
 * Cloudflare Workers entry point
 * Handles HTTP requests and routes them to MCP or REST endpoints
 */

import { CamaraServer } from '../core/mcp-server.js';
import { loadConfig } from '../config/index.js';
import type { MCPServerConfig } from '../config/index.js';
import { createKVCache } from './kv-cache.js';
import { createKVRateLimiter } from './kv-rate-limiter.js';
import { RateLimitError } from '../shared/utils/errors.js';
import { generateOpenAPISpec } from './openapi-spec.js';
import { handleSSEEndpoint } from './sse.js';

/**
 * Cloudflare Workers environment bindings
 */
export interface WorkerEnv {
  MCP_CACHE: KVNamespace;
  RATE_LIMIT_KV: KVNamespace;
  MCP_API_KEY?: string;
  CAMARA_API_BASE_URL?: string;
  MCP_CACHE_TTL?: string;
  LOG_LEVEL?: string;
  MCP_DISABLE_RATE_LIMIT?: string;
}

/**
 * Create server configuration for Workers environment
 */
function createWorkerConfig(env: WorkerEnv): MCPServerConfig {
  const baseConfig = loadConfig();
  
  return {
    ...baseConfig,
    transport: 'http',
    apiBaseUrl: env.CAMARA_API_BASE_URL || baseConfig.apiBaseUrl,
    cacheTTL: env.MCP_CACHE_TTL ? parseInt(env.MCP_CACHE_TTL, 10) : baseConfig.cacheTTL,
    logLevel: (env.LOG_LEVEL as MCPServerConfig['logLevel']) || baseConfig.logLevel,
    apiKey: env.MCP_API_KEY || baseConfig.apiKey,
  };
}

/**
 * Handle MCP protocol requests (JSON-RPC 2.0)
 */
async function handleMCPRequest(
  request: Request,
  server: CamaraServer
): Promise<Response> {
  try {
    const body = await request.json() as any;
    
    // Validate JSON-RPC 2.0 format
    if (!body.jsonrpc || body.jsonrpc !== '2.0') {
      return new Response(
        JSON.stringify({
          jsonrpc: '2.0',
          id: body.id || null,
          error: {
            code: -32600,
            message: 'Invalid Request: jsonrpc must be "2.0"',
          },
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Handle tools/list
    if (body.method === 'tools/list') {
      const tools = server.getRegistry().getAll().map(tool => ({
        name: tool.name,
        description: tool.description,
        inputSchema: {
          type: 'object' as const,
          properties: {},
          required: [],
        },
      }));

      return new Response(
        JSON.stringify({
          jsonrpc: '2.0',
          id: body.id,
          result: { tools },
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Handle tools/call
    if (body.method === 'tools/call') {
      const { name, arguments: args } = body.params || {};
      
      if (!name) {
        return new Response(
          JSON.stringify({
            jsonrpc: '2.0',
            id: body.id,
            error: {
              code: -32602,
              message: 'Invalid params: name is required',
            },
          }),
          {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }

      const result = await server.handleToolCall(name, args || {});

      return new Response(
        JSON.stringify({
          jsonrpc: '2.0',
          id: body.id,
          result,
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Unknown method
    return new Response(
      JSON.stringify({
        jsonrpc: '2.0',
        id: body.id,
        error: {
          code: -32601,
          message: `Method not found: ${body.method}`,
        },
      }),
      {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        jsonrpc: '2.0',
        id: null,
        error: {
          code: -32700,
          message: 'Parse error: Invalid JSON',
        },
      }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

/**
 * Authenticate API key from request headers
 */
function authenticateRequest(request: Request, env: WorkerEnv): boolean {
  // If no API key is configured, allow all requests
  if (!env.MCP_API_KEY) {
    return false; // Not authenticated, but allowed
  }

  const apiKey = request.headers.get('X-API-Key');
  return apiKey === env.MCP_API_KEY;
}

/**
 * Get client identifier for rate limiting (IP address or API key)
 */
function getClientIdentifier(request: Request): string {
  // Try to get IP from CF-Connecting-IP header (Cloudflare-specific)
  const cfIp = request.headers.get('CF-Connecting-IP');
  if (cfIp) {
    return cfIp;
  }

  // Fallback to X-Forwarded-For
  const forwardedFor = request.headers.get('X-Forwarded-For');
  if (forwardedFor) {
    const firstIp = forwardedFor.split(',')[0];
    return firstIp ? firstIp.trim() : 'unknown';
  }

  // Last resort: use API key if present
  const apiKey = request.headers.get('X-API-Key');
  if (apiKey) {
    return `apikey:${apiKey}`;
  }

  return 'unknown';
}

/**
 * Handle REST API requests with authentication
 */
async function handleRESTRequest(
  request: Request,
  server: CamaraServer,
  pathname: string,
  env: WorkerEnv
): Promise<Response> {
  // Check authentication for REST endpoints
  const isAuthenticated = authenticateRequest(request, env);
  
  // If API key is required but not provided/invalid, return 401
  if (env.MCP_API_KEY && !isAuthenticated) {
    return new Response(
      JSON.stringify({
        error: 'Unauthorized',
        message: 'Valid X-API-Key header is required for REST API access',
      }),
      {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  // Extract resource type and ID from path
  const match = pathname.match(/^\/(deputados|proposicoes|votacoes|eventos)\/(\d+)$/);
  
  if (!match) {
    return new Response(
      JSON.stringify({
        error: 'Not Found',
        message: 'Invalid REST endpoint. Supported: /deputados/{id}, /proposicoes/{id}, /votacoes/{id}, /eventos/{id}',
      }),
      {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  const [, resourceType, id] = match;
  
  if (!resourceType || !id) {
    return new Response(
      JSON.stringify({
        error: 'Bad Request',
        message: 'Invalid resource path',
      }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
  
  // Map resource type to tool name
  const toolMap: Record<string, string> = {
    deputados: 'deputado_detalhes',
    proposicoes: 'proposicao_detalhes',
    votacoes: 'votacao_detalhes',
    eventos: 'evento_detalhes',
  };

  const toolName = toolMap[resourceType];
  
  if (!toolName) {
    return new Response(
      JSON.stringify({
        error: 'Not Found',
        message: `No tool found for resource type: ${resourceType}`,
      }),
      {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
  
  const args = { id: parseInt(id, 10) };

  try {
    const result = await server.handleToolCall(toolName, args);

    if (result.isError) {
      return new Response(
        result.content[0]?.text || 'Error occurred',
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    return new Response(
      result.content[0]?.text || '{}',
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: 'Internal Server Error',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

/**
 * Handle health check requests
 */
function handleHealthCheck(server: CamaraServer): Response {
  const stats = server.getStats();
  
  return new Response(
    JSON.stringify({
      status: 'healthy',
      version: stats.config.version,
      toolCount: stats.toolCount,
      initialized: stats.initialized,
      timestamp: new Date().toISOString(),
    }),
    {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }
  );
}

/**
 * Main fetch handler for Cloudflare Workers
 */
export default {
  async fetch(
    request: Request,
    env: WorkerEnv,
    _ctx: ExecutionContext
  ): Promise<Response> {
    const url = new URL(request.url);
    const pathname = url.pathname;

    // CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, X-API-Key',
    };

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: corsHeaders,
      });
    }

    try {
      // Initialize rate limiter
      const rateLimiter = createKVRateLimiter(env.RATE_LIMIT_KV, {
        enabled: env.MCP_DISABLE_RATE_LIMIT !== 'true',
        defaultLimit: 30,
        authenticatedLimit: 100,
        windowMs: 60000,
      });

      // Check rate limit
      const clientId = getClientIdentifier(request);
      const isAuthenticated = authenticateRequest(request, env);
      
      try {
        const rateLimitInfo = await rateLimiter.checkLimit(clientId, isAuthenticated);
        
        // Add rate limit headers to all responses
        const rateLimitHeaders = {
          'X-RateLimit-Limit': rateLimitInfo.limit.toString(),
          'X-RateLimit-Remaining': rateLimitInfo.remaining.toString(),
          'X-RateLimit-Reset': new Date(rateLimitInfo.reset).toISOString(),
        };

        // Initialize server with Workers-specific config and KV cache
        const config = createWorkerConfig(env);
        const kvCache = createKVCache(env.MCP_CACHE, {
          enabled: config.cacheEnabled,
          ttl: config.cacheTTL,
        });
        
        const server = new CamaraServer(config, {
          cache: kvCache,
        });
        await server.initialize();

        // Route requests
        let response: Response;

        if (pathname === '/health') {
          response = handleHealthCheck(server);
        } else if (pathname === '/openapi.json') {
          const spec = generateOpenAPISpec(url.origin);
          response = new Response(JSON.stringify(spec, null, 2), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          });
        } else if (pathname === '/docs') {
          // Swagger UI endpoint
          const swaggerHTML = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>MCP Câmara - API Documentation</title>
  <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5.10.5/swagger-ui.css" />
  <style>
    body { margin: 0; padding: 0; }
    .topbar { display: none; }
  </style>
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://unpkg.com/swagger-ui-dist@5.10.5/swagger-ui-bundle.js"></script>
  <script src="https://unpkg.com/swagger-ui-dist@5.10.5/swagger-ui-standalone-preset.js"></script>
  <script>
    window.onload = function() {
      SwaggerUIBundle({
        url: '${url.origin}/openapi.json',
        dom_id: '#swagger-ui',
        deepLinking: true,
        presets: [
          SwaggerUIBundle.presets.apis,
          SwaggerUIStandalonePreset
        ],
        plugins: [
          SwaggerUIBundle.plugins.DownloadUrl
        ],
        layout: "StandaloneLayout"
      });
    };
  </script>
</body>
</html>
          `;
          response = new Response(swaggerHTML, {
            status: 200,
            headers: { 'Content-Type': 'text/html' },
          });
        } else if (pathname === '/mcp' && request.method === 'POST') {
          response = await handleMCPRequest(request, server);
        } else if (pathname === '/sse' && (request.method === 'GET' || request.method === 'POST')) {
          // SSE endpoint for real-time MCP communication
          return await handleSSEEndpoint(request, env);
        } else if (pathname === '/' && request.method === 'GET') {
          // Root endpoint with service information
          const toolNames = server.getRegistry().getAll().map(t => t.name);
          response = new Response(
            JSON.stringify({
              service: 'MCP Câmara dos Deputados',
              description: 'Model Context Protocol server for Brazilian Chamber of Deputies data',
              version: '1.0.2',
              runtime: 'cloudflare-workers',
              free_tier: {
                workers: '100,000 requests/day',
                kv: '100,000 reads/day, 1,000 writes/day, 1GB storage',
                note: 'Perfect for MCP remote server hosting',
              },
              endpoints: {
                mcp: '/mcp (HTTP JSON-RPC)',
                sse: '/sse (Server-Sent Events)',
                health: '/health',
                rest: '/{resource}/{id} (deputados, proposicoes, votacoes, eventos)',
                docs: '/docs (Swagger UI)',
                openapi: '/openapi.json',
              },
              tools: {
                count: toolNames.length,
                categories: {
                  deputies: 15,
                  propositions: 10,
                  votings: 4,
                  committees: 5,
                  parties: 6,
                  events: 7,
                  references: 15,
                },
              },
              documentation: 'https://github.com/cristianoaredes/mcp-camara',
              npm: 'https://www.npmjs.com/package/@aredes.me/mcp-camara',
              cloudflare_docs: {
                agents: 'https://developers.cloudflare.com/agents/',
                sse: 'https://developers.cloudflare.com/agents/api-reference/http-sse/',
                pricing: 'https://developers.cloudflare.com/workers/platform/pricing/',
              },
            }, null, 2),
            {
              status: 200,
              headers: { 'Content-Type': 'application/json' },
            }
          );
        } else if (request.method === 'GET' && pathname.match(/^\/(deputados|proposicoes|votacoes|eventos)\/\d+$/)) {
          response = await handleRESTRequest(request, server, pathname, env);
        } else {
          response = new Response(
            JSON.stringify({
              error: 'Not Found',
              message: 'Available endpoints: POST /mcp, GET /sse, GET /health, GET /docs, GET /{resource}/{id}, GET /openapi.json',
            }),
            {
              status: 404,
              headers: { 'Content-Type': 'application/json' },
            }
          );
        }

        // Add CORS and rate limit headers to response
        Object.entries({ ...corsHeaders, ...rateLimitHeaders }).forEach(([key, value]) => {
          response.headers.set(key, value);
        });

        return response;
      } catch (error) {
        // Handle rate limit errors
        if (error instanceof RateLimitError) {
          return new Response(
            JSON.stringify({
              error: 'Too Many Requests',
              message: error.message,
              retryAfter: error.retryAfter,
            }),
            {
              status: 429,
              headers: {
                'Content-Type': 'application/json',
                'Retry-After': error.retryAfter.toString(),
                ...corsHeaders,
              },
            }
          );
        }
        throw error;
      }
    } catch (error) {
      return new Response(
        JSON.stringify({
          error: 'Internal Server Error',
          message: error instanceof Error ? error.message : 'Unknown error',
        }),
        {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
          },
        }
      );
    }
  },
};
