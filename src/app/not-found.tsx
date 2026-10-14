import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { LogoMark } from "@/components/brand/Logo";

export default function NotFound() {
  return (
    <Container className="flex min-h-[60vh] flex-col items-center justify-center py-20 text-center">
      <LogoMark size={64} />
      <h1 className="mt-6 text-4xl font-semibold">Page not found</h1>
      <p className="mt-3 max-w-md text-ink-mute">The page you are looking for does not exist or has moved.</p>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Button href="/">Go home</Button>
        <Button href="/shop" variant="secondary">Visit the shop</Button>
      </div>
    </Container>
  );
}
