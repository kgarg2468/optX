import { NextRequest, NextResponse } from "next/server";

const PYTHON_API_URL = process.env.PYTHON_API_URL || "http://localhost:8000";

// Trigger agent analysis
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { businessId, simulationId } = body;

    // Call Python FastAPI service to run 6-agent analysis
    const response = await fetch(`${PYTHON_API_URL}/agents/analyze`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ businessId, simulationId }),
    });

    if (!response.ok) {
      throw new Error(`Agent service error: ${response.statusText}`);
    }

    const result = await response.json();

    return NextResponse.json({
      success: true,
      analysis: result,
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

    // TODO: Fetch agent analysis status from Supabase or Python service

    return NextResponse.json({
      success: true,
      data: null,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch agent analysis" },
      { status: 500 }
    );
  }
}
