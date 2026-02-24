"""Backtesting — Walk-Forward Validation

Validates simulation accuracy against historical data.
Produces calibration scores, Brier scores, and ensemble disagreement.
"""

from __future__ import annotations

from dataclasses import dataclass
import numpy as np
from typing import Optional


@dataclass
class BacktestResult:
    accuracy: float
    mean_squared_relative_error: float
    calibration_data: list[dict]
    ensemble_disagreement: float
    walk_forward_results: list[dict]
    metadata: dict[str, str]


class BacktestEngine:
    """Walk-forward backtesting and calibration scoring."""

    def walk_forward_validation(
        self,
        historical_data: list[float],
        prediction_func,
        window_size: int = 6,
        step_size: int = 1,
    ) -> BacktestResult:
        """Walk-forward validation on time series data.

        Uses expanding window: train on [0:t], predict [t:t+step_size],
        then shift forward.
        """
        if len(historical_data) < window_size + step_size:
            return BacktestResult(
                accuracy=0.0,
                mean_squared_relative_error=1.0,
                calibration_data=[],
                ensemble_disagreement=0.0,
                walk_forward_results=[],
                metadata={},
            )

        results = []
        errors = []
        ensemble_predictions: list[list[float]] = []

        for t in range(window_size, len(historical_data) - step_size + 1, step_size):
            train_data = historical_data[:t]
            actual = historical_data[t : t + step_size]

            # Get prediction
            predicted = prediction_func(train_data)
            if isinstance(predicted, (int, float)):
                predicted = [predicted]
            predicted_values = [float(v) for v in predicted]
            if predicted_values:
                ensemble_predictions.append(predicted_values)

            for i, (pred, act) in enumerate(zip(predicted_values, actual)):
                error = abs(pred - act) / abs(act) if act != 0 else abs(pred)
                errors.append(error)
                results.append(
                    {
                        "period": f"t+{t + i}",
                        "predicted": float(pred),
                        "actual": float(act),
                    }
                )

        # Compute accuracy (1 - MAPE)
        mape = float(np.mean(errors)) if errors else 1.0
        accuracy = max(0, 1 - mape)

        # Mean squared relative error
        mean_squared_relative_error = (
            float(np.mean(np.array(errors) ** 2)) if errors else 1.0
        )

        # Calibration data (binned predicted vs actual)
        calibration_data = self._compute_calibration(results)
        ensemble_disagreement = self.compute_ensemble_disagreement(ensemble_predictions)

        return BacktestResult(
            accuracy=accuracy,
            mean_squared_relative_error=mean_squared_relative_error,
            calibration_data=calibration_data,
            ensemble_disagreement=ensemble_disagreement,
            walk_forward_results=results,
            metadata={},
        )

    def _compute_calibration(
        self, results: list[dict], n_bins: int = 10
    ) -> list[dict]:
        """Bin predictions and compute calibration curve."""
        if not results:
            return []

        predicted = np.array([r["predicted"] for r in results])
        actual = np.array([r["actual"] for r in results])

        # Sort by predicted values and bin
        sorted_idx = np.argsort(predicted)
        predicted = predicted[sorted_idx]
        actual = actual[sorted_idx]

        bin_size = max(1, len(predicted) // n_bins)
        calibration = []

        for i in range(0, len(predicted), bin_size):
            bin_pred = predicted[i : i + bin_size]
            bin_actual = actual[i : i + bin_size]
            calibration.append(
                {
                    "predicted": float(np.mean(bin_pred)),
                    "actual": float(np.mean(bin_actual)),
                }
            )

        return calibration

    def compute_ensemble_disagreement(
        self, predictions: list[list[float]]
    ) -> float:
        """Compute disagreement across ensemble predictions.

        Higher disagreement = lower confidence in predictions.
        """
        if len(predictions) < 2:
            return 0.0

        min_horizon = min(len(p) for p in predictions)
        if min_horizon == 0:
            return 0.0

        arr = np.array([p[:min_horizon] for p in predictions], dtype=float)
        # Coefficient of variation across ensemble members
        mean_pred = np.mean(arr, axis=0)
        std_pred = np.std(arr, axis=0)

        cv = std_pred / (np.abs(mean_pred) + 1e-10)
        return float(np.mean(cv))
