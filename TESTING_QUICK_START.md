# Testing Quick Start Guide

Quick reference for testing the Câmara MCP Server.

## Automated Tests

### Run All Tests
```bash
npm test
```

### Run Integration Tests
```bash
./test-integration.sh
```

### Build Project
```bash
npm run build
```

## Manual Testing

### 1. Test STDIO Transport (Claude Desktop / Cursor)

**Start Server:**
```bash
node build/lib/bin/mcp-camara.js
```

**Configure Claude Desktop:**
Edit `~/Library/Application Support/Claude/claude_desktop_config.json`:
```json
{
  "mcpServers": {
    "camara-deputados": {
      "command": "node",
      "args": ["/absolute/path/to/build/lib/bin/mcp-camara.js"]
    }
  }
}
```

**Test Prompts:**
- "List deputies from São Paulo"
- "What are the valid Brazilian state codes?"
- "Find propositions from 2024"

### 2. Test HTTP Transport

**Start Server:**
```bash
MCP_TRANSPORT=http MCP_HTTP_PORT=3000 node build/lib/bin/mcp-camara.js
```

**Test Health:**
```bash
curl http://localhost:3000/health
```

**List Tools:**
```bash
curl -X POST http://localhost:3000/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'
```

**Call Tool:**
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

**Use Test Client:**
```bash
node test-http-client.js                                    # Run examples
node test-http-client.js list                               # List all tools
node test-http-client.js deputados_listar '{"siglaUf":"SP"}' # Call tool
```

### 3. Test SSE Transport

**Start Server:**
```bash
MCP_TRANSPORT=sse MCP_HTTP_PORT=3001 node build/lib/bin/mcp-camara.js
```

**Test Connection:**
```bash
curl -N -H "Accept: text/event-stream" http://localhost:3001/sse
```

### 4. Test Rate Limiting

**Start Server with Rate Limiting:**
```bash
MCP_TRANSPORT=http MCP_HTTP_PORT=3000 node build/lib/bin/mcp-camara.js
```

**Trigger Rate Limit:**
```bash
for i in {1..35}; do
  curl -s -X POST http://localhost:3000/mcp \
    -H "Content-Type: application/json" \
    -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | grep -q "429" && echo "Rate limited at request $i" && break
done
```

### 5. Test Caching

**Start Server with Debug Logging:**
```bash
MCP_TRANSPORT=http MCP_HTTP_PORT=3000 LOG_LEVEL=DEBUG node build/lib/bin/mcp-camara.js
```

**Make Same Request Twice:**
```bash
# First request (cache miss)
curl -X POST http://localhost:3000/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"referencias_ufs","arguments":{}}}'

# Second request (cache hit)
curl -X POST http://localhost:3000/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"referencias_ufs","arguments":{}}}'
```

Check logs for "Cache hit" message.

## Test Sample Tools

### Deputies
```bash
# List deputies from São Paulo
node test-http-client.js deputados_listar '{"siglaUf":"SP","itens":5}'

# Get deputy details
node test-http-client.js deputado_detalhes '{"id":220593}'
```

### Propositions
```bash
# List propositions from 2024
node test-http-client.js proposicoes_listar '{"ano":2024,"itens":5}'
```

### Reference Data
```bash
# List Brazilian states
node test-http-client.js referencias_ufs '{}'

# List proposition types
node test-http-client.js referencias_tipos_proposicao '{}'
```

### Parties
```bash
# List all parties
node test-http-client.js partidos_listar '{}'
```

## Test Error Handling

### Validation Error
```bash
# Missing required parameter
node test-http-client.js deputado_detalhes '{}'
```

### API Error
```bash
# Non-existent resource
node test-http-client.js deputado_detalhes '{"id":999999999}'
```

### Invalid Parameter
```bash
# Invalid UF code
node test-http-client.js deputados_listar '{"siglaUf":"ZZ"}'
```

## Environment Variables

```bash
# Transport selection
MCP_TRANSPORT=stdio|http|sse

# HTTP port
MCP_HTTP_PORT=3000

# Disable caching
MCP_DISABLE_CACHE=true

# Disable rate limiting
MCP_DISABLE_RATE_LIMIT=true

# Log level
LOG_LEVEL=DEBUG|INFO|WARN|ERROR
```

## Verify All 62 Tools

```bash
# Start server
MCP_TRANSPORT=http MCP_HTTP_PORT=3000 node build/lib/bin/mcp-camara.js

# List all tools
node test-http-client.js list
```

Should show:
- Deputies: 15 tools
- Propositions: 10 tools
- Votings: 4 tools
- Committees: 5 tools
- Parties: 6 tools
- Events: 7 tools
- Reference Data: 15 tools
- **Total: 62 tools**

## Troubleshooting

### Server won't start
```bash
# Check Node version (requires >= 18)
node --version

# Rebuild project
npm run build

# Check for port conflicts
lsof -i :3000
```

### Tests failing
```bash
# Clean and rebuild
rm -rf build node_modules
npm install
npm run build
npm test
```

### API errors
```bash
# Check Câmara API status
curl https://dadosabertos.camara.leg.br/api/v2

# Enable debug logging
LOG_LEVEL=DEBUG node build/lib/bin/mcp-camara.js
```

## Documentation

- **Full Manual Testing Guide**: `docs/MANUAL_TESTING_GUIDE.md`
- **Test Report**: `docs/TEST_REPORT.md`
- **API Documentation**: `docs/API.md`
- **Usage Examples**: `docs/USAGE_EXAMPLES.md`

## Quick Verification Checklist

- [ ] Build succeeds (`npm run build`)
- [ ] All tests pass (`npm test`)
- [ ] STDIO transport works
- [ ] HTTP transport works
- [ ] SSE transport works
- [ ] All 62 tools registered
- [ ] Error handling works
- [ ] Caching works
- [ ] Rate limiting works
- [ ] Health endpoint responds

## Support

For issues or questions:
1. Check `docs/TROUBLESHOOTING.md`
2. Review test logs
3. Enable DEBUG logging
4. Check GitHub issues

---

**Quick Test Command:**
```bash
npm run build && npm test && ./test-integration.sh
```
