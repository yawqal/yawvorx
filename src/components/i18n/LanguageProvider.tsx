"use client";

import { createContext, useContext, useEffect, useState } from "react";

type Language = "en" | "am";
const translations: Record<string, string> = {
  Home: "መነሻ",
  Services: "አገልግሎቶች",
  Portfolio: "ፖርትፎሊዮ",
  Shop: "ሱቅ",
  Products: "ምርቶች",
  "Digital and physical products from YAWVOREX. Orders are confirmed by YAWVOREX before processing.": "ዲጂታል እና አካላዊ ምርቶች። ትዕዛዞች ከማስኬዳቸው በፊት በYAWVOREX ይረጋገጣሉ።",
  About: "ስለ እኛ",
  FAQ: "ተደጋጋሚ ጥያቄዎች",
  Contact: "አግኙን",
  "Sign in": "ግባ",
  Account: "መለያ",
  "My account": "የእኔ መለያ",
  Cart: "ጋሪ",
  "Hire YAWVOREX": "YAWVOREXን ይቅጠሩ",
  "Hire us": "ይቅጠሩን",
  Explore: "ያስሱ",
  Connect: "ያግኙን",
  "Privacy Policy": "የግላዊነት ፖሊሲ",
  Terms: "ውሎች",
  Shipping: "መላኪያ",
  "Returns & Refunds": "መመለስ እና ተመላሽ ገንዘብ",
  "Digital Products": "ዲጂታል ምርቶች",
  Search: "ፈልግ",
  Category: "ምድብ",
  Type: "ዓይነት",
  "Sort by": "አስተካክል",
  "All categories": "ሁሉም ምድቦች",
  "Digital and physical": "ዲጂታል እና አካላዊ",
  Digital: "ዲጂታል",
  Physical: "አካላዊ",
  Featured: "ተመራጭ",
  "Price: low to high": "ዋጋ፡ ከዝቅተኛ ወደ ከፍተኛ",
  "Price: high to low": "ዋጋ፡ ከፍተኛ ወደ ዝቅተኛ",
  Name: "ስም",
  "Search products": "ምርቶችን ፈልግ",
  Overview: "አጠቃላይ እይታ",
  Orders: "ትዕዛዞች",
  "My orders": "ትዕዛዞቼ",
  Profile: "መገለጫ",
  Addresses: "አድራሻዎች",
  "Saved addresses": "የተቀመጡ አድራሻዎች",
  Wishlist: "የምኞት ዝርዝር",
  "Wishlist items": "የምኞት ዝርዝር እቃዎች",
  "Service requests": "የአገልግሎት ጥያቄዎች",
  "Vendor application": "የአቅራቢ ማመልከቻ",
  Downloads: "ማውረዶች",
  "Support tickets": "የድጋፍ ጥያቄዎች",
  Notifications: "ማሳወቂያዎች",
  Security: "ደህንነት",
  Settings: "ቅንብሮች",
  Language: "ቋንቋ",
  "Continue shopping": "ግዢዎን ይቀጥሉ",
  "Visit the shop": "ሱቁን ይጎብኙ",
  "Clear filters": "ማጣሪያዎችን አጽዳ",
  "product": "ምርት",
  "products": "ምርቶች",
};

type LanguageContextValue = { language: Language; setLanguage: (language: Language) => void; t: (label: string) => string };
const LanguageContext = createContext<LanguageContextValue>({
  language: "en",
  setLanguage: () => undefined,
  t: (label) => label,
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>("en");

  useEffect(() => {
    const saved = document.cookie.split("; ").find((part) => part.startsWith("zika_lang="))?.slice("zika_lang=".length);
    if (saved === "am" || saved === "en") setLanguageState(saved);
  }, []);

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  function setLanguage(next: Language) {
    setLanguageState(next);
    document.cookie = `zika_lang=${next}; Path=/; Max-Age=31536000; SameSite=Lax${location.protocol === "https:" ? "; Secure" : ""}`;
  }

  const t = (label: string) => language === "am" ? translations[label] ?? label : label;
  return <LanguageContext.Provider value={{ language, setLanguage, t }}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  return useContext(LanguageContext);
}

export function LanguageToggle() {
  const { language, setLanguage } = useLanguage();
  return (
    <button
      type="button"
      className="min-h-[44px] rounded-xl border border-line px-3 text-sm text-ink-mute hover:text-ink"
      aria-label={language === "en" ? "Switch language to Amharic" : "Switch language to English"}
      onClick={() => setLanguage(language === "en" ? "am" : "en")}
    >
      {language === "en" ? "አማርኛ" : "English"}
    </button>
  );
}

export function TranslatedText({ value }: { value: string }) {
  const { t } = useLanguage();
  return <>{t(value)}</>;
}
