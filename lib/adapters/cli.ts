/**
 * Transport Adapters
 * Provides STDIO and HTTP transport for AI assistants
 * Handles process signals for graceful shutdown
 */

import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import express, { type Request, type Response, type NextFunction } from 'express';
import type { Server as HttpServer } from 'http';
import type { CamaraServer } from '../core/mcp-server.js';
import { Logger } from '../shared/utils/logger.js';

/**
 * STDIO adapter for MCP server
 * Connects the server to stdin/stdout streams and handles graceful shutdown
 */
export class StdioAdapter {
  private server: CamaraServer;
  private logger: Logger;
  private transport: StdioServerTransport | null = null;
  private isShuttingDown = false;

  constructor(server: CamaraServer) {
    this.server = server;
    // Get logger from server stats
    const stats = this.server.getStats();
    this.logger = new Logger(stats.config.logLevel);
  }

  /**
   * Start the STDIO transport
   * Initializes MCP SDK StdioServerTransport and connects to stdin/stdout
   */
  async start(): Promise<void> {
    this.logger.info('Starting STDIO transport adapter');

    try {
      // Create STDIO transport
      this.transport = new StdioServerTransport();
      
      // Connect server to transport
      const mcpServer = this.server.getServer();
      await mcpServer.connect(this.transport);

      this.logger.info('STDIO transport connected successfully');

      // Set up signal handlers for graceful shutdown
      this.setupSignalHandlers();

      this.logger.info('STDIO adapter ready to accept requests');
    } catch (error) {
      this.logger.logError(
        'Failed to start STDIO transport',
        error instanceof Error ? error : new Error(String(error))
      );
      throw error;
    }
  }

  /**
   * Set up process signal handlers for graceful shutdown
   * Handles SIGINT (Ctrl+C) and SIGTERM signals
   */
  private setupSignalHandlers(): void {
    const signals: NodeJS.Signals[] = ['SIGINT', 'SIGTERM'];

    signals.forEach(signal => {
      process.on(signal, async () => {
        if (this.isShuttingDown) {
          // Force exit if already shutting down
          this.logger.warn(`Received ${signal} during shutdown, forcing exit`);
          process.exit(1);
        }

        this.isShuttingDown = true;
        this.logger.info(`Received ${signal}, initiating graceful shutdown`);

        try {
          await this.shutdown();
          this.logger.info('Graceful shutdown complete');
          process.exit(0);
        } catch (error) {
          this.logger.logError(
            'Error during shutdown',
            error instanceof Error ? error : new Error(String(error))
          );
          process.exit(1);
        }
      });
    });

    // Handle uncaught exceptions
    process.on('uncaughtException', (error: Error) => {
      this.logger.logError('Uncaught exception', error);
      process.exit(1);
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason: any) => {
      this.logger.logError(
        'Unhandled promise rejection',
        reason instanceof Error ? reason : new Error(String(reason))
      );
      process.exit(1);
    });
  }

  /**
   * Perform graceful shutdown
   * Closes transport and cleans up resources
   */
  private async shutdown(): Promise<void> {
    this.logger.info('Shutting down STDIO adapter');

    // Close transport if it exists
    if (this.transport) {
      try {
        await this.transport.close();
        this.logger.info('STDIO transport closed');
      } catch (error) {
        this.logger.warn('Error closing transport', {
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    // Additional cleanup can be added here if needed
    // For example: flushing caches, closing database connections, etc.
  }

  /**
   * Check if the adapter is currently shutting down
   */
  isShutdown(): boolean {
    return this.isShuttingDown;
  }
}

/**
 * SSE client connection
 * Tracks active SSE connections for lifecycle management
 */
interface SSEConnection {
  id: string;
  res: Response;
  connectedAt: Date;
  lastHeartbeat: Date;
}

/**
 * HTTP adapter for MCP server
 * Provides HTTP transport with JSON-RPC 2.0 support
 * Includes health checks, CORS, request logging, and SSE streaming
 */
export class HttpAdapter {
  private server: CamaraServer;
  private logger: Logger;
  private app: express.Application;
  private httpServer: HttpServer | null = null;
  private port: number;
  private isShuttingDown = false;
  private sseConnections: Map<string, SSEConnection> = new Map();
  private heartbeatInterval: NodeJS.Timeout | null = null;

  constructor(server: CamaraServer, port: number) {
    this.server = server;
    this.port = port;
    
    // Get logger from server stats
    const stats = this.server.getStats();
    this.logger = new Logger(stats.config.logLevel);
    
    // Initialize Express app
    this.app = express();
    this.setupMiddleware();
    this.setupRoutes();
  }

  /**
   * Set up Express middleware
   * Includes JSON parsing, CORS, and request logging
   */
  private setupMiddleware(): void {
    // Parse JSON request bodies
    this.app.use(express.json());

    // CORS middleware - allow all origins for MCP protocol
    this.app.use((req: Request, res: Response, next: NextFunction) => {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-API-Key');
      res.setHeader('Access-Control-Max-Age', '86400'); // 24 hours
      
      // Handle preflight requests
      if (req.method === 'OPTIONS') {
        res.status(204).end();
        return;
      }
      
      next();
    });

    // Request logging middleware
    this.app.use((req: Request, res: Response, next: NextFunction) => {
      const startTime = Date.now();
      const logger = this.logger;
      
      // Log request
      logger.debug('HTTP request received', {
        httpMethod: req.method,
        url: req.url,
        requestContext: {
          userAgent: req.get('user-agent'),
          contentType: req.get('content-type'),
        },
      });

      // Capture response
      const originalSend = res.send;
      res.send = function (this: Response, data: any): Response {
        const duration = Date.now() - startTime;
        
        // Log response
        logger.logApiRequest(
          req.method,
          req.url,
          res.statusCode,
          duration
        );
        
        return originalSend.call(this, data);
      };

      next();
    });
  }

  /**
   * Set up Express routes
   * Includes /mcp endpoint for JSON-RPC 2.0 and /health for health checks
   */
  private setupRoutes(): void {
    // Health check endpoint
    this.app.get('/health', (_req: Request, res: Response) => {
      const stats = this.server.getStats();
      const sseStats = this.getSSEStats();
      
      res.json({
        status: 'healthy',
        server: {
          name: stats.config.name,
          version: stats.config.version,
          initialized: stats.initialized,
          toolCount: stats.toolCount,
        },
        sse: {
          activeConnections: sseStats.activeConnections,
          heartbeatActive: this.heartbeatInterval !== null,
        },
        timestamp: new Date().toISOString(),
      });
    });

    // MCP endpoint for JSON-RPC 2.0 requests
    this.app.post('/mcp', async (req: Request, res: Response) => {
      try {
        const jsonRpcRequest = req.body;
        
        // Validate JSON-RPC 2.0 format
        if (!jsonRpcRequest || typeof jsonRpcRequest !== 'object') {
          return res.status(400).json({
            jsonrpc: '2.0',
            error: {
              code: -32600,
              message: 'Invalid Request: Request body must be a JSON object',
            },
            id: null,
          });
        }

        if (jsonRpcRequest.jsonrpc !== '2.0') {
          return res.status(400).json({
            jsonrpc: '2.0',
            error: {
              code: -32600,
              message: 'Invalid Request: jsonrpc field must be "2.0"',
            },
            id: jsonRpcRequest.id || null,
          });
        }

        if (!jsonRpcRequest.method || typeof jsonRpcRequest.method !== 'string') {
          return res.status(400).json({
            jsonrpc: '2.0',
            error: {
              code: -32600,
              message: 'Invalid Request: method field is required and must be a string',
            },
            id: jsonRpcRequest.id || null,
          });
        }

        // Handle different MCP methods
        const method = jsonRpcRequest.method;
        const params = jsonRpcRequest.params || {};
        const id = jsonRpcRequest.id;

        this.logger.info('JSON-RPC request received', {
          requestContext: {
            method,
            id,
            hasParams: Object.keys(params).length > 0,
          },
        });

        let result: any;

        if (method === 'tools/list') {
          // Get all tools from the server
          const mcpServer = this.server.getServer();
          const tools = await this.getToolsList(mcpServer);
          result = { tools };
        } else if (method === 'tools/call') {
          // Validate tool call parameters
          if (!params.name || typeof params.name !== 'string') {
            return res.status(400).json({
              jsonrpc: '2.0',
              error: {
                code: -32602,
                message: 'Invalid params: name field is required for tools/call',
              },
              id,
            });
          }

          // Execute tool
          const toolResult = await this.server.handleToolCall(
            params.name,
            params.arguments || {}
          );
          result = toolResult;
        } else {
          // Method not found
          return res.status(404).json({
            jsonrpc: '2.0',
            error: {
              code: -32601,
              message: `Method not found: ${method}`,
            },
            id,
          });
        }

        // Return successful response
        return res.json({
          jsonrpc: '2.0',
          result,
          id,
        });
      } catch (error) {
        this.logger.logError(
          'Error handling MCP request',
          error instanceof Error ? error : new Error(String(error))
        );

        return res.status(500).json({
          jsonrpc: '2.0',
          error: {
            code: -32603,
            message: 'Internal error',
            data: error instanceof Error ? error.message : String(error),
          },
          id: req.body?.id || null,
        });
      }
    });

    // SSE endpoint for streaming MCP protocol
    this.app.get('/sse', (req: Request, res: Response) => {
      this.handleSSEConnection(req, res);
    });

    // 404 handler for unknown routes
    this.app.use((req: Request, res: Response) => {
      res.status(404).json({
        error: 'Not Found',
        message: `Route ${req.method} ${req.url} not found`,
        availableEndpoints: [
          'GET /health',
          'POST /mcp',
          'GET /sse',
        ],
      });
    });

    // Error handler
    this.app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
      this.logger.logError('Express error handler', err);
      
      res.status(500).json({
        error: 'Internal Server Error',
        message: err.message,
      });
    });
  }

  /**
   * Get list of tools from MCP server
   * Helper method to extract tool definitions
   */
  private async getToolsList(_mcpServer: any): Promise<any[]> {
    // Get tool registry from server
    const registry = this.server.getRegistry();
    const tools = registry.getAll();
    
    // Convert tool definitions to MCP format
    return tools.map(tool => {
      // Convert Zod schema to JSON Schema for MCP protocol
      const zodSchema = tool.inputSchema as any;
      const properties: Record<string, any> = {};
      const required: string[] = [];
      
      // Extract properties from Zod schema if it's an object schema
      if (zodSchema._def?.typeName === 'ZodObject') {
        const shape = zodSchema._def.shape();
        
        for (const [key, value] of Object.entries(shape)) {
          const fieldSchema = value as any;
          
          // Basic type mapping from Zod to JSON Schema
          let type = 'string';
          let description = fieldSchema._def?.description || '';
          
          if (fieldSchema._def?.typeName === 'ZodNumber') {
            type = 'number';
          } else if (fieldSchema._def?.typeName === 'ZodBoolean') {
            type = 'boolean';
          } else if (fieldSchema._def?.typeName === 'ZodArray') {
            type = 'array';
          }
          
          properties[key] = {
            type,
            description,
          };
          
          // Check if field is optional
          if (!fieldSchema.isOptional || !fieldSchema.isOptional()) {
            required.push(key);
          }
        }
      }
      
      return {
        name: tool.name,
        description: tool.description,
        inputSchema: {
          type: 'object',
          properties,
          required,
        },
      };
    });
  }

  /**
   * Handle SSE connection
   * Establishes a persistent connection for server-sent events
   */
  private handleSSEConnection(req: Request, res: Response): void {
    // Generate unique connection ID
    const connectionId = `sse-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    
    this.logger.info('SSE connection established', {
      requestContext: {
        connectionId,
        userAgent: req.get('user-agent'),
      },
    });

    // Set SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no'); // Disable nginx buffering

    // Send initial connection event
    this.sendSSEEvent(res, 'connected', {
      connectionId,
      timestamp: new Date().toISOString(),
      message: 'SSE connection established',
    });

    // Store connection
    const connection: SSEConnection = {
      id: connectionId,
      res,
      connectedAt: new Date(),
      lastHeartbeat: new Date(),
    };
    this.sseConnections.set(connectionId, connection);

    // Handle client disconnect
    req.on('close', () => {
      this.logger.info('SSE connection closed', {
        requestContext: {
          connectionId,
          duration: Date.now() - connection.connectedAt.getTime(),
        },
      });
      this.sseConnections.delete(connectionId);
    });

    // Handle errors
    res.on('error', (error: Error) => {
      this.logger.logError('SSE connection error', error, {
        connectionId,
      });
      this.sseConnections.delete(connectionId);
    });

    // Start heartbeat if not already running
    if (!this.heartbeatInterval) {
      this.startHeartbeat();
    }
  }

  /**
   * Send SSE event to a specific connection
   * Formats data according to SSE protocol
   */
  private sendSSEEvent(res: Response, event: string, data: any): void {
    try {
      const eventData = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
      res.write(eventData);
    } catch (error) {
      this.logger.logError(
        'Error sending SSE event',
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  /**
   * Start heartbeat mechanism
   * Sends periodic ping events to keep connections alive
   */
  private startHeartbeat(): void {
    // Send heartbeat every 30 seconds
    this.heartbeatInterval = setInterval(() => {
      const now = new Date();
      
      this.sseConnections.forEach((connection) => {
        try {
          // Send heartbeat event
          this.sendSSEEvent(connection.res, 'heartbeat', {
            timestamp: now.toISOString(),
            connectionId: connection.id,
          });
          
          connection.lastHeartbeat = now;
          
          this.logger.debug('Heartbeat sent', {
            requestContext: {
              connectionId: connection.id,
              uptime: now.getTime() - connection.connectedAt.getTime(),
            },
          });
        } catch (error) {
          this.logger.warn('Failed to send heartbeat', {
            requestContext: {
              error: error instanceof Error ? error.message : String(error),
              connectionId: connection.id,
            },
          });
          
          // Remove dead connection
          this.sseConnections.delete(connection.id);
        }
      });

      // Log active connections
      if (this.sseConnections.size > 0) {
        this.logger.debug(`Active SSE connections: ${this.sseConnections.size}`);
      }
    }, 30000); // 30 seconds

    this.logger.info('SSE heartbeat mechanism started');
  }

  /**
   * Stop heartbeat mechanism
   * Called during shutdown
   */
  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
      this.logger.info('SSE heartbeat mechanism stopped');
    }
  }

  /**
   * Close all SSE connections
   * Called during graceful shutdown
   */
  private closeAllSSEConnections(): void {
    this.logger.info(`Closing ${this.sseConnections.size} SSE connections`);
    
    this.sseConnections.forEach((connection) => {
      try {
        // Send disconnect event
        this.sendSSEEvent(connection.res, 'disconnect', {
          reason: 'Server shutting down',
          timestamp: new Date().toISOString(),
        });
        
        // End the response
        connection.res.end();
      } catch (error) {
        this.logger.warn('Error closing SSE connection', {
          requestContext: {
            error: error instanceof Error ? error.message : String(error),
            connectionId: connection.id,
          },
        });
      }
    });
    
    this.sseConnections.clear();
  }

  /**
   * Start the HTTP server
   * Listens on the configured port and sets up signal handlers
   */
  async start(): Promise<void> {
    this.logger.info('Starting HTTP transport adapter', {
      requestContext: { port: this.port },
    });

    return new Promise((resolve, reject) => {
      try {
        this.httpServer = this.app.listen(this.port, () => {
          this.logger.info(`HTTP server listening on port ${this.port}`, {
            requestContext: {
              endpoints: [
                `http://localhost:${this.port}/health`,
                `http://localhost:${this.port}/mcp`,
                `http://localhost:${this.port}/sse`,
              ],
            },
          });

          // Set up signal handlers for graceful shutdown
          this.setupSignalHandlers();

          this.logger.info('HTTP adapter ready to accept requests');
          resolve();
        });

        this.httpServer.on('error', (error: Error) => {
          this.logger.logError('HTTP server error', error);
          reject(error);
        });
      } catch (error) {
        this.logger.logError(
          'Failed to start HTTP server',
          error instanceof Error ? error : new Error(String(error))
        );
        reject(error);
      }
    });
  }

  /**
   * Set up process signal handlers for graceful shutdown
   * Handles SIGINT (Ctrl+C) and SIGTERM signals
   */
  private setupSignalHandlers(): void {
    const signals: NodeJS.Signals[] = ['SIGINT', 'SIGTERM'];

    signals.forEach(signal => {
      process.on(signal, async () => {
        if (this.isShuttingDown) {
          // Force exit if already shutting down
          this.logger.warn(`Received ${signal} during shutdown, forcing exit`);
          process.exit(1);
        }

        this.isShuttingDown = true;
        this.logger.info(`Received ${signal}, initiating graceful shutdown`);

        try {
          await this.shutdown();
          this.logger.info('Graceful shutdown complete');
          process.exit(0);
        } catch (error) {
          this.logger.logError(
            'Error during shutdown',
            error instanceof Error ? error : new Error(String(error))
          );
          process.exit(1);
        }
      });
    });

    // Handle uncaught exceptions
    process.on('uncaughtException', (error: Error) => {
      this.logger.logError('Uncaught exception', error);
      process.exit(1);
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason: any) => {
      this.logger.logError(
        'Unhandled promise rejection',
        reason instanceof Error ? reason : new Error(String(reason))
      );
      process.exit(1);
    });
  }

  /**
   * Perform graceful shutdown
   * Closes HTTP server, SSE connections, and cleans up resources
   */
  private async shutdown(): Promise<void> {
    this.logger.info('Shutting down HTTP adapter');

    // Stop heartbeat mechanism
    this.stopHeartbeat();

    // Close all SSE connections
    this.closeAllSSEConnections();

    // Close HTTP server if it exists
    if (this.httpServer) {
      return new Promise((resolve, reject) => {
        this.httpServer!.close((error) => {
          if (error) {
            this.logger.warn('Error closing HTTP server', {
              error: error.message,
            });
            reject(error);
          } else {
            this.logger.info('HTTP server closed');
            resolve();
          }
        });
      });
    }
  }

  /**
   * Check if the adapter is currently shutting down
   */
  isShutdown(): boolean {
    return this.isShuttingDown;
  }

  /**
   * Get the Express app instance
   * Useful for testing or adding custom routes
   */
  getApp(): express.Application {
    return this.app;
  }

  /**
   * Get the HTTP server instance
   * Useful for testing or advanced configuration
   */
  getHttpServer(): HttpServer | null {
    return this.httpServer;
  }

  /**
   * Get SSE connection statistics
   * Returns information about active SSE connections
   */
  getSSEStats(): {
    activeConnections: number;
    connections: Array<{
      id: string;
      connectedAt: string;
      uptime: number;
      lastHeartbeat: string;
    }>;
  } {
    const now = Date.now();
    return {
      activeConnections: this.sseConnections.size,
      connections: Array.from(this.sseConnections.values()).map((conn) => ({
        id: conn.id,
        connectedAt: conn.connectedAt.toISOString(),
        uptime: now - conn.connectedAt.getTime(),
        lastHeartbeat: conn.lastHeartbeat.toISOString(),
      })),
    };
  }
}

/**
 * SSE adapter for MCP server
 * Provides Server-Sent Events transport for streaming MCP protocol
 * Extends HTTP adapter with SSE-specific functionality
 */
export class SSEAdapter extends HttpAdapter {
  constructor(server: CamaraServer, port: number) {
    super(server, port);
  }

  /**
   * Start the SSE server
   * Alias for start() to maintain consistent API
   */
  async startSSE(): Promise<void> {
    await this.start();
  }
}
