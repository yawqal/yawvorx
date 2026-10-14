import Link from "next/link";
import { Logo } from "@/components/brand/Logo";
import { Container } from "@/components/ui/Container";
import { siteConfig, socialLinks, whatsappLink, emailLink } from "@/config/site";

const legal = [
  { href: "/privacy", label: "Privacy Policy" },
  { href: "/terms", label: "Terms" },
  { href: "/shipping-policy", label: "Shipping" },
  { href: "/returns", label: "Returns & Refunds" },
  { href: "/digital-policy", label: "Digital Products" },
];

export function Footer() {
  const wa = whatsappLink();
  const mail = emailLink();
  return (
    <footer className="mt-10 border-t border-line bg-obsidian-900 pb-[env(safe-area-inset-bottom)]">
      <Container className="grid gap-10 py-12 md:grid-cols-4">
        <div className="md:col-span-2">
          <Logo size={30} />
          <p className="mt-4 text-ink-mute">{siteConfig.tagline}</p>
          <p className="mt-2 max-w-sm text-sm text-ink-mute">{siteConfig.description}</p>
        </div>

        <div>
          <h2 className="text-base font-semibold">Explore</h2>
          <ul className="mt-3 space-y-1">
            {siteConfig.nav.map((l) => (
              <li key={l.href}><Link href={l.href} className="inline-block py-1.5 text-ink-mute hover:text-ink">{l.label}</Link></li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className="text-base font-semibold">Connect</h2>
          <ul className="mt-3 space-y-1">
            {socialLinks().map((s) => (
              <li key={s.name}>
                <a href={s.href} target="_blank" rel="noopener noreferrer" className="inline-block py-1.5 text-ink-mute hover:text-ink">
                  {s.name} <span className="text-sm">{s.handle}</span>
                </a>
              </li>
            ))}
            {/* Email and WhatsApp appear only after real values are set */}
            {mail && <li><a href={mail} className="inline-block py-1.5 text-ink-mute hover:text-ink">Email</a></li>}
            {wa && <li><a href={wa} target="_blank" rel="noopener noreferrer" className="inline-block py-1.5 text-ink-mute hover:text-ink">WhatsApp</a></li>}
          </ul>
        </div>
      </Container>

      <div className="border-t border-line">
        <Container className="flex flex-col gap-3 py-5 text-sm text-ink-mute sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} {siteConfig.name}. All rights reserved.</p>
          <ul className="flex flex-wrap gap-x-4">
            {legal.map((l) => (
              <li key={l.href}><Link href={l.href} className="inline-block py-1.5 hover:text-ink">{l.label}</Link></li>
            ))}
          </ul>
        </Container>
      </div>
    </footer>
  );
}
