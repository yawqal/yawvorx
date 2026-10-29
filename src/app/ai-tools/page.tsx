import type { Metadata } from "next";
import { canonicalUrl } from "@/lib/seo";
import { getPublicServices } from "@/lib/services-db";
import type { Service } from "@/data/services";
import AiToolsClient from "./AiToolsClient";
import { PageHeader } from "@/components/ui/PageHeader";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";

export const metadata: Metadata = {
  title: "AI Tools & Services",
  description: "Discover ZIKA's AI-enhanced creative and digital services.",
  alternates: { canonical: canonicalUrl("/ai-tools") },
  robots: { index: true, follow: true },
};

export default async function AiToolsPage() {
  try {
    const { items } = await getPublicServices();
    return <AiToolsClient services={items} />;
  } catch (error) {
    console.error(error);
    return (
      <Container className="py-20 text-center">
        <p className="text-red-300">Failed to load services.</p>
        <Button href="/" variant="secondary">
          Return Home
        </Button>
      </Container>
    );
  }
}
