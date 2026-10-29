import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { rateLimit } from "@/lib/rate-limit";

const categories = new Set(["Technology", "Retail", "Food & Beverage", "Professional Services", "Health & Wellness", "Education", "Other"]);
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const noindex = { "X-Robots-Tag": "noindex, nofollow" };
const clean = (value: unknown, max: number) => typeof value === "string" ? value.trim().slice(0, max) : "";
const slugify = (value: string) => value.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60);
export async function POST(request: Request) {
  const limited = rateLimit(request, "directory-submit-post", 3, 60_000);
  if (limited) return limited;
  const user = await requireUser("/directory/add");
  const supabase = getSupabaseServerClient();
  if (!supabase) return NextResponse.json({ error: "Database is not configured." }, { status: 503, headers: noindex });
  let raw: unknown;
  try { raw = await request.json(); } catch { return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400, headers: noindex }); }
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return NextResponse.json({ error: "Request body must be an object." }, { status: 400, headers: noindex });
  const values = raw as Record<string, unknown>;
  const name = clean(values.name, 100), category = clean(values.category, 60);
  const description = clean(values.description, 2000), city = clean(values.city, 80);
  const website = clean(values.website, 2048), public_email = clean(values.public_email, 254), public_phone = clean(values.public_phone, 30);
  if (name.length < 2 || !categories.has(category) || description.length < 10 || city.length < 2 ||
    !/^[\p{L}\p{N} .,'-]+$/u.test(city) || !website.startsWith("https://") ||
    (values.public_email != null && typeof values.public_email !== "string") ||
    (public_email && !emailPattern.test(public_email)) ||
    (values.public_phone != null && typeof values.public_phone !== "string") ||
    (public_phone && !/^[+\d() .-]{5,30}$/.test(public_phone))) {
    return NextResponse.json({ error: "Check the business details. Website must start with https://." }, { status: 400, headers: noindex });
  }
  try { new URL(website); } catch { return NextResponse.json({ error: "Enter a valid HTTPS website URL." }, { status: 400, headers: noindex }); }
  const slug = `${slugify(name) || "business"}-${randomUUID().slice(0, 8)}`;
  const { error } = await supabase.from("directory_businesses").insert({
    user_id: user.id, slug, name, category, description, city, website,
    public_email: public_email || null, public_phone: public_phone || null,
  });
  if (error) return NextResponse.json({ error: `Business could not be submitted: ${error.message}` }, { status: 500, headers: noindex });
  return NextResponse.json({ ok: true, message: "Business submitted for review." }, { status: 201, headers: noindex });
}
