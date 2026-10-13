// שירות נתוני שוק (Market Data Service)
// Central business logic: picks the right adapter, applies cache, returns data.

const cache   = require('./cacheService');
const finnhub = require('../adapters/finnhubProvider');
const yahoo   = require('../adapters/yahooProvider');

const QUOTE_TTL  = 30  * 1000;       // 30 seconds
const SERIES_TTL = 5   * 60 * 1000;  // 5 minutes

function getAdapter() {
  // Future: switch on process.env.PROVIDER to swap adapters
  return finnhub;
}

// Finnhub free tier blocks candles (403) — history comes from Yahoo
function getHistoryAdapter() {
  return yahoo;
}

async function getQuote(ticker) {
  const cached = cache.get('quote', { ticker });
  if (cached) return cached;

  const data = await getAdapter().getQuote(ticker);
  cache.set('quote', { ticker }, data, QUOTE_TTL);
  return data;
}

async function getSeries(ticker, range) {
  const cached = cache.get('series', { ticker, range });
  if (cached) return cached;

  const data = await getHistoryAdapter().getSeries(ticker, range);
  cache.set('series', { ticker, range }, data, SERIES_TTL);
  return data;
}

// ─── Weather placeholder (mock) — NYC. Replace with real API call using OPENWEATHER_KEY.
function getWeatherMock() {
  return {
    nyc: { temp: 38, conditions: 'Cloudy', label: 'New York City' },
    asOf: new Date().toISOString(),
  };
}

async function getHistoricalQuote(ticker, date) {
  // Historical data is immutable — cache by ticker + date to avoid redundant API calls
  const cached = cache.get('hist', { ticker, date });
  if (cached) return cached;

  const data = await getHistoryAdapter().getHistoricalChange(ticker, date);
  if (data.changePercent != null) {
    cache.set('hist', { ticker, date }, data, 30 * 60 * 1000); // 30-min TTL
  }
  return data;
}

module.exports = { getQuote, getSeries, getHistoricalQuote, getWeatherMock };
