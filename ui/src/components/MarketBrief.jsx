import { useState, useEffect } from 'react';
import { fetchBrief } from '../api';

// Claude-written summary of today's market (backend caches it for 30 min)
export default function MarketBrief({ overview }) {
  const [brief,   setBrief]   = useState(null);
  const [status,  setStatus]  = useState('loading');   // loading | ready | error | disabled

  useEffect(() => {
    let cancelled = false;
    fetchBrief()
      .then((data) => { if (!cancelled) { setBrief(data); setStatus('ready'); } })
      .catch((err) => {
        if (cancelled) return;
        // 503 = no API key on the server — hide the panel rather than show an error
        setStatus(/not configured/i.test(err.message) ? 'disabled' : 'error');
      });
    return () => { cancelled = true; };
  }, []);

  if (status === 'disabled') return null;

  const avgFor = (label) =>
    overview?.sectors.find((s) => s.label === label)?.avgChangePercent;

  return (
    <section className="brief" aria-live="polite">
      <div className="brief-header">
        <span className="brief-badge">✦ AI MARKET BRIEF</span>
        {brief && (
          <span className="brief-meta">
            Written by Claude · {new Date(brief.asOf).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        )}
      </div>

      {status === 'loading' && (
        <div className="brief-loading">
          <span className="brief-dots"><i /><i /><i /></span>
          Claude is reading today's prices and headlines…
        </div>
      )}

      {status === 'error' && (
        <p className="brief-error">The AI brief is unavailable right now. Market data below is still live.</p>
      )}

      {status === 'ready' && (
        <>
          <h2 className="brief-headline">{brief.headline}</h2>
          <p className="brief-summary">{brief.summary}</p>

          <ul className="brief-sectors">
            {brief.sectors.map((s) => {
              const avg = avgFor(s.label);
              return (
                <li key={s.label}>
                  <span className="brief-sector-label">
                    {s.label}
                    {avg != null && (
                      <span className={`change ${avg >= 0 ? 'up' : 'down'}`}>
                        {avg > 0 ? '+' : ''}{avg.toFixed(2)}%
                      </span>
                    )}
                  </span>
                  <span className="brief-sector-text">{s.takeaway}</span>
                </li>
              );
            })}
          </ul>

          <p className="brief-watch"><b>What to watch:</b> {brief.watch}</p>
          <p className="brief-disclaimer">AI-generated from live prices and headlines. Not investment advice.</p>
        </>
      )}
    </section>
  );
}
