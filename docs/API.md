# API Reference

Complete reference for all 62 tools provided by the Câmara dos Deputados MCP Server.

## Table of Contents

- [Overview](#overview)
- [Rate Limiting](#rate-limiting)
- [Caching](#caching)
- [Common Parameters](#common-parameters)
- [Deputy Tools (15)](#deputy-tools)
- [Proposition Tools (10)](#proposition-tools)
- [Voting Tools (4)](#voting-tools)
- [Committee Tools (5)](#committee-tools)
- [Party and Bloc Tools (6)](#party-and-bloc-tools)
- [Event Tools (7)](#event-tools)
- [Reference Data Tools (15)](#reference-data-tools)
- [OpenAPI Specification](#openapi-specification)
- [Error Handling](#error-handling)

## Overview

The MCP server exposes 62 tools organized into 7 categories for querying Brazilian legislative data. All tools follow consistent patterns for parameters, pagination, and error handling.

**Base API URL**: `https://dadosabertos.camara.leg.br/api/v2`

**Response Format**: All tools return JSON-formatted data with the following structure:

```json
{
  "dados": [...],
  "links": [
    { "rel": "self", "href": "..." },
    { "rel": "next", "href": "..." }
  ]
}
```

## Rate Limiting

The MCP server implements rate limiting to ensure fair usage and protect the Câmara API:

- **Default limit**: 30 requests per minute per IP address
- **Authenticated limit**: 100 requests per minute with valid API key
- **Algorithm**: Sliding window (60-second rolling window)
- **Headers**: Rate limit information is included in response headers
  - `X-RateLimit-Limit`: Maximum requests allowed
  - `X-RateLimit-Remaining`: Requests remaining in current window
  - `X-RateLimit-Reset`: Unix timestamp when the limit resets

**Rate Limit Response** (HTTP 429):
```json
{
  "error": "Rate limit exceeded",
  "retryAfter": 45
}
```

**Bypass**: Set `MCP_DISABLE_RATE_LIMIT=true` environment variable (development only)


## Caching

The MCP server implements intelligent caching to improve performance and reduce load on the Câmara API:

- **Cache TTL**: 3600 seconds (1 hour) by default, configurable via `MCP_CACHE_TTL`
- **Cache Strategy**: All GET requests are cached with endpoint + parameters as the cache key
- **Cache Size**: Maximum 100MB with LRU (Least Recently Used) eviction
- **Cache Key Format**: `{endpoint}:{hash(params)}`
- **Cache Bypass**: Set `MCP_DISABLE_CACHE=true` environment variable

**Cache Behavior**:
- First request: Fetches from API and stores in cache
- Subsequent requests: Returns cached data if within TTL
- Expired data: Automatically fetched fresh from API
- Cache full: Evicts least recently used entries

**Cloudflare Workers**: Uses KV storage for distributed caching across edge locations

## Common Parameters

Many tools share common parameter patterns:

### Pagination Parameters

All list endpoints support pagination:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `pagina` | number | No | Page number (1-indexed, default: 1) |
| `itens` | number | No | Items per page (1-100, default: varies by endpoint) |

### Date Parameters

Date filters use ISO 8601 format (YYYY-MM-DD):

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `dataInicio` | string | No | Start date (YYYY-MM-DD) |
| `dataFim` | string | No | End date (YYYY-MM-DD) |

**Validation**: `dataInicio` must be before or equal to `dataFim`

### State Codes (UF)

Brazilian state codes (27 valid values):

`AC`, `AL`, `AP`, `AM`, `BA`, `CE`, `DF`, `ES`, `GO`, `MA`, `MT`, `MS`, `MG`, `PA`, `PB`, `PR`, `PE`, `PI`, `RJ`, `RN`, `RS`, `RO`, `RR`, `SC`, `SP`, `SE`, `TO`

---


## Deputy Tools

15 tools for querying information about deputies (members of the Chamber).

### deputados_listar

List deputies with optional filters.

**Parameters**:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | number | No | Deputy ID |
| `nome` | string | No | Deputy name (partial match) |
| `siglaUf` | string | No | State code (UF) |
| `siglaPartido` | string | No | Party abbreviation |
| `siglaSexo` | string | No | Gender (`M` or `F`) |
| `dataInicio` | string | No | Start date (YYYY-MM-DD) |
| `dataFim` | string | No | End date (YYYY-MM-DD) |
| `pagina` | number | No | Page number |
| `itens` | number | No | Items per page (max 100) |

**Example**:
```json
{
  "siglaUf": "SP",
  "siglaPartido": "PT",
  "pagina": 1,
  "itens": 10
}
```

**Returns**: List of deputies with basic information (id, name, party, state, photo URL, email)

---

### deputado_detalhes

Get detailed information about a specific deputy.

**Parameters**:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | number | Yes | Deputy ID |

**Example**:
```json
{
  "id": 204554
}
```

**Returns**: Complete deputy information including personal data, current status, office location, contact information, education, and mandate details

---

### deputado_despesas

Get expense records for a deputy.

**Parameters**:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | number | Yes | Deputy ID |
| `dataInicio` | string | No | Start date (YYYY-MM-DD) |
| `dataFim` | string | No | End date (YYYY-MM-DD) |
| `pagina` | number | No | Page number |
| `itens` | number | No | Items per page (max 100) |

**Example**:
```json
{
  "id": 204554,
  "dataInicio": "2024-01-01",
  "dataFim": "2024-12-31"
}
```

**Returns**: Parliamentary expense records including type, amount, supplier, document details, and reimbursement information

---

### deputado_discursos

Get speeches made by a deputy.

**Parameters**:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | number | Yes | Deputy ID |
| `dataInicio` | string | No | Start date (YYYY-MM-DD) |
| `dataFim` | string | No | End date (YYYY-MM-DD) |
| `pagina` | number | No | Page number |
| `itens` | number | No | Items per page (max 100) |

**Example**:
```json
{
  "id": 204554,
  "dataInicio": "2024-01-01"
}
```

**Returns**: Speech records with transcriptions, keywords, summaries, and event information

---

### deputado_eventos

Get events that a deputy participated in.

**Parameters**:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | number | Yes | Deputy ID |
| `dataInicio` | string | No | Start date (YYYY-MM-DD) |
| `dataFim` | string | No | End date (YYYY-MM-DD) |
| `pagina` | number | No | Page number |
| `itens` | number | No | Items per page (max 100) |

**Returns**: List of events including committee meetings, hearings, and other parliamentary activities

---


### deputado_frentes

Get parliamentary fronts that a deputy is a member of.

**Parameters**:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | number | Yes | Deputy ID |
| `pagina` | number | No | Page number |
| `itens` | number | No | Items per page (max 100) |

**Returns**: Parliamentary fronts (groups organized around specific themes) with membership details

---

### deputado_historico

Get the complete mandate history for a deputy.

**Parameters**:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | number | Yes | Deputy ID |

**Returns**: Complete mandate history including all legislative terms and positions held

---

### deputado_mandatos_externos

Get external mandates held by a deputy.

**Parameters**:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | number | Yes | Deputy ID |
| `pagina` | number | No | Page number |
| `itens` | number | No | Items per page (max 100) |

**Returns**: External mandates such as positions in state legislatures or municipal councils

---

### deputado_ocupacoes

Get occupations declared by a deputy.

**Parameters**:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | number | Yes | Deputy ID |

**Returns**: Professional background and work experience declared by the deputy

---

### deputado_orgaos

Get committees and legislative bodies that a deputy is or was a member of.

**Parameters**:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | number | Yes | Deputy ID |
| `dataInicio` | string | No | Start date (YYYY-MM-DD) |
| `dataFim` | string | No | End date (YYYY-MM-DD) |
| `pagina` | number | No | Page number |
| `itens` | number | No | Items per page (max 100) |

**Returns**: Committee memberships with dates and roles

---

### deputado_profissoes

Get professions declared by a deputy.

**Parameters**:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | number | Yes | Deputy ID |

**Returns**: Professional qualifications and career background

---

### deputado_mesa

Get leadership positions held by a deputy in the Chamber's directing board.

**Parameters**:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | number | Yes | Deputy ID |
| `dataInicio` | string | No | Start date (YYYY-MM-DD) |
| `dataFim` | string | No | End date (YYYY-MM-DD) |
| `pagina` | number | No | Page number |
| `itens` | number | No | Items per page (max 100) |

**Returns**: Leadership positions in the Mesa Diretora (directing board)

---

### deputado_liderancas

Get party leadership roles held by a deputy.

**Parameters**:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | number | Yes | Deputy ID |
| `dataInicio` | string | No | Start date (YYYY-MM-DD) |
| `dataFim` | string | No | End date (YYYY-MM-DD) |
| `pagina` | number | No | Page number |
| `itens` | number | No | Items per page (max 100) |

**Returns**: Party leader and whip positions

---

### deputado_cargos

Get positions and roles held by a deputy within the Chamber.

**Parameters**:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | number | Yes | Deputy ID |
| `dataInicio` | string | No | Start date (YYYY-MM-DD) |
| `dataFim` | string | No | End date (YYYY-MM-DD) |
| `pagina` | number | No | Page number |
| `itens` | number | No | Items per page (max 100) |

**Returns**: Committee positions and other assignments

---

### deputado_filiacoes

Get party affiliation history for a deputy.

**Parameters**:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | number | Yes | Deputy ID |
| `dataInicio` | string | No | Start date (YYYY-MM-DD) |
| `dataFim` | string | No | End date (YYYY-MM-DD) |
| `pagina` | number | No | Page number |
| `itens` | number | No | Items per page (max 100) |

**Returns**: Complete party affiliation history with dates

---


## Proposition Tools

10 tools for querying legislative propositions (bills, amendments, resolutions).

### proposicoes_listar

List legislative propositions with comprehensive filtering.

**Parameters**:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `siglaTipo` | string | No | Proposition type abbreviation (e.g., "PL", "PEC") |
| `numero` | number | No | Proposition number |
| `ano` | number | No | Year (1900 to current year) |
| `dataInicio` | string | No | Start date (YYYY-MM-DD) |
| `dataFim` | string | No | End date (YYYY-MM-DD) |
| `idDeputadoAutor` | number | No | Author deputy ID |
| `siglaPartidoAutor` | string | No | Author party abbreviation |
| `siglaUfAutor` | string | No | Author state code |
| `keywords` | string | No | Keywords to search |
| `tramitacaoSenado` | boolean | No | Filter by Senate processing status |
| `pagina` | number | No | Page number |
| `itens` | number | No | Items per page (max 100) |

**Example**:
```json
{
  "siglaTipo": "PL",
  "ano": 2024,
  "keywords": "educação",
  "pagina": 1,
  "itens": 20
}
```

**Returns**: List of propositions with type, number, year, and summary

---

### proposicao_detalhes

Get detailed information about a specific proposition.

**Parameters**:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | number | Yes | Proposition ID |

**Example**:
```json
{
  "id": 2236882
}
```

**Returns**: Complete proposition details including type, number, year, summary, detailed description, status, authors, and full text URL

---

### proposicao_autores

Get the list of authors for a proposition.

**Parameters**:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | number | Yes | Proposition ID |
| `pagina` | number | No | Page number |
| `itens` | number | No | Items per page (max 100) |

**Returns**: List of authors including deputies and other entities

---

### proposicao_relacionadas

Get propositions related to a specific proposition.

**Parameters**:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | number | Yes | Proposition ID |
| `pagina` | number | No | Page number |
| `itens` | number | No | Items per page (max 100) |

**Returns**: Related propositions including amendments, substitutes, and connected proposals

---

### proposicao_temas

Get thematic areas for a proposition.

**Parameters**:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | number | Yes | Proposition ID |

**Returns**: Thematic areas and subject classifications

---

### proposicao_tramitacoes

Get the complete processing history for a proposition.

**Parameters**:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | number | Yes | Proposition ID |
| `pagina` | number | No | Page number |
| `itens` | number | No | Items per page (max 100) |

**Returns**: Processing history showing all steps, committees, and decisions

---

### proposicao_votacoes

Get all voting records for a proposition.

**Parameters**:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | number | Yes | Proposition ID |
| `pagina` | number | No | Page number |
| `itens` | number | No | Items per page (max 100) |

**Returns**: Voting records including plenary and committee votes with results

---

### proposicao_texto

Get the full text content of a proposition.

**Parameters**:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | number | Yes | Proposition ID |

**Returns**: Full text including proposal text and justification

---

### proposicao_situacoes

Get the status history for a proposition.

**Parameters**:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | number | Yes | Proposition ID |
| `pagina` | number | No | Page number |
| `itens` | number | No | Items per page (max 100) |

**Returns**: Status history with dates and descriptions

---

### proposicao_apensadas

Get propositions attached to a specific proposition.

**Parameters**:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | number | Yes | Proposition ID |
| `pagina` | number | No | Page number |
| `itens` | number | No | Items per page (max 100) |

**Returns**: Attached propositions for joint processing

---


## Voting Tools

4 tools for querying voting records and results.

### votacoes_listar

List votes with optional filters.

**Parameters**:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string | No | Voting ID |
| `idProposicao` | number | No | Proposition ID |
| `idOrgao` | number | No | Committee/organ ID |
| `dataInicio` | string | No | Start date (YYYY-MM-DD) |
| `dataFim` | string | No | End date (YYYY-MM-DD) |
| `pagina` | number | No | Page number |
| `itens` | number | No | Items per page (max 100) |

**Example**:
```json
{
  "idProposicao": 2236882,
  "dataInicio": "2024-01-01",
  "dataFim": "2024-12-31"
}
```

**Returns**: List of votes with date, organ, proposition, description, and approval status

---

### votacao_detalhes

Get detailed information about a specific voting.

**Parameters**:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string | Yes | Voting ID |

**Example**:
```json
{
  "id": "2236882-1"
}
```

**Returns**: Detailed voting information including date, organ, proposition, description, approval status, and vote counts (yes, no, other)

---

### votacao_votos

Get individual deputy votes for a specific voting.

**Parameters**:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string | Yes | Voting ID |
| `pagina` | number | No | Page number |
| `itens` | number | No | Items per page (max 100) |

**Example**:
```json
{
  "id": "2236882-1",
  "pagina": 1,
  "itens": 50
}
```

**Returns**: Individual deputy votes showing how each deputy voted (yes, no, abstention, etc.)

---

### votacao_orientacoes

Get party leadership voting recommendations.

**Parameters**:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string | Yes | Voting ID |

**Example**:
```json
{
  "id": "2236882-1"
}
```

**Returns**: Party leadership recommendations showing how each party instructed their members to vote

---


## Committee Tools

5 tools for querying committees and legislative bodies (órgãos).

### orgaos_listar

List committees and legislative bodies.

**Parameters**:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | number | No | Committee ID |
| `sigla` | string | No | Committee abbreviation |
| `codTipoOrgao` | number | No | Committee type code |
| `dataInicio` | string | No | Start date (YYYY-MM-DD) |
| `dataFim` | string | No | End date (YYYY-MM-DD) |
| `pagina` | number | No | Page number |
| `itens` | number | No | Items per page (max 100) |

**Example**:
```json
{
  "codTipoOrgao": 2,
  "pagina": 1,
  "itens": 20
}
```

**Returns**: List of committees with ID, abbreviation, name, and type

---

### orgao_detalhes

Get detailed information about a specific committee.

**Parameters**:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | number | Yes | Committee ID |

**Example**:
```json
{
  "id": 2003
}
```

**Returns**: Committee details including name, abbreviation, type, and publication name

---

### orgao_membros

Get the list of members for a committee.

**Parameters**:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | number | Yes | Committee ID |
| `dataInicio` | string | No | Start date (YYYY-MM-DD) |
| `dataFim` | string | No | End date (YYYY-MM-DD) |
| `pagina` | number | No | Page number |
| `itens` | number | No | Items per page (max 100) |

**Example**:
```json
{
  "id": 2003,
  "dataInicio": "2024-01-01"
}
```

**Returns**: Committee members with roles and dates

---

### orgao_eventos

Get events organized by a committee.

**Parameters**:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | number | Yes | Committee ID |
| `dataInicio` | string | No | Start date (YYYY-MM-DD) |
| `dataFim` | string | No | End date (YYYY-MM-DD) |
| `pagina` | number | No | Page number |
| `itens` | number | No | Items per page (max 100) |

**Returns**: Events including meetings, hearings, and other activities

---

### orgao_votacoes

Get voting records for a committee.

**Parameters**:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | number | Yes | Committee ID |
| `dataInicio` | string | No | Start date (YYYY-MM-DD) |
| `dataFim` | string | No | End date (YYYY-MM-DD) |
| `pagina` | number | No | Page number |
| `itens` | number | No | Items per page (max 100) |

**Returns**: Committee voting records with dates and results

---


## Party and Bloc Tools

6 tools for querying political parties and party blocs.

### partidos_listar

List all political parties.

**Parameters**:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `sigla` | string | No | Party abbreviation |
| `dataInicio` | string | No | Start date (YYYY-MM-DD) |
| `dataFim` | string | No | End date (YYYY-MM-DD) |
| `pagina` | number | No | Page number |
| `itens` | number | No | Items per page (max 100) |

**Example**:
```json
{
  "pagina": 1,
  "itens": 50
}
```

**Returns**: List of all political parties with ID, abbreviation, and full name

---

### partido_detalhes

Get detailed information about a specific party.

**Parameters**:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | number | Yes | Party ID |

**Example**:
```json
{
  "id": 36835
}
```

**Returns**: Party details including full name, abbreviation, and official data

---

### partido_membros

Get the list of deputies who are members of a party.

**Parameters**:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | number | Yes | Party ID |
| `dataInicio` | string | No | Start date (YYYY-MM-DD) |
| `dataFim` | string | No | End date (YYYY-MM-DD) |
| `pagina` | number | No | Page number |
| `itens` | number | No | Items per page (max 100) |

**Example**:
```json
{
  "id": 36835,
  "dataInicio": "2024-01-01"
}
```

**Returns**: Party members with membership dates

---

### partido_lideres

Get the list of party leaders.

**Parameters**:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | number | Yes | Party ID |
| `dataInicio` | string | No | Start date (YYYY-MM-DD) |
| `dataFim` | string | No | End date (YYYY-MM-DD) |
| `pagina` | number | No | Page number |
| `itens` | number | No | Items per page (max 100) |

**Returns**: Party leaders who represent the party in legislative negotiations

---

### blocos_listar

List party blocs (coalitions of multiple parties).

**Parameters**:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `idLegislatura` | number | No | Legislative term ID |
| `pagina` | number | No | Page number |
| `itens` | number | No | Items per page (max 100) |

**Example**:
```json
{
  "idLegislatura": 57
}
```

**Returns**: List of party blocs with member parties

---

### bloco_detalhes

Get detailed information about a specific party bloc.

**Parameters**:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | number | Yes | Bloc ID |

**Example**:
```json
{
  "id": 53658
}
```

**Returns**: Bloc details including member parties, formation date, and leadership

---


## Event Tools

7 tools for querying legislative events (meetings, hearings, sessions).

### eventos_listar

List events with optional filters.

**Parameters**:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | number | No | Event ID |
| `idOrgao` | number | No | Organizing committee ID |
| `codTipoEvento` | number | No | Event type code |
| `dataInicio` | string | No | Start date (YYYY-MM-DD) |
| `dataFim` | string | No | End date (YYYY-MM-DD) |
| `horaInicio` | string | No | Start time (HH:MM) |
| `horaFim` | string | No | End time (HH:MM) |
| `pagina` | number | No | Page number |
| `itens` | number | No | Items per page (max 100) |

**Example**:
```json
{
  "idOrgao": 2003,
  "dataInicio": "2024-01-01",
  "dataFim": "2024-01-31"
}
```

**Returns**: List of events with date, time, status, type, description, and organizing committees

---

### evento_detalhes

Get detailed information about a specific event.

**Parameters**:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | number | Yes | Event ID |

**Example**:
```json
{
  "id": 67890
}
```

**Returns**: Event details including date, time, status, type, description, location, and organizing committees

---

### evento_pauta

Get the agenda for an event.

**Parameters**:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | number | Yes | Event ID |
| `pagina` | number | No | Page number |
| `itens` | number | No | Items per page (max 100) |

**Example**:
```json
{
  "id": 67890
}
```

**Returns**: Event agenda showing propositions and items to be discussed

---

### evento_deputados

Get the list of deputies participating in an event.

**Parameters**:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | number | Yes | Event ID |
| `pagina` | number | No | Page number |
| `itens` | number | No | Items per page (max 100) |

**Returns**: List of participating deputies

---

### evento_orgaos

Get the list of committees organizing an event.

**Parameters**:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | number | Yes | Event ID |

**Returns**: List of organizing committees and legislative bodies

---

### evento_votacoes

Get voting records that occurred during an event.

**Parameters**:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | number | Yes | Event ID |
| `pagina` | number | No | Page number |
| `itens` | number | No | Items per page (max 100) |

**Returns**: Voting records from the event

---

### evento_situacoes

Get the status history for an event.

**Parameters**:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | number | Yes | Event ID |

**Returns**: Status history showing all status changes over time

---


## Reference Data Tools

15 tools for querying reference data and lookup tables.

### referencias_situacoes_deputado

Get valid deputy status codes.

**Parameters**: None

**Returns**: All possible deputy status values with descriptions

---

### referencias_tipos_proposicao

Get valid proposition types.

**Parameters**: None

**Example Response**:
```json
{
  "dados": [
    {
      "cod": 136,
      "sigla": "PL",
      "nome": "Projeto de Lei",
      "descricao": "Proposição destinada a regular matéria..."
    },
    {
      "cod": 139,
      "sigla": "PEC",
      "nome": "Proposta de Emenda à Constituição",
      "descricao": "Proposição destinada a alterar a Constituição..."
    }
  ]
}
```

**Returns**: Proposition types (bills, amendments, resolutions, etc.) with codes and descriptions

---

### referencias_tipos_evento

Get valid event types.

**Parameters**: None

**Returns**: Event types (committee meetings, hearings, sessions, etc.) with codes and descriptions

---

### referencias_ufs

Get Brazilian state codes.

**Parameters**: None

**Example Response**:
```json
{
  "dados": [
    {
      "sigla": "SP",
      "nome": "São Paulo"
    },
    {
      "sigla": "RJ",
      "nome": "Rio de Janeiro"
    }
  ]
}
```

**Returns**: All 26 states plus Federal District with official abbreviations and full names

---

### referencias_tipos_orgao

Get valid committee and legislative body types.

**Parameters**: None

**Returns**: Committee types with codes and descriptions

---

### referencias_tipos_autor

Get valid author types for propositions.

**Parameters**: None

**Returns**: Author types (deputy, committee, executive branch, etc.) with codes and descriptions

---

### referencias_tipos_tramitacao

Get valid processing/tramitacao types.

**Parameters**: None

**Returns**: Processing types showing different stages in the legislative process

---

### referencias_situacoes_proposicao

Get valid proposition status codes.

**Parameters**: None

**Returns**: Proposition statuses (approved, rejected, under review, etc.) with descriptions

---

### referencias_situacoes_evento

Get valid event status codes.

**Parameters**: None

**Returns**: Event statuses (scheduled, in progress, completed, cancelled, etc.) with descriptions

---

### referencias_situacoes_orgao

Get valid committee/organ status codes.

**Parameters**: None

**Returns**: Committee statuses (active, inactive, etc.) with descriptions

---

### referencias_codigos_tipo_autor

Get numeric codes for author types.

**Parameters**: None

**Returns**: Author type codes with descriptions (alternative to referencias_tipos_autor)

---

### referencias_situacoes_mesa

Get valid status codes for Chamber leadership board positions.

**Parameters**: None

**Returns**: Mesa Diretora position statuses with descriptions

---

### referencias_situacoes_membro

Get valid status codes for committee membership.

**Parameters**: None

**Returns**: Membership statuses (titular, substitute, etc.) with descriptions

---

### referencias_situacoes_votacao

Get valid voting status codes.

**Parameters**: None

**Returns**: Voting statuses (open, closed, cancelled, etc.) with descriptions

---

### referencias_legislaturas

Get legislative terms (legislaturas).

**Parameters**:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `pagina` | number | No | Page number |
| `itens` | number | No | Items per page (max 100) |

**Example Response**:
```json
{
  "dados": [
    {
      "id": 57,
      "dataInicio": "2023-02-01",
      "dataFim": "2027-01-31"
    },
    {
      "id": 56,
      "dataInicio": "2019-02-01",
      "dataFim": "2023-01-31"
    }
  ]
}
```

**Returns**: Legislative terms with IDs, start dates, and end dates (each term represents a four-year period)

---


## OpenAPI Specification

The MCP server provides an OpenAPI 3.0 specification for all REST endpoints when deployed to Cloudflare Workers.

### Accessing the Specification

**Endpoint**: `GET /openapi.json`

**Example**:
```bash
curl https://your-worker.workers.dev/openapi.json
```

### REST API Endpoints

When deployed to Cloudflare Workers, the following REST endpoints are available:

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/deputados/{id}` | GET | Get deputy details |
| `/proposicoes/{id}` | GET | Get proposition details |
| `/votacoes/{id}` | GET | Get voting details |
| `/eventos/{id}` | GET | Get event details |
| `/openapi.json` | GET | Get OpenAPI specification |
| `/health` | GET | Health check endpoint |

### Authentication

REST API endpoints require API key authentication:

**Header**: `X-API-Key: your-api-key`

**Example**:
```bash
curl -H "X-API-Key: your-api-key" \
  https://your-worker.workers.dev/deputados/204554
```

### OpenAPI Specification Structure

The OpenAPI specification includes:

- **API Information**: Title, version, description, contact information
- **Servers**: Base URLs for production and development
- **Paths**: All available endpoints with parameters and responses
- **Components**: Reusable schemas for request/response objects
- **Security**: API key authentication scheme
- **Tags**: Endpoint categorization (deputies, propositions, votings, events)

**Example Schema** (Deputy):
```json
{
  "Deputy": {
    "type": "object",
    "properties": {
      "id": { "type": "integer" },
      "nome": { "type": "string" },
      "siglaPartido": { "type": "string" },
      "siglaUf": { "type": "string" },
      "urlFoto": { "type": "string" },
      "email": { "type": "string" }
    }
  }
}
```

---


## Error Handling

The MCP server implements comprehensive error handling with descriptive messages.

### Error Types

#### Validation Errors

Returned when input parameters fail validation.

**Example**:
```json
{
  "error": "Validation error: siglaUf: Invalid enum value. Expected 'AC' | 'AL' | ... | 'TO', received 'XX'",
  "field": "siglaUf",
  "isError": true
}
```

**Common Validation Errors**:
- Invalid deputy ID (must be positive integer)
- Invalid date format (must be YYYY-MM-DD)
- Invalid UF code (must be valid Brazilian state)
- Invalid pagination (page must be positive, items max 100)
- Date range error (dataInicio must be before dataFim)

#### API Errors

Returned when the Câmara API returns an error.

**4xx Client Errors**:
```json
{
  "error": "API error (404): Resource not found",
  "statusCode": 404,
  "endpoint": "/deputados/999999",
  "isError": true
}
```

**5xx Server Errors**:
```json
{
  "error": "API error (500): Câmara API is temporarily unavailable",
  "statusCode": 500,
  "isError": true
}
```

#### Rate Limit Errors

Returned when rate limit is exceeded.

**HTTP 429 Response**:
```json
{
  "error": "Rate limit exceeded. Retry after 45 seconds.",
  "retryAfter": 45,
  "isError": true
}
```

**Headers**:
- `Retry-After`: Seconds until rate limit resets
- `X-RateLimit-Limit`: Maximum requests allowed
- `X-RateLimit-Remaining`: 0
- `X-RateLimit-Reset`: Unix timestamp

#### Network Errors

Returned when network communication fails.

**Timeout Error**:
```json
{
  "error": "Request timeout after 30 seconds",
  "isError": true
}
```

**Connection Error**:
```json
{
  "error": "Network error: Failed to connect to Câmara API",
  "isError": true
}
```

#### Cache Errors

Cache errors are logged but don't block requests. The system falls back to direct API calls.

### Error Response Format

All errors follow a consistent format:

```typescript
{
  content: [
    {
      type: "text",
      text: "Error message with details"
    }
  ],
  isError: true
}
```

### Retry Logic

The HTTP client implements automatic retry with exponential backoff:

- **Retry attempts**: 3 (configurable)
- **Initial delay**: 1 second
- **Backoff multiplier**: 2x (1s, 2s, 4s)
- **Retryable errors**: Network failures, 5xx server errors
- **Non-retryable errors**: 4xx client errors, validation errors

### Best Practices

1. **Check `isError` field**: Always check if the response contains an error
2. **Handle rate limits**: Implement exponential backoff when receiving 429 errors
3. **Validate inputs**: Validate parameters before making requests to avoid validation errors
4. **Use reference tools**: Query reference data tools to get valid codes and values
5. **Monitor logs**: Enable logging to track errors and performance issues

### Debugging

Enable debug logging with environment variable:

```bash
LOG_LEVEL=DEBUG
```

Debug logs include:
- Tool invocations with parameters
- API requests with URLs and query parameters
- Cache hits and misses
- Validation errors with full context
- Network errors with stack traces

---

## Additional Resources

- **GitHub Repository**: [https://github.com/aredes/mcp-camara](https://github.com/aredes/mcp-camara)
- **Usage Examples**: [USAGE_EXAMPLES.md](./USAGE_EXAMPLES.md)
- **Configuration Guide**: [CONFIGURATION.md](./CONFIGURATION.md)
- **Deployment Guide**: [CLOUDFLARE_DEPLOYMENT.md](./CLOUDFLARE_DEPLOYMENT.md)
- **Troubleshooting**: [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)
- **Câmara API Documentation**: [https://dadosabertos.camara.leg.br/swagger/api.html](https://dadosabertos.camara.leg.br/swagger/api.html)

---

**Last Updated**: November 2024  
**API Version**: 2.0  
**MCP Server Version**: 1.0.0
