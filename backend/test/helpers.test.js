const { test } = require('node:test');
const assert = require('node:assert/strict');
const { describe: describeWeather } = require('../src/services/weatherService');
const { buildSectorNarrative }      = require('../src/services/reportService');

test('weather codes map to readable labels', () => {
  assert.equal(describeWeather(0), 'Clear');
  assert.equal(describeWeather(3), 'Cloudy');
  assert.equal(describeWeather(61), 'Rain');
  assert.equal(describeWeather(95), 'Thunderstorm');
});

test('sector narrative names best and worst performers', () => {
  const text = buildSectorNarrative('AI', [
    { ticker: 'NVDA', changePercent: 3 },
    { ticker: 'AMD',  changePercent: -1 },
  ], 1);
  assert.match(text, /gained 1\.00%/);
  assert.match(text, /NVDA was the top performer at \+3\.00%/);
  assert.match(text, /AMD was the weakest at -1\.00%/);
});

test('sector narrative handles a sector with no data', () => {
  assert.match(buildSectorNarrative('Crypto', [{ ticker: 'BTC', changePercent: null }], 0), /No data available/);
});
