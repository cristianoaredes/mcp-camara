# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

MCP Server implementation for Brazilian Chamber of Deputies (Câmara dos Deputados) Open Data API. A TypeScript-based Model Context Protocol server providing 62 tools across 7 categories to query legislative data, published as NPM package and deployable to Cloudflare Workers.

**📦 Published**: `@aredes.me/mcp-camara` on NPM
**🌐 Production**: https://mcp-camara.your-subdomain.workers.dev (Cloudflare Workers)
**🛠️ Local Dev**: STDIO mode via `npm run dev`

---

## ⚡ Quick Start

### Option 1: Use Published Package (Recommended)

```json
// ~/Library/Application Support/Claude/claude_desktop_config.json
{
  "mcpServers": {
    "camara-deputados": {
      "command": "npx",
      "args": ["@aredes.me/mcp-camara"],
      "enabled": true
    }
  }
}
```

**Reinicie o Claude Desktop** e teste: _"Liste os deputados de São Paulo"_

### Option 2: Local Development

```bash
# Clone and install
git clone https://github.com/aredes/mcp-camara.git
cd mcp-camara
npm install

# Run in dev mode
npm run dev

# In another terminal, test
curl http://localhost:3000/health
```

---

## 🎯 Ferramentas Disponíveis (62 total)

### 👥 Deputados (15 ferramentas)
- `deputados_listar` - Listar com filtros
- `deputados_obter` - Detalhes completos
- `deputados_despesas` - Gastos e reembolsos
- `deputados_discursos` - Discursos em plenário
- `deputados_eventos` - Participação em eventos
- `deputados_foto` - URL da foto oficial
- E mais 9 ferramentas...

### 📜 Proposições (10 ferramentas)
- `proposicoes_listar` - Buscar PL, PEC, etc.
- `proposicoes_obter` - Texto integral
- `proposicoes_votacoes` - Histórico de votações
- `proposicoes_tramitacoes` - Tramitação atual
- E mais 6 ferramentas...

### 🗳️ Votações, 🏛️ Comissões, 🎯 Partidos, 📅 Eventos, 📚 Referências
Ver lista completa: [README.md](./README.md#ferramentas-disponíveis)

---

## 📝 Configuração Claude Desktop

**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "camara-deputados": {
      "command": "npx",
      "args": ["@aredes.me/mcp-camara"],
      "enabled": true
    }
  }
}
```

**Ou para desenvolvimento local com HTTP transport**:
```json
{
  "mcpServers": {
    "camara-deputados-dev": {
      "command": "node",
      "args": ["/path/to/mcp-camara/build/lib/bin/mcp-camara.js"],
      "env": {
        "MCP_TRANSPORT": "stdio",
        "LOG_LEVEL": "DEBUG"
      },
      "enabled": true
    }
  }
}
```

**Importante**: Sempre reinicie o Claude Desktop após alterar a configuração.

---

## 💡 Exemplos Práticos de Uso

### Exemplo 1: Pesquisar Deputados
```
User: "Quais deputados de São Paulo são do PT?"
Claude usa: deputados_listar({ siglaUf: "SP", siglaPartido: "PT" })
→ Retorna lista de deputados filtrados
```

### Exemplo 2: Analisar Despesas
```
User: "Mostre os gastos do deputado 220593 em 2024"
Claude usa: deputados_despesas({ id: 220593, ano: 2024 })
→ Retorna detalhamento de despesas
```

### Exemplo 3: Acompanhar Proposição
```
User: "Qual o status da PEC 45/2019?"
Claude executa:
1. proposicoes_listar({ siglaTipo: "PEC", numero: 45, ano: 2019 })
2. proposicoes_tramitacoes({ id: <id_retornado> })
→ Histórico completo de tramitação
```

### Exemplo 4: Análise de Votação
```
User: "Como os partidos votaram na última reforma tributária?"
Claude usa: votacoes_listar + votacoes_orientacoes
→ Orientações de voto por bancada
```

---

## Architecture

### Multi-Transport Architecture

The server supports 3 transport protocols via adapter pattern:

- **STDIO** (`lib/adapters/cli.ts`): Default for Claude Desktop, Cursor, Windsurf
- **HTTP** (`lib/adapters/index.ts`): REST + MCP JSON-RPC endpoints
- **SSE** (`lib/adapters/index.ts`): Server-Sent Events for real-time streaming

Transport selection via `MCP_TRANSPORT` env var, handled by `lib/bin/mcp-camara.ts` CLI entry point.

### Core Components

**Server Core** (`lib/core/`)
- `mcp-server.ts`: Main server class, tool registration/invocation via MCP SDK
- `tools.ts`: ToolRegistry pattern - generic tool definition/execution framework
- `http-client.ts`: HTTP client with retry logic for Câmara API
- `cache.ts`: LRU cache layer with TTL (production: KV-based for Workers)
- `validation.ts`: Zod schemas for all tool inputs (62 schemas total)

**Tool Categories** (`lib/tools/`)
Each file exports `ToolDefinition[]` with tool metadata + handler functions:
- `deputy-tools.ts` (15 tools): Deputies, expenses, speeches, events
- `proposition-tools.ts` (10 tools): Bills, amendments, voting history
- `voting-tools.ts` (4 tools): Vote details, orientations
- `committee-tools.ts` (5 tools): Committees, members, events
- `party-tools.ts` (6 tools): Parties, blocs, leadership
- `event-tools.ts` (7 tools): Legislative calendar, agendas
- `reference-tools.ts` (15 tools): Reference data (UFs, legislatures, etc.)

**Cloudflare Workers** (`lib/workers/`)
- `worker.ts`: Entrypoint exporting Cloudflare Workers fetch handler
- `kv-cache.ts`: KV-backed cache implementation
- `kv-rate-limiter.ts`: KV-backed rate limiting (token bucket algorithm)
- `sse.ts`: SSE transport for Workers environment
- `openapi-spec.ts`: Auto-generated OpenAPI 3.0 spec from tool definitions

### Configuration System

Config loaded via `lib/config/index.ts` from env vars with validation:
- Required: None (all have defaults)
- Transport: `MCP_TRANSPORT` (stdio|http|sse, default: stdio)
- HTTP: `MCP_HTTP_PORT` (default: 3000)
- API: `CAMARA_API_BASE_URL` (default: https://dadosabertos.camara.leg.br/api/v2)
- Cache: `MCP_CACHE_TTL` (seconds, default: 3600), `MCP_DISABLE_CACHE`
- Rate Limit: `MCP_RATE_LIMIT` (per min, default: 30), `MCP_DISABLE_RATE_LIMIT`
- Auth: `MCP_API_KEY` (optional, only for Workers REST endpoints)
- Logging: `LOG_LEVEL` (DEBUG|INFO|WARN|ERROR, default: INFO)

## Common Development Commands

### Local Development

```bash
# Install dependencies
npm install

# Build TypeScript → JavaScript (outputs to build/)
npm run build

# Run in dev mode with tsx (no build step)
npm run dev

# Run tests (Vitest)
npm test              # Run once
npm run test:watch    # Watch mode
```

### Testing Transports Locally

```bash
# STDIO (default - for MCP clients)
npm run build && node build/lib/bin/mcp-camara.js

# HTTP (includes REST + MCP JSON-RPC endpoints)
npm run build && MCP_TRANSPORT=http MCP_HTTP_PORT=3000 node build/lib/bin/mcp-camara.js

# Test HTTP endpoints
curl http://localhost:3000/health                           # Health check
curl http://localhost:3000/deputados/220593                 # REST API
curl -X POST http://localhost:3000/mcp \                    # MCP protocol
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'

# SSE transport
npm run build && MCP_TRANSPORT=sse MCP_HTTP_PORT=3000 node build/lib/bin/mcp-camara.js
```

### Cloudflare Workers Deployment

```bash
# 1. Create KV namespaces (only once)
npm run workers:kv:create         # Creates both dev + prod KV namespaces
# Manually update wrangler.toml with KV IDs

# 2. Local dev server (wrangler dev)
npm run workers:dev

# 3. Deploy to development
npm run workers:deploy:dev

# 4. Deploy to production
npm run workers:deploy:prod

# 5. View logs
npm run workers:tail              # Dev logs
npm run workers:tail:prod         # Prod logs

# Set secrets (API key optional)
wrangler secret put MCP_API_KEY --env production
```

**Important**: After `workers:kv:create`, copy the generated KV namespace IDs from console output into `wrangler.toml` under `[[env.development.kv_namespaces]]` and `[[env.production.kv_namespaces]]`.

## Development Patterns

### Adding a New Tool

1. **Define Zod Schema** in `lib/core/validation.ts`:
```typescript
export const MyNewToolSchema = z.object({
  param1: z.string(),
  param2: z.number().optional(),
});
```

2. **Create Handler** in appropriate `lib/tools/*-tools.ts`:
```typescript
async function myNewToolHandler(args: unknown, context: ToolContext): Promise<ToolResult> {
  const validated = validateInput(MyNewToolSchema, args);
  const data = await context.httpClient.get('/endpoint', validated);
  return formatResult(data);
}

export const myNewTool: ToolDefinition = {
  name: 'category_tool_name',
  description: 'Detailed description for AI assistants',
  inputSchema: zodToJsonSchema(MyNewToolSchema),
  handler: myNewToolHandler,
};
```

3. **Export** tool in `lib/tools/index.ts`:
```typescript
import { myNewTool } from './category-tools.js';
export const allTools = [...existingTools, myNewTool];
```

4. **Test** with unit test in `test/unit/category-tools.test.ts`

### Testing Strategy

- **Unit tests** (`test/unit/`): Mock HTTP client, test tool handlers in isolation
- **Integration tests** (`test/integration/`):
  - `integration-mcp-protocol.test.ts`: MCP protocol compliance
  - `integration-transport.test.ts`: STDIO/HTTP/SSE adapters
  - `integration-e2e.test.ts`: End-to-end with real Câmara API (slow)
- **Scripts** (`test/scripts/`): Bash scripts for manual HTTP/SSE testing

Run specific test: `npm test -- deputy-tools.test.ts`

### Workers vs Node.js Environments

Code paths differ based on runtime:
- **Node.js**: Uses `lib/core/cache.ts` (in-memory LRU) + `lib/infrastructure/rate-limiter.ts` (in-memory)
- **Workers**: Uses `lib/workers/kv-cache.ts` (KV-backed) + `lib/workers/kv-rate-limiter.ts` (KV-backed)

Dependency injection pattern in `CamaraServer` constructor allows runtime-specific implementations.

## Key Files

- `lib/index.ts`: Public API exports (CamaraServer, types)
- `lib/bin/mcp-camara.ts`: CLI entrypoint, transport selection logic
- `lib/core/mcp-server.ts`: Core server, implements MCP protocol handlers
- `lib/workers/worker.ts`: Cloudflare Workers entrypoint
- `wrangler.toml`: Workers config (KV bindings, env vars, deployment targets)
- `tsconfig.json`: TypeScript config (ES2022 modules, strict mode)
- `vitest.config.ts`: Test runner configuration

## Publishing

```bash
# NPM (automated via npm scripts)
npm version patch|minor|major     # Bumps version, creates git tag
npm publish                       # Triggers prepublishOnly: npm run build

# Manual publish
./publish-npm.sh                  # Interactive script

# Cloudflare Workers
./publish-cloudflare.sh           # Deploys to production Workers
```

Package includes:
- `build/` directory (compiled JS + .d.ts)
- Binary: `mcp-camara` → `build/lib/bin/mcp-camara.js`
- Postinstall script: Displays setup instructions

## Environment-Specific Notes

### Cloudflare Workers
- KV namespaces required for cache + rate limiting
- API key auth only applies to REST endpoints (`/deputados/*`, etc.)
- MCP protocol endpoints (`/mcp`, `/sse`) intentionally unauthenticated for AI client compatibility
- OpenAPI spec auto-generated at `/openapi.json`
- CORS enabled for all origins

### Local Development
- No external dependencies beyond Câmara API
- Rate limiting + caching can be disabled with env vars
- Debug logging: `LOG_LEVEL=DEBUG`

## Useful Debugging Commands

```bash
# Check what tools are registered
curl -X POST http://localhost:3000/mcp -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | jq '.result.tools[] | .name'

# Test a specific tool
curl -X POST http://localhost:3000/mcp -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"deputados_obter","arguments":{"id":220593}}}' | jq

# Check Workers logs in realtime
npm run workers:tail:prod

# Inspect KV cache (Workers)
wrangler kv:key list --binding=MCP_CACHE --env production
wrangler kv:key get "cache:deputados:220593" --binding=MCP_CACHE --env production
```
