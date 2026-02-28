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

  const aiAvg     = Math.round(aiResult.avgDailyChangePercent     * 100) / 100;
  const energyAvg = Math.round(energyResult.avgDailyChangePercent * 100) / 100;

  const report = {
    date,
    sectors: [
      {
        id:    aiSector.id,
        label: aiSector.label,
        avgDailyChangePercent: aiAvg,
        tickerCount: aiSector.tickers.length,
        stocks: aiResult.quotes.map((q) => ({
          ticker:        q.ticker,
          price:         q.price != null ? Math.round(q.price * 100) / 100 : null,
          changePercent: q.changePercent != null ? Math.round(q.changePercent * 100) / 100 : null,
        })),
        analysis: buildSectorNarrative(aiSector.label, aiResult.quotes, aiAvg),
      },
      {
        id:    energySector.id,
        label: energySector.label,
        avgDailyChangePercent: energyAvg,
        tickerCount: energySector.tickers.length,
        stocks: energyResult.quotes.map((q) => ({
          ticker:        q.ticker,
          price:         q.price != null ? Math.round(q.price * 100) / 100 : null,
          changePercent: q.changePercent != null ? Math.round(q.changePercent * 100) / 100 : null,
        })),
        analysis: buildSectorNarrative(energySector.label, energyResult.quotes, energyAvg),
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
