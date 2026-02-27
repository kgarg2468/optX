"use client";

import { cn } from "@/lib/utils";
import type { ChatMessage } from "@/lib/types";
import { Bot, User } from "lucide-react";

interface ChatMessageBubbleProps {
  message: ChatMessage;
}

export function ChatMessageBubble({ message }: ChatMessageBubbleProps) {
  const isUser = message.role === "user";

  return (
    <div className={cn("flex gap-2", isUser && "flex-row-reverse")}>
      <div
        className={cn(
          "flex h-7 w-7 shrink-0 items-center justify-center rounded-full",
          isUser ? "bg-white/10" : "bg-white/[0.03] border border-white/8"
        )}
      >
        {isUser ? (
          <User className="h-3.5 w-3.5 text-foreground" />
        ) : (
          <Bot className="h-3.5 w-3.5 text-muted-foreground" />
        )}
      </div>
      <div
        className={cn(
          "max-w-[85%] rounded-xl px-3.5 py-2.5 text-sm",
          isUser
            ? "bg-white/10 text-foreground"
            : "border border-white/8 bg-white/[0.03] backdrop-blur-sm text-foreground"
        )}
      >
        {!isUser && (
          <span className="block text-[9px] font-medium text-muted-foreground uppercase tracking-wider mb-1">
            OptX
          </span>
        )}
        <p className="whitespace-pre-wrap">{message.content}</p>
      </div>
    </div>
  );
}
