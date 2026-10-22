"use client";

import Link from "next/link";
import { Logo } from "@/components/brand/Logo";
import { Container } from "@/components/ui/Container";
import { siteConfig, socialLinks, whatsappLink, emailLink } from "@/config/site";

const columns = [
  { title: "Main", links: [{ href: "/", label: "Home" }, { href: "/services", label: "Services" }, { href: "/shop", label: "Shop" }, { href: "/portfolio", label: "Portfolio" }] },
  { title: "Services", links: [{ href: "/services", label: "Creative services" }, { href: "/hire", label: "Start a project" }, { href: "/freelancers", label: "Freelancers" }, { href: "/developers", label: "Developers" }] },
  { title: "Marketplace", links: [{ href: "/shop", label: "Products" }, { href: "/courses", label: "Courses" }, { href: "/ai-tools", label: "AI tools" }, { href: "/vendors", label: "Vendors" }, { href: "/affiliate", label: "Affiliate" }, { href: "/directory", label: "Directory" }] },
  { title: "Support", links: [{ href: "/contact", label: "Contact" }, { href: "/faq", label: "FAQ" }, { href: "/about", label: "About" }] },
  { title: "Legal", links: [{ href: "/privacy", label: "Privacy" }, { href: "/terms", label: "Terms" }, { href: "/shipping-policy", label: "Shipping" }, { href: "/returns", label: "Returns & refunds" }, { href: "/digital-policy", label: "Digital products" }] },
];

export function Footer() {
  const wa = whatsappLink();
  const mail = emailLink();
  return (
    <footer className="relative mt-10 overflow-hidden border-t border-line bg-white/80 pb-[env(safe-area-inset-bottom)]">
      <svg className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.06]" viewBox="0 0 480 240" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
        <defs><pattern id="tibeb" width="48" height="48" patternUnits="userSpaceOnUse">
          <path d="M24 2 46 24 24 46 2 24 24 2Zm0 10 12 12-12 12-12-12 12-12Zm0 12h24M24 0v48" fill="none" stroke="currentColor" strokeWidth="1" />
        </pattern></defs>
        <rect width="480" height="240" fill="url(#tibeb)" />
      </svg>
      <Container className="relative grid gap-x-10 gap-y-10 py-12 sm:grid-cols-2 lg:grid-cols-[1.5fr_repeat(5,minmax(0,1fr))]">
        <div className="sm:col-span-2 lg:col-span-1">
          <Logo size={30} />
          <p className="mt-4 text-sm font-medium text-ink">A digital platform by YAWVOREX</p>
          <p className="mt-2 max-w-sm text-sm text-ink-mute">{siteConfig.description}</p>
          <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1">
            {socialLinks().map((social) => <a key={social.name} href={social.href} target="_blank" rel="noopener noreferrer"
              className="py-1 text-sm text-ink-mute underline-offset-4 hover:text-ink hover:underline">{social.name}</a>)}
            {mail && <a href={mail} className="py-1 text-sm text-ink-mute underline-offset-4 hover:text-ink hover:underline">Email</a>}
            {wa && <a href={wa} target="_blank" rel="noopener noreferrer" className="py-1 text-sm text-ink-mute underline-offset-4 hover:text-ink hover:underline">WhatsApp</a>}
          </div>
        </div>
        {columns.map((column) => <div key={column.title}>
          <h2 className="text-sm font-semibold uppercase tracking-wider">{column.title}</h2>
          <ul className="mt-3 space-y-1">
            {column.links.map((link) => <li key={`${column.title}-${link.href}-${link.label}`}>
              <Link href={link.href} className="inline-flex min-h-10 items-center text-sm text-ink-mute underline-offset-4 hover:text-ink hover:underline">{link.label}</Link>
            </li>)}
          </ul>
        </div>)}
      </Container>
      <div className="relative border-t border-line bg-obsidian-800/60">
        <Container className="flex flex-col gap-2 py-5 text-sm text-ink-mute sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} {siteConfig.name}. All rights reserved.</p>
          <Link href="/terms" className="min-h-10 inline-flex items-center underline-offset-4 hover:text-ink hover:underline">Terms and policies</Link>
        </Container>
      </div>
    </footer>
  );
}
