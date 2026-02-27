import { NextRequest } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const SIMULATION_SYSTEM = `You are OptX AI, a business simulation assistant. You help users understand their simulation results, explore scenarios, and make data-driven decisions.

Be specific and reference numbers when available. Use markdown formatting to make your response easy to scan:
- Use **bold** for key terms and important numbers
- Use bullet lists (- item) for multiple points
- Use ### headers to separate major sections when the response is long
- Keep responses concise and actionable`;

const REPORT_SYSTEM = `You are OptX AI, a financial analyst assistant. Help users understand their report data, risks, and recommendations.

Use markdown formatting:
- Use **bold** for metrics, dollar amounts, and key findings
- Use bullet lists for multiple insights
- Use ### headers for distinct sections
- Be specific with numbers from the provided context`;

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { message, history = [], context = "simulation" } = body;

        const systemPrompt = context === "report" ? REPORT_SYSTEM : SIMULATION_SYSTEM;

        const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
            { role: "system", content: systemPrompt },
            ...history.map((m: { role: string; content: string }) => ({
                role: m.role as "user" | "assistant",
                content: m.content,
            })),
            { role: "user", content: message },
        ];

        const stream = await openai.chat.completions.create({
            model: "gpt-4o",
            messages,
            max_tokens: 1024,
            stream: true,
        });

        const encoder = new TextEncoder();

        const readable = new ReadableStream({
            async start(controller) {
                try {
                    for await (const chunk of stream) {
                        const delta = chunk.choices[0]?.delta?.content;
                        if (delta) {
                            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ delta })}\n\n`));
                        }
                    }
                    controller.enqueue(encoder.encode("data: [DONE]\n\n"));
                } catch (err) {
                    controller.enqueue(
                        encoder.encode(
                            `data: ${JSON.stringify({ error: err instanceof Error ? err.message : "Stream error" })}\n\n`
                        )
                    );
                } finally {
                    controller.close();
                }
            },
        });

        return new Response(readable, {
            headers: {
                "Content-Type": "text/event-stream",
                "Cache-Control": "no-cache",
                "X-Accel-Buffering": "no",
            },
        });
    } catch (error) {
        return new Response(
            JSON.stringify({ error: error instanceof Error ? error.message : "Failed to start stream" }),
            { status: 500, headers: { "Content-Type": "application/json" } }
        );
    }
}
