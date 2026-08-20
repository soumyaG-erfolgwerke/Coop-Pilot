import crypto from "crypto";
import { MONITOR_TESTS, findMonitorTest, testsForFeature } from "@/lib/dev-console/registry";
import { openIssue, resolveIssue, saveLastRun } from "@/lib/dev-console/store";
import { resetDemoBaseline } from "@/lib/dev-console/reset";
import { createMonitorAuthProof } from "@/lib/dev-console/monitor-auth";
import { ID, Query } from "node-appwrite";
import Stripe from "stripe";
import { createAdminClient, DATABASE_ID, COLLECTION_ID_ASSEMBLY_ATTENDANCE, COLLECTION_ID_ASSEMBLY_VOTES, COLLECTION_ID_ASSEMBLY_VOTE_CASTS, COLLECTION_ID_COOPXMEMBER, COLLECTION_ID_ONBOARDED_MEMBERS } from "@/lib/appwrite-server";

const RUNTIME_KEY = Symbol.for("coopilot.dev.monitor.runtime");
const runtime = globalThis[RUNTIME_KEY] || { running: false, runId: null, progress: 0, currentTest: null, logs: [], startedAt: null };
globalThis[RUNTIME_KEY] = runtime;
const sessionCache = new Map();
const MUTATING_TESTS = new Set([
  "transaction-create",
  "assembly-create",
  "onboarding-workflow",
  "document-links-workflow",
  "kyc-review-workflow",
  "vote-workflow",
]);

function log(message, level = "info") {
  runtime.logs.push({ time: new Date().toISOString(), level, message });
  runtime.logs = runtime.logs.slice(-200);
}

async function restoreDemoBaseline() {
  let lastError;
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      return await resetDemoBaseline();
    } catch (error) {
      lastError = error;
      if (attempt < 3) await new Promise((resolve) => setTimeout(resolve, attempt * 250));
    }
  }
  throw lastError;
}

export function getMonitorRuntime() {
  return JSON.parse(JSON.stringify(runtime));
}

function baseUrl() {
  return (process.env.DEV_MONITOR_BASE_URL || process.env.NEXT_PUBLIC_BASE_URL || "http://127.0.0.1:3000").replace(/\/$/, "");
}

function accounts() {
  const raw = process.env.DEV_MONITOR_ACCOUNTS_JSON;
  if (!raw) throw new Error("DEV_MONITOR_ACCOUNTS_JSON is not configured");
  try { return JSON.parse(raw); } catch { throw new Error("DEV_MONITOR_ACCOUNTS_JSON contains invalid JSON"); }
}

function demoContext() {
  const coop = process.env.DEV_DEMO_COOP_ID;
  const auditOrg = process.env.DEV_DEMO_AUDIT_ORG_ID;
  if (!coop || !auditOrg) throw new Error("Demo tenant identifiers are not configured");
  return { coop, auditOrg };
}

function expand(value) {
  const context = demoContext();
  if (typeof value === "string") return value.replaceAll("$coop", context.coop).replaceAll("$auditOrg", context.auditOrg);
  if (Array.isArray(value)) return value.map(expand);
  if (value && typeof value === "object") return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, expand(item)]));
  return value;
}

function valueAt(object, path) {
  return String(path || "").split(".").filter(Boolean).reduce((value, key) => value?.[key], object);
}

function sameValue(actual, expected) {
  if (expected && typeof expected === "object" && !Array.isArray(expected)) {
    return Object.entries(expected).every(([key, value]) => sameValue(actual?.[key], value));
  }
  return actual === expected;
}

function assertPayload(payload, assertions = []) {
  for (const rawAssertion of assertions) {
    const assertion = expand(rawAssertion);
    const actual = valueAt(payload, assertion.path);
    if (Object.hasOwn(assertion, "equals") && !sameValue(actual, assertion.equals)) {
      throw new Error(`${assertion.path} expected ${JSON.stringify(assertion.equals)}, received ${JSON.stringify(actual)}`);
    }
    if (assertion.some) {
      if (!Array.isArray(actual) || !actual.some((item) => sameValue(item, assertion.some))) {
        throw new Error(`${assertion.path} did not contain the expected record`);
      }
    }
  }
}

async function loginAs(accountKey, expectedRole = accountKey) {
  if (sessionCache.has(accountKey)) return sessionCache.get(accountKey);
  const account = accounts()[accountKey];
  if (!account?.email || !account?.password) throw new Error(`Demo credentials are missing for account ${accountKey}`);
  const response = await fetch(`${baseUrl()}/api/auth/login`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email: account.email, password: account.password, ...createMonitorAuthProof(account.email) }),
    redirect: "manual",
    signal: AbortSignal.timeout(30_000),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(`Normal login failed for ${accountKey} (HTTP ${response.status})`);
  if (payload?.user?.role !== expectedRole) throw new Error(`Expected role ${expectedRole}, received ${payload?.user?.role || "none"}`);
  const cookie = response.headers.get("set-cookie");
  if (!cookie) throw new Error("Normal login did not return a session cookie");
  const authenticated = { cookie, payload };
  sessionCache.set(accountKey, authenticated);
  return authenticated;
}

async function revokeMonitorSessions() {
  const sessions = [...sessionCache.values()];
  sessionCache.clear();
  await Promise.allSettled(sessions.map(({ cookie }) => fetch(`${baseUrl()}/api/auth/logout`, {
    method: "POST", headers: { cookie }, redirect: "manual", signal: AbortSignal.timeout(20_000),
  })));
}

async function rawApiRequest(test, cookie) {
  const method = test.method || "GET";
  const response = await fetch(`${baseUrl()}${expand(test.path)}`, {
    method,
    headers: { ...(cookie ? { cookie } : {}), ...(method !== "GET" ? { "content-type": "application/json" } : {}) },
    body: method === "GET" ? undefined : JSON.stringify(expand(test.body || {})),
    redirect: "manual",
    signal: AbortSignal.timeout(30_000),
  });
  const payload = await response.json().catch(() => ({}));
  return { status: response.status, payload };
}

async function apiRequest(test, cookie) {
  const { status, payload } = await rawApiRequest(test, cookie);
  if (status !== test.expectedStatus) {
    const detail = payload?.error || payload?.message || payload?.errors?.[0];
    throw new Error(`Expected HTTP ${test.expectedStatus}, received ${status}${detail ? ` (${String(detail).slice(0, 240)})` : ""}`);
  }
  assertPayload(payload, test.assertions);
  return payload;
}

async function runVotingWorkflow() {
  const { databases } = createAdminClient();
  const pollId = ID.unique();
  const voters = [
    { accountKey: "member", userId: "demo_bea_member_active", name: "Demo Active Member", email: "demo.member@coop-pilot.test", shares: 3 },
    { accountKey: "member_zero", userId: "demo_bea_member_zero", name: "Demo Zero Share Member", email: "demo.member-zero@coop-pilot.test", shares: 0 },
    { accountKey: "member_kyc", userId: "demo_bea_member_kyc", name: "Demo KYC Pending Member", email: "demo.member-kyc@coop-pilot.test", shares: 1 },
  ].map((voter) => ({
    ...voter,
    attendanceId: ID.unique(),
    castId: `vote_${crypto.createHash("sha256").update(`${pollId}\0${voter.userId}`).digest("hex").slice(0, 31)}`,
  }));
  const context = demoContext();
  try {
    await Promise.all(voters.map((voter) => databases.createDocument(DATABASE_ID, COLLECTION_ID_ASSEMBLY_ATTENDANCE, voter.attendanceId, {
      assemblyId: "demo_bea_assembly_upcoming", coopId: context.coop, memberId: voter.userId,
      memberName: voter.name, memberEmail: voter.email, status: "present", proxyHolder: "",
      note: "Automated monitoring", shares: voter.shares, updatedAt: new Date().toISOString(),
    })));
    await databases.createDocument(DATABASE_ID, COLLECTION_ID_ASSEMBLY_VOTES, pollId, {
      coopId: context.coop, endTime: new Date(Date.now() + 300_000).toISOString(), title: "Automated monitoring vote",
      description: "Synthetic demo-only vote", isCritical: false, assemblyId: "demo_bea_assembly_upcoming",
      createdAt: new Date().toISOString(), createdBy: "demo_bea_coopadmin", status: "live", votes: [],
      yesVoters: [], noVoters: [], abstainVoters: [], yesCount: 0, noCount: 0, abstainCount: 0,
    });
    const sessions = await Promise.all(voters.map(async (voter) => ({ voter, cookie: (await loginAs(voter.accountKey, "member")).cookie })));
    const attemptDefinitions = [
      ...sessions.map(({ voter, cookie }) => ({ label: voter.accountKey, cookie })),
      ...Array.from({ length: 7 }, (_, index) => ({ label: `member-duplicate-${index + 1}`, cookie: sessions[0].cookie })),
    ];
    const attempts = await Promise.all(attemptDefinitions.map(async ({ label, cookie }) => ({
      label,
      ...(await rawApiRequest({ method: "POST", path: "/api/vote/cast", body: { $id: pollId, selectedOption: 0 } }, cookie)),
    })));
    const accepted = attempts.filter((result) => result.status === 200);
    const duplicates = attempts.filter((result) => result.status === 400 && /already voted/i.test(result.payload?.error || ""));
    if (accepted.length !== 3 || duplicates.length !== 7) {
      throw new Error(`Expected three accepted voters and seven duplicate rejections; received ${accepted.length} and ${duplicates.length}: ${attempts.map((item) => `${item.label}=${item.status}:${item.payload?.error || "ok"}`).join(", ")}`);
    }

    const finalPoll = await databases.getDocument(DATABASE_ID, COLLECTION_ID_ASSEMBLY_VOTES, pollId);
    const casts = await databases.listDocuments(DATABASE_ID, COLLECTION_ID_ASSEMBLY_VOTE_CASTS, [Query.equal("pollId", pollId), Query.limit(10)]);
    const castVoters = new Set(casts.documents.map((cast) => cast.userId));
    if (finalPoll.yesCount !== 3 || casts.total !== 3 || voters.some((voter) => !castVoters.has(voter.userId))) {
      throw new Error(`Concurrent ballot mismatch: yesCount=${finalPoll.yesCount}, casts=${casts.total}, castVoters=${JSON.stringify([...castVoters])}`);
    }
  } finally {
    await Promise.allSettled([
      ...voters.map((voter) => databases.deleteDocument(DATABASE_ID, COLLECTION_ID_ASSEMBLY_VOTE_CASTS, voter.castId)),
      databases.deleteDocument(DATABASE_ID, COLLECTION_ID_ASSEMBLY_VOTES, pollId),
      ...voters.map((voter) => databases.deleteDocument(DATABASE_ID, COLLECTION_ID_ASSEMBLY_ATTENDANCE, voter.attendanceId)),
    ]);
  }
}

async function runOnboardingWorkflow() {
  const { databases } = createAdminClient();
  const onboardingId = ID.unique();
  const context = demoContext();
  try {
    await databases.createDocument(DATABASE_ID, COLLECTION_ID_ONBOARDED_MEMBERS, onboardingId, {
      memberEmail: "demo.member@coop-pilot.test", coopId: context.coop, membershipId: "BEA-DEMO-0001",
      shares: 1, joinedDate: new Date().toISOString(), hasOnboarded: false,
    });
    const cookie = (await loginAs("member")).cookie;
    const available = await apiRequest({ path: "/api/member/onboarding", expectedStatus: 200 }, cookie);
    assertPayload(available, [{ path: "data", some: { $id: onboardingId, coopId: context.coop, shares: 1 } }]);
    const processed = await apiRequest({ method: "POST", path: "/api/member/onboarding", body: { coopIds: [context.coop] }, expectedStatus: 200 }, cookie);
    assertPayload(processed, [{ path: "processedCoops", some: context.coop }]);
    const membership = await databases.getDocument(DATABASE_ID, COLLECTION_ID_COOPXMEMBER, "demo_bea_membership_active");
    if (membership.shares !== 4 || membership.status !== "Active") throw new Error("Onboarding did not add exactly one share to the active membership");
    const invitation = await databases.getDocument(DATABASE_ID, COLLECTION_ID_ONBOARDED_MEMBERS, onboardingId);
    if (invitation.hasOnboarded !== true) throw new Error("Onboarding invitation was not marked as completed");
  } finally {
    await databases.deleteDocument(DATABASE_ID, COLLECTION_ID_ONBOARDED_MEMBERS, onboardingId).catch(() => {});
  }
}

async function runTest(test) {
  if (test.kind === "reset") { await resetDemoBaseline(); return; }
  if (test.kind === "page") {
    const response = await fetch(`${baseUrl()}${test.path}`, { redirect: "manual", signal: AbortSignal.timeout(20_000) });
    if (response.status >= 400) throw new Error(`Page returned HTTP ${response.status}`);
    return;
  }
  if (test.kind === "document") {
    const { databases } = createAdminClient();
    const document = await databases.getDocument(DATABASE_ID, test.collectionId, expand(test.documentId));
    const expected = expand(test.expected || {});
    if (!sameValue(document, expected)) throw new Error("Baseline document did not match expected business data");
    return;
  }
  if (test.kind === "workflow") {
    for (const step of test.steps || []) await runTest(step);
    return;
  }
  if (test.kind === "vote-workflow") {
    await runVotingWorkflow();
    return;
  }
  if (test.kind === "onboarding-workflow") {
    await runOnboardingWorkflow();
    return;
  }
  if (test.kind === "stripe-sandbox") {
    const sandboxKey = process.env.DEV_MONITOR_STRIPE_SECRET_KEY;
    if (!sandboxKey?.startsWith("sk_test_")) throw new Error("Dedicated Stripe monitoring sandbox key is not configured");
    const sandboxStripe = new Stripe(sandboxKey, { maxNetworkRetries: 2 });
    const balance = await sandboxStripe.balance.retrieve();
    if (!Array.isArray(balance.available) || !Array.isArray(balance.pending)) throw new Error("Stripe sandbox returned an invalid balance response");
    return;
  }
  if (test.kind === "api" || test.kind === "parallel-api") {
    const cookie = test.role ? (await loginAs(test.role)).cookie : null;
    if (test.kind === "parallel-api") {
      const payloads = await Promise.all(Array.from({ length: test.requests || 5 }, () => apiRequest(test, cookie)));
      const canonical = JSON.stringify(payloads[0]);
      if (payloads.some((payload) => JSON.stringify(payload) !== canonical)) throw new Error("Parallel responses were inconsistent");
      return;
    }
    await apiRequest(test, cookie);
    return;
  }
  const { cookie } = await loginAs(test.role);
  const session = await fetch(`${baseUrl()}/api/auth/session`, { headers: { cookie }, redirect: "manual", signal: AbortSignal.timeout(20_000) });
  if (!session.ok) throw new Error(`Created session could not be verified (HTTP ${session.status})`);
  if (test.kind === "authenticated-page") {
    const response = await fetch(`${baseUrl()}${test.path}`, { headers: { cookie }, redirect: "manual", signal: AbortSignal.timeout(20_000) });
    if (response.status >= 400) throw new Error(`Authenticated page returned HTTP ${response.status}`);
  }
}

export function startMonitoring({ featureKey, testKey, trigger = "manual" } = {}) {
  if (runtime.running) throw new Error("MONITOR_ALREADY_RUNNING");
  let selected = MONITOR_TESTS;
  if (featureKey) selected = testsForFeature(featureKey);
  if (testKey) selected = [findMonitorTest(testKey)].filter(Boolean);
  if (!selected.length) throw new Error("NO_MONITOR_TESTS");

  runtime.running = true;
  runtime.runId = crypto.randomUUID();
  runtime.progress = 0;
  runtime.currentTest = null;
  runtime.logs = [];
  runtime.startedAt = new Date().toISOString();
  sessionCache.clear();
  const runId = runtime.runId;

  void (async () => {
    const started = Date.now();
    let passed = 0;
    let failed = 0;
    try {
      if (testKey !== "demo-baseline-reset") {
        log("Restoring the demo baseline before monitoring");
        await restoreDemoBaseline();
      }
      for (let index = 0; index < selected.length; index += 1) {
        const test = selected[index];
        runtime.currentTest = test.name;
        log(`Running: ${test.name}`);
        try {
          if (MUTATING_TESTS.has(test.key)) {
            await restoreDemoBaseline();
          }
          await runTest(test);
          passed += 1;
          log(`Passed: ${test.name}`, "success");
          await resolveIssue(test.key);
        } catch (error) {
          failed += 1;
          await openIssue(test);
          log(`Failed: ${test.name} - ${error.message}`, "error");
        } finally {
          if (MUTATING_TESTS.has(test.key)) {
            try {
              await restoreDemoBaseline();
            } catch (error) {
              log(`Could not restore isolation after ${test.name}: ${error.message}`, "error");
            }
          }
        }
        runtime.progress = Math.round(((index + 1) / selected.length) * 100);
      }
    } catch (error) {
      failed += 1;
      const resetTest = { key: "demo-baseline-reset", name: "Demo environment - Baseline reset" };
      await openIssue(resetTest).catch(() => {});
      log(`Monitoring stopped: ${error.message}`, "error");
    } finally {
      await revokeMonitorSessions();
      if (testKey !== "demo-baseline-reset") {
        log("Restoring the demo baseline after monitoring");
        try {
          await restoreDemoBaseline();
        } catch (error) {
          failed += 1;
          await openIssue({ key: "demo-baseline-reset", name: "Demo environment - Baseline reset" }).catch(() => {});
          log(`Final reset failed: ${error.message}`, "error");
        }
      }
      const completedAt = new Date();
      const summary = {
        runId,
        trigger,
        startedAt: runtime.startedAt,
        completedAt: completedAt.toISOString(),
        durationMs: Date.now() - started,
        testsCompleted: passed + failed,
        passed,
        issuesFound: failed,
        testedFeatureKeys: [...new Set(selected.map((test) => test.featureKey).filter(Boolean))],
        logs: runtime.logs.map((entry) => ({ ...entry })),
      };
      await saveLastRun(summary).catch((error) => log(`Could not save summary: ${error.message}`, "error"));
      runtime.running = false;
      runtime.currentTest = null;
      runtime.progress = 100;
      runtime.lastSummary = summary;
    }
  })();

  return { runId };
}
