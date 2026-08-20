# CoopPilot development, demo and monitoring handoff

## Purpose

This is the operational handoff for continuing CoopPilot work with another coding agent such as Gemini. Read this document before changing the demo tenants, `/dev` console, monitoring suite, feature flags or VPS deployment workflow.

The repository and the live application remain the source of truth. Never assume that a statement in this document overrides current code, database state or a newer explicit user instruction.

## Current production snapshot

- Public application: `https://monujesh-cooppilot.coopos.cloud`
- Development console: `https://monujesh-cooppilot.coopos.cloud/dev`
- Current verified VPS release at the time of this handoff: `dev-monitor-v18`
- Process manager: PM2 process `monujesh-cooppilot`
- Application port on the VPS: `3101`
- VPS application root: `/home/monujesh/apps/cooppilot`
- Active-release symlink: `/home/monujesh/apps/cooppilot/current`
- Shared production environment: `/home/monujesh/apps/cooppilot/shared/.env.production`
- VPS SSH target: `monujesh@191.218.161.202`
- Local SSH key path: `.private/monujesh_cooppilot_vps_ed25519`
- Local known-hosts path: `.private/known_hosts`

Do not copy passwords, API keys, session secrets, Stripe keys, Appwrite keys or SSH private-key contents into documentation, commits, logs or chat responses. Secrets belong only in the secure production environment or `.private` material already excluded from source control.

## Product decisions already agreed

1. There is no pilot-customer stage.
2. New features are introduced to the dedicated production demo tenants first.
3. After internal testing, the `/dev` Customers switch may expose the feature to real customers.
4. Feature rollout is not automatically locked behind a successful monitor run. The console may warn, but an operator can still enable it.
5. Demo accounts log in through the normal application sign-in page with ordinary role credentials.
6. Demo identities are not superusers and must never enter real customer tenants.
7. Only the password-protected `/dev` console can change feature switches, monitoring settings, issue state or reset demo data.
8. Demo and Customers feature switches are independent.
9. Do not deploy after every edit. Deploy only when the user explicitly says `deploy` or clearly authorizes a release.
10. All displayed operational times use Indian Standard Time (`Asia/Kolkata`).

## Demo identities

The permanent monitoring identities use the same application roles and permission paths as real users:

| Identity | Canonical role | Intended scope |
|---|---|---|
| Demo cooperative administrator | `coopadmin` | Dedicated demo cooperative only |
| Demo member | `member` | Own permitted records in the demo cooperative |
| Demo audit-organisation administrator | `org_admin` | Dedicated demo audit organisation only |
| Demo lead auditor | `auditer` | Assigned demo audits only |
| Demo sub-auditor | `aud_E` | Specifically assigned demo work only |

Credentials are supplied through `DEV_MONITOR_ACCOUNTS_JSON` in the production environment. Do not hardcode or print them. The accounts may be restored, including passwords, only through the allowlisted demo reset operation.

Demo accounts can perform the normal operations of their corresponding real roles. Their important differences are isolation to synthetic tenants, resettable data, Stripe test mode and controlled external side effects.

## Demo baseline data

The baseline represents BürgerEnergie Ammersee eG and includes:

- A dedicated cooperative and cooperative settings/legal parameters.
- A cooperative administrator.
- An active member with three paid shares.
- An active zero-share member, retained deliberately as an edge case.
- A former member with zero shares.
- A member with pending KYC.
- Verified and pending KYC documents/applications.
- A verified initial share purchase and paid share-ledger entry.
- Transaction proposal and share-purchase workflows.
- An upcoming assembly with three agenda items.
- Attendance, direct voting, concurrent voting and duplicate-vote scenarios.
- Cooperative documents, document sharing and report data.
- Member/admin onboarding workflows.
- A dedicated audit organisation, organisation administrator, lead auditor and sub-auditor.
- Audit assignment and history records.
- Tenant-isolation markers and foreign-object denial scenarios.
- Stripe sandbox configuration; no live charge is permitted.

The authoritative baseline is the JSON stored in `DEV_DEMO_BASELINE_JSON`. The fixed tenant identifiers are `DEV_DEMO_COOP_ID` and `DEV_DEMO_AUDIT_ORG_ID`. Never duplicate their production values into source code.

## Reset behavior and safety

Reset code: `src/lib/dev-console/reset.js`

A reset:

1. Reads the fixed demo cooperative and audit-organisation IDs from the environment.
2. Validates that the baseline manifest contains exactly those tenant IDs.
3. Permits writes/deletions only in collections listed in `DEV_DEMO_RESET_COLLECTIONS_JSON`.
4. Rejects cleanup filters other than the fixed `coopId` or `auditOrgId` fields.
5. Deletes temporary demo-tenant records.
6. Restores baseline accounts and documents.
7. Resets account passwords only when explicitly requested by the `/dev` reset route.

Real customer records must remain outside both the tenant allowlist and collection-scoped cleanup. Do not weaken these checks.

Monitoring resets the baseline before a run, around mutation-heavy tests when required, and after the run. The final reset is part of the result; a final-reset failure must create an issue.

## Feature rollout architecture

Primary files:

- Feature/test registry: `src/lib/dev-console/registry.js`
- Persisted console state: `src/lib/dev-console/store.js`
- State model: `src/lib/models/DevConsoleState.model.js`
- Operator console: `src/app/dev/page.jsx`
- Operator feature mutation route: `src/app/api/dev-console/features/[key]/route.js`
- Tenant-safe application feature route: `src/app/api/features/route.js`
- Current cooperative-admin consumer: `src/pages/AdminPage.jsx`

Every release-controlled feature must be registered in `FEATURE_CATALOG` with:

```js
{
  key: "stable_machine_key",
  name: "Human-readable name",
  addedAt: "YYYY-MM-DD",
  defaultCustomerEnabled: false,
}
```

Feature behavior:

- `demoEnabled` controls visibility for the fixed demo cooperative.
- `customerEnabled` controls visibility for real cooperative tenants.
- A new catalog feature defaults to Demo ON and Customers OFF.
- Both values are stored independently in `dev_console_state`.
- The authenticated `/api/features?coopId=...` route verifies that the caller administers the requested cooperative before returning flags.
- The application must fail closed: if feature-state loading fails, the feature stays hidden.
- Hiding a feature must also prevent stale navigation state from keeping its page open.

Current proof feature:

- Key: `test_blank_tab`
- Name: `Test blank tab`
- Demo was verified ON.
- Customers was verified OFF.
- It currently appears only in the cooperative-admin dashboard because that is the role used for the rollout proof.

When implementing a real feature, do not merely hide a navigation link. Protect server routes and mutations with normal role and tenant authorization. Feature flags control release visibility; they do not replace security checks.

## Adding a new feature correctly

1. Implement the feature behind its stable feature key.
2. Identify every affected role and tenant boundary.
3. Add the feature to `FEATURE_CATALOG`, Demo ON and Customers OFF by default.
4. Make client navigation and direct page access respect the flag.
5. Keep API authorization independent from UI visibility.
6. Add at least one named monitoring test with `featureKey` at the same time.
7. Add successful, negative-role and foreign-tenant checks where the feature touches protected data.
8. Run targeted lint and a production build.
9. Deploy only after explicit approval.
10. Run the individual feature monitor on production demo data.
11. Test manually through the relevant demo accounts.
12. Only then use the Customers switch when authorized.

Never place placeholder entries in the Features tab for work that has not been implemented. An entry means an actual feature and its monitor exist.

## Monitoring architecture

Primary files:

- Test definitions: `src/lib/dev-console/registry.js`
- Runtime: `src/lib/dev-console/runtime.js`
- Automatic scheduler: `src/lib/dev-console/scheduler.js`
- Scheduler startup: `src/instrumentation.js`
- Manual/feature monitor route: `src/app/api/dev-console/monitor/route.js`
- Issues: `src/lib/dev-console/store.js` and `src/lib/models/DevIssue.model.js`
- Reset: `src/lib/dev-console/reset.js`
- Internal monitor login proof: `src/lib/dev-console/monitor-auth.js`

The live `MONITOR_TESTS` array is the authoritative test count. Do not quote a hardcoded count without reading it or the latest `/dev` result. At this handoff the full suite contains 56 registered checks: the prior 55 checks plus the blank-tab rollout check.

### Full run lifecycle

1. Reject a second run when one is already active.
2. Select all registered tests, a feature's tests or one issue-verification test.
3. Reset the demo baseline.
4. Log in through normal production authentication for each required demo role.
5. Run named page, API, document, workflow, concurrency and provider-sandbox checks.
6. Reset around mutation-heavy tests to preserve independence.
7. Mark a passing test's existing issue resolved.
8. Open/update an issue when a check fails.
9. Revoke sessions created by monitoring.
10. Perform the final baseline reset.
11. Persist the last-run summary and logs.

### Existing coverage groups

- Production reachability and normal sign-in.
- Login/session checks for all five demo roles.
- Demo cooperative, membership, KYC, transaction, ledger, assembly and audit baselines.
- Anonymous, wrong-role and foreign-tenant denial.
- Member registers, including active zero-share and former-member cases.
- KYC validation, authorization and approval workflow.
- Transactions and share proposal creation.
- Share-register reporting.
- Documents and tenant-bound updates.
- Assembly listing, validation and draft creation.
- Onboarding workflow.
- Voting attendance, exactly-once counting and duplicate rejection.
- Parallel consistency checks.
- Audit organisation, lead-auditor and sub-auditor assignments.
- Stripe sandbox credentials/connectivity and payment authorization boundaries.
- Feature rollout for `test_blank_tab`.

### Monitoring UI requirements

- Current IST clock.
- Auto-monitor ON/OFF and selectable daily IST time.
- Manual `Run full now` button.
- Individual monitoring for newly registered features.
- Progress bar and live logs while running.
- Last-run summary plus `Show logs`/`Hide logs`.
- Issues tab with only Issue name, Time and Status.
- Issue status values are Open or Resolved.
- Resolving an open issue reruns its named test and resolves it only on success.
- Resolved issues remain as history unless an explicit cleanup is requested.

Auto monitoring may be turned off. The scheduler runs at most once per IST date at the configured time and can be disabled globally with `DEV_MONITOR_SCHEDULER_ENABLED=false`.

## What a passing monitor does and does not prove

A pass proves the registered workflows worked against the resettable production demo tenants at that time. It does not prove:

- Every unknown defect is impossible.
- Real Stripe money movement or live banking behavior.
- Real email delivery when mail transport is deliberately excluded.
- Browser CAPTCHA completion by a human.
- Large-tenant performance beyond registered load/concurrency scenarios.
- Every legacy route or historical-data variant.
- Every business rule still awaiting management/legal approval.

New regressions and edge cases must become named tests. Do not claim “everything is solved” solely from a green monitor.

## Issues behavior

- A failed named test creates or refreshes one issue keyed by `testKey`.
- Repeated failures update its latest time instead of creating duplicates.
- Open issues contribute to the red issue count.
- Clicking the status control for an open issue runs only that test.
- The issue changes to Resolved only if that verification passes.
- Do not seed fictional or placeholder issues.
- Do not delete genuine issue history merely to make the dashboard appear clean.

## External-service policy

- Stripe monitoring accepts only `DEV_MONITOR_STRIPE_SECRET_KEY` values beginning with `sk_test_`.
- Never use live Stripe keys or create real charges from demo monitoring.
- CAPTCHA browser and server keys must be a matching pair and the exact production domain must be authorized in TrustCaptcha.
- Do not bypass third-party verification globally. Use provider sandbox/test behavior where available.
- Demo email must use controlled sinks or remain excluded until the mail system is ready; never send uncontrolled mail to real recipients from monitoring.
- IBAN/bank and identity-provider checks should use supported sandbox/test inputs while the remaining application workflow follows production code.

## Environment variables

Required operational variables are documented without values in `.env.example`:

- `DEV_CONSOLE_PASSWORD`
- `DEV_CONSOLE_SESSION_SECRET`
- `DEV_MONITOR_BASE_URL`
- `DEV_MONITOR_SCHEDULER_ENABLED`
- `DEV_MONITOR_ACCOUNTS_JSON`
- `DEV_MONITOR_STRIPE_SECRET_KEY`
- `DEV_MONITOR_INTERNAL_SECRET`
- `DEV_DEMO_COOP_ID`
- `DEV_DEMO_AUDIT_ORG_ID`
- `DEV_DEMO_RESET_COLLECTIONS_JSON`
- `DEV_DEMO_BASELINE_JSON`
- CAPTCHA provider, TrustCaptcha site key and TrustCaptcha API key variables

After changing a `NEXT_PUBLIC_*` variable, rebuild the application; restarting alone does not update browser-bundled values.

## Validation before deployment

At minimum:

```powershell
node node_modules\eslint\bin\eslint.js <changed files>
npm run build
git diff --check
git status -sb
```

Preserve unrelated user changes in the dirty worktree. Never use `git reset --hard`, `git checkout --` or broad deletion to clean the repository.

## VPS deployment workflow

Reusable scripts:

- Local wrapper: `scripts/deploy-monujesh-vps.ps1`
- Remote build/activation orchestrator: `scripts/vps-release-orchestrator.sh`
- Existing VPS preparation helper: `/tmp/vps-prepare-patch-release.sh`
- Existing VPS activation helper: `/tmp/vps-activate-patch-release.sh`

Example from the repository root:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File scripts\deploy-monujesh-vps.ps1 `
  -ReleaseName dev-monitor-v19 `
  -Files src/path/one.js,src/path/two.jsx
```

The wrapper:

1. Validates that every named file is inside the workspace.
2. Creates a minimal patch archive.
3. Resolves the current production release.
4. Uploads the patch and remote orchestrator.
5. Builds a new immutable release copied from the active release.
6. Leaves current traffic untouched if the build fails.
7. Activates the release through the `current` symlink and PM2.
8. Polls the local sign-in endpoint for HTTP 200.

In restricted coding sandboxes, detached child processes may not inherit SSH/network permission. If that happens, run the same archive upload and remote orchestrator directly rather than weakening the script or security controls.

Do not reuse a release name after a partially created release. Increment the release number. Keep the previous release available for rollback.

## Post-deployment verification

1. Confirm `/home/monujesh/apps/cooppilot/current` resolves to the intended release.
2. Confirm PM2 reports `monujesh-cooppilot` online.
3. Confirm local `http://127.0.0.1:3101/signinpage` returns 200.
4. Confirm public `/dev` returns 200.
5. Authenticate to `/dev` without printing the password.
6. Read back feature states.
7. Run the new feature's individual monitor.
8. Confirm passed count equals completed count and open issues are zero for that feature.
9. Manually verify the affected demo role/UI when browser behavior matters.
10. Do not enable Customers unless the user authorizes it.

## Current feature-state expectation

For `test_blank_tab` after v18:

```text
Demo: ON
Customers: OFF
Individual monitor: 1/1 passed
Open issues: 0
```

The `/dev` database state is authoritative if it later differs.

## Known business and engineering concerns

Read `FEATURE_1_MONITORING_WORKFLOW_AUDIT.md` before claiming exhaustive business correctness. It records unresolved or decision-dependent areas including:

- Membership exit and payout atomicity.
- Purchases during a notice/cancellation period.
- Former-member re-entry and fresh KYC policy.
- Payment/KYC independence and webhook recovery.
- Unique membership-number concurrency.
- Canonical share pricing and cumulative share limits.
- Assembly lifecycle, attendance, proxies and quorum.
- Audit/ticket/document lifecycle decisions.
- Legacy routes, role spellings and status normalization.
- Large-tenant pagination, failure injection and idempotency.

Some items may have been fixed after that document was written. Verify current code and tests item by item; do not assume either “all fixed” or “all still broken.”

## Working style for the next agent

1. Restate the requested outcome and whether it authorizes code changes or only discussion.
2. Inspect current files and live state before making claims.
3. Make the smallest safe change that satisfies the business outcome.
4. Keep tenant and role authorization server-side.
5. Add monitoring alongside every feature.
6. Use synthetic demo data only; never inspect or mutate a real customer tenant for troubleshooting.
7. Communicate concise progress during long builds or monitoring runs.
8. Report exact evidence: release, HTTP status, completed/passed/issues and feature flags.
9. State limitations honestly.
10. Never deploy until explicitly authorized.

## Related documents

- `DEV_MONITORING_COVERAGE.md` — coverage explanation; its numeric count may be stale, so use `MONITOR_TESTS` for the current count.
- `FEATURE_1_MONITORING_WORKFLOW_AUDIT.md` — detailed business-rule and edge-case register.
- `.env.example` — environment-variable names and safe placeholders.

