"""Base Agent Class

All 6 specialized agents inherit from this base.
Handles LLM API integration, structured output, and common analysis patterns.
"""

from __future__ import annotations

from abc import ABC, abstractmethod
from dataclasses import dataclass, field
import json
import logging
from typing import Optional
import os

from openai import OpenAI

logger = logging.getLogger(__name__)


class AIServiceError(Exception):
    """Raised when an external AI service call fails."""


@dataclass
class AgentFinding:
    summary: str
    details: str
    confidence: float
    supporting_data: list[str] = field(default_factory=list)
    suggested_variables: list[dict] = field(default_factory=list)
    suggested_edges: list[dict] = field(default_factory=list)


@dataclass
class AgentAnalysis:
    agent_type: str
    findings: list[AgentFinding]
    scenario_suggestions: list[str]


class BaseAgent(ABC):
    """Base class for all OptX AI agents."""

    def __init__(self, agent_type: str, system_prompt: str):
        self.agent_type = agent_type
        self.system_prompt = system_prompt
        self.api_key = os.getenv("OPENAI_API_KEY", "")
        self.client = OpenAI(api_key=self.api_key)
        self.model = "gpt-4o"

    @abstractmethod
    def analyze(self, business_data: dict, simulation_data: dict) -> AgentAnalysis:
        """Run analysis on business and simulation data."""
        ...

    @abstractmethod
    def critique(
        self, other_analysis: AgentAnalysis, business_data: dict
    ) -> str:
        """Critique another agent's analysis during debate rounds."""
        ...

    def _call_llm(self, prompt: str, max_tokens: int = 4096) -> str:
        """Call LLM API with the agent's system prompt."""
        if not self.api_key:
            logger.warning(
                "OPENAI_API_KEY not configured for %s agent; returning stub response.",
                self.agent_type,
            )
            return f"[{self.agent_type} agent]: API key not configured. Stub response."

        try:
            response = self.client.chat.completions.create(
                model=self.model,
                max_tokens=max_tokens,
                messages=[
                    {"role": "system", "content": self.system_prompt},
                    {"role": "user", "content": prompt},
                ],
            )
            return response.choices[0].message.content or ""
        except Exception as exc:
            logger.error(
                "AI call failed for %s agent: %s",
                self.agent_type,
                exc,
                exc_info=True,
            )
            raise AIServiceError("AI service temporarily unavailable") from exc

    def _call_llm_structured(self, prompt: str, max_tokens: int = 4096) -> dict:
        """Call LLM API in JSON mode and parse the response into a dict."""
        schema_prompt = f"""{prompt}

Return ONLY valid JSON with this exact top-level structure:
{{
  "findings": [
    {{
      "summary": "short summary",
      "details": "detailed explanation",
      "confidence": 0.0,
      "supporting_data": ["optional evidence point"],
      "suggested_variables": [
        {{
          "name": "lower_snake_case_name",
          "display_name": "Human readable label",
          "category": "financial|market|operations|risk|brand|growth|other",
          "suggested_value": 0,
          "unit": "USD|percent|units|months|ratio|other",
          "rationale": "why this variable should be added"
        }}
      ],
      "suggested_edges": [
        {{
          "from_var": "source_variable",
          "to_var": "target_variable",
          "strength": 0.5,
          "description": "causal reason"
        }}
      ]
    }}
  ],
  "scenario_suggestions": ["what-if scenario text"]
}}

Rules:
- confidence must be between 0 and 1
- findings must be an array (can be empty)
- suggested_variables and suggested_edges must be arrays for each finding
- scenario_suggestions must be an array of strings
"""

        if not self.api_key:
            logger.warning(
                "OPENAI_API_KEY not configured for %s agent; returning structured stub response.",
                self.agent_type,
            )
            return {
                "findings": [
                    {
                        "summary": f"{self.agent_type.title()} analysis unavailable",
                        "details": "OPENAI_API_KEY not configured.",
                        "confidence": 0.0,
                        "supporting_data": [],
                        "suggested_variables": [],
                        "suggested_edges": [],
                    }
                ],
                "scenario_suggestions": [],
            }

        try:
            response = self.client.chat.completions.create(
                model=self.model,
                max_tokens=max_tokens,
                response_format={"type": "json_object"},
                messages=[
                    {"role": "system", "content": self.system_prompt},
                    {"role": "user", "content": schema_prompt},
                ],
            )
            content = response.choices[0].message.content or "{}"
            parsed = json.loads(content)
            if isinstance(parsed, dict):
                return parsed
            raise AIServiceError("Structured output must be a JSON object")
        except Exception as exc:
            logger.error(
                "Structured AI call failed for %s agent: %s",
                self.agent_type,
                exc,
                exc_info=True,
            )
            raise AIServiceError("AI service temporarily unavailable") from exc

    def _build_structured_analysis(
        self,
        payload: dict,
        fallback_summary: str,
        fallback_details: str,
        fallback_confidence: float,
    ) -> AgentAnalysis:
        findings_payload = payload.get("findings", [])
        scenario_payload = payload.get("scenario_suggestions", [])

        findings: list[AgentFinding] = []
        if isinstance(findings_payload, list):
            for item in findings_payload:
                if not isinstance(item, dict):
                    continue
                summary = str(item.get("summary", fallback_summary)).strip() or fallback_summary
                details = str(item.get("details", fallback_details)).strip() or fallback_details

                try:
                    confidence = float(item.get("confidence", fallback_confidence))
                except (TypeError, ValueError):
                    confidence = fallback_confidence
                confidence = max(0.0, min(1.0, confidence))

                raw_supporting = item.get("supporting_data", [])
                supporting_data = (
                    [str(v) for v in raw_supporting if isinstance(v, (str, int, float))]
                    if isinstance(raw_supporting, list)
                    else []
                )

                suggested_variables = item.get("suggested_variables", [])
                if not isinstance(suggested_variables, list):
                    suggested_variables = []

                suggested_edges = item.get("suggested_edges", [])
                if not isinstance(suggested_edges, list):
                    suggested_edges = []

                findings.append(
                    AgentFinding(
                        summary=summary,
                        details=details,
                        confidence=confidence,
                        supporting_data=supporting_data,
                        suggested_variables=suggested_variables,
                        suggested_edges=suggested_edges,
                    )
                )

        if not findings:
            findings = [
                AgentFinding(
                    summary=fallback_summary,
                    details=fallback_details,
                    confidence=fallback_confidence,
                    supporting_data=[],
                    suggested_variables=[],
                    suggested_edges=[],
                )
            ]

        scenario_suggestions = (
            [str(v) for v in scenario_payload if isinstance(v, (str, int, float))]
            if isinstance(scenario_payload, list)
            else []
        )

        return AgentAnalysis(
            agent_type=self.agent_type,
            findings=findings,
            scenario_suggestions=scenario_suggestions,
        )

    def _build_data_context(self, business_data: dict, simulation_data: dict) -> str:
        """Build a context string from business and simulation data."""
        parts = [
            f"Business: {business_data.get('name', 'Unknown')}",
            f"Industry: {business_data.get('industry', 'Unknown')}",
            f"Size: {business_data.get('size', 'Unknown')}",
        ]

        revenue = business_data.get("monthly_revenue", [])
        if revenue:
            parts.append(f"Monthly Revenue: {revenue}")
            parts.append(f"Average Monthly Revenue: ${sum(revenue)/len(revenue):,.0f}")

        expenses = business_data.get("expenses", [])
        if expenses:
            total_exp = sum(e.get("amount", 0) for e in expenses)
            parts.append(f"Total Monthly Expenses: ${total_exp:,.0f}")
            for e in expenses:
                parts.append(f"  - {e.get('name', '?')}: ${e.get('amount', 0):,.0f}")

        cash = business_data.get("cash_on_hand", 0)
        if cash:
            parts.append(f"Cash on Hand: ${cash:,.0f}")

        debt = business_data.get("outstanding_debt", 0)
        if debt:
            parts.append(f"Outstanding Debt: ${debt:,.0f}")

        return "\n".join(parts)
