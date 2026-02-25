# Codex Simulation UI/UX Overhaul Prompts

> A series of prompts to provide to Codex/Cursor to implement the Simulation UI/UX overhaul as defined in the OptX implementation plan. Run these in order.

---

## Prompt 1: API Route & Data Extraction Fixes

```
Read `app/api/simulate/route.ts` and `app/simulate/page.tsx` and fix the simulation data extraction issues:

1. **Fix `raw_samples` strip in `api/simulate/route.ts`**: The Python backend has been updated to confidently pass a condensed `raw_samples` array for every variable in Monte Carlo regardless of config. BUT the API route might still be dropping it or not parsing it properly. Ensure `raw_samples` is preserved when mapping from python payload to `simulationRow` and from `toSimulationResult`.
2. **Fix Backtest Walk-Forward parsing**: In `api/simulate/route.ts` -> `toSimulationResult`, `row.backtest` contains `walk_forward_results` from Python, but the frontend explicitly looks for camelCase inside the store/types. Update `toSimulationResult` OR the parsing in `page.tsx` `getBacktestData()` to reliably extract `walk_forward_results` list (and map to `walkForwardResults` or just read the snake_case keys) so the backtest chart actually displays data.
3. **Agent Analysis Trigger**: In `app/simulate/page.tsx`, we need to actually pass `includeAgentEnrichment: true` when we want agents to run. We will add a UI toggle for this later, but ensure the route accepts it and passes it to Python.
```

---

## Prompt 2: Number Formatting & Utility Functions

```
Add consistent number formatting utility functions in `app/simulate/page.tsx` (or a separate `lib/utils/format.ts` if one exists, then import them). 

Create these functions:
- `formatCurrency(val: number, compact=false)`: Returns `$XX,XXX` or `$XX.XK` if compact is true.
- `formatPercent(val: number)`: Returns `XX.X%`.
- `formatCompact(val: number)`: Returns `XX.XK`, `XX.XM` etc.
- `formatVarName(name: string)`: Converts snake_case to Title Case (e.g. `monthly_revenue` -> `Monthly Revenue`, `expense_rent` -> `Rent`).

Update ALL tabs in `app/simulate/page.tsx` to use these formatters for their numbers:
1. Monte Carlo stats (Mean, Median, Std Dev, P5-P95) should use `formatCurrency`. Variable titles should use `formatVarName`.
2. Backtest Accuracy should use `formatPercent`. Brier Score / Disagreement stay raw decimals, but predicted/actual in the chart tooltip should be currency.
3. Sensitivity: use `formatVarName` for the variable column.

Remove the basic `formatMetric` (which just does `.toFixed()`) in favor of these currency-aware formatters where appropriate (use decimal formatting only for pure indices like Sobol).
```

---

## Prompt 3: UI Visual Improvements (Charts & Tabs)

```
Overhaul the visual representations in `app/simulate/page.tsx` for all 5 tabs using Recharts and Tailwind:

1. **Monte Carlo Tab**: 
   - Add a *Fan Chart* (LineChart) to show the `time_series_projection`. Use the `month` for the X-axis (`Month 1`, `Month 2`, etc). The median line should be the primary color, and use `Area` components or multiple lines to show the P5-P95 and P25-P75 confidence bands.
   - Keep the existing histogram below it, but ensure it works with the newly passed `raw_samples`.
   - Color code the metric cards: if the projected metric is revenue, green is good, red is bad (and vice versa for expenses).

2. **Sensitivity Tab**:
   - Above the chart, add a summary text block identifying the top 1 or 2 most impactful variables. For example: `"[Variable Name] has the highest impact on outcomes (Sobol: X.XXX). Focus optimization efforts here."`
   - Replace the plain `BarChart` with a horizontal bar chart that uses a color scale (e.g. from red to green) based on the impact magnitude.

3. **Bayesian Tab**:
   - Improve the logic that renders the edges. Add color-coding to the "Strength": if strength >0, color the text green (positive correlation), if <0, red (negative correlation).
   - Format the strength as a percentage: `+45%` instead of `0.450`.

4. **Backtest Tab**:
   - Add a summary badge for Accuracy: Green if >80%, Amber if >50%, Red if <50%.
   - In the Walk-Forward LineChart, add the `p5` and `p95` columns (which are now available) as dashed lines or an Area to show the model's confidence bounds around its prediction vs the actual actual line.
```

---

## Prompt 4: The Auto-generated Simulation Summary

```
In `app/simulate/page.tsx`, directly below the "Simulation Results" header card, but ABOVE the 5 tabs, add a new **Auto-Generated Simulation Summary** top-level component that is visible as soon as the simulation completes.

This summary should include:
1. A summary headline: e.g. "Simulation Complete. High confidence in revenue targets."
2. 3 Key metrics in large cards side-by-side:
   - "Expected Month 12 Revenue" (use Monte Carlo Median for the revenue variable at month 12)
   - "Primary Risk Driver" (use #1 Sensitivity variable)
   - "Model Accuracy" (use Backtest Accuracy)
3. A small sparkline-style LineChart representing the aggregate baseline projection.

Ensure this summary section acts as the "executive summary" before the user clicks into the detailed tabs below.
```
