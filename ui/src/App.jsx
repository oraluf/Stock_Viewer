import { useState, useEffect } from 'react';
import { fetchConfig, fetchWeather } from './api';
import IndustrySection from './components/IndustrySection';
import InsightsPlaceholders from './components/InsightsPlaceholders';
import DailyInsights from './components/DailyInsights';

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
    <header className="header">
      <div className="header-left">
        <h1>Stock Dashboard</h1>
        <span className="subtitle">Live market data · Finnhub</span>
      </div>
      <div className="header-center">
        <span className="header-date">{today}</span>
        {weather && (
          <span className="header-weather">
            {weather.houston.temp}°F Houston · {weather.paloAlto.temp}°F Palo Alto
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
    </header>
  );
}

function LandingPage({ sectors, onSelect }) {
  return (
    <div className="landing">
      <div className="landing-cards">
        {sectors.map((sector) => (
          <button
            key={sector.id}
            type="button"
            className="sector-card"
            onClick={() => onSelect(sector)}
          >
            <span className="sector-card-label">{sector.label}</span>
            <span className="sector-card-tickers">
              {sector.tickers?.join(', ') || sector.ticker}
            </span>
          </button>
        ))}
      </div>
      <InsightsPlaceholders />
    </div>
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

  useEffect(() => {
    fetchConfig()
      .then((data) => setSectors(normalizeSectors(data)))
      .catch((err) => setError(err.message));
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
        <p>Make sure the backend is running on port 3001.</p>
      </div>
    );
  }

  return (
    <div className="app">
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
          <div className="landing-cards">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="sector-card skeleton" />
            ))}
          </div>
        </div>
      ) : (
        <LandingPage sectors={sectors} onSelect={setSelectedSector} />
      )}
    </div>
  );
}

export default App;
