# Implementation Plan

- [x] 1. Set up project structure and core infrastructure
  - Create directory structure following the design (lib/adapters, lib/core, lib/types, etc.)
  - Initialize package.json with dependencies (@modelcontextprotocol/sdk, zod, typescript, etc.)
  - Configure TypeScript with tsconfig.json for ES modules and strict type checking
  - Set up build scripts and development environment
  - _Requirements: 1.1, 11.1, 18.1_

- [x] 2. Implement configuration management
  - Create lib/config/index.ts with environment variable loading
  - Define MCPServerConfig interface with transport, cache, and rate limit settings
  - Implement default values for CAMARA_API_BASE_URL, MCP_TRANSPORT, MCP_HTTP_PORT
  - Add validation for required environment variables
  - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5_

- [x] 3. Implement HTTP client for Câmara API
- [x] 3.1 Create CamaraHttpClient class
  - Implement constructor accepting HttpClientConfig with baseURL, timeout, retry settings
  - Create get<T>() method with query parameter support
  - Implement buildURL() helper for constructing URLs with encoded parameters
  - Add request headers (User-Agent, Accept, Accept-Encoding)
  - _Requirements: 9.1, 9.4_

- [x] 3.2 Add error handling and retry logic
  - Implement handleError() to parse API error responses
  - Add retry logic with exponential backoff for network failures
  - Handle 4xx client errors with descriptive messages
  - Handle 5xx server errors with unavailability messages
  - Handle 429 rate limit errors with retry-after information
  - _Requirements: 9.2, 9.3, 9.5_

- [x] 4. Implement caching layer
- [x] 4.1 Create in-memory cache implementation
  - Create CacheLayer class with CacheConfig interface
  - Implement get<T>() and set<T>() methods with TTL support
  - Create generateKey() method using endpoint and params hash
  - Implement has() method to check cache validity
  - Add clear() method for cache invalidation
  - _Requirements: 10.1, 10.2, 10.3_

- [x] 4.2 Add cache eviction and size management
  - Implement LRU eviction when cache exceeds maxSize
  - Track cache entry sizes for memory management
  - Add cache bypass when MCP_DISABLE_CACHE is true
  - _Requirements: 10.4, 10.5_

- [x] 5. Implement input validation utilities
  - Create lib/core/validation.ts with Zod schemas
  - Define common schemas: DeputyIdSchema, DateSchema, UFSchema, PaginationSchema
  - Create tool-specific schemas for all 62 tools
  - Implement validateInput<T>() helper function with detailed error messages
  - Add validation error handling with descriptive messages
  - _Requirements: 14.1, 14.2, 14.3, 14.4, 14.5_

- [x] 6. Implement TypeScript types for API responses
  - Create lib/types/index.ts with all API response interfaces
  - Define Deputy, DeputyDetails, DeputyStatus interfaces
  - Define Proposition, PropositionDetails, PropositionStatus interfaces
  - Define Voting, VotingDetails, Event, Committee, Party interfaces
  - Define PaginatedResponse<T> and ApiResponse<T> generic types
  - _Requirements: 2.1, 2.2, 3.1, 3.2, 4.1, 5.1, 6.1, 7.1_

- [x] 7. Implement tool registry and definitions
- [x] 7.1 Create tool registry infrastructure
  - Create lib/core/tools.ts with ToolDefinition interface
  - Define ToolCategory type (7 categories) and ToolHandler interface
  - Create ToolContext interface with httpClient, cache, config, logger
  - Implement tool registration system for all 62 tools
  - _Requirements: 1.1_

- [x] 7.2 Implement Deputy tools (15 tools)
  - Implement deputados_listar with filtering (nome, siglaUf, siglaPartido, etc.)
  - Implement deputado_detalhes for specific deputy information
  - Implement deputado_despesas for expense records
  - Implement deputado_discursos for speeches
  - Implement deputado_eventos for event participation
  - Implement deputado_frentes for parliamentary fronts
  - Implement deputado_historico for mandate history
  - Implement deputado_mandatos_externos for external mandates
  - Implement deputado_ocupacoes for occupations
  - Implement deputado_orgaos for committee memberships
  - Implement deputado_profissoes for professions
  - Implement deputado_mesa for leadership positions
  - Implement deputado_liderancas for party leadership roles
  - Implement deputado_cargos for positions held
  - Implement deputado_filiacoes for party affiliations
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [x] 7.3 Implement Proposition tools (10 tools)
  - Implement proposicoes_listar with comprehensive filtering
  - Implement proposicao_detalhes for detailed proposition info
  - Implement proposicao_autores for author list
  - Implement proposicao_relacionadas for related propositions
  - Implement proposicao_temas for thematic areas
  - Implement proposicao_tramitacoes for processing history
  - Implement proposicao_votacoes for voting records
  - Implement proposicao_texto for full text
  - Implement proposicao_situacoes for status history
  - Implement proposicao_apensadas for attached propositions
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [x] 7.4 Implement Voting tools (4 tools)
  - Implement votacoes_listar with date and organ filters
  - Implement votacao_detalhes for detailed voting information
  - Implement votacao_votos for individual deputy votes
  - Implement votacao_orientacoes for party recommendations
  - _Requirements: 4.1, 4.2, 4.3, 4.4_

- [x] 7.5 Implement Committee tools (5 tools)
  - Implement orgaos_listar with type and status filters
  - Implement orgao_detalhes for committee details
  - Implement orgao_membros for member list
  - Implement orgao_eventos for committee events
  - Implement orgao_votacoes for committee votes
  - _Requirements: 5.1, 5.2, 5.3, 5.4_

- [x] 7.6 Implement Party and Bloc tools (6 tools)
  - Implement partidos_listar for all parties
  - Implement partido_detalhes for party information
  - Implement partido_membros for party members
  - Implement partido_lideres for party leaders
  - Implement blocos_listar for party blocs
  - Implement bloco_detalhes for bloc information
  - _Requirements: 6.1, 6.2, 6.3, 6.4_

- [x] 7.7 Implement Event tools (7 tools)
  - Implement eventos_listar with date and type filters
  - Implement evento_detalhes for event information
  - Implement evento_pauta for event agenda
  - Implement evento_deputados for participating deputies
  - Implement evento_orgaos for organizing committees
  - Implement evento_votacoes for event votes
  - Implement evento_situacoes for event status history
  - _Requirements: 7.1, 7.2, 7.3, 7.4_

- [x] 7.8 Implement Reference Data tools (15 tools)
  - Implement referencias_situacoes_deputado for deputy status codes
  - Implement referencias_tipos_proposicao for proposition types
  - Implement referencias_tipos_evento for event types
  - Implement referencias_tipos_orgao for committee types
  - Implement referencias_ufs for state codes
  - Implement referencias_tipos_autor for author types
  - Implement referencias_tipos_tramitacao for processing types
  - Implement referencias_situacoes_proposicao for proposition statuses
  - Implement referencias_situacoes_evento for event statuses
  - Implement referencias_situacoes_orgao for committee statuses
  - Implement referencias_codigos_tipo_autor for author type codes
  - Implement referencias_situacoes_mesa for leadership statuses
  - Implement referencias_situacoes_membro for member statuses
  - Implement referencias_situacoes_votacao for voting statuses
  - Implement referencias_legislaturas for legislative terms
  - _Requirements: 8.1, 8.2, 8.3, 8.4_

- [x] 8. Implement MCP server core
- [x] 8.1 Create CamaraServer class
  - Create lib/core/mcp-server.ts with CamaraServer class
  - Implement constructor accepting MCPServerConfig
  - Create initialize() method to set up MCP SDK server
  - Implement registerTool() for adding tools to registry
  - Create handleToolCall() with validation and error handling
  - _Requirements: 1.1, 1.5_

- [x] 8.2 Implement tool invocation handler
  - Add input validation using Zod schemas
  - Implement cache checking before API calls
  - Execute tool handler with proper context
  - Format responses as MCP ToolResult
  - Handle all error types (validation, API, cache, rate limit)
  - _Requirements: 1.1, 9.2, 9.3, 9.5_

- [x] 9. Implement STDIO transport adapter
  - Create lib/adapters/cli.ts with StdioAdapter class
  - Implement start() method to initialize MCP SDK StdioServerTransport
  - Connect server to stdin/stdout streams
  - Handle process signals for graceful shutdown
  - _Requirements: 1.2_

- [x] 10. Implement HTTP transport adapter
  - Create HTTP server using Express in lib/adapters/cli.ts
  - Implement /mcp endpoint for JSON-RPC 2.0 requests
  - Add /health endpoint for health checks
  - Implement CORS headers for web clients
  - Add request logging middleware
  - _Requirements: 1.3, 12.3_

- [x] 11. Implement SSE transport adapter
  - Add SSE endpoint in HTTP adapter
  - Implement server-sent events streaming
  - Handle client connection lifecycle
  - Add heartbeat mechanism for connection monitoring
  - _Requirements: 1.4_

- [x] 12. Implement rate limiting
  - Create lib/infrastructure/rate-limiter.ts with RateLimiter class
  - Implement sliding window rate limiting per IP address
  - Add 30 requests/minute default limit
  - Implement 100 requests/minute limit for authenticated requests
  - Return 429 status with Retry-After header when limit exceeded
  - Add rate limit bypass when MCP_DISABLE_RATE_LIMIT is true
  - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5_

- [x] 13. Implement logging system
  - Create lib/shared/utils/logger.ts with structured logging
  - Implement log levels (DEBUG, INFO, WARN, ERROR)
  - Add LOG_LEVEL environment variable support
  - Log tool invocations with parameters and duration
  - Log API requests with method, URL, and status
  - Log cache hits/misses
  - Log errors with stack traces and context
  - _Requirements: 15.1, 15.2, 15.3, 15.4, 15.5_

- [x] 14. Create CLI entry point
  - Create lib/bin/mcp-camara.ts as executable entry point
  - Parse command-line arguments for transport selection
  - Initialize server with appropriate adapter
  - Add --version and --help flags
  - Display startup information and configuration
  - _Requirements: 1.2, 1.3, 1.4_

- [x] 15. Create post-install script
  - Create lib/scripts/postinstall.ts with quick start message
  - Add postinstall script to package.json
  - Display installation success and configuration examples
  - _Requirements: 18.5_

- [x] 16. Update README with basic documentation
  - Add project overview and features
  - Include installation instructions (npm, npx)
  - Add configuration examples for Claude Desktop and Cursor
  - Document environment variables
  - Include quick start guide
  - _Requirements: 17.1, 17.2, 17.3, 17.4_

- [x] 17. Implement Cloudflare Workers adapter
- [x] 17.1 Create Workers entry point
  - Create lib/workers/worker.ts with fetch handler
  - Implement request routing for MCP and REST endpoints
  - Add WorkerEnv interface for KV bindings
  - Initialize CamaraServer with Workers-specific config
  - _Requirements: 12.1_

- [x] 17.2 Implement KV-backed cache
  - Create CloudflareKVCache class implementing CacheLayer interface
  - Use KV namespace for distributed caching
  - Implement get/set operations with TTL
  - _Requirements: 12.2_

- [x] 17.3 Implement KV-backed rate limiter
  - Create CloudflareRateLimiter using KV for distributed state
  - Track request counts across multiple Workers instances
  - Implement sliding window algorithm with KV
  - _Requirements: 12.5_

- [x] 17.4 Add REST API endpoints
  - Implement GET /deputados/{id} endpoint
  - Implement GET /proposicoes/{id} endpoint
  - Implement GET /votacoes/{id} endpoint
  - Implement GET /eventos/{id} endpoint
  - Add API key authentication for REST endpoints
  - _Requirements: 12.1, 12.5_

- [x] 17.5 Create OpenAPI specification
  - Generate OpenAPI 3.0 spec for all REST endpoints
  - Add endpoint at GET /openapi.json
  - Include request/response schemas
  - Document authentication requirements
  - _Requirements: 12.4_

- [x] 18. Configure Cloudflare Workers deployment
  - Create wrangler.toml with project configuration
  - Configure KV namespaces for cache and rate limiting
  - Set up environment variables for production
  - Add deployment scripts to package.json
  - _Requirements: 12.1, 12.2_

- [x] 19. Create Smithery configuration
  - Create smithery.yaml with package metadata
  - Configure runtime requirements (Node.js >= 18)
  - Define install command using npx
  - Add environment variable documentation
  - _Requirements: 18.4_

- [x] 20. Write comprehensive documentation
- [x] 20.1 Create usage examples
  - Create docs/USAGE_EXAMPLES.md with practical examples
  - Document common use cases (deputy lookup, bill tracking, vote analysis)
  - Include example prompts for each tool category
  - Add troubleshooting section
  - _Requirements: 17.3_

- [x] 20.2 Create API documentation
  - Create docs/API.md with complete tool reference
  - Document all 62 tools with parameters and return types
  - Include OpenAPI specification reference
  - Add rate limiting and caching documentation
  - _Requirements: 17.5_

- [x] 20.3 Create deployment guides
  - Create docs/CLOUDFLARE_DEPLOYMENT.md for Workers setup
  - Create docs/CONFIGURATION.md for environment variables
  - Add troubleshooting guides for common issues
  - _Requirements: 17.4_

- [x] 21. Write unit tests
- [x] 21.1 Write HTTP client tests
  - Write tests for request building with query parameters
  - Write tests for error handling (4xx, 5xx, network errors)
  - Write tests for retry logic with exponential backoff
  - Write tests for timeout handling
  - _Requirements: 16.1, 16.3_

- [x] 21.2 Write cache layer tests
  - Write tests for get/set operations with TTL
  - Write tests for LRU eviction when maxSize exceeded
  - Write tests for cache bypass when disabled
  - Write tests for cache key generation
  - _Requirements: 16.1, 16.4_

- [x] 21.3 Write validation tests
  - Write tests for all common schemas (DeputyId, Date, UF, Pagination)
  - Write tests for tool-specific schemas with valid/invalid inputs
  - Write tests for validation error messages
  - _Requirements: 16.1, 16.3_

- [x] 21.4 Write tool handler tests
  - Write tests for deputy tools with mocked API responses
  - Write tests for proposition tools with mocked API responses
  - Write tests for voting, committee, party, event, and reference tools
  - _Requirements: 16.1_

- [x] 21.5 Write rate limiter tests
  - Write tests for sliding window algorithm
  - Write tests for default and authenticated limits
  - Write tests for rate limit bypass when disabled
  - Write tests for cleanup mechanism
  - _Requirements: 16.1, 16.4_

- [x] 22. Write integration tests
- [x] 22.1 Write MCP protocol tests
  - Write test for tools/list returning 62 tools
  - Write test for tools/call with valid tool invocation
  - Write test for error handling in tool calls
  - _Requirements: 16.2_

- [x] 22.2 Write transport tests
  - Write tests for STDIO transport
  - Write tests for HTTP transport with /mcp and /health endpoints
  - Write tests for SSE transport with connection lifecycle
  - _Requirements: 16.2_

- [x] 22.3 Write end-to-end tests
  - Write tests for complete tool execution flow with caching
  - Write tests for validation errors
  - Write tests for API errors
  - _Requirements: 16.2_

- [x] 23. Final integration and testing
  - Test with Claude Desktop using STDIO transport
  - Test with Cursor IDE
  - Test HTTP transport with example client
  - Verify all 62 tools work correctly with real API
  - Test error handling with invalid inputs
  - Verify caching behavior
  - Test rate limiting
  - _Requirements: 1.2, 1.3, 12.1, 12.3_

- [x] 24. Prepare for NPM publication
  - Verify package.json metadata (name, version, description, keywords)
  - Ensure build/ directory is properly configured in files field
  - Test local installation with npm link
  - Test npx execution
  - Verify postinstall script works correctly
  - _Requirements: 18.1, 18.2, 18.3_
