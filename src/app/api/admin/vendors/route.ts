import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { rateLimit } from "@/lib/rate-limit";
import { recordAdminAudit } from "@/lib/admin-audit";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * GET /api/admin/vendors
 * Returns all vendor_profiles joined with their latest vendor_application
 * for the admin vendor management console.
 */
export async function GET(request: Request) {
  const limited = rateLimit(request, "vendor-admin-get", 30, 60_000);
  if (limited) return limited;
  const actor = await requireAdmin();

  const supabase = getSupabaseServerClient();
  if (!supabase) return NextResponse.json({ error: "Database is not configured." }, { status: 503 });

  // Load vendor profiles and their corresponding applications in parallel
  const [profilesResult, applicationsResult] = await Promise.all([
    supabase.from("vendor_profiles")
      .select("user_id,display_name,status,created_at,updated_at")
      .order("created_at", { ascending: false }),
    supabase.from("vendor_applications")
      .select("user_id,business_name,contact_value,status,referral_code,created_at,reviewed_at")
      .order("created_at", { ascending: false }),
  ]);

  if (profilesResult.error) {
    console.error("Failed to fetch vendor profiles", { userId: actor.id, error: profilesResult.error });
    return NextResponse.json({ error: "Failed to fetch vendor profiles." }, { status: 500 });
  }

  const appMap = new Map((applicationsResult.data ?? []).map((a) => [a.user_id, a]));

  const vendors = (profilesResult.data ?? []).map((profile) => {
    const app = appMap.get(profile.user_id);
    return {
      user_id: profile.user_id,
      display_name: profile.display_name,
      profile_status: profile.status,
      profile_created_at: profile.created_at,
      application_status: app?.status ?? null,
      business_name: app?.business_name ?? null,
      contact_value: app?.contact_value ?? null,
      referral_code: app?.referral_code ?? null,
      application_created_at: app?.created_at ?? null,
      reviewed_at: app?.reviewed_at ?? null,
    };
  });

  return NextResponse.json({ vendors });
}

/**
 * PATCH /api/admin/vendors
 * Update a vendor_profile status (active / suspended).
 * Body: { user_id: string, status: "active" | "suspended" }
 */
export async function PATCH(request: Request) {
  const limited = rateLimit(request, "vendor-admin-patch", 10, 60_000);
  if (limited) return limited;
  const actor = await requireAdmin();

  let payload: unknown;
  try { payload = await request.json(); }
  catch { return NextResponse.json({ error: "Invalid JSON payload." }, { status: 400 }); }

  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  const record = payload as Record<string, unknown>;
  const userId = typeof record.user_id === "string" && UUID.test(record.user_id) ? record.user_id : null;
  const status = record.status === "active" || record.status === "suspended" ? record.status : null;

  if (!userId || !status) {
    return NextResponse.json({ error: "A valid user_id and status (active or suspended) are required." }, { status: 400 });
  }

  const supabase = getSupabaseServerClient();
  if (!supabase) return NextResponse.json({ error: "Database is not configured." }, { status: 503 });

  const { data: existing, error: lookupError } = await supabase
    .from("vendor_profiles").select("user_id,status").eq("user_id", userId).maybeSingle();
  if (lookupError || !existing) {
    return NextResponse.json({ error: "Vendor profile not found." }, { status: 404 });
  }

  const { error: updateError } = await supabase
    .from("vendor_profiles").update({ status, updated_at: new Date().toISOString() }).eq("user_id", userId);
  if (updateError) {
    console.error("Failed to update vendor profile status", { userId, error: updateError });
    return NextResponse.json({ error: "Vendor profile status could not be updated." }, { status: 500 });
  }

  const audit = await recordAdminAudit(supabase, {
    actor: actor.id,
    action: `vendor_profile.${status}`,
    table_name: "vendor_profiles",
    record_id: userId,
    old_data: { status: existing.status },
    new_data: { status },
  });

  return NextResponse.json({ ok: true, ...(audit.ok ? {} : { auditWarning: true }) });
}
