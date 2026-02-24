"""GARCH Volatility Modeling (EXPERIMENTAL — not yet integrated into simulation pipeline)

Models volatility clustering in financial time series.
Captures periods of high/low volatility for more realistic simulations.
"""

from __future__ import annotations

from dataclasses import dataclass
import numpy as np
from typing import Optional


@dataclass
class GARCHResult:
    omega: float  # constant
    alpha: float  # ARCH coefficient
    beta: float  # GARCH coefficient
    conditional_volatility: list[float]
    forecast_volatility: list[float]


class GARCHEngine:
    """GARCH(1,1) volatility modeling."""

    def fit(self, returns: list[float]) -> GARCHResult:
        """Fit GARCH(1,1) model to return series.

        Variance equation: σ²_t = ω + α·ε²_{t-1} + β·σ²_{t-1}

        Uses simplified MLE estimation.
        """
        r = np.array(returns)
        n = len(r)

        if n < 10:
            var = float(np.var(r)) if n > 1 else 0.01
            return GARCHResult(
                omega=var * 0.1,
                alpha=0.1,
                beta=0.8,
                conditional_volatility=[np.sqrt(var)] * n,
                forecast_volatility=[np.sqrt(var)],
            )

        # Initial parameter estimates
        omega = float(np.var(r)) * 0.05
        alpha = 0.1
        beta = 0.85

        # Simple iterative estimation (simplified MLE)
        best_params = (omega, alpha, beta)
        best_ll = -np.inf

        for a in np.arange(0.01, 0.3, 0.05):
            for b in np.arange(0.5, 0.95, 0.05):
                if a + b >= 1.0:
                    continue
                w = float(np.var(r)) * (1 - a - b)
                if w <= 0:
                    continue

                # Compute conditional variance
                sigma2 = np.zeros(n)
                sigma2[0] = np.var(r)

                for t in range(1, n):
                    sigma2[t] = w + a * r[t - 1] ** 2 + b * sigma2[t - 1]
                    sigma2[t] = max(sigma2[t], 1e-10)

                # Log-likelihood
                ll = -0.5 * np.sum(np.log(sigma2) + r**2 / sigma2)

                if ll > best_ll:
                    best_ll = ll
                    best_params = (w, a, b)

        omega, alpha, beta = best_params

        # Final conditional volatility
        sigma2 = np.zeros(n)
        sigma2[0] = np.var(r)
        for t in range(1, n):
            sigma2[t] = omega + alpha * r[t - 1] ** 2 + beta * sigma2[t - 1]

        conditional_vol = np.sqrt(sigma2).tolist()

        return GARCHResult(
            omega=omega,
            alpha=alpha,
            beta=beta,
            conditional_volatility=conditional_vol,
            forecast_volatility=conditional_vol[-1:],
        )

    def forecast(self, result: GARCHResult, n_periods: int = 12) -> list[float]:
        """Forecast volatility for n periods ahead."""
        forecasts = []
        last_var = result.conditional_volatility[-1] ** 2 if result.conditional_volatility else 0.01

        unconditional_var = result.omega / (1 - result.alpha - result.beta) if (result.alpha + result.beta) < 1 else last_var

        current_var = last_var
        for _ in range(n_periods):
            current_var = result.omega + (result.alpha + result.beta) * current_var
            forecasts.append(float(np.sqrt(current_var)))

        return forecasts
