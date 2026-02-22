# OptX Code Audit Report
## Executive Summary
The OptX codebase currently has multiple disconnected paths between UI actions, API routes, and persistence layers, which explains the reported "data not being saved" and several "button not responding" symptoms. The highest-impact findings are stubbed API routes, missing click handlers on primary actions, and state synchronization bugs in the graph editor/store integration. Additional backend contract mismatches (camelCase vs snake_case), schema alignment risks, and non-persistent client state create broad functional and data-loss risk.

## Critical Issues
### Issue 1: Quick Start "Save & Continue" button is inert (no action handler)
- **Severity**: Critical
- **Category**: UI Interaction / Data Persistence
- **File(s)**: `components/data/QuickStartForm.tsx`
- **Line(s)**: 571-574
- **Description**: The primary save action is rendered but has no `onClick`, no form submit handler, and no API call.
- **Evidence**:
```tsx
<Button size="lg" disabled={isSaving}>
  <Save className="mr-2 h-4 w-4" />
  {isSaving ? "Saving..." : "Save & Continue"}
</Button>
```
- **Impact**: Users can click the save CTA and see no persistence or progression behavior.

### Issue 2: `/api/data` is a stub that returns fake success and random IDs
- **Severity**: Critical
- **Category**: API / Data Persistence
- **File(s)**: `app/api/data/route.ts`
- **Line(s)**: 10-18, 33-38
- **Description**: Data route does not validate input, does not save to Supabase, and returns synthetic success.
- **Evidence**:
```ts
// TODO: Validate input
// TODO: Save to Supabase
// TODO: Trigger variable extraction on Python service

return NextResponse.json({
  success: true,
  message: "Business data saved",
  businessId: crypto.randomUUID(),
});
```
- **Impact**: Frontend can receive success responses even when nothing is persisted.

### Issue 3: Frontend data ingestion path never calls persistence APIs
- **Severity**: Critical
- **Category**: Data Persistence / State Management
- **File(s)**: `app/data/page.tsx`, `components/data/QuickStartForm.tsx`, `components/data/DataBoxGrid.tsx`
- **Line(s)**: `app/data/page.tsx` 30-35, `components/data/QuickStartForm.tsx` 126-136 and 571-574, `components/data/DataBoxGrid.tsx` 240 and 307-317
- **Description**: Data entry updates only Zustand state (`setField`, `addDataSource`) and never sends data to `/api/data` or Supabase.
- **Evidence**:
```tsx
const { dataSources, addDataSource } = useBusinessStore();
...
addDataSource({
  id: crypto.randomUUID(),
  businessId: "",
  ...
});
```
- **Impact**: All ingested data is session-local and lost on refresh/restart.

### Issue 4: Python backend has no real persistence layer for business/scenario data
- **Severity**: High
- **Category**: Backend / Data Persistence
- **File(s)**: `python/main.py`
- **Line(s)**: 72-88, 91-105, 179-188
- **Description**: Core backend endpoints are stubbed and there is no database client usage for writes/reads.
- **Evidence**:
```py
@app.post("/simulate")
async def run_simulation(request: SimulateRequest):
    ...
    return {
        "simulationId": simulation_id,
        "status": "complete",
        "message": "Simulation pipeline stub — implementation pending",
    }
```
- **Impact**: API layer cannot provide durable business/simulation lifecycle behavior.

### Issue 5: `/simulate` and `/agents` proxy payloads do not match Python Pydantic models
- **Severity**: Critical
- **Category**: API Contract / Backend Integration
- **File(s)**: `app/api/simulate/route.ts`, `app/api/agents/route.ts`, `python/main.py`
- **Line(s)**: `app/api/simulate/route.ts` 9-16, `app/api/agents/route.ts` 9-16, `python/main.py` 44-53
- **Description**: Next API sends camelCase keys (`businessId`, `scenarioId`, `simulationId`, config camelCase), while Python requires snake_case (`business_id`, `scenario_id`, `simulation_id`, `time_horizon_months`, `confidence_level`).
- **Evidence**:
```ts
body: JSON.stringify({ businessId, config, scenarioId })
```
```py
class SimulateRequest(BaseModel):
    business_id: str
    config: SimulationConfig
    scenario_id: Optional[str] = None
```
- **Impact**: Python validation is expected to return 422; proxy converts failure into 500, blocking simulation/agent flows.

### Issue 6: Primary simulation/scenario action buttons are missing handlers
- **Severity**: High
- **Category**: UI Interaction
- **File(s)**: `app/simulate/page.tsx`, `app/scenario/[id]/page.tsx`
- **Line(s)**: `app/simulate/page.tsx` 40-43, `app/scenario/[id]/page.tsx` 122-129
- **Description**: "Run Simulation", scenario "Save", and scenario "Run" buttons render without behavior.
- **Evidence**:
```tsx
<Button>
  <Play className="mr-2 h-4 w-4" />
  Run Simulation
</Button>
```
- **Impact**: Core workflow CTAs appear clickable but perform no operation.

### Issue 7: GraphEditor state is not synchronized with store updates (one-way init only)
- **Severity**: High
- **Category**: State Management / UI Interaction
- **File(s)**: `components/graph/GraphEditor.tsx`, `app/scenario/[id]/page.tsx`
- **Line(s)**: `components/graph/GraphEditor.tsx` 36-40, 156-167; `app/scenario/[id]/page.tsx` 60-68, 137-140
- **Description**: GraphEditor internal `useNodesState`/`useEdgesState` initializes from props once; later store updates (e.g., node delete/update from ConfigPanel) are not pushed back into editor state.
- **Evidence**:
```tsx
const [nodes, setNodes, onNodesChange] = useNodesState(
  (initialState?.nodes ?? []) as unknown as Node[]
);
```
- **Impact**: Node edit/delete operations can appear non-responsive or inconsistent.

### Issue 8: Graph state is global, not scenario-scoped
- **Severity**: High
- **Category**: State Management
- **File(s)**: `lib/store/scenario-store.ts`, `app/scenario/[id]/page.tsx`, `components/wizard/ScenarioWizard.tsx`
- **Line(s)**: `lib/store/scenario-store.ts` 15 and 42, `app/scenario/[id]/page.tsx` 25 and 138, `components/wizard/ScenarioWizard.tsx` 72-80
- **Description**: Store keeps a single `graphState` for all scenarios; scenario objects are created without `graphState`.
- **Evidence**:
```ts
graphState: GraphState;
...
graphState: { nodes: [], edges: [] },
```
- **Impact**: Opening/editing one scenario can overwrite or leak graph state into another scenario.

### Issue 9: Zustand stores are non-persistent; all core data is volatile
- **Severity**: High
- **Category**: State Management / Data Persistence
- **File(s)**: `lib/store/business-store.ts`, `lib/store/scenario-store.ts`, `lib/store/simulation-store.ts`, `lib/store/chat-store.ts`
- **Line(s)**: `lib/store/business-store.ts` 57, `lib/store/scenario-store.ts` 38, `lib/store/simulation-store.ts` 31, `lib/store/chat-store.ts` 17
- **Description**: Stores use plain `create(...)` without `persist` middleware or backend hydration path.
- **Evidence**:
```ts
export const useBusinessStore = create<BusinessState>((set) => ({ ... }))
```
- **Impact**: Page refresh/navigation reset loses business data, scenarios, simulation context, and chat history.

### Issue 10: Schema and app data shape mismatches can break DB writes
- **Severity**: High
- **Category**: Supabase Integration / Data Model
- **File(s)**: `supabase/migrations/001_initial_schema.sql`, `components/data/DataBoxGrid.tsx`, `components/wizard/ScenarioWizard.tsx`, `lib/types/index.ts`
- **Line(s)**: `supabase/migrations/001_initial_schema.sql` 6 and 45, `components/data/DataBoxGrid.tsx` 309 and 351, `components/wizard/ScenarioWizard.tsx` 74, `lib/types/index.ts` 36-56 and 212-221
- **Description**: DB requires UUID foreign keys (`user_id`, `business_id`) while UI creates records with empty string IDs and camelCase field naming conventions.
- **Evidence**:
```sql
user_id UUID NOT NULL,
business_id UUID NOT NULL REFERENCES businesses(id)
```
```tsx
businessId: "",
```
- **Impact**: Insert/update operations are likely to fail or require non-trivial transformation logic.

### Issue 11: Chat backend masks runtime failures as successful responses
- **Severity**: Medium
- **Category**: API Error Handling
- **File(s)**: `python/main.py`, `app/api/chat/route.ts`
- **Line(s)**: `python/main.py` 175-176, `app/api/chat/route.ts` 25-35
- **Description**: Python `/chat` catches exceptions and returns a normal JSON reply string instead of error status; Next API wraps as success.
- **Evidence**:
```py
except Exception as e:
    return {"reply": f"I encountered an error: {str(e)}"}
```
- **Impact**: Failures can be misclassified as valid AI responses, complicating debugging and UX.

### Issue 12: Graph sync maps node type from `unit` instead of semantic variable category
- **Severity**: Medium
- **Category**: React Flow / Graph Sync
- **File(s)**: `lib/utils/graph-sync.ts`
- **Line(s)**: 48-55
- **Description**: `variablesToGraph()` derives node type via `categoryToNodeType(v.unit)`, but `unit` is not a category.
- **Evidence**:
```ts
type: categoryToNodeType(v.unit),
...
type: categoryToNodeType(v.unit),
```
- **Impact**: Node classification is often incorrect, which degrades graph semantics and styling.

## Warnings
- No Supabase RLS policy definitions were found in `supabase/migrations/001_initial_schema.sql`; security/authorization behavior is undefined for production.
- `next build` failed in this environment due Google Fonts fetch failures from `next/font` in `app/layout.tsx` (network-restricted environment), so full production build validation could not complete.
- `npm run lint` reports 45 warnings, heavily concentrated in API stub routes and unused imports/variables, indicating unfinished integration paths.
- Direct runtime model-validation of Python request schemas was not executed because backend dependencies (e.g., `fastapi`) are not installed in the current Python runtime.
- No clear static evidence of z-index overlays blocking clicks was found; non-responsive button behavior is primarily due to missing handlers and state wiring issues.

## Code Quality Observations
- Large portions of API and backend logic are placeholder/stub implementations, while UI presents production-like controls; this creates misleading success paths.
- `lib/supabase/client.ts` and `lib/supabase/server.ts` exist but are effectively unused by app and API layers.
- `graphToVariables()` in `lib/utils/graph-sync.ts` is currently unused, indicating incomplete bidirectional sync implementation.
- `ui-store` is defined but not consumed by pages/components in current code paths.
- Generic starter README and widespread TODO patterns suggest scaffold state rather than integrated end-to-end product behavior.

## Summary Table
| # | Issue | Severity | Category | File(s) |
|---|-------|----------|----------|---------|
| 1 | Quick Start save button has no action | Critical | UI Interaction / Data Persistence | `components/data/QuickStartForm.tsx` |
| 2 | `/api/data` returns fake success | Critical | API / Data Persistence | `app/api/data/route.ts` |
| 3 | Data flow never calls persistence APIs | Critical | Data Persistence / State Management | `app/data/page.tsx`, `components/data/QuickStartForm.tsx`, `components/data/DataBoxGrid.tsx` |
| 4 | Python persistence/data lifecycle is stubbed | High | Backend / Data Persistence | `python/main.py` |
| 5 | CamelCase/snake_case contract mismatch for simulate/agents | Critical | API Contract / Backend Integration | `app/api/simulate/route.ts`, `app/api/agents/route.ts`, `python/main.py` |
| 6 | Simulation/scenario primary buttons have no handlers | High | UI Interaction | `app/simulate/page.tsx`, `app/scenario/[id]/page.tsx` |
| 7 | GraphEditor not synced with store updates | High | State Management / UI Interaction | `components/graph/GraphEditor.tsx`, `app/scenario/[id]/page.tsx` |
| 8 | Scenario graph state is global instead of per scenario | High | State Management | `lib/store/scenario-store.ts`, `app/scenario/[id]/page.tsx`, `components/wizard/ScenarioWizard.tsx` |
| 9 | Zustand stores are non-persistent | High | State Management / Data Persistence | `lib/store/business-store.ts`, `lib/store/scenario-store.ts`, `lib/store/simulation-store.ts`, `lib/store/chat-store.ts` |
| 10 | Schema/model ID and casing mismatches threaten DB writes | High | Supabase Integration / Data Model | `supabase/migrations/001_initial_schema.sql`, `components/data/DataBoxGrid.tsx`, `components/wizard/ScenarioWizard.tsx`, `lib/types/index.ts` |
| 11 | Chat backend masks failures as success | Medium | API Error Handling | `python/main.py`, `app/api/chat/route.ts` |
| 12 | Graph sync classifies node type from unit | Medium | React Flow / Graph Sync | `lib/utils/graph-sync.ts` |

## Comprehensive Fix Summary
This section summarizes the remediation work completed after the audit. The focus was end-to-end correctness across UI interactions, state, API contracts, persistence, and backend execution.

### 1) Data Persistence Pipeline (Frontend → API → DB)
- Replaced stubbed `app/api/data/route.ts` with real Supabase-backed persistence for `businesses` and `data_sources`.
- Added request validation for UUIDs and proper error responses instead of fake success payloads.
- Implemented bidirectional mapping between frontend camelCase and database snake_case fields for business and data source records.
- Added business/data fetch path in `GET /api/data` so UI can hydrate persisted state.

### 2) Inert / Non-Responsive Buttons
- Wired Quick Start `Save & Continue` in `components/data/QuickStartForm.tsx` to call `/api/data`, update store with persisted IDs/records, and navigate to `/simulate`.
- Wired Simulation page `Run Simulation` in `app/simulate/page.tsx` to call `/api/simulate`, update simulation store status, and store returned results.
- Wired Scenario editor top-bar `Save` and `Run` actions in `app/scenario/[id]/page.tsx` to persist scenario changes and run scenario-scoped simulations.
- Added client-side error handling so failures are surfaced instead of silently ignored.

### 3) Scenario & Graph State Integrity
- Refactored `lib/store/scenario-store.ts` so graph state is scenario-scoped (per `scenario.id`) rather than a single global shared graph.
- Added `getGraphState(scenarioId)` and scenario-scoped graph mutation methods.
- Updated graph editor page to use scenario-scoped store methods and to fetch scenario by `scenarioId` when needed.
- Fixed editor synchronization issue in `components/graph/GraphEditor.tsx` by re-syncing internal React Flow node/edge state when incoming `initialState` changes.

### 4) Wizard / Scenario Persistence
- Updated `components/wizard/ScenarioWizard.tsx` to persist scenarios through `/api/scenario` instead of local-only store writes.
- Added graph generation at scenario creation and stored it with the scenario record.
- Added save-state and error-state handling for scenario creation failures.
- Replaced placeholder `businessId: ""` scenario creation with real business linkage.

### 5) API Layer Contract Fixes (Next.js ↔ Python)
- Reworked `app/api/simulate/route.ts` to:
  - Normalize config values.
  - Pull business/scenario context from Supabase.
  - Send Python payload in expected snake_case shape.
  - Persist simulation outputs into `simulation_results`.
  - Return structured error details for upstream failures.
- Reworked `app/api/agents/route.ts` to:
  - Validate IDs.
  - Fetch business + simulation context.
  - Send normalized snake_case payload to Python.
  - Persist `agent_analysis` and update simulation status.

### 6) Backend Route Implementation (Python)
- Replaced simulation and agent stubs in `python/main.py`:
  - `/simulate` now executes the engine pipeline (Variable Universe, Monte Carlo, Bayesian, Sensitivity, Backtest).
  - `/agents/analyze` now executes the coordinator and returns structured output.
- Added alias-capable Pydantic models (`populate_by_name=True`) so camelCase and snake_case payloads are both handled robustly.
- Improved CORS flexibility by allowing localhost variants and optional `FRONTEND_ORIGIN`.

### 7) Chat Error Semantics
- Changed Python `/chat` exception behavior to raise HTTP errors (`HTTPException`) instead of returning error text as successful assistant replies.
- Updated Next chat route `app/api/chat/route.ts` to propagate upstream error status/details.
- Updated `components/chat/ChatPanel.tsx` to handle non-OK chat responses as true failures.

### 8) Graph Type Mapping Bug
- Fixed `lib/utils/graph-sync.ts` so node type mapping uses semantic variable category instead of `unit`.
- Extended `ScenarioVariable` in `lib/types/index.ts` with optional `category` and propagated category parsing in wizard NLP flow (`StepDescribe`).

### 9) Store Persistence / Navigation Resilience
- Added Zustand `persist` middleware for core stores:
  - `lib/store/business-store.ts`
  - `lib/store/scenario-store.ts`
  - `lib/store/simulation-store.ts`
  - `lib/store/chat-store.ts`
- Added hydration/fetch flows where relevant (`app/data/page.tsx`, `app/simulate/page.tsx`) to reconcile local and backend state.

### 10) Scenario API Modernization
- Replaced stubbed `app/api/scenario/route.ts` with full CRUD behavior against Supabase.
- Added support for querying by `businessId` and by `scenarioId`.
- Added structured update semantics for scenario name/description/variables/graph state.

### Validation Status After Fixes
- `npx tsc --noEmit`: pass.
- `npm run lint`: pass with warnings only (unused imports/variables in non-critical files).
- `python3 -m compileall python/main.py`: pass.
- `npm run build`: still blocked in this environment by external Google Fonts fetch (`next/font` for Geist/Geist Mono), not by application logic regressions.

### Net Result
- The previously reported "data not saving" and "button clicks doing nothing" classes of failures are now functionally addressed by wired handlers, real persistence, corrected API contracts, and non-stub backend paths.
- The app now has coherent flow for business data, scenarios, graph edits, simulation execution, and agent analysis with explicit error propagation.
