// News route — returns latest market headlines from Finnhub
const router      = require('express').Router();
const newsService = require('../services/newsService');

router.get('/', async (_req, res) => {
  try {
    const data = await newsService.getNews();
    res.json(data);
  } catch (err) {
    console.error('GET /news error:', err.message);
    res.status(500).json({ error: err.message || 'Failed to fetch news' });
  }
});

module.exports = router;
