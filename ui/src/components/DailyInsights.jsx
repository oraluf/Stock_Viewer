import { useState, useEffect } from 'react';
import { fetchReportArchive, generateReport } from '../api';

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
  const [archive,    setArchive]    = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState(null);

  // Manual generate state
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  const [genDate,    setGenDate]    = useState(yesterday);
  const [generating, setGenerating] = useState(false);
  const [genMsg,     setGenMsg]     = useState(null); // { type: 'ok'|'err', text }

  function loadArchive() {
    setLoading(true);
    fetchReportArchive()
      .then((data) => { setArchive(data); setError(null); })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => { loadArchive(); }, []);

  async function handleGenerate() {
    setGenerating(true);
    setGenMsg(null);
    try {
      const report = await generateReport(genDate);
      setGenMsg({ type: 'ok', text: `Report for ${report.date} saved.` });
      loadArchive();
    } catch (e) {
      setGenMsg({ type: 'err', text: e.message });
    } finally {
      setGenerating(false);
    }
  }

  return (
    <section className="daily-insights">
      <div className="daily-insights-header">
        <h2 className="daily-insights-title">Daily Insights Archive</h2>
      </div>

      {/* ── Manual generate ── */}
      <div className="generate-panel">
        <span className="generate-label">Generate report for:</span>
        <input
          type="date"
          className="generate-date-input"
          value={genDate}
          max={new Date().toISOString().slice(0, 10)}
          onChange={(e) => setGenDate(e.target.value)}
        />
        <button
          type="button"
          className="nav-btn active"
          onClick={handleGenerate}
          disabled={generating || !genDate}
        >
          {generating ? 'Generating…' : '▶ Generate'}
        </button>
        {genMsg && (
          <span
            className="generate-msg"
            style={{ color: genMsg.type === 'ok' ? '#22c55e' : '#ef4444' }}
          >
            {genMsg.text}
          </span>
        )}
      </div>

      {/* ── Archive list ── */}
      {loading && <p className="insights-empty">Loading archive…</p>}
      {error   && <p className="insights-empty" style={{ color: '#ef4444' }}>{error}</p>}

      {!loading && !error && archive.length === 0 && (
        <p className="insights-empty">
          No reports yet. Use the generator above or visit the Dashboard on a trading day
          (Mon–Fri) to auto-save today's report.
        </p>
      )}

      {!loading && archive.map((report) => (
        <ReportRow key={report.date} report={report} />
      ))}
    </section>
  );
}
