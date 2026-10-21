import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { getSupabaseServerClient } from "@/lib/supabase/server";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function fail(error: string, status = 400) {
  return NextResponse.json({ error }, { status });
}

export async function POST(request: Request) {
  const admin = await requireAdmin();
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return fail("Invalid JSON request body.");
  }
  if (!body || typeof body !== "object" || Array.isArray(body)) return fail("Invalid request body.");
  const payload = body as Record<string, unknown>;
  const beneficiaryId = payload.beneficiary_user_id;
  const currency = payload.currency;
  const amountRaw = payload.amount;
  const referenceRaw = payload.reference ?? "";
  const noteRaw = payload.note ?? "";
  if (typeof beneficiaryId !== "string" || !UUID_PATTERN.test(beneficiaryId)) return fail("A valid beneficiary id is required.");
  if (currency !== "ETB" && currency !== "USD") return fail("Currency must be ETB or USD.");
  if ((typeof amountRaw !== "string" && typeof amountRaw !== "number") ||
      !/^(?:0|[1-9]\d*)(?:\.\d{1,2})?$/.test(String(amountRaw))) {
    return fail("Amount must be positive and have at most two decimal places.");
  }
  const amount = Number(amountRaw);
  if (!Number.isFinite(amount) || amount <= 0) return fail("Amount must be greater than zero.");
  if (typeof referenceRaw !== "string" || referenceRaw.length > 200) return fail("Bank reference must be 200 characters or fewer.");
  if (typeof noteRaw !== "string" || noteRaw.length > 2000) return fail("Note must be 2000 characters or fewer.");

  const supabase = getSupabaseServerClient();
  if (!supabase) return fail("Database is not configured.", 503);
  const { data: balance, error: balanceError } = await supabase.from("earnings_balances")
    .select("due").eq("user_id", beneficiaryId).eq("currency", currency).maybeSingle();
  if (balanceError) return fail(`Could not verify the beneficiary balance: ${balanceError.message}`, 500);
  if (!balance) return fail("No balance exists for this beneficiary and currency.");
  if (amount > Number(balance.due)) return fail("Payout amount cannot exceed the current due balance.");

  if (currency === "ETB") {
    const { data: settings, error: settingsError } = await supabase.from("marketplace_settings")
      .select("min_payout_etb").eq("id", true).maybeSingle();
    if (settingsError) return fail(`Could not verify the ETB payout minimum: ${settingsError.message}`, 500);
    if (settings?.min_payout_etb !== null && settings?.min_payout_etb !== undefined && amount < Number(settings.min_payout_etb)) {
      return fail(`ETB payouts must be at least ${Number(settings.min_payout_etb).toFixed(2)}.`);
    }
  }

  const { error: insertError } = await supabase.from("payouts").insert({
    beneficiary_user_id: beneficiaryId,
    currency,
    amount,
    method: "bank",
    reference: referenceRaw.trim() || null,
    note: noteRaw.trim() || null,
    paid_by: admin.id,
  });
  if (insertError) return fail(`Payout could not be recorded: ${insertError.message}`, 500);
  return NextResponse.json({ ok: true, message: "Payout recorded." });
}
