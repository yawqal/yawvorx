// SERVER-SIDE authentication helpers. Security decisions are made here and in the database, never in the browser.
import { notFound, redirect } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export async function getCurrentUser() {
  const supabase = getSupabaseServerClient();
  if (!supabase) return null;
  const { data, error } = await supabase.auth.getUser(); // verified with Supabase, not just read from a cookie
  return error ? null : data.user;
}

export async function requireUser(next = "/account") {
  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(next)}`);
  return user;
}

/** Asks the database (is_admin() reads the protected user_roles table). */
export async function isCurrentUserAdmin(): Promise<boolean> {
  const supabase = getSupabaseServerClient();
  if (!supabase) return false;
  const { data, error } = await supabase.rpc("is_admin");
  return !error && data === true;
}

/** Non-admins get a normal 404 page, so the admin area is not even revealed to them. */
export async function requireAdmin() {
  const user = await requireUser("/admin");
  if (!(await isCurrentUserAdmin())) notFound();
  return user;
}
