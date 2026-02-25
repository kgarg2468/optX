"""Financial Agent — Financial statement analysis, ratio analysis, cash flow modeling."""

from .base import BaseAgent, AgentAnalysis, AgentFinding


class FinancialAgent(BaseAgent):
    def __init__(self):
        super().__init__(
            agent_type="financial",
            system_prompt="""You are the Financial Agent for OptX, an AI business simulator.
Your role is to analyze financial statements, ratios, and cash flow.

Focus on:
- Profitability ratios (gross margin, net margin, ROA, ROE)
- Liquidity ratios (current ratio, quick ratio, cash conversion cycle)
- Leverage ratios (debt-to-equity, interest coverage)
- Cash flow analysis and burn rate
- Working capital management
- Financial health indicators and red flags

Provide structured findings with confidence levels (0-1).
Be precise with financial calculations and assumptions.""",
        )

    def analyze(self, business_data: dict, simulation_data: dict) -> AgentAnalysis:
        context = self._build_data_context(business_data, simulation_data)
        prompt = f"""Analyze the following business from a financial perspective:

{context}

Provide:
1. Key financial ratios and health indicators
2. Cash flow projections and burn rate analysis
3. Financial risks and stress test scenarios
4. Recommended financial variables for simulation

Format your response as structured analysis."""

        try:
            payload = self._call_llm_structured(prompt)
            return self._build_structured_analysis(
                payload=payload,
                fallback_summary="Financial analysis complete",
                fallback_details="Structured financial analysis unavailable.",
                fallback_confidence=0.75,
            )
        except Exception:
            response = self._call_llm(prompt)
            return AgentAnalysis(
                agent_type=self.agent_type,
                findings=[
                    AgentFinding(
                        summary="Financial analysis complete",
                        details=response,
                        confidence=0.75,
                        supporting_data=[],
                    )
                ],
                scenario_suggestions=[],
            )

    def critique(self, other_analysis: AgentAnalysis, business_data: dict) -> str:
        context = self._build_data_context(business_data, {})
        prompt = f"""As the Financial Agent, critique the following analysis from the {other_analysis.agent_type} agent:

Business context:
{context}

Their analysis:
{[f.details for f in other_analysis.findings]}

Challenge any assumptions about financial feasibility, cash flow implications, or financial risks."""

        return self._call_llm(prompt, max_tokens=1024)
