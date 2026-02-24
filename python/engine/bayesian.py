"""Bayesian Network Construction & Updates

DAG encoding causal relationships between business variables.
E.g., Interest Rate → Debt Cost → Cash Flow → Growth Capacity.
Learned from data + AI agent suggestions.
"""

from __future__ import annotations

from dataclasses import dataclass
import numpy as np
from typing import Optional


@dataclass
class BayesianEdge:
    from_var: str
    to_var: str
    strength: float
    description: str


@dataclass
class BayesianNetworkResult:
    nodes: list[str]
    edges: list[BayesianEdge]
    posteriors: dict[str, dict]


class BayesianEngine:
    """Bayesian network construction and inference."""

    def __init__(self):
        self.nodes: list[str] = []
        self.edges: list[BayesianEdge] = []

    def add_node(self, variable_name: str) -> None:
        if variable_name not in self.nodes:
            self.nodes.append(variable_name)

    def add_edge(
        self,
        from_var: str,
        to_var: str,
        strength: float = 0.5,
        description: str = "",
    ) -> None:
        self.add_node(from_var)
        self.add_node(to_var)
        self.edges.append(
            BayesianEdge(
                from_var=from_var,
                to_var=to_var,
                strength=strength,
                description=description,
            )
        )

    def _normalize_name(self, value: str) -> str:
        return str(value).strip().lower().replace(" ", "_")

    def _resolve_variable_match(
        self, variable_label: str, alias_map: dict[str, str]
    ) -> Optional[str]:
        normalized = self._normalize_name(variable_label)
        for candidate in (
            variable_label,
            normalized,
            f"expense_{normalized}",
        ):
            resolved = alias_map.get(candidate)
            if resolved:
                return resolved
        return None

    def build_default_structure(self, variables: dict[str, object]) -> None:
        """Build default causal structure from common business relationships."""
        # Define common causal relationships
        default_edges = [
            ("monthly_revenue", "gross_profit", 0.9, "Revenue drives gross profit"),
            ("COGS", "gross_profit", -0.8, "COGS reduces gross profit"),
            ("gross_profit", "net_income", 0.85, "Gross profit drives net income"),
            ("Payroll", "net_income", -0.7, "Payroll is major expense"),
            ("Rent", "net_income", -0.5, "Fixed cost reduces income"),
            ("Marketing", "monthly_revenue", 0.4, "Marketing drives revenue"),
            ("outstanding_debt", "cash_on_hand", -0.6, "Debt service reduces cash"),
            ("net_income", "cash_on_hand", 0.8, "Income builds cash"),
        ]

        alias_map: dict[str, str] = {}
        for variable_id, variable in variables.items():
            alias_map[variable_id] = variable_id
            alias_map[self._normalize_name(variable_id)] = variable_id

            variable_name = getattr(variable, "name", None)
            if variable_name:
                alias_map[str(variable_name)] = variable_id
                alias_map[self._normalize_name(str(variable_name))] = variable_id

        for from_var, to_var, strength, desc in default_edges:
            from_match = self._resolve_variable_match(from_var, alias_map)
            to_match = self._resolve_variable_match(to_var, alias_map)

            if from_match and to_match:
                self.add_edge(from_match, to_match, strength, desc)

    def infer(self) -> BayesianNetworkResult:
        """Run inference on the Bayesian network.

        TODO: Full pgmpy integration for proper Bayesian inference.
        Currently returns structure only.
        """
        posteriors = {}
        for node in self.nodes:
            # Placeholder posterior — will be computed via pgmpy
            posteriors[node] = {
                "stub": True,
                "type": "normal",
                "params": {"mean": 0.0, "std": 1.0},
            }

        return BayesianNetworkResult(
            nodes=self.nodes,
            edges=self.edges,
            posteriors=posteriors,
        )
