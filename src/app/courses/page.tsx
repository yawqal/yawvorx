import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { canonicalUrl } from "@/lib/seo";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { formatMoney } from "@/lib/format";

export const metadata: Metadata = { title: "Courses", description: "Browse published courses and learning resources.", alternates: { canonical: canonicalUrl("/courses") } };
export const dynamic = "force-dynamic";

export default async function CoursesPage() {
  const supabase = getSupabaseServerClient();
  const result = supabase
    ? await supabase.from("courses").select("id,slug,title,description,level,price_etb,instructor_name").eq("is_published", true).order("created_at", { ascending: false })
    : { data: null, error: { message: "Database is not configured." } };
  return <>
    <PageHeader title="Courses" intro="Explore courses available from our instructors." />
    <Container className="py-8 sm:py-10">
      {result.error ? <p role="alert" className="text-red-300">Courses could not be loaded: {result.error.message}</p>
        : result.data?.length ? <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{result.data.map((course) => <Link key={course.id} href={`/courses/${encodeURIComponent(course.slug)}`} className="focus-visible:outline focus-visible:outline-2 focus-visible:outline-violet"><Card interactive className="h-full">
          <Badge>{course.level || "Level not specified"}</Badge><h2 className="mt-3 break-words text-xl font-semibold">{course.title}</h2>
          <p className="mt-2 line-clamp-3 text-ink-mute">{course.description || "No description yet."}</p>
          {course.instructor_name && <p className="mt-4 text-sm text-ink-mute">Instructor: {course.instructor_name}</p>}
          {course.price_etb != null && <p className="mt-3 font-semibold">{formatMoney(Number(course.price_etb), "ETB")}</p>}
        </Card></Link>)}</div> : <Card><h2 className="font-semibold">No courses yet</h2><p className="mt-2 text-ink-mute">There are no published courses to show right now.</p></Card>}
    </Container>
  </>;
}
