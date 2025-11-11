# Troubleshooting Guide

Common issues and solutions for the Câmara dos Deputados MCP Server.

## Table of Contents

- [Installation Issues](#installation-issues)
- [Configuration Issues](#configuration-issues)
- [Runtime Errors](#runtime-errors)
- [Performance Issues](#performance-issues)
- [API Errors](#api-errors)
- [Deployment Issues](#deployment-issues)
- [Integration Issues](#integration-issues)

## Installation Issues

### NPM Install Fails

**Symptoms:**
- `npm install` fails with dependency errors
- Missing packages or version conflicts

**Solutions:**

1. **Clear npm cache:**
```bash
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

2. **Check Node.js version:**
```bash
node --version  # Should be 18 or higher
```

3. **Update npm:**
```bash
npm install -g npm@latest
```

4. **Use specific Node version:**
```bash
nvm install 18
nvm use 18
npm install
```

### NPX Command Not Found

**Symptoms:**
- `npx @aredes.me/mcp-camara` fails
- Command not recognized

**Solutions:**

1. **Install npm globally:**
```bash
npm install -g npm
```

2. **Use full path:**
```bash
$(npm bin -g)/npx @aredes.me/mcp-camara
```

3. **Install package globally:**
```bash
npm install -g @aredes.me/mcp-camara
mcp-camara
```

## Configuration Issues

### Environment Variables Not Loading

**Symptoms:**
- Server uses default values instead of configured ones
- Configuration changes have no effect

**Solutions:**

1. **Check environment variable syntax:**
```bash
# Correct
export MCP_TRANSPORT=http
export MCP_HTTP_PORT=3000

# Incorrect (no spaces around =)
export MCP_TRANSPORT = http
```

2. **Verify variables are set:**
```bash
echo $MCP_TRANSPORT
echo $MCP_HTTP_PORT
```

3. **Use .env file (if supported):**
```bash
# Create .env file
cat > .env << EOF
MCP_TRANSPORT=http
MCP_HTTP_PORT=3000
EOF

# Load and run
source .env
npx @aredes.me/mcp-camara
```

### Invalid Transport Configuration

**Symptoms:**
- Server fails to start
- "Invalid transport" error

**Solutions:**

1. **Use valid transport values:**
```bash
# Valid options: stdio, http, sse
export MCP_TRANSPORT=stdio  # Default
export MCP_TRANSPORT=http   # HTTP server
export MCP_TRANSPORT=sse    # Server-Sent Events
```

2. **Check for typos:**
```bash
# Wrong
export MCP_TRANSPORT=HTTP  # Case-sensitive!

# Correct
export MCP_TRANSPORT=http
```

### Port Already in Use

**Symptoms:**
- "EADDRINUSE" error
- "Port 3000 is already in use"

**Solutions:**

1. **Use different port:**
```bash
export MCP_HTTP_PORT=3001
npx @aredes.me/mcp-camara
```

2. **Find and kill process using port:**
```bash
# macOS/Linux
lsof -ti:3000 | xargs kill -9

# Or use different port
netstat -an | grep 3000
```

3. **Check for other servers:**
```bash
ps aux | grep mcp-camara
kill <process-id>
```

## Runtime Errors

### Validation Errors

**Symptoms:**
- "Validation error" in tool responses
- Invalid parameter messages

**Common Issues and Fixes:**

1. **Invalid date format:**
```
Error: Validation error: dataInicio must match YYYY-MM-DD format

Solution: Use correct format
Wrong: 15/03/2024, 2024-3-15
Right: 2024-03-15
```

2. **Invalid state code:**
```
Error: Validation error: siglaUf must be a valid state code

Solution: Use valid UF codes (SP, RJ, MG, etc.)
First get valid codes: referencias_ufs
Then use in query
```

3. **Invalid pagination:**
```
Error: Validation error: itens must be between 1 and 100

Solution: Use valid page size
Wrong: itens: 150
Right: itens: 100
```

4. **Missing required parameter:**
```
Error: Validation error: id is required

Solution: Include required parameters
Wrong: deputado_detalhes({})
Right: deputado_detalhes({ id: 204554 })
```

### API Connection Errors

**Symptoms:**
- "Network error" or "Connection refused"
- Timeout errors

**Solutions:**

1. **Check internet connection:**
```bash
ping dadosabertos.camara.leg.br
```

2. **Verify API is accessible:**
```bash
curl https://dadosabertos.camara.leg.br/api/v2/deputados
```

3. **Check firewall settings:**
- Allow outbound HTTPS connections
- Whitelist dadosabertos.camara.leg.br

4. **Increase timeout (if needed):**
- Default is 30 seconds
- API may be slow during peak hours

### Rate Limit Errors

**Symptoms:**
- "429 Too Many Requests"
- "Rate limit exceeded"

**Solutions:**

1. **Wait for reset:**
```
Check X-RateLimit-Reset header
Wait until reset time (60 seconds max)
```

2. **Use API key for higher limits:**
```bash
export MCP_API_KEY=your-api-key
# Increases limit from 30 to 100 requests/minute
```

3. **Disable rate limiting (development only):**
```bash
export MCP_DISABLE_RATE_LIMIT=true
```

4. **Implement exponential backoff:**
```
First retry: Wait 1 second
Second retry: Wait 2 seconds
Third retry: Wait 4 seconds
```

### Cache Errors

**Symptoms:**
- "Cache error" in logs
- Stale data returned

**Solutions:**

1. **Clear cache (restart server):**
```bash
# CLI: Stop and restart
Ctrl+C
npx @aredes.me/mcp-camara

# Workers: Redeploy
npm run workers:deploy:prod
```

2. **Disable cache temporarily:**
```bash
export MCP_DISABLE_CACHE=true
```

3. **Adjust cache TTL:**
```bash
export MCP_CACHE_TTL=1800  # 30 minutes instead of 1 hour
```

4. **Check memory usage:**
```bash
# If cache is too large, reduce TTL or restart
ps aux | grep mcp-camara
```

## Performance Issues

### Slow Response Times

**Symptoms:**
- Requests take >5 seconds
- Timeouts on large queries

**Solutions:**

1. **Use pagination:**
```
Wrong: Get all deputies (thousands of results)
Right: Get 50 deputies per page
```

2. **Add filters:**
```
Wrong: proposicoes_listar({})
Right: proposicoes_listar({ siglaUf: "SP", ano: 2024 })
```

3. **Check cache hit rate:**
```bash
# Enable debug logging
export LOG_LEVEL=DEBUG

# Look for "Cache hit" vs "Cache miss" in logs
```

4. **Reduce date ranges:**
```
Wrong: dataInicio: "2000-01-01", dataFim: "2024-12-31"
Right: dataInicio: "2024-01-01", dataFim: "2024-03-31"
```

### High Memory Usage

**Symptoms:**
- Server crashes with "Out of memory"
- System becomes slow

**Solutions:**

1. **Reduce cache size:**
```bash
# Reduce TTL to expire entries faster
export MCP_CACHE_TTL=1800  # 30 minutes

# Or disable cache
export MCP_DISABLE_CACHE=true
```

2. **Use smaller page sizes:**
```
Wrong: itens: 100 (maximum)
Right: itens: 20 (reasonable)
```

3. **Restart server periodically:**
```bash
# For long-running servers
# Set up cron job or process manager
```

4. **Use Cloudflare Workers:**
```
Workers have automatic memory management
No memory leaks or accumulation
```

## API Errors

### 404 Not Found

**Symptoms:**
- "Resource not found"
- "Deputy/Proposition/Event not found"

**Solutions:**

1. **Verify ID exists:**
```
Use list tools first to find valid IDs
deputados_listar({ nome: "Silva" })
Then use ID from results
```

2. **Check ID format:**
```
Deputy IDs: Numbers (204554)
Voting IDs: Strings ("2345678-12")
Ensure correct format for each tool
```

3. **Try alternative search:**
```
If ID doesn't work, search by name/number
proposicoes_listar({ numero: 1234, ano: 2024 })
```

### 500 Internal Server Error

**Symptoms:**
- "Câmara API is temporarily unavailable"
- "Internal server error"

**Solutions:**

1. **Retry after delay:**
```
Wait 5-10 seconds
Retry request
API may be temporarily overloaded
```

2. **Check API status:**
```bash
curl https://dadosabertos.camara.leg.br/api/v2/deputados
# If this fails, API is down
```

3. **Try different endpoint:**
```
If one tool fails, try another
May be specific endpoint issue
```

4. **Report persistent issues:**
```
If error persists >1 hour
Contact Câmara API support
Or wait for resolution
```

### 400 Bad Request

**Symptoms:**
- "Invalid request"
- "Bad request" error

**Solutions:**

1. **Check parameter format:**
```
Ensure all parameters match expected types
Numbers should be numbers, not strings
Dates should be YYYY-MM-DD format
```

2. **Remove invalid parameters:**
```
API may reject unknown parameters
Use only documented parameters
```

3. **Check parameter combinations:**
```
Some parameter combinations may be invalid
Try simpler query first
```

## Deployment Issues

### Cloudflare Workers Deployment Fails

**Symptoms:**
- `wrangler deploy` fails
- Build errors during deployment
- Authentication errors
- KV namespace errors

**Solutions:**

1. **Check wrangler authentication:**
```bash
npx wrangler whoami
# If not logged in:
npx wrangler login
```

2. **Verify KV namespaces exist:**
```bash
npx wrangler kv:namespace list
# Ensure IDs in wrangler.toml match

# Create if missing
npm run workers:kv:create
```

3. **Check build locally:**
```bash
npm run build
# Fix any TypeScript errors

# Verify build output
ls -la build/lib/workers/worker.js
```

4. **Update wrangler:**
```bash
npm install -D wrangler@latest
```

5. **Check account limits:**
```
Free tier: 100,000 requests/day
Verify you haven't exceeded limits
Check Cloudflare dashboard for quota
```

6. **Verify wrangler.toml configuration:**
```bash
# Check for syntax errors
cat wrangler.toml

# Ensure KV namespace IDs are correct
# Ensure compatibility_date is valid
# Ensure main points to correct file
```

### Workers Runtime Errors

**Symptoms:**
- Workers deploy but return errors
- 500 errors from Workers URL
- Timeout errors
- KV errors

**Solutions:**

1. **Check Workers logs:**
```bash
npm run workers:tail:prod
# Look for error messages

# Filter by error status
npx wrangler tail --env production --status error
```

2. **Verify environment variables:**
```bash
npx wrangler secret list --env production
# Ensure MCP_API_KEY is set if needed

# Check vars in wrangler.toml
cat wrangler.toml | grep -A 10 "env.production.vars"
```

3. **Test locally first:**
```bash
npm run workers:dev
# Test at http://localhost:8787

# Test health endpoint
curl http://localhost:8787/health

# Test MCP endpoint
curl -X POST http://localhost:8787/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}'
```

4. **Check KV bindings:**
```bash
# Verify KV namespaces are bound correctly
npx wrangler kv:namespace list

# Check wrangler.toml configuration
# Ensure binding names match code (MCP_CACHE, RATE_LIMIT_KV)
```

5. **Verify KV namespace access:**
```bash
# Test KV read/write
npx wrangler kv:key put "test" "value" --binding MCP_CACHE --env production
npx wrangler kv:key get "test" --binding MCP_CACHE --env production
npx wrangler kv:key delete "test" --binding MCP_CACHE --env production
```

6. **Check CPU time limits:**
```
Workers have 50ms CPU time limit (free tier)
Check dashboard for CPU time usage
Optimize code if exceeding limits
```

### Workers KV Issues

**Symptoms:**
- Cache not working
- Rate limiting not working
- KV read/write errors

**Solutions:**

1. **Verify KV namespace IDs:**
```bash
# List all namespaces
npx wrangler kv:namespace list

# Compare with wrangler.toml
# Ensure IDs match exactly
```

2. **Check KV storage limits:**
```
Free tier: 1 GB storage
Check usage in Cloudflare dashboard
Clear old data if needed
```

3. **Check KV operation limits:**
```
Free tier:
- 1,000 writes/day
- 100,000 reads/day

Check usage in dashboard
Optimize cache strategy if needed
```

4. **Test KV operations:**
```bash
# Write test data
npx wrangler kv:key put "test-key" "test-value" \
  --binding MCP_CACHE --env production

# Read test data
npx wrangler kv:key get "test-key" \
  --binding MCP_CACHE --env production

# List keys
npx wrangler kv:key list \
  --binding MCP_CACHE --env production
```

5. **Clear KV cache:**
```bash
# List all keys
npx wrangler kv:key list --binding MCP_CACHE --env production > keys.json

# Delete specific key
npx wrangler kv:key delete "cache:key" \
  --binding MCP_CACHE --env production

# Or recreate namespace to clear all
npx wrangler kv:namespace delete --binding MCP_CACHE --env production
npm run workers:kv:create:prod
# Update wrangler.toml with new ID
```

### Workers Performance Issues

**Symptoms:**
- Slow response times
- Timeout errors
- High CPU usage

**Solutions:**

1. **Check Câmara API response time:**
```bash
# Test API directly
time curl https://dadosabertos.camara.leg.br/api/v2/deputados?itens=1

# If slow, issue is with Câmara API
```

2. **Verify cache is working:**
```bash
# Enable debug logging
# Check Workers logs for cache hits
npm run workers:tail:prod

# Look for "Cache hit" vs "Cache miss"
```

3. **Check CPU time in dashboard:**
```
Go to Workers & Pages → Your Worker → Metrics
Check CPU time (p50, p99)
If >50ms, optimize code
```

4. **Optimize cache TTL:**
```toml
# In wrangler.toml
[env.production.vars]
MCP_CACHE_TTL = "7200"  # Increase to 2 hours
```

5. **Review request patterns:**
```bash
# Check logs for repeated requests
npm run workers:tail:prod

# Implement client-side caching if needed
```

### Workers Deployment Rollback

**Symptoms:**
- New deployment has issues
- Need to revert to previous version

**Solutions:**

1. **List deployments:**
```bash
npx wrangler deployments list --env production
```

2. **Rollback to previous version:**
```bash
npx wrangler rollback --env production
```

3. **Deploy specific version:**
```bash
# Get deployment ID from list
npx wrangler deployments view <deployment-id> --env production
```

### Workers Custom Domain Issues

**Symptoms:**
- Custom domain not working
- SSL errors
- DNS errors

**Solutions:**

1. **Verify domain is added:**
```
Go to Workers & Pages → Your Worker → Triggers
Check custom domains list
```

2. **Check DNS configuration:**
```bash
# Verify DNS points to Workers
dig api.yourdomain.com

# Should show Cloudflare IPs
```

3. **Wait for DNS propagation:**
```
DNS changes can take up to 48 hours
Use DNS checker: dnschecker.org
```

4. **Check SSL certificate:**
```
Cloudflare provides automatic SSL
Verify certificate is active in dashboard
```

### Workers Secrets Issues

**Symptoms:**
- API key not working
- Secrets not accessible
- Authentication errors

**Solutions:**

1. **Verify secret is set:**
```bash
npx wrangler secret list --env production
# Should show MCP_API_KEY
```

2. **Re-set secret:**
```bash
npx wrangler secret delete MCP_API_KEY --env production
npx wrangler secret put MCP_API_KEY --env production
# Enter new value
```

3. **Check secret access in code:**
```typescript
// In worker.ts
const apiKey = env.MCP_API_KEY;
if (!apiKey) {
  console.error('MCP_API_KEY not set');
}
```

4. **Redeploy after setting secrets:**
```bash
npm run workers:deploy:prod
```

## Integration Issues

### Claude Desktop Not Connecting

**Symptoms:**
- Tools don't appear in Claude
- Connection errors in Claude

**Solutions:**

1. **Check configuration file:**
```json
// ~/Library/Application Support/Claude/claude_desktop_config.json
{
  "mcpServers": {
    "camara": {
      "command": "npx",
      "args": ["@aredes.me/mcp-camara"]
    }
  }
}
```

2. **Verify command works:**
```bash
npx @aredes.me/mcp-camara
# Should start without errors
```

3. **Check Claude logs:**
```
Look for error messages in Claude
May indicate configuration issues
```

4. **Restart Claude:**
```
Quit Claude completely
Restart application
Wait for MCP server to initialize
```

### Cursor Not Recognizing Tools

**Symptoms:**
- MCP tools not available in Cursor
- Connection fails

**Solutions:**

1. **Check Cursor MCP settings:**
```
Open Cursor settings
Navigate to MCP configuration
Verify server is configured
```

2. **Use absolute path:**
```json
{
  "mcpServers": {
    "camara": {
      "command": "/usr/local/bin/npx",
      "args": ["@aredes.me/mcp-camara"]
    }
  }
}
```

3. **Check Cursor version:**
```
Ensure Cursor supports MCP
Update to latest version if needed
```

4. **Restart Cursor:**
```
Quit and restart Cursor
Wait for server initialization
```

### HTTP Client Connection Issues

**Symptoms:**
- Can't connect to HTTP endpoint
- CORS errors in browser

**Solutions:**

1. **Verify server is running:**
```bash
curl http://localhost:3000/health
# Should return health status
```

2. **Check CORS configuration:**
```
Server includes CORS headers by default
If using custom client, check headers
```

3. **Use correct endpoint:**
```
MCP Protocol: POST /mcp
REST API: GET /deputados/{id}
Health: GET /health
```

4. **Check firewall:**
```
Ensure port is not blocked
Allow incoming connections on configured port
```

## Getting Help

If you can't resolve your issue:

1. **Check documentation:**
   - [Usage Examples](./USAGE_EXAMPLES.md)
   - [API Documentation](./API.md)
   - [Configuration Guide](./CONFIGURATION.md)

2. **Enable debug logging:**
```bash
export LOG_LEVEL=DEBUG
npx @aredes.me/mcp-camara
```

3. **Collect information:**
   - Error messages (full text)
   - Configuration (remove sensitive data)
   - Steps to reproduce
   - Environment (OS, Node version, etc.)

4. **Report issue:**
   - GitHub Issues: https://github.com/aredes/mcp-camara/issues
   - Include collected information
   - Describe expected vs actual behavior

5. **Community support:**
   - Check existing GitHub issues
   - Search for similar problems
   - Ask in discussions

## Preventive Measures

### Best Practices

1. **Always validate inputs before calling tools**
2. **Use reference tools to get valid codes**
3. **Implement proper error handling**
4. **Monitor rate limits and cache performance**
5. **Keep dependencies updated**
6. **Test changes in development first**
7. **Use appropriate log levels**
8. **Document custom configurations**

### Monitoring

1. **Set up health checks:**
```bash
# Cron job to check health
*/5 * * * * curl http://localhost:3000/health
```

2. **Monitor logs:**
```bash
# Tail logs in production
tail -f /var/log/mcp-camara.log
```

3. **Track metrics:**
```
- Request count
- Error rate
- Response times
- Cache hit rate
- Rate limit hits
```

4. **Set up alerts:**
```
- High error rate
- Service down
- Rate limit exceeded
- High memory usage
```
