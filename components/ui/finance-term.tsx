"use client";

import React from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  FINANCE_GLOSSARY,
  FINANCE_TERMS_REGEX,
} from "@/lib/mock/finance-glossary";

function FinanceTerm({ term }: { term: string }) {
  const key = Object.keys(FINANCE_GLOSSARY).find(
    (k) => k.toLowerCase() === term.toLowerCase()
  );
  const definition = key ? FINANCE_GLOSSARY[key] : term;

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            className="text-keyword-purple font-medium underline decoration-dotted decoration-keyword-purple/50 underline-offset-2 cursor-help"
          >
            {term}
          </span>
        </TooltipTrigger>
        <TooltipContent
          side="top"
          className="z-[200] max-w-xs rounded-xl px-4 py-3 bg-[oklch(0.08_0.005_285/0.97)] backdrop-blur-2xl border border-white/15 shadow-[0_8px_32px_rgba(0,0,0,0.8),inset_0_1px_0_rgba(255,255,255,0.08)]"
        >
          <p className="text-keyword-purple font-medium text-xs mb-1">{key ?? term}</p>
          <p className="text-xs text-white/80">{definition}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export function highlightFinanceTerms(text: string): React.ReactNode {
  // Reset regex lastIndex since it's global
  FINANCE_TERMS_REGEX.lastIndex = 0;

  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = FINANCE_TERMS_REGEX.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    parts.push(<FinanceTerm key={`ft-${match.index}`} term={match[0]} />);
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts.length > 0 ? <>{parts}</> : text;
}
