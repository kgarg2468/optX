import { NextRequest, NextResponse } from "next/server";

const PYTHON_API_URL = process.env.PYTHON_API_URL || "http://localhost:8000";

// Save business data
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // TODO: Validate input
    // TODO: Save to Supabase
    // TODO: Trigger variable extraction on Python service

    return NextResponse.json({
      success: true,
      message: "Business data saved",
      businessId: crypto.randomUUID(),
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to save business data" },
      { status: 500 }
    );
  }
}

// Get business data
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const businessId = searchParams.get("businessId");

    // TODO: Fetch from Supabase

    return NextResponse.json({
      success: true,
      data: null,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch business data" },
      { status: 500 }
    );
  }
}
