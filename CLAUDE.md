# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Frontend (Next.js 16 + React 19)
npm run dev          # Start dev server
npm run build        # Production build (also runs TypeScript check)
npm run lint         # ESLint with next/core-web-vitals + typescript rules
npm start            # Serve production build
npx shadcn@latest add <component>  # Add ShadCN component (style: new-york)

# Python backend (FastAPI)
cd python
pip install -r requirements.txt
python -m uvicorn main:app --reload --port 8000
```

No test framework is configured yet. Both services must run simultaneously for full functionality.

## Architecture

**Two-service architecture:** Next.js frontend + Python FastAPI backend, connected via API routes that proxy to Python.

### Data Flow
```
Browser → Next.js API routes (app/api/) → Python FastAPI (python/main.py) → OpenAI API (gpt-4o / gpt-4o-mini)
                                        → Simulation engines (python/engine/)
                                        → AI agents (python/agents/)
Browser → Supabase (lib/supabase/client.ts — browser, lib/supabase/server.ts — SSR)
Next.js API routes also read/write Supabase server-side (lib/supabase/server.ts)
```

### Frontend State
Five independent Zustand stores in `lib/store/`:
- **business-store** — business data, data sources, entry mode
- **scenario-store** — scenarios, graph state (nodes/edges), view mode
- **simulation-store** — config, status, progress, results
- **chat-store** — messages, streaming state, contextReportId, contextScenarioId
- **ui-store** — active page, sidebar, command palette

All types are centralized in `lib/types/index.ts`. Key type hierarchies:
- `BusinessData` → `DataSource` → `Variable` (with `Distribution`)
- `Scenario` → `ScenarioVariable` + `GraphState` (nodes/edges)
- `SimulationResult` → `MonteCarloResult`, `BayesianNetworkResult`, `SensitivityResult`, `BacktestResult`
- `AgentCoordinatorOutput` → `AgentAnalysis[]` → `AgentFinding[]`

### Python Backend
- `/chat` — OpenAI-powered chat with two modes: `parse_scenario` (gpt-4o-mini, returns structured JSON) and general chat (gpt-4o)
- `/simulate` — 5-layer pipeline: Variable Universe → Monte Carlo → Bayesian Network → Sensitivity Analysis → Backtesting
- `/agents/analyze` — 6 parallel agents (market, financial, growth, risk, brand, operations) using gpt-4o, with debate rounds and convergence scoring
- `/extract-variables` — extracts variables from uploaded row data (CSV/spreadsheet) for data ingestion
- `python/engine/garch.py` exists but is experimental and not yet integrated into the simulation pipeline

### Next.js API Routes
- `app/api/chat/route.ts` — POST, proxies to Python `/chat`
- `app/api/simulate/route.ts` — POST + GET, proxies to Python `/simulate`, fetches simulation by ID
- `app/api/agents/route.ts` — POST + GET, proxies to Python `/agents/analyze`
- `app/api/data/route.ts` — POST + GET, saves/loads business + data sources to Supabase
- `app/api/scenario/route.ts` — POST + GET + PUT + DELETE, full CRUD for scenarios
- `app/api/health/route.ts` — GET, Supabase table health check

### Scenario System
- **Wizard** (`components/wizard/`) — 4-step dialog: Describe (with NLP parse) → Select Variables → Set Values → Review
- **Graph Editor** (`components/graph/`) — `@xyflow/react` canvas at `/scenario/[id]` with three-panel layout: NodePalette | Canvas | Chat/ConfigPanel
- **Sync** — `lib/utils/graph-sync.ts` provides `variablesToGraph()` and `graphToVariables()` for bidirectional wizard↔graph conversion
- **Node types** — 6 types (financial, market, brand, operations, logic, metric) configured in `lib/utils/node-config.ts`

### UI Components
ShadCN components live in `components/ui/`. Import path: `@/components/ui/button`. Uses Tailwind CSS 4 with OKLCH color space (base color: zinc). Theme defined in `app/globals.css` with CSS custom properties. Dark mode is the default.

## Key Conventions

- Path alias: `@/*` maps to project root (e.g., `@/lib/types`, `@/components/ui/button`)
- All page components are `"use client"` — the app uses client-side rendering with Zustand
- Next.js API routes in `app/api/` are thin proxies to the Python backend — business logic lives in Python
- Graph nodes use HTML5 drag-and-drop with `application/reactflow-type` data transfer key
- Python uses snake_case field names in Pydantic models; the Next.js API route translates to/from camelCase
- Supabase error handling via `lib/supabase/diagnostics.ts` (`mapSupabaseError`, `REQUIRED_TABLES`)

## Environment Variables

Required in `.env.local`:
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase client
- `SUPABASE_SERVICE_ROLE_KEY` — server-side Supabase
- `PYTHON_API_URL` — Python backend URL (default: `http://localhost:8000`)
- `OPENAI_API_KEY` — used by the Python service for OpenAI API calls (also needs to be in `python/.env`)

Optional:
- `OPTX_API_TOKEN` — Bearer token for Python API auth
- `FRONTEND_ORIGIN` — CORS origin for production deployment
- `DEFAULT_USER_ID` — fallback UUID used in `app/api/data/route.ts`

## Database

Supabase PostgreSQL. Schema in `supabase/migrations/001_initial_schema.sql`. Tables: `businesses`, `data_sources`, `scenarios`, `simulation_results`, `reports`, `chat_messages`. Heavy use of JSONB columns for flexible nested data.
