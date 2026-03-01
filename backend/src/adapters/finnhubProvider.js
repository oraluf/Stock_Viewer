// מתאם פינהאב (Finnhub Adapter)
// Isolates all Finnhub API calls. To switch providers, implement the same
// interface { getQuote, getSeries } in a new file and update marketDataService.

const BASE = 'https://finnhub.io/api/v1';

// Maps friendly display tickers → Finnhub API symbols
// GLD / SLV are standard NYSE ETFs — no mapping needed (free tier OK)
// OANDA symbols (XAU_USD, XAG_USD) require a paid plan — removed
const SYMBOL_MAP = {
  BTC: 'BINANCE:BTCUSDT',
  ETH: 'BINANCE:ETHUSDT',
};
function toApiSymbol(ticker) {
  return SYMBOL_MAP[ticker] || ticker;
}

async function httpGet(url) {
  const res = await fetch(url);        // Node 18+ native fetch
  if (!res.ok) throw new Error(`Finnhub HTTP ${res.status}`);
  return res.json();
}

// ─── Quote ────────────────────────────────────────────────────────────────────

async function getQuote(ticker) {
  const key = process.env.FINNHUB_API_KEY;
  if (!key) throw new Error('FINNHUB_API_KEY env var is not set');

  const symbol = toApiSymbol(ticker);
  const data = await httpGet(`${BASE}/quote?symbol=${symbol}&token=${key}`);

  if (data.c === undefined || data.c === null) {
    throw new Error(`No quote data returned for ${ticker}`);
  }

  return {
    ticker,
    price:         data.c,                    // current price
    changePercent: data.dp,                   // daily change %
    asOf:          new Date().toISOString(),
    source:        'finnhub',
  };
}

// ─── Series (candles) ─────────────────────────────────────────────────────────

function rangeParams(range) {
  const now = Math.floor(Date.now() / 1000);
  switch (range) {
    case '1D': return { resolution: '15', from: now - 86400,       to: now };
    case '1M': return { resolution: 'D',  from: now - 31  * 86400, to: now };
    case '1Y': return { resolution: 'D',  from: now - 366 * 86400, to: now };
    default:   throw new Error(`Unknown range: ${range}`);
  }
}

async function getSeries(ticker, range) {
  const key = process.env.FINNHUB_API_KEY;
  if (!key) throw new Error('FINNHUB_API_KEY env var is not set');

  const symbol = toApiSymbol(ticker);
  const { resolution, from, to } = rangeParams(range);
  const url = `${BASE}/stock/candle?symbol=${symbol}&resolution=${resolution}&from=${from}&to=${to}&token=${key}`;

  const data = await httpGet(url);

  if (data.s !== 'ok') {
    throw new Error(`Finnhub returned status "${data.s}" for ${ticker} [${range}]`);
  }

  // Normalize to common format: [{ t, o, h, l, c, v }]
  return data.t.map((ts, i) => ({
    t: new Date(ts * 1000).toISOString(),
    o: data.o[i],
    h: data.h[i],
    l: data.l[i],
    c: data.c[i],
    v: data.v[i],
  }));
}

// ─── Market News ──────────────────────────────────────────────────────────────

async function getNews(category = 'general', count = 12) {
  const key = process.env.FINNHUB_API_KEY;
  if (!key) throw new Error('FINNHUB_API_KEY env var is not set');

  const data = await httpGet(`${BASE}/news?category=${category}&token=${key}`);
  if (!Array.isArray(data)) throw new Error('Unexpected news response from Finnhub');

  return data.slice(0, count).map((item) => ({
    id:       item.id,
    headline: item.headline,
    source:   item.source,
    url:      item.url,
    datetime: item.datetime,
  }));
}

// ─── Historical daily change (candles) ────────────────────────────────────────
// Used by reportService when generating a report for a past date.
// Fetches the last 7 days of daily candles and returns close + changePercent
// for the selected date vs its previous trading day.

async function getHistoricalChange(ticker, dateStr) {
  const key = process.env.FINNHUB_API_KEY;
  if (!key) throw new Error('FINNHUB_API_KEY env var is not set');

  const symbol = toApiSymbol(ticker);
  const dateMs = new Date(dateStr).getTime();
  const from   = Math.floor((dateMs - 7 * 86400 * 1000) / 1000); // 7 days back covers weekends + holidays
  const to     = Math.floor(dateMs / 1000) + 86400;               // end of selected date

  const url = `${BASE}/stock/candle?symbol=${symbol}&resolution=D&from=${from}&to=${to}&token=${key}`;

  let data;
  try {
    data = await httpGet(url);
  } catch (err) {
    // 403 = free-tier plan restriction for this symbol (common for crypto/Binance)
    console.warn(`[Historical] ${ticker} candle unavailable: ${err.message}`);
    return { ticker, price: null, changePercent: null };
  }

  // Need ≥ 2 candles: the selected date and one prior (to compute changePercent)
  if (data.s !== 'ok' || !Array.isArray(data.c) || data.c.length < 2) {
    return { ticker, price: null, changePercent: null }; // weekend / holiday / no data
  }

  const close         = data.c[data.c.length - 1];
  const prevClose     = data.c[data.c.length - 2];
  const changePercent = prevClose ? ((close - prevClose) / prevClose) * 100 : null;

  return { ticker, price: close, changePercent };
}

module.exports = { getQuote, getSeries, getNews, getHistoricalChange };
