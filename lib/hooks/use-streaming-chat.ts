"use client";

import { useState, useCallback, useRef } from "react";

export interface ChatMessage {
    role: "user" | "assistant";
    content: string;
    streaming?: boolean;
}

interface UseStreamingChatOptions {
    context?: "simulation" | "report";
    buildContext?: () => string;
}

export function useStreamingChat({ context = "simulation", buildContext }: UseStreamingChatOptions = {}) {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [isStreaming, setIsStreaming] = useState(false);
    const abortRef = useRef<AbortController | null>(null);

    const send = useCallback(
        async (userInput: string) => {
            if (!userInput.trim() || isStreaming) return;

            // Build the message — optionally prepend context
            const contextPrefix = buildContext ? buildContext() : "";
            const fullMessage = contextPrefix
                ? `${contextPrefix}\n\n${userInput}`
                : userInput;

            // Snapshot history BEFORE adding new user message (exclude system context)
            const history = messages.map((m) => ({ role: m.role, content: m.content }));

            setMessages((prev) => [...prev, { role: "user", content: userInput }]);
            setIsStreaming(true);

            // Add empty assistant message to stream into
            setMessages((prev) => [...prev, { role: "assistant", content: "", streaming: true }]);

            try {
                abortRef.current = new AbortController();

                const res = await fetch("/api/chat/stream", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ message: fullMessage, history, context }),
                    signal: abortRef.current.signal,
                });

                if (!res.ok || !res.body) {
                    throw new Error(`HTTP ${res.status}`);
                }

                const reader = res.body.getReader();
                const decoder = new TextDecoder();
                let buffer = "";

                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;

                    buffer += decoder.decode(value, { stream: true });
                    const lines = buffer.split("\n");
                    buffer = lines.pop() ?? "";

                    for (const line of lines) {
                        if (!line.startsWith("data: ")) continue;
                        const data = line.slice(6).trim();
                        if (data === "[DONE]") break;

                        try {
                            const parsed = JSON.parse(data) as { delta?: string; error?: string };
                            if (parsed.error) throw new Error(parsed.error);
                            if (parsed.delta) {
                                setMessages((prev) => {
                                    const updated = [...prev];
                                    const last = updated[updated.length - 1];
                                    if (last?.role === "assistant") {
                                        updated[updated.length - 1] = {
                                            ...last,
                                            content: last.content + parsed.delta,
                                            streaming: true,
                                        };
                                    }
                                    return updated;
                                });
                            }
                        } catch {
                            // ignore parse errors from incomplete chunks
                        }
                    }
                }
            } catch (err) {
                if ((err as Error).name === "AbortError") return;
                setMessages((prev) => {
                    const updated = [...prev];
                    const last = updated[updated.length - 1];
                    if (last?.role === "assistant") {
                        updated[updated.length - 1] = {
                            ...last,
                            content: last.content || "Sorry, I couldn't connect to the AI service. Make sure the server is running.",
                            streaming: false,
                        };
                    }
                    return updated;
                });
            } finally {
                // Mark last message as done streaming
                setMessages((prev) => {
                    const updated = [...prev];
                    const last = updated[updated.length - 1];
                    if (last?.role === "assistant") {
                        updated[updated.length - 1] = { ...last, streaming: false };
                    }
                    return updated;
                });
                setIsStreaming(false);
            }
        },
        [messages, isStreaming, context, buildContext]
    );

    const cancel = useCallback(() => {
        abortRef.current?.abort();
    }, []);

    const clear = useCallback(() => {
        setMessages([]);
    }, []);

    return { messages, isStreaming, send, cancel, clear };
}
