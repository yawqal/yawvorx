# YAWVOREX Phase 4: Database and Sign-in Setup Guide (phone-friendly)

Status honesty: this code and SQL were written but NOT run or tested by the author. Follow the steps, and use the test list at the end.

## Step 1: Get your Supabase URL and public key
1. Open supabase.com/dashboard in your phone browser and open your project.
2. Tap **Connect** (top of the project page). Copy **Project URL** and the **Publishable key** (starts with `sb_publishable_`).
3. If you cannot find it: **Project Settings > API Keys**. If no publishable key exists, tap **Create new API Keys**. Older projects may show an **anon** key instead; that also works.
4. NEVER copy the "secret" or "service_role" key into this project. Never send any key to anyone in chat.

## Step 2: Run the database SQL (YOUR database already has tables, so use THESE files, in THIS order)
Files are in `supabase/migrations/`. Do NOT use anything in `supabase/fresh-database-only/`.
1. SQL Editor > New query. Paste the WHOLE file, scroll to the very bottom, and check the last line says `-- END OF FILE ...`. If it does not, the paste was cut off: clear and paste again.
2. Tap Run. Expect "Success". Then do the next file. Order: `001a_existing_tables_additive.sql`, `001b1_variants_images.sql`, `001b2_orders_payments_notes.sql`, `001b3_portfolio_settings_files.sql`, `001c_functions_triggers.sql`, `002_security_rls.sql`, `003_storage.sql`, then optional `004_seed_demo.sql`.
3. If any file errors, STOP and send me the error text and the file name.
4. Finally re-run `000_inspect_existing.sql` and send me the report, so I can confirm the result.

## Step 3: Allow your site's sign-in links
1. Supabase > **Authentication > URL Configuration**.
2. **Site URL**: your live address, for example `https://your-project.vercel.app`.
3. **Redirect URLs**: add `https://your-project.vercel.app/**` and `http://localhost:3000/**`.
4. Leave "Confirm email" turned on. The built-in email sender is meant for testing and has strict limits; plan to add your own email (SMTP) service before launch.

## Step 4: Add the two settings in Vercel
1. Vercel > your project > **Settings > Environment Variables**.
2. Add `NEXT_PUBLIC_SUPABASE_URL` (your Project URL) and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (your publishable key). Add them for Production, Preview and Development.
3. Upload the Phase 4 files to GitHub (replace the old ones; keep `.env` files out of GitHub). Vercel redeploys automatically. If you changed variables only, tap **Deployments > Redeploy**.

## Step 5: Create your account, then make it admin
1. On your live site tap **Sign in > Create an account**. Register with YOUR email and a strong password you do not reuse.
2. Open the confirmation email and tap the link. Then sign in.
3. Get your UID: Supabase > **Authentication > Users** > tap your email > copy **User UID**.
4. SQL Editor > New query. Paste `supabase/manual/promote_first_admin.sql`, replace `PASTE_YOUR_USER_UID_HERE` with your UID (keep the quotes), and Run. (Your user_roles table holds one row per user, so this sets your row to admin.)
5. Visit `/admin` on your site. You should see "Admin verified by the database". Another account visiting `/admin` must see a 404 page.
6. There is no default admin and no admin password. Nobody can promote themselves through the website.

## Step 6: Security tests to run yourself
Run the blocks in `supabase/tests/rls_checks.sql` one at a time and compare with "Expected". Also: sign in with a second test account and confirm `/admin` shows 404 and `/account` shows only that account's data.

## What the Phase 3 forms do now (audit)
| Feature | Status after Phase 4 |
|---|---|
| Sign up, sign in, sign out, password reset, account page, profile edit | Connected to Supabase (untested) |
| Cart | Browser only (unchanged) |
| Checkout and order request | NOT connected. Produces a message; no order row is created until Phase 5 |
| Hire / project request | NOT connected. Produces a message; no request row is created until Phase 5 |
| Shop, product, portfolio pages | Still use built-in demo data. Database tables exist; connection comes in Phase 5/6 |
| Order history (account page) | Reads real data, but will be empty until Phase 5 creates orders |
| Prices and totals | The browser is never trusted. Phase 5 creates orders on the server and recalculates from database prices |
| Digital downloads | Files bucket is private. Download links arrive in Phase 5 |
| Admin tools | Only the role check exists. Tools arrive in Phase 6 |

Why no public insert rights: orders and project requests are NOT writable from the browser at all. Phase 5 adds trusted server code (with spam limits) to create them, so nobody can submit fake prices or flood your tables.

## Checklist
**Implemented (written)**: 14-table schema with constraints and indexes; admin check function; RLS on every table; zero-by-default grants; private digital-files bucket; automatic profile creation; order status history trigger; Supabase client, session middleware, sign-up/in/out/reset, protected /account and /admin, safe redirect handling; setup notices when keys are missing.

**Prepared but not executed**: all SQL; all new TypeScript; `npm install` of the two Supabase packages; the site build.

**Needs your action**: Steps 1 to 5 above; confirm the Facebook link; set a real email and WhatsApp number; fill policy drafts.

**Not yet tested**: sign-up and email confirmation, sign-in, password reset, RLS rules, `/admin` access for admin and non-admin, profile update, storage rules, mobile layout of the new pages.

## Common problems
- "Setup needed" box on login: the two Vercel variables are missing or the site was not redeployed.
- "Link is invalid or expired": the Redirect URLs in Step 3 do not include your site, or the link was already used.
- Profile or orders "could not be loaded": a migration did not run. Re-run 001 then 002.
- `/admin` shows 404 for you: the promote SQL was not run, or you pasted a different user's UID.
- Never exposed a key by accident? In Supabase, rotate it under Project Settings > API Keys.
