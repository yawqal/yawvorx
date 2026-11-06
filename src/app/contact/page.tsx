import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/PageHeader";
import { Container } from "@/components/ui/Container";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { emailLink, socialLinks, whatsappLink } from "@/config/site";
import { canonicalUrl } from "@/lib/seo";
import { ArrowUpRight, Mail, MessageCircle } from "lucide-react";

export const metadata: Metadata = { title: "Contact", description: "Contact YAWVOREX through Telegram, TikTok, Facebook, Instagram, and more.", alternates: { canonical: canonicalUrl("/contact") } };

export default function Contact() {
  const wa = whatsappLink();
  const mail = emailLink();
  return (
    <>
      <PageHeader title="Let&apos;s talk" intro="Reach the YAWVOREX studio through the channel that works best for you." />
      <Container className="grid gap-8 py-8 sm:py-12 lg:grid-cols-[.8fr_1.2fr] lg:gap-14">
        <aside className="h-fit lg:sticky lg:top-28">
          <div className="rounded-[1.5rem] bg-ink p-6 text-white sm:p-8"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-bright">Have a project?</p>
            <h2 className="mt-3 text-3xl font-semibold leading-tight">Start with what you&apos;re imagining.</h2>
            <p className="mt-4 leading-relaxed text-white/75">Share the outline through the project request form. Choose how you&apos;d like the team to reach you.</p>
            <Button href="/hire" className="mt-6 bg-white text-ink hover:bg-white/90">Open project form <ArrowUpRight size={16} /></Button>
          </div>
          <Card className="mt-4"><p className="eyebrow">Direct channels</p><p className="mt-2 text-sm leading-relaxed text-ink-mute">Choose any available social channel below. Contact options that are not configured are clearly marked.</p></Card>
        </aside>
        <div>
          <h2 className="mb-4 text-xl font-semibold">Connect with the studio</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {socialLinks().map((s) => (
              <Card key={s.name} className="flex min-h-36 flex-col">
                <p className="text-xs font-semibold uppercase tracking-[0.15em] text-brand-soft">{s.name}</p><h3 className="mt-2 text-lg font-semibold">{s.handle}</h3>
                <Button href={s.href} variant="ghost" className="mt-auto w-fit px-0">Open {s.name} <ArrowUpRight size={15} /></Button>
              </Card>
            ))}
            <Card className="flex min-h-36 flex-col">
              <div className="flex items-center gap-2"><MessageCircle size={17} className="text-secondary-soft" /><h3 className="text-lg font-semibold">WhatsApp</h3>{!wa && <Badge tone="warn">Unavailable</Badge>}</div>
              {wa ? <Button href={wa} variant="ghost" className="mt-auto w-fit px-0">Message on WhatsApp <ArrowUpRight size={15} /></Button>
                : <p className="mt-auto text-sm text-ink-mute">WhatsApp contact is not configured.</p>}
            </Card>
            <Card className="flex min-h-36 flex-col">
              <div className="flex items-center gap-2"><Mail size={17} className="text-secondary-soft" /><h3 className="text-lg font-semibold">Email</h3>{!mail && <Badge tone="warn">Unavailable</Badge>}</div>
              {mail ? <Button href={mail} variant="ghost" className="mt-auto w-fit px-0">Send an email <ArrowUpRight size={15} /></Button>
                : <p className="mt-auto text-sm text-ink-mute">Email contact is not configured.</p>}
            </Card>
          </div>
          <p className="mt-5 text-sm text-ink-mute">Contact and project inquiries are handled through the existing links and form. No direct-message form is provided here.</p>
        </div>
      </Container>
    </>
  );
}
