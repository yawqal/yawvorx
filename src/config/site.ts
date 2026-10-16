// SINGLE PLACE for business details. Edit here (or via .env values) instead of hunting through files.

export const siteConfig = {
  name: "Zika Go",
  tagline: "Beyond Digital. Beyond Ordinary.",
  description: "Modern E-Commerce, Digital Technology & Creative Services Platform",
  url: "https://yawvorx-xzyn-yawvorx.vercel.app",
  ogImage: "/og.png",
  links: {
    github: "https://github.com/yawqal/yawvorx",
  },
  colors: {
    primary: "#06B6D4",
    secondary: "#8B5CF6",
    background: "#090A0F",
  },
  socialLinks: {
    github: "https://github.com/yawqal/yawvorx",
    telegram: "https://t.me",
    whatsapp: "https://wa.me",
    email: "mailto:contact@zikago.com",
  },
  whatsappLink: "https://wa.me",
  emailLink: "mailto:contact@zikago.com",
  isConfigured: true,
  currency: "USD",
  manualPaymentInstructions:
    process.env.NEXT_PUBLIC_MANUAL_PAYMENT_INSTRUCTIONS ?? "REPLACE_WITH_PAYMENT_INSTRUCTIONS",
  contact: {
    email: process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? "contact@zikago.com",
    whatsapp: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "REPLACE_WITH_COUNTRY_CODE_AND_NUMBER",
  },
  nav: [
    { href: "/", label: "Home" },
    { href: "/services", label: "Services" },
    { href: "/portfolio", label: "Portfolio" },
    { href: "/shop", label: "Shop" },
    { href: "/about", label: "About" },
    { href: "/faq", label: "FAQ" },
    { href: "/contact", label: "Contact" },
  ],
} as const;

export type SiteConfig = typeof siteConfig;
export const siteName = siteConfig.name;

/** A value counts as "set" only when it is not empty and not a REPLACE_ placeholder. */
export function isConfigured(value?: string): boolean {
  return !!value && !value.startsWith("REPLACE_");
}

export function socialLinks() {
  return [
    { name: "Telegram", handle: "Telegram", href: siteConfig.socialLinks.telegram },
    { name: "GitHub", handle: "GitHub", href: siteConfig.socialLinks.github },
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
