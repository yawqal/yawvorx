import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/PageHeader";
import { Section } from "@/components/ui/Container";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { siteConfig } from "@/config/site";
import { canonicalUrl } from "@/lib/seo";
import { ArrowUpRight, Compass, Layers3, ShieldCheck, Sparkles } from "lucide-react";

export const metadata: Metadata = { title: "About", description: "About YAWVOREX, a premium digital technology and creative studio.", alternates: { canonical: canonicalUrl("/about") } };

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
      <Section title="A studio built around the work" intro="ZIKA brings creative and digital work together through a single, considered platform.">
        <div className="grid gap-5 lg:grid-cols-[1.05fr_.95fr]">
          <Card className="bg-aurora flex flex-col justify-between p-6 sm:p-9">
            <div><p className="eyebrow">Why we exist</p><h3 className="mt-4 max-w-xl text-3xl font-semibold leading-tight sm:text-4xl">Make thoughtful digital work feel within reach.</h3>
              <p className="mt-4 max-w-xl leading-relaxed text-ink-mute">{mission}</p></div>
            <Button href="/services" variant="secondary" className="mt-8 w-fit">Explore services <ArrowUpRight size={16} /></Button>
          </Card>
          <div className="grid gap-4">
            <Card className="flex gap-4 sm:p-7"><span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-violet/10 text-violet-soft"><Compass size={20} /></span><div><h3 className="font-semibold">Vision</h3><p className="mt-2 leading-relaxed text-ink-mute">{vision}</p></div></Card>
            <Card className="bg-ink text-white sm:p-7"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-bright">Our point of view</p><p className="mt-3 max-w-lg text-xl font-medium leading-relaxed">Useful technology and expressive design belong in the same conversation.</p></Card>
          </div>
        </div>
      </Section>
      <Section title="Values">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{values.map((v, i) => {
          const Icon = [Sparkles, Layers3, Compass, ShieldCheck][i];
          return <Card key={v.t} className="min-h-44"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet/10 text-violet-soft"><Icon size={19} /></span><h3 className="mt-5 font-semibold">{v.t}</h3><p className="mt-2 text-sm leading-relaxed text-ink-mute">{v.d}</p></Card>;
        })}</div>
      </Section>
      <Section title="Our approach" intro="We combine creative direction with careful engineering: designs are planned for phones first, built with accessible, maintainable code, and tested before they reach you.">
        <Card className="bg-gradient-to-br from-violet/[0.08] via-white to-cyan/[0.08] flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between sm:p-8">
          <div><p className="eyebrow">Start a conversation</p><h3 className="mt-2 text-2xl font-semibold">Bring the next idea into focus.</h3></div>
          <Button href="/hire">Hire YAWVOREX <ArrowUpRight size={16} /></Button>
        </Card>
      </Section>
    </>
  );
}
