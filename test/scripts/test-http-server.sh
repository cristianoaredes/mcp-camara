#!/bin/bash

# Test script for HTTP adapter
# This script tests the HTTP transport adapter manually

PORT=3456

echo "Testing HTTP Adapter on port $PORT"
echo "=================================="
echo ""

# Test 1: Health check
echo "Test 1: Health Check"
echo "--------------------"
curl -s http://localhost:$PORT/health | jq .
echo ""
echo ""

# Test 2: CORS preflight
echo "Test 2: CORS Preflight"
echo "----------------------"
curl -s -X OPTIONS -I http://localhost:$PORT/mcp | grep -i "access-control"
echo ""
echo ""

# Test 3: Invalid JSON-RPC request
echo "Test 3: Invalid JSON-RPC Request"
echo "--------------------------------"
curl -s -X POST http://localhost:$PORT/mcp \
  -H "Content-Type: application/json" \
  -d '{"invalid": "request"}' | jq .
echo ""
echo ""

# Test 4: tools/list request
echo "Test 4: Tools List Request"
echo "--------------------------"
curl -s -X POST http://localhost:$PORT/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc": "2.0", "id": 1, "method": "tools/list", "params": {}}' | jq '.result.tools | length'
echo ""
echo ""

# Test 5: Unknown route
echo "Test 5: Unknown Route (404)"
echo "---------------------------"
curl -s http://localhost:$PORT/unknown | jq .
echo ""

echo "All tests completed!"
