import { useState, useEffect } from 'react';
import { fetchConfig } from './api';
import IndustrySection from './components/IndustrySection';
import InsightsPlaceholders from './components/InsightsPlaceholders';

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
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchConfig()
      .then((data) => setSectors(normalizeSectors(data)))
      .catch((err) => setError(err.message));
  }, []);

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
      <header className="header">
        <h1>Stock Dashboard</h1>
        <span className="subtitle">Live market data · Finnhub</span>
      </header>

      {selectedSector ? (
        <SectorDetailView
          sector={selectedSector}
          onBack={() => setSelectedSector(null)}
        />
      ) : sectors.length === 0 ? (
        <div className="landing">
          <div className="landing-cards">
            {Array.from({ length: 4 }).map((_, i) => (
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
