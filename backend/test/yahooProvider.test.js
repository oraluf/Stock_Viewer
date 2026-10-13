const { test, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const yahoo  = require('../src/adapters/yahooProvider');

const realFetch = global.fetch;
afterEach(() => { global.fetch = realFetch; });

function chartResponse(timestamps, closes) {
  return {
    ok: true,
    json: async () => ({
      chart: {
        result: [{
          timestamp: timestamps,
          indicators: { quote: [{
            open: closes, high: closes, low: closes, close: closes,
            volume: closes.map(() => 100),
          }] },
        }],
      },
    }),
  };
}

test('getSeries normalizes candles and drops null closes', async () => {
  global.fetch = async () => chartResponse([1, 2, 3], [10, null, 12]);

  const series = await yahoo.getSeries('NVDA', '1D');

  assert.equal(series.length, 2);
  assert.deepEqual(series.map((p) => p.c), [10, 12]);
  assert.equal(series[0].t, new Date(1000).toISOString());
});

test('getSeries maps crypto tickers to Yahoo symbols', async () => {
  let requested;
  global.fetch = async (url) => { requested = url; return chartResponse([1, 2], [1, 2]); };

  await yahoo.getSeries('BTC', '1M');

  assert.match(requested, /\/BTC-USD\?range=1mo&interval=1d$/);
});

test('getSeries rejects unknown ranges', async () => {
  await assert.rejects(() => yahoo.getSeries('NVDA', '5Y'), /Unknown range/);
});

test('getHistoricalChange computes % change vs previous close', async () => {
  global.fetch = async () => chartResponse([1, 2, 3], [100, 100, 110]);

  const result = await yahoo.getHistoricalChange('AAPL', '2026-10-09');

  assert.equal(result.price, 110);
  assert.ok(Math.abs(result.changePercent - 10) < 1e-9);
});

test('getHistoricalChange returns nulls instead of throwing on HTTP errors', async () => {
  global.fetch = async () => ({ ok: false, status: 429 });

  const result = await yahoo.getHistoricalChange('AAPL', '2026-10-09');

  assert.deepEqual(result, { ticker: 'AAPL', price: null, changePercent: null });
});
