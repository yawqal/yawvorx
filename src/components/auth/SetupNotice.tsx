import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

export function SetupNotice() {
  return (
    <Card className="space-y-2">
      <Badge tone="warn">Setup needed</Badge>
      <h2 className="text-lg font-semibold">Sign-in is not connected yet</h2>
      <p className="text-ink-mute">The site owner needs to add the Supabase settings (NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY). See docs/PHASE4_SETUP_GUIDE.md.</p>
    </Card>
  );
}
