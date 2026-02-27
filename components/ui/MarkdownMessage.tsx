"use client";

import { cn } from "@/lib/utils";

interface MarkdownMessageProps {
    content: string;
    className?: string;
    streaming?: boolean;
}

/** Lightweight inline markdown renderer — no heavy deps. */
export function MarkdownMessage({ content, className, streaming }: MarkdownMessageProps) {
    const lines = content.split("\n");
    const nodes: React.ReactNode[] = [];
    let i = 0;

    while (i < lines.length) {
        const line = lines[i];

        // Skip empty lines (they become spacing)
        if (line.trim() === "") {
            nodes.push(<div key={i} className="h-2" />);
            i++;
            continue;
        }

        // ### H3 header
        if (line.startsWith("### ")) {
            nodes.push(
                <p key={i} className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mt-3 mb-1 first:mt-0">
                    {line.slice(4)}
                </p>
            );
            i++;
            continue;
        }

        // ## H2 header
        if (line.startsWith("## ")) {
            nodes.push(
                <p key={i} className="text-sm font-bold mt-3 mb-1 first:mt-0">
                    {renderInline(line.slice(3))}
                </p>
            );
            i++;
            continue;
        }

        // Bullet list — collect consecutive bullet lines
        if (line.match(/^[-*] /)) {
            const bullets: string[] = [];
            while (i < lines.length && lines[i].match(/^[-*] /)) {
                bullets.push(lines[i].slice(2));
                i++;
            }
            nodes.push(
                <ul key={`ul-${i}`} className="space-y-1 my-1">
                    {bullets.map((b, bi) => (
                        <li key={bi} className="flex items-start gap-2 text-xs leading-relaxed">
                            <span className="mt-[5px] h-1.5 w-1.5 rounded-full bg-lime-400/70 shrink-0" />
                            <span className="text-foreground/90">{renderInline(b)}</span>
                        </li>
                    ))}
                </ul>
            );
            continue;
        }

        // Numbered list
        if (line.match(/^\d+\. /)) {
            const items: { num: string; text: string }[] = [];
            while (i < lines.length && lines[i].match(/^\d+\. /)) {
                const m = lines[i].match(/^(\d+)\. (.*)$/);
                if (m) items.push({ num: m[1], text: m[2] });
                i++;
            }
            nodes.push(
                <ol key={`ol-${i}`} className="space-y-1 my-1">
                    {items.map((item, ii) => (
                        <li key={ii} className="flex items-start gap-2 text-xs leading-relaxed">
                            <span className="shrink-0 text-[10px] font-bold text-lime-400 w-4 mt-0.5">{item.num}.</span>
                            <span className="text-foreground/90">{renderInline(item.text)}</span>
                        </li>
                    ))}
                </ol>
            );
            continue;
        }

        // Normal paragraph
        nodes.push(
            <p key={i} className="text-xs leading-relaxed text-foreground/90">
                {renderInline(line)}
            </p>
        );
        i++;
    }

    return (
        <div className={cn("space-y-0.5", className)}>
            {nodes}
            {streaming && (
                <span className="inline-block w-0.5 h-3.5 bg-lime-400 animate-pulse ml-0.5 align-middle rounded-sm" />
            )}
        </div>
    );
}

/** Render inline markdown: **bold**, *italic*, `code` */
function renderInline(text: string): React.ReactNode {
    // Split on **bold**, *italic*, `code`
    const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g);

    return parts.map((part, i) => {
        if (part.startsWith("**") && part.endsWith("**")) {
            return <strong key={i} className="font-semibold text-foreground">{part.slice(2, -2)}</strong>;
        }
        if (part.startsWith("*") && part.endsWith("*")) {
            return <em key={i} className="italic text-foreground/80">{part.slice(1, -1)}</em>;
        }
        if (part.startsWith("`") && part.endsWith("`")) {
            return (
                <code key={i} className="font-mono text-[10px] bg-white/[0.08] text-lime-300 px-1 py-0.5 rounded">
                    {part.slice(1, -1)}
                </code>
            );
        }
        return part;
    });
}
