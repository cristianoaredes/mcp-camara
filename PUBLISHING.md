# Publishing Guide

This guide covers how to publish the MCP Câmara dos Deputados server to both NPM and Cloudflare Workers.

## Prerequisites

### For NPM Publishing
- NPM account (create at https://www.npmjs.com/signup)
- NPM authentication token or logged in via `npm login`
- Write access to the `@aredes.me` scope (or change package name)

### For Cloudflare Workers Publishing
- Cloudflare account (create at https://dash.cloudflare.com/sign-up)
- Wrangler CLI installed (already done: `npm install -g wrangler`)
- Authenticated with Cloudflare: `wrangler login`

---

## 📦 Publishing to NPM

### Step 1: Verify Package Configuration

Check that `package.json` has correct information:
- Package name: `@aredes.me/mcp-camara`
- Version: Update according to semver
- Repository URL
- Author information

### Step 2: Login to NPM

```bash
npm login
```

Enter your NPM credentials when prompted.

### Step 3: Build the Project

```bash
npm run build
```

This compiles TypeScript to JavaScript in the `build/` directory.

### Step 4: Test the Package Locally (Optional)

```bash
# Create a tarball
npm pack

# This creates a file like: aredes.me-mcp-camara-1.0.0.tgz
# You can test it in another directory:
# npm install /path/to/aredes.me-mcp-camara-1.0.0.tgz
```

### Step 5: Publish to NPM

```bash
# For first-time publishing or public packages
npm publish --access public

# For subsequent updates (after version bump)
npm publish
```

### Step 6: Verify Publication

```bash
# Check on NPM
npm view @aredes.me/mcp-camara

# Test installation
npx @aredes.me/mcp-camara --version
```

---

## ☁️ Publishing to Cloudflare Workers

### Step 1: Login to Cloudflare

```bash
wrangler login
```

This opens a browser window for authentication.

### Step 2: Create KV Namespaces

Create the required KV namespaces for caching and rate limiting:

```bash
# Development environment
wrangler kv:namespace create MCP_CACHE
wrangler kv:namespace create RATE_LIMIT_KV

# Production environment
wrangler kv:namespace create MCP_CACHE --env production
wrangler kv:namespace create RATE_LIMIT_KV --env production
```

**Important:** Copy the namespace IDs from the output and update `wrangler.toml`:

```toml
# Development
[[env.development.kv_namespaces]]
binding = "MCP_CACHE"
id = "abc123..." # Replace with your actual ID

[[env.development.kv_namespaces]]
binding = "RATE_LIMIT_KV"
id = "def456..." # Replace with your actual ID

# Production
[[env.production.kv_namespaces]]
binding = "MCP_CACHE"
id = "ghi789..." # Replace with your actual ID

[[env.production.kv_namespaces]]
binding = "RATE_LIMIT_KV"
id = "jkl012..." # Replace with your actual ID
```

### Step 3: Configure Secrets (Optional)

If you want to protect REST API endpoints with an API key:

```bash
# For production
wrangler secret put MCP_API_KEY --env production

# For development
wrangler secret put MCP_API_KEY --env development
```

Enter your desired API key when prompted.

### Step 4: Build the Project

```bash
npm run build
```

### Step 5: Test Locally (Optional)

```bash
# Test development environment locally
npm run workers:dev

# In another terminal, test the endpoints:
curl http://localhost:8787/health
curl http://localhost:8787/deputados/220593
```

### Step 6: Deploy to Development

```bash
npm run workers:deploy:dev
```

This deploys to `mcp-camara-dev.your-subdomain.workers.dev`

### Step 7: Test Development Deployment

```bash
# Get your worker URL from the deployment output
curl https://mcp-camara-dev.your-subdomain.workers.dev/health

# Test MCP endpoint
curl -X POST https://mcp-camara-dev.your-subdomain.workers.dev/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc": "2.0", "id": 1, "method": "tools/list"}'

# Test REST endpoint
curl https://mcp-camara-dev.your-subdomain.workers.dev/deputados/220593
```

### Step 8: Deploy to Production

Once you've verified the development deployment works:

```bash
npm run workers:deploy:prod
```

This deploys to `mcp-camara.your-subdomain.workers.dev`

### Step 9: Monitor Logs

```bash
# Development logs
npm run workers:tail

# Production logs
npm run workers:tail:prod
```

---

## 🔄 Version Management

### Updating the Version

Use semantic versioning (semver):

```bash
# Patch release (1.0.0 -> 1.0.1) - bug fixes
npm version patch

# Minor release (1.0.0 -> 1.1.0) - new features, backward compatible
npm version minor

# Major release (1.0.0 -> 2.0.0) - breaking changes
npm version major
```

This automatically:
1. Updates `package.json`
2. Creates a git commit
3. Creates a git tag

### Publishing a New Version

```bash
# 1. Update version
npm version patch  # or minor/major

# 2. Push to git
git push && git push --tags

# 3. Build
npm run build

# 4. Publish to NPM
npm publish

# 5. Deploy to Cloudflare Workers
npm run workers:deploy:prod
```

---

## 🔍 Verification Checklist

### Before Publishing to NPM
- [ ] All tests pass: `npm test`
- [ ] Build succeeds: `npm run build`
- [ ] README.md is up to date
- [ ] Version number is correct in package.json
- [ ] CHANGELOG.md is updated (if you have one)
- [ ] No sensitive data in the package

### Before Publishing to Cloudflare Workers
- [ ] All tests pass: `npm test`
- [ ] Build succeeds: `npm run build`
- [ ] KV namespaces are created and configured
- [ ] Secrets are set (if needed)
- [ ] wrangler.toml has correct configuration
- [ ] Local testing works: `npm run workers:dev`
- [ ] Development deployment tested

---

## 🚨 Troubleshooting

### NPM Publishing Issues

**Error: 403 Forbidden**
- Make sure you're logged in: `npm login`
- Check if you have permission to publish to the `@aredes.me` scope
- Try: `npm publish --access public`

**Error: Package already exists**
- You need to bump the version: `npm version patch`

**Error: prepublishOnly script failed**
- Check TypeScript compilation errors
- Run `npm run build` manually to see errors

### Cloudflare Workers Issues

**Error: KV namespace not found**
- Make sure you created the KV namespaces
- Verify the IDs in `wrangler.toml` match the created namespaces

**Error: Authentication required**
- Run `wrangler login` again
- Check your Cloudflare account has Workers enabled

**Error: Build failed**
- Check that `build/lib/workers/worker.js` exists
- Run `npm run build` first

**Worker deployed but not working**
- Check logs: `npm run workers:tail:prod`
- Verify environment variables in `wrangler.toml`
- Test endpoints individually

---

## 📊 Post-Publishing

### NPM Package
- View on NPM: https://www.npmjs.com/package/@aredes.me/mcp-camara
- Check download stats: `npm view @aredes.me/mcp-camara`
- Monitor issues: https://github.com/aredes/mcp-camara/issues

### Cloudflare Workers
- View in dashboard: https://dash.cloudflare.com/
- Monitor analytics and logs
- Check performance metrics
- Set up alerts for errors

---

## 🔐 Security Notes

### NPM
- Never commit `.npmrc` with auth tokens
- Use 2FA for your NPM account
- Regularly audit dependencies: `npm audit`

### Cloudflare Workers
- Keep API keys in secrets, not environment variables
- Use rate limiting to prevent abuse
- Monitor usage to detect anomalies
- Regularly review access logs

---

## 📝 Quick Reference

```bash
# Complete publishing workflow
npm test                          # Run tests
npm version patch                 # Bump version
npm run build                     # Build project
npm publish                       # Publish to NPM
npm run workers:deploy:prod       # Deploy to Cloudflare
git push && git push --tags       # Push to git

# Check status
npm view @aredes.me/mcp-camara    # NPM package info
wrangler deployments list         # Cloudflare deployments
npm run workers:tail:prod         # View logs
```

---

## 🆘 Getting Help

- NPM Documentation: https://docs.npmjs.com/
- Cloudflare Workers Docs: https://developers.cloudflare.com/workers/
- Wrangler CLI Docs: https://developers.cloudflare.com/workers/wrangler/
- Project Issues: https://github.com/aredes/mcp-camara/issues
