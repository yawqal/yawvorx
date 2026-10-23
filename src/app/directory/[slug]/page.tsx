import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Container } from "@/components/ui/Container";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { canonicalUrl } from "@/lib/seo";
import { getSupabaseServerClient } from "@/lib/supabase/server";

type Props = { params: Promise<{ slug: string }> };
async function getBusiness(slug: string) {
  const supabase = getSupabaseServerClient();
  if (!supabase) return { data: null, error: "Database is not configured." };
  const result = await supabase.from("directory_businesses")
    .select("slug,name,category,description,city,website,public_email,public_phone")
    .eq("slug", slug).eq("status", "approved").maybeSingle();
  return { data: result.data, error: result.error?.message ?? null };
}
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params, { data } = await getBusiness(slug);
  return data ? { title: data.name, description: data.description ?? `Business in ${data.city}.`, alternates: { canonical: canonicalUrl(`/directory/${encodeURIComponent(data.slug)}`) } } : { title: "Business", robots: { index: false, follow: false } };
}
export default async function DirectoryBusinessPage({ params }: Props) {
  const { slug } = await params, { data, error } = await getBusiness(slug);
  if (!data && !error) notFound();
  return <>
    <PageHeader title={data?.name ?? "Business"} intro={data?.city}>{data?.category && <Badge>{data.category}</Badge>}</PageHeader>
    <Container className="max-w-4xl py-8 sm:py-10">
      {error ? <p role="alert" className="text-red-300">Business could not be loaded: {error}</p> : data && <Card>
        <p className="whitespace-pre-wrap break-words leading-relaxed text-ink-mute">{data.description || "No description yet."}</p>
        <div className="mt-6 flex flex-wrap gap-3">
          {data.website && /^https:\/\//i.test(data.website) && <Button href={data.website} variant="secondary">Visit website</Button>}
          {data.public_email && <Button href={`mailto:${data.public_email}`} variant="secondary">Email business</Button>}
          {data.public_phone && <Button href={`tel:${data.public_phone}`} variant="secondary">Call business</Button>}
        </div>
      </Card>}
    </Container>
  </>;
}
