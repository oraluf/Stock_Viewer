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

module.exports = router;
