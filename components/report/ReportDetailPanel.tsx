"use client";

import { useState, useRef, useEffect } from "react";
import { X, Send } from "lucide-react";
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
  items: ReportDetailItem[];
  onDismiss: (id: string) => void;
}

export function ReportDetailPanel({ items, onDismiss }: ReportDetailPanelProps) {
  const [chatMessages, setChatMessages] = useState<
    { role: "user" | "assistant"; content: string }[]
  >([]);
  const [chatInput, setChatInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
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
      const itemsContext = items
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
    <div className="flex h-full flex-col border-l border-white/8 bg-black/40 backdrop-blur-xl shadow-[-20px_0_40px_rgba(0,0,0,0.3)]">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border/50 px-4 py-3">
        <h3 className="text-sm font-semibold">
          AI Analysis
          {items.length > 0 && (
            <span className="ml-2 text-[10px] text-muted-foreground font-normal">
              {items.length} selected
            </span>
          )}
        </h3>
      </div>

      <Tabs defaultValue="analysis" className="flex-1 flex flex-col">
        <TabsList className="mx-4 mt-3 grid w-auto grid-cols-2">
          <TabsTrigger value="analysis" className="text-xs">
            Analysis
          </TabsTrigger>
          <TabsTrigger value="chat" className="text-xs">
            Chat
            {items.length > 0 && (
              <span className="ml-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-amber-500/20 text-[9px] text-amber-400">
                {items.length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Analysis Tab */}
        <TabsContent value="analysis" className="flex-1 overflow-y-auto p-4 space-y-3">
          {items.length === 0 ? (
            <p className="text-xs text-muted-foreground py-8 text-center">
              Click any metric, row, or milestone to see AI analysis
            </p>
          ) : (
            items.map((item) => (
              <div
                key={item.id}
                className="rounded-lg border border-border/50 bg-muted/20 p-3 space-y-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-[10px] font-medium text-muted-foreground uppercase">
                      {item.type}
                    </p>
                    <p className="text-xs font-semibold">{item.title}</p>
                  </div>
                  <button
                    onClick={() => onDismiss(item.id)}
                    className="text-muted-foreground hover:text-foreground shrink-0"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>

                {item.current && item.projected && (
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-muted-foreground font-mono">{item.current}</span>
                    <span className="text-muted-foreground">&rarr;</span>
                    <span className="font-mono font-semibold">{item.projected}</span>
                  </div>
                )}

                {item.severity && (
                  <span
                    className={cn(
                      "inline-block rounded-full px-2 py-0.5 text-[10px] font-medium",
                      item.severity === "Low" && "bg-emerald-500/10 text-emerald-400",
                      item.severity === "Medium" && "bg-amber-500/10 text-amber-400",
                      item.severity === "High" && "bg-rose-500/10 text-rose-400"
                    )}
                  >
                    {item.severity} Severity
                  </span>
                )}

                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  {highlightFinanceTerms(item.aiDetail)}
                </p>
              </div>
            ))
          )}
        </TabsContent>

        {/* Chat Tab */}
        <TabsContent value="chat" className="flex-1 flex flex-col px-4 pb-4">
          {/* Pinned item chips */}
          {items.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-3">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium border border-amber-500/30 bg-amber-500/10"
                >
                  <span className="text-amber-400 truncate max-w-[100px]">{item.title}</span>
                  <button
                    onClick={() => onDismiss(item.id)}
                    className="ml-0.5 text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-2.5 w-2.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="flex-1 overflow-y-auto space-y-3 mb-3">
            {chatMessages.length === 0 && !isLoading && (
              <p className="text-xs text-muted-foreground py-4 text-center">
                {items.length > 0
                  ? `${items.length} item${items.length > 1 ? "s" : ""} pinned as context. Ask a question...`
                  : "Pin report items and ask questions..."}
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
                  <div className="rounded-xl bg-white/10 px-3 py-2 max-w-[85%]">
                    {msg.content}
                  </div>
                ) : (
                  <div className="rounded-xl border border-white/8 bg-white/[0.03] backdrop-blur-sm px-3.5 py-2.5 space-y-1">
                    <span className="text-[9px] font-medium text-muted-foreground uppercase tracking-wider">OptX</span>
                    <p className="text-xs leading-relaxed text-foreground">
                      {highlightFinanceTerms(msg.content)}
                    </p>
                  </div>
                )}
              </div>
            ))}
            {isLoading && (
              <div className="rounded-xl border border-white/8 bg-white/[0.03] px-4 py-3 space-y-2">
                <div className="h-1.5 w-3/4 rounded-full bg-white/15 animate-pulse" />
                <div className="h-1.5 w-1/2 rounded-full bg-white/10 animate-pulse [animation-delay:150ms]" />
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          <div className="flex gap-2">
            <Input
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSendChat()}
              placeholder="Ask about this report..."
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
