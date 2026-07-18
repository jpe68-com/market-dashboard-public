// renders a list from props and lifts selection
// state up to the parent via a callback, rather than owning the
// "which symbol is selected" state itself.

interface Props {
  symbols: string[];
  activeSymbol: string | null;
  latestPriceBySymbol: Record<string, number>;
  onSelect: (symbol: string) => void;
}

export default function TickerSelector({ symbols, activeSymbol, latestPriceBySymbol, onSelect }: Props) {
  return (
    <div className="ticker-list">
      {symbols.map((symbol) => {
        const price = latestPriceBySymbol[symbol];
        const label = price != null ? `$${price.toFixed(2)}` : '-'
        return (
          <button key={symbol}
            className={`ticker-item ${symbol === activeSymbol ? 'ticker-item-active' : ''}`}
            onClick={() => onSelect(symbol)}>
            <span>{symbol}</span>
            <span>{label}</span>
          </button>)
      }
      )}
    </div>);
}
