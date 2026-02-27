// Daily report service: sector performance and Economic Savings (AI vs Energy)
const stocksConfig = require('../config/stocks');
const marketDataService = require('./marketDataService');

/**
 * Fetches quotes for all tickers in a sector and returns average daily change %.
 * @param {string[]} tickers
 * @returns {{ avgDailyChangePercent: number, quotes: object[] }}
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
 * Builds the daily report: sector averages and Economic Savings (AI avg − Energy avg).
 */
async function getDailyReport() {
  const sectors = stocksConfig.sectors || [];
  const aiSector = sectors.find((s) => s.id === 'ai');
  const energySector = sectors.find((s) => s.id === 'energy');

  if (!aiSector || !energySector) {
    return {
      date: new Date().toISOString().slice(0, 10),
      sectors: [],
      economicSavings: null,
      error: 'AI or Energy sector not configured',
    };
  }

  const [aiResult, energyResult] = await Promise.all([
    getSectorAvgDailyChange(aiSector.tickers),
    getSectorAvgDailyChange(energySector.tickers),
  ]);

  // Economic Savings: average daily change of AI minus average daily change of Energy
  const economicSavings =
    aiResult.avgDailyChangePercent - energyResult.avgDailyChangePercent;

  return {
    date: new Date().toISOString().slice(0, 10),
    sectors: [
      {
        id: aiSector.id,
        label: aiSector.label,
        avgDailyChangePercent: Math.round(aiResult.avgDailyChangePercent * 100) / 100,
        tickerCount: aiSector.tickers.length,
      },
      {
        id: energySector.id,
        label: energySector.label,
        avgDailyChangePercent: Math.round(energyResult.avgDailyChangePercent * 100) / 100,
        tickerCount: energySector.tickers.length,
      },
    ],
    economicSavings: Math.round(economicSavings * 100) / 100,
    asOf: new Date().toISOString(),
  };
}

module.exports = { getDailyReport };
