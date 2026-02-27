"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { X, Send, Square } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { NODE_CONFIGS } from "@/lib/utils/node-config";
import { highlightFinanceTerms } from "@/components/ui/finance-term";
import { MarkdownMessage } from "@/components/ui/MarkdownMessage";
import { useStreamingChat } from "@/lib/hooks/use-streaming-chat";
import type { ScenarioDetail, CausalNode } from "@/lib/types";

interface ExplorationDetailPanelProps {
  scenario: ScenarioDetail;
  selectedNode: CausalNode | null;
  onClose: () => void;
  pinnedNodes?: CausalNode[];
  onUnpin?: (nodeId: string) => void;
  businessId?: string;
}

function buildChatContext(
  scenario: ScenarioDetail,
  selectedNode: CausalNode | null,
  pinnedNodes: CausalNode[]
): string {
  const parts: string[] = [
    `**Scenario:** ${scenario.title}`,
    `${scenario.description}`,
    `**Revenue Impact:** ${scenario.revenueImpact} | **Cost Impact:** ${scenario.costImpact} | **Net Profit:** ${scenario.netProfitImpact}`,
    `**Confidence:** ${scenario.confidence}% | **Risk:** ${scenario.riskLevel}`,
  ];
  if (selectedNode) {
    parts.push(
      `**Selected node:** ${selectedNode.label} (${selectedNode.category}) — ${selectedNode.currentValue} → ${selectedNode.proposedValue} (${selectedNode.delta}). ${selectedNode.impact}`
    );
  }
  if (pinnedNodes.length > 0) {
    parts.push(
      `**Pinned nodes:** ${pinnedNodes.map((n) => `${n.label} (${n.delta})`).join(", ")}`
    );
  }
  return `[Scenario Context]\n${parts.join("\n")}`;
}

function generateAIInsight(node: CausalNode): string {
  const insights: Record<string, string> = {
    financial: `This financial metric shifts from **${node.currentValue}** to **${node.proposedValue}** — a **${node.delta}** change that directly impacts the bottom line. The causal model shows this is a high-leverage variable for profitability.`,
    market: `Market dynamics drive this **${node.delta}** shift. Moving from **${node.currentValue}** to **${node.proposedValue}** in ${node.label} represents a significant competitive move that cascades through downstream revenue nodes.`,
    brand: `Brand perception metrics like ${node.label} have delayed but compounding effects. The **${node.delta}** improvement builds organic momentum that reduces long-term CAC and strengthens customer LTV.`,
    operations: `Operational improvements of **${node.delta}** in ${node.label} create sustainable cost advantages. Moving from **${node.currentValue}** to **${node.proposedValue}** compounds over time through efficiency gains.`,
    metric: `This KPI tracks the combined effect of upstream changes. The **${node.delta}** movement in ${node.label} reflects the aggregate impact of multiple causal drivers in the model.`,
    logic: `This logic node governs conditional effects. When ${node.label} changes by **${node.delta}**, it triggers downstream adjustments across connected variables.`,
  };
  return insights[node.category] ?? insights.metric!;
}

function getConnectedNodes(scenario: ScenarioDetail, nodeId: string) {
  const incoming = scenario.edges
    .filter((e) => e.target === nodeId)
    .map((e) => scenario.nodes.find((n) => n.id === e.source))
    .filter(Boolean) as CausalNode[];

  const outgoing = scenario.edges
    .filter((e) => e.source === nodeId)
    .map((e) => scenario.nodes.find((n) => n.id === e.target))
    .filter(Boolean) as CausalNode[];

  return { incoming, outgoing };
}

export function ExplorationDetailPanel({
  scenario,
  selectedNode,
  onClose,
  pinnedNodes = [],
  onUnpin,
  businessId,
}: ExplorationDetailPanelProps) {
  const chatEndRef = useRef<HTMLDivElement>(null);
  const [chatInput, setChatInput] = useState("");

  const buildContext = useCallback(
    () => buildChatContext(scenario, selectedNode, pinnedNodes),
    [scenario, selectedNode, pinnedNodes]
  );

  const { messages, isStreaming, send, cancel } = useStreamingChat({
    context: "simulation",
    buildContext,
  });

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isStreaming]);

  const handleSend = () => {
    const msg = chatInput.trim();
    if (!msg) return;
    setChatInput("");
    send(msg);
  };

  return (
    <div className="flex h-full flex-col border-l border-white/[0.08] glass-card backdrop-blur-xl shadow-[-20px_0_40px_rgba(0,0,0,0.3)]">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/[0.08] px-4 py-3">
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

      <Tabs defaultValue="details" className="flex-1 flex flex-col min-h-0">
        <TabsList className="mx-4 mt-3 grid w-auto grid-cols-2 shrink-0">
          <TabsTrigger value="details" className="text-xs">
            Details
          </TabsTrigger>
          <TabsTrigger value="chat" className="text-xs">
            Chat
            {pinnedNodes.length > 0 && (
              <span className="ml-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-amber-500/20 text-[9px] text-amber-400">
                {pinnedNodes.length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Details Tab */}
        <TabsContent value="details" className="flex-1 overflow-y-auto px-4 pb-4 min-h-0">
          {selectedNode ? (
            <NodeDetails scenario={scenario} node={selectedNode} />
          ) : (
            <ScenarioSummary scenario={scenario} />
          )}
        </TabsContent>

        {/* Chat Tab */}
        <TabsContent value="chat" className="flex-1 flex flex-col px-4 pb-4 min-h-0">
          {/* Pinned node chips */}
          {pinnedNodes.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-3 shrink-0">
              {pinnedNodes.map((node) => {
                const config = NODE_CONFIGS[node.category];
                return (
                  <div
                    key={node.id}
                    className={cn(
                      "flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium border",
                      config.borderClass,
                      config.bgClass
                    )}
                  >
                    <span className={config.textClass}>{node.label}</span>
                    {onUnpin && (
                      <button
                        onClick={() => onUnpin(node.id)}
                        className="ml-0.5 text-muted-foreground hover:text-foreground"
                      >
                        <X className="h-2.5 w-2.5" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          <div className="flex-1 overflow-y-auto space-y-3 mb-3 pr-1 min-h-0">
            {messages.length === 0 && (
              <p className="text-xs text-muted-foreground py-4 text-center">
                {pinnedNodes.length > 0
                  ? `${pinnedNodes.length} node${pinnedNodes.length > 1 ? "s" : ""} pinned. Ask a question…`
                  : "Ask about this scenario…"}
              </p>
            )}

            {messages.map((msg, i) => (
              <div
                key={i}
                className={cn("text-xs", msg.role === "user" ? "flex justify-end" : "")}
              >
                {msg.role === "user" ? (
                  <div className="rounded-xl bg-white/10 px-3 py-2 max-w-[85%] text-xs">
                    {msg.content}
                  </div>
                ) : (
                  <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-sm px-3.5 py-2.5 space-y-1.5">
                    <div className="flex items-center gap-1.5">
                      <div className="h-1.5 w-1.5 rounded-full bg-lime-400" />
                      <span className="text-[9px] font-medium text-muted-foreground uppercase tracking-wider">
                        OptX
                      </span>
                      {msg.streaming && (
                        <span className="text-[9px] text-muted-foreground/50 animate-pulse">
                          thinking…
                        </span>
                      )}
                    </div>
                    <MarkdownMessage
                      content={msg.content}
                      streaming={msg.streaming}
                    />
                  </div>
                )}
              </div>
            ))}

            {/* Typing skeleton when waiting for first token */}
            {isStreaming && messages[messages.length - 1]?.content === "" && (
              <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3 space-y-2">
                <div className="h-1.5 w-3/4 rounded-full bg-white/15 animate-pulse" />
                <div className="h-1.5 w-1/2 rounded-full bg-white/10 animate-pulse [animation-delay:150ms]" />
              </div>
            )}

            <div ref={chatEndRef} />
          </div>

          <div className="flex gap-2 shrink-0">
            <Input
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
              placeholder="Ask about risks, timeline…"
              className="text-xs h-8"
            />
            {isStreaming ? (
              <Button
                size="sm"
                variant="outline"
                className="h-8 w-8 p-0 border-rose-500/30 text-rose-400 hover:bg-rose-500/10"
                onClick={cancel}
                title="Stop"
              >
                <Square className="h-3 w-3 fill-current" />
              </Button>
            ) : (
              <Button size="sm" className="h-8 w-8 p-0" onClick={handleSend}>
                <Send className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ScenarioSummary({ scenario }: { scenario: ScenarioDetail }) {
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
      <p className="text-xs text-muted-foreground">
        {highlightFinanceTerms(scenario.description)}
      </p>

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

      <div className="rounded-lg border border-white/[0.08] p-3">
        <p className="text-[10px] font-medium text-muted-foreground mb-2">CAUSAL NODES</p>
        <p className="text-xs text-muted-foreground">
          {scenario.nodes.length} variables &middot; {scenario.edges.length} connections
        </p>
      </div>
    </div>
  );
}

function NodeDetails({ scenario, node }: { scenario: ScenarioDetail; node: CausalNode }) {
  const config = NODE_CONFIGS[node.category];
  const { incoming, outgoing } = getConnectedNodes(scenario, node.id);
  const aiInsight = generateAIInsight(node);

  return (
    <div className="space-y-4 pt-3">
      <Badge variant="outline" className={cn("text-[10px]", config.textClass, config.borderClass)}>
        {config.label}
      </Badge>

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

      <div className="rounded-lg bg-muted/30 p-3">
        <p className="text-[10px] text-muted-foreground mb-1">Change</p>
        <p className="text-lg font-bold">{node.delta}</p>
      </div>

      <p className="text-xs text-muted-foreground">{highlightFinanceTerms(node.impact)}</p>

      <div className="rounded-xl glass-card px-3.5 py-3 space-y-1.5">
        <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
          AI Insight
        </p>
        <MarkdownMessage content={aiInsight} className="text-muted-foreground" />
      </div>

      {incoming.length > 0 && (
        <div>
          <p className="text-[10px] font-medium text-muted-foreground mb-2">DRIVEN BY</p>
          <div className="space-y-1.5">
            {incoming.map((n) => (
              <div key={n.id} className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="text-lg leading-none">←</span>
                <span>{n.label}</span>
                <span className="ml-auto font-mono text-[10px]">{n.delta}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {outgoing.length > 0 && (
        <div>
          <p className="text-[10px] font-medium text-muted-foreground mb-2">DRIVES</p>
          <div className="space-y-1.5">
            {outgoing.map((n) => (
              <div key={n.id} className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="text-lg leading-none">→</span>
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
