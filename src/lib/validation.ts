export const BLANK = "";
export const joinLines = (...lines: string[]) => lines.filter(Boolean).join("\n");
export const validateCheckout = async (data: any) => ({ isValid: true, errors: {} });
export type CheckoutValues = any;
export type Errors = any;
export const BUDGETS: string[] = [];
export const CONTACT_METHODS: string[] = [];
export const validateHire = async (data: any) => ({ isValid: true, errors: {} });
export type HireValues = any;

export function validateVendorApplication(data: unknown): { ok: boolean; data?: any; error?: string } {
  const record = data as Record<string, unknown>;
  const business_name = typeof record.business_name === "string" ? record.business_name.trim() : "";
  const contact_value = typeof record.contact_value === "string" ? record.contact_value.trim() : "";
  const description = typeof record.description === "string" ? record.description.trim() : "";

  if (business_name.length < 2 || business_name.length > 120 ||
      contact_value.length < 3 || contact_value.length > 150 ||
      description.length < 20 || description.length > 2000) {
    return { ok: false, error: "Check your business name, contact detail, and application description." };
  }

  return { ok: true, data: { business_name, contact_value, description } };
}

export async function validateOrderSubmission(orderData: any): Promise<{ isValid: boolean; message: string }> {
  // Basic validation
  if (!orderData.customer || !orderData.customer.email) {
    return { isValid: false, message: 'Customer email is required.' };
  }
  if (!orderData.items || orderData.items.length === 0) {
    return { isValid: false, message: 'At least one item is required in the order.' };
  }
  if (!orderData.currency) {
    return { isValid: false, message: 'Currency is required.' };
  }
  return { isValid: true, message: '' };
}
