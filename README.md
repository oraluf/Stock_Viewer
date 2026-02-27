# Stock Viewer

Real-time stock dashboard — 4 industries, 3 timeframe charts, Finnhub data.

| Industry      | Ticker |
|---------------|--------|
| AI            | NVDA   |
| Energy        | XOM    |
| Technology    | MSFT   |
| Leading Index | SPY    |

## Architecture

```
routes/   → HTTP only, no logic
services/ → business logic + cache orchestration
adapters/ → Finnhub API isolation (swap without touching services)
storage/  → in-memory key-value store
config/   → ticker/industry list
```

## Quick Start

### 1. Get a free Finnhub API key
Sign up at https://finnhub.io/register (free tier is enough).

### 2. Create backend/.env
```powershell
Copy-Item .env.example backend\.env
# Then open backend\.env and set FINNHUB_API_KEY=<your key>
```

### 3. Install dependencies
```powershell
# Backend
cd backend
npm install

# UI (new terminal)
cd ..\ui
npm install
```

### 4. Run the backend
```powershell
cd backend
npm start
# → http://localhost:3001
```

### 5. Run the UI (new terminal)
```powershell
cd ui
npm run dev
# → http://localhost:3000
```

Open **http://localhost:3000** in your browser.

---

## API Endpoints

| Method | Path                              | Description            |
|--------|-----------------------------------|------------------------|
| GET    | /health                           | Health check           |
| GET    | /config                           | Industries + tickers   |
| GET    | /quote?ticker=NVDA                | Price + daily change % |
| GET    | /series?ticker=NVDA&range=1D      | OHLC candle array      |

## Test with curl (PowerShell)

```powershell
# 1. Health
curl http://localhost:3001/health

# 2. Config
curl http://localhost:3001/config

# 3. Quote
curl "http://localhost:3001/quote?ticker=NVDA"

# 4. Series — 1D intraday
curl "http://localhost:3001/series?ticker=NVDA&range=1D"
```

## Cache TTLs
- Quote  → 30 seconds
- Series → 5 minutes

## Change tickers
Edit `backend/src/config/stocks.js` — no other file needs to change.
