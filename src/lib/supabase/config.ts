// Reads the PUBLIC Supabase settings. Only the project URL and the publishable (anon) key belong here.
// NEVER put a service_role or secret key in any NEXT_PUBLIC_ variable: it would be visible to everyone.
export function getSupabaseEnv(): { url: string; key: string } | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key || url.startsWith("REPLACE_") || key.startsWith("REPLACE_")) return null;
  if (!/^https?:\/\//.test(url)) return null;
  return { url, key };
}
