import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { Container } from "@/components/ui/Container";
import { PageHeader } from "@/components/ui/PageHeader";
import { FreelancerReview } from "@/components/admin/FreelancerReview";

export const metadata: Metadata = { title: "Freelancers | Admin", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";
export default async function AdminFreelancersPage() {
  await requireAdmin();
  const supabase = getSupabaseServerClient();
  if (!supabase) return <><PageHeader title="Freelancers" /><Container className="py-10"><p role="alert" className="text-red-300">Database is not configured.</p></Container></>;
  const result = await supabase.from("freelancer_profiles")
    .select("id,display_name,slug,category,status,is_verified,created_at")
    .order("created_at", { ascending: false }).limit(300);
  return <>
    <PageHeader title="Freelancer profiles" intro="Review pending applications and manage verification." />
    <Container className="py-8 sm:py-10">
      {result.error ? <p role="alert" className="text-red-300">Freelancers could not be loaded: {result.error.message}</p>
        : <FreelancerReview profiles={result.data ?? []} />}
    </Container>
  </>;
}
