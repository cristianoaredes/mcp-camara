# Configuration Guide

Complete reference for configuring the Câmara dos Deputados MCP Server.

## Table of Contents

- [Overview](#overview)
- [Environment Variables](#environment-variables)
- [Transport Configuration](#transport-configuration)
- [Cache Configuration](#cache-configuration)
- [Rate Limiting Configuration](#rate-limiting-configuration)
- [Logging Configuration](#logging-configuration)
- [API Configuration](#api-configuration)
- [Cloudflare Workers Configuration](#cloudflare-workers-configuration)
- [AI Assistant Integration](#ai-assistant-integration)
- [Advanced Configuration](#advanced-configuration)

## Overview

The MCP server can be configured through:

1. **Environment Variables**: Primary configuration method
2. **Configuration Files**: For AI assistant integration
3. **Command-line Arguments**: For quick testing
4. **Cloudflare Workers**: Via wrangler.toml and secrets

### Configuration Priority

When multiple configuration sources are present:

1. Environment variables (highest priority)
2. Configuration files
3. Default values (lowest priority)

## Environment Variables

### Complete Reference

| Variable | Type | Default | Description |
|----------|------|---------|-------------|
| `MCP_TRANSPORT` | string | `stdio` | Transport protocol: `stdio`, `http`, or `sse` |
| `MCP_HTTP_PORT` | number | `3000` | Port for HTTP/SSE server |
| `CAMARA_API_BASE_URL` | string | `https://dadosabertos.camara.leg.br/api/v2` | Câmara API base URL |
| `MCP_CACHE_TTL` | number | `3600` | Cache time-to-live in seconds |
| `MCP_DISABLE_CACHE` | boolean | `false` | Disable caching entirely |
| `MCP_DISABLE_RATE_LIMIT` | boolean | `false` | Disable rate limiting |
| `MCP_API_KEY` | string | - | API key for authentication (optional) |
| `LOG_LEVEL` | string | `INFO` | Logging level: `DEBUG`, `INFO`, `WARN`, `ERROR` |

### Setting Environment Variables

#### macOS/Linux

**Temporary (current session)**:
```bash
export MCP_TRANSPORT=http
export MCP_HTTP_PORT=3000
export LOG_LEVEL=DEBUG
```

**Permanent (add to ~/.bashrc or ~/.zshrc)**:
```bash
echo 'export MCP_TRANSPORT=http' >> ~/.zshrc
echo 'export MCP_HTTP_PORT=3000' >> ~/.zshrc
source ~/.zshrc
```

**Using .env file**:
```bash
# Create .env file
cat > .env << EOF
MCP_TRANSPORT=http
MCP_HTTP_PORT=3000
LOG_LEVEL=DEBUG
EOF

# Load and run
source .env
npx @aredes.me/mcp-camara
```

#### Windows

**Command Prompt**:
```cmd
set MCP_TRANSPORT=http
set MCP_HTTP_PORT=3000
set LOG_LEVEL=DEBUG
```

**PowerShell**:
```powershell
$env:MCP_TRANSPORT="http"
$env:MCP_HTTP_PORT="3000"
$env:LOG_LEVEL="DEBUG"
```

**Permanent (System Properties)**:
1. Open System Properties → Advanced → Environment Variables
2. Add new user or system variables
3. Restart terminal/application

### Verifying Configuration

Check current environment variables:

```bash
# macOS/Linux
echo $MCP_TRANSPORT
echo $MCP_HTTP_PORT
env | grep MCP

# Windows Command Prompt
echo %MCP_TRANSPORT%
echo %MCP_HTTP_PORT%

# Windows PowerShell
$env:MCP_TRANSPORT
$env:MCP_HTTP_PORT
```

## Transport Configuration

### STDIO Transport (Default)

Best for desktop AI assistants (Claude Desktop, Cursor, Windsurf).

**Configuration**:
```bash
export MCP_TRANSPORT=stdio
# or omit (stdio is default)
```

**Usage**:
```bash
npx @aredes.me/mcp-camara
```

**Characteristics**:
- Uses standard input/output streams
- Bidirectional communication
- No network ports required
- Lowest latency
- Best for local AI assistants

**AI Assistant Config** (Claude Desktop):
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

### HTTP Transport

Best for web applications and REST API access.

**Configuration**:
```bash
export MCP_TRANSPORT=http
export MCP_HTTP_PORT=3000
```

**Usage**:
```bash
npx @aredes.me/mcp-camara
```

**Endpoints**:
- `POST /mcp` - JSON-RPC 2.0 MCP protocol
- `GET /health` - Health check
- `GET /openapi.json` - OpenAPI specification
- `GET /deputados/{id}` - REST API endpoints
- `GET /proposicoes/{id}` - REST API endpoints
- `GET /votacoes/{id}` - REST API endpoints
- `GET /eventos/{id}` - REST API endpoints

**Characteristics**:
- HTTP server on specified port
- CORS enabled for web clients
- REST API endpoints
- JSON-RPC 2.0 protocol
- Request logging
- Health monitoring

**Example Request**:
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

### SSE Transport

Best for streaming connections and real-time updates.

**Configuration**:
```bash
export MCP_TRANSPORT=sse
export MCP_HTTP_PORT=3000
```

**Usage**:
```bash
npx @aredes.me/mcp-camara
```

**Endpoints**:
- `GET /sse` - Server-Sent Events stream
- `POST /mcp` - JSON-RPC 2.0 MCP protocol
- `GET /health` - Health check with SSE stats
- `GET /openapi.json` - OpenAPI specification
- REST API endpoints (same as HTTP)

**Characteristics**:
- Persistent HTTP connection
- Server-to-client streaming
- Automatic reconnection
- Heartbeat every 30 seconds
- Connection lifecycle management
- Real-time event delivery

**Example Connection**:
```javascript
const eventSource = new EventSource('http://localhost:3000/sse');

eventSource.addEventListener('connected', (event) => {
  console.log('Connected:', JSON.parse(event.data));
});

eventSource.addEventListener('heartbeat', (event) => {
  console.log('Heartbeat:', JSON.parse(event.data));
});
```

## Cache Configuration

### Cache TTL

Control how long responses are cached:

```bash
# 1 hour (default)
export MCP_CACHE_TTL=3600

# 30 minutes
export MCP_CACHE_TTL=1800

# 2 hours
export MCP_CACHE_TTL=7200

# 24 hours
export MCP_CACHE_TTL=86400
```

**Recommendations**:
- **Reference data** (UFs, types): 24 hours (86400)
- **Deputy/proposition details**: 1 hour (3600)
- **Voting records**: 30 minutes (1800)
- **Events**: 15 minutes (900)
- **Real-time data**: Disable cache

### Disable Cache

Disable caching for development or real-time data:

```bash
export MCP_DISABLE_CACHE=true
```

**When to disable**:
- Development and testing
- Debugging cache issues
- Real-time data requirements
- Low-memory environments

**Performance impact**:
- All requests hit Câmara API
- Slower response times
- Higher API load
- No memory usage for cache

### Cache Behavior

**Cache key format**:
```
{endpoint}:{hash(params)}
```

**Example**:
```
/deputados:sha256({"siglaUf":"SP","pagina":1})
```

**Cache storage**:
- **CLI/HTTP/SSE**: In-memory (max 100MB)
- **Cloudflare Workers**: KV storage (distributed)

**Cache eviction**:
- **TTL expiration**: Automatic after TTL
- **LRU eviction**: When cache exceeds 100MB
- **Manual**: Restart server or redeploy

### Cache Monitoring

Enable debug logging to monitor cache:

```bash
export LOG_LEVEL=DEBUG
npx @aredes.me/mcp-camara
```

Look for log messages:
```
[DEBUG] Cache hit: /deputados:abc123...
[DEBUG] Cache miss: /proposicoes:def456...
[DEBUG] Cache size: 45.2 MB / 100 MB
```

## Rate Limiting Configuration

### Default Limits

- **Unauthenticated**: 30 requests per minute per IP
- **Authenticated**: 100 requests per minute per API key
- **Algorithm**: Sliding window (60-second rolling window)

### Disable Rate Limiting

Disable for development or trusted environments:

```bash
export MCP_DISABLE_RATE_LIMIT=true
```

**When to disable**:
- Local development
- Testing
- Trusted internal networks
- Behind other rate limiters

**Security warning**: Only disable in controlled environments.

### API Key Authentication

Increase rate limits with API key:

```bash
export MCP_API_KEY=your-secret-api-key
```

**For Cloudflare Workers**:
```bash
npx wrangler secret put MCP_API_KEY --env production
```

**Using API key in requests**:
```bash
curl -H "X-API-Key: your-secret-api-key" \
  http://localhost:3000/deputados/204554
```

### Rate Limit Headers

Responses include rate limit information:

```
X-RateLimit-Limit: 30
X-RateLimit-Remaining: 25
X-RateLimit-Reset: 1705320000
```

### Rate Limit Response

When limit exceeded (HTTP 429):
```json
{
  "error": "Rate limit exceeded",
  "retryAfter": 45,
  "limit": 30,
  "reset": 1705320000
}
```

## Logging Configuration

### Log Levels

```bash
# DEBUG: All messages including detailed debugging
export LOG_LEVEL=DEBUG

# INFO: Informational messages (default)
export LOG_LEVEL=INFO

# WARN: Warning messages only
export LOG_LEVEL=WARN

# ERROR: Error messages only
export LOG_LEVEL=ERROR
```

### Log Output

**DEBUG level includes**:
- All API requests and responses
- Cache hits and misses
- Validation details
- Tool invocations
- Performance metrics
- Stack traces

**INFO level includes**:
- Server startup
- Tool invocations
- API requests
- Errors and warnings

**WARN level includes**:
- Warnings
- Errors

**ERROR level includes**:
- Errors only

### Log Format

```
[LEVEL] timestamp - message
[INFO] 2024-01-15T10:30:00.000Z - Server started on port 3000
[DEBUG] 2024-01-15T10:30:01.123Z - Cache hit: /deputados:abc123
[ERROR] 2024-01-15T10:30:02.456Z - API error: 404 Not Found
```

### Structured Logging

Logs include structured data:

```json
{
  "level": "INFO",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "message": "Tool invocation",
  "tool": "deputados_listar",
  "params": {"siglaUf": "SP"},
  "duration": 123,
  "cached": true
}
```

## API Configuration

### Base URL

Override Câmara API base URL:

```bash
export CAMARA_API_BASE_URL=https://dadosabertos.camara.leg.br/api/v2
```

**Use cases**:
- Testing with mock API
- Using proxy server
- API version changes

### Timeout

Default timeout is 30 seconds (not configurable via environment).

To modify, edit `lib/core/http-client.ts`:
```typescript
const config: HttpClientConfig = {
  baseURL: process.env.CAMARA_API_BASE_URL,
  timeout: 30000, // Change this value
  retryAttempts: 3,
  retryDelay: 1000
};
```

### Retry Configuration

Default retry settings (not configurable via environment):
- **Attempts**: 3
- **Initial delay**: 1 second
- **Backoff**: Exponential (1s, 2s, 4s)

## Cloudflare Workers Configuration

### wrangler.toml

Main configuration file for Workers deployment:

```toml
name = "mcp-camara"
main = "build/lib/workers/worker.js"
compatibility_date = "2024-01-01"
node_compat = true

[env.production]
name = "mcp-camara"

[[env.production.kv_namespaces]]
binding = "MCP_CACHE"
id = "your-kv-namespace-id"

[[env.production.kv_namespaces]]
binding = "RATE_LIMIT_KV"
id = "your-rate-limit-kv-id"

[env.production.vars]
CAMARA_API_BASE_URL = "https://dadosabertos.camara.leg.br/api/v2"
MCP_CACHE_TTL = "3600"
LOG_LEVEL = "INFO"
MCP_DISABLE_RATE_LIMIT = "false"
```

### Environment-Specific Configuration

**Development**:
```toml
[env.development]
name = "mcp-camara-dev"

[env.development.vars]
LOG_LEVEL = "DEBUG"
MCP_DISABLE_RATE_LIMIT = "true"
```

**Staging**:
```toml
[env.staging]
name = "mcp-camara-staging"

[env.staging.vars]
LOG_LEVEL = "INFO"
MCP_DISABLE_RATE_LIMIT = "false"
```

**Production**:
```toml
[env.production]
name = "mcp-camara"

[env.production.vars]
LOG_LEVEL = "WARN"
MCP_DISABLE_RATE_LIMIT = "false"
```

### Secrets Management

Store sensitive data as secrets:

```bash
# Set secret
npx wrangler secret put MCP_API_KEY --env production

# List secrets
npx wrangler secret list --env production

# Delete secret
npx wrangler secret delete MCP_API_KEY --env production
```

### KV Namespaces

Configure KV storage:

```toml
[[env.production.kv_namespaces]]
binding = "MCP_CACHE"
id = "abc123..."
preview_id = "def456..."  # Optional: for wrangler dev

[[env.production.kv_namespaces]]
binding = "RATE_LIMIT_KV"
id = "ghi789..."
preview_id = "jkl012..."
```

## AI Assistant Integration

### Claude Desktop

**Configuration file location**:
- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`
- **Linux**: `~/.config/Claude/claude_desktop_config.json`

**Basic configuration**:
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

**With environment variables**:
```json
{
  "mcpServers": {
    "camara": {
      "command": "npx",
      "args": ["@aredes.me/mcp-camara"],
      "env": {
        "LOG_LEVEL": "DEBUG",
        "MCP_CACHE_TTL": "7200"
      }
    }
  }
}
```

**Using global installation**:
```json
{
  "mcpServers": {
    "camara": {
      "command": "mcp-camara"
    }
  }
}
```

### Cursor

**Configuration location**: Cursor Settings → MCP

**Configuration**:
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

### Windsurf

Similar to Claude Desktop configuration.

### Continue.dev

**Configuration file**: `.continue/config.json`

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

### HTTP/SSE Integration

For web-based or custom clients:

```json
{
  "mcpServers": {
    "camara": {
      "url": "http://localhost:3000/mcp",
      "transport": "http"
    }
  }
}
```

Or with SSE:

```json
{
  "mcpServers": {
    "camara": {
      "url": "http://localhost:3000/sse",
      "transport": "sse"
    }
  }
}
```

## Advanced Configuration

### Multiple Instances

Run multiple instances with different configurations:

**Instance 1 (Development)**:
```bash
export MCP_TRANSPORT=http
export MCP_HTTP_PORT=3000
export LOG_LEVEL=DEBUG
export MCP_DISABLE_CACHE=true
npx @aredes.me/mcp-camara
```

**Instance 2 (Production)**:
```bash
export MCP_TRANSPORT=http
export MCP_HTTP_PORT=3001
export LOG_LEVEL=INFO
export MCP_CACHE_TTL=7200
npx @aredes.me/mcp-camara
```

### Process Managers

#### PM2

```bash
# Install PM2
npm install -g pm2

# Create ecosystem file
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: 'mcp-camara',
    script: 'npx',
    args: '@aredes.me/mcp-camara',
    env: {
      MCP_TRANSPORT: 'http',
      MCP_HTTP_PORT: 3000,
      LOG_LEVEL: 'INFO',
      MCP_CACHE_TTL: 3600
    }
  }]
};
EOF

# Start with PM2
pm2 start ecosystem.config.js

# Monitor
pm2 monit

# Logs
pm2 logs mcp-camara
```

#### systemd (Linux)

```bash
# Create service file
sudo cat > /etc/systemd/system/mcp-camara.service << EOF
[Unit]
Description=MCP Camara Server
After=network.target

[Service]
Type=simple
User=your-user
WorkingDirectory=/path/to/mcp-camara
Environment="MCP_TRANSPORT=http"
Environment="MCP_HTTP_PORT=3000"
Environment="LOG_LEVEL=INFO"
ExecStart=/usr/bin/npx @aredes.me/mcp-camara
Restart=always

[Install]
WantedBy=multi-user.target
EOF

# Enable and start
sudo systemctl enable mcp-camara
sudo systemctl start mcp-camara

# Check status
sudo systemctl status mcp-camara

# View logs
sudo journalctl -u mcp-camara -f
```

### Docker Configuration

```dockerfile
FROM node:18-alpine

WORKDIR /app

# Install package
RUN npm install -g @aredes.me/mcp-camara

# Environment variables
ENV MCP_TRANSPORT=http
ENV MCP_HTTP_PORT=3000
ENV LOG_LEVEL=INFO
ENV MCP_CACHE_TTL=3600

EXPOSE 3000

CMD ["mcp-camara"]
```

**Build and run**:
```bash
docker build -t mcp-camara .
docker run -p 3000:3000 \
  -e MCP_TRANSPORT=http \
  -e LOG_LEVEL=DEBUG \
  mcp-camara
```

### Reverse Proxy

#### nginx

```nginx
server {
    listen 80;
    server_name api.example.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

#### Apache

```apache
<VirtualHost *:80>
    ServerName api.example.com
    
    ProxyPreserveHost On
    ProxyPass / http://localhost:3000/
    ProxyPassReverse / http://localhost:3000/
    
    <Proxy *>
        Order deny,allow
        Allow from all
    </Proxy>
</VirtualHost>
```

### Load Balancing

#### nginx load balancer

```nginx
upstream mcp_backend {
    least_conn;
    server localhost:3000;
    server localhost:3001;
    server localhost:3002;
}

server {
    listen 80;
    
    location / {
        proxy_pass http://mcp_backend;
    }
}
```

## Configuration Examples

### Development Setup

```bash
# .env.development
MCP_TRANSPORT=http
MCP_HTTP_PORT=3000
LOG_LEVEL=DEBUG
MCP_DISABLE_CACHE=true
MCP_DISABLE_RATE_LIMIT=true
```

### Production Setup

```bash
# .env.production
MCP_TRANSPORT=http
MCP_HTTP_PORT=3000
LOG_LEVEL=WARN
MCP_CACHE_TTL=3600
MCP_DISABLE_CACHE=false
MCP_DISABLE_RATE_LIMIT=false
MCP_API_KEY=your-production-api-key
```

### High-Performance Setup

```bash
# .env.performance
MCP_TRANSPORT=http
MCP_HTTP_PORT=3000
LOG_LEVEL=ERROR
MCP_CACHE_TTL=7200
MCP_DISABLE_CACHE=false
MCP_DISABLE_RATE_LIMIT=false
```

### Testing Setup

```bash
# .env.test
MCP_TRANSPORT=http
MCP_HTTP_PORT=3000
LOG_LEVEL=DEBUG
MCP_DISABLE_CACHE=true
MCP_DISABLE_RATE_LIMIT=true
CAMARA_API_BASE_URL=http://localhost:8080/mock-api
```

## Troubleshooting Configuration

### Configuration Not Applied

1. **Check environment variables are set**:
```bash
env | grep MCP
```

2. **Verify no typos**:
```bash
# Wrong
export MCP_TRANSPORT=HTTP  # Case-sensitive!

# Correct
export MCP_TRANSPORT=http
```

3. **Restart server after changes**:
```bash
# Stop current server (Ctrl+C)
# Start with new configuration
npx @aredes.me/mcp-camara
```

### Port Conflicts

```bash
# Check if port is in use
lsof -i :3000

# Use different port
export MCP_HTTP_PORT=3001
```

### Permission Issues

```bash
# Can't bind to port <1024 without sudo
# Use port ≥1024 or run with sudo (not recommended)
export MCP_HTTP_PORT=3000
```

## Resources

- [Usage Examples](./USAGE_EXAMPLES.md)
- [API Documentation](./API.md)
- [Cloudflare Deployment Guide](./CLOUDFLARE_DEPLOYMENT.md)
- [Troubleshooting Guide](./TROUBLESHOOTING.md)
- [HTTP Transport Guide](./HTTP_TRANSPORT.md)
- [SSE Transport Guide](./SSE_TRANSPORT.md)
