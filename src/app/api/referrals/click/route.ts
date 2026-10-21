import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(request: Request) {
  const limited = rateLimit(request, "affiliate-click-post", 30, 60_000);
  if (limited) return limited;

  let payload: unknown;
  try {
    const raw = await request.text();
    if (raw.length > 500) return NextResponse.json({ error: "Invalid referral request." }, { status: 413 });
    payload = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "Invalid referral request." }, { status: 400 });
  }
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return NextResponse.json({ error: "Invalid referral request." }, { status: 400 });
  }
  const code = (payload as Record<string, unknown>).code;
  if (typeof code !== "string" || !/^[A-F0-9]{10}$/.test(code)) {
    return NextResponse.json({ error: "Invalid referral code." }, { status: 400 });
  }

  const supabase = getSupabaseServerClient();
  if (!supabase) return NextResponse.json({ error: "Referral tracking is not configured." }, { status: 503 });
  const { data: affiliate, error: lookupError } = await supabase.from("affiliate_codes")
    .select("id").eq("code", code).eq("is_active", true).maybeSingle();
  if (lookupError) {
    console.error("Affiliate referral lookup failed", { error: lookupError });
    return NextResponse.json({ error: "Referral tracking is unavailable." }, { status: 503 });
  }
  if (!affiliate) return NextResponse.json({ error: "Referral code is not active." }, { status: 404 });

  const { error: insertError } = await supabase.from("affiliate_events").insert({
    affiliate_code_id: affiliate.id, event_type: "click",
  });
  if (insertError) {
    console.error("Affiliate click could not be recorded", { code, error: insertError });
    return NextResponse.json({ error: "Referral visit could not be recorded." }, { status: 503 });
  }

  const { data: cookieDaysResult, error: cookieDaysError } = await supabase.rpc("yvx_referral_cookie_days");
  const cookieDays = !cookieDaysError && typeof cookieDaysResult === "number" && Number.isInteger(cookieDaysResult)
    ? Math.min(365, Math.max(1, cookieDaysResult))
    : 30;

  const token = randomUUID();
  let visitRecorded = false;
  try {
    const { error } = await supabase.from("referral_visits").insert({ token, affiliate_code: code });
    if (error) {
      console.error("Affiliate referral visit could not be recorded", { code, error });
    } else {
      visitRecorded = true;
    }
  } catch (error) {
    console.error("Affiliate referral visit could not be recorded", { code, error });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set("zika_ref", code, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * cookieDays,
  });
  if (visitRecorded) {
    response.cookies.set("zika_vis", token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * cookieDays,
    });
  }
  return response;
}
