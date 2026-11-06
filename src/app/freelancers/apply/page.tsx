import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { canonicalUrl } from "@/lib/seo";
import { Container } from "@/components/ui/Container";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { FreelancerApplyForm } from "@/components/marketplace/FreelancerApplyForm";

export const metadata: Metadata = { title: "Become a freelancer", robots: { index: false, follow: false }, alternates: { canonical: canonicalUrl("/freelancers/apply") } };
export const dynamic = "force-dynamic";
export default async function FreelancerApplyPage() {
  const user = await requireUser("/freelancers/apply");
  const supabase = getSupabaseServerClient();
  if (!supabase) return <><PageHeader title="Become a freelancer" /><Container className="py-8"><p role="alert" className="text-red-300">Database is not configured.</p></Container></>;
  const result = await supabase.from("freelancer_profiles").select("display_name,status,slug").eq("user_id", user.id).maybeSingle();
  return <>
    <PageHeader title="Become a freelancer" intro="Submit your profile for marketplace review." />
    <Container className="max-w-3xl py-8 sm:py-10">
      {result.error ? <p role="alert" className="text-red-300">Profile status could not be loaded: {result.error.message}</p>
        : result.data ? <Card>
          <Badge tone={result.data.status === "approved" ? "ok" : result.data.status === "rejected" || result.data.status === "suspended" ? "warn" : "info"}>{result.data.status}</Badge>
          <h2 className="mt-3 text-xl font-semibold">{result.data.display_name}</h2>
          <p className="mt-2 text-ink-mute">You already have a freelancer profile.</p>
          <div className="mt-4 flex flex-wrap gap-3">
            <a href="/freelancers/me" className="inline-flex min-h-[44px] items-center rounded-xl border border-line px-4 py-2 font-semibold text-secondary-soft focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand">View my profile</a>
            {result.data.status === "approved" && <a href={`/freelancers/${encodeURIComponent(result.data.slug)}`} className="inline-flex min-h-[44px] items-center rounded-xl border border-line px-4 py-2 font-semibold text-secondary-soft focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand">Public page</a>}
          </div>
        </Card>
          : <FreelancerApplyForm />}
    </Container>
  </>;
}
