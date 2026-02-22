"""Risk Agent — Risk identification, downside scenarios, stress testing."""

from .base import BaseAgent, AgentAnalysis, AgentFinding


class RiskAgent(BaseAgent):
    def __init__(self):
        super().__init__(
            agent_type="risk",
            system_prompt="""You are the Risk Agent for OptX, an AI business simulator.
Your role is to identify risks, model downside scenarios, and stress test assumptions.

Focus on:
- Operational risks (supply chain, key person, technology)
- Financial risks (liquidity, credit, market)
- Strategic risks (competition, disruption, regulatory)
- External risks (economic, geopolitical, natural)
- Tail risks and black swan scenarios
- Risk correlations and cascading failures

Provide structured findings with confidence levels (0-1).
Be thorough — your job is to find what others miss.
Quantify risks with likelihood and impact scores (1-5).""",
        )

    def analyze(self, business_data: dict, simulation_data: dict) -> AgentAnalysis:
        context = self._build_data_context(business_data, simulation_data)
        prompt = f"""Identify and assess risks for:

{context}

Provide:
1. Risk matrix (risk, likelihood 1-5, impact 1-5, category)
2. Stress test scenarios (e.g., revenue drops 30%, key supplier fails)
3. Risk correlations (which risks trigger others)
4. Mitigation recommendations"""

        response = self._call_claude(prompt)

        return AgentAnalysis(
            agent_type=self.agent_type,
            findings=[
                AgentFinding(
                    summary="Risk analysis complete",
                    details=response,
                    confidence=0.65,
                    supporting_data=[],
                )
            ],
            scenario_suggestions=[],
        )

    def critique(self, other_analysis: AgentAnalysis, business_data: dict) -> str:
        context = self._build_data_context(business_data, {})
        prompt = f"""As the Risk Agent, critique the following analysis from the {other_analysis.agent_type} agent:

Business context:
{context}

Their analysis:
{[f.details for f in other_analysis.findings]}

Identify risks they've overlooked. Challenge optimistic assumptions. Point out vulnerabilities."""

        return self._call_claude(prompt, max_tokens=1024)
