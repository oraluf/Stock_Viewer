// Weather placeholder — Houston (Energy) and Palo Alto (Tech) for future integration
const marketDataService = require('../services/marketDataService');

const router = require('express').Router();

router.get('/', (_req, res) => {
  try {
    const data = marketDataService.getWeatherMock();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message || 'Weather unavailable' });
  }
});

module.exports = router;
