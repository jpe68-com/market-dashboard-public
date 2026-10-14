import { useEffect, useRef, useState, useCallback } from 'react';
import type { Candle, ServerMessage, ConnectionStatusValue } from '../types';

const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:4000';
const MAX_BACKOFF_MS = 10000;

interface MarketSocketState {
  status: ConnectionStatusValue;
  symbols: string[];
  seriesBySymbol: Record<string, Candle[]>;
  latestPriceBySymbol: Record<string, number>;
}

// Owns the WebSocket lifecycle: connecting, receiving candle/tick updates,
// and reconnecting with exponential backoff if the backend drops.
export function useMarketSocket(): MarketSocketState {
  const [status, setStatus] = useState<ConnectionStatusValue>('connecting');
  const [symbols, setSymbols] = useState<string[]>([]);
  const [seriesBySymbol, setSeriesBySymbol] = useState<Record<string, Candle[]>>({});
  const [latestPriceBySymbol, setLatestPriceBySymbol] = useState<Record<string, number>>({});

  const socketRef = useRef<WebSocket | null>(null);
  const backoffRef = useRef(1000);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const isMountedRef = useRef(true);

  const connect = useCallback(() => {
    const newSocket = new WebSocket(WS_URL);
    socketRef.current = newSocket;
    setStatus('connecting');

    newSocket.onopen = () => {
      setStatus('open');
      backoffRef.current = 1000;
    }

    newSocket.onmessage = (event: MessageEvent) => {
      const msg: ServerMessage = JSON.parse(event.data);

      switch (msg.type) {
        case 'init':
          setSymbols(msg.symbols);
          setSeriesBySymbol(msg.series);
          const latest: Record<string, number> = {};
          for (const [symbol, candles] of Object.entries(msg.series)) {
            if (candles.length) {
              latest[symbol] = candles[candles.length - 1].close;
            }
          }
          setLatestPriceBySymbol(latest);
          break;
        case 'tick':
          setLatestPriceBySymbol(prev => ({ ...prev, [msg.symbol]: msg.price }));
          break;
        case 'candleUpdate':
          setSeriesBySymbol(prev => ({
            ...prev,
            [msg.symbol]: [...prev[msg.symbol].slice(0, -1), msg.candle],
          }));
          break;
        case 'newCandle':
          setSeriesBySymbol(prev => ({
            ...prev,
            [msg.symbol]: [...prev[msg.symbol], msg.candle],
          }));
          break;
      }

    }

    newSocket.onclose = () => {
      if (!isMountedRef.current || socketRef.current !== newSocket) return;
      setStatus('closed');
      reconnectTimerRef.current = setTimeout(() => {
        backoffRef.current = Math.min(backoffRef.current * 2, MAX_BACKOFF_MS);
        connect();
      }, backoffRef.current);

    }

    newSocket.onerror = () => {
      newSocket.close();
    }
  }, []);

  useEffect(() => {
    isMountedRef.current = true;
    connect();
    return () => {
      isMountedRef.current = false;
      clearTimeout(reconnectTimerRef.current);
      socketRef.current?.close();
    }
  }, [connect]);

  return { status, symbols, seriesBySymbol, latestPriceBySymbol };
}