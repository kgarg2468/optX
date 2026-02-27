import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import {
    LUMINA_BUSINESS_ID,
    LUMINA_BUSINESS,
    LUMINA_DATA_SOURCES,
    LUMINA_SCENARIO_ROWS,
    LUMINA_SIMULATION_ROWS,
    LUMINA_REPORT_ROWS,
} from "@/lib/seed/lumina-seed";

/**
 * POST /api/seed
 * Idempotently seeds the Lumina Beauty Co. demo project into Supabase.
 * Called once on app boot from a client-side hook.
 */
export async function POST() {
    try {
        const supabase = createServerClient();

        // Check if already seeded
        const { data: existing } = await supabase
            .from("businesses")
            .select("id")
            .eq("id", LUMINA_BUSINESS_ID)
            .maybeSingle();

        if (existing) {
            return NextResponse.json({
                success: true,
                seeded: false,
                message: "Lumina Beauty Co. already exists",
            });
        }

        // Seed business
        const { error: bizError } = await supabase
            .from("businesses")
            .upsert(LUMINA_BUSINESS, { onConflict: "id" });

        if (bizError) {
            throw new Error(`Business seed failed: ${bizError.message}`);
        }

        // Seed data sources
        const { error: dsError } = await supabase
            .from("data_sources")
            .upsert(LUMINA_DATA_SOURCES, { onConflict: "id" });

        if (dsError) {
            throw new Error(`Data sources seed failed: ${dsError.message}`);
        }

        // Seed scenarios
        const { error: scError } = await supabase
            .from("scenarios")
            .upsert(LUMINA_SCENARIO_ROWS, { onConflict: "id" });

        if (scError) {
            throw new Error(`Scenarios seed failed: ${scError.message}`);
        }

        // Seed simulation results
        const { error: simError } = await supabase
            .from("simulation_results")
            .upsert(LUMINA_SIMULATION_ROWS, { onConflict: "id" });

        if (simError) {
            throw new Error(`Simulation results seed failed: ${simError.message}`);
        }

        // Seed reports (strip scenario_detail before insert)
        const reportRows = LUMINA_REPORT_ROWS.map(({ scenario_detail: _sd, ...rest }) => rest);
        const { error: rptError } = await supabase
            .from("reports")
            .upsert(reportRows, { onConflict: "id" });

        if (rptError) {
            throw new Error(`Reports seed failed: ${rptError.message}`);
        }

        return NextResponse.json({
            success: true,
            seeded: true,
            message: "Lumina Beauty Co. seeded successfully",
        });
    } catch (error) {
        return NextResponse.json(
            {
                error: "Seed failed",
                details: error instanceof Error ? error.message : "Unknown error",
            },
            { status: 500 }
        );
    }
}
