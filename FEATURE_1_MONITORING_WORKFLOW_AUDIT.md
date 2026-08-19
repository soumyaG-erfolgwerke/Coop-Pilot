# Feature 1: Production Monitoring Accounts and Workflow Audit Register

## Purpose

This document records the code-specific workflow problems, business decisions, and test requirements that must be addressed when designing the production demo tenants and monitoring accounts.

It does not authorize or implement any code, configuration, database, infrastructure, or production change.

## Agreed release process

```text
Development and automated testing
    -> Production demo accounts
    -> Internal approval
    -> All real customer accounts
```

There is no pilot-customer stage.

## Classification

Every audit item should use one of these classifications:

- **CONFIRMED PROBLEM:** Current code can produce an inconsistent, unsafe, or contradictory result.
- **BUSINESS DECISION REQUIRED:** The current behavior is identifiable, but management, legal, compliance, or accounting must approve the intended rule.
- **POINT TO TEST:** The ordinary flow may work, but failure, concurrency, volume, legacy data, or role variations must be tested.
- **CURRENTLY CORRECT:** The reviewed behavior matches the presently understood requirement and still needs regression coverage.

## Monitoring identities

The production monitoring accounts are normal role accounts, not privileged or superuser accounts.

| Monitoring identity | What it tests | Tenant access |
|---|---|---|
| Demo cooperative administrator | Cooperative administration, members, shares, transactions, assemblies, documents, reports, and audit submissions | Demo cooperative only |
| Demo member | Member onboarding, KYC, purchases, documents, notices, assemblies, voting, proxies, and cancellation | Own permitted data in demo cooperative |
| Demo audit-organisation administrator | Audit organisation, team management, assignments, portfolio, deadlines, issues, and reports | Demo audit organisation only |
| Demo lead auditor | Assigned audits, review, findings, comments, deadlines, and reports | Assigned demo audits only |
| Demo sub-auditor | Restricted and assigned audit work | Specifically assigned demo audits only |
| Automation identities | Daily smoke checks for the same role workflows | Demo tenants only |

Platform-superadmin testing remains separate. Monitoring identities must never receive superuser access or access to real customer tenants.

# Confirmed problems

## CP-01: Completed payout does not complete membership exit

**Area:** Membership cancellation and payouts  
**Affected roles:** Member and cooperative administrator  
**Code:** `src/app/api/coop-r-member/pending-payouts/route.js`

### Scenario

1. An active member requests cancellation.
2. Membership changes to `NoticeGiven`.
3. An administrator finalises the payout.

### Current behavior

The payout is marked paid and a debit ledger entry is created, but the membership is not changed to `Former`, shares are not cleared, and the final exit is not added to membership history.

### Consequence

The person can remain `NoticeGiven` with their previous shares after the exit payment is completed.

### Expected rule

The approved finalisation operation should atomically update the payout, ledger, membership status, share balance, exit date, and history.

### Monitoring test

Complete a demo payout and confirm the resulting member status, shares, history, ledger entry, permissions, and former-member listing.

---

## CP-02: Purchase during cancellation can reactivate membership without cancelling payout

**Area:** Share purchase and cancellation  
**Affected roles:** Member and cooperative administrator  
**Code:** `src/app/api/coop-r-member/route.js`, `src/app/api/transaction/[id]/pay/route.js`, and the Stripe membership-activation workflow

### Scenario

```text
Active member with 10 shares
    -> cancellation requested
    -> pending payout created for 10 shares
    -> member purchases 2 shares
```

### Current behavior

`NoticeGiven` is accepted as an existing membership. Successful purchase adds shares and changes the membership back to `Active`, but the pending payout is not cancelled.

### Consequence

The member may be active with 12 shares while a payout for 10 shares remains payable.

### Expected rule

Management must choose whether purchases are blocked during cancellation or require an explicit withdrawal of cancellation. A purchase must not silently leave contradictory membership and payout states.

### Monitoring test

Attempt a purchase during `NoticeGiven` and verify the approved behavior, pending-payout state, membership history, share balance, and notifications.

---

## CP-03: Payment can automatically verify KYC

**Area:** KYC and membership activation  
**Affected roles:** Member and cooperative administrator  
**Code:** `src/app/api/payments/webhooks/connect/snapshot/processMembershipActivation.js`

### Current behavior

For a pending first-time member, successful payment creates a KYC application with `kycStatus: VERIFIED` and `reviewerId: system`.

### Consequence

Payment confirmation may become identity approval even when no authorised reviewer inspected the KYC document.

### Expected rule

If manual KYC approval is required, payment and KYC must be independent prerequisites:

```text
Payment confirmed + KYC approved + membership application approved
    -> Active membership
```

### Monitoring test

Confirm that payment alone cannot activate membership unless automatic KYC verification is explicitly approved policy.

---

## CP-04: Transaction is marked paid before membership activation completes

**Area:** Payments and failure recovery  
**Affected roles:** Member, cooperative administrator, and automation  
**Code:** `src/app/api/payments/webhooks/connect/snapshot/processMembershipActivation.js`

### Current behavior

The transaction is marked paid before KYC creation, membership-number generation, PDF generation, file upload, membership activation, and email delivery finish.

### Consequence

A later failure can leave a paid transaction with a pending or partially activated membership. A retry may skip required steps because the transaction already appears paid.

### Expected rule

Use a durable, idempotent step-based activation workflow capable of safely resuming incomplete work.

### Monitoring test

Simulate failure after each activation step and confirm that a retry completes exactly once without duplicating KYC, shares, PDFs, member numbers, ledger entries, or emails.

---

## CP-05: Membership-number generation is vulnerable to concurrency

**Area:** Member activation  
**Affected roles:** Member and cooperative administrator  
**Code:** `src/app/api/payments/webhooks/connect/snapshot/processMembershipActivation.js`

### Current behavior

The next membership number is derived from the current verified-member count plus one.

### Consequence

Two simultaneous activations can calculate the same number.

### Expected rule

Membership numbers require an atomic sequence, unique constraint, or conflict retry.

### Monitoring test

Activate multiple synthetic members concurrently and confirm every membership number is unique and stable.

---

## CP-06: Payout creation is not atomic

**Area:** Cancellation  
**Affected roles:** Member  
**Code:** `src/app/api/coop-r-member/pending-payouts/route.js`

### Current behavior

The system creates the payout first and then updates membership documents to `NoticeGiven`.

### Consequence

If one update fails, a payout can exist while one or more membership records remain active.

### Expected rule

The operation needs rollback, durable orchestration, or a recoverable intermediate state.

### Monitoring test

Force failure after payout creation and verify that the system rolls back or completes safely on retry.

---

## CP-07: Payout finalisation is not atomic

**Area:** Payout and ledger  
**Affected roles:** Cooperative administrator  
**Code:** `src/app/api/coop-r-member/pending-payouts/route.js`

### Current behavior

The payout is marked finalised before the ledger record is created.

### Consequence

If ledger creation fails, the payout is already final and a normal retry is rejected.

### Expected rule

Finalisation must be idempotent and recoverable, with one authoritative operation identifier.

### Monitoring test

Force ledger failure and confirm that retry produces exactly one final payout and one ledger debit.

---

## CP-08: Duplicate payout requests can race

**Area:** Cancellation concurrency  
**Affected roles:** Member  
**Code:** `src/app/api/coop-r-member/pending-payouts/route.js`

### Current behavior

The system checks for a pending payout and then creates one as a separate operation.

### Consequence

Two simultaneous requests may both pass the check and create duplicate payouts.

### Expected rule

Use a unique active-payout key, deterministic ID, or atomic idempotency mechanism.

### Monitoring test

Submit simultaneous cancellation requests and verify that exactly one payout is created.

---

## CP-09: Share-price sources are inconsistent

**Area:** Transactions and payments  
**Affected roles:** Member and cooperative administrator  
**Code:** `src/app/api/transaction/route.js` and `src/app/api/payments/member/purchase/route.js`

### Current behavior

Some paths use `share_price_cents` from merged settings; another uses the legacy cooperative `sharePrice` field.

### Consequence

Proposal, checkout, ledger, payout, and report amounts can differ when the fields are not synchronized.

### Expected rule

Use one canonical integer cents field and record the price applied at transaction creation.

### Monitoring test

Deliberately use different legacy and canonical values in controlled test data and confirm every active workflow uses the approved canonical value.

---

## CP-10: Purchase eligibility differs between implementations

**Area:** Transactions and membership  
**Affected roles:** Member  
**Code:** Legacy transaction, membership, and Stripe purchase routes

### Current behavior

Different purchase paths accept different membership statuses. One permits `NoticeGiven`; another queries only `Active` and `pending`.

### Consequence

The same person can be accepted or rejected depending on which route the UI uses.

### Expected rule

One canonical purchase service must enforce one approved status policy.

### Monitoring test

Run the purchase action from every active UI entry point for each membership status.

---

## CP-11: Assembly transitions are allowlisted but not transition-controlled

**Area:** Assemblies  
**Affected roles:** Cooperative administrator and members  
**Code:** `src/app/api/assembly/route.js`

### Current behavior

The endpoint checks whether a requested status is known but does not enforce which previous states may move to it.

### Consequence

Terminal or discarded assemblies may potentially return to draft, upcoming, or live.

### Expected rule

Approve and enforce a directed state-transition table.

### Monitoring test

Test every allowed and forbidden source-state/destination-state pair.

---

## CP-12: Status update can accidentally mark an assembly cancelled

**Area:** Assemblies  
**Affected roles:** Cooperative administrator and members  
**Code:** `src/app/api/assembly/route.js`

### Current behavior

The code calculates `wasCancelled` as the inverse of `isLive`. If `isLive` is omitted, the result becomes true.

### Consequence

A normal status update may mark an assembly cancelled unintentionally.

### Expected rule

Cancellation must be an explicit transition or command.

### Monitoring test

Update each non-cancellation field and confirm `wasCancelled` remains unchanged.

---

## CP-13: Attendance timing enforcement is disabled

**Area:** Assembly attendance  
**Affected roles:** Member  
**Code:** `src/app/api/assembly/attendance/route.js`

### Current behavior

The code contains a timing check, but it is commented out.

### Consequence

Attendance may be changed after the intended registration period.

### Expected rule

Approve when attendance opens, closes, and may be corrected, then enforce it server-side.

### Monitoring test

Attempt attendance changes before invitation, before start, while live, after closure, and after archival.

---

## CP-14: Member can select proxy attendance without a valid proxy record

**Area:** Attendance and proxies  
**Affected roles:** Member  
**Code:** `src/app/api/assembly/attendance/route.js`

### Current behavior

The member endpoint accepts `proxy` as an attendance status and accepts a proxy-holder text value without requiring an active proxy appointment.

### Consequence

Attendance and represented-member counts can claim a proxy that does not exist.

### Expected rule

Proxy attendance must be derived from a valid active proxy record.

### Monitoring test

Attempt to select proxy status without an appointment, with a revoked appointment, and with an expired appointment.

---

## CP-15: Assembly attendance snapshots trust client-provided identity and shares

**Area:** Assembly creation and editing  
**Affected roles:** Cooperative administrator and members  
**Code:** `src/app/api/assembly/route.js`

### Current behavior

Attendance rows can contain client-supplied member name, email, status, and share count.

### Consequence

An altered or stale request can produce incorrect attendance or voting weight.

### Expected rule

Resolve eligibility, identity, and share weight from authoritative server records. If a legally required snapshot is needed, the server should create it.

### Monitoring test

Submit altered identity/share values and confirm the server ignores or rejects them.

---

## CP-16: Assembly editing destructively replaces attendance without atomicity

**Area:** Assemblies  
**Affected roles:** Cooperative administrator and members  
**Code:** `src/app/api/assembly/route.js`

### Current behavior

The update deletes existing attendance records and then recreates the submitted list.

### Consequence

A failure during recreation can lose attendance data. The 500-row query limit can also leave additional old rows untouched.

### Expected rule

Use validated upserts and explicit deletions with rollback/versioning rather than delete-all-and-recreate.

### Monitoring test

Force failure during replacement and test assemblies with more than 500 attendance rows.

---

## CP-17: Quorum result is partially caller-supplied

**Area:** Quorum  
**Affected roles:** Cooperative administrator and members  
**Code:** `src/app/api/assembly/[assemblyId]/quorumUpdate/route.js`

### Current behavior

The endpoint accepts `quorumValue` and `isQuorumMet` from the request.

### Consequence

The stored outcome may not be independently derived from authoritative attendance and cooperative settings.

### Expected rule

The server should calculate the percentage and Boolean result from the approved quorum formula.

### Monitoring test

Send a deliberately contradictory percentage and Boolean and confirm the server derives the correct result.

---

## CP-18: Assembly stores a single proxy reference although many proxies can exist

**Area:** Proxies  
**Affected roles:** Member and cooperative administrator  
**Code:** `src/app/api/assembly/proxy/route.js`

### Current behavior

Every new proxy writes a single `proxyTableId` on the assembly, overwriting the previous value.

### Consequence

The assembly-level reference cannot accurately represent multiple proxies.

### Expected rule

Proxy records should be queried by assembly ID; the assembly should store only aggregate information if necessary.

### Monitoring test

Create several valid proxies and confirm all remain accessible, revocable, and correctly counted.

---

## CP-19: Proxy creation is not atomic

**Area:** Proxies and attendance  
**Affected roles:** Member  
**Code:** `src/app/api/assembly/proxy/route.js`

### Current behavior

Proxy creation updates the proxy record, assembly, attendance row, and attendance summary through separate operations.

### Consequence

A partial failure can leave contradictory proxy and attendance records.

### Expected rule

The workflow must be idempotent and recoverable with rollback or durable orchestration.

### Monitoring test

Force failure after each individual write and verify recovery.

---

## CP-20: Normal login can take precedence over proxy voting identity

**Area:** Proxy voting  
**Affected roles:** Member and proxy holder  
**Code:** `src/lib/auth/vote-access.js`

### Current behavior

The server resolves a normal application session before checking the proxy session. A logged-in proxy holder may therefore be resolved as themselves rather than the represented member.

### Consequence

The wrong voting identity may be used or the proxy vote may be rejected unexpectedly.

### Expected rule

Voting must use an explicit, server-validated `actingAs` context bound to the poll and assembly.

### Monitoring test

Test proxy voting while logged out, logged in as the proxy holder, and logged in as an unrelated member.

---

## CP-21: Vote locking protects only one application process

**Area:** Voting concurrency  
**Affected roles:** Member and proxy holder  
**Code:** `src/app/api/vote/cast/route.js`

### Current behavior

An in-memory JavaScript map serialises votes only inside one running Node.js process.

### Consequence

Multiple processes, serverless workers, restarts, or horizontally scaled instances can still race and overwrite votes.

### Expected rule

Use immutable per-voter vote records with a database-enforced unique poll/voter key or another shared atomic mechanism.

### Monitoring test

Submit concurrent votes through different application workers and verify one accepted vote per authorised voter.

---

## CP-22: Voting does not clearly enforce containing assembly state

**Area:** Voting  
**Affected roles:** Member and proxy holder  
**Code:** `src/app/api/vote/cast/route.js`

### Current behavior

Vote casting checks poll state and expiry but does not independently confirm that the containing assembly is live.

### Consequence

A poll accidentally left open may remain votable after assembly closure.

### Expected rule

Both poll and assembly must be in an approved voting state.

### Monitoring test

Leave a poll live, close the assembly, and verify that voting is rejected.

---

## CP-23: Role names and account types are fragmented

**Area:** Authentication and authorisation  
**Affected roles:** All roles

### Current behavior

The code contains multiple role names, including:

- `superuser`
- `superadmin`
- `org_admin`
- `coopadmin`
- `auditer`
- `auditor`
- `aud_E`
- `teamMember`
- `member`
- `proxy`

### Consequence

Different endpoints can interpret the same person differently, causing incorrect access or operational lockout.

### Expected rule

Approve a canonical role dictionary and migration mapping. Server authorisation should use canonical internal values.

### Monitoring test

Run a role-by-route-by-tenant matrix using every canonical role and verify foreign-tenant denial.

---

## CP-24: Status capitalization and spelling are inconsistent

**Area:** Cross-cutting data model  
**Affected roles:** All roles

### Examples

- `Active` and `active`
- `NoticeGiven` and `noticegiven`
- Multiple auditor spellings
- Multiple audit resubmission spellings

### Consequence

Records can disappear from queries or be treated differently by permissions and lifecycle logic.

### Expected rule

Use canonical stored enums, normalize historical data, and reject unknown values.

### Monitoring test

Seed controlled legacy variants and verify migration/compatibility behavior.

---

## CP-25: Duplicate legacy and current workflows remain

**Area:** Architecture and maintenance  
**Affected roles:** All roles

### Known duplicate areas

- Cooperative-admin signup
- Transactions
- Membership activation
- Mail
- Pages and routing
- Auditor naming
- KYC workflows

### Consequence

A correction can be applied to one route while another active route retains old behavior.

### Expected rule

Identify the active consumer, select one canonical implementation, migrate callers, and disable or redirect obsolete paths.

### Monitoring test

Inventory every UI, email link, webhook, bookmark-compatible route, and background integration before removing legacy paths.

# Business decisions required

## BD-01: Minimum shares for membership

Decide whether every active member must always own at least one share and whether zero-share imported members are permitted.

## BD-02: Purchase during notice period

Decide whether a `NoticeGiven` member may purchase shares and whether this withdraws cancellation.

## BD-03: Exit completion

Define the exact event that moves `NoticeGiven` to `Former`: exit date, administrative approval, payout completion, or a combination.

## BD-04: Former-member re-entry

Decide whether re-entry always requires a new application, fresh KYC, new membership number, and new minimum-share purchase.

## BD-05: KYC approval

Decide who may approve/reject KYC, whether automatic approval is ever allowed, whether KYC expires, and whether approved documents may be replaced or deleted.

## BD-06: Payment reversal

Define what refund, dispute, chargeback, failed debit, or reversed payment does to transaction, shares, membership, KYC, reports, and notifications.

## BD-07: Exit valuation

Approve whether payout uses nominal share value, paid-in capital, book value, historical acquisition value, year-end settlement value, or another accounting calculation.

## BD-08: Cumulative share limits

Confirm whether minimum and maximum share rules apply per purchase or to total settled plus pending holdings.

## BD-09: Membership access after notice or exit

Define what `NoticeGiven` and `Former` members may see or do, including documents, reports, assemblies, voting, transaction history, and personal records.

## BD-10: Assembly lifecycle

Approve who may invite, open, postpone, cancel, close, archive, correct, or reopen an assembly.

## BD-11: Attendance lifecycle

Define when attendance opens and closes and who may correct attendance after the assembly starts or closes.

## BD-12: Quorum formula

Approve member-based versus share-based rules, eligible statuses, proxies, abstentions, corrections, and override authority.

## BD-13: Voting behavior

Decide whether votes may be changed or withdrawn, when results become visible, which statuses may vote, and whether a vote survives proxy revocation.

## BD-14: Proxy limits and lifecycle

Define who may appoint, revoke, or reassign a proxy, how many appointments one person may hold, and the exact expiry point.

## BD-15: Audit lifecycle

Define who may create, assign, start, submit, review, approve, reject, close, reopen, or revise an audit.

## BD-16: Discrepancy lifecycle

Define edit/delete rules, correction evidence, escalation timing, reopening, resolution authority, and notifications.

## BD-17: Ticket lifecycle

Define assignment, escalation, resolution, closure, reopening, and notification responsibilities.

## BD-18: Document lifecycle

Approve file types, size limits, audiences, replacement, versioning, archiving, retention, and permanent deletion rules.

## BD-19: Invitation lifecycle

Define who may resend, extend, cancel, or reactivate invitations and how existing accounts or cross-cooperative memberships are handled.

## BD-20: Immutable records

Identify which audit, financial, voting, membership, and assembly records must never be edited and must instead receive an amendment or new version.

# Engineering and test concerns

## ET-01: Cumulative share-limit concurrency

Concurrent purchases must not exceed maximum holdings even when each individual request is valid.

## ET-02: Payment webhook replay and ordering

Duplicate, delayed, and out-of-order provider events must result in exactly one approved business transition.

## ET-03: Multi-document failure recovery

Every operation touching multiple collections requires failure injection after each step and safe retry verification.

## ET-04: Large tenants and pagination

Test members, attendance, documents, transactions, audits, notifications, and reports beyond default and explicit query limits, including 100, 500, and larger datasets.

## ET-05: Concurrent voting

Test simultaneous direct and proxy votes, multiple server instances, retries, and network interruption.

## ET-06: Legacy data

Test missing fields, old status spellings, duplicate records, obsolete collection fields, malformed historical JSON, and old secure-file URLs.

## ET-07: Idempotency

Every externally retriable creation or finalisation operation requires an idempotency key and duplicate-request tests.

## ET-08: Reporting reconciliation

Share register, capital summary, transaction screens, membership records, and payout records must agree for the same effective date.

## ET-09: Tenant isolation

For every resource and method, test:

```text
own tenant + correct role
own tenant + wrong role
foreign tenant + same role
foreign tenant + different role
anonymous
forged body/query/cookie identifiers
```

## ET-10: Demo safeguards

Verify that demo tenants cannot trigger real payments, payouts, uncontrolled emails, real invitations, or inclusion in customer/revenue metrics.

## ET-11: Feature flags

Verify that a feature enabled for demo tenants remains unavailable to all real customer tenants until internal approval.

## ET-12: Reset and reseeding

Demo data reset must be deterministic, tenant-scoped, recoverable, and incapable of deleting real customer data.

# Currently correct behavior requiring regression tests

## CC-01: Monitoring accounts are not superusers

Monitoring identities should use ordinary production roles and the same permission paths as customers.

## CC-02: Active member additional purchase does not start a new membership lifecycle

The reviewed membership path appends a purchase for an active member rather than creating a second active membership lifecycle. Cumulative limits and payment consistency still require correction/testing.

## CC-03: Former or rejected membership starts a new lifecycle

The reviewed membership route treats `Former` and `rejected` as a new application lifecycle and requires a new KYC document. This remains subject to approval of BD-04.

## CC-04: Member identity is server-derived in reviewed purchase/vote paths

The hardened routes resolve the acting user from the authenticated session rather than trusting a supplied user ID. This must be maintained across every canonical path.

## CC-05: Foreign-tenant denial is the required default

The existing centralized authorization helpers are designed to validate cooperative, audit-organisation, membership, transaction, assembly, vote, ticket, and file relationships. Every consumer still requires regression coverage.

# Complete monitoring coverage matrix

| Domain | Required successful scenarios | Required negative/edge scenarios |
|---|---|---|
| Authentication | Login and logout for every role | Invalid, expired, revoked, role-less, forged cookie |
| Cooperative admin | Access assigned demo cooperative | Access foreign real cooperative denied |
| Member | Access own records | Other member and foreign cooperative denied |
| Audit organisation | Admin manages own organisation | Foreign organisation denied |
| Auditor | Access assigned audit | Unassigned audit denied |
| Sub-auditor | Perform assigned limited work | Manager-only and unassigned actions denied |
| Member onboarding | Valid manual and CSV onboarding | Duplicate, zero shares, malformed rows, partial failure |
| KYC | Submit, approve, reject, resubmit | Payment-only approval, foreign access, invalid replacement |
| Initial purchase | Minimum valid purchase and activation | Zero, over maximum, failed payment, duplicate webhook |
| Additional purchase | Active member increases holdings | Cumulative maximum, concurrency, stale price |
| Cancellation | Notice and exit-date calculation | Duplicate request, purchase during notice, partial failure |
| Payout | Finalise once and reconcile ledger | Duplicate reference, ledger failure, retry, concurrency |
| Re-entry | Former member starts approved lifecycle | Old KYC reuse and duplicate active membership |
| Assembly | Draft through closure | Invalid reverse transition, accidental cancellation |
| Attendance | Present, absent, valid proxy | Invalid proxy, late change, altered shares, over 500 rows |
| Quorum | Server-derived approved calculation | Contradictory caller values and stale attendance |
| Vote | Direct, abstain, proxy, closure | Duplicate, concurrent, expired, closed assembly, foreign poll |
| Proxy | Create, use, revoke, expire | Self-proxy, duplicate, excessive holdings, identity collision |
| Niederschrift | Generate and finalise | Missing data, repeated finalisation, post-closure editing |
| Documents | Upload, view, share, archive | Spoofed type, malware, oversized, foreign access, deleted source |
| Audit | Create, assign, submit, review, close | Invalid transition, foreign organisation, terminal edit |
| Discrepancy | Create, respond, resolve | Original finding rewrite, unauthorised close/reopen |
| Ticket | Create, comment, assign, close | Comment changes status, foreign access, terminal reopen |
| Notifications | Correct recipient and read state | Foreign recipient, duplicate delivery, missing relation |
| Email | Controlled sink delivery | Real recipient from demo, duplicate, provider failure |
| Reports | Share and capital reconciliation | Date boundaries, legacy records, large volumes |
| Feature flag | Demo-only enablement | Any real tenant visibility before approval |
| Reset | Restore known demo baseline | Cross-tenant deletion or partial reset |

# Release gate

A feature may move from production demo accounts to all real customers only when:

- Its affected roles and workflows are identified.
- Every applicable confirmed problem is fixed or the feature cannot reach it.
- Required business decisions are approved in writing.
- Successful, negative, tenant-isolation, concurrency, and failure-recovery tests pass.
- Demo operations produce no real payment, uncontrolled email, or customer-metric impact.
- Audit logs identify the monitoring actor and demo tenant correctly.
- Internal approval records the feature version, tester, roles, results, limitations, and approval time.
- The feature flag can be disabled safely if post-release monitoring fails.

# Completion boundary

This register provides a comprehensive map of the identifiable current workflows and known code-level concerns. It cannot truthfully guarantee that no unknown future defect exists. Literal closure requires:

1. Approval of every business decision above.
2. Canonical role and status definitions.
3. Consolidation of duplicate implementations.
4. Disposable synthetic tenants and accounts for every role.
5. Automated role-by-tenant-by-object-by-method tests.
6. Controlled concurrency, failure-injection, load, provider, and legacy-data testing.
7. Reconciliation of resulting membership, financial, audit, voting, document, and log records.

