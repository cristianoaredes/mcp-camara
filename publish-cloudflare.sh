#!/bin/bash

echo "╔══════════════════════════════════════════════════════════════════════╗"
echo "║           ☁️  CLOUDFLARE WORKERS DEPLOYMENT SCRIPT                   ║"
echo "╚══════════════════════════════════════════════════════════════════════╝"
echo ""

# Check if logged in
echo "🔍 Checking Cloudflare authentication..."
if npx wrangler whoami > /dev/null 2>&1; then
    echo "✅ Logged in to Cloudflare"
else
    echo "❌ Not logged in to Cloudflare"
    echo ""
    echo "Please run: npx wrangler login"
    echo "Then run this script again"
    exit 1
fi

echo ""
echo "📋 STEP 1: Create KV Namespaces"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

read -p "Create KV namespaces? (y/n) " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo ""
    echo "Creating development namespaces..."
    echo "─────────────────────────────────────"
    
    echo "📦 Creating MCP_CACHE (development)..."
    DEV_CACHE=$(npx wrangler kv:namespace create MCP_CACHE 2>&1 | grep -o 'id = "[^"]*"' | head -1)
    
    echo "📦 Creating RATE_LIMIT_KV (development)..."
    DEV_RATE=$(npx wrangler kv:namespace create RATE_LIMIT_KV 2>&1 | grep -o 'id = "[^"]*"' | head -1)
    
    echo ""
    echo "Creating production namespaces..."
    echo "─────────────────────────────────────"
    
    echo "📦 Creating MCP_CACHE (production)..."
    PROD_CACHE=$(npx wrangler kv:namespace create MCP_CACHE --env production 2>&1 | grep -o 'id = "[^"]*"' | head -1)
    
    echo "📦 Creating RATE_LIMIT_KV (production)..."
    PROD_RATE=$(npx wrangler kv:namespace create RATE_LIMIT_KV --env production 2>&1 | grep -o 'id = "[^"]*"' | head -1)
    
    echo ""
    echo "✅ KV Namespaces created!"
    echo ""
    echo "📝 IMPORTANT: Update wrangler.toml with these IDs:"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "Development:"
    echo "  MCP_CACHE: $DEV_CACHE"
    echo "  RATE_LIMIT_KV: $DEV_RATE"
    echo ""
    echo "Production:"
    echo "  MCP_CACHE: $PROD_CACHE"
    echo "  RATE_LIMIT_KV: $PROD_RATE"
    echo ""
    
    read -p "Press Enter after updating wrangler.toml..."
fi

echo ""
echo "📋 STEP 2: Build Project"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed!"
    exit 1
fi

echo ""
echo "📋 STEP 3: Deploy to Production"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

read -p "Deploy to production? (y/n) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Deployment cancelled"
    exit 1
fi

echo ""
echo "🚀 Deploying to Cloudflare Workers..."
npx wrangler deploy --env production

if [ $? -eq 0 ]; then
    echo ""
    echo "╔══════════════════════════════════════════════════════════════════════╗"
    echo "║              ✅ DEPLOYED SUCCESSFULLY!                               ║"
    echo "╚══════════════════════════════════════════════════════════════════════╝"
    echo ""
    echo "🌐 Your API is now live!"
    echo ""
    echo "📋 Next steps:"
    echo "  1. Test your endpoints"
    echo "  2. Configure API key (optional): npx wrangler secret put MCP_API_KEY --env production"
    echo "  3. Monitor logs: npx wrangler tail --env production"
    echo ""
    echo "🧪 Test commands:"
    echo "  curl https://mcp-camara.your-subdomain.workers.dev/health"
    echo "  curl https://mcp-camara.your-subdomain.workers.dev/deputados/220593"
else
    echo ""
    echo "❌ Deployment failed!"
    echo ""
    echo "Common issues:"
    echo "  • Not logged in: npx wrangler login"
    echo "  • KV namespaces not configured in wrangler.toml"
    echo "  • Build failed: npm run build"
fi
