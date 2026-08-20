import { connectToDatabase } from "@/lib/db/mongoose";
import DevConsoleState from "@/lib/models/DevConsoleState.model";
import DevIssue from "@/lib/models/DevIssue.model";
import { FEATURE_CATALOG } from "@/lib/dev-console/registry";

const TIME_PATTERN = /^(?:[01]\d|2[0-3]):[0-5]\d$/;

export async function getConsoleState() {
  await connectToDatabase();
  let state = await DevConsoleState.findOne({ singleton: "default" }).lean();
  if (!state) {
    state = await DevConsoleState.create({
      singleton: "default",
      features: FEATURE_CATALOG.map((f) => ({ key: f.key, demoEnabled: true, customerEnabled: f.defaultCustomerEnabled })),
    });
    state = state.toObject();
  }
  const saved = new Map((state.features || []).map((item) => [item.key, item]));
  return {
    autoMonitoringEnabled: state.autoMonitoringEnabled !== false,
    monitoringTime: state.monitoringTime || "02:00",
    lastRun: state.lastRun || null,
    features: FEATURE_CATALOG.map((feature) => ({
      ...feature,
      demoEnabled: saved.get(feature.key)?.demoEnabled ?? true,
      customerEnabled: saved.get(feature.key)?.customerEnabled ?? feature.defaultCustomerEnabled,
    })),
  };
}

export async function setFeatureEnabled(key, enabled, audience = "customers") {
  if (!FEATURE_CATALOG.some((feature) => feature.key === key)) throw new Error("UNKNOWN_FEATURE");
  if (!['demo', 'customers'].includes(audience)) throw new Error("INVALID_AUDIENCE");
  await getConsoleState();
  const field = audience === 'demo' ? 'demoEnabled' : 'customerEnabled';
  const updated = await DevConsoleState.updateOne(
    { singleton: "default", "features.key": key },
    { $set: { [`features.$.${field}`]: Boolean(enabled) } },
  );
  if (!updated.matchedCount) {
    const feature = FEATURE_CATALOG.find((item) => item.key === key);
    await DevConsoleState.updateOne(
      { singleton: "default" },
      { $push: { features: {
        key,
        demoEnabled: audience === 'demo' ? Boolean(enabled) : true,
        customerEnabled: audience === 'customers' ? Boolean(enabled) : feature.defaultCustomerEnabled,
      } } },
    );
  }
  return getConsoleState();
}

export async function updateMonitoringSettings({ enabled, time }) {
  if (typeof enabled !== "boolean" || !TIME_PATTERN.test(time || "")) throw new Error("INVALID_SETTINGS");
  await connectToDatabase();
  await DevConsoleState.updateOne(
    { singleton: "default" },
    { $set: { autoMonitoringEnabled: enabled, monitoringTime: time }, $setOnInsert: { singleton: "default" } },
    { upsert: true },
  );
  return getConsoleState();
}

export async function saveLastRun(summary) {
  await connectToDatabase();
  await DevConsoleState.updateOne(
    { singleton: "default" },
    { $set: { lastRun: summary }, $setOnInsert: { singleton: "default" } },
    { upsert: true },
  );
}

export async function listIssues() {
  await connectToDatabase();
  await DevIssue.deleteMany({
    $or: [
      { testKey: { $in: ["feedback-route", "calendar-page", "whats-new-dashboard", "global-search"] } },
      { testKey: "demo-baseline-reset", status: "Resolved" },
    ],
  });
  return DevIssue.find({}).sort({ time: -1 }).lean();
}

export async function openIssue(test) {
  await connectToDatabase();
  return DevIssue.findOneAndUpdate(
    { testKey: test.key },
    { $set: { name: test.name, time: new Date(), status: "Open" } },
    { upsert: true, new: true },
  ).lean();
}

export async function resolveIssue(testKey) {
  await connectToDatabase();
  return DevIssue.findOneAndUpdate({ testKey }, { $set: { status: "Resolved" } }, { new: true }).lean();
}
