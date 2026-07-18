// These mirror backend/types.ts. Two separate packages, no shared types
// package linking them.

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

export type ConnectionStatusValue = 'connecting' | 'open' | 'closed';
