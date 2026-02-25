"""OptX — Python FastAPI Microservice

Mathematical simulation engine and AI agent system.
"""

from __future__ import annotations

from dataclasses import asdict
from typing import Any, Optional, List
import json
import logging
import os
import uuid
import warnings
import numpy as np

from openai import OpenAI
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Depends, Security
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel, ConfigDict, Field

from engine.variable_universe import VariableUniverse, Variable
from engine.monte_carlo import MonteCarloEngine
from engine.bayesian import BayesianEngine
from engine.sensitivity import SensitivityEngine
from engine.backtest import BacktestEngine
from engine.garch import GARCHEngine
from agents.coordinator import AgentCoordinator

load_dotenv()

logger = logging.getLogger(__name__)

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
if not OPENAI_API_KEY:
    warnings.warn(
        "OPENAI_API_KEY not set — AI features will return stub responses",
        RuntimeWarning,
        stacklevel=2,
    )
API_AUTH_TOKEN = os.getenv("OPTX_API_TOKEN")

openai_client = OpenAI(api_key=OPENAI_API_KEY or "")
security = HTTPBearer(auto_error=False)

app = FastAPI(
    title="OptX Engine",
    description="Mathematical simulation engine and AI agent system for OptX",
    version="0.1.0",
)

allowed_origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]
frontend_origin = os.getenv("FRONTEND_ORIGIN")
if frontend_origin:
    allowed_origins.append(frontend_origin)

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization"],
)


# --- Request/Response Models ---


class SimulationConfig(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    iterations: int = 10000
    time_horizon_months: int = Field(default=12, alias="timeHorizonMonths")
    confidence_level: float = Field(default=0.95, alias="confidenceLevel")
    include_raw_samples: bool = Field(default=False, alias="includeRawSamples")


class SimulateRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    business_id: str = Field(alias="businessId")
    config: SimulationConfig
    scenario_id: Optional[str] = Field(default=None, alias="scenarioId")
    business_data: dict[str, Any] = Field(default_factory=dict, alias="businessData")
    scenario_variables: List[dict[str, Any]] = Field(
        default_factory=list, alias="scenarioVariables"
    )
    include_agent_enrichment: bool = Field(
        default=False, alias="includeAgentEnrichment"
    )


class AgentAnalyzeRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    business_id: str = Field(alias="businessId")
    simulation_id: str = Field(alias="simulationId")
    business_data: dict[str, Any] = Field(default_factory=dict, alias="businessData")
    simulation_data: dict[str, Any] = Field(default_factory=dict, alias="simulationData")


class ChatRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    message: str
    mode: Optional[str] = None  # "parse_scenario" or None for general chat
    report_id: Optional[str] = Field(default=None, alias="reportId")
    scenario_id: Optional[str] = Field(default=None, alias="scenarioId")
    simulation_id: Optional[str] = Field(default=None, alias="simulationId")
    history: List[dict[str, Any]] = Field(default_factory=list)


class ExtractVariablesRequest(BaseModel):
    rows: list[dict[str, Any]] = Field(default_factory=list, max_length=10000)


# --- Helpers ---


async def verify_token(
    credentials: Optional[HTTPAuthorizationCredentials] = Security(security),
) -> None:
    if not API_AUTH_TOKEN:
        return
    if not credentials or credentials.credentials != API_AUTH_TOKEN:
        raise HTTPException(status_code=401, detail="Unauthorized")


def _normalize_business_data(payload: dict[str, Any]) -> dict[str, Any]:
    monthly_revenue = payload.get("monthly_revenue") or payload.get("monthlyRevenue") or []
    expenses = payload.get("expenses") or []

    return {
        "name": payload.get("name", "Unknown Business"),
        "industry": payload.get("industry", "other"),
        "size": payload.get("size", "1-5"),
        "monthly_revenue": monthly_revenue,
        "expenses": expenses,
        "cash_on_hand": payload.get("cash_on_hand", payload.get("cashOnHand", 0)),
        "outstanding_debt": payload.get(
            "outstanding_debt", payload.get("outstandingDebt", 0)
        ),
    }


def _apply_scenario_overrides(
    universe: VariableUniverse, scenario_variables: List[dict[str, Any]]
) -> None:
    if not scenario_variables:
        return

    for variable in scenario_variables:
        variable_id = variable.get("variableId")
        if variable_id is None:
            variable_id = variable.get("variable_id")
        name = variable.get("name")
        modified_value = variable.get("modifiedValue")
        if modified_value is None:
            modified_value = variable.get("modified_value")
        unit = variable.get("unit", "")

        if variable_id is not None:
            normalized_id = str(variable_id)
            candidate_ids = {normalized_id}
            if normalized_id.startswith("node-"):
                candidate_ids.add(normalized_id[len("node-") :])
            else:
                candidate_ids.add(f"node-{normalized_id}")

            if any(candidate_id in universe.variables for candidate_id in candidate_ids):
                continue

        if not name or modified_value is None:
            continue

        normalized_name = str(name).strip().lower().replace(" ", "_")
        scenario_var = Variable(
            id=f"scenario_{normalized_name}",
            name=normalized_name,
            display_name=str(name),
            category=variable.get("category", "scenario"),
            value=float(modified_value),
            unit=str(unit),
            distribution=universe.fit_distribution(
                [float(modified_value), float(modified_value)], normalized_name
            ),
            confidence=0.7,
            source="scenario",
        )
        universe.add_variable(scenario_var)


def _build_sensitivity_bounds(universe: VariableUniverse) -> tuple[list[str], list[tuple[float, float]]]:
    names: list[str] = []
    bounds: list[tuple[float, float]] = []

    for variable in universe.variables.values():
        base = float(variable.value)
        span = max(abs(base) * 0.2, abs(base) * 0.01 + 0.01)
        names.append(variable.name)
        bounds.append((base - span, base + span))

    return names, bounds


def _build_backtest_history(business_data: dict[str, Any]) -> list[float]:
    revenue = business_data.get("monthly_revenue", [])
    return [float(v) for v in revenue if isinstance(v, (int, float))]


def _baseline_profit_model(values: list[float]) -> float:
    if len(values) == 0:
        return 0.0
    revenue = float(values[0])
    if len(values) == 1:
        return revenue
    expenses = float(sum(float(v) for v in values[1:]))
    return revenue - expenses


def _apply_garch_volatility_adjustments(universe: VariableUniverse) -> None:
    garch_engine = GARCHEngine()

    for variable in universe.variables.values():
        ts_data = variable.time_series_data
        if not ts_data or len(ts_data) < 10:
            continue

        series = [float(v) for v in ts_data if isinstance(v, (int, float))]
        if len(series) < 10:
            continue

        returns = []
        for prev, curr in zip(series[:-1], series[1:]):
            denom = abs(prev) if abs(prev) > 1e-9 else 1.0
            returns.append((curr - prev) / denom)
        if len(returns) < 9:
            continue

        try:
            fit_result = garch_engine.fit(returns)
            forecast = garch_engine.forecast(fit_result, n_periods=1)
            if not forecast:
                continue

            forecast_vol = float(forecast[0])
            if not np.isfinite(forecast_vol) or forecast_vol <= 0:
                continue

            level_scale = abs(float(variable.value))
            if level_scale <= 1e-6:
                level_scale = float(np.mean(np.abs(series))) if series else 1.0

            scaled_std = max(forecast_vol * level_scale, 1e-6)
            variable.distribution.params["std"] = scaled_std
            if variable.distribution.type.value == "lognormal":
                variable.distribution.params["sigma"] = max(forecast_vol, 1e-6)
        except Exception as exc:
            logger.warning(
                "GARCH adjustment failed for variable '%s': %s",
                variable.id,
                exc,
            )


def _build_dag_sensitivity_model(
    universe: VariableUniverse, bayesian_engine: BayesianEngine
):
    variables_in_order = list(universe.variables.values())
    id_to_index = {variable.id: idx for idx, variable in enumerate(variables_in_order)}

    usable_edges = [
        edge
        for edge in bayesian_engine.edges
        if edge.from_var in id_to_index
    ]
    if not usable_edges:
        return _baseline_profit_model

    outgoing_nodes = {edge.from_var for edge in usable_edges}
    terminal_nodes = {
        edge.to_var
        for edge in usable_edges
        if edge.to_var not in outgoing_nodes
    }
    if not terminal_nodes:
        terminal_nodes = {edge.to_var for edge in usable_edges}

    def model_func(values):
        if len(values) == 0:
            return 0.0

        contributions: dict[str, float] = {}
        for edge in usable_edges:
            from_idx = id_to_index.get(edge.from_var)
            if from_idx is None or from_idx >= len(values):
                continue
            contributions[edge.to_var] = contributions.get(edge.to_var, 0.0) + (
                float(values[from_idx]) * float(edge.strength)
            )

        if not contributions:
            return _baseline_profit_model(values)

        return float(sum(contributions.get(node, 0.0) for node in terminal_nodes))

    return model_func


def _extract_agent_suggestions(coordinator_output) -> tuple[list[dict], list[dict]]:
    suggested_variables: list[dict] = []
    suggested_edges: list[dict] = []

    for analysis in coordinator_output.individual_analyses:
        for finding in analysis.findings:
            if isinstance(finding.suggested_variables, list):
                suggested_variables.extend(
                    suggestion
                    for suggestion in finding.suggested_variables
                    if isinstance(suggestion, dict)
                )
            if isinstance(finding.suggested_edges, list):
                suggested_edges.extend(
                    edge for edge in finding.suggested_edges if isinstance(edge, dict)
                )

    return suggested_variables, suggested_edges


def _normalize_agent_edge_endpoints(
    universe: VariableUniverse, edge_suggestions: list[dict]
) -> list[dict]:
    if not edge_suggestions:
        return []

    alias_map: dict[str, str] = {}
    for variable in universe.variables.values():
        alias_map[variable.id] = variable.id
        alias_map[variable.id.lower()] = variable.id
        normalized_name = variable.name.strip().lower().replace(" ", "_")
        alias_map[normalized_name] = variable.id
        alias_map[f"agent_{normalized_name}"] = variable.id
        if variable.id.startswith("expense_"):
            alias_map[variable.id[len("expense_") :]] = variable.id

    normalized_edges: list[dict] = []
    for edge in edge_suggestions:
        from_raw = edge.get("from_var") or edge.get("from")
        to_raw = edge.get("to_var") or edge.get("to")
        if not from_raw or not to_raw:
            continue

        from_key = str(from_raw).strip().lower().replace(" ", "_")
        to_key = str(to_raw).strip().lower().replace(" ", "_")
        from_resolved = alias_map.get(from_key, str(from_raw))
        to_resolved = alias_map.get(to_key, str(to_raw))

        normalized_edges.append(
            {
                **edge,
                "from_var": from_resolved,
                "to_var": to_resolved,
            }
        )

    return normalized_edges


def _run_simulation_layers(
    universe: VariableUniverse,
    config: SimulationConfig,
    business_data: dict[str, Any],
    agent_edges: Optional[list[dict]] = None,
) -> dict[str, Any]:
    monte_engine = MonteCarloEngine(universe, iterations=config.iterations)
    monte_results = monte_engine.run(
        time_horizon_months=config.time_horizon_months,
        include_raw_samples=True,
    )
    monte_payload = [asdict(result) for result in monte_results]
    if not config.include_raw_samples:
        for result in monte_payload:
            result.pop("raw_samples", None)

    bayesian_engine = BayesianEngine()
    bayesian_engine.build_default_structure(universe.variables)
    for variable_id in universe.variables:
        bayesian_engine.add_node(variable_id)
    if agent_edges:
        bayesian_engine.merge_agent_edges(agent_edges)

    mc_samples: dict[str, list[float]] = {}
    for variable, result in zip(universe.variables.values(), monte_results):
        if result.raw_samples:
            mc_samples[variable.id] = result.raw_samples
            mc_samples[variable.name] = result.raw_samples

    bayesian_engine.fit_from_samples(mc_samples)
    bayesian_result = bayesian_engine.infer()
    bayesian_payload = asdict(bayesian_result)
    bayesian_payload["edges"] = [
        {
            "from": edge["from_var"],
            "to": edge["to_var"],
            "strength": edge["strength"],
            "description": edge["description"],
        }
        for edge in bayesian_payload.get("edges", [])
    ]

    sensitivity_engine = SensitivityEngine()
    variable_names, bounds = _build_sensitivity_bounds(universe)

    if variable_names:
        model_func = _build_dag_sensitivity_model(universe, bayesian_engine)
        sensitivity_result = sensitivity_engine.sobol_analysis(
            model_func=model_func,
            variable_names=variable_names,
            bounds=bounds,
            n_samples=min(max(config.iterations // 10, 128), 1024),
        )
    else:
        sensitivity_result = []

    backtest_engine = BacktestEngine()
    historical = _build_backtest_history(business_data)

    def prediction_func(train_data: list[float]):
        if not train_data:
            return {"predictions": [0.0], "intervals": [{"p5": 0.0, "p95": 0.0}]}

        mini_universe = VariableUniverse()
        mini_universe.from_business_data(
            {
                "monthly_revenue": [float(v) for v in train_data],
                "expenses": [],
                "cash_on_hand": 0.0,
                "outstanding_debt": 0.0,
            }
        )
        _apply_garch_volatility_adjustments(mini_universe)

        mini_engine = MonteCarloEngine(mini_universe, iterations=1000)
        mini_results = mini_engine.run(time_horizon_months=1, include_raw_samples=False)
        if not mini_results:
            baseline = float(sum(train_data) / len(train_data))
            return {
                "predictions": [baseline],
                "intervals": [{"p5": baseline, "p95": baseline}],
            }

        revenue_result = next(
            (result for result in mini_results if result.variable == "monthly_revenue"),
            mini_results[0],
        )
        if revenue_result.time_series_projection:
            projection = revenue_result.time_series_projection[0]
            median_projection = float(projection.p50)
            p5 = float(projection.p5)
            p95 = float(projection.p95)
        else:
            median_projection = float(revenue_result.median)
            p5 = float(revenue_result.percentiles.get("5", median_projection))
            p95 = float(revenue_result.percentiles.get("95", median_projection))

        return {
            "predictions": [median_projection],
            "intervals": [{"p5": p5, "p95": p95}],
        }

    backtest_result = backtest_engine.walk_forward_validation(
        historical_data=historical,
        prediction_func=prediction_func,
        window_size=min(6, max(len(historical) - 1, 1)),
        step_size=1,
    )
    backtest_result.metadata["predictor"] = "monte_carlo_1k"
    backtest_result.metadata["brier_score"] = float(backtest_result.brier_score)

    return {
        "monte_carlo": monte_payload,
        "bayesian_network": bayesian_payload,
        "sensitivity": [asdict(result) for result in sensitivity_result],
        "backtest": asdict(backtest_result),
    }


def _infer_variable_category(column_name: str) -> str:
    normalized = column_name.strip().lower()

    financial_terms = (
        "revenue",
        "cost",
        "price",
        "margin",
        "profit",
        "expense",
        "income",
        "debt",
        "cash",
    )
    operations_terms = (
        "count",
        "quantity",
        "units",
        "volume",
        "inventory",
        "capacity",
        "headcount",
        "staff",
    )

    if any(term in normalized for term in financial_terms):
        return "financial"
    if any(term in normalized for term in operations_terms):
        return "operations"
    return "general"


# --- Routes ---


@app.get("/health")
async def health():
    return {"status": "ok", "service": "optx-engine"}


@app.post("/simulate")
async def run_simulation(
    request: SimulateRequest,
    _: None = Depends(verify_token),
):
    """Run the 5-layer simulation pipeline."""
    try:
        simulation_id = str(uuid.uuid4())

        business_data = _normalize_business_data(request.business_data)

        universe = VariableUniverse()
        universe.from_business_data(business_data)
        _apply_garch_volatility_adjustments(universe)
        _apply_scenario_overrides(universe, request.scenario_variables)

        base_results = _run_simulation_layers(
            universe=universe,
            config=request.config,
            business_data=business_data,
        )

        response = {
            "simulation_id": simulation_id,
            "status": "complete",
            "monte_carlo": base_results["monte_carlo"],
            "bayesian_network": base_results["bayesian_network"],
            "sensitivity": base_results["sensitivity"],
            "backtest": base_results["backtest"],
        }

        if request.include_agent_enrichment:
            coordinator = AgentCoordinator()
            agent_output = await coordinator.run(
                request.business_data,
                {
                    "simulation_id": simulation_id,
                    "monte_carlo": base_results["monte_carlo"],
                    "bayesian_network": base_results["bayesian_network"],
                    "sensitivity": base_results["sensitivity"],
                    "backtest": base_results["backtest"],
                },
            )
            suggested_variables, suggested_edges = _extract_agent_suggestions(agent_output)

            enriched_universe = VariableUniverse()
            enriched_universe.from_business_data(business_data)
            _apply_garch_volatility_adjustments(enriched_universe)
            _apply_scenario_overrides(enriched_universe, request.scenario_variables)
            enriched_universe.merge_agent_suggestions(suggested_variables)

            normalized_edges = _normalize_agent_edge_endpoints(
                enriched_universe, suggested_edges
            )
            enriched_results = _run_simulation_layers(
                universe=enriched_universe,
                config=request.config,
                business_data=business_data,
                agent_edges=normalized_edges,
            )

            response["original_results"] = base_results
            response["enriched_results"] = enriched_results

        return response
    except HTTPException:
        raise
    except Exception as exc:
        logger.error("Simulation pipeline error: %s", exc, exc_info=True)
        raise HTTPException(
            status_code=500,
            detail="Simulation failed — check server logs",
        )


@app.post("/agents/analyze")
async def run_agent_analysis(
    request: AgentAnalyzeRequest,
    _: None = Depends(verify_token),
):
    """Run 6-agent parallel analysis with debate rounds."""
    try:
        coordinator = AgentCoordinator()
        output = await coordinator.run(request.business_data, request.simulation_data)
        return asdict(output)
    except HTTPException:
        raise
    except Exception as exc:
        logger.error("Agent analysis pipeline error: %s", exc, exc_info=True)
        raise HTTPException(
            status_code=500,
            detail="Agent analysis failed — check server logs",
        )


PARSE_SCENARIO_SYSTEM = """You are a business scenario parser for OptX. The user describes a business what-if scenario in natural language.

Extract structured scenario data and respond with ONLY valid JSON (no markdown, no explanation):
{
  "name": "Short scenario name (3-6 words)",
  "description": "One sentence description of the scenario",
  "variables": [
    {
      "name": "variable_name",
      "displayName": "Human Readable Name",
      "modifiedValue": 15,
      "changeType": "percentage_increase | percentage_decrease | absolute_set | absolute_increase | absolute_decrease",
      "unit": "percent | dollars | units | months | ratio",
      "category": "revenue | cost | margin | market | demand | pricing | brand | operations | staffing | capacity"
    }
  ]
}

Rules:
- Extract ALL variables mentioned or implied in the scenario
- "raise prices 15%" → changeType: "percentage_increase", modifiedValue: 15
- "cut costs by $5000" → changeType: "absolute_decrease", modifiedValue: 5000
- "double marketing spend" → changeType: "percentage_increase", modifiedValue: 100
- Infer reasonable defaults for implied variables
- Keep variable names lowercase_snake_case
- Always return valid JSON"""

CHAT_SYSTEM = """You are OptX AI, a business simulation assistant. You help users understand their simulation results, explore scenarios, and make data-driven decisions.

Be concise and specific. Reference numbers and data when possible. If discussing a scenario, explain the causal relationships between variables."""


@app.post("/chat")
async def chat(
    request: ChatRequest,
    _: None = Depends(verify_token),
):
    """AI chat with report context or scenario parsing."""

    if request.mode == "parse_scenario":
        system_prompt = PARSE_SCENARIO_SYSTEM
    else:
        system_prompt = CHAT_SYSTEM

    messages = []
    for msg in request.history:
        messages.append(
            {
                "role": msg.get("role", "user"),
                "content": msg.get("content", ""),
            }
        )
    messages.append({"role": "user", "content": request.message})

    try:
        response = openai_client.chat.completions.create(
            model="gpt-4o-mini" if request.mode == "parse_scenario" else "gpt-4o",
            max_tokens=1024,
            messages=[{"role": "system", "content": system_prompt}] + messages,
        )
        reply = response.choices[0].message.content or ""

        if request.mode == "parse_scenario":
            try:
                parsed = json.loads(reply)
                return {"reply": reply, "parsed": parsed}
            except json.JSONDecodeError:
                return {
                    "reply": reply,
                    "parsed": None,
                    "error": "Failed to parse JSON from response",
                }

        return {"reply": reply}

    except Exception as exc:
        logger.error("Chat AI error: %s", exc, exc_info=True)
        raise HTTPException(status_code=502, detail="AI service temporarily unavailable")


@app.post("/extract-variables")
async def extract_variables(
    data: ExtractVariablesRequest,
    _: None = Depends(verify_token),
):
    """Extract variables from uploaded data or NLP description."""

    variables = []

    rows = data.rows
    if isinstance(rows, list) and rows:
        sample = rows[0]
        if isinstance(sample, dict):
            for key, value in sample.items():
                if isinstance(value, (int, float)):
                    variables.append(
                        {
                            "name": key,
                            "displayName": key.replace("_", " ").title(),
                            "category": _infer_variable_category(key),
                            "unit": "units",
                            "confidence": 0.5,
                        }
                    )

    return {
        "variables": variables,
        "message": "Variable extraction complete",
    }
