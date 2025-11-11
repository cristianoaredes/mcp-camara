# MCP Câmara dos Deputados 🇧🇷

[![npm version](https://img.shields.io/npm/v/@aredes.me/mcp-camara.svg)](https://www.npmjs.com/package/@aredes.me/mcp-camara)
[![npm downloads](https://img.shields.io/npm/dm/@aredes.me/mcp-camara.svg)](https://www.npmjs.com/package/@aredes.me/mcp-camara)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue.svg)](https://www.typescriptlang.org/)
[![Cloudflare Workers](https://img.shields.io/badge/Cloudflare-Workers-orange.svg)](https://workers.cloudflare.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

> **🏛️ Model Context Protocol (MCP) server for Brazilian Chamber of Deputies Open Data** — Bring comprehensive legislative information directly into Claude Desktop, Cursor, Windsurf, Continue.dev and other AI assistants.

> **🚀 Multi-platform deployment: NPM package, Cloudflare Workers, Smithery.**

*[English](#english) | [Português](./README.pt-BR.md)*

---

## English

🤖 **Model Context Protocol server for Brazilian Chamber of Deputies Open Data.** Access comprehensive legislative information including deputies, bills, votes, committees, parties, and events directly in Claude Desktop, Cursor, Windsurf, Continue.dev and any MCP-compatible assistant.

## ⚡ Quick Install

```bash
npm install -g @aredes.me/mcp-camara
```

Or run directly with NPX:

```bash
npx @aredes.me/mcp-camara
```

### Via Smithery (1-click)

```bash
npx -y @smithery/cli install @aredes.me/mcp-camara --client claude
```

## 🔌 IDE / MCP Client Configuration

### 🤖 Claude Desktop

```json
{
  "mcpServers": {
    "camara": {
      "command": "npx",
      "args": ["@aredes.me/mcp-camara"]
    }
  }
}
```

**Location:** `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS)

### 🎯 Cursor IDE

```json
{
  "mcpServers": {
    "camara": {
      "command": "npx",
      "args": ["@aredes.me/mcp-camara"]
    }
  }
}
```

### 🏄 Windsurf IDE

```json
{
  "mcpServers": {
    "camara": {
      "command": "npx",
      "args": ["@aredes.me/mcp-camara"]
    }
  }
}
```

### 🔄 Continue.dev

```json
{
  "mcpServers": [
    {
      "name": "camara",
      "command": "npx",
      "args": ["@aredes.me/mcp-camara"]
    }
  ]
}
```

### 🤖 ChatGPT MCP

To use with ChatGPT, configure the Cloudflare Workers server as a remote endpoint:

1. **Deploy to Cloudflare Workers:** `npm run workers:deploy:prod`
2. **Configure in ChatGPT:**
   - Server URL: `https://mcp-camara.your-subdomain.workers.dev`
   - ChatGPT will automatically detect OAuth and MCP endpoints
3. **Configure API Key** (optional, via Workers environment variables)

**Available REST APIs:**
- `GET /deputados/{id}` - Get deputy details
- `GET /proposicoes/{id}` - Get proposition details
- `GET /votacoes/{id}` - Get voting details
- `GET /eventos/{id}` - Get event details

**✅ Quick test:**
```
Can you search for information about deputy with ID 220593?
```

## 🛠️ Available Tools

### 👥 Deputies (15 tools)
- 🔍 **`deputados_listar`** — List deputies with filters (name, party, state, legislature)
- 📋 **`deputados_obter`** — Complete deputy details
- 💰 **`deputados_despesas`** — Expenses and reimbursements
- 🎤 **`deputados_discursos`** — Floor speeches
- 📅 **`deputados_eventos`** — Event participation
- 📊 **`deputados_frentes`** — Parliamentary fronts
- 🏛️ **`deputados_orgaos`** — Bodies and committees
- 📜 **`deputados_profissoes`** — List of professions
- And more...

### 📜 Propositions (10 tools)
- 🔍 **`proposicoes_listar`** — List propositions with filters
- 📋 **`proposicoes_obter`** — Proposition details
- 👥 **`proposicoes_autores`** — Proposition authors
- 📄 **`proposicoes_relacionadas`** — Related propositions
- 🗳️ **`proposicoes_votacoes`** — Proposition votes
- And more...

### 🗳️ Votings (4 tools)
- 🔍 **`votacoes_listar`** — List votings
- 📋 **`votacoes_obter`** — Voting details
- 👥 **`votacoes_votos`** — Individual votes
- 📊 **`votacoes_orientacoes`** — Party orientations

### 🏛️ Committees (5 tools)
- 🔍 **`orgaos_listar`** — List committees and bodies
- 📋 **`orgaos_obter`** — Committee details
- 👥 **`orgaos_membros`** — Committee members
- 📅 **`orgaos_eventos`** — Committee events
- 🗳️ **`orgaos_votacoes`** — Committee votes

### 🎯 Parties (6 tools)
- 🔍 **`partidos_listar`** — List political parties
- 📋 **`partidos_obter`** — Party details
- 👥 **`partidos_membros`** — Party members
- 🤝 **`blocos_listar`** — List party blocs
- 📋 **`blocos_obter`** — Bloc details
- And more...

### 📅 Events (7 tools)
- 🔍 **`eventos_listar`** — List legislative events
- 📋 **`eventos_obter`** — Event details
- 🏛️ **`eventos_orgaos`** — Events by body
- 👥 **`eventos_deputados`** — Events by deputy
- 📜 **`eventos_pauta`** — Event agenda
- And more...

### 📚 Reference Data (15 tools)
- 🏛️ **`referencias_legislaturas`** — List legislatures
- 🎯 **`referencias_situacoes_deputado`** — Deputy statuses
- 📊 **`referencias_situacoes_evento`** — Event statuses
- 🗳️ **`referencias_situacoes_proposicao`** — Proposition statuses
- 📋 **`referencias_tipos_proposicao`** — Proposition types
- And more...

## 🧪 Command Line Testing

### Local HTTP + SSE server

```bash
npm run build
MCP_TRANSPORT=http MCP_HTTP_PORT=3000 node build/lib/bin/mcp-camara.js
```

In another terminal:

```bash
# List tools
curl http://localhost:3000/mcp -X POST -H "Content-Type: application/json" \
  -d '{"jsonrpc": "2.0", "id": 1, "method": "tools/list"}'

# Get deputy
curl http://localhost:3000/deputados/220593

# List propositions
curl http://localhost:3000/mcp -X POST -H "Content-Type: application/json" \
  -d '{"jsonrpc": "2.0", "id": 1, "method": "tools/call", "params": {"name": "proposicoes_listar", "arguments": {"siglaTipo": "PL", "ano": 2024}}}'
```

### Quick health check

```bash
curl -i http://localhost:3000/health
```

## 🌐 Web Deployment (Optional)

**Cloudflare Workers:** Deploy as a globally distributed API

```bash
# 1. Install dependencies
npm install

# 2. Build the project
npm run build

# 3. Create KV namespaces
npm run workers:kv:create

# 4. Deploy to development
npm run workers:deploy:dev

# 5. Deploy to production
npm run workers:deploy:prod
```

**Workers Features:**
- 🔗 **REST API:** `/deputados/{id}` · `/proposicoes/{id}` · `/votacoes/{id}` · `/eventos/{id}`
- 🤖 **OpenAPI:** `/openapi.json`
- 📊 **Health:** `/health`
- 🔐 **API Key Authentication:** Optional protection against abuse
- ⚡ **Rate Limiting:** Configurable via KV
- 💾 **Cache:** LRU cache with configurable TTL

**Smithery:** `smithery.yaml` for single-click deployment.

### 🚀 For ChatGPT MCP

```bash
# 1. Deploy to Cloudflare
npm run build
npm run workers:deploy:prod

# 2. Configure in ChatGPT:
# - Server URL: https://your-subdomain.workers.dev
# - ChatGPT will automatically detect OAuth + MCP endpoints
```

### 🔒 Security (Cloudflare Workers)

**API Key Authentication:**
- **Protected:** REST endpoints (`/deputados/*`, `/proposicoes/*`, `/votacoes/*`, `/eventos/*`)
- **Unprotected:** MCP protocol (`/mcp`, `/sse`) - for AI assistant compatibility

```bash
# Configure API key
wrangler secret put MCP_API_KEY

# Use via headers (REST endpoints only):
curl -H "X-API-Key: your-key" https://your-worker.workers.dev/deputados/220593
# or
curl -H "Authorization: Bearer your-key" https://your-worker.workers.dev/deputados/220593

# MCP endpoints don't require authentication:
curl -X POST https://your-worker.workers.dev/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc": "2.0", "id": 1, "method": "tools/list"}'
```

**Rate Limiting:**
- Configurable via environment variables
- KV-based for scalability
- Can be disabled with `MCP_DISABLE_RATE_LIMIT=true`

## 📚 Documentation

- **[Configuration Guide](./docs/CONFIGURATION.md)** — Environment variables and settings
- **[Usage Examples](./docs/USAGE_EXAMPLES.md)** — Practical examples and use cases
- **[API Documentation](./docs/API.md)** — Complete tool reference
- **[Cloudflare Deployment](./docs/CLOUDFLARE_DEPLOYMENT.md)** — Deployment guide
- **[HTTP Transport](./docs/HTTP_TRANSPORT.md)** — HTTP server documentation
- **[SSE Transport](./docs/SSE_TRANSPORT.md)** — Server-Sent Events
- **[Troubleshooting](./docs/TROUBLESHOOTING.md)** — Common issues and solutions

## 💼 Use Cases

- **📊 Legislative Analysis** — Track bills, votes, and parliamentary activity
- **🔍 Political Research** — Investigate deputy and party history
- **📰 Data Journalism** — Extract data for investigative reporting
- **🎓 Academic Research** — Analyze legislative behavior and voting patterns
- **👥 Public Transparency** — Monitor deputy expenses and activities
- **🤖 Civic Chatbots** — Build assistants for legislative information

## 🤝 Contributing

Contributions are welcome! Please read [CONTRIBUTING.md](./CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

## 📄 License & Credits

- MIT License — [LICENSE](./LICENSE)
- Data provided by [Brazilian Chamber of Deputies Open Data API](https://dadosabertos.camara.leg.br/)
- Based on [Model Context Protocol](https://modelcontextprotocol.io)

## 👨‍💻 Author

| Cristiano Aredes |
|:---:|
| [![Cristiano Aredes](https://github.com/cristianoaredes.png?size=100)](https://github.com/cristianoaredes) |
| [LinkedIn](https://www.linkedin.com/in/cristianoaredes/) · [cristiano@aredes.me](mailto:cristiano@aredes.me) |

---

**Made with ❤️ for transparency and civic engagement 🇧🇷**


