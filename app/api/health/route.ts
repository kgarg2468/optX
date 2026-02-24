import { NextResponse } from "next/server";
import { createServerClient, getSupabaseEnvDiagnostics } from "@/lib/supabase/server";
import {
  mapSupabaseError,
  REQUIRED_TABLES,
  type SupabaseErrorLike,
} from "@/lib/supabase/diagnostics";

export async function GET() {
  try {
    const env = getSupabaseEnvDiagnostics();
    const supabase = createServerClient();

    const tableChecks = await Promise.all(
      REQUIRED_TABLES.map(async (table) => {
        const { error } = await supabase
          .from(table)
          .select("id", { head: true, count: "exact" })
          .limit(1);

        if (error) {
          const mapped = mapSupabaseError(error as SupabaseErrorLike, {
            defaultMessage: `Failed table check for ${table}`,
          });
          return {
            table,
            ok: false,
            status: mapped.status,
            error: mapped.body,
          };
        }

        return {
          table,
          ok: true,
          status: 200,
        };
      })
    );

    const failed = tableChecks.filter((check) => !check.ok);
    if (failed.length > 0) {
      return NextResponse.json(
        {
          status: "degraded",
          error:
            "One or more required Supabase tables are unavailable in the configured project.",
          supabase: {
            projectRefFromUrl: env.projectRefFromUrl,
            projectRefFromServiceKey: env.projectRefFromServiceKey,
          },
          checks: tableChecks,
          remediation:
            "Apply `supabase/migrations/001_initial_schema.sql` to the configured Supabase project and refresh PostgREST schema cache.",
          timestamp: new Date().toISOString(),
        },
        { status: 503 }
      );
    }

    return NextResponse.json({
      status: "ok",
      supabase: {
        projectRefFromUrl: env.projectRefFromUrl,
        projectRefFromServiceKey: env.projectRefFromServiceKey,
      },
      checks: tableChecks,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: "error",
        error: "Health check failed",
        details: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
