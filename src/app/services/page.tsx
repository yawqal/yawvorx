import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/PageHeader";
import { Section } from "@/components/ui/Container";
import { ServiceCard } from "@/components/cards/Cards";
import { Badge } from "@/components/ui/Badge";
import { getPublicServices } from "@/lib/services-db";
import { canonicalUrl } from "@/lib/seo";

export const metadata: Metadata = { title: "Services", description: "Website design and development, graphic design, branding, video and photo editing, e-commerce, and creative digital services.", alternates: { canonical: canonicalUrl("/services") } };

export const dynamic = "force-dynamic";

export default async function Services() {
  const { items, usingFallback } = await getPublicServices();
  return (
    <>
      <PageHeader title="Services" intro="Choose a service to send an inquiry. Scope, timing, and price are confirmed with you before work begins.">
        <Badge>Availability confirmed on inquiry</Badge>
        {usingFallback && <Badge tone="demo">Showing sample catalog</Badge>}
      </PageHeader>
      <Section title="What we offer" intro="Deliverables listed are typical examples and are agreed per project.">
        <div className="grid gap-5 md:grid-cols-2">{items.map((s) => <ServiceCard key={s.slug} s={s} full />)}</div>
      </Section>
    </>
  );
}
