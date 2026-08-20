import mongoose from "mongoose";

const DevIssueSchema = new mongoose.Schema({
  testKey: { type: String, required: true, unique: true, index: true },
  name: { type: String, required: true, maxlength: 240 },
  time: { type: Date, required: true, default: Date.now, index: true },
  status: { type: String, enum: ["Open", "Resolved"], default: "Open", index: true },
}, { timestamps: true, collection: "dev_monitoring_issues", versionKey: false });

export default mongoose.models.DevIssue || mongoose.model("DevIssue", DevIssueSchema);

