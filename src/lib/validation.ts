// Simple form validation shared by the Hire and Checkout forms.
// Phase 4/5 repeats these checks on the SERVER, because browser checks can be bypassed.
export type Errors = Record<string, string>;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE = /^\+?[\d\s()-]{7,20}$/;

export const CONTACT_METHODS = ["Telegram", "WhatsApp", "Email", "Phone"] as const;
export const BUDGETS = ["Not sure yet", "Under $200", "$200 - $500", "$500 - $1,500", "$1,500+"] as const;

export type HireValues = {
  name: string; contactMethod: string; contactValue: string; service: string;
  description: string; budget: string; deadline: string; reference: string; website: string;
};

export function validateHire(v: HireValues): Errors {
  const e: Errors = {};
  if (v.name.trim().length < 2 || v.name.length > 80) e.name = "Enter your name (2 to 80 characters).";
  if (!CONTACT_METHODS.includes(v.contactMethod as never)) e.contactMethod = "Choose how we should reach you.";
  const c = v.contactValue.trim();
  if (c.length < 3 || c.length > 120) e.contactValue = "Enter your contact detail.";
  else if (v.contactMethod === "Email" && !EMAIL.test(c)) e.contactValue = "Enter a valid email address.";
  else if ((v.contactMethod === "WhatsApp" || v.contactMethod === "Phone") && !PHONE.test(c)) e.contactValue = "Enter a valid phone number with country code.";
  if (!v.service) e.service = "Choose a service.";
  if (v.description.trim().length < 20) e.description = "Describe your project in at least 20 characters.";
  if (v.description.length > 2000) e.description = "Keep the description under 2,000 characters.";
  if (v.deadline && new Date(v.deadline) < new Date(new Date().toDateString())) e.deadline = "Choose a date that is not in the past.";
  if (v.reference.trim()) {
    try { if (!/^https?:$/.test(new URL(v.reference.trim()).protocol)) throw new Error(); }
    catch { e.reference = "Enter a full link starting with https://"; }
  }
  return e;
}

export type CheckoutValues = {
  name: string; phone: string; email: string; address: string; city: string; country: string; notes: string; method: string;
};

export function validateCheckout(v: CheckoutValues, needsAddress: boolean): Errors {
  const e: Errors = {};
  if (v.name.trim().length < 2) e.name = "Enter your full name.";
  if (!PHONE.test(v.phone.trim())) e.phone = "Enter a valid phone number with country code.";
  if (v.email.trim() && !EMAIL.test(v.email.trim())) e.email = "Enter a valid email address or leave it empty.";
  if (needsAddress) {
    if (v.address.trim().length < 5) e.address = "Enter your delivery address.";
    if (v.city.trim().length < 2) e.city = "Enter your city.";
    if (v.country.trim().length < 2) e.country = "Enter your country.";
  }
  if (!v.method) e.method = "Choose an ordering method.";
  return e;
}

/** Joins message lines, dropping empty/false entries. Use BLANK for an intentional empty line. */
export const BLANK = "\u0000";
export function joinLines(parts: (string | false | null | undefined)[]): string {
  return parts.filter((x): x is string => !!x).map((x) => (x === BLANK ? "" : x)).join("\n");
}
