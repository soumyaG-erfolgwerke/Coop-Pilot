export const QUORUM_TYPES = Object.freeze([
  "ANTEILSBASIERT",
  "MITGLIEDERBASIERT",
]);

export const GENG_MINIMUMS = Object.freeze({
  share_price_cents: 1,
  min_shares: 1,
  agm_notice_period_days: 7,
  quorum_threshold_percent: 1,
  member_exit_notice_period_days: 28,
});

export const DEFAULT_COOPERATIVE_SETTINGS = Object.freeze({
  cooperative_name: "",
  register_number: "",
  register_court: "",
  member_number_format: "",
  auto_approval_membership: false,
  auto_approval_shares: 0,
  registered_office_city: "",
  share_price_cents: 0,
  min_shares: "",
  max_shares: "",
  fiscal_year_start: "",
  fiscal_year_end: "",
  agm_notice_period_days: "",
  quorum_type: null,
  quorum_threshold_percent: "",
  member_exit_notice_period_days: "",
  isLive: false,
  ibanNumber: "",
  bicNumber: "",
  hasSatzung: false,
  logo: "",
  bannerUrl: "",
  about: "",
  totalMember: 0,
  street: "",
  houseNo: "",
  postalCode: "",
  location: "",
  country: "",
  sector: "",
  incorporatedAt: "",
});

// export const DEFAULT_COOPERATIVE_SETTINGS = Object.freeze({
//   cooperative_name: "",
//   register_number: "",
//   register_court: "",
//   member_number_format: "",
//   auto_approval_membership: false,
//   auto_approval_shares: 100,
//   registered_office_city: "",
//   share_price_cents: 100,
//   min_shares: 1,
//   max_shares: 100,
//   fiscal_year_start: "01-01",
//   fiscal_year_end: "12-31",
//   agm_notice_period_days: 14,
//   quorum_type: "ANTEILSBASIERT",
//   quorum_threshold_percent: 25,
//   member_exit_notice_period_days: 30,
// });

export const SETTINGS_LABELS = {
  de: {
    cooperative_name: "Name der Genossenschaft",
    register_number: "Registernummer",
    register_court: "Registergericht",
    member_number_format: "Mitgliedsnummernformat",
    auto_approval_membership: "Automatische Mitgliedschaftsfreigabe",
    auto_approval_shares: "Anzahl Anteile (Auto-Freigabe)",
    registered_office_city: "Sitz",
    share_price_cents: "Anteilspreis (Euro)",
    min_shares: "Mindestanteile",
    max_shares: "Hochstanteile",
    fiscal_year_start: "Geschäftsjahrbeginn",
    fiscal_year_end: "Geschaftsjahrende",
    agm_notice_period_days: "Ladungsfrist für Versammlung (Tage)",
    quorum_type: "Beschlussfähigkeit",
    quorum_threshold_percent: "Quorum-Schwelle (%)",
    member_exit_notice_period_days: "Kündigungsfrist (Tage)",
    isLive: "Live schalten",
    ibanNumber: "IBAN",
    bicNumber: "BIC",
    logo: "Cooperative Logo",
    bannerUrl: "Cooperative Banner",
    about: "About Cooperative",
    totalMember: "Total Members",
    street: "Straße",
    houseNo: "Hausnummer",
    postalCode: "Postleitzahl",
    location: "Ort",
    country: "Land",
    sector: "Branche",
    incorporatedAt: "Gründungsdatum",
  },
  en: {
    cooperative_name: "Cooperative Name",
    register_number: "Register Number",
    register_court: "Register Court",
    member_number_format: "Member Number Format",
    auto_approval_membership: "Auto Approval Of Membership",
    auto_approval_shares: "Number Of Shares (Auto Approval)",
    registered_office_city: "Registered Office City",
    share_price_cents: "Share Price (Euro)",
    min_shares: "Minimum Shares per Member",
    max_shares: "Maximum Shares per Member",
    fiscal_year_start: "Financial Year Start",
    fiscal_year_end: "Financial Year End",
    agm_notice_period_days: "AGM Notice Period (Days)",
    quorum_type: "Quorum Rule",
    quorum_threshold_percent: "Quorum Threshold (%)",
    member_exit_notice_period_days: "Member Exit Notice Period (Days)",
    isLive: "Make Live",
    ibanNumber: "IBAN",
    bicNumber: "BIC",
    logo: "Cooperative Logo",
    bannerUrl: "Cooperative Banner",
    about: "About Cooperative",
    totalMember: "Total Members",
    street: "Street",
    houseNo: "House Number",
    postalCode: "Postal Code",
    location: "City",
    country: "Country",
    sector: "Sector / Industry",
    incorporatedAt: "Incorporated At",
  },
};

const DATE_MM_DD_REGEX = /^(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;
const ALPHANUMERIC_REGEX = /^[A-Za-z0-9]+$/;

const toInteger = (value, fallback = 0) => {
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

const normalizeText = (value) =>
  typeof value === "string" ? value.trim() : "";

export function normalizeCooperativeSettings(input = {}) {
  const merged = {
    ...DEFAULT_COOPERATIVE_SETTINGS,
    ...(input || {}),
  };

  return {
    cooperative_name: normalizeText(merged.cooperative_name),
    register_number: normalizeText(merged.register_number),
    register_court: normalizeText(merged.register_court),
    member_number_format: normalizeText(merged.member_number_format),
    auto_approval_membership: toBoolean(
      merged.auto_approval_membership,
      DEFAULT_COOPERATIVE_SETTINGS.auto_approval_membership,
    ),
    auto_approval_shares: toInteger(
      merged.auto_approval_shares,
      DEFAULT_COOPERATIVE_SETTINGS.auto_approval_shares,
    ),
    registered_office_city: normalizeText(merged.registered_office_city),
    share_price_cents: toInteger(
      merged.share_price_cents,
      DEFAULT_COOPERATIVE_SETTINGS.share_price_cents,
    ),
    min_shares: toInteger(
      merged.min_shares,
      DEFAULT_COOPERATIVE_SETTINGS.min_shares,
    ),
    max_shares: toInteger(
      merged.max_shares,
      DEFAULT_COOPERATIVE_SETTINGS.max_shares,
    ),
    fiscal_year_start: normalizeText(merged.fiscal_year_start),
    fiscal_year_end: normalizeText(merged.fiscal_year_end),
    agm_notice_period_days: toInteger(
      merged.agm_notice_period_days,
      DEFAULT_COOPERATIVE_SETTINGS.agm_notice_period_days,
    ),
    quorum_type: QUORUM_TYPES.includes(merged.quorum_type)
      ? merged.quorum_type
      : DEFAULT_COOPERATIVE_SETTINGS.quorum_type,
    quorum_threshold_percent: toInteger(
      merged.quorum_threshold_percent,
      DEFAULT_COOPERATIVE_SETTINGS.quorum_threshold_percent,
    ),
    member_exit_notice_period_days: toInteger(
      merged.member_exit_notice_period_days,
      DEFAULT_COOPERATIVE_SETTINGS.member_exit_notice_period_days,
    ),
    isLive: toBoolean(merged.isLive, DEFAULT_COOPERATIVE_SETTINGS.isLive),
    ibanNumber: normalizeText(merged.ibanNumber),
    bicNumber: normalizeText(merged.bicNumber),
    hasSatzung: toBoolean(
      merged.hasSatzung,
      DEFAULT_COOPERATIVE_SETTINGS.hasSatzung,
    ),
    logo: normalizeText(merged.logo),
    bannerUrl: normalizeText(merged.bannerUrl),
    about: normalizeText(merged.about),
    totalMember: toInteger(
      merged.totalMember,
      DEFAULT_COOPERATIVE_SETTINGS.totalMember,
    ),
    street: normalizeText(merged.street),
    houseNo: normalizeText(merged.houseNo),
    postalCode: normalizeText(merged.postalCode),
    location: normalizeText(merged.location),
    country: normalizeText(merged.country),
    sector: normalizeText(merged.sector),
    incorporatedAt: normalizeText(merged.incorporatedAt),
  };
}

export function validateCooperativeSettings(input = {}) {
  const settings = normalizeCooperativeSettings(input);
  const errors = [];
  const warnings = [];

  if (!settings.cooperative_name || settings.cooperative_name.length > 200) {
    errors.push("Cooperative name is required and must be <= 200 characters.");
  }

  if (!settings.register_number) {
    errors.push("Register number is required.");
  }

  if (!settings.register_court) {
    errors.push("Register court is required.");
  }

  if (!settings.member_number_format) {
    errors.push("Member number format is required.");
  } else if (!ALPHANUMERIC_REGEX.test(settings.member_number_format)) {
    errors.push("Member number format must contain only letters and numbers.");
  }

  if (!settings.registered_office_city) {
    errors.push("Registered office city is required.");
  }

  if (settings.share_price_cents <= 0) {
    errors.push("Share price must be a positive integer (in cents).");
  }

  if (settings.min_shares < 1) {
    errors.push("Minimum shares must be at least 1.");
  }

  if (settings.max_shares < 1) {
    errors.push("Maximum shares must be at least 1.");
  }

  if (settings.max_shares < settings.min_shares) {
    errors.push(
      "Maximum shares must be greater than or equal to minimum shares.",
    );
  }

  if (settings.auto_approval_membership) {
    if (settings.auto_approval_shares < settings.min_shares) {
      errors.push(
        "Auto approval shares must be greater than or equal to minimum shares.",
      );
    }

    if (settings.auto_approval_shares > settings.max_shares) {
      errors.push(
        "Auto approval shares must be less than or equal to maximum shares.",
      );
    }
  }

  if (!DATE_MM_DD_REGEX.test(settings.fiscal_year_start)) {
    errors.push("Fiscal year start must be in MM-DD format.");
  }

  if (!DATE_MM_DD_REGEX.test(settings.fiscal_year_end)) {
    errors.push("Fiscal year end must be in MM-DD format.");
  }

  if (settings.agm_notice_period_days <= 0) {
    errors.push("AGM notice period must be a positive integer.");
  }

  if (
    settings.quorum_threshold_percent < 1 ||
    settings.quorum_threshold_percent > 100
  ) {
    errors.push("Quorum threshold must be between 1 and 100.");
  }

  if (settings.member_exit_notice_period_days <= 0) {
    errors.push("Member exit notice period must be a positive integer.");
  }

  if (settings.isLive) {
    // TODO: In the future, require IBAN and BIC when making the cooperative live
    // if (!settings.ibanNumber || !settings.ibanNumber.trim()) {
    //   errors.push("Cooperative IBAN is required to make the cooperative live.");
    // }
    // if (!settings.bicNumber || !settings.bicNumber.trim()) {
    //   errors.push("Cooperative BIC is required to make the cooperative live.");
    // }
    if (!settings.hasSatzung) {
      errors.push(
        "At least one Satzung document must be uploaded to make the cooperative live.",
      );
    }
  }

  if (settings.share_price_cents < GENG_MINIMUMS.share_price_cents) {
    warnings.push("Anteilspreis sollte mindestens 0,01 EUR sein.");
  }

  if (settings.min_shares < GENG_MINIMUMS.min_shares) {
    warnings.push("Mindestanteile sollten mindestens 1 sein.");
  }

  if (settings.agm_notice_period_days < GENG_MINIMUMS.agm_notice_period_days) {
    warnings.push("Ladungsfrist sollte mindestens 7 Tage sein.");
  }

  if (
    settings.quorum_threshold_percent < GENG_MINIMUMS.quorum_threshold_percent
  ) {
    warnings.push("Quorum-Schwelle sollte mindestens 1% sein.");
  }

  if (
    settings.member_exit_notice_period_days <
    GENG_MINIMUMS.member_exit_notice_period_days
  ) {
    warnings.push("Kundigungsfrist sollte mindestens 4 Wochen sein.");
  }

  return {
    normalized: settings,
    errors,
    warnings,
    isValid: errors.length === 0,
  };
}
