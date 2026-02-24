"""Sensitivity Analysis — Sobol Indices + Morris Method

Determines which variables have the greatest impact on outputs.
Output: "Your net income is 40% driven by raw material costs."
"""

from __future__ import annotations

from dataclasses import dataclass
import numpy as np
from typing import Callable


@dataclass
class SensitivityResult:
    variable: str
    sobol_index: float  # first-order
    total_sobol_index: float
    morris_screening: float
    rank: int


class SensitivityEngine:
    """Sensitivity analysis using Sobol indices and Morris method."""

    def sobol_analysis(
        self,
        model_func: Callable,
        variable_names: list[str],
        bounds: list[tuple[float, float]],
        n_samples: int = 1024,
    ) -> list[SensitivityResult]:
        """Compute Sobol sensitivity indices via Saltelli sampling.

        model_func: takes np.ndarray of shape (n_vars,) → float
        bounds: list of (min, max) for each variable
        """
        n_vars = len(variable_names)
        if n_vars > 50:
            n_samples = min(n_samples, 256)

        # Saltelli sampling: generate two independent matrices
        A = np.random.uniform(size=(n_samples, n_vars))
        B = np.random.uniform(size=(n_samples, n_vars))

        # Scale to bounds
        for i, (lo, hi) in enumerate(bounds):
            A[:, i] = A[:, i] * (hi - lo) + lo
            B[:, i] = B[:, i] * (hi - lo) + lo

        # Evaluate base matrices
        y_A = np.array([model_func(row) for row in A])
        y_B = np.array([model_func(row) for row in B])

        total_variance = np.var(np.concatenate([y_A, y_B]))
        if total_variance < 1e-12:
            return [
                SensitivityResult(
                    variable=name,
                    sobol_index=1.0 / n_vars,
                    total_sobol_index=1.0 / n_vars,
                    morris_screening=0.0,
                    rank=i + 1,
                )
                for i, name in enumerate(variable_names)
            ]

        results = []
        for i in range(n_vars):
            # AB_i: A with i-th column from B
            AB_i = A.copy()
            AB_i[:, i] = B[:, i]
            y_AB_i = np.array([model_func(row) for row in AB_i])

            # First-order Sobol index
            S_i = float(np.mean(y_B * (y_AB_i - y_A)) / total_variance)

            # Total Sobol index
            ST_i = float(
                0.5 * np.mean((y_A - y_AB_i) ** 2) / total_variance
            )

            results.append(
                SensitivityResult(
                    variable=variable_names[i],
                    sobol_index=max(0, S_i),
                    total_sobol_index=max(0, ST_i),
                    morris_screening=0.0,  # computed separately
                    rank=0,
                )
            )

        # Morris screening
        morris_results = self.morris_screening(
            model_func, variable_names, bounds, n_trajectories=10
        )
        for r, m in zip(results, morris_results):
            r.morris_screening = m

        # Rank by total Sobol index
        results.sort(key=lambda r: r.total_sobol_index, reverse=True)
        for i, r in enumerate(results):
            r.rank = i + 1

        return results

    def morris_screening(
        self,
        model_func: Callable,
        variable_names: list[str],
        bounds: list[tuple[float, float]],
        n_trajectories: int = 10,
        delta: float = 0.1,
    ) -> list[float]:
        """Morris method for screening — elementary effects."""
        n_vars = len(variable_names)
        elementary_effects = [[] for _ in range(n_vars)]

        for _ in range(n_trajectories):
            # Random starting point
            x = np.random.uniform(size=n_vars)
            x_scaled = np.array(
                [x[i] * (bounds[i][1] - bounds[i][0]) + bounds[i][0] for i in range(n_vars)]
            )
            y_base = model_func(x_scaled)

            # Perturb each variable
            for i in range(n_vars):
                x_pert = x_scaled.copy()
                step = delta * (bounds[i][1] - bounds[i][0])
                x_pert[i] += step
                x_pert[i] = float(np.clip(x_pert[i], bounds[i][0], bounds[i][1]))
                y_pert = model_func(x_pert)
                ee = (y_pert - y_base) / step if step != 0 else 0
                elementary_effects[i].append(ee)

        # Return mean absolute elementary effect (mu*)
        return [
            float(np.mean(np.abs(effects))) if effects else 0.0
            for effects in elementary_effects
        ]
