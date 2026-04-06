# MCP Server for Brazilian Chamber of Deputies (Câmara dos Deputados) 🇧🇷

[![npm version](https://img.shields.io/npm/v/@aredes.me/mcp-camara.svg)](https://www.npmjs.com/package/@aredes.me/mcp-camara)
[![npm downloads](https://img.shields.io/npm/dm/@aredes.me/mcp-camara.svg)](https://www.npmjs.com/package/@aredes.me/mcp-camara)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue.svg)](https://www.typescriptlang.org/)
[![Cloudflare Workers](https://img.shields.io/badge/Cloudflare-Workers-orange.svg)](https://workers.cloudflare.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![GitHub stars](https://img.shields.io/github/stars/cristianoaredes/mcp-camara?style=social)](https://github.com/cristianoaredes/mcp-camara)

**Model Context Protocol (MCP) server that connects Claude, Cursor, Windsurf, and other AI assistants to the Brazilian Chamber of Deputies open data API — 62 tools covering deputies, bills, votes, committees, parties, and more.**

*[English](#english) | [Português](#português)*

---

## English

### What is this?

`mcp-camara` is a **Model Context Protocol server** that bridges any MCP-compatible AI assistant to the [Brazilian Chamber of Deputies (Câmara dos Deputados) open data API](https://dadosabertos.camara.leg.br/). Once configured, your AI assistant can answer natural language questions about Brazilian federal legislation in real time — no API keys, no extra accounts, no cost.

Ask things like:
- *"Show me all bills about tax reform from 2024"*
- *"What were the recent expenses of deputy 220593?"*
- *"How did each party vote on PEC 45/2019?"*
- *"List the committees that deputy Maria Santos is a member of"*

The server handles authentication, caching, rate limiting, and data formatting automatically.

---

### Quick Install

```bash
npx @aredes.me/mcp-camara
```

Or install globally:

```bash
npm install -g @aredes.me/mcp-camara
```

**Via Smithery (one-click install for Claude Desktop):**

```bash
npx -y @smithery/cli install @aredes.me/mcp-camara --client claude
```

---

### Configuration

#### Claude Desktop

Add to `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS):

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

Restart Claude Desktop, then ask: *"List 5 deputies from São Paulo"* to verify.

#### Cursor IDE

In your Cursor MCP settings:

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

#### Windsurf IDE

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

#### Continue.dev

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

#### Cloudflare Workers (remote/production)

Deploy a globally distributed instance and point any MCP client to the SSE endpoint:

```
https://mcp-camara.cristianoaredes.workers.dev/sse
```

---

### 62 Available Tools

#### Deputies — 15 tools

| Tool | Description |
|---|---|
| `deputados_listar` | List deputies with filters: name, party, state (UF), legislature |
| `deputados_obter` | Full deputy profile: biography, contact, current status |
| `deputados_despesas` | Expenses and reimbursements with itemized breakdown |
| `deputados_discursos` | Floor speeches and parliamentary interventions |
| `deputados_eventos` | Event participation and attendance records |
| `deputados_frentes` | Parliamentary fronts and caucus memberships |
| `deputados_orgaos` | Committees and legislative bodies the deputy participates in |
| `deputados_profissoes` | Declared professions |
| `deputados_ocupacoes` | Professional occupations |
| `deputados_historico` | Legislative history and past mandates |
| `deputados_foto` | Official photograph URL |
| `deputados_mesa` | Positions held on the Board of Directors |
| `deputados_liderancas` | Leadership positions |
| `deputados_cargos` | Current and past roles |
| `deputados_votacoes` | Individual voting record |

#### Propositions (Bills, Amendments) — 10 tools

| Tool | Description |
|---|---|
| `proposicoes_listar` | Search bills with filters: type (PL, PEC, etc.), year, author, status |
| `proposicoes_obter` | Full proposition details including integral text and current status |
| `proposicoes_autores` | Authors and co-authors |
| `proposicoes_relacionadas` | Related propositions and dependencies |
| `proposicoes_votacoes` | All votes cast on a proposition |
| `proposicoes_tramitacoes` | Full processing history and current legislative stage |
| `proposicoes_temas` | Thematic classification |
| `proposicoes_arquivos` | Attached documents and files |
| `proposicoes_referencias` | Legal references and citations |
| `proposicoes_tipos` | Reference list of all legislative proposal types |

#### Voting Sessions — 4 tools

| Tool | Description |
|---|---|
| `votacoes_listar` | List voting sessions with date and proposition filters |
| `votacoes_obter` | Detailed results: approval status, vote counts |
| `votacoes_votos` | Individual deputy votes: yes, no, abstention, absence |
| `votacoes_orientacoes` | Party leadership voting recommendations (orientações de bancada) |

#### Committees (Órgãos) — 5 tools

| Tool | Description |
|---|---|
| `orgaos_listar` | List all committees, commissions, and legislative bodies |
| `orgaos_obter` | Committee details: jurisdiction and composition |
| `orgaos_membros` | Current and historical membership |
| `orgaos_eventos` | Committee meetings, hearings, and sessions |
| `orgaos_votacoes` | Votes held in committee |

#### Political Parties — 6 tools

| Tool | Description |
|---|---|
| `partidos_listar` | List all registered political parties |
| `partidos_obter` | Party details: ideology, leadership, history |
| `partidos_membros` | Current members and affiliations |
| `blocos_listar` | List parliamentary blocs and coalitions |
| `blocos_obter` | Bloc composition and member parties |
| `partidos_liderancas` | Party leadership positions |

#### Legislative Events — 7 tools

| Tool | Description |
|---|---|
| `eventos_listar` | List all legislative events with date and type filters |
| `eventos_obter` | Event details: location, participants, schedule |
| `eventos_orgaos` | Events organized by a specific committee or body |
| `eventos_deputados` | Events with a specific deputy's participation |
| `eventos_pauta` | Event agenda and discussion items |
| `eventos_situacoes` | Reference: event status codes (scheduled, ongoing, completed, cancelled) |
| `eventos_tipos` | Reference: types of legislative events |

#### Reference Data — 15 tools

| Tool | Description |
|---|---|
| `referencias_legislaturas` | All legislatures with date ranges |
| `referencias_situacoes_deputado` | Deputy status codes (active, licensed, etc.) |
| `referencias_situacoes_evento` | Event status classifications |
| `referencias_situacoes_proposicao` | Proposition status codes |
| `referencias_tipos_proposicao` | Legislative proposal types (PL, PEC, MPV, etc.) |
| `referencias_tipos_orgao` | Types of legislative bodies |
| `referencias_tipos_evento` | Event type classifications |
| `referencias_tipos_votacao` | Voting types and procedures |
| `referencias_escolaridades` | Education levels |
| `referencias_ufs` | Brazilian states and territories |
| `referencias_municipios` | Municipalities by state |
| `referencias_situacoes_orgao` | Committee status codes |
| `referencias_situacoes_membro` | Membership status codes |
| `referencias_cargos_orgao` | Committee position types |
| `referencias_tipos_lideranca` | Leadership position types |

---

### Requirements

- Node.js >= 18.0.0
- Any MCP-compatible AI client (Claude Desktop, Cursor, Windsurf, Continue.dev, etc.)
- No API keys required — the Câmara API is free and open

---

### Configuration Reference

All settings are optional and have sensible defaults:

```bash
# Transport mode: stdio (default), http, or sse
MCP_TRANSPORT=stdio

# Port for http/sse mode
MCP_HTTP_PORT=3000

# Câmara API endpoint (default shown)
CAMARA_API_BASE_URL=https://dadosabertos.camara.leg.br/api/v2

# Cache: time-to-live in seconds (default: 3600)
MCP_CACHE_TTL=3600
MCP_DISABLE_CACHE=false

# Rate limiting
MCP_DISABLE_RATE_LIMIT=false

# Logging: DEBUG, INFO, WARN, ERROR (default: INFO)
LOG_LEVEL=INFO
```

---

### Cloudflare Workers Deployment

Deploy as a globally distributed, serverless MCP server:

```bash
# 1. Install dependencies
npm install

# 2. Build
npm run build

# 3. Create KV namespaces (once)
npm run workers:kv:create

# 4. Deploy to production
npm run workers:deploy:prod
```

Workers features: REST API endpoints, LRU cache with configurable TTL, KV-backed rate limiting, optional API key auth for REST endpoints, auto-generated OpenAPI spec at `/openapi.json`.

---

### Development Setup

```bash
git clone https://github.com/cristianoaredes/mcp-camara.git
cd mcp-camara
npm install
npm run build
npm test
```

Run in HTTP mode for local testing:

```bash
MCP_TRANSPORT=http MCP_HTTP_PORT=3000 node build/lib/bin/mcp-camara.js
```

Then:

```bash
# Health check
curl -i http://localhost:3000/health

# List all tools
curl http://localhost:3000/mcp -X POST -H "Content-Type: application/json" \
  -d '{"jsonrpc": "2.0", "id": 1, "method": "tools/list"}'

# Call a tool
curl http://localhost:3000/mcp -X POST -H "Content-Type: application/json" \
  -d '{"jsonrpc": "2.0", "id": 1, "method": "tools/call", "params": {"name": "proposicoes_listar", "arguments": {"siglaTipo": "PL", "ano": 2024}}}'
```

---

### Use Cases

- **Legislative tracking** — follow bills (PLs, PECs, MPVs) from introduction to final vote
- **Deputy research** — investigate voting records, expenses, speeches, and committee activity
- **Data journalism** — extract structured legislative data for investigative reporting
- **Academic research** — analyze voting patterns, party cohesion, and legislative behavior
- **Civic transparency tools** — monitor deputy expenses and parliamentary activity
- **Civic chatbots** — build AI assistants that answer questions about Brazilian legislation

---

### Documentation

| Guide | Description |
|---|---|
| [Configuration Guide](./docs/CONFIGURATION.md) | Environment variables and all settings |
| [Usage Examples](./docs/USAGE_EXAMPLES.md) | Practical examples for each tool category |
| [API Documentation](./docs/API.md) | Complete tool reference |
| [Cloudflare Deployment](./docs/CLOUDFLARE_DEPLOYMENT.md) | Step-by-step Workers deployment |
| [HTTP Transport](./docs/HTTP_TRANSPORT.md) | HTTP server documentation |
| [SSE Transport](./docs/SSE_TRANSPORT.md) | Server-Sent Events transport |
| [Troubleshooting](./docs/TROUBLESHOOTING.md) | Common issues and solutions |

---

### License

MIT — see [LICENSE](./LICENSE).

Data is provided by the [Brazilian Chamber of Deputies Open Data API](https://dadosabertos.camara.leg.br/), which is free and public.

Built on [Model Context Protocol](https://modelcontextprotocol.io) by Anthropic.

---

### Author

By [Cristiano Arêdes](https://github.com/cristianoaredes)

---

## Português

### O que é isso?

`mcp-camara` é um **servidor Model Context Protocol (MCP)** que conecta qualquer assistente de IA compatível com MCP à [API de Dados Abertos da Câmara dos Deputados](https://dadosabertos.camara.leg.br/). Com ele configurado, seu assistente de IA responde perguntas em linguagem natural sobre legislação federal brasileira em tempo real — sem chaves de API, sem cadastros, sem custo.

Exemplos de perguntas:
- *"Mostre todos os projetos de lei sobre reforma tributária de 2024"*
- *"Quais foram as despesas recentes do deputado 220593?"*
- *"Como cada partido votou na PEC 45/2019?"*
- *"Liste as comissões de que a deputada Maria Santos faz parte"*

O servidor cuida de cache, rate limiting e formatação dos dados automaticamente.

---

### Instalação Rápida

```bash
npx @aredes.me/mcp-camara
```

Ou instale globalmente:

```bash
npm install -g @aredes.me/mcp-camara
```

**Via Smithery (instalação em 1 clique para Claude Desktop):**

```bash
npx -y @smithery/cli install @aredes.me/mcp-camara --client claude
```

---

### Configuração

#### Claude Desktop

Edite `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS):

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

Reinicie o Claude Desktop e teste: *"Liste 5 deputados de São Paulo"*.

#### Cursor, Windsurf, Continue.dev

A configuração JSON é a mesma — apenas adapte ao campo `mcpServers` de cada IDE.

---

### Requisitos

- Node.js >= 18.0.0
- Qualquer cliente MCP (Claude Desktop, Cursor, Windsurf, Continue.dev, etc.)
- Sem necessidade de chave de API — a API da Câmara é gratuita e pública

---

### Licença

MIT — veja [LICENSE](./LICENSE).

Dados fornecidos pela [API de Dados Abertos da Câmara dos Deputados](https://dadosabertos.camara.leg.br/).

---

### Autor

Por [Cristiano Arêdes](https://github.com/cristianoaredes)
