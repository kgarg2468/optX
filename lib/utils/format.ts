const CURRENCY_FORMATTER = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

const COMPACT_DIVISORS = [
  { value: 1_000_000_000_000, suffix: "T" },
  { value: 1_000_000_000, suffix: "B" },
  { value: 1_000_000, suffix: "M" },
  { value: 1_000, suffix: "K" },
];

export function formatCompact(val: number): string {
  if (!Number.isFinite(val)) return "0.0";

  const abs = Math.abs(val);
  const sign = val < 0 ? "-" : "";
  const divisor = COMPACT_DIVISORS.find((entry) => abs >= entry.value);

  if (!divisor) return `${sign}${abs.toFixed(1)}`;
  return `${sign}${(abs / divisor.value).toFixed(1)}${divisor.suffix}`;
}

export function formatCurrency(val: number, compact = false): string {
  if (!Number.isFinite(val)) return "$0";
  if (!compact || Math.abs(val) < 1_000) return CURRENCY_FORMATTER.format(val);

  const sign = val < 0 ? "-" : "";
  return `${sign}$${formatCompact(Math.abs(val))}`;
}

export function formatPercent(val: number): string {
  if (!Number.isFinite(val)) return "0.0%";
  const normalized = Math.abs(val) <= 1 ? val * 100 : val;
  return `${normalized.toFixed(1)}%`;
}

export function formatVarName(name: string): string {
  const normalized = name.trim();
  if (!normalized) return "";

  const withoutExpensePrefix = normalized.replace(/^expense_/i, "");
  return withoutExpensePrefix
    .split(/[_\s]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}
