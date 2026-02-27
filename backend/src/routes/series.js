// נתיב סדרה (Series Route)
const router            = require('express').Router();
const marketDataService = require('../services/marketDataService');

const VALID_RANGES = ['1D', '1M', '1Y'];

router.get('/', async (req, res) => {
  const { ticker, range } = req.query;

  if (!ticker) {
    return res.status(400).json({ error: 'ticker query param is required' });
  }
  if (!range || !VALID_RANGES.includes(range)) {
    return res.status(400).json({ error: `range must be one of: ${VALID_RANGES.join(', ')}` });
  }

  try {
    const data = await marketDataService.getSeries(ticker.toUpperCase(), range);
    res.json(data);
  } catch (err) {
    res.status(502).json({ error: err.message });
  }
});

module.exports = router;
