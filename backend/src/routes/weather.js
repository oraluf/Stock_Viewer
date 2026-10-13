// נתיב מזג אוויר (Weather Route) — live NYC weather for the header
const router         = require('express').Router();
const weatherService = require('../services/weatherService');

router.get('/', async (_req, res) => {
  try {
    const data = await weatherService.getWeather();
    res.json(data);
  } catch (err) {
    res.status(502).json({ error: err.message || 'Weather unavailable' });
  }
});

module.exports = router;
