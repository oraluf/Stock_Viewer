// נתיב מחיר (Quote Route)
const router            = require('express').Router();
const marketDataService = require('../services/marketDataService');

router.get('/', async (req, res) => {
  const { ticker } = req.query;
  if (!ticker) return res.status(400).json({ error: 'ticker query param is required' });

  try {
    const data = await marketDataService.getQuote(ticker.toUpperCase());
    res.json(data);
  } catch (err) {
    res.status(502).json({ error: err.message });
  }
});

module.exports = router;
