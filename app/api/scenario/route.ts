import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import type { GraphState, Scenario, ScenarioVariable } from "@/lib/types";

function isValidUuid(value: unknown): value is string {
  return (
    typeof value === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      value
    )
  );
}

function toScenarioRow(scenario: Partial<Scenario>) {
  return {
    ...(isValidUuid(scenario.id) ? { id: scenario.id } : {}),
    business_id: scenario.businessId,
    name: scenario.name?.trim() || "Untitled Scenario",
    description: scenario.description || null,
    variables: scenario.variables || [],
    graph_state: scenario.graphState || { nodes: [], edges: [] },
    updated_at: new Date().toISOString(),
  };
}

function fromScenarioRow(row: Record<string, unknown>): Scenario {
  return {
    id: String(row.id),
    businessId: String(row.business_id),
    name: String(row.name || "Untitled Scenario"),
    description: String(row.description || ""),
    variables: (row.variables as ScenarioVariable[]) || [],
    graphState: (row.graph_state as GraphState) || { nodes: [], edges: [] },
    createdAt: String(row.created_at || new Date().toISOString()),
    updatedAt: String(row.updated_at || new Date().toISOString()),
  };
}

// Create scenario
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const scenario: Partial<Scenario> = {
      id: body.scenarioId,
      businessId: body.businessId,
      name: body.name,
      description: body.description,
      variables: body.variables,
      graphState: body.graphState,
    };

    if (!isValidUuid(scenario.businessId)) {
      return NextResponse.json(
        { error: "A valid businessId is required" },
        { status: 400 }
      );
    }

    const supabase = createServerClient();
    const payload = toScenarioRow(scenario);

    const { data, error } = await supabase
      .from("scenarios")
      .upsert(payload, { onConflict: "id" })
      .select("*")
      .single();

    if (error || !data) {
      return NextResponse.json(
        { error: error?.message || "Failed to create scenario" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      scenarioId: data.id,
      scenario: fromScenarioRow(data as Record<string, unknown>),
      message: "Scenario created",
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to create scenario",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// Get scenarios
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const scenarioId = searchParams.get("scenarioId");
    const businessId = searchParams.get("businessId");

    const supabase = createServerClient();

    if (isValidUuid(scenarioId)) {
      const { data, error } = await supabase
        .from("scenarios")
        .select("*")
        .eq("id", scenarioId)
        .single();

      if (error || !data) {
        return NextResponse.json(
          { error: error?.message || "Scenario not found" },
          { status: error?.code === "PGRST116" ? 404 : 500 }
        );
      }

      return NextResponse.json({
        success: true,
        data: fromScenarioRow(data as Record<string, unknown>),
      });
    }

    if (!isValidUuid(businessId)) {
      return NextResponse.json(
        {
          error:
            "Provide a valid businessId or scenarioId query parameter",
        },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("scenarios")
      .select("*")
      .eq("business_id", businessId)
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: (data || []).map((row) => fromScenarioRow(row as Record<string, unknown>)),
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to fetch scenarios",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// Update scenario
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const scenarioId = body.scenarioId;

    if (!isValidUuid(scenarioId)) {
      return NextResponse.json(
        { error: "A valid scenarioId is required" },
        { status: 400 }
      );
    }

    const updates: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (typeof body.name === "string") updates.name = body.name;
    if (typeof body.description === "string") updates.description = body.description;
    if (Array.isArray(body.variables)) updates.variables = body.variables;
    if (body.graphState) updates.graph_state = body.graphState;

    const supabase = createServerClient();
    const { data, error } = await supabase
      .from("scenarios")
      .update(updates)
      .eq("id", scenarioId)
      .select("*")
      .single();

    if (error || !data) {
      return NextResponse.json(
        { error: error?.message || "Failed to update scenario" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      scenario: fromScenarioRow(data as Record<string, unknown>),
      message: "Scenario updated",
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to update scenario",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// Delete scenario
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const scenarioId = searchParams.get("scenarioId");

    if (!isValidUuid(scenarioId)) {
      return NextResponse.json(
        { error: "A valid scenarioId query parameter is required" },
        { status: 400 }
      );
    }

    const supabase = createServerClient();
    const { error } = await supabase
      .from("scenarios")
      .delete()
      .eq("id", scenarioId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: "Scenario deleted",
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to delete scenario",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
