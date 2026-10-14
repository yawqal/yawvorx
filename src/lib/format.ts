import { siteConfig } from "@/config/site";

export function formatMoney(amount: number): string {
  try {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: siteConfig.currency }).format(amount);
  } catch {
    return `${siteConfig.currency} ${amount.toFixed(2)}`;
  }
}
