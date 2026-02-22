import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

const PYTHON_API_URL = process.env.PYTHON_API_URL || "http://localhost:8000";

function isValidUuid(value: unknown): value is string {
  return (
    typeof value === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      value
    )
  );
}

function parseError(status: number, bodyText: string): string {
  if (!bodyText) return `Agent service error (${status})`;

  try {
    const parsed = JSON.parse(bodyText) as Record<string, unknown>;
    if (typeof parsed.detail === "string") return parsed.detail;
    if (typeof parsed.error === "string") return parsed.error;
    if (typeof parsed.message === "string") return parsed.message;
  } catch {
    // ignored
  }

  return bodyText;
}

// Trigger agent analysis
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const businessId = body.businessId;
    const simulationId = body.simulationId;

    if (!isValidUuid(businessId) || !isValidUuid(simulationId)) {
      return NextResponse.json(
        { error: "Valid businessId and simulationId are required" },
        { status: 400 }
      );
    }

    const supabase = createServerClient();

    const [{ data: business, error: businessError }, { data: simulation, error: simError }] =
      await Promise.all([
        supabase.from("businesses").select("*").eq("id", businessId).single(),
        supabase
          .from("simulation_results")
          .select("*")
          .eq("id", simulationId)
          .single(),
      ]);

    if (businessError || !business) {
      return NextResponse.json(
        { error: businessError?.message || "Business not found" },
        { status: 404 }
      );
    }

    if (simError || !simulation) {
      return NextResponse.json(
        { error: simError?.message || "Simulation not found" },
        { status: 404 }
      );
    }

    const response = await fetch(`${PYTHON_API_URL}/agents/analyze`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        business_id: businessId,
        simulation_id: simulationId,
        business_data: {
          name: business.name,
          industry: business.industry,
          size: business.size,
          monthly_revenue: business.monthly_revenue || [],
          expenses: business.expenses || [],
          cash_on_hand: Number(business.cash_on_hand || 0),
          outstanding_debt: Number(business.outstanding_debt || 0),
        },
        simulation_data: {
          status: simulation.status,
          monte_carlo: simulation.monte_carlo,
          bayesian_network: simulation.bayesian_network,
          sensitivity: simulation.sensitivity,
          backtest: simulation.backtest,
        },
      }),
    });

    const responseText = await response.text();
    if (!response.ok) {
      return NextResponse.json(
        { error: parseError(response.status, responseText) },
        { status: response.status }
      );
    }

    const analysis = JSON.parse(responseText) as Record<string, unknown>;

    const { error: persistError } = await supabase
      .from("simulation_results")
      .update({
        agent_analysis: analysis,
        status: "complete",
        completed_at: new Date().toISOString(),
      })
      .eq("id", simulationId);

    if (persistError) {
      return NextResponse.json(
        { error: persistError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      analysis,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to run agent analysis",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// Get agent analysis status
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
      .select("id,status,agent_analysis")
      .eq("id", simulationId)
      .single();

    if (error || !data) {
      return NextResponse.json(
        { error: error?.message || "Simulation not found" },
        { status: error?.code === "PGRST116" ? 404 : 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        simulationId: data.id,
        status: data.status,
        analysis: data.agent_analysis,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to fetch agent analysis",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
