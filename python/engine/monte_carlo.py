"""Monte Carlo Simulation with Copulas

10K+ iterations sampling from joint distributions.
Each iteration = one possible business future.
Preserves correlations between variables via copulas.
"""

from __future__ import annotations

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

    def _use_independent_sampling(self, n_vars: int) -> bool:
        corr = self.universe.correlation_matrix
        if corr is None or corr.shape != (n_vars, n_vars):
            return True
        return np.allclose(corr, np.eye(n_vars), atol=1e-8, rtol=1e-8)

    def _sample_from_uniforms(self, var: Variable, uniforms: np.ndarray) -> np.ndarray:
        """Map correlated uniforms to variable samples via inverse CDF."""
        u = np.clip(uniforms, 1e-10, 1 - 1e-10)
        params = var.distribution.params

        try:
            if var.distribution.type.value == "normal":
                mean = float(params.get("mean", 0.0))
                std = float(params.get("std", 1.0))
                if std <= 0 or not np.isfinite(std):
                    raise ValueError("invalid normal std")
                return stats.norm.ppf(u, loc=mean, scale=std)

            if var.distribution.type.value == "lognormal":
                mean = float(params.get("mean", 0.0))
                sigma = float(params.get("sigma", 1.0))
                if sigma <= 0 or not np.isfinite(sigma):
                    raise ValueError("invalid lognormal sigma")
                return stats.lognorm.ppf(u, s=sigma, loc=0, scale=np.exp(mean))

            if var.distribution.type.value == "beta":
                alpha = float(params.get("alpha", 1.0))
                beta = float(params.get("beta", 1.0))
                if alpha <= 0 or beta <= 0:
                    raise ValueError("invalid beta shape")
                return stats.beta.ppf(u, alpha, beta)

            if var.distribution.type.value == "uniform":
                low = float(params.get("low", 0.0))
                high = float(params.get("high", 1.0))
                if high <= low:
                    raise ValueError("invalid uniform bounds")
                return stats.uniform.ppf(u, loc=low, scale=high - low)

            if var.distribution.type.value == "empirical":
                raw_data = params.get("data", [params.get("mean", 0.0)])
                data = np.asarray(raw_data, dtype=float)
                if data.size == 0:
                    raise ValueError("empty empirical data")
                return np.quantile(data, u)

            if var.distribution.type.value == "poisson":
                lam = float(params.get("lam", 1.0))
                if lam < 0:
                    raise ValueError("invalid poisson lambda")
                return stats.poisson.ppf(u, mu=lam)

            if var.distribution.type.value == "triangular":
                left = float(params.get("left", 0.0))
                mode = float(params.get("mode", 0.5))
                right = float(params.get("right", 1.0))
                if not (left < mode < right):
                    raise ValueError("invalid triangular bounds")
                c = (mode - left) / (right - left)
                return stats.triang.ppf(u, c=c, loc=left, scale=right - left)
        except Exception:
            return var.distribution.sample(len(u))

        return var.distribution.sample(len(u))

    def run(self, time_horizon_months: int = 12) -> list[MonteCarloResult]:
        """Run Monte Carlo simulation across all variables."""
        variables = list(self.universe.variables.values())
        n_vars = len(variables)

        if n_vars == 0:
            return []

        # Build correlation matrix if needed
        self.universe.build_correlation_matrix()
        use_independent_sampling = self._use_independent_sampling(n_vars)
        correlated_uniforms = None
        if not use_independent_sampling:
            correlated_uniforms = self._generate_correlated_uniforms(n_vars)

        results = []

        for idx, var in enumerate(variables):
            # Generate samples from the variable's distribution
            if use_independent_sampling or correlated_uniforms is None:
                samples = var.distribution.sample(self.iterations)
            else:
                samples = self._sample_from_uniforms(var, correlated_uniforms[:, idx])

            # Apply confidence weighting (lower confidence = wider spread)
            noise_scale = 0.0
            if var.confidence < 1.0:
                noise_scale = (1.0 - var.confidence) * var.value * 0.2
                noise = np.random.normal(0, noise_scale, self.iterations)
                samples = samples + noise

            # Time series projection
            ts_projection = []
            for month in range(time_horizon_months):
                # Simple random walk with drift from distribution
                if use_independent_sampling:
                    month_samples = var.distribution.sample(self.iterations)
                else:
                    month_uniforms = self._generate_correlated_uniforms(n_vars)
                    month_samples = self._sample_from_uniforms(
                        var, month_uniforms[:, idx]
                    )
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
