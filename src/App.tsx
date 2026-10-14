import { useEffect, useState } from 'react';
import './App.css';
import { useMarketSocket } from './hooks/useMarketSocket';
import CandlestickChart from './components/CandlestickChart';
import ConnectionStatus from './components/ConnectionStatus';
import TickerSelector from './components/TickerSelector';


export default function App() {
  const { status, symbols, seriesBySymbol, latestPriceBySymbol } = useMarketSocket();
  const [activeSymbol, setActiveSymbol] = useState<string | null>(null);

  useEffect(() => {
    if (activeSymbol === null && symbols.length > 0) {
      setActiveSymbol(symbols[0]);
    }
  }, [symbols, activeSymbol]);

  const candles = activeSymbol ? seriesBySymbol[activeSymbol] ?? [] : [];
  const latestPrice = activeSymbol ? latestPriceBySymbol[activeSymbol] : undefined;
  const openPrice = candles[0]?.open;
  const change = latestPrice != null && openPrice != null ? latestPrice - openPrice : undefined;
  const changePct = change != null && openPrice ? (change / openPrice) * 100 : undefined;

  return (
    <div className="app">
      <header className="app-header">
        <h1>Market Dashboard</h1>
        <ConnectionStatus status={status} />
      </header>

      <div className="app-body">
        <aside className="sidebar">
          <TickerSelector
            symbols={symbols}
            activeSymbol={activeSymbol}
            latestPriceBySymbol={latestPriceBySymbol}
            onSelect={setActiveSymbol}
          />
        </aside>

        <main className="chart-panel">
          {activeSymbol ? (
            <>
              <header className="chart-panel-header">
                <span className="active-symbol">{activeSymbol}</span>
                <span className="active-price">{latestPrice?.toFixed(2)}</span>
                {change !== undefined && changePct !== undefined && (
                  <span className={`change ${change >= 0 ? 'change-up' : 'change-down'}`}>
                    {change >= 0 ? '+' : ''}{change.toFixed(2)} ({changePct.toFixed(2)}%)
                  </span>
                )}
              </header>
              <div className="chart-container">
                <CandlestickChart candles={candles} />
              </div>
            </>
          ) : (
            <div className="chart-placeholder">Waiting for data…</div>
          )}
        </main>
      </div>
    </div>
  );
}
