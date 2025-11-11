# Design Document

## Overview

The Câmara dos Deputados MCP Server is a TypeScript-based Model Context Protocol server that provides AI assistants with comprehensive access to Brazilian legislative data. The architecture follows the proven patterns from dadosbr-mcp, implementing a clean, modular design with support for multiple transport protocols (STDIO, HTTP, SSE) and deployment targets (CLI, Cloudflare Workers).

The system exposes 62 tools organized into logical categories: Deputies (15 tools), Propositions (10 tools), Votings (4 tools), Committees (5 tools), Parties and Blocs (6 tools), Events (7 tools), and Reference Data (15 tools). Each tool maps to specific endpoints in the Câmara API (https://dadosabertos.camara.leg.br/api/v2), providing filtered, validated access to legislative information.

### Key Design Principles

1. **Modularity**: Clear separation between core logic, adapters, and infrastructure
2. **Type Safety**: Comprehensive TypeScript types for all API responses and tool schemas
3. **Extensibility**: Easy to add new tools and endpoints as the Câmara API evolves
4. **Performance**: Built-in caching and efficient HTTP client with connection pooling
5. **Reliability**: Robust error handling, validation, and retry logic
6. **Deployability**: Support for multiple deployment targets without code changes

## Architecture

### High-Level Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        AI Assistants                             │
│  (Claude Desktop, Cursor, Windsurf, Continue.dev, ChatGPT)      │
└────────────┬────────────────────────────────────────────────────┘
             │ MCP Protocol (STDIO/HTTP/SSE)
             │
┌────────────▼────────────────────────────────────────────────────┐
│                     Transport Adapters                           │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐       │
│  │  STDIO   │  │   HTTP   │  │   SSE    │  │ Workers  │       │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘       │
└───────┼─────────────┼─────────────┼─────────────┼──────────────┘
        │             │             │             │
        └─────────────┴─────────────┴─────────────┘
                      │
┌─────────────────────▼─────────────────────────────────────────┐
│                    MCP Server Core                             │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │              Tool Registry & Dispatcher                   │ │
│  └──────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────┘
                      │
┌─────────────────────▼─────────────────────────────────────────┐
│                    Tool Implementations                        │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐        │
│  │ Deputies │ │Proposals │ │ Votings  │ │Committees│  ...   │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘        │
└───────┼────────────┼────────────┼────────────┼───────────────┘
        │            │            │            │
        └────────────┴────────────┴────────────┘
                     │
┌────────────────────▼──────────────────────────────────────────┐
│                 Infrastructure Layer                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │ HTTP Client  │  │ Cache Layer  │  │  Validation  │       │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘       │
└─────────┼──────────────────┼──────────────────┼───────────────┘
          │                  │                  │
          └──────────────────┴──────────────────┘
                             │
┌────────────────────────────▼──────────────────────────────────┐
│              Câmara dos Deputados API                          │
│         https://dadosabertos.camara.leg.br/api/v2             │
└────────────────────────────────────────────────────────────────┘
```

### Directory Structure

```
camara-dep-mcp/
├── lib/
│   ├── adapters/           # Transport protocol implementations
│   │   ├── cli.ts          # STDIO adapter for desktop clients
│   │   ├── cloudflare.ts   # Cloudflare Workers adapter
│   │   └── smithery.ts     # Smithery integration
│   ├── bin/
│   │   └── mcp-camara.ts   # CLI entry point
│   ├── config/
│   │   └── index.ts        # Configuration management
│   ├── core/
│   │   ├── mcp-server.ts   # MCP server initialization
│   │   ├── tools.ts        # Tool registry and definitions
│   │   ├── http-client.ts  # HTTP client for Câmara API
│   │   ├── cache.ts        # Caching implementation
│   │   └── validation.ts   # Input validation utilities
│   ├── infrastructure/
│   │   └── rate-limiter.ts # Rate limiting logic
│   ├── shared/
│   │   ├── types/          # Shared TypeScript types
│   │   └── utils/          # Utility functions
│   ├── types/
│   │   └── index.ts        # API response types
│   ├── workers/
│   │   └── worker.ts       # Cloudflare Workers entry
│   └── index.ts            # Main exports
├── test/
│   ├── unit/               # Unit tests
│   └── integration/        # Integration tests
├── docs/                   # Documentation
├── examples/               # Usage examples
├── package.json
├── tsconfig.json
├── wrangler.toml           # Cloudflare Workers config
└── README.md
```

## Tool Catalog

The MCP server exposes 62 tools organized into 7 categories. Each tool corresponds to specific Câmara API endpoints and requirements.

### Deputies (15 tools)
1. `deputados_listar` - List deputies with filters (Req 2.1)
2. `deputado_detalhes` - Get deputy details (Req 2.2)
3. `deputado_despesas` - Get deputy expenses (Req 2.3)
4. `deputado_discursos` - Get deputy speeches (Req 2.4)
5. `deputado_eventos` - Get deputy events (Req 2.5)
6. `deputado_frentes` - Get parliamentary fronts
7. `deputado_historico` - Get mandate history
8. `deputado_mandatos_externos` - Get external mandates
9. `deputado_ocupacoes` - Get occupations
10. `deputado_orgaos` - Get committee memberships
11. `deputado_profissoes` - Get professions
12. `deputado_mesa` - Get leadership positions
13. `deputado_liderancas` - Get party leadership roles
14. `deputado_cargos` - Get positions held
15. `deputado_filiacoes` - Get party affiliations

### Propositions (10 tools)
1. `proposicoes_listar` - List propositions with filters (Req 3.1)
2. `proposicao_detalhes` - Get proposition details (Req 3.2)
3. `proposicao_autores` - Get proposition authors (Req 3.3)
4. `proposicao_relacionadas` - Get related propositions
5. `proposicao_temas` - Get thematic areas
6. `proposicao_tramitacoes` - Get processing history (Req 3.4)
7. `proposicao_votacoes` - Get voting records (Req 3.5)
8. `proposicao_texto` - Get full text
9. `proposicao_situacoes` - Get status history
10. `proposicao_apensadas` - Get attached propositions

### Votings (4 tools)
1. `votacoes_listar` - List votes with filters (Req 4.1)
2. `votacao_detalhes` - Get voting details (Req 4.2)
3. `votacao_votos` - Get individual deputy votes (Req 4.3)
4. `votacao_orientacoes` - Get party orientations (Req 4.4)

### Committees (5 tools)
1. `orgaos_listar` - List committees (Req 5.1)
2. `orgao_detalhes` - Get committee details (Req 5.2)
3. `orgao_membros` - Get committee members (Req 5.3)
4. `orgao_eventos` - Get committee events (Req 5.4)
5. `orgao_votacoes` - Get committee votes

### Parties and Blocs (6 tools)
1. `partidos_listar` - List all parties (Req 6.1)
2. `partido_detalhes` - Get party details (Req 6.2)
3. `partido_membros` - Get party members (Req 6.3)
4. `partido_lideres` - Get party leaders
5. `blocos_listar` - List party blocs (Req 6.4)
6. `bloco_detalhes` - Get bloc details

### Events (7 tools)
1. `eventos_listar` - List events with filters (Req 7.1)
2. `evento_detalhes` - Get event details (Req 7.2)
3. `evento_pauta` - Get event agenda (Req 7.3)
4. `evento_deputados` - Get participating deputies (Req 7.4)
5. `evento_orgaos` - Get organizing committees
6. `evento_votacoes` - Get event votes
7. `evento_situacoes` - Get event status history

### Reference Data (15 tools)
1. `referencias_situacoes_deputado` - Deputy status codes (Req 8.1)
2. `referencias_tipos_proposicao` - Proposition types (Req 8.2)
3. `referencias_tipos_evento` - Event types (Req 8.3)
4. `referencias_ufs` - State codes (Req 8.4)
5. `referencias_tipos_orgao` - Committee types
6. `referencias_tipos_autor` - Author types
7. `referencias_tipos_tramitacao` - Processing types
8. `referencias_situacoes_proposicao` - Proposition statuses
9. `referencias_situacoes_evento` - Event statuses
10. `referencias_situacoes_orgao` - Committee statuses
11. `referencias_codigos_tipo_autor` - Author type codes
12. `referencias_situacoes_mesa` - Leadership statuses
13. `referencias_situacoes_membro` - Member statuses
14. `referencias_situacoes_votacao` - Voting statuses
15. `referencias_legislaturas` - Legislative terms

## Components and Interfaces

### 1. MCP Server Core (`lib/core/mcp-server.ts`)

The central component that initializes the MCP server and registers all tools.

```typescript
interface MCPServerConfig {
  name: string;
  version: string;
  transport: 'stdio' | 'http' | 'sse';
  cacheEnabled: boolean;
  rateLimitEnabled: boolean;
}

class CamaraServer {
  constructor(config: MCPServerConfig);
  
  // Initialize server and register tools
  async initialize(): Promise<void>;
  
  // Register a single tool
  registerTool(tool: ToolDefinition): void;
  
  // Handle tool invocation
  async handleToolCall(name: string, args: unknown): Promise<ToolResult>;
  
  // Start the server
  async start(): Promise<void>;
}
```

### 2. Tool Registry (`lib/core/tools.ts`)

Manages tool definitions and provides a centralized registry. The registry organizes 62 tools across 7 categories.

**Design Rationale**: Categorizing tools improves discoverability and maintainability. The centralized registry pattern allows for easy addition of new tools and consistent handling across all endpoints.

```typescript
interface ToolDefinition {
  name: string;
  description: string;
  inputSchema: ZodSchema;
  handler: ToolHandler;
  category: ToolCategory;
}

type ToolCategory = 
  | 'deputies'       // 15 tools: list, details, expenses, speeches, events, fronts, history, etc.
  | 'propositions'   // 10 tools: list, details, authors, related, themes, processing, votes
  | 'votings'        // 4 tools: list, details, votes, party orientations
  | 'committees'     // 5 tools: list, details, members, events, votes
  | 'parties'        // 6 tools: parties list/details/members/leaders, blocs list/details
  | 'events'         // 7 tools: list, details, agenda, deputies, committees, votes
  | 'references';    // 15 tools: status codes, types, classifications

interface ToolHandler {
  (args: unknown, context: ToolContext): Promise<ToolResult>;
}

interface ToolContext {
  httpClient: HttpClient;
  cache: CacheLayer;
  config: MCPServerConfig;
  logger: Logger;
}

interface ToolResult {
  content: Array<{ type: 'text'; text: string }>;
  isError?: boolean;
}

// Complete tool list by category
const DEPUTY_TOOLS = [
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
  // Additional deputy-related tools as needed
] as const;

const PROPOSITION_TOOLS = [
  'proposicoes_listar',
  'proposicao_detalhes',
  'proposicao_autores',
  'proposicao_relacionadas',
  'proposicao_temas',
  'proposicao_tramitacoes',
  'proposicao_votacoes',
  // Additional proposition-related tools
] as const;

// Similar constants for other categories...
```

### 3. HTTP Client (`lib/core/http-client.ts`)

Handles all communication with the Câmara API with robust error handling and retry logic.

**Design Rationale**: The HTTP client implements exponential backoff for retries to handle transient network failures gracefully. Connection pooling improves performance for multiple requests. The 30-second timeout prevents hanging requests while being generous enough for slow API responses. Proper error categorization (4xx vs 5xx vs network errors) enables appropriate error handling at higher layers.

```typescript
interface HttpClientConfig {
  baseURL: string;
  timeout: number;  // Default: 30000ms
  retryAttempts: number;  // Default: 3
  retryDelay: number;  // Initial delay in ms, doubles each retry
  userAgent: string;
}

class CamaraHttpClient {
  private agent: http.Agent;  // Connection pooling
  
  constructor(config: HttpClientConfig);
  
  // Make GET request with automatic retry and exponential backoff
  async get<T>(endpoint: string, params?: QueryParams): Promise<ApiResponse<T>>;
  
  // Build full URL with properly encoded query parameters
  buildURL(endpoint: string, params?: QueryParams): string;
  
  // Handle API errors with proper categorization
  private handleError(error: unknown): ApiError;
  
  // Retry logic with exponential backoff
  private async retryRequest<T>(
    fn: () => Promise<T>, 
    attempts: number
  ): Promise<T>;
}

interface ApiResponse<T> {
  data: T;
  links?: PaginationLinks[];
  status: number;
  headers: Record<string, string>;
}

interface QueryParams {
  [key: string]: string | number | boolean | undefined;
}

interface PaginationLinks {
  rel: 'self' | 'first' | 'last' | 'next' | 'previous';
  href: string;
}
```

### 4. Cache Layer (`lib/core/cache.ts`)

Provides caching for API responses to improve performance and reduce load on the Câmara API.

**Design Rationale**: Caching is essential for performance since legislative data changes infrequently. A 1-hour TTL balances freshness with performance. LRU eviction prevents unbounded memory growth. The cache can be disabled via environment variable for debugging or when real-time data is critical.

```typescript
interface CacheConfig {
  enabled: boolean;
  ttl: number;  // Time to live in seconds (default: 3600)
  maxSize: number;  // Maximum cache size in bytes (default: 100MB)
}

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
  size: number;  // Size in bytes for LRU eviction
}

class CacheLayer {
  private cache: Map<string, CacheEntry<unknown>>;
  private accessOrder: string[];  // For LRU tracking
  private currentSize: number;
  
  constructor(config: CacheConfig);
  
  // Get cached value, returns null if expired or not found
  async get<T>(key: string): Promise<T | null>;
  
  // Set cache value with optional custom TTL
  async set<T>(key: string, value: T, ttl?: number): Promise<void>;
  
  // Check if key exists and is valid (not expired)
  has(key: string): boolean;
  
  // Clear all cache entries
  clear(): void;
  
  // Generate deterministic cache key from endpoint and params
  generateKey(endpoint: string, params?: QueryParams): string;
  
  // Evict least recently used entries when maxSize exceeded
  private evictLRU(): void;
  
  // Calculate size of cache entry
  private calculateSize(data: unknown): number;
}
```

### 5. Validation (`lib/core/validation.ts`)

Input validation using Zod schemas to ensure all tool inputs are valid before making API calls.

**Design Rationale**: Zod provides runtime type safety and excellent error messages. Validating inputs before API calls prevents unnecessary network requests and provides immediate feedback to users. The validation schemas serve as both runtime validators and documentation of expected input formats.

```typescript
import { z } from 'zod';

// Common validation schemas
const DeputyIdSchema = z.number().int().positive()
  .describe('Unique identifier for a deputy');

const DateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/)
  .describe('Date in YYYY-MM-DD format');

const UFSchema = z.enum(['AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 
  'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 
  'RO', 'RR', 'SC', 'SP', 'SE', 'TO'])
  .describe('Brazilian state code (UF)');

const PaginationSchema = z.object({
  pagina: z.number().int().positive().optional()
    .describe('Page number (1-indexed)'),
  itens: z.number().int().min(1).max(100).optional()
    .describe('Items per page (max 100)')
});

// Tool-specific schemas
const DeputadosListarSchema = z.object({
  id: z.number().int().positive().optional(),
  nome: z.string().min(1).optional(),
  siglaUf: UFSchema.optional(),
  siglaPartido: z.string().min(1).optional(),
  siglaSexo: z.enum(['M', 'F']).optional(),
  dataInicio: DateSchema.optional(),
  dataFim: DateSchema.optional(),
  pagina: z.number().int().positive().optional(),
  itens: z.number().int().min(1).max(100).optional()
}).refine(
  data => !data.dataInicio || !data.dataFim || data.dataInicio <= data.dataFim,
  { message: 'dataInicio must be before or equal to dataFim' }
);

const ProposicoesListarSchema = z.object({
  siglaTipo: z.string().optional(),
  numero: z.number().int().positive().optional(),
  ano: z.number().int().min(1900).max(new Date().getFullYear()).optional(),
  dataInicio: DateSchema.optional(),
  dataFim: DateSchema.optional(),
  idDeputadoAutor: z.number().int().positive().optional(),
  siglaPartidoAutor: z.string().optional(),
  siglaUfAutor: UFSchema.optional(),
  keywords: z.string().optional(),
  tramitacaoSenado: z.boolean().optional(),
  pagina: z.number().int().positive().optional(),
  itens: z.number().int().min(1).max(100).optional()
});

// Validation helper with detailed error messages
function validateInput<T>(schema: z.ZodSchema<T>, input: unknown): T {
  try {
    return schema.parse(input);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const messages = error.errors.map(e => 
        `${e.path.join('.')}: ${e.message}`
      ).join('; ');
      throw new ValidationError(messages, error.errors[0].path[0] as string, input);
    }
    throw error;
  }
}
```

### 6. Transport Adapters

#### STDIO Adapter (`lib/adapters/cli.ts`)

```typescript
class StdioAdapter {
  constructor(server: CamaraServer);
  
  // Start listening on stdin/stdout
  async start(): Promise<void>;
  
  // Handle incoming messages
  private async handleMessage(message: string): Promise<void>;
  
  // Send response to stdout
  private sendResponse(response: unknown): void;
}
```

#### HTTP Adapter (`lib/adapters/cli.ts`)

```typescript
class HttpAdapter {
  constructor(server: CamaraServer, port: number);
  
  // Start HTTP server
  async start(): Promise<void>;
  
  // Handle MCP protocol requests
  private handleMCPRequest(req: Request, res: Response): Promise<void>;
  
  // Handle REST API requests
  private handleRESTRequest(req: Request, res: Response): Promise<void>;
}
```

#### Cloudflare Workers Adapter (`lib/adapters/cloudflare.ts`)

```typescript
interface WorkerEnv {
  MCP_CACHE: KVNamespace;
  MCP_API_KEY?: string;
  RATE_LIMIT_KV: KVNamespace;
}

export default {
  async fetch(request: Request, env: WorkerEnv, ctx: ExecutionContext): Promise<Response> {
    // Initialize server with KV-backed cache
    const server = new CamaraServer({
      cache: new CloudflareKVCache(env.MCP_CACHE),
      rateLimiter: new CloudflareRateLimiter(env.RATE_LIMIT_KV)
    });
    
    // Route request
    return handleRequest(request, server, env);
  }
};
```

## Data Models

### API Response Types

All API responses follow a consistent structure with proper TypeScript typing to ensure type safety throughout the application.

```typescript
// Deputy types
interface Deputy {
  id: number;
  uri: string;
  nome: string;
  siglaPartido: string;
  uriPartido: string;
  siglaUf: string;
  idLegislatura: number;
  urlFoto: string;
  email?: string;
}

interface DeputyDetails extends Deputy {
  nomeCivil: string;
  cpf: string;
  sexo: string;
  dataNascimento: string;
  dataFalecimento?: string;
  ufNascimento: string;
  municipioNascimento: string;
  escolaridade: string;
  ultimoStatus: DeputyStatus;
}

interface DeputyStatus {
  id: number;
  uri: string;
  nome: string;
  siglaPartido: string;
  uriPartido: string;
  siglaUf: string;
  idLegislatura: number;
  urlFoto: string;
  data: string;
  nomeEleitoral: string;
  gabinete: {
    nome: string;
    predio: string;
    sala: string;
    andar: string;
    telefone: string;
    email: string;
  };
  situacao: string;
  condicaoEleitoral: string;
  descricaoStatus: string;
}

interface DeputyExpense {
  ano: number;
  mes: number;
  tipoDespesa: string;
  codDocumento: number;
  tipoDocumento: string;
  codTipoDocumento: number;
  dataDocumento: string;
  numDocumento: string;
  valorDocumento: number;
  urlDocumento: string;
  nomeFornecedor: string;
  cnpjCpfFornecedor: string;
  valorLiquido: number;
  valorGlosa: number;
  numRessarcimento: string;
  codLote: number;
  parcela: number;
}

interface DeputySpeech {
  dataHoraInicio: string;
  dataHoraFim: string;
  urlTexto: string;
  transcricao: string;
  keywords: string;
  sumario: string;
  uriEvento?: string;
  faseEvento?: {
    titulo: string;
    dataHoraInicio: string;
    dataHoraFim: string;
  };
}

// Proposition types
interface Proposition {
  id: number;
  uri: string;
  siglaTipo: string;
  codTipo: number;
  numero: number;
  ano: number;
  ementa: string;
}

interface PropositionDetails extends Proposition {
  dataApresentacao: string;
  uriOrgaoNumerador: string;
  statusProposicao: PropositionStatus;
  uriAutores: string;
  descricaoTipo: string;
  ementaDetalhada: string;
  keywords: string;
  uriPropPrincipal?: string;
  uriPropAnterior?: string;
  uriPropPosterior?: string;
  urlInteiroTeor: string;
  urnFinal?: string;
  texto?: string;
  justificativa?: string;
}

interface PropositionStatus {
  dataHora: string;
  sequencia: number;
  siglaOrgao: string;
  uriOrgao: string;
  uriUltimoRelator?: string;
  regime: string;
  descricaoTramitacao: string;
  codTipoTramitacao: string;
  descricaoSituacao: string;
  codSituacao: number;
  despacho?: string;
  url?: string;
  ambito: string;
}

// Voting types
interface Voting {
  id: string;
  uri: string;
  data: string;
  dataHoraRegistro: string;
  siglaOrgao: string;
  uriOrgao: string;
  uriEvento?: string;
  proposicaoObjeto: string;
  uriProposicaoObjeto: string;
  descricao: string;
  aprovacao: number;
}

interface VotingDetails extends Voting {
  ultimaAberturaVotacao: {
    dataHoraInicio: string;
    dataHoraFim: string;
    descricao: string;
  };
  votosSim: number;
  votosNao: number;
  votosOutros: number;
}

// Event types
interface Event {
  id: number;
  uri: string;
  dataHoraInicio: string;
  dataHoraFim?: string;
  situacao: string;
  descricaoTipo: string;
  descricao: string;
  localExterno?: string;
  orgaos: Array<{
    id: number;
    uri: string;
    sigla: string;
    nome: string;
    apelido: string;
  }>;
}

// Committee types
interface Committee {
  id: number;
  uri: string;
  sigla: string;
  nome: string;
  apelido: string;
  codTipoOrgao: number;
  tipoOrgao: string;
  nomePublicacao: string;
}

// Party types
interface Party {
  id: number;
  sigla: string;
  nome: string;
  uri: string;
}

// Pagination
interface PaginatedResponse<T> {
  dados: T[];
  links: Array<{
    rel: string;
    href: string;
  }>;
}
```

## Error Handling

### Error Types

```typescript
class CamaraAPIError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public endpoint: string,
    public originalError?: unknown
  ) {
    super(message);
    this.name = 'CamaraAPIError';
  }
}

class ValidationError extends Error {
  constructor(
    message: string,
    public field: string,
    public value: unknown
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}

class CacheError extends Error {
  constructor(message: string, public operation: string) {
    super(message);
    this.name = 'CacheError';
  }
}

class RateLimitError extends Error {
  constructor(
    message: string,
    public retryAfter: number
  ) {
    super(message);
    this.name = 'RateLimitError';
  }
}
```

### Error Handling Strategy

1. **API Errors**: Catch HTTP errors from Câmara API and transform into user-friendly messages
2. **Validation Errors**: Return clear messages indicating which parameter is invalid and why
3. **Network Errors**: Implement retry logic with exponential backoff for transient failures
4. **Cache Errors**: Log cache failures but don't block requests; fall back to direct API calls
5. **Rate Limit Errors**: Return 429 status with Retry-After header

```typescript
async function handleToolCall(name: string, args: unknown): Promise<ToolResult> {
  try {
    // Validate input
    const validatedArgs = validateInput(toolSchemas[name], args);
    
    // Execute tool
    const result = await tools[name].handler(validatedArgs, context);
    
    return {
      content: [{ type: 'text', text: JSON.stringify(result, null, 2) }]
    };
  } catch (error) {
    if (error instanceof ValidationError) {
      return {
        content: [{ 
          type: 'text', 
          text: `Validation error: ${error.message}. Field: ${error.field}` 
        }],
        isError: true
      };
    }
    
    if (error instanceof CamaraAPIError) {
      return {
        content: [{ 
          type: 'text', 
          text: `API error (${error.statusCode}): ${error.message}` 
        }],
        isError: true
      };
    }
    
    if (error instanceof RateLimitError) {
      return {
        content: [{ 
          type: 'text', 
          text: `Rate limit exceeded. Retry after ${error.retryAfter} seconds.` 
        }],
        isError: true
      };
    }
    
    // Unknown error
    return {
      content: [{ 
        type: 'text', 
        text: `Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}` 
      }],
      isError: true
    };
  }
}
```

## Testing Strategy

**Design Rationale**: Comprehensive testing ensures reliability and prevents regressions. Unit tests with mocked dependencies allow fast, isolated testing. Integration tests verify end-to-end flows. The 80% coverage target (per Req 16.5) balances thoroughness with development velocity.

### Unit Tests (Requirement 16.1, 16.3, 16.4)

Test individual components in isolation with mocked dependencies. Focus on core logic, error handling, and edge cases.

```typescript
// Example: Testing HTTP client
describe('CamaraHttpClient', () => {
  it('should make GET request with correct URL and params', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ dados: [] })
    });
    
    const client = new CamaraHttpClient({ baseURL: 'https://api.test' });
    await client.get('/deputados', { nome: 'João' });
    
    expect(mockFetch).toHaveBeenCalledWith(
      'https://api.test/deputados?nome=Jo%C3%A3o',
      expect.any(Object)
    );
  });
  
  it('should retry on network failure with exponential backoff', async () => {
    const mockFetch = vi.fn()
      .mockRejectedValueOnce(new Error('Network error'))
      .mockResolvedValueOnce({ ok: true, json: async () => ({ dados: [] }) });
    
    const client = new CamaraHttpClient({ 
      baseURL: 'https://api.test',
      retryAttempts: 2
    });
    
    await client.get('/deputados');
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });
  
  it('should handle 4xx client errors', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
      json: async () => ({ error: 'Not found' })
    });
    
    const client = new CamaraHttpClient({ baseURL: 'https://api.test' });
    await expect(client.get('/deputados/999999')).rejects.toThrow('Not found');
  });
  
  it('should handle 429 rate limit with retry-after', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 429,
      headers: { get: () => '60' },
      json: async () => ({ error: 'Rate limit exceeded' })
    });
    
    const client = new CamaraHttpClient({ baseURL: 'https://api.test' });
    await expect(client.get('/deputados')).rejects.toThrow(RateLimitError);
  });
});

// Example: Testing cache layer
describe('CacheLayer', () => {
  it('should return cached value within TTL', async () => {
    const cache = new CacheLayer({ enabled: true, ttl: 3600, maxSize: 1000000 });
    
    await cache.set('key1', { data: 'test' });
    const result = await cache.get('key1');
    
    expect(result).toEqual({ data: 'test' });
  });
  
  it('should return null for expired cache', async () => {
    const cache = new CacheLayer({ enabled: true, ttl: 1, maxSize: 1000000 });
    
    await cache.set('key1', { data: 'test' });
    await new Promise(resolve => setTimeout(resolve, 1100));
    
    const result = await cache.get('key1');
    expect(result).toBeNull();
  });
  
  it('should evict LRU entries when maxSize exceeded', async () => {
    const cache = new CacheLayer({ enabled: true, ttl: 3600, maxSize: 1000 });
    
    await cache.set('key1', 'x'.repeat(600));
    await cache.set('key2', 'y'.repeat(600));
    
    expect(cache.has('key1')).toBe(false);
    expect(cache.has('key2')).toBe(true);
  });
  
  it('should bypass cache when disabled', async () => {
    const cache = new CacheLayer({ enabled: false, ttl: 3600, maxSize: 1000000 });
    
    await cache.set('key1', { data: 'test' });
    const result = await cache.get('key1');
    
    expect(result).toBeNull();
  });
});

// Example: Testing validation
describe('Input Validation', () => {
  it('should validate deputy ID as positive integer', () => {
    expect(() => validateInput(DeputyIdSchema, 123)).not.toThrow();
    expect(() => validateInput(DeputyIdSchema, -1)).toThrow(ValidationError);
    expect(() => validateInput(DeputyIdSchema, 'abc')).toThrow(ValidationError);
  });
  
  it('should validate date format YYYY-MM-DD', () => {
    expect(() => validateInput(DateSchema, '2024-01-15')).not.toThrow();
    expect(() => validateInput(DateSchema, '2024/01/15')).toThrow(ValidationError);
    expect(() => validateInput(DateSchema, 'invalid')).toThrow(ValidationError);
  });
  
  it('should validate pagination limits', () => {
    expect(() => validateInput(PaginationSchema, { pagina: 1, itens: 50 })).not.toThrow();
    expect(() => validateInput(PaginationSchema, { itens: 101 })).toThrow(ValidationError);
    expect(() => validateInput(PaginationSchema, { pagina: 0 })).toThrow(ValidationError);
  });
  
  it('should validate UF codes', () => {
    expect(() => validateInput(UFSchema, 'SP')).not.toThrow();
    expect(() => validateInput(UFSchema, 'XX')).toThrow(ValidationError);
  });
});

// Example: Testing tool handlers
describe('Tool Handlers', () => {
  it('should handle deputados_listar with filters', async () => {
    const mockClient = {
      get: vi.fn().mockResolvedValue({
        data: { dados: [{ id: 1, nome: 'Test' }] }
      })
    };
    
    const context = { httpClient: mockClient, cache: mockCache, config: testConfig };
    const result = await deputadosListarHandler({ siglaUf: 'SP' }, context);
    
    expect(mockClient.get).toHaveBeenCalledWith('/deputados', { siglaUf: 'SP' });
    expect(result.content[0].text).toContain('Test');
  });
});
```

### Integration Tests (Requirement 16.2)

Test end-to-end flows with real MCP protocol communication.

```typescript
describe('MCP Server Integration', () => {
  it('should list all 62 available tools', async () => {
    const server = new CamaraServer(testConfig);
    await server.initialize();
    
    const response = await server.handleRequest({
      jsonrpc: '2.0',
      id: 1,
      method: 'tools/list'
    });
    
    expect(response.result.tools).toHaveLength(62);
    expect(response.result.tools[0]).toHaveProperty('name');
    expect(response.result.tools[0]).toHaveProperty('description');
    expect(response.result.tools[0]).toHaveProperty('inputSchema');
  });
  
  it('should execute deputados_listar tool end-to-end', async () => {
    const server = new CamaraServer(testConfig);
    await server.initialize();
    
    const response = await server.handleRequest({
      jsonrpc: '2.0',
      id: 2,
      method: 'tools/call',
      params: {
        name: 'deputados_listar',
        arguments: { siglaUf: 'SP', pagina: 1, itens: 10 }
      }
    });
    
    expect(response.result.content[0].type).toBe('text');
    const data = JSON.parse(response.result.content[0].text);
    expect(data.dados).toBeInstanceOf(Array);
  });
  
  it('should handle validation errors gracefully', async () => {
    const server = new CamaraServer(testConfig);
    await server.initialize();
    
    const response = await server.handleRequest({
      jsonrpc: '2.0',
      id: 3,
      method: 'tools/call',
      params: {
        name: 'deputados_listar',
        arguments: { siglaUf: 'INVALID' }
      }
    });
    
    expect(response.result.isError).toBe(true);
    expect(response.result.content[0].text).toContain('Validation error');
  });
  
  it('should use cache for repeated requests', async () => {
    const server = new CamaraServer({ ...testConfig, cacheEnabled: true });
    await server.initialize();
    
    const spy = vi.spyOn(server.httpClient, 'get');
    
    // First request
    await server.handleRequest({
      jsonrpc: '2.0',
      id: 4,
      method: 'tools/call',
      params: { name: 'deputados_listar', arguments: { siglaUf: 'SP' } }
    });
    
    // Second request (should use cache)
    await server.handleRequest({
      jsonrpc: '2.0',
      id: 5,
      method: 'tools/call',
      params: { name: 'deputados_listar', arguments: { siglaUf: 'SP' } }
    });
    
    expect(spy).toHaveBeenCalledTimes(1);
  });
});
```

### Test Coverage Goals (Requirement 16.5)

- **Unit tests**: 80% code coverage minimum across all core modules
- **Integration tests**: All critical user workflows covered
- **Error scenarios**: All error types tested (validation, API, network, rate limit, cache)
- **Edge cases**: Boundary conditions validated (pagination limits, date ranges, etc.)
- **Tool coverage**: All 62 tools have at least basic happy path tests

## Deployment

### NPM Package

The package is designed for easy installation and usage across multiple deployment scenarios.

**Design Rationale**: Supporting multiple installation methods (global npm, npx, Smithery) maximizes accessibility for different user preferences. The post-install message provides immediate guidance, reducing friction for new users.

```json
{
  "name": "@aredes.me/mcp-camara",
  "version": "1.0.0",
  "main": "build/lib/adapters/cli.js",
  "bin": {
    "mcp-camara": "build/lib/bin/mcp-camara.js"
  },
  "files": [
    "build/",
    "README.md",
    "LICENSE"
  ],
  "scripts": {
    "build": "tsc",
    "dev": "tsx lib/adapters/cli.ts",
    "test": "vitest run",
    "prepublishOnly": "npm run build",
    "postinstall": "node build/lib/scripts/postinstall.js"
  }
}
```

### Post-Install Experience

```typescript
// lib/scripts/postinstall.ts
console.log(`
✅ MCP Câmara dos Deputados Server installed successfully!

Quick Start:
  1. Add to your AI assistant config (Claude Desktop, Cursor, etc.)
  2. Use 'npx @aredes.me/mcp-camara' as the command
  3. Start querying Brazilian legislative data!

Documentation: https://github.com/aredes/mcp-camara#readme
Examples: https://github.com/aredes/mcp-camara/blob/main/docs/USAGE_EXAMPLES.md
`);
```

### Cloudflare Workers

```toml
# wrangler.toml
name = "mcp-camara"
main = "build/lib/workers/worker.js"
compatibility_date = "2024-01-01"

[env.production]
kv_namespaces = [
  { binding = "MCP_CACHE", id = "xxx" },
  { binding = "RATE_LIMIT_KV", id = "yyy" }
]

[env.production.vars]
CAMARA_API_BASE_URL = "https://dadosabertos.camara.leg.br/api/v2"
MCP_CACHE_TTL = "3600"
```

### Smithery Configuration

```yaml
# smithery.yaml
name: mcp-camara
version: 1.0.0
description: MCP server for Brazilian Chamber of Deputies data
author: Cristiano Aredes
license: MIT

runtime:
  type: node
  version: ">=18.0.0"

install:
  command: npx
  args: ["@aredes.me/mcp-camara"]

configuration:
  env:
    - name: CAMARA_API_BASE_URL
      description: Base URL for Câmara API
      default: https://dadosabertos.camara.leg.br/api/v2
      required: false
```

## Performance Considerations

### Caching Strategy

**Design Rationale**: Legislative data is relatively static (bills don't change frequently), making caching highly effective. A 1-hour TTL provides a good balance between freshness and performance. The LRU eviction strategy ensures the most frequently accessed data remains cached.

1. **Cache all GET requests** with 1-hour TTL by default (configurable via MCP_CACHE_TTL)
2. **Cache key format**: `{endpoint}:{hash(params)}` for deterministic lookups
3. **Cache invalidation**: Time-based expiration only (no manual invalidation needed for public data)
4. **Memory limits**: LRU eviction when cache exceeds 100MB
5. **Cache bypass**: Set MCP_DISABLE_CACHE=true for debugging or real-time requirements
6. **Cache metrics**: Track hit rate, miss rate, and eviction rate for monitoring

### Rate Limiting

**Design Rationale**: Rate limiting protects both the MCP server and the Câmara API from abuse. The sliding window algorithm provides smooth rate limiting without burst allowances. Higher limits for authenticated users incentivize API key usage while maintaining fair access.

1. **Default limit**: 30 requests/minute per IP address
2. **Authenticated limit**: 100 requests/minute with valid API key
3. **Sliding window**: Track requests in 60-second rolling windows
4. **Cloudflare Workers**: Use KV for distributed rate limiting across edge locations
5. **Rate limit headers**: Include X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset
6. **Bypass option**: Set MCP_DISABLE_RATE_LIMIT=true for development/testing

### HTTP Client Optimization

**Design Rationale**: Connection pooling significantly reduces latency for multiple requests. Exponential backoff prevents overwhelming the API during transient failures. Compression reduces bandwidth usage, especially important for large responses like proposition lists.

1. **Connection pooling**: Reuse HTTP connections with keep-alive
2. **Timeout**: 30 seconds per request (generous for slow API responses)
3. **Retry logic**: 3 attempts with exponential backoff (1s, 2s, 4s)
4. **Compression**: Accept gzip/deflate encoding to reduce bandwidth
5. **User-Agent**: Include version and contact info for API provider tracking

## Security Considerations

**Design Rationale**: Security is built into every layer. Input validation prevents injection attacks and malformed requests. Rate limiting prevents DoS attacks. Sanitized error messages prevent information leakage. Environment variable storage for secrets follows security best practices.

1. **Input validation**: All inputs validated with Zod schemas before API calls to prevent injection attacks
2. **API key protection**: Store API keys in environment variables (MCP_API_KEY), never in code or logs
3. **Rate limiting**: Prevent abuse and ensure fair usage across all clients
4. **CORS**: Configure appropriate CORS headers for web deployments (restrict origins in production)
5. **Error messages**: Don't expose internal details, stack traces, or API keys in error responses
6. **Logging**: Sanitize logs to remove sensitive information (API keys, personal data)
7. **HTTPS only**: Enforce HTTPS for all HTTP/SSE transports in production
8. **Dependency security**: Regular updates and vulnerability scanning of npm dependencies

## Monitoring and Observability

### Metrics to Track

1. **Request metrics**: Total requests, requests per tool, response times
2. **Error metrics**: Error rate by type, failed API calls
3. **Cache metrics**: Hit rate, miss rate, eviction rate
4. **Rate limit metrics**: Throttled requests, top consumers

### Logging Strategy

The logging system provides comprehensive observability with structured log entries and configurable log levels.

**Design Rationale**: Structured logging enables better debugging and monitoring in production environments. The LOG_LEVEL environment variable allows operators to control verbosity without code changes, which is essential for troubleshooting issues in different deployment environments.

```typescript
interface LogEntry {
  timestamp: string;
  level: 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';
  message: string;
  context?: {
    tool?: string;
    endpoint?: string;
    duration?: number;
    error?: string;
    stackTrace?: string;
    requestContext?: Record<string, unknown>;
    httpMethod?: string;
    url?: string;
    statusCode?: number;
    cacheKey?: string;
  };
}

class Logger {
  constructor(private level: LogLevel) {}
  
  // Log tool invocations with parameters and execution time
  logToolInvocation(tool: string, params: unknown, duration: number): void;
  
  // Log errors with stack trace and request context
  logError(message: string, error: Error, context?: Record<string, unknown>): void;
  
  // Log API requests with HTTP method, URL, and response status
  logApiRequest(method: string, url: string, statusCode: number, duration: number): void;
  
  // Log cache operations
  logCacheHit(key: string): void;
  logCacheMiss(key: string): void;
  
  // Filter messages based on configured level
  private shouldLog(level: LogLevel): boolean;
}

// Example log entries
logger.info('Tool invoked', { 
  tool: 'deputados_listar', 
  params: { siglaUf: 'SP' },
  duration: 245 
});

logger.error('API request failed', { 
  endpoint: '/deputados', 
  httpMethod: 'GET',
  url: 'https://dadosabertos.camara.leg.br/api/v2/deputados',
  statusCode: 500, 
  error: 'Internal server error',
  stackTrace: error.stack,
  requestContext: { tool: 'deputados_listar' }
});

logger.debug('Cache hit', { 
  cacheKey: 'deputados:hash123', 
  ttl: 3600 
});
```

## Future Enhancements

1. **GraphQL support**: Add GraphQL endpoint for more flexible queries
2. **Webhooks**: Subscribe to updates on specific deputies or propositions
3. **Advanced search**: Full-text search across propositions and speeches
4. **Analytics**: Built-in analytics for tracking legislative trends
5. **Batch operations**: Support for querying multiple resources in one request
6. **Real-time updates**: WebSocket support for live event notifications
