"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

export function ReferralCapture() {
  const pathname = usePathname();
  const attempted = useRef(new Set<string>());

  useEffect(() => {
    const code = new URL(window.location.href).searchParams.get("ref")?.trim().toUpperCase();
    if (!code || !/^[A-F0-9]{10}$/.test(code)) return;
    const key = `${pathname}:${code}`;
    if (attempted.current.has(key)) return;
    attempted.current.add(key);
    void fetch("/api/referrals/click", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({ code }),
    }).then(async (response) => {
      if (!response.ok) {
        const result = await response.json() as { error?: string };
        console.error("Referral visit was not recorded:", result.error ?? "Unknown referral error.");
      }
    }).catch((error: unknown) => {
      console.error("Referral visit could not reach the server:", error);
    });
  }, [pathname]);

  return null;
}
