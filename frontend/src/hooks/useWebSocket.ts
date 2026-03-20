import { useEffect, useRef, useCallback } from 'react';
import { WebSocketMessage } from '../types';

type MessageHandler = (msg: WebSocketMessage) => void;

const WS_URL = `ws://${window.location.hostname}:3001/ws`;

export function useWebSocket(onMessage: MessageHandler) {
  const wsRef = useRef<WebSocket | null>(null);
  const handlerRef = useRef<MessageHandler>(onMessage);
  handlerRef.current = onMessage;

  const connect = useCallback(() => {
    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;

    ws.onopen = () => console.log('[WS] Connected');
    ws.onmessage = (event) => {
      try {
        const msg: WebSocketMessage = JSON.parse(event.data as string);
        handlerRef.current(msg);
      } catch {
        console.error('[WS] Failed to parse message');
      }
    };
    ws.onclose = () => {
      console.log('[WS] Disconnected — reconnecting in 3s');
      setTimeout(connect, 3000);
    };
    ws.onerror = (err) => console.error('[WS] Error:', err);
  }, []);

  useEffect(() => {
    connect();
    return () => {
      wsRef.current?.close();
    };
  }, [connect]);
}
