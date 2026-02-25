"use client";

import { useState } from "react";
import {
  FileSpreadsheet,
  BarChart3,
  TrendingUp,
  Globe,
  Users,
  ShoppingCart,
  Truck,
  Megaphone,
  CreditCard,
  Image,
  MapPin,
  Swords,
  Building2,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Upload,
  MessageSquare,
  Check,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FileUploader } from "./FileUploader";
import { useBusinessStore } from "@/lib/store/business-store";
import type { DataSourceType, DataSourceTier } from "@/lib/types";

interface DataBoxConfig {
  type: DataSourceType;
  tier: DataSourceTier;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  accuracyImpact: number;
}

const dataBoxes: DataBoxConfig[] = [
  // Tier 1 — Core Financial
  {
    type: "balance_sheet",
    tier: "core",
    label: "Balance Sheet",
    description: "Assets, liabilities, and equity snapshot",
    icon: FileSpreadsheet,
    accuracyImpact: 20,
  },
  {
    type: "income_statement",
    tier: "core",
    label: "Income Statement",
    description: "Revenue, expenses, and net income",
    icon: BarChart3,
    accuracyImpact: 22,
  },
  {
    type: "cash_flow",
    tier: "core",
    label: "Cash Flow Statement",
    description: "Operating, investing, and financing cash flows",
    icon: TrendingUp,
    accuracyImpact: 18,
  },
  {
    type: "general_ledger",
    tier: "core",
    label: "General Ledger",
    description: "Detailed transaction records",
    icon: FileSpreadsheet,
    accuracyImpact: 15,
  },
  {
    type: "pos_transactions",
    tier: "core",
    label: "POS / Transactions",
    description: "Point-of-sale or transaction-level data",
    icon: ShoppingCart,
    accuracyImpact: 14,
  },
  // Tier 2 — Contextual Signals
  {
    type: "interest_rates",
    tier: "contextual",
    label: "Interest Rates",
    description: "Current and projected interest rate environment",
    icon: TrendingUp,
    accuracyImpact: 8,
  },
  {
    type: "market_sentiment",
    tier: "contextual",
    label: "Market Sentiment",
    description: "Industry trends and market outlook",
    icon: Globe,
    accuracyImpact: 7,
  },
  {
    type: "inflation",
    tier: "contextual",
    label: "Inflation Data",
    description: "Consumer price index and inflation rates",
    icon: TrendingUp,
    accuracyImpact: 9,
  },
  {
    type: "brand_image",
    tier: "contextual",
    label: "Brand / Image",
    description: "Brand perception, reviews, and reputation data",
    icon: Image,
    accuracyImpact: 5,
  },
  {
    type: "demographics",
    tier: "contextual",
    label: "Demographics",
    description: "Target market demographics and trends",
    icon: MapPin,
    accuracyImpact: 6,
  },
  {
    type: "competition",
    tier: "contextual",
    label: "Competition",
    description: "Competitor analysis and market share",
    icon: Swords,
    accuracyImpact: 7,
  },
  {
    type: "supply_chain",
    tier: "contextual",
    label: "Supply Chain",
    description: "Supplier costs, lead times, and reliability",
    icon: Truck,
    accuracyImpact: 10,
  },
  {
    type: "workforce",
    tier: "contextual",
    label: "Workforce",
    description: "Employee data, turnover, and labor market",
    icon: Users,
    accuracyImpact: 6,
  },
  {
    type: "marketing",
    tier: "contextual",
    label: "Marketing Data",
    description: "Campaign performance, CAC, and channel metrics",
    icon: Megaphone,
    accuracyImpact: 8,
  },
  {
    type: "debt_schedules",
    tier: "contextual",
    label: "Debt Schedules",
    description: "Loan terms, repayment schedules, and covenants",
    icon: CreditCard,
    accuracyImpact: 11,
  },
  // Tier 3 — Custom
  {
    type: "custom",
    tier: "custom",
    label: "Custom Data Source",
    description: "Upload any data with AI-powered variable extraction",
    icon: Sparkles,
    accuracyImpact: 0,
  },
];

function DataBoxCard({
  config,
  isUploaded,
  onClick,
}: {
  config: DataBoxConfig;
  isUploaded: boolean;
  onClick: () => void;
}) {
  const Icon = config.icon;
  const tierColors = {
    core: "text-chart-1",
    contextual: "text-chart-3",
    custom: "text-chart-4",
  };

  return (
    <Card
      className={`cursor-pointer transition-all hover:bg-accent/50 ${
        isUploaded ? "border-chart-2/50 bg-chart-2/5" : ""
      }`}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div
            className={`flex h-8 w-8 items-center justify-center rounded-lg bg-accent ${tierColors[config.tier]}`}
          >
            {isUploaded ? (
              <Check className="h-4 w-4 text-chart-2" />
            ) : (
              <Icon className="h-4 w-4" />
            )}
          </div>
          {config.accuracyImpact > 0 && (
            <Badge variant="secondary" className="text-[10px]">
              +{config.accuracyImpact}% accuracy
            </Badge>
          )}
        </div>
        <h4 className="text-sm font-medium">{config.label}</h4>
        <p className="text-xs text-muted-foreground mt-1">
          {config.description}
        </p>
      </CardContent>
    </Card>
  );
}

interface DataBoxGridProps {
  onPersisted?: () => void;
}

export function DataBoxGrid({ onPersisted }: DataBoxGridProps) {
  const {
    businessData,
    dataSources,
    addDataSource,
    setBusinessData,
    setDataSources,
    markClean,
    setSaving,
  } = useBusinessStore();
  const [selectedBox, setSelectedBox] = useState<DataBoxConfig | null>(null);
  const [nlpDescription, setNlpDescription] = useState("");
  const [saveError, setSaveError] = useState<string | null>(null);

  const uploadedTypes = new Set(dataSources.map((s) => s.type));

  const tiers = [
    { key: "core" as const, label: "Core Financial", description: "Essential financial data for accurate simulations" },
    { key: "contextual" as const, label: "Contextual Signals", description: "External factors that influence your business" },
    { key: "custom" as const, label: "Custom", description: "Any additional data with AI-powered extraction" },
  ];

  const persistSources = async (nextSources: typeof dataSources) => {
    setSaveError(null);
    setSaving(true);
    try {
      const res = await fetch("/api/data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessId: businessData.id,
          businessData,
          dataSources: nextSources,
        }),
      });
      const payload = await res.json();
      if (!res.ok || !payload.success) {
        throw new Error(payload.error || "Failed to persist data source");
      }

      if (payload.business) {
        setBusinessData(payload.business, { markDirty: false });
      } else if (payload.businessId) {
        setBusinessData({ id: payload.businessId }, { markDirty: false });
      }
      if (payload.dataSources) {
        setDataSources(payload.dataSources, { markDirty: false });
      }
      markClean();
      onPersisted?.();
    } catch (error) {
      setSaveError(
        error instanceof Error ? error.message : "Failed to save data source"
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">
            Click a data source to upload files or describe your data. Sources
            are ranked by their impact on simulation accuracy.
          </p>
        </div>
        <Badge variant="secondary">
          {dataSources.length} / {dataBoxes.length} sources added
        </Badge>
      </div>
      {saveError ? (
        <p className="text-xs text-destructive">{saveError}</p>
      ) : null}

      {tiers.map((tier) => {
        const boxes = dataBoxes.filter((b) => b.tier === tier.key);
        return (
          <div key={tier.key}>
            <div className="mb-3">
              <h3 className="text-sm font-semibold">{tier.label}</h3>
              <p className="text-xs text-muted-foreground">
                {tier.description}
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {boxes.map((box) => (
                <DataBoxCard
                  key={box.type}
                  config={box}
                  isUploaded={uploadedTypes.has(box.type)}
                  onClick={() => {
                    setSelectedBox(box);
                    setNlpDescription("");
                  }}
                />
              ))}
            </div>
          </div>
        );
      })}

      {/* Upload dialog */}
      <Dialog
        open={!!selectedBox}
        onOpenChange={(open) => !open && setSelectedBox(null)}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{selectedBox?.label}</DialogTitle>
            <DialogDescription>{selectedBox?.description}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <FileUploader
              onParsed={(data, fileName) => {
                if (!selectedBox) return;
                const nextSource = {
                  id: crypto.randomUUID(),
                  businessId: businessData.id || "",
                  type: selectedBox.type,
                  tier: selectedBox.tier,
                  label: selectedBox.label,
                  description: selectedBox.description,
                  fileName,
                  accuracyImpact: selectedBox.accuracyImpact,
                  uploadedAt: new Date().toISOString(),
                };
                addDataSource(nextSource);
                void persistSources([...dataSources, nextSource]);
                setSelectedBox(null);
              }}
            />

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-background px-2 text-muted-foreground">
                  or describe your data
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm flex items-center gap-1.5">
                <MessageSquare className="h-3 w-3" />
                Natural Language Description
              </Label>
              <Textarea
                placeholder={`Describe your ${selectedBox?.label?.toLowerCase()} data in your own words. AI will extract the relevant variables.`}
                value={nlpDescription}
                onChange={(e) => setNlpDescription(e.target.value)}
                className="min-h-[80px]"
              />
              <Button
                variant="outline"
                size="sm"
                disabled={!nlpDescription.trim()}
                onClick={() => {
                  if (!selectedBox || !nlpDescription.trim()) return;
                  const nextSource = {
                    id: crypto.randomUUID(),
                    businessId: businessData.id || "",
                    type: selectedBox.type,
                    tier: selectedBox.tier,
                    label: selectedBox.label,
                    description: selectedBox.description,
                    nlpDescription,
                    accuracyImpact: selectedBox.accuracyImpact,
                    uploadedAt: new Date().toISOString(),
                  };
                  addDataSource(nextSource);
                  void persistSources([...dataSources, nextSource]);
                  setSelectedBox(null);
                }}
              >
                <Sparkles className="mr-1.5 h-3 w-3" />
                Extract variables with AI
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
