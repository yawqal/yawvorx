// SINGLE PLACE for business details. Edit here (or via .env values) instead of hunting through files.

export const siteConfig = {
  name: "YAWVOREX",
  tagline: "Beyond Digital. Beyond Ordinary.",
  description:
    "YAWVOREX is a premium digital technology and creative studio: web experiences, creative solutions, and products.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  currency: "USD", // configurable later from the admin panel
  // Shown to customers choosing manual payment. Write your real instructions in .env or here.
  manualPaymentInstructions: process.env.NEXT_PUBLIC_MANUAL_PAYMENT_INSTRUCTIONS ?? "REPLACE_WITH_PAYMENT_INSTRUCTIONS",
  contact: {
    email: process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? "REPLACE_WITH_VALID_EMAIL",
    whatsapp: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "REPLACE_WITH_COUNTRY_CODE_AND_NUMBER",
  },
  socials: {
    telegram: "Yawvorx",
    tiktok: "yawvorx",
    facebook: "yawvorx",
    instagram: "yawvorx",
  },
  nav: [
    { href: "/", label: "Home" },
    { href: "/services", label: "Services" },
    { href: "/portfolio", label: "Portfolio" },
    { href: "/shop", label: "Shop" },
    { href: "/track", label: "Track order" },
    { href: "/about", label: "About" },
    { href: "/faq", label: "FAQ" },
    { href: "/contact", label: "Contact" },
  ],
} as const;

/** A value counts as "set" only when it is not empty and not a REPLACE_ placeholder. */
export function isConfigured(value?: string): boolean {
  return !!value && !value.startsWith("REPLACE_");
}

export function socialLinks() {
  const s = siteConfig.socials;
  return [
    { name: "Telegram", handle: `@${s.telegram}`, href: `https://t.me/${s.telegram}` },
    { name: "TikTok", handle: `@${s.tiktok}`, href: `https://www.tiktok.com/@${s.tiktok}` },
    { name: "Facebook", handle: `@${s.facebook}`, href: `https://www.facebook.com/${s.facebook}` },
    { name: "Instagram", handle: `@${s.instagram}`, href: `https://www.instagram.com/${s.instagram}` },
  ];
}

/** wa.me needs digits only: no +, spaces or dashes. Returns null until a real number is set. */
export function whatsappLink(message?: string): string | null {
  const digits = siteConfig.contact.whatsapp.replace(/\D/g, "");
  if (!isConfigured(siteConfig.contact.whatsapp) || digits.length < 8) return null;
  return `https://wa.me/${digits}${message ? `?text=${encodeURIComponent(message)}` : ""}`;
}

export function emailLink(): string | null {
  const e = siteConfig.contact.email;
  return isConfigured(e) && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e) ? `mailto:${e}` : null;
}
