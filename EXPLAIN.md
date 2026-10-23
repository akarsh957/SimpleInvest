# SimpleInvest — Project Explanation for Interview Preparation

## 1. What is this project?

SimpleInvest is a financial intelligence and paper trading dashboard built for investors who want a cleaner, more understandable way to research, track, and simulate stock trading.

It combines:
- a polished dashboard UI,
- market and stock analysis APIs,
- AI-powered insights in plain English,
- and a paper trading backend with database-driven portfolio updates.

In simple terms:
- the app helps users see stock information clearly,
- it explains financial metrics in simple language,
- and it lets users practice buying/selling without real money.

This is a strong product idea because it sits between raw finance tools and beginner-friendly apps.

---

## 2. The business problem it solves

Most finance apps are either:
- too technical and overwhelming for normal users, or
- too simplified and not useful for serious portfolio decisions.

SimpleInvest tries to bridge that gap by making finance easier to understand while still feeling professional and data-driven.

It gives users:
- real market data,
- AI explanations,
- portfolio tracking,
- risk summaries,
- and simulation-based trading.

---

## 3. Project in simple steps

### Step 1: User lands on the dashboard
The user opens the Next.js frontend and sees a financial terminal-style interface with:
- ticker ribbon,
- portfolio metrics,
- holdings table,
- performance graphs,
- and market insights.

### Step 2: Frontend requests financial data
The React/Next.js app calls backend APIs to fetch:
- stock quotes,
- historical trends,
- AI-based analysis,
- and portfolio/account data.

### Step 3: Backend processes the request
The FastAPI service acts as the analytics and business logic layer. It may:
- call Twelve Data for market data,
- call Groq LLM for plain-English investment summaries,
- validate trade requests,
- and update portfolio states.

### Step 4: Supabase stores account and trading state
Supabase/PostgreSQL is used for persistence. It stores:
- user profiles,
- accounts with starting balance,
- holdings,
- orders,
- and portfolio ownership.

### Step 5: Trade execution updates portfolio automatically
When a user buys or sells, the order is inserted into the database. A PostgreSQL trigger runs and updates:
- the account balance,
- the holdings quantity,
- the average buy price,
- and the overall portfolio state.

### Step 6: Frontend reflects changes in real time
The UI re-renders based on the updated account and portfolio data, so the user sees their changed position and balance immediately.

---

## 4. Core features explained simply

### A. AI stock analysis
The app analyzes a stock and provides:
- company overview,
- valuation context,
- risk profile,
- sector positioning,
- and plain English commentary.

This is useful because most users do not want raw financial jargon without interpretation.

### B. Portfolio audit
The app takes a set of holdings and calculates:
- total invested amount,
- diversification score,
- sector weight,
- concentration risk,
- and suggested actions.

This is like a simplified portfolio health check.

### C. Paper trading
Users can simulate a real investment workflow using fictional money. This is ideal for:
- learning trading logic,
- testing UI workflows,
- validating database triggers,
- and building a risk-free investment experience.

### D. Buy/sell order flow
The trade process follows this logic:
1. user submits buy/sell ticket,
2. backend validates inputs,
3. price is fetched,
4. order is inserted,
5. database trigger updates holdings/balance,
6. frontend refreshes the dashboard.

---

## 5. Tech stack and what each part does

### Frontend: Next.js + React + TypeScript
Why it is used:
- Next.js is ideal for modern web apps with server-side rendering and app routing.
- React makes the interface modular and reusable.
- TypeScript reduces bugs in a data-heavy UI.

In this project, the frontend is responsible for:
- dashboard rendering,
- market UI,
- stock analysis panels,
- trade modals,
- and portfolio visuals.

### Styling: Tailwind CSS
Used for:
- fast UI development,
- consistent design,
- clean financial terminal-like appearance.

### Backend: FastAPI (Python)
Why it is used:
- fast API development,
- easy request validation,
- good fit for analytics and AI service integration.

This backend handles:
- route logic,
- market analysis APIs,
- data processing,
- and trade validation.

### AI layer: Groq + LLM
This project uses Groq and a large language model to convert technical market data into plain-language recommendations.

This is a strong interview topic because it shows:
- AI integration in a real product,
- structured prompt/data flow,
- and practical use of large language models in a business app.

### Data source: Twelve Data
These libraries/providers give market-related data such as:
- real-time quote information,
- historical OHLCV data,
- technical signals,
- and stock trend analysis.

### Database: Supabase + PostgreSQL
This is the core of the paper trading engine.

Supabase provides:
- PostgreSQL database,
- authentication support,
- row-level security,
- and realtime data capabilities.

The database logic is not just storing data; it is enforcing financial rules such as:
- preventing invalid negative balances,
- allowing only valid trade sides,
- checking share sufficiency for sells,
- and updating holdings automatically.

---

## 6. How the project is structured conceptually

### Frontend
Main responsibility:
- show users the dashboard and controls,
- call backend APIs,
- present AI-generated insights,
- create interactive trading flow.

### Backend
Main responsibility:
- gather data,
- run business logic,
- connect services,
- protect API route behavior,
- orchestrate trade execution.

### Database layer
Main responsibility:
- persist user state,
- enforce account and portfolio rules,
- process trade transactions reliably,
- maintain consistency between balances and holdings.

---

## 7. Important technical concepts in this project

### 1. API-driven architecture
The frontend is decoupled from the backend. This lets the app scale cleanly and separates UI behavior from data logic.

### 2. Database triggers
This is a very important interview-friendly concept. The app uses PostgreSQL triggers to automatically update user balances and holdings when an order is executed. This reduces manual logic and keeps state consistent.

### 3. Row-Level Security (RLS)
Supabase enables access restrictions so users can only access their own account, orders, and holdings. This is important for SaaS-style app security.

### 4. Trade validation rules
The project checks conditions like:
- valid stock ticker,
- valid number of shares,
- valid trade side,
- valid current holdings before sell,
- and balance sufficiency before buy.

### 5. Functional product design
This project is not just backend logic; it is a complete product workflow: research -> analysis -> trade -> portfolio update -> report.

---

## 8. Interview-ready explanation

If asked: "What is your project about?"

You can say:

> SimpleInvest is a financial intelligence and paper trading platform built with Next.js, FastAPI, and Supabase. It helps users analyze stocks, get plain-English AI summaries, track portfolio performance, and simulate buys and sells using a risk-free account. The app uses real market data, LLM-based analysis, and PostgreSQL triggers to keep portfolio balances and holdings consistent.

If asked: "What technologies did you use and why?"

You can say:

> I used Next.js and TypeScript for the frontend because it gives a modern, scalable UI experience. FastAPI was used for the backend because it is lightweight and ideal for API-driven financial services. Supabase with PostgreSQL was used for persistence and trade logic, especially for RLS and database triggers. Groq and Twelve Data enrich the app with AI insight and live financial information.

If asked: "What was the hardest problem in the project?"

You can say:

> The hardest part was making the paper trading system reliable. Buying and selling shares affects both account balance and holdings, so the logic had to stay consistent. I solved this with transactional database rules and triggers so that state updates happen automatically and correctly when an order is inserted.

---

## 9. Strong talking points for interviews

- Full-stack product experience: frontend + backend + database
- Real-world workflow: data fetching, AI summarization, and trade execution
- Secure data management with RLS and user-specific access rules
- Business logic in database layer using triggers
- API integration with external market and AI systems
- End-to-end product thinking from UI to database state consistency

---

## 10. Suggested 1-minute project summary

SimpleInvest is a full-stack stock analysis and paper trading platform that combines a modern financial terminal UI with AI-driven insights and database-backed trading logic. The frontend is built with Next.js and TypeScript, the backend uses FastAPI, and the data layer uses Supabase Postgres. Users can analyze stocks, review portfolio risk, and simulate buying or selling shares while the system keeps account balances and holdings synchronized through automated triggers.

---

## 11. Final takeaway

This project is a strong interview project because it shows:
- frontend design and UX,
- backend API logic,
- AI integration,
- database engineering,
- business rules,
- and practical full-stack product thinking.

It is not just a toy app — it resembles a real finance product workflow, which is exactly what interviewers like to see.
