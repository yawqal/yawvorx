import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { Badge } from "@/components/ui/Badge";
import { PortfolioBrowser } from "@/components/portfolio/PortfolioBrowser";
import { getPublicProjects } from "@/lib/portfolio-db";
import { canonicalUrl } from "@/lib/seo";

export const metadata: Metadata = { title: "Portfolio", description: "Sample concepts showing the YAWVOREX approach to web, branding, video, and photo work.", alternates: { canonical: canonicalUrl("/portfolio") } };

export const dynamic = "force-dynamic";

export default async function Portfolio() {
  const { items, usingFallback } = await getPublicProjects();
  return (
    <>
      <div className="bg-aurora border-b border-line">
        <Container className="grid gap-8 py-12 sm:py-16 lg:grid-cols-[1fr_auto] lg:items-end lg:py-20">
          <div>
            <div className="mb-5 flex flex-wrap gap-2">
              {items.some((project) => project.isDemo !== false) && <Badge tone="demo">Includes sample concepts</Badge>}
              {usingFallback && <Badge tone="demo">Showing sample fallback</Badge>}
            </div>
            <p className="eyebrow">A view into the studio</p>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-6xl">Selected work<span className="text-violet-soft">.</span></h1>
            <p className="mt-4 max-w-2xl text-base leading-relaxed text-ink-mute sm:text-lg">{usingFallback
              ? "The projects below are sample concepts created to show our approach. They are not completed client work."
              : "Published work and concepts from the studio."}</p>
          </div>
          <div className="hidden rounded-2xl border border-white/80 bg-white/65 p-5 shadow-sm backdrop-blur sm:block">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-ink-mute">Browse by</p><p className="mt-2 text-lg font-semibold">Discipline &amp; format</p>
          </div>
        </Container>
      </div>
      <Container className="py-8 sm:py-12"><PortfolioBrowser projects={items} /></Container>
    </>
  );
}
