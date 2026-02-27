import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { mapSupabaseError, type SupabaseErrorLike } from "@/lib/supabase/diagnostics";

const PYTHON_API_URL = process.env.PYTHON_API_URL || "http://localhost:8000";

/**
 * POST /api/scenario/generate
 * AI-powered scenario generation: sends business data to Python backend,
 * which uses OpenAI to generate 3-4 strategic scenarios with causal nodes + edges.
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { businessId, prompt } = body;

        if (!businessId) {
            return NextResponse.json(
                { error: "businessId is required" },
                { status: 400 }
            );
        }

        const supabase = createServerClient();

        // Get business data
        const { data: bizData, error: bizError } = await supabase
            .from("businesses")
            .select("*")
            .eq("id", businessId)
            .single();

        if (bizError || !bizData) {
            const mapped = mapSupabaseError(bizError as SupabaseErrorLike, {
                defaultMessage: "Failed to load business data",
                notFoundMessage: "Business not found",
            });
            return NextResponse.json(mapped.body, { status: mapped.status });
        }

        // Get data sources for additional context
        const { data: dataSources } = await supabase
            .from("data_sources")
            .select("type, label, description, nlp_description")
            .eq("business_id", businessId);

        // Call Python backend for AI scenario generation
        const response = await fetch(`${PYTHON_API_URL}/generate-scenarios`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                business_data: {
                    name: bizData.name,
                    industry: bizData.industry,
                    size: bizData.size,
                    monthly_revenue: bizData.monthly_revenue || [],
                    expenses: bizData.expenses || [],
                    cash_on_hand: Number(bizData.cash_on_hand || 0),
                    outstanding_debt: Number(bizData.outstanding_debt || 0),
                    revenue_trend: bizData.revenue_trend,
                    customer_count: bizData.customer_count,
                    avg_transaction_size: bizData.avg_transaction_size,
                    gross_margin: bizData.gross_margin,
                },
                data_sources: dataSources || [],
                prompt: prompt || null,
            }),
        });

        const responseText = await response.text();
        if (!response.ok) {
            return NextResponse.json(
                { error: `Scenario generation failed: ${responseText}` },
                { status: response.status }
            );
        }

        const result = JSON.parse(responseText) as Record<string, unknown>;
        const scenarios = Array.isArray(result.scenarios) ? result.scenarios : [];

        // Persist each generated scenario to Supabase
        const savedScenarios = [];
        for (const scenario of scenarios) {
            const scenarioRow = {
                business_id: businessId,
                name: scenario.title || "Untitled Scenario",
                description: scenario.description || "",
                variables: [],
                graph_state: {
                    nodes: (scenario.nodes || []).map((n: Record<string, unknown>) => ({
                        id: n.id,
                        type: n.category,
                        position: n.position,
                        data: { label: n.label, type: n.category },
                    })),
                    edges: (scenario.edges || []).map((e: Record<string, unknown>) => ({
                        id: e.id,
                        source: e.source,
                        target: e.target,
                        label: e.label,
                    })),
                },
            };

            const { data: saved, error: saveError } = await supabase
                .from("scenarios")
                .insert(scenarioRow)
                .select("*")
                .single();

            if (!saveError && saved) {
                savedScenarios.push({
                    ...scenario,
                    id: saved.id,
                    dbRow: saved,
                });
            }
        }

        return NextResponse.json({
            success: true,
            scenarios: savedScenarios,
            count: savedScenarios.length,
        });
    } catch (error) {
        return NextResponse.json(
            {
                error: "Failed to generate scenarios",
                details: error instanceof Error ? error.message : "Unknown error",
            },
            { status: 500 }
        );
    }
}
