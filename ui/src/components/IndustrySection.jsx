import { useState, useEffect } from 'react';
import { fetchQuote } from '../api';
import StockChart from './StockChart';

const RANGES = ['1D', '1M', '1Y'];
const QUOTE_REFRESH_MS = 60 * 1000;   // backend caches quotes for 30s

export default function IndustrySection({ industry }) {
  const [quote,       setQuote]       = useState(null);
  const [activeRange, setActiveRange] = useState('1D');
  const [quoteError,  setQuoteError]  = useState(null);

  useEffect(() => {
    let cancelled = false;
    setQuote(null);
    setQuoteError(null);

    // Background refreshes keep the last good quote on screen if one fails
    const load = (isRefresh) =>
      fetchQuote(industry.ticker)
        .then(q => { if (!cancelled) { setQuote(q); setQuoteError(null); } })
        .catch(err => { if (!cancelled && !isRefresh) setQuoteError(err.message); });

    load(false);
    const id = setInterval(() => load(true), QUOTE_REFRESH_MS);
    return () => { cancelled = true; clearInterval(id); };
  }, [industry.ticker]);

  const isUp = quote && quote.changePercent >= 0;

  return (
    <div className="section">
      {/* ── Header ── */}
      <div className="section-header">
        <span className="industry-label">{industry.label}</span>
        <span className="ticker">{industry.ticker}</span>

        {quoteError ? (
          <span className="badge error">{quoteError}</span>
        ) : quote ? (
          <div className="quote-row">
            <span className="price">${quote.price.toFixed(2)}</span>
            <span className={`change ${isUp ? 'up' : 'down'}`}>
              {isUp ? '+' : ''}{quote.changePercent.toFixed(2)}%
            </span>
          </div>
        ) : (
          <span className="loading-text">Loading quote…</span>
        )}
      </div>

      {/* ── Tab buttons ── */}
      <div className="tabs">
        {RANGES.map(r => (
          <button
            key={r}
            className={`tab ${activeRange === r ? 'active' : ''}`}
            onClick={() => setActiveRange(r)}
          >
            {r}
          </button>
        ))}
      </div>

      {/* ── Chart ── */}
      <StockChart ticker={industry.ticker} range={activeRange} />
    </div>
  );
}
