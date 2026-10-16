import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Art } from "@/components/ui/Art";
import { formatMoney } from "@/lib/format";
import { availability, type Product } from "@/data/products";
import type { Project } from "@/data/portfolio";
import type { Service } from "@/data/services";

export function ServiceCard({ s, full = false }: { s: Service; full?: boolean }) {
  return (
    <Card interactive className="flex h-full flex-col" >
      <h3 id={s.slug} className="text-lg font-semibold">{s.title}</h3>
      <p className="mt-2 text-ink-mute">{s.description}</p>
      <ul className="mt-4 space-y-1.5 text-sm text-ink-mute">
        {(full ? s.deliverables : s.deliverables.slice(0, 3)).map((d) => (
          <li key={d} className="flex gap-2"><span aria-hidden="true" className="text-cyan">+</span>{d}</li>
        ))}
      </ul>
      <div className="mt-auto pt-5">
        <Button href={`/hire?service=${s.slug}`} variant="secondary" className="w-full sm:w-auto">Inquire about {s.title}</Button>
      </div>
    </Card>
  );
}

export function ProjectCard({ p }: { p: Project }) {
  const seed = p.slug.length;
  return (
    <Link href={`/portfolio/${p.slug}`} className="surface surface-hover block overflow-hidden p-3 sm:p-4">
      <Art seed={seed} />
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Badge tone="demo">Sample concept</Badge><Badge>{p.category}</Badge>
      </div>
      <h3 className="mt-3 text-lg font-semibold">{p.title}</h3>
      <p className="mt-1 text-ink-mute">{p.summary}</p>
    </Link>
  );
}

export function ProductCard({ p }: { p: Product }) {
  const a = availability(p);
  return (
    <Link href={`/shop/${p.slug}`} className="surface surface-hover block overflow-hidden p-3 sm:p-4">
      <Art seed={p.name.length} />
      <div className="mt-4 flex flex-wrap items-center gap-2">
        {p.isDemo && <Badge tone="demo">Demo product</Badge>}
        <Badge>{p.type === "digital" ? "Digital" : "Physical"}</Badge>
      </div>
      <h3 className="mt-3 text-lg font-semibold">{p.name}</h3>
      <p className="mt-1 text-sm text-ink-mute">{p.category}</p>
      <div className="mt-3 flex items-center justify-between">
        <span className="font-display text-lg">{formatMoney(p.price, p.currency)}</span>
        <span className={`text-sm ${a.ok ? "text-ink-mute" : "text-red-300"}`}>{a.label}</span>
      </div>
    </Link>
  );
}
