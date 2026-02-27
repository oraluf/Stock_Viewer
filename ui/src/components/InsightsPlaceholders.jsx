import { useState, useEffect } from 'react';
import { fetchReportDaily, fetchWeather } from '../api';

/**
 * Placeholders for Economic Savings (AI vs Energy) and Weather (Houston, Palo Alto).
 * [cite: 2026-02-02]
 */
export default function InsightsPlaceholders() {
  const [report, setReport] = useState(null);
  const [weather, setWeather] = useState(null);
  const [reportErr, setReportErr] = useState(null);
  const [weatherErr, setWeatherErr] = useState(null);

  useEffect(() => {
    fetchReportDaily()
      .then(setReport)
      .catch((e) => setReportErr(e.message));
    fetchWeather()
      .then(setWeather)
      .catch((e) => setWeatherErr(e.message));
  }, []);

  return (
    <section className="insights-placeholders">
      <h3 className="insights-title">Insights &amp; Savings</h3>
      <div className="insights-grid">
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
        <div className="insight-card">
          <span className="insight-label">Houston (Energy)</span>
          <span className="insight-value">
            {weatherErr
              ? '—'
              : weather?.houston
                ? `${weather.houston.temp}° · ${weather.houston.conditions}`
                : '…'}
          </span>
        </div>
        <div className="insight-card">
          <span className="insight-label">Palo Alto (Tech)</span>
          <span className="insight-value">
            {weatherErr
              ? '—'
              : weather?.paloAlto
                ? `${weather.paloAlto.temp}° · ${weather.paloAlto.conditions}`
                : '…'}
          </span>
        </div>
      </div>
    </section>
  );
}
