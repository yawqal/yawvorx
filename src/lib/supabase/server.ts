import type { CookieOptions } from "@supabase/ssr";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getSupabaseEnv } from "./config";

/** Supabase client for server code (pages, route handlers). Runs as the signed-in user, so database rules (RLS) apply. */
export function getSupabaseServerClient() {
  const env = getSupabaseEnv();
  if (!env) return null;
  return createServerClient(env.url, env.key, {
    cookies: {
      getAll: async () => (await cookies()).getAll(),
      async setAll(list: { name: string; value: string; options: CookieOptions }[]) {
        const cookieStore = await cookies();
        try {
          list.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          /* Called from a Server Component: the middleware refreshes the session instead. */
        }
      },
    },
  });
}
