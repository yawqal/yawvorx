import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { Container } from "@/components/ui/Container";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { formatMoney } from "@/lib/format";
import { FreelancerManageForm } from "@/components/marketplace/FreelancerManageForm";
import { FreelancerAvatar } from "@/components/marketplace/FreelancerAvatar";

export const metadata: Metadata = { title: "My freelancer profile", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function MyFreelancerProfilePage() {
  const user = await requireUser("/freelancers/me");
  const supabase = getSupabaseServerClient();
  if (!supabase) return <><PageHeader title="My freelancer profile" /><Container className="py-8"><p role="alert" className="text-red-300">Database is not configured.</p></Container></>;
  const profileResult = await supabase.from("freelancer_profiles")
    .select("id,slug,display_name,headline,bio,category,skills,availability,starting_price_etb,status,is_verified,avatar_url,created_at")
    .eq("user_id", user.id).maybeSingle();
  if (profileResult.error) return <><PageHeader title="My freelancer profile" /><Container className="py-8"><p role="alert" className="text-red-300">Profile could not be loaded: {profileResult.error.message}</p></Container></>;
  if (!profileResult.data) redirect("/freelancers/apply");
  const profile = profileResult.data;
  const packagesResult = await supabase.from("freelancer_services")
    .select("id,profile_id,tier,title,description,price_etb,delivery_days,revisions,is_active")
    .eq("profile_id", profile.id).order("tier");
  const statusMessage = profile.status === "pending" ? "Waiting for admin approval, not public yet"
    : profile.status === "approved" ? "Live"
      : profile.status === "rejected" ? "Rejected"
        : profile.status === "suspended" ? "Suspended" : profile.status;
  const skills: string[] = typeof profile.skills === "string"
    ? profile.skills.split(",")
    : Array.isArray(profile.skills)
      ? profile.skills.filter((item: unknown): item is string => typeof item === "string")
      : [];

  return <>
    <PageHeader title="My freelancer profile" intro="Manage your profile and service packages.">
      <FreelancerAvatar name={profile.display_name} src={profile.avatar_url} size={64} />
      <Badge tone={profile.status === "approved" ? "ok" : profile.status === "rejected" || profile.status === "suspended" ? "warn" : "info"}>{statusMessage}</Badge>
      {profile.is_verified === true && <Badge tone="ok">Verified</Badge>}
      <Button href="/freelancers/me/orders" variant="secondary">Orders</Button>
    </PageHeader>
    <Container className="grid min-w-0 gap-8 py-8 sm:py-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <div className="min-w-0 space-y-6">
        <Card>
          <h2 className="text-xl font-semibold">Profile details</h2>
          <dl className="mt-4 grid min-w-0 gap-3 text-sm sm:grid-cols-2">
            <div className="min-w-0"><dt className="text-ink-mute">Display name</dt><dd className="break-words">{profile.display_name}</dd></div>
            <div className="min-w-0"><dt className="text-ink-mute">Headline</dt><dd className="break-words">{profile.headline || "No headline yet"}</dd></div>
            <div><dt className="text-ink-mute">Category</dt><dd>{profile.category}</dd></div>
            <div><dt className="text-ink-mute">Availability</dt><dd>{profile.availability || "Not specified"}</dd></div>
            <div><dt className="text-ink-mute">Starting price</dt><dd>{profile.starting_price_etb == null ? "Not set" : formatMoney(Number(profile.starting_price_etb), "ETB")}</dd></div>
            <div className="min-w-0 sm:col-span-2"><dt className="text-ink-mute">Skills</dt><dd className="flex flex-wrap gap-2 pt-1">{skills.filter((skill) => skill.trim()).length ? skills.map((skill) => skill.trim()).filter(Boolean).map((skill) => <Badge key={skill}>{skill}</Badge>) : "No skills yet"}</dd></div>
            <div className="min-w-0 sm:col-span-2"><dt className="text-ink-mute">Biography</dt><dd className="whitespace-pre-wrap break-words">{profile.bio || "No biography yet"}</dd></div>
          </dl>
          {profile.status === "approved" && <Button href={`/freelancers/${encodeURIComponent(profile.slug)}`} variant="secondary" className="mt-5">View public page</Button>}
        </Card>
        <section>
          <h2 className="mb-3 text-xl font-semibold">Packages</h2>
          {packagesResult.error ? <p role="alert" className="text-red-300">Packages could not be loaded: {packagesResult.error.message}</p>
            : <div className="grid gap-3">{["basic", "standard", "premium"].map((tier) => {
              const pkg = packagesResult.data?.find((item) => item.tier.toLowerCase() === tier);
              return <Card key={tier}>
                {pkg ? <>
                  <div className="flex flex-wrap items-center justify-between gap-2"><h3 className="break-words font-semibold capitalize">{tier}: {pkg.title || "Untitled package"}</h3><Badge tone={pkg.is_active ? "ok" : "warn"}>{pkg.is_active ? "Active" : "Inactive"}</Badge></div>
                  <p className="mt-2 break-words text-ink-mute">{pkg.description || "No description yet."}</p>
                  <p className="mt-3 text-sm">{formatMoney(Number(pkg.price_etb), "ETB")} · {pkg.delivery_days} days · {pkg.revisions} revisions</p>
                </> : <><h3 className="font-semibold capitalize">{tier}</h3><p className="mt-2 text-ink-mute">No package yet.</p></>}
              </Card>;
            })}</div>}
        </section>
      </div>
      <section className="min-w-0"><h2 className="mb-3 text-xl font-semibold">Edit profile</h2><FreelancerManageForm profile={profile} packages={packagesResult.data ?? []} userId={user.id} /></section>
    </Container>
  </>;
}
