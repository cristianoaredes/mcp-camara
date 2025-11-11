# SSE Transport Implementation

## Overview

The Server-Sent Events (SSE) transport adapter provides a persistent, streaming connection for the MCP server. This implementation follows Requirement 1.4 from the specification.

## Features Implemented

### 1. SSE Endpoint (`GET /sse`)
- Establishes persistent HTTP connection with SSE headers
- Sends initial connection event with unique connection ID
- Maintains connection state for lifecycle management

### 2. Server-Sent Events Streaming
- Implements SSE protocol with proper event formatting
- Sends events in the format: `event: <type>\ndata: <json>\n\n`
- Supports multiple event types: `connected`, `heartbeat`, `disconnect`

### 3. Client Connection Lifecycle
- Tracks active connections with unique IDs
- Monitors connection state (connected time, last heartbeat)
- Handles client disconnections gracefully
- Cleans up resources on connection close

### 4. Heartbeat Mechanism
- Sends heartbeat events every 30 seconds
- Keeps connections alive and detects dead connections
- Logs connection uptime and health status
- Automatically removes failed connections

### 5. Graceful Shutdown
- Stops heartbeat mechanism on shutdown
- Sends disconnect events to all clients
- Closes all active SSE connections
- Cleans up resources properly

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Client                                │
│                  (Browser/HTTP Client)                       │
└────────────────────────┬────────────────────────────────────┘
                         │ GET /sse
                         │ (Persistent Connection)
                         │
┌────────────────────────▼────────────────────────────────────┐
│                    SSE Adapter                               │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Connection Manager                                   │  │
│  │  - Track active connections                           │  │
│  │  - Generate unique connection IDs                     │  │
│  │  - Handle lifecycle events                            │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Event Streaming                                      │  │
│  │  - Format SSE events                                  │  │
│  │  - Send events to clients                             │  │
│  │  - Handle streaming errors                            │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Heartbeat Mechanism                                  │  │
│  │  - Send periodic heartbeats (30s)                     │  │
│  │  - Monitor connection health                          │  │
│  │  - Remove dead connections                            │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## Usage

### Starting the Server

```bash
# Start with SSE transport
MCP_TRANSPORT=sse MCP_HTTP_PORT=3000 npx @aredes.me/mcp-camara
```

### Connecting to SSE Endpoint

```bash
# Using curl
curl -N -H "Accept: text/event-stream" http://localhost:3000/sse

# Using JavaScript
const eventSource = new EventSource('http://localhost:3000/sse');

eventSource.addEventListener('connected', (event) => {
  const data = JSON.parse(event.data);
  console.log('Connected:', data.connectionId);
});

eventSource.addEventListener('heartbeat', (event) => {
  const data = JSON.parse(event.data);
  console.log('Heartbeat:', data.timestamp);
});

eventSource.addEventListener('disconnect', (event) => {
  const data = JSON.parse(event.data);
  console.log('Disconnected:', data.reason);
});
```

## Event Types

### Connected Event
Sent immediately when a client connects:
```
event: connected
data: {"connectionId":"sse-1234567890-abc123","timestamp":"2024-01-15T10:30:00.000Z","message":"SSE connection established"}
```

### Heartbeat Event
Sent every 30 seconds to keep the connection alive:
```
event: heartbeat
data: {"timestamp":"2024-01-15T10:30:30.000Z","connectionId":"sse-1234567890-abc123"}
```

### Disconnect Event
Sent when the server is shutting down:
```
event: disconnect
data: {"reason":"Server shutting down","timestamp":"2024-01-15T10:35:00.000Z"}
```

## Health Check Integration

The `/health` endpoint now includes SSE connection statistics:

```json
{
  "status": "healthy",
  "server": {
    "name": "mcp-camara",
    "version": "1.0.0",
    "initialized": true,
    "toolCount": 62
  },
  "sse": {
    "activeConnections": 3,
    "heartbeatActive": true
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

## Implementation Details

### Connection Tracking

Each SSE connection is tracked with:
- `id`: Unique connection identifier
- `res`: Express Response object for sending events
- `connectedAt`: Connection establishment timestamp
- `lastHeartbeat`: Last heartbeat timestamp

### Heartbeat Interval

The heartbeat mechanism:
- Runs every 30 seconds
- Sends heartbeat events to all active connections
- Removes connections that fail to receive heartbeats
- Logs connection statistics

### Graceful Shutdown

On shutdown, the adapter:
1. Stops the heartbeat interval
2. Sends disconnect events to all clients
3. Closes all response streams
4. Clears the connection map
5. Closes the HTTP server

## Testing

Tests are included in `test/http-adapter.test.ts`:

```typescript
it('should establish SSE connection', async () => {
  const response = await fetch(`http://localhost:${testPort}/sse`);
  expect(response.status).toBe(200);
  expect(response.headers.get('Content-Type')).toBe('text/event-stream');
  expect(response.headers.get('Cache-Control')).toBe('no-cache');
  expect(response.headers.get('Connection')).toBe('keep-alive');
});

it('should include SSE stats in health check', async () => {
  const response = await fetch(`http://localhost:${testPort}/health`);
  const data = await response.json();
  expect(data).toHaveProperty('sse');
  expect(data.sse).toHaveProperty('activeConnections');
  expect(data.sse).toHaveProperty('heartbeatActive');
});
```

## Requirements Satisfied

✅ **Requirement 1.4**: WHEN a client connects via SSE transport, THE MCP_Server SHALL maintain a persistent connection and stream responses as server-sent events

### Implementation Details:
- ✅ SSE endpoint added to HTTP adapter
- ✅ Server-sent events streaming implemented
- ✅ Client connection lifecycle handled
- ✅ Heartbeat mechanism for connection monitoring
- ✅ Graceful shutdown with proper cleanup
- ✅ Connection statistics tracking
- ✅ Integration with health check endpoint
- ✅ Tests added and passing

## Future Enhancements

Potential improvements for future versions:

1. **Event Filtering**: Allow clients to subscribe to specific event types
2. **Reconnection Tokens**: Provide tokens for clients to resume from last event
3. **Event History**: Store recent events for new connections
4. **Custom Heartbeat Interval**: Make heartbeat interval configurable
5. **Connection Limits**: Add maximum connection limits per IP
6. **Authentication**: Add API key authentication for SSE connections
7. **Metrics**: Track detailed connection metrics (duration, events sent, etc.)
