import { createClient } from "@supabase/supabase-js";

interface SupabaseEnvDiagnostics {
  supabaseUrl: string;
  projectRefFromUrl: string | null;
  projectRefFromServiceKey: string | null;
}

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;

    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");
    const json = Buffer.from(padded, "base64").toString("utf8");
    return JSON.parse(json) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function getProjectRefFromUrl(supabaseUrl: string): string | null {
  try {
    const hostname = new URL(supabaseUrl).hostname;
    const [projectRef] = hostname.split(".");
    return projectRef || null;
  } catch {
    return null;
  }
}

export function getSupabaseEnvDiagnostics(): SupabaseEnvDiagnostics {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL is not set.");
  }

  if (!supabaseServiceKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set.");
  }

  const projectRefFromUrl = getProjectRefFromUrl(supabaseUrl);
  const payload = decodeJwtPayload(supabaseServiceKey);
  const projectRefFromServiceKey =
    typeof payload?.ref === "string" ? payload.ref : null;

  if (
    projectRefFromUrl &&
    projectRefFromServiceKey &&
    projectRefFromUrl !== projectRefFromServiceKey
  ) {
    throw new Error(
      `Supabase project mismatch: URL ref '${projectRefFromUrl}' does not match service-role ref '${projectRefFromServiceKey}'.`
    );
  }

  return {
    supabaseUrl,
    projectRefFromUrl,
    projectRefFromServiceKey,
  };
}

export function createServerClient() {
  const { supabaseUrl } = getSupabaseEnvDiagnostics();
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  return createClient(supabaseUrl, supabaseServiceKey);
}
