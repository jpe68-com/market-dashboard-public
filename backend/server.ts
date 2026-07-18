// Express + WebSocket server: wires the tick feed, the candle aggregator,
// and connected frontend clients together.

import 'dotenv/config';
import express from 'express';
import { createServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';

import { CandleAggregator } from './candleAggregator.js';
import { startSimulatedFeed } from './simulateFeed.js';
import { startAlpacaFeed } from './alpacaClient.js'; // uncomment once you build step 9

import type { Candle, ServerMessage } from './types.js';

const PORT = process.env.PORT || 4000;
const SYMBOLS = (process.env.SYMBOLS || 'AAPL,TSLA,NVDA').split(',').map((s) => s.trim());
const DATA_SOURCE = process.env.DATA_SOURCE || 'simulate';

const app = express();
app.get('/health', (req, res) => res.json({ "status": "ok" }));
const server = createServer(app);
const wss = new WebSocketServer({ server });

const aggregator = new CandleAggregator();
const clients = new Set<WebSocket>();

function broadcast(message: ServerMessage): void {
  clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(message));
    }
  });
}

wss.on('connection', (socket: WebSocket) => {
  clients.add(socket);

  const series: Record<string, Candle[]> = {};
  SYMBOLS.forEach((symbol) => {
    series[symbol] = aggregator.getSeries(symbol);
  });
  const initMessage: ServerMessage = { type: 'init', symbols: SYMBOLS, series };
  socket.send(JSON.stringify(initMessage));

  socket.on('close', () => clients.delete(socket));
});

function handleTick(symbol: string, price: number, size: number, timestamp: number): void {
  const result = aggregator.ingestTick(symbol, price, size, timestamp);
  const tickMessage: ServerMessage = { type: 'tick', symbol, price, timestamp }
  let candleMessage: ServerMessage;
  if (result.isNewCandle) {
    candleMessage = { type: 'newCandle', symbol, candle: result.candle }
  } else {
    candleMessage = { type: 'candleUpdate', symbol, candle: result.candle }
  }
  broadcast(tickMessage);
  broadcast(candleMessage);
}

console.log(`[server] starting with DATA_SOURCE=${DATA_SOURCE}, symbols=${SYMBOLS.join(', ')}`);

let stop: () => void;
if (DATA_SOURCE != 'alpaca') {
  stop = startSimulatedFeed(SYMBOLS, handleTick);
}
else {
  stop = startAlpacaFeed(SYMBOLS, handleTick);
}

server.listen(PORT, () => {
  console.log(`[server] listening on http://localhost:${PORT}`);
  console.log(`[server] websocket relay on ws://localhost:${PORT}`);
});

process.on('SIGINT', () => {
  console.log('\n[server] shutting down...');
  stop();
  server.close(() => process.exit(0));
});

