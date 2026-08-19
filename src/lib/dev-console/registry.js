// Register customer features only after both the feature and its monitor exist.
export const FEATURE_CATALOG = Object.freeze([
  {
    key: "test_blank_tab",
    name: "Test blank tab",
    addedAt: "2026-08-17",
    defaultCustomerEnabled: false,
  },
]);

const COOP = "$coop";
const AUDIT_ORG = "$auditOrg";

export const MONITOR_TESTS = Object.freeze([
  { key: "public-home", name: "System - Production application reachable", group: "System", kind: "page", path: "/" },
  { key: "normal-signin", name: "Authentication - Normal sign-in page", group: "Authentication", kind: "page", path: "/signinpage" },
  { key: "test-blank-tab-demo", featureKey: "test_blank_tab", name: "Test feature - Demo cooperative receives blank tab", group: "Feature rollout", kind: "api", role: "coopadmin", path: `/api/features?coopId=${COOP}`, expectedStatus: 200, assertions: [{ path: "features.test_blank_tab", equals: true }] },
  ...[
    ["coopadmin", "Coop admin"], ["member", "Member"], ["org_admin", "Audit organisation admin"],
    ["auditer", "Auditor"], ["aud_E", "Sub-auditor"],
  ].map(([role, label]) => ({ key: `${role}-login`, name: `Authentication - ${label} login and session`, group: "Authentication", kind: "role-login", role })),

  { key: "baseline-coop", name: "Demo data - Cooperative settings and isolation marker", group: "Demo baseline", kind: "document", collectionId: "683f21190030cfd38fce", documentId: COOP, expected: { sharePrice: 100, status: "active", RegNumber: "GnR DEMO 1001" } },
  { key: "baseline-active-member", name: "Members - Active member has three shares", group: "Members", kind: "document", collectionId: "6a0df06a00300d947887", documentId: "demo_bea_membership_active", expected: { coopId: COOP, userId: "demo_bea_member_active", status: "Active", shares: 3 } },
  { key: "baseline-zero-share", name: "Members - Active zero-share member remains a member", group: "Members", kind: "document", collectionId: "6a0df06a00300d947887", documentId: "demo_bea_membership_zero", expected: { coopId: COOP, userId: "demo_bea_member_zero", status: "Active", shares: 0 } },
  { key: "baseline-former-member", name: "Members - Former member has no shares", group: "Members", kind: "document", collectionId: "6a0df06a00300d947887", documentId: "demo_bea_membership_former", expected: { coopId: COOP, userId: "demo_bea_member_former", status: "Former", shares: 0 } },
  { key: "baseline-kyc-verified", name: "KYC - Verified member baseline", group: "KYC", kind: "document", collectionId: "69d40812002f183fd39b", documentId: "demo_bea_kyc_active", expected: { coopId: COOP, userId: "demo_bea_member_active", kycStatus: "VERIFIED" } },
  { key: "baseline-kyc-pending", name: "KYC - Pending member baseline", group: "KYC", kind: "document", collectionId: "69d40812002f183fd39b", documentId: "demo_bea_kyc_pending", expected: { coopId: COOP, userId: "demo_bea_member_kyc", kycStatus: "PENDING" } },
  { key: "baseline-transaction", name: "Shares - Verified purchase baseline", group: "Shares and transactions", kind: "document", collectionId: "683f2692002574988b87", documentId: "demo_bea_tx_initial", expected: { coopId: COOP, memberId: "demo_bea_member_active", shares: 3, price: 300, transactionType: "purchase", verificationStatus: "verified", havePaid: true } },
  { key: "baseline-ledger", name: "Reports - Paid share-ledger baseline", group: "Reports", kind: "document", collectionId: "6a0b5e0f0000f09d48d2", documentId: "demo_bea_ledger_initial", expected: { coopId: COOP, memberId: "demo_bea_member_active", memberNumber: "BEA-DEMO-0001", shares: 3, paymentStatus: "PAID", sign: "CREDIT" } },
  { key: "baseline-assembly", name: "Assemblies - Upcoming assembly baseline", group: "Assemblies", kind: "document", collectionId: "assemblies", documentId: "demo_bea_assembly_upcoming", expected: { coopId: COOP, status: "scheduled", agendaCount: 3 } },
  { key: "baseline-audit-org", name: "Audit - Demo audit organisation baseline", group: "Audit", kind: "document", collectionId: "6a14759100231d14797c", documentId: AUDIT_ORG, expected: { publicId: AUDIT_ORG } },

  { key: "anonymous-kyc-denied", name: "Permissions - Anonymous KYC access denied", group: "Permissions", kind: "api", path: `/api/member/kyc-status?coopId=${COOP}`, expectedStatus: 401 },
  { key: "anonymous-members-denied", name: "Permissions - Anonymous member register access denied", group: "Permissions", kind: "api", path: `/api/coop-r-member/members-of-coop?coopId=${COOP}`, expectedStatus: 401 },
  { key: "member-admin-register-denied", name: "Permissions - Member cannot access admin member register", group: "Permissions", kind: "api", role: "member", path: `/api/coop-r-member/members-of-coop?coopId=${COOP}`, expectedStatus: 403 },
  { key: "member-other-transactions-denied", name: "Tenant isolation - Member cannot read another member's transactions", group: "Tenant isolation", kind: "api", role: "member", path: "/api/transaction/by-member?memberId=demo_bea_member_zero", expectedStatus: 403 },
  { key: "admin-foreign-coop-denied", name: "Tenant isolation - Coop admin cannot read a foreign cooperative", group: "Tenant isolation", kind: "api", role: "coopadmin", path: "/api/transaction/by-coop?coopId=demo_foreign_cooperative", expectedStatus: 403 },
  { key: "coopadmin-orgadmin-denied", name: "Role isolation - Coop admin cannot use audit organisation administration", group: "Permissions", kind: "api", role: "coopadmin", path: `/api/orgadmin/coops?orgId=${AUDIT_ORG}`, expectedStatus: 403 },

  { key: "member-kyc-status", name: "KYC - Member sees verified status for current cooperative", group: "KYC", kind: "api", role: "member", path: `/api/member/kyc-status?coopId=${COOP}`, expectedStatus: 200, assertions: [{ path: "success", equals: true }, { path: "kycStatus", equals: "VERIFIED" }] },
  { key: "admin-active-members", name: "Members - Admin register contains active and zero-share members", group: "Members", kind: "api", role: "coopadmin", path: `/api/coop-r-member/members-of-coop?coopId=${COOP}`, expectedStatus: 200, assertions: [{ path: "members", some: { userId: "demo_bea_member_active", totalShares: 3 } }, { path: "members", some: { userId: "demo_bea_member_zero", totalShares: 0 } }] },
  { key: "admin-former-members", name: "Members - Former-member register is correct", group: "Members", kind: "api", role: "coopadmin", path: `/api/coop-r-member/former-members?coopId=${COOP}`, expectedStatus: 200, assertions: [{ path: "members", some: { userId: "demo_bea_member_former", status: "Former" } }] },
  { key: "member-own-transactions", name: "Transactions - Member sees their verified purchase", group: "Shares and transactions", kind: "api", role: "member", path: "/api/transaction/by-member?memberId=demo_bea_member_active", expectedStatus: 200, assertions: [{ path: "transactions.documents", some: { $id: "demo_bea_tx_initial", shares: 3 } }] },
  { key: "admin-coop-transactions", name: "Transactions - Admin sees only cooperative transactions", group: "Shares and transactions", kind: "api", role: "coopadmin", path: `/api/transaction/by-coop?coopId=${COOP}`, expectedStatus: 200, assertions: [{ path: "transactions.documents", some: { $id: "demo_bea_tx_initial", coopId: COOP } }] },
  { key: "admin-assemblies", name: "Assemblies - Admin sees seeded assembly", group: "Assemblies", kind: "api", role: "coopadmin", path: `/api/assembly?coopId=${COOP}`, expectedStatus: 200, assertions: [{ path: "assemblies", some: { id: "demo_bea_assembly_upcoming", coopId: COOP } }] },
  { key: "member-documents", name: "Documents - Member can read cooperative document list", group: "Documents", kind: "api", role: "member", path: `/api/coops/${COOP}/docs`, expectedStatus: 200 },
  { key: "admin-documents", name: "Documents - Admin can read cooperative document registry", group: "Documents", kind: "api", role: "coopadmin", path: `/api/coops/docServices?coopId=${COOP}`, expectedStatus: 200, assertions: [{ path: "success", equals: true }] },
  { key: "foreign-documents-denied", name: "Tenant isolation - Member cannot read foreign cooperative documents", group: "Tenant isolation", kind: "api", role: "member", path: "/api/coops/demo_foreign_cooperative/docs", expectedStatus: 403 },
  { key: "share-register", name: "Reports - Share register is generated from the paid ledger", group: "Reports", kind: "api", role: "coopadmin", path: `/api/reports/share-register?coopId=${COOP}&stichtag=2026-08-16`, expectedStatus: 200, assertions: [{ path: "success", equals: true }, { path: "report.meta.coopId", equals: COOP }] },
  { key: "payment-state", name: "Payments - Cooperative payment state is tenant-bound", group: "Payments", kind: "api", role: "coopadmin", path: `/api/payments/coops/${COOP}`, expectedStatus: 200 },
  { key: "stripe-sandbox", name: "Payments - Stripe sandbox credentials and API connectivity", group: "Payments", kind: "stripe-sandbox" },
  { key: "payment-foreign-denied", name: "Tenant isolation - Admin cannot read foreign Stripe state", group: "Tenant isolation", kind: "api", role: "coopadmin", path: "/api/payments/coops/demo_foreign_cooperative", expectedStatus: 403 },
  { key: "payment-invalid-shares", name: "Payments - Invalid checkout quantity is rejected before Stripe", group: "Payments", kind: "api", role: "member", method: "POST", path: "/api/payments/member/purchase", body: { coopId: COOP, shares: 0 }, expectedStatus: 400 },
  { key: "payment-role-denied", name: "Permissions - Coop admin cannot create a member checkout", group: "Permissions", kind: "api", role: "coopadmin", method: "POST", path: "/api/payments/member/purchase", body: { coopId: COOP, shares: 1 }, expectedStatus: 403 },
  { key: "orgadmin-coops", name: "Audit - Organisation admin sees attached demo cooperative", group: "Audit", kind: "api", role: "org_admin", path: `/api/orgadmin/coops?orgId=${AUDIT_ORG}`, expectedStatus: 200, assertions: [{ path: "cooperatives", some: { id: COOP } }] },
  { key: "auditor-assignment", name: "Audit - Lead auditor sees assigned demo cooperative", group: "Audit", kind: "api", role: "auditer", path: `/api/auditor/coops?orgId=${AUDIT_ORG}`, expectedStatus: 200, assertions: [{ path: "cooperatives", some: { id: COOP } }] },
  { key: "subauditor-assignment", name: "Audit - Sub-auditor sees assigned demo cooperative", group: "Audit", kind: "api", role: "aud_E", path: `/api/auditor/coops?orgId=${AUDIT_ORG}`, expectedStatus: 200, assertions: [{ path: "cooperatives", some: { id: COOP } }] },
  { key: "auditor-history", name: "Audit - Assigned auditor can read demo audit history", group: "Audit", kind: "api", role: "auditer", path: `/api/auditServices/auditHistory/${COOP}`, expectedStatus: 200, assertions: [{ path: "success", equals: true }] },
  { key: "member-audit-history-denied", name: "Permissions - Member cannot read audit history", group: "Permissions", kind: "api", role: "member", path: `/api/auditServices/auditHistory/${COOP}`, expectedStatus: 403 },

  { key: "transaction-validation", name: "Transactions - Invalid share quantity is rejected", group: "Validation", kind: "api", role: "member", method: "POST", path: "/api/transaction", body: { transactionType: "purchase", coopId: COOP, shares: 0, buyFor: "self", metadata: "demo-monitor" }, expectedStatus: 400 },
  { key: "transaction-create", name: "Transactions - Member can create a valid purchase proposal", group: "Shares and transactions", kind: "api", role: "member", method: "POST", path: "/api/transaction", body: { transactionType: "purchase", coopId: COOP, shares: 1, buyFor: "own", metadata: "demo-monitor" }, expectedStatus: 200, assertions: [{ path: "success", equals: true }, { path: "transaction.memberId", equals: "demo_bea_member_active" }, { path: "transaction.verificationStatus", equals: "pending" }] },
  { key: "assembly-validation", name: "Assemblies - Invalid assembly is rejected", group: "Validation", kind: "api", role: "coopadmin", method: "POST", path: "/api/assembly", body: { coopId: COOP }, expectedStatus: 400 },
  { key: "assembly-create", name: "Assemblies - Admin can create a draft", group: "Assemblies", kind: "api", role: "coopadmin", method: "POST", path: "/api/assembly", body: { coopId: COOP, title: "Automated monitoring draft", status: "draft", agendaItems: [], attendance: [] }, expectedStatus: 200, assertions: [{ path: "success", equals: true }, { path: "assembly.coopId", equals: COOP }, { path: "assembly.title", equals: "Automated monitoring draft" }] },
  { key: "member-create-assembly-denied", name: "Permissions - Member cannot create an assembly", group: "Permissions", kind: "api", role: "member", method: "POST", path: "/api/assembly", body: { coopId: COOP, title: "Forbidden draft", status: "draft", agendaItems: [], attendance: [] }, expectedStatus: 403 },
  { key: "onboarding-workflow", name: "Onboarding - Invitation, acceptance and exact share update", group: "Onboarding", kind: "onboarding-workflow" },
  { key: "document-links-workflow", name: "Documents - Admin update is visible to member and remains tenant-bound", group: "Documents", kind: "workflow", steps: [
    { kind: "api", role: "coopadmin", method: "PATCH", path: `/api/coops/${COOP}/docs`, body: { documentIds: ["https://demo.coop-pilot.test/documents/monitoring.pdf"] }, expectedStatus: 200 },
    { kind: "api", role: "member", path: `/api/coops/${COOP}/docs`, expectedStatus: 200, assertions: [{ path: "documents", some: "https://demo.coop-pilot.test/documents/monitoring.pdf" }] },
  ] },
  { key: "kyc-review-validation", name: "KYC - Invalid review action is rejected", group: "Validation", kind: "api", role: "coopadmin", method: "PATCH", path: "/api/coop-admin/kyc-applications/review", body: { coopId: COOP, userId: "demo_bea_member_kyc", action: "invalid" }, expectedStatus: 400 },
  { key: "member-kyc-review-denied", name: "Permissions - Member cannot review KYC", group: "Permissions", kind: "api", role: "member", method: "PATCH", path: "/api/coop-admin/kyc-applications/review", body: { coopId: COOP, userId: "demo_bea_member_kyc", action: "accept" }, expectedStatus: 403 },
  { key: "kyc-review-workflow", name: "KYC - Admin approval updates the correct cooperative application", group: "KYC", kind: "workflow", steps: [
    { kind: "api", role: "coopadmin", method: "PATCH", path: "/api/coop-admin/kyc-applications/review", body: { coopId: COOP, userId: "demo_bea_member_kyc", action: "accept" }, expectedStatus: 200, assertions: [{ path: "success", equals: true }] },
    { kind: "document", collectionId: "69d40812002f183fd39b", documentId: "demo_bea_kyc_pending", expected: { coopId: COOP, userId: "demo_bea_member_kyc", kycStatus: "VERIFIED", resubmissionRequested: false } },
  ] },
  { key: "vote-workflow", name: "Voting - Attendance, single vote count and duplicate rejection", group: "Voting", kind: "vote-workflow" },
  { key: "read-concurrency", name: "Concurrency - Parallel member-register reads remain consistent", group: "Concurrency", kind: "parallel-api", role: "coopadmin", path: `/api/coop-r-member/members-of-coop?coopId=${COOP}`, requests: 8, expectedStatus: 200, assertions: [{ path: "members", some: { userId: "demo_bea_member_active", totalShares: 3 } }] },
]);

export function testsForFeature(featureKey) {
  return MONITOR_TESTS.filter((test) => test.featureKey === featureKey);
}

export function findMonitorTest(testKey) {
  if (testKey === "demo-baseline-reset") return { key: testKey, name: "Demo environment - Baseline reset", kind: "reset" };
  return MONITOR_TESTS.find((test) => test.key === testKey);
}
