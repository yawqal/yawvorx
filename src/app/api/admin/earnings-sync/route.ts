import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { recordAdminAudit } from "@/lib/admin-audit";

export async function POST() {
  const admin = await requireAdmin();
  const supabase = getSupabaseServerClient();
  if (!supabase) return NextResponse.json({ error: "Database is not configured." }, { status: 503 });

  const { data, error } = await supabase.rpc("yvx_backfill_earnings");
  if (error) return NextResponse.json({ error: `Earnings sync failed: ${error.message}` }, { status: 500 });
  if (typeof data !== "number" || !Number.isInteger(data)) {
    return NextResponse.json({ error: "Earnings sync returned an invalid count." }, { status: 500 });
  }
  const audit = await recordAdminAudit(supabase, {
    actor: admin.id,
    action: "earnings.sync",
    table_name: "earnings_ledger",
    record_id: null,
    new_data: { count: data },
  });
  return NextResponse.json({ count: data, ...(audit.ok ? {} : { auditWarning: true }) });
}
