import { NextRequest, NextResponse } from "next/server";

const PYTHON_API_URL = process.env.PYTHON_API_URL || "http://localhost:8000";

// Trigger simulation
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { businessId, config, scenarioId } = body;

    // Call Python FastAPI service
    const response = await fetch(`${PYTHON_API_URL}/simulate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ businessId, config, scenarioId }),
    });

    if (!response.ok) {
      throw new Error(`Python service error: ${response.statusText}`);
    }

    const result = await response.json();

    // TODO: Store results in Supabase

    return NextResponse.json({
      success: true,
      simulationId: result.simulationId,
      status: result.status,
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

    // TODO: Fetch from Supabase or poll Python service

    return NextResponse.json({
      success: true,
      data: null,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch simulation status" },
      { status: 500 }
    );
  }
}
