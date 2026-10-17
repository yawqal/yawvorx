# Production checklist

## Domain and deployment

- [ ] Set the production custom domain in Vercel and configure DNS using Vercel's current instructions.
- [ ] Set `NEXT_PUBLIC_SITE_URL` to the canonical HTTPS origin and confirm redirects/canonical URLs.
- [ ] Verify HTTPS and HSTS on the custom domain and every subdomain before enabling `includeSubDomains`.
- [ ] Review CSP report-only violations in production before considering enforcement.

## Supabase Auth and environment

- [ ] Add the production origin and exact callback URLs to Supabase Auth's Site URL and allowed redirect URLs.
- [ ] Configure the environment variable names from `.env.example` in the production deployment.
- [ ] Use only Supabase publishable/anon keys in `NEXT_PUBLIC_` variables. Never configure a service-role or secret key in client-visible variables.
- [ ] Confirm contact, WhatsApp, and manual payment instructions are owner-approved; verify them in the admin health check without exposing their values publicly.

## Data and backups

- [ ] Confirm RLS is enabled and policies are correct for every public schema table using `supabase/tests/rls_checks_phase2_6.sql`.
- [ ] Review every SQL proposal and live grant/policy before the owner applies it in Supabase.
- [ ] Confirm Supabase backup schedule, retention, and a tested restore procedure appropriate to the production plan.
- [ ] Verify audit log writes, visibility, and retention; do not change the live `audit_log` column contract.

## Production test order

1. Build the exact deployment commit and inspect build output.
2. Check the admin health page and Supabase connection.
3. Test sign-in, sign-out, password reset, and admin authorization using separate customer/admin accounts.
4. Test product browsing, search/filter, cart, and manual checkout using a test product and no real payment.
5. Verify manually reviewed payment behavior; never mark payment paid without owner verification.
6. Test paid digital-download authorization and confirm unpaid/other-user orders cannot obtain links.
7. Test service requests, support conversations, notifications, audit log filters, and admin status transitions.
8. Check custom 404, metadata, sitemap URLs, structured product data, headers, and CSP reports.
9. Test responsive layouts on a narrow mobile viewport and a desktop viewport.

## Rollback

- [ ] Redeploy the last known-good Vercel deployment; do not delete database objects as part of an application rollback.
- [ ] If a reviewed SQL change has been applied, use its separately reviewed database rollback plan and a verified backup; never improvise a destructive rollback.
- [ ] Restore previous environment settings when a configuration change caused the issue.
- [ ] Re-test authentication, manual payment handling, access control, and downloads after rollback.
