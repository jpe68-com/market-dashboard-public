// Generates fake but realistic-looking trade ticks using a random walk.
// This lets you build and demo the whole dashboard before without market data API key

import type { TickHandler } from './types.js';

const STARTING_PRICES: Record<string, number> = {
  AAPL: 195,
  TSLA: 245,
  NVDA: 118,
};

export function startSimulatedFeed(symbols: string[], onTick: TickHandler): () => void {
  let prices: number[] = [];
  symbols.forEach((element, index) => {
    if (STARTING_PRICES[element]) {
      prices[index] = STARTING_PRICES[element];
    } else {
      prices[index] = Math.random() * 200 + 100 //100-300
    }
  });

  const intervalId = setInterval(() => {
    symbols.forEach((symbol, index) => {
      const isBurst = Math.random() < 0.05;
      const maxStep = isBurst ? 5 : 0.5; //bigger jump 5% of time to simulate more variation in market
      const change = (Math.random() * 2 - 1) * maxStep;
      prices[index] = Math.max(1, prices[index] + change);

      const size = Math.floor(Math.random() * 191) + 10; // 10-200
      onTick(symbol, prices[index], size, Date.now());
    });
  }, 500);

  return () => clearInterval(intervalId);
}
