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

module.exports = router;
