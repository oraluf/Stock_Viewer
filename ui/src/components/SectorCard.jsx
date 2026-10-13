import Sparkline from './Sparkline';

function fmt(n) {
  return `${n > 0 ? '+' : ''}${n.toFixed(2)}%`;
}

function Mover({ label, stock }) {
  return (
    <span>
      {label} {stock.ticker}{' '}
      <b className={stock.changePercent >= 0 ? 'up-text' : 'down-text'}>{fmt(stock.changePercent)}</b>
    </span>
  );
}

// Home-page sector tile: today's average move, best/worst ticker, 1-month trend
export default function SectorCard({ sector, stats, onSelect }) {
  const avg  = stats?.avgChangePercent;
  const tone = avg == null ? '' : avg >= 0 ? 'up' : 'down';

  return (
    <button
      type="button"
      className={`sector-card ${tone}`}
      onClick={() => onSelect(sector)}
    >
      <div className="sector-card-top">
        <span className="sector-card-label">{sector.label}</span>
        {avg != null ? (
          <span className={`change ${tone}`}>{fmt(avg)}</span>
        ) : (
          <span className="sector-card-pending" />
        )}
      </div>

      <span className="sector-card-tickers">{sector.tickers?.join(' · ')}</span>

      <div className="sector-card-trend">
        <Sparkline points={stats?.trend} />
        <span className="sector-card-trend-label">1M</span>
      </div>

      {stats?.best && stats?.worst && (
        <div className="sector-card-movers">
          <Mover label="Best"  stock={stats.best} />
          <Mover label="Worst" stock={stats.worst} />
        </div>
      )}
    </button>
  );
}
