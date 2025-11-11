#!/usr/bin/env node

/**
 * CLI entry point for the Câmara MCP Server
 * Parses command-line arguments and starts the server
 */

import { CamaraServer } from '../core/mcp-server.js';
import { loadConfig } from '../config/index.js';
import { StdioAdapter, HttpAdapter, SSEAdapter } from '../adapters/index.js';

async function main() {
  const args = process.argv.slice(2);

  // Handle --version flag
  if (args.includes('--version') || args.includes('-v')) {
    // Read version from package.json
    const { readFileSync } = await import('fs');
    const { fileURLToPath } = await import('url');
    const { dirname, join } = await import('path');
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);
    // In build: build/lib/bin -> ../../../package.json
    // In source: lib/bin -> ../../package.json
    const packageJsonPath = join(__dirname, '../../../package.json');
    const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
    console.log(`mcp-camara version ${packageJson.version}`);
    process.exit(0);
  }

  // Handle --help flag
  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
Câmara dos Deputados MCP Server

Usage: mcp-camara [options]

Options:
  --version, -v     Show version number
  --help, -h        Show this help message

Environment Variables:
  MCP_TRANSPORT                Transport protocol (stdio|http|sse) [default: stdio]
  MCP_HTTP_PORT                HTTP server port [default: 3000]
  CAMARA_API_BASE_URL          Câmara API base URL
  MCP_CACHE_TTL                Cache TTL in seconds [default: 3600]
  MCP_DISABLE_CACHE            Disable caching [default: false]
  MCP_DISABLE_RATE_LIMIT       Disable rate limiting [default: false]
  LOG_LEVEL                    Log level (DEBUG|INFO|WARN|ERROR) [default: INFO]

Examples:
  # Start with STDIO transport (for Claude Desktop, Cursor, etc.)
  mcp-camara

  # Start with HTTP transport
  MCP_TRANSPORT=http MCP_HTTP_PORT=3000 mcp-camara

  # Enable debug logging
  LOG_LEVEL=DEBUG mcp-camara

Documentation: https://github.com/aredes/mcp-camara
    `);
    process.exit(0);
  }

  try {
    // Load configuration
    const config = loadConfig();

    // Create and initialize server
    const server = new CamaraServer(config);
    await server.initialize();

    // Display startup information
    console.error(`🚀 Câmara MCP Server v${config.version}`);
    console.error(`📡 Transport: ${config.transport}`);
    if (config.transport === 'http') {
      console.error(`🌐 HTTP Port: ${config.httpPort}`);
    }
    console.error(`💾 Cache: ${config.cacheEnabled ? 'enabled' : 'disabled'}`);
    console.error(`🔒 Rate Limit: ${config.rateLimitEnabled ? 'enabled' : 'disabled'}`);
    console.error(`📊 Log Level: ${config.logLevel}`);
    console.error('');

    // Start server based on transport
    if (config.transport === 'stdio') {
      console.error('✅ Server ready (STDIO mode)');
      const adapter = new StdioAdapter(server);
      await adapter.start();
    } else if (config.transport === 'http') {
      console.error('✅ Server ready (HTTP mode)');
      const adapter = new HttpAdapter(server, config.httpPort);
      await adapter.start();
    } else if (config.transport === 'sse') {
      console.error('✅ Server ready (SSE mode)');
      console.error(`🌐 SSE Port: ${config.httpPort}`);
      const adapter = new SSEAdapter(server, config.httpPort);
      await adapter.start();
    } else {
      console.error(`❌ Unknown transport: ${config.transport}`);
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

main();
