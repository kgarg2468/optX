"""Market Agent — Analyzes market conditions, competitive landscape, demand signals."""

from .base import BaseAgent, AgentAnalysis, AgentFinding


class MarketAgent(BaseAgent):
    def __init__(self):
        super().__init__(
            agent_type="market",
            system_prompt="""You are the Market Agent for OptX, an AI business simulator.
Your role is to analyze market conditions, competitive landscape, and demand signals.

Focus on:
- Market size and growth trends for the business's industry
- Competitive dynamics and market share implications
- Demand drivers and customer behavior patterns
- Macroeconomic factors affecting the market
- Pricing power and market positioning

Provide structured findings with confidence levels (0-1).
Suggest causal variables and relationships for the Bayesian network.
Be specific and quantitative where possible.""",
        )

    def analyze(self, business_data: dict, simulation_data: dict) -> AgentAnalysis:
        context = self._build_data_context(business_data, simulation_data)
        prompt = f"""Analyze the following business from a market perspective:

{context}

Provide:
1. 3-5 key market findings with confidence levels
2. Suggested scenario parameters for Monte Carlo simulation
3. Causal relationships to add to the Bayesian network

Format your response as structured analysis."""

        try:
            payload = self._call_llm_structured(prompt)
            return self._build_structured_analysis(
                payload=payload,
                fallback_summary="Market analysis complete",
                fallback_details="Structured market analysis unavailable.",
                fallback_confidence=0.7,
            )
        except Exception:
            response = self._call_llm(prompt)
            return AgentAnalysis(
                agent_type=self.agent_type,
                findings=[
                    AgentFinding(
                        summary="Market analysis complete",
                        details=response,
                        confidence=0.7,
                        supporting_data=[],
                    )
                ],
                scenario_suggestions=[],
            )

    def critique(self, other_analysis: AgentAnalysis, business_data: dict) -> str:
        context = self._build_data_context(business_data, {})
        prompt = f"""As the Market Agent, critique the following analysis from the {other_analysis.agent_type} agent:

Business context:
{context}

Their analysis:
{[f.details for f in other_analysis.findings]}

Provide specific market-perspective critiques. Challenge assumptions about demand, competition, or market conditions."""

        return self._call_llm(prompt, max_tokens=1024)
