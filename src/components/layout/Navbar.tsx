"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/Button";
import { siteConfig } from "@/config/site";
import { useAuth } from "@/components/auth/AuthProvider";
import { useCart } from "@/components/cart/CartProvider";
import { NotificationsBell } from "@/components/account/NotificationsBell";

export function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const { count } = useCart();
  const { user } = useAuth();
  const accountHref = user ? "/account" : "/login";
  const accountLabel = user ? "Account" : "Sign in";
  const cartLabel = count > 0 ? `Cart (${count})` : "Cart";

  useEffect(() => setOpen(false), [pathname]); // close menu after navigating
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  const active = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-obsidian/85 pt-[env(safe-area-inset-top)] backdrop-blur-md">
      <nav aria-label="Main" className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 sm:px-8">
        <Link href="/" aria-label="YAWVOREX home"><Logo size={30} /></Link>

        <ul className="hidden items-center gap-1 lg:flex">
          {siteConfig.nav.map((l) => (
            <li key={l.href}>
              <Link
                href={l.href}
                aria-current={active(l.href) ? "page" : undefined}
                className={`rounded-lg px-3 py-2 text-sm transition ${active(l.href) ? "text-cyan-soft" : "text-ink-mute hover:text-ink"}`}
              >
                {l.label}
              </Link>
            </li>
          ))}
        </ul>

        <div className="hidden items-center gap-2 lg:flex">
          <Button href="/cart" variant="ghost">{cartLabel}</Button>
          {user && <NotificationsBell userId={user.id} />}
          <Button href={accountHref} variant="ghost">{accountLabel}</Button>
          <Button href="/hire">Hire YAWVOREX</Button>
        </div>

        <button
          type="button"
          className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-line lg:hidden"
          aria-expanded={open}
          aria-controls="mobile-menu"
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => setOpen((v) => !v)}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            {open ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
          </svg>
        </button>
      </nav>

      {open && (
        <div id="mobile-menu" className="max-h-[calc(100dvh-4rem)] overflow-y-auto border-t border-line bg-obsidian-900 px-5 pb-6 pt-3 lg:hidden">
          <ul>
            {siteConfig.nav.map((l) => (
              <li key={l.href}>
                <Link
                  href={l.href}
                  aria-current={active(l.href) ? "page" : undefined}
                  className={`flex min-h-[48px] items-center border-b border-line text-lg ${active(l.href) ? "text-cyan-soft" : "text-ink"}`}
                >
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
          <div className="mt-5 grid grid-cols-2 gap-3">
            <Button href="/cart" variant="secondary">{cartLabel}</Button>
            <Button href="/hire">Hire us</Button>
          </div>
          <div className="mt-3 flex items-center justify-between">
            {user && <NotificationsBell userId={user.id} />}
            <Button href={accountHref} variant="ghost">{accountLabel}</Button>
          </div>
        </div>
      )}
    </header>
  );
}
