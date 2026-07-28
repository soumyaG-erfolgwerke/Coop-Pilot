import { cookies } from "next/headers";
import { ID, Query } from "node-appwrite";
import {
  appwriteFetchWithSession,
  createAdminClient,
  DATABASE_ID,
  COLLECTION_ID_COOPERATIVES,
  COLLECTION_ID_COOP_CONFIG,
  COLLECTION_ID_COOP_SETTINGS_AUDIT,
  COLLECTION_ID_PROFILE,
  COLLECTION_ID_AUDITTEAM_MEMBERS
} from "@/lib/appwrite-server";
import {
  DEFAULT_COOPERATIVE_SETTINGS,
  validateCooperativeSettings,
} from "@/lib/cooperativeSettingsSchema";

const SETTING_KEYS = [
  "cooperative_name",
  "register_number",
  "register_court",
  "member_number_format",
  "auto_approval_membership",
  "auto_approval_shares",
  "registered_office_city",
  "share_price_cents",
  "min_shares",
  "max_shares",
  "fiscal_year_start",
  "fiscal_year_end",
  "agm_notice_period_days",
  "quorum_type",
  "quorum_threshold_percent",
  "member_exit_notice_period_days",
  "isLive",
  "ibanNumber",
  "bicNumber",
  "logo",
  "bannerUrl",
  "about",
  "street",
  "houseNo",
  "postalCode",
  "location",
  "country",
  "sector",
  "incorporatedAt",
];

const toInteger = (value, fallback) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const toBoolean = (value, fallback = false) => {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value === 1;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (normalized === "true" || normalized === "1") return true;
    if (normalized === "false" || normalized === "0") return false;
  }

  return fallback;
};

const UNKNOWN_ATTRIBUTE_REGEX = /Unknown attribute:\s*"([^"]+)"/i;

async function updateDocumentWithUnknownAttributeFallback({
  databases,
  collectionId = COLLECTION_ID_COOPERATIVES,
  docId,
  payload,
}) {
  const mutablePayload = { ...payload };
  const removedAttributes = [];

  // Retry when Appwrite rejects schema-mismatched attributes.
  for (let attempts = 0; attempts < 50; attempts += 1) {
    try {
      const document = await databases.updateDocument(
        DATABASE_ID,
        collectionId,
        docId,
        mutablePayload,
      );

      return { document, removedAttributes };
    } catch (error) {
      const message = String(error?.message || "");
      const match = message.match(UNKNOWN_ATTRIBUTE_REGEX);
      if (!match?.[1]) {
        throw error;
      }

      const unknownKey = match[1];
      if (!(unknownKey in mutablePayload)) {
        throw error;
      }

      removedAttributes.push(unknownKey);
      delete mutablePayload[unknownKey];
    }
  }

  throw new Error("Failed to update settings due to schema mismatch.");
}

async function createDocumentWithUnknownAttributeFallback({
  databases,
  collectionId,
  docId,
  payload,
}) {
  const mutablePayload = { ...payload };
  const removedAttributes = [];

  for (let attempts = 0; attempts < 50; attempts += 1) {
    try {
      const document = await databases.createDocument(
        DATABASE_ID,
        collectionId,
        docId,
        mutablePayload,
      );

      return { document, removedAttributes };
    } catch (error) {
      const message = String(error?.message || "");
      const match = message.match(UNKNOWN_ATTRIBUTE_REGEX);
      if (!match?.[1]) {
        throw error;
      }

      const unknownKey = match[1];
      if (!(unknownKey in mutablePayload)) {
        throw error;
      }

      removedAttributes.push(unknownKey);
      delete mutablePayload[unknownKey];
    }
  }

  throw new Error("Failed to create settings due to schema mismatch.");
}

export async function getAuthenticatedProfile() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("appwrite-session");

  if (!sessionCookie?.value) {
    throw new Error("UNAUTHORIZED");
  }

  let cookieValue = null;
  try {
    const parsed = JSON.parse(sessionCookie.value);
    cookieValue = parsed?.cookieValue || parsed?.secret || null;
  } catch {
    cookieValue = sessionCookie.value;
  }

  if (!cookieValue) {
    throw new Error("UNAUTHORIZED");
  }

  const accountResponse = await appwriteFetchWithSession(
    cookieValue,
    "/account",
  );
  if (!accountResponse.ok) {
    throw new Error("UNAUTHORIZED");
  }

  const account = await accountResponse.json();
  const userId = account?.$id;
  if (!userId) {
    throw new Error("UNAUTHORIZED");
  }

  const { databases, users } = createAdminClient();
  const user = await users.get(userId);

  const userLabels = user.labels || [];
  const isAuditTeamMember = userLabels.includes("teamMember");

  let profileResult = null;

  if (!isAuditTeamMember) {
    profileResult = await databases.listDocuments(
      DATABASE_ID,
      COLLECTION_ID_PROFILE,
      [Query.equal("userId", userId), Query.limit(1)],
    );
  } else {
    profileResult = await databases.listDocuments(
      DATABASE_ID,
      COLLECTION_ID_AUDITTEAM_MEMBERS,
      [Query.equal("email", user.email), Query.limit(1)],
    );
  }

  if (!profileResult.documents.length) {
    throw new Error("UNAUTHORIZED");
  }

  const profile = profileResult.documents[0];
  return {
    userId,
    role: profile.role,
    email: profile.contactEmail ?? profile.email,
    name: profile.FirstName
      ? `${profile.FirstName || ""} ${profile.LastName || ""}`.trim()
      : profile.name || user.name || "",
    profileId: profile.$id,
  };
}

export async function getCoopById(coopId) {
  const { databases } = createAdminClient();
  return databases.getDocument(DATABASE_ID, COLLECTION_ID_COOPERATIVES, coopId);
}

export async function ensureCoopAdminAccess(coopId) {
  const auth = await getAuthenticatedProfile();

  if (auth.role === "superuser") {
    return auth;
  }

  const coop = await getCoopById(coopId);
  const admins = Array.isArray(coop.admins) ? coop.admins : [];
  if (!admins.includes(auth.email)) {
    throw new Error("FORBIDDEN");
  }

  return auth;
}

export async function hasCoopAdminAccess(coopId) {
  const auth = await getAuthenticatedProfile();

  if (auth.role === "superuser") {
    return true;
  }

  const coop = await getCoopById(coopId);
  const admins = Array.isArray(coop.admins) ? coop.admins : [];
  if (!admins.includes(auth.email)) {
    throw new Error("FORBIDDEN");
  }

  return true;
}

export function deriveDefaultSettingsFromCoop(
  coopDoc = {},
  settingsDoc = null,
) {
  const hasCoopMaxShares = Number.isFinite(Number(coopDoc.max_shares));
  const autoApprovalMembershipValue =
    coopDoc.auto_approval_membership ??
    coopDoc.autoApprovalMembership ??
    settingsDoc?.auto_approval_membership ??
    settingsDoc?.autoApprovalMembership;
  const autoApprovalSharesValue =
    coopDoc.auto_approval_shares ??
    coopDoc.autoApprovalShares ??
    settingsDoc?.auto_approval_shares ??
    settingsDoc?.autoApprovalShares;
  const sharePriceCents = Number.isFinite(Number(coopDoc.share_price_cents))
    ? Math.max(1, Number(coopDoc.share_price_cents))
    : Number.isFinite(Number(coopDoc.sharePrice))
      ? Math.max(1, Math.round(Number(coopDoc.sharePrice) * 100))
      : DEFAULT_COOPERATIVE_SETTINGS.share_price_cents;

  const base = {
    ...DEFAULT_COOPERATIVE_SETTINGS,
    cooperative_name: coopDoc.cooperative_name || coopDoc.name || "",
    register_number: coopDoc.register_number || coopDoc.RegNumber || "",
    register_court: coopDoc.register_court || coopDoc.CourtName || "",
    member_number_format:
      coopDoc.member_number_format || settingsDoc?.member_number_format || "",
    auto_approval_membership: toBoolean(
      autoApprovalMembershipValue,
      DEFAULT_COOPERATIVE_SETTINGS.auto_approval_membership,
    ),
    auto_approval_shares: toInteger(
      autoApprovalSharesValue,
      DEFAULT_COOPERATIVE_SETTINGS.auto_approval_shares,
    ),
    registered_office_city:
      coopDoc.registered_office_city || coopDoc.state || "",
    share_price_cents: sharePriceCents,
    min_shares: toInteger(
      coopDoc.min_shares,
      DEFAULT_COOPERATIVE_SETTINGS.min_shares,
    ),
    max_shares: hasCoopMaxShares
      ? toInteger(coopDoc.max_shares, "")
      : toInteger(settingsDoc?.max_shares, ""),
    fiscal_year_start:
      coopDoc.fiscal_year_start ||
      DEFAULT_COOPERATIVE_SETTINGS.fiscal_year_start,
    fiscal_year_end:
      coopDoc.fiscal_year_end || DEFAULT_COOPERATIVE_SETTINGS.fiscal_year_end,
    agm_notice_period_days: toInteger(
      coopDoc.agm_notice_period_days,
      DEFAULT_COOPERATIVE_SETTINGS.agm_notice_period_days,
    ),
    quorum_type:
      coopDoc.quorum_type || DEFAULT_COOPERATIVE_SETTINGS.quorum_type,
    quorum_threshold_percent: toInteger(
      coopDoc.quorum_threshold_percent,
      DEFAULT_COOPERATIVE_SETTINGS.quorum_threshold_percent,
    ),
    member_exit_notice_period_days: toInteger(
      coopDoc.member_exit_notice_period_days,
      DEFAULT_COOPERATIVE_SETTINGS.member_exit_notice_period_days,
    ),
    isLive: toBoolean(
      coopDoc.isLive ?? coopDoc.make_live,
      DEFAULT_COOPERATIVE_SETTINGS.isLive,
    ),
    ibanNumber: coopDoc.ibanNumber || "",
    bicNumber: coopDoc.bicNumber || "",
    hasSatzung: false,
    logo: coopDoc.logo || settingsDoc?.logo || "",
    bannerUrl: coopDoc.bannerUrl || settingsDoc?.bannerUrl || "",
    about: coopDoc.about || settingsDoc?.about || "",
    totalMember: coopDoc.totalMember || settingsDoc?.totalMember || "",
    street: coopDoc.street || settingsDoc?.street || "",
    houseNo: coopDoc.houseNo || settingsDoc?.houseNo || "",
    postalCode: coopDoc.postalCode || settingsDoc?.postalCode || "",
    location: coopDoc.location || settingsDoc?.location || "",
    country: coopDoc.country || settingsDoc?.country || "",
    sector: coopDoc.sector || settingsDoc?.sector || "",
    incorporatedAt: coopDoc.incorporatedAt || settingsDoc?.incorporatedAt || "",
  };

  if (!settingsDoc) {
    return base;
  }

  return {
    ...base,
    cooperative_name: settingsDoc.cooperative_name || base.cooperative_name,
    register_number: settingsDoc.register_number || base.register_number,
    register_court: settingsDoc.register_court || base.register_court,
    registered_office_city:
      settingsDoc.registered_office_city || base.registered_office_city,
    share_price_cents: toInteger(
      settingsDoc.share_price_cents,
      base.share_price_cents,
    ),
    min_shares: toInteger(settingsDoc.min_shares, base.min_shares),
    fiscal_year_start: settingsDoc.fiscal_year_start || base.fiscal_year_start,
    fiscal_year_end: settingsDoc.fiscal_year_end || base.fiscal_year_end,
    agm_notice_period_days: toInteger(
      settingsDoc.agm_notice_period_days,
      base.agm_notice_period_days,
    ),
    quorum_type: settingsDoc.quorum_type || base.quorum_type,
    quorum_threshold_percent: toInteger(
      settingsDoc.quorum_threshold_percent,
      base.quorum_threshold_percent,
    ),
    member_exit_notice_period_days: toInteger(
      settingsDoc.member_exit_notice_period_days,
      base.member_exit_notice_period_days,
    ),
    isLive: toBoolean(settingsDoc.isLive ?? settingsDoc.make_live, base.isLive),
    ibanNumber: settingsDoc.ibanNumber || base.ibanNumber,
    bicNumber: settingsDoc.bicNumber || base.bicNumber,
    logo: settingsDoc.logo || base.logo,
    bannerUrl: settingsDoc.bannerUrl || base.bannerUrl,
    about: settingsDoc.about || base.about,
    totalMember: settingsDoc.totalMember || base.totalMember,
    street: settingsDoc.street || base.street,
    houseNo: settingsDoc.houseNo || base.houseNo,
    postalCode: settingsDoc.postalCode || base.postalCode,
    location: settingsDoc.location || base.location,
    country: settingsDoc.country || base.country,
    sector: settingsDoc.sector || base.sector,
    incorporatedAt: settingsDoc.incorporatedAt || base.incorporatedAt,
  };
}

export async function getSettingsDocumentByCoopId(coopId) {
  const { databases } = createAdminClient();

  // Preferred deterministic path: cooperative_id document id equals coopId.
  try {
    return await databases.getDocument(
      DATABASE_ID,
      COLLECTION_ID_COOP_CONFIG,
      coopId,
    );
  } catch {
    // Fallback for legacy documents created with random ids.
  }

  const result = await databases.listDocuments(
    DATABASE_ID,
    COLLECTION_ID_COOP_CONFIG,
    [
      Query.equal("cooperative_id", coopId),
      Query.orderDesc("$updatedAt"),
      Query.limit(1),
    ],
  );

  return result.documents[0] || null;
}

export async function writeSettingsAndAudit({
  coopId,
  incomingSettings,
  changedBy,
  changeReason,
}) {
  const { databases } = createAdminClient();

  const coopDoc = await getCoopById(coopId);
  const currentDoc = await getSettingsDocumentByCoopId(coopId);
  const previousSettings =
    deriveDefaultSettingsFromCoop(coopDoc, currentDoc) || {};

  const validation = validateCooperativeSettings(incomingSettings);
  if (!validation.isValid) {
    return { validation, document: null };
  }

  const nextSettings = validation.normalized;
  const now = new Date().toISOString();

  const coopPayload = {
    name: nextSettings.cooperative_name,
    RegNumber: nextSettings.register_number,
    CourtName: nextSettings.register_court,
    member_number_format: nextSettings.member_number_format,
    auto_approval_membership: nextSettings.auto_approval_membership,
    autoApprovalMembership: nextSettings.auto_approval_membership,
    auto_approval_shares: nextSettings.auto_approval_shares,
    autoApprovalShares: nextSettings.auto_approval_shares,
    state: nextSettings.registered_office_city,
    sharePrice: nextSettings.share_price_cents / 100,
    max_shares: nextSettings.max_shares,
    status: "active",
    isLive: nextSettings.isLive,
    make_live: nextSettings.isLive,
    ibanNumber: nextSettings.ibanNumber || null,
    bicNumber: nextSettings.bicNumber || null,
    logo: nextSettings.logo || null,
    bannerUrl: nextSettings.bannerUrl || null,
    about: nextSettings.about || null,
    totalMember: nextSettings.totalMember || null,
    street: nextSettings.street || null,
    houseNo: nextSettings.houseNo || null,
    postalCode: nextSettings.postalCode || null,
    location: nextSettings.location || null,
    country: nextSettings.country || null,
    sector: nextSettings.sector || null,
    incorporatedAt: nextSettings.incorporatedAt || null,
  };

  const settingsPayload = {
    cooperative_id: coopId,
    cooperative_name: nextSettings.cooperative_name,
    register_number: nextSettings.register_number,
    register_court: nextSettings.register_court,
    registered_office_city: nextSettings.registered_office_city,
    share_price_cents: nextSettings.share_price_cents,
    min_shares: nextSettings.min_shares,
    fiscal_year_start: nextSettings.fiscal_year_start,
    fiscal_year_end: nextSettings.fiscal_year_end,
    agm_notice_period_days: nextSettings.agm_notice_period_days,
    quorum_type: nextSettings.quorum_type,
    quorum_threshold_percent: nextSettings.quorum_threshold_percent,
    member_exit_notice_period_days: nextSettings.member_exit_notice_period_days,
    isLive: nextSettings.isLive,
    make_live: nextSettings.isLive,
    status: "active",
    updated_by: changedBy.userId,
    updated_by_email: changedBy.email,
    updated_at: now,
    street: nextSettings.street || null,
    houseNo: nextSettings.houseNo || null,
    postalCode: nextSettings.postalCode || null,
    location: nextSettings.location || null,
    country: nextSettings.country || null,
    sector: nextSettings.sector || null,
    incorporatedAt: nextSettings.incorporatedAt || null,
  };

  const updateResult = await updateDocumentWithUnknownAttributeFallback({
    databases,
    collectionId: COLLECTION_ID_COOPERATIVES,
    docId: coopDoc.$id,
    payload: coopPayload,
  });
  const updatedCoopDoc = updateResult.document;

  let settingsDocument;
  if (currentDoc) {
    const updateRes = await updateDocumentWithUnknownAttributeFallback({
      databases,
      collectionId: COLLECTION_ID_COOP_CONFIG,
      docId: currentDoc.$id,
      payload: settingsPayload,
    });
    settingsDocument = updateRes.document;
  } else {
    const createRes = await createDocumentWithUnknownAttributeFallback({
      databases,
      collectionId: COLLECTION_ID_COOP_CONFIG,
      docId: coopId,
      payload: {
        ...settingsPayload,
        created_at: now,
      },
    });
    settingsDocument = createRes.document;
  }

  const changedFields = SETTING_KEYS.filter(
    (key) =>
      JSON.stringify(previousSettings[key]) !==
      JSON.stringify(nextSettings[key]),
  );

  if (changedFields.length) {
    const oldValuesByField = {};
    const newValuesByField = {};

    changedFields.forEach((field) => {
      oldValuesByField[field] = previousSettings[field] ?? null;
      newValuesByField[field] = nextSettings[field] ?? null;
    });

    await databases.createDocument(
      DATABASE_ID,
      COLLECTION_ID_COOP_SETTINGS_AUDIT,
      ID.unique(),
      {
        cooperative_id: coopId,
        changed_field: changedFields.join(", "),
        old_value: JSON.stringify(oldValuesByField),
        new_value: JSON.stringify(newValuesByField),
        changed_by: changedBy.userId,
        changed_by_email: changedBy.email,
        changed_at: now,
        change_reason: changeReason || "manual_update",
      },
    );
  }

  return {
    validation,
    document: settingsDocument,
    coopDocument: updatedCoopDoc,
  };
}

export async function getSettingsHistory(coopId) {
  const { databases } = createAdminClient();

  const result = await databases.listDocuments(
    DATABASE_ID,
    COLLECTION_ID_COOP_SETTINGS_AUDIT,
    [
      Query.equal("cooperative_id", coopId),
      Query.orderDesc("changed_at"),
      Query.limit(100),
    ],
  );

  const parseJsonSafely = (value) => {
    if (typeof value !== "string") return value;
    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  };

  const splitFields = (raw) =>
    String(raw || "")
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);

  const grouped = new Map();

  result.documents.forEach((entry) => {
    const groupKey = [
      entry.cooperative_id || "",
      entry.changed_by || "",
      entry.changed_by_email || "",
      entry.changed_at || "",
      entry.change_reason || "",
    ].join("|");

    const fields = splitFields(entry.changed_field);
    const parsedOld = parseJsonSafely(entry.old_value);
    const parsedNew = parseJsonSafely(entry.new_value);

    if (!grouped.has(groupKey)) {
      grouped.set(groupKey, {
        id: entry.$id,
        cooperative_id: entry.cooperative_id,
        changed_by: entry.changed_by,
        changed_by_email: entry.changed_by_email,
        changed_at: entry.changed_at,
        change_reason: entry.change_reason,
        changed_fields: [],
        changes_by_field: {},
      });
    }

    const target = grouped.get(groupKey);

    fields.forEach((field) => {
      if (!target.changed_fields.includes(field)) {
        target.changed_fields.push(field);
      }

      const oldFieldValue =
        parsedOld && typeof parsedOld === "object" && !Array.isArray(parsedOld)
          ? parsedOld[field]
          : parsedOld;
      const newFieldValue =
        parsedNew && typeof parsedNew === "object" && !Array.isArray(parsedNew)
          ? parsedNew[field]
          : parsedNew;

      target.changes_by_field[field] = {
        old_value: oldFieldValue ?? null,
        new_value: newFieldValue ?? null,
      };
    });
  });

  return Array.from(grouped.values()).map((entry) => ({
    id: entry.id,
    cooperative_id: entry.cooperative_id,
    changed_field: entry.changed_fields.join(", "),
    changed_fields: entry.changed_fields,
    change_count: entry.changed_fields.length,
    old_value: JSON.stringify(
      Object.fromEntries(
        entry.changed_fields.map((field) => [
          field,
          entry.changes_by_field[field]?.old_value ?? null,
        ]),
      ),
    ),
    new_value: JSON.stringify(
      Object.fromEntries(
        entry.changed_fields.map((field) => [
          field,
          entry.changes_by_field[field]?.new_value ?? null,
        ]),
      ),
    ),
    changed_by: entry.changed_by,
    changed_by_email: entry.changed_by_email,
    changed_at: entry.changed_at,
    change_reason: entry.change_reason,
  }));
}

export const stripInternalFields = (document) => {
  if (!document) {
    return null;
  }

  const {
    $id,
    $collectionId,
    $databaseId,
    $permissions,
    $updatedAt,
    collectionId,
    databaseId,
    dbid,
    permissions,
    $sequence,
    $createdAt,
    ...rest
  } = document;

  return {
    ...rest,
    id: $id,
    createdAt: $createdAt,
    updatedAt: $updatedAt,
  };
};
