import { getConsoleState } from "@/lib/dev-console/store";

export async function isFeatureEnabled(featureKey, { isDemoTenant = false } = {}) {
  const state = await getConsoleState();
  const feature = state.features.find((item) => item.key === featureKey);
  if (!feature) return false;
  return isDemoTenant ? feature.demoEnabled : feature.customerEnabled;
}
