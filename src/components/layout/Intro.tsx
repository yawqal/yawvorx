"use client";
import { useEffect, useState } from "react";
import { LogoMark } from "@/components/brand/Logo";
import { siteConfig } from "@/config/site";

const KEY = "yvx-intro-seen";

function remember() {
  try { localStorage.setItem(KEY, "1"); } catch { /* storage blocked: ignore */ }
}

/** Short brand intro. Shown once per browser, skippable, and disabled for reduced-motion users. */
export function Intro() {
  const [show, setShow] = useState(true);

  useEffect(() => {
    let skip = false;
    try {
      skip = window.matchMedia("(prefers-reduced-motion: reduce)").matches || !!localStorage.getItem(KEY);
    } catch { /* storage blocked: just show the intro this time */ }
    if (skip) { setShow(false); return; }

    const close = () => { setShow(false); remember(); };
    const timer = setTimeout(close, 2800);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    document.addEventListener("keydown", onKey);
    return () => { clearTimeout(timer); document.removeEventListener("keydown", onKey); };
  }, []);

  if (!show) return null;

  return (
    <div className="intro-overlay bg-aurora fixed inset-0 z-[100] flex flex-col items-center justify-center bg-obsidian px-6 text-center" role="dialog" aria-label="YAWVOREX intro">
      <LogoMark size={96} animated />
      <p className="rise mt-6 font-display text-2xl font-semibold tracking-[0.3em]" style={{ animationDelay: "0.9s" }}>{siteConfig.name}</p>
      <p className="rise mt-3 text-ink-mute" style={{ animationDelay: "1.3s" }}>{siteConfig.tagline}</p>
      <button
        type="button"
        onClick={() => { setShow(false); remember(); }}
        className="absolute right-4 top-[max(1rem,env(safe-area-inset-top))] min-h-[44px] rounded-xl border border-line bg-obsidian-800 px-4 text-sm text-ink hover:border-brand/50"
      >
        Skip intro
      </button>
    </div>
  );
}
