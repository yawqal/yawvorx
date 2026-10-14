import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseEnv } from "./config";

let client: SupabaseClient | null = null;

/** Supabase client for the browser. Returns null when the site is not configured yet. */
export function getSupabaseBrowserClient(): SupabaseClient | null {
  const env = getSupabaseEnv();
  if (!env) return null;
  if (!client) client = createBrowserClient(env.url, env.key);
  return client;
}
