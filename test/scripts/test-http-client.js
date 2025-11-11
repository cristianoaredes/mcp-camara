#!/usr/bin/env node

/**
 * Simple HTTP client for testing the MCP server
 * Usage: node test-http-client.js [tool-name] [args-json]
 * 
 * Examples:
 *   node test-http-client.js
 *   node test-http-client.js deputados_listar '{"siglaUf":"SP","itens":5}'
 *   node test-http-client.js referencias_ufs '{}'
 */

const http = require('http');

const HOST = process.env.MCP_HOST || 'localhost';
const PORT = process.env.MCP_PORT || 3000;

async function makeRequest(method, params) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      jsonrpc: '2.0',
      id: Date.now(),
      method,
      params,
    });

    const options = {
      hostname: HOST,
      port: PORT,
      path: '/mcp',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length,
      },
    };

    const req = http.request(options, (res) => {
      let body = '';

      res.on('data', (chunk) => {
        body += chunk;
      });

      res.on('end', () => {
        try {
          const response = JSON.parse(body);
          resolve(response);
        } catch (error) {
          reject(new Error(`Failed to parse response: ${error.message}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.write(data);
    req.end();
  });
}

async function testHealthEndpoint() {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: HOST,
      port: PORT,
      path: '/health',
      method: 'GET',
    };

    const req = http.request(options, (res) => {
      let body = '';

      res.on('data', (chunk) => {
        body += chunk;
      });

      res.on('end', () => {
        resolve({ status: res.statusCode, body });
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.end();
  });
}

async function listTools() {
  console.log('📋 Listing all available tools...\n');
  
  const response = await makeRequest('tools/list', {});
  
  if (response.error) {
    console.error('❌ Error:', response.error);
    return;
  }

  const tools = response.result.tools;
  console.log(`✅ Found ${tools.length} tools:\n`);

  // Group by category
  const categories = {};
  tools.forEach((tool) => {
    const category = tool.name.split('_')[0];
    if (!categories[category]) {
      categories[category] = [];
    }
    categories[category].push(tool.name);
  });

  Object.entries(categories).forEach(([category, toolNames]) => {
    console.log(`\n${category.toUpperCase()} (${toolNames.length} tools):`);
    toolNames.forEach((name) => {
      console.log(`  - ${name}`);
    });
  });
}

async function callTool(toolName, args) {
  console.log(`🔧 Calling tool: ${toolName}`);
  console.log(`📝 Arguments: ${JSON.stringify(args, null, 2)}\n`);

  const startTime = Date.now();
  
  try {
    const response = await makeRequest('tools/call', {
      name: toolName,
      arguments: args,
    });

    const duration = Date.now() - startTime;

    if (response.error) {
      console.error('❌ Error:', response.error);
      return;
    }

    const result = response.result;

    if (result.isError) {
      console.error('❌ Tool returned error:');
      console.error(result.content[0].text);
    } else {
      console.log('✅ Success!');
      console.log(`⏱️  Duration: ${duration}ms\n`);
      
      // Pretty print the result
      try {
        const data = JSON.parse(result.content[0].text);
        console.log('📊 Result:');
        console.log(JSON.stringify(data, null, 2));
      } catch {
        console.log(result.content[0].text);
      }
    }
  } catch (error) {
    console.error('❌ Request failed:', error.message);
  }
}

async function runExamples() {
  console.log('🧪 Running example queries...\n');
  console.log('=' .repeat(60));

  // Example 1: List Brazilian states
  console.log('\n📍 Example 1: List all Brazilian states');
  console.log('-'.repeat(60));
  await callTool('referencias_ufs', {});

  console.log('\n' + '='.repeat(60));

  // Example 2: List deputies from São Paulo
  console.log('\n👥 Example 2: List deputies from São Paulo');
  console.log('-'.repeat(60));
  await callTool('deputados_listar', { siglaUf: 'SP', itens: 5 });

  console.log('\n' + '='.repeat(60));

  // Example 3: List political parties
  console.log('\n🏛️  Example 3: List political parties');
  console.log('-'.repeat(60));
  await callTool('partidos_listar', {});

  console.log('\n' + '='.repeat(60));

  // Example 4: List proposition types
  console.log('\n📜 Example 4: List proposition types');
  console.log('-'.repeat(60));
  await callTool('referencias_tipos_proposicao', {});

  console.log('\n' + '='.repeat(60));

  // Example 5: Validation error
  console.log('\n❌ Example 5: Validation error (missing required parameter)');
  console.log('-'.repeat(60));
  await callTool('deputado_detalhes', {});

  console.log('\n' + '='.repeat(60));

  // Example 6: API error
  console.log('\n❌ Example 6: API error (non-existent resource)');
  console.log('-'.repeat(60));
  await callTool('deputado_detalhes', { id: 999999999 });
}

async function main() {
  console.log('🚀 MCP Câmara HTTP Client Test\n');
  console.log(`📡 Server: http://${HOST}:${PORT}\n`);

  // Test health endpoint
  try {
    console.log('🏥 Testing health endpoint...');
    const health = await testHealthEndpoint();
    console.log(`✅ Health check: ${health.status} ${health.body}\n`);
  } catch (error) {
    console.error(`❌ Health check failed: ${error.message}`);
    console.error('Make sure the server is running with:');
    console.error('  MCP_TRANSPORT=http MCP_HTTP_PORT=3000 node build/lib/bin/mcp-camara.js\n');
    process.exit(1);
  }

  const args = process.argv.slice(2);

  if (args.length === 0) {
    // No arguments - run examples
    await runExamples();
  } else if (args[0] === 'list') {
    // List all tools
    await listTools();
  } else if (args.length >= 1) {
    // Call specific tool
    const toolName = args[0];
    const toolArgs = args[1] ? JSON.parse(args[1]) : {};
    await callTool(toolName, toolArgs);
  }

  console.log('\n✨ Done!\n');
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
