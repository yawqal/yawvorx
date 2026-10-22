export const siteConfig = {
  name: "ZIKA",
  tagline: "Beyond Digital. Beyond Ordinary.",
  nav: [
    { href: "/", label: "Home" },
    { href: "/services", label: "Services" },
    { href: "/portfolio", label: "Portfolio" },
    { href: "/shop", label: "Shop" },
    { href: "/about", label: "About" },
    { href: "/faq", label: "FAQ" },
    { href: "/contact", label: "Contact" },
  ],
  description: "Modern E-Commerce, Digital Technology & Creative Services Platform",
  url: "https://yawvorx-xzyn-yawvorx.vercel.app",
  ogImage: "/og.png",
  currency: "USD",
  manualPaymentInstructions:
    process.env.NEXT_PUBLIC_MANUAL_PAYMENT_INSTRUCTIONS ?? "REPLACE_WITH_PAYMENT_INSTRUCTIONS",
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
  links: {
    github: "https://github.com/yawqal/yawvorx",
  },
  colors: {
    primary: "#7657E8",
    secondary: "#54C9DD",
    background: "#F5F6FA",
  },
};

export type SiteConfig = typeof siteConfig;

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
