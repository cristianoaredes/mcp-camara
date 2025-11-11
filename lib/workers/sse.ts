/**
 * Server-Sent Events (SSE) handler for Cloudflare Workers
 * Implements MCP protocol over SSE for real-time communication
 */

import { CamaraServer } from '../core/mcp-server.js';
import { loadConfig } from '../config/index.js';
import type { MCPServerConfig } from '../config/index.js';
import { createKVCache } from './kv-cache.js';

export interface WorkerEnv {
  MCP_CACHE?: KVNamespace;
  RATE_LIMIT_KV?: KVNamespace;
  CAMARA_API_BASE_URL?: string;
  MCP_CACHE_TTL?: string;
  LOG_LEVEL?: string;
  MCP_DISABLE_RATE_LIMIT?: string;
  MCP_API_KEY?: string;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-API-Key',
};

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
 * Handle SSE endpoint for real-time MCP communication
 * Creates a streaming connection for server-sent events
 */
export async function handleSSEEndpoint(
  request: Request,
  env: WorkerEnv
): Promise<Response> {
  // Check if client accepts SSE (relaxed for MCP connectors)
  const acceptHeader = request.headers.get('Accept');
  if (
    acceptHeader &&
    !acceptHeader.includes('text/event-stream') &&
    !acceptHeader.includes('*/*')
  ) {
    return new Response('SSE endpoint requires Accept: text/event-stream', {
      status: 400,
      headers: corsHeaders,
    });
  }

  // Create SSE response stream
  const { readable, writable } = new TransformStream();
  const writer = writable.getWriter();
  const encoder = new TextEncoder();

  // SSE headers
  const sseHeaders = {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    ...corsHeaders,
  };

  // Send SSE message helper
  const sendSSEMessage = async (data: unknown, event?: string, id?: string) => {
    let message = '';
    if (id) message += `id: ${id}\n`;
    if (event) message += `event: ${event}\n`;
    message += `data: ${JSON.stringify(data)}\n\n`;

    try {
      await writer.write(encoder.encode(message));
    } catch (error) {
      console.error('SSE write error:', error);
    }
  };

  // Handle the SSE connection asynchronously
  (async () => {
    try {
      // Send connection established event IMMEDIATELY
      await sendSSEMessage(
        {
          type: 'connection',
          status: 'connected',
          server: 'mcp-camara',
          version: '1.0.3',
          timestamp: new Date().toISOString(),
        },
        'connection'
      );

      // Send server capabilities BEFORE initializing (to keep stream alive)
      await sendSSEMessage(
        {
          jsonrpc: '2.0',
          id: 'init',
          result: {
            protocolVersion: '2024-11-05',
            capabilities: {
              tools: {},
            },
            serverInfo: {
              name: 'mcp-camara',
              version: '1.0.3',
            },
          },
        },
        'message'
      );

      // NOW initialize MCP server (this may take time)
      const config = createWorkerConfig(env);
      const cache = env.MCP_CACHE ? createKVCache(env.MCP_CACHE, {
        enabled: true,
        ttl: config.cacheTTL,
        maxSize: 0,
      }) : undefined;
      
      const server = new CamaraServer(config, { cache, httpClient: undefined });
      await server.initialize();

      // Send ready event after initialization
      await sendSSEMessage(
        {
          type: 'ready',
          toolCount: 62,
          timestamp: new Date().toISOString(),
        },
        'ready'
      );

      // Keep connection alive with periodic pings
      const pingInterval = setInterval(async () => {
        try {
          await sendSSEMessage(
            {
              type: 'ping',
              timestamp: new Date().toISOString(),
            },
            'ping'
          );
        } catch (error) {
          clearInterval(pingInterval);
        }
      }, 30000); // Ping every 30 seconds

      // Handle incoming messages from request body (if any)
      if (request.method === 'POST') {
        try {
          const body = await request.text();
          if (body) {
            const mcpRequest: any = JSON.parse(body);

            // Handle tools/list
            if (mcpRequest.method === 'tools/list') {
              const tools = server.getRegistry().getAll().map(tool => ({
                name: tool.name,
                description: tool.description,
                inputSchema: {
                  type: 'object' as const,
                  properties: {},
                  required: [],
                },
              }));

              await sendSSEMessage(
                {
                  jsonrpc: '2.0',
                  id: mcpRequest.id,
                  result: { tools },
                },
                'message',
                mcpRequest.id?.toString()
              );
            }
            // Handle tools/call
            else if (mcpRequest.method === 'tools/call') {
              const { name, arguments: args } = mcpRequest.params || {};
              const result = await server.handleToolCall(name, args || {});

              await sendSSEMessage(
                {
                  jsonrpc: '2.0',
                  id: mcpRequest.id,
                  result,
                },
                'message',
                mcpRequest.id?.toString()
              );
            }
          }
        } catch (error) {
          await sendSSEMessage(
            {
              jsonrpc: '2.0',
              id: null,
              error: {
                code: -32700,
                message: 'Parse error',
                data: error instanceof Error ? error.message : 'Invalid JSON',
              },
            },
            'error'
          );
        }
      }

      // Clean up on connection close (Cloudflare Workers CPU time limit)
      setTimeout(() => {
        clearInterval(pingInterval);
        writer.close().catch(() => {/* ignore close errors */});
      }, 50000); // Close after 50 seconds
    } catch (error) {
      console.error('SSE handler error:', error);
      try {
        await sendSSEMessage(
          {
            type: 'error',
            message: error instanceof Error ? error.message : 'Unknown error',
          },
          'error'
        );
      } catch (e) {
        // Ignore write errors
      }
      writer.close().catch(() => {/* ignore close errors */});
    }
  })().catch(err => console.error('SSE async error:', err));

  return new Response(readable, {
    status: 200,
    headers: sseHeaders,
  });
}
