# Cloudflare Workers Deployment Guide

Deploy the Câmara MCP Server to Cloudflare Workers for a globally distributed, scalable API with automatic scaling and edge caching.

## Table of Contents

- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [Initial Setup](#initial-setup)
- [Configuration](#configuration)
- [Deployment](#deployment)
- [Testing](#testing)
- [Monitoring](#monitoring)
- [Troubleshooting](#troubleshooting)
- [Best Practices](#best-practices)

## Overview

Cloudflare Workers deployment provides:

- **Global Distribution**: Deploy to 300+ edge locations worldwide
- **Automatic Scaling**: Handle any traffic volume without configuration
- **Edge Caching**: KV-backed distributed cache for optimal performance
- **Zero Cold Starts**: Workers are always warm and ready
- **Cost Effective**: Free tier includes 100,000 requests/day
- **REST API**: Expose REST endpoints in addition to MCP protocol

### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Cloudflare Edge Network                   │
│                    (300+ Locations)                          │
└────────────────────────┬────────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────────┐
│                  Cloudflare Worker                           │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  MCP Server                                           │  │
│  │  - 62 Tools                                           │  │
│  │  - Input Validation                                   │  │
│  │  - Error Handling                                     │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  KV Cache                                             │  │
│  │  - Distributed caching                                │  │
│  │  - 1-hour TTL                                         │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  KV Rate Limiter                                      │  │
│  │  - Per-IP tracking                                    │  │
│  │  - Sliding window                                     │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────────┐
│              Câmara dos Deputados API                        │
│         https://dadosabertos.camara.leg.br/api/v2           │
└─────────────────────────────────────────────────────────────┘
```

## Prerequisites

### Required Tools

1. **Node.js 18 or higher**
```bash
node --version  # Should be 18.0.0 or higher
```

2. **npm or yarn**
```bash
npm --version
```

3. **Wrangler CLI** (Cloudflare Workers CLI)
```bash
npm install -g wrangler
# Or use npx: npx wrangler <command>
```

### Cloudflare Account

1. **Create account**: Sign up at [dash.cloudflare.com](https://dash.cloudflare.com)
2. **Get Account ID**: Found in Workers & Pages dashboard
3. **Get API Token**: Create token with Workers permissions

## Initial Setup

### 1. Clone and Install

```bash
# Clone the repository (or use your existing installation)
git clone https://github.com/aredes/mcp-camara.git
cd mcp-camara

# Install dependencies
npm install
```

### 2. Authenticate Wrangler

```bash
# Login to Cloudflare
npx wrangler login

# Verify authentication
npx wrangler whoami
```

Expected output:
```
 ⛅️ wrangler 3.x.x
-------------------
Getting User settings...
👋 You are logged in with an OAuth Token, associated with the email 'your-email@example.com'!
┌──────────────────────┬──────────────────────────────────┐
│ Account Name         │ Account ID                        │
├──────────────────────┼──────────────────────────────────┤
│ Your Account         │ abc123def456...                   │
└──────────────────────┴──────────────────────────────────┘
```

### 3. Create KV Namespaces

KV namespaces provide distributed storage for cache and rate limiting.

```bash
# Create all KV namespaces (development and production)
npm run workers:kv:create
```

Or create manually:

```bash
# Development namespaces
npx wrangler kv:namespace create MCP_CACHE
npx wrangler kv:namespace create RATE_LIMIT_KV

# Production namespaces
npx wrangler kv:namespace create MCP_CACHE --env production
npx wrangler kv:namespace create RATE_LIMIT_KV --env production
```

Expected output:
```
🌀 Creating namespace with title "mcp-camara-dev-MCP_CACHE"
✨ Success!
Add the following to your configuration file in your kv_namespaces array:
{ binding = "MCP_CACHE", id = "abc123..." }
```

### 4. Update wrangler.toml

Copy the KV namespace IDs from the output above and update `wrangler.toml`:

```toml
# Development environment
[env.development]
name = "mcp-camara-dev"

[[env.development.kv_namespaces]]
binding = "MCP_CACHE"
id = "YOUR_DEV_CACHE_KV_ID"  # Replace with actual ID

[[env.development.kv_namespaces]]
binding = "RATE_LIMIT_KV"
id = "YOUR_DEV_RATE_LIMIT_KV_ID"  # Replace with actual ID

# Production environment
[env.production]
name = "mcp-camara"

[[env.production.kv_namespaces]]
binding = "MCP_CACHE"
id = "YOUR_PROD_CACHE_KV_ID"  # Replace with actual ID

[[env.production.kv_namespaces]]
binding = "RATE_LIMIT_KV"
id = "YOUR_PROD_RATE_LIMIT_KV_ID"  # Replace with actual ID
```

## Configuration

### Environment Variables

Configure in `wrangler.toml` under `[env.development.vars]` or `[env.production.vars]`:

```toml
[env.production.vars]
CAMARA_API_BASE_URL = "https://dadosabertos.camara.leg.br/api/v2"
MCP_CACHE_TTL = "3600"
LOG_LEVEL = "INFO"
MCP_DISABLE_RATE_LIMIT = "false"
```

### Secrets

For sensitive data like API keys, use Wrangler secrets:

```bash
# Set API key for production
npx wrangler secret put MCP_API_KEY --env production
# Enter your API key when prompted

# Set API key for development
npx wrangler secret put MCP_API_KEY --env development
```

List secrets:
```bash
npx wrangler secret list --env production
```

Delete secrets:
```bash
npx wrangler secret delete MCP_API_KEY --env production
```

### Custom Domain (Optional)

1. **Add domain in Cloudflare dashboard**:
   - Go to Workers & Pages
   - Select your worker
   - Click "Triggers" tab
   - Add custom domain

2. **Or use wrangler.toml**:
```toml
[env.production]
routes = [
  { pattern = "api.yourdomain.com/*", zone_name = "yourdomain.com" }
]
```

## Deployment

### Build the Project

```bash
# Build TypeScript to JavaScript
npm run build
```

Verify build output in `build/` directory:
```bash
ls -la build/lib/workers/
# Should see worker.js
```

### Deploy to Development

```bash
# Deploy to development environment
npm run workers:deploy:dev

# Or using wrangler directly
npx wrangler deploy --env development
```

Expected output:
```
 ⛅️ wrangler 3.x.x
-------------------
Total Upload: xx.xx KiB / gzip: xx.xx KiB
Uploaded mcp-camara-dev (x.xx sec)
Published mcp-camara-dev (x.xx sec)
  https://mcp-camara-dev.your-subdomain.workers.dev
Current Deployment ID: abc123...
```

### Deploy to Production

```bash
# Deploy to production environment
npm run workers:deploy:prod

# Or using wrangler directly
npx wrangler deploy --env production
```

### Verify Deployment

Test the deployed worker:

```bash
# Health check
curl https://mcp-camara.your-subdomain.workers.dev/health

# OpenAPI spec
curl https://mcp-camara.your-subdomain.workers.dev/openapi.json

# REST API endpoint
curl https://mcp-camara.your-subdomain.workers.dev/deputados/204554
```

## Testing

### Local Development

Test locally before deploying:

```bash
# Start local Workers development server
npm run workers:dev

# Server runs at http://localhost:8787
```

Test endpoints:
```bash
# Health check
curl http://localhost:8787/health

# MCP protocol
curl -X POST http://localhost:8787/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/list",
    "params": {}
  }'

# REST API
curl http://localhost:8787/deputados/204554
```

### Integration Testing

Test with real AI assistants:

1. **Update Claude Desktop config** to use Workers URL:
```json
{
  "mcpServers": {
    "camara": {
      "command": "npx",
      "args": ["@modelcontextprotocol/client", "https://mcp-camara.your-subdomain.workers.dev"]
    }
  }
}
```

2. **Test with curl**:
```bash
# List tools
curl -X POST https://mcp-camara.your-subdomain.workers.dev/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/list",
    "params": {}
  }'

# Call a tool
curl -X POST https://mcp-camara.your-subdomain.workers.dev/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 2,
    "method": "tools/call",
    "params": {
      "name": "deputados_listar",
      "arguments": {
        "siglaUf": "SP",
        "itens": 5
      }
    }
  }'
```

### Load Testing

Test performance under load:

```bash
# Install Apache Bench
# macOS: brew install httpd
# Linux: apt-get install apache2-utils

# Test health endpoint
ab -n 1000 -c 10 https://mcp-camara.your-subdomain.workers.dev/health

# Test REST API
ab -n 100 -c 5 https://mcp-camara.your-subdomain.workers.dev/deputados/204554
```

## Monitoring

### View Logs

Real-time logs:
```bash
# Production logs
npm run workers:tail:prod

# Development logs
npm run workers:tail

# Or with wrangler
npx wrangler tail --env production
```

Filter logs:
```bash
# Only errors
npx wrangler tail --env production --status error

# Specific method
npx wrangler tail --env production --method POST

# IP address
npx wrangler tail --env production --ip-address 1.2.3.4
```

### Cloudflare Dashboard

Monitor in the Cloudflare dashboard:

1. **Go to Workers & Pages**
2. **Select your worker**
3. **View metrics**:
   - Requests per second
   - Error rate
   - CPU time
   - Duration (p50, p99)

### Analytics

View detailed analytics:

```bash
# Get analytics for last 24 hours
npx wrangler analytics --env production
```

Metrics available:
- Total requests
- Success rate
- Error rate
- Average duration
- Data transfer

### Alerts

Set up alerts in Cloudflare dashboard:

1. **Go to Notifications**
2. **Create notification**
3. **Select trigger**:
   - High error rate
   - Traffic spike
   - Worker failure
4. **Configure delivery** (email, webhook, PagerDuty)

## Troubleshooting

### Deployment Fails

**Error: "Authentication error"**
```bash
# Re-authenticate
npx wrangler logout
npx wrangler login
```

**Error: "KV namespace not found"**
```bash
# List namespaces
npx wrangler kv:namespace list

# Verify IDs in wrangler.toml match
# Update wrangler.toml with correct IDs
```

**Error: "Build failed"**
```bash
# Clean and rebuild
rm -rf build node_modules
npm install
npm run build
```

### Runtime Errors

**Error: "KV is undefined"**
- Verify KV namespaces are bound in wrangler.toml
- Check binding names match code (MCP_CACHE, RATE_LIMIT_KV)
- Redeploy after fixing configuration

**Error: "Rate limit exceeded"**
- Check rate limiter configuration
- Verify KV namespace for rate limiting exists
- Consider increasing limits or using API key

**Error: "Cache not working"**
- Check KV namespace for cache exists
- Verify cache TTL is set correctly
- Check KV storage limits (not exceeded)

### Performance Issues

**Slow response times**:
1. Check Câmara API response time (may be slow)
2. Verify cache is working (check KV hits)
3. Review Worker CPU time in dashboard
4. Consider adding more aggressive caching

**High error rate**:
1. Check Worker logs for errors
2. Verify Câmara API is accessible
3. Check rate limiting configuration
4. Review validation errors

### KV Issues

**Check KV storage**:
```bash
# List keys in namespace
npx wrangler kv:key list --binding MCP_CACHE --env production

# Get specific key
npx wrangler kv:key get "cache:key" --binding MCP_CACHE --env production

# Delete key
npx wrangler kv:key delete "cache:key" --binding MCP_CACHE --env production
```

**Clear all cache**:
```bash
# List all keys
npx wrangler kv:key list --binding MCP_CACHE --env production > keys.json

# Delete each key (requires scripting)
# Or delete and recreate namespace
```

## Best Practices

### Security

1. **Use API keys for authentication**:
```bash
npx wrangler secret put MCP_API_KEY --env production
```

2. **Implement rate limiting**:
```toml
[env.production.vars]
MCP_DISABLE_RATE_LIMIT = "false"
```

3. **Monitor for abuse**:
- Check logs for suspicious patterns
- Set up alerts for high error rates
- Review rate limit hits

### Performance

1. **Optimize cache TTL**:
```toml
# Balance freshness vs performance
MCP_CACHE_TTL = "3600"  # 1 hour for most data
```

2. **Use pagination**:
- Limit result sizes
- Implement proper pagination
- Cache paginated results

3. **Monitor KV usage**:
- Check storage limits
- Review read/write operations
- Optimize cache keys

### Cost Optimization

1. **Free tier limits**:
   - 100,000 requests/day
   - 1 GB KV storage
   - 1,000 KV writes/day
   - 100,000 KV reads/day

2. **Optimize KV usage**:
   - Use appropriate TTL
   - Avoid unnecessary writes
   - Batch operations when possible

3. **Monitor usage**:
```bash
# Check current usage in dashboard
# Set up alerts before hitting limits
```

### Deployment Strategy

1. **Test in development first**:
```bash
npm run workers:deploy:dev
# Test thoroughly
npm run workers:deploy:prod
```

2. **Use gradual rollout**:
- Deploy to development
- Test with subset of users
- Monitor for issues
- Deploy to production

3. **Maintain rollback capability**:
```bash
# List deployments
npx wrangler deployments list --env production

# Rollback to previous version
npx wrangler rollback --env production
```

### Monitoring and Maintenance

1. **Regular health checks**:
```bash
# Set up external monitoring
# Ping /health endpoint every 5 minutes
```

2. **Review logs weekly**:
```bash
# Check for errors and warnings
npx wrangler tail --env production --status error
```

3. **Update dependencies**:
```bash
# Monthly updates
npm update
npm run build
npm run workers:deploy:prod
```

4. **Monitor Câmara API changes**:
- Subscribe to API updates
- Test after API changes
- Update code if needed

## Advanced Configuration

### Custom Worker Name

```toml
[env.production]
name = "my-custom-name"
```

### Multiple Environments

```toml
[env.staging]
name = "mcp-camara-staging"
# ... staging configuration

[env.production]
name = "mcp-camara"
# ... production configuration
```

Deploy to staging:
```bash
npx wrangler deploy --env staging
```

### Worker Routes

Route specific paths to your worker:

```toml
[env.production]
routes = [
  { pattern = "api.example.com/mcp/*", zone_name = "example.com" },
  { pattern = "api.example.com/deputados/*", zone_name = "example.com" }
]
```

### Durable Objects (Future)

For advanced state management:

```toml
[[durable_objects.bindings]]
name = "RATE_LIMITER"
class_name = "RateLimiter"
script_name = "mcp-camara"
```

## Resources

- [Cloudflare Workers Documentation](https://developers.cloudflare.com/workers/)
- [Wrangler CLI Documentation](https://developers.cloudflare.com/workers/wrangler/)
- [KV Storage Documentation](https://developers.cloudflare.com/kv/)
- [Workers Pricing](https://developers.cloudflare.com/workers/platform/pricing/)
- [Configuration Guide](./CONFIGURATION.md)
- [Troubleshooting Guide](./TROUBLESHOOTING.md)

## Support

For deployment issues:

1. **Check Cloudflare Status**: [cloudflarestatus.com](https://www.cloudflarestatus.com/)
2. **Cloudflare Community**: [community.cloudflare.com](https://community.cloudflare.com/)
3. **GitHub Issues**: [github.com/aredes/mcp-camara/issues](https://github.com/aredes/mcp-camara/issues)
4. **Cloudflare Support**: Available for paid plans
