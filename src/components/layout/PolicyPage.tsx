import { PageHeader } from "@/components/ui/PageHeader";
import { Container } from "@/components/ui/Container";
import { Badge } from "@/components/ui/Badge";
import { policies } from "@/data/policies";

export function PolicyPage({ slug }: { slug: string }) {
  const policy = policies.find((p) => p.slug === slug)!;
  return (
    <>
      <PageHeader title={policy.title} intro={policy.summary}><Badge tone="warn">Draft template: owner review required</Badge></PageHeader>
      <Container className="max-w-3xl py-12">
        <p className="rounded-xl border border-amber-400/30 p-4 text-sm text-ink-mute">
          This is a starting template, not legal advice. Replace every [bracketed] item with your real policy before launch. Edit it in <code>src/data/policies.ts</code>.
        </p>
        {policy.sections.map((s) => (
          <section key={s.h} className="mt-8">
            <h2 className="text-xl font-semibold">{s.h}</h2>
            {s.p.map((t) => <p key={t} className="mt-3 text-ink-mute">{t}</p>)}
          </section>
        ))}
      </Container>
    </>
  );
}
