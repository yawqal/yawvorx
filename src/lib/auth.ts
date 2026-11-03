// SERVER-SIDE authentication helpers. Security decisions are made here and in the database, never in the browser.
import { notFound, redirect } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export async function getCurrentUser() {
  const supabase = getSupabaseServerClient();
  if (!supabase) return null;
  const { data, error } = await supabase.auth.getUser();
  return error ? null : data.user;
}

export async function requireUser(next = "/account") {
  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(next)}`);
  return user;
}

/**
 * Centralized Permission Check.
 * Validates against RBAC schema implemented in migrations 015-018.
 */
export async function hasPermission(permissionCode: string, scopeId?: string): Promise<boolean> {
  const supabase = getSupabaseServerClient();
  if (!supabase) return false;
  const { data, error } = await supabase.rpc("has_permission", {
    uid: (await supabase.auth.getUser()).data.user?.id,
    perm_code: permissionCode,
    scope_val: scopeId || null
  });
  return !error && data === true;
}

/** Asks the database (is_admin() reads the protected user_roles table or user_roles_v2). */
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
