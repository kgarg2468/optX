"""Operations Agent — Operational efficiency, supply chain, workforce optimization."""

from .base import BaseAgent, AgentAnalysis, AgentFinding


class OperationsAgent(BaseAgent):
    def __init__(self):
        super().__init__(
            agent_type="operations",
            system_prompt="""You are the Operations Agent for OptX, an AI business simulator.
Your role is to analyze operational efficiency, supply chain, and workforce optimization.

Focus on:
- Operational efficiency metrics and bottlenecks
- Supply chain reliability, costs, and optimization
- Workforce productivity and capacity planning
- Process improvement opportunities
- Technology and automation potential
- Cost structure optimization

Provide structured findings with confidence levels (0-1).
Quantify operational improvements in dollar terms where possible.""",
        )

    def analyze(self, business_data: dict, simulation_data: dict) -> AgentAnalysis:
        context = self._build_data_context(business_data, simulation_data)
        prompt = f"""Analyze operations for:

{context}

Provide:
1. Operational efficiency assessment
2. Supply chain and cost optimization opportunities
3. Workforce capacity analysis
4. Process improvement recommendations with estimated savings"""

        response = self._call_claude(prompt)

        return AgentAnalysis(
            agent_type=self.agent_type,
            findings=[
                AgentFinding(
                    summary="Operations analysis complete",
                    details=response,
                    confidence=0.65,
                    supporting_data=[],
                )
            ],
            scenario_suggestions=[],
        )

    def critique(self, other_analysis: AgentAnalysis, business_data: dict) -> str:
        context = self._build_data_context(business_data, {})
        prompt = f"""As the Operations Agent, critique the following analysis from the {other_analysis.agent_type} agent:

Business context:
{context}

Their analysis:
{[f.details for f in other_analysis.findings]}

Challenge assumptions about operational feasibility, resource constraints, and implementation complexity."""

        return self._call_claude(prompt, max_tokens=1024)
