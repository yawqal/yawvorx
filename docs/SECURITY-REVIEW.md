# Security review

## HTTP protections

The application sets `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, and one-year HSTS with `includeSubDomains`. HSTS assumes HTTPS is used for every subdomain.

Content Security Policy is currently emitted as `Content-Security-Policy-Report-Only` so production behavior is not broken while violations are observed. The policy allows the configured Supabase origin (or `*.supabase.co` if no URL is configured), Supabase websockets, and Vercel's `vercel.live` origin. It includes Next.js inline script/style allowances and `unsafe-eval`; remove/tighten these only after validating the deployed app. It does not enforce restrictions until the header is changed to `Content-Security-Policy`.

POST limits per IP are: `/api/admin` 60/minute, `/api/reviews` 5/minute, `/api/vendors` 5/minute, and `/api/referrals/click` 30/minute. Limits are held in process memory, so they reset on restart and are not shared between serverless instances/regions. This is basic abuse protection, not a distributed limit; use an edge/provider limiter for an enforceable production-wide quota. These routes validate the JSON size, record IDs, flags, field lengths/types, and allowed values.

## Dependency audit

The audit summary below records `npm audit` results at review time. No dependency versions were changed.

| Package | Severity | Production runtime? | Safest fix path | Breaking upgrade? |
|---|---|---|---|---|
| `next` | Critical | Yes; directly used by the deployed application. The audit reports multiple server, image-optimizer, middleware, and cache-related advisories; exploitability depends on the affected feature/configuration. | Plan a tested Next.js major upgrade to a patched release. `npm audit` only offered Next.js 16.4.2 for the complete current advisory set; do not apply without migration and deployment tests. | Yes |
| `postcss` | High | Included in the production dependency tree transitively under Next.js, although the reported source-map/CSS processing issues are chiefly relevant when processing untrusted CSS inputs. | Update via a patched Next.js dependency set after compatibility testing; avoid a blind override of Next.js's nested dependency. | The audit's suggested Next.js fix is a major upgrade |
| `tailwindcss` | High | No; development/build dependency. | Move to a patched Tailwind release and validate the configuration and generated CSS. | Yes; the audit suggested Tailwind 4.3.3 |
| `braces` | High | No; transitive Tailwind tooling dependency. | Upgrade Tailwind to refresh its dependency graph, then run lint/build. | Yes; the audit suggested Tailwind 4.3.3 |
| `chokidar` | High | No; transitive Tailwind file-watching dependency. | Upgrade Tailwind to refresh its dependency graph, then run lint/build. | Yes; the audit suggested Tailwind 4.3.3 |
| `fast-glob` | High | No; transitive Tailwind tooling dependency. | Upgrade Tailwind to refresh its dependency graph, then run lint/build. | Yes; the audit suggested Tailwind 4.3.3 |
| `micromatch` | High | No; transitive Tailwind tooling dependency. | Upgrade Tailwind to refresh its dependency graph, then run lint/build. | Yes; the audit suggested Tailwind 4.3.3 |
| `postcss-nested` | Moderate | No; transitive Tailwind build dependency. | Upgrade Tailwind to refresh its dependency graph, then run lint/build. | Yes; the audit suggested Tailwind 4.3.3 |
| `postcss-selector-parser` | Moderate | No; transitive Tailwind build dependency. | Upgrade Tailwind to refresh its dependency graph, then run lint/build. | Yes; the audit suggested Tailwind 4.3.3 |

The audit reported 9 vulnerable packages (1 critical, 6 high, 2 moderate). A second `npm audit --omit=dev` confirmed that Next.js and its nested PostCSS package remain in the production dependency tree; the other seven findings are under development/build dependencies. Installed direct versions were Next.js 14.2.35 and Tailwind CSS 3.4.19. No dependency or lockfile changes were made as requested. Prioritize a tested Next.js security upgrade; the recommended version crosses the prohibited major-version boundary and requires a separately approved migration. Re-run `npm audit` after that migration or any lockfile change.
