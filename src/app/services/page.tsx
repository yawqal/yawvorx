import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/PageHeader";
import { Container } from "@/components/ui/Container";
import { ServiceCard } from "@/components/cards/Cards";
import { Badge } from "@/components/ui/Badge";
import { getPublicServices } from "@/lib/services-db";
import { canonicalUrl } from "@/lib/seo";
import { Camera, Code2, Palette, PanelsTopLeft, ShoppingBag, Video } from "lucide-react";
import { Button } from "@/components/ui/Button";

export const metadata: Metadata = { title: "Services", description: "Website design and development, graphic design, branding, video and photo editing, e-commerce, and creative digital services.", alternates: { canonical: canonicalUrl("/services") } };

export const dynamic = "force-dynamic";

export default async function Services() {
  const { items, usingFallback } = await getPublicServices();
  const icons = [PanelsTopLeft, Code2, Palette, Video, Camera, ShoppingBag];
  return (
    <>
      <PageHeader title="Services" intro="A flexible mix of creative and digital services, brought together around the needs of your project.">
        <Badge>Availability confirmed on inquiry</Badge>
        {usingFallback && <Badge tone="demo">Showing sample catalog</Badge>}
      </PageHeader>
      <Container className="grid gap-8 py-8 sm:py-10 lg:grid-cols-[.72fr_1.28fr] lg:gap-12">
        <aside className="h-fit lg:sticky lg:top-28"><p className="eyebrow">The studio</p><h2 className="mt-3 text-3xl font-semibold leading-tight">Choose a starting point. We&apos;ll shape the scope together.</h2>
          <p className="mt-4 leading-relaxed text-ink-mute">Every engagement starts with a conversation. Deliverables are examples; scope, timing, and pricing are confirmed with you before work begins.</p>
          <Button href="/hire" variant="secondary" className="mt-6">Tell us about your project</Button>
        </aside>
        <div>
          <div className="mb-5 flex items-end justify-between border-b border-line pb-4"><div><p className="eyebrow">What we offer</p><h2 className="mt-2 text-2xl font-semibold">Services</h2></div><span className="text-sm text-ink-mute">{items.length} options</span></div>
          <div className="grid gap-4 sm:grid-cols-2">{items.map((s, index) => {
            const Icon = icons[index % icons.length];
            return <ServiceCard key={s.slug} s={s} full icon={<Icon size={21} strokeWidth={1.8} />} />;
          })}</div>
        </div>
      </Container>
    </>
  );
}
