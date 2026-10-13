// שירות סקירה (Overview Service)
// Per-sector snapshot for the home page: today's average move, best/worst
// ticker, and a 1-month trend line (average % change of the sector's tickers).

const stocksConfig      = require('../config/stocks');
const marketDataService = require('./marketDataService');

/** Average of numbers, ignoring null/NaN. Returns null when nothing is valid. */
function average(values) {
  const valid = values.filter((v) => v != null && !Number.isNaN(v));
  return valid.length ? valid.reduce((a, b) => a + b, 0) / valid.length : null;
}

/**
 * Combines several close-price series into one sector trend:
 * each series becomes % change from its first point, then the series are
 * averaged point by point, aligned on their most recent points.
 * Exported for tests.
 */
function sectorTrend(seriesList) {
  const usable = seriesList.filter((s) => Array.isArray(s) && s.length > 1);
  if (usable.length === 0) return [];

  const len = Math.min(...usable.map((s) => s.length));
  const normalized = usable.map((s) => {
    const tail = s.slice(-len);
    const base = tail[0];
    return tail.map((c) => ((c - base) / base) * 100);
  });

  return Array.from({ length: len }, (_, i) =>
    Math.round(average(normalized.map((n) => n[i])) * 100) / 100
  );
}

async function getSectorOverview(sector) {
  const [quotes, series] = await Promise.all([
    Promise.allSettled(sector.tickers.map((t) => marketDataService.getQuote(t))),
    Promise.allSettled(sector.tickers.map((t) => marketDataService.getSeries(t, '1M'))),
  ]);

  const stocks = quotes.map((r, i) => ({
    ticker:        sector.tickers[i],
    price:         r.status === 'fulfilled' ? r.value.price : null,
    changePercent: r.status === 'fulfilled' ? r.value.changePercent : null,
  }));

  const ranked = stocks
    .filter((s) => s.changePercent != null)
    .sort((a, b) => b.changePercent - a.changePercent);

  const closes = series.map((r) =>
    r.status === 'fulfilled' ? r.value.map((p) => p.c) : null
  );

  const avg = average(stocks.map((s) => s.changePercent));

  return {
    id:               sector.id,
    label:            sector.label,
    avgChangePercent: avg == null ? null : Math.round(avg * 100) / 100,
    best:             ranked[0] || null,
    worst:            ranked.length > 1 ? ranked[ranked.length - 1] : null,
    stocks,
    trend:            sectorTrend(closes),
  };
}

async function getOverview() {
  const sectors = await Promise.all(stocksConfig.sectors.map(getSectorOverview));
  return { sectors, asOf: new Date().toISOString() };
}

module.exports = { getOverview, sectorTrend };
