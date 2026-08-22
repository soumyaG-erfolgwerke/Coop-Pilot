import { connectToDatabase } from "@/lib/db/mongoose";
import WhatsNewAnnouncement, {
  WHATS_NEW_ROLES,
  WHATS_NEW_STATUSES,
  WHATS_NEW_TYPES,
} from "@/lib/models/WhatsNewAnnouncement.model";

const roleSet = new Set(WHATS_NEW_ROLES);
const typeSet = new Set(WHATS_NEW_TYPES);
const statusSet = new Set(WHATS_NEW_STATUSES);

function cleanText(value, field, maxLength) {
  if (typeof value !== "string") throw new Error(`${field.toUpperCase()}_REQUIRED`);
  const cleaned = value.trim();
  if (!cleaned) throw new Error(`${field.toUpperCase()}_REQUIRED`);
  if (cleaned.length > maxLength) throw new Error(`${field.toUpperCase()}_TOO_LONG`);
  return cleaned;
}

function cleanRoles(value) {
  if (!Array.isArray(value)) throw new Error("TARGET_ROLES_REQUIRED");
  const roles = [...new Set(value.filter((role) => typeof role === "string"))];
  if (!roles.length || roles.some((role) => !roleSet.has(role))) throw new Error("INVALID_TARGET_ROLES");
  return roles.includes("all") ? ["all"] : roles;
}

export function validateAnnouncementInput(input, { partial = false } = {}) {
  const data = {};
  if (!partial || input.title !== undefined) data.title = cleanText(input.title, "title", 120);
  if (!partial || input.message !== undefined) data.message = cleanText(input.message, "message", 2000);
  if (!partial || input.type !== undefined) {
    if (!typeSet.has(input.type)) throw new Error("INVALID_TYPE");
    data.type = input.type;
  }
  if (!partial || input.targetRoles !== undefined) data.targetRoles = cleanRoles(input.targetRoles);
  if (!partial || input.status !== undefined) {
    if (!statusSet.has(input.status)) throw new Error("INVALID_STATUS");
    data.status = input.status;
  }
  return data;
}

export async function listAnnouncementsForDev() {
  await connectToDatabase();
  return WhatsNewAnnouncement.find({}).sort({ createdAt: -1 }).limit(200).lean();
}

export async function createAnnouncement(input) {
  await connectToDatabase();
  const data = validateAnnouncementInput(input);
  if (data.status === "Published") data.publishedAt = new Date();
  return WhatsNewAnnouncement.create({ ...data, createdBy: "dev-console", updatedBy: "dev-console" });
}

export async function updateAnnouncement(id, input) {
  await connectToDatabase();
  const current = await WhatsNewAnnouncement.findById(id);
  if (!current) throw new Error("ANNOUNCEMENT_NOT_FOUND");
  const data = validateAnnouncementInput(input, { partial: true });
  if (data.status === "Published" && current.status !== "Published") data.publishedAt = new Date();
  if (data.status === "Draft") data.publishedAt = null;
  Object.assign(current, data, { updatedBy: "dev-console" });
  await current.save();
  return current;
}

export function sessionIsDemo(session) {
  const demoCoopId = process.env.DEV_DEMO_COOP_ID;
  const demoAuditOrgId = process.env.DEV_DEMO_AUDIT_ORG_ID;
  const profileCoops = [
    session?.coopId,
    session?.profile?.coopId,
    session?.profile?.cooperativeId,
    ...(Array.isArray(session?.profile?.CoorporateIds) ? session.profile.CoorporateIds : []),
  ].filter(Boolean);
  return Boolean(
    (demoCoopId && profileCoops.includes(demoCoopId)) ||
    (demoAuditOrgId && session?.auditOrgId === demoAuditOrgId),
  );
}

export { WHATS_NEW_ROLES, WHATS_NEW_STATUSES, WHATS_NEW_TYPES };
