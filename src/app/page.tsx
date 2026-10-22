import { Container, Section } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ServiceCard, ProjectCard, ProductCard } from "@/components/cards/Cards";
import { siteConfig, socialLinks } from "@/config/site";
import { getProducts } from "@/lib/products-db";
import { getPublicServices } from "@/lib/services-db";
import { getPublicProjects } from "@/lib/portfolio-db";
import type { Metadata } from "next";
import { Camera, Code2, Palette, PanelsTopLeft, ShoppingBag, Video } from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = {
  title: { absolute: "ZIKA | Beyond Digital. Beyond Ordinary." },
  description: "Modern e-commerce, digital technology, and creative services from ZIKA.",
  openGraph: { title: "ZIKA", description: "Modern e-commerce, digital technology, and creative services from ZIKA.", type: "website" },
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
      <div className="bg-aurora relative overflow-hidden">
        <Container className="home-reveal relative py-20 sm:py-32">
          <p className="mb-5 text-sm font-medium uppercase tracking-[0.2em] text-cyan">ZIKA by YAWVOREX</p>
          <h1 className="hero-title max-w-4xl font-semibold leading-[1.05]">
            Beyond Digital.<br /><span className="text-gradient">Beyond Ordinary.</span>
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-ink-mute">{siteConfig.description}</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Button href="/services">Explore Services</Button>
            <Button href="/shop" variant="secondary">Shop Products</Button>
            <Button href="/portfolio" variant="secondary">View Portfolio</Button>
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

      <Section title="Selected projects" intro="Sample concepts that show our approach. These are demonstrations, not client work.">
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
