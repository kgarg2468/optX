import type { GraphNodeType } from "@/lib/types";

// ── Types ──────────────────────────────────────────────────────

export interface MockSparkPoint {
  month: number;
  revenue: number;
}

export interface MockKeyMetric {
  label: string;
  value: string;
  delta: string; // e.g. "+23.5%"
  positive: boolean;
}

export interface MockCausalNode {
  id: string;
  label: string;
  category: GraphNodeType;
  currentValue: string;
  proposedValue: string;
  delta: string;
  impact: string; // short description
  position: { x: number; y: number };
}

export interface MockCausalEdge {
  id: string;
  source: string;
  target: string;
  strength: number; // 0-1, used for thickness & animation
  label?: string;
}

export interface MockScenarioCard {
  id: string;
  title: string;
  tag: string;
  description: string;
  recommended: boolean;
  revenueImpact: string;
  costImpact: string;
  confidence: number; // 0-100
  timeToImpact: string;
  riskLevel: "Low" | "Medium" | "High";
  keyMetrics: MockKeyMetric[];
  sparkline: MockSparkPoint[];
}

export interface MockScenarioDetail extends MockScenarioCard {
  nodes: MockCausalNode[];
  edges: MockCausalEdge[];
  netProfitImpact: string;
}

// ── Constants ──────────────────────────────────────────────────

export const MOCK_BUSINESS_NAME = "Lumina Beauty Co.";
export const MOCK_BUSINESS_TAGLINE = "DTC Skincare · $2.4M ARR";

// ── Sparkline helpers ──────────────────────────────────────────

const baseRevenue = [200, 205, 210, 208, 215, 220, 225, 230, 228, 235, 240, 245]; // $K/mo

function growSparkline(base: number[], growthRate: number): MockSparkPoint[] {
  return base.map((v, i) => ({
    month: i + 1,
    revenue: Math.round(v * (1 + growthRate * ((i + 1) / 12))),
  }));
}

// ── Scenario 1: Aggressive Growth Play ─────────────────────────

const aggressiveGrowthNodes: MockCausalNode[] = [
  {
    id: "ag-1",
    label: "Ad Spend Increase",
    category: "market",
    currentValue: "$45K/mo",
    proposedValue: "$78K/mo",
    delta: "+73%",
    impact: "Primary growth driver through paid acquisition",
    position: { x: 0, y: 100 },
  },
  {
    id: "ag-2",
    label: "Customer Acquisition",
    category: "market",
    currentValue: "1,200/mo",
    proposedValue: "2,050/mo",
    delta: "+71%",
    impact: "New customers driven by increased ad spend",
    position: { x: 300, y: 0 },
  },
  {
    id: "ag-3",
    label: "Brand Awareness",
    category: "brand",
    currentValue: "12%",
    proposedValue: "19%",
    delta: "+58%",
    impact: "Organic lift from paid campaigns",
    position: { x: 300, y: 200 },
  },
  {
    id: "ag-4",
    label: "Conversion Rate",
    category: "metric",
    currentValue: "3.2%",
    proposedValue: "3.8%",
    delta: "+19%",
    impact: "Landing page optimization + social proof",
    position: { x: 600, y: 0 },
  },
  {
    id: "ag-5",
    label: "Average Order Value",
    category: "financial",
    currentValue: "$62",
    proposedValue: "$68",
    delta: "+10%",
    impact: "Bundle offers and upsell flows",
    position: { x: 600, y: 200 },
  },
  {
    id: "ag-6",
    label: "Monthly Revenue",
    category: "financial",
    currentValue: "$200K",
    proposedValue: "$247K",
    delta: "+23.5%",
    impact: "Combined effect of acquisition and AOV growth",
    position: { x: 900, y: 50 },
  },
  {
    id: "ag-7",
    label: "Customer LTV",
    category: "metric",
    currentValue: "$185",
    proposedValue: "$210",
    delta: "+14%",
    impact: "Higher AOV improves lifetime value",
    position: { x: 900, y: 200 },
  },
  {
    id: "ag-8",
    label: "Net Profit Margin",
    category: "financial",
    currentValue: "18%",
    proposedValue: "15.2%",
    delta: "-2.8pp",
    impact: "Margin compression from higher ad spend",
    position: { x: 1200, y: 100 },
  },
];

const aggressiveGrowthEdges: MockCausalEdge[] = [
  { id: "ae-1", source: "ag-1", target: "ag-2", strength: 0.9, label: "drives" },
  { id: "ae-2", source: "ag-1", target: "ag-3", strength: 0.6, label: "boosts" },
  { id: "ae-3", source: "ag-2", target: "ag-4", strength: 0.7 },
  { id: "ae-4", source: "ag-3", target: "ag-4", strength: 0.4 },
  { id: "ae-5", source: "ag-4", target: "ag-6", strength: 0.85 },
  { id: "ae-6", source: "ag-5", target: "ag-6", strength: 0.75 },
  { id: "ae-7", source: "ag-5", target: "ag-7", strength: 0.8 },
  { id: "ae-8", source: "ag-6", target: "ag-8", strength: 0.9 },
  { id: "ae-9", source: "ag-1", target: "ag-8", strength: 0.7 },
];

// ── Scenario 2: Lean Operations Overhaul ───────────────────────

const leanOpsNodes: MockCausalNode[] = [
  {
    id: "lo-1",
    label: "Supply Chain Renegotiation",
    category: "operations",
    currentValue: "$38/unit",
    proposedValue: "$29/unit",
    delta: "-24%",
    impact: "Consolidate suppliers, negotiate volume discounts",
    position: { x: 0, y: 0 },
  },
  {
    id: "lo-2",
    label: "Warehouse Automation",
    category: "operations",
    currentValue: "Manual",
    proposedValue: "Semi-Auto",
    delta: "Upgrade",
    impact: "Reduce fulfillment labor by 40%",
    position: { x: 0, y: 200 },
  },
  {
    id: "lo-3",
    label: "COGS per Unit",
    category: "financial",
    currentValue: "$18.50",
    proposedValue: "$13.20",
    delta: "-29%",
    impact: "Direct cost savings from supply chain + automation",
    position: { x: 300, y: 0 },
  },
  {
    id: "lo-4",
    label: "Fulfillment Cost",
    category: "financial",
    currentValue: "$8.20/order",
    proposedValue: "$5.10/order",
    delta: "-38%",
    impact: "Automation reduces per-order handling cost",
    position: { x: 300, y: 200 },
  },
  {
    id: "lo-5",
    label: "Gross Margin",
    category: "metric",
    currentValue: "62%",
    proposedValue: "71%",
    delta: "+9pp",
    impact: "Significant margin expansion from cost reduction",
    position: { x: 600, y: 50 },
  },
  {
    id: "lo-6",
    label: "Order Accuracy",
    category: "operations",
    currentValue: "96.5%",
    proposedValue: "99.1%",
    delta: "+2.6pp",
    impact: "Automation reduces human error in fulfillment",
    position: { x: 600, y: 250 },
  },
  {
    id: "lo-7",
    label: "Customer Satisfaction",
    category: "brand",
    currentValue: "4.2/5",
    proposedValue: "4.5/5",
    delta: "+7%",
    impact: "Faster shipping and fewer errors boost reviews",
    position: { x: 900, y: 200 },
  },
  {
    id: "lo-8",
    label: "Monthly Revenue",
    category: "financial",
    currentValue: "$200K",
    proposedValue: "$216K",
    delta: "+8%",
    impact: "Modest revenue lift from improved satisfaction",
    position: { x: 900, y: 0 },
  },
  {
    id: "lo-9",
    label: "Operating Expenses",
    category: "financial",
    currentValue: "$85K/mo",
    proposedValue: "$59.5K/mo",
    delta: "-30%",
    impact: "Major opex reduction from automation + efficiency",
    position: { x: 1200, y: 0 },
  },
  {
    id: "lo-10",
    label: "Net Profit Margin",
    category: "metric",
    currentValue: "18%",
    proposedValue: "28.5%",
    delta: "+10.5pp",
    impact: "Dramatic profitability improvement",
    position: { x: 1200, y: 200 },
  },
];

const leanOpsEdges: MockCausalEdge[] = [
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
];

// ── Scenario 3: Multi-Channel Expansion ────────────────────────

const multiChannelNodes: MockCausalNode[] = [
  {
    id: "mc-1",
    label: "Amazon Launch",
    category: "market",
    currentValue: "N/A",
    proposedValue: "Live",
    delta: "New",
    impact: "Launch 12 SKUs on Amazon marketplace",
    position: { x: 0, y: 0 },
  },
  {
    id: "mc-2",
    label: "Retail Partnerships",
    category: "market",
    currentValue: "0 stores",
    proposedValue: "180 stores",
    delta: "New",
    impact: "Sephora + Ulta placement in select locations",
    position: { x: 0, y: 200 },
  },
  {
    id: "mc-3",
    label: "Amazon Revenue",
    category: "financial",
    currentValue: "$0",
    proposedValue: "$52K/mo",
    delta: "+$52K",
    impact: "Projected marketplace revenue within 6 months",
    position: { x: 300, y: 0 },
  },
  {
    id: "mc-4",
    label: "Retail Revenue",
    category: "financial",
    currentValue: "$0",
    proposedValue: "$38K/mo",
    delta: "+$38K",
    impact: "Wholesale revenue from retail partners",
    position: { x: 300, y: 200 },
  },
  {
    id: "mc-5",
    label: "DTC Cannibalization",
    category: "market",
    currentValue: "0%",
    proposedValue: "-8%",
    delta: "-8%",
    impact: "Some DTC customers shift to Amazon/retail",
    position: { x: 300, y: 400 },
  },
  {
    id: "mc-6",
    label: "Brand Visibility",
    category: "brand",
    currentValue: "Online only",
    proposedValue: "Omnichannel",
    delta: "+3x reach",
    impact: "Physical presence drives organic awareness",
    position: { x: 600, y: 100 },
  },
  {
    id: "mc-7",
    label: "Inventory Complexity",
    category: "operations",
    currentValue: "1 channel",
    proposedValue: "3 channels",
    delta: "+200%",
    impact: "Multi-channel fulfillment requires new systems",
    position: { x: 600, y: 300 },
  },
  {
    id: "mc-8",
    label: "Total Revenue",
    category: "financial",
    currentValue: "$200K/mo",
    proposedValue: "$290K/mo",
    delta: "+45%",
    impact: "Combined revenue across all channels",
    position: { x: 900, y: 50 },
  },
  {
    id: "mc-9",
    label: "Operating Costs",
    category: "financial",
    currentValue: "$85K/mo",
    proposedValue: "$125K/mo",
    delta: "+47%",
    impact: "New channel operations, staff, inventory systems",
    position: { x: 900, y: 250 },
  },
  {
    id: "mc-10",
    label: "Net Profit Margin",
    category: "metric",
    currentValue: "18%",
    proposedValue: "14.8%",
    delta: "-3.2pp",
    impact: "Growth-stage margin compression expected",
    position: { x: 1200, y: 150 },
  },
];

const multiChannelEdges: MockCausalEdge[] = [
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
];

// ── Scenario 4: Conservative Stability ─────────────────────────

const conservativeNodes: MockCausalNode[] = [
  {
    id: "cs-1",
    label: "Email Retention Program",
    category: "brand",
    currentValue: "Basic",
    proposedValue: "Advanced",
    delta: "Upgrade",
    impact: "Segmented flows, loyalty rewards, win-back campaigns",
    position: { x: 0, y: 0 },
  },
  {
    id: "cs-2",
    label: "Price Optimization",
    category: "financial",
    currentValue: "Fixed pricing",
    proposedValue: "Dynamic",
    delta: "Upgrade",
    impact: "A/B test pricing tiers for margin optimization",
    position: { x: 0, y: 200 },
  },
  {
    id: "cs-3",
    label: "Retention Rate",
    category: "metric",
    currentValue: "34%",
    proposedValue: "42%",
    delta: "+8pp",
    impact: "Email automation improves repeat purchase rate",
    position: { x: 300, y: 0 },
  },
  {
    id: "cs-4",
    label: "Average Order Value",
    category: "financial",
    currentValue: "$62",
    proposedValue: "$66",
    delta: "+6.5%",
    impact: "Dynamic pricing finds optimal price points",
    position: { x: 300, y: 200 },
  },
  {
    id: "cs-5",
    label: "Customer LTV",
    category: "metric",
    currentValue: "$185",
    proposedValue: "$218",
    delta: "+18%",
    impact: "Higher retention × higher AOV = stronger LTV",
    position: { x: 600, y: 100 },
  },
  {
    id: "cs-6",
    label: "Monthly Revenue",
    category: "financial",
    currentValue: "$200K",
    proposedValue: "$212K",
    delta: "+6%",
    impact: "Steady growth from existing customer base",
    position: { x: 900, y: 0 },
  },
  {
    id: "cs-7",
    label: "Marketing Efficiency",
    category: "market",
    currentValue: "CAC $42",
    proposedValue: "CAC $38",
    delta: "-10%",
    impact: "Better retention reduces acquisition pressure",
    position: { x: 900, y: 200 },
  },
  {
    id: "cs-8",
    label: "Net Profit Margin",
    category: "financial",
    currentValue: "18%",
    proposedValue: "21.5%",
    delta: "+3.5pp",
    impact: "Efficient growth improves bottom line",
    position: { x: 1200, y: 100 },
  },
];

const conservativeEdges: MockCausalEdge[] = [
  { id: "ce-1", source: "cs-1", target: "cs-3", strength: 0.85 },
  { id: "ce-2", source: "cs-2", target: "cs-4", strength: 0.75 },
  { id: "ce-3", source: "cs-3", target: "cs-5", strength: 0.9 },
  { id: "ce-4", source: "cs-4", target: "cs-5", strength: 0.7 },
  { id: "ce-5", source: "cs-5", target: "cs-6", strength: 0.8 },
  { id: "ce-6", source: "cs-3", target: "cs-7", strength: 0.6 },
  { id: "ce-7", source: "cs-6", target: "cs-8", strength: 0.85 },
  { id: "ce-8", source: "cs-7", target: "cs-8", strength: 0.5 },
];

// ── Assembled Scenarios ────────────────────────────────────────

export const MOCK_SCENARIOS: MockScenarioDetail[] = [
  {
    id: "scn-aggressive-growth",
    title: "Aggressive Growth Play",
    tag: "Most Recommended",
    description:
      "Scale paid acquisition and optimize conversion funnels to accelerate top-line growth. Higher spend, higher revenue — with controlled margin compression.",
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
    sparkline: growSparkline(baseRevenue, 0.235),
    nodes: aggressiveGrowthNodes,
    edges: aggressiveGrowthEdges,
  },
  {
    id: "scn-lean-ops",
    title: "Lean Operations Overhaul",
    tag: "Best for Profitability",
    description:
      "Renegotiate supply chain, automate fulfillment, and cut operating costs by 30%. Modest revenue growth but dramatic margin expansion.",
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
    sparkline: growSparkline(baseRevenue, 0.08),
    nodes: leanOpsNodes,
    edges: leanOpsEdges,
  },
  {
    id: "scn-multi-channel",
    title: "Multi-Channel Expansion",
    tag: "Highest Revenue Potential",
    description:
      "Launch on Amazon and secure retail partnerships with Sephora and Ulta. Maximum top-line growth with increased operational complexity.",
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
    sparkline: growSparkline(baseRevenue, 0.45),
    nodes: multiChannelNodes,
    edges: multiChannelEdges,
  },
  {
    id: "scn-conservative",
    title: "Conservative Stability",
    tag: "Lowest Risk",
    description:
      "Focus on retention marketing and price optimization. Steady, predictable growth with minimal execution risk and improved unit economics.",
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
    sparkline: growSparkline(baseRevenue, 0.06),
    nodes: conservativeNodes,
    edges: conservativeEdges,
  },
];
