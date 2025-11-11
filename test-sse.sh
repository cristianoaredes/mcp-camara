#!/bin/bash

# Test script for SSE transport
# This script starts the server in SSE mode and connects to it

echo "🧪 Testing SSE Transport"
echo ""

# Start server in background
echo "Starting MCP server in SSE mode..."
MCP_TRANSPORT=sse MCP_HTTP_PORT=3001 LOG_LEVEL=INFO node build/lib/bin/mcp-camara.js &
SERVER_PID=$!

# Wait for server to start
sleep 2

echo ""
echo "📡 Connecting to SSE endpoint..."
echo ""

# Connect to SSE endpoint and listen for events
curl -N -H "Accept: text/event-stream" http://localhost:3001/sse &
CURL_PID=$!

# Wait for a few seconds to receive events
sleep 5

echo ""
echo "🛑 Stopping test..."

# Kill curl
kill $CURL_PID 2>/dev/null

# Kill server
kill $SERVER_PID 2>/dev/null

echo ""
echo "✅ Test complete"
