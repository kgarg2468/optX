/**
 * Lumina Beauty Co. — Pre-seeded demo project
 *
 * Fixed UUIDs ensure the seed is idempotent (upsert by id).
 * All data mirrors the original mock data from simulation-scenarios.ts
 * and report-data.ts but structured for Supabase persistence.
 */

import type { ScenarioDetail } from "@/lib/types";

// ── Fixed UUIDs ────────────────────────────────────────────────
export const LUMINA_BUSINESS_ID = "00000000-0000-4000-a000-000000000001";
export const LUMINA_USER_ID = "00000000-0000-0000-0000-000000000000";

export const LUMINA_SCENARIO_IDS = {
    aggressiveGrowth: "00000000-0000-4000-a000-000000000010",
    leanOps: "00000000-0000-4000-a000-000000000011",
    multiChannel: "00000000-0000-4000-a000-000000000012",
    conservative: "00000000-0000-4000-a000-000000000013",
} as const;

export const LUMINA_SIMULATION_IDS = {
    aggressiveGrowth: "00000000-0000-4000-a000-000000000020",
    leanOps: "00000000-0000-4000-a000-000000000021",
    multiChannel: "00000000-0000-4000-a000-000000000022",
    conservative: "00000000-0000-4000-a000-000000000023",
} as const;

export const LUMINA_REPORT_IDS = {
    aggressiveGrowth: "00000000-0000-4000-a000-000000000030",
    leanOps: "00000000-0000-4000-a000-000000000031",
    multiChannel: "00000000-0000-4000-a000-000000000032",
    conservative: "00000000-0000-4000-a000-000000000033",
} as const;

// ── Sparkline helper ───────────────────────────────────────────
const baseRevenue = [200, 205, 210, 208, 215, 220, 225, 230, 228, 235, 240, 245];
function growSparkline(growthRate: number) {
    return baseRevenue.map((v, i) => ({
        month: i + 1,
        revenue: Math.round(v * (1 + growthRate * ((i + 1) / 12))),
    }));
}

// ── Business Row ───────────────────────────────────────────────
export const LUMINA_BUSINESS = {
    id: LUMINA_BUSINESS_ID,
    user_id: LUMINA_USER_ID,
    name: "Lumina Beauty Co.",
    industry: "retail",
    size: "6-20",
    monthly_revenue: [200000, 205000, 210000, 208000, 215000, 220000, 225000, 230000, 228000, 235000, 240000, 245000],
    expenses: [
        { id: "exp-1", name: "COGS", amount: 74000, isRecurring: true },
        { id: "exp-2", name: "Marketing & Ads", amount: 45000, isRecurring: true },
        { id: "exp-3", name: "Payroll", amount: 35000, isRecurring: true },
        { id: "exp-4", name: "Fulfillment & Shipping", amount: 18000, isRecurring: true },
        { id: "exp-5", name: "SaaS & Tools", amount: 5000, isRecurring: true },
        { id: "exp-6", name: "Rent & Overhead", amount: 8000, isRecurring: true },
    ],
    cash_on_hand: 320000,
    outstanding_debt: 85000,
    revenue_trend: "growing",
    revenue_trend_rate: 0.12,
    customer_count: 14400,
    avg_transaction_size: 62,
    gross_margin: 0.63,
};

// ── Data Sources ───────────────────────────────────────────────
export const LUMINA_DATA_SOURCES = [
    {
        id: "00000000-0000-4000-a000-000000000040",
        business_id: LUMINA_BUSINESS_ID,
        type: "income_statement",
        tier: "core",
        label: "Income Statement",
        description: "12 months of revenue and expense data",
        accuracy_impact: 22,
        uploaded_at: "2025-12-15T00:00:00Z",
    },
    {
        id: "00000000-0000-4000-a000-000000000041",
        business_id: LUMINA_BUSINESS_ID,
        type: "balance_sheet",
        tier: "core",
        label: "Balance Sheet",
        description: "Current assets, liabilities, and equity",
        accuracy_impact: 20,
        uploaded_at: "2025-12-15T00:00:00Z",
    },
    {
        id: "00000000-0000-4000-a000-000000000042",
        business_id: LUMINA_BUSINESS_ID,
        type: "cash_flow",
        tier: "core",
        label: "Cash Flow Statement",
        description: "Operating and financing cash flows",
        accuracy_impact: 18,
        uploaded_at: "2025-12-15T00:00:00Z",
    },
    {
        id: "00000000-0000-4000-a000-000000000043",
        business_id: LUMINA_BUSINESS_ID,
        type: "marketing",
        tier: "contextual",
        label: "Marketing Data",
        description: "CAC $42, ad spend $45K/mo, 3.2% conversion rate",
        accuracy_impact: 8,
        uploaded_at: "2025-12-16T00:00:00Z",
    },
    {
        id: "00000000-0000-4000-a000-000000000044",
        business_id: LUMINA_BUSINESS_ID,
        type: "supply_chain",
        tier: "contextual",
        label: "Supply Chain",
        description: "COGS $18.50/unit, $38/unit supplier cost, manual fulfillment",
        accuracy_impact: 10,
        uploaded_at: "2025-12-16T00:00:00Z",
    },
];

// ── Scenarios (ScenarioDetail format) ──────────────────────────

export const LUMINA_SCENARIOS: ScenarioDetail[] = [
    {
        id: LUMINA_SCENARIO_IDS.aggressiveGrowth,
        title: "Aggressive Growth Play",
        tag: "Most Recommended",
        description: "Scale paid acquisition and optimize conversion funnels to accelerate top-line growth. Higher spend, higher revenue — with controlled margin compression.",
        recommended: true,
        revenueImpact: "+23.5%",
        costImpact: "+40%",
        confidence: 87,
        timeToImpact: "3-6 months",
        riskLevel: "Medium",
        netProfitImpact: "+$56K/yr",
        keyMetrics: [
            { label: "Revenue", value: "$2.96M", delta: "+23.5%", positive: true },
            { label: "New Customers", value: "2,050/mo", delta: "+71%", positive: true },
            { label: "Net Margin", value: "15.2%", delta: "-2.8pp", positive: false },
        ],
        sparkline: growSparkline(0.235),
        nodes: [
            { id: "ag-1", label: "Ad Spend Increase", category: "market", currentValue: "$45K/mo", proposedValue: "$78K/mo", delta: "+73%", impact: "Primary growth driver through paid acquisition", position: { x: 0, y: 100 } },
            { id: "ag-2", label: "Customer Acquisition", category: "market", currentValue: "1,200/mo", proposedValue: "2,050/mo", delta: "+71%", impact: "New customers driven by increased ad spend", position: { x: 300, y: 0 } },
            { id: "ag-3", label: "Brand Awareness", category: "brand", currentValue: "12%", proposedValue: "19%", delta: "+58%", impact: "Organic lift from paid campaigns", position: { x: 300, y: 200 } },
            { id: "ag-4", label: "Conversion Rate", category: "metric", currentValue: "3.2%", proposedValue: "3.8%", delta: "+19%", impact: "Landing page optimization + social proof", position: { x: 600, y: 0 } },
            { id: "ag-5", label: "Average Order Value", category: "financial", currentValue: "$62", proposedValue: "$68", delta: "+10%", impact: "Bundle offers and upsell flows", position: { x: 600, y: 200 } },
            { id: "ag-6", label: "Monthly Revenue", category: "financial", currentValue: "$200K", proposedValue: "$247K", delta: "+23.5%", impact: "Combined effect of acquisition and AOV growth", position: { x: 900, y: 50 } },
            { id: "ag-7", label: "Customer LTV", category: "metric", currentValue: "$185", proposedValue: "$210", delta: "+14%", impact: "Higher AOV improves lifetime value", position: { x: 900, y: 200 } },
            { id: "ag-8", label: "Net Profit Margin", category: "financial", currentValue: "18%", proposedValue: "15.2%", delta: "-2.8pp", impact: "Margin compression from higher ad spend", position: { x: 1200, y: 100 } },
        ],
        edges: [
            { id: "ae-1", source: "ag-1", target: "ag-2", strength: 0.9, label: "drives" },
            { id: "ae-2", source: "ag-1", target: "ag-3", strength: 0.6, label: "boosts" },
            { id: "ae-3", source: "ag-2", target: "ag-4", strength: 0.7 },
            { id: "ae-4", source: "ag-3", target: "ag-4", strength: 0.4 },
            { id: "ae-5", source: "ag-4", target: "ag-6", strength: 0.85 },
            { id: "ae-6", source: "ag-5", target: "ag-6", strength: 0.75 },
            { id: "ae-7", source: "ag-5", target: "ag-7", strength: 0.8 },
            { id: "ae-8", source: "ag-6", target: "ag-8", strength: 0.9 },
            { id: "ae-9", source: "ag-1", target: "ag-8", strength: 0.7 },
        ],
    },
    {
        id: LUMINA_SCENARIO_IDS.leanOps,
        title: "Lean Operations Overhaul",
        tag: "Best for Profitability",
        description: "Renegotiate supply chain, automate fulfillment, and cut operating costs by 30%. Modest revenue growth but dramatic margin expansion.",
        recommended: false,
        revenueImpact: "+8%",
        costImpact: "-30%",
        confidence: 92,
        timeToImpact: "4-8 months",
        riskLevel: "Low",
        netProfitImpact: "+$180K/yr",
        keyMetrics: [
            { label: "Gross Margin", value: "71%", delta: "+9pp", positive: true },
            { label: "OpEx", value: "$59.5K/mo", delta: "-30%", positive: true },
            { label: "Net Margin", value: "28.5%", delta: "+10.5pp", positive: true },
        ],
        sparkline: growSparkline(0.08),
        nodes: [
            { id: "lo-1", label: "Supply Chain Renegotiation", category: "operations", currentValue: "$38/unit", proposedValue: "$29/unit", delta: "-24%", impact: "Consolidate suppliers, negotiate volume discounts", position: { x: 0, y: 0 } },
            { id: "lo-2", label: "Warehouse Automation", category: "operations", currentValue: "Manual", proposedValue: "Semi-Auto", delta: "Upgrade", impact: "Reduce fulfillment labor by 40%", position: { x: 0, y: 200 } },
            { id: "lo-3", label: "COGS per Unit", category: "financial", currentValue: "$18.50", proposedValue: "$13.20", delta: "-29%", impact: "Direct cost savings from supply chain + automation", position: { x: 300, y: 0 } },
            { id: "lo-4", label: "Fulfillment Cost", category: "financial", currentValue: "$8.20/order", proposedValue: "$5.10/order", delta: "-38%", impact: "Automation reduces per-order handling cost", position: { x: 300, y: 200 } },
            { id: "lo-5", label: "Gross Margin", category: "metric", currentValue: "62%", proposedValue: "71%", delta: "+9pp", impact: "Significant margin expansion from cost reduction", position: { x: 600, y: 50 } },
            { id: "lo-6", label: "Order Accuracy", category: "operations", currentValue: "96.5%", proposedValue: "99.1%", delta: "+2.6pp", impact: "Automation reduces human error in fulfillment", position: { x: 600, y: 250 } },
            { id: "lo-7", label: "Customer Satisfaction", category: "brand", currentValue: "4.2/5", proposedValue: "4.5/5", delta: "+7%", impact: "Faster shipping and fewer errors boost reviews", position: { x: 900, y: 200 } },
            { id: "lo-8", label: "Monthly Revenue", category: "financial", currentValue: "$200K", proposedValue: "$216K", delta: "+8%", impact: "Modest revenue lift from improved satisfaction", position: { x: 900, y: 0 } },
            { id: "lo-9", label: "Operating Expenses", category: "financial", currentValue: "$85K/mo", proposedValue: "$59.5K/mo", delta: "-30%", impact: "Major opex reduction from automation + efficiency", position: { x: 1200, y: 0 } },
            { id: "lo-10", label: "Net Profit Margin", category: "metric", currentValue: "18%", proposedValue: "28.5%", delta: "+10.5pp", impact: "Dramatic profitability improvement", position: { x: 1200, y: 200 } },
        ],
        edges: [
            { id: "le-1", source: "lo-1", target: "lo-3", strength: 0.95 },
            { id: "le-2", source: "lo-2", target: "lo-4", strength: 0.9 },
            { id: "le-3", source: "lo-3", target: "lo-5", strength: 0.85 },
            { id: "le-4", source: "lo-4", target: "lo-5", strength: 0.7 },
            { id: "le-5", source: "lo-2", target: "lo-6", strength: 0.8 },
            { id: "le-6", source: "lo-6", target: "lo-7", strength: 0.65 },
            { id: "le-7", source: "lo-7", target: "lo-8", strength: 0.4 },
            { id: "le-8", source: "lo-5", target: "lo-10", strength: 0.9 },
            { id: "le-9", source: "lo-8", target: "lo-10", strength: 0.6 },
            { id: "le-10", source: "lo-4", target: "lo-9", strength: 0.85 },
            { id: "le-11", source: "lo-9", target: "lo-10", strength: 0.8 },
        ],
    },
    {
        id: LUMINA_SCENARIO_IDS.multiChannel,
        title: "Multi-Channel Expansion",
        tag: "Highest Revenue Potential",
        description: "Launch on Amazon and secure retail partnerships with Sephora and Ulta. Maximum top-line growth with increased operational complexity.",
        recommended: false,
        revenueImpact: "+45%",
        costImpact: "+47%",
        confidence: 71,
        timeToImpact: "6-12 months",
        riskLevel: "High",
        netProfitImpact: "+$42K/yr",
        keyMetrics: [
            { label: "Total Revenue", value: "$3.48M", delta: "+45%", positive: true },
            { label: "Channels", value: "3", delta: "+2 new", positive: true },
            { label: "Net Margin", value: "14.8%", delta: "-3.2pp", positive: false },
        ],
        sparkline: growSparkline(0.45),
        nodes: [
            { id: "mc-1", label: "Amazon Launch", category: "market", currentValue: "N/A", proposedValue: "Live", delta: "New", impact: "Launch 12 SKUs on Amazon marketplace", position: { x: 0, y: 0 } },
            { id: "mc-2", label: "Retail Partnerships", category: "market", currentValue: "0 stores", proposedValue: "180 stores", delta: "New", impact: "Sephora + Ulta placement in select locations", position: { x: 0, y: 200 } },
            { id: "mc-3", label: "Amazon Revenue", category: "financial", currentValue: "$0", proposedValue: "$52K/mo", delta: "+$52K", impact: "Projected marketplace revenue within 6 months", position: { x: 300, y: 0 } },
            { id: "mc-4", label: "Retail Revenue", category: "financial", currentValue: "$0", proposedValue: "$38K/mo", delta: "+$38K", impact: "Wholesale revenue from retail partners", position: { x: 300, y: 200 } },
            { id: "mc-5", label: "DTC Cannibalization", category: "market", currentValue: "0%", proposedValue: "-8%", delta: "-8%", impact: "Some DTC customers shift to Amazon/retail", position: { x: 300, y: 400 } },
            { id: "mc-6", label: "Brand Visibility", category: "brand", currentValue: "Online only", proposedValue: "Omnichannel", delta: "+3x reach", impact: "Physical presence drives organic awareness", position: { x: 600, y: 100 } },
            { id: "mc-7", label: "Inventory Complexity", category: "operations", currentValue: "1 channel", proposedValue: "3 channels", delta: "+200%", impact: "Multi-channel fulfillment requires new systems", position: { x: 600, y: 300 } },
            { id: "mc-8", label: "Total Revenue", category: "financial", currentValue: "$200K/mo", proposedValue: "$290K/mo", delta: "+45%", impact: "Combined revenue across all channels", position: { x: 900, y: 50 } },
            { id: "mc-9", label: "Operating Costs", category: "financial", currentValue: "$85K/mo", proposedValue: "$125K/mo", delta: "+47%", impact: "New channel operations, staff, inventory systems", position: { x: 900, y: 250 } },
            { id: "mc-10", label: "Net Profit Margin", category: "metric", currentValue: "18%", proposedValue: "14.8%", delta: "-3.2pp", impact: "Growth-stage margin compression expected", position: { x: 1200, y: 150 } },
        ],
        edges: [
            { id: "me-1", source: "mc-1", target: "mc-3", strength: 0.9 },
            { id: "me-2", source: "mc-2", target: "mc-4", strength: 0.85 },
            { id: "me-3", source: "mc-1", target: "mc-5", strength: 0.5 },
            { id: "me-4", source: "mc-2", target: "mc-5", strength: 0.4 },
            { id: "me-5", source: "mc-1", target: "mc-6", strength: 0.6 },
            { id: "me-6", source: "mc-2", target: "mc-6", strength: 0.75 },
            { id: "me-7", source: "mc-1", target: "mc-7", strength: 0.7 },
            { id: "me-8", source: "mc-2", target: "mc-7", strength: 0.65 },
            { id: "me-9", source: "mc-3", target: "mc-8", strength: 0.85 },
            { id: "me-10", source: "mc-4", target: "mc-8", strength: 0.8 },
            { id: "me-11", source: "mc-5", target: "mc-8", strength: 0.35 },
            { id: "me-12", source: "mc-7", target: "mc-9", strength: 0.8 },
            { id: "me-13", source: "mc-8", target: "mc-10", strength: 0.9 },
            { id: "me-14", source: "mc-9", target: "mc-10", strength: 0.85 },
        ],
    },
    {
        id: LUMINA_SCENARIO_IDS.conservative,
        title: "Conservative Stability",
        tag: "Lowest Risk",
        description: "Focus on retention marketing and price optimization. Steady, predictable growth with minimal execution risk and improved unit economics.",
        recommended: false,
        revenueImpact: "+6%",
        costImpact: "-10%",
        confidence: 95,
        timeToImpact: "1-3 months",
        riskLevel: "Low",
        netProfitImpact: "+$84K/yr",
        keyMetrics: [
            { label: "Retention", value: "42%", delta: "+8pp", positive: true },
            { label: "LTV", value: "$218", delta: "+18%", positive: true },
            { label: "Net Margin", value: "21.5%", delta: "+3.5pp", positive: true },
        ],
        sparkline: growSparkline(0.06),
        nodes: [
            { id: "cs-1", label: "Email Retention Program", category: "brand", currentValue: "Basic", proposedValue: "Advanced", delta: "Upgrade", impact: "Segmented flows, loyalty rewards, win-back campaigns", position: { x: 0, y: 0 } },
            { id: "cs-2", label: "Price Optimization", category: "financial", currentValue: "Fixed pricing", proposedValue: "Dynamic", delta: "Upgrade", impact: "A/B test pricing tiers for margin optimization", position: { x: 0, y: 200 } },
            { id: "cs-3", label: "Retention Rate", category: "metric", currentValue: "34%", proposedValue: "42%", delta: "+8pp", impact: "Email automation improves repeat purchase rate", position: { x: 300, y: 0 } },
            { id: "cs-4", label: "Average Order Value", category: "financial", currentValue: "$62", proposedValue: "$66", delta: "+6.5%", impact: "Dynamic pricing finds optimal price points", position: { x: 300, y: 200 } },
            { id: "cs-5", label: "Customer LTV", category: "metric", currentValue: "$185", proposedValue: "$218", delta: "+18%", impact: "Higher retention × higher AOV = stronger LTV", position: { x: 600, y: 100 } },
            { id: "cs-6", label: "Monthly Revenue", category: "financial", currentValue: "$200K", proposedValue: "$212K", delta: "+6%", impact: "Steady growth from existing customer base", position: { x: 900, y: 0 } },
            { id: "cs-7", label: "Marketing Efficiency", category: "market", currentValue: "CAC $42", proposedValue: "CAC $38", delta: "-10%", impact: "Better retention reduces acquisition pressure", position: { x: 900, y: 200 } },
            { id: "cs-8", label: "Net Profit Margin", category: "financial", currentValue: "18%", proposedValue: "21.5%", delta: "+3.5pp", impact: "Efficient growth improves bottom line", position: { x: 1200, y: 100 } },
        ],
        edges: [
            { id: "ce-1", source: "cs-1", target: "cs-3", strength: 0.85 },
            { id: "ce-2", source: "cs-2", target: "cs-4", strength: 0.75 },
            { id: "ce-3", source: "cs-3", target: "cs-5", strength: 0.9 },
            { id: "ce-4", source: "cs-4", target: "cs-5", strength: 0.7 },
            { id: "ce-5", source: "cs-5", target: "cs-6", strength: 0.8 },
            { id: "ce-6", source: "cs-3", target: "cs-7", strength: 0.6 },
            { id: "ce-7", source: "cs-6", target: "cs-8", strength: 0.85 },
            { id: "ce-8", source: "cs-7", target: "cs-8", strength: 0.5 },
        ],
    },
];

// ── Helper: build scenario DB row from ScenarioDetail ──────────
function toScenarioRow(s: ScenarioDetail) {
    return {
        id: s.id,
        business_id: LUMINA_BUSINESS_ID,
        name: s.title,
        description: s.description,
        variables: [],
        graph_state: {
            nodes: s.nodes.map((n) => ({
                id: n.id,
                type: n.category,
                position: n.position,
                data: {
                    label: n.label,
                    type: n.category,
                    value: 0,
                    unit: "",
                },
            })),
            edges: s.edges.map((e) => ({
                id: e.id,
                source: e.source,
                target: e.target,
                label: e.label,
                animated: e.strength > 0.7,
            })),
        },
    };
}

export const LUMINA_SCENARIO_ROWS = LUMINA_SCENARIOS.map(toScenarioRow);

// ── Scenario metadata (stored alongside simulation results) ────
// This maps scenario IDs to their rich detail for fast client lookup
export const LUMINA_SCENARIO_DETAIL_MAP: Record<string, ScenarioDetail> = {};
for (const s of LUMINA_SCENARIOS) {
    LUMINA_SCENARIO_DETAIL_MAP[s.id] = s;
}

// ── Simulation result rows ─────────────────────────────────────
// Pre-computed stub results (the real pipeline output format)
function buildSimulationRow(scenarioKey: keyof typeof LUMINA_SCENARIO_IDS, s: ScenarioDetail) {
    return {
        id: LUMINA_SIMULATION_IDS[scenarioKey],
        business_id: LUMINA_BUSINESS_ID,
        scenario_id: LUMINA_SCENARIO_IDS[scenarioKey],
        config: { iterations: 10000, timeHorizonMonths: 12, confidenceLevel: 0.95 },
        status: "complete",
        monte_carlo: s.nodes
            .filter((n) => n.category === "financial" || n.category === "metric")
            .map((n) => ({
                variable: n.label,
                mean: parseFloat(n.proposedValue.replace(/[^0-9.-]/g, "")) || 0,
                median: parseFloat(n.proposedValue.replace(/[^0-9.-]/g, "")) || 0,
                std: 0,
                percentiles: { "5": 0, "25": 0, "50": 0, "75": 0, "95": 0 },
                distribution: [],
                timeSeriesProjection: [],
            })),
        bayesian_network: {
            nodes: s.nodes.map((n) => n.label),
            edges: s.edges.map((e) => ({
                from: s.nodes.find((n) => n.id === e.source)?.label || e.source,
                to: s.nodes.find((n) => n.id === e.target)?.label || e.target,
                strength: e.strength,
                description: e.label || "causal link",
            })),
            posteriors: {},
        },
        sensitivity: s.nodes
            .filter((n) => n.category === "financial" || n.category === "metric")
            .map((n, i) => ({
                variable: n.label,
                sobolIndex: Math.max(0.1, 1 - i * 0.15),
                totalSobolIndex: Math.max(0.15, 1 - i * 0.12),
                morrisScreening: Math.max(0.05, 1 - i * 0.18),
                rank: i + 1,
            })),
        backtest: {
            accuracy: s.confidence / 100,
            brierScore: (100 - s.confidence) / 100 * 0.3,
            calibrationData: [],
            ensembleDisagreement: (100 - s.confidence) / 100 * 0.15,
            walkForwardResults: [],
        },
        agent_analysis: {
            individualAnalyses: [],
            debateRounds: [],
            convergenceScore: s.confidence / 100,
            unifiedFindings: [],
            recommendations: [s.description],
        },
        completed_at: "2025-12-20T00:00:00Z",
    };
}

export const LUMINA_SIMULATION_ROWS = [
    buildSimulationRow("aggressiveGrowth", LUMINA_SCENARIOS[0]),
    buildSimulationRow("leanOps", LUMINA_SCENARIOS[1]),
    buildSimulationRow("multiChannel", LUMINA_SCENARIOS[2]),
    buildSimulationRow("conservative", LUMINA_SCENARIOS[3]),
];

// ── Report rows ────────────────────────────────────────────────
function buildReportRow(scenarioKey: keyof typeof LUMINA_SCENARIO_IDS, s: ScenarioDetail) {
    const financially = s.nodes.filter((n) => n.category === "financial");
    const metrics = s.nodes.filter((n) => n.category === "metric");

    return {
        id: LUMINA_REPORT_IDS[scenarioKey],
        simulation_id: LUMINA_SIMULATION_IDS[scenarioKey],
        business_id: LUMINA_BUSINESS_ID,
        financial: {
            plProjections: [],
            cashFlowProjections: [],
            riskMatrix: [
                { risk: "Execution Complexity", likelihood: s.riskLevel === "High" ? 4 : 2, impact: 3, category: "operational", mitigation: "Phased rollout" },
                { risk: "Market Response", likelihood: s.confidence < 80 ? 4 : 2, impact: 4, category: "market", mitigation: "2-4 week feedback loops" },
                { risk: "Cash Flow Timing", likelihood: s.costImpact.includes("+") ? 3 : 1, impact: 3, category: "financial", mitigation: "Working capital buffer" },
            ],
            sensitivityRanking: [],
            backtestSummary: { accuracy: s.confidence / 100, brierScore: 0.1, calibrationData: [], ensembleDisagreement: 0.05, walkForwardResults: [] },
        },
        narrative: {
            executiveSummary: `${s.title} — ${s.description}`,
            keyFindings: s.keyMetrics.map((m) => `${m.label}: ${m.value} (${m.delta})`),
            riskAssessment: `Risk level: ${s.riskLevel}. Confidence: ${s.confidence}%. Time to impact: ${s.timeToImpact}.`,
            recommendations: [`Recommended action: ${s.title}`, `Expected net profit impact: ${s.netProfitImpact}`],
            fullNarrative: `This report analyzes the "${s.title}" scenario for Lumina Beauty Co. The scenario proposes ${s.description.charAt(0).toLowerCase() + s.description.slice(1)} With a confidence level of ${s.confidence}% and a ${s.riskLevel.toLowerCase()} risk profile, this scenario projects a revenue impact of ${s.revenueImpact} and a cost impact of ${s.costImpact}. The net profit impact is estimated at ${s.netProfitImpact} over the projection window of ${s.timeToImpact}.`,
        },
        // Extra metadata for the report list/detail views
        scenario_detail: s,
    };
}

export const LUMINA_REPORT_ROWS = [
    buildReportRow("aggressiveGrowth", LUMINA_SCENARIOS[0]),
    buildReportRow("leanOps", LUMINA_SCENARIOS[1]),
    buildReportRow("multiChannel", LUMINA_SCENARIOS[2]),
    buildReportRow("conservative", LUMINA_SCENARIOS[3]),
];
