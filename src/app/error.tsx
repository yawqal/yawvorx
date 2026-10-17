"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <Container className="py-20 sm:py-28">
      <div className="surface mx-auto max-w-xl p-6 text-center sm:p-10">
        <p className="font-display text-sm uppercase tracking-[0.2em] text-cyan-soft">Something went wrong</p>
        <h1 className="mt-3 text-3xl font-semibold">This page hit a problem</h1>
        <p className="mt-3 text-ink-mute">Please try again. If the problem continues, come back in a little while.</p>
        <Button className="mt-6" onClick={() => reset()}>Try again</Button>
      </div>
    </Container>
  );
}
