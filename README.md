# optX

**High-grade strategy, without the consulting bill.**

---

## The problem

Strategy that actually works—scenario modeling, Monte Carlo, sensitivity analysis, multi-perspective debate—has stayed in the hands of big firms and expensive consultants. Everyone else gets spreadsheets and gut feel. That gap isn’t fair, and it isn’t smart.

## Why it matters

Small and mid-size businesses make the same kind of “what if?” and “which path?” decisions as enterprises. They just can’t afford six-figure engagements to get there. The result: under-informed bets, missed upside, and risk that never gets properly stress-tested. Democratizing real strategy isn’t charity—it’s leveling the field.

## Why now

AI-native tooling and agents change the economics. We can run simulations, maintain causal models, and field multiple expert perspectives in one pipeline—at a fraction of the cost and time of traditional consulting. The tech is here; the product wasn’t. Until now.

## How optX works

You describe scenarios in plain language or build them in a visual graph. optX turns them into a **living model**: variable universe → Monte Carlo → Bayesian network → sensitivity analysis → backtesting. Then **six specialized AI agents** (market, financial, growth, risk, brand, operations) analyze the scenario, debate, and converge on findings. One workspace, one pipeline, structured insight instead of a single black-box answer.

## Why this approach

- **Scenarios first** — Decisions are about alternatives. We model them explicitly instead of one-off point estimates.
- **Simulation-native** — Uncertainty and dependencies are built in (distributions, networks, backtests), not bolted on.
- **Multi-agent debate** — One model, one perspective = blind spots. Six agents with debate and convergence scoring give you balanced, auditable recommendations.
- **Unified stack** — Business data, scenarios, runs, and chat live together. No slide-deck handoffs; the model is the source of truth.

---

## Quick start

**Frontend:** `npm install && npm run dev`  
**Backend:** `cd python && pip install -r requirements.txt && python -m uvicorn main:app --reload --port 8000`

**.env.local:** Supabase URL + anon key + service role key, `PYTHON_API_URL=http://localhost:8000`, `OPENAI_API_KEY` (and same key in `python/.env`). Then open [http://localhost:3000](http://localhost:3000). Both services must run.

**Stack:** Next.js 16, React 19, Zustand, Tailwind 4, ShadCN, React Flow | Python FastAPI, OpenAI, Supabase. Details in **CLAUDE.md**.

---

*optX — scenario intelligence for strategic decisions.*
