// Report routes — daily report with Economic Savings
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

module.exports = router;
