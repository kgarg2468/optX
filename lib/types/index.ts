// ============================================================
// OptX — Core TypeScript Types
// ============================================================

// --- Business Data ---

export type IndustryType =
  | "retail"
  | "food_service"
  | "professional_services"
  | "healthcare"
  | "technology"
  | "construction"
  | "manufacturing"
  | "real_estate"
  | "education"
  | "other";

export type BusinessSize = "1-5" | "6-20" | "21-50" | "51-200" | "200+";

export type RevenueTrend = "growing" | "flat" | "declining";

export type SeasonalPattern = {
  description: string;
  peakMonths: number[];
  troughMonths: number[];
};

export interface ExpenseCategory {
  id: string;
  name: string;
  amount: number;
  isRecurring: boolean;
}

export interface BusinessData {
  id: string;
  userId: string;
  name: string;
  industry: IndustryType;
  size: BusinessSize;
  monthlyRevenue: number[];
  expenses: ExpenseCategory[];
  cashOnHand: number;
  outstandingDebt: number;
  // Optional depth fields
  revenueTrend?: RevenueTrend;
  revenueTrendRate?: number;
  customerCount?: number;
  avgTransactionSize?: number;
  grossMargin?: number;
  seasonalPatterns?: SeasonalPattern;
  plannedChanges?: string;
  createdAt: string;
  updatedAt: string;
}

// --- Data Sources (Advanced) ---

export type DataSourceTier = "core" | "contextual" | "custom";

export type DataSourceType =
  // Tier 1 — Core Financial
  | "balance_sheet"
  | "income_statement"
  | "cash_flow"
  | "general_ledger"
  | "pos_transactions"
  // Tier 2 — Contextual Signals
  | "interest_rates"
  | "market_sentiment"
  | "inflation"
  | "brand_image"
  | "demographics"
  | "competition"
  | "supply_chain"
  | "workforce"
  | "marketing"
  | "debt_schedules"
  // Tier 3 — Custom
  | "custom";

export interface DataSource {
  id: string;
  businessId: string;
  type: DataSourceType;
  tier: DataSourceTier;
  label: string;
  description: string;
  fileUrl?: string;
  fileName?: string;
  manualData?: Record<string, unknown>;
  nlpDescription?: string;
  parsedVariables?: Variable[];
  accuracyImpact?: number; // estimated % improvement
  uploadedAt?: string;
}

// --- Variables & Distributions ---

export type DistributionType =
  | "normal"
  | "lognormal"
  | "beta"
  | "uniform"
  | "empirical"
  | "poisson"
  | "triangular";

export interface Distribution {
  type: DistributionType;
  params: Record<string, number>;
}

export interface Variable {
  id: string;
  name: string;
  displayName: string;
  category: string;
  value: number;
  unit: string;
  distribution: Distribution;
  confidence: number; // 0-1
  timeSeriesData?: number[];
  source: string;
}

// --- Simulation ---

export type SimulationStatus =
  | "idle"
  | "preparing"
  | "running_monte_carlo"
  | "running_bayesian"
  | "running_sensitivity"
  | "running_backtest"
  | "running_agents"
  | "complete"
  | "error";

export interface SimulationConfig {
  iterations: number; // default 10000
  timeHorizonMonths: number;
  confidenceLevel: number; // default 0.95
  scenarioId?: string;
}

export interface MonteCarloResult {
  variable: string;
  mean: number;
  median: number;
  std: number;
  percentiles: Record<string, number>; // "5", "25", "50", "75", "95"
  distribution: number[];
  timeSeriesProjection: number[][]; // [month][iteration_sample]
}

export interface BayesianEdge {
  from: string;
  to: string;
  strength: number;
  description: string;
}

export interface BayesianNetworkResult {
  nodes: string[];
  edges: BayesianEdge[];
  posteriors: Record<string, Distribution>;
}

export interface SensitivityResult {
  variable: string;
  sobolIndex: number; // first-order
  totalSobolIndex: number;
  morrisScreening: number;
  rank: number;
}

export interface BacktestResult {
  accuracy: number;
  brierScore: number;
  calibrationData: { predicted: number; actual: number }[];
  ensembleDisagreement: number;
  walkForwardResults: { period: string; predicted: number; actual: number }[];
}

export interface SimulationResult {
  id: string;
  businessId: string;
  scenarioId?: string;
  config: SimulationConfig;
  status: SimulationStatus;
  monteCarlo: MonteCarloResult[];
  bayesianNetwork: BayesianNetworkResult;
  sensitivity: SensitivityResult[];
  backtest: BacktestResult;
  agentAnalysis: AgentCoordinatorOutput;
  createdAt: string;
  completedAt?: string;
}

// --- Scenarios ---

export interface ScenarioVariable {
  variableId: string;
  name: string;
  baseValue: number;
  modifiedValue: number;
  unit: string;
  category?: string;
}

export interface Scenario {
  id: string;
  businessId: string;
  name: string;
  description: string;
  variables: ScenarioVariable[];
  graphState?: GraphState;
  createdAt: string;
  updatedAt: string;
}

// --- Graph Editor ---

export type GraphNodeType =
  | "financial"
  | "market"
  | "brand"
  | "operations"
  | "logic"
  | "metric";

export interface GraphNodeData {
  label: string;
  type: GraphNodeType;
  variableId?: string;
  value?: number;
  unit?: string;
  config?: Record<string, unknown>;
}

export interface GraphNode {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: GraphNodeData;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
  animated?: boolean;
}

export interface GraphState {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

// --- AI Agents ---

export type AgentType =
  | "market"
  | "financial"
  | "growth"
  | "risk"
  | "brand"
  | "operations";

export interface AgentFinding {
  summary: string;
  details: string;
  confidence: number;
  supportingData: string[];
  suggestedVariables?: Variable[];
  suggestedEdges?: BayesianEdge[];
}

export interface AgentAnalysis {
  agentType: AgentType;
  findings: AgentFinding[];
  scenarioSuggestions: string[];
}

export interface DebateRound {
  round: number;
  critiques: {
    fromAgent: AgentType;
    toAgent: AgentType;
    critique: string;
    response: string;
  }[];
}

export interface AgentCoordinatorOutput {
  individualAnalyses: AgentAnalysis[];
  debateRounds: DebateRound[];
  convergenceScore: number;
  unifiedFindings: AgentFinding[];
  recommendations: string[];
}

// --- Reports ---

export interface PLProjection {
  period: string;
  revenue: { mean: number; low: number; high: number };
  cogs: { mean: number; low: number; high: number };
  grossProfit: { mean: number; low: number; high: number };
  opex: { mean: number; low: number; high: number };
  netIncome: { mean: number; low: number; high: number };
}

export interface CashFlowProjection {
  period: string;
  operatingCashFlow: { mean: number; low: number; high: number };
  investingCashFlow: { mean: number; low: number; high: number };
  financingCashFlow: { mean: number; low: number; high: number };
  netCashFlow: { mean: number; low: number; high: number };
  endingCash: { mean: number; low: number; high: number };
}

export interface RiskMatrixItem {
  risk: string;
  likelihood: number; // 1-5
  impact: number; // 1-5
  category: string;
  mitigation: string;
}

export interface FinancialReport {
  plProjections: PLProjection[];
  cashFlowProjections: CashFlowProjection[];
  riskMatrix: RiskMatrixItem[];
  sensitivityRanking: SensitivityResult[];
  scenarioComparisons?: { scenarioName: string; keyMetrics: Record<string, number> }[];
  backtestSummary: BacktestResult;
}

export interface NarrativeReport {
  executiveSummary: string;
  keyFindings: string[];
  riskAssessment: string;
  recommendations: string[];
  fullNarrative: string;
}

export interface Report {
  id: string;
  simulationId: string;
  businessId: string;
  financial: FinancialReport;
  narrative: NarrativeReport;
  createdAt: string;
}

// --- Chat ---

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  context?: {
    reportId?: string;
    scenarioId?: string;
    simulationId?: string;
  };
}

// --- UI State ---

export type ActivePage =
  | "dashboard"
  | "data"
  | "simulate"
  | "scenario"
  | "report";

export type DataEntryMode = "quick_start" | "advanced";
export type SimulateViewMode = "wizard" | "graph";
