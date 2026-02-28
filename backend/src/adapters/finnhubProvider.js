// מתאם פינהאב (Finnhub Adapter)
// Isolates all Finnhub API calls. To switch providers, implement the same
// interface { getQuote, getSeries } in a new file and update marketDataService.

const BASE = 'https://finnhub.io/api/v1';

// Maps friendly display tickers → Finnhub API symbols
const SYMBOL_MAP = {
  BTC:    'BINANCE:BTCUSDT',
  ETH:    'BINANCE:ETHUSDT',
  GOLD:   'OANDA:XAU_USD',
  SILVER: 'OANDA:XAG_USD',
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

module.exports = { getQuote, getSeries, getNews };
