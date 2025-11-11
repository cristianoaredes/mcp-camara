/**
 * MCP Server Core
 * Initializes the MCP SDK server and handles tool registration and invocation
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  type CallToolRequest,
  type ListToolsRequest,
} from '@modelcontextprotocol/sdk/types.js';
import { CamaraHttpClient } from './http-client.js';
import { CacheLayer } from './cache.js';
import { ToolRegistry, type ToolContext, type ToolResult, type CacheInterface } from './tools.js';
import { validateToolInput, type ToolName } from './validation.js';
import { Logger } from '../shared/utils/logger.js';
import { ValidationError, CamaraAPIError, RateLimitError } from '../shared/utils/errors.js';
import type { MCPServerConfig } from '../config/index.js';
import { allTools } from '../tools/index.js';

/**
 * Optional dependencies that can be injected into the server
 */
export interface ServerDependencies {
  cache?: CacheInterface;
  httpClient?: CamaraHttpClient;
}

/**
 * Main MCP server class for the Câmara dos Deputados API
 * Manages tool registration, request handling, and MCP protocol communication
 */
export class CamaraServer {
  private server: Server;
  private registry: ToolRegistry;
  private httpClient: CamaraHttpClient;
  private cache: CacheInterface;
  private logger: Logger;
  private config: MCPServerConfig;
  private initialized: boolean = false;

  constructor(config: MCPServerConfig, dependencies?: ServerDependencies) {
    this.config = config;
    this.logger = new Logger(config.logLevel);
    
    // Initialize MCP SDK server
    this.server = new Server(
      {
        name: config.name,
        version: config.version,
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    // Initialize infrastructure components with optional dependency injection
    this.httpClient = dependencies?.httpClient || new CamaraHttpClient({
      baseURL: config.apiBaseUrl,
      timeout: 30000,
      retryAttempts: 3,
      retryDelay: 1000,
      userAgent: `${config.name}/${config.version}`,
    });

    this.cache = dependencies?.cache || new CacheLayer({
      enabled: config.cacheEnabled,
      ttl: config.cacheTTL,
      maxSize: config.cacheMaxSize,
    });

    this.registry = new ToolRegistry();

    this.logger.info('CamaraServer initialized', {
      requestContext: {
        name: config.name,
        version: config.version,
        transport: config.transport,
        cacheEnabled: config.cacheEnabled,
        rateLimitEnabled: config.rateLimitEnabled,
      },
    });
  }

  /**
   * Initialize the server and register all tools
   * Must be called before starting the server
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      this.logger.warn('Server already initialized');
      return;
    }

    // Register all 62 tools from the tool implementations
    this.logger.info('Registering tools...');
    this.registry.registerMany(allTools);
    this.logger.info(`Registered ${this.registry.count()} tools`);

    // Set up MCP protocol handlers
    this.setupHandlers();

    this.initialized = true;
    this.logger.info('Server initialization complete');
  }

  /**
   * Set up MCP protocol request handlers
   */
  private setupHandlers(): void {
    // Handle tools/list requests
    this.server.setRequestHandler(ListToolsRequestSchema, async (_request: ListToolsRequest) => {
      this.logger.debug('Handling tools/list request');
      
      const tools = this.registry.getAll().map(tool => {
        // Convert Zod schema to JSON Schema for MCP protocol
        const zodSchema = tool.inputSchema as any;
        const properties = zodSchema._def?.typeName === 'ZodObject' 
          ? zodSchema._def.shape() 
          : {};
        
        return {
          name: tool.name,
          description: tool.description,
          inputSchema: {
            type: 'object' as const,
            properties,
            required: [],
          },
        };
      });

      return { tools };
    });

    // Handle tools/call requests
    this.server.setRequestHandler(CallToolRequestSchema, async (request: CallToolRequest) => {
      const startTime = Date.now();
      const toolName = request.params.name;
      const args = request.params.arguments || {};

      this.logger.info('Tool invocation started', {
        tool: toolName,
        requestContext: { args },
      });

      try {
        const result = await this.handleToolCall(toolName, args);
        const duration = Date.now() - startTime;
        
        this.logger.logToolInvocation(toolName, args, duration);
        
        return result;
      } catch (error) {
        const duration = Date.now() - startTime;
        this.logger.error('Tool invocation failed', {
          tool: toolName,
          error: error instanceof Error ? error.message : 'Unknown error',
          stackTrace: error instanceof Error ? error.stack : undefined,
          duration,
          requestContext: { args },
        });
        throw error;
      }
    });
  }

  /**
   * Register a single tool in the registry
   * Useful for adding custom tools or testing
   */
  registerTool(tool: Parameters<ToolRegistry['register']>[0]): void {
    this.registry.register(tool);
    this.logger.debug('Tool registered', { tool: tool.name });
  }

  /**
   * Handle tool invocation with validation, caching, and error handling
   * 
   * @param name - Name of the tool to invoke
   * @param args - Arguments to pass to the tool
   * @returns Tool result with content or error
   */
  async handleToolCall(name: string, args: unknown): Promise<ToolResult> {
    try {
      // Check if tool exists
      const tool = this.registry.get(name);
      if (!tool) {
        return {
          content: [{
            type: 'text',
            text: `Error: Unknown tool "${name}". Use tools/list to see available tools.`,
          }],
          isError: true,
        };
      }

      // Validate input using Zod schema
      this.logger.debug('Validating tool input', { tool: name });
      const validatedArgs = validateToolInput(name as ToolName, args);

      // Generate cache key for this tool invocation
      const cacheKey = this.cache.generateKey(`tool:${name}`, validatedArgs as Record<string, string | number | boolean | undefined>);
      
      // Check cache before making API call
      if (this.config.cacheEnabled) {
        this.logger.debug('Checking cache', { tool: name, cacheKey });
        const cachedResult = await this.cache.get<ToolResult>(cacheKey);
        
        if (cachedResult) {
          this.logger.logCacheHit(cacheKey);
          this.logger.debug('Returning cached result', { tool: name });
          return cachedResult;
        }
        
        this.logger.logCacheMiss(cacheKey);
      }

      // Create tool context
      const context: ToolContext = {
        httpClient: this.httpClient,
        cache: this.cache,
        config: this.config,
        logger: this.logger,
      };

      // Execute tool handler
      this.logger.debug('Executing tool handler', { tool: name });
      const result = await tool.handler(validatedArgs, context);

      // Cache the successful result
      if (this.config.cacheEnabled && !result.isError) {
        this.logger.debug('Caching result', { tool: name, cacheKey });
        try {
          await this.cache.set(cacheKey, result);
        } catch (cacheError) {
          // Log cache errors but don't fail the request
          this.logger.warn('Failed to cache result', {
            tool: name,
            error: cacheError instanceof Error ? cacheError.message : 'Unknown cache error',
          });
        }
      }

      return result;
    } catch (error) {
      return this.handleError(error, name);
    }
  }

  /**
   * Handle errors and format them as tool results
   */
  private handleError(error: unknown, toolName: string): ToolResult {
    // Validation errors
    if (error instanceof ValidationError) {
      return {
        content: [{
          type: 'text',
          text: `Validation error in tool "${toolName}": ${error.message}\nField: ${error.field}`,
        }],
        isError: true,
      };
    }

    // API errors
    if (error instanceof CamaraAPIError) {
      return {
        content: [{
          type: 'text',
          text: `API error in tool "${toolName}" (${error.statusCode}): ${error.message}\nEndpoint: ${error.endpoint}`,
        }],
        isError: true,
      };
    }

    // Rate limit errors
    if (error instanceof RateLimitError) {
      return {
        content: [{
          type: 'text',
          text: `Rate limit exceeded in tool "${toolName}": ${error.message}\nRetry after ${error.retryAfter} seconds.`,
        }],
        isError: true,
      };
    }

    // Unknown errors
    const message = error instanceof Error ? error.message : 'Unknown error occurred';
    this.logger.logError(`Unexpected error in tool "${toolName}"`, error as Error);
    
    return {
      content: [{
        type: 'text',
        text: `Unexpected error in tool "${toolName}": ${message}`,
      }],
      isError: true,
    };
  }

  /**
   * Start the server with STDIO transport
   * This is the default transport for desktop AI assistants
   */
  async start(): Promise<void> {
    if (!this.initialized) {
      throw new Error('Server must be initialized before starting. Call initialize() first.');
    }

    this.logger.info('Starting server with STDIO transport');
    
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    
    this.logger.info('Server started and ready to accept requests');
  }

  /**
   * Get the underlying MCP SDK server instance
   * Useful for advanced use cases or custom transport adapters
   */
  getServer(): Server {
    return this.server;
  }

  /**
   * Get server statistics
   */
  getStats(): {
    toolCount: number;
    initialized: boolean;
    config: MCPServerConfig;
  } {
    return {
      toolCount: this.registry.count(),
      initialized: this.initialized,
      config: this.config,
    };
  }

  /**
   * Get the tool registry
   * Useful for adapters that need to access tool definitions
   */
  getRegistry(): ToolRegistry {
    return this.registry;
  }
}
