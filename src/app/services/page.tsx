import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/PageHeader";
import { Container } from "@/components/ui/Container";
import { ServiceCard } from "@/components/cards/Cards";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { getPublicServices } from "@/lib/services-db";
import { canonicalUrl } from "@/lib/seo";
import { Camera, Code2, Palette, PanelsTopLeft, ShoppingBag, Video } from "lucide-react";

export const metadata: Metadata = { title: "Services", description: "Website design and development, graphic design, branding, video and photo editing, e-commerce, and creative digital services.", alternates: { canonical: canonicalUrl("/services") } };

export const dynamic = "force-dynamic";

export default async function Services() {
  const { items, usingFallback } = await getPublicServices();
  const icons = [PanelsTopLeft, Code2, Palette, Video, Camera, ShoppingBag];
  const FeaturedIcon = items.length > 0 ? icons[0] : null;

  return (
    <>
      <PageHeader title="Services" intro="A flexible mix of creative and digital services, brought together around the needs of your project.">
        <Badge>Availability confirmed on inquiry</Badge>
        {usingFallback && <Badge tone="demo">Showing sample catalog</Badge>}
      </PageHeader>

      {/* Hero Section */}
      <Container className="mx-auto w-full max-w-3xl py-16 sm:py-20 text-center">
        <h1 className="mb-4 text-3xl font-semibold leading-tight sm:text-4xl">
          Expert Services for Your Digital Journey
        </h1>
        <p className="mb-6 max-w-xl text-base leading-relaxed text-ink-mute sm:text-lg">
          From concept to launch, our specialized teams bring clarity, creativity, and technical excellence to every project.
        </p>
        <Button href="/hire" variant="primary">
          Start Your Project
        </Button>
      </Container>

      {/* Featured Service */}
      {items.length > 0 && (
        <Container className="mx-auto w-full px-5 sm:px-8 lg:px-12 py-12">
          <h2 className="mb-6 text-2xl font-semibold leading-tight sm:text-3xl text-center">
            Featured Service
          </h2>
          <div className="grid gap-6 sm:grid-cols-1 lg:grid-cols-2">
            <div className="relative">
              <div className="surface p-6 sm:p-8">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-semibold uppercase tracking-[0.16em] text-ink-mute">
                    {items[0].title}
                  </span>
                  {/* Featured service icon */}
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet/10 text-violet-soft">
                    {FeaturedIcon && <FeaturedIcon size={18} strokeWidth={1.5} />}
                  </span>
                </div>
                <p className="mb-4 leading-relaxed text-ink-mute">
                  {items[0].description}
                </p>
                <div className="mt-4 space-y-2 text-sm text-ink-mute">
                  {items[0].deliverables.slice(0, 3).map((d, idx) => (
                    <div key={idx} className="flex gap-2">
                      <span aria-hidden="true" className="text-cyan">+</span>{d}
                    </div>
                  ))}
                </div>
                <Button href={`/hire?service=${items[0].slug}`} variant="secondary" className="mt-4 w-fit">
                  Learn More
                </Button>
              </div>
            </div>
            {/* Additional info or call to action */}
            <div className="surface p-6 sm:p-8">
              <h3 className="mb-4 text-xl font-semibold">How We Work</h3>
              <p className="mb-4 leading-relaxed text-ink-mute">
                Every engagement begins with a conversation to understand your goals. We define scope, timeline, and deliverables upfront, then execute with regular check-ins and transparent communication.
              </p>
              <Button href="/hire" variant="ghost" className="mt-6 w-full sm:w-auto">
                Tell Us About Your Project
              </Button>
            </div>
          </div>
        </Container>
      )}

      {/* All Services Grid */}
      <Container className="mx-auto w-full px-5 sm:px-8 lg:px-12 py-12">
        <h2 className="mb-6 text-2xl font-semibold leading-tight sm:text-3xl text-center">
          Our Services
        </h2>
        <p className="mx-auto mb-8 max-w-xl text-base leading-relaxed text-ink-mute sm:text-lg text-center">
          Browse our complete service offerings and find the right fit for your next project.
        </p>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((service, index) => {
            const Icon = icons[index % icons.length];
            return (
              <ServiceCard key={service.slug} s={service} full icon={<Icon size={21} strokeWidth={1.8} />} />
            );
          })}
        </div>
      </Container>
    </>
  );
}
