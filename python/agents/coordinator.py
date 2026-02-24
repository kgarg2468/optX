"""Coordinator — Orchestrates parallel agent execution and debate rounds.

1. All 6 agents analyze independently (parallel)
2. Results shared across all agents
3. 2-3 rounds of cross-critique
4. Convergence check
5. Coordinator produces unified findings
"""

from __future__ import annotations

import asyncio
from dataclasses import dataclass, field
from .base import BaseAgent, AgentAnalysis, AgentFinding
from .market import MarketAgent
from .financial import FinancialAgent
from .growth import GrowthAgent
from .risk import RiskAgent
from .brand import BrandAgent
from .operations import OperationsAgent


@dataclass
class DebateCritique:
    from_agent: str
    to_agent: str
    critique: str
    response: str


@dataclass
class DebateRound:
    round: int
    critiques: list[DebateCritique]


@dataclass
class CoordinatorOutput:
    individual_analyses: list[AgentAnalysis]
    debate_rounds: list[DebateRound]
    convergence_score: float
    unified_findings: list[AgentFinding]
    recommendations: list[str]


class AgentCoordinator:
    """Orchestrates the 6-agent system with parallel execution and debate."""

    def __init__(self):
        self.agents: dict[str, BaseAgent] = {
            "market": MarketAgent(),
            "financial": FinancialAgent(),
            "growth": GrowthAgent(),
            "risk": RiskAgent(),
            "brand": BrandAgent(),
            "operations": OperationsAgent(),
        }
        self.max_debate_rounds = 3
        self.convergence_threshold = 0.8
        self._api_semaphore = asyncio.Semaphore(4)

    async def _run_with_semaphore(self, fn, *args):
        async with self._api_semaphore:
            loop = asyncio.get_running_loop()
            return await loop.run_in_executor(None, fn, *args)

    async def run(
        self, business_data: dict, simulation_data: dict
    ) -> CoordinatorOutput:
        """Run the full agent analysis pipeline."""

        # Phase 1: Parallel independent analysis
        analyses = await self._run_parallel_analysis(
            business_data, simulation_data
        )

        # Phase 2: Debate rounds
        debate_rounds = await self._run_debate_rounds(analyses, business_data)

        # Phase 3: Convergence check
        convergence = self._check_convergence(debate_rounds)

        # Phase 4: Unified findings
        unified = self._aggregate_findings(analyses, debate_rounds)

        return CoordinatorOutput(
            individual_analyses=analyses,
            debate_rounds=debate_rounds,
            convergence_score=convergence,
            unified_findings=unified["findings"],
            recommendations=unified["recommendations"],
        )

    async def _run_parallel_analysis(
        self, business_data: dict, simulation_data: dict
    ) -> list[AgentAnalysis]:
        """Run all 6 agents in parallel."""
        tasks = [
            self._run_with_semaphore(
                agent.analyze, business_data, simulation_data
            )
            for agent in self.agents.values()
        ]

        results = await asyncio.gather(*tasks, return_exceptions=True)

        analyses = []
        for result in results:
            if isinstance(result, AgentAnalysis):
                analyses.append(result)
            elif isinstance(result, Exception):
                # Log error but don't fail the whole pipeline
                analyses.append(
                    AgentAnalysis(
                        agent_type="error",
                        findings=[
                            AgentFinding(
                                summary=f"Agent error: {str(result)}",
                                details=str(result),
                                confidence=0.0,
                            )
                        ],
                        scenario_suggestions=[],
                    )
                )

        return analyses

    async def _run_debate_rounds(
        self,
        analyses: list[AgentAnalysis],
        business_data: dict,
    ) -> list[DebateRound]:
        """Run 2-3 rounds of cross-critique between agents."""
        debate_rounds = []

        # Define critique pairs (each agent critiques specific others)
        critique_pairs = [
            ("risk", "growth"),  # Risk challenges Growth
            ("financial", "market"),  # Financial challenges Market
            ("operations", "growth"),  # Operations challenges Growth
            ("risk", "financial"),  # Risk challenges Financial
            ("market", "brand"),  # Market challenges Brand
            ("growth", "operations"),  # Growth challenges Operations
        ]

        analysis_map = {a.agent_type: a for a in analyses}

        for round_num in range(1, self.max_debate_rounds + 1):
            critiques = []
            critique_futures = []
            critique_metadata: list[tuple[str, str]] = []

            for from_type, to_type in critique_pairs:
                from_agent = self.agents.get(from_type)
                to_analysis = analysis_map.get(to_type)

                if from_agent and to_analysis:
                    critique_futures.append(
                        self._run_with_semaphore(
                            from_agent.critique,
                            to_analysis,
                            business_data,
                        )
                    )
                    critique_metadata.append((from_type, to_type))

            critique_results = await asyncio.gather(
                *critique_futures, return_exceptions=True
            )
            for (from_type, to_type), result in zip(
                critique_metadata, critique_results
            ):
                critique_text = (
                    str(result) if isinstance(result, Exception) else result
                )
                critiques.append(
                    DebateCritique(
                        from_agent=from_type,
                        to_agent=to_type,
                        critique=critique_text,
                        response="",  # Response incorporated in next round
                    )
                )

            debate_rounds.append(
                DebateRound(round=round_num, critiques=critiques)
            )

            # Check for early convergence
            if self._check_convergence(debate_rounds) >= self.convergence_threshold:
                break

        return debate_rounds

    def _check_convergence(self, debate_rounds: list[DebateRound]) -> float:
        """Check if agents have converged on their positions.

        Simple heuristic: fewer new critiques in later rounds = convergence.
        """
        if len(debate_rounds) < 2:
            return 0.0
        if all(c.critique == "" for dr in debate_rounds for c in dr.critiques):
            return 0.0

        # Compare critique lengths between rounds
        # Shorter critiques in later rounds suggest convergence
        round_lengths = []
        for dr in debate_rounds:
            total = sum(len(c.critique) for c in dr.critiques)
            round_lengths.append(total)

        if round_lengths[0] == 0:
            return 1.0

        # Convergence = ratio of decrease
        decrease_ratio = 1.0 - (round_lengths[-1] / round_lengths[0])
        return max(0.0, min(1.0, decrease_ratio))

    def _aggregate_findings(
        self,
        analyses: list[AgentAnalysis],
        debate_rounds: list[DebateRound],
    ) -> dict:
        """Aggregate individual findings into unified output."""
        all_findings = []
        all_suggestions = []

        for analysis in analyses:
            all_findings.extend(analysis.findings)
            all_suggestions.extend(analysis.scenario_suggestions)

        # Sort by confidence
        all_findings.sort(key=lambda f: f.confidence, reverse=True)

        # Deduplicate suggestions
        unique_suggestions = list(dict.fromkeys(all_suggestions))

        return {
            "findings": all_findings,
            "recommendations": unique_suggestions[:10],
        }
