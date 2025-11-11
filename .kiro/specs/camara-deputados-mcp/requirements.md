# Requirements Document

## Introduction

This document specifies the requirements for building a Model Context Protocol (MCP) server that provides comprehensive access to the Brazilian Chamber of Deputies (Câmara dos Deputados) Open Data API. The MCP server will enable AI assistants like Claude Desktop, Cursor, Windsurf, and Continue.dev to query legislative data including deputies, propositions, votes, committees, parties, and events. The implementation will follow the same technology stack and architectural patterns as the existing dadosbr-mcp project (TypeScript, MCP SDK, multi-transport support, Cloudflare Workers deployment).

## Glossary

- **MCP_Server**: The Model Context Protocol server application that exposes tools for querying the Câmara API
- **Câmara_API**: The RESTful API provided by dadosabertos.camara.leg.br for accessing legislative data
- **Deputy**: A member of the Brazilian Chamber of Deputies (deputado)
- **Proposition**: A legislative proposal such as bills, amendments, or resolutions
- **Voting**: A recorded vote on a proposition in the Chamber
- **Committee**: A legislative body (órgão) within the Chamber that evaluates propositions
- **Parliamentary_Front**: A group of deputies organized around specific themes (frente parlamentar)
- **Legislative_Term**: A four-year period of parliamentary activity (legislatura)
- **Transport_Adapter**: The communication layer supporting STDIO, HTTP, or SSE protocols
- **Tool**: An MCP-exposed function that AI assistants can invoke to query data
- **Cache_Layer**: A mechanism to store and reuse API responses to reduce external requests
- **Rate_Limiter**: A component that controls the frequency of requests to prevent API abuse

## Requirements

### Requirement 1: Core MCP Server Infrastructure

**User Story:** As a developer, I want a robust MCP server foundation, so that I can reliably integrate Câmara API data into AI assistants.

#### Acceptance Criteria

1. WHEN the MCP_Server initializes, THE MCP_Server SHALL register all available tools with the MCP SDK
2. WHEN a client connects via STDIO transport, THE MCP_Server SHALL establish bidirectional communication using standard input and output streams
3. WHEN a client connects via HTTP transport, THE MCP_Server SHALL accept POST requests at the /mcp endpoint and return JSON-RPC 2.0 responses
4. WHEN a client connects via SSE transport, THE MCP_Server SHALL maintain a persistent connection and stream responses as server-sent events
5. WHEN the MCP_Server receives a tools/list request, THE MCP_Server SHALL return metadata for all registered tools including names, descriptions, and input schemas

### Requirement 2: Deputy Information Tools

**User Story:** As an AI assistant user, I want to query information about deputies, so that I can research parliamentary representatives and their activities.

#### Acceptance Criteria

1. WHEN the Tool deputados_listar receives optional filter parameters, THE Tool SHALL query the Câmara_API endpoint /deputados with the provided filters and return a list of deputies
2. WHEN the Tool deputado_detalhes receives a deputy ID, THE Tool SHALL query the Câmara_API endpoint /deputados/{id} and return detailed information about the specific Deputy
3. WHEN the Tool deputado_despesas receives a deputy ID and optional date range, THE Tool SHALL query the Câmara_API endpoint /deputados/{id}/despesas and return parliamentary expense records
4. WHEN the Tool deputado_discursos receives a deputy ID and optional date range, THE Tool SHALL query the Câmara_API endpoint /deputados/{id}/discursos and return speeches made by the Deputy
5. WHEN the Tool deputado_eventos receives a deputy ID, THE Tool SHALL query the Câmara_API endpoint /deputados/{id}/eventos and return events with the Deputy's participation

### Requirement 3: Proposition Information Tools

**User Story:** As an AI assistant user, I want to search and analyze legislative propositions, so that I can track bills and understand the legislative process.

#### Acceptance Criteria

1. WHEN the Tool proposicoes_listar receives filter parameters, THE Tool SHALL query the Câmara_API endpoint /proposicoes with the filters and return a paginated list of propositions
2. WHEN the Tool proposicao_detalhes receives a proposition ID, THE Tool SHALL query the Câmara_API endpoint /proposicoes/{id} and return comprehensive details about the Proposition
3. WHEN the Tool proposicao_autores receives a proposition ID, THE Tool SHALL query the Câmara_API endpoint /proposicoes/{id}/autores and return the list of authors
4. WHEN the Tool proposicao_tramitacoes receives a proposition ID, THE Tool SHALL query the Câmara_API endpoint /proposicoes/{id}/tramitacoes and return the processing history
5. WHEN the Tool proposicao_votacoes receives a proposition ID, THE Tool SHALL query the Câmara_API endpoint /proposicoes/{id}/votacoes and return voting records for the Proposition

### Requirement 4: Voting Information Tools

**User Story:** As an AI assistant user, I want to access voting records, so that I can analyze how deputies voted on specific propositions.

#### Acceptance Criteria

1. WHEN the Tool votacoes_listar receives filter parameters, THE Tool SHALL query the Câmara_API endpoint /votacoes with the filters and return a list of votes
2. WHEN the Tool votacao_detalhes receives a voting ID, THE Tool SHALL query the Câmara_API endpoint /votacoes/{id} and return detailed information about the Voting
3. WHEN the Tool votacao_votos receives a voting ID, THE Tool SHALL query the Câmara_API endpoint /votacoes/{id}/votos and return individual deputy votes
4. WHEN the Tool votacao_orientacoes receives a voting ID, THE Tool SHALL query the Câmara_API endpoint /votacoes/{id}/orientacoes and return party leadership voting recommendations

### Requirement 5: Committee and Organization Tools

**User Story:** As an AI assistant user, I want to query information about legislative committees, so that I can understand the organizational structure and committee activities.

#### Acceptance Criteria

1. WHEN the Tool orgaos_listar receives optional filter parameters, THE Tool SHALL query the Câmara_API endpoint /orgaos and return a list of committees and legislative bodies
2. WHEN the Tool orgao_detalhes receives a committee ID, THE Tool SHALL query the Câmara_API endpoint /orgaos/{id} and return detailed information about the Committee
3. WHEN the Tool orgao_membros receives a committee ID, THE Tool SHALL query the Câmara_API endpoint /orgaos/{id}/membros and return the list of committee members
4. WHEN the Tool orgao_eventos receives a committee ID, THE Tool SHALL query the Câmara_API endpoint /orgaos/{id}/eventos and return events organized by the Committee

### Requirement 6: Party and Bloc Tools

**User Story:** As an AI assistant user, I want to access information about political parties and blocs, so that I can analyze party composition and leadership.

#### Acceptance Criteria

1. WHEN the Tool partidos_listar receives no parameters, THE Tool SHALL query the Câmara_API endpoint /partidos and return a list of all political parties
2. WHEN the Tool partido_detalhes receives a party ID, THE Tool SHALL query the Câmara_API endpoint /partidos/{id} and return detailed party information
3. WHEN the Tool partido_membros receives a party ID and optional date range, THE Tool SHALL query the Câmara_API endpoint /partidos/{id}/membros and return party members
4. WHEN the Tool blocos_listar receives optional filter parameters, THE Tool SHALL query the Câmara_API endpoint /blocos and return a list of party blocs

### Requirement 7: Event Information Tools

**User Story:** As an AI assistant user, I want to query legislative events, so that I can track committee meetings, hearings, and other parliamentary activities.

#### Acceptance Criteria

1. WHEN the Tool eventos_listar receives filter parameters including date range, THE Tool SHALL query the Câmara_API endpoint /eventos and return a list of events
2. WHEN the Tool evento_detalhes receives an event ID, THE Tool SHALL query the Câmara_API endpoint /eventos/{id} and return comprehensive event details
3. WHEN the Tool evento_pauta receives an event ID, THE Tool SHALL query the Câmara_API endpoint /eventos/{id}/pauta and return the event agenda with propositions
4. WHEN the Tool evento_deputados receives an event ID, THE Tool SHALL query the Câmara_API endpoint /eventos/{id}/deputados and return participating deputies

### Requirement 8: Reference Data Tools

**User Story:** As an AI assistant user, I want to access reference data and lookup tables, so that I can understand codes and classifications used in the legislative system.

#### Acceptance Criteria

1. WHEN the Tool referencias_situacoes_deputado receives no parameters, THE Tool SHALL query the Câmara_API endpoint /referencias/situacoesDeputado and return valid deputy status codes
2. WHEN the Tool referencias_tipos_proposicao receives no parameters, THE Tool SHALL query the Câmara_API endpoint /referencias/tiposProposicao and return valid proposition types
3. WHEN the Tool referencias_tipos_evento receives no parameters, THE Tool SHALL query the Câmara_API endpoint /referencias/tiposEvento and return valid event types
4. WHEN the Tool referencias_ufs receives no parameters, THE Tool SHALL query the Câmara_API endpoint /referencias/uf and return Brazilian state codes and names

### Requirement 9: HTTP Client and Error Handling

**User Story:** As a developer, I want robust HTTP communication with the Câmara API, so that the MCP_Server handles network errors gracefully and provides meaningful error messages.

#### Acceptance Criteria

1. WHEN the MCP_Server makes a request to the Câmara_API, THE MCP_Server SHALL include appropriate headers including User-Agent and Accept
2. WHEN the Câmara_API returns a 4xx client error, THE MCP_Server SHALL parse the error response and return a descriptive error message to the client
3. WHEN the Câmara_API returns a 5xx server error, THE MCP_Server SHALL return an error indicating the API is temporarily unavailable
4. WHEN a network timeout occurs during a Câmara_API request, THE MCP_Server SHALL return a timeout error after 30 seconds
5. IF the Câmara_API returns a 429 rate limit error, THEN THE MCP_Server SHALL include the retry-after information in the error response

### Requirement 10: Response Caching

**User Story:** As a system operator, I want API responses to be cached, so that repeated queries are faster and reduce load on the Câmara API.

#### Acceptance Criteria

1. WHEN the Cache_Layer receives a cacheable GET request, THE Cache_Layer SHALL store the response with a time-to-live of 3600 seconds
2. WHEN the Cache_Layer receives a request for previously cached data within the TTL, THE Cache_Layer SHALL return the cached response without querying the Câmara_API
3. WHEN the Cache_Layer stores a response, THE Cache_Layer SHALL use a cache key derived from the endpoint URL and query parameters
4. WHEN the cache storage exceeds 100 megabytes, THE Cache_Layer SHALL evict the least recently used entries
5. WHEN an environment variable MCP_DISABLE_CACHE is set to true, THE Cache_Layer SHALL bypass all caching logic

### Requirement 11: Configuration Management

**User Story:** As a system operator, I want to configure the MCP server through environment variables, so that I can customize behavior for different deployment environments.

#### Acceptance Criteria

1. WHEN the MCP_Server starts, THE MCP_Server SHALL read the MCP_TRANSPORT environment variable to determine the communication protocol
2. WHEN the MCP_TRANSPORT is set to http, THE MCP_Server SHALL read the MCP_HTTP_PORT environment variable with a default value of 3000
3. WHEN the MCP_Server starts, THE MCP_Server SHALL read the CAMARA_API_BASE_URL environment variable with a default of https://dadosabertos.camara.leg.br/api/v2
4. WHEN the MCP_Server starts in production mode, THE MCP_Server SHALL read the MCP_API_KEY environment variable for authentication
5. WHEN the MCP_Server starts, THE MCP_Server SHALL read the MCP_CACHE_TTL environment variable to configure cache expiration time in seconds

### Requirement 12: Cloudflare Workers Deployment

**User Story:** As a system operator, I want to deploy the MCP server to Cloudflare Workers, so that I can provide a scalable, globally distributed API endpoint.

#### Acceptance Criteria

1. WHEN the MCP_Server deploys to Cloudflare Workers, THE MCP_Server SHALL expose REST endpoints at /deputados/{id}, /proposicoes/{id}, and other resource paths
2. WHEN the Cloudflare Workers deployment receives a request, THE MCP_Server SHALL use Cloudflare KV for the Cache_Layer storage
3. WHEN the Cloudflare Workers deployment receives a request to /health, THE MCP_Server SHALL return a 200 status with server health information
4. WHEN the Cloudflare Workers deployment receives a request to /openapi.json, THE MCP_Server SHALL return an OpenAPI specification document
5. IF the request includes an X-API-Key header, THEN THE Rate_Limiter SHALL allow 100 requests per minute per API key

### Requirement 13: Rate Limiting

**User Story:** As a system operator, I want to implement rate limiting, so that the MCP server prevents abuse and ensures fair usage.

#### Acceptance Criteria

1. WHEN the Rate_Limiter receives a request, THE Rate_Limiter SHALL track request counts per IP address using a sliding window of 60 seconds
2. WHEN a client exceeds 30 requests per minute, THE Rate_Limiter SHALL return a 429 status code with a Retry-After header
3. WHEN the Rate_Limiter blocks a request, THE Rate_Limiter SHALL include the current rate limit and reset time in the response headers
4. WHEN an environment variable MCP_DISABLE_RATE_LIMIT is set to true, THE Rate_Limiter SHALL allow all requests without limits
5. WHEN an authenticated request includes a valid API key, THE Rate_Limiter SHALL apply a higher limit of 100 requests per minute

### Requirement 14: Input Validation

**User Story:** As a developer, I want all tool inputs to be validated, so that invalid requests are rejected before making API calls.

#### Acceptance Criteria

1. WHEN a Tool receives a deputy ID parameter, THE Tool SHALL validate that the ID is a positive integer before querying the Câmara_API
2. WHEN a Tool receives a date parameter, THE Tool SHALL validate that the date follows the YYYY-MM-DD format
3. WHEN a Tool receives a pagination parameter, THE Tool SHALL validate that the page number is a positive integer and the page size does not exceed 100
4. WHEN a Tool receives an invalid parameter, THE Tool SHALL return a validation error with a descriptive message indicating the expected format
5. WHEN a Tool receives a UF (state) parameter, THE Tool SHALL validate that the value is a valid two-letter Brazilian state code

### Requirement 15: Logging and Monitoring

**User Story:** As a system operator, I want comprehensive logging, so that I can troubleshoot issues and monitor system performance.

#### Acceptance Criteria

1. WHEN the MCP_Server processes a tool invocation, THE MCP_Server SHALL log the tool name, input parameters, and execution time
2. WHEN the MCP_Server encounters an error, THE MCP_Server SHALL log the error message, stack trace, and request context
3. WHEN the MCP_Server makes a request to the Câmara_API, THE MCP_Server SHALL log the HTTP method, URL, and response status code
4. WHEN the Cache_Layer serves a cached response, THE MCP_Server SHALL log a cache hit event with the cache key
5. WHEN an environment variable LOG_LEVEL is set, THE MCP_Server SHALL filter log messages based on the configured level (DEBUG, INFO, WARN, ERROR)

### Requirement 16: Testing Infrastructure

**User Story:** As a developer, I want comprehensive test coverage, so that I can ensure the MCP server functions correctly and prevent regressions.

#### Acceptance Criteria

1. WHEN the test suite runs, THE test suite SHALL include unit tests for all Tool implementations with mocked Câmara_API responses
2. WHEN the test suite runs, THE test suite SHALL include integration tests that verify end-to-end tool invocation flows
3. WHEN the test suite runs, THE test suite SHALL include tests for error handling scenarios including network failures and invalid responses
4. WHEN the test suite runs, THE test suite SHALL include tests for the Cache_Layer to verify caching behavior and eviction policies
5. WHEN the test suite runs, THE test suite SHALL achieve at least 80 percent code coverage across all core modules

### Requirement 17: Documentation and Examples

**User Story:** As a developer integrating the MCP server, I want clear documentation and examples, so that I can quickly understand how to configure and use the tools.

#### Acceptance Criteria

1. WHEN a developer reads the README file, THE README SHALL include installation instructions for NPM, NPX, and Smithery deployment methods
2. WHEN a developer reads the README file, THE README SHALL include configuration examples for Claude Desktop, Cursor, Windsurf, and Continue.dev
3. WHEN a developer reads the documentation, THE documentation SHALL include example prompts demonstrating how to use each Tool category
4. WHEN a developer reads the documentation, THE documentation SHALL include a complete list of environment variables with descriptions and default values
5. WHEN a developer reads the API documentation, THE documentation SHALL include the OpenAPI specification with request and response schemas for all endpoints

### Requirement 18: Package Distribution

**User Story:** As a user, I want to install the MCP server easily, so that I can start using it with minimal setup.

#### Acceptance Criteria

1. WHEN a user runs npm install -g, THE package SHALL install the MCP_Server as a global command-line tool
2. WHEN a user runs npx with the package name, THE package SHALL execute the MCP_Server without requiring prior installation
3. WHEN the package publishes to NPM, THE package SHALL include only the compiled JavaScript files and essential documentation
4. WHEN a user installs via Smithery, THE Smithery configuration SHALL automatically configure the MCP_Server in the user's AI assistant
5. WHEN the package installs, THE package SHALL display a post-install message with quick start instructions
