# optX

**High-grade strategy, without the consulting bill.**

---

## The problem

- Real strategy (scenario modeling, Monte Carlo, sensitivity, multi-perspective debate) = big firms & expensive consultants
- Everyone else = spreadsheets + gut feel
- Gap is unfair and wasteful

## Why it matters

- SMBs face the same “what if?” and “which path?” decisions as enterprises
- Can’t afford six-figure engagements → under-informed bets, missed upside, risk not stress-tested
- Democratizing strategy = leveling the field

## Why now

- AI-native + agents change the economics
- Simulations, causal models, multi-expert views in one pipeline at a fraction of the cost
- Tech is here; the product wasn’t

## How optX works

- Describe scenarios in plain language or build them in a visual graph
- **Pipeline:** variable universe → Monte Carlo → Bayesian network → sensitivity → backtesting
- **Six AI agents** (market, financial, growth, risk, brand, operations) analyze, debate, converge
- One workspace, structured insight—not a single black-box answer

## Why this approach

- **Scenarios first** — Model alternatives explicitly, not one-off point estimates
- **Simulation-native** — Uncertainty & dependencies built in (distributions, networks, backtests)
- **Multi-agent debate** — Six agents + debate + convergence = balanced, auditable recommendations
- **Unified stack** — Data, scenarios, runs, chat in one place; model is source of truth

---

## Quick start

- **Frontend:** `npm install && npm run dev`
- **Backend:** `cd python && pip install -r requirements.txt && python -m uvicorn main:app --reload --port 8000`
- **Env:** `.env.local` — Supabase (URL, anon key, service role), `PYTHON_API_URL=http://localhost:8000`, `OPENAI_API_KEY` (also in `python/.env`)
- Open [http://localhost:3000](http://localhost:3000). Both services must run.

**Stack:** Next.js 16, React 19, Zustand, Tailwind 4, ShadCN, React Flow | Python FastAPI, OpenAI, Supabase. See **CLAUDE.md**.

---

*optX — scenario intelligence for strategic decisions.*
