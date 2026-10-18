# Affiliate attribution limitations and proposal

Approved vendor applications receive an active referral code. Visiting a valid `?ref=CODE` link records a referral click and stores the code in the `zika_ref` HTTP-only, same-site cookie for 30 days. The admin view reports recorded clicks and signup events.

Signup attribution is intentionally not wired: completing it reliably requires a change to the existing registration/authentication flow so the authenticated user can be linked to the referral cookie. The current hard constraint forbids changing that flow. As a result, the signup counter remains zero until the owner approves a separate integration. No login is counted as a signup.

Likewise, referral codes are not written to orders. The checkout invokes the existing `yvx_create_order` RPC with a fixed customer object, and this phase does not change that RPC or its call. If the owner wants order attribution, separately review a change that passes the cookie's validated code into the existing customer notes or a dedicated, server-validated RPC argument, and persists it on the order in the same transaction. Do not use user-editable notes as a source of financial attribution.

There are no commissions, money calculations, balances, payment automation, or payouts.

The event endpoint is IP-rate-limited in process memory and public click events can be spoofed; counts are operational indicators only, not financial evidence. The serverless caveat and need for a distributed limiter are described in `SECURITY-REVIEW.md`.
