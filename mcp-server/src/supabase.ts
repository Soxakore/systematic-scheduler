import { createClient, SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (client) return client;

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY;

  if (!url || !key) {
    throw new Error(
      "Missing SUPABASE_URL or SUPABASE_SERVICE_KEY env vars. " +
      "Set them before starting the MCP server."
    );
  }

  client = createClient(url, key);
  return client;
}

/** Helper: get user_id from env (set per-session by the AI client) */
export function getUserId(): string {
  const id = process.env.SCHEDULER_USER_ID;
  if (!id) throw new Error("SCHEDULER_USER_ID env var is required to identify the user.");
  return id;
}
