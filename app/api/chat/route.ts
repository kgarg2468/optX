import { NextRequest, NextResponse } from "next/server";

const PYTHON_API_URL = process.env.PYTHON_API_URL || "http://localhost:8000";

// Send chat message (report Q&A)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, mode, reportId, scenarioId, simulationId, history } = body;

    // Call Python service which has access to Claude API and simulation context
    const response = await fetch(`${PYTHON_API_URL}/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message,
        mode,
        report_id: reportId,
        scenario_id: scenarioId,
        simulation_id: simulationId,
        history: history || [],
      }),
    });

    const responseText = await response.text();
    const result = responseText
      ? (JSON.parse(responseText) as Record<string, unknown>)
      : {};

    if (!response.ok) {
      return NextResponse.json(
        {
          error:
            (result.detail as string) ||
            (result.error as string) ||
            `Chat service error (${response.status})`,
        },
        { status: response.status }
      );
    }

    if (typeof result.error === "string" && !result.parsed) {
      return NextResponse.json(
        { error: result.error },
        { status: 502 }
      );
    }

    return NextResponse.json({
      success: true,
      reply: result.reply,
      parsed: result.parsed ?? null,
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
