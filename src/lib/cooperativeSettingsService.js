import {
  DEFAULT_COOPERATIVE_SETTINGS,
  validateCooperativeSettings,
} from "./cooperativeSettingsSchema";

export const fetchCooperativeSettings = async (coopId) => {
  if (!coopId) {
    throw new Error("coopId is required");
  }

  const response = await fetch(`/api/cooperative/settings/${encodeURIComponent(coopId)}`, {
    method: "GET",
    credentials: "include",
  });

  const data = await response.json();
  if (!data.success) {
    throw new Error(data.error || "Failed to fetch cooperative settings");
  }

  return data.settings || { cooperative_id: coopId, ...DEFAULT_COOPERATIVE_SETTINGS };
};

export const updateCooperativeSettings = async (coopId, settings, changeReason = "manual_update") => {
  if (!coopId) {
    throw new Error("coopId is required");
  }

  const validation = validateSettings(settings);
  if (!validation.isValid) {
    return {
      success: false,
      errors: validation.errors,
      warnings: validation.warnings,
    };
  }

  const response = await fetch(`/api/cooperative/settings/${encodeURIComponent(coopId)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({
      settings: validation.normalized,
      changeReason,
    }),
  });

  const data = await response.json();
  if (!data.success) {
    return {
      success: false,
      errors: data.errors || [data.error || "Failed to update cooperative settings"],
      warnings: data.warnings || [],
    };
  }

  return {
    success: true,
    settings: data.settings,
    warnings: data.warnings || validation.warnings,
  };
};

export const getSettingsHistory = async (coopId) => {
  if (!coopId) {
    throw new Error("coopId is required");
  }

  const response = await fetch(`/api/cooperative/settings/history/${encodeURIComponent(coopId)}`, {
    method: "GET",
    credentials: "include",
  });

  const data = await response.json();
  if (!data.success) {
    throw new Error(data.error || "Failed to fetch settings history");
  }

  return data.history || [];
};

export const validateSettings = (settings) => validateCooperativeSettings(settings);

export const getDefaultSettings = (overrides = {}) => ({
  ...DEFAULT_COOPERATIVE_SETTINGS,
  ...overrides,
});
