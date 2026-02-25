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

from anthropic import Anthropic
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
from agents.coordinator import AgentCoordinator

load_dotenv()

logger = logging.getLogger(__name__)

ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY")
if not ANTHROPIC_API_KEY:
    warnings.warn(
        "ANTHROPIC_API_KEY not set — AI features will return stub responses",
        RuntimeWarning,
        stacklevel=2,
    )
API_AUTH_TOKEN = os.getenv("OPTX_API_TOKEN")

anthropic_client = Anthropic(api_key=ANTHROPIC_API_KEY or "")
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
        _apply_scenario_overrides(universe, request.scenario_variables)

        monte_engine = MonteCarloEngine(universe, iterations=request.config.iterations)
        monte_results = monte_engine.run(
            time_horizon_months=request.config.time_horizon_months,
            include_raw_samples=request.config.include_raw_samples,
        )
        monte_payload = [asdict(result) for result in monte_results]
        if not request.config.include_raw_samples:
            for result in monte_payload:
                result.pop("raw_samples", None)

        bayesian_engine = BayesianEngine()
        bayesian_engine.build_default_structure(universe.variables)
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

            def model_func(values):
                if len(values) == 0:
                    return 0.0
                revenue = float(values[0])
                if len(values) == 1:
                    return revenue
                expenses = float(sum(float(v) for v in values[1:]))
                return revenue - expenses

            sensitivity_result = sensitivity_engine.sobol_analysis(
                model_func=model_func,
                variable_names=variable_names,
                bounds=bounds,
                n_samples=min(max(request.config.iterations // 10, 128), 1024),
            )
        else:
            sensitivity_result = []

        backtest_engine = BacktestEngine()
        historical = _build_backtest_history(business_data)

        # Baseline predictor: trailing mean of the observed training history.
        def prediction_func(train_data: list[float]):
            if not train_data:
                return [0.0]
            return [sum(train_data) / len(train_data)]

        backtest_result = backtest_engine.walk_forward_validation(
            historical_data=historical,
            prediction_func=prediction_func,
            window_size=min(6, max(len(historical) - 1, 1)),
            step_size=1,
        )
        backtest_result.metadata["predictor"] = "trailing_mean_baseline"

        return {
            "simulation_id": simulation_id,
            "status": "complete",
            "monte_carlo": monte_payload,
            "bayesian_network": bayesian_payload,
            "sensitivity": [asdict(result) for result in sensitivity_result],
            "backtest": asdict(backtest_result),
        }
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
        response = anthropic_client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=1024,
            system=system_prompt,
            messages=messages,
        )
        reply = response.content[0].text

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
