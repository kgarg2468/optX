"""Base Agent Class

All 6 specialized agents inherit from this base.
Handles Claude API integration, structured output, and common analysis patterns.
"""

from __future__ import annotations

from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import Optional
import os

import anthropic


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
        self.client = anthropic.Anthropic(
            api_key=os.environ.get("ANTHROPIC_API_KEY", "")
        )
        self.model = "claude-sonnet-4-20250514"

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

    def _call_claude(self, prompt: str, max_tokens: int = 4096) -> str:
        """Call Claude API with the agent's system prompt."""
        if not self.client.api_key:
            return f"[{self.agent_type} agent]: API key not configured. Stub response."

        message = self.client.messages.create(
            model=self.model,
            max_tokens=max_tokens,
            system=self.system_prompt,
            messages=[{"role": "user", "content": prompt}],
        )

        return message.content[0].text

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
