import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import {
  mapSupabaseError,
  type SupabaseErrorLike,
} from "@/lib/supabase/diagnostics";
import type { BusinessSize, IndustryType, ProjectSummary } from "@/lib/types";

const DEFAULT_USER_ID =
  process.env.DEFAULT_USER_ID || "00000000-0000-0000-0000-000000000000";

function isValidUuid(value: unknown): value is string {
  return (
    typeof value === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      value
    )
  );
}

async function getCountsByBusiness(
  businessIds: string[]
): Promise<{ dataSourceCounts: Map<string, number>; scenarioCounts: Map<string, number> }> {
  if (businessIds.length === 0) {
    return {
      dataSourceCounts: new Map<string, number>(),
      scenarioCounts: new Map<string, number>(),
    };
  }

  const supabase = createServerClient();

  const [{ data: sourceRows, error: sourceError }, { data: scenarioRows, error: scenarioError }] =
    await Promise.all([
      supabase.from("data_sources").select("business_id").in("business_id", businessIds),
      supabase.from("scenarios").select("business_id").in("business_id", businessIds),
    ]);

  if (sourceError) {
    throw sourceError;
  }

  if (scenarioError) {
    throw scenarioError;
  }

  const dataSourceCounts = new Map<string, number>();
  for (const row of sourceRows || []) {
    const businessId = String(row.business_id);
    dataSourceCounts.set(businessId, (dataSourceCounts.get(businessId) || 0) + 1);
  }

  const scenarioCounts = new Map<string, number>();
  for (const row of scenarioRows || []) {
    const businessId = String(row.business_id);
    scenarioCounts.set(businessId, (scenarioCounts.get(businessId) || 0) + 1);
  }

  return { dataSourceCounts, scenarioCounts };
}

function toProjectSummary(
  row: Record<string, unknown>,
  dataSourceCount: number,
  scenarioCount: number
): ProjectSummary {
  return {
    id: String(row.id),
    name: String(row.name || "Untitled Project"),
    industry: (row.industry as IndustryType) || "other",
    size: (row.size as BusinessSize) || "1-5",
    updatedAt: String(row.updated_at || new Date().toISOString()),
    dataSourceCount,
    scenarioCount,
  };
}

export async function GET() {
  try {
    const supabase = createServerClient();

    const { data: rows, error } = await supabase
      .from("businesses")
      .select("id, name, industry, size, updated_at")
      .eq("user_id", DEFAULT_USER_ID)
      .order("updated_at", { ascending: false });

    if (error) {
      const mapped = mapSupabaseError(error as SupabaseErrorLike, {
        defaultMessage: "Failed to fetch projects",
      });
      return NextResponse.json(mapped.body, { status: mapped.status });
    }

    const businessIds = (rows || []).map((row) => String(row.id));
    const { dataSourceCounts, scenarioCounts } = await getCountsByBusiness(businessIds);

    const projects = (rows || []).map((row) =>
      toProjectSummary(
        row as Record<string, unknown>,
        dataSourceCounts.get(String(row.id)) || 0,
        scenarioCounts.get(String(row.id)) || 0
      )
    );

    return NextResponse.json({ success: true, data: projects });
  } catch (error) {
    const mapped = mapSupabaseError(error as SupabaseErrorLike, {
      defaultMessage: "Failed to fetch projects",
    });
    return NextResponse.json(mapped.body, { status: mapped.status });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const projectId = body.projectId;
    const name = typeof body.name === "string" ? body.name.trim() : "";

    if (!isValidUuid(projectId)) {
      return NextResponse.json(
        { error: "A valid projectId is required" },
        { status: 400 }
      );
    }

    if (!name) {
      return NextResponse.json(
        { error: "Project name cannot be empty" },
        { status: 400 }
      );
    }

    const supabase = createServerClient();
    const { data: row, error } = await supabase
      .from("businesses")
      .update({ name, updated_at: new Date().toISOString() })
      .eq("id", projectId)
      .eq("user_id", DEFAULT_USER_ID)
      .select("id, name, industry, size, updated_at")
      .single();

    if (error || !row) {
      const mapped = mapSupabaseError(error as SupabaseErrorLike, {
        defaultMessage: "Failed to rename project",
        notFoundMessage: "Project not found",
      });
      return NextResponse.json(mapped.body, { status: mapped.status });
    }

    const { dataSourceCounts, scenarioCounts } = await getCountsByBusiness([
      String(row.id),
    ]);

    return NextResponse.json({
      success: true,
      project: toProjectSummary(
        row as Record<string, unknown>,
        dataSourceCounts.get(String(row.id)) || 0,
        scenarioCounts.get(String(row.id)) || 0
      ),
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to rename project",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");

    if (!isValidUuid(projectId)) {
      return NextResponse.json(
        { error: "A valid projectId query parameter is required" },
        { status: 400 }
      );
    }

    const supabase = createServerClient();
    const { data, error } = await supabase
      .from("businesses")
      .delete()
      .eq("id", projectId)
      .eq("user_id", DEFAULT_USER_ID)
      .select("id");

    if (error) {
      const mapped = mapSupabaseError(error as SupabaseErrorLike, {
        defaultMessage: "Failed to delete project",
      });
      return NextResponse.json(mapped.body, { status: mapped.status });
    }

    if (!data || data.length === 0) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: "Project deleted" });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to delete project",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
