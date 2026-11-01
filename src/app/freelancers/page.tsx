import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { canonicalUrl } from "@/lib/seo";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { formatMoney } from "@/lib/format";
import { getCurrentUser } from "@/lib/auth";
import { FreelancerAvatar } from "@/components/marketplace/FreelancerAvatar";

export const metadata: Metadata = {
  title: "Freelancers",
  description: "Explore approved freelancer profiles and services.",
  alternates: { canonical: canonicalUrl("/freelancers") },
};

type SearchParams = Promise<{ q?: string; category?: string; sort?: string }>;
type Profile = {
  id: string; slug: string; display_name: string; headline: string | null; category: string;
  skills: string[] | string | null; avatar_url: string | null; is_verified: boolean | null; created_at: string;
  freelancer_services: { price_etb: number | string | null; is_active: boolean | null }[] | null;
};
type Rating = { profile_id: string; review_count: number; avg_rating: number | string };

const clean = (value: string | undefined, limit = 80) => (value ?? "").trim().slice(0, limit);
const skillsList = (skills: Profile["skills"]) => Array.isArray(skills) ? skills : (skills ?? "").split(",");

export default async function FreelancersPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const search = clean(params.q);
  const category = clean(params.category, 60);
  const sort = params.sort === "price" ? "price" : "newest";
  const supabase = getSupabaseServerClient();
  const user = await getCurrentUser();
  const ownProfile = user && supabase
    ? await supabase.from("freelancer_profiles").select("id").eq("user_id", user.id).maybeSingle()
    : null;
  let profiles: Profile[] = [];
  let ratings = new Map<string, Rating>();
  let loadError: string | null = null;
  if (supabase) {
    const result = await supabase.from("freelancer_profiles")
      .select("id,slug,display_name,headline,category,skills,avatar_url,is_verified,created_at,freelancer_services(price_etb,is_active)")
      .eq("status", "approved").order("created_at", { ascending: false });
    if (result.error) loadError = `Freelancers could not be loaded: ${result.error.message}`;
    else {
      profiles = (result.data ?? []) as unknown as Profile[];
      if (profiles.length) {
        const stats = await supabase.from("freelancer_rating_stats").select("profile_id,review_count,avg_rating")
          .in("profile_id", profiles.map((profile) => profile.id));
        if (stats.error) loadError = `Freelancer ratings could not be loaded: ${stats.error.message}`;
        else ratings = new Map((stats.data ?? []).map((rating) => [rating.profile_id, rating as Rating]));
      }
    }
  } else loadError = "Database is not configured.";

  const categories = [...new Set(profiles.map((profile) => profile.category).filter(Boolean))].sort();
  const filtered = profiles.filter((profile) => {
    const text = `${profile.display_name} ${profile.headline ?? ""} ${skillsList(profile.skills).join(" ")}`.toLowerCase();
    return (!search || text.includes(search.toLowerCase())) && (!category || profile.category === category);
  });
  if (sort === "price") filtered.sort((a, b) => {
    const price = (profile: Profile) => profile.freelancer_services?.filter((service) => service.is_active)
      .map((service) => Number(service.price_etb)).filter(Number.isFinite).sort((x, y) => x - y)[0] ?? Number.POSITIVE_INFINITY;
    return price(a) - price(b) || new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  return <>
    <PageHeader title="Find a freelancer" intro="Browse approved professionals and connect with the right person for your project." />
    <Container className="py-8 sm:py-10">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <Button href={user ? ownProfile?.data ? "/freelancers/me" : "/freelancers/apply" : "/login?next=%2Ffreelancers%2Fapply"}>
          {user ? ownProfile?.data ? "My Profile" : "Add Profile" : "Add Profile"}
        </Button>
      </div>
      <form method="get" className="mb-8 grid gap-3 rounded-2xl border border-line p-4 sm:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_auto]">
        <label className="grid gap-2 text-sm font-semibold">Search by name or skill
          <input className="control min-h-[44px] w-full px-3 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand" type="search" name="q" maxLength={80} defaultValue={search} />
        </label>
        <label className="grid gap-2 text-sm font-semibold">Category
          <select className="control min-h-[44px] w-full px-3 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand" name="category" defaultValue={category}>
            <option value="">All categories</option>{categories.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
        <label className="grid gap-2 text-sm font-semibold">Sort by
          <select className="control min-h-[44px] w-full px-3 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand" name="sort" defaultValue={sort}>
            <option value="newest">Newest</option><option value="price">Lowest starting price</option>
          </select>
        </label>
        <Button type="submit" variant="secondary" className="self-end">Apply filters</Button>
      </form>
      {loadError ? <p role="alert" className="text-red-300">{loadError}</p> : filtered.length === 0
        ? <Card><h2 className="font-semibold">No freelancers yet</h2><p className="mt-2 text-ink-mute">There are no approved freelancer profiles to show right now.</p></Card>
        : <div className="grid min-w-0 gap-4 sm:grid-cols-2 xl:grid-cols-3">{filtered.map((profile) => {
          const startingPrice = profile.freelancer_services?.filter((service) => service.is_active)
            .map((service) => Number(service.price_etb)).filter((price) => Number.isFinite(price) && price >= 0)
            .sort((a, b) => a - b)[0];
          const rating = ratings.get(profile.id);
          return <Card key={profile.id} className="flex min-w-0 flex-col">
            <div className="flex flex-wrap items-center gap-2"><Badge>{profile.category}</Badge>{profile.is_verified === true && <Badge tone="ok">Verified</Badge>}</div>
            <div className="mt-3 flex items-center gap-3">
              <FreelancerAvatar name={profile.display_name} src={profile.avatar_url} size={56} />
              <h2 className="break-words text-xl font-semibold">{profile.display_name}</h2>
            </div>
            {profile.headline && <p className="mt-1 break-words text-ink-mute">{profile.headline}</p>}
            {rating && rating.review_count > 0 && <p className="mt-2 text-sm text-ink-mute">{Number(rating.avg_rating).toFixed(1)} / 5 ({rating.review_count} reviews)</p>}
            <div className="mt-4 flex flex-wrap gap-2">{skillsList(profile.skills).map((skill) => skill.trim()).filter(Boolean).slice(0, 10).map((skill) => <span key={skill} className="rounded-full bg-obsidian-800 px-3 py-1 text-xs text-ink-mute">{skill}</span>)}</div>
            {startingPrice !== undefined && <p className="mt-4 text-sm text-ink-mute">Starting at <span className="font-semibold text-ink">{formatMoney(startingPrice, "ETB")}</span></p>}
            <Link className="mt-auto inline-flex min-h-[44px] items-center pt-5 font-semibold text-brand-soft focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand" href={`/freelancers/${encodeURIComponent(profile.slug)}`}>View Profile <span aria-hidden="true" className="ml-2">↗</span></Link>
          </Card>;
        })}</div>}
    </Container>
  </>;
}
