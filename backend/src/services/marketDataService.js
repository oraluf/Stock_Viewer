// שירות נתוני שוק (Market Data Service)
// Central business logic: picks the right adapter, applies cache, returns data.

const cache   = require('./cacheService');
const finnhub = require('../adapters/finnhubProvider');

const QUOTE_TTL  = 30  * 1000;       // 30 seconds
const SERIES_TTL = 5   * 60 * 1000;  // 5 minutes

function getAdapter() {
  // Future: switch on process.env.PROVIDER to swap adapters
  return finnhub;
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

  const data = await getAdapter().getSeries(ticker, range);
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

module.exports = { getQuote, getSeries, getWeatherMock };
