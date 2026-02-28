// Daily report service: sector performance and Economic Savings (AI vs Energy)
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
 * Fetches quotes for all tickers in a sector and returns average daily change %.
 */
async function getSectorAvgDailyChange(tickers) {
  const quotes = await Promise.all(
    tickers.map((ticker) => marketDataService.getQuote(ticker))
  );
  const valid = quotes.filter((q) => q.changePercent != null && !Number.isNaN(q.changePercent));
  const avgDailyChangePercent =
    valid.length === 0
      ? 0
      : valid.reduce((sum, q) => sum + q.changePercent, 0) / valid.length;
  return { avgDailyChangePercent, quotes };
}

/**
 * Core report builder — shared by getDailyReport and generateReport.
 * @param {string}  date          ISO date label (YYYY-MM-DD)
 * @param {boolean} forceArchive  save regardless of trading-day check
 */
async function buildReport(date, forceArchive = false) {
  const sectors      = stocksConfig.sectors || [];
  const aiSector     = sectors.find((s) => s.id === 'ai');
  const energySector = sectors.find((s) => s.id === 'energy');

  if (!aiSector || !energySector) {
    return {
      date,
      sectors: [],
      economicSavings: null,
      error: 'AI or Energy sector not configured',
    };
  }

  const [aiResult, energyResult] = await Promise.all([
    getSectorAvgDailyChange(aiSector.tickers),
    getSectorAvgDailyChange(energySector.tickers),
  ]);

  const economicSavings =
    aiResult.avgDailyChangePercent - energyResult.avgDailyChangePercent;

  const report = {
    date,
    sectors: [
      {
        id:  aiSector.id,
        label: aiSector.label,
        avgDailyChangePercent: Math.round(aiResult.avgDailyChangePercent * 100) / 100,
        tickerCount: aiSector.tickers.length,
      },
      {
        id:  energySector.id,
        label: energySector.label,
        avgDailyChangePercent: Math.round(energyResult.avgDailyChangePercent * 100) / 100,
        tickerCount: energySector.tickers.length,
      },
    ],
    economicSavings: Math.round(economicSavings * 100) / 100,
    asOf: new Date().toISOString(),
  };

  if (forceArchive || isTradingDay()) {
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
