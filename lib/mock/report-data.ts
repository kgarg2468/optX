import type { MockScenarioDetail } from "./simulation-scenarios";

// ── Types ──────────────────────────────────────────────────────

export interface ReportMetric {
  id: string;
  label: string;
  current: string;
  projected: string;
  delta: string;
  positive: boolean;
  aiDetail: string;
}

export interface PLRow {
  id: string;
  lineItem: string;
  current: string;
  projected: string;
  change: string;
  positive: boolean;
  aiDetail: string;
}

export interface RiskItem {
  id: string;
  title: string;
  severity: "Low" | "Medium" | "High";
  description: string;
  aiDetail: string;
}

export interface Milestone {
  id: string;
  month: string;
  title: string;
  description: string;
  impactMetric: string;
  aiDetail: string;
}

export interface MockReportData {
  id: string;
  header: {
    title: string;
    businessName: string;
    date: string;
    tag: string;
    confidence: number;
  };
  metrics: ReportMetric[];
  plTable: PLRow[];
  riskAssessment: {
    overallLevel: "Low" | "Medium" | "High";
    confidenceScore: number;
    items: RiskItem[];
  };
  roadmap: Milestone[];
}

// ── Generator ──────────────────────────────────────────────────

export function generateMockReport(scenario: MockScenarioDetail): MockReportData {
  const id = `rpt-${scenario.id}`;

  // Extract financial nodes for P&L
  const financialNodes = scenario.nodes.filter((n) => n.category === "financial");
  const metricNodes = scenario.nodes.filter((n) => n.category === "metric");

  const metrics: ReportMetric[] = [
    {
      id: "m-revenue",
      label: "Revenue Impact",
      current: "$200K/mo",
      projected: scenario.revenueImpact,
      delta: scenario.revenueImpact,
      positive: !scenario.revenueImpact.startsWith("-"),
      aiDetail: `The revenue projection of ${scenario.revenueImpact} is driven by ${scenario.nodes.length} interconnected variables in the causal model. Monte Carlo simulation across 10,000 iterations shows a 90% confidence interval within ±3pp of the central estimate. The primary revenue drivers are upstream market and acquisition nodes.`,
    },
    {
      id: "m-cost",
      label: "Cost Impact",
      current: "Baseline",
      projected: scenario.costImpact,
      delta: scenario.costImpact,
      positive: scenario.costImpact.startsWith("-"),
      aiDetail: `Cost changes of ${scenario.costImpact} reflect the net effect of operational adjustments across the scenario. The model accounts for both direct cost changes and second-order effects like efficiency gains. Sensitivity analysis shows cost estimates are most sensitive to the operations-category nodes.`,
    },
    {
      id: "m-margin",
      label: "Net Margin",
      current: "18%",
      projected: metricNodes.find((n) => n.label.includes("Margin"))?.proposedValue ?? "—",
      delta: metricNodes.find((n) => n.label.includes("Margin"))?.delta ?? "—",
      positive: !(metricNodes.find((n) => n.label.includes("Margin"))?.delta ?? "").startsWith("-"),
      aiDetail: `Net margin movement reflects the balance between revenue growth and cost structure changes. The Bayesian network analysis shows a ${scenario.confidence}% probability that margins stay within the projected range. Key margin levers include COGS optimization and operational efficiency.`,
    },
    {
      id: "m-confidence",
      label: "Confidence",
      current: "—",
      projected: `${scenario.confidence}%`,
      delta: scenario.confidence >= 85 ? "High" : scenario.confidence >= 70 ? "Moderate" : "Low",
      positive: scenario.confidence >= 75,
      aiDetail: `The ${scenario.confidence}% confidence score is computed from ensemble agreement across Monte Carlo, Bayesian Network, and sensitivity analysis engines. Higher confidence indicates stronger convergence between independent simulation methods and lower parameter uncertainty.`,
    },
    {
      id: "m-profit",
      label: "Net Profit",
      current: "Baseline",
      projected: scenario.netProfitImpact,
      delta: scenario.netProfitImpact,
      positive: scenario.netProfitImpact.startsWith("+"),
      aiDetail: `The projected net profit impact of ${scenario.netProfitImpact} represents the annualized bottom-line effect. This factors in both the revenue trajectory and the evolving cost structure over a 12-month projection window. Break-even on incremental investment is estimated at month 4-5.`,
    },
  ];

  const plTable: PLRow[] = financialNodes.map((node, i) => ({
    id: `pl-${i}`,
    lineItem: node.label,
    current: node.currentValue,
    projected: node.proposedValue,
    change: node.delta,
    positive: node.delta.startsWith("+") || node.delta.startsWith("-$") === false && node.delta.includes("-") === false,
    aiDetail: `${node.label}: The shift from ${node.currentValue} to ${node.proposedValue} (${node.delta}) is ${node.impact.charAt(0).toLowerCase() + node.impact.slice(1)}. This variable has ${scenario.edges.filter((e) => e.target === node.id || e.source === node.id).length} causal connections in the model, making it a ${scenario.edges.filter((e) => e.source === node.id).length > 2 ? "high-influence" : "moderate-influence"} node.`,
  }));

  // Add metric nodes to P&L for completeness
  metricNodes.forEach((node, i) => {
    plTable.push({
      id: `pl-m-${i}`,
      lineItem: node.label,
      current: node.currentValue,
      projected: node.proposedValue,
      change: node.delta,
      positive: !node.delta.startsWith("-"),
      aiDetail: `${node.label}: Moving from ${node.currentValue} to ${node.proposedValue} (${node.delta}). ${node.impact}. This KPI is influenced by ${scenario.edges.filter((e) => e.target === node.id).length} upstream variables and drives ${scenario.edges.filter((e) => e.source === node.id).length} downstream outcomes.`,
    });
  });

  const riskItems: RiskItem[] = [
    {
      id: "r-1",
      title: "Execution Complexity",
      severity: scenario.riskLevel === "High" ? "High" : "Medium",
      description: `Implementing ${scenario.nodes.length} variable changes simultaneously requires careful coordination across teams.`,
      aiDetail: `The execution risk is driven by the number of simultaneous changes (${scenario.nodes.length} nodes) and their interdependencies (${scenario.edges.length} connections). Historical data from similar DTC transformations suggests phased rollout reduces execution risk by 40-60%. Recommend starting with the highest-confidence upstream nodes.`,
    },
    {
      id: "r-2",
      title: "Market Response Uncertainty",
      severity: scenario.confidence < 80 ? "High" : "Medium",
      description: "Customer and competitive response may differ from model assumptions.",
      aiDetail: "Market response uncertainty accounts for the gap between modeled customer behavior and real-world outcomes. The model uses historical DTC brand data to calibrate response curves, but novel market conditions could shift results. Recommend building in 2-4 week feedback loops for early course correction.",
    },
    {
      id: "r-3",
      title: "Cash Flow Timing",
      severity: scenario.costImpact.includes("+") ? "Medium" : "Low",
      description: "Costs are typically front-loaded while revenue benefits accrue over months.",
      aiDetail: "Cash flow timing risk reflects the mismatch between upfront investment and delayed revenue realization. The model shows costs peak in months 1-2 while revenue impact builds gradually through months 3-6. Ensure working capital can sustain the initial investment period without constraining operations.",
    },
    {
      id: "r-4",
      title: "Measurement & Attribution",
      severity: "Low",
      description: "Isolating the impact of individual changes may be challenging in practice.",
      aiDetail: "With multiple simultaneous changes, attribution becomes complex. The causal model provides theoretical isolation of effects, but real-world measurement should include A/B testing where possible and control group analysis. Recommend implementing tracking infrastructure before rollout.",
    },
  ];

  // Build roadmap from node chain order (roughly by x-position)
  const sortedNodes = [...scenario.nodes].sort((a, b) => a.position.x - b.position.x);
  const phases = [
    sortedNodes.slice(0, Math.ceil(sortedNodes.length * 0.25)),
    sortedNodes.slice(Math.ceil(sortedNodes.length * 0.25), Math.ceil(sortedNodes.length * 0.5)),
    sortedNodes.slice(Math.ceil(sortedNodes.length * 0.5), Math.ceil(sortedNodes.length * 0.75)),
    sortedNodes.slice(Math.ceil(sortedNodes.length * 0.75)),
  ].filter((p) => p.length > 0);

  const milestoneMonths = ["Month 1", "Month 2-3", "Month 4-5", "Month 6+"];
  const roadmap: Milestone[] = phases.map((phase, i) => ({
    id: `ms-${i}`,
    month: milestoneMonths[i] ?? `Month ${(i + 1) * 2}+`,
    title: phase.map((n) => n.label).slice(0, 2).join(" & "),
    description: phase.map((n) => n.impact).join(". ") + ".",
    impactMetric: phase[0]?.delta ?? "",
    aiDetail: `Phase ${i + 1} focuses on ${phase.map((n) => n.label).join(", ")}. These nodes were sequenced based on their causal position — upstream changes must be in place before downstream effects can materialize. Expected timeline: ${milestoneMonths[i] ?? "ongoing"}. Key dependencies: ${phase.map((n) => scenario.edges.filter((e) => e.target === n.id).length + " inputs").join(", ")}.`,
  }));

  const report: MockReportData = {
    id,
    header: {
      title: scenario.title,
      businessName: "Lumina Beauty Co.",
      date: new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }),
      tag: scenario.tag,
      confidence: scenario.confidence,
    },
    metrics,
    plTable,
    riskAssessment: {
      overallLevel: scenario.riskLevel,
      confidenceScore: scenario.confidence,
      items: riskItems,
    },
    roadmap,
  };

  REPORT_STORE.set(id, report);
  return report;
}

// Module-level in-memory store (persists during SPA navigation)
export const REPORT_STORE = new Map<string, MockReportData>();
