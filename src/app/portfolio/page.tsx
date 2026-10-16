import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/PageHeader";
import { Section } from "@/components/ui/Container";
import { Badge } from "@/components/ui/Badge";
import { PortfolioBrowser } from "@/components/portfolio/PortfolioBrowser";
import { projects } from "@/data/portfolio";

export const metadata: Metadata = { title: "Portfolio", description: "Sample concepts showing the Zika Go approach to web, branding, video, and photo work." };

export default function Portfolio() {
  return (
    <>
      <PageHeader title="Portfolio" intro="The projects below are sample concepts created to show our approach. They are not completed client work."><Badge tone="demo">Sample concepts</Badge></PageHeader>
      <Section title="Projects"><PortfolioBrowser projects={projects} /></Section>
    </>
  );
}
