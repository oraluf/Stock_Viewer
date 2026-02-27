// נתיב בריאות (Health Route)
const router = require('express').Router();

router.get('/', (_req, res) => {
  res.json({ status: 'ok' });
});

module.exports = router;
