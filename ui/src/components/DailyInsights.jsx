import { useState, useEffect } from 'react';
import { fetchReportArchive, fetchReportDaily } from '../api';

function sign(n) {
  return n > 0 ? `+${n}%` : `${n}%`;
}

function ReportRow({ report }) {
  const savings = report.economicSavings;
  const savingsClass = savings > 0 ? 'up' : savings < 0 ? 'down' : '';

  return (
    <div className="insights-row">
      <span className="insights-row-date">{report.date}</span>
      <div className="insights-row-sectors">
        {report.sectors.map((s) => (
          <span key={s.id} className="insights-row-sector">
            <span className="insights-row-sector-label">{s.label}</span>
            <span className={`change ${s.avgDailyChangePercent >= 0 ? 'up' : 'down'}`}>
              {sign(s.avgDailyChangePercent)}
            </span>
          </span>
        ))}
      </div>
      <span className={`insights-row-savings change ${savingsClass}`}>
        {savings != null ? `AI−Energy: ${sign(savings)}` : '—'}
      </span>
    </div>
  );
}

export default function DailyInsights() {
  const [archive, setArchive] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  function load() {
    setLoading(true);
    fetchReportArchive()
      .then((data) => { setArchive(data); setError(null); })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  async function handleRefresh() {
    setRefreshing(true);
    try {
      // Trigger a fresh daily report (also saves it to the archive on trading days)
      await fetchReportDaily();
      load();
    } catch {
      load();
    } finally {
      setRefreshing(false);
    }
  }

  return (
    <section className="daily-insights">
      <div className="daily-insights-header">
        <h2 className="daily-insights-title">Daily Insights Archive</h2>
        <button
          type="button"
          className="back-button"
          onClick={handleRefresh}
          disabled={refreshing}
        >
          {refreshing ? 'Refreshing…' : '↻ Refresh today'}
        </button>
      </div>

      {loading && <p className="insights-empty">Loading archive…</p>}
      {error   && <p className="insights-empty" style={{ color: '#ef4444' }}>{error}</p>}

      {!loading && !error && archive.length === 0 && (
        <p className="insights-empty">
          No reports yet. Reports are saved automatically on trading days (Mon–Fri)
          when the dashboard is visited.
        </p>
      )}

      {!loading && archive.map((report) => (
        <ReportRow key={report.date} report={report} />
      ))}
    </section>
  );
}
