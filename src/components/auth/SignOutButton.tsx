"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";

export function SignOutButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  return (
    <Button variant="secondary" loading={busy} onClick={async () => {
      setBusy(true);
      await getSupabaseBrowserClient()?.auth.signOut();
      router.replace("/");
      router.refresh();
    }}>Sign out</Button>
  );
}
