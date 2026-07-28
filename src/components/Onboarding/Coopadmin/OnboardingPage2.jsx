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
import { fetchCoopsDataById } from "@/services/onboardingServices/coopadmin/CoopHelpers";

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

const OnboardingPage2 = ({
  formData,
  handleChange,
  errors,
  onSelectBusiness,
  selectedCooperative,
  disableContinue,
  onSearchInput,
  allCoopsData,
}) => {
  const [selectedBusiness, setSelectedBusiness] = useState(
    selectedCooperative || null,
  );
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [companyDetails, setCompanyDetails] = useState(null);
  const [apiError, setApiError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleBusinessSelect = (business) => {
    if (onSearchInput) onSearchInput();

    // Normalizing business in case it doesn't match exactly what the form expects
    const normalizedBusiness = {
      ...business,
      registerNumber: business.registerNumber || business.RegNumber,
      registerCourt: business.registerCourt || business.CourtName,
    };

    setSelectedBusiness(normalizedBusiness);
    setApiError("");

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
            : normalizedBusiness.country || "Germany",
      },
    });
    handleChange({
      target: { name: "legalForm", value: normalizedBusiness.legalForm },
    });
    handleChange({
      target: {
        name: "companyId",
        value: normalizedBusiness.$id || normalizedBusiness.id,
      },
    });
  };

  const handleContinue = async () => {
    if (disableContinue) return;
    if (!selectedBusiness) {
      setApiError("Please select a cooperative");
      return;
    }

    setLoading(true);
    setApiError("");

    try {
      const fullDetails = await fetchCoopsDataById(selectedBusiness.$id);

      setCompanyDetails(fullDetails.coop);
      setShowConfirmModal(true);
    } catch (error) {
      console.error(error);
      setApiError("An error occurred while preparing cooperative details.");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmCooperative = () => {
    if (!companyDetails) return;

    /*
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

    if (!companyDetails.registerCourt?.trim()) {
      setApiError("Register court is required.");
      return;
    }
    */

    setApiError("");
    onSelectBusiness(companyDetails);
    setShowConfirmModal(false);
  };

  useEffect(() => {
    if (selectedCooperative) {
      setSelectedBusiness(selectedCooperative);
    }
  }, [selectedCooperative]);

  return (
    <div className="max-w-2xl pt-6 mx-auto space-y-8 animate-fadeIn">
      <div className="space-y-3 text-center">
        <div className="flex items-center justify-center w-16 h-16 mx-auto border border-indigo-100 shadow-sm bg-indigo-50 dark:bg-indigo-900/30 rounded-2xl dark:border-indigo-800/50">
          <Building2 className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
        </div>
        <h2 className="text-2xl font-extrabold tracking-tight sm:text-3xl text-slate-900 dark:text-white">
          Select Your Cooperative
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
            <select
              value={selectedBusiness?.$id || selectedBusiness?.id || ""}
              onChange={(e) => {
                const selected = allCoopsData?.find(
                  (c) => c.$id === e.target.value || c.id === e.target.value,
                );
                if (selected) {
                  handleBusinessSelect(selected);
                }
              }}
              className={`w-full py-3.5 px-4 bg-white dark:bg-slate-900 border rounded-xl text-sm font-medium shadow-sm transition-all focus:outline-none focus:ring-2 dark:text-white appearance-none ${
                errors.businessName
                  ? "border-rose-300 focus:ring-rose-500/50 focus:border-rose-500 dark:border-rose-700"
                  : "border-slate-300 focus:ring-indigo-500/50 focus:border-indigo-500 dark:border-slate-700"
              }`}
            >
              <option value="" disabled>
                Select a Cooperative...
              </option>
              {allCoopsData?.map((coop, idx) => (
                <option
                  key={coop.$id || coop.id || idx}
                  value={coop.$id || coop.id}
                >
                  {coop.name}
                </option>
              ))}
            </select>
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
                {/* <span className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-md bg-emerald-200/50 text-emerald-800 dark:bg-emerald-800/40 dark:text-emerald-300">
                  {selectedBusiness.legalForm}
                </span> */}
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
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-1.5">
              Select Your Cooperative
            </h3>
            <p className="text-xs leading-relaxed text-slate-500 dark:text-slate-400">
              Please choose the cooperative you have been invited to administer
              from the list above.
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
                  <div>
                    <label className="block mb-1.5 text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      Legal Name
                    </label>
                    <input
                      type="text"
                      readOnly
                      value={companyDetails.name || ""}
                      className="w-full px-4 py-2.5 bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-300 outline-none cursor-not-allowed"
                    />
                  </div>
                  {/* <div>
                    <label className="block mb-1.5 text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      Legal Form
                    </label>
                    <input
                      type="text"
                      readOnly
                      value={companyDetails.legalForm || ""}
                      className="w-full px-4 py-2.5 bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-300 outline-none cursor-not-allowed"
                    />
                  </div> */}
                  <div>
                    <label className="block mb-1.5 text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      Incorporation Date
                    </label>
                    <input
                      type="date"
                      readOnly
                      value={
                        companyDetails.incorporatedAt
                          ? new Date(companyDetails.incorporatedAt)
                              .toISOString()
                              .split("T")[0]
                          : ""
                      }
                      className="w-full px-4 py-2.5 bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-300 outline-none cursor-not-allowed"
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
                      readOnly
                      value={companyDetails.RegNumber || ""}
                      className="w-full px-4 py-2.5 bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-300 outline-none cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <label className="block mb-1.5 text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      Register Court
                    </label>
                    <input
                      type="text"
                      readOnly
                      value={companyDetails.CourtName || ""}
                      className="w-full px-4 py-2.5 bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-300 outline-none cursor-not-allowed"
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
                      readOnly
                      value={companyDetails.street || ""}
                      className="w-full px-4 py-2.5 bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-300 outline-none cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <label className="block mb-1.5 text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      Postal Code
                    </label>
                    <input
                      type="text"
                      readOnly
                      value={companyDetails.postalCode || ""}
                      className="w-full px-4 py-2.5 bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-300 outline-none cursor-not-allowed"
                    />
                  </div>
                  {/* <div>
                    <label className="block mb-1.5 text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      City
                    </label>
                    <input
                      type="text"
                      readOnly
                      value={companyDetails.city || ""}
                      className="w-full px-4 py-2.5 bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-300 outline-none cursor-not-allowed"
                    />
                  </div> */}
                  <div>
                    <label className="block mb-1.5 text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      Bundesland (State)
                    </label>
                    <select
                      value={companyDetails.state || ""}
                      disabled
                      className="w-full px-4 py-2.5 bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-300 outline-none cursor-not-allowed appearance-none"
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

export default OnboardingPage2;
