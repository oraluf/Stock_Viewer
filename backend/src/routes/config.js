// נתיב תצורה (Config Route)
const router        = require('express').Router();
const configService = require('../services/configService');

router.get('/', (_req, res) => {
  res.json(configService.getConfig());
});

module.exports = router;
