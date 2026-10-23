import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { getSupabaseServerClient } from "@/lib/supabase/server";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const noindex = { "X-Robots-Tag": "noindex, nofollow" };
const clean = (value: unknown, max: number) => typeof value === "string" ? value.trim().slice(0, max) : "";
export async function POST(request: Request) {
  try {
    const user = await requireUser("/freelancers");
    const supabase = getSupabaseServerClient();
    if (!supabase) return NextResponse.json({ error: "Database is not configured." }, { status: 503, headers: noindex });
    let raw: unknown;
    try { raw = await request.json(); } catch { return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400, headers: noindex }); }
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) return NextResponse.json({ error: "Request body must be an object." }, { status: 400, headers: noindex });
    const values = raw as Record<string, unknown>;
    const profile_id = clean(values.profile_id, 36), name = clean(values.name, 100);
    const email = clean(values.email, 254), message = clean(values.message, 2000);
    const budget = clean(values.budget, 120), deadline = clean(values.deadline, 10);
    if (!UUID.test(profile_id) || name.length < 2 || !emailPattern.test(email) || message.length < 10 ||
      (values.budget != null && typeof values.budget !== "string") || (values.deadline != null && typeof values.deadline !== "string") ||
      (deadline && !/^\d{4}-\d{2}-\d{2}$/.test(deadline))) {
      return NextResponse.json({ error: "Check the name, email, message, budget, and deadline fields." }, { status: 400, headers: noindex });
    }
    if (deadline && deadline < new Date().toISOString().slice(0, 10)) {
      return NextResponse.json({ error: "Deadline must be today or later." }, { status: 400, headers: noindex });
    }
    const profile = await supabase.from("freelancer_profiles").select("id,user_id").eq("id", profile_id).eq("status", "approved").maybeSingle();
    if (profile.error) return NextResponse.json({ error: `Freelancer could not be checked: ${profile.error.message}` }, { status: 500, headers: noindex });
    if (!profile.data) return NextResponse.json({ error: "This freelancer is not available for inquiries." }, { status: 404, headers: noindex });
    if (profile.data.user_id === user.id) {
      return NextResponse.json({ error: "You cannot send an inquiry to your own profile." }, { status: 400, headers: noindex });
    }
    const inserted = await supabase.from("freelancer_inquiries").insert({
      profile_id, user_id: user.id, name, email, message, budget: budget || null, deadline: deadline || null, status: "new",
    });
    if (inserted.error) return NextResponse.json({ error: `Inquiry could not be sent: ${inserted.error.message}` }, { status: 500, headers: noindex });
    return NextResponse.json({ ok: true, message: "Your inquiry was sent." }, { status: 201, headers: noindex });
  } catch (error) {
    console.error("freelancer inquiry failed", error);
    return NextResponse.json({ error: "Inquiry could not be sent. Please try again." }, { status: 500, headers: noindex });
  }
}
