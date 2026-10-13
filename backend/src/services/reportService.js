// Daily report service: full sector performance analysis
const stocksConfig      = require('../config/stocks');
const marketDataService = require('./marketDataService');
const reportsStore      = require('../storage/reportsStore');
const sheetsService     = require('./sheetsService');

// Returns true only on Mon–Fri (US trading days; does not account for holidays)
function isTradingDay() {
  const day = new Date().getDay(); // 0=Sun, 6=Sat
  return day >= 1 && day <= 5;
}

/**
 * Generates a plain-English narrative paragraph for a sector based on its quote data.
 */
function buildSectorNarrative(label, quotes, avg) {
  const valid = quotes.filter((q) => q.changePercent != null && !Number.isNaN(q.changePercent));
  if (valid.length === 0) return `No data available for the ${label} sector today.`;

  const sorted = [...valid].sort((a, b) => b.changePercent - a.changePercent);
  const best   = sorted[0];
  const worst  = sorted[sorted.length - 1];
  const dir    = avg >= 0 ? 'gained' : 'declined';
  const tone   = avg >=  1 ? 'reflecting strong buying interest'
               : avg >=  0 ? 'with modest positive momentum'
               : avg >= -1 ? 'amid mild selling pressure'
               :             'under significant selling pressure';

  const fmt = (n) => `${n > 0 ? '+' : ''}${n.toFixed(2)}%`;

  let text = `The ${label} sector ${dir} ${Math.abs(avg).toFixed(2)}% on average today. `;

  if (best.ticker !== worst.ticker) {
    text += `${best.ticker} was the top performer at ${fmt(best.changePercent)}, `;
    text += `while ${worst.ticker} was the weakest at ${fmt(worst.changePercent)}. `;
  } else {
    text += `${best.ticker} moved ${fmt(best.changePercent)}. `;
  }

  text += `Overall the sector traded ${tone}.`;
  return text;
}

/**
 * Fetches quotes for all tickers in a sector and returns average daily change %.
 * Uses live quotes for today; historical candle data for any past date.
 */
async function getSectorAvgDailyChange(tickers, date) {
  const today   = new Date().toISOString().slice(0, 10);
  const fetchFn = date && date !== today
    ? (ticker) => marketDataService.getHistoricalQuote(ticker, date)
    : (ticker) => marketDataService.getQuote(ticker);

  // allSettled so one failed ticker (e.g. 403 on a crypto candle) doesn't abort the whole sector
  const settled = await Promise.allSettled(tickers.map(fetchFn));
  const quotes  = settled.map((r, i) =>
    r.status === 'fulfilled' ? r.value : { ticker: tickers[i], price: null, changePercent: null }
  );
  const valid = quotes.filter((q) => q.changePercent != null && !Number.isNaN(q.changePercent));
  const avgDailyChangePercent =
    valid.length === 0
      ? 0
      : valid.reduce((sum, q) => sum + q.changePercent, 0) / valid.length;
  return { avgDailyChangePercent, quotes };
}

/**
 * Core report builder — processes every configured sector.
 * @param {string}  date          ISO date label (YYYY-MM-DD)
 * @param {boolean} forceArchive  save regardless of trading-day check
 */
async function buildReport(date, forceArchive = false) {
  const sectors = stocksConfig.sectors || [];

  if (sectors.length === 0) {
    return { date, sectors: [], economicSavings: null, error: 'No sectors configured', asOf: new Date().toISOString() };
  }

  // Fetch all sectors in parallel — pass date so past dates use historical candles
  const results = await Promise.all(
    sectors.map((s) => getSectorAvgDailyChange(s.tickers, date))
  );

  // Build sector objects with narrative analysis for every sector
  const reportSectors = sectors.map((sector, i) => {
    const result = results[i];
    const avg    = Math.round(result.avgDailyChangePercent * 100) / 100;
    return {
      id:    sector.id,
      label: sector.label,
      avgDailyChangePercent: avg,
      tickerCount: sector.tickers.length,
      stocks: result.quotes.map((q) => ({
        ticker:        q.ticker,
        price:         q.price        != null ? Math.round(q.price        * 100) / 100 : null,
        changePercent: q.changePercent != null ? Math.round(q.changePercent * 100) / 100 : null,
      })),
      analysis: buildSectorNarrative(sector.label, result.quotes, avg),
    };
  });

  // economicSavings = AI avg − Energy avg (kept for the badge in the UI)
  const aiIdx     = sectors.findIndex((s) => s.id === 'ai');
  const energyIdx = sectors.findIndex((s) => s.id === 'energy');
  const economicSavings =
    aiIdx >= 0 && energyIdx >= 0
      ? Math.round((results[aiIdx].avgDailyChangePercent - results[energyIdx].avgDailyChangePercent) * 100) / 100
      : null;

  const report = {
    date,
    sectors: reportSectors,
    economicSavings,
    asOf: new Date().toISOString(),
  };

  if (forceArchive) {
    reportsStore.save(report);
    // Manual generation: wait so the UI can tell the user whether it reached Google Docs
    report.sentToDocs = await sheetsService.appendReport(report);
  } else if (isTradingDay()) {
    reportsStore.save(report);
    sheetsService.appendReport(report); // fire-and-forget; no-op if not configured
  }

  return report;
}

/** Builds today's report. Auto-saves on trading days. */
async function getDailyReport() {
  return buildReport(new Date().toISOString().slice(0, 10), false);
}

/**
 * Manually generates a report for any date label and force-saves it.
 * Useful when the market is closed (weekends / holidays).
 * @param {string} date  YYYY-MM-DD
 */
async function generateReport(date) {
  return buildReport(date || new Date().toISOString().slice(0, 10), true);
}

/** Returns all archived daily reports (newest first). */
function getArchive() {
  return reportsStore.getAll();
}

module.exports = { getDailyReport, generateReport, getArchive };
