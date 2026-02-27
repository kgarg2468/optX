import os
import sys
import unittest
from unittest.mock import patch

PROJECT_PYTHON_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if PROJECT_PYTHON_DIR not in sys.path:
    sys.path.insert(0, PROJECT_PYTHON_DIR)

import main as optx_main  # noqa: E402
from engine.bayesian import BayesianEngine  # noqa: E402
from engine.monte_carlo import MonteCarloEngine  # noqa: E402
from engine.variable_universe import (  # noqa: E402
    Distribution,
    DistributionType,
    Variable,
    VariableUniverse,
)


def make_variable(
    var_id: str,
    name: str,
    category: str,
    value: float,
    time_series_data: list[float] | None = None,
) -> Variable:
    return Variable(
        id=var_id,
        name=name,
        display_name=name.replace("_", " ").title(),
        category=category,
        value=float(value),
        unit="USD" if category in {"financial", "expense"} else "units",
        distribution=Distribution(
            type=DistributionType.NORMAL,
            params={"mean": float(value), "std": max(abs(float(value)) * 0.05, 0.01)},
        ),
        confidence=0.8,
        time_series_data=time_series_data,
        source="test",
    )


class PipelineRegressionTests(unittest.TestCase):
    def test_normalize_business_data_preserves_numeric_fields(self):
        payload = {
            "name": "Acme Lighting",
            "industry": "technology",
            "size": "6-20",
            "monthlyRevenue": [100.0, 110.0, 120.0],
            "expenses": [{"name": "Rent", "amount": 30.0}],
            "customerCount": 42,
            "unitEconomics": {"cac": 55, "ltv": 500},
            "metrics": [
                {"month": 1, "unitsSold": 10},
                {"month": 2, "unitsSold": 12},
            ],
            "notes": "non-numeric text should not pass through",
        }

        normalized = optx_main._normalize_business_data(payload)

        self.assertEqual(normalized["monthly_revenue"], [100.0, 110.0, 120.0])
        self.assertEqual(normalized["customer_count"], 42.0)
        self.assertEqual(normalized["unit_economics_cac"], 55.0)
        self.assertEqual(normalized["unit_economics_ltv"], 500.0)
        self.assertEqual(normalized["metrics_units_sold"], [10.0, 12.0])
        self.assertNotIn("notes", normalized)

    def test_variable_universe_builds_generic_variables(self):
        payload = {
            "name": "Generic SaaS",
            "monthlyRevenue": [1000, 1050, 1100, 1200, 1300],
            "expenses": [{"name": "Hosting", "amount": 300}],
            "unitsSold": [40, 42, 45, 50, 55],
            "customerCount": 120,
            "inventoryLevels": [80, 79, 81, 77, 75],
            "churnRate": 0.04,
        }
        normalized = optx_main._normalize_business_data(payload)
        universe = VariableUniverse()
        universe.from_business_data(normalized)

        self.assertIn("revenue_monthly", universe.variables)
        self.assertIn("units_sold", universe.variables)
        self.assertIn("customer_count", universe.variables)
        self.assertIn("inventory_levels", universe.variables)
        self.assertGreater(len(universe.variables), 4)

    def test_backtest_history_prefers_revenue_then_fallback_series(self):
        with_revenue = {
            "monthly_revenue": [1, 2, 3],
            "units_sold": [10, 20, 30],
        }
        no_revenue = {
            "units_sold": [10, 20, 30, 40],
            "customer_count": [5, 6],
        }

        self.assertEqual(optx_main._build_backtest_history(with_revenue), [1.0, 2.0, 3.0])
        self.assertEqual(
            optx_main._build_backtest_history(no_revenue),
            [10.0, 20.0, 30.0, 40.0],
        )

    def test_baseline_model_uses_categories_not_position(self):
        universe = VariableUniverse()
        universe.add_variable(make_variable("expense_rent", "rent", "expense", 100))
        universe.add_variable(
            make_variable("subscription_mrr", "subscription_mrr", "financial", 500)
        )

        model = optx_main._build_dag_sensitivity_model(universe, BayesianEngine())
        self.assertAlmostEqual(model([100.0, 500.0]), 400.0, places=6)

    def test_bayesian_default_structure_is_dynamic(self):
        universe = VariableUniverse()
        universe.add_variable(make_variable("subscription_mrr", "subscription_mrr", "financial", 5000))
        universe.add_variable(make_variable("hosting_cost", "hosting_cost", "expense", 900))
        universe.add_variable(make_variable("cash_on_hand", "cash_on_hand", "financial", 20000))
        universe.add_variable(make_variable("customer_count", "customer_count", "operations", 320))

        bayes = BayesianEngine()
        bayes.build_default_structure(universe.variables)

        self.assertGreater(len(bayes.edges), 0)
        for edge in bayes.edges:
            self.assertIn(edge.from_var, universe.variables)
            self.assertIn(edge.to_var, universe.variables)

    def test_dag_sensitivity_empty_graph_falls_back_to_sum_model(self):
        universe = VariableUniverse()
        universe.add_variable(make_variable("customer_count", "customer_count", "operations", 100))
        universe.add_variable(make_variable("inventory_levels", "inventory_levels", "operations", 200))
        model = optx_main._build_dag_sensitivity_model(universe, BayesianEngine())
        self.assertEqual(model([7.0, 5.0]), 12.0)

    def test_apply_scenario_overrides_updates_existing_variable(self):
        universe = VariableUniverse()
        universe.add_variable(make_variable("customer_count", "customer_count", "operations", 100))

        optx_main._apply_scenario_overrides(
            universe,
            [
                {
                    "variableId": "customer_count",
                    "name": "Customer Count",
                    "modifiedValue": 10,
                    "changeType": "percentage_increase",
                }
            ],
        )

        updated = universe.variables["customer_count"]
        self.assertAlmostEqual(updated.value, 110.0, places=6)
        self.assertNotIn("scenario_customer_count", universe.variables)

    def test_short_series_volatility_adjustment_updates_distribution(self):
        universe = VariableUniverse()
        variable = make_variable(
            "units_sold",
            "units_sold",
            "operations",
            100,
            time_series_data=[100, 150, 80, 170, 60],
        )
        variable.distribution.params["std"] = 1.0
        universe.add_variable(variable)

        optx_main._apply_garch_volatility_adjustments(universe)
        self.assertGreater(universe.variables["units_sold"].distribution.params["std"], 1.0)

    def test_monte_carlo_reuses_correlated_uniforms_per_month(self):
        universe = VariableUniverse()
        universe.add_variable(
            make_variable(
                "series_a",
                "series_a",
                "financial",
                100,
                time_series_data=[10, 11, 12, 13, 14, 15],
            )
        )
        universe.add_variable(
            make_variable(
                "series_b",
                "series_b",
                "financial",
                120,
                time_series_data=[20, 19, 18, 22, 25, 24],
            )
        )

        engine = MonteCarloEngine(universe, iterations=300)
        call_count = 0
        original = engine._generate_correlated_uniforms

        def wrapped(n_vars, copula_factor=None):
            nonlocal call_count
            call_count += 1
            return original(n_vars, copula_factor=copula_factor)

        engine._generate_correlated_uniforms = wrapped  # type: ignore[method-assign]
        engine.run(time_horizon_months=4, include_raw_samples=False)
        self.assertEqual(call_count, 5)  # 1 initial + 4 monthly projections

    def test_fit_distribution_constant_data_has_reasonable_std(self):
        universe = VariableUniverse()
        constant_dist = universe.fit_distribution([500, 500, 500, 500], "constant")
        zero_dist = universe.fit_distribution([0, 0, 0, 0], "zero_constant")

        self.assertEqual(constant_dist.type, DistributionType.NORMAL)
        self.assertGreater(constant_dist.params["std"], 0.0)
        self.assertLess(constant_dist.params["std"], 100.0)
        self.assertGreater(zero_dist.params["std"], 0.0)
        self.assertLess(zero_dist.params["std"], 1.0)

    def test_fit_distribution_evaluates_multiple_distribution_families(self):
        universe = VariableUniverse()
        calls: list[str] = []

        def fake_kstest(data, dist_name, args=(), **kwargs):
            _ = data, args, kwargs
            calls.append(str(dist_name))
            return (0.0, 0.5)

        with patch("engine.variable_universe.stats.kstest", side_effect=fake_kstest), patch(
            "engine.variable_universe.stats.beta.fit",
            return_value=(2.0, 3.0, 0.0, 1.0),
        ):
            universe.fit_distribution([1, 2, 3, 4, 5, 6, 7], "candidate_check")

        for expected in {"norm", "lognorm", "uniform", "triang", "beta", "poisson"}:
            self.assertIn(expected, calls)

    def test_agent_edge_normalization_supports_fuzzy_matching(self):
        universe = VariableUniverse()
        universe.add_variable(
            make_variable("expense_marketing", "marketing_spend", "expense", 2000)
        )
        universe.add_variable(make_variable("cash_on_hand", "cash_on_hand", "financial", 50000))

        normalized_edges = optx_main._normalize_agent_edge_endpoints(
            universe,
            [
                {
                    "from_var": "marketng spend",
                    "to_var": "cash on handd",
                    "strength": 0.4,
                }
            ],
        )

        self.assertEqual(len(normalized_edges), 1)
        self.assertEqual(normalized_edges[0]["from_var"], "expense_marketing")
        self.assertEqual(normalized_edges[0]["to_var"], "cash_on_hand")

    def test_expense_std_has_floor_and_cap(self):
        payload = {
            "name": "Cap/Floor Test",
            "monthlyRevenue": [10000] * 12,
            "expenses": [
                {"name": "New Channel", "amount": 0},
                {"name": "Mega Lease", "amount": 1_000_000},
            ],
        }
        normalized = optx_main._normalize_business_data(payload)
        universe = VariableUniverse()
        universe.from_business_data(normalized)

        zero_std = universe.variables["expense_new_channel"].distribution.params["std"]
        huge_std = universe.variables["expense_mega_lease"].distribution.params["std"]

        self.assertGreater(zero_std, 0.0)
        self.assertGreaterEqual(huge_std, 10_000.0)
        self.assertLessEqual(huge_std, 200_000.0)

    def test_bayesian_merge_agent_edges_rejects_cycles(self):
        bayes = BayesianEngine()
        bayes.add_edge("a", "b", 0.5, "a to b")
        bayes.add_edge("b", "c", 0.5, "b to c")
        added = bayes.merge_agent_edges([{"from_var": "c", "to_var": "a", "strength": 0.4}])

        self.assertEqual(added, 0)
        self.assertFalse(any(edge.from_var == "c" and edge.to_var == "a" for edge in bayes.edges))


if __name__ == "__main__":
    unittest.main()
