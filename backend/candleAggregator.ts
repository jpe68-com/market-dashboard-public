// Turns a stream of individual trade ticks into OHLCV candles.

import type { Candle } from './types.js';

const INTERVAL_MS = 60 * 1000; // 1-minute candles
const HISTORY_LIMIT = 120; // keep the last 120 candles per symbol in memory

type IngestResult = {
  symbol: string;
  candle: Candle;
  isNewCandle: boolean;
}

export class CandleAggregator {
  private history: Map<string, Candle[]>;
  private inProgress: Map<string, Candle>;

  constructor() {
    this.history = new Map();
    this.inProgress = new Map();
  }

  ingestTick(symbol: string, price: number, size: number, timestamp: number = Date.now()): IngestResult {
    let bucket = Math.floor(timestamp / INTERVAL_MS) * INTERVAL_MS;

    let candle: Candle;
    let isNewCandle = false;
    let lookup = this.inProgress.get(symbol);
    if (!lookup) {
      candle = {
        time: bucket,
        open: price,
        high: price,
        low: price,
        close: price,
        volume: size,
      }
      isNewCandle = true;
    }
    else {
      let bucketFound = Math.floor(lookup.time / INTERVAL_MS) * INTERVAL_MS;
      if (bucketFound != bucket) {
        this.pushHistory(symbol, lookup);
        candle = {
          time: bucket,
          open: price,
          high: price,
          low: price,
          close: price,
          volume: size,
        }
        isNewCandle = true;
      }
      else {
        candle = lookup;
        candle.high = Math.max(candle.high, price);
        candle.low = Math.min(candle.low, price);
        candle.close = price;
        candle.volume += size;
      }
    }
    this.inProgress.set(symbol, candle);
    return { symbol, candle, isNewCandle };
  }

  private pushHistory(symbol: string, candle: Candle): void {
    let arr = this.history.get(symbol);
    if (!arr) {
      arr = [];
    }
    arr.push(candle);
    if (arr.length > HISTORY_LIMIT) {
      arr.shift();
    }
    this.history.set(symbol, arr);

  }

  // Full candle series for a symbol (history + the live in-progress candle),
  // used to seed a client that just connected.
  getSeries(symbol: string): Candle[] {
    const final = this.history.get(symbol) ?? [];
    const current = this.inProgress.get(symbol);
    return current ? [...final, current] : final;
  }

  getSymbols(): string[] {
    return Array.from(this.inProgress.keys());
  }
}
