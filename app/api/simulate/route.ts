import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { mapSupabaseError, type SupabaseErrorLike } from "@/lib/supabase/diagnostics";
import type {
  AgentCoordinatorOutput,
  BacktestResult,
  BayesianNetworkResult,
  MonteCarloResult,
  SensitivityResult,
  SimulationConfig,
  SimulationResult,
  SimulationStatus,
} from "@/lib/types";

const PYTHON_API_URL = process.env.PYTHON_API_URL || "http://localhost:8000";

type UnknownRecord = Record<string, unknown>;

function isValidUuid(value: unknown): value is string {
  return (
    typeof value === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      value
    )
  );
}

function asRecord(value: unknown): UnknownRecord {
  return (value && typeof value === "object" ? value : {}) as UnknownRecord;
}

function toNumber(value: unknown, fallback = 0): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
}

function toBoolean(value: unknown, fallback = false): boolean {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    if (value.toLowerCase() === "true") return true;
    if (value.toLowerCase() === "false") return false;
  }
  if (typeof value === "number") return value !== 0;
  return fallback;
}

function normalizeMonteCarlo(input: unknown): UnknownRecord[] {
  if (!Array.isArray(input)) return [];

  return input.map((item) => {
    const row = asRecord(item);
    const distribution = Array.isArray(row.distribution) ? row.distribution : [];
    const rawSamples = Array.isArray(row.raw_samples)
      ? row.raw_samples
      : Array.isArray(row.rawSamples)
        ? row.rawSamples
        : [];

    return {
      ...row,
      distribution: distribution.length ? distribution : rawSamples,
      raw_samples: rawSamples,
      rawSamples: rawSamples,
    };
  });
}

function normalizeBacktest(input: unknown): BacktestResult & UnknownRecord {
  const backtest = asRecord(input);
  const calibrationData = Array.isArray(backtest.calibrationData)
    ? backtest.calibrationData
    : Array.isArray(backtest.calibration_data)
      ? backtest.calibration_data
      : [];
  const rawWalkForward = Array.isArray(backtest.walkForwardResults)
    ? backtest.walkForwardResults
    : Array.isArray(backtest.walk_forward_results)
      ? backtest.walk_forward_results
      : [];

  const walkForwardResults = rawWalkForward.map((item, index) => {
    const point = asRecord(item);
    return {
      period:
        typeof point.period === "string" ? point.period : `t+${index + 1}`,
      predicted: toNumber(point.predicted),
      actual: toNumber(point.actual),
    };
  });

  const normalized = {
    ...backtest,
    accuracy: toNumber(backtest.accuracy),
    brierScore: toNumber(backtest.brierScore ?? backtest.brier_score),
    calibrationData,
    ensembleDisagreement: toNumber(
      backtest.ensembleDisagreement ?? backtest.ensemble_disagreement
    ),
    walkForwardResults,
  };

  return {
    ...normalized,
    brier_score: normalized.brierScore,
    calibration_data: normalized.calibrationData,
    ensemble_disagreement: normalized.ensembleDisagreement,
    walk_forward_results: normalized.walkForwardResults,
  };
}

const DEFAULT_AGENT_ANALYSIS: AgentCoordinatorOutput = {
  individualAnalyses: [],
  debateRounds: [],
  convergenceScore: 0,
  unifiedFindings: [],
  recommendations: [],
};

const DEFAULT_BAYESIAN: BayesianNetworkResult = {
  nodes: [],
  edges: [],
  posteriors: {},
};

const DEFAULT_BACKTEST: BacktestResult = {
  accuracy: 0,
  brierScore: 0,
  calibrationData: [],
  ensembleDisagreement: 0,
  walkForwardResults: [],
};

function normalizeConfig(input: Partial<SimulationConfig> | undefined): SimulationConfig {
  return {
    iterations: Number(input?.iterations || 10000),
    timeHorizonMonths: Number(input?.timeHorizonMonths || 12),
    confidenceLevel: Number(input?.confidenceLevel || 0.95),
    scenarioId: input?.scenarioId,
  };
}

function parsePythonError(status: number, bodyText: string): string {
  if (!bodyText) {
    return `Python service error (${status})`;
  }

  try {
    const parsed = JSON.parse(bodyText) as Record<string, unknown>;
    if (typeof parsed.detail === "string") return parsed.detail;
    if (typeof parsed.error === "string") return parsed.error;
    if (typeof parsed.message === "string") return parsed.message;
  } catch {
    // Not JSON
  }

  return bodyText;
}

function toSimulationResult(row: Record<string, unknown>): SimulationResult {
  const monteCarlo = normalizeMonteCarlo(row.monte_carlo ?? row.monteCarlo);
  const backtest = normalizeBacktest(row.backtest ?? row.backtest_result);

  return {
    id: String(row.id),
    businessId: String(row.business_id),
    scenarioId: (row.scenario_id as string) || undefined,
    config: (row.config as SimulationConfig) || normalizeConfig(undefined),
    status: (row.status as SimulationStatus) || "idle",
    monteCarlo: monteCarlo as unknown as MonteCarloResult[],
    bayesianNetwork: (row.bayesian_network as BayesianNetworkResult) || DEFAULT_BAYESIAN,
    sensitivity: (row.sensitivity as SensitivityResult[]) || [],
    backtest: (backtest as BacktestResult) || DEFAULT_BACKTEST,
    agentAnalysis:
      (row.agent_analysis as AgentCoordinatorOutput) || DEFAULT_AGENT_ANALYSIS,
    createdAt: String(row.created_at || new Date().toISOString()),
    completedAt: (row.completed_at as string) || undefined,
  };
}

// Trigger simulation
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const businessId = body.businessId;
    const scenarioId = body.scenarioId;
    const config = normalizeConfig(body.config);
    const includeAgentEnrichment = toBoolean(
      body.includeAgentEnrichment ?? body.include_agent_enrichment
    );

    if (!isValidUuid(businessId)) {
      return NextResponse.json(
        { error: "A valid businessId is required" },
        { status: 400 }
      );
    }

    if (scenarioId && !isValidUuid(scenarioId)) {
      return NextResponse.json(
        { error: "scenarioId must be a valid UUID when provided" },
        { status: 400 }
      );
    }

    const supabase = createServerClient();

    const { data: businessRow, error: businessError } = await supabase
      .from("businesses")
      .select("*")
      .eq("id", businessId)
      .single();

    if (businessError || !businessRow) {
      const mapped = mapSupabaseError(businessError as SupabaseErrorLike, {
        defaultMessage: "Failed to load business data",
        notFoundMessage: "Business not found",
      });
      return NextResponse.json(
        mapped.body,
        { status: mapped.status }
      );
    }

    let scenarioVariables: unknown[] = [];
    if (scenarioId) {
      const { data: scenarioRow, error: scenarioError } = await supabase
        .from("scenarios")
        .select("business_id, variables")
        .eq("id", scenarioId)
        .single();

      if (scenarioError) {
        const mapped = mapSupabaseError(scenarioError as SupabaseErrorLike, {
          defaultMessage: "Failed to load scenario data",
          notFoundMessage: "Scenario not found",
        });
        return NextResponse.json(
          mapped.body,
          { status: mapped.status }
        );
      }

      if (String(scenarioRow?.business_id || "") !== businessId) {
        return NextResponse.json(
          {
            error: "Selected scenario does not belong to the provided businessId",
          },
          { status: 400 }
        );
      }

      scenarioVariables = (scenarioRow?.variables as unknown[]) || [];
    }

    const pythonPayload = {
      business_id: businessId,
      scenario_id: scenarioId ?? null,
      include_agent_enrichment: includeAgentEnrichment,
      config: {
        iterations: config.iterations,
        time_horizon_months: config.timeHorizonMonths,
        confidence_level: config.confidenceLevel,
      },
      business_data: {
        name: businessRow.name,
        industry: businessRow.industry,
        size: businessRow.size,
        monthly_revenue: businessRow.monthly_revenue || [],
        expenses: businessRow.expenses || [],
        cash_on_hand: Number(businessRow.cash_on_hand || 0),
        outstanding_debt: Number(businessRow.outstanding_debt || 0),
      },
      scenario_variables: scenarioVariables,
    };

    const response = await fetch(`${PYTHON_API_URL}/dashboard/simulate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(pythonPayload),
    });

    const responseText = await response.text();
    if (!response.ok) {
      return NextResponse.json(
        {
          error: parsePythonError(response.status, responseText),
        },
        { status: response.status }
      );
    }

    const result = JSON.parse(responseText) as Record<string, unknown>;

    const simulationIdRaw =
      (result.simulationId as string) || (result.simulation_id as string) || "";
    const simulationId = isValidUuid(simulationIdRaw)
      ? simulationIdRaw
      : crypto.randomUUID();

    const status =
      ((result.status as SimulationStatus) || "complete") as SimulationStatus;

    const monteCarlo = normalizeMonteCarlo(result.monteCarlo ?? result.monte_carlo);
    const backtest = normalizeBacktest(result.backtest ?? result.backtest_result);

    const simulationRow = {
      id: simulationId,
      business_id: businessId,
      scenario_id: scenarioId ?? null,
      config,
      status,
      monte_carlo: monteCarlo,
      bayesian_network:
        (result.bayesianNetwork as BayesianNetworkResult) ||
        (result.bayesian_network as BayesianNetworkResult) ||
        DEFAULT_BAYESIAN,
      sensitivity:
        (result.sensitivity as SensitivityResult[]) ||
        (result.sensitivity_analysis as SensitivityResult[]) ||
        [],
      backtest,
      agent_analysis:
        (result.agentAnalysis as AgentCoordinatorOutput) ||
        (result.agent_analysis as AgentCoordinatorOutput) ||
        DEFAULT_AGENT_ANALYSIS,
      completed_at:
        status === "complete" ? new Date().toISOString() : null,
    };

    const { data: persisted, error: persistError } = await supabase
      .from("simulation_results")
      .upsert(simulationRow, { onConflict: "id" })
      .select("*")
      .single();

    if (persistError || !persisted) {
      const mapped = mapSupabaseError(persistError as SupabaseErrorLike, {
        defaultMessage: "Failed to persist simulation",
      });
      return NextResponse.json(
        mapped.body,
        { status: mapped.status }
      );
    }

    return NextResponse.json({
      success: true,
      simulationId,
      status,
      result: toSimulationResult(persisted as Record<string, unknown>),
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to trigger simulation",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// Get simulation status/results
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const simulationId = searchParams.get("simulationId");

    if (!isValidUuid(simulationId)) {
      return NextResponse.json(
        { error: "A valid simulationId query parameter is required" },
        { status: 400 }
      );
    }

    const supabase = createServerClient();
    const { data, error } = await supabase
      .from("simulation_results")
      .select("*")
      .eq("id", simulationId)
      .single();

    if (error || !data) {
      const mapped = mapSupabaseError(error as SupabaseErrorLike, {
        defaultMessage: "Failed to fetch simulation status",
        notFoundMessage: "Simulation not found",
      });
      return NextResponse.json(
        mapped.body,
        { status: mapped.status }
      );
    }

    return NextResponse.json({
      success: true,
      data: toSimulationResult(data as Record<string, unknown>),
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to fetch simulation status",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
