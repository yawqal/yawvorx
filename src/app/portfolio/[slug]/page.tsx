import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Container } from "@/components/ui/Container";
import { Badge } from "@/components/ui/Badge";
import { ProjectArtwork } from "@/components/portfolio/ProjectArtwork";
import { Button } from "@/components/ui/Button";
import { getPublicProject } from "@/lib/portfolio-db";
import { canonicalUrl } from "@/lib/seo";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const { project: p } = await getPublicProject(slug);
  return p ? {
    title: p.title,
    description: p.summary,
    openGraph: { title: p.title, description: p.summary, type: "article" },
    alternates: { canonical: canonicalUrl(`/portfolio/${encodeURIComponent(p.slug)}`) },
  } : { title: "Project not found", description: "This portfolio project could not be found." };
}

export default async function ProjectPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { project: p, usingFallback } = await getPublicProject(slug);
  if (!p) notFound();
  return (
    <Container className="max-w-6xl py-12">
      <Link href="/portfolio" className="inline-block py-2 text-ink-mute hover:text-ink">Back to portfolio</Link>
      <div className="mt-5 flex flex-wrap gap-2">
        {p.isDemo !== false && <Badge tone="demo">Sample concept, not client work</Badge>}
        {usingFallback && <Badge tone="demo">Static fallback</Badge>}
        <Badge>{p.category}</Badge>{p.tags.map((t) => <Badge key={t}>{t}</Badge>)}
      </div>
      <h1 className="mt-5 text-4xl font-semibold leading-[1.08] tracking-tight sm:text-6xl">{p.title}</h1>
      <p className="mt-4 max-w-3xl text-lg leading-relaxed text-ink-mute">{p.summary}</p>
      <ProjectArtwork imageUrl={p.coverImageUrl} title={p.title} seed={p.slug.length} className="mt-8 !aspect-[16/9] rounded-[1.5rem]" />
      <div className="mt-10 grid gap-10 sm:grid-cols-[minmax(0,1fr)_minmax(13rem,.6fr)]">
        <div className="space-y-8">
          <section><p className="eyebrow">The brief</p><h2 className="mt-2 text-2xl font-semibold">Brief</h2><p className="mt-3 leading-relaxed text-ink-mute">{p.brief}</p></section>
          <section><p className="eyebrow">The thinking</p><h2 className="mt-2 text-2xl font-semibold">Approach</h2><p className="mt-3 leading-relaxed text-ink-mute">{p.approach}</p></section>
        </div>
        <aside className="glass-panel h-fit rounded-2xl p-5 sm:p-6">
          <p className="eyebrow">Project scope</p><h2 className="mt-2 text-xl font-semibold">Deliverables</h2>
          <ul className="mt-4 space-y-3 text-sm text-ink-mute">{p.deliverables.map((d) => <li key={d} className="flex gap-3"><span className="text-violet-soft">↗</span><span>{d}</span></li>)}</ul>
          {p.liveUrl && <Button href={p.liveUrl} variant="secondary" className="mt-6 w-full">View live project</Button>}
        </aside>
      </div>
      <div className="mt-10 rounded-2xl bg-ink p-6 text-white sm:flex sm:items-center sm:justify-between sm:gap-8 sm:p-8">
        <div><p className="text-sm text-white/70">Have a related idea?</p><h2 className="mt-1 text-2xl font-semibold">Let&apos;s shape it into something real.</h2></div>
        <Button href="/hire" className="mt-5 bg-white text-ink hover:bg-white/90 sm:mt-0">Start a project</Button>
      </div>
    </Container>
  );
}
