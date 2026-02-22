import { NextRequest, NextResponse } from "next/server";

const PYTHON_API_URL = process.env.PYTHON_API_URL || "http://localhost:8000";

// Send chat message (report Q&A)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, reportId, scenarioId, simulationId, history } = body;

    // Call Python service which has access to Claude API and simulation context
    const response = await fetch(`${PYTHON_API_URL}/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message,
        reportId,
        scenarioId,
        simulationId,
        history,
      }),
    });

    if (!response.ok) {
      throw new Error(`Chat service error: ${response.statusText}`);
    }

    const result = await response.json();

    return NextResponse.json({
      success: true,
      reply: result.reply,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to process chat message",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
