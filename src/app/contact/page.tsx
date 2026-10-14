import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/PageHeader";
import { Container } from "@/components/ui/Container";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { emailLink, siteConfig, socialLinks, whatsappLink } from "@/config/site";

export const metadata: Metadata = { title: "Contact", description: "Contact YAWVOREX through Telegram, TikTok, Facebook, Instagram, and more." };

export default function Contact() {
  const wa = whatsappLink();
  const mail = emailLink();
  return (
    <>
      <PageHeader title="Contact" intro="Reach YAWVOREX through any channel below." />
      <Container className="grid gap-5 py-10 sm:grid-cols-2">
        {socialLinks().map((s) => (
          <Card key={s.name}><h2 className="text-lg font-semibold">{s.name}</h2><p className="text-ink-mute">{s.handle}</p>
            <Button href={s.href} variant="secondary" className="mt-4">Open {s.name}</Button></Card>
        ))}
        <Card><div className="flex items-center gap-2"><h2 className="text-lg font-semibold">WhatsApp</h2>{!wa && <Badge tone="warn">Not set up yet</Badge>}</div>
          {wa ? <Button href={wa} variant="secondary" className="mt-4">Message on WhatsApp</Button>
              : <p className="mt-2 text-sm text-ink-mute">Owner: set NEXT_PUBLIC_WHATSAPP_NUMBER to enable this.</p>}</Card>
        <Card><div className="flex items-center gap-2"><h2 className="text-lg font-semibold">Email</h2>{!mail && <Badge tone="warn">Not set up yet</Badge>}</div>
          {mail ? <Button href={mail} variant="secondary" className="mt-4">Send an email</Button>
              : <p className="mt-2 text-sm text-ink-mute">Owner: set NEXT_PUBLIC_CONTACT_EMAIL to a valid address to enable this.</p>}</Card>
        <Card className="sm:col-span-2"><h2 className="text-lg font-semibold">Have a project?</h2>
          <p className="mt-2 text-ink-mute">Use the request form for the fastest start with {siteConfig.name}.</p><Button href="/hire" className="mt-4">Hire YAWVOREX</Button></Card>
      </Container>
    </>
  );
}
