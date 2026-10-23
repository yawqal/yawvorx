import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { getSupabaseServerClient } from "@/lib/supabase/server";

const categories = new Set(["Design", "Development", "Writing", "Marketing", "Video", "Other"]);
const tiers = new Set(["basic", "standard", "premium"]);
const clean = (value: unknown, min: number, max: number) => typeof value === "string" ? value.trim().slice(0, max) : "";
const slugify = (value: string) => value.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60);
const noindex = { "X-Robots-Tag": "noindex, nofollow" };

export async function POST(request: Request) {
  const user = await requireUser("/freelancers/apply");
  const supabase = getSupabaseServerClient();
  if (!supabase) return NextResponse.json({ error: "Database is not configured." }, { status: 503, headers: noindex });
  let raw: unknown;
  try { raw = await request.json(); } catch { return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400, headers: noindex }); }
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return NextResponse.json({ error: "Request body must be an object." }, { status: 400, headers: noindex });
  const values = raw as Record<string, unknown>;
  const display_name = clean(values.display_name, 2, 80);
  const headline = clean(values.headline, 2, 120);
  const bio = clean(values.bio, 10, 2000);
  const category = clean(values.category, 1, 40);
  const availability = clean(values.availability, 1, 20);
  const skillText = clean(values.skills, 1, 500);
  const skills = skillText.split(",").map((skill) => skill.trim()).filter(Boolean);
  if (display_name.length < 2 || headline.length < 2 || bio.length < 10 || !categories.has(category) ||
    !["available", "limited", "unavailable"].includes(availability) || skills.length < 1 || skills.length > 10 ||
    skills.some((skill) => skill.length > 50)) {
    return NextResponse.json({ error: "Check the profile fields, category, availability, and skills (1–10 skills)." }, { status: 400, headers: noindex });
  }
  if (!Array.isArray(values.packages) || values.packages.length > 3) return NextResponse.json({ error: "Packages must contain no more than three entries." }, { status: 400, headers: noindex });
  const packageValues = values.packages.map((item) => item && typeof item === "object" && !Array.isArray(item) ? item as Record<string, unknown> : {});
  const seen = new Set<string>();
  const packageRows: { tier: string; price_etb: number; delivery_days: number; revisions: number; description: string; is_active: boolean }[] = [];
  for (const pkg of packageValues) {
    const tier = clean(pkg.tier, 1, 20).toLowerCase();
    const description = clean(pkg.description, 1, 500);
    const price = Number(pkg.price_etb), delivery = Number(pkg.delivery_days), revisions = Number(pkg.revisions);
    if (!tiers.has(tier) || seen.has(tier) || !description || description.length > 500 ||
      !Number.isFinite(price) || price < 0 || price > 100000000 || !Number.isInteger(delivery) || delivery < 1 || delivery > 365 ||
      !Number.isInteger(revisions) || revisions < 0 || revisions > 100) {
      return NextResponse.json({ error: "One or more packages have invalid fields." }, { status: 400, headers: noindex });
    }
    seen.add(tier);
    packageRows.push({ tier, price_etb: price, delivery_days: delivery, revisions, description, is_active: true });
  }
  const existing = await supabase.from("freelancer_profiles").select("id").eq("user_id", user.id).maybeSingle();
  if (existing.error) return NextResponse.json({ error: `Existing profile could not be checked: ${existing.error.message}` }, { status: 500, headers: noindex });
  if (existing.data) return NextResponse.json({ error: "You already have a freelancer profile." }, { status: 409, headers: noindex });
  const baseSlug = slugify(display_name) || "freelancer";
  const slug = `${baseSlug}-${randomUUID().slice(0, 8)}`;
  const inserted = await supabase.from("freelancer_profiles").insert({
    user_id: user.id, slug, display_name, headline, bio, category, skills, availability,
  }).select("id").single();
  if (inserted.error || !inserted.data) return NextResponse.json({ error: `Profile could not be submitted: ${inserted.error?.message ?? "No profile was returned."}` }, { status: 500, headers: noindex });
  if (packageRows.length) {
    const saved = await supabase.from("freelancer_services").insert(packageRows.map((pkg) => ({ ...pkg, profile_id: inserted.data.id })));
    if (saved.error) return NextResponse.json({ error: `Profile was created, but packages could not be saved: ${saved.error.message}` }, { status: 500, headers: noindex });
  }
  return NextResponse.json({ ok: true, message: "Application submitted for review." }, { status: 201, headers: noindex });
}
