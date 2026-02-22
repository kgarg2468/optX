import { FinancialNode } from "./FinancialNode";
import { MarketNode } from "./MarketNode";
import { BrandNode } from "./BrandNode";
import { OperationsNode } from "./OperationsNode";
import { LogicNode } from "./LogicNode";
import { MetricNode } from "./MetricNode";

export const nodeTypes = {
  financial: FinancialNode,
  market: MarketNode,
  brand: BrandNode,
  operations: OperationsNode,
  logic: LogicNode,
  metric: MetricNode,
};

export { BaseNode } from "./BaseNode";
