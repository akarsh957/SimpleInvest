# SimpleInvest

> **Institutional-Grade Financial Intelligence Terminal & Paper Trading Platform**  
> Plain-English AI diagnostics, real-time multi-market feeds, Bayesian forward price trajectories, and factor modeling.

---

## Overview

**SimpleInvest** bridges institutional wealth intelligence with retail accessibility. Powered by **Next.js 15 (App Router)**, **FastAPI (Python 3.11)**, **Groq SDK (Llama 3.3 70B Versatile)**, and **Supabase (PostgreSQL with RLS & Stored Procedures)**, SimpleInvest provides an authentic, high-density editorial financial terminal aesthetic (Linear / Fey / Robinhood Legend) with strict 1px hairline grids and monochromatic zinc styling.

---

## Key Features

- **Live Market Feed & Ticker Ribbon**: Continuous NYSE, NASDAQ, and NSE streaming index quotes with single-click USD/INR toggling.
- **Plain-English AI Copilot**: Translates raw quantitative stock metrics, beta ratings, and balance sheet velocity into clear, jargon-free explanations.
- **Unified KPI Strip & Equity Curve**: Monospace tabular portfolio performance curve with S&P 500 benchmark overlays.
- **Institutional Holdings Table**: Tabular position ledger with direct low-profile hover `Buy` / `Sell` order triggers.
- **Bayesian Forward Trajectory Engine**: 30-day forecast cones, bull/bear target boundaries, and key support/resistance levels.
- **Macro Stress Testing**: Scenario simulation for rate shocks, AI supercycles, and recessionary pullbacks.
- **Quantitative Factor Screener**: Automated growth radar scanning for P/E velocity, PEG ratios, and balance sheet leverage.
- **Automated Paper Trading**: $100,000 initial balance with automated PostgreSQL triggers updating portfolio average cost and balances in real time.

---

## Architecture Overview

```
Frontend (Next.js 15, React 19, TypeScript, Tailwind CSS, Recharts)
  │
  ├─► Supabase (PostgreSQL + RLS Auth + SQL Execution Triggers)
  │
  └─► FastAPI Microservice (Python 3.11, Uvicorn)
        │
        ├─► Groq Cloud LLM (Llama 3.3 70B Versatile via AsyncGroq)
        ├─► yfinance (Live NYSE & NSE Market Feeds & Sparklines)
        └─► Twelve Data (Technicals & Momentum)
```

For full system architecture, database schema triggers, and API route documentation, see [PROJECT_DOCUMENTATION.md](./PROJECT_DOCUMENTATION.md).

---

## Quick Start

### 1. Backend Service (FastAPI)
```bash
pip install -r requirements.txt
uvicorn backend.app.main:app --reload --port 8000
```

### 2. Frontend Application (Next.js 15)
```bash
npm install
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 3. Automated Test Suites
```bash
pytest tests/ -v
npx tsc --noEmit
```

## Render Deployment

The root `render.yaml` Blueprint provisions both the FastAPI backend and the Next.js frontend. In the Render Dashboard, create a Blueprint from this repository's `main` branch and provide these values when prompted:

- Backend: `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `GROQ_API_KEY`, and `TWELVE_DATA_API_KEY`.
- Frontend: `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

Enter credentials directly in Render; do not commit them to the repository. The Blueprint wires the frontend API URL and backend CORS origin to the corresponding Render services.

---

## License
MIT License. Built for modern financial engineering and wealth intelligence.
