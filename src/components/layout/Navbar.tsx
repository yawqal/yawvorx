"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/components/auth/AuthProvider";
import { useCart } from "@/components/cart/CartProvider";
import { NotificationsBell } from "@/components/account/NotificationsBell";
import { LanguageToggle, useLanguage } from "@/components/i18n/LanguageProvider";
import { useCurrency } from "@/components/i18n/CurrencyProvider";
import { siteConfig } from "@/config/site";

const primaryLinks = [
  { href: "/", label: "Home" },
  { href: "/shop", label: "Shop" },
  { href: "/shop", label: "Digital Products" },
  { href: "/services", label: "Services" },
  { href: "/freelancers", label: "Freelancers" },
  { href: "/courses", label: "Courses" },
  { href: "/ai-tools", label: "AI Tools" },
  { href: "/vendors", label: "Vendors" },
];
const desktopLinks = [
  { href: "/", label: "Home" },
  { href: "/shop", label: "Shop" },
  { href: "/services", label: "Services" },
  { href: "/portfolio", label: "Portfolio" },
];
const moreLinks = [
  { href: "/freelancers", label: "Freelancers" },
  { href: "/courses", label: "Courses" },
  { href: "/ai-tools", label: "AI Tools" },
  { href: "/vendors", label: "Vendors" },
  { href: "/affiliate", label: "Affiliate" },
  { href: "/directory", label: "Directory" },
  { href: "/subscriptions", label: "Subscriptions" },
  { href: "/developers", label: "Developers" },
  { href: "/contact", label: "Support" },
  { href: "/about", label: "About" },
  { href: "/faq", label: "FAQ" },
  { href: "/contact", label: "Contact" },
  { href: "/privacy", label: "Legal" },
];

function trapTab(event: React.KeyboardEvent<HTMLElement>) {
  if (event.key !== "Tab") return;
  const focusable = Array.from(event.currentTarget.querySelectorAll<HTMLElement>(
    'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
  ));
  if (!focusable.length) return;
  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
}

export function Navbar() {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileMore, setMobileMore] = useState(false);
  const moreButton = useRef<HTMLButtonElement>(null);
  const mobileTrigger = useRef<HTMLButtonElement>(null);
  const mobilePanel = useRef<HTMLDivElement>(null);
  const { count } = useCart();
  const { user } = useAuth();
  const { t } = useLanguage();
  const { currency, setCurrency } = useCurrency();
  const accountHref = user ? "/account" : "/login";
  const accountLabel = t(user ? "Account" : "Sign in");
  const cartLabel = count > 0 ? `${t("Cart")} (${count})` : t("Cart");
  const active = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  useEffect(() => {
    setMoreOpen(false);
    setMobileOpen(false);
    setMobileMore(false);
  }, [pathname]);

  // Lock body scroll while mobile menu is open
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  useEffect(() => {
    if (!moreOpen && !mobileOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setMoreOpen(false);
      setMobileOpen(false);
      setMobileMore(false);
      if (mobileOpen) mobileTrigger.current?.focus();
      else moreButton.current?.focus();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [moreOpen, mobileOpen]);

  useEffect(() => {
    if (mobileOpen) mobilePanel.current?.querySelector<HTMLElement>("button, a")?.focus();
  }, [mobileOpen]);

  const currencyPicker = (
    <div className="inline-flex min-h-11 items-center rounded-xl border border-line bg-white/70 px-1 text-sm text-ink-mute shadow-sm">
      {(["ETB", "USD"] as const).map((value, index) => (
        <span key={value} className="inline-flex items-center">
          {index > 0 && <span aria-hidden="true" className="px-1">|</span>}
          <button type="button" className={`min-h-10 min-w-10 rounded-lg px-2 hover:text-ink ${currency === value ? "text-amber-soft" : ""}`}
            aria-pressed={currency === value} onClick={() => setCurrency(value)}>{value}</button>
        </span>
      ))}
    </div>
  );

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-panel pt-[env(safe-area-inset-top)] backdrop-blur-xl shadow-[0_1px_12px_rgba(0,0,0,0.3)]">
      <nav aria-label="Main" className="mx-auto flex h-[4.5rem] max-w-[1600px] items-center justify-between gap-4 px-4 sm:h-[5rem] sm:px-6 lg:px-8">
        <Link href="/" aria-label="YAWVOREX home" className="flex shrink-0 items-center gap-3">
          <Logo size={36} />
          <span className="hidden border-l border-line pl-3 sm:block"><span className="block text-[9px] font-semibold uppercase tracking-[0.18em] text-ink-mute">By YAWVOREX</span><span className="mt-1 block text-[10px] leading-tight tracking-wide text-ink-mute">{siteConfig.tagline}</span></span>
        </Link>
        <ul className="hidden items-center gap-1 xl:flex">
          {desktopLinks.map((link) => (
            <li key={`${link.label}-${link.href}`}>
              <Link href={link.href} aria-current={active(link.href) ? "page" : undefined}
                className={`whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition ${active(link.href) ? "bg-brand/[0.08] text-brand-soft" : "text-ink-mute hover:bg-brand/[0.05] hover:text-ink"}`}>
                {link.label}
              </Link>
            </li>
          ))}
          <li className="relative">
            <button ref={moreButton} type="button" aria-expanded={moreOpen} aria-controls="more-menu"
              className="min-h-11 rounded-lg px-3 text-sm font-medium text-ink-mute transition hover:bg-brand/[0.05] hover:text-ink"
              onClick={() => setMoreOpen((value) => !value)}>More
              <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 16 16" className={`${moreOpen ? "rotate-180" : ""} transition-transform duration-200`} aria-hidden="true">
                <path fill="currentColor" d="M7.293 1.5a.5.5 0 0 1 .707.253L10.5 5.5a.5.5 0 0 1-.253.707L7.293 8.75a.5.5 0 0 1-.5-.253L4.5 5.5a.5.5 0 0 1 .253-.707L7.293 2.25a.5.5 0 0 1 .707-.253z"/>
              </svg>
            </button>
            {moreOpen && <div id="more-menu" onKeyDown={trapTab}
              className="absolute right-0 top-full z-50 mt-3 w-[min(44vw,32rem)] grid grid-cols-2 gap-2 rounded-2xl p-4 md:grid-cols-3">
              {moreLinks.map((link) => <Link key={link.label} href={link.href}
                className="flex min-h-11 items-center rounded-xl px-3 text-sm text-ink-mute transition hover:bg-brand/[0.06] hover:text-ink">{link.label}</Link>)}
            </div>}
          </li>
        </ul>
        <div className="hidden items-center gap-2 xl:flex">
          <Button href="/cart" className="px-3">{cartLabel}</Button>
          <LanguageToggle />
          {currencyPicker}
          {user && <NotificationsBell userId={user.id} />}
          <Button href={accountHref} className="px-3">{accountLabel}</Button>
        </div>
        <button ref={mobileTrigger} type="button" className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-line text-ink transition hover:border-amber/50 xl:hidden"
          aria-expanded={mobileOpen} aria-controls="mobile-menu" aria-label={mobileOpen ? "Close menu" : "Open menu"}
          onClick={() => { setMobileOpen((value) => !value); setMobileMore(false); }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            {mobileOpen ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
          </svg>
        </button>
      </nav>

      {mobileOpen && <div ref={mobilePanel} id="mobile-menu" onKeyDown={trapTab}
        className="fixed inset-0 z-[60] flex h-[100dvh] flex-col overflow-y-auto bg-panel px-5 pb-[env(safe-area-inset-bottom)] pt-[env(safe-area-inset-top)]">
        <div className="flex min-h-16 items-center justify-between border-b border-line">
          {mobileMore
            ? <button type="button" className="min-h-11 rounded-lg px-3 text-ink" onClick={() => setMobileMore(false)}>← Back</button>
            : <Link href="/" aria-label="YAWVOREX home"><Logo size={28} /></Link>}
          <button type="button" className="min-h-11 min-w-11 rounded-xl border border-line px-3 text-sm text-ink-mute"
            onClick={() => { setMobileOpen(false); setMobileMore(false); mobileTrigger.current?.focus(); }}></button>
        </div>
        <div className="flex-1 py-5">
          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.18em] text-ink-mute">Explore YAWVOREX</p>
          <ul className={mobileMore ? "space-y-1" : "grid gap-2 sm:grid-cols-2"}>
            {(mobileMore ? moreLinks : primaryLinks).map((link) => (
              <li key={`${link.label}-${link.href}`}>
                <Link href={link.href} aria-current={active(link.href) ? "page" : undefined}
                  className={`flex min-h-12 items-center rounded-xl px-4 text-lg font-medium transition-colors ${mobileMore ? "border-b border-line" : "border border-line bg-obsidian-800"} ${active(link.href) ? "text-amber-soft" : "text-ink"}`}
                  onClick={() => setMobileOpen(false)}>{link.label}</Link>
              </li>
            ))}
          </ul>
          {!mobileMore && <button type="button" className="mt-2 flex min-h-12 w-full items-center justify-between border-t border-line text-lg text-ink"
            aria-expanded={mobileMore} onClick={() => setMobileMore(true)}>More <span aria-hidden="true">→</span></button>}
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line py-4">
          <Button href="/cart">{cartLabel}</Button>
          <Button href={accountHref}>{accountLabel}</Button>
          <LanguageToggle />
          {currencyPicker}
          {user && <NotificationsBell userId={user.id} />}
        </div>
      </div>}
    </header>
  );
}
