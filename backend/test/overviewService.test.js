const { test } = require('node:test');
const assert = require('node:assert/strict');
const { sectorTrend } = require('../src/services/overviewService');

test('sectorTrend averages % change from each series start', () => {
  const trend = sectorTrend([
    [100, 110, 120],   //  0%, +10%, +20%
    [50,  50,  40],    //  0%,   0%, -20%
  ]);
  assert.deepEqual(trend, [0, 5, 0]);
});

test('sectorTrend aligns series of different lengths on the latest points', () => {
  const trend = sectorTrend([
    [1, 2, 100, 200],   // tail used: 100, 200 → 0%, +100%
    [10, 20],           //            10, 20   → 0%, +100%
  ]);
  assert.deepEqual(trend, [0, 100]);
});

test('sectorTrend skips missing series and returns [] when nothing is usable', () => {
  assert.deepEqual(sectorTrend([null, [5]]), []);
  assert.deepEqual(sectorTrend([null, [10, 15]]), [0, 50]);
});
