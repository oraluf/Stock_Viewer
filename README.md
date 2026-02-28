# Stock Dashboard

A real-time stock market dashboard — live prices and historical charts for 6 sectors (AI, Energy, Technology, Leading Index, Crypto, Metals), daily report archive, and market insights.

**Live demo:** _add your Vercel URL here_

---

## Tech Stack

| Layer    | Technology                        |
|----------|-----------------------------------|
| Frontend | React 18, Vite 5, Chart.js 4      |
| Backend  | Node.js 18, Express 4             |
| Data     | Finnhub API                       |
| Deploy   | Vercel (UI) + Render (Backend)    |

---

## Project Structure

```
Stock_Viewer/
├── backend/
│   └── src/
│       ├── app.js                      # Express entry point
│       ├── routes/                     # HTTP handlers (no logic)
│       ├── services/                   # Business logic + cache + reports
│       ├── adapters/finnhubProvider.js # Finnhub API (swappable)
│       ├── config/stocks.js            # Sectors & tickers — single source of truth
│       └── storage/                    # In-memory store + reports archive
└── ui/
    └── src/
        ├── App.jsx                     # App shell + view routing
        ├── api.js                      # All fetch calls to backend
        └── components/
            ├── IndustrySection.jsx     # Stock card: quote + chart
            ├── StockChart.jsx          # Chart.js line chart + demo fallback
            ├── InsightsPlaceholders.jsx# Economic Savings + Weather
            └── DailyInsights.jsx       # Daily report archive viewer
```

---

## Run Locally

### Prerequisites
- Node.js 18+
- A free [Finnhub API key](https://finnhub.io)

### 1. Backend

```bash
cd backend
# Copy the example env file and fill in your key
cp ../.env.example .env
npm install
npm run dev       # → http://localhost:3001
```

### 2. Frontend (new terminal)

```bash
cd ui
npm install
npm run dev       # → http://localhost:3000
```

Vite proxies all `/quote`, `/series`, etc. calls to `:3001` automatically.

---

## Deploy (Free)

### Backend → Render

1. [render.com](https://render.com) → **New Web Service** → connect GitHub repo
2. Render auto-detects `render.yaml`
3. Add env var: `FINNHUB_API_KEY` = your key
4. Deploy → copy the URL (e.g. `https://stock-viewer-backend.onrender.com`)

> Free tier sleeps after 15 min of inactivity; first request after sleep is slow (~30s).

### Frontend → Vercel

1. [vercel.com](https://vercel.com) → **New Project** → import GitHub repo
2. Add env var: `VITE_API_URL` = your Render URL
3. Deploy → share the link

---

## Environment Variables

| Variable          | Location       | Description                         |
|-------------------|----------------|-------------------------------------|
| `FINNHUB_API_KEY` | `backend/.env` | Finnhub API key                     |
| `VITE_API_URL`    | Vercel env vars| Backend URL (empty in local dev)    |

---

## API Endpoints

| Method | Path                            | Description                        |
|--------|---------------------------------|------------------------------------|
| GET    | `/health`                       | Health check                       |
| GET    | `/config`                       | All sectors + tickers              |
| GET    | `/quote?ticker=NVDA`            | Live quote (price + daily change)  |
| GET    | `/series?ticker=NVDA&range=1D`  | OHLCV candles (1D / 1M / 1Y)      |
| GET    | `/report/daily`                 | Today's sector performance report  |
| GET    | `/report/archive`               | History of saved daily reports     |
| GET    | `/weather`                      | Weather placeholder (Houston + Palo Alto) |

---

## Design Principles

- **Adapter Pattern** — Finnhub is isolated in one file; swap to another provider by editing one function
- **TTL Cache** — 30s for quotes, 5min for series — minimises API rate-limit hits
- **Graceful Degradation** — Charts fall back to demo data on API failure; UI never crashes
- **Single Source of Truth** — All sectors/tickers defined once in `config/stocks.js`
- **Trading-Day Awareness** — Daily reports are only auto-saved on weekdays
