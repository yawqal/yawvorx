import type { Metadata, Viewport } from "next";
import "./globals.css";
import { display, body } from "@/lib/fonts";
import { siteConfig } from "@/config/site";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { CartProvider } from "@/components/cart/CartProvider";
import { Intro } from "@/components/layout/Intro";
import { LanguageProvider } from "@/components/i18n/LanguageProvider";
import { CurrencyProvider } from "@/components/i18n/CurrencyProvider";
import { ReferralCapture } from "@/components/affiliates/ReferralCapture";

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: { default: `${siteConfig.name} | ${siteConfig.tagline}`, template: `%s | ${siteConfig.name}` },
  description: siteConfig.description,
  openGraph: { title: siteConfig.name, description: siteConfig.tagline, siteName: siteConfig.name, type: "website" },
};

export const viewport: Viewport = { themeColor: "#07080B", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable}`}>
      <body>
        <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[110] focus:rounded-lg focus:bg-cyan focus:px-4 focus:py-2 focus:text-obsidian">
          Skip to content
        </a>
        <LanguageProvider>
          <CurrencyProvider>
            <AuthProvider>
              <CartProvider>
                <Intro />
                <ReferralCapture />
                <Navbar />
                <main id="main">{children}</main>
                <Footer />
              </CartProvider>
            </AuthProvider>
          </CurrencyProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
