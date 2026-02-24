export interface SupabaseErrorLike {
  message: string;
  details?: string | null;
  hint?: string | null;
  code?: string | null;
}

export const REQUIRED_TABLES = [
  "businesses",
  "data_sources",
  "scenarios",
  "simulation_results",
  "reports",
  "chat_messages",
] as const;

const SCHEMA_MISSING_PATTERNS = [
  "could not find the table",
  "schema cache",
  "relation",
  "does not exist",
];

function normalizeMessage(error: SupabaseErrorLike): string {
  return `${error.message || ""} ${error.details || ""}`.toLowerCase();
}

export function isSchemaMissingError(error: SupabaseErrorLike | null | undefined): boolean {
  if (!error) return false;
  if (error.code === "42P01" || error.code === "PGRST205") return true;

  const message = normalizeMessage(error);
  return SCHEMA_MISSING_PATTERNS.every((pattern) =>
    pattern === "relation"
      ? message.includes("relation") && message.includes("does not exist")
      : message.includes(pattern)
  ) || message.includes("could not find the table");
}

export function extractMissingTableName(error: SupabaseErrorLike): string | null {
  const source = `${error.message || ""} ${error.details || ""}`;
  const quotedMatch = source.match(/table\s+'([^']+)'/i);
  if (quotedMatch?.[1]) return quotedMatch[1];

  const relationMatch = source.match(/relation\s+"([^"]+)"\s+does not exist/i);
  if (relationMatch?.[1]) return relationMatch[1];

  return null;
}

interface MapSupabaseErrorOptions {
  defaultMessage: string;
  notFoundMessage?: string;
  defaultStatus?: number;
  notFoundStatus?: number;
}

export function mapSupabaseError(
  error: SupabaseErrorLike | null | undefined,
  options: MapSupabaseErrorOptions
): { status: number; body: Record<string, unknown> } {
  if (!error) {
    return {
      status: options.defaultStatus ?? 500,
      body: { error: options.defaultMessage },
    };
  }

  if (isSchemaMissingError(error)) {
    const table = extractMissingTableName(error);
    const tableText = table ? ` Missing table: ${table}.` : "";

    return {
      status: 503,
      body: {
        error:
          "Supabase schema is missing required OptX tables for this project.",
        details: `${error.message || "Schema check failed"}${tableText}`,
        remediation:
          "Apply `supabase/migrations/001_initial_schema.sql` to the configured Supabase project and refresh the PostgREST schema cache.",
        code: error.code || null,
      },
    };
  }

  if (error.code === "PGRST116") {
    return {
      status: options.notFoundStatus ?? 404,
      body: {
        error: options.notFoundMessage || options.defaultMessage,
        details: error.message,
        code: error.code,
      },
    };
  }

  return {
    status: options.defaultStatus ?? 500,
    body: {
      error: options.defaultMessage,
      details: error.message,
      hint: error.hint || null,
      code: error.code || null,
    },
  };
}
