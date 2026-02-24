# Codex Fix Prompts — OptX Python Backend

> 4 prompts to fix all 48 issues from `reports/report02.md`. Run in order — each builds on the previous.

---

## Prompt 1: Environment & Compatibility Fixes

```
Read `reports/report02.md` and `CLAUDE.md` for full context.

Fix all environment and compatibility issues (report02.md issues #1-6, #22-23) in the `python/` directory:

1. **Replace `match/case` with `if/elif` dispatch** in `python/engine/variable_universe.py` (lines 34-64). The `Distribution.sample()` method uses structural pattern matching which requires Python 3.10+. Convert to equivalent `if/elif` chain on `self.type`.

2. **Update `python/requirements.txt` dependency pins** to versions compatible with Python 3.11/3.12:
   - `scipy==1.13.1` → `scipy>=1.14.0` (needs wheels for modern Python)
   - `numpy==1.26.4` → `numpy>=1.26.4,<2.0`
   - Keep other working pins but verify they have wheels for Python 3.11+
   - **Remove these unused dependencies entirely**:
     - `pgmpy==0.1.26` (never imported anywhere — bayesian.py has a TODO but no actual import)
     - `statsmodels==0.14.2` (never imported in any file)
     - `pandas==2.2.2` (never imported in any file)
     - `httpx==0.27.2` (never imported in any file)

3. **Add `from __future__ import annotations`** to the top of every Python file in `python/` that uses built-in generic type hints (`dict[str, X]`, `list[X]`, `tuple[X, Y]`). This ensures forward compatibility. Files to update:
   - `python/main.py`
   - `python/engine/variable_universe.py`
   - `python/engine/monte_carlo.py`
   - `python/engine/bayesian.py`
   - `python/engine/sensitivity.py`
   - `python/engine/backtest.py`
   - `python/engine/garch.py`
   - `python/agents/base.py`
   - `python/agents/coordinator.py`

4. **Update `CLAUDE.md`** line 18: change `uvicorn main:app --reload --port 8000` to `python -m uvicorn main:app --reload --port 8000` to prevent system Python from being used instead of the active venv interpreter.

After making changes, verify by running:
```
python -m py_compile python/main.py
python -m py_compile python/engine/variable_universe.py
python -m py_compile python/engine/monte_carlo.py
python -m py_compile python/engine/bayesian.py
python -m py_compile python/engine/sensitivity.py
python -m py_compile python/engine/backtest.py
python -m py_compile python/engine/garch.py
python -m py_compile python/agents/base.py
python -m py_compile python/agents/coordinator.py
```
```

---

## Prompt 2: Runtime Correctness Fixes

```
Read `reports/report02.md` and `CLAUDE.md` for full context. This is the second batch of fixes — Prompt 1 (compatibility) has already been applied.

Fix all runtime correctness bugs (report02.md issues #7-18) in `python/engine/` and `python/main.py`:

### Variable Universe (`python/engine/variable_universe.py`)

1. **Issue #7 — Add parameter validation in `Distribution.sample()`** (lines 32-64): Before sampling, validate that parameters are valid (e.g., `std > 0` for normal, `sigma > 0` for lognormal, `alpha > 0` and `beta > 0` for beta, `left < mode < right` for triangular). If invalid, fall back to returning `np.full(n, self.params.get("mean", 0.0))` with a warning.

2. **Issue #8 — Fix `nan` std guard in `fit_distribution()`** (lines 95-100): `float(np.std(arr, ddof=1)) or 1.0` does NOT catch `nan` because `nan` is truthy in Python. Replace with:
   ```python
   std_val = float(np.std(arr, ddof=1))
   if not np.isfinite(std_val) or std_val <= 0:
       std_val = 1.0
   ```

### Monte Carlo (`python/engine/monte_carlo.py`)

3. **Issue #11 — Wire copula correlation into `run()`** (lines 58-112): Currently `_generate_correlated_uniforms()` exists but is never called. Fix `run()` to:
   - Call `_generate_correlated_uniforms(n_vars)` to get correlated uniform samples
   - For each variable, use the corresponding column of uniforms to generate correlated samples via inverse CDF (scipy.stats PPF) instead of independent `var.distribution.sample()`
   - Keep the existing independent sampling as fallback when correlation matrix is identity or unavailable

### Bayesian Network (`python/engine/bayesian.py`)

4. **Issue #12 — Fix ID/name mismatch in `build_default_structure()`** (lines 57-88): The method expects names like `"monthly_revenue"` but receives universe variable IDs like `"revenue_monthly"`, `"expense_payroll"`. Fix by:
   - Also checking against variable `.name` field, not just dict keys
   - OR accepting a `dict[str, Variable]` parameter and matching against both `.id` and `.name`
   - Update the call site in `python/main.py` line 193 accordingly

5. **Issue #13 — Add explicit stub marker to `infer()` output** (lines 90-108): Add a `"stub": True` field to the posteriors dict so downstream consumers can detect placeholder data.

### Main Pipeline (`python/main.py`)

6. **Issue #9 — Fix scenario override zero-value drops** (lines 124, 130-131):
   - Line 124: `variable.get("modifiedValue") or variable.get("modified_value")` drops `0`. Replace with explicit key check:
     ```python
     modified_value = variable.get("modifiedValue")
     if modified_value is None:
         modified_value = variable.get("modified_value")
     ```
   - Line 122: Same pattern for `variable_id` — use explicit `None` check instead of `or`.

7. **Issue #10 — Fix `node-` prefix guard mismatch** (lines 127-128): Variable IDs in the universe do NOT use `node-` prefix (they use `revenue_monthly`, `expense_*`, etc.). Either:
   - Check `variable_id in universe.variables` (without `node-` prefix), OR
   - Check both with and without prefix for compatibility

8. **Issue #14 — Replace toy `sum()` sensitivity model** (lines 210-214): Replace `float(sum(values))` with a function that computes a meaningful business metric. For example, compute net income: first value as revenue minus sum of remaining values as expenses. If only one variable, return that value.

9. **Issue #15 — Label backtest predictor as baseline** (lines 225-229): Add a comment and include `"predictor": "trailing_mean_baseline"` in the backtest result metadata.

10. **Issue #17 — Fix near-zero sensitivity bounds** (lines 155-158): For variables with near-zero base values, use a category-aware minimum span instead of hardcoded `1.0`:
    ```python
    span = max(abs(base) * 0.2, abs(base) * 0.01 + 0.01)
    ```

11. **Issue #18 — Improve `/extract-variables` category inference** (lines 345-352): Instead of hardcoding `"financial"`, infer category from column name patterns (e.g., names containing "revenue", "cost", "price" → "financial"; "count", "quantity" → "operations"; default → "general").

### Backtest (`python/engine/backtest.py`)

12. **Issue #16 — Rename Brier score** (lines 72-74): Rename the `brier_score` field to `mean_squared_relative_error` in the `BacktestResult` dataclass and update all references in `python/main.py`.

After making changes, verify by running:
```
python -m py_compile python/main.py
python -m py_compile python/engine/variable_universe.py
python -m py_compile python/engine/monte_carlo.py
python -m py_compile python/engine/bayesian.py
python -m py_compile python/engine/backtest.py
```
```

---

## Prompt 3: Error Handling, Security & Resilience

```
Read `reports/report02.md` and `CLAUDE.md` for full context. Prompts 1 and 2 have already been applied.

Fix all error handling, resilience, and security issues (report02.md issues #24-30, #39-42) in `python/main.py`, `python/agents/base.py`, `python/agents/coordinator.py`, and `python/engine/sensitivity.py`:

### Fail-Fast API Key Validation

1. **Issue #24 — Fail fast on missing Anthropic key** in `python/main.py` (line 27) and `python/agents/base.py` (lines 38-40):
   - In `main.py`, after `load_dotenv()`, add a startup check:
     ```python
     ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY")
     if not ANTHROPIC_API_KEY:
         import warnings
         warnings.warn("ANTHROPIC_API_KEY not set — AI features will return stub responses")
     ```
   - Pass the validated key to both `anthropic_client` and make `BaseAgent` use the same validated key variable
   - Keep the stub fallback in `BaseAgent._call_claude()` for graceful degradation, but log a warning

### Error Semantics & Boundaries

2. **Issue #25 — Standardize AI failure handling**: Make `BaseAgent._call_claude()` in `python/agents/base.py` raise a custom exception (e.g., `AIServiceError`) instead of returning stub text when the API call fails (not just missing key — also API errors). The coordinator already handles exceptions from agents.

3. **Issue #26 — Sanitize error messages in `/chat`** in `python/main.py` (lines 330-331): Replace raw exception detail with a generic message:
   ```python
   import logging
   logger = logging.getLogger(__name__)
   ...
   except Exception as exc:
       logger.error(f"Chat AI error: {exc}", exc_info=True)
       raise HTTPException(status_code=502, detail="AI service temporarily unavailable")
   ```

4. **Issue #27 — Add route-level error boundary to `/simulate`** in `python/main.py` (lines 176-244): Wrap the entire simulation pipeline in try/except with stage-level context:
   ```python
   try:
       # ... existing pipeline ...
   except HTTPException:
       raise
   except Exception as exc:
       logger.error(f"Simulation pipeline error: {exc}", exc_info=True)
       raise HTTPException(status_code=500, detail="Simulation failed — check server logs")
   ```
   Do the same for `/agents/analyze` (lines 247-254).

### Async & Convergence

5. **Issue #28 — Replace deprecated `asyncio.get_event_loop()`** in `python/agents/coordinator.py` (lines 90, 145): Replace both occurrences with `asyncio.get_running_loop()`.

6. **Issue #29 — Detect all-error convergence** in `python/agents/coordinator.py` (lines 175-195): In `_check_convergence()`, check if all analyses are error types before computing convergence:
   ```python
   if all(c.critique == "" for dr in debate_rounds for c in dr.critiques):
       return 0.0  # No real debate occurred
   ```

### Numerical Stability

7. **Issue #30 — Fix near-zero variance in Sobol** in `python/engine/sensitivity.py` (lines 51-52): Replace exact zero check with epsilon threshold:
   ```python
   if total_variance < 1e-12:
   ```

### Security

8. **Issue #39 — Add basic API key auth middleware** to `python/main.py`: Add a simple bearer token check via a FastAPI dependency:
   ```python
   from fastapi import Depends, Security
   from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

   security = HTTPBearer(auto_error=False)
   API_AUTH_TOKEN = os.getenv("OPTX_API_TOKEN")

   async def verify_token(credentials: HTTPAuthorizationCredentials = Security(security)):
       if not API_AUTH_TOKEN:
           return  # Auth disabled if no token configured
       if not credentials or credentials.credentials != API_AUTH_TOKEN:
           raise HTTPException(status_code=401, detail="Unauthorized")
   ```
   Apply `Depends(verify_token)` to `/simulate`, `/agents/analyze`, `/chat`, and `/extract-variables`. Leave `/health` unauthenticated.

9. **Issue #40 — Restrict CORS methods/headers** in `python/main.py` (lines 43-49): Replace wildcards with specific allowed values:
   ```python
   allow_methods=["GET", "POST", "OPTIONS"],
   allow_headers=["Content-Type", "Authorization"],
   ```

10. **Issue #41 — Add Pydantic model for `/extract-variables`** in `python/main.py` (lines 334-335): Replace `data: dict` with a proper Pydantic model:
    ```python
    class ExtractVariablesRequest(BaseModel):
        rows: list[dict[str, Any]] = Field(default_factory=list, max_length=10000)
    ```

11. **Issue #42 — Already addressed by #26** (sanitized error messages).

After making changes, verify:
```
python -m py_compile python/main.py
python -m py_compile python/agents/base.py
python -m py_compile python/agents/coordinator.py
python -m py_compile python/engine/sensitivity.py
```
```

---

## Prompt 4: Performance & Dead Code Cleanup

```
Read `reports/report02.md` and `CLAUDE.md` for full context. Prompts 1-3 have already been applied.

Fix all performance, concurrency, and dead code issues (report02.md issues #19-21, #31, #35-38) in the `python/` directory:

### Response Payload Optimization

1. **Issue #31 — Trim Monte Carlo response payload** in `python/engine/monte_carlo.py` and `python/main.py`:
   - In `MonteCarloResult`, remove the `distribution: list[float]` field (full 10K sample array)
   - Replace `time_series_projection: list[list[float]]` with summary stats per month:
     ```python
     @dataclass
     class MonthProjection:
         month: int
         mean: float
         std: float
         p5: float
         p25: float
         p50: float
         p75: float
         p95: float
     ```
   - Update `MonteCarloEngine.run()` to compute and store summaries instead of raw arrays
   - Add an optional `include_raw_samples: bool = False` field to `SimulationConfig` in `main.py` — if True, include full distribution arrays; if False (default), return summaries only

### Concurrency Improvements

2. **Issue #35 — Parallelize debate critiques** in `python/agents/coordinator.py` (lines 147-163): Instead of awaiting each critique sequentially in the loop, collect all futures and use `asyncio.gather()`:
   ```python
   loop = asyncio.get_running_loop()
   critique_futures = []
   critique_metadata = []
   for from_type, to_type in critique_pairs:
       from_agent = self.agents.get(from_type)
       to_analysis = analysis_map.get(to_type)
       if from_agent and to_analysis:
           critique_futures.append(
               loop.run_in_executor(None, from_agent.critique, to_analysis, business_data)
           )
           critique_metadata.append((from_type, to_type))

   critique_results = await asyncio.gather(*critique_futures, return_exceptions=True)
   for (from_type, to_type), result in zip(critique_metadata, critique_results):
       critique_text = str(result) if isinstance(result, Exception) else result
       critiques.append(DebateCritique(...))
   ```

3. **Issue #36 — Add concurrency limits to Claude API calls** in `python/agents/coordinator.py`: Add a semaphore to limit concurrent API calls:
   ```python
   def __init__(self):
       ...
       self._api_semaphore = asyncio.Semaphore(4)  # Max 4 concurrent Claude calls
   ```
   Wrap `run_in_executor` calls with the semaphore in both `_run_parallel_analysis()` and `_run_debate_rounds()`.

### Dead Code Cleanup

4. **Issue #19 — Remove or integrate `garch.py`**: Since GARCH is never used and would need significant work to integrate, add a clear module-level docstring marking it as experimental/future:
   ```python
   """GARCH Volatility Modeling (EXPERIMENTAL — not yet integrated into simulation pipeline)
   ...
   """
   ```
   Do NOT delete the file — just clearly mark its status.

5. **Issue #20 — `_generate_correlated_uniforms()`**: This should have been wired in Prompt 2 (Issue #11). If it's still unused, verify it's now called in `run()`.

6. **Issue #21 — `compute_ensemble_disagreement()`** in `python/engine/backtest.py`: Wire this into `BacktestEngine.walk_forward_validation()` by:
   - Having the walk-forward loop collect prediction arrays per window
   - Computing ensemble disagreement across windows
   - Including it in the `BacktestResult.ensemble_disagreement` field (currently hardcoded to `0.0`)

### Mathematical Improvements

7. **Issue #45 — Clip Morris perturbations to bounds** in `python/engine/sensitivity.py` (lines 126-129):
   ```python
   x_pert[i] = np.clip(x_pert[i], bounds[i][0], bounds[i][1])
   ```

8. **Issue #38 — Add adaptive sampling guard for Sobol** in `python/engine/sensitivity.py`: Add a max variable count check:
   ```python
   if n_vars > 50:
       n_samples = min(n_samples, 256)  # Cap samples for high-dimensional spaces
   ```

After making changes, verify:
```
python -m py_compile python/main.py
python -m py_compile python/engine/monte_carlo.py
python -m py_compile python/engine/backtest.py
python -m py_compile python/engine/sensitivity.py
python -m py_compile python/agents/coordinator.py
```
```

---

## Run Order

1. **Prompt 1** → installs and starts working
2. **Prompt 2** → simulation outputs are correct
3. **Prompt 3** → service is resilient and secure
4. **Prompt 4** → service is performant and clean
