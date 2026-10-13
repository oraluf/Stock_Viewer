// נתיב סקירה (Overview Route) — sector snapshot for the home page
const router          = require('express').Router();
const overviewService = require('../services/overviewService');

router.get('/', async (_req, res) => {
  try {
    res.json(await overviewService.getOverview());
  } catch (err) {
    console.error('GET /overview error:', err.message);
    res.status(502).json({ error: err.message || 'Failed to build overview' });
  }
});

module.exports = router;
