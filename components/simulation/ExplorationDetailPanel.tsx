"use client";

import { useState } from "react";
import { X, Send, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { NODE_CONFIGS } from "@/lib/utils/node-config";
import type { MockScenarioDetail, MockCausalNode } from "@/lib/mock/simulation-scenarios";

interface ExplorationDetailPanelProps {
  scenario: MockScenarioDetail;
  selectedNode: MockCausalNode | null;
  onClose: () => void;
}

// Pre-canned chat responses for demo
const DEMO_RESPONSES: Record<string, string> = {
  default:
    "Based on the causal model, this scenario shows strong interconnections between the key drivers. The confidence intervals suggest a reliable outcome within the projected range.",
  risk: "The primary risk factor is execution complexity. I'd recommend phasing the rollout over 3 months to reduce operational risk while maintaining the projected trajectory.",
  timeline:
    "The earliest impact will be seen in month 2-3 for the leading indicators. Full revenue impact typically materializes by month 6 based on similar DTC brand patterns.",
  cost: "The cost structure shifts are front-loaded. Expect months 1-3 to show higher costs before the efficiency gains kick in. Break-even on the additional investment occurs around month 5.",
};

function getConnectedNodes(scenario: MockScenarioDetail, nodeId: string) {
  const incoming = scenario.edges
    .filter((e) => e.target === nodeId)
    .map((e) => scenario.nodes.find((n) => n.id === e.source))
    .filter(Boolean) as MockCausalNode[];

  const outgoing = scenario.edges
    .filter((e) => e.source === nodeId)
    .map((e) => scenario.nodes.find((n) => n.id === e.target))
    .filter(Boolean) as MockCausalNode[];

  return { incoming, outgoing };
}

export function ExplorationDetailPanel({
  scenario,
  selectedNode,
  onClose,
}: ExplorationDetailPanelProps) {
  const [chatMessages, setChatMessages] = useState<
    { role: "user" | "assistant"; content: string }[]
  >([]);
  const [chatInput, setChatInput] = useState("");

  const handleSendChat = () => {
    if (!chatInput.trim()) return;
    const userMsg = chatInput.trim().toLowerCase();
    setChatMessages((prev) => [
      ...prev,
      { role: "user", content: chatInput.trim() },
    ]);
    setChatInput("");

    // Pick a canned response
    setTimeout(() => {
      let response = DEMO_RESPONSES.default;
      if (userMsg.includes("risk")) response = DEMO_RESPONSES.risk;
      else if (userMsg.includes("time") || userMsg.includes("when"))
        response = DEMO_RESPONSES.timeline;
      else if (userMsg.includes("cost") || userMsg.includes("spend"))
        response = DEMO_RESPONSES.cost;

      setChatMessages((prev) => [...prev, { role: "assistant", content: response }]);
    }, 600);
  };

  return (
    <div className="flex h-full flex-col border-l border-border/50 bg-card/50 backdrop-blur-sm">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border/50 px-4 py-3">
        <h3 className="text-sm font-semibold">
          {selectedNode ? selectedNode.label : "Scenario Overview"}
        </h3>
        <button
          onClick={onClose}
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <Tabs defaultValue="details" className="flex-1 flex flex-col">
        <TabsList className="mx-4 mt-3 grid w-auto grid-cols-2">
          <TabsTrigger value="details" className="text-xs">
            Details
          </TabsTrigger>
          <TabsTrigger value="chat" className="text-xs">
            Chat
          </TabsTrigger>
        </TabsList>

        {/* Details Tab */}
        <TabsContent value="details" className="flex-1 overflow-y-auto px-4 pb-4">
          {selectedNode ? (
            <NodeDetails scenario={scenario} node={selectedNode} />
          ) : (
            <ScenarioSummary scenario={scenario} />
          )}
        </TabsContent>

        {/* Chat Tab */}
        <TabsContent value="chat" className="flex-1 flex flex-col px-4 pb-4">
          <div className="flex-1 overflow-y-auto space-y-3 mb-3">
            {chatMessages.length === 0 && (
              <p className="text-xs text-muted-foreground py-4 text-center">
                Ask about this scenario...
              </p>
            )}
            {chatMessages.map((msg, i) => (
              <div
                key={i}
                className={cn(
                  "rounded-lg px-3 py-2 text-xs",
                  msg.role === "user"
                    ? "bg-primary/10 text-foreground ml-4"
                    : "bg-muted/50 text-foreground mr-4"
                )}
              >
                {msg.content}
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <Input
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSendChat()}
              placeholder="Ask about risks, timeline..."
              className="text-xs h-8"
            />
            <Button size="sm" className="h-8 w-8 p-0" onClick={handleSendChat}>
              <Send className="h-3.5 w-3.5" />
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ScenarioSummary({ scenario }: { scenario: MockScenarioDetail }) {
  const summaryItems = [
    { label: "Revenue Impact", value: scenario.revenueImpact },
    { label: "Cost Impact", value: scenario.costImpact },
    { label: "Net Profit Impact", value: scenario.netProfitImpact },
    { label: "Time to Impact", value: scenario.timeToImpact },
    { label: "Risk Level", value: scenario.riskLevel },
    { label: "Confidence", value: `${scenario.confidence}%` },
  ];

  return (
    <div className="space-y-4 pt-3">
      <p className="text-xs text-muted-foreground">{scenario.description}</p>

      <div className="space-y-2">
        {summaryItems.map((item) => (
          <div
            key={item.label}
            className="flex items-center justify-between rounded-lg bg-muted/30 px-3 py-2"
          >
            <span className="text-xs text-muted-foreground">{item.label}</span>
            <span className="text-xs font-semibold">{item.value}</span>
          </div>
        ))}
      </div>

      <div className="rounded-lg border border-border/50 p-3">
        <p className="text-[10px] font-medium text-muted-foreground mb-2">
          CAUSAL NODES
        </p>
        <p className="text-xs text-muted-foreground">
          {scenario.nodes.length} variables &middot;{" "}
          {scenario.edges.length} connections
        </p>
      </div>
    </div>
  );
}

function NodeDetails({
  scenario,
  node,
}: {
  scenario: MockScenarioDetail;
  node: MockCausalNode;
}) {
  const config = NODE_CONFIGS[node.category];
  const { incoming, outgoing } = getConnectedNodes(scenario, node.id);

  return (
    <div className="space-y-4 pt-3">
      {/* Category badge */}
      <Badge
        variant="outline"
        className={cn("text-[10px]", config.textClass, config.borderClass)}
      >
        {config.label}
      </Badge>

      {/* Current vs Proposed */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-lg bg-muted/30 p-3">
          <p className="text-[10px] text-muted-foreground mb-1">Current</p>
          <p className="text-sm font-mono font-semibold">{node.currentValue}</p>
        </div>
        <div className="rounded-lg bg-muted/30 p-3">
          <p className="text-[10px] text-muted-foreground mb-1">Proposed</p>
          <p className="text-sm font-mono font-semibold">{node.proposedValue}</p>
        </div>
      </div>

      {/* Delta */}
      <div className="rounded-lg bg-muted/30 p-3">
        <p className="text-[10px] text-muted-foreground mb-1">Change</p>
        <p className="text-lg font-bold">{node.delta}</p>
      </div>

      {/* Impact description */}
      <p className="text-xs text-muted-foreground">{node.impact}</p>

      {/* Connected Nodes */}
      {incoming.length > 0 && (
        <div>
          <p className="text-[10px] font-medium text-muted-foreground mb-2">
            DRIVEN BY
          </p>
          <div className="space-y-1.5">
            {incoming.map((n) => (
              <div
                key={n.id}
                className="flex items-center gap-2 text-xs text-muted-foreground"
              >
                <ArrowRight className="h-3 w-3 rotate-180" />
                <span>{n.label}</span>
                <span className="ml-auto font-mono text-[10px]">{n.delta}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {outgoing.length > 0 && (
        <div>
          <p className="text-[10px] font-medium text-muted-foreground mb-2">
            DRIVES
          </p>
          <div className="space-y-1.5">
            {outgoing.map((n) => (
              <div
                key={n.id}
                className="flex items-center gap-2 text-xs text-muted-foreground"
              >
                <ArrowRight className="h-3 w-3" />
                <span>{n.label}</span>
                <span className="ml-auto font-mono text-[10px]">{n.delta}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
