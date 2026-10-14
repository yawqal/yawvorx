import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/PageHeader";
import { Section } from "@/components/ui/Container";
import { ServiceCard } from "@/components/cards/Cards";
import { Badge } from "@/components/ui/Badge";
import { services } from "@/data/services";

export const metadata: Metadata = { title: "Services", description: "Website design and development, graphic design, branding, video and photo editing, e-commerce, and creative digital services." };

export default function Services() {
  return (
    <>
      <PageHeader title="Services" intro="Choose a service to send an inquiry. Scope, timing, and price are confirmed with you before work begins."><Badge>Availability confirmed on inquiry</Badge></PageHeader>
      <Section title="What we offer" intro="Deliverables listed are typical examples and are agreed per project.">
        <div className="grid gap-5 md:grid-cols-2">{services.map((s) => <ServiceCard key={s.slug} s={s} full />)}</div>
      </Section>
    </>
  );
}
