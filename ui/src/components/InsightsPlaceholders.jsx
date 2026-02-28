import { useState, useEffect } from 'react';
import { fetchNews } from '../api';

export default function InsightsPlaceholders() {
  const [news,    setNews]    = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNews()
      .then((items) => { setNews(items.slice(0, 8)); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  return (
    <section className="insights-placeholders">
      <div className="insights-news-header">
        <span className="insights-news-badge">LIVE</span>
        <h3 className="insights-title">Market News</h3>
      </div>

      {loading ? (
        <p className="insights-news-loading">Fetching headlines…</p>
      ) : news.length === 0 ? (
        <p className="insights-news-loading">No headlines available.</p>
      ) : (
        <ul className="insights-news-list">
          {news.map((item) => (
            <li key={item.id} className="insights-news-item">
              <a
                href={item.url || '#'}
                target="_blank"
                rel="noopener noreferrer"
                className="insights-news-link"
              >
                {item.headline}
              </a>
              {item.source && (
                <span className="insights-news-source-tag">{item.source}</span>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
