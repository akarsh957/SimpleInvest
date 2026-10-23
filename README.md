# SimpleInvest

> **Institutional-Grade Financial Intelligence Terminal & Paper Trading Platform**  
> Plain-English AI diagnostics, real-time multi-market feeds, Bayesian forward price trajectories, and factor modeling.

---

## Overview

**SimpleInvest** bridges institutional wealth intelligence with retail accessibility. Powered by **Next.js 15 (App Router)**, **FastAPI (Python 3.11)**, **Groq SDK (GPT-OSS 120B)**, and **Supabase (PostgreSQL with RLS & Stored Procedures)**, SimpleInvest uses a calm editorial finance UI with warm ivory surfaces, deep-teal navigation, forest-green actions, and compact, readable market data.

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
        ├─► Groq Cloud LLM (GPT-OSS 120B via AsyncGroq)
        ├─► Twelve Data (Quotes, historical prices & fundamentals where available)
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

## Production Deployment

The recommended production setup is the FastAPI backend on Render and the Next.js frontend on Vercel.

### Backend on Render

The `simpleinvest-api` service in `render.yaml` requires these environment variables in Render:

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `GROQ_API_KEY`
- `GROQ_MODEL` (the Blueprint sets the supported default `openai/gpt-oss-120b`)
- `TWELVE_DATA_API_KEY`
- `ALLOWED_ORIGINS`: include the exact production Vercel origin, such as `https://your-app.vercel.app`, alongside any origins still needed during migration.

Keep credentials in the Render Dashboard; do not commit them to the repository. The API health check is available at `/health`.

### Frontend on Vercel

1. Import this GitHub repository into Vercel and use the repository root as the project root. Vercel should detect Next.js automatically; use `npm run build` as the build command.
2. Add these environment variables to the Vercel project for Production (and Preview too, if previews should use the API):
   - `NEXT_PUBLIC_API_URL`: the Render API base URL, for example `https://your-api.onrender.com` (do not append `/health`).
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. Deploy and copy the production domain Vercel assigns to the project.
4. Add that exact origin (scheme and hostname, with no path or trailing slash) to the Render API's `ALLOWED_ORIGINS`, then redeploy the API. If using a custom Vercel domain, allow that domain as well.
5. Verify `https://your-api.onrender.com/health` returns HTTP 200 and open the Vercel production URL to test sign-in, market data, and trading flows.

Do not remove the existing Render frontend until the Vercel deployment and API integration have been verified. The current `render.yaml` still defines that frontend for migration/rollback; update the Blueprint only when ready to retire the Render-hosted copy.

---

## License
MIT License. Built for modern financial engineering and wealth intelligence.
