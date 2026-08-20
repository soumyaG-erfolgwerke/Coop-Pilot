# CoopPilot demo monitoring coverage

## Meaning of a passing run

A passing run confirms the registered checks below against the permanent production demo tenants. It does not prove that unknown bugs cannot exist. Every new feature or newly discovered edge case must add a named check before being considered monitored.

## Safety guarantees

- Monitoring authenticates only with dedicated demo accounts.
- Tenant-changing checks target only `DEV_DEMO_COOP_ID` and `DEV_DEMO_AUDIT_ORG_ID`.
- The allowlisted demo baseline is restored before and after every run.
- Temporary onboarding, voting, assembly, transaction, KYC and document-link changes are verified and removed or restored.
- Monitor-created Appwrite sessions are revoked after the run.
- Stripe monitoring requires a separate `DEV_MONITOR_STRIPE_SECRET_KEY` beginning with `sk_test_`; a live Stripe key is rejected.

## Registered coverage

The local suite contains 54 named checks across:

- Production reachability and the normal sign-in surface.
- Login, effective role and server-side session verification for coop admin, member, audit-organisation admin, auditor and sub-auditor.
- Exact cooperative, active-member, zero-share-member, former-member, KYC, transaction, assembly and audit-organisation baseline records.
- Anonymous access denial, cross-role denial, member self-access and cooperative/audit tenant boundaries.
- Active and former member registers, including the valid active-member-with-zero-shares case.
- Verified and pending KYC states, invalid review rejection, member review denial, and an admin approval workflow with a stored-result assertion.
- Member and cooperative transaction views, invalid purchase rejection and creation of a pending share proposal.
- Share-register report identity and totals derived from the seeded verified transaction.
- Cooperative documents, member visibility, foreign-tenant denial, and an admin-update/member-read workflow.
- Assembly listing, invalid payload rejection, admin draft creation and member creation denial.
- Voting attendance enforcement, exactly-once counting and duplicate-vote rejection.
- Imported-member onboarding discovery, acceptance, exact share increment and completion state.
- Audit organisation attachment, auditor/sub-auditor assignments, audit-history access and member denial.
- Cooperative payment-state authorization, foreign-tenant denial, invalid checkout rejection, member-only checkout role enforcement, and read-only Stripe sandbox connectivity.
- Eight parallel member-register requests with response-consistency validation.

## Deliberate daily-monitor exclusions

- No real customer tenant is queried or modified.
- No live Stripe charge, SEPA debit or live webhook is generated. Provider money movement belongs in a separate controlled Stripe test-mode integration run.
- Email delivery and invitation-mail transport are excluded because in-platform feature monitoring was prioritized and the mail system is being handled separately.
- Malware samples, large-file stress tests and destructive load tests are release/security checks, not daily production monitoring.
- Voting uses Appwrite database transactions plus a unique `pollId + userId` ballot record. The daily workflow submits three voters concurrently together with seven duplicate requests and requires exactly three durable ballots and three aggregate votes. Release validation should additionally route load through every production instance when the service is scaled horizontally.

## Release rule

Static lint and production build must pass locally. The suite is not considered operationally verified until the approved VPS release runs all registered checks against the demo tenants and the final baseline reset succeeds.
