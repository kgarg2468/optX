export const FINANCE_GLOSSARY: Record<string, string> = {
  "AOV": "Average Order Value — the mean dollar amount spent per transaction",
  "LTV": "Lifetime Value — total revenue expected from a single customer over their relationship",
  "CAC": "Customer Acquisition Cost — the cost to acquire one new customer",
  "COGS": "Cost of Goods Sold — direct costs attributable to producing goods sold",
  "pp": "Percentage points — the absolute difference between two percentages",
  "ARR": "Annual Recurring Revenue — predictable yearly revenue from subscriptions",
  "DTC": "Direct-to-Consumer — selling directly to end customers without intermediaries",
  "NPS": "Net Promoter Score — customer loyalty metric from -100 to +100",
  "ROAS": "Return on Ad Spend — revenue generated per dollar of ad spend",
  "MRR": "Monthly Recurring Revenue — predictable monthly revenue from subscriptions",
  "churn": "Churn — the rate at which customers stop doing business over a period",
  "gross margin": "Gross Margin — revenue minus COGS, expressed as a percentage of revenue",
  "net margin": "Net Margin — net profit as a percentage of total revenue",
  "opex": "Operating Expenses — ongoing costs for running the business (rent, salaries, etc.)",
  "EBITDA": "Earnings Before Interest, Taxes, Depreciation & Amortization",
};

// Build regex: longest terms first to avoid partial matches (e.g. "gross margin" before "margin")
const sortedTerms = Object.keys(FINANCE_GLOSSARY).sort(
  (a, b) => b.length - a.length
);
const escaped = sortedTerms.map((t) =>
  t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
);
export const FINANCE_TERMS_REGEX = new RegExp(
  `\\b(${escaped.join("|")})\\b`,
  "gi"
);
