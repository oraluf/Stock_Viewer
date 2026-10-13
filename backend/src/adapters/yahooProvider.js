// מתאם יאהו (Yahoo Finance Adapter)
// Historical candles only. Finnhub's free tier returns 403 on /stock/candle,
// so series + historical change come from Yahoo's public chart endpoint.
// Same normalized output as finnhubProvider: [{ t, o, h, l, c, v }]

const BASE = 'https://query1.finance.yahoo.com/v8/finance/chart';

// Maps friendly display tickers → Yahoo symbols
const SYMBOL_MAP = {
  BTC: 'BTC-USD',
  ETH: 'ETH-USD',
};
function toApiSymbol(ticker) {
  return SYMBOL_MAP[ticker] || ticker;
}

async function fetchChart(ticker, query) {
  const url = `${BASE}/${encodeURIComponent(toApiSymbol(ticker))}?${query}`;
  // Yahoo rejects requests without a browser-like User-Agent
  const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
  if (!res.ok) throw new Error(`Yahoo HTTP ${res.status}`);

  const data   = await res.json();
  const result = data.chart?.result?.[0];
  if (!result || !Array.isArray(result.timestamp)) {
    throw new Error(`No chart data returned for ${ticker}`);
  }

  const q = result.indicators.quote[0];
  return result.timestamp
    .map((ts, i) => ({
      t: new Date(ts * 1000).toISOString(),
      o: q.open[i],
      h: q.high[i],
      l: q.low[i],
      c: q.close[i],
      v: q.volume[i],
    }))
    .filter((p) => p.c != null);   // Yahoo pads gaps with nulls
}

// ─── Series ───────────────────────────────────────────────────────────────────

const RANGE_QUERY = {
  '1D': 'range=1d&interval=15m',
  '1M': 'range=1mo&interval=1d',
  '1Y': 'range=1y&interval=1d',
};

async function getSeries(ticker, range) {
  const query = RANGE_QUERY[range];
  if (!query) throw new Error(`Unknown range: ${range}`);
  return fetchChart(ticker, query);
}

// ─── Historical daily change ──────────────────────────────────────────────────
// Close + changePercent for the selected date vs its previous trading day.

async function getHistoricalChange(ticker, dateStr) {
  const dateMs  = new Date(dateStr).getTime();
  const period1 = Math.floor((dateMs - 7 * 86400 * 1000) / 1000); // 7 days back covers weekends + holidays
  const period2 = Math.floor(dateMs / 1000) + 86400;               // end of selected date

  let candles;
  try {
    candles = await fetchChart(ticker, `period1=${period1}&period2=${period2}&interval=1d`);
  } catch (err) {
    console.warn(`[Historical] ${ticker} candle unavailable: ${err.message}`);
    return { ticker, price: null, changePercent: null };
  }

  if (candles.length < 2) {
    return { ticker, price: null, changePercent: null }; // weekend / holiday / no data
  }

  const close         = candles[candles.length - 1].c;
  const prevClose     = candles[candles.length - 2].c;
  const changePercent = prevClose ? ((close - prevClose) / prevClose) * 100 : null;

  return { ticker, price: close, changePercent };
}

module.exports = { getSeries, getHistoricalChange };
