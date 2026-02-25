"""Bayesian Network Construction & Updates

DAG encoding causal relationships between business variables.
E.g., Interest Rate → Debt Cost → Cash Flow → Growth Capacity.
Learned from data + AI agent suggestions.
"""

from __future__ import annotations

from dataclasses import dataclass
import logging
from typing import Optional

import numpy as np

logger = logging.getLogger(__name__)


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
        self._pgmpy_model = None
        self._inference_engine = None

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

    def _build_stub_posteriors(self) -> dict[str, dict]:
        posteriors: dict[str, dict] = {}
        for node in self.nodes:
            posteriors[node] = {
                "stub": True,
                "type": "normal",
                "params": {"mean": 0.0, "std": 1.0},
            }
        return posteriors

    def _resolve_samples_for_node(
        self, node: str, samples: dict[str, list[float]]
    ) -> Optional[list[float]]:
        normalized_node = self._normalize_name(node)

        direct = samples.get(node)
        if direct is not None:
            return direct

        for sample_key, sample_values in samples.items():
            normalized_key = self._normalize_name(sample_key)
            if normalized_key == normalized_node:
                return sample_values
            if normalized_key == f"expense_{normalized_node}":
                return sample_values
            if normalized_node.startswith("expense_") and normalized_node[8:] == normalized_key:
                return sample_values
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

    def fit_from_samples(self, samples: dict[str, list[float]]) -> None:
        """Fit CPDs from continuous samples using pgmpy (with discretization)."""
        self._pgmpy_model = None
        self._inference_engine = None

        if not self.nodes or not samples:
            return

        try:
            import pandas as pd
            from pgmpy.estimators import MaximumLikelihoodEstimator
            from pgmpy.inference import VariableElimination
            try:
                from pgmpy.models import DiscreteBayesianNetwork as _PGMPYNetwork
            except Exception:
                from pgmpy.models import BayesianNetwork as _PGMPYNetwork
        except Exception as exc:
            logger.warning("pgmpy unavailable, falling back to stub inference: %s", exc)
            return

        try:
            model = _PGMPYNetwork([(e.from_var, e.to_var) for e in self.edges])
            model.add_nodes_from(self.nodes)

            discretized: dict[str, np.ndarray] = {}
            for node in self.nodes:
                raw = self._resolve_samples_for_node(node, samples)
                if raw is None:
                    continue

                arr = np.asarray(raw, dtype=float)
                if arr.size < 5:
                    continue

                finite = arr[np.isfinite(arr)]
                if finite.size == 0:
                    continue
                fill_value = float(np.mean(finite))
                arr = np.where(np.isfinite(arr), arr, fill_value)

                n_bins = min(10, max(5, int(np.sqrt(arr.size))))
                edges = np.histogram_bin_edges(arr, bins=n_bins)
                edges = np.unique(edges)
                if edges.size < 3:
                    continue

                # Convert continuous samples to ordinal bins for discrete BN fitting.
                bins = np.digitize(arr, edges[1:-1], right=False).astype(int)
                discretized[node] = bins

            if not discretized:
                return

            min_len = min(len(col) for col in discretized.values())
            df = pd.DataFrame({k: v[:min_len] for k, v in discretized.items()})
            model.fit(df, estimator=MaximumLikelihoodEstimator)

            self._pgmpy_model = model
            self._inference_engine = VariableElimination(model)
        except Exception as exc:
            logger.warning("pgmpy fitting failed, using stub inference: %s", exc)
            self._pgmpy_model = None
            self._inference_engine = None

    def merge_agent_edges(self, edges: list[dict]) -> int:
        """Validate and merge AI agent-suggested edges into the DAG."""
        if not edges:
            return 0

        existing_pairs = {(edge.from_var, edge.to_var) for edge in self.edges}
        node_map = {self._normalize_name(node): node for node in self.nodes}
        for node in self.nodes:
            node_map[node] = node

        added = 0
        for edge in edges:
            from_raw = edge.get("from_var") or edge.get("from")
            to_raw = edge.get("to_var") or edge.get("to")
            if not from_raw or not to_raw:
                continue

            from_node = node_map.get(str(from_raw)) or node_map.get(
                self._normalize_name(str(from_raw))
            )
            to_node = node_map.get(str(to_raw)) or node_map.get(
                self._normalize_name(str(to_raw))
            )
            if not from_node or not to_node:
                continue

            pair = (from_node, to_node)
            if pair in existing_pairs:
                continue

            try:
                strength = float(edge.get("strength", 0.5))
            except (TypeError, ValueError):
                strength = 0.5

            description = str(edge.get("description", "Agent suggested relationship"))
            self.add_edge(from_node, to_node, strength, description)
            existing_pairs.add(pair)
            added += 1

        return added

    def infer(self) -> BayesianNetworkResult:
        """Run inference on the Bayesian network."""
        if self._inference_engine is None:
            return BayesianNetworkResult(
                nodes=self.nodes,
                edges=self.edges,
                posteriors=self._build_stub_posteriors(),
            )

        posteriors: dict[str, dict] = {}
        for node in self.nodes:
            try:
                query_result = self._inference_engine.query(
                    variables=[node],
                    show_progress=False,
                )
                probabilities = np.asarray(query_result.values, dtype=float).flatten()

                if hasattr(query_result, "state_names"):
                    state_names = query_result.state_names.get(
                        node, list(range(len(probabilities)))
                    )
                else:
                    state_names = list(range(len(probabilities)))

                posteriors[node] = {
                    "stub": False,
                    "type": "categorical",
                    "params": {
                        "state_probabilities": {
                            str(state): float(prob)
                            for state, prob in zip(state_names, probabilities)
                        }
                    },
                }
            except Exception:
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
