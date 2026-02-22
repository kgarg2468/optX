"use client";

import { useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { QuickStartForm } from "@/components/data/QuickStartForm";
import { DataBoxGrid } from "@/components/data/DataBoxGrid";
import { useBusinessStore } from "@/lib/store/business-store";

export default function DataPage() {
  const {
    businessData,
    dataEntryMode,
    setDataEntryMode,
    setBusinessData,
    setDataSources,
  } = useBusinessStore();

  useEffect(() => {
    if (!businessData.id) return;

    const controller = new AbortController();
    const load = async () => {
      try {
        const res = await fetch(`/api/data?businessId=${businessData.id}`, {
          signal: controller.signal,
        });
        const payload = await res.json();
        if (!res.ok || !payload.success) return;
        if (payload.business) setBusinessData(payload.business);
        if (payload.dataSources) setDataSources(payload.dataSources);
      } catch {
        // best-effort hydration, keep local state if network fails
      }
    };

    void load();
    return () => controller.abort();
  }, [businessData.id, setBusinessData, setDataSources]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Data Ingestion</h2>
        <p className="text-muted-foreground mt-1">
          Add your business data to power AI-driven simulations. Start with the
          Quick Start form or upload detailed financial data.
        </p>
      </div>

      <Tabs
        value={dataEntryMode}
        onValueChange={(v) => setDataEntryMode(v as "quick_start" | "advanced")}
      >
        <TabsList>
          <TabsTrigger value="quick_start">Quick Start</TabsTrigger>
          <TabsTrigger value="advanced">Advanced Data Sources</TabsTrigger>
        </TabsList>
        <TabsContent value="quick_start" className="mt-6">
          <QuickStartForm />
        </TabsContent>
        <TabsContent value="advanced" className="mt-6">
          <DataBoxGrid />
        </TabsContent>
      </Tabs>
    </div>
  );
}
