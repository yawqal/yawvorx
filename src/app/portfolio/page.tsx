import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/PageHeader";
import { Section } from "@/components/ui/Container";
import { Badge } from "@/components/ui/Badge";
import { PortfolioBrowser } from "@/components/portfolio/PortfolioBrowser";
import { getPublicProjects } from "@/lib/portfolio-db";

export const metadata: Metadata = { title: "Portfolio", description: "Sample concepts showing the YAWVOREX approach to web, branding, video, and photo work." };

export const dynamic = "force-dynamic";

export default async function Portfolio() {
  const { items, usingFallback } = await getPublicProjects();
  return (
    <>
      <PageHeader title="Portfolio" intro={usingFallback
        ? "The projects below are sample concepts created to show our approach. They are not completed client work."
        : "Published work and concepts from the studio."}>
        {items.some((project) => project.isDemo !== false) && <Badge tone="demo">Includes sample concepts</Badge>}
        {usingFallback && <Badge tone="demo">Showing sample fallback</Badge>}
      </PageHeader>
      <Section title="Projects"><PortfolioBrowser projects={items} /></Section>
    </>
  );
}
