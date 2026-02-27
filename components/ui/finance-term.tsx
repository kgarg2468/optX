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
    <TooltipProvider>
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
          className="max-w-xs bg-card border border-border text-foreground"
        >
          <p className="text-xs">{definition}</p>
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
