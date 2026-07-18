// Connects to Alpaca's real-time market data WebSocket and forwards
// trade ticks into the same onTick callback the simulator uses, so
// server.ts doesn't care which source it's getting data from.

import WebSocket from 'ws';
import type { TickHandler } from './types.js';

const ALPACA_WS_URL = 'wss://stream.data.alpaca.markets/v2/iex'; // free tier: IEX feed

interface AlpacaMessage {
  T: string;
  msg?: string;
  S?: string; // symbol
  p?: number; // price
  s?: number; // size
  t?: string; // ISO timestamp
}

export function startAlpacaFeed(symbols: string[], onTick: TickHandler): () => void {
  const keyId = process.env.ALPACA_KEY_ID;
  const secretKey = process.env.ALPACA_SECRET_KEY;

  if (!keyId || !secretKey) {
    throw new Error('ALPACA_KEY_ID and ALPACA_SECRET_KEY must be set in .env when DATA_SOURCE=alpaca');
  }

  const ws = new WebSocket(ALPACA_WS_URL);

  ws.onopen = () => {
    ws.send(JSON.stringify({ action: 'auth', key: keyId, secret: secretKey }))
  };

  ws.onmessage = (event) => {
    const messages: AlpacaMessage[] = JSON.parse(event.data.toString());
    messages.forEach((msg) => {
      if (msg.T === 'success' && msg.msg === 'authenticated') {
        ws.send(JSON.stringify({ action: 'subscribe', trades: symbols }));
      }
      if (msg.T === 'error') {
        console.log("Error: " + msg.msg);
      }
      if (msg.T === 't' && msg.S !== undefined && msg.p !== undefined && msg.s !== undefined && msg.t !== undefined) {
        onTick(msg.S, msg.p, msg.s, new Date(msg.t).getTime())
      }
    });
  };

  ws.onclose = () => {
    console.log("Closing");
  }
  ws.onerror = (error) => {
    console.log("Error:" + error.message);
  }

  return () => ws.close();
}
