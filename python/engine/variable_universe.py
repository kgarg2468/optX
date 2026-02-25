"""Variable Universe Construction

Every data point becomes a typed variable with:
- Probability distribution (empirical, normal, beta, etc.)
- Correlation matrix
- Confidence weight
- Time-series behavior
"""

from __future__ import annotations

from dataclasses import dataclass, field
from enum import Enum
from typing import Optional
import warnings
import numpy as np
from scipy import stats


class DistributionType(str, Enum):
    NORMAL = "normal"
    LOGNORMAL = "lognormal"
    BETA = "beta"
    UNIFORM = "uniform"
    EMPIRICAL = "empirical"
    POISSON = "poisson"
    TRIANGULAR = "triangular"


@dataclass
class Distribution:
    type: DistributionType
    params: dict[str, float]

    def _warn_and_fallback(self, n: int, reason: str) -> np.ndarray:
        fallback_mean = self.params.get("mean", 0.0)
        try:
            fill_value = float(fallback_mean)
        except (TypeError, ValueError):
            fill_value = 0.0
        warnings.warn(
            f"Invalid parameters for distribution '{self.type}': {reason}. "
            "Returning constant fallback samples.",
            RuntimeWarning,
            stacklevel=2,
        )
        return np.full(n, fill_value, dtype=float)

    def sample(self, n: int = 1) -> np.ndarray:
        """Sample n values from this distribution."""
        if self.type == DistributionType.NORMAL:
            mean = float(self.params.get("mean", 0.0))
            std = float(self.params.get("std", 0.0))
            if not np.isfinite(std) or std <= 0:
                return self._warn_and_fallback(n, "std must be finite and > 0")
            if not np.isfinite(mean):
                return self._warn_and_fallback(n, "mean must be finite")
            return np.random.normal(mean, std, n)
        elif self.type == DistributionType.LOGNORMAL:
            mean = float(self.params.get("mean", 0.0))
            sigma = float(self.params.get("sigma", 0.0))
            if not np.isfinite(sigma) or sigma <= 0:
                return self._warn_and_fallback(n, "sigma must be finite and > 0")
            if not np.isfinite(mean):
                return self._warn_and_fallback(n, "mean must be finite")
            return np.random.lognormal(mean, sigma, n)
        elif self.type == DistributionType.BETA:
            alpha = float(self.params.get("alpha", 0.0))
            beta = float(self.params.get("beta", 0.0))
            if (not np.isfinite(alpha)) or alpha <= 0:
                return self._warn_and_fallback(n, "alpha must be finite and > 0")
            if (not np.isfinite(beta)) or beta <= 0:
                return self._warn_and_fallback(n, "beta must be finite and > 0")
            return np.random.beta(alpha, beta, n)
        elif self.type == DistributionType.UNIFORM:
            low = float(self.params.get("low", 0.0))
            high = float(self.params.get("high", 0.0))
            if (not np.isfinite(low)) or (not np.isfinite(high)):
                return self._warn_and_fallback(n, "low/high must be finite")
            if high <= low:
                return self._warn_and_fallback(n, "high must be greater than low")
            return np.random.uniform(low, high, n)
        elif self.type == DistributionType.EMPIRICAL:
            data = np.array(self.params.get("data", [0]))
            if data.size == 0:
                return self._warn_and_fallback(n, "empirical data cannot be empty")
            return np.random.choice(data, size=n, replace=True)
        elif self.type == DistributionType.POISSON:
            lam = float(self.params.get("lam", -1.0))
            if (not np.isfinite(lam)) or lam < 0:
                return self._warn_and_fallback(n, "lam must be finite and >= 0")
            return np.random.poisson(lam, n)
        elif self.type == DistributionType.TRIANGULAR:
            left = float(self.params.get("left", 0.0))
            mode = float(self.params.get("mode", 0.0))
            right = float(self.params.get("right", 0.0))
            if not (np.isfinite(left) and np.isfinite(mode) and np.isfinite(right)):
                return self._warn_and_fallback(n, "left/mode/right must be finite")
            if not (left < mode < right):
                return self._warn_and_fallback(n, "must satisfy left < mode < right")
            return np.random.triangular(
                left,
                mode,
                right,
                n,
            )
        else:
            return np.zeros(n)


@dataclass
class Variable:
    id: str
    name: str
    display_name: str
    category: str
    value: float
    unit: str
    distribution: Distribution
    confidence: float  # 0-1
    time_series_data: Optional[list[float]] = None
    source: str = "manual"


class VariableUniverse:
    """Builds and manages the unified variable set for simulation."""

    def __init__(self):
        self.variables: dict[str, Variable] = {}
        self.correlation_matrix: Optional[np.ndarray] = None

    def add_variable(self, variable: Variable) -> None:
        self.variables[variable.id] = variable

    def fit_distribution(self, data: list[float], name: str) -> Distribution:
        """Fit the best distribution to observed data."""
        arr = np.array(data)

        if len(arr) < 5:
            # Too few data points — use normal with sample stats
            std_val = float(np.std(arr, ddof=1))
            if not np.isfinite(std_val) or std_val <= 0:
                std_val = 1.0
            return Distribution(
                type=DistributionType.NORMAL,
                params={"mean": float(np.mean(arr)), "std": std_val},
            )

        # Try common distributions and pick best fit (KS test)
        best_dist = DistributionType.NORMAL
        best_params = {"mean": float(np.mean(arr)), "std": float(np.std(arr, ddof=1))}
        best_pvalue = 0.0

        # Normal
        mu, sigma = stats.norm.fit(arr)
        _, p = stats.kstest(arr, "norm", args=(mu, sigma))
        if p > best_pvalue:
            best_pvalue = p
            best_dist = DistributionType.NORMAL
            best_params = {"mean": mu, "std": sigma}

        # Lognormal (only for positive data)
        if np.all(arr > 0):
            shape, loc, scale = stats.lognorm.fit(arr, floc=0)
            _, p = stats.kstest(arr, "lognorm", args=(shape, loc, scale))
            if p > best_pvalue:
                best_pvalue = p
                best_dist = DistributionType.LOGNORMAL
                log_data = np.log(arr)
                best_params = {
                    "mean": float(np.mean(log_data)),
                    "sigma": float(np.std(log_data, ddof=1)),
                }

        return Distribution(type=best_dist, params=best_params)

    def build_correlation_matrix(self) -> np.ndarray:
        """Build correlation matrix from variables with time series data."""
        ts_vars = [
            v
            for v in self.variables.values()
            if v.time_series_data and len(v.time_series_data) > 2
        ]

        if len(ts_vars) < 2:
            n = len(self.variables)
            self.correlation_matrix = np.eye(n)
            return self.correlation_matrix

        # Build matrix from time series
        min_len = min(len(v.time_series_data) for v in ts_vars)
        data_matrix = np.array(
            [v.time_series_data[:min_len] for v in ts_vars]
        )
        self.correlation_matrix = np.corrcoef(data_matrix)
        return self.correlation_matrix

    def from_business_data(self, business_data: dict) -> None:
        """Construct variables from ingested business data."""
        # Revenue
        revenue = business_data.get("monthly_revenue", [])
        if revenue:
            dist = self.fit_distribution(revenue, "monthly_revenue")
            self.add_variable(
                Variable(
                    id="revenue_monthly",
                    name="monthly_revenue",
                    display_name="Monthly Revenue",
                    category="financial",
                    value=float(np.mean(revenue)),
                    unit="USD",
                    distribution=dist,
                    confidence=min(0.5 + len(revenue) * 0.04, 0.95),
                    time_series_data=revenue,
                    source="quick_start",
                )
            )

        # Expenses
        for expense in business_data.get("expenses", []):
            exp_id = f"expense_{expense['name'].lower().replace(' ', '_')}"
            self.add_variable(
                Variable(
                    id=exp_id,
                    name=expense["name"],
                    display_name=expense["name"],
                    category="expense",
                    value=float(expense["amount"]),
                    unit="USD",
                    distribution=Distribution(
                        type=DistributionType.NORMAL,
                        params={
                            "mean": float(expense["amount"]),
                            "std": float(expense["amount"]) * 0.1,
                        },
                    ),
                    confidence=0.7,
                    source="quick_start",
                )
            )

        # Cash on hand
        cash = business_data.get("cash_on_hand", 0)
        if cash:
            self.add_variable(
                Variable(
                    id="cash_on_hand",
                    name="cash_on_hand",
                    display_name="Cash on Hand",
                    category="financial",
                    value=float(cash),
                    unit="USD",
                    distribution=Distribution(
                        type=DistributionType.NORMAL,
                        params={"mean": float(cash), "std": float(cash) * 0.05},
                    ),
                    confidence=0.9,
                    source="quick_start",
                )
            )

        # Debt
        debt = business_data.get("outstanding_debt", 0)
        if debt:
            self.add_variable(
                Variable(
                    id="outstanding_debt",
                    name="outstanding_debt",
                    display_name="Outstanding Debt",
                    category="financial",
                    value=float(debt),
                    unit="USD",
                    distribution=Distribution(
                        type=DistributionType.NORMAL,
                        params={"mean": float(debt), "std": float(debt) * 0.02},
                    ),
                    confidence=0.95,
                    source="quick_start",
                )
            )

    def merge_agent_suggestions(self, suggestions: list[dict]) -> int:
        """Validate and merge agent-suggested variables into the universe."""
        if not suggestions:
            return 0

        known_names = {
            str(variable.id).strip().lower()
            for variable in self.variables.values()
        }
        known_names.update(
            str(variable.name).strip().lower().replace(" ", "_")
            for variable in self.variables.values()
        )

        added = 0
        for suggestion in suggestions:
            if not isinstance(suggestion, dict):
                continue

            raw_name = suggestion.get("name") or suggestion.get("display_name")
            if not raw_name:
                continue

            normalized_name = str(raw_name).strip().lower().replace(" ", "_")
            if not normalized_name or normalized_name in known_names:
                continue

            raw_value = suggestion.get("suggested_value", suggestion.get("value"))
            try:
                value = float(raw_value)
            except (TypeError, ValueError):
                continue

            if not np.isfinite(value):
                continue

            variable_id = suggestion.get("id") or f"agent_{normalized_name}"
            variable_id = str(variable_id).strip().lower().replace(" ", "_")
            if variable_id in self.variables:
                variable_id = f"agent_{normalized_name}"
            if variable_id in self.variables:
                continue

            display_name = str(
                suggestion.get(
                    "display_name",
                    suggestion.get("displayName", str(raw_name).strip()),
                )
            ).strip()
            category = str(suggestion.get("category", "agent")).strip() or "agent"
            unit = str(suggestion.get("unit", "units")).strip() or "units"

            std = max(abs(value) * 0.1, 0.01)
            distribution = Distribution(
                type=DistributionType.NORMAL,
                params={"mean": value, "std": std},
            )

            self.add_variable(
                Variable(
                    id=variable_id,
                    name=normalized_name,
                    display_name=display_name or normalized_name,
                    category=category,
                    value=value,
                    unit=unit,
                    distribution=distribution,
                    confidence=0.5,
                    time_series_data=None,
                    source="agent",
                )
            )
            known_names.add(normalized_name)
            known_names.add(variable_id)
            added += 1

        return added
