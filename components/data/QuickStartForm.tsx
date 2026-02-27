"use client";

import { useState } from "react";
import {
  Building2,
  DollarSign,
  Users,
  TrendingUp,
  Calendar,
  Lightbulb,
  MessageSquare,
  Plus,
  X,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Save,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useBusinessStore } from "@/lib/store/business-store";
import type {
  BusinessData,
  IndustryType,
  BusinessSize,
  RevenueTrend,
  ExpenseCategory,
} from "@/lib/types";

const industries: { value: IndustryType; label: string }[] = [
  { value: "retail", label: "Retail" },
  { value: "food_service", label: "Food Service" },
  { value: "professional_services", label: "Professional Services" },
  { value: "healthcare", label: "Healthcare" },
  { value: "technology", label: "Technology" },
  { value: "construction", label: "Construction" },
  { value: "manufacturing", label: "Manufacturing" },
  { value: "real_estate", label: "Real Estate" },
  { value: "education", label: "Education" },
  { value: "other", label: "Other" },
];

const businessSizes: { value: BusinessSize; label: string }[] = [
  { value: "1-5", label: "1-5 employees" },
  { value: "6-20", label: "6-20 employees" },
  { value: "21-50", label: "21-50 employees" },
  { value: "51-200", label: "51-200 employees" },
  { value: "200+", label: "200+ employees" },
];

const defaultExpenseCategories = [
  "COGS",
  "Payroll",
  "Rent",
  "Marketing",
  "Utilities",
  "Insurance",
  "Software/Tools",
  "Other",
];

interface NLPFieldProps {
  label: string;
  placeholder: string;
  onExtract: (value: string) => void;
}

function NLPToggleField({ label, placeholder, onExtract }: NLPFieldProps) {
  const [isNLP, setIsNLP] = useState(false);
  const [nlpText, setNlpText] = useState("");

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="text-sm">{label}</Label>
        <button
          type="button"
          onClick={() => setIsNLP(!isNLP)}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <MessageSquare className="h-3 w-3" />
          {isNLP ? "Use form field" : "Tell me in your own words"}
        </button>
      </div>
      {isNLP ? (
        <div className="space-y-2">
          <Textarea
            placeholder={placeholder}
            value={nlpText}
            onChange={(e) => setNlpText(e.target.value)}
            className="min-h-[60px] text-sm"
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onExtract(nlpText)}
          >
            <Sparkles className="mr-1.5 h-3 w-3" />
            Extract value
          </Button>
        </div>
      ) : null}
    </div>
  );
}

interface QuickStartFormProps {
  onSaved?: (business: BusinessData) => void;
}

export function QuickStartForm({ onSaved }: QuickStartFormProps) {
  const {
    businessData,
    dataSources,
    setField,
    setIndustry,
    setSize,
    addExpense,
    removeExpense,
    updateExpense,
    setBusinessData,
    setDataSources,
    markClean,
    setSaving,
    isSaving,
  } = useBusinessStore();

  const [showOptional, setShowOptional] = useState(false);
  const [newExpenseName, setNewExpenseName] = useState("");
  const [newExpenseAmount, setNewExpenseAmount] = useState("");
  const [revenueInput, setRevenueInput] = useState("");
  const [saveError, setSaveError] = useState<string | null>(null);

  const handleAddExpense = () => {
    if (!newExpenseName || !newExpenseAmount) return;
    const expense: ExpenseCategory = {
      id: crypto.randomUUID(),
      name: newExpenseName,
      amount: parseFloat(newExpenseAmount),
      isRecurring: true,
    };
    addExpense(expense);
    setNewExpenseName("");
    setNewExpenseAmount("");
  };

  const handleAddRevenueMonth = () => {
    if (!revenueInput) return;
    const current = businessData.monthlyRevenue || [];
    setField("monthlyRevenue", [...current, parseFloat(revenueInput)]);
    setRevenueInput("");
  };

  const handleSave = async () => {
    setSaveError(null);
    setSaving(true);
    try {
      const res = await fetch("/api/data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessId: businessData.id,
          businessData,
          dataSources,
        }),
      });
      const payload = await res.json();
      if (!res.ok || !payload.success) {
        throw new Error(payload.error || "Failed to save business data");
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

      const savedBusiness: BusinessData | null = payload.business
        ? (payload.business as BusinessData)
        : payload.businessId
          ? ({
              ...(businessData as BusinessData),
              id: payload.businessId,
            } as BusinessData)
          : null;

      if (savedBusiness && onSaved) {
        onSaved(savedBusiness);
      }
    } catch (error) {
      setSaveError(
        error instanceof Error ? error.message : "Failed to save business data"
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Business Info */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-chart-1" />
            <CardTitle className="text-base">Business Information</CardTitle>
          </div>
          <CardDescription>
            Tell us about your business to customize the simulation
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Business Name</Label>
            <Input
              placeholder="e.g., Joe's Coffee Shop"
              value={businessData.name || ""}
              onChange={(e) => setField("name", e.target.value)}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Industry</Label>
              <Select
                value={businessData.industry || "other"}
                onValueChange={(v) => setIndustry(v as IndustryType)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {industries.map((i) => (
                    <SelectItem key={i.value} value={i.value}>
                      {i.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Business Size</Label>
              <Select
                value={businessData.size || "1-5"}
                onValueChange={(v) => setSize(v as BusinessSize)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {businessSizes.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <NLPToggleField
            label="Business Description"
            placeholder='e.g., "We run a small coffee shop downtown, been open for 3 years, mostly walk-in customers but growing our online delivery..."'
            onExtract={(text) => {
              // In production, this calls the AI to extract structured fields
              setField("plannedChanges", text);
            }}
          />
        </CardContent>
      </Card>

      {/* Revenue */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-chart-2" />
            <CardTitle className="text-base">Revenue</CardTitle>
          </div>
          <CardDescription>
            Enter monthly revenue for the last 12 months, or an average
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <NLPToggleField
            label="Revenue"
            placeholder='e.g., "We make about 50k a month but summer is slow, maybe 30k"'
            onExtract={(text) => {
              // AI would parse this into structured values
            }}
          />

          <div className="flex items-end gap-2">
            <div className="flex-1 space-y-2">
              <Label>Monthly Revenue ($)</Label>
              <Input
                type="number"
                placeholder="e.g., 50000"
                value={revenueInput}
                onChange={(e) => setRevenueInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddRevenueMonth()}
              />
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={handleAddRevenueMonth}
            >
              <Plus className="mr-1.5 h-3 w-3" />
              Add Month
            </Button>
          </div>

          {(businessData.monthlyRevenue?.length ?? 0) > 0 && (
            <div className="flex flex-wrap gap-2">
              {businessData.monthlyRevenue!.map((rev, i) => (
                <Badge key={i} variant="secondary" className="gap-1">
                  Month {i + 1}: ${rev.toLocaleString()}
                  <button
                    type="button"
                    onClick={() => {
                      const updated = businessData.monthlyRevenue!.filter(
                        (_, idx) => idx !== i
                      );
                      setField("monthlyRevenue", updated);
                    }}
                    className="ml-1 hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Expenses */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-chart-5" />
            <CardTitle className="text-base">Expenses</CardTitle>
          </div>
          <CardDescription>
            Add your top expense categories with monthly amounts
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <NLPToggleField
            label="Expenses"
            placeholder='e.g., "Rent is 3k, payroll around 15k for 4 employees, supplies about 5k, marketing maybe 2k a month"'
            onExtract={(text) => {
              // AI would extract expense categories and amounts
            }}
          />

          {/* Quick add from common categories */}
          <div>
            <Label className="text-xs text-muted-foreground">Quick add</Label>
            <div className="flex flex-wrap gap-1.5 mt-1.5">
              {defaultExpenseCategories
                .filter(
                  (cat) =>
                    !(businessData.expenses || []).some((e) => e.name === cat)
                )
                .map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setNewExpenseName(cat)}
                    className="rounded-md border border-white/[0.08] px-2 py-1 text-xs text-muted-foreground hover:bg-white/[0.05] hover:text-foreground transition-colors"
                  >
                    + {cat}
                  </button>
                ))}
            </div>
          </div>

          <div className="flex items-end gap-2">
            <div className="flex-1 space-y-2">
              <Label>Category</Label>
              <Input
                placeholder="e.g., Payroll"
                value={newExpenseName}
                onChange={(e) => setNewExpenseName(e.target.value)}
              />
            </div>
            <div className="w-40 space-y-2">
              <Label>Amount ($)</Label>
              <Input
                type="number"
                placeholder="0"
                value={newExpenseAmount}
                onChange={(e) => setNewExpenseAmount(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddExpense()}
              />
            </div>
            <Button type="button" variant="outline" onClick={handleAddExpense}>
              <Plus className="h-3 w-3" />
            </Button>
          </div>

          {(businessData.expenses?.length ?? 0) > 0 && (
            <div className="space-y-2">
              {businessData.expenses!.map((expense) => (
                <div
                  key={expense.id}
                  className="flex items-center justify-between rounded-lg border border-white/[0.08] p-3"
                >
                  <div>
                    <p className="text-sm font-medium">{expense.name}</p>
                    <p className="text-xs text-muted-foreground">
                      ${expense.amount.toLocaleString()}/mo
                      {expense.isRecurring && " (recurring)"}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => removeExpense(expense.id)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
              <Separator />
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  Total Monthly Expenses
                </span>
                <span className="font-medium">
                  $
                  {businessData
                    .expenses!.reduce((sum, e) => sum + e.amount, 0)
                    .toLocaleString()}
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Cash & Debt */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-chart-4" />
            <CardTitle className="text-base">Cash & Debt</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Current Cash on Hand ($)</Label>
              <Input
                type="number"
                placeholder="0"
                value={businessData.cashOnHand || ""}
                onChange={(e) =>
                  setField("cashOnHand", parseFloat(e.target.value) || 0)
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Outstanding Debt ($)</Label>
              <Input
                type="number"
                placeholder="0"
                value={businessData.outstandingDebt || ""}
                onChange={(e) =>
                  setField("outstandingDebt", parseFloat(e.target.value) || 0)
                }
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Optional Fields */}
      <Card>
        <CardHeader
          className="cursor-pointer"
          onClick={() => setShowOptional(!showOptional)}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-chart-3" />
              <CardTitle className="text-base">
                Optional Details
              </CardTitle>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-xs">
                Improves accuracy
              </Badge>
              {showOptional ? (
                <ChevronUp className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              )}
            </div>
          </div>
          <CardDescription>
            Adding more detail improves simulation accuracy. You can skip these
            and add them later.
          </CardDescription>
        </CardHeader>
        {showOptional && (
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Revenue Trend</Label>
                <Select
                  value={businessData.revenueTrend || ""}
                  onValueChange={(v) =>
                    setField("revenueTrend", v as RevenueTrend)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select trend" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="growing">Growing</SelectItem>
                    <SelectItem value="flat">Flat</SelectItem>
                    <SelectItem value="declining">Declining</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Trend Rate (% per month)</Label>
                <Input
                  type="number"
                  placeholder="e.g., 5"
                  value={businessData.revenueTrendRate || ""}
                  onChange={(e) =>
                    setField(
                      "revenueTrendRate",
                      parseFloat(e.target.value) || 0
                    )
                  }
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Customer Count</Label>
                <Input
                  type="number"
                  placeholder="Approximate number of customers"
                  value={businessData.customerCount || ""}
                  onChange={(e) =>
                    setField("customerCount", parseInt(e.target.value) || 0)
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>Avg Transaction Size ($)</Label>
                <Input
                  type="number"
                  placeholder="e.g., 25"
                  value={businessData.avgTransactionSize || ""}
                  onChange={(e) =>
                    setField(
                      "avgTransactionSize",
                      parseFloat(e.target.value) || 0
                    )
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Gross Margin (%)</Label>
              <Input
                type="number"
                placeholder="e.g., 60"
                value={businessData.grossMargin || ""}
                onChange={(e) =>
                  setField("grossMargin", parseFloat(e.target.value) || 0)
                }
              />
            </div>

            <div className="space-y-2">
              <Label>Planned Changes</Label>
              <Textarea
                placeholder="e.g., Planning to hire 2 more people, considering expanding to a second location..."
                value={businessData.plannedChanges || ""}
                onChange={(e) => setField("plannedChanges", e.target.value)}
                className="min-h-[80px]"
              />
            </div>
          </CardContent>
        )}
      </Card>

      {/* Submit */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-muted-foreground">
            Your data is used only for simulation and is never shared.
          </p>
          {saveError ? (
            <p className="mt-1 text-xs text-destructive">{saveError}</p>
          ) : null}
        </div>
        <Button size="lg" disabled={isSaving} onClick={handleSave}>
          <Save className="mr-2 h-4 w-4" />
          {isSaving ? "Saving..." : "Save & Continue"}
        </Button>
      </div>
    </div>
  );
}
