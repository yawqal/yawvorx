import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getSupabaseServerClient } from "@/lib/supabase/server";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const ALLOWED_KEYS = new Set(["p_items", "p_customer", "p_idempotency_key", "p_payment_method", "p_currency"]);

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }
  const payload = body as Record<string, unknown>;
  if (Object.keys(payload).some((key) => !ALLOWED_KEYS.has(key)) ||
      !Array.isArray(payload.p_items) ||
      !payload.p_customer || typeof payload.p_customer !== "object" || Array.isArray(payload.p_customer) ||
      typeof payload.p_idempotency_key !== "string" ||
      typeof payload.p_payment_method !== "string" ||
      (payload.p_currency !== undefined && payload.p_currency !== null && typeof payload.p_currency !== "string")) {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const cookieToken = (await cookies()).get("zika_vis")?.value;
  const token = cookieToken && UUID_PATTERN.test(cookieToken) ? cookieToken : null;
  const supabase = getSupabaseServerClient();
  if (!supabase) return NextResponse.json({ error: "Database is not configured." }, { status: 503 });

  const { data, error } = await supabase.rpc("yvx_create_order_v2", {
    p_items: payload.p_items,
    p_customer: payload.p_customer,
    p_idempotency_key: payload.p_idempotency_key,
    p_payment_method: payload.p_payment_method,
    p_currency: payload.p_currency ?? null,
    p_referral_token: token,
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ data });
}
