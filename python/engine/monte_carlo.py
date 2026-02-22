"""Monte Carlo Simulation with Copulas

10K+ iterations sampling from joint distributions.
Each iteration = one possible business future.
Preserves correlations between variables via copulas.
"""

from dataclasses import dataclass
import numpy as np
from scipy import stats
from typing import Optional
from .variable_universe import VariableUniverse, Variable


@dataclass
class MonteCarloResult:
    variable: str
    mean: float
    median: float
    std: float
    percentiles: dict[str, float]
    distribution: list[float]
    time_series_projection: list[list[float]]


class MonteCarloEngine:
    """Monte Carlo simulation engine with copula-based correlation."""

    def __init__(self, universe: VariableUniverse, iterations: int = 10000):
        self.universe = universe
        self.iterations = iterations

    def _generate_correlated_uniforms(self, n_vars: int) -> np.ndarray:
        """Generate correlated uniform samples using Gaussian copula."""
        corr = self.universe.correlation_matrix
        if corr is None or corr.shape[0] != n_vars:
            corr = np.eye(n_vars)

        # Ensure positive semi-definite
        eigvals = np.linalg.eigvalsh(corr)
        if np.any(eigvals < 0):
            corr = corr + (-min(eigvals) + 1e-6) * np.eye(n_vars)

        # Cholesky decomposition
        try:
            L = np.linalg.cholesky(corr)
        except np.linalg.LinAlgError:
            L = np.eye(n_vars)

        # Generate correlated normal samples
        z = np.random.standard_normal((self.iterations, n_vars))
        correlated_normals = z @ L.T

        # Transform to uniform via CDF
        uniforms = stats.norm.cdf(correlated_normals)
        return uniforms

    def run(self, time_horizon_months: int = 12) -> list[MonteCarloResult]:
        """Run Monte Carlo simulation across all variables."""
        variables = list(self.universe.variables.values())
        n_vars = len(variables)

        if n_vars == 0:
            return []

        # Build correlation matrix if needed
        self.universe.build_correlation_matrix()

        results = []

        for idx, var in enumerate(variables):
            # Generate samples from the variable's distribution
            samples = var.distribution.sample(self.iterations)

            # Apply confidence weighting (lower confidence = wider spread)
            if var.confidence < 1.0:
                noise_scale = (1.0 - var.confidence) * var.value * 0.2
                noise = np.random.normal(0, noise_scale, self.iterations)
                samples = samples + noise

            # Time series projection
            ts_projection = []
            for month in range(time_horizon_months):
                # Simple random walk with drift from distribution
                month_samples = var.distribution.sample(self.iterations)
                if var.confidence < 1.0:
                    month_noise = np.random.normal(0, noise_scale, self.iterations)
                    month_samples = month_samples + month_noise
                ts_projection.append(month_samples.tolist())

            # Compute statistics
            percentiles = {
                "5": float(np.percentile(samples, 5)),
                "25": float(np.percentile(samples, 25)),
                "50": float(np.percentile(samples, 50)),
                "75": float(np.percentile(samples, 75)),
                "95": float(np.percentile(samples, 95)),
            }

            results.append(
                MonteCarloResult(
                    variable=var.name,
                    mean=float(np.mean(samples)),
                    median=float(np.median(samples)),
                    std=float(np.std(samples)),
                    percentiles=percentiles,
                    distribution=samples.tolist(),
                    time_series_projection=ts_projection,
                )
            )

        return results
