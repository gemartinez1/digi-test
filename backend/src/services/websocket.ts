import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';
import { WebSocketMessage } from '../types';

let wss: WebSocketServer | null = null;

export function initWebSocket(server: Server): void {
  wss = new WebSocketServer({ server, path: '/ws' });

  wss.on('connection', (ws: WebSocket) => {
    console.log('[WS] Client connected');
    ws.send(JSON.stringify({ type: 'connected', message: 'IoT Monitor WebSocket ready' }));

    ws.on('close', () => console.log('[WS] Client disconnected'));
    ws.on('error', (err) => console.error('[WS] Error:', err.message));
  });

  console.log('[WS] WebSocket server initialized at /ws');
}

export function broadcastWebSocket(message: WebSocketMessage): void {
  if (!wss) return;

  const payload = JSON.stringify(message);
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(payload);
    }
  });
}
