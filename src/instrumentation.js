import { redactLogArguments } from "@/lib/logger/redaction";

const PATCH_MARKER = Symbol.for("coopilot.console.redaction.installed");

export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs" || globalThis[PATCH_MARKER]) return;

  globalThis[PATCH_MARKER] = true;
  for (const method of ["error", "warn", "info", "log", "debug"]) {
    const original = console[method].bind(console);
    console[method] = (...args) => original(...redactLogArguments(args));
  }

  const { startDevMonitoringScheduler } = await import("@/lib/dev-console/scheduler");
  startDevMonitoringScheduler();
}
