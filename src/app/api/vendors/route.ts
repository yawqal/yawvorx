import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { rateLimit } from "@/lib/rate-limit";
import { validateVendorApplication } from "@/lib/validation";

export async function GET(request: Request) {
  const limited = rateLimit(request, "vendor-list", 30, 60_000);
  if (limited) return limited;
  const user = await requireUser("/account");

  const supabase = getSupabaseServerClient();
  if (!supabase) return NextResponse.json({ error: "Vendor applications are not configured." }, { status: 503 });

  // Only authenticated users can see their own application
  const { data: myApp, error: appError } = await supabase
    .from("vendor_applications")
    .select("")
    .eq("user_id", user.id)
    .maybeSingle();

  if (appError || !myApp) {
    return NextResponse.json({ application: null }, { status: 200 });
  }

  return NextResponse.json({ application: myApp }, { status: 200 });
}

export async function POST(request: Request) {
  const limited = rateLimit(request, "vendor-application-post", 5, 60_000);
  if (limited) return limited;
  const user = await requireUser("/account");

  let payload: unknown;
  try {
    const raw = await request.text();
    if (raw.length > 5000) return NextResponse.json({ error: "Application is too large." }, { status: 413 });
    payload = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "Invalid JSON request body." }, { status: 400 });
  }
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return NextResponse.json({ error: "Invalid application request." }, { status: 400 });
  }

  const validation = validateVendorApplication(payload);
  if (!validation.ok) {
    return NextResponse.json({ error: validation.error ?? "Invalid vendor application." }, { status: 400 });
  }

  const supabase = getSupabaseServerClient();
  if (!supabase) return NextResponse.json({ error: "Vendor applications are not configured." }, { status: 503 });

  const { data: existing, error: existingError } = await supabase
    .from("vendor_applications")
    .select("id,status")
    .eq("user_id", user.id)
    .maybeSingle();

  if (existingError || !existing) {
    // No prior application → create new pending application
    const { error: insertError } = await supabase.from("vendor_applications").insert({
      user_id: user.id,
      business_name: validation.data.business_name!,
      contact_value: validation.data.contact_value!,
      description: validation.data.description!,
      status: "pending",
    });
    if (insertError) {
      console.error("Vendor application submission failed", { userId: user.id, error: insertError });
      return NextResponse.json({ error: "Your application could not be saved." }, { status: 500 });
    }
    return NextResponse.json({ ok: true }, { status: 201 });
  }

  // Prevent duplicate applications - reset existing one to a withdrawn state or reject the new submission
  if (existing.status === "pending" || existing.status === "approved" || existing.status === "rejected") {
    return NextResponse.json({ error: "You already have a pending or reviewed application on file." }, { status: 409 });
  }

  return NextResponse.json({ ok: true }, { status: 201 });
}
