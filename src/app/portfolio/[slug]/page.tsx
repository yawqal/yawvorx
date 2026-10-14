import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Container } from "@/components/ui/Container";
import { Badge } from "@/components/ui/Badge";
import { Art } from "@/components/ui/Art";
import { Button } from "@/components/ui/Button";
import { getProject, projects } from "@/data/portfolio";

export function generateStaticParams() { return projects.map((p) => ({ slug: p.slug })); }

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const p = getProject(params.slug);
  return p ? { title: p.title, description: p.summary } : { title: "Project not found" };
}

export default function ProjectPage({ params }: { params: { slug: string } }) {
  const p = getProject(params.slug);
  if (!p) notFound();
  return (
    <Container className="max-w-3xl py-12">
      <Link href="/portfolio" className="inline-block py-2 text-ink-mute hover:text-ink">Back to portfolio</Link>
      <div className="mt-4 flex flex-wrap gap-2"><Badge tone="demo">Sample concept, not client work</Badge><Badge>{p.category}</Badge>{p.tags.map((t) => <Badge key={t}>{t}</Badge>)}</div>
      <h1 className="mt-4 text-3xl font-semibold sm:text-5xl">{p.title}</h1>
      <Art seed={p.slug.length} className="mt-6" />
      <h2 className="mt-8 text-xl font-semibold">Brief</h2><p className="mt-2 text-ink-mute">{p.brief}</p>
      <h2 className="mt-8 text-xl font-semibold">Approach</h2><p className="mt-2 text-ink-mute">{p.approach}</p>
      <h2 className="mt-8 text-xl font-semibold">Deliverables</h2>
      <ul className="mt-2 space-y-1 text-ink-mute">{p.deliverables.map((d) => <li key={d}>+ {d}</li>)}</ul>
      {p.liveUrl && <Button href={p.liveUrl} variant="secondary" className="mt-6">View live project</Button>}
      <div className="mt-10"><Button href="/hire">Start a similar project</Button></div>
    </Container>
  );
}
