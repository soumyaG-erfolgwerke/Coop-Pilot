import mongoose from "mongoose";

export const WHATS_NEW_TYPES = ["New", "Improvement", "Fixed", "Important"];
export const WHATS_NEW_STATUSES = ["Draft", "Published", "Archived"];
export const WHATS_NEW_ROLES = [
  "all",
  "coopadmin",
  "member",
  "org_admin",
  "auditer",
  "aud_E",
  "superuser",
  "superadmin",
];

const WhatsNewAnnouncementSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 120 },
    message: { type: String, required: true, trim: true, maxlength: 2000 },
    type: { type: String, required: true, enum: WHATS_NEW_TYPES },
    targetRoles: {
      type: [{ type: String, enum: WHATS_NEW_ROLES }],
      required: true,
      validate: [(roles) => roles.length > 0, "At least one target role is required"],
    },
    status: { type: String, required: true, enum: WHATS_NEW_STATUSES, default: "Draft", index: true },
    publishedAt: { type: Date, default: null, index: true },
    createdBy: { type: String, required: true, default: "dev-console" },
    updatedBy: { type: String, required: true, default: "dev-console" },
  },
  { timestamps: true, collection: "whats_new_announcements", versionKey: false },
);

WhatsNewAnnouncementSchema.index({ status: 1, targetRoles: 1, publishedAt: -1 });

export default mongoose.models.WhatsNewAnnouncement ||
  mongoose.model("WhatsNewAnnouncement", WhatsNewAnnouncementSchema);
