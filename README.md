# ForexAI Signals 🤖📈

A full-stack AI-powered forex signal platform with XGBoost model, FastAPI backend,
and React dashboard.

---

## Architecture

```
Broker/OANDA API
    ↓
Data collector (ingest_oanda.py)
    ↓
PostgreSQL
    ↓
Feature generator (indicators.py)
    ↓
XGBoost Model (train_xgb.py)
    ↓
Signal rules engine (rules.py)
    ↓
FastAPI (/api/v1/signals)
    ↓
Dashboard (Next.js) + Alerts (Telegram/Email)
```

---

## Quick Start

### 1. Prerequisites

```bash
# Python 3.11+
python --version

# PostgreSQL running
psql -U postgres -c "CREATE DATABASE forexai;"

# Redis (for caching)
redis-server
```

### 2. Install dependencies

```bash
cd forex_ai_signals
pip install -r requirements.txt
```

### 3. Configure environment

```bash
cp .env.example .env
# Edit .env — at minimum set DATABASE_URL and OANDA_API_KEY
```

Get a free OANDA practice account: https://developer.oanda.com/

### 4. Train the model (Milestone 1)

```bash
python scripts/train.py --pair EUR_USD --timeframe H1 --years 3
```

This will:
- Fetch 3 years of EUR/USD H1 candles from OANDA
- Build features (RSI, MACD, ATR, session flags, etc.)
- Create trade outcome labels (TP before SL in 12 bars?)
- Run 5-fold walk-forward validation
- Train final XGBoost model
- Save model to models/saved/

**Expect these numbers to be honest** — if win rate is below 50% or
expectancy is negative, the model isn't ready. Adjust TP/SL settings or
add more training data.

### 5. Start the API (Milestone 2)

```bash
uvicorn app.api.main:app --reload --port 8000
```

Endpoints:
- `GET /api/v1/signals/latest` — open signals
- `GET /api/v1/signals/history?days=30` — recent signals
- `GET /api/v1/signals/performance` — daily win rate / P&L
- `GET /api/v1/signals/stats/summary` — aggregate stats
- `GET /api/v1/health` — model loaded check

### 6. Start the dashboard (Milestone 3)

```bash
cd frontend
npx create-next-app@latest . --typescript --tailwind --app
# Copy Dashboard.jsx into app/page.tsx (adapt imports)
npm install recharts
npm run dev
```

Visit: http://localhost:3000

---

## Signal Flow

Every hour (1 min after candle close), the scheduler:

1. Fetches latest 200 candles from OANDA
2. Builds features
3. Runs XGBoost prediction → confidence score
4. Applies filters: session, spread, trend alignment, R:R
5. If signal passes: writes to DB, sends Telegram alert (partial), email alert
6. Full details (entry, SL, TP) only visible inside dashboard → retention

---

## Model Training Details

**Target**: Does price hit +20 pips before -10 pips within next 12 bars?

**Features**: Returns (1/3/5/10 bars), RSI (7/14), ATR, MACD histogram,
Bollinger Band position, MA distances (20/50/100), session flags,
momentum, volume, candle body/wick ratios, trend regime.

**Validation**: Walk-forward only — never random train/test splits.

**Evaluation metrics** (evaluate ALL of these, not just accuracy):
- Win rate at 0.60 threshold
- Expectancy (pips per trade after costs)
- Profit factor
- Max drawdown
- Sharpe ratio

A model with 52% accuracy can be profitable. A model with 65% accuracy
can still lose money. Expectancy is the number that matters.

---

## Pricing Model (recommended)

| Tier | Price | Features |
|------|-------|----------|
| Free | £0 | 1 pair, delayed signals, weekly stats |
| Pro  | £10/mo | Live signals, confidence scores, full dashboard |
| VIP  | £20/mo | Multi-pair, AI breakdown, priority alerts |

Target: 100 Pro users = £1,000/mo → 300 users = £3,000/mo

---

## Important: UK Regulatory Note

If you're in the UK and selling forex signals to retail clients, review
FCA rules on financial promotions and arranging deals. Paid signals may
constitute regulated activity. Options:

1. Register as an Appointed Representative under an umbrella firm
2. Apply for FCA authorisation (time-consuming)
3. Structure as educational/informational content (get legal advice first)

Do NOT ignore this — the FCA has prosecuted unauthorised signal sellers.

---

## Folder Structure

```
forex_ai_signals/
├── app/
│   ├── api/           FastAPI routes + main app
│   ├── core/          Config + logger
│   ├── data/          OANDA data ingest
│   ├── db/            SQLAlchemy models + session
│   ├── features/      Indicators + labels
│   ├── models/        XGBoost trainer + inference
│   ├── signals/       Rules engine + publisher
│   └── backtest/      Backtesting engine
├── scripts/
│   └── train.py       Run this first
├── frontend/
│   └── Dashboard.jsx  React trading dashboard
├── .env.example
├── requirements.txt
└── README.md
```

---
