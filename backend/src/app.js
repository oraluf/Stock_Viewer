'use strict';
require('dotenv').config();          // loads backend/.env

const express = require('express');
const cors    = require('cors');

const healthRouter = require('./routes/health');
const configRouter = require('./routes/config');
const quoteRouter  = require('./routes/quote');
const seriesRouter = require('./routes/series');
const reportRouter = require('./routes/report');
const weatherRouter = require('./routes/weather');
const newsRouter   = require('./routes/news');
const overviewRouter = require('./routes/overview');
const briefRouter  = require('./routes/brief');

const app = express();

app.use(cors());
app.use(express.json());

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/health', healthRouter);
app.use('/config', configRouter);
app.use('/quote',  quoteRouter);
app.use('/series', seriesRouter);
app.use('/report', reportRouter);
app.use('/weather', weatherRouter);
app.use('/news',   newsRouter);
app.use('/overview', overviewRouter);
app.use('/brief',  briefRouter);

// 404 catch-all
app.use((_req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// ─── Start ────────────────────────────────────────────────────────────────────
// Only listen when run directly, so tests can import the app without opening a port
if (require.main === module) {
  const PORT = process.env.PORT || 3001;
  app.listen(PORT, () => {
    console.log(`Stock Viewer backend  →  http://localhost:${PORT}`);
    console.log(`AI brief: ${process.env.ANTHROPIC_API_KEY ? 'enabled' : 'disabled (no ANTHROPIC_API_KEY)'}`);
  });
}

module.exports = app;
