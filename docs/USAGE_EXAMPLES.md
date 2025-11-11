# Usage Examples

Practical examples and use cases for the MCP Câmara dos Deputados Server.

## Table of Contents

- [Getting Started](#getting-started)
- [Deputy Lookup](#deputy-lookup)
- [Bill Tracking](#bill-tracking)
- [Vote Analysis](#vote-analysis)
- [Committee Research](#committee-research)
- [Party Analysis](#party-analysis)
- [Event Monitoring](#event-monitoring)
- [Reference Data](#reference-data)
- [Advanced Use Cases](#advanced-use-cases)
- [Troubleshooting](#troubleshooting)

## Getting Started

### Basic Setup

First, ensure the MCP server is configured in your AI assistant. For Claude Desktop:

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

### Your First Query

Try this simple prompt to verify the server is working:

**Prompt**: "List 5 deputies from São Paulo"

The AI will use the `deputados_listar` tool with parameters:
```json
{
  "siglaUf": "SP",
  "itens": 5
}
```

## Deputy Lookup

### Find a Deputy by Name

**Prompt**: "Find information about deputy Eduardo Bolsonaro"

**Tools used**: `deputados_listar`, `deputado_detalhes`

**What happens**:
1. Searches for deputies with name matching "Eduardo Bolsonaro"
2. Gets detailed information including party, state, contact info
3. Returns current status and mandate information

**Example response**:
```
Deputy: Eduardo Nantes Bolsonaro
Party: PL (Partido Liberal)
State: SP (São Paulo)
Email: dep.eduardobolsonaro@camara.leg.br
Office: Anexo IV, Room 628
Current Status: Active
```

### Get Deputy Contact Information

**Prompt**: "What is the email and office location for deputy ID 204554?"

**Tools used**: `deputado_detalhes`

**Parameters**:
```json
{
  "id": 204554
}
```

### Find Deputies by State and Party

**Prompt**: "List all PT deputies from Rio de Janeiro"

**Tools used**: `deputados_listar`

**Parameters**:
```json
{
  "siglaUf": "RJ",
  "siglaPartido": "PT"
}
```

### Track Deputy Expenses

**Prompt**: "Show me the expenses for deputy 204554 in January 2024"

**Tools used**: `deputado_despesas`

**Parameters**:
```json
{
  "id": 204554,
  "dataInicio": "2024-01-01",
  "dataFim": "2024-01-31"
}
```

**Use case**: Transparency research, expense analysis, investigative journalism

### Find Deputy Speeches

**Prompt**: "Get speeches by deputy 204554 about education in 2024"

**Tools used**: `deputado_discursos`

**Parameters**:
```json
{
  "id": 204554,
  "dataInicio": "2024-01-01",
  "dataFim": "2024-12-31"
}
```

**Note**: The AI can then search through speech transcriptions for education-related content.

### Deputy Activity Timeline

**Prompt**: "Show me all activities for deputy 204554 in the last month"

**Tools used**: Multiple tools in sequence
- `deputado_eventos` - Events attended
- `deputado_discursos` - Speeches made
- `deputado_despesas` - Expenses incurred

**Use case**: Comprehensive deputy activity monitoring

## Bill Tracking

### Search for Bills by Topic

**Prompt**: "Find all bills about climate change proposed in 2024"

**Tools used**: `proposicoes_listar`

**Parameters**:
```json
{
  "keywords": "mudança climática",
  "ano": 2024
}
```

**Alternative keywords**: "meio ambiente", "aquecimento global", "sustentabilidade"

### Track a Specific Bill

**Prompt**: "What is the current status of proposition 2234567?"

**Tools used**: `proposicao_detalhes`, `proposicao_tramitacoes`

**What you get**:
- Bill summary and full text
- Current status and location
- Processing history
- Related propositions

### Find Bills by Author

**Prompt**: "Show me all bills authored by deputy 204554 in 2023"

**Tools used**: `proposicoes_listar`

**Parameters**:
```json
{
  "idDeputadoAutor": 204554,
  "ano": 2023
}
```

### Get Bill Full Text

**Prompt**: "Get the full text of proposition 2234567"

**Tools used**: `proposicao_texto`

**Parameters**:
```json
{
  "id": 2234567
}
```

**Use case**: Legal analysis, bill comparison, research

### Track Bill Progress

**Prompt**: "Show me the complete processing history of bill PL 1234/2024"

**Tools used**: `proposicoes_listar`, `proposicao_tramitacoes`

**What you get**:
- All processing steps with dates
- Committees that reviewed the bill
- Current location and next steps
- Amendments and modifications

### Find Related Bills

**Prompt**: "What other bills are related to proposition 2234567?"

**Tools used**: `proposicao_relacionadas`, `proposicao_apensadas`

**Use case**: Understanding legislative context, finding similar proposals

## Vote Analysis

### Find Recent Votes

**Prompt**: "Show me all votes from the last week"

**Tools used**: `votacoes_listar`

**Parameters**:
```json
{
  "dataInicio": "2024-01-08",
  "dataFim": "2024-01-15"
}
```

### Analyze a Specific Vote

**Prompt**: "How did deputies vote on voting ID 2345678-12?"

**Tools used**: `votacao_detalhes`, `votacao_votos`

**What you get**:
- Vote description and proposition
- Total votes (yes, no, abstentions)
- Individual deputy votes
- Vote result (approved/rejected)

### Check Party Positions

**Prompt**: "What were the party recommendations for voting 2345678-12?"

**Tools used**: `votacao_orientacoes`

**Parameters**:
```json
{
  "id": "2345678-12"
}
```

**Use case**: Understanding party discipline, analyzing political alignment

### Deputy Voting Record

**Prompt**: "Show me how deputy 204554 voted on all propositions in 2024"

**Tools used**: Combination of `votacoes_listar` and `votacao_votos`

**Process**:
1. List all votes in 2024
2. For each vote, check if deputy 204554 participated
3. Compile voting record

**Use case**: Accountability tracking, political analysis

### Controversial Votes

**Prompt**: "Find votes where the result was close (within 10 votes)"

**Tools used**: `votacoes_listar`, `votacao_detalhes`

**Process**:
1. List recent votes
2. Get details for each vote
3. Filter for close margins (votosSim ≈ votosNao)

## Committee Research

### List All Committees

**Prompt**: "Show me all active legislative committees"

**Tools used**: `orgaos_listar`

**Parameters**:
```json
{
  "codTipoOrgao": 2
}
```

**Note**: Use `referencias_tipos_orgao` to get committee type codes

### Get Committee Details

**Prompt**: "What is the Commission on Education and Culture (CECT)?"

**Tools used**: `orgaos_listar`, `orgao_detalhes`

**What you get**:
- Official name and abbreviation
- Committee type and purpose
- Current composition
- Contact information

### Find Committee Members

**Prompt**: "Who are the current members of committee 2003?"

**Tools used**: `orgao_membros`

**Parameters**:
```json
{
  "id": 2003
}
```

**Use case**: Understanding committee composition, finding expert deputies

### Track Committee Activities

**Prompt**: "What events did the education committee hold in January 2024?"

**Tools used**: `orgao_eventos`

**Parameters**:
```json
{
  "id": 2003,
  "dataInicio": "2024-01-01",
  "dataFim": "2024-01-31"
}
```

### Committee Voting Records

**Prompt**: "Show me all votes by the education committee in 2024"

**Tools used**: `orgao_votacoes`

**Parameters**:
```json
{
  "id": 2003,
  "dataInicio": "2024-01-01",
  "dataFim": "2024-12-31"
}
```

## Party Analysis

### List All Parties

**Prompt**: "Show me all political parties in the Chamber"

**Tools used**: `partidos_listar`

**What you get**:
- Party abbreviations (PT, PSDB, PL, etc.)
- Full party names
- Party IDs for further queries

### Get Party Information

**Prompt**: "Tell me about the PT party"

**Tools used**: `partidos_listar`, `partido_detalhes`

**What you get**:
- Official party name
- Current representation
- Party leadership
- Historical information

### Find Party Members

**Prompt**: "List all deputies from the PSOL party"

**Tools used**: `partido_membros`

**Alternative**: Use `deputados_listar` with `siglaPartido: "PSOL"`

### Party Leadership

**Prompt**: "Who are the current leaders of the PT party?"

**Tools used**: `partido_lideres`

**Use case**: Understanding party structure, identifying key figures

### Party Blocs

**Prompt**: "What party blocs exist in the current legislature?"

**Tools used**: `blocos_listar`, `bloco_detalhes`

**What you get**:
- Bloc names and compositions
- Member parties
- Bloc leadership
- Formation dates

**Use case**: Understanding political alliances, coalition analysis

## Event Monitoring

### Find Upcoming Events

**Prompt**: "What legislative events are scheduled for this week?"

**Tools used**: `eventos_listar`

**Parameters**:
```json
{
  "dataInicio": "2024-01-15",
  "dataFim": "2024-01-21"
}
```

### Get Event Details

**Prompt**: "What is event 67890 about?"

**Tools used**: `evento_detalhes`

**What you get**:
- Event type (hearing, session, meeting)
- Date, time, and location
- Organizing committees
- Event status

### Event Agenda

**Prompt**: "What bills will be discussed at event 67890?"

**Tools used**: `evento_pauta`

**Parameters**:
```json
{
  "id": 67890
}
```

**Use case**: Tracking bill progress, planning attendance

### Event Participants

**Prompt**: "Which deputies are participating in event 67890?"

**Tools used**: `evento_deputados`

**Use case**: Identifying stakeholders, planning meetings

### Committee Events

**Prompt**: "Show me all events organized by the education committee this month"

**Tools used**: `orgao_eventos`

**Parameters**:
```json
{
  "id": 2003,
  "dataInicio": "2024-01-01",
  "dataFim": "2024-01-31"
}
```

## Reference Data

### Get Valid State Codes

**Prompt**: "What are the valid state codes for filtering deputies?"

**Tools used**: `referencias_ufs`

**Returns**: All 27 Brazilian state codes (AC, AL, AP, AM, BA, CE, DF, ES, GO, MA, MT, MS, MG, PA, PB, PR, PE, PI, RJ, RN, RS, RO, RR, SC, SP, SE, TO)

### Get Proposition Types

**Prompt**: "What types of propositions can I search for?"

**Tools used**: `referencias_tipos_proposicao`

**Returns**: PL (Projeto de Lei), PEC (Proposta de Emenda Constitucional), MPV (Medida Provisória), etc.

### Get Deputy Status Codes

**Prompt**: "What are the possible status values for deputies?"

**Tools used**: `referencias_situacoes_deputado`

**Use case**: Understanding deputy status, filtering active deputies

### Get Event Types

**Prompt**: "What types of legislative events exist?"

**Tools used**: `referencias_tipos_evento`

**Returns**: Audiência Pública, Sessão Deliberativa, Reunião Ordinária, etc.

### Get Legislative Terms

**Prompt**: "What are the legislative terms (legislaturas) available?"

**Tools used**: `referencias_legislaturas`

**Use case**: Historical research, term-based filtering

## Advanced Use Cases

### Comprehensive Deputy Profile

**Prompt**: "Create a complete profile for deputy 204554 including their background, activities, and voting record"

**Tools used** (in sequence):
1. `deputado_detalhes` - Basic information
2. `deputado_profissoes` - Professional background
3. `deputado_historico` - Political history
4. `deputado_orgaos` - Committee memberships
5. `deputado_frentes` - Parliamentary fronts
6. `deputado_discursos` - Recent speeches
7. `deputado_despesas` - Recent expenses

**Use case**: Voter information, political research, journalism

### Bill Impact Analysis

**Prompt**: "Analyze the impact and support for bill PL 1234/2024"

**Tools used**:
1. `proposicoes_listar` - Find the bill
2. `proposicao_detalhes` - Get bill details
3. `proposicao_autores` - Identify authors
4. `proposicao_tramitacoes` - Track progress
5. `proposicao_votacoes` - Check voting records
6. `proposicao_relacionadas` - Find related bills

**Analysis includes**:
- Author party and state
- Committee reviews
- Voting results
- Related legislation
- Current status

### Party Cohesion Analysis

**Prompt**: "Analyze how cohesively the PT party voted in 2024"

**Tools used**:
1. `partido_membros` - Get all PT deputies
2. `votacoes_listar` - Get all 2024 votes
3. `votacao_votos` - Get individual votes for each voting
4. `votacao_orientacoes` - Get party recommendations

**Analysis**:
- Compare individual votes to party orientation
- Calculate cohesion percentage
- Identify dissenting deputies

### Legislative Productivity Report

**Prompt**: "Generate a productivity report for deputy 204554 in 2024"

**Tools used**:
1. `proposicoes_listar` - Bills authored
2. `deputado_discursos` - Speeches made
3. `deputado_eventos` - Events attended
4. `deputado_orgaos` - Committee participation

**Metrics**:
- Number of bills proposed
- Number of speeches
- Event attendance rate
- Committee activity level

### Committee Effectiveness Study

**Prompt**: "Analyze the effectiveness of the education committee in 2024"

**Tools used**:
1. `orgao_detalhes` - Committee information
2. `orgao_membros` - Member list
3. `orgao_eventos` - Events held
4. `orgao_votacoes` - Votes conducted

**Metrics**:
- Number of meetings held
- Bills reviewed
- Votes conducted
- Member attendance

### Cross-Party Collaboration

**Prompt**: "Find bills in 2024 that had authors from multiple parties"

**Tools used**:
1. `proposicoes_listar` - Get all 2024 bills
2. `proposicao_autores` - Get authors for each bill
3. `deputado_detalhes` - Get party for each author

**Analysis**:
- Identify multi-party bills
- Analyze party combinations
- Track collaboration trends

### Regional Representation Analysis

**Prompt**: "Compare legislative activity across Brazilian regions"

**Tools used**:
1. `referencias_ufs` - Get all states
2. `deputados_listar` - Get deputies by state
3. `proposicoes_listar` - Get bills by state
4. Group by region (North, Northeast, Center-West, Southeast, South)

**Metrics**:
- Deputies per region
- Bills proposed per region
- Regional priorities (by bill topics)

## Troubleshooting

### Common Issues

#### Issue: "Validation error: siglaUf must be a valid state code"

**Cause**: Invalid state code provided

**Solution**: Use `referencias_ufs` to get valid codes. State codes must be uppercase (e.g., "SP", not "sp")

**Example**:
```
❌ Wrong: siglaUf: "sp"
✅ Correct: siglaUf: "SP"
```

#### Issue: "API error (404): Resource not found"

**Cause**: Invalid ID or resource doesn't exist

**Solution**: 
1. Verify the ID is correct
2. Check if the resource exists using list tools first
3. Ensure you're using the right ID type (deputy ID vs proposition ID)

**Example**:
```
❌ Wrong: deputado_detalhes with id: 999999999
✅ Correct: Use deputados_listar to find valid IDs first
```

#### Issue: "Rate limit exceeded. Retry after 45 seconds"

**Cause**: Too many requests in short time (30/minute limit)

**Solution**:
1. Wait for the specified time
2. Use API key for higher limits (100/minute)
3. For development: Set `MCP_DISABLE_RATE_LIMIT=true`
4. Optimize queries to request less data

**Example**:
```bash
# Development mode
MCP_DISABLE_RATE_LIMIT=true npx @aredes.me/mcp-camara
```

#### Issue: "Validation error: dataInicio must be before or equal to dataFim"

**Cause**: Date range is backwards

**Solution**: Ensure start date comes before end date

**Example**:
```
❌ Wrong: dataInicio: "2024-12-31", dataFim: "2024-01-01"
✅ Correct: dataInicio: "2024-01-01", dataFim: "2024-12-31"
```

#### Issue: "Validation error: date must match YYYY-MM-DD format"

**Cause**: Incorrect date format

**Solution**: Use ISO 8601 format with leading zeros

**Example**:
```
❌ Wrong: "15/01/2024", "2024-1-5", "01-15-2024"
✅ Correct: "2024-01-15"
```

#### Issue: Slow response times

**Cause**: Cache disabled or cache miss

**Solution**:
1. Enable caching: Ensure `MCP_DISABLE_CACHE` is not set to `true`
2. Increase cache TTL: Set `MCP_CACHE_TTL=7200` (2 hours)
3. Use specific queries instead of broad searches
4. Check network connection

**Performance tips**:
- First request: 200-500ms (API call)
- Cached request: <10ms
- Cache hit rate should be >70%

#### Issue: Empty results when data should exist

**Cause**: Filters too restrictive or incorrect parameters

**Solution**:
1. Remove filters one by one to identify the issue
2. Verify filter values are valid (use reference tools)
3. Check date ranges are reasonable
4. Try without pagination first

**Example**:
```
# Too restrictive
deputados_listar({ siglaUf: "SP", siglaPartido: "PARTIDO_INEXISTENTE" })

# Better approach
1. List all parties: partidos_listar()
2. Then filter: deputados_listar({ siglaUf: "SP", siglaPartido: "PT" })
```

### Debugging Tips

#### Enable Debug Logging

```bash
LOG_LEVEL=DEBUG npx @aredes.me/mcp-camara
```

This shows:
- All API requests and responses
- Cache hits and misses
- Validation details
- Error stack traces

#### Test with Simple Queries

Start with simple queries to verify connectivity:

1. **Test reference data** (no parameters):
   ```
   "Get all state codes"
   ```

2. **Test basic list** (simple filter):
   ```
   "List 5 deputies"
   ```

3. **Test specific lookup** (known ID):
   ```
   "Get details for deputy 204554"
   ```

#### Check Configuration

Verify your environment variables:

```bash
# Check current settings
echo $MCP_TRANSPORT
echo $MCP_CACHE_TTL
echo $LOG_LEVEL
```

#### Verify API Connectivity

Test direct API access:

```bash
curl https://dadosabertos.camara.leg.br/api/v2/deputados?itens=1
```

If this fails, the Câmara API may be down.

### Getting Help

If you're still experiencing issues:

1. **Check the logs**: Set `LOG_LEVEL=DEBUG` for detailed information
2. **Review documentation**: 
   - [API Documentation](./API.md)
   - [Configuration Guide](./CONFIGURATION.md)
3. **Search GitHub Issues**: [github.com/aredes/mcp-camara/issues](https://github.com/aredes/mcp-camara/issues)
4. **Create a new issue**: Include:
   - Error message
   - Tool and parameters used
   - Environment (OS, Node version)
   - Debug logs (sanitize sensitive data)

## Best Practices

### Efficient Querying

1. **Start broad, then narrow**: Use list tools with filters before getting details
2. **Use reference data**: Get valid codes before filtering
3. **Leverage caching**: Identical queries are cached for 1 hour
4. **Batch related queries**: Ask for multiple related items in one prompt

### Example Workflow

```
Good workflow:
1. "What are valid state codes?" (referencias_ufs)
2. "List deputies from SP" (deputados_listar)
3. "Get details for deputy 204554" (deputado_detalhes)

Inefficient workflow:
1. "Get details for deputy 204554" (might not exist)
2. "Try deputy 204555" (trial and error)
3. "Try deputy 204556" (wasteful)
```

### Prompt Writing Tips

1. **Be specific**: Include IDs, dates, and filters
2. **Use natural language**: The AI will translate to tool calls
3. **Ask for analysis**: The AI can process and summarize results
4. **Request comparisons**: The AI can call multiple tools and compare

**Good prompts**:
- "Compare voting records of deputies from PT and PSDB on education bills in 2024"
- "Show me the most active deputies from São Paulo in the last 6 months"
- "Analyze the progress of all climate change bills proposed in 2024"

**Less effective prompts**:
- "Get data" (too vague)
- "Deputy info" (missing specifics)
- "Show me stuff" (no clear goal)

## Additional Resources

- [API Documentation](./API.md) - Complete tool reference
- [Configuration Guide](./CONFIGURATION.md) - Environment variables
- [Cloudflare Deployment](./CLOUDFLARE_DEPLOYMENT.md) - Deploy to Workers
- [HTTP Transport](./HTTP_TRANSPORT.md) - HTTP server docs
- [SSE Transport](./SSE_TRANSPORT.md) - Server-Sent Events docs
- [Câmara API Docs](https://dadosabertos.camara.leg.br/swagger/api.html) - Official API documentation

