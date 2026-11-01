import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { Container } from "@/components/ui/Container";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";

export const metadata: Metadata = { title: "Freelancer inquiries", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function FreelancerInquiriesPage() {
  const user = await requireUser("/freelancers/me/inquiries");
  const supabase = getSupabaseServerClient();
  if (!supabase) return <Container className="py-10"><p role="alert" className="text-red-300">Database is not configured.</p></Container>;

  const profile = await supabase.from("freelancer_profiles").select("id").eq("user_id", user.id).maybeSingle();
  if (profile.error) return <Container className="py-10"><p role="alert" className="text-red-300">Profile could not be checked: {profile.error.message}</p></Container>;
  if (!profile.data) redirect("/freelancers/apply");

  const inquiries = await supabase.from("freelancer_inquiries")
    .select("name,email,message,budget,deadline,created_at")
    .eq("profile_id", profile.data.id)
    .order("created_at", { ascending: false });

  return <>
    <PageHeader title="Inquiries" intro="Messages from clients interested in your services." />
    <Container className="min-w-0 py-8 sm:py-10">
      {inquiries.error ? <p role="alert" className="text-red-300">Inquiries could not be loaded: {inquiries.error.message}</p>
        : !inquiries.data?.length ? <Card><p>No inquiries yet</p></Card>
          : <ul className="grid min-w-0 gap-3">{inquiries.data.map((inquiry, index) => (
            <li key={`${inquiry.created_at}-${inquiry.email}-${index}`} className="min-w-0">
              <Card className="min-w-0">
                <div className="flex min-w-0 flex-wrap items-start justify-between gap-2">
                  <h2 className="break-words text-lg font-semibold">{inquiry.name}</h2>
                  <time className="text-sm text-ink-mute" dateTime={inquiry.created_at}>{new Date(inquiry.created_at).toLocaleDateString()}</time>
                </div>
                <a className="mt-1 inline-block min-h-[44px] max-w-full break-all py-2 text-secondary-soft underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand" href={`mailto:${inquiry.email}`}>{inquiry.email}</a>
                <p className="mt-2 whitespace-pre-wrap break-words">{inquiry.message}</p>
                <dl className="mt-4 grid min-w-0 gap-3 text-sm sm:grid-cols-2">
                  <div className="min-w-0"><dt className="text-ink-mute">Budget</dt><dd className="break-words">{inquiry.budget || "Not specified"}</dd></div>
                  <div className="min-w-0"><dt className="text-ink-mute">Deadline</dt><dd className="break-words">{inquiry.deadline || "Not specified"}</dd></div>
                </dl>
              </Card>
            </li>
          ))}</ul>}
    </Container>
  </>;
}
