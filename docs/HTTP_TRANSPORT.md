# HTTP Transport Guide

The Câmara MCP Server supports HTTP transport for web-based clients and REST API access.

## Starting the Server

To start the server with HTTP transport:

```bash
MCP_TRANSPORT=http MCP_HTTP_PORT=3000 mcp-camara
```

Or using environment variables:

```bash
export MCP_TRANSPORT=http
export MCP_HTTP_PORT=3000
mcp-camara
```

## Available Endpoints

### Health Check

**GET /health**

Returns server health status and information.

**Example:**
```bash
curl http://localhost:3000/health
```

**Response:**
```json
{
  "status": "healthy",
  "server": {
    "name": "mcp-camara",
    "version": "1.0.0",
    "initialized": true,
    "toolCount": 62
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### MCP Protocol Endpoint

**POST /mcp**

Accepts JSON-RPC 2.0 requests for MCP protocol communication.

#### List Available Tools

**Request:**
```bash
curl -X POST http://localhost:3000/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/list",
    "params": {}
  }'
```

**Response:**
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "tools": [
      {
        "name": "deputados_listar",
        "description": "List deputies with optional filters",
        "inputSchema": {
          "type": "object",
          "properties": { ... },
          "required": []
        }
      },
      ...
    ]
  }
}
```

#### Call a Tool

**Request:**
```bash
curl -X POST http://localhost:3000/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 2,
    "method": "tools/call",
    "params": {
      "name": "deputados_listar",
      "arguments": {
        "siglaUf": "SP",
        "pagina": 1,
        "itens": 10
      }
    }
  }'
```

**Response:**
```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "result": {
    "content": [
      {
        "type": "text",
        "text": "{\"dados\": [...], \"links\": [...]}"
      }
    ]
  }
}
```

## CORS Support

The HTTP adapter includes CORS headers to allow cross-origin requests from web applications:

- `Access-Control-Allow-Origin: *`
- `Access-Control-Allow-Methods: GET, POST, OPTIONS`
- `Access-Control-Allow-Headers: Content-Type, Authorization, X-API-Key`

## Request Logging

All HTTP requests are logged with:
- HTTP method
- URL path
- Response status code
- Request duration
- User agent
- Content type

Set `LOG_LEVEL=DEBUG` to see detailed request logs.

## Error Handling

The server returns appropriate HTTP status codes:

- `200 OK` - Successful request
- `204 No Content` - CORS preflight response
- `400 Bad Request` - Invalid JSON-RPC request
- `404 Not Found` - Unknown route or method
- `500 Internal Server Error` - Server error

JSON-RPC errors follow the JSON-RPC 2.0 specification:

- `-32600` - Invalid Request
- `-32601` - Method not found
- `-32602` - Invalid params
- `-32603` - Internal error

## Configuration

Environment variables for HTTP transport:

| Variable | Description | Default |
|----------|-------------|---------|
| `MCP_TRANSPORT` | Transport protocol | `stdio` |
| `MCP_HTTP_PORT` | HTTP server port | `3000` |
| `LOG_LEVEL` | Logging level | `INFO` |
| `MCP_CACHE_TTL` | Cache TTL in seconds | `3600` |
| `MCP_DISABLE_CACHE` | Disable caching | `false` |
| `MCP_DISABLE_RATE_LIMIT` | Disable rate limiting | `false` |

## Example: Using with JavaScript

```javascript
async function listDeputies() {
  const response = await fetch('http://localhost:3000/mcp', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'tools/call',
      params: {
        name: 'deputados_listar',
        arguments: {
          siglaUf: 'SP',
          pagina: 1,
          itens: 10,
        },
      },
    }),
  });

  const data = await response.json();
  const result = JSON.parse(data.result.content[0].text);
  console.log(result.dados);
}

listDeputies();
```

## Example: Using with Python

```python
import requests
import json

def list_deputies():
    response = requests.post(
        'http://localhost:3000/mcp',
        headers={'Content-Type': 'application/json'},
        json={
            'jsonrpc': '2.0',
            'id': 1,
            'method': 'tools/call',
            'params': {
                'name': 'deputados_listar',
                'arguments': {
                    'siglaUf': 'SP',
                    'pagina': 1,
                    'itens': 10
                }
            }
        }
    )
    
    data = response.json()
    result = json.loads(data['result']['content'][0]['text'])
    print(result['dados'])

list_deputies()
```

## Testing

Run the test suite:

```bash
npm test -- http-adapter.test.ts --run
```

Or test manually using the provided test script:

```bash
chmod +x test-http-server.sh
./test-http-server.sh
```
