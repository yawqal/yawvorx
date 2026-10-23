import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Container } from "@/components/ui/Container";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { canonicalUrl } from "@/lib/seo";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { formatMoney } from "@/lib/format";

type Props = { params: Promise<{ slug: string }> };
async function getCourse(slug: string) {
  const supabase = getSupabaseServerClient();
  if (!supabase) return { data: null, error: "Database is not configured." };
  const { data, error } = await supabase.from("courses")
    .select("slug,title,description,level,price_etb,instructor_name")
    .eq("slug", slug).eq("is_published", true).maybeSingle();
  return { data, error: error?.message ?? null };
}
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const { data } = await getCourse(slug);
  return data ? { title: data.title, description: data.description ?? "Course details.", alternates: { canonical: canonicalUrl(`/courses/${encodeURIComponent(data.slug)}`) } } : { title: "Course", robots: { index: false, follow: false } };
}
export default async function CoursePage({ params }: Props) {
  const { slug } = await params;
  const { data, error } = await getCourse(slug);
  if (!data && !error) notFound();
  return <>
    <PageHeader title={data?.title ?? "Course"} intro={data?.instructor_name ? `Instructor: ${data.instructor_name}` : undefined}>{data?.level && <Badge>{data.level}</Badge>}</PageHeader>
    <Container className="max-w-4xl py-8 sm:py-10">
      {error ? <p role="alert" className="text-red-300">Course could not be loaded: {error}</p> : data && <Card>
        <h2 className="text-2xl font-semibold">About this course</h2><p className="mt-4 whitespace-pre-wrap break-words leading-relaxed text-ink-mute">{data.description || "No description yet."}</p>
        {data.price_etb != null && <p className="mt-6 text-xl font-semibold">{formatMoney(Number(data.price_etb), "ETB")}</p>}
        <div className="mt-8 rounded-xl border border-line p-4"><p className="font-semibold">Enrollment opens soon</p><p className="mt-1 text-sm text-ink-mute">Enrollment is not available yet.</p><Button disabled variant="secondary" className="mt-4">Enrollment opens soon</Button></div>
      </Card>}
    </Container>
  </>;
}
