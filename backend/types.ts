// These types mirror frontend/src/types.ts. There's no shared package
// linking the two -- this is a two-package project, not a monorepo -- so
// if you change the WebSocket message shape, update both files.

export interface Candle {
  time: number; // ms since epoch, start of the candle's bucket
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export type ServerMessage =
  | { type: 'init'; symbols: string[]; series: Record<string, Candle[]> }
  | { type: 'tick'; symbol: string; price: number; timestamp: number }
  | { type: 'newCandle'; symbol: string; candle: Candle }
  | { type: 'candleUpdate'; symbol: string; candle: Candle };

export type TickHandler = (symbol: string, price: number, size: number, timestamp: number) => void;
