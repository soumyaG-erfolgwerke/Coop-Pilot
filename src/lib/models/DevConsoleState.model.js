import mongoose from "mongoose";

const FeatureSchema = new mongoose.Schema({
  key: { type: String, required: true },
  demoEnabled: { type: Boolean, default: true },
  customerEnabled: { type: Boolean, default: false },
}, { _id: false });

const DevConsoleStateSchema = new mongoose.Schema({
  singleton: { type: String, default: "default", unique: true },
  autoMonitoringEnabled: { type: Boolean, default: true },
  monitoringTime: { type: String, default: "02:00" },
  features: { type: [FeatureSchema], default: [] },
  lastRun: { type: mongoose.Schema.Types.Mixed, default: null },
}, { timestamps: true, collection: "dev_console_state", versionKey: false });

export default mongoose.models.DevConsoleState || mongoose.model("DevConsoleState", DevConsoleStateSchema);
