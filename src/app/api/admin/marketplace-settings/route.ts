import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { recordAdminAudit } from "@/lib/admin-audit";

function optionalNumber(value: unknown): number | null | undefined {
  if (value === null || value === "" || (typeof value === "string" && value.trim() === "")) return null;
  if (typeof value !== "number" && typeof value !== "string") return undefined;
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export async function PATCH(request: Request) {
  const actor = await requireAdmin();
  const supabase = getSupabaseServerClient();
  if (!supabase) return NextResponse.json({ error: "Database is not configured." }, { status: 503 });

  let body: Record<string, unknown>;
  try {
    const value: unknown = await request.json();
    if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("Invalid body");
    body = value as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Request body must be a JSON object." }, { status: 400 });
  }

  const vendor = optionalNumber(body.vendor_commission_pct);
  const affiliate = optionalNumber(body.affiliate_commission_pct);
  const payable = optionalNumber(body.payable_after_days);
  const cookie = optionalNumber(body.referral_cookie_days);
  const payout = optionalNumber(body.min_payout_etb);
  if (vendor === undefined || (vendor !== null && (vendor < 0 || vendor > 100))) return NextResponse.json({ error: "Vendor commission must be empty or between 0 and 100." }, { status: 400 });
  if (affiliate === undefined || (affiliate !== null && (affiliate < 0 || affiliate > 100))) return NextResponse.json({ error: "Affiliate commission must be empty or between 0 and 100." }, { status: 400 });
  if (payable === undefined || payable === null || !Number.isInteger(payable) || payable < 0 || payable > 365) return NextResponse.json({ error: "Days until payable must be an integer from 0 to 365." }, { status: 400 });
  if (cookie === undefined || cookie === null || !Number.isInteger(cookie) || cookie < 1 || cookie > 365) return NextResponse.json({ error: "Referral cookie days must be an integer from 1 to 365." }, { status: 400 });
  if (payout === undefined || (payout !== null && payout < 0)) return NextResponse.json({ error: "Minimum payout must be empty or at least 0 ETB." }, { status: 400 });

  const values = {
    vendor_commission_pct: vendor,
    affiliate_commission_pct: affiliate,
    payable_after_days: payable,
    referral_cookie_days: cookie,
    min_payout_etb: payout,
    updated_at: new Date().toISOString(),
    updated_by: actor.id,
  };
  const { data: previous, error: previousError } = await supabase.from("marketplace_settings")
    .select("vendor_commission_pct,affiliate_commission_pct,payable_after_days,referral_cookie_days,min_payout_etb,updated_at,updated_by")
    .eq("id", true).maybeSingle();
  if (previousError) return NextResponse.json({ error: `Marketplace settings could not be read: ${previousError.message}` }, { status: 500 });
  if (!previous) return NextResponse.json({ error: "The marketplace settings row (id = true) was not found." }, { status: 404 });

  const { data, error } = await supabase.from("marketplace_settings").update(values)
    .eq("id", true).select("id").maybeSingle();
  if (error) return NextResponse.json({ error: `Marketplace settings could not be saved: ${error.message}` }, { status: 500 });
  if (!data) return NextResponse.json({ error: "The marketplace settings row (id = true) was not found." }, { status: 404 });
  const audit = await recordAdminAudit(supabase, {
    actor: actor.id,
    action: "marketplace_settings.update",
    table_name: "marketplace_settings",
    record_id: "singleton",
    old_data: previous,
    new_data: values,
  });
  return NextResponse.json({ ok: true, message: "Marketplace settings saved.", ...(audit.ok ? {} : { auditWarning: true }) });
}
