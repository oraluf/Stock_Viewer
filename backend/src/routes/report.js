// Report routes — daily report with Economic Savings + archive
const router = require('express').Router();
const reportService = require('../services/reportService');

router.get('/daily', async (_req, res) => {
  try {
    const data = await reportService.getDailyReport();
    res.json(data);
  } catch (err) {
    console.error('GET /report/daily error:', err.message);
    res.status(500).json({ error: err.message || 'Failed to build daily report' });
  }
});

router.get('/archive', (_req, res) => {
  try {
    const data = reportService.getArchive();
    res.json(data);
  } catch (err) {
    console.error('GET /report/archive error:', err.message);
    res.status(500).json({ error: err.message || 'Failed to fetch archive' });
  }
});

// POST /report/generate — force-generate a report for any date (bypasses trading-day check)
// Body: { date: "2026-02-27" }  (date is optional; defaults to today)
router.post('/generate', async (req, res) => {
  try {
    const date = req.body?.date || new Date().toISOString().slice(0, 10);
    // Validate date format
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({ error: 'date must be YYYY-MM-DD' });
    }
    const data = await reportService.generateReport(date);
    res.json(data);
  } catch (err) {
    console.error('POST /report/generate error:', err.message);
    res.status(500).json({ error: err.message || 'Failed to generate report' });
  }
});

// POST /report/test-doc — sends a Hello World payload to GOOGLE_DOCS_WEBHOOK_URL.
// Use this to isolate whether the issue is the connection or the report logic.
router.post('/test-doc', async (_req, res) => {
  const docsUrl = process.env.GOOGLE_DOCS_WEBHOOK_URL;
  if (!docsUrl) {
    return res.status(400).json({ error: 'GOOGLE_DOCS_WEBHOOK_URL is not set in .env' });
  }

  const payload = {
    date: new Date().toISOString().slice(0, 10),
    economicSavings: 0.42,
    asOf: new Date().toISOString(),
    sectors: [{
      label: 'TEST',
      avgDailyChangePercent: 1.23,
      analysis: 'Hello World — connection test from Stock Viewer backend.',
      stocks: [{ ticker: 'TEST', price: 100, changePercent: 1.23 }],
    }],
  };

  try {
    console.log('[test-doc] Sending test payload to', docsUrl);
    const response = await fetch(docsUrl, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(payload),
    });
    const text = await response.text();
    console.log('[test-doc] Status:', response.status, '| Body:', text);
    res.json({ webhookStatus: response.status, webhookBody: text });
  } catch (err) {
    console.error('[test-doc] Fetch error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
