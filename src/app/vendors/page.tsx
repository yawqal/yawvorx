import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { canonicalUrl } from "@/lib/seo";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Vendors", description: "Browse public vendor stores.", alternates: { canonical: canonicalUrl("/vendors") } };
export const dynamic = "force-dynamic";
export default async function VendorsPage() {
  const supabase = getSupabaseServerClient();
  const result = supabase ? await supabase.from("public_vendor_stores").select("id,display_name").order("display_name")
    : { data: null, error: { message: "Database is not configured." } };
  return <>
    <PageHeader title="Vendor stores" intro="Explore products from public vendor stores." />
    <Container className="py-8 sm:py-10">
      {result.error ? <p role="alert" className="text-red-300">Vendor stores could not be loaded: {result.error.message}</p>
        : result.data?.length ? <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{result.data.map((store) => <Link key={store.id} href={`/vendors/${encodeURIComponent(store.id)}`} className="focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand"><Card interactive><h2 className="break-words text-xl font-semibold">{store.display_name}</h2><span className="mt-4 inline-flex min-h-[44px] items-center font-semibold text-brand-soft">View store</span></Card></Link>)}</div>
          : <Card><h2 className="font-semibold">No vendors yet</h2><p className="mt-2 text-ink-mute">There are no public vendor stores to show right now.</p></Card>}
    </Container>
  </>;
}
