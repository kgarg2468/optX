import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { mapSupabaseError, type SupabaseErrorLike } from "@/lib/supabase/diagnostics";
import type { BusinessData, DataSource, IndustryType, BusinessSize } from "@/lib/types";

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

function toBusinessRow(businessData: Partial<BusinessData>) {
  return {
    user_id: DEFAULT_USER_ID,
    name: businessData.name?.trim() || "Untitled Business",
    industry: (businessData.industry || "other") as IndustryType,
    size: (businessData.size || "1-5") as BusinessSize,
    monthly_revenue: businessData.monthlyRevenue || [],
    expenses: businessData.expenses || [],
    cash_on_hand: businessData.cashOnHand || 0,
    outstanding_debt: businessData.outstandingDebt || 0,
    revenue_trend: businessData.revenueTrend || null,
    revenue_trend_rate: businessData.revenueTrendRate ?? null,
    customer_count: businessData.customerCount ?? null,
    avg_transaction_size: businessData.avgTransactionSize ?? null,
    gross_margin: businessData.grossMargin ?? null,
    seasonal_patterns: businessData.seasonalPatterns ?? null,
    planned_changes: businessData.plannedChanges ?? null,
    updated_at: new Date().toISOString(),
  };
}

function fromBusinessRow(row: Record<string, unknown>): Partial<BusinessData> {
  return {
    id: String(row.id),
    userId: String(row.user_id),
    name: String(row.name || ""),
    industry: (row.industry as IndustryType) || "other",
    size: (row.size as BusinessSize) || "1-5",
    monthlyRevenue: Array.isArray(row.monthly_revenue)
      ? (row.monthly_revenue as number[])
      : [],
    expenses: Array.isArray(row.expenses) ? (row.expenses as BusinessData["expenses"]) : [],
    cashOnHand: Number(row.cash_on_hand || 0),
    outstandingDebt: Number(row.outstanding_debt || 0),
    revenueTrend: (row.revenue_trend as BusinessData["revenueTrend"]) || undefined,
    revenueTrendRate:
      row.revenue_trend_rate === null || row.revenue_trend_rate === undefined
        ? undefined
        : Number(row.revenue_trend_rate),
    customerCount:
      row.customer_count === null || row.customer_count === undefined
        ? undefined
        : Number(row.customer_count),
    avgTransactionSize:
      row.avg_transaction_size === null || row.avg_transaction_size === undefined
        ? undefined
        : Number(row.avg_transaction_size),
    grossMargin:
      row.gross_margin === null || row.gross_margin === undefined
        ? undefined
        : Number(row.gross_margin),
    seasonalPatterns:
      (row.seasonal_patterns as BusinessData["seasonalPatterns"]) || undefined,
    plannedChanges: (row.planned_changes as string) || undefined,
    createdAt: String(row.created_at || new Date().toISOString()),
    updatedAt: String(row.updated_at || new Date().toISOString()),
  };
}

function toSourceRow(source: DataSource, businessId: string) {
  return {
    id: isValidUuid(source.id) ? source.id : crypto.randomUUID(),
    business_id: businessId,
    type: source.type,
    tier: source.tier,
    label: source.label,
    description: source.description || null,
    file_url: source.fileUrl || null,
    file_name: source.fileName || null,
    manual_data: source.manualData || null,
    nlp_description: source.nlpDescription || null,
    parsed_variables: source.parsedVariables || null,
    accuracy_impact: source.accuracyImpact ?? 0,
    uploaded_at: source.uploadedAt || new Date().toISOString(),
  };
}

function fromSourceRow(row: Record<string, unknown>): DataSource {
  return {
    id: String(row.id),
    businessId: String(row.business_id),
    type: row.type as DataSource["type"],
    tier: row.tier as DataSource["tier"],
    label: String(row.label || ""),
    description: String(row.description || ""),
    fileUrl: (row.file_url as string) || undefined,
    fileName: (row.file_name as string) || undefined,
    manualData: (row.manual_data as Record<string, unknown>) || undefined,
    nlpDescription: (row.nlp_description as string) || undefined,
    parsedVariables: row.parsed_variables as DataSource["parsedVariables"],
    accuracyImpact:
      row.accuracy_impact === null || row.accuracy_impact === undefined
        ? undefined
        : Number(row.accuracy_impact),
    uploadedAt: (row.uploaded_at as string) || undefined,
  };
}

// Save business data
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const businessData: Partial<BusinessData> = body.businessData ?? body;
    const dataSources: DataSource[] = Array.isArray(body.dataSources)
      ? body.dataSources
      : [];
    const incomingBusinessId =
      body.businessId ?? businessData.id ?? null;

    const supabase = createServerClient();

    const businessPayload = {
      ...(isValidUuid(incomingBusinessId) ? { id: incomingBusinessId } : {}),
      ...toBusinessRow(businessData),
    };

    const { data: savedBusiness, error: businessError } = await supabase
      .from("businesses")
      .upsert(businessPayload, { onConflict: "id" })
      .select("*")
      .single();

    if (businessError || !savedBusiness) {
      const mapped = mapSupabaseError(businessError as SupabaseErrorLike, {
        defaultMessage: "Failed to save business data",
      });
      return NextResponse.json(
        mapped.body,
        { status: mapped.status }
      );
    }

    const businessId = String(savedBusiness.id);

    if (dataSources.length > 0) {
      const sourceRows = dataSources.map((source) =>
        toSourceRow(source, businessId)
      );
      const { error: sourceUpsertError } = await supabase
        .from("data_sources")
        .upsert(sourceRows, { onConflict: "id" });

      if (sourceUpsertError) {
        const mapped = mapSupabaseError(sourceUpsertError as SupabaseErrorLike, {
          defaultMessage: "Failed to save data sources",
        });
        return NextResponse.json(
          mapped.body,
          { status: mapped.status }
        );
      }
    }

    const { data: persistedSources, error: sourcesError } = await supabase
      .from("data_sources")
      .select("*")
      .eq("business_id", businessId)
      .order("uploaded_at", { ascending: false });

    if (sourcesError) {
      const mapped = mapSupabaseError(sourcesError as SupabaseErrorLike, {
        defaultMessage: "Failed to load data sources",
      });
      return NextResponse.json(
        mapped.body,
        { status: mapped.status }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Business data saved",
      businessId,
      business: fromBusinessRow(savedBusiness),
      dataSources: (persistedSources || []).map((row) =>
        fromSourceRow(row as Record<string, unknown>)
      ),
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to save business data",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// Get business data
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const businessId = searchParams.get("businessId");

    if (!isValidUuid(businessId)) {
      return NextResponse.json(
        { error: "A valid businessId query parameter is required" },
        { status: 400 }
      );
    }

    const supabase = createServerClient();

    const { data: businessRow, error: businessError } = await supabase
      .from("businesses")
      .select("*")
      .eq("id", businessId)
      .single();

    if (businessError) {
      const mapped = mapSupabaseError(businessError as SupabaseErrorLike, {
        defaultMessage: "Failed to fetch business data",
        notFoundMessage: "Business not found",
      });
      return NextResponse.json(
        mapped.body,
        { status: mapped.status }
      );
    }

    const { data: sourceRows, error: sourceError } = await supabase
      .from("data_sources")
      .select("*")
      .eq("business_id", businessId)
      .order("uploaded_at", { ascending: false });

    if (sourceError) {
      const mapped = mapSupabaseError(sourceError as SupabaseErrorLike, {
        defaultMessage: "Failed to fetch business data sources",
      });
      return NextResponse.json(
        mapped.body,
        { status: mapped.status }
      );
    }

    return NextResponse.json({
      success: true,
      businessId,
      business: fromBusinessRow(businessRow as Record<string, unknown>),
      dataSources: (sourceRows || []).map((row) =>
        fromSourceRow(row as Record<string, unknown>)
      ),
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to fetch business data",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
