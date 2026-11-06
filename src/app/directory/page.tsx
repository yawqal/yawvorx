import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { canonicalUrl } from "@/lib/seo";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Business directory", description: "Find approved businesses in the directory.", alternates: { canonical: canonicalUrl("/directory") } };
export const dynamic = "force-dynamic";
type Params = Promise<{ q?: string; category?: string; city?: string }>;
const text = (v: string | undefined, max: number) => (v ?? "").trim().slice(0, max);
export default async function DirectoryPage({ searchParams }: { searchParams: Params }) {
  const params = await searchParams;
  const q = text(params.q, 80), category = text(params.category, 60), city = text(params.city, 60);
  const supabase = getSupabaseServerClient();
  const result = supabase ? await supabase.from("directory_businesses")
    .select("id,slug,name,category,description,city,website,public_email,public_phone")
    .eq("status", "approved").order("created_at", { ascending: false })
    : { data: null, error: { message: "Database is not configured." } };
  const businesses = result.data ?? [];
  const categories = [...new Set(businesses.map((business) => business.category).filter(Boolean))].sort();
  const cities = [...new Set(businesses.map((business) => business.city).filter(Boolean))].sort();
  const shown = businesses.filter((business) =>
    (!category || business.category === category) && (!city || business.city === city) &&
    (!q || `${business.name} ${business.description ?? ""}`.toLowerCase().includes(q.toLowerCase())));
  return <>
    <PageHeader title="Business directory" intro="Discover approved businesses and services." />
    <Container className="py-8 sm:py-10">
      <div className="mb-6"><Button href="/directory/add">Add your business</Button></div>
      <form method="get" className="mb-8 grid gap-3 rounded-2xl border border-line p-4 sm:grid-cols-2 lg:grid-cols-4">
        <label className="grid gap-2 text-sm font-semibold">Search businesses<input className="control min-h-[44px] w-full px-3 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand" type="search" name="q" maxLength={80} defaultValue={q} /></label>
        <label className="grid gap-2 text-sm font-semibold">Category<select className="control min-h-[44px] w-full px-3 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand" name="category" defaultValue={category}><option value="">All categories</option>{categories.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
        <label className="grid gap-2 text-sm font-semibold">City<select className="control min-h-[44px] w-full px-3 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand" name="city" defaultValue={city}><option value="">All cities</option>{cities.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
        <Button type="submit" variant="secondary" className="self-end">Apply filters</Button>
      </form>
      {result.error ? <p role="alert" className="text-red-300">Directory could not be loaded: {result.error.message}</p>
        : shown.length ? <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{shown.map((business) => <Link key={business.id} href={`/directory/${encodeURIComponent(business.slug)}`} className="focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand"><Card interactive className="h-full">
          <Badge>{business.category}</Badge><h2 className="mt-3 break-words text-xl font-semibold">{business.name}</h2><p className="mt-2 line-clamp-3 text-ink-mute">{business.description || "No description yet."}</p><p className="mt-4 text-sm text-ink-mute">{business.city}</p>
        </Card></Link>)}</div> : <Card><h2 className="font-semibold">No businesses yet</h2><p className="mt-2 text-ink-mute">No approved businesses match these filters.</p></Card>}
    </Container>
  </>;
}
