import { useState, useEffect } from 'react';
import { fetchReportDaily, fetchNews } from '../api';

export default function InsightsPlaceholders() {
  const [report,    setReport]    = useState(null);
  const [news,      setNews]      = useState([]);
  const [reportErr, setReportErr] = useState(null);

  useEffect(() => {
    fetchReportDaily()
      .then(setReport)
      .catch((e) => setReportErr(e.message));

    fetchNews()
      .then((items) => setNews(items.slice(0, 5)))
      .catch(() => {});
  }, []);

  return (
    <section className="insights-placeholders">
      <h3 className="insights-title">Insights &amp; Savings</h3>
      <div className="insights-grid">

        {/* Economic Savings */}
        <div className="insight-card">
          <span className="insight-label">Economic Savings</span>
          <span className="insight-value">
            {reportErr
              ? '—'
              : report?.economicSavings != null
                ? `${report.economicSavings > 0 ? '+' : ''}${report.economicSavings}%`
                : '…'}
          </span>
          <span className="insight-desc">AI vs Energy avg daily change</span>
        </div>

        {/* Market News */}
        <div className="insight-card insight-card--news">
          <span className="insight-label">Market News</span>
          {news.length === 0 ? (
            <span className="insight-value" style={{ fontSize: '0.8rem' }}>Loading…</span>
          ) : (
            <ul className="insights-news-list">
              {news.map((item) => (
                <li key={item.id}>
                  <a
                    href={item.url || '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="insights-news-link"
                  >
                    {item.headline}
                  </a>
                  {item.source && (
                    <span className="insights-news-source"> · {item.source}</span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>

      </div>
    </section>
  );
}
