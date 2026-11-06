"use client";

import { createContext, useContext, useEffect, useState } from "react";

type Language = "en" | "am";
const translations: Record<string, string> = {
  "Admin": "አስተዳዳሪ",
  "Admin area": "የአስተዳዳሪ ቦታ",
  "Admin verified": "አስተዳዳሪ የተረጋገጠ",
  "Workspace": "የሥራ ቦታ",
  "Operations": "ክወናዎች",
  "Orders overview": "የትዕዛዞች አጠቃላይ እይታ",
  "Catalog": "ካታሎግ",
  "Products and stock": "ምርቶች እና ክምችት",
  "Add product": "ምርት አክል",
  "Variant stock": "የልዩነት ክምችት",
  "Organization": "ድርጅት",
  "Categories": "ምድቦች",
  "Save product": "ምርት አስቀምጥ",
  "Create product": "ምርት ፍጠር",
  "Update stock": "ክምችት አዘምን",
  "Home": "መነሻ",
  "Services": "አገልግሎቶች",
  "Portfolio": "ፖርትፎሊዮ",
  "Shop": "ሱቅ",
  "Products": "ምርቶች",
  "Digital and physical products from YAWVOREX. Orders are confirmed by YAWVOREX before processing.": "ዲጂታል እና አካላዊ ምርቶች። ትዕዛዞች ከማስኬዳቸው በፊት በYAWVOREX ይረጋገጠሉ።",
  "About": "ስለ እኛ",
  "FAQ": "ተደጋጋሚ ጥያቄዎች",
  "Contact": "አግኙን",
  "Sign in": "ግባ",
  "Account": "መለያ",
  "My account": "የእኔ መለያ",
  "Cart": "ጋሪ",
  "Hire YAWVOREX": "YAWVOREXን ይቅጠሩ",
  "Hire us": "ይቅጠሩን",
  "Explore": "ያስሱ",
  "Connect": "ያግኙን",
  "Privacy Policy": "የግላዊነት ፖሊሲ",
  "Terms": "ውሎች",
  "Shipping": "መላኪያ",
  "Returns & Refunds": "መመለስ እና ተመላሽ ገንዘብ",
  "Digital Products": "ዲጂታል ምርቶች",
  "Search": "ፈልግ",
  "Category": "ምድብ",
  "Type": "ዓይነት",
  "Sort by": "አስተካክል",
  "All categories": "ሁሉም ምድቦች",
  "Digital and physical": "ዲጂታል እና አካላዊ",
  "Digital": "ዲጂታል",
  "Physical": "አካላዊ",
  "Featured": "ተመራጭ",
  "Price: low to high": "ዋጋ፡ ከዝቅተኛ ወደ ከፍተኛ",
  "Price: high to low": "ዋጋ፡ ከፍተኛ ወደ ዝቅተኛ",
  "Name": "ስም",
  "Search products": "ምርቶችን ፈልግ",
  "Overview": "አጠቃላይ እይታ",
  "Orders": "ትዕዛዞች",
  "My orders": "ትዕዛዞቼ",
  "Profile": "መገለጫ",
  "Addresses": "አድራሻዎች",
  "Saved addresses": "የተቀመጡ አድራሻዎች",
  "Wishlist": "የምኞት ዝርዝር",
  "Wishlist items": "የምኞት ዝርዝር እቃዎች",
  "Service requests": "የአገልግሎት ጥያቄዎች",
  "Vendor application": "የአቅራቢ ማመልከቻ",
  "Downloads": "ማውረዶች",
  "Support tickets": "የድጋፍ ጥያቄዎች",
  "Notifications": "ማሳወቂያዎች",
  "Security": "ደህንነት",
  "Settings": "ቅንብሮች",
  "Language": "ቋንቋ",
  "Continue shopping": "ግዢዎን ይቀጥሉ",
  "Visit the shop": "ሱቁን ይጎብኙ",
  "Clear filters": "ማጣሪያዎችን አጽዳ",
  "product": "ምርት",
  "products": "ምርቶች",
  "Coming soon": "በቅርብ ቀን",
  "Email": "ኢሜይል",
  "Password": "የይለፍ ቃል",
  "Forgot your password?": "የይለፍ ቃልዎን ረሱ?",
  "Create an account": "አዲስ መለያ ይፍጠሩ",
  "Full name": "ሙሉ ስም",
  "At least": "ቢያንስ",
  "characters.": "ቁምፊዎች።",
  "Confirm password": "የይለፍ ቃል ያረጋግጡ",
  "Create account": "መለያ ይፍጠሩ",
  "Already registered?": "ቀድሞውኑ ተመዝግበዋል?",
  "Send reset link": "የማስጀመሪያ ሊንክ ይላኩ",
  "New password": "አዲስ የይለፍ ቃል",
  "Confirm new password": "አዲስ የይለፍ ቃል ያረጋግጡ",
  "Update password": "የይለፍ ቃል ያዘምኑ",
  "Enter a valid email address.": "ትክክለኛ የኢሜይል አድራሻ ያስገቡ።",
  "Enter your password.": "የይለፍ ቃልዎን ያስገቡ።",
  "Enter your name.": "ስምዎን ያስገቡ።",
  "Passwords do not match.": "የይለፍ ቃሎች አይዛመዱም።",
  "Manage delivery details": "የመላኪያ ዝርዝሮችን ያስተዳድሩ",
  "Browse saved products": "የተቀመጡ ምርቶችን ያስሱ",
  "My Freelancer Profile": "የእኔ የፍሪላንሰር መገለጫ",
  "My freelancer orders": "የእኔ የፍሪላንሰር ትዕዛዞች",
  "Account menu": "የመለያ ምናሌ",
  "Your dashboard": "የእርስዎ ዳሽቦርድ",
  "Refine selection": "ምርጫን ማጣራት",
  "Find a freelancer": "ፍሪላንሰር ያግኙ",
  "Browse approved professionals and connect with the right person for your project.": "የጸደቁ ባለሙያዎችን ያስሱ እና ለፕሮጀክትዎ ትክክለኛውን ሰው ያግኙ።",
  "My Profile": "የእኔ መገለጫ",
  "Add Profile": "መገለጫ ያክሉ",
  "Search by name or skill": "በስም ወይም በክህሎት ይፈልጉ",
  "Apply filters": "ማጣሪያዎችን ተግብር",
  "No freelancers yet": "ፍሪላንሰሮች እስካሁን የሉም",
  "There are no approved freelancer profiles to show right now.": "አሁን የሚታዩ የጸደቁ የፍሪላንሰር መገለጫዎች የሉም።",
  "View Profile": "መገለጫ ይመልከቱ",
  "Starting at": "የሚጀምረው በ",
  "Verified": "የተረጋገጠ",
  "Edit vendor product": "የአቅራቢ ምርትን ያርትዑ",
  "Create vendor product": "የአቅራቢ ምርት ይፍጠሩ",
  "Product image": "የምርት ምስል",
  "Remove image": "ምስል አስወግድ",
  "No category": "ምድብ የለም",
  "Save draft": "ረቂቅ አስቀምጥ",
  "Create draft": "ረቂቅ ይፍጠሩ",
  "Cancel edit": "ማረም ሰርዝ",
  "Your products": "ምርቶችዎ",
  "Status": "ሁኔታ",
  "Edit": "ያርትዑ",
  "Submit for approval": "ለማጽደቅ ያስገቡ",
  "Delete": "ሰርዝ",
  "You have not created any products yet.": "እስካሁን ምንም ምርት አልፈጠሩም።",
  "No orders match these filters.": "ምንም ትዕዛዞች ከእነዚህ ማጣሪያዎች ጋር አይዛመዱም።",
  "Product identity": "የምርት ማንነት",
  "Pricing & inventory": "ዋጋ እና ክምችት",
  "Enter both currency prices to display dual pricing.": "ሁለትዮሽ ዋጋ ለማሳየት ሁለቱንም የምንዛሬ ዋጋዎች ያስገቡ።",
  "Leave both blank to keep the current single price.": "አሁን ያለውን ነጠላ ዋጋ ለመጠበቅ ሁለቱንም ባዶ ይተው።",
  "Product type": "የምርት ዓይነት",
  "Visibility": "ታይነት",
  "Demo product": "የሙከራ ምርት",
  "Active / published": "ንቁ / የታተመ",
  "Category name": "የምድብ ስም",
  "Slug": "ስለግ",
  "Update": "አዘምን",
  "Create category": "ምድብ ፍጠር",
  "low stock": "ዝቅተኛ ክምችት",
  "Admin note": "የአስተዳዳሪ ማስታወሻ",
  "Save payment review": "የክፍያ ግምገማ አስቀምጥ",
  "Verify payment": "ክፍያ አረጋግጥ",
  "Reject payment": "ክፍያ ውድቅ አድርግ",
  "File name shown to customer": "ለደንበኛ የሚታየው የፋይል ስም",
  "Private storage path": "የግል ማከማቻ መንገድ",
  "My vendor products": "የአቅራቢ ምርቶቼ",
  "Create and submit products for admin review. Approved products are published by an admin.": "ለአስተዳዳሪ ግምገማ ምርቶችን ይፍጠሩ እና ያስገቡ። የጸደቁ ምርቶች በአስተዳዳሪ ይታተማሉ።",
  "Affiliate program": "የአጋር ፕሮግራም",
  "Refer customers to the marketplace and follow your referrals in your account.": "ደንበኞችን ወደ ገበያ ቦታው ያመልክቱ እና የእርስዎን ማጣቀሻዎች በመለያዎ ውስጥ ይከታተሉ።",
  "How referrals work": "ማጣቀሻዎች እንዴት እንደሚሰሩ",
  "Share your referral link. When a customer follows it and makes a qualifying purchase, the referral is recorded according to the program terms.": "የማጣቀሻ ሊንክዎን ያጋሩ። ደንበኛ ሲከተለው እና ብቁ ግዢ ሲፈጽም፣ ማጣቀሻው በፕሮግራሙ ውሎች መሰረት ይመዘገባል።",
  "Referral attribution": "የማጣቀሻ መለያ",
  "The referral cookie duration is configurable by the administrator and may change.": "የማጣቀሻ ኩኪ ቆይታ በአስተዳዳሪው የሚዋቀር ነው እና ሊቀየር ይችላል።",
  "Commission and payout": "ኮሚሽን እና ክፍያ",
  "Commission is set by the administrator. Eligible commission becomes payable after the applicable return window and payouts are processed manually by bank transfer.": "ኮሚሽኑ በአስተዳዳሪው የተቀናበረ ነው። ብቁ ኮሚሽን የሚከፈለው ተፈጻሚነት ያለው የመመለሻ ጊዜ ካለፈ በኋላ ነው እና ክፍያዎች በእጅ በባንክ ዝውውር ይከናወናሉ።",
  "View affiliate earnings": "የአጋር ገቢን ይመልከቱ",
  "Database is not configured.": "ዳታቤዝ አልተዋቀረም።",
  "Vendor account status could not be loaded: ": "የአቅራቢ መለያ ሁኔታ ሊጫን አልቻለም፡ ",
  "Your vendor account is not active": "የአቅራቢ መለያዎ ንቁ አይደለም",
  "Go to your account and vendor application": "ወደ መለያዎ እና አቅራቢ ማመልከቻ ይሂዱ",
  "Vendor products could not be loaded: ": "የአቅራቢ ምርቶች ሊጫኑ አልቻሉም፡ ",
  "Account data is not available because the database is not configured.": "ዳታቤዝ ስላልተዋቀረ የመለያ ውሂብ አይገኝም።",
  "Some account sections could not load. Complete the required Supabase SQL setup and verify row-level permissions: ": "አንዳንድ የመለያ ክፍሎች ሊጫኑ አልቻሉም። አስፈላጊውን የSupabase SQL ማዋቀር ያጠናቅቁ እና የረድፍ-ደረጃ ፈቃዶችን ያረጋግጡ፡ ",
  "Welcome back, ": "እንኳን ደህና መጡ፣ ",
  "Your account": "የእርስዎ መለያ",
  "Your orders, saved items, and account details in one place.": "ትዕዛዞችዎ፣ የተቀመጡ እቃዎች እና የመለያ ዝርዝሮች በአንድ ቦታ።",
  "Requests": "ጥያቄዎች",
  "Support": "ድጋፍ",
  "Vendor": "አቅራቢ",
  "A personal space for everything you do with ZIKA": "ከZIKA ጋር ለሚያደርጉት ነገር ሁሉ የግል ቦታ",
  "View order history": "የትዕዛዝ ታሪክን ይመልከቱ",
  "Order detail and tracking": "የትዕዛዝ ዝርዝር እና ክትትል",
  "Profile could not be loaded: ": "መገለጫ ሊጫን አልቻለም፡ ",
  "Addresses could not be loaded: ": "አድራሻዎች ሊጫኑ አልቻሉም፡ ",
  "Wishlist could not be loaded. Confirm the customer dashboard SQL has been applied.": "የምኞት ዝርዝር ሊጫን አልቻለም። የደንበኛ ዳሽቦርድ SQL መተግበሩን ያረጋግጡ።",
  "Service requests could not be loaded: ": "የአገልግሎት ጥያቄዎች ሊጫኑ አልቻሉም፡ ",
  "No eligible digital downloads. Links become available after payment is verified.": "ምንም ብቁ ዲጂታል ማውረዶች የሉም። ክፍያ ከተረጋገጠ በኋላ ሊንኮች ይገኛሉ።",
  "Support tickets could not be loaded. Confirm the notifications/support SQL has been applied.": "የድጋፍ ጥያቄዎች ሊጫኑ አልቻሉም። የማሳወቂያዎች/ድጋፍ SQL መተግበሩን ያረጋግጡ።",
  "New": "አዲስ",
  "Open": "ክፈት",
  "No notifications yet. New support replies will appear here and in the navigation bell.": "ምንም ማሳወቂያዎች የሉም። አዲስ የድጋፍ መልሶች እዚህ እና በአሰሳ ደወል ውስጥ ይታያሉ።",
  "Change password by email": "በኢሜይል የይለፍ ቃል ቀይር",
  "Vendor applications are not configured yet. The owner must review the vendor SQL proposal.": "የአቅራቢ ማመልከቻዎች ገና አልተዋቀሩም። ባለቤቱ የአቅራቢውን SQL ፕሮፖዛል መገምገም አለበት።",
  "Additional account preferences are not available yet.": "ተጨማሪ የመለያ ምርጫዎች ገና አይገኙም።",
  "Choose English or Amharic for the navigation, footer, shop filters, and account headings.": "ለአሰሳ፣ ለግርጌ፣ ለሱቅ ማጣሪያዎች እና ለመለያ አርእስቶች እንግሊዝኛ ወይም አማርኛ ይምረጡ።",
  "My earnings": "ገቢዬ"
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
