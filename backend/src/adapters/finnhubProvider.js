// מתאם פינהאב (Finnhub Adapter)
// Isolates all Finnhub API calls (live quotes + news). Historical candles are a
// paid Finnhub feature, so they live in yahooProvider instead.

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

module.exports = { getQuote, getNews };
