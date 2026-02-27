// In dev: empty BASE → Vite proxy routes to :3001
// In production: VITE_API_URL points to the deployed backend (e.g. Render)
const BASE = import.meta.env.VITE_API_URL || '';

async function request(path) {
  const res = await fetch(`${BASE}${path}`);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `HTTP ${res.status}`);
  }
  return res.json();
}

export const fetchConfig = ()             => request('/config');
export const fetchQuote  = (ticker)       => request(`/quote?ticker=${ticker}`);
export const fetchSeries = (ticker, range)=> request(`/series?ticker=${ticker}&range=${range}`);
export const fetchReportDaily = ()       => request('/report/daily');
export const fetchWeather = ()           => request('/weather');
