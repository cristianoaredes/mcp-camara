# Manual Testing Guide

This guide provides step-by-step instructions for manually testing the Câmara MCP Server with Claude Desktop, Cursor IDE, and other MCP clients.

## Prerequisites

1. Build the project:
   ```bash
   npm run build
   ```

2. Ensure you have the MCP client installed (Claude Desktop, Cursor, etc.)

## Test 1: Claude Desktop Integration (STDIO Transport)

### Setup

1. Open Claude Desktop configuration file:
   - **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
   - **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

2. Add the MCP server configuration:
   ```json
   {
     "mcpServers": {
       "camara-deputados": {
         "command": "node",
         "args": ["/absolute/path/to/mcp-camara/build/lib/bin/mcp-camara.js"],
         "env": {
           "LOG_LEVEL": "INFO"
         }
       }
     }
   }
   ```

3. Restart Claude Desktop

### Test Cases

#### TC1.1: Verify Server Connection
- **Action**: Open Claude Desktop
- **Expected**: No error messages about the MCP server
- **Verification**: Check Claude Desktop logs for successful connection

#### TC1.2: List Available Tools
- **Prompt**: "What MCP tools do you have available?"
- **Expected**: Claude should list tools related to Brazilian Chamber of Deputies
- **Verification**: Should see categories like deputies, propositions, votings, etc.

#### TC1.3: Query Deputies by State
- **Prompt**: "List deputies from São Paulo (SP)"
- **Expected**: Claude uses `deputados_listar` tool with `siglaUf: "SP"`
- **Verification**: Returns list of deputies from São Paulo

#### TC1.4: Get Deputy Details
- **Prompt**: "Get details for deputy with ID 220593"
- **Expected**: Claude uses `deputado_detalhes` tool
- **Verification**: Returns detailed information about the deputy

#### TC1.5: Search Propositions
- **Prompt**: "Find propositions from 2024"
- **Expected**: Claude uses `proposicoes_listar` tool with year filter
- **Verification**: Returns list of propositions from 2024

#### TC1.6: Get Reference Data
- **Prompt**: "What are the valid Brazilian state codes?"
- **Expected**: Claude uses `referencias_ufs` tool
- **Verification**: Returns list of all Brazilian states with codes

#### TC1.7: Complex Query
- **Prompt**: "Find deputies from Rio de Janeiro who are members of PT party"
- **Expected**: Claude uses `deputados_listar` with multiple filters
- **Verification**: Returns filtered list of deputies

#### TC1.8: Error Handling - Invalid Input
- **Prompt**: "Get details for deputy with ID -1"
- **Expected**: Claude receives validation error
- **Verification**: Error message indicates invalid ID (must be positive)

#### TC1.9: Error Handling - Non-existent Resource
- **Prompt**: "Get details for deputy with ID 999999999"
- **Expected**: Claude receives API error (404)
- **Verification**: Error message indicates resource not found

#### TC1.10: Caching Behavior
- **Prompt**: "List all Brazilian states" (ask twice)
- **Expected**: Second request should be faster (cached)
- **Verification**: Check logs for cache hit on second request

## Test 2: Cursor IDE Integration (STDIO Transport)

### Setup

1. Open Cursor settings (Cmd/Ctrl + Shift + P → "Preferences: Open Settings (JSON)")

2. Add MCP server configuration:
   ```json
   {
     "mcp.servers": {
       "camara-deputados": {
         "command": "node",
         "args": ["/absolute/path/to/mcp-camara/build/lib/bin/mcp-camara.js"],
         "env": {
           "LOG_LEVEL": "INFO"
         }
       }
     }
   }
   ```

3. Restart Cursor

### Test Cases

#### TC2.1: Verify Server in Cursor
- **Action**: Open Cursor AI chat
- **Expected**: MCP server appears in available tools
- **Verification**: Can see Câmara tools in tool list

#### TC2.2: Query from Cursor Chat
- **Prompt**: "Using the Câmara MCP server, list deputies from Bahia (BA)"
- **Expected**: Cursor uses `deputados_listar` tool
- **Verification**: Returns list of deputies from Bahia

#### TC2.3: Multi-step Workflow
- **Prompt**: "Find a deputy from São Paulo, then get their expenses for 2024"
- **Expected**: Cursor chains `deputados_listar` → `deputado_despesas`
- **Verification**: Returns deputy info followed by expense records

#### TC2.4: Code Generation with Context
- **Prompt**: "Write a Python script that uses this API to fetch all parties"
- **Expected**: Cursor uses `partidos_listar` to understand the API
- **Verification**: Generates code with correct API structure

## Test 3: HTTP Transport

### Setup

1. Start the server in HTTP mode:
   ```bash
   MCP_TRANSPORT=http MCP_HTTP_PORT=3000 node build/lib/bin/mcp-camara.js
   ```

### Test Cases

#### TC3.1: Health Check
```bash
curl http://localhost:3000/health
```
- **Expected**: 200 status with health information
- **Verification**: Response contains server status

#### TC3.2: List Tools
```bash
curl -X POST http://localhost:3000/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/list"
  }'
```
- **Expected**: JSON response with all 62 tools
- **Verification**: Response contains tools array with 62 items

#### TC3.3: Call Tool - List Deputies
```bash
curl -X POST http://localhost:3000/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/call",
    "params": {
      "name": "deputados_listar",
      "arguments": {
        "siglaUf": "SP",
        "itens": 10
      }
    }
  }'
```
- **Expected**: JSON response with deputy data
- **Verification**: Response contains dados array with deputies

#### TC3.4: Call Tool - Get Reference Data
```bash
curl -X POST http://localhost:3000/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/call",
    "params": {
      "name": "referencias_ufs",
      "arguments": {}
    }
  }'
```
- **Expected**: JSON response with state codes
- **Verification**: Response contains all Brazilian states

#### TC3.5: Validation Error
```bash
curl -X POST http://localhost:3000/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/call",
    "params": {
      "name": "deputado_detalhes",
      "arguments": {}
    }
  }'
```
- **Expected**: Error response with validation message
- **Verification**: Response contains isError: true and validation error message

#### TC3.6: API Error
```bash
curl -X POST http://localhost:3000/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/call",
    "params": {
      "name": "deputado_detalhes",
      "arguments": {
        "id": 999999999
      }
    }
  }'
```
- **Expected**: Error response with API error message
- **Verification**: Response contains isError: true and API error details

#### TC3.7: CORS Headers
```bash
curl -i -X OPTIONS http://localhost:3000/mcp \
  -H "Origin: http://example.com" \
  -H "Access-Control-Request-Method: POST"
```
- **Expected**: CORS headers in response
- **Verification**: Response contains Access-Control-Allow-Origin header

## Test 4: Rate Limiting

### Setup

1. Start server with rate limiting enabled:
   ```bash
   MCP_TRANSPORT=http MCP_HTTP_PORT=3000 node build/lib/bin/mcp-camara.js
   ```

### Test Cases

#### TC4.1: Normal Usage
```bash
for i in {1..10}; do
  curl -s -X POST http://localhost:3000/mcp \
    -H "Content-Type: application/json" \
    -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' > /dev/null
  echo "Request $i completed"
done
```
- **Expected**: All requests succeed
- **Verification**: No 429 status codes

#### TC4.2: Exceed Rate Limit
```bash
for i in {1..35}; do
  response=$(curl -s -w "\n%{http_code}" -X POST http://localhost:3000/mcp \
    -H "Content-Type: application/json" \
    -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}')
  status=$(echo "$response" | tail -n1)
  echo "Request $i: Status $status"
  if [ "$status" = "429" ]; then
    echo "Rate limit triggered at request $i"
    break
  fi
done
```
- **Expected**: 429 status after ~30 requests
- **Verification**: Rate limit error with Retry-After header

#### TC4.3: Rate Limit Reset
```bash
# Trigger rate limit
for i in {1..35}; do
  curl -s -X POST http://localhost:3000/mcp \
    -H "Content-Type: application/json" \
    -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' > /dev/null
done

# Wait for reset
echo "Waiting 60 seconds for rate limit reset..."
sleep 60

# Try again
curl -w "\n%{http_code}" -X POST http://localhost:3000/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'
```
- **Expected**: Request succeeds after waiting
- **Verification**: 200 status after rate limit window expires

## Test 5: Caching Behavior

### Setup

1. Start server with caching enabled:
   ```bash
   MCP_TRANSPORT=http MCP_HTTP_PORT=3000 LOG_LEVEL=DEBUG node build/lib/bin/mcp-camara.js
   ```

### Test Cases

#### TC5.1: Cache Miss (First Request)
```bash
curl -X POST http://localhost:3000/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/call",
    "params": {
      "name": "referencias_ufs",
      "arguments": {}
    }
  }'
```
- **Expected**: Request goes to API
- **Verification**: Check logs for "Cache miss" message

#### TC5.2: Cache Hit (Second Request)
```bash
curl -X POST http://localhost:3000/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/call",
    "params": {
      "name": "referencias_ufs",
      "arguments": {}
    }
  }'
```
- **Expected**: Response served from cache
- **Verification**: Check logs for "Cache hit" message, faster response time

#### TC5.3: Different Parameters = Different Cache
```bash
# Request 1
curl -X POST http://localhost:3000/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/call",
    "params": {
      "name": "deputados_listar",
      "arguments": {"siglaUf": "SP"}
    }
  }'

# Request 2 (different params)
curl -X POST http://localhost:3000/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/call",
    "params": {
      "name": "deputados_listar",
      "arguments": {"siglaUf": "RJ"}
    }
  }'
```
- **Expected**: Both requests hit the API (different cache keys)
- **Verification**: Check logs for two "Cache miss" messages

#### TC5.4: Cache Disabled
```bash
MCP_DISABLE_CACHE=true MCP_TRANSPORT=http MCP_HTTP_PORT=3000 LOG_LEVEL=DEBUG \
  node build/lib/bin/mcp-camara.js
```
- **Expected**: All requests bypass cache
- **Verification**: Check logs for "Cache disabled" or no cache messages

## Test 6: All 62 Tools Verification

### Tool Categories and Sample Tests

#### Deputies (15 tools)
```bash
# deputados_listar
curl -X POST http://localhost:3000/mcp -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"deputados_listar","arguments":{"siglaUf":"SP","itens":5}}}'

# deputado_detalhes
curl -X POST http://localhost:3000/mcp -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"deputado_detalhes","arguments":{"id":220593}}}'

# deputado_despesas
curl -X POST http://localhost:3000/mcp -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"deputado_despesas","arguments":{"id":220593,"ano":2024,"mes":1}}}'
```

#### Propositions (10 tools)
```bash
# proposicoes_listar
curl -X POST http://localhost:3000/mcp -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"proposicoes_listar","arguments":{"ano":2024,"itens":5}}}'

# proposicao_detalhes
curl -X POST http://localhost:3000/mcp -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"proposicao_detalhes","arguments":{"id":2366773}}}'
```

#### Votings (4 tools)
```bash
# votacoes_listar
curl -X POST http://localhost:3000/mcp -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"votacoes_listar","arguments":{"itens":5}}}'
```

#### Committees (5 tools)
```bash
# orgaos_listar
curl -X POST http://localhost:3000/mcp -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"orgaos_listar","arguments":{"itens":5}}}'
```

#### Parties (6 tools)
```bash
# partidos_listar
curl -X POST http://localhost:3000/mcp -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"partidos_listar","arguments":{}}}'
```

#### Events (7 tools)
```bash
# eventos_listar
curl -X POST http://localhost:3000/mcp -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"eventos_listar","arguments":{"itens":5}}}'
```

#### Reference Data (15 tools)
```bash
# referencias_ufs
curl -X POST http://localhost:3000/mcp -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"referencias_ufs","arguments":{}}}'

# referencias_tipos_proposicao
curl -X POST http://localhost:3000/mcp -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"referencias_tipos_proposicao","arguments":{}}}'

# referencias_tipos_evento
curl -X POST http://localhost:3000/mcp -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"referencias_tipos_evento","arguments":{}}}'
```

## Test Results Checklist

Use this checklist to track your testing progress:

### STDIO Transport (Claude Desktop)
- [ ] TC1.1: Server connection verified
- [ ] TC1.2: Tools list displayed
- [ ] TC1.3: Query deputies by state
- [ ] TC1.4: Get deputy details
- [ ] TC1.5: Search propositions
- [ ] TC1.6: Get reference data
- [ ] TC1.7: Complex query with filters
- [ ] TC1.8: Validation error handling
- [ ] TC1.9: API error handling
- [ ] TC1.10: Caching behavior

### STDIO Transport (Cursor IDE)
- [ ] TC2.1: Server verified in Cursor
- [ ] TC2.2: Query from Cursor chat
- [ ] TC2.3: Multi-step workflow
- [ ] TC2.4: Code generation with context

### HTTP Transport
- [ ] TC3.1: Health check
- [ ] TC3.2: List tools
- [ ] TC3.3: Call tool - list deputies
- [ ] TC3.4: Call tool - reference data
- [ ] TC3.5: Validation error
- [ ] TC3.6: API error
- [ ] TC3.7: CORS headers

### Rate Limiting
- [ ] TC4.1: Normal usage
- [ ] TC4.2: Exceed rate limit
- [ ] TC4.3: Rate limit reset

### Caching
- [ ] TC5.1: Cache miss (first request)
- [ ] TC5.2: Cache hit (second request)
- [ ] TC5.3: Different parameters
- [ ] TC5.4: Cache disabled

### All 62 Tools
- [ ] Deputies tools (15)
- [ ] Propositions tools (10)
- [ ] Votings tools (4)
- [ ] Committees tools (5)
- [ ] Parties tools (6)
- [ ] Events tools (7)
- [ ] Reference data tools (15)

## Troubleshooting

### Server Won't Start
- Check Node.js version (requires >= 18.0.0)
- Verify build completed successfully
- Check for port conflicts (default: 3000)

### Tools Not Appearing in Claude Desktop
- Verify configuration file path is correct
- Check absolute path to mcp-camara.js
- Restart Claude Desktop after config changes
- Check Claude Desktop logs for errors

### API Errors
- Verify internet connection
- Check Câmara API status: https://dadosabertos.camara.leg.br/api/v2
- Review error messages for specific issues

### Rate Limiting Issues
- Wait 60 seconds for rate limit window to reset
- Use MCP_DISABLE_RATE_LIMIT=true for testing
- Check rate limit headers in responses

### Caching Issues
- Use LOG_LEVEL=DEBUG to see cache operations
- Use MCP_DISABLE_CACHE=true to bypass cache
- Verify cache TTL settings

## Reporting Issues

When reporting issues, please include:
1. Test case number (e.g., TC1.3)
2. Expected behavior
3. Actual behavior
4. Error messages or logs
5. Environment details (OS, Node version, MCP client)
