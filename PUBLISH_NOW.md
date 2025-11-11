# 🚀 Ready to Publish - Step by Step Guide

Your project is **ready to publish**! Follow these steps in order.

---

## ✅ Pre-flight Checklist

- [x] All tests passing (388 tests passed)
- [x] Build successful
- [x] README files created (English + Portuguese)
- [x] Cloudflare account authenticated
- [ ] NPM account authenticated
- [ ] KV namespaces created
- [ ] Version number confirmed

---

## 📦 STEP 1: Publish to NPM

### 1.1 Login to NPM

```bash
npm login
```

You'll be prompted for:
- Username
- Password
- Email
- 2FA code (if enabled)

### 1.2 Verify Login

```bash
npm whoami
```

Should display your NPM username.

### 1.3 Test Build

```bash
npm run build
```

Should complete without errors.

### 1.4 Publish to NPM

```bash
npm publish --access public
```

This will:
- Run `prepublishOnly` script (builds the project)
- Package the files listed in `package.json` "files" field
- Upload to NPM registry

### 1.5 Verify Publication

```bash
# Check package info
npm view @aredes.me/mcp-camara

# Test installation
npx @aredes.me/mcp-camara --version
```

**🎉 NPM Publishing Complete!**

Your package is now available at:
- https://www.npmjs.com/package/@aredes.me/mcp-camara
- Install with: `npm install -g @aredes.me/mcp-camara`
- Run with: `npx @aredes.me/mcp-camara`

---

## ☁️ STEP 2: Deploy to Cloudflare Workers

### 2.1 Create KV Namespaces

Run these commands and **save the IDs** that are returned:

```bash
# Development Cache
npx wrangler kv:namespace create MCP_CACHE
# Copy the ID from output: id = "abc123..."

# Development Rate Limit
npx wrangler kv:namespace create RATE_LIMIT_KV
# Copy the ID from output: id = "def456..."

# Production Cache
npx wrangler kv:namespace create MCP_CACHE --env production
# Copy the ID from output: id = "ghi789..."

# Production Rate Limit
npx wrangler kv:namespace create RATE_LIMIT_KV --env production
# Copy the ID from output: id = "jkl012..."
```

### 2.2 Update wrangler.toml

Open `wrangler.toml` and replace the placeholder IDs:

```toml
# Find these sections and update with your actual IDs:

# Development
[[env.development.kv_namespaces]]
binding = "MCP_CACHE"
id = "YOUR_ACTUAL_ID_HERE"  # Replace this

[[env.development.kv_namespaces]]
binding = "RATE_LIMIT_KV"
id = "YOUR_ACTUAL_ID_HERE"  # Replace this

# Production
[[env.production.kv_namespaces]]
binding = "MCP_CACHE"
id = "YOUR_ACTUAL_ID_HERE"  # Replace this

[[env.production.kv_namespaces]]
binding = "RATE_LIMIT_KV"
id = "YOUR_ACTUAL_ID_HERE"  # Replace this
```

### 2.3 Set API Key Secret (Optional)

If you want to protect REST endpoints with authentication:

```bash
npx wrangler secret put MCP_API_KEY --env production
```

Enter a secure API key when prompted (e.g., a random string).

**Note:** MCP protocol endpoints (`/mcp`, `/sse`) will remain unprotected for AI assistant compatibility.

### 2.4 Test Locally (Optional but Recommended)

```bash
npm run workers:dev
```

In another terminal:

```bash
# Test health endpoint
curl http://localhost:8787/health

# Test MCP endpoint
curl -X POST http://localhost:8787/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc": "2.0", "id": 1, "method": "tools/list"}'

# Test REST endpoint
curl http://localhost:8787/deputados/220593
```

Press Ctrl+C to stop the local server.

### 2.5 Deploy to Development

```bash
npx wrangler deploy --env development
```

**Save the URL** from the output (e.g., `https://mcp-camara-dev.your-subdomain.workers.dev`)

### 2.6 Test Development Deployment

```bash
# Replace with your actual URL
export DEV_URL="https://mcp-camara-dev.your-subdomain.workers.dev"

# Test health
curl $DEV_URL/health

# Test MCP
curl -X POST $DEV_URL/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc": "2.0", "id": 1, "method": "tools/list"}'

# Test REST
curl $DEV_URL/deputados/220593
```

### 2.7 Deploy to Production

Once development is verified:

```bash
npx wrangler deploy --env production
```

**Save the URL** from the output (e.g., `https://mcp-camara.your-subdomain.workers.dev`)

### 2.8 Test Production Deployment

```bash
# Replace with your actual URL
export PROD_URL="https://mcp-camara.your-subdomain.workers.dev"

# Test health
curl $PROD_URL/health

# Test OpenAPI spec
curl $PROD_URL/openapi.json

# Test MCP endpoint
curl -X POST $PROD_URL/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc": "2.0", "id": 1, "method": "tools/list"}'

# Test REST endpoint (with API key if configured)
curl $PROD_URL/deputados/220593
# or with API key:
# curl -H "X-API-Key: your-key" $PROD_URL/deputados/220593
```

**🎉 Cloudflare Workers Deployment Complete!**

Your API is now live at:
- Production: `https://mcp-camara.your-subdomain.workers.dev`
- Development: `https://mcp-camara-dev.your-subdomain.workers.dev`

---

## 📊 STEP 3: Monitor and Verify

### 3.1 View Cloudflare Dashboard

Visit: https://dash.cloudflare.com/

Navigate to: Workers & Pages → mcp-camara

You can see:
- Request analytics
- Error rates
- Performance metrics
- Logs

### 3.2 Monitor Logs

```bash
# Production logs
npx wrangler tail --env production

# Development logs
npx wrangler tail --env development
```

### 3.3 Check NPM Package

Visit: https://www.npmjs.com/package/@aredes.me/mcp-camara

You should see:
- Package information
- README
- Download stats
- Version history

---

## 🔄 STEP 4: Update README with Live URLs

Update your README files with the actual Cloudflare Workers URLs:

1. Open `README.md` and `README.pt-BR.md`
2. Replace placeholder URLs with your actual Workers URL
3. Commit and push to GitHub

```bash
git add README.md README.pt-BR.md wrangler.toml
git commit -m "docs: update with live Cloudflare Workers URLs"
git push
```

---

## 🎯 Quick Test Commands

### Test NPM Package

```bash
# Install globally
npm install -g @aredes.me/mcp-camara

# Run the server
mcp-camara

# Or use npx
npx @aredes.me/mcp-camara
```

### Test Cloudflare Workers

```bash
# Set your production URL
export PROD_URL="https://mcp-camara.your-subdomain.workers.dev"

# Quick health check
curl $PROD_URL/health

# List all tools
curl -X POST $PROD_URL/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc": "2.0", "id": 1, "method": "tools/list"}' | jq

# Get deputy info
curl $PROD_URL/deputados/220593 | jq

# Get OpenAPI spec
curl $PROD_URL/openapi.json | jq
```

---

## 🐛 Troubleshooting

### NPM Issues

**"need auth" error:**
```bash
npm login
```

**"403 Forbidden" error:**
```bash
npm publish --access public
```

**"package already exists" error:**
```bash
npm version patch
npm publish
```

### Cloudflare Issues

**"KV namespace not found" error:**
- Make sure you created the KV namespaces
- Verify IDs in `wrangler.toml` match the created namespaces

**"Authentication required" error:**
```bash
npx wrangler login
```

**Worker not responding:**
```bash
# Check logs
npx wrangler tail --env production

# Redeploy
npx wrangler deploy --env production
```

---

## 📝 Next Steps

After successful publishing:

1. ✅ Test the package in Claude Desktop, Cursor, or Windsurf
2. ✅ Share the package on social media
3. ✅ Submit to Smithery: https://smithery.ai/
4. ✅ Create GitHub release with changelog
5. ✅ Monitor analytics and logs
6. ✅ Respond to issues and feedback

---

## 🆘 Need Help?

- NPM Docs: https://docs.npmjs.com/
- Cloudflare Workers Docs: https://developers.cloudflare.com/workers/
- Wrangler CLI Docs: https://developers.cloudflare.com/workers/wrangler/
- Create an issue: https://github.com/aredes/mcp-camara/issues

---

**Ready to publish? Start with Step 1! 🚀**
