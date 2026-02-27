// שירות תצורה (Config Service) — exposes stock/industry configuration
const stocksConfig = require('../config/stocks');

function getConfig() {
  return stocksConfig;
}

module.exports = { getConfig };
