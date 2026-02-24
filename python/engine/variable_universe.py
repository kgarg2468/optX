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

    def sample(self, n: int = 1) -> np.ndarray:
        """Sample n values from this distribution."""
        if self.type == DistributionType.NORMAL:
            return np.random.normal(
                self.params["mean"], self.params["std"], n
            )
        elif self.type == DistributionType.LOGNORMAL:
            return np.random.lognormal(
                self.params["mean"], self.params["sigma"], n
            )
        elif self.type == DistributionType.BETA:
            return np.random.beta(
                self.params["alpha"], self.params["beta"], n
            )
        elif self.type == DistributionType.UNIFORM:
            return np.random.uniform(
                self.params["low"], self.params["high"], n
            )
        elif self.type == DistributionType.EMPIRICAL:
            data = np.array(self.params.get("data", [0]))
            return np.random.choice(data, size=n, replace=True)
        elif self.type == DistributionType.POISSON:
            return np.random.poisson(self.params["lam"], n)
        elif self.type == DistributionType.TRIANGULAR:
            return np.random.triangular(
                self.params["left"],
                self.params["mode"],
                self.params["right"],
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
            return Distribution(
                type=DistributionType.NORMAL,
                params={"mean": float(np.mean(arr)), "std": float(np.std(arr, ddof=1)) or 1.0},
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
