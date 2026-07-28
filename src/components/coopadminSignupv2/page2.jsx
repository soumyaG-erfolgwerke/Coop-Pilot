"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Search,
  Building2,
  ChevronRight,
  AlertCircle,
  AlertTriangle,
  MapPin,
  Scale,
  Building,
  Users,
  Trash2,
  Plus,
  CheckCircle2,
  X,
  Loader2,
} from "lucide-react";

const germanStates = [
  "Baden-Württemberg",
  "Bavaria (Bayern)",
  "Berlin",
  "Brandenburg",
  "Bremen",
  "Hamburg",
  "Hesse (Hessen)",
  "Lower Saxony (Niedersachsen)",
  "Mecklenburg-Vorpommern",
  "North Rhine-Westphalia (Nordrhein-Westfalen)",
  "Rhineland-Palatinate (Rheinland-Pfalz)",
  "Saarland",
  "Saxony (Sachsen)",
  "Saxony-Anhalt (Sachsen-Anhalt)",
  "Schleswig-Holstein",
  "Thuringia (Thüringen)",
];

const Page2 = ({
  handleChange,
  errors,
  onSelectBusiness,
  selectedCooperative,
  disableContinue,
  onSearchInput,
}) => {
  const [searchQuery, setSearchQuery] = useState(
    selectedCooperative?.name || "",
  );
  const [suggestions, setSuggestions] = useState([]);
  const [selectedBusiness, setSelectedBusiness] = useState(
    selectedCooperative || null,
  );
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [companyDetails, setCompanyDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState("");

  const debounceRef = useRef(null);

  const handleSearch = async (query) => {
    if (onSearchInput) {
      onSearchInput(query);
    }

    if (disableContinue && selectedBusiness) {
      setSelectedBusiness(null);
    }

    setSearchQuery(query);
    setApiError("");

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (query.trim().length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      try {
        setLoading(true);

        const response = await fetch(
          `/api/cooperative/search?query=${encodeURIComponent(query)}`,
        );

        if (!response.ok) {
          throw new Error("Failed to fetch cooperatives");
        }

        const data = await response.json();

        setSuggestions((data?.results || []).slice(0, 8));
        setShowSuggestions(true);
      } catch (error) {
        console.error(error);
        setApiError(
          "Wir konnten das Register nicht erreichen. Bitte versuchen Sie es erneut.",
        );
        setSuggestions([]);
        setShowSuggestions(true);
      } finally {
        setLoading(false);
      }
    }, 300);
  };

  const handleBusinessSelect = (business) => {
    const normalizedBusiness = {
      ...business,
      registerNumber: business.RegNumber,
      registerCourt: business.CourtName,
    };

    setSelectedBusiness(normalizedBusiness);
    setSearchQuery(normalizedBusiness.name);
    setShowSuggestions(false);

    handleChange({
      target: { name: "businessName", value: normalizedBusiness.name },
    });
    handleChange({
      target: {
        name: "registryNumber",
        value: normalizedBusiness.registerNumber,
      },
    });
    handleChange({
      target: { name: "courtName", value: normalizedBusiness.registerCourt },
    });
    handleChange({
      target: {
        name: "country",
        value:
          normalizedBusiness.country === "DE"
            ? "Germany"
            : normalizedBusiness.country,
      },
    });
    handleChange({
      target: { name: "legalForm", value: normalizedBusiness.legalForm },
    });
    handleChange({
      target: { name: "companyId", value: normalizedBusiness.id },
    });
  };

  const handleContinue = async () => {
    if (disableContinue) return;
    if (!selectedBusiness) return;
    if (!selectedBusiness.id) {
      setCompanyDetails(selectedBusiness);
      setShowConfirmModal(true);
      return;
    }

    try {
      setLoading(true);
      setApiError("");

      const response = await fetch(`/api/cooperative/${selectedBusiness.id}`);

      if (!response.ok) {
        throw new Error("Failed to fetch cooperative details");
      }

      const data = await response.json();
      setCompanyDetails(data);
      setShowConfirmModal(true);
    } catch (error) {
      console.error(error);
      setApiError("Failed to fetch cooperative details.");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmCooperative = () => {
    if (!companyDetails) return;
    // console.log("companyDetails: ", companyDetails);

    if (!companyDetails.name?.trim()) {
      setApiError("Legal cooperative name is required.");
      return;
    }

    if (!companyDetails.legalForm?.trim()) {
      setApiError("Legal form is required.");
      return;
    }

    if (!companyDetails.registerNumber?.trim()) {
      setApiError("Register number is required.");
      return;
    }

    if (!/^GnR\s?\d+$/i.test(companyDetails.registerNumber)) {
      setApiError('Register number must match format "GnR 1234".');
      return;
    }

    if (!companyDetails.registerCourt?.trim()) {
      setApiError("Register court is required.");
      return;
    }

    if (!companyDetails.address?.street?.trim()) {
      setApiError("Street address is required.");
      return;
    }

    if (!companyDetails.address?.postalCode?.trim()) {
      setApiError("Postal code is required.");
      return;
    }

    if (!/^\d{5}$/.test(companyDetails.address.postalCode)) {
      setApiError("Postal code must contain 5 digits.");
      return;
    }
    console.log(apiError);

    if (!companyDetails.address?.city?.trim()) {
      setApiError("City is required.");
      return;
    }

    if (!companyDetails.state?.trim()) {
      setApiError("Please select a Bundesland.");
      return;
    }

    if (
      !companyDetails.boardMembers ||
      companyDetails.boardMembers.length === 0
    ) {
      setApiError("At least one board member is required.");
      return;
    }

    const invalidMember = companyDetails.boardMembers.some(
      (member) => !member.name?.trim() || !member.city?.trim(),
    );

    if (invalidMember) {
      setApiError("Each board member requires name and city.");
      return;
    }

    setApiError("");
    onSelectBusiness(companyDetails);
    setShowConfirmModal(false);
  };

  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (selectedCooperative) {
      setSelectedBusiness(selectedCooperative);
      setSearchQuery(selectedCooperative.name || "");
    }
  }, [selectedCooperative]);

  return (
    <div className="max-w-2xl pt-6 mx-auto space-y-8 animate-fadeIn">
      <div className="space-y-3 text-center">
        <div className="flex items-center justify-center w-16 h-16 mx-auto border border-indigo-100 shadow-sm bg-indigo-50 dark:bg-indigo-900/30 rounded-2xl dark:border-indigo-800/50">
          <Building2 className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
        </div>
        <h2 className="text-2xl font-extrabold tracking-tight sm:text-3xl text-slate-900 dark:text-white">
          Find Your Cooperative
        </h2>
        <p className="max-w-md mx-auto text-sm text-slate-500 dark:text-slate-400">
          Search the official German registry to automatically import your
          cooperative's verified data.
        </p>
      </div>

      <div className="relative z-20">
        <label className="block mb-2 text-sm font-bold tracking-widest uppercase text-slate-700 dark:text-slate-300">
          Cooperative Name
        </label>

        <div className="flex flex-col items-center gap-3 sm:flex-row sm:gap-4">
          <div className="relative flex-1 w-full">
            <div className="absolute inset-y-0 left-0 z-10 flex items-center pl-4">
              {loading ? (
                <Loader2 size={18} className="text-indigo-500 animate-spin" />
              ) : (
                <Search size={18} className="text-slate-400" />
              )}
            </div>

            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="e.g. Muster eG..."
              className={`w-full py-3.5 pl-12 pr-4 bg-white dark:bg-slate-900 border rounded-xl text-sm font-medium shadow-sm transition-all focus:outline-none focus:ring-2 dark:text-white relative z-0 ${errors.businessName
                  ? "border-rose-300 focus:ring-rose-500/50 focus:border-rose-500 dark:border-rose-700"
                  : "border-slate-300 focus:ring-indigo-500/50 focus:border-indigo-500 dark:border-slate-700"
                }`}
            />

            {showSuggestions && (
              <div className="absolute z-50 w-full mt-2 overflow-hidden bg-white border shadow-xl border-slate-200 rounded-xl dark:bg-slate-800 dark:border-slate-700 top-full">
                {apiError && (
                  <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-rose-50 dark:bg-rose-900/10">
                    <div className="flex items-start gap-2.5 text-rose-700 dark:text-rose-400">
                      <AlertCircle size={18} className="shrink-0 mt-0.5" />
                      <p className="text-sm font-medium">{apiError}</p>
                    </div>
                  </div>
                )}

                {!apiError && suggestions.length > 0 && (
                  <div className="overflow-y-auto max-h-72 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-700">
                    {suggestions.map((business, index) => (
                      <button
                        key={business.id || index}
                        type="button"
                        onClick={() => handleBusinessSelect(business)}
                        className="w-full flex items-start justify-between px-5 py-3.5 text-left transition-colors border-b border-slate-100 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700/50 group"
                      >
                        <div className="min-w-0 pr-4">
                          <p className="text-sm font-bold truncate transition-colors text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                            {business.name}
                          </p>
                          <p className="mt-1 text-[11px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                            {business.RegNumber} • {business.CourtName}
                          </p>
                        </div>
                        {selectedBusiness?.id === business.id && (
                          <CheckCircle2
                            size={18}
                            className="text-emerald-500 shrink-0"
                          />
                        )}
                      </button>
                    ))}
                  </div>
                )}

                {!loading &&
                  !apiError &&
                  suggestions.length === 0 &&
                  searchQuery.length >= 2 && (
                    <div className="p-6 text-center">
                      <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                        No cooperatives found matching "{searchQuery}".
                      </p>
                    </div>
                  )}
              </div>
            )}
          </div>
        </div>
      </div>

      {selectedBusiness && (
        <div className="relative p-5 overflow-hidden border border-emerald-200 rounded-xl bg-emerald-50 dark:bg-emerald-900/10 dark:border-emerald-800/50">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <CheckCircle2 size={64} className="text-emerald-600" />
          </div>
          <div className="relative z-10 flex items-start gap-4">
            <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-800/50 text-emerald-600 dark:text-emerald-400 shrink-0">
              <Building className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <h3 className="text-[10px] font-bold text-emerald-800/70 dark:text-emerald-400/70 uppercase tracking-widest">
                Selected Cooperative
              </h3>
              <p className="mt-1 text-base font-bold text-emerald-900 dark:text-emerald-100">
                {selectedBusiness.name}
              </p>
              <div className="flex flex-wrap gap-2 mt-3">
                <span className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-md bg-emerald-200/50 text-emerald-800 dark:bg-emerald-800/40 dark:text-emerald-300">
                  {selectedBusiness.registerNumber}
                </span>
                <span className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-md bg-emerald-200/50 text-emerald-800 dark:bg-emerald-800/40 dark:text-emerald-300">
                  {selectedBusiness.registerCourt}
                </span>
                <span className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-md bg-emerald-200/50 text-emerald-800 dark:bg-emerald-800/40 dark:text-emerald-300">
                  {selectedBusiness.legalForm}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedBusiness && (
        <button
          type="button"
          onClick={handleContinue}
          disabled={loading || disableContinue}
          className="flex items-center justify-center w-full px-6 py-3.5 text-sm font-bold text-white transition-all duration-200 bg-indigo-600 rounded-xl shadow-sm shadow-indigo-500/20 hover:bg-indigo-700 hover:-translate-y-0.5 disabled:opacity-70 disabled:transform-none"
        >
          {loading ? (
            <>
              <Loader2 size={18} className="mr-2 animate-spin" /> Fetching
              Official Data...
            </>
          ) : (
            <>
              Review & Confirm <ChevronRight size={18} className="ml-1.5" />
            </>
          )}
        </button>
      )}

      {!selectedBusiness && (
        <div className="flex items-start gap-4 p-5 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-900/30">
          <div className="p-2 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400 shrink-0">
            <Scale className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-1.5">
              Official Register Sync
            </h3>
            <p className="text-xs leading-relaxed text-slate-500 dark:text-slate-400">
              We connect directly to the public German register (openregister)
              to auto-fill your cooperative's verified legal data, ensuring
              compliance and saving you time.
            </p>
          </div>
        </div>
      )}

      {showConfirmModal && companyDetails && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-sm">
          <div className="relative w-full max-w-3xl bg-white dark:bg-slate-900 shadow-2xl rounded-2xl flex flex-col max-h-[90vh] overflow-hidden border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80 shrink-0">
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  Verify Cooperative Data
                </h2>
                <p className="mt-0.5 text-xs font-medium text-slate-500 dark:text-slate-400">
                  Review the imported details and make adjustments if necessary.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="p-2 transition-colors rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-200 dark:hover:text-slate-200 dark:hover:bg-slate-800"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 p-6 space-y-6 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-700">
              {!String(companyDetails?.name || "").endsWith("eG") && (
                <div className="flex items-start gap-3 p-4 border bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20 rounded-xl">
                  <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-500 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-bold text-amber-800 dark:text-amber-400">
                      Missing "eG" Suffix
                    </h4>
                    <p className="mt-1 text-xs font-medium text-amber-700 dark:text-amber-400/80">
                      The official name of a cooperative usually ends with "eG".
                      Please verify the legal name below.
                    </p>
                  </div>
                </div>
              )}
              {apiError && (
                <div className="flex items-start gap-3 p-4 border border-rose-200 dark:border-rose-800 rounded-xl bg-rose-50 dark:bg-rose-900/20">
                  <AlertCircle
                    size={18}
                    className="text-rose-600 dark:text-rose-400 shrink-0 mt-0.5"
                  />

                  <p className="text-sm font-medium text-rose-700 dark:text-rose-300">
                    {apiError}
                  </p>
                </div>
              )}
              <section className="p-5 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50/50 dark:bg-slate-800/20">
                <h3 className="flex items-center gap-2 mb-4 text-xs font-bold tracking-widest uppercase text-slate-500 dark:text-slate-400">
                  <Scale className="w-4 h-4" /> Legal Identity
                </h3>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="md:col-span-2">
                    <label className="block mb-1.5 text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      Legal Name
                    </label>
                    <input
                      type="text"
                      value={companyDetails.name || ""}
                      onChange={(e) =>
                        setCompanyDetails((prev) => ({
                          ...prev,
                          name: e.target.value,
                        }))
                      }
                      className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none transition-all dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block mb-1.5 text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      Legal Form
                    </label>
                    <input
                      type="text"
                      value={companyDetails.legalForm || ""}
                      onChange={(e) =>
                        setCompanyDetails((prev) => ({
                          ...prev,
                          legalForm: e.target.value,
                        }))
                      }
                      className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none transition-all dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block mb-1.5 text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      Incorporation Date
                    </label>
                    <input
                      type="date"
                      value={companyDetails.incorporatedAt || ""}
                      onChange={(e) =>
                        setCompanyDetails((prev) => ({
                          ...prev,
                          incorporatedAt: e.target.value,
                        }))
                      }
                      className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none transition-all dark:text-white"
                    />
                  </div>
                </div>
              </section>

              <section className="p-5 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50/50 dark:bg-slate-800/20">
                <h3 className="flex items-center gap-2 mb-4 text-xs font-bold tracking-widest uppercase text-slate-500 dark:text-slate-400">
                  <Building2 className="w-4 h-4" /> Registration Details
                </h3>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <label className="block mb-1.5 text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      Register Number
                    </label>
                    <input
                      type="text"
                      value={companyDetails.registerNumber || ""}
                      onChange={(e) =>
                        setCompanyDetails((prev) => ({
                          ...prev,
                          registerNumber: e.target.value,
                        }))
                      }
                      className={`w-full px-4 py-2.5 bg-white dark:bg-slate-900 border rounded-xl text-sm font-medium focus:ring-2 outline-none transition-all dark:text-white ${companyDetails.registerNumber &&
                          !/^GnR \d+$/i.test(companyDetails.registerNumber)
                          ? "border-rose-300 focus:ring-rose-500/50 focus:border-rose-500 dark:border-rose-700"
                          : "border-slate-300 focus:ring-indigo-500/50 focus:border-indigo-500 dark:border-slate-700"
                        }`}
                    />
                    {companyDetails.registerNumber &&
                      !/^GnR \d+$/i.test(companyDetails.registerNumber) && (
                        <p className="text-[10px] font-bold text-rose-600 dark:text-rose-400 mt-1.5">
                          Format should be "GnR 1234"
                        </p>
                      )}
                  </div>
                  <div>
                    <label className="block mb-1.5 text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      Register Court
                    </label>
                    <input
                      type="text"
                      value={companyDetails.registerCourt || ""}
                      onChange={(e) =>
                        setCompanyDetails((prev) => ({
                          ...prev,
                          registerCourt: e.target.value,
                        }))
                      }
                      className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none transition-all dark:text-white"
                    />
                  </div>
                </div>
              </section>

              <section className="p-5 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50/50 dark:bg-slate-800/20">
                <h3 className="flex items-center gap-2 mb-4 text-xs font-bold tracking-widest uppercase text-slate-500 dark:text-slate-400">
                  <MapPin className="w-4 h-4" /> Registered Address
                </h3>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="md:col-span-2">
                    <label className="block mb-1.5 text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      Street Address
                    </label>
                    <input
                      type="text"
                      value={companyDetails.address?.street || ""}
                      onChange={(e) =>
                        setCompanyDetails((prev) => ({
                          ...prev,
                          address: { ...prev.address, street: e.target.value },
                        }))
                      }
                      className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none transition-all dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block mb-1.5 text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      Postal Code
                    </label>
                    <input
                      type="text"
                      value={companyDetails.address?.postalCode || ""}
                      onChange={(e) =>
                        setCompanyDetails((prev) => ({
                          ...prev,
                          address: {
                            ...prev.address,
                            postalCode: e.target.value,
                          },
                        }))
                      }
                      className={`w-full px-4 py-2.5 bg-white dark:bg-slate-900 border rounded-xl text-sm font-medium focus:ring-2 outline-none transition-all dark:text-white ${companyDetails.address?.postalCode &&
                          !/^\d{5}$/.test(companyDetails.address.postalCode)
                          ? "border-rose-300 focus:ring-rose-500/50 focus:border-rose-500 dark:border-rose-700"
                          : "border-slate-300 focus:ring-indigo-500/50 focus:border-indigo-500 dark:border-slate-700"
                        }`}
                    />
                    {companyDetails.address?.postalCode &&
                      !/^\d{5}$/.test(companyDetails.address.postalCode) && (
                        <p className="text-[10px] font-bold text-rose-600 dark:text-rose-400 mt-1.5">
                          Must be 5 digits
                        </p>
                      )}
                  </div>
                  <div>
                    <label className="block mb-1.5 text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      City
                    </label>
                    <input
                      type="text"
                      value={companyDetails.address?.city || ""}
                      onChange={(e) =>
                        setCompanyDetails((prev) => ({
                          ...prev,
                          address: { ...prev.address, city: e.target.value },
                        }))
                      }
                      className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none transition-all dark:text-white"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block mb-1.5 text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      Bundesland (State)
                    </label>
                    <select
                      value={companyDetails.state || ""}
                      onChange={(e) =>
                        setCompanyDetails((prev) => ({
                          ...prev,
                          state: e.target.value,
                        }))
                      }
                      className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none transition-all dark:text-white appearance-none"
                    >
                      <option value="">Select Bundesland</option>
                      {germanStates.map((state) => (
                        <option key={state} value={state}>
                          {state}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </section>

              <section className="p-5 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50/50 dark:bg-slate-800/20">
                <div className="space-y-3">
                  {(companyDetails.boardMembers || []).length === 0 ? (
                    <div className="py-4 text-xs italic font-medium text-center text-slate-400">
                      No board members listed.
                    </div>
                  ) : (
                    (companyDetails.boardMembers || []).map((member, index) => (
                      <div
                        key={index}
                        className="flex flex-col items-center gap-3 p-3 bg-white border shadow-sm sm:flex-row dark:bg-slate-900 border-slate-200 dark:border-slate-700 rounded-xl group"
                      >
                        <input
                          type="text"
                          placeholder="Full Name"
                          value={member.name || ""}
                          onChange={(e) => {
                            const updated = [...companyDetails.boardMembers];
                            updated[index].name = e.target.value;
                            setCompanyDetails((prev) => ({
                              ...prev,
                              boardMembers: updated,
                            }));
                          }}
                          className="flex-1 w-full px-3 py-2 text-sm font-medium transition-all bg-transparent border rounded-lg outline-none border-slate-200 dark:border-slate-700 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:text-white placeholder:text-slate-400"
                        />
                        <input
                          type="text"
                          placeholder="City"
                          value={member.city || ""}
                          onChange={(e) => {
                            const updated = [...companyDetails.boardMembers];
                            updated[index].city = e.target.value;
                            setCompanyDetails((prev) => ({
                              ...prev,
                              boardMembers: updated,
                            }));
                          }}
                          className="flex-1 w-full px-3 py-2 text-sm font-medium transition-all bg-transparent border rounded-lg outline-none border-slate-200 dark:border-slate-700 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:text-white placeholder:text-slate-400"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const updated = companyDetails.boardMembers.filter(
                              (_, i) => i !== index,
                            );
                            setCompanyDetails((prev) => ({
                              ...prev,
                              boardMembers: updated,
                            }));
                          }}
                          className="w-full sm:w-auto p-2.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 dark:hover:text-rose-400 rounded-lg transition-colors flex items-center justify-center"
                          title="Remove Member"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </section>
            </div>

            <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80 shrink-0">
              <p className="hidden sm:block text-[10px] font-bold text-slate-400 uppercase tracking-widest max-w-xs">
                Data originates from the public Handelsregister
              </p>

              <div className="flex justify-end w-full gap-3 sm:w-auto">
                <button
                  type="button"
                  onClick={() => setShowConfirmModal(false)}
                  className="px-5 py-2.5 text-sm font-bold text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-200 dark:focus:ring-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmCooperative}
                  className="px-6 py-2.5 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 rounded-xl transition-all shadow-sm shadow-indigo-500/20 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900"
                >
                  Confirm & Continue
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Page2;
