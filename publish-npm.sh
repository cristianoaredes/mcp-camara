#!/bin/bash

echo "╔══════════════════════════════════════════════════════════════════════╗"
echo "║              📦 NPM PUBLISHING SCRIPT                                ║"
echo "╚══════════════════════════════════════════════════════════════════════╝"
echo ""

# Check if logged in
echo "🔍 Checking NPM authentication..."
if npm whoami > /dev/null 2>&1; then
    echo "✅ Already logged in as: $(npm whoami)"
else
    echo "❌ Not logged in to NPM"
    echo ""
    echo "Please run: npm login"
    echo "Then run this script again"
    exit 1
fi

echo ""
echo "📦 Package: @aredes.me/mcp-camara"
echo "📌 Version: $(node -p "require('./package.json').version")"
echo ""

# Confirm
read -p "🚀 Ready to publish? (y/n) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Publishing cancelled"
    exit 1
fi

echo ""
echo "🔨 Building project..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed!"
    exit 1
fi

echo ""
echo "📤 Publishing to NPM..."
npm publish --access public

if [ $? -eq 0 ]; then
    echo ""
    echo "╔══════════════════════════════════════════════════════════════════════╗"
    echo "║              ✅ PUBLISHED SUCCESSFULLY!                              ║"
    echo "╚══════════════════════════════════════════════════════════════════════╝"
    echo ""
    echo "📦 Package URL: https://www.npmjs.com/package/@aredes.me/mcp-camara"
    echo ""
    echo "🧪 Test installation:"
    echo "   npx @aredes.me/mcp-camara --version"
    echo ""
    echo "📋 Next: Deploy to Cloudflare Workers"
    echo "   Run: ./publish-cloudflare.sh"
else
    echo ""
    echo "❌ Publishing failed!"
    echo ""
    echo "Common issues:"
    echo "  • Not logged in: npm login"
    echo "  • Package exists: npm version patch"
    echo "  • No permission: Check package name ownership"
fi
