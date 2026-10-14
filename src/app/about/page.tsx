import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/PageHeader";
import { Section } from "@/components/ui/Container";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = { title: "About", description: "About YAWVOREX, a premium digital technology and creative studio." };

// EDITABLE CONTENT: change the text below. Add real background only when it is true and approved.
const mission = "To make premium digital work accessible: websites, creative content, and products built with care.";
const vision = "A studio recognised for design and technology that feel ahead of their time.";
const values = [
  { t: "Quality", d: "Details matter, from spacing to performance." },
  { t: "Clarity", d: "Plain communication and agreed scope." },
  { t: "Innovation", d: "Modern tools used where they genuinely help." },
  { t: "Reliability", d: "Say what we will do, then do it." },
];

export default function About() {
  return (
    <>
      <PageHeader title={`About ${siteConfig.name}`} intro={siteConfig.description} />
      <Section title="Mission and vision">
        <div className="grid gap-5 sm:grid-cols-2">
          <Card><h3 className="text-lg font-semibold">Mission</h3><p className="mt-2 text-ink-mute">{mission}</p></Card>
          <Card><h3 className="text-lg font-semibold">Vision</h3><p className="mt-2 text-ink-mute">{vision}</p></Card>
        </div>
      </Section>
      <Section title="Values">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{values.map((v) => <Card key={v.t}><h3 className="font-semibold">{v.t}</h3><p className="mt-2 text-sm text-ink-mute">{v.d}</p></Card>)}</div>
      </Section>
      <Section title="Our approach" intro="We combine creative direction with careful engineering: designs are planned for phones first, built with accessible, maintainable code, and tested before they reach you.">
        <Button href="/hire">Hire YAWVOREX</Button>
      </Section>
    </>
  );
}
