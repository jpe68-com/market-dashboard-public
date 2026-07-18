# Real-Time Market Dashboard

A full-stack, real-time market data dashboard built with React, TypeScript, and Node.js. Streams live price data over WebSockets and renders it as interactive candlestick charts with volume and a computed moving average.

<!-- Optional: add a screenshot or GIF of the dashboard here once you have one
![Dashboard screenshot](./docs/screenshot.png)
-->

## Features

- **Live price streaming** over WebSockets — no polling, prices update the instant a new trade comes in
- **Interactive candlestick charts** (via [lightweight-charts](https://tradingview.github.io/lightweight-charts/)) with live volume bars and a 10-period simple moving average
- **Server-side tick aggregation** — raw trade ticks are bucketed into OHLCV candles on the backend, so every connected client sees identical, consistent data
- **Automatic reconnection** with exponential backoff if the connection drops, recovering in 1-2 seconds without a page reload
- **Runs with zero setup** — a built-in simulated data feed means you can run the whole thing locally with no API key required
- **Swappable data source** — flip a single environment variable to switch from simulated data to live market data via the [Alpaca](https://alpaca.markets) API, with no other code changes required

## Tech stack

| Layer | Tech |
|---|---|
| Frontend | React, TypeScript, Vite |
| Charting | lightweight-charts |
| Backend | Node.js, Express, TypeScript |
| Real-time transport | WebSockets (`ws`) |
| Market data | Alpaca API (optional — simulated feed included) |

## Architecture

```
Alpaca API  --WebSocket-->  Backend relay  --WebSocket-->  React dashboard
(or simulator)              (aggregates ticks              (renders candles,
                              into OHLCV candles)            volume, SMA)
```

The backend exists as a relay specifically so market data API credentials never reach the browser — the frontend only ever talks to this project's own server, never directly to a third-party API.

Ticks are aggregated into 1-minute OHLCV candles server-side and broadcast to every connected client, so multiple simultaneous viewers always see the same data, and a newly-connected client is immediately seeded with recent history rather than waiting for the next tick.

## Getting started

Runs entirely with simulated data out of the box — no API key needed.

```bash
# Backend
cd backend
npm install
cp .env.example .env
npm run dev

# Frontend (in a separate terminal)
npm install
npm run dev
```

Open `http://localhost:5173`.

### Using real market data

1. Create a free account at [alpaca.markets](https://alpaca.markets) and grab a paper-trading API key/secret
2. In `backend/.env`, set `DATA_SOURCE=alpaca` and add your credentials
3. Restart the backend — no other changes needed

Note: live data only flows during US market hours (~9:30am–4pm ET, weekdays).

## Project structure

```
backend/
  server.ts             Express + WebSocket server
  candleAggregator.ts   Converts raw ticks into OHLCV candles
  simulateFeed.ts        Simulated data source (default)
  alpacaClient.ts         Real market data source (optional)
  types.ts                Shared WebSocket message protocol
src/
  App.tsx                Main layout
  hooks/useMarketSocket.ts   WebSocket connection + reconnect logic
  components/
    CandlestickChart.tsx
    TickerSelector.tsx
    ConnectionStatus.tsx
```

## License

MIT
