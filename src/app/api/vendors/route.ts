import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { rateLimit } from "@/lib/rate-limit";

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

  const record = payload as Record<string, unknown>;
  const businessName = typeof record.business_name === "string" ? record.business_name.trim() : "";
  const contact = typeof record.contact_value === "string" ? record.contact_value.trim() : "";
  const description = typeof record.description === "string" ? record.description.trim() : "";
  if (businessName.length < 2 || businessName.length > 120 ||
      contact.length < 3 || contact.length > 150 ||
      description.length < 20 || description.length > 2000) {
    return NextResponse.json({ error: "Check your business name, contact detail, and application description." }, { status: 400 });
  }

  const supabase = getSupabaseServerClient();
  if (!supabase) return NextResponse.json({ error: "Vendor applications are not configured." }, { status: 503 });
  const { error } = await supabase.from("vendor_applications").insert({
    user_id: user.id,
    business_name: businessName,
    contact_value: contact,
    description,
  });
  if (error?.code === "23505") {
    return NextResponse.json({ error: "You already have a vendor application on file." }, { status: 409 });
  }
  if (error) {
    console.error("Vendor application submission failed");
    return NextResponse.json({ error: "Your application could not be saved. Please try again." }, { status: 500 });
  }
  return NextResponse.json({ ok: true }, { status: 201 });
}
