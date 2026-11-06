"use client";
import type { ReactNode } from "react";
import { CartProvider } from "@/components/cart/CartProvider";
import { LanguageProvider } from "@/components/i18n/LanguageProvider";
import { AuthProvider } from "@/components/auth/AuthProvider";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <LanguageProvider>
      <AuthProvider>
        <CartProvider>
          {children}
        </CartProvider>
      </AuthProvider>
    </LanguageProvider>
  );
}
