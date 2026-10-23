import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { recordAdminAudit } from "@/lib/admin-audit";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export async function GET() {
  await requireAdmin();
  const supabase = getSupabaseServerClient();
  if (!supabase) return NextResponse.json({ error: "Database is not configured." }, { status: 503 });
  const { data, error } = await supabase.from("freelancer_profiles")
    .select("id,display_name,slug,category,status,is_verified,created_at")
    .order("created_at", { ascending: false }).limit(300);
  if (error) return NextResponse.json({ error: `Freelancers could not be loaded: ${error.message}` }, { status: 500 });
  return NextResponse.json({ profiles: data ?? [] });
}
export async function POST(request: Request) {
  const actor = await requireAdmin();
  const supabase = getSupabaseServerClient();
  if (!supabase) return NextResponse.json({ error: "Database is not configured." }, { status: 503 });
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 }); }
  if (!body || typeof body !== "object" || Array.isArray(body)) return NextResponse.json({ error: "Request body must be an object." }, { status: 400 });
  const values = body as Record<string, unknown>;
  if (typeof values.id !== "string" || !UUID.test(values.id)) return NextResponse.json({ error: "A valid profile UUID is required." }, { status: 400 });
  if (!["approve", "reject", "verify", "unverify"].includes(String(values.action))) return NextResponse.json({ error: "Action must be approve, reject, verify, or unverify." }, { status: 400 });
  const action = values.action as "approve" | "reject" | "verify" | "unverify";
  const update = action === "approve" ? { status: "approved" } : action === "reject" ? { status: "rejected" } : { is_verified: action === "verify" };
  const { data, error } = await supabase.from("freelancer_profiles").update(update).eq("id", values.id).select("id").maybeSingle();
  if (error) return NextResponse.json({ error: `Freelancer update could not be saved: ${error.message}` }, { status: 500 });
  if (!data) return NextResponse.json({ error: "Freelancer profile was not found." }, { status: 404 });
  const audit = await recordAdminAudit(supabase, {
    actor: actor.id,
    action: `freelancer.${action}`,
    table_name: "freelancer_profiles",
    record_id: values.id,
    new_data: update,
  });
  return NextResponse.json({ ok: true, message: `Freelancer ${action === "verify" ? "verified" : action === "unverify" ? "verification removed" : action === "approve" ? "approved" : "rejected"}.`, ...(audit.ok ? {} : { auditWarning: true }) });
}
