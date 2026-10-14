import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/PageHeader";
import { Container } from "@/components/ui/Container";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { requireAdmin } from "@/lib/auth";

export const metadata: Metadata = { title: "Admin", robots: { index: false, follow: false } };

// requireAdmin() runs on the server and asks the database. Non-admins receive a normal 404 page.
export default async function Admin() {
  const user = await requireAdmin();
  return (
    <>
      <PageHeader title="Admin area"><Badge tone="ok">Admin verified by the database</Badge></PageHeader>
      <Container className="py-10">
        <Card>
          <p>Signed in as <strong>{user.email}</strong>.</p>
          <p className="mt-2 text-ink-mute">This confirms your administrator role works. The management tools (products, orders, requests, settings) are built in Phase 6.</p>
        </Card>
      </Container>
    </>
  );
}
