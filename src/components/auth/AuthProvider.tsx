"use client";
import { createContext, useContext, useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

type Ctx = { user: User | null; loading: boolean };
const AuthContext = createContext<Ctx>({ user: null, loading: true });

/** Keeps the current user available to the navigation. This is for display only: real protection is on the server. */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) { setLoading(false); return; }
    let active = true;
    supabase.auth.getUser().then(({ data }) => { if (active) { setUser(data.user ?? null); setLoading(false); } });
    const { data } = supabase.auth.onAuthStateChange((_event, session) => setUser(session?.user ?? null));
    return () => { active = false; data.subscription.unsubscribe(); };
  }, []);

  return <AuthContext.Provider value={{ user, loading }}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
