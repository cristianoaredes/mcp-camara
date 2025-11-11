/**
 * Post-install script that displays quick start instructions
 */

console.log(`
✅ MCP Câmara dos Deputados Server installed successfully!

Quick Start:
  1. Add to your AI assistant config (Claude Desktop, Cursor, etc.)
  2. Use 'npx @aredes.me/mcp-camara' as the command
  3. Start querying Brazilian legislative data!

Example Configuration (Claude Desktop):
  {
    "mcpServers": {
      "camara": {
        "command": "npx",
        "args": ["@aredes.me/mcp-camara"]
      }
    }
  }

Documentation: https://github.com/aredes/mcp-camara#readme
Examples: https://github.com/aredes/mcp-camara/blob/main/docs/USAGE_EXAMPLES.md
`);
