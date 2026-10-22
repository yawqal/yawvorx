import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/PageHeader";
import { Container } from "@/components/ui/Container";
import { Badge } from "@/components/ui/Badge";
import { faqs } from "@/data/faq";
import { canonicalUrl } from "@/lib/seo";

export const metadata: Metadata = { title: "FAQ", description: "Answers about YAWVOREX services, orders, payments, delivery, and returns.", alternates: { canonical: canonicalUrl("/faq") } };

export default function Faq() {
  const groups = Array.from(new Set(faqs.map((f) => f.group)));
  return (
    <>
      <PageHeader title="Frequently asked questions" intro="Answers marked DRAFT are examples that the owner must replace with real policies."><Badge tone="warn">Contains draft answers</Badge></PageHeader>
      <Container className="max-w-3xl py-10">
        {groups.map((g) => (
          <section key={g} className="mb-8"><h2 className="text-xl font-semibold">{g}</h2>
            <div className="mt-3 space-y-3">{faqs.filter((f) => f.group === g).map((f) => (
              <details key={f.q} className="surface group p-4">
                <summary className="min-h-[44px] cursor-pointer list-none font-medium marker:hidden">{f.q}</summary>
                <p className="mt-2 text-ink-mute">{f.a}</p>
              </details>
            ))}</div></section>
        ))}
      </Container>
    </>
  );
}
