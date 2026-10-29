import { siteConfig } from "@/config/site";

export function formatMoney(amount: number, currency: string = siteConfig.currency): string {
  try {
    return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(2)}`;
  }
}
