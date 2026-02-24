# OptX Python Backend — Diagnostic Audit Report (Codex 5.3 High)
## Executive Summary
The `python/` FastAPI backend has meaningful architecture in place (simulation pipeline + multi-agent orchestration), but it currently carries multiple production-blocking issues across compatibility, runtime correctness, and operational resilience. The most severe blockers are Python-version incompatibility paths (`match/case` startup failure on Python 3.9) and dependency pins that are not viable for Python 3.13 in this environment (notably SciPy, and likely companion scientific stack pins). These create immediate installation/startup instability.

At runtime, the highest-risk correctness issue is that Monte Carlo correlation logic is implemented but not wired into `run()`, so outputs are effectively independent even when a correlation matrix is built. Additional correctness gaps include scenario override edge cases (zero values dropped, override guard mismatch), mostly-placeholder Bayesian inference, and semantic mislabeling in backtesting/sensitivity outputs. These problems can produce confident-looking but mathematically weak outputs.

From reliability and security perspectives, the service has no auth on any route, permissive CORS, inconsistent Anthropic failure semantics between `/chat` and agents, and expensive payload/per-request API-call patterns with limited safeguards. Overall risk level is **High** for production usage: startup/install fragility plus incorrect simulation semantics can break trust in outputs even when endpoints return `200`.

## Environment & Compatibility Issues
### Python 3.9 Syntax Blocker (`match/case`)
- **Severity**: Critical
- **File(s)**: `python/engine/variable_universe.py`
- **Line(s)**: 34-64
- **Description**: Structural pattern matching (`match/case`) requires Python 3.10+. Running on Python 3.9 fails during parse before app startup.
- **Evidence**:
```python
match self.type:
    case DistributionType.NORMAL:
        ...
```
- **Impact**: Backend cannot start under Python 3.9; import of `variable_universe.py` raises `SyntaxError`.
- **Recommendation**: Enforce Python >=3.10 in tooling/docs or replace with `if/elif` dispatch.

### Modern Type Hint Syntax Sets Minimum Runtime to Python 3.9
- **Severity**: Medium
- **File(s)**: `python/main.py`, `python/engine/*.py`, `python/agents/*.py`
- **Line(s)**: e.g. `python/main.py` 69-70, 150-152; `python/engine/monte_carlo.py` 21-23
- **Description**: Built-in generics (`dict[str, Any]`, `list[float]`, `tuple[float, float]`) are used widely; these are incompatible with Python 3.8 and older.
- **Evidence**:
```python
business_data: dict[str, Any] = Field(default_factory=dict, alias="businessData")
def _build_sensitivity_bounds(...) -> tuple[list[str], list[tuple[float, float]]]:
```
- **Impact**: Runtime floor is implicitly Python 3.9+, but this floor is not explicitly encoded in `requirements.txt` or startup checks.
- **Recommendation**: Declare `python_requires` and document supported versions explicitly.

### No `from __future__ import annotations` in Type-Heavy Modules
- **Severity**: Low
- **File(s)**: all `python/*.py`, `python/engine/*.py`, `python/agents/*.py`
- **Line(s)**: N/A (absent)
- **Description**: Modules rely on runtime-evaluated annotations. This is valid, but increases cross-version/type-runtime sensitivity and can complicate forward-reference behavior in future edits.
- **Evidence**:
```python
# No files in python/ contain:
from __future__ import annotations
```
- **Impact**: Lower flexibility for future refactors and mixed-version support.
- **Recommendation**: Consider adding postponed evaluation consistently if keeping broad version targets.

### Scientific Dependency Pins Are Not Python 3.13-Friendly
- **Severity**: Critical
- **File(s)**: `python/requirements.txt`
- **Line(s)**: 3-7
- **Description**: Current pinned scientific stack is incompatible in this environment for Python 3.13 installation (observed failure at `scipy==1.13.1` metadata/build stage), with adjacent pins also likely outside cp313 wheel support windows.
- **Evidence**:
```text
scipy==1.13.1
numpy==1.26.4
statsmodels==0.14.2
pandas==2.2.2
pgmpy==0.1.26
```
- **Impact**: `pip install -r requirements.txt` fails; backend cannot be provisioned reliably on Python 3.13.
- **Recommendation**: Align pins to Python 3.13-compatible releases (or pin Python runtime to a compatible version such as 3.11/3.12).

### Uvicorn Interpreter Footgun (System vs Venv)
- **Severity**: High
- **File(s)**: `python/requirements.txt`, `CLAUDE.md`
- **Line(s)**: `python/requirements.txt` 2; `CLAUDE.md` 18
- **Description**: Startup guidance uses bare `uvicorn`, which can resolve to system Python (3.9) instead of the active venv if PATH is misordered.
- **Evidence**:
```text
uvicorn[standard]==0.30.6
uvicorn main:app --reload --port 8000
```
- **Impact**: Service may launch under wrong interpreter and fail on syntax/dependency mismatch.
- **Recommendation**: Run `python -m uvicorn main:app ...` from the intended interpreter.

### Report01 Backend Findings Status (Addressed vs Remaining)
- **Severity**: Low
- **File(s)**: `reports/report01.md`, `python/main.py`
- **Line(s)**: `reports/report01.md` 59-95, 167-178; `python/main.py` 55-90, 176-244, 330-331
- **Description**: Previously reported backend stubs/contract mismatch are largely addressed in current code, but new reliability/correctness risks remain.
- **Evidence**:
```python
class SimulateRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    business_id: str = Field(alias="businessId")

@app.post("/simulate")
async def run_simulation(...):
    # Executes full pipeline and returns structured results
```
- **Impact**: Core stub concerns from `report01.md` are improved, but correctness/performance/security issues in this report still block production confidence.
- **Recommendation**: Treat `report01` integration fixes as complete, then prioritize this report’s critical/high items.

## Runtime Correctness Bugs
### Distribution Sampling Lacks Parameter Validation
- **Severity**: High
- **File(s)**: `python/engine/variable_universe.py`
- **Line(s)**: 35-62, 183-188, 206-209, 227-228
- **Description**: Distribution parameters are used directly without guardrails (`std`, `sigma`, `alpha`, `beta`, triangular ordering). Invalid values can produce runtime warnings/errors or invalid samples.
- **Evidence**:
```python
return np.random.normal(self.params["mean"], self.params["std"], n)
return np.random.beta(self.params["alpha"], self.params["beta"], n)
```
- **Impact**: Simulation can emit NaNs/errors for malformed or edge-case input distributions.
- **Recommendation**: Validate parameters before sampling and fail with explicit errors.

### `fit_distribution()` Small-Sample Std Guard Fails for `nan`
- **Severity**: High
- **File(s)**: `python/engine/variable_universe.py`
- **Line(s)**: 95-100
- **Description**: For one-point arrays, `np.std(arr, ddof=1)` returns `nan`; `float(nan) or 1.0` does not trigger fallback because `nan` is truthy.
- **Evidence**:
```python
params={"mean": float(np.mean(arr)), "std": float(np.std(arr, ddof=1)) or 1.0}
```
- **Impact**: Downstream normal sampling may run with `std=nan`, corrupting Monte Carlo outputs.
- **Recommendation**: Explicitly check `np.isfinite(std)` and `std > 0` before use.

### Scenario Overrides Drop Valid Zero Values
- **Severity**: High
- **File(s)**: `python/main.py`
- **Line(s)**: 124, 130-131
- **Description**: `or`-based extraction treats `0` as false and can convert valid zero overrides into `None`.
- **Evidence**:
```python
modified_value = variable.get("modifiedValue") or variable.get("modified_value")
if not name or modified_value is None:
    continue
```
- **Impact**: Users cannot set scenario variables to zero reliably.
- **Recommendation**: Use explicit key checks instead of truthiness.

### Scenario Override Guard Uses Nonexistent `node-` Prefix
- **Severity**: High
- **File(s)**: `python/main.py`, `python/engine/variable_universe.py`
- **Line(s)**: `python/main.py` 127-128, 134-147; `python/engine/variable_universe.py` 159, 174, 200, 220
- **Description**: Guard checks `node-{variable_id}` against universe keys, but universe IDs do not use `node-` naming.
- **Evidence**:
```python
if variable_id and f"node-{variable_id}" in universe.variables:
    continue
```
- **Impact**: Existing variables are not actually overridden; extra scenario variables are appended instead.
- **Recommendation**: Match on actual universe IDs and update in-place where intended.

### Monte Carlo Correlation Is Built But Not Applied
- **Severity**: Critical
- **File(s)**: `python/engine/monte_carlo.py`
- **Line(s)**: 33-56, 66-67, 71-89
- **Description**: `_generate_correlated_uniforms()` is implemented but never used in `run()`. Sampling is per-variable independent draws.
- **Evidence**:
```python
self.universe.build_correlation_matrix()
...
samples = var.distribution.sample(self.iterations)
```
- **Impact**: Results violate stated copula/correlation model assumptions.
- **Recommendation**: Wire correlated uniforms through inverse CDF sampling per variable.

### Bayesian Default Structure Mostly Misses Variables Due ID/Name Mismatch
- **Severity**: High
- **File(s)**: `python/main.py`, `python/engine/bayesian.py`, `python/engine/variable_universe.py`
- **Line(s)**: `python/main.py` 193; `python/engine/bayesian.py` 61-68, 71-88; `python/engine/variable_universe.py` 159-160
- **Description**: `build_default_structure()` expects names like `monthly_revenue`, but `main.py` passes variable IDs (`revenue_monthly`, etc.).
- **Evidence**:
```python
bayesian_engine.build_default_structure(list(universe.variables.keys()))
("monthly_revenue", "gross_profit", 0.9, ...)
```
- **Impact**: Default DAG edges are sparse/incomplete; causal graph quality degrades.
- **Recommendation**: Pass variable names or normalize IDs before matching.

### Bayesian Inference Is Placeholder-Only
- **Severity**: Medium
- **File(s)**: `python/engine/bayesian.py`
- **Line(s)**: 90-102
- **Description**: `infer()` returns fixed normal posteriors and does not perform probabilistic inference.
- **Evidence**:
```python
posteriors[node] = {
    "type": "normal",
    "params": {"mean": 0.0, "std": 1.0},
}
```
- **Impact**: Output can be interpreted as real posterior results despite being placeholders.
- **Recommendation**: Mark as explicit stub in API response or implement inference.

### Sensitivity Model Function in `/simulate` Is a Toy Sum
- **Severity**: Medium
- **File(s)**: `python/main.py`
- **Line(s)**: 210-214
- **Description**: Sobol analysis uses `sum(values)` as model output, disconnected from simulation objective variables.
- **Evidence**:
```python
def model_func(values):
    return float(sum(values))
```
- **Impact**: Sensitivity rankings may be mathematically consistent for a toy function but not business-meaningful.
- **Recommendation**: Use a domain output (e.g., net income/cash flow) derived from simulation logic.

### Backtest Uses Naive Mean Predictor Only
- **Severity**: Medium
- **File(s)**: `python/main.py`
- **Line(s)**: 225-229
- **Description**: Prediction function returns trailing mean baseline only.
- **Evidence**:
```python
return [sum(train_data) / len(train_data)]
```
- **Impact**: Backtest accuracy can be misleadingly low/high depending on trend structure; weak validation signal.
- **Recommendation**: Use at least trend/seasonality-aware benchmark and label baseline explicitly.

### Backtest “Brier Score” Is Not a Brier Score
- **Severity**: Medium
- **File(s)**: `python/engine/backtest.py`
- **Line(s)**: 72-74
- **Description**: Brier score is defined for probabilistic classification; code squares regression percentage errors.
- **Evidence**:
```python
brier_score = float(np.mean(np.array(errors) ** 2)) if errors else 1.0
```
- **Impact**: Metric naming is semantically incorrect and can mislead stakeholders.
- **Recommendation**: Rename metric (e.g., MSE of relative error) or compute true Brier in a probabilistic setting.

### Sensitivity Bounds Inflate Near-Zero Variables Arbitrarily
- **Severity**: Low
- **File(s)**: `python/main.py`
- **Line(s)**: 155-158
- **Description**: Minimum span of `1.0` is applied regardless of variable scale.
- **Evidence**:
```python
span = max(abs(base) * 0.2, 1.0)
bounds.append((base - span, base + span))
```
- **Impact**: Tiny-base variables get disproportionately large perturbation ranges.
- **Recommendation**: Use category-aware absolute floors or normalized scaling.

### `/extract-variables` Forces All Numeric Fields Into “financial”
- **Severity**: Low
- **File(s)**: `python/main.py`
- **Line(s)**: 345-352
- **Description**: Numeric columns are blindly mapped to category `financial` and unit `units`.
- **Evidence**:
```python
"category": "financial",
"unit": "units",
```
- **Impact**: Misclassification reduces quality of downstream scenario/graph semantics.
- **Recommendation**: Infer categories/units from column names or allow caller-provided schema hints.

## Dead Code & Unused Dependencies
### `garch.py` Engine Is Not Referenced Anywhere
- **Severity**: Medium
- **File(s)**: `python/engine/garch.py`
- **Line(s)**: 21-106
- **Description**: GARCH engine exists but is not imported or called by main pipeline or agents.
- **Evidence**:
```python
class GARCHEngine:
    ...
```
- **Impact**: Maintenance overhead and misleading architecture surface.
- **Recommendation**: Integrate, gate behind feature flag, or remove until needed.

### `_generate_correlated_uniforms()` Is Unused
- **Severity**: High
- **File(s)**: `python/engine/monte_carlo.py`
- **Line(s)**: 33-56
- **Description**: Core copula helper is dead and not connected to simulation.
- **Evidence**:
```python
def _generate_correlated_uniforms(self, n_vars: int) -> np.ndarray:
    ...
```
- **Impact**: Correlated simulation claim is unfulfilled.
- **Recommendation**: Wire into `run()` and validate with correlation tests.

### `compute_ensemble_disagreement()` Is Unused
- **Severity**: Low
- **File(s)**: `python/engine/backtest.py`
- **Line(s)**: 116-132
- **Description**: Utility function is never called.
- **Evidence**:
```python
def compute_ensemble_disagreement(self, predictions: list[list[float]]) -> float:
    ...
```
- **Impact**: Unused path increases code surface without delivered value.
- **Recommendation**: Integrate into backtest output or remove.

### `pgmpy` Pinned but Not Imported
- **Severity**: Medium
- **File(s)**: `python/requirements.txt`, `python/engine/bayesian.py`
- **Line(s)**: `python/requirements.txt` 5; `python/engine/bayesian.py` 93-99
- **Description**: Bayesian engine references pgmpy conceptually, but no runtime import exists.
- **Evidence**:
```text
pgmpy==0.1.26
# TODO: Full pgmpy integration for proper Bayesian inference.
```
- **Impact**: Install burden with no runtime benefit.
- **Recommendation**: Remove pin until integrated or complete integration.

### `statsmodels`, `pandas`, and `httpx` Pinned but Unused
- **Severity**: Medium
- **File(s)**: `python/requirements.txt`
- **Line(s)**: 6-7, 11
- **Description**: These dependencies are not imported in `python/`.
- **Evidence**:
```text
statsmodels==0.14.2
pandas==2.2.2
httpx==0.27.2
```
- **Impact**: Larger install graph and more compatibility/security surface.
- **Recommendation**: Remove unused pins or add explicit usage.

## Error Handling & Resilience Gaps
### Empty Anthropic Key Does Not Fail Fast
- **Severity**: High
- **File(s)**: `python/main.py`, `python/agents/base.py`
- **Line(s)**: `python/main.py` 27; `python/agents/base.py` 38-40, 57-58
- **Description**: API key defaults to empty string and service starts anyway.
- **Evidence**:
```python
anthropic_client = Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY", ""))
...
if not self.client.api_key:
    return f"[{self.agent_type} agent]: API key not configured. Stub response."
```
- **Impact**: Misconfigured deployments can appear healthy while silently degrading behavior.
- **Recommendation**: Validate key presence at startup for AI-enabled routes.

### `/chat` and Agent Failure Modes Are Inconsistent
- **Severity**: Medium
- **File(s)**: `python/main.py`, `python/agents/base.py`
- **Line(s)**: `python/main.py` 330-331; `python/agents/base.py` 57-59
- **Description**: `/chat` returns HTTP 502 on failure, while agents return stub text for missing key.
- **Evidence**:
```python
raise HTTPException(status_code=502, detail=f"AI service error: {exc}")
...
return f"[{self.agent_type} agent]: API key not configured. Stub response."
```
- **Impact**: Clients receive heterogeneous semantics for similar failure classes.
- **Recommendation**: Standardize AI failure handling contract.

### `/chat` Leaks Raw Exception Detail to Clients
- **Severity**: Medium
- **File(s)**: `python/main.py`
- **Line(s)**: 330-331
- **Description**: Exception string is returned directly in HTTP error detail.
- **Evidence**:
```python
raise HTTPException(status_code=502, detail=f"AI service error: {exc}")
```
- **Impact**: Internal stack/vendor details may be exposed.
- **Recommendation**: Return sanitized error messages and log details server-side.

### `/simulate` Pipeline Has No Protective Error Boundary
- **Severity**: High
- **File(s)**: `python/main.py`
- **Line(s)**: 176-244
- **Description**: Entire 5-layer pipeline executes without route-level exception handling.
- **Evidence**:
```python
@app.post("/simulate")
async def run_simulation(request: SimulateRequest):
    ...
    return { ... }
```
- **Impact**: Any engine exception bubbles to generic 500; no partial diagnostics.
- **Recommendation**: Add structured try/except with stage-level error context.

### Deprecated Event Loop API in Async Context
- **Severity**: Medium
- **File(s)**: `python/agents/coordinator.py`
- **Line(s)**: 90, 145
- **Description**: Uses `asyncio.get_event_loop()` inside coroutine methods.
- **Evidence**:
```python
loop = asyncio.get_event_loop()
```
- **Impact**: Deprecation warnings and future-compat risk on newer Python.
- **Recommendation**: Use `asyncio.get_running_loop()`.

### All-Agent Failure Produces Empty Debate Rounds and Artificial Convergence
- **Severity**: Low
- **File(s)**: `python/agents/coordinator.py`
- **Line(s)**: 141-171, 190-195
- **Description**: If analyses are all `agent_type="error"`, critique pairs do not execute; convergence can jump to `1.0` due zero-length heuristic.
- **Evidence**:
```python
analysis_map = {a.agent_type: a for a in analyses}
...
if round_lengths[0] == 0:
    return 1.0
```
- **Impact**: System may report high convergence despite total failure.
- **Recommendation**: Detect all-error state and return explicit failure status.

### Near-Zero Variance Not Guarded in Sobol Denominator
- **Severity**: Medium
- **File(s)**: `python/engine/sensitivity.py`
- **Line(s)**: 51-52, 72-77
- **Description**: Guard checks `total_variance == 0` only; near-zero variance can still produce unstable large indices.
- **Evidence**:
```python
total_variance = np.var(np.concatenate([y_A, y_B]))
if total_variance == 0:
    ...
```
- **Impact**: Numerically unstable sensitivity results.
- **Recommendation**: Use epsilon threshold guard (e.g., `< 1e-12`).

## Data Contract & Serialization Issues
### Monte Carlo Response Payload Is Potentially Massive
- **Severity**: High
- **File(s)**: `python/engine/monte_carlo.py`, `python/main.py`
- **Line(s)**: `python/engine/monte_carlo.py` 22-23, 83-89, 107-108; `python/main.py` 240
- **Description**: API returns full sample distribution plus month-by-month sample arrays for each variable.
- **Evidence**:
```python
distribution=samples.tolist(),
time_series_projection=ts_projection,
...
"monte_carlo": [asdict(result) for result in monte_results],
```
- **Impact**: Large response sizes, high memory pressure, client/network latency spikes.
- **Recommendation**: Return summary stats by default; make full traces optional.

### Bayesian Edge Schema Is Manually Remapped
- **Severity**: Low
- **File(s)**: `python/main.py`, `python/engine/bayesian.py`
- **Line(s)**: `python/main.py` 196-204; `python/engine/bayesian.py` 14-18
- **Description**: `BayesianEdge` dataclass fields (`from_var`, `to_var`) are transformed to `from`/`to` in route response.
- **Evidence**:
```python
{"from": edge["from_var"], "to": edge["to_var"], ...}
```
- **Impact**: Internal/external schema divergence can create contract drift if not documented.
- **Recommendation**: Define explicit response model and keep one canonical schema.

### Pydantic v2-Specific Modeling Locks Out v1 Runtime
- **Severity**: Medium
- **File(s)**: `python/main.py`
- **Line(s)**: 16, 56, 64, 76, 85
- **Description**: Uses `ConfigDict` and v2 model config behavior.
- **Evidence**:
```python
from pydantic import BaseModel, ConfigDict, Field
model_config = ConfigDict(populate_by_name=True)
```
- **Impact**: Downgrading to Pydantic v1 (intentional or transitive) will break model declarations.
- **Recommendation**: Keep strict pin and document Pydantic v2 requirement.

### Report01 Camel/Snake Contract Gap Is Addressed
- **Severity**: Low
- **File(s)**: `reports/report01.md`, `python/main.py`
- **Line(s)**: `reports/report01.md` 78-95; `python/main.py` 56-72, 76-82
- **Description**: Previous mismatch is mitigated via aliases and `populate_by_name=True`.
- **Evidence**:
```python
business_id: str = Field(alias="businessId")
scenario_id: Optional[str] = Field(default=None, alias="scenarioId")
```
- **Impact**: Both naming conventions are now accepted by request models.
- **Recommendation**: Keep integration tests to prevent regression.

## Concurrency & Performance Risks
### Debate Critiques Run Sequentially, Not Parallel
- **Severity**: Medium
- **File(s)**: `python/agents/coordinator.py`
- **Line(s)**: 147-154
- **Description**: Critique calls are awaited inside loop one-by-one.
- **Evidence**:
```python
for from_type, to_type in critique_pairs:
    ...
    critique_text = await loop.run_in_executor(...)
```
- **Impact**: Higher latency per `/agents/analyze` request.
- **Recommendation**: Batch critique futures and `gather()` per round.

### High Claude Call Volume Without Backoff/Rate-Limit Strategy
- **Severity**: High
- **File(s)**: `python/agents/coordinator.py`, `python/agents/base.py`
- **Line(s)**: `python/agents/coordinator.py` 92-99, 131-139, 143-167; `python/agents/base.py` 60-65
- **Description**: Up to 6 initial analyses + up to 18 critique calls per request; no retries/backoff/throttling.
- **Evidence**:
```python
tasks = [loop.run_in_executor(None, agent.analyze, ...) for agent in self.agents.values()]
critique_pairs = [("risk", "growth"), ...]  # 6 pairs x up to 3 rounds
```
- **Impact**: Elevated timeout/rate-limit risk under load.
- **Recommendation**: Add bounded concurrency, backoff, and budget caps.

### Monte Carlo Memory/CPU Cost Scales Aggressively
- **Severity**: High
- **File(s)**: `python/engine/monte_carlo.py`, `python/main.py`
- **Line(s)**: `python/engine/monte_carlo.py` 73, 83-89, 107-108; `python/main.py` 58, 187-190
- **Description**: For each variable and month, arrays of `iterations` samples are generated and retained.
- **Evidence**:
```python
iterations: int = 10000
month_samples = var.distribution.sample(self.iterations)
ts_projection.append(month_samples.tolist())
```
- **Impact**: High latency and large memory footprint with variable count growth.
- **Recommendation**: Stream/aggregate summaries; avoid retaining all traces by default.

### Sensitivity Cost Scales With Samples × Variables × Methods
- **Severity**: Medium
- **File(s)**: `python/engine/sensitivity.py`, `python/main.py`
- **Line(s)**: `python/engine/sensitivity.py` 39-49, 65-70, 115-130; `python/main.py` 217
- **Description**: Sobol + Morris evaluations can become expensive as variable count rises.
- **Evidence**:
```python
n_samples=min(max(request.config.iterations // 10, 128), 1024)
y_A = np.array([model_func(row) for row in A])
```
- **Impact**: Runtime increases nonlinearly with model complexity.
- **Recommendation**: Add performance guardrails and adaptive sampling.

## Security Concerns
### No Authentication or Authorization on Any Endpoint
- **Severity**: Critical
- **File(s)**: `python/main.py`
- **Line(s)**: 171-359
- **Description**: All routes are publicly callable without auth checks.
- **Evidence**:
```python
@app.get("/health")
@app.post("/simulate")
@app.post("/agents/analyze")
@app.post("/chat")
@app.post("/extract-variables")
```
- **Impact**: Unauthorized use, abuse of costly AI/simulation endpoints, and data exposure risk.
- **Recommendation**: Add auth middleware/token validation before production.

### CORS Policy Is Broad for Methods/Headers
- **Severity**: Medium
- **File(s)**: `python/main.py`
- **Line(s)**: 35-49
- **Description**: Allows all methods and headers for configured origins.
- **Evidence**:
```python
allow_methods=["*"],
allow_headers=["*"],
```
- **Impact**: Wider attack surface if origin list is misconfigured in production.
- **Recommendation**: Restrict methods/headers to required set.

### `/extract-variables` Accepts Arbitrary Unvalidated Dict Payloads
- **Severity**: Medium
- **File(s)**: `python/main.py`
- **Line(s)**: 335, 340-345
- **Description**: Endpoint accepts generic `dict` without schema/size validation.
- **Evidence**:
```python
async def extract_variables(data: dict):
    rows = data.get("rows", [])
```
- **Impact**: Potential abuse via large or malformed payloads.
- **Recommendation**: Introduce Pydantic request model with field constraints.

### Raw Upstream Error Details Are Exposed
- **Severity**: Medium
- **File(s)**: `python/main.py`
- **Line(s)**: 330-331
- **Description**: Exception messages from AI provider are returned to clients.
- **Evidence**:
```python
detail=f"AI service error: {exc}"
```
- **Impact**: Information leakage and easier abuse/debugging by attackers.
- **Recommendation**: Sanitize client errors; log full detail privately.

## Mathematical Correct Review
### Gaussian Copula Construction Is Mathematically Reasonable but Unused
- **Severity**: High
- **File(s)**: `python/engine/monte_carlo.py`
- **Line(s)**: 44-56
- **Description**: Cholesky + normal CDF transformation pipeline is structurally correct for Gaussian copula sampling, but it is disconnected from `run()`.
- **Evidence**:
```python
L = np.linalg.cholesky(corr)
correlated_normals = z @ L.T
uniforms = stats.norm.cdf(correlated_normals)
```
- **Impact**: Intended correlation mathematics are not reflected in delivered outputs.
- **Recommendation**: Apply generated uniforms through inverse marginals in active simulation path.

### Sobol First-Order Estimator Formula Appears Valid (Saltelli Form)
- **Severity**: Low
- **File(s)**: `python/engine/sensitivity.py`
- **Line(s)**: 71-73
- **Description**: The implemented first-order formula matches a standard Saltelli-style estimator.
- **Evidence**:
```python
S_i = float(np.mean(y_B * (y_AB_i - y_A)) / total_variance)
```
- **Impact**: No primary formula defect found; major risk is model choice and numerical guarding.
- **Recommendation**: Keep formula, improve variance stability checks and output interpretation.

### Morris Screening Perturbs Outside Bounds and Uses Fixed Delta
- **Severity**: Medium
- **File(s)**: `python/engine/sensitivity.py`
- **Line(s)**: 126-129
- **Description**: Perturbation does not clip to bounds; fixed `delta=0.1` ignores variable scaling nuances.
- **Evidence**:
```python
step = delta * (bounds[i][1] - bounds[i][0])
x_pert[i] += step
```
- **Impact**: Elementary effects may be computed outside intended domain.
- **Recommendation**: Clip perturbed points and support adaptive step/grid levels.

### GARCH Forecast Equation Is Correctly Implemented with `omega`
- **Severity**: Low
- **File(s)**: `python/engine/garch.py`
- **Line(s)**: 103
- **Description**: Forecast includes `omega + (alpha + beta) * current_var`, consistent with standard GARCH(1,1) recursion.
- **Evidence**:
```python
current_var = result.omega + (result.alpha + result.beta) * current_var
```
- **Impact**: No direct recursion formula bug identified in forecast step.
- **Recommendation**: Keep recursion; focus improvements on estimation quality and integration.

### GARCH Parameter Estimation Uses Coarse Grid Instead of Proper MLE Optimization
- **Severity**: Medium
- **File(s)**: `python/engine/garch.py`
- **Line(s)**: 53-57
- **Description**: Parameter search uses coarse `np.arange` grid.
- **Evidence**:
```python
for a in np.arange(0.01, 0.3, 0.05):
    for b in np.arange(0.5, 0.95, 0.05):
```
- **Impact**: Fit may miss reasonable optima and underperform standard implementations.
- **Recommendation**: Use constrained numerical optimization for likelihood maximization.

### Distribution Selection via KS Test Is Weak for Small/Moderate Samples
- **Severity**: Medium
- **File(s)**: `python/engine/variable_universe.py`
- **Line(s)**: 102-127
- **Description**: KS p-value ranking over fitted parameters can be unstable for small samples and does not compare broad candidate families.
- **Evidence**:
```python
_, p = stats.kstest(arr, "norm", args=(mu, sigma))
...
_, p = stats.kstest(arr, "lognorm", args=(shape, loc, scale))
```
- **Impact**: Chosen marginals may be brittle, degrading simulation realism.
- **Recommendation**: Use AIC/BIC or cross-validated likelihood with richer candidate set.

## Summary Table
| # | Issue | Severity | Category | File(s) |
|---|-------|----------|----------|---------|
| 1 | Python 3.9 `match/case` syntax blocker | Critical | Environment & Compatibility | `python/engine/variable_universe.py` |
| 2 | Built-in generics enforce Python 3.9+ floor | Medium | Environment & Compatibility | `python/main.py`, `python/engine/*.py`, `python/agents/*.py` |
| 3 | No deferred-annotation import in type-heavy modules | Low | Environment & Compatibility | `python/**/*.py` |
| 4 | Scientific pins incompatible with Python 3.13 install path | Critical | Environment & Compatibility | `python/requirements.txt` |
| 5 | Bare `uvicorn` interpreter selection footgun | High | Environment & Compatibility | `python/requirements.txt`, `CLAUDE.md` |
| 6 | `report01` backend contract/stub items mostly addressed | Low | Environment & Compatibility | `reports/report01.md`, `python/main.py` |
| 7 | Distribution sampling lacks parameter validation | High | Runtime Correctness | `python/engine/variable_universe.py` |
| 8 | Small-sample std fallback fails on `nan` | High | Runtime Correctness | `python/engine/variable_universe.py` |
| 9 | Scenario zero-value overrides are dropped | High | Runtime Correctness | `python/main.py` |
| 10 | Scenario override guard mismatches universe IDs | High | Runtime Correctness | `python/main.py`, `python/engine/variable_universe.py` |
| 11 | Monte Carlo correlation logic not applied | Critical | Runtime Correctness | `python/engine/monte_carlo.py` |
| 12 | Bayesian structure misses edges due ID/name mismatch | High | Runtime Correctness | `python/main.py`, `python/engine/bayesian.py` |
| 13 | Bayesian posteriors are placeholders | Medium | Runtime Correctness | `python/engine/bayesian.py` |
| 14 | Sensitivity model function is toy sum | Medium | Runtime Correctness | `python/main.py` |
| 15 | Backtest uses naive mean predictor | Medium | Runtime Correctness | `python/main.py` |
| 16 | Misnamed Brier score metric | Medium | Runtime Correctness | `python/engine/backtest.py` |
| 17 | Sensitivity bounds overinflate near-zero variables | Low | Runtime Correctness | `python/main.py` |
| 18 | Numeric columns forced to financial category | Low | Runtime Correctness | `python/main.py` |
| 19 | `garch.py` not integrated | Medium | Dead Code & Unused Dependencies | `python/engine/garch.py` |
| 20 | Copula helper method unused | High | Dead Code & Unused Dependencies | `python/engine/monte_carlo.py` |
| 21 | Ensemble disagreement utility unused | Low | Dead Code & Unused Dependencies | `python/engine/backtest.py` |
| 22 | `pgmpy` pinned but unused | Medium | Dead Code & Unused Dependencies | `python/requirements.txt`, `python/engine/bayesian.py` |
| 23 | `statsmodels`/`pandas`/`httpx` pinned but unused | Medium | Dead Code & Unused Dependencies | `python/requirements.txt` |
| 24 | Missing Anthropic key does not fail fast | High | Error Handling & Resilience | `python/main.py`, `python/agents/base.py` |
| 25 | Inconsistent AI failure semantics (`/chat` vs agents) | Medium | Error Handling & Resilience | `python/main.py`, `python/agents/base.py` |
| 26 | `/chat` returns raw exception detail | Medium | Error Handling & Resilience | `python/main.py` |
| 27 | `/simulate` lacks route-level error boundary | High | Error Handling & Resilience | `python/main.py` |
| 28 | Deprecated `asyncio.get_event_loop()` usage | Medium | Error Handling & Resilience | `python/agents/coordinator.py` |
| 29 | All-error analyses can report artificial convergence | Low | Error Handling & Resilience | `python/agents/coordinator.py` |
| 30 | Sobol near-zero variance instability risk | Medium | Error Handling & Resilience | `python/engine/sensitivity.py` |
| 31 | Monte Carlo API payload is excessively large | High | Data Contract & Serialization | `python/engine/monte_carlo.py`, `python/main.py` |
| 32 | Bayesian edge schema remap can drift contract | Low | Data Contract & Serialization | `python/main.py`, `python/engine/bayesian.py` |
| 33 | Pydantic v2-specific model config dependency | Medium | Data Contract & Serialization | `python/main.py` |
| 34 | Camel/snake model mismatch from report01 is fixed | Low | Data Contract & Serialization | `reports/report01.md`, `python/main.py` |
| 35 | Debate critiques are sequential | Medium | Concurrency & Performance | `python/agents/coordinator.py` |
| 36 | High AI call volume without backoff/quotas | High | Concurrency & Performance | `python/agents/coordinator.py`, `python/agents/base.py` |
| 37 | Monte Carlo CPU/memory scaling risk | High | Concurrency & Performance | `python/engine/monte_carlo.py`, `python/main.py` |
| 38 | Sensitivity scaling risk with larger models | Medium | Concurrency & Performance | `python/engine/sensitivity.py`, `python/main.py` |
| 39 | No endpoint authentication/authorization | Critical | Security | `python/main.py` |
| 40 | Broad CORS methods/headers | Medium | Security | `python/main.py` |
| 41 | `/extract-variables` lacks schema/limits | Medium | Security | `python/main.py` |
| 42 | Raw upstream exception exposure | Medium | Security | `python/main.py` |
| 43 | Copula math is sound but disconnected from runtime path | High | Mathematical Correct Review | `python/engine/monte_carlo.py` |
| 44 | Sobol first-order formula appears correct | Low | Mathematical Correct Review | `python/engine/sensitivity.py` |
| 45 | Morris perturbation can exit bounds | Medium | Mathematical Correct Review | `python/engine/sensitivity.py` |
| 46 | GARCH forecast recursion is correct | Low | Mathematical Correct Review | `python/engine/garch.py` |
| 47 | GARCH fit uses coarse grid search | Medium | Mathematical Correct Review | `python/engine/garch.py` |
| 48 | KS-based distribution selection is statistically weak | Medium | Mathematical Correct Review | `python/engine/variable_universe.py` |

## Risk Matrix
- **Critical (Immediate production blockers)**: Python version/install incompatibility (`match/case` on 3.9; scientific pin set on 3.13), missing auth, and correlation logic not wired. These can prevent startup, permit unauthorized costly usage, or generate fundamentally incorrect simulation outputs.
- **High (High-likelihood reliability/correctness failures)**: scenario override bugs, oversized payload design, AI call-volume pressure without controls, missing route-level error boundary, and dead-but-core copula path. These degrade correctness and can cause timeout/memory incidents under real workloads.
- **Medium (Operational quality and trust risks)**: placeholder Bayesian inference, metric mislabeling (`brier_score`), deprecated async APIs, unused heavy dependencies, and contract drift opportunities. These may not crash immediately but erode output credibility and maintainability.
- **Low (Cosmetic/structural debt)**: annotation hygiene and several validated-but-not-bug mathematical checks. These are lower urgency but should be addressed after critical/high stabilization.
