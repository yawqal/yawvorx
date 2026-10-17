import { Container } from "@/components/ui/Container";

export default function Loading() {
  return (
    <Container className="py-20 sm:py-28">
      <div role="status" aria-label="Loading page" aria-busy="true" className="mx-auto max-w-4xl animate-pulse">
        <div className="h-10 w-2/3 rounded-xl bg-obsidian-800" />
        <div className="mt-5 h-5 max-w-xl rounded-lg bg-obsidian-800" />
        <div className="mt-2 h-5 max-w-md rounded-lg bg-obsidian-800" />
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((item) => <div key={item} className="surface h-48 rounded-2xl" />)}
        </div>
        <span className="sr-only">Loading page</span>
      </div>
    </Container>
  );
}
