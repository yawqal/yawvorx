import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { recordAdminAudit } from "@/lib/admin-audit";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(request: Request) {
  const actor = await requireAdmin();
  const supabase = getSupabaseServerClient();
  if (!supabase) return NextResponse.json({ error: "Database is not configured." }, { status: 503 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }
  if (!body || typeof body !== "object" || Array.isArray(body)) return NextResponse.json({ error: "Request body must be a JSON object." }, { status: 400 });
  const values = body as Record<string, unknown>;
  if (typeof values.id !== "string" || !UUID.test(values.id)) return NextResponse.json({ error: "A valid product UUID is required." }, { status: 400 });
  if (values.action !== "approve" && values.action !== "reject") return NextResponse.json({ error: "Action must be approve or reject." }, { status: 400 });

  const approvalStatus = values.action === "approve" ? "approved" : "rejected";
  const { data, error } = await supabase.from("products").update({ approval_status: approvalStatus })
    .eq("id", values.id).not("vendor_id", "is", null).select("id").maybeSingle();
  if (error) return NextResponse.json({ error: `Product review could not be saved: ${error.message}` }, { status: 500 });
  if (!data) return NextResponse.json({ error: "Vendor product was not found." }, { status: 404 });
  const audit = await recordAdminAudit(supabase, {
    actor: actor.id,
    action: `vendor_product.${values.action}`,
    table_name: "products",
    record_id: values.id,
    new_data: { approval_status: approvalStatus },
  });
  return NextResponse.json({ ok: true, message: `Product ${approvalStatus}.`, ...(audit.ok ? {} : { auditWarning: true }) });
}
