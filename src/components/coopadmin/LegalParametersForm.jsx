"use client";

import {
  SelectField,
  TextAreaField,
  TextInputField,
  ToggleField,
} from "@/components/ui/input/InputFields";
import { uploadFileAndGetURL } from "@/lib/addCoopService";
import {
  QUORUM_TYPES,
  SETTINGS_LABELS,
  validateCooperativeSettings,
} from "@/lib/cooperativeSettingsSchema";
import { newVerifiedMemeberFromRelationTable } from "@/lib/getMembersDetails";
import {
  AlertCircle,
  AlertTriangle,
  Building2,
  Calculator,
  Calendar,
  Camera,
  Coins,
  FileText,
  History,
  ImagePlus,
  Loader2,
  MapPin,
  Menu,
  Save,
  Scale,
  User,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import SettingsHistoryTimeline from "./SettingsHistoryTimeline";

const numberFields = [
  "totalMember",
  "share_price_cents",
  "min_shares",
  "max_shares",
  "auto_approval_shares",
  "agm_notice_period_days",
  "quorum_threshold_percent",
  "member_exit_notice_period_days",
];

const toStableJson = (value) => {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return JSON.stringify(value);
  }

  const sorted = {};
  Object.keys(value)
    .sort()
    .forEach((key) => {
      sorted[key] = value[key];
    });

  return JSON.stringify(sorted);
};

const normalizeForCompare = (value) => {
  const validation = validateCooperativeSettings(value);
  return validation.isValid ? validation.normalized : value;
};

const hasNoSettingsChange = (currentSettings, initialSettings) => {
  const currentNormalized = normalizeForCompare(currentSettings);
  const initialNormalized = normalizeForCompare(initialSettings);
  return toStableJson(currentNormalized) === toStableJson(initialNormalized);
};

export default function LegalParametersForm({
  initialValues,
  isSaving,
  onSubmit,
  onValidationWarnings,
  onNoChanges,
  selectedCoop,
  history = [],
  isHistoryLoading = false,
  historyError = "",
  isSubscribed = false,
}) {
  const [lang, setLang] = useState("en");
  const [activeTab, setActiveTab] = useState("profile");
  const [formState, setFormState] = useState({
    ...initialValues,
    totalMember: initialValues.totalMember ?? 0,
  });
  const [errors, setErrors] = useState([]);
  const [isCalculating, setIsCalculating] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const icons = useMemo(
    () => ({
      profile: <User className="w-4 h-4" />,
      address: <MapPin className="w-4 h-4" />,
      legal: <Scale className="w-4 h-4" />,
      shares: <Coins className="w-4 h-4" />,
      governance: <Calendar className="w-4 h-4" />,
      history: <History className="w-4 h-4" />,
    }),
    [],
  );

  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [isUploadingBanner, setIsUploadingBanner] = useState(false);
  const labels = SETTINGS_LABELS[lang];

  const bannerInputRef = useRef(null);
  const logoInputRef = useRef(null);

  const tabLabels = useMemo(
    () => ({
      de: {
        profile: "Profil & Beschreibung",
        address: "Anschrift & Sitz",
        legal: "Satzung & Aktivierung",
        shares: "Anteile & Kapital",
        governance: "Regeln & Beschlüsse",
        history: "Aktivitätsprotokoll",
      },
      en: {
        profile: "Profile & About",
        address: "Address & Office",
        legal: "Statutes & Status",
        shares: "Shares & Capital",
        governance: "Rules & Meetings",
        history: "Activity History",
      },
    }),
    [],
  );

  const handleImageUpload = async (file, fieldName, setUploading) => {
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadFileAndGetURL(file, "coop");
      if (url) {
        updateField(fieldName, url);
        toast.success(
          lang === "de" ? "Erfolgreich hochgeladen" : "Successfully uploaded",
        );
      }
    } catch (err) {
      toast.error(lang === "de" ? "Fehler beim Hochladen" : "Failed to upload");
    } finally {
      setUploading(false);
    }
  };

  useEffect(() => {
    setFormState(initialValues);
  }, [initialValues]);

  const infoText = useMemo(
    () => ({
      de: {
        quorumTypeOne: "ANTEILSBASIERT = Quorum über vertretene Anteile",
        quorumTypeTwo: "MITGLIEDERBASIERT = Quorum über vertretene Mitglieder",
        quorumTypeInfo:
          "ANTEILSBASIERT = Quorum über vertretene Anteile. \nMITGLIEDERBASIERT = Quorum über vertretene Mitglieder.",
        saveReason: "Änderungsgrund (optional)",
        memberNumberFormatInfo:
          "Nur Buchstaben und Zahlen erlaubt, keine Leerzeichen oder Sonderzeichen.",
        autoApprovalInfo:
          "Wenn aktiviert, werden neue Mitgliedschaften automatisch freigegeben.",
        autoApprovalSharesInfo: "Anzahl der Anteile für automatische Freigabe.",
        goLiveInfo:
          "Wenn aktiviert, wird die Genossenschaft sofort aktiv. Andernfalls bleibt sie im Entwurfsmodus, bis sie manuell aktiviert wird.",
      },
      en: {
        quorumTypeOne: "ANTEILSBASIERT = quorum based on represented shares",
        quorumTypeTwo:
          "MITGLIEDERBASIERT = quorum based on represented members",
        quorumTypeInfo:
          "ANTEILSBASIERT = quorum based on represented shares. \nMITGLIEDERBASIERT = quorum based on represented members.",
        saveReason: "Change reason (optional)",
        memberNumberFormatInfo:
          "Only letters and numbers are allowed, no spaces or special characters.",
        autoApprovalInfo: "When enabled, membership is automatically approved.",
        autoApprovalSharesInfo: "Number of shares used for automatic approval.",
        goLiveInfo:
          "When enabled, the cooperative will be activated immediately. Otherwise, it will remain in draft mode until manually activated.",
      },
    }),
    [],
  );

  const [changeReason, setChangeReason] = useState("");

  const isFormValidExceptLive = useMemo(() => {
    const testState = {
      ...formState,
      isLive: false,
    };
    const validation = validateCooperativeSettings(testState);
    return validation.isValid;
  }, [formState]);

  const canMakeLive = useMemo(() => {
    return (
      isFormValidExceptLive && Boolean(formState.hasSatzung) && isSubscribed
    );
  }, [isFormValidExceptLive, formState.hasSatzung, isSubscribed]);

  const updateField = (key, value) => {
    setFormState((prev) => {
      const nextState = {
        ...prev,
        [key]: numberFields.includes(key)
          ? Number.parseInt(value || "", 10)
          : value,
      };

      if (key === "isLive" && value === true) {
        const testState = { ...nextState, isLive: false };
        const validation = validateCooperativeSettings(testState);
        const satzungOk = Boolean(nextState.hasSatzung);
        const bankOk = isSubscribed;
        if (!validation.isValid || !satzungOk || !bankOk) {
          return prev;
        }
      }

      return nextState;
    });
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const validation = validateCooperativeSettings(formState);

    if (hasNoSettingsChange(validation.normalized, initialValues)) {
      setErrors([]);
      onValidationWarnings([]);
      onNoChanges?.();
      return;
    }

    if (!validation.isValid) {
      setErrors(validation.errors);
      // Automatically switch to first tab with errors to assist user
      if (
        validation.errors.some(
          (e) =>
            e.toLowerCase().includes("name") ||
            e.toLowerCase().includes("city"),
        )
      ) {
        setActiveTab("profile");
      } else if (
        validation.errors.some(
          (e) =>
            e.toLowerCase().includes("register") ||
            e.toLowerCase().includes("format") ||
            e.toLowerCase().includes("satzung"),
        )
      ) {
        setActiveTab("legal");
      } else if (
        validation.errors.some(
          (e) =>
            e.toLowerCase().includes("share") ||
            e.toLowerCase().includes("approval"),
        )
      ) {
        setActiveTab("shares");
      } else if (
        validation.errors.some(
          (e) =>
            e.toLowerCase().includes("year") ||
            e.toLowerCase().includes("notice") ||
            e.toLowerCase().includes("quorum"),
        )
      ) {
        setActiveTab("governance");
      }
      onValidationWarnings([]);
      toast.error(
        lang === "de"
          ? "Fehler im Formular"
          : "Please resolve validation errors",
      );
      return;
    }

    setErrors([]);
    onValidationWarnings(validation.warnings);
    onSubmit(
      validation.normalized,
      changeReason ||
        `${formState.cooperative_name} - ${new Date().toLocaleDateString()}`,
      validation.warnings,
    );
  };

  const handleCalculateTotalMembers = async () => {
    if (!selectedCoop) return;
    setIsCalculating(true);
    try {
      const total = await newVerifiedMemeberFromRelationTable(selectedCoop);
      updateField("totalMember", total);
      toast.success(
        lang === "de"
          ? `Gesamtmitglieder berechnet: ${total}`
          : `Total members calculated: ${total}`,
      );
    } catch (error) {
      toast.error(
        lang === "de"
          ? "Fehler bei der Berechnung der Gesamtmitglieder"
          : "Failed to calculate total members",
      );
    } finally {
      setIsCalculating(false);
    }
  };

  const isDirty = !hasNoSettingsChange(formState, initialValues);

  return (
    <form
      onSubmit={handleSubmit}
      className={`space-y-2 ${isDirty ? "pb-32" : ""}`}
      noValidate
    >
      {/* Premium Banner and Overlapping Logo Header */}
      <div className="p-1 overflow-hidden bg-white border border-gray-100 shadow-sm dark:bg-slate-800 rounded-2xl dark:border-slate-700 md:p-1.5 animate-fadeIn">
        {/* Banner Area */}
        <div
          onClick={() => bannerInputRef.current?.click()}
          className="relative w-full overflow-hidden transition-all duration-300 border border-gray-100 shadow-inner cursor-pointer h-44 md:h-60 rounded-xl group bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 dark:border-slate-700"
        >
          {formState.bannerUrl ? (
            <img
              src={formState.bannerUrl}
              alt="Banner"
              className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-103"
            />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-white bg-black/10">
              <ImagePlus className="w-10 h-10 mb-2 opacity-80 animate-pulse" />
              <span className="text-sm font-semibold tracking-wide">
                {lang === "de" ? "Titelbild hochladen" : "Upload Cover Photo"}
              </span>
              <span className="mt-1 text-xs opacity-75">
                {lang === "de"
                  ? "Empfohlen: 1200x400 px (Max 5MB)"
                  : "Recommended: 1200x400 px (Max 5MB)"}
              </span>
            </div>
          )}
          {/* Cover Hover Overlay */}
          <div className="absolute inset-0 flex items-center justify-center gap-2 text-sm font-medium text-white transition-opacity duration-200 opacity-0 bg-black/40 group-hover:opacity-100 backdrop-blur-xs">
            <Camera className="w-5 h-5" />
            {lang === "de" ? "Titelbild ändern" : "Change Cover Photo"}
          </div>

          {isUploadingBanner && (
            <div className="absolute inset-0 flex items-center justify-center gap-2 text-sm font-medium text-white bg-black/60">
              <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />
              {lang === "de" ? "Wird hochgeladen..." : "Uploading cover..."}
            </div>
          )}
        </div>
        <input
          type="file"
          ref={bannerInputRef}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file)
              handleImageUpload(file, "bannerUrl", setIsUploadingBanner);
          }}
          accept="image/jpeg,image/png"
          className="hidden"
        />

        {/* Logo and Identity Details */}
        <div className="relative z-10 flex flex-col items-start px-4 pb-2 sm:flex-row sm:items-end">
          {/* Logo overlapping container */}
          <div className="relative inline-block -mt-16 sm:-mt-20">
            <div
              onClick={() => logoInputRef.current?.click()}
              className="relative w-28 h-28 sm:w-36 sm:h-36 rounded-lg overflow-hidden cursor-pointer group border-4 border-white dark:border-slate-800 bg-white dark:bg-slate-700 shadow-md transition-transform hover:scale-[1.02]"
            >
              {formState.logo ? (
                <img
                  src={formState.logo}
                  alt="Logo"
                  className="object-contain w-full h-full rounded-lg"
                />
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center p-2 text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-slate-700/50">
                  <Building2 className="w-10 h-10 mb-1" />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-center">
                    {lang === "de" ? "+ Logo" : "+ Logo"}
                  </span>
                </div>
              )}
              {/* Logo Hover Overlay */}
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 text-xs font-medium text-white transition-opacity duration-200 opacity-0 bg-black/40 group-hover:opacity-100">
                <Camera className="w-4 h-4" />
                {lang === "de" ? "Ändern" : "Update"}
              </div>
              {isUploadingLogo && (
                <div className="absolute inset-0 flex items-center justify-center text-white bg-black/60">
                  <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />
                </div>
              )}
            </div>
            <input
              type="file"
              ref={logoInputRef}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleImageUpload(file, "logo", setIsUploadingLogo);
              }}
              accept="image/jpeg,image/png"
              className="hidden"
            />
          </div>

          {/* Quick info metadata */}
          <div className="flex-1 min-w-0 mt-3 sm:mt-0 sm:ml-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h1 className="text-xl font-bold text-gray-900 truncate sm:text-2xl dark:text-white">
                  {formState.cooperative_name ||
                    (lang === "de"
                      ? "Name der Genossenschaft"
                      : "Cooperative Name")}
                </h1>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1.5 mt-0.5">
                  <Building2 className="w-3.5 h-3.5 text-gray-400" />
                  {formState.sector ||
                    (lang === "de"
                      ? "Branche nicht gesetzt"
                      : "Sector not set")}
                  {formState.location && (
                    <>
                      <span className="text-gray-300 dark:text-slate-600">
                        •
                      </span>
                      <MapPin className="w-3.5 h-3.5 text-gray-400" />
                      <span>{formState.location}</span>
                    </>
                  )}
                </p>
              </div>

              {/* Language Selection */}
              <div className="self-end sm:self-center">
                <select
                  value={lang}
                  onChange={(e) => setLang(e.target.value)}
                  className="px-3 py-1.5 text-xs font-medium border rounded-lg bg-gray-50 hover:bg-gray-100 border-gray-200 dark:bg-slate-700 dark:text-white dark:border-slate-600 transition-colors focus:ring-1 focus:ring-blue-500"
                >
                  <option value="de">Deutsch</option>
                  <option value="en">English</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Grid containing Sidebar navigation and Tab panels */}
      <div className="grid grid-cols-1 gap-2 md:grid-cols-4 lg:grid-cols-5">
        {/* Mobile Tab Selector (Hamburger Dropdown) */}
        <div className="relative md:hidden z-25">
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="flex items-center justify-between w-full px-4 py-3 text-sm font-semibold text-gray-800 transition-colors bg-white border border-gray-200 shadow-sm dark:bg-slate-800 dark:border-slate-700 rounded-xl dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-slate-750"
          >
            <div className="flex items-center gap-2.5">
              <span className="text-blue-500">{icons[activeTab]}</span>
              <span>{tabLabels[lang][activeTab]}</span>
            </div>
            <Menu className="w-5 h-5 text-gray-500" />
          </button>

          {isMobileMenuOpen && (
            <div
              className="absolute left-0 right-0 z-30 py-1 mt-2 overflow-hidden bg-white border border-gray-200 shadow-xl dark:bg-slate-800 dark:border-slate-700 rounded-xl animate-fadeInUp"
              style={{ animationDuration: "150ms" }}
            >
              {Object.keys(tabLabels[lang]).map((tabKey) => {
                const isActive = activeTab === tabKey;
                return (
                  <button
                    key={tabKey}
                    type="button"
                    onClick={() => {
                      setActiveTab(tabKey);
                      setIsMobileMenuOpen(false);
                    }}
                    className={`flex items-center gap-3 w-full text-left px-4 py-3 text-xs font-semibold transition-all ${
                      isActive
                        ? "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400"
                        : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-700/50"
                    }`}
                  >
                    <span
                      className={`${isActive ? "text-blue-500" : "text-gray-400"}`}
                    >
                      {icons[tabKey]}
                    </span>
                    <span>{tabLabels[lang][tabKey]}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Sidebar Nav Panels */}
        <div className="hidden space-y-1 md:block md:col-span-1 lg:col-span-1">
          <div className="p-2 space-y-1 bg-white border border-gray-100 shadow-sm dark:bg-slate-800 dark:border-slate-700 rounded-2xl">
            {Object.keys(tabLabels[lang]).map((tabKey) => {
              const isActive = activeTab === tabKey;

              return (
                <button
                  key={tabKey}
                  type="button"
                  onClick={() => setActiveTab(tabKey)}
                  className={`flex items-center gap-3 w-full text-left px-4 py-3 text-xs font-semibold rounded-xl transition-all ${
                    isActive
                      ? "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400"
                      : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-700/50"
                  }`}
                >
                  <span
                    className={`${isActive ? "text-blue-500" : "text-gray-400"}`}
                  >
                    {icons[tabKey]}
                  </span>
                  <span>{tabLabels[lang][tabKey]}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Content Panel */}
        <div className="space-y-3 md:col-span-3 lg:col-span-4">
          {/* Validation Errors banner inside the active pane */}
          {errors.length > 0 && (
            <div className="p-4 border border-red-200 rounded-xl bg-red-50 dark:bg-red-950/20 dark:border-red-900/50 animate-shake">
              <div className="flex gap-2.5">
                <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-bold text-red-800 dark:text-red-300">
                    {lang === "de"
                      ? "Bitte korrigieren Sie folgende Fehler:"
                      : "Please correct the following errors:"}
                  </h4>
                  <ul className="mt-2 space-y-1 text-xs text-red-700 list-disc list-inside dark:text-red-400">
                    {errors.map((error, idx) => (
                      <li key={idx}>{error}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Render individual Tab details */}
          <div className="bg-white dark:bg-slate-800 p-5 md:p-6 border border-gray-100 dark:border-slate-700 shadow-sm rounded-2xl min-h-[350px] transition-all">
            {/* Active Tab Panel Header */}
            <div className="pb-4 mb-5 border-b border-gray-100 dark:border-slate-700">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                {tabLabels[lang][activeTab]}
              </h2>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                {activeTab === "profile" &&
                  (lang === "de"
                    ? "Legen Sie den Namen, die Branche und eine kurze Genossenschaftsbeschreibung fest."
                    : "Define cooperative name, sector description, and general background information.")}
                {activeTab === "address" &&
                  (lang === "de"
                    ? "Erfassen Sie die Anschrift und den gesetzlichen Sitz Ihrer Genossenschaft."
                    : "Configure the street address, location city, and corporate sitz settings.")}
                {activeTab === "legal" &&
                  (lang === "de"
                    ? "Hinterlegen Sie die Registerdaten Ihrer Genossenschaft und aktivieren Sie den Live-Betrieb."
                    : "Manage court registry files, member ID configurations, statutes status, and go-live controls.")}
                {activeTab === "shares" &&
                  (lang === "de"
                    ? "Bestimmen Sie Anteilspreise, Höchstgrenzen und verwalten Sie die Mitgliederanzahl."
                    : "Configure capital pricing, share ownership boundaries, and membership count calculators.")}
                {activeTab === "governance" &&
                  (lang === "de"
                    ? "Konfigurieren Sie Quoren, Kündigungsfristen und Vorgaben für das Geschäftsjahr."
                    : "Define legal assembly thresholds, voting quorums, notification durations, and exit terms.")}
                {activeTab === "history" &&
                  (lang === "de"
                    ? "Prüfen Sie frühere Konfigurationsänderungen und deren Gründe."
                    : "Inspect past configuration changes, authors, timestamps, and justification records.")}
              </p>
            </div>

            {/* TAB: PROFILE */}
            {activeTab === "profile" && (
              <div className="space-y-5">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <TextInputField
                    label={labels.cooperative_name}
                    value={formState.cooperative_name}
                    placeholder="E.g., Global Green Coop eG"
                    onChange={(value) => updateField("cooperative_name", value)}
                    maxLength={200}
                    disabled={true}
                  />
                  <TextInputField
                    label={labels.sector}
                    value={formState.sector}
                    placeholder="E.g., Energy, Agriculture"
                    onChange={(value) => updateField("sector", value)}
                    isRequired={false}
                    disabled={true}
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <TextInputField
                    type="date"
                    label={labels.incorporatedAt}
                    value={formState.incorporatedAt}
                    onChange={(value) => updateField("incorporatedAt", value)}
                    isRequired={false}
                    disabled={true}
                  />
                </div>

                <TextAreaField
                  label={labels.about}
                  value={formState.about}
                  placeholder="Tell members about your cooperative's goals and vision..."
                  onChange={(value) => updateField("about", value)}
                  rows={6}
                  isRequired={false}
                />
              </div>
            )}

            {/* TAB: ADDRESS */}
            {activeTab === "address" && (
              <div className="space-y-5">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <div className="md:col-span-2">
                    <TextInputField
                      label={labels.street}
                      value={formState.street}
                      placeholder="Main Street"
                      onChange={(value) => updateField("street", value)}
                      isRequired={false}
                      disabled={true}
                    />
                  </div>
                  <div>
                    <TextInputField
                      label={labels.houseNo}
                      value={formState.houseNo}
                      placeholder="12a"
                      onChange={(value) => updateField("houseNo", value)}
                      isRequired={false}
                      disabled={true}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <div>
                    <TextInputField
                      label={labels.postalCode}
                      value={formState.postalCode}
                      placeholder="12345"
                      onChange={(value) => updateField("postalCode", value)}
                      isRequired={false}
                      disabled={true}
                    />
                  </div>
                  <div>
                    <TextInputField
                      label={labels.location}
                      value={formState.location}
                      placeholder="City Name"
                      onChange={(value) => updateField("location", value)}
                      isRequired={false}
                      disabled={true}
                    />
                  </div>
                  <div>
                    <TextInputField
                      label={labels.registered_office_city}
                      value={formState.registered_office_city}
                      placeholder="Corporate Sitz"
                      onChange={(value) =>
                        updateField("registered_office_city", value)
                      }
                      isRequired={true}
                      disabled={true}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <TextInputField
                    label={labels.country}
                    value={formState.country}
                    placeholder="E.g., Germany"
                    onChange={(value) => updateField("country", value)}
                    isRequired={false}
                    disabled={true}
                  />
                </div>
              </div>
            )}

            {/* TAB: LEGAL & STATUTES */}
            {activeTab === "legal" && (
              <div className="space-y-5">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <TextInputField
                    label={labels.register_court}
                    value={formState.register_court}
                    placeholder="Amtsgericht München"
                    onChange={(value) => updateField("register_court", value)}
                  />
                  <TextInputField
                    label={labels.register_number}
                    value={formState.register_number}
                    placeholder="GnR 12345"
                    onChange={(value) => updateField("register_number", value)}
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <TextInputField
                    label={labels.member_number_format}
                    value={formState.member_number_format}
                    onChange={(value) => {
                      value = value.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
                      updateField("member_number_format", value);
                    }}
                    placeholder="C000"
                    infoMessage={infoText[lang].memberNumberFormatInfo}
                  />
                </div>

                {/* Statutes Upload status details */}
                <div className="p-4 space-y-3 border border-gray-100 dark:border-slate-700 bg-gray-50/50 dark:bg-slate-800/50 rounded-xl">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-blue-500" />
                    {lang === "de"
                      ? "Satzungs-Status"
                      : "Statutes Upload Status"}
                  </h4>
                  <div className="flex items-center justify-between text-xs sm:text-sm">
                    <span className="text-gray-600 dark:text-gray-300">
                      {lang === "de"
                        ? "Satzung im System hinterlegt:"
                        : "Statutes file uploaded in documents:"}
                    </span>
                    {formState.hasSatzung ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-green-700 bg-green-50 dark:bg-green-950/20 dark:text-green-400 rounded-full border border-green-200 dark:border-green-900/50">
                        {lang === "de" ? "Vorhanden" : "Uploaded"}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-red-700 bg-red-50 dark:bg-red-950/20 dark:text-red-400 rounded-full border border-red-200 dark:border-red-900/50">
                        {lang === "de" ? "Fehlt" : "Missing"}
                      </span>
                    )}
                  </div>
                  {!formState.hasSatzung && (
                    <p className="text-xs text-yellow-600 dark:text-yellow-400">
                      {lang === "de"
                        ? "Um live schalten zu können, müssen Sie zuerst Ihre Genossenschaftssatzung im Dokumenten-Tab hochladen."
                        : "Before activating (Make Live), upload your statutes (Satzung) document in the documents dashboard."}
                    </p>
                  )}
                </div>

                {/* Live Activation Box */}
                <div className="pt-4 border-t border-gray-100 dark:border-slate-700">
                  {!canMakeLive && !formState.isLive && (
                    <div className="p-4 mb-4 text-xs text-yellow-800 border border-yellow-200 rounded-xl bg-yellow-50 dark:bg-yellow-950/20 dark:border-yellow-900/50 sm:text-sm dark:text-yellow-300">
                      <p className="font-bold flex items-center gap-1.5">
                        <AlertTriangle className="w-4 h-4 text-yellow-600" />
                        {lang === "de"
                          ? "Aktivierungsvoraussetzungen fehlen:"
                          : "Activation requirements missing:"}
                      </p>
                      <ul className="mt-1.5 list-disc list-inside space-y-0.5 pl-1 text-xs opacity-90">
                        {!isFormValidExceptLive && (
                          <li>
                            {lang === "de"
                              ? "Bitte füllen Sie alle erforderlichen Registrierfelder aus."
                              : "Please fill and validate all other required settings."}
                          </li>
                        )}
                        {!formState.hasSatzung && (
                          <li>
                            {lang === "de"
                              ? "Ein Satzungsdokument (Kategorie SATZUNG) muss hochgeladen sein."
                              : "A statutes document of category 'SATZUNG' must be present."}
                          </li>
                        )}
                        {!isSubscribed && (
                          <li>
                            {lang === "de"
                              ? "Ihr Konto hat kein aktives Abonnement."
                              : "Account does not have an active subscription."}
                          </li>
                        )}
                      </ul>
                    </div>
                  )}

                  <ToggleField
                    label={labels.isLive}
                    value={formState.isLive}
                    checked={Boolean(formState.isLive)}
                    placeholder={labels.isLive}
                    disabled={!canMakeLive && !formState.isLive}
                    onChange={(value) => updateField("isLive", value)}
                    infoMessage={infoText[lang].goLiveInfo}
                  />
                </div>
              </div>
            )}

            {/* TAB: SHARES & CAPITAL */}
            {activeTab === "shares" && (
              <div className="space-y-5">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <div>
                    <TextInputField
                      type="number"
                      label={labels.share_price_cents}
                      value={formState.share_price_cents}
                      placeholder="10000"
                      onChange={(value) =>
                        updateField("share_price_cents", value)
                      }
                      helperText={
                        formState.share_price_cents
                          ? `€ ${(formState.share_price_cents / 100).toFixed(2)}`
                          : "€ 0.00"
                      }
                    />
                  </div>
                  <div>
                    <TextInputField
                      type="number"
                      label={labels.min_shares}
                      value={formState.min_shares}
                      placeholder="1"
                      onChange={(value) => updateField("min_shares", value)}
                    />
                  </div>
                  <div>
                    <TextInputField
                      type="number"
                      label={labels.max_shares}
                      value={formState.max_shares}
                      placeholder="100"
                      onChange={(value) => updateField("max_shares", value)}
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-150 dark:border-slate-700">
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <ToggleField
                      label={labels.auto_approval_membership}
                      checked={Boolean(formState.auto_approval_membership)}
                      placeholder={labels.auto_approval_membership}
                      onChange={(value) =>
                        updateField("auto_approval_membership", value)
                      }
                      infoMessage={infoText[lang].autoApprovalInfo}
                      disabled={true}
                    />
                    <TextInputField
                      type="number"
                      label={labels.auto_approval_shares}
                      value={formState.auto_approval_shares}
                      onChange={(value) =>
                        updateField("auto_approval_shares", value)
                      }
                      isRequired={Boolean(formState.auto_approval_membership)}
                      disabled={!formState.auto_approval_membership}
                      placeholder="10"
                      infoMessage={infoText[lang].autoApprovalSharesInfo}
                    />
                  </div>
                </div>

                <div className="flex flex-col items-center justify-between gap-4 p-4 border border-gray-100 dark:border-slate-700 bg-gray-50/50 dark:bg-slate-800/50 rounded-xl sm:flex-row">
                  <div className="w-full sm:w-auto">
                    <span className="block text-xs font-bold tracking-wider text-gray-500 uppercase dark:text-gray-400">
                      {labels.totalMember}
                    </span>
                    <span className="block mt-1 text-xl font-extrabold text-gray-800 md:text-2xl dark:text-gray-100">
                      {formState.totalMember ? formState.totalMember : 0}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleCalculateTotalMembers}
                    disabled={isCalculating || !selectedCoop}
                    className="flex items-center justify-center w-full gap-2 px-4 py-2 text-xs font-semibold text-blue-600 transition-all border border-blue-200 sm:w-auto dark:text-blue-400 hover:text-white dark:hover:text-white bg-blue-50 dark:bg-blue-900/10 hover:bg-blue-600 dark:hover:bg-blue-600 dark:border-blue-800/50 rounded-xl disabled:opacity-50"
                  >
                    {isCalculating ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Calculator className="w-4 h-4" />
                    )}
                    {lang === "de"
                      ? "Mitglieder berechnen"
                      : "Calculate Members"}
                  </button>
                </div>
              </div>
            )}

            {/* TAB: GOVERNANCE & OPERATIONS */}
            {activeTab === "governance" && (
              <div className="space-y-5">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <TextInputField
                    label={labels.fiscal_year_start}
                    value={formState.fiscal_year_start}
                    onChange={(value) =>
                      updateField("fiscal_year_start", value)
                    }
                    placeholder="01-01"
                  />
                  <TextInputField
                    label={labels.fiscal_year_end}
                    value={formState.fiscal_year_end}
                    onChange={(value) => updateField("fiscal_year_end", value)}
                    placeholder="12-31"
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <div className="md:col-span-2">
                    <SelectField
                      label={labels.quorum_type}
                      value={formState.quorum_type}
                      onChange={(value) => updateField("quorum_type", value)}
                      options={QUORUM_TYPES}
                      infoMessage={infoText[lang].quorumTypeInfo}
                    />
                  </div>
                  <div>
                    <TextInputField
                      type="number"
                      label={labels.quorum_threshold_percent}
                      value={formState.quorum_threshold_percent}
                      onChange={(value) =>
                        updateField("quorum_threshold_percent", value)
                      }
                      placeholder="25"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <TextInputField
                    type="number"
                    label={labels.agm_notice_period_days}
                    value={formState.agm_notice_period_days}
                    onChange={(value) =>
                      updateField("agm_notice_period_days", value)
                    }
                    placeholder="14"
                  />
                  <TextInputField
                    type="number"
                    label={labels.member_exit_notice_period_days}
                    value={formState.member_exit_notice_period_days}
                    placeholder="30"
                    onChange={(value) =>
                      updateField("member_exit_notice_period_days", value)
                    }
                  />
                </div>
              </div>
            )}

            {/* TAB: ACTIVITY HISTORY */}
            {activeTab === "history" && (
              <div className="space-y-1">
                <SettingsHistoryTimeline
                  history={history}
                  isLoading={isHistoryLoading}
                  error={historyError}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Floating Save Changes Bar - Bottom Right Viewport */}
      <div
        className={`fixed bottom-6 right-6 z-[100] transition-all duration-300 ease-out transform ${
          isDirty
            ? "translate-y-0 opacity-100 scale-100"
            : "translate-y-12 opacity-0 scale-95 pointer-events-none"
        }`}
      >
        <div className="flex flex-col gap-3 p-3 bg-white/95 dark:bg-slate-900/95 border border-gray-200 dark:border-slate-800 shadow-2xl rounded-lg backdrop-blur-md w-[320px]">
          <div className="flex items-center gap-2.5 text-xs font-semibold text-gray-700 dark:text-gray-300">
            <AlertCircle className="w-4 h-4 text-blue-500 animate-pulse shrink-0" />
            <span>
              {lang === "de" ? "Ungespeicherte Änderungen" : "Unsaved Changes"}
              <span className="text-red-500 ml-0.5">*</span>
            </span>
          </div>

          <input
            type="text"
            required={true}
            value={changeReason}
            onChange={(e) => setChangeReason(e.target.value)}
            placeholder={
              lang === "de"
                ? "Grund für die Änderung..."
                : "Reason for change..."
            }
            className="px-3 py-1.5 text-xs border border-gray-200 rounded-md bg-gray-50 dark:bg-slate-800 dark:text-white dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 w-full"
          />

          <div className="flex items-center justify-end w-full gap-2">
            <button
              type="button"
              onClick={() => {
                setFormState(initialValues);
                setChangeReason("");
                setErrors([]);
                toast.success(
                  lang === "de" ? "Änderungen verworfen" : "Changes reset",
                );
              }}
              className="px-4 py-2 text-xs font-semibold text-gray-700 transition-colors rounded-md hover:bg-gray-100 dark:text-gray-300 dark:bg-slate-800 dark:hover:bg-slate-700 hover:bg-gray-200/70"
            >
              {lang === "de" ? "Verwerfen" : "Reset"}
            </button>

            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-60 rounded-md flex items-center gap-1.5 transition-all shadow-md shadow-blue-500/10"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  {lang === "de" ? "Speichern..." : "Saving..."}
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  {lang === "de" ? "Speichern" : "Save"}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}
