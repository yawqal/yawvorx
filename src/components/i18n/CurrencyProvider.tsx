"use client";

import { createContext, useContext, useEffect, useState } from "react";
import type { Currency } from "@/data/products";

type CurrencyContextValue = { currency: Currency; setCurrency: (currency: Currency) => void };
const CurrencyContext = createContext<CurrencyContextValue>({
  currency: "USD",
  setCurrency: () => undefined,
});
const STORAGE_KEY = "yvx-currency";

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [currency, setCurrency] = useState<Currency>("USD");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === "ETB" || saved === "USD") setCurrency(saved);
    } catch { /* ignore */ }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try { localStorage.setItem(STORAGE_KEY, currency); } catch { /* ignore */ }
  }, [currency, ready]);

  return <CurrencyContext.Provider value={{ currency, setCurrency }}>{children}</CurrencyContext.Provider>;
}

export function useCurrency() {
  return useContext(CurrencyContext);
}
