import { getConsoleState } from "@/lib/dev-console/store";
import { getMonitorRuntime, startMonitoring } from "@/lib/dev-console/runtime";

const SCHEDULER_KEY = Symbol.for("coopilot.dev.monitor.scheduler");

function istParts(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23",
  }).formatToParts(date).reduce((result, part) => ({ ...result, [part.type]: part.value }), {});
  return { date: `${parts.year}-${parts.month}-${parts.day}`, time: `${parts.hour}:${parts.minute}` };
}

async function tick() {
  try {
    const state = await getConsoleState();
    if (!state.autoMonitoringEnabled || getMonitorRuntime().running) return;
    const now = istParts();
    const lastDate = state.lastRun?.completedAt ? istParts(new Date(state.lastRun.completedAt)).date : null;
    if (now.time === state.monitoringTime && lastDate !== now.date) startMonitoring({ trigger: "automatic" });
  } catch (error) {
    console.error("[Dev monitor scheduler]", error.message);
  }
}

export function startDevMonitoringScheduler() {
  if (globalThis[SCHEDULER_KEY] || process.env.DEV_MONITOR_SCHEDULER_ENABLED === "false") return;
  globalThis[SCHEDULER_KEY] = setInterval(tick, 30_000);
  void tick();
}
