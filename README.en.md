# MCP Câmara dos Deputados 🇧🇷

[![npm version](https://img.shields.io/npm/v/@aredes.me/mcp-camara.svg)](https://www.npmjs.com/package/@aredes.me/mcp-camara)
[![npm downloads](https://img.shields.io/npm/dm/@aredes.me/mcp-camara.svg)](https://www.npmjs.com/package/@aredes.me/mcp-camara)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue.svg)](https://www.typescriptlang.org/)
[![Cloudflare Workers](https://img.shields.io/badge/Cloudflare-Workers-orange.svg)](https://workers.cloudflare.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

> **🏛️ Model Context Protocol (MCP) server for Brazilian Chamber of Deputies Open Data** — Bring comprehensive legislative information directly into Claude Desktop, Cursor, Windsurf, Continue.dev and other AI assistants.

> **🚀 Multi-platform deployment: NPM package, Cloudflare Workers, Smithery.**

*[English](#english) | [Português](./README.md)*

---

## English

🤖 **Model Context Protocol server for Brazilian Chamber of Deputies Open Data.** Access comprehensive legislative information including deputies, bills, votes, committees, parties, and events directly in Claude Desktop, Cursor, Windsurf, Continue.dev and any MCP-compatible assistant.

## ✨ Features

- **🏛️ 62 Tools** across 7 categories for comprehensive legislative data access
- **🚀 Multiple Transports:** STDIO, HTTP, and SSE support for maximum flexibility
- **💾 Smart Caching:** Configurable LRU cache with TTL to reduce API calls
- **🔒 Rate Limiting:** Built-in protection against API abuse
- **☁️ Cloudflare Workers:** Deploy as a globally distributed, scalable API
- **🔍 Type Safe:** Full TypeScript implementation with strict typing
- **✅ Validated Inputs:** Zod-based schema validation for all tools
- **📖 OpenAPI Spec:** Auto-generated API documentation
- **🌐 REST API:** Direct HTTP access to all endpoints
- **🔄 Real-time SSE:** Server-Sent Events for streaming connections
- **📊 Comprehensive Testing:** 388 tests covering all functionality

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

## 🎯 How It Works

The MCP Câmara server acts as a bridge between AI assistants and the Brazilian Chamber of Deputies Open Data API:

```
┌─────────────────┐         ┌──────────────┐         ┌─────────────────┐
│   AI Assistant  │ ◄─MCP──►│  MCP Server  │ ◄─HTTP─►│  Câmara API     │
│ (Claude/Cursor) │         │  (This Tool) │         │ (Open Data)     │
└─────────────────┘         └──────────────┘         └─────────────────┘
```

**What you can do:**
- Ask natural language questions about Brazilian legislation
- Get real-time data about deputies, bills, and votes
- Analyze voting patterns and legislative activity
- Track expenses and parliamentary activities
- Research political parties and committees

**Example queries:**
- "Show me all bills about education from 2024"
- "What are the recent expenses of deputy João Silva?"
- "List all votes on environmental legislation"
- "Which committees is deputy Maria Santos part of?"

## 🛠️ Available Tools

### 👥 Deputies (15 tools)

Get comprehensive information about Brazilian federal deputies:

- 🔍 **`deputados_listar`** — List deputies with filters (name, party, state, legislature)
- 📋 **`deputados_obter`** — Complete deputy details including biography and contact
- 💰 **`deputados_despesas`** — Expenses and reimbursements with detailed breakdown
- 🎤 **`deputados_discursos`** — Floor speeches and parliamentary interventions
- 📅 **`deputados_eventos`** — Event participation and attendance records
- 📊 **`deputados_frentes`** — Parliamentary fronts and caucuses membership
- 🏛️ **`deputados_orgaos`** — Bodies and committees participation
- 📜 **`deputados_profissoes`** — List of professions declared by deputies
- 📄 **`deputados_ocupacoes`** — Professional occupations
- 🎓 **`deputados_historico`** — Legislative history and mandates
- 📸 **`deputados_foto`** — Official photograph URL
- 🗳️ **`deputados_mesa`** — Board positions held
- 📋 **`deputados_liderancas`** — Leadership positions
- 🏅 **`deputados_cargos`** — Current and past positions
- 📊 **`deputados_votacoes`** — Voting record and positions

### 📜 Propositions (10 tools)

Access legislative proposals, bills, and amendments:

- 🔍 **`proposicoes_listar`** — List propositions with advanced filters (type, year, author, status)
- 📋 **`proposicoes_obter`** — Complete proposition details including full text and status
- 👥 **`proposicoes_autores`** — Authors and co-authors of propositions
- 📄 **`proposicoes_relacionadas`** — Related propositions and dependencies
- 🗳️ **`proposicoes_votacoes`** — All votes on a proposition
- 📝 **`proposicoes_tramitacoes`** — Processing history and current status
- 🏛️ **`proposicoes_temas`** — Thematic classification
- 📎 **`proposicoes_arquivos`** — Attached documents and files
- 🔗 **`proposicoes_referencias`** — Legal references and citations
- 📊 **`proposicoes_tipos`** — Types of legislative proposals

### 🗳️ Votings (4 tools)

Track voting sessions and results:

- 🔍 **`votacoes_listar`** — List all voting sessions with filters by date and proposition
- 📋 **`votacoes_obter`** — Detailed voting results including approval status
- 👥 **`votacoes_votos`** — Individual deputy votes (yes, no, abstention, absence)
- 📊 **`votacoes_orientacoes`** — Party leadership voting recommendations

### 🏛️ Committees (5 tools)

Monitor legislative committees and working groups:

- �  **`orgaos_listar`** — List all committees, commissions, and legislative bodies
- � **`oorgaos_obter`** — Committee details including jurisdiction and composition
- 👥 **`orgaos_membros`** — Current and historical committee membership
- 📅 **`orgaos_eventos`** — Committee meetings, hearings, and sessions
- 🗳️ **`orgaos_votacoes`** — Votes held in committee sessions

### 🎯 Parties (6 tools)

Analyze political parties and parliamentary blocs:

- 🔍 **`partidos_listar`** — List all registered political parties
- 📋 **`partidos_obter`** — Party details including ideology and leadership
- 👥 **`partidos_membros`** — Current party members and affiliations
- 🤝 **`blocos_listar`** — List parliamentary blocs and coalitions
- 📋 **`blocos_obter`** — Bloc composition and member parties
- 🏛️ **`partidos_liderancas`** — Party leadership positions

### 📅 Events (7 tools)

Track legislative calendar and activities:

- � **``eventos_listar`** — List all legislative events with date and type filters
- �  **`eventos_obter`** — Detailed event information including location and participants
- 🏛️ **`eventos_orgaos`** — Events organized by specific committees or bodies
- 👥 **`eventos_deputados`** — Events with specific deputy participation
- 📜 **`eventos_pauta`** — Event agenda and discussion items
- 📝 **`eventos_situacoes`** — Event status (scheduled, ongoing, completed, cancelled)
- 🎯 **`eventos_tipos`** — Types of legislative events

### 📚 Reference Data (15 tools)

Access lookup tables and classification systems:

- 🏛️ **`referencias_legislaturas`** — List all legislatures with date ranges
- 🎯 **`referencias_situacoes_deputado`** — Deputy status codes (active, licensed, etc.)
- 📊 **`referencias_situacoes_evento`** — Event status classifications
- 🗳️ **`referencias_situacoes_proposicao`** — Proposition status codes
- 📋 **`referencias_tipos_proposicao`** — Types of legislative proposals (PL, PEC, etc.)
- 🏛️ **`referencias_tipos_orgao`** — Types of legislative bodies
- 📅 **`referencias_tipos_evento`** — Event type classifications
- 🗳️ **`referencias_tipos_votacao`** — Voting types and procedures
- 🎓 **`referencias_escolaridades`** — Education levels
- 🌍 **`referencias_ufs`** — Brazilian states and territories
- 🏙️ **`referencias_municipios`** — Municipalities by state
- 📊 **`referencias_situacoes_orgao`** — Committee status codes
- 🎯 **`referencias_situacoes_membro`** — Membership status codes
- 📜 **`referencias_cargos_orgao`** — Committee position types
- 🏅 **`referencias_tipos_lideranca`** — Leadership position types

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

### Hosting Options

**Cloudflare Workers:** Deploy as a globally distributed API (serverless)

**VPS/Cloud Server:** Host on dedicated server for full control

#### Cloudflare Workers (Serverless)

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

#### VPS/Cloud Server

For deployment on VPS (native Node.js):

```bash
# Clone the repository
git clone https://github.com/cristianoaredes/mcp-camara.git
cd mcp-camara

# Install dependencies
npm install

# Build
npm run build

# Configure environment variables
export MCP_TRANSPORT=http
export MCP_HTTP_PORT=3000

# Run the server
node build/lib/bin/mcp-camara.js
```

**Recommended VPS options:**
- 🚀 [Hostinger VPS KVM](https://www.hostinger.com.br/cart?product=vps%3Avps_kvm_2&period=12&referral_type=cart_link&REFERRALCODE=FQLCRISTIRC3&referral_id=019a73b2-a3cd-72b8-8141-76eb55275046) - Starting at 2 vCPU, 4GB RAM
- ☁️ AWS EC2, Google Cloud, Azure
- 🐳 DigitalOcean Droplets
- 📦 Oracle Cloud (free tier available)

**Setup with PM2 (recommended):**

```bash
# Install PM2
npm install -g pm2

# Start with PM2
MCP_TRANSPORT=http MCP_HTTP_PORT=3000 pm2 start build/lib/bin/mcp-camara.js --name mcp-camara

# Configure to start on boot
pm2 startup
pm2 save
```

## 📚 Documentation

- **[Configuration Guide](./docs/CONFIGURATION.md)** — Environment variables and settings
- **[Usage Examples](./docs/USAGE_EXAMPLES.md)** — Practical examples and use cases
- **[API Documentation](./docs/API.md)** — Complete tool reference
- **[Cloudflare Deployment](./docs/CLOUDFLARE_DEPLOYMENT.md)** — Deployment guide
- **[HTTP Transport](./docs/HTTP_TRANSPORT.md)** — HTTP server documentation
- **[SSE Transport](./docs/SSE_TRANSPORT.md)** — Server-Sent Events
- **[Troubleshooting](./docs/TROUBLESHOOTING.md)** — Common issues and solutions

## 💼 Use Cases

- **📊 Legislative Analysis** — Track bills, votes, and parliamentary activity in real-time
- **🔍 Political Research** — Investigate deputy and party history with comprehensive data
- **📰 Data Journalism** — Extract data for investigative reporting and fact-checking
- **🎓 Academic Research** — Analyze legislative behavior, voting patterns, and political dynamics
- **👥 Public Transparency** — Monitor deputy expenses, activities, and accountability
- **🤖 Civic Chatbots** — Build AI assistants for legislative information and civic engagement
- **📱 Mobile Apps** — Integrate legislative data into mobile applications
- **📈 Analytics Dashboards** — Create visualizations and reports on parliamentary activity
- **🔔 Monitoring Systems** — Set up alerts for specific bills, votes, or deputy activities
- **🎯 Advocacy Tools** — Track legislation relevant to specific causes or organizations

## 🔧 Configuration

The server can be configured via environment variables:

```bash
# Transport mode (stdio, http, sse)
MCP_TRANSPORT=stdio

# HTTP/SSE server port
MCP_HTTP_PORT=3000

# Câmara API base URL
CAMARA_API_BASE_URL=https://dadosabertos.camara.leg.br/api/v2

# Cache settings
MCP_CACHE_TTL=3600          # Cache TTL in seconds
MCP_DISABLE_CACHE=false     # Disable caching

# Rate limiting
MCP_DISABLE_RATE_LIMIT=false

# Logging
LOG_LEVEL=INFO              # DEBUG, INFO, WARN, ERROR
```

See [Configuration Guide](./docs/CONFIGURATION.md) for complete details.

## 🛠️ Development

### Prerequisites

- Node.js >= 18.0.0
- npm or yarn
- TypeScript 5.7+

### Setup

```bash
# Clone the repository
git clone https://github.com/cristianoaredes/mcp-camara.git
cd mcp-camara

# Install dependencies
npm install

# Build the project
npm run build

# Run tests
npm test

# Run in development mode
npm run dev
```

### Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run specific test file
npm test -- deputy-tools.test.ts
```

### Local Development with Cloudflare Workers

```bash
# Start local Workers development server
npm run workers:dev

# View logs
npm run workers:tail
```

## 🤝 Contributing

Contributions are welcome! We appreciate:

- 🐛 Bug reports and fixes
- ✨ New features and tools
- 📖 Documentation improvements
- 🧪 Test coverage enhancements
- 🌍 Translations and internationalization

### How to Contribute

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Run tests (`npm test`)
5. Commit your changes (`git commit -m 'feat: add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

Please read [CONTRIBUTING.md](./CONTRIBUTING.md) for detailed guidelines.

## ❓ FAQ

### How do I get started?

Install the package globally or use npx, then configure your AI assistant with the MCP server. See the [Quick Install](#-quick-install) section.

### Is this free to use?

Yes! The package is MIT licensed and the Câmara API is free and open. No API keys required.

### What AI assistants are supported?

Any MCP-compatible assistant including Claude Desktop, Cursor, Windsurf, Continue.dev, and ChatGPT (via Cloudflare Workers).

### Can I use this in production?

Yes! Deploy to Cloudflare Workers for a production-ready, globally distributed API with caching and rate limiting.

### How often is the data updated?

Data comes directly from the Câmara API in real-time. The server includes smart caching to balance freshness with performance.

### Can I contribute new tools?

Absolutely! We welcome contributions. Check the [Contributing](#-contributing) section and open an issue to discuss your ideas.

### Is there a rate limit?

The Câmara API has rate limits. This server includes built-in rate limiting and caching to help stay within limits. When deployed to Cloudflare Workers, you can configure custom rate limits.

### How do I report bugs?

Open an issue on [GitHub](https://github.com/cristianoaredes/mcp-camara/issues) with details about the bug, steps to reproduce, and your environment.

### Can I use this for commercial projects?

Yes! The MIT license allows commercial use. Please review the [LICENSE](./LICENSE) file for details.

## 🔗 Related Projects

- [MCP DadosBR](https://github.com/cristianoaredes/mcp-dadosbr) - MCP server for Brazilian company (CNPJ) and postal code (CEP) data
- [Model Context Protocol](https://modelcontextprotocol.io) - Official MCP documentation
- [Câmara Open Data](https://dadosabertos.camara.leg.br/) - Official API documentation

## 📄 License & Credits

- **License:** MIT License — [LICENSE](./LICENSE)
- **Data Source:** [Brazilian Chamber of Deputies Open Data API](https://dadosabertos.camara.leg.br/)
- **Protocol:** Based on [Model Context Protocol](https://modelcontextprotocol.io) by Anthropic
- **Inspiration:** [MCP DadosBR](https://github.com/cristianoaredes/mcp-dadosbr)

## 👨‍💻 Author

<table>
  <tr>
    <td align="center">
      <a href="https://github.com/cristianoaredes">
        <img src="https://github.com/cristianoaredes.png?size=100" width="100px;" alt="Cristiano Aredes"/>
        <br />
        <sub><b>Cristiano Aredes</b></sub>
      </a>
      <br />
      <a href="https://www.linkedin.com/in/cristianoaredes/">LinkedIn</a> · 
      <a href="mailto:cristiano@aredes.me">Email</a> · 
      <a href="https://github.com/cristianoaredes">GitHub</a>
    </td>
  </tr>
</table>

## 💬 Support

- **📖 Documentation:** [docs/](./docs/)
- **🐛 Issues:** [GitHub Issues](https://github.com/cristianoaredes/mcp-camara/issues)
- **💡 Discussions:** [GitHub Discussions](https://github.com/cristianoaredes/mcp-camara/discussions)
- **📧 Email:** [cristiano@aredes.me](mailto:cristiano@aredes.me)

## ⭐ Show Your Support

If this project helped you, please consider:

- ⭐ Starring the repository
- 🐛 Reporting bugs and issues
- 💡 Suggesting new features
- 📖 Improving documentation
- 🔀 Contributing code
- 📢 Sharing with others

## 📊 Project Stats

![GitHub stars](https://img.shields.io/github/stars/cristianoaredes/mcp-camara?style=social)
![GitHub forks](https://img.shields.io/github/forks/cristianoaredes/mcp-camara?style=social)
![GitHub issues](https://img.shields.io/github/issues/cristianoaredes/mcp-camara)
![GitHub pull requests](https://img.shields.io/github/issues-pr/cristianoaredes/mcp-camara)
![GitHub last commit](https://img.shields.io/github/last-commit/cristianoaredes/mcp-camara)

---

<div align="center">

**Made with ❤️ for transparency and civic engagement 🇧🇷**

**[⬆ Back to Top](#mcp-câmara-dos-deputados-)**

</div>


