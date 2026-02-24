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

    def build_default_structure(self, variable_names: list[str]) -> None:
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

        existing_vars = set(variable_names)
        for from_var, to_var, strength, desc in default_edges:
            # Only add edges where both variables exist
            from_match = from_var if from_var in existing_vars else None
            to_match = to_var if to_var in existing_vars else None

            # Check with expense_ prefix
            if not from_match:
                prefixed = f"expense_{from_var.lower().replace(' ', '_')}"
                if prefixed in existing_vars:
                    from_match = prefixed
            if not to_match:
                prefixed = f"expense_{to_var.lower().replace(' ', '_')}"
                if prefixed in existing_vars:
                    to_match = prefixed

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
                "type": "normal",
                "params": {"mean": 0.0, "std": 1.0},
            }

        return BayesianNetworkResult(
            nodes=self.nodes,
            edges=self.edges,
            posteriors=posteriors,
        )
