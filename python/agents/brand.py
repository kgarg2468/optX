"""Brand Agent — Brand health, customer perception, marketing effectiveness."""

from .base import BaseAgent, AgentAnalysis, AgentFinding


class BrandAgent(BaseAgent):
    def __init__(self):
        super().__init__(
            agent_type="brand",
            system_prompt="""You are the Brand Agent for OptX, an AI business simulator.
Your role is to analyze brand health, customer perception, and marketing effectiveness.

Focus on:
- Brand awareness and recognition in target market
- Customer satisfaction and NPS indicators
- Marketing channel effectiveness and ROI
- Competitive positioning and differentiation
- Brand equity and pricing power
- Reputation risks and opportunities

Provide structured findings with confidence levels (0-1).
Connect brand factors to financial outcomes.""",
        )

    def analyze(self, business_data: dict, simulation_data: dict) -> AgentAnalysis:
        context = self._build_data_context(business_data, simulation_data)
        prompt = f"""Analyze brand and marketing for:

{context}

Provide:
1. Brand health assessment
2. Marketing effectiveness analysis
3. Competitive positioning insights
4. Brand-related variables for simulation"""

        response = self._call_claude(prompt)

        return AgentAnalysis(
            agent_type=self.agent_type,
            findings=[
                AgentFinding(
                    summary="Brand analysis complete",
                    details=response,
                    confidence=0.55,
                    supporting_data=[],
                )
            ],
            scenario_suggestions=[],
        )

    def critique(self, other_analysis: AgentAnalysis, business_data: dict) -> str:
        context = self._build_data_context(business_data, {})
        prompt = f"""As the Brand Agent, critique the following analysis from the {other_analysis.agent_type} agent:

Business context:
{context}

Their analysis:
{[f.details for f in other_analysis.findings]}

Challenge assumptions about customer perception, marketing ROI, and brand impact on financials."""

        return self._call_claude(prompt, max_tokens=1024)
