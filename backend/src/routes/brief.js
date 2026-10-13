// נתיב סיכום AI (AI Brief Route) — Claude-written market brief
const router       = require('express').Router();
const briefService = require('../services/briefService');

router.get('/', async (_req, res) => {
  try {
    res.json(await briefService.getBrief());
  } catch (err) {
    console.error('GET /brief error:', err.message);
    res.status(err.status || 502).json({ error: err.message || 'Failed to generate brief' });
  }
});

module.exports = router;
