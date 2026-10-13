// שירות סיכום AI (AI Market Brief)
// Sends today's sector moves + headlines to Claude and returns a short,
// structured market brief. Cached so traffic spikes don't multiply API cost.

const Anthropic       = require('@anthropic-ai/sdk').default;
const cache           = require('./cacheService');
const overviewService = require('./overviewService');
const newsService     = require('./newsService');

const MODEL    = 'claude-opus-5-5';
const BRIEF_TTL = 30 * 60 * 1000;   // 30 minutes — one Claude call per half hour at most

const SYSTEM_PROMPT = `You are a markets analyst writing a brief for a live stock dashboard.
You receive today's percentage moves per sector and ticker, plus recent market headlines.

Write for a smart non-specialist. Connect price moves to the headlines only when a headline
plausibly explains the move; if nothing explains a move, say so plainly rather than inventing a cause.
Use only the numbers provided. Never give investment advice or price predictions.`;

// Structured output — the UI renders these fields directly
const BRIEF_SCHEMA = {
  type: 'object',
  properties: {
    headline: { type: 'string', description: 'One-line summary of the day, max 12 words' },
    summary:  { type: 'string', description: '2-3 sentences on the overall market picture' },
    sectors: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          label:    { type: 'string' },
          takeaway: { type: 'string', description: 'One sentence on what drove this sector' },
        },
        required: ['label', 'takeaway'],
        additionalProperties: false,
      },
    },
    watch: { type: 'string', description: 'One sentence on what is worth watching next' },
  },
  required: ['headline', 'summary', 'sectors', 'watch'],
  additionalProperties: false,
};

let client = null;
function getClient() {
  if (!client) client = new Anthropic();   // reads ANTHROPIC_API_KEY
  return client;
}

function isConfigured() {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

/** Plain-text market snapshot fed to the model. Exported for tests. */
function buildPrompt(sectors, headlines) {
  const fmt = (n) => (n == null ? 'n/a' : `${n > 0 ? '+' : ''}${n.toFixed(2)}%`);

  const sectorLines = sectors.map((s) => {
    const stocks = s.stocks.map((q) => `${q.ticker} ${fmt(q.changePercent)}`).join(', ');
    return `- ${s.label}: avg ${fmt(s.avgChangePercent)} (${stocks})`;
  });

  const newsLines = headlines.map((h) => `- ${h}`);

  return [
    `Date: ${new Date().toISOString().slice(0, 10)}`,
    '',
    'Daily moves by sector:',
    ...sectorLines,
    '',
    'Recent market headlines:',
    ...(newsLines.length ? newsLines : ['- (none available)']),
  ].join('\n');
}

async function generateBrief() {
  const [overview, news] = await Promise.all([
    overviewService.getOverview(),
    newsService.getNews(),
  ]);

  const response = await getClient().beta.messages.create({
    model:      MODEL,
    max_tokens: 16000,
    // On a safety decline the API retries on Anthropic's recommended fallback model
    betas:      ['server-side-fallback-2026-07-01'],
    fallbacks:  'default',
    output_config: {
      effort: 'low',   // short summarization task — low effort keeps latency and cost down
      format: { type: 'json_schema', schema: BRIEF_SCHEMA },
    },
    system:   SYSTEM_PROMPT,
    messages: [{
      role:    'user',
      content: buildPrompt(overview.sectors, news.map((n) => n.headline)),
    }],
  });

  if (response.stop_reason === 'refusal') {
    throw new Error('The model declined to write a brief');
  }

  const text = response.content.find((b) => b.type === 'text')?.text;
  if (!text) throw new Error('Empty response from Claude');

  return {
    ...JSON.parse(text),
    model: response.model,
    asOf:  new Date().toISOString(),
  };
}

// Concurrent visitors share one in-flight request instead of each calling Claude
let inFlight = null;

async function getBrief() {
  if (!isConfigured()) {
    const err = new Error('AI brief is not configured (ANTHROPIC_API_KEY missing)');
    err.status = 503;
    throw err;
  }

  const cached = cache.get('brief', {});
  if (cached) return cached;

  if (!inFlight) {
    inFlight = generateBrief()
      .then((brief) => {
        cache.set('brief', {}, brief, BRIEF_TTL);
        return brief;
      })
      .finally(() => { inFlight = null; });
  }
  return inFlight;
}

/** Test hook: swap in a fake Anthropic client. */
function _setClient(fake) { client = fake; }

module.exports = { getBrief, buildPrompt, isConfigured, _setClient };
