import { getSupabaseServerClient } from "@/lib/supabase/server";

type SupabaseClient = NonNullable<ReturnType<typeof getSupabaseServerClient>>;

type AdminAuditEntry = {
  actor: string;
  action: string;
  table_name: string;
  record_id?: string | null;
  old_data?: unknown;
  new_data?: unknown;
  reason?: string | null;
};

export async function recordAdminAudit(
  supabase: SupabaseClient,
  entry: AdminAuditEntry,
): Promise<{ ok: boolean }> {
  try {
    const { error } = await supabase.from("audit_log").insert({
      actor: entry.actor,
      action: entry.action,
      table_name: entry.table_name,
      record_id: entry.record_id ?? null,
      old_data: entry.old_data ?? null,
      new_data: entry.new_data ?? null,
      reason: entry.reason ?? null,
    });
    if (error) {
      console.error("Admin audit entry could not be written.");
      return { ok: false };
    }
    return { ok: true };
  } catch {
    console.error("Admin audit entry could not be written.");
    return { ok: false };
  }
}
