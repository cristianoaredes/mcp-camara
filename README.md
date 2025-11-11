# MCP Câmara dos Deputados 🇧🇷

[![npm version](https://img.shields.io/npm/v/@aredes.me/mcp-camara.svg)](https://www.npmjs.com/package/@aredes.me/mcp-camara)
[![npm downloads](https://img.shields.io/npm/dm/@aredes.me/mcp-camara.svg)](https://www.npmjs.com/package/@aredes.me/mcp-camara)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue.svg)](https://www.typescriptlang.org/)
[![Cloudflare Workers](https://img.shields.io/badge/Cloudflare-Workers-orange.svg)](https://workers.cloudflare.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

> **🏛️ Servidor Model Context Protocol (MCP) para acesso aos Dados Abertos da Câmara dos Deputados do Brasil** — Integre informações legislativas completas diretamente em Claude Desktop, Cursor, Windsurf, Continue.dev e outros assistentes de IA.

> **🚀 Implantação multiplataforma: Pacote NPM, Cloudflare Workers, Smithery.**

*[Português](#português) | [English](./README.en.md)*

---

## Português

🇧🇷 **Servidor MCP para consulta de dados legislativos da Câmara dos Deputados do Brasil.** Acesse informações sobre deputados, proposições, votações, comissões, partidos e eventos legislativos em minutos através de Claude Desktop, Cursor, Windsurf, Continue.dev e qualquer cliente compatível com MCP.

## ⚡ Instalação Rápida

```bash
npm install -g @aredes.me/mcp-camara
```

Ou execute diretamente com NPX:

```bash
npx @aredes.me/mcp-camara
```

### Via Smithery (1 clique)

```bash
npx -y @smithery/cli install @aredes.me/mcp-camara --client claude
```

## 🔌 Configuração por IDE / Cliente MCP

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

**Localização:** `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS)

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

Para usar com ChatGPT, configure o servidor Cloudflare Workers como endpoint remoto:

1. **Deploy no Cloudflare Workers:** `npm run workers:deploy:prod`
2. **Configure no ChatGPT:**
   - URL do servidor: `https://mcp-camara.your-subdomain.workers.dev`
   - O ChatGPT detectará automaticamente os endpoints OAuth e MCP
3. **Configure API Key** (opcional, via environment variables no Workers)

**APIs REST disponíveis:**
- `GET /deputados/{id}` - Consulta dados de deputado
- `GET /proposicoes/{id}` - Consulta dados de proposição
- `GET /votacoes/{id}` - Consulta dados de votação
- `GET /eventos/{id}` - Consulta dados de evento

**✅ Teste rápido:**
```
Pode buscar informações sobre o deputado com ID 220593?
```

## 🛠️ Ferramentas Disponíveis

### 👥 Deputados (15 ferramentas)

Obtenha informações completas sobre deputados federais brasileiros:

- 🔍 **`deputados_listar`** — Lista deputados com filtros (nome, partido, UF, legislatura)
- 📋 **`deputados_obter`** — Detalhes completos incluindo biografia e contato
- 💰 **`deputados_despesas`** — Despesas e reembolsos com detalhamento completo
- 🎤 **`deputados_discursos`** — Discursos em plenário e intervenções parlamentares
- 📅 **`deputados_eventos`** — Participação em eventos e registros de presença
- 📊 **`deputados_frentes`** — Frentes parlamentares e bancadas temáticas
- 🏛️ **`deputados_orgaos`** — Participação em órgãos e comissões
- 📜 **`deputados_profissoes`** — Lista de profissões declaradas por deputados
- 📄 **`deputados_ocupacoes`** — Ocupações profissionais
- 🎓 **`deputados_historico`** — Histórico legislativo e mandatos
- 📸 **`deputados_foto`** — URL da fotografia oficial
- 🗳️ **`deputados_mesa`** — Cargos ocupados na Mesa Diretora
- 📋 **`deputados_liderancas`** — Posições de liderança
- 🏅 **`deputados_cargos`** — Cargos atuais e anteriores
- 📊 **`deputados_votacoes`** — Registro de votações e posicionamentos

### 📜 Proposições (10 ferramentas)

Acesse propostas legislativas, projetos de lei e emendas:

- 🔍 **`proposicoes_listar`** — Lista proposições com filtros avançados (tipo, ano, autor, situação)
- 📋 **`proposicoes_obter`** — Detalhes completos incluindo texto integral e situação
- 👥 **`proposicoes_autores`** — Autores e coautores de proposições
- 📄 **`proposicoes_relacionadas`** — Proposições relacionadas e dependências
- 🗳️ **`proposicoes_votacoes`** — Todas as votações de uma proposição
- 📝 **`proposicoes_tramitacoes`** — Histórico de tramitação e situação atual
- 🏛️ **`proposicoes_temas`** — Classificação temática
- 📎 **`proposicoes_arquivos`** — Documentos e arquivos anexados
- 🔗 **`proposicoes_referencias`** — Referências legais e citações
- 📊 **`proposicoes_tipos`** — Tipos de propostas legislativas

### 🗳️ Votações (4 ferramentas)
- 🔍 **`votacoes_listar`** — Lista votações
- 📋 **`votacoes_obter`** — Detalhes de uma votação
- 👥 **`votacoes_votos`** — Votos individuais
- 📊 **`votacoes_orientacoes`** — Orientações de bancadas

### 🏛️ Comissões (5 ferramentas)
- 🔍 **`orgaos_listar`** — Lista comissões e órgãos
- 📋 **`orgaos_obter`** — Detalhes de uma comissão
- 👥 **`orgaos_membros`** — Membros da comissão
- 📅 **`orgaos_eventos`** — Eventos da comissão
- 🗳️ **`orgaos_votacoes`** — Votações da comissão

### 🎯 Partidos (6 ferramentas)

Analise partidos políticos e blocos parlamentares:

- 🔍 **`partidos_listar`** — Lista todos os partidos políticos registrados
- 📋 **`partidos_obter`** — Detalhes do partido incluindo ideologia e liderança
- 👥 **`partidos_membros`** — Membros atuais e filiações partidárias
- 🤝 **`blocos_listar`** — Lista blocos parlamentares e coligações
- 📋 **`blocos_obter`** — Composição e partidos membros do bloco
- 🏛️ **`partidos_liderancas`** — Posições de liderança partidária

### 📅 Eventos (7 ferramentas)

Acompanhe o calendário e atividades legislativas:

- 🔍 **`eventos_listar`** — Lista todos os eventos legislativos com filtros de data e tipo
- 📋 **`eventos_obter`** — Informações detalhadas incluindo local e participantes
- 🏛️ **`eventos_orgaos`** — Eventos organizados por comissões ou órgãos específicos
- 👥 **`eventos_deputados`** — Eventos com participação de deputado específico
- 📜 **`eventos_pauta`** — Pauta e itens de discussão do evento
- 📝 **`eventos_situacoes`** — Situação do evento (agendado, em andamento, concluído, cancelado)
- 🎯 **`eventos_tipos`** — Tipos de eventos legislativos

### 📚 Dados de Referência (15 ferramentas)

Acesse tabelas de referência e sistemas de classificação:

- 🏛️ **`referencias_legislaturas`** — Lista todas as legislaturas com períodos
- 🎯 **`referencias_situacoes_deputado`** — Códigos de situação de deputados (ativo, licenciado, etc.)
- 📊 **`referencias_situacoes_evento`** — Classificações de situação de eventos
- 🗳️ **`referencias_situacoes_proposicao`** — Códigos de situação de proposições
- 📋 **`referencias_tipos_proposicao`** — Tipos de propostas legislativas (PL, PEC, etc.)
- 🏛️ **`referencias_tipos_orgao`** — Tipos de órgãos legislativos
- 📅 **`referencias_tipos_evento`** — Classificações de tipos de eventos
- 🗳️ **`referencias_tipos_votacao`** — Tipos e procedimentos de votação
- 🎓 **`referencias_escolaridades`** — Níveis de escolaridade
- 🌍 **`referencias_ufs`** — Estados e territórios brasileiros
- 🏙️ **`referencias_municipios`** — Municípios por estado
- 📊 **`referencias_situacoes_orgao`** — Códigos de situação de comissões
- 🎯 **`referencias_situacoes_membro`** — Códigos de situação de membros
- 📜 **`referencias_cargos_orgao`** — Tipos de cargos em comissões
- 🏅 **`referencias_tipos_lideranca`** — Tipos de posições de liderança

## 🧪 Testes em Linha de Comando

### Servidor HTTP + SSE local

```bash
npm run build
MCP_TRANSPORT=http MCP_HTTP_PORT=3000 node build/lib/bin/mcp-camara.js
```

Em outro terminal:

```bash
# Listar ferramentas
curl http://localhost:3000/mcp -X POST -H "Content-Type: application/json" \
  -d '{"jsonrpc": "2.0", "id": 1, "method": "tools/list"}'

# Buscar deputado
curl http://localhost:3000/deputados/220593

# Listar proposições
curl http://localhost:3000/mcp -X POST -H "Content-Type: application/json" \
  -d '{"jsonrpc": "2.0", "id": 1, "method": "tools/call", "params": {"name": "proposicoes_listar", "arguments": {"siglaTipo": "PL", "ano": 2024}}}'
```

### Health check rápido

```bash
curl -i http://localhost:3000/health
```

## 🌐 Deploy Web (Opcional)

### Opções de Hospedagem

**Cloudflare Workers:** Implante como API globalmente distribuída (serverless)

**VPS/Cloud Server:** Hospede em servidor dedicado para controle total

#### Cloudflare Workers (Serverless)

```bash
# 1. Instalar dependências
npm install

# 2. Build do projeto
npm run build

# 3. Criar namespaces KV
npm run workers:kv:create

# 4. Deploy para desenvolvimento
npm run workers:deploy:dev

# 5. Deploy para produção
npm run workers:deploy:prod
```

**Recursos do Workers:**
- 🔗 **REST API:** `/deputados/{id}` · `/proposicoes/{id}` · `/votacoes/{id}` · `/eventos/{id}`
- 🤖 **OpenAPI:** `/openapi.json`
- 📊 **Health:** `/health`
- 🔐 **API Key Authentication:** Protegido contra abuso (opcional)
- ⚡ **Rate Limiting:** Configurável via KV
- 💾 **Cache:** LRU cache com TTL configurável

**Smithery:** `smithery.yaml` para deploy single-click.

### 🚀 Para ChatGPT MCP

```bash
# 1. Deploy no Cloudflare
npm run build
npm run workers:deploy:prod

# 2. Configure no ChatGPT:
# - Server URL: https://your-subdomain.workers.dev
# - O ChatGPT detectará automaticamente OAuth + MCP endpoints
```

### 🔒 Segurança (Cloudflare Workers)

**API Key Authentication:**
- **Protegidos:** Endpoints REST (`/deputados/*`, `/proposicoes/*`, `/votacoes/*`, `/eventos/*`)
- **Não protegidos:** Protocolo MCP (`/mcp`, `/sse`) - para compatibilidade com AI assistants

```bash
# Configure API key
wrangler secret put MCP_API_KEY

# Use via headers (apenas para endpoints REST):
curl -H "X-API-Key: your-key" https://your-worker.workers.dev/deputados/220593
# ou
curl -H "Authorization: Bearer your-key" https://your-worker.workers.dev/deputados/220593

# Endpoints MCP não precisam de autenticação:
curl -X POST https://your-worker.workers.dev/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc": "2.0", "id": 1, "method": "tools/list"}'
```

**Rate Limiting:**
- Configurável via environment variables
- KV-based para escalabilidade
- Desativável com `MCP_DISABLE_RATE_LIMIT=true`

#### VPS/Cloud Server

[![Deploy to Hostinger VPS](https://img.shields.io/badge/Deploy%20to-Hostinger%20VPS-673DE6?style=for-the-badge&logo=hostinger&logoColor=white)](https://www.hostinger.com.br/cart?product=vps%3Avps_kvm_2&period=12&referral_type=cart_link&REFERRALCODE=FQLCRISTIRC3&referral_id=019a73b2-a3cd-72b8-8141-76eb55275046)

Para deploy em servidor VPS (Node.js nativo):

```bash
# Clone o repositório
git clone https://github.com/cristianoaredes/mcp-camara.git
cd mcp-camara

# Instale dependências
npm install

# Build
npm run build

# Configure variáveis de ambiente
export MCP_TRANSPORT=http
export MCP_HTTP_PORT=3000

# Execute o servidor
node build/lib/bin/mcp-camara.js
```

**Opções de VPS recomendadas:**
- 🚀 [Hostinger VPS KVM](https://www.hostinger.com.br/cart?product=vps%3Avps_kvm_2&period=12&referral_type=cart_link&REFERRALCODE=FQLCRISTIRC3&referral_id=019a73b2-a3cd-72b8-8141-76eb55275046) - A partir de 2 vCPU, 4GB RAM
- ☁️ AWS EC2, Google Cloud, Azure
- 🐳 DigitalOcean Droplets
- 📦 Oracle Cloud (free tier disponível)

**Configuração com PM2 (recomendado):**

```bash
# Instalar PM2
npm install -g pm2

# Iniciar com PM2
MCP_TRANSPORT=http MCP_HTTP_PORT=3000 pm2 start build/lib/bin/mcp-camara.js --name mcp-camara

# Configurar para iniciar no boot
pm2 startup
pm2 save
```

## 📚 Documentação

- **[Guia de Configuração](./docs/CONFIGURATION.md)** — Variáveis de ambiente e configurações
- **[Exemplos de Uso](./docs/USAGE_EXAMPLES.md)** — Casos práticos e exemplos
- **[Documentação da API](./docs/API.md)** — Referência completa de ferramentas
- **[Deploy Cloudflare](./docs/CLOUDFLARE_DEPLOYMENT.md)** — Guia de implantação
- **[Transporte HTTP](./docs/HTTP_TRANSPORT.md)** — Documentação do servidor HTTP
- **[Transporte SSE](./docs/SSE_TRANSPORT.md)** — Server-Sent Events
- **[Solução de Problemas](./docs/TROUBLESHOOTING.md)** — Problemas comuns

## 💼 Casos de Uso

- **📊 Análise Legislativa** — Acompanhe proposições, votações e atividade parlamentar
- **🔍 Pesquisa Política** — Investigue histórico de deputados e partidos
- **📰 Jornalismo de Dados** — Extraia dados para reportagens investigativas
- **🎓 Pesquisa Acadêmica** — Analise comportamento legislativo e padrões de votação
- **👥 Transparência Pública** — Monitore gastos e atividades de deputados
- **🤖 Chatbots Cívicos** — Crie assistentes para informação legislativa

## 🤝 Contribuição

Contribuições são bem-vindas! Por favor, leia [CONTRIBUTING.md](./CONTRIBUTING.md) para detalhes sobre nosso código de conduta e processo de submissão de pull requests.

## 📄 Licença & Créditos

- MIT License — [LICENSE](./LICENSE)
- Dados fornecidos pela [API de Dados Abertos da Câmara dos Deputados](https://dadosabertos.camara.leg.br/)
- Baseado no [Model Context Protocol](https://modelcontextprotocol.io)

## 👨‍💻 Autor

| Cristiano Aredes |
|:---:|
| [![Cristiano Aredes](https://github.com/cristianoaredes.png?size=100)](https://github.com/cristianoaredes) |
| [LinkedIn](https://www.linkedin.com/in/cristianoaredes/) · [cristiano@aredes.me](mailto:cristiano@aredes.me) |

---

## English

🤖 **Model Context Protocol server for Brazilian Chamber of Deputies Open Data.** Access comprehensive legislative information including deputies, bills, votes, committees, parties, and events directly in Claude Desktop, Cursor, Windsurf, Continue.dev and any MCP-compatible assistant.

### ⚡ Quick Install

```bash
npm install -g @aredes.me/mcp-camara
```

Or via NPX:

```bash
npx @aredes.me/mcp-camara
```

### IDE Configuration

**Claude Desktop / Cursor / Windsurf:**
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

**Continue.dev:**
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

**Test prompt:**
```
Can you search for information about deputy with ID 220593?
```

### Key Features

- **🏛️ 62 Tools** across 7 categories for comprehensive legislative data access
- **🚀 Multiple Transports:** STDIO, HTTP, and SSE support
- **💾 Smart Caching:** Configurable caching with LRU eviction
- **🔒 Rate Limiting:** Built-in protection against API abuse
- **☁️ Cloudflare Workers:** Deploy as a globally distributed API
- **🔍 Type Safe:** Full TypeScript implementation with strict typing
- **✅ Validated Inputs:** Zod-based schema validation for all tools

### Tool Categories

- **👥 Deputies (15 tools):** Information about deputies, expenses, speeches, events
- **📜 Propositions (10 tools):** Legislative proposals, bills, amendments
- **🗳️ Votings (4 tools):** Voting records and results
- **🏛️ Committees (5 tools):** Legislative committees and their activities
- **🎯 Parties (6 tools):** Political parties and blocs
- **📅 Events (7 tools):** Legislative events, meetings, hearings
- **📚 Reference Data (15 tools):** Lookup tables and classifications

### Web Deployment

**Cloudflare Workers:** Deploy as a globally distributed, scalable API

```bash
# Install dependencies
npm install

# Build the project
npm run build

# Create KV namespaces
npm run workers:kv:create

# Deploy to production
npm run workers:deploy:prod
```

**Features:**
- 🔗 **REST API:** `/deputados/{id}` · `/proposicoes/{id}` · `/votacoes/{id}` · `/eventos/{id}`
- 🤖 **OpenAPI spec:** `/openapi.json`
- 📊 **Health check:** `/health`
- 🔐 **API Key Authentication:** Optional protection for REST endpoints
- ⚡ **Rate Limiting:** Configurable via KV storage
- 💾 **Caching:** LRU cache with configurable TTL

### Documentation & Support

- [Configuration Guide](./docs/CONFIGURATION.md) — Environment variables and settings
- [Usage Examples](./docs/USAGE_EXAMPLES.md) — Practical examples and use cases
- [API Documentation](./docs/API.md) — Complete tool reference
- [Cloudflare Deployment](./docs/CLOUDFLARE_DEPLOYMENT.md) — Deployment guide
- [Troubleshooting](./docs/TROUBLESHOOTING.md) — Common issues and solutions

### License

MIT License — see [LICENSE](./LICENSE). Data provided by [Brazilian Chamber of Deputies Open Data API](https://dadosabertos.camara.leg.br/).

---

**Made with ❤️ for transparency and civic engagement 🇧🇷**
