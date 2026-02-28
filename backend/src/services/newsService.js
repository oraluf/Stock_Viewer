// News service — wraps Finnhub market news with a TTL cache
const cache   = require('./cacheService');
const finnhub = require('../adapters/finnhubProvider');

const NEWS_TTL = 10 * 60 * 1000; // 10 minutes

// Fallback headlines shown when the API is unavailable
const MOCK_NEWS = [
  { id: 1, headline: 'Markets open mixed as investors await Fed statement', source: 'Demo' },
  { id: 2, headline: 'Tech sector leads gains on strong earnings reports',  source: 'Demo' },
  { id: 3, headline: 'Oil prices steady despite geopolitical tensions',      source: 'Demo' },
  { id: 4, headline: 'Crypto market rebounds after weekend selloff',         source: 'Demo' },
  { id: 5, headline: 'Gold hits 3-month high on safe-haven demand',          source: 'Demo' },
];

async function getNews() {
  const cached = cache.get('news', {});
  if (cached) return cached;

  try {
    const data = await finnhub.getNews('general', 12);
    cache.set('news', {}, data, NEWS_TTL);
    return data;
  } catch {
    return MOCK_NEWS;
  }
}

module.exports = { getNews };
