# E2E Tests for Cloudflare Workers

Este diretório contém testes end-to-end (E2E) para o MCP Câmara Server rodando em Cloudflare Workers.

## Objetivo

Os testes E2E verificam:
- ✅ Conectividade com o servidor Workers (local e produção)
- ✅ Streaming de eventos SSE (Server-Sent Events)
- ✅ Configuração CORS
- ✅ Durable Objects funcionando corretamente
- ✅ Versionamento correto do servidor

## Estrutura

```
test/e2e/
├── README.md              # Este arquivo
└── workers.e2e.test.ts   # Testes E2E do Workers
```

## Pré-requisitos

### Para testes locais
1. Servidor local deve estar rodando:
   ```bash
   npm run workers:dev
   ```
   O servidor ficará disponível em `http://localhost:60320/sse`

### Para testes de produção
1. Deploy deve ter sido realizado:
   ```bash
   npm run workers:deploy:prod
   ```
   O servidor estará em `https://mcp-camara.cristianoaredes.workers.dev/sse`

## Como Executar

### Todos os testes E2E
```bash
npm run test:e2e
```

### Apenas testes locais
```bash
npm run test:e2e:local
```

### Apenas testes de produção
```bash
npm run test:e2e:prod
```

### Watch mode (desenvolvimento)
```bash
npm run test:e2e:watch
```

## Testes Implementados

### Local Development Server
- **Acessibilidade**: Verifica se o servidor local está acessível
- **Headers SSE**: Valida headers de streaming corretos
- **Stream de eventos**: Testa se eventos SSE estão sendo transmitidos

### Production Server
- **Acessibilidade**: Verifica se o servidor de produção está online
- **CORS**: Valida configuração CORS para cross-origin
- **Stream de eventos**: Testa streaming em produção

### MCP Agent Configuration
- **Durable Objects**: Verifica persistência de estado
- **Versão**: Confirma versão correta (1.0.6)

## Debugging

### Logs de rede
Para ver detalhes das requisições HTTP, use curl:
```bash
# Local
curl -v http://localhost:60320/sse 2>&1 | head -50

# Produção
curl -v https://mcp-camara.cristianoaredes.workers.dev/sse 2>&1 | head -30
```

### Logs do Workers
Para ver logs em tempo real da produção:
```bash
npm run workers:tail:prod
```

## Timeouts

Todos os testes de rede têm timeout de **10 segundos** para evitar travamentos em caso de problemas de conectividade.

## CI/CD

Estes testes devem ser executados:
1. **Antes de fazer deploy para produção**
2. **Após deploy bem-sucedido** (validação)
3. **Em pipelines de CI** (GitHub Actions, etc.)

## Troubleshooting

### Erro: "fetch failed" ou "ECONNREFUSED"
- **Local**: Certifique-se de que `npm run workers:dev` está rodando
- **Produção**: Verifique se o deploy foi realizado com sucesso

### Timeout em testes SSE
- Verifique a conectividade de rede
- Teste manualmente com curl primeiro
- Aumente o timeout se necessário (constante `NETWORK_TIMEOUT`)

### Testes falhando após deploy
- Aguarde alguns segundos para o Workers propagar
- Execute `npm run workers:tail:prod` para ver logs
- Verifique se a versão foi atualizada corretamente
