"use client";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

export type CartItem = {
  key: string; slug: string; name: string; variantId?: string; variantLabel?: string;
  unitPrice: number; qty: number; type: "digital" | "physical"; maxQty: number; currency: "ETB" | "USD";
};

const STORAGE_KEY = "yvx-cart-v2";

// Cart data lives in the browser, so it is untrusted: re-check its shape when loading.
function sanitize(raw: unknown): CartItem[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter((i): i is CartItem =>
    !!i && typeof i.key === "string" && typeof i.slug === "string" && typeof i.name === "string" &&
    Number.isFinite(i.unitPrice) && i.unitPrice >= 0 && Number.isInteger(i.maxQty) && i.maxQty >= 1 &&
    Number.isInteger(i.qty) && i.qty >= 1 && i.qty <= i.maxQty && (i.type === "digital" || i.type === "physical") &&
    (i.currency === "ETB" || i.currency === "USD") && (i.variantId === undefined || typeof i.variantId === "string")
  ).slice(0, 50);
}

type Ctx = {
  items: CartItem[]; ready: boolean; count: number; subtotal: number; currency: "ETB" | "USD" | null;
  add: (item: Omit<CartItem, "qty">, qty?: number) => void;
  setQty: (key: string, qty: number) => void;
  remove: (key: string) => void; clear: () => void;
};
const CartContext = createContext<Ctx | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try { const raw = localStorage.getItem(STORAGE_KEY); if (raw) setItems(sanitize(JSON.parse(raw))); } catch { /* ignore */ }
    setReady(true);
  }, []);
  useEffect(() => {
    if (!ready) return;
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(items)); } catch { /* ignore */ }
  }, [items, ready]);

  const clamp = (q: number, max: number) => Math.max(1, Math.min(Math.floor(q) || 1, max));

  const add: Ctx["add"] = useCallback((item, qty = 1) => {
    setItems((cur) => {
      const found = cur.find((i) => i.key === item.key);
      if (found) return cur.map((i) => (i.key === item.key ? { ...i, qty: clamp(i.qty + qty, i.maxQty) } : i));
      return [...cur, { ...item, qty: clamp(qty, item.maxQty) }];
    });
  }, []);
  const setQty = useCallback((key: string, qty: number) =>
    setItems((cur) => cur.map((i) => (i.key === key ? { ...i, qty: clamp(qty, i.maxQty) } : i))), []);
  const remove = useCallback((key: string) => setItems((cur) => cur.filter((i) => i.key !== key)), []);
  const clear = useCallback(() => setItems([]), []);

  const value = useMemo<Ctx>(() => ({
    items, ready, add, setQty, remove, clear,
    count: items.reduce((n, i) => n + i.qty, 0),
    subtotal: items.reduce((n, i) => n + i.qty * i.unitPrice, 0),
    currency: items[0]?.currency ?? null,
  }), [items, ready, add, setQty, remove, clear]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): Ctx {
  const c = useContext(CartContext);
  if (!c) throw new Error("useCart must be used inside CartProvider");
  return c;
}
