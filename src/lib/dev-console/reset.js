import { Query } from "node-appwrite";
import { createAdminClient, DATABASE_ID } from "@/lib/appwrite-server";

function parseJsonEnv(name, fallback) {
  const raw = process.env[name];
  if (!raw) return fallback;
  try { return JSON.parse(raw); } catch { throw new Error(`${name} contains invalid JSON`); }
}

function resetConfiguration() {
  const coopId = process.env.DEV_DEMO_COOP_ID;
  const auditOrgId = process.env.DEV_DEMO_AUDIT_ORG_ID;
  const manifest = parseJsonEnv("DEV_DEMO_BASELINE_JSON", null);
  const allowedCollections = new Set(parseJsonEnv("DEV_DEMO_RESET_COLLECTIONS_JSON", []));
  if (!coopId || !auditOrgId || !manifest) throw new Error("Demo reset configuration is incomplete");
  if (manifest.coopId !== coopId || manifest.auditOrgId !== auditOrgId) throw new Error("Demo baseline tenant IDs do not match the fixed allowlist");
  return { coopId, auditOrgId, manifest, allowedCollections };
}

function assertCollectionAllowed(collectionId, allowedCollections) {
  if (!allowedCollections.has(collectionId)) throw new Error(`Reset collection is not allowlisted: ${collectionId}`);
}

export async function resetDemoBaseline({ resetPasswords = false } = {}) {
  const { coopId, auditOrgId, manifest, allowedCollections } = resetConfiguration();
  const { databases, users } = createAdminClient();
  let deleted = 0;
  let restored = 0;

  for (const cleanup of manifest.cleanup || []) {
    assertCollectionAllowed(cleanup.collectionId, allowedCollections);
    if (!['coopId', 'auditOrgId'].includes(cleanup.field)) throw new Error("Reset cleanup must use coopId or auditOrgId");
    const expected = cleanup.field === 'coopId' ? coopId : auditOrgId;
    if (cleanup.value !== expected) throw new Error("Reset cleanup value is outside the demo tenant allowlist");
    while (true) {
      const result = await databases.listDocuments(DATABASE_ID, cleanup.collectionId, [Query.equal(cleanup.field, expected), Query.limit(100)]);
      if (!result.documents.length) break;
      for (const document of result.documents) {
        await databases.deleteDocument(DATABASE_ID, cleanup.collectionId, document.$id);
        deleted += 1;
      }
    }
  }

  for (const account of manifest.accounts || []) {
    if (!account.userId || !account.email || !account.password) throw new Error("Every demo account needs userId, email and password");
    try {
      const existingUser = await users.get(account.userId);
      if (existingUser.email !== account.email) await users.updateEmail(account.userId, account.email);
      if (resetPasswords) await users.updatePassword(account.userId, account.password);
      const desiredName = account.name || account.email;
      if (existingUser.name !== desiredName) await users.updateName(account.userId, desiredName);
    } catch (error) {
      if (error?.code !== 404) throw error;
      await users.create(account.userId, account.email, undefined, account.password, account.name || account.email);
    }
    if (Array.isArray(account.labels)) await users.updateLabels(account.userId, account.labels);
  }

  for (const document of manifest.documents || []) {
    assertCollectionAllowed(document.collectionId, allowedCollections);
    const data = { ...document.data };
    const serialized = JSON.stringify(data);
    const isDemoRoot = document.documentId === coopId || document.documentId === auditOrgId;
    if (!isDemoRoot && !serialized.includes(coopId) && !serialized.includes(auditOrgId)) throw new Error(`Baseline document ${document.documentId} is not tied to a demo tenant`);
    try {
      await databases.getDocument(DATABASE_ID, document.collectionId, document.documentId);
      await databases.updateDocument(DATABASE_ID, document.collectionId, document.documentId, data);
    } catch (error) {
      if (error?.code !== 404) throw error;
      await databases.createDocument(DATABASE_ID, document.collectionId, document.documentId, data);
    }
    restored += 1;
  }

  return { baselineVersion: manifest.version || "unversioned", deleted, restored, accounts: (manifest.accounts || []).length };
}
