import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";

const accents: Record<string, string> = {
  violet: "text-violet-soft border-violet/30",
  cyan: "text-cyan-soft border-cyan/30",
  green: "text-green-400 border-green-500/30",
  amber: "text-amber-400 border-amber-500/30",
  pink: "text-pink-400 border-pink-500/30",
  blue: "text-blue-400 border-blue-500/30",
  emerald: "text-emerald-400 border-emerald-500/30",
  orange: "text-orange-400 border-orange-500/30",
};

export function ComingSoon({ title, accent }: { title: string; accent: keyof typeof accents }) {
  return (
    <>
      <PageHeader title={title} intro="Coming soon" />
      <Container className="py-10">
        <Card className={`max-w-2xl border ${accents[accent]}`}>
          <p className="text-lg font-medium">This part of ZIKA is being prepared.</p>
          <p className="mt-2 text-ink-mute">Availability and details will be shared here when they are ready.</p>
          <Link href="/" className="mt-5 inline-flex min-h-11 items-center rounded-xl border border-line px-4 text-ink underline-offset-4 hover:underline">Back to home</Link>
        </Card>
      </Container>
    </>
  );
}
