import { useState, useEffect } from 'react';
import { fetchConfig, fetchWeather, fetchNews, fetchOverview } from './api';
import IndustrySection from './components/IndustrySection';
import InsightsPlaceholders from './components/InsightsPlaceholders';
import DailyInsights from './components/DailyInsights';
import IntroSplash from './components/IntroSplash';
import SectorCard from './components/SectorCard';
import MarketBrief from './components/MarketBrief';

const OVERVIEW_REFRESH_MS = 60 * 1000;
const WAKE_NOTICE_MS      = 3000;   // Render free tier can take ~50s to wake
const CONFIG_RETRIES      = 3;
const GITHUB_URL          = 'https://github.com/oraluf/Stock_Viewer';

// Normalize config: backend may return sectors or legacy industries
function normalizeSectors(data) {
  if (data.sectors && data.sectors.length) return data.sectors;
  if (data.industries && data.industries.length) {
    return data.industries.map((ind) => ({
      id: ind.id,
      label: ind.label,
      tickers: [ind.ticker],
    }));
  }
  return [];
}

function NewsTicker() {
  const [headlines, setHeadlines] = useState([]);

  useEffect(() => {
    fetchNews()
      .then((items) => setHeadlines(items.map((i) => i.headline)))
      .catch(() => {});
  }, []);

  if (!headlines.length) return null;

  // Duplicate the list so the scroll loops seamlessly
  const text = headlines.join('   ·   ');

  return (
    <div className="news-ticker" aria-label="Market news">
      <span className="news-ticker-label">NEWS</span>
      <div className="news-ticker-track">
        <span className="news-ticker-content">
          {text}&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;{text}
        </span>
      </div>
    </div>
  );
}

function AppHeader({ view, onViewChange }) {
  const [weather, setWeather] = useState(null);

  useEffect(() => {
    fetchWeather().then(setWeather).catch(() => {});
  }, []);

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'short',
    month:   'short',
    day:     'numeric',
    year:    'numeric',
  });

  return (
    <header className="header-wrap">
      <div className="header">
        <div className="header-left">
          <h1>Stock Dashboard</h1>
          <span className="subtitle">Live market data · AI insights</span>
        </div>
        <div className="header-center">
          <span className="header-date">{today}</span>
          {weather?.nyc && (
            <span className="header-weather">
              NYC {weather.nyc.temp}°F · {weather.nyc.conditions}
            </span>
          )}
        </div>
        <nav className="header-nav">
          <button
            type="button"
            className={`nav-btn ${view === 'home' ? 'active' : ''}`}
            onClick={() => onViewChange('home')}
          >
            Dashboard
          </button>
          <button
            type="button"
            className={`nav-btn ${view === 'insights' ? 'active' : ''}`}
            onClick={() => onViewChange('insights')}
          >
            Daily Insights
          </button>
        </nav>
      </div>
      <NewsTicker />
    </header>
  );
}

function LandingPage({ sectors, onSelect }) {
  const [overview, setOverview] = useState(null);

  useEffect(() => {
    let cancelled = false;
    const load = () =>
      fetchOverview()
        .then((data) => { if (!cancelled) setOverview(data); })
        .catch(() => {});   // cards still render without stats
    load();
    const id = setInterval(load, OVERVIEW_REFRESH_MS);
    return () => { cancelled = true; clearInterval(id); };
  }, []);

  const statsFor = (id) => overview?.sectors.find((s) => s.id === id);

  return (
    <div className="landing">
      <MarketBrief overview={overview} />
      <div className="landing-cards">
        {sectors.map((sector) => (
          <SectorCard
            key={sector.id}
            sector={sector}
            stats={statsFor(sector.id)}
            onSelect={onSelect}
          />
        ))}
      </div>
      <InsightsPlaceholders />
    </div>
  );
}

function Footer() {
  return (
    <footer className="footer">
      <span>Prices: Finnhub · History: Yahoo Finance · Weather: Open-Meteo · Brief: Claude</span>
      <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer">View source on GitHub ↗</a>
    </footer>
  );
}

function SectorDetailView({ sector, onBack }) {
  const tickers = sector.tickers || [sector.ticker].filter(Boolean);
  return (
    <div className="sector-detail">
      <div className="sector-detail-header">
        <button type="button" className="back-button" onClick={onBack}>
          ← Back to Home
        </button>
        <h2 className="sector-detail-title">{sector.label}</h2>
      </div>
      <main className="grid">
        {tickers.map((ticker) => (
          <IndustrySection
            key={ticker}
            industry={{ id: ticker, label: sector.label, ticker }}
          />
        ))}
      </main>
    </div>
  );
}

function App() {
  const [sectors, setSectors] = useState([]);
  const [selectedSector, setSelectedSector] = useState(null);
  const [view, setView] = useState('home');   // 'home' | 'insights'
  const [error, setError] = useState(null);
  const [waking, setWaking] = useState(false);

  useEffect(() => {
    let cancelled = false;
    // A sleeping backend answers slowly (or fails) on the first request — say so and retry
    const notice = setTimeout(() => setWaking(true), WAKE_NOTICE_MS);

    async function load(attempt) {
      try {
        const data = await fetchConfig();
        if (!cancelled) setSectors(normalizeSectors(data));
      } catch (err) {
        if (cancelled) return;
        if (attempt < CONFIG_RETRIES) setTimeout(() => load(attempt + 1), 3000);
        else setError(err.message);
        return;
      }
      clearTimeout(notice);
      setWaking(false);
    }
    load(1);

    return () => { cancelled = true; clearTimeout(notice); };
  }, []);

  function handleViewChange(newView) {
    setView(newView);
    setSelectedSector(null);
  }

  if (error) {
    return (
      <div className="fatal-error">
        <h2>Could not load config</h2>
        <p>{error}</p>
        <p>The data server did not respond. Please refresh in a minute.</p>
      </div>
    );
  }

  return (
    <div className="app">
      <IntroSplash />
      <AppHeader view={view} onViewChange={handleViewChange} />

      {view === 'insights' ? (
        <DailyInsights />
      ) : selectedSector ? (
        <SectorDetailView
          sector={selectedSector}
          onBack={() => setSelectedSector(null)}
        />
      ) : sectors.length === 0 ? (
        <div className="landing">
          {waking && (
            <p className="waking-notice">
              Waking up the data server — this takes up to a minute on the first visit…
            </p>
          )}
          <div className="landing-cards">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="sector-card skeleton" />
            ))}
          </div>
        </div>
      ) : (
        <LandingPage sectors={sectors} onSelect={setSelectedSector} />
      )}

      <Footer />
    </div>
  );
}

export default App;
