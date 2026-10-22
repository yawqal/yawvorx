import { Container, Section } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ServiceCard, ProjectCard, ProductCard } from "@/components/cards/Cards";
import { siteConfig, socialLinks } from "@/config/site";
import { getProducts } from "@/lib/products-db";
import { getPublicServices } from "@/lib/services-db";
import { getPublicProjects } from "@/lib/portfolio-db";
import type { Metadata } from "next";
import { ArrowUpRight, Camera, Code2, Palette, PanelsTopLeft, ShoppingBag, Video } from "lucide-react";
import Link from "next/link";
import { canonicalUrl } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Home",
  description: "Modern e-commerce, digital technology, and creative services from ZIKA.",
  openGraph: { title: "ZIKA", description: "Modern e-commerce, digital technology, and creative services from ZIKA.", type: "website" },
  alternates: { canonical: canonicalUrl("/") },
};

const why = [
  { t: "One studio, many disciplines", d: "Design, development, media, and e-commerce under one roof, so your project stays consistent." },
  { t: "Mobile-first by default", d: "Everything is built to work on a phone first, then scale up." },
  { t: "Clear communication", d: "You choose how we reach you, and scope is agreed before work begins." },
  { t: "Built to grow", d: "Foundations that let you add services, products, and pages later." },
];
const steps = [
  { t: "Discuss", d: "Tell us what you need through the Hire page." },
  { t: "Plan", d: "We agree on scope, timing, and deliverables." },
  { t: "Create", d: "We design and build, sharing progress as agreed." },
  { t: "Review", d: "You give feedback and we refine." },
  { t: "Deliver", d: "Final files or the launched project are handed over." },
];
const ecosystem = [
  { title: "Creative services", description: "Design and digital work shaped around your project.", href: "/services", accent: "text-violet-soft" },
  { title: "Marketplace", description: "Browse available products from the live catalog.", href: "/shop", accent: "text-cyan" },
  { title: "Digital products", description: "Explore digital items in the current shop.", href: "/shop", accent: "text-violet-soft" },
  { title: "Freelancers", description: "A dedicated freelancer marketplace is coming soon.", href: "/freelancers", accent: "text-cyan" },
  { title: "Learning", description: "Courses and learning resources are coming soon.", href: "/courses", accent: "text-violet-soft" },
  { title: "AI tools", description: "An AI tools directory is coming soon.", href: "/ai-tools", accent: "text-cyan" },
];
const serviceIcons = [PanelsTopLeft, Code2, Palette, Video, Camera, ShoppingBag];

export const dynamic = "force-dynamic";

export default async function Home() {
  const [{ items: services }, { items: projects }, products] = await Promise.all([
    getPublicServices(), getPublicProjects(), getProducts(),
  ]);
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "Organization",
        name: "ZIKA by YAWVOREX",
        url: canonicalUrl("/"),
        description: siteConfig.description,
      }).replace(/</g, "\\u003c") }} />
      <div className="bg-aurora relative isolate overflow-hidden border-b border-line">
        <div aria-hidden="true" className="pointer-events-none absolute -right-40 top-12 h-[26rem] w-[26rem] rounded-full border border-white/[0.04] sm:right-0">
          <div className="absolute inset-8 rounded-full border border-white/[0.05]" />
          <div className="absolute inset-20 rounded-full border border-white/[0.06]" />
        </div>
        <Container className="home-reveal relative grid items-center gap-12 py-16 sm:py-20 lg:min-h-[650px] lg:grid-cols-[1.05fr_.95fr] lg:gap-16 lg:py-24">
          <div>
            <p className="mb-6 inline-flex items-center gap-2 rounded-full border border-line bg-obsidian-900/80 px-3.5 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-ink-mute">
              <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-cyan" />
              ZIKA <span className="text-line">/</span> YAWVOREX Studio
            </p>
            <h1 className="hero-title max-w-3xl font-semibold leading-[1.02]">
              Beyond Digital.<br /><span className="text-gradient">Beyond Ordinary.</span>
            </h1>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-ink-mute sm:text-lg">{siteConfig.description}</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Button href="/services">Explore Services <ArrowUpRight size={16} aria-hidden="true" /></Button>
              <Button href="/shop" variant="secondary">Shop Products</Button>
              <Button href="/portfolio" variant="ghost">View Portfolio</Button>
            </div>
            <p className="mt-8 text-xs font-medium uppercase tracking-[0.13em] text-ink-mute/80">
              Creative services <span className="px-1.5 text-violet-soft">·</span> Digital products <span className="px-1.5 text-violet-soft">·</span> Selected work
            </p>
          </div>

          <div className="hero-art relative mx-auto flex min-h-[340px] w-full max-w-[540px] items-center justify-center overflow-hidden rounded-[1.75rem] border border-line p-5 shadow-depth sm:min-h-[440px] sm:p-8">
            <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-br from-violet/10 via-transparent to-cyan/10" />
            <div aria-hidden="true" className="absolute left-1/2 top-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-violet/10 blur-3xl sm:h-80 sm:w-80" />
            <svg viewBox="0 0 420 330" fill="none" className="relative w-full max-w-[420px]" role="img" aria-labelledby="hero-art-title">
              <title id="hero-art-title">Abstract connected digital forms</title>
              <defs>
                <linearGradient id="hero-line" x1="72" y1="48" x2="347" y2="285" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#22D3EE" /><stop offset=".52" stopColor="#8B5CF6" /><stop offset="1" stopColor="#A78BFA" />
                </linearGradient>
                <linearGradient id="hero-tile" x1="86" y1="65" x2="331" y2="282" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#1B202B" /><stop offset="1" stopColor="#10131B" />
                </linearGradient>
              </defs>
              <path d="M210 48v60m0 0-104 54m104-54 104 54m-208 0v82m208-82v82m-208 0 104 42 104-42" stroke="url(#hero-line)" strokeOpacity=".52" strokeWidth="1.5" />
              <g fill="url(#hero-tile)" stroke="url(#hero-line)" strokeOpacity=".65">
                <rect x="164" y="22" width="92" height="62" rx="16" />
                <rect x="56" y="132" width="100" height="72" rx="18" />
                <rect x="264" y="132" width="100" height="72" rx="18" />
                <rect x="164" y="246" width="92" height="62" rx="16" />
              </g>
              <g fill="#F5F7FA">
                <circle cx="210" cy="53" r="4" /><circle cx="210" cy="68" r="4" /><circle cx="210" cy="83" r="4" />
                <rect x="74" y="151" width="64" height="5" rx="2.5" opacity=".7" /><rect x="74" y="164" width="44" height="5" rx="2.5" opacity=".38" />
                <rect x="282" y="151" width="64" height="5" rx="2.5" opacity=".7" /><rect x="282" y="164" width="44" height="5" rx="2.5" opacity=".38" />
                <path d="m193 273 17-10 17 10v18l-17 10-17-10v-18Z" opacity=".82" />
              </g>
              <circle cx="210" cy="186" r="27" fill="#0E1016" stroke="url(#hero-line)" strokeWidth="2" />
              <path d="M198 186h24m-12-12v24" stroke="#F5F7FA" strokeLinecap="round" strokeWidth="2" />
              <g fill="#22D3EE"><circle cx="210" cy="108" r="3" /><circle cx="106" cy="154" r="3" /><circle cx="314" cy="154" r="3" /><circle cx="210" cy="228" r="3" /></g>
            </svg>
            <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between rounded-xl border border-line bg-obsidian/85 px-4 py-3 backdrop-blur sm:bottom-6 sm:left-6 sm:right-6">
              <div>
                <p className="text-sm font-semibold">One creative ecosystem</p>
                <p className="mt-0.5 text-xs text-ink-mute">Ideas shaped into digital experiences</p>
              </div>
              <span aria-hidden="true" className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet/15 text-violet-soft">
                <ArrowUpRight size={18} />
              </span>
            </div>
          </div>
        </Container>
      </div>

      <Section title="Explore the ecosystem" intro="Creative services, a live product catalog, and new destinations on the way.">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {ecosystem.map((item) => (
            <Link key={item.title} href={item.href} className="surface surface-hover home-reveal block p-5 sm:p-6">
              <span className={`font-display text-sm font-semibold uppercase tracking-wider ${item.accent}`}>{item.title}</span>
              <p className="mt-3 text-ink-mute">{item.description}</p>
              <span className="mt-5 inline-flex text-sm font-medium text-ink">Explore <span aria-hidden="true" className="ml-2">→</span></span>
            </Link>
          ))}
        </div>
      </Section>

      <Section title="Services" intro="What YAWVOREX can build and create for you.">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{services.slice(0, 6).map((s, i) => {
          const Icon = serviceIcons[i % serviceIcons.length];
          return <ServiceCard key={s.slug} s={s} icon={<Icon size={22} strokeWidth={1.8} />} />;
        })}</div>
        <div className="mt-6"><Button href="/services" variant="secondary">See all services</Button></div>
      </Section>

      <Section title="Selected projects" intro="Featured work from our portfolio, including clearly marked sample concepts.">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{projects.slice(0, 3).map((p) => <ProjectCard key={p.slug} p={p} />)}</div>
        <div className="mt-6"><Button href="/portfolio" variant="secondary">View portfolio</Button></div>
      </Section>

      {products.length > 0 && (
        <Section title="Featured products" intro="Digital and physical products from YAWVOREX.">
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{products.slice(0, 3).map((p) => <ProductCard key={p.slug} p={p} />)}</div>
          <div className="mt-6"><Button href="/shop" variant="secondary">Visit the shop</Button></div>
        </Section>
      )}

      <Section title="Why choose YAWVOREX">
        <div className="grid gap-5 sm:grid-cols-2">{why.map((w) => (
          <Card key={w.t}><h3 className="text-lg font-semibold">{w.t}</h3><p className="mt-2 text-ink-mute">{w.d}</p></Card>
        ))}</div>
      </Section>

      <Section title="How we work">
        <ol className="grid gap-4 sm:grid-cols-5">{steps.map((s, i) => (
          <li key={s.t} className="surface p-4"><span className="font-display text-cyan-soft">{i + 1}</span><h3 className="mt-1 font-semibold">{s.t}</h3><p className="mt-1 text-sm text-ink-mute">{s.d}</p></li>
        ))}</ol>
      </Section>

      <Section title="Start a project">
        <Card className="bg-aurora flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="max-w-xl text-2xl font-semibold">Have an idea? Let&apos;s build something extraordinary.</p>
          <div className="flex flex-col gap-3 sm:flex-row"><Button href="/hire">Explore Services</Button><Button href="/contact" variant="secondary">Contact Us</Button></div>
        </Card>
        <ul className="mt-6 flex flex-wrap gap-x-5">
          {socialLinks().map((s) => <li key={s.name}><a href={s.href} target="_blank" rel="noopener noreferrer" className="inline-block py-2 text-ink-mute hover:text-ink">{s.name}</a></li>)}
        </ul>
      </Section>
    </>
  );
}
