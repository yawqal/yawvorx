import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { recordAdminAudit } from "@/lib/admin-audit";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET() {
  // Not needed per spec, but we can implement for completeness
  await requireAdmin();
  const supabase = getSupabaseServerClient();
  if (!supabase) return NextResponse.json({ error: "Database is not configured." }, { status: 503 });
  const { data, error } = await supabase
    .from("directory_businesses")
    .select("id,slug,name,category,description,city,website,public_email,public_phone,status,created_at")
    .order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: `Directory businesses could not be loaded: ${error.message}` }, { status: 500 });
  return NextResponse.json({ businesses: data ?? [] });
}

export async function PATCH(request: Request) {
  const actor = await requireAdmin();
  const supabase = getSupabaseServerClient();
  if (!supabase) return NextResponse.json({ error: "Database is not configured." }, { status: 503 });

  let body: unknown;
  try { body = await request.json(); }
  catch { return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 }); }

  if (!body || typeof body !== "object" || Array.isArray(body))
    return NextResponse.json({ error: "Request body must be an object." }, { status: 400 });

  const values = body as Record<string, unknown>;

  const id = typeof values.id === "string" ? values.id.trim() : "";
  if (!UUID.test(id))
    return NextResponse.json({ error: "A valid business UUID is required." }, { status: 400 });

  const status = typeof values.status === "string" ? values.status.trim() : "";
  if (!["pending", "approved", "rejected"].includes(status))
    return NextResponse.json({ error: "Status must be one of: pending, approved, rejected." }, { status: 400 });

  const { data: updated, error: updateError } = await supabase
    .from("directory_businesses")
    .update({ status })
    .eq("id", id)
    .select()
    .single();

  if (updateError) return NextResponse.json({ error: `Business could not be updated: ${updateError.message}` }, { status: 500 });
  if (!updated) return NextResponse.json({ error: "Business not found." }, { status: 404 });

  const audit = await recordAdminAudit(supabase, {
    actor: actor.id,
    action: `directory.${status}`,
    table_name: "directory_businesses",
    record_id: id,
    new_data: updated,
  });

  return NextResponse.json({ ok: true, message: `Business ${status}.`, business: updated, ...(audit.ok ? {} : { auditWarning: true }) });
}