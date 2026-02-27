"use client";

import { useState, useRef, useEffect } from "react";
import { X, Send, Pin } from "lucide-react";
import { cn } from "@/lib/utils";
import { highlightFinanceTerms } from "@/components/ui/finance-term";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export interface ReportDetailItem {
  type: string;
  id: string;
  title: string;
  current?: string;
  projected?: string;
  aiDetail: string;
  severity?: "Low" | "Medium" | "High";
}

interface ReportDetailPanelProps {
  /** Items shown in the Analysis tab — additive, toggled by clicking report items */
  analysisItems: ReportDetailItem[];
  /** Items pinned into chat context via the thumbtack */
  pinnedItems: ReportDetailItem[];
  onDismissAnalysis: (id: string) => void;
  onDismissPinned: (id: string) => void;
  onPinAnalysis?: (item: ReportDetailItem) => void;
}

export function ReportDetailPanel({
  analysisItems,
  pinnedItems,
  onDismissAnalysis,
  onDismissPinned,
  onPinAnalysis,
}: ReportDetailPanelProps) {
  const [chatMessages, setChatMessages] = useState<
    { role: "user" | "assistant"; content: string }[]
  >([]);
  const [chatInput, setChatInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("analysis");
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages, isLoading]);

  const handleSendChat = async () => {
    if (!chatInput.trim() || isLoading) return;
    const userMsg = chatInput.trim();
    setChatMessages((prev) => [...prev, { role: "user", content: userMsg }]);
    setChatInput("");
    setIsLoading(true);

    try {
      const itemsContext = pinnedItems
        .map((i) => `${i.type}: ${i.title} — ${i.aiDetail}`)
        .join("\n");

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: `[Report context]\n${itemsContext}\n\n[User question]\n${userMsg}`,
          history: chatMessages.map((m) => ({ role: m.role, content: m.content })),
        }),
      });
      const data = await res.json();
      setChatMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.reply ?? data.error ?? "No response received." },
      ]);
    } catch {
      setChatMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Sorry, I couldn't connect to the AI service." },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-full flex-col border-l border-white/[0.08] glass-card shadow-[-20px_0_40px_rgba(0,0,0,0.3)]">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/[0.08] px-4 py-3">
        <h3 className="text-sm font-semibold">AI Analysis</h3>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="flex-1 flex flex-col min-h-0"
      >
        <TabsList className="mx-4 mt-3 grid w-auto grid-cols-2">
          <TabsTrigger
            value="analysis"
            className="text-xs data-[state=active]:text-lime-400 data-[state=active]:shadow-none"
          >
            Analysis
            {analysisItems.length > 0 && (
              <span className="ml-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-white/10 text-[9px] text-muted-foreground">
                {analysisItems.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger
            value="chat"
            className="text-xs data-[state=active]:text-lime-400 data-[state=active]:shadow-none"
          >
            Chat
            {pinnedItems.length > 0 && (
              <span className="ml-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-amber-500/20 text-[9px] text-amber-400">
                {pinnedItems.length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Analysis Tab — additive list */}
        <TabsContent value="analysis" className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
          {analysisItems.length === 0 ? (
            <p className="text-xs text-muted-foreground py-8 text-center flex flex-col items-center gap-1">
              <span>Click any metric, row, or milestone</span>
              <span className="text-muted-foreground/50">Click again to remove it</span>
            </p>
          ) : (
            analysisItems.map((item) => {
              const isPinned = pinnedItems.some((p) => p.id === item.id);
              return (
                <div
                  key={item.id}
                  className="rounded-lg border border-white/[0.08] bg-white/[0.03] p-4 space-y-3 relative group"
                >
                  <div className="flex items-start justify-between gap-2 pr-14">
                    <div>
                      <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-1">
                        {item.type}
                      </p>
                      <p className="text-sm font-semibold leading-tight">{item.title}</p>
                    </div>
                  </div>

                  {/* Action buttons: pin + dismiss */}
                  <div className="absolute top-3 right-3 flex items-center gap-1">
                    {onPinAnalysis && (
                      <button
                        onClick={() => onPinAnalysis(item)}
                        className={cn(
                          "h-7 w-7 flex items-center justify-center rounded-full transition-all border",
                          isPinned
                            ? "bg-amber-500/10 border-amber-500/30 text-amber-400"
                            : "bg-white/[0.02] border-white/[0.1] text-muted-foreground hover:bg-white/[0.06] hover:text-foreground"
                        )}
                        title={isPinned ? "Pinned to chat context" : "Pin to chat context"}
                      >
                        <Pin className={cn("h-3.5 w-3.5", isPinned && "fill-amber-400")} />
                      </button>
                    )}
                    <button
                      onClick={() => onDismissAnalysis(item.id)}
                      className="h-7 w-7 flex items-center justify-center rounded-full bg-white/[0.02] border border-white/[0.1] text-muted-foreground hover:bg-white/[0.06] hover:text-foreground transition-all"
                      title="Remove"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  {item.current && item.projected && (
                    <div className="flex items-center gap-2 text-xs py-1">
                      <span className="text-muted-foreground font-mono bg-black/20 px-1.5 py-0.5 rounded">
                        {item.current}
                      </span>
                      <span className="text-muted-foreground/60">&rarr;</span>
                      <span className="font-mono font-semibold text-lime-400 bg-lime-400/10 px-1.5 py-0.5 rounded">
                        {item.projected}
                      </span>
                    </div>
                  )}

                  {item.severity && (
                    <span
                      className={cn(
                        "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium border",
                        item.severity === "Low" && "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
                        item.severity === "Medium" && "bg-amber-500/10 text-amber-400 border-amber-500/20",
                        item.severity === "High" && "bg-rose-500/10 text-rose-400 border-rose-500/20"
                      )}
                    >
                      {item.severity} Severity
                    </span>
                  )}

                  <div className="pt-2 border-t border-white/[0.08]">
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {highlightFinanceTerms(item.aiDetail)}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </TabsContent>

        {/* Chat Tab */}
        <TabsContent value="chat" className="flex-1 flex flex-col px-4 pb-4 min-h-0">
          {/* Pinned item chips */}
          {pinnedItems.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-3 shrink-0">
              {pinnedItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-1 rounded-full px-2 py-[3px] text-[10px] font-medium border border-amber-500/30 bg-amber-500/10"
                >
                  <Pin className="h-2.5 w-2.5 text-amber-400 fill-amber-400" />
                  <span className="text-amber-400 truncate max-w-[120px]">{item.title}</span>
                  <button
                    onClick={() => onDismissPinned(item.id)}
                    className="ml-0.5 text-amber-400/60 hover:text-amber-400 transition-colors"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="flex-1 overflow-y-auto space-y-3 mb-3 pr-1">
            {chatMessages.length === 0 && !isLoading && (
              <p className="text-xs text-muted-foreground py-4 text-center">
                {pinnedItems.length > 0
                  ? `${pinnedItems.length} item${pinnedItems.length > 1 ? "s" : ""} in context. Ask a question...`
                  : "Pin report items to add them to context..."}
              </p>
            )}
            {chatMessages.map((msg, i) => (
              <div
                key={i}
                className={cn(
                  "text-xs",
                  msg.role === "user" ? "flex justify-end" : ""
                )}
              >
                {msg.role === "user" ? (
                  <div className="rounded-xl bg-lime-400/10 text-lime-400 px-3 py-2 max-w-[85%] border border-lime-400/20">
                    {msg.content}
                  </div>
                ) : (
                  <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-sm px-3.5 py-2.5 space-y-1">
                    <span className="text-[9px] font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                      <div className="h-1.5 w-1.5 rounded-full bg-lime-400" />
                      OptX
                    </span>
                    <p className="text-xs leading-relaxed text-foreground/90">
                      {highlightFinanceTerms(msg.content)}
                    </p>
                  </div>
                )}
              </div>
            ))}
            {isLoading && (
              <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3 space-y-2">
                <div className="h-1.5 w-3/4 rounded-full bg-white/10 animate-pulse" />
                <div className="h-1.5 w-1/2 rounded-full bg-white/5 animate-pulse [animation-delay:150ms]" />
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          <div className="flex gap-2 shrink-0 pt-2 border-t border-white/[0.05]">
            <Input
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSendChat();
                }
              }}
              placeholder="Ask about context..."
              className="text-xs h-9 bg-black/20 border-white/[0.1] focus-visible:border-lime-400/50"
            />
            <Button
              size="sm"
              className="h-9 w-9 p-0 bg-white/10 text-white hover:bg-white/20 hover:text-white"
              onClick={handleSendChat}
            >
              <Send className="h-3.5 w-3.5" />
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
