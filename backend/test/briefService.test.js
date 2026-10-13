const { test, beforeEach } = require('node:test');
const assert = require('node:assert/strict');

const overviewService = require('../src/services/overviewService');
const newsService     = require('../src/services/newsService');
const store           = require('../src/storage/memoryStore');
const briefService    = require('../src/services/briefService');

const SECTORS = [{
  label: 'AI',
  avgChangePercent: 1.5,
  stocks: [{ ticker: 'NVDA', changePercent: 2 }, { ticker: 'AMD', changePercent: null }],
}];

const BRIEF = { headline: 'Chips lead', summary: 'S', sectors: [{ label: 'AI', takeaway: 'T' }], watch: 'W' };

function fakeClient(onCreate) {
  return { beta: { messages: { create: async (params) => onCreate(params) } } };
}

beforeEach(() => {
  process.env.ANTHROPIC_API_KEY = 'test-key';
  store.clear();
  overviewService.getOverview = async () => ({ sectors: SECTORS });
  newsService.getNews = async () => [{ headline: 'Nvidia beats estimates' }];
});

test('buildPrompt includes moves, missing values and headlines', () => {
  const prompt = briefService.buildPrompt(SECTORS, ['Nvidia beats estimates']);
  assert.match(prompt, /AI: avg \+1\.50% \(NVDA \+2\.00%, AMD n\/a\)/);
  assert.match(prompt, /- Nvidia beats estimates/);
});

test('getBrief returns the structured brief and caches it', async () => {
  let calls = 0;
  let params;
  briefService._setClient(fakeClient((p) => {
    calls++;
    params = p;
    return {
      stop_reason: 'end_turn',
      model: 'claude-opus-5-5',
      content: [{ type: 'text', text: JSON.stringify(BRIEF) }],
    };
  }));

  const first  = await briefService.getBrief();
  const second = await briefService.getBrief();

  assert.equal(first.headline, 'Chips lead');
  assert.equal(second.headline, 'Chips lead');
  assert.equal(calls, 1, 'second call should be served from cache');
  assert.equal(params.model, 'claude-opus-5-5');
  assert.equal(params.output_config.format.type, 'json_schema');
});

test('getBrief surfaces refusals as errors', async () => {
  briefService._setClient(fakeClient(() => ({ stop_reason: 'refusal', content: [] })));
  await assert.rejects(() => briefService.getBrief(), /declined/);
});

test('getBrief reports 503 when no API key is configured', async () => {
  delete process.env.ANTHROPIC_API_KEY;
  await assert.rejects(() => briefService.getBrief(), (err) => err.status === 503);
});
