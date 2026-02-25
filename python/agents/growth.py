"""Growth Agent — Growth opportunities, expansion scenarios, customer acquisition."""

from .base import BaseAgent, AgentAnalysis, AgentFinding


class GrowthAgent(BaseAgent):
    def __init__(self):
        super().__init__(
            agent_type="growth",
            system_prompt="""You are the Growth Agent for OptX, an AI business simulator.
Your role is to identify growth opportunities and model expansion scenarios.

Focus on:
- Revenue growth drivers and levers
- Customer acquisition cost and lifetime value
- Market expansion opportunities
- Product/service line extensions
- Scaling challenges and resource requirements
- Growth rate sustainability

Provide structured findings with confidence levels (0-1).
Be realistic about growth constraints and diminishing returns.""",
        )

    def analyze(self, business_data: dict, simulation_data: dict) -> AgentAnalysis:
        context = self._build_data_context(business_data, simulation_data)
        prompt = f"""Analyze growth opportunities for:

{context}

Provide:
1. Top growth opportunities ranked by potential impact
2. Customer acquisition and retention analysis
3. Expansion scenario parameters
4. Growth sustainability assessment"""

        try:
            payload = self._call_llm_structured(prompt)
            return self._build_structured_analysis(
                payload=payload,
                fallback_summary="Growth analysis complete",
                fallback_details="Structured growth analysis unavailable.",
                fallback_confidence=0.6,
            )
        except Exception:
            response = self._call_llm(prompt)
            return AgentAnalysis(
                agent_type=self.agent_type,
                findings=[
                    AgentFinding(
                        summary="Growth analysis complete",
                        details=response,
                        confidence=0.6,
                        supporting_data=[],
                    )
                ],
                scenario_suggestions=[],
            )

    def critique(self, other_analysis: AgentAnalysis, business_data: dict) -> str:
        context = self._build_data_context(business_data, {})
        prompt = f"""As the Growth Agent, critique the following analysis from the {other_analysis.agent_type} agent:

Business context:
{context}

Their analysis:
{[f.details for f in other_analysis.findings]}

Challenge assumptions about growth potential, scalability, and market opportunity."""

        return self._call_llm(prompt, max_tokens=1024)
