"use client";

import React, { useState } from "react";
import {
  Landmark,
  CreditCard,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Search,
  Check,
} from "lucide-react";
import { isValidIBAN } from "ibantools";
import { validateIBAN } from "@/lib/ibanService";

const Page10 = ({ formData, handleChange, errors }) => {
  const [loadingBankData, setLoadingBankData] = useState(false);
  const [lookupError, setLookupError] = useState("");
  const [manualEntryNotice, setManualEntryNotice] = useState("");
  const [allowManualEntry, setAllowManualEntry] = useState(false);
  const [showBankDetails, setShowBankDetails] = useState(false);
  const [ibanValidated, setIbanValidated] = useState(false);

  const maskIBAN = (iban) => {
    if (!iban) return "";
    return `${iban.slice(0, 2)}** **** **** **** ${iban.slice(-2)}`;
  };

  const handleIbanChange = (e) => {
    setAllowManualEntry(false);
    const value = e.target.value.replace(/\s+/g, "").toUpperCase();

    // Update IBAN in form
    handleChange({ target: { name: "iban", value } });

    // Reset states immediately so old data fields are hidden
    setLookupError("");
    setManualEntryNotice("");
    setIbanValidated(false);
    setShowBankDetails(false);

    // Clear old bank data from form so it isn't accidentally submitted
    if (formData.bic || formData.bankName || formData.bankCity) {
      handleChange({ target: { name: "bic", value: "" } });
      handleChange({ target: { name: "bankName", value: "" } });
      handleChange({ target: { name: "bankCity", value: "" } });
    }
  };

  const verifyIban = async () => {
    setLookupError("");
    setManualEntryNotice("");
    setIbanValidated(false);
    setShowBankDetails(false);

    const iban = formData.iban?.replace(/\s+/g, "");

    if (!iban) {
      setLookupError("Please enter an IBAN first.");
      return;
    }

    const validIBAN = isValidIBAN(iban);

    if (!validIBAN) {
      setLookupError("Invalid IBAN format detected.");
      // Notice: We no longer reveal the details fields here
      return;
    }

    try {
      setLoadingBankData(true);

      const data = await validateIBAN(iban);

      if (!data.valid) {
        setLookupError("IBAN validation failed against the registry.");
        return;
      }

      const bankData = data.bankData || {};
      const hasFullBankData = Boolean(
        bankData.bic && bankData.name && bankData.city,
      );

      // Auto-fill bank details in the parent state
      handleChange({
        target: { name: "bic", value: bankData.bic || "" },
      });
      handleChange({
        target: { name: "bankName", value: bankData.name || "" },
      });
      handleChange({
        target: { name: "bankCity", value: bankData.city || "" },
      });

      setIbanValidated(true);
      setShowBankDetails(true);

      if (!hasFullBankData) {
        setAllowManualEntry(true);
        setManualEntryNotice(
          "IBAN validated, but bank details were not returned. Please enter bank name, BIC, and registered city.",
        );
      }
    } catch (error) {
      console.error(error);
      setLookupError(
        "Registry lookup failed. Please enter bank details manually.",
      );

      setAllowManualEntry(true);
      setShowBankDetails(true);
    } finally {
      setLoadingBankData(false);
    }
  };

  return (
    <div className="max-w-2xl pt-4 mx-auto space-y-8 animate-fadeIn">
      {/* HEADER */}
      <div className="space-y-3 text-center">
        <div className="flex items-center justify-center w-16 h-16 mx-auto border border-indigo-100 shadow-sm bg-indigo-50 dark:bg-indigo-900/30 rounded-2xl dark:border-indigo-800/50">
          <Landmark className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
        </div>
        <h2 className="text-2xl font-extrabold tracking-tight sm:text-3xl text-slate-900 dark:text-white">
          Bank Account Details
        </h2>
        <p className="max-w-sm mx-auto text-sm text-slate-500 dark:text-slate-400">
          Please provide the official cooperative bank account information.
        </p>
      </div>

      <div className="space-y-6">
        {/* IBAN INPUT + BUTTON */}
        <div className="p-6 bg-white border shadow-sm dark:bg-slate-900 sm:p-8 border-slate-200 dark:border-slate-800 rounded-2xl">
          <label
            htmlFor="iban"
            className="block mb-2 text-xs font-bold tracking-widest uppercase text-slate-700 dark:text-slate-300"
          >
            International Bank Account Number (IBAN){" "}
            <span className="text-rose-500">*</span>
          </label>

          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                <CreditCard size={18} className="text-slate-400" />
              </div>
              <input
                type="text"
                id="iban"
                name="iban"
                value={formData.iban || ""}
                onChange={handleIbanChange}
                placeholder="DE89 3704 0044 0532 0130 00"
                className={`w-full h-12 pl-11 pr-4 bg-slate-50 dark:bg-slate-800/50 border rounded-xl text-sm font-medium transition-all focus:outline-none focus:ring-2 dark:text-white uppercase ${
                  errors.iban || lookupError
                    ? "border-rose-300 focus:ring-rose-500/50 focus:border-rose-500 dark:border-rose-700"
                    : ibanValidated
                      ? "border-emerald-300 focus:ring-emerald-500/50 focus:border-emerald-500 dark:border-emerald-700"
                      : "border-slate-200 focus:ring-indigo-500/50 focus:border-indigo-500 dark:border-slate-700"
                }`}
              />
            </div>

            <button
              type="button"
              onClick={verifyIban}
              disabled={loadingBankData || !String(formData.iban || "").trim()}
              className="flex items-center justify-center h-12 gap-2 px-6 text-sm font-bold text-white transition-all bg-indigo-600 shadow-sm hover:bg-indigo-700 rounded-xl shadow-indigo-500/20 disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
            >
              {loadingBankData ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Verifying
                </>
              ) : ibanValidated ? (
                <>
                  <Check className="w-4 h-4" /> Verified
                </>
              ) : (
                <>
                  <Search className="w-4 h-4" /> Proceed
                </>
              )}
            </button>
          </div>

          <div className="mt-1 flex flex-col gap-1.5">
            {!formData.iban &&
              !lookupError &&
              !ibanValidated &&
              !loadingBankData && (
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  <span className="font-mono">
                    Please enter the correct iban
                  </span>
                </p>
              )}

            {(errors.iban || lookupError) && (
              <p className="text-xs font-bold text-rose-500 flex items-center gap-1.5 animate-fadeIn">
                <AlertCircle className="w-3.5 h-3.5" />{" "}
                {errors.iban || lookupError}
              </p>
            )}

            {ibanValidated && (
              <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 animate-fadeIn">
                <CheckCircle2 className="w-3.5 h-3.5" /> IBAN validated
                successfully.
                {!allowManualEntry && " Bank details auto-filled."}
              </p>
            )}

            {manualEntryNotice && (
              <p className="text-xs font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1.5 animate-fadeIn">
                <AlertCircle className="w-3.5 h-3.5" /> {manualEntryNotice}
              </p>
            )}
          </div>
        </div>

        {/* STRICTLY AUTO-FILLED FIELDS */}
        {showBankDetails && (
          <div className="space-y-6 animate-fadeIn">
            <div className="grid grid-cols-1 gap-5 p-6 bg-white border shadow-sm sm:grid-cols-2 dark:bg-slate-900 sm:p-8 border-slate-200 dark:border-slate-800 rounded-2xl">
              {/* Bank Name (Locked) */}
              <div className="sm:col-span-2">
                <label className="block mb-2 text-xs font-bold tracking-widest uppercase text-slate-700 dark:text-slate-300">
                  Bank Name
                </label>
                <input
                  type="text"
                  value={formData.bankName || ""}
                  onChange={(e) =>
                    handleChange({
                      target: {
                        name: "bankName",
                        value: e.target.value,
                      },
                    })
                  }
                  readOnly={!allowManualEntry}
                  className={`w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-400 ${!allowManualEntry ? "cursor-not-allowed" : ""} focus:outline-none`}
                />
                {errors.bankName && (
                  <p className="mt-2 text-[11px] font-bold text-rose-500">
                    {errors.bankName}
                  </p>
                )}
              </div>

              {/* BIC (Locked) */}
              <div>
                <label className="block mb-2 text-xs font-bold tracking-widest uppercase text-slate-700 dark:text-slate-300">
                  BIC
                </label>
                <input
                  type="text"
                  value={formData.bic || ""}
                  onChange={(e) =>
                    handleChange({
                      target: {
                        name: "bic",
                        value: e.target.value,
                      },
                    })
                  }
                  readOnly={!allowManualEntry}
                  className={`w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-400 ${!allowManualEntry ? "cursor-not-allowed" : ""} focus:outline-none uppercase`}
                />
                {errors.bic && (
                  <p className="mt-2 text-[11px] font-bold text-rose-500">
                    {errors.bic}
                  </p>
                )}
              </div>

              {/* Bank City (Display) */}
              {(formData.bankCity || allowManualEntry) && (
                <div>
                  <label className="block mb-2 text-xs font-bold tracking-widest uppercase text-slate-700 dark:text-slate-300">
                    Registered City
                  </label>

                  <input
                    type="text"
                    value={formData.bankCity || ""}
                    readOnly={!allowManualEntry}
                    onChange={(e) =>
                      handleChange({
                        target: {
                          name: "bankCity",
                          value: e.target.value,
                        },
                      })
                    }
                    className={`w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-400 focus:outline-none ${
                      !allowManualEntry ? "cursor-not-allowed" : ""
                    }`}
                  />
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Page10;
