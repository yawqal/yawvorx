import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { ProductImage } from "@/components/ui/ProductImage";
import { ProductPrice } from "@/components/shop/ProductPrice";
import { ProjectArtwork } from "@/components/portfolio/ProjectArtwork";
import { availability, type Product } from "@/data/products";
import type { Project } from "@/data/portfolio";
import type { Service } from "@/data/services";

export function ServiceCard({ s, full = false, icon }: { s: Service; full?: boolean; icon?: React.ReactNode }) {
  return (
    <Card interactive className="flex h-full flex-col">
      {icon && <div aria-hidden="true" className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl border border-brand/20 bg-brand/10 text-brand">{icon}</div>}
      <h3 id={s.slug} className="text-lg font-semibold">{s.title}</h3>
      <p className="mt-2 text-ink-mute">{s.description}</p>
      <ul className="mt-4 space-y-1.5 text-sm text-ink-mute">
        {(full ? s.deliverables : s.deliverables.slice(0, 3)).map((d) => (
          <li key={d} className="flex gap-2"><span aria-hidden="true" className="text-brand">+</span>{d}</li>
        ))}
      </ul>
      <div className="mt-auto pt-5">
        <Button href={`/hire?service=${s.slug}`} variant="secondary" className="w-full sm:w-auto">Inquire about {s.title}</Button>
      </div>
    </Card>
  );
}

export function ProjectCard({ p, featured = false }: { p: Project; featured?: boolean }) {
  const seed = p.slug.length;
  return (
    <Link href={`/portfolio/${p.slug}`} className={`surface surface-hover group flex h-full flex-col overflow-hidden ${featured ? "sm:flex-row" : ""}`}>
      <div className={featured ? "sm:w-[58%]" : ""}>
        <ProjectArtwork imageUrl={p.coverImageUrl} title={p.title} seed={seed} className={featured ? "h-full !aspect-[4/3] rounded-b-none border-0 sm:!aspect-auto sm:min-h-[300px]" : "rounded-b-none border-0"} />
      </div>
      <div className={`flex flex-1 flex-col p-4 sm:p-5 ${featured ? "sm:justify-center sm:px-7 sm:py-8" : ""}`}>
        <div className="flex flex-wrap items-center gap-2">
          {p.isDemo !== false && <Badge tone="demo">Sample concept</Badge>}<Badge>{p.category}</Badge>
        </div>
        <h3 className={`mt-3 font-semibold ${featured ? "text-2xl sm:text-3xl" : "text-lg"}`}>{p.title}</h3>
        <p className="mt-2 leading-relaxed text-ink-mute">{p.summary}</p>
        {p.tags.length > 0 && <div className="mt-4 flex flex-wrap gap-2">{p.tags.slice(0, featured ? 4 : 2).map((tag) => <span key={tag} className="rounded-full bg-obsidian-800 px-2.5 py-1 text-xs text-ink-mute">{tag}</span>)}</div>}
        <span className="mt-auto inline-flex items-center pt-5 text-sm font-semibold text-brand-soft">Explore project <span aria-hidden="true" className="ml-2 transition group-hover:translate-x-1">↗</span></span>
      </div>
    </Link>
  );
}

export function ProductCard({ p }: { p: Product }) {
  const a = availability(p);
  return (
    <Link href={`/shop/${p.slug}`} className="surface surface-hover group flex h-full flex-col overflow-hidden">
      <div className="relative p-2.5 pb-0 sm:p-3 sm:pb-0">
        <ProductImage src={p.image_urls?.[0] ?? p.image_url} alt={p.name} className="rounded-xl" />
        <div className="absolute left-5 top-5 flex flex-wrap gap-2">
          {p.isDemo && <Badge tone="demo">Demo product</Badge>}
          <Badge>{p.type === "digital" ? "Digital" : "Physical"}</Badge>
        </div>
      </div>
      <div className="flex flex-1 flex-col px-4 pb-4 pt-4 sm:px-5 sm:pb-5">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-mute">{p.category}</p>
        <h3 className="mt-2 text-lg font-semibold leading-snug">{p.name}</h3>
        <div className="mt-auto flex items-end justify-between gap-3 pt-6">
          <ProductPrice product={p} className="font-display text-lg" />
          <span className={`text-right text-xs ${a.ok ? "text-ink-mute" : "text-red-300"}`}>{a.label}</span>
        </div>
      </div>
    </Link>
  );
}
