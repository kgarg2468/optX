"use client";

import { useRef, useEffect, useCallback } from "react";
import { MessageSquare } from "lucide-react";
import { useChatStore } from "@/lib/store/chat-store";
import { ChatMessageBubble } from "./ChatMessageBubble";
import { ChatInput } from "./ChatInput";

interface ChatPanelProps {
  scenarioId?: string;
}

export function ChatPanel({ scenarioId }: ChatPanelProps) {
  const {
    messages,
    isStreaming,
    addMessage,
    setStreaming,
    setContext,
  } = useChatStore();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setContext(null, scenarioId ?? null);
  }, [scenarioId, setContext]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = useCallback(
    async (content: string) => {
      const userMessage = {
        id: crypto.randomUUID(),
        role: "user" as const,
        content,
        timestamp: new Date().toISOString(),
        context: { scenarioId },
      };
      addMessage(userMessage);

      const assistantMessage = {
        id: crypto.randomUUID(),
        role: "assistant" as const,
        content: "",
        timestamp: new Date().toISOString(),
      };
      addMessage(assistantMessage);
      setStreaming(true);

      try {
        const history = messages.map((m) => ({
          role: m.role,
          content: m.content,
        }));

        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: content,
            scenarioId,
            history,
          }),
        });

        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.error || "Chat request failed");
        }
        const { updateLastAssistantMessage } = useChatStore.getState();
        updateLastAssistantMessage(
          data.reply || "Sorry, I couldn't generate a response."
        );
      } catch {
        const { updateLastAssistantMessage } = useChatStore.getState();
        updateLastAssistantMessage(
          "Failed to connect to the AI service. Please try again."
        );
      } finally {
        setStreaming(false);
      }
    },
    [messages, scenarioId, addMessage, setStreaming]
  );

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 border-b border-border px-4 py-3">
        <MessageSquare className="h-4 w-4 text-muted-foreground" />
        <h3 className="text-sm font-medium">AI Chat</h3>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-3">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <MessageSquare className="h-8 w-8 text-muted-foreground/50 mb-2" />
            <p className="text-sm text-muted-foreground">
              Ask questions about your scenario or request modifications.
            </p>
          </div>
        ) : (
          messages.map((message) => (
            <ChatMessageBubble key={message.id} message={message} />
          ))
        )}
        {isStreaming && messages[messages.length - 1]?.content === "" && (
          <div className="flex items-center gap-1 px-3 py-2">
            <div className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-pulse" />
            <div className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-pulse [animation-delay:150ms]" />
            <div className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-pulse [animation-delay:300ms]" />
          </div>
        )}
      </div>

      <ChatInput onSend={handleSend} disabled={isStreaming} />
    </div>
  );
}
