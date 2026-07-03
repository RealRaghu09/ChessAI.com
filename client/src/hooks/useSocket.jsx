import { useCallback, useEffect, useRef, useState } from 'react';
import { getWsUrl } from '../services/api';
import { parseMessage } from '../services/websocket';

export function useSocket(enabled = true) {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const listenersRef = useRef(new Set());
  const reconnectRef = useRef(0);
  const wsRef = useRef(null);

  const addListener = useCallback((fn) => {
    listenersRef.current.add(fn);
    return () => listenersRef.current.delete(fn);
  }, []);

  useEffect(() => {
    if (!enabled) return undefined;

    let cancelled = false;
    let reconnectTimer;
    console.log("useSocket hook called");
    const connect = () => {
      if (cancelled) return;

console.log("Connecting to:", getWsUrl());
      const url = getWsUrl();
      console.log("Connecting to:", url);
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        reconnectRef.current = 0;
        setConnected(true);
        console.log("OPENED");
        setSocket(ws);
      };

      ws.onmessage = (event) => {
        try {
          const message = parseMessage(event.data);
          console.log("MESSAGE", message);
          listenersRef.current.forEach((fn) => fn(message));
        } catch {
          // ignore malformed messages
          console.error('Malformed message:', event.data);
        }
      };

      ws.onclose = (event) => {
        setConnected(false);
        setSocket(null);
        if (!cancelled) {
          const delay = Math.min(1000 * 2 ** reconnectRef.current, 10000);
          reconnectRef.current += 1;
          reconnectTimer = setTimeout(connect, delay);
          console.log("CLOSED", event);
        }
      };

      ws.onerror = (e)=>{
        console.error('WebSocket error:', e);
        console.log("ERROR", e);
      }
    };

    connect();

    return () => {
      cancelled = true;
      clearTimeout(reconnectTimer);
      wsRef.current?.close();
    };
  }, [enabled]);

  return { socket, connected, addListener };
}
