import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { Container } from "@/components/ui/Container";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { canonicalUrl } from "@/lib/seo";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import { formatMoney } from "@/lib/format";
import { FreelancerInquiryForm } from "@/components/marketplace/FreelancerInquiryForm";

type Props = { params: Promise<{ slug: string }> };
type Profile = {
  id: string; slug: string; display_name: string; headline: string | null; bio: string | null;
  category: string; skills: string[] | string | null; availability: string | null; is_verified: boolean | null;
};
type Package = { id: string; tier: string; price_etb: number | string; delivery_days: number; revisions: number; description: string };

async function load(slug: string) {
  const supabase = getSupabaseServerClient();
  if (!supabase) return { profile: null, packages: [], error: "Database is not configured." };
  const result = await supabase.from("freelancer_profiles")
    .select("id,slug,display_name,headline,bio,category,skills,availability,is_verified")
    .eq("slug", slug).eq("status", "approved").maybeSingle();
  if (result.error) return { profile: null, packages: [], error: result.error.message };
  if (!result.data) return { profile: null, packages: [], error: null };
  const services = await supabase.from("freelancer_services")
    .select("id,tier,price_etb,delivery_days,revisions,description")
    .eq("profile_id", result.data.id).eq("is_active", true).order("price_etb");
  if (services.error) return { profile: result.data as unknown as Profile, packages: [], error: services.error.message };
  return { profile: result.data as unknown as Profile, packages: (services.data ?? []) as unknown as Package[], error: null };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const { profile } = await load(slug);
  if (!profile) return { title: "Freelancer", robots: { index: false, follow: false } };
  return {
    title: profile.display_name,
    description: profile.headline ?? `Freelancer profile for ${profile.display_name}.`,
    alternates: { canonical: canonicalUrl(`/freelancers/${encodeURIComponent(profile.slug)}`) },
  };
}

export default async function FreelancerProfilePage({ params }: Props) {
  const { slug } = await params;
  const [data, user] = await Promise.all([load(slug), getCurrentUser()]);
  if (!data.profile && !data.error) notFound();
  if (data.error && !data.profile) return <><PageHeader title="Freelancer profile" /><Container className="py-10"><p role="alert" className="text-red-300">Profile could not be loaded: {data.error}</p></Container></>;
  if (!user) redirect(`/login?next=${encodeURIComponent(`/freelancers/${slug}`)}`);
  const profile = data.profile!;
  const skills = Array.isArray(profile.skills) ? profile.skills : (profile.skills ?? "").split(",");
  const tiers = ["basic", "standard", "premium"];
  return <>
    <PageHeader title={profile.display_name} intro={profile.headline ?? "Freelancer profile"}>
      <Badge>{profile.category}</Badge>{profile.is_verified === true && <Badge tone="ok">Verified</Badge>}
    </PageHeader>
    <Container className="grid min-w-0 gap-8 py-8 sm:py-10 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,.7fr)]">
      <div className="min-w-0 space-y-8">
        <section><h2 className="text-2xl font-semibold">About</h2><p className="mt-3 whitespace-pre-wrap break-words leading-relaxed text-ink-mute">{profile.bio || "No biography yet."}</p></section>
        <section><h2 className="text-2xl font-semibold">Skills</h2>{skills.filter((item) => item.trim()).length ? <div className="mt-3 flex flex-wrap gap-2">{skills.map((skill) => skill.trim()).filter(Boolean).map((skill) => <Badge key={skill}>{skill}</Badge>)}</div> : <p className="mt-3 text-ink-mute">No skills yet.</p>}</section>
        <section><h2 className="text-2xl font-semibold">Availability</h2><p className="mt-3 text-ink-mute">{profile.availability || "Not specified"}</p></section>
        <section>
          <h2 className="text-2xl font-semibold">Packages</h2>
          {data.packages.length === 0 ? <p className="mt-3 text-ink-mute">No packages yet.</p> : <div className="mt-4 grid gap-4 md:grid-cols-3">
            {tiers.map((tier) => {
              const item = data.packages.find((candidate) => candidate.tier.toLowerCase() === tier);
              return item ? <Card key={item.id}>
                <h3 className="font-semibold capitalize">{tier}</h3><p className="mt-2 text-xl font-semibold">{formatMoney(Number(item.price_etb), "ETB")}</p>
                <p className="mt-2 text-sm text-ink-mute">{item.delivery_days} delivery days · {item.revisions} revisions</p>
                <p className="mt-3 break-words text-sm text-ink-mute">{item.description}</p>
              </Card> : null;
            })}
          </div>}
          <Card className="mt-4"><h3 className="font-semibold">Custom quote</h3><p className="mt-2 text-sm text-ink-mute">Contact this freelancer to discuss a custom project scope.</p><Button href="#inquiry" variant="secondary" className="mt-4">Request a custom quote</Button></Card>
        </section>
      </div>
      <section id="inquiry" className="min-w-0"><h2 className="mb-4 text-2xl font-semibold">Send an inquiry</h2><FreelancerInquiryForm profileId={profile.id} /></section>
      {data.error && <p role="alert" className="text-red-300 lg:col-span-2">Some profile information could not be loaded: {data.error}</p>}
    </Container>
  </>;
}
