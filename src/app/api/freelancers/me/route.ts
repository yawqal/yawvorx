import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { getSupabaseServerClient } from "@/lib/supabase/server";

const categories = new Set(["Design", "Development", "Writing", "Marketing", "Video", "Other"]);
const availabilities = new Set(["available", "limited", "unavailable"]);
const tiers = new Set(["basic", "standard", "premium"]);
const clean = (value: unknown, max: number) => typeof value === "string" ? value.trim().slice(0, max) : "";

export async function PATCH(request: Request) {
  const user = await requireUser("/freelancers/me");
  const supabase = getSupabaseServerClient();
  if (!supabase) return NextResponse.json({ error: "Database is not configured." }, { status: 503 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return NextResponse.json({ error: "Request body must be an object." }, { status: 400 });
  }

  const values = body as Record<string, unknown>;
  const display_name = clean(values.display_name, 80);
  const headline = clean(values.headline, 120);
  const bio = clean(values.bio, 2000);
  const category = clean(values.category, 40);
  const availability = clean(values.availability, 20);
  const rawSkills = clean(values.skills, 500);
  const skills = rawSkills.split(",").map((skill) => skill.trim()).filter(Boolean);
  const rawStartingPrice = values.starting_price_etb;
  const startingPriceText = typeof rawStartingPrice === "string" ? rawStartingPrice.trim() : rawStartingPrice;
  const starting_price_etb = startingPriceText === "" || startingPriceText == null ? null : Number(startingPriceText);

  if (display_name.length < 2 || headline.length < 2 || bio.length < 10 ||
    !categories.has(category) || !availabilities.has(availability) ||
    skills.length < 1 || skills.length > 10 || skills.some((skill) => skill.length > 50) ||
    (starting_price_etb !== null && (!Number.isFinite(starting_price_etb) || starting_price_etb < 0 || starting_price_etb > 100000000))) {
    return NextResponse.json({ error: "Check profile fields, category, availability, skills (1–10), and starting price." }, { status: 400 });
  }
  if (rawStartingPrice != null && typeof rawStartingPrice !== "string" && typeof rawStartingPrice !== "number") {
    return NextResponse.json({ error: "Starting price must be a valid ETB amount." }, { status: 400 });
  }
  if (!Array.isArray(values.packages) || values.packages.length > 3) {
    return NextResponse.json({ error: "Packages must contain no more than three entries." }, { status: 400 });
  }

  const packageRows: {
    tier: string; title: string; description: string; price_etb: number;
    delivery_days: number; revisions: number; is_active: boolean;
  }[] = [];
  const seen = new Set<string>();
  for (const rawPackage of values.packages) {
    if (!rawPackage || typeof rawPackage !== "object" || Array.isArray(rawPackage)) {
      return NextResponse.json({ error: "Each package must be an object." }, { status: 400 });
    }
    const pkg = rawPackage as Record<string, unknown>;
    const tier = clean(pkg.tier, 20).toLowerCase();
    const title = clean(pkg.title, 100);
    const description = clean(pkg.description, 1000);
    const priceText = typeof pkg.price_etb === "string" ? pkg.price_etb.trim() : pkg.price_etb;
    const deliveryText = typeof pkg.delivery_days === "string" ? pkg.delivery_days.trim() : pkg.delivery_days;
    const revisionsText = typeof pkg.revisions === "string" ? pkg.revisions.trim() : pkg.revisions;
    if (!title && !description && !priceText && !deliveryText && !revisionsText) continue;
    const price = Number(priceText);
    const delivery = Number(deliveryText);
    const revisions = Number(revisionsText);
    if (!tiers.has(tier) || seen.has(tier) || title.length < 2 || description.length < 1 ||
      !Number.isFinite(price) || price < 0 || price > 100000000 ||
      !Number.isInteger(delivery) || delivery < 1 || delivery > 365 ||
      !Number.isInteger(revisions) || revisions < 0 || revisions > 100 ||
      typeof pkg.is_active !== "boolean") {
      return NextResponse.json({ error: "One or more packages have invalid fields." }, { status: 400 });
    }
    seen.add(tier);
    packageRows.push({ tier, title, description, price_etb: price, delivery_days: delivery, revisions, is_active: pkg.is_active });
  }

  const profile = await supabase.from("freelancer_profiles").select("id")
    .eq("user_id", user.id).maybeSingle();
  if (profile.error) return NextResponse.json({ error: `Your profile could not be checked: ${profile.error.message}` }, { status: 500 });
  if (!profile.data) return NextResponse.json({ error: "Freelancer profile was not found." }, { status: 404 });
  const profileId = profile.data.id;

  const updated = await supabase.from("freelancer_profiles").update({
    display_name, headline, bio, category, skills, availability, starting_price_etb,
  }).eq("id", profileId).eq("user_id", user.id).select("id").maybeSingle();
  if (updated.error) return NextResponse.json({ error: `Profile could not be updated: ${updated.error.message}` }, { status: 500 });
  if (!updated.data) return NextResponse.json({ error: "Profile could not be updated." }, { status: 404 });

  if (packageRows.length) {
    const saved = await supabase.from("freelancer_services").upsert(
      packageRows.map((pkg) => ({ profile_id: profileId, ...pkg })),
      { onConflict: "profile_id,tier" },
    );
    if (saved.error) return NextResponse.json({ error: `Profile was updated, but packages could not be saved: ${saved.error.message}` }, { status: 500 });
  }

  return NextResponse.json({ ok: true, message: "Freelancer profile updated successfully." });
}
