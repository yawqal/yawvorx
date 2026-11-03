// Shared validation types and helpers used by checkout, hire, and vendor forms.

export const BLANK = "";

/** Joins non-empty lines. Accepts either spread args or a single array. */
export function joinLines(...args: unknown[]): string {
  const lines: unknown[] = args.length === 1 && Array.isArray(args[0]) ? args[0] : args;
  return lines.filter(Boolean).join("\n");
}

// ── Checkout ─────────────────────────────────────────────────────────────────

export type CheckoutValues = {
  name: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  country: string;
  notes: string;
  method: string;
};

export type Errors = Record<string, string>;

export function validateCheckout(v: CheckoutValues, needsAddress = false): Errors {
  const e: Errors = {};
  if (!v.name.trim()) e.name = "Please enter your full name.";
  if (!v.phone.trim()) e.phone = "Please enter a phone number.";
  if (v.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.email.trim())) e.email = "Please enter a valid email address.";
  if (needsAddress) {
    if (!v.address.trim()) e.address = "Please enter a delivery address.";
    if (!v.city.trim()) e.city = "Please enter a city.";
  }
  return e;
}

export async function validateOrderSubmission(orderData: {
  customer?: { email?: string };
  items?: unknown[];
  currency?: string | null;
}): Promise<{ isValid: boolean; message: string }> {
  if (!orderData.customer?.email) return { isValid: false, message: "Customer email is required." };
  if (!orderData.items || orderData.items.length === 0) return { isValid: false, message: "At least one item is required in the order." };
  if (!orderData.currency) return { isValid: false, message: "Currency is required." };
  return { isValid: true, message: "" };
}

// ── Hire form ─────────────────────────────────────────────────────────────────

export const BUDGETS = [
  "Under $500",
  "$500–$1 000",
  "$1 000–$5 000",
  "$5 000–$10 000",
  "Over $10 000",
  "To be discussed",
];

export const CONTACT_METHODS = ["Telegram", "WhatsApp", "Email", "Phone"];

export type HireValues = {
  name: string;
  contactMethod: string;
  contactValue: string;
  service: string;
  description: string;
  budget: string;
  deadline: string;
  reference: string;
  website: string;
};

export function validateHire(v: HireValues): Errors {
  const e: Errors = {};
  if (!v.name.trim()) e.name = "Please enter your name.";
  if (!v.contactValue.trim()) e.contactValue = "Please enter your contact detail.";
  if (!v.service) e.service = "Please choose a service.";
  if (!v.description.trim()) e.description = "Please describe your project.";
  if (v.deadline && !/^\d{4}-\d{2}-\d{2}$/.test(v.deadline)) e.deadline = "Please enter a valid date.";
  if (v.reference.trim() && !/^https?:\/\/.+/.test(v.reference.trim())) e.reference = "Please enter a valid URL starting with https://.";
  return e;
}

// ── Vendor application ────────────────────────────────────────────────────────

export function validateVendorApplication(data: unknown): { ok: boolean; data?: { business_name: string; contact_value: string; description: string }; error?: string } {
  const record = data as Record<string, unknown>;
  const business_name = typeof record.business_name === "string" ? record.business_name.trim() : "";
  const contact_value = typeof record.contact_value === "string" ? record.contact_value.trim() : "";
  const description = typeof record.description === "string" ? record.description.trim() : "";

  if (
    business_name.length < 2 || business_name.length > 120 ||
    contact_value.length < 3 || contact_value.length > 150 ||
    description.length < 20 || description.length > 2000
  ) {
    return { ok: false, error: "Check your business name, contact detail, and application description." };
  }

  return { ok: true, data: { business_name, contact_value, description } };
}
