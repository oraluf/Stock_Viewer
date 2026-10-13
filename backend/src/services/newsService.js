// News service — wraps Finnhub market news with a TTL cache
const cache   = require('./cacheService');
const finnhub = require('../adapters/finnhubProvider');

const NEWS_TTL = 10 * 60 * 1000; // 10 minutes

// Last successful batch — served if Finnhub is briefly unavailable
let lastGood = [];

async function getNews() {
  const cached = cache.get('news', {});
  if (cached) return cached;

  try {
    const data = await finnhub.getNews('general', 12);
    cache.set('news', {}, data, NEWS_TTL);
    lastGood = data;
    return data;
  } catch (err) {
    console.warn('[News] Finnhub unavailable:', err.message);
    return lastGood;
  }
}

module.exports = { getNews };
