import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { mapSupabaseError, type SupabaseErrorLike } from "@/lib/supabase/diagnostics";
import {
    LUMINA_REPORT_ROWS,
    LUMINA_BUSINESS_ID,
} from "@/lib/seed/lumina-seed";

const PYTHON_API_URL = process.env.PYTHON_API_URL || "http://localhost:8000";

/**
 * GET /api/dashboard/report?businessId={id}  — list reports for a business
 * GET /api/dashboard/report?reportId={id}    — get single report detail
 */
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const reportId = searchParams.get("reportId");
        const businessId = searchParams.get("businessId");

        const supabase = createServerClient();

        // Single report by ID
        if (reportId) {
            // Check Lumina seed first (instant)
            const luminaReport = LUMINA_REPORT_ROWS.find((r) => r.id === reportId);
            if (luminaReport) {
                return NextResponse.json({ success: true, data: luminaReport });
            }

            const { data, error } = await supabase
                .from("reports")
                .select("*")
                .eq("id", reportId)
                .single();

            if (error || !data) {
                const mapped = mapSupabaseError(error as SupabaseErrorLike, {
                    defaultMessage: "Failed to fetch report",
                    notFoundMessage: "Report not found",
                });
                return NextResponse.json(mapped.body, { status: mapped.status });
            }

            return NextResponse.json({ success: true, data });
        }

        // List reports by business
        if (!businessId) {
            return NextResponse.json(
                { error: "Provide businessId or reportId query parameter" },
                { status: 400 }
            );
        }

        // For Lumina, return seed data (instant)
        if (businessId === LUMINA_BUSINESS_ID) {
            return NextResponse.json({
                success: true,
                data: LUMINA_REPORT_ROWS,
            });
        }

        const { data, error } = await supabase
            .from("reports")
            .select("*")
            .eq("business_id", businessId)
            .order("created_at", { ascending: false });

        if (error) {
            const mapped = mapSupabaseError(error as SupabaseErrorLike, {
                defaultMessage: "Failed to fetch reports",
            });
            return NextResponse.json(mapped.body, { status: mapped.status });
        }

        return NextResponse.json({ success: true, data: data || [] });
    } catch (error) {
        return NextResponse.json(
            {
                error: "Failed to fetch reports",
                details: error instanceof Error ? error.message : "Unknown error",
            },
            { status: 500 }
        );
    }
}

/**
 * POST /api/dashboard/report
 * Generate a new report from simulation results (AI + template hybrid)
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { businessId, simulationId, scenarioDetail } = body;

        if (!businessId || !simulationId) {
            return NextResponse.json(
                { error: "businessId and simulationId are required" },
                { status: 400 }
            );
        }

        const supabase = createServerClient();

        // Get simulation results
        const { data: simData, error: simError } = await supabase
            .from("simulation_results")
            .select("*")
            .eq("id", simulationId)
            .single();

        if (simError || !simData) {
            return NextResponse.json(
                { error: "Simulation not found" },
                { status: 404 }
            );
        }

        // Get business data
        const { data: bizData } = await supabase
            .from("businesses")
            .select("*")
            .eq("id", businessId)
            .single();

        // Call Python backend for AI-enhanced narrative
        let narrative = {
            executiveSummary: "Report generated from simulation results.",
            keyFindings: [] as string[],
            riskAssessment: "See financial details.",
            recommendations: [] as string[],
            fullNarrative: "",
        };

        try {
            const aiResponse = await fetch(`${PYTHON_API_URL}/generate-report`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    business_data: bizData || {},
                    simulation_data: simData,
                    scenario_detail: scenarioDetail || null,
                }),
            });

            if (aiResponse.ok) {
                const aiResult = await aiResponse.json();
                if (aiResult.narrative) {
                    narrative = aiResult.narrative;
                }
            }
        } catch {
            // AI enhancement failed — use template fallback (already set above)
        }

        // Build report row
        const reportRow = {
            simulation_id: simulationId,
            business_id: businessId,
            financial: {
                plProjections: [],
                cashFlowProjections: [],
                riskMatrix: [],
                sensitivityRanking: simData.sensitivity || [],
                backtestSummary: simData.backtest || {},
            },
            narrative,
        };

        const { data: report, error: reportError } = await supabase
            .from("reports")
            .insert(reportRow)
            .select("*")
            .single();

        if (reportError || !report) {
            const mapped = mapSupabaseError(reportError as SupabaseErrorLike, {
                defaultMessage: "Failed to create report",
            });
            return NextResponse.json(mapped.body, { status: mapped.status });
        }

        return NextResponse.json({
            success: true,
            data: report,
        });
    } catch (error) {
        return NextResponse.json(
            {
                error: "Failed to generate report",
                details: error instanceof Error ? error.message : "Unknown error",
            },
            { status: 500 }
        );
    }
}
