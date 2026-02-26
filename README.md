# optX

**Scenario intelligence for strategic decisions.**  
Model your business, run simulations, and get multi-perspective AI analysis—all in one place.

---

## The problem

Strategic choices are messy. Variables are uncertain, outcomes are probabilistic, and one lens isn’t enough. Spreadsheets and one-off models don’t capture dependencies, risk, or the full range of what could happen.

## The solution

optX turns business scenarios into a **living model**: define variables and relationships, run Monte Carlo and Bayesian simulations, stress-test with sensitivity analysis, and backtest against history. Then six specialized AI agents (market, financial, growth, risk, brand, operations) analyze the scenario, debate, and converge on findings—so you get structured insight, not just a single answer.

---

## What you get

- **Scenario builder** — Describe scenarios in plain language or build them in a visual graph; NLP and a wizard keep everything in sync.
- **Simulation engine** — Variable universe → Monte Carlo → Bayesian network → sensitivity analysis → backtesting, in one pipeline.
- **Multi-agent analysis** — Parallel expert agents with debate rounds and convergence scoring for balanced, auditable recommendations.
- **Unified workspace** — Business data, scenarios, simulations, and chat live in one app, persisted in Supabase.

---

## Tech

- **Frontend:** Next.js 16, React 19, Zustand, Tailwind 4, ShadCN, React Flow.
- **Backend:** Python FastAPI, OpenAI (gpt-4o / gpt-4o-mini), simulation engines and agent coordinator.
- **Data:** Supabase (PostgreSQL + JSONB) for businesses, scenarios, results, and chat.

Detailed architecture and conventions: see **CLAUDE.md**.

---

## Quick start

**1. Frontend**

```bash
npm install
npm run dev
```

**2. Backend** (separate terminal)

```bash
cd python
pip install -r requirements.txt
python -m uvicorn main:app --reload --port 8000
```

**3. Environment**

Create `.env.local` with:

- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- `PYTHON_API_URL` (e.g. `http://localhost:8000`)
- `OPENAI_API_KEY` (also in `python/.env` for the backend)

Open [http://localhost:3000](http://localhost:3000). Both services must be running for full functionality.

---

*optX — scenario intelligence for strategic decisions.*
