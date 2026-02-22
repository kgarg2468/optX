"""OptX — Python FastAPI Microservice

Mathematical simulation engine and AI agent system.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List
import uuid
import os
import json
from dotenv import load_dotenv
from anthropic import Anthropic

load_dotenv()

anthropic_client = Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY", ""))

app = FastAPI(
    title="OptX Engine",
    description="Mathematical simulation engine and AI agent system for OptX",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# --- Request/Response Models ---


class SimulationConfig(BaseModel):
    iterations: int = 10000
    time_horizon_months: int = 12
    confidence_level: float = 0.95


class SimulateRequest(BaseModel):
    business_id: str
    config: SimulationConfig
    scenario_id: Optional[str] = None


class AgentAnalyzeRequest(BaseModel):
    business_id: str
    simulation_id: str


class ChatRequest(BaseModel):
    message: str
    mode: Optional[str] = None  # "parse_scenario" or None for general chat
    report_id: Optional[str] = None
    scenario_id: Optional[str] = None
    simulation_id: Optional[str] = None
    history: List[dict] = []


# --- Routes ---


@app.get("/health")
async def health():
    return {"status": "ok", "service": "optx-engine"}


@app.post("/simulate")
async def run_simulation(request: SimulateRequest):
    """Run the full 5-layer simulation pipeline."""
    simulation_id = str(uuid.uuid4())

    # TODO: Implement full pipeline:
    # 1. Variable Universe Construction
    # 2. Monte Carlo Simulation
    # 3. Bayesian Network
    # 4. Sensitivity Analysis
    # 5. Backtesting

    return {
        "simulationId": simulation_id,
        "status": "complete",
        "message": "Simulation pipeline stub — implementation pending",
    }


@app.post("/agents/analyze")
async def run_agent_analysis(request: AgentAnalyzeRequest):
    """Run 6-agent parallel analysis with debate rounds."""

    # TODO: Implement:
    # 1. Run 6 agents in parallel
    # 2. Share results
    # 3. 2-3 debate rounds
    # 4. Convergence check
    # 5. Coordinator aggregation

    return {
        "status": "complete",
        "message": "Agent analysis stub — implementation pending",
    }


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
async def chat(request: ChatRequest):
    """AI chat with report context or scenario parsing."""

    if request.mode == "parse_scenario":
        system_prompt = PARSE_SCENARIO_SYSTEM
    else:
        system_prompt = CHAT_SYSTEM

    messages = []
    for msg in request.history:
        messages.append({
            "role": msg.get("role", "user"),
            "content": msg.get("content", ""),
        })
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
                return {"reply": reply, "parsed": None, "error": "Failed to parse JSON from response"}

        return {"reply": reply}

    except Exception as e:
        return {"reply": f"I encountered an error: {str(e)}"}


@app.post("/extract-variables")
async def extract_variables(data: dict):
    """Extract variables from uploaded data or NLP description."""

    # TODO: Parse uploaded data and build Variable Universe entries

    return {
        "variables": [],
        "message": "Variable extraction stub — implementation pending",
    }
