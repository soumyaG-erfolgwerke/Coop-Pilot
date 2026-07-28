"use client";
import React from "react";
import { CheckCircle2, LoaderCircle, ShieldCheck } from "lucide-react";
import FormBuilder from "./FormBuilder";

const Page2a = ({ formData, handleChange, handleBlur, errors, onVerify, isVerifying }) => {
  const ibanAccountHolderHint = formData.organisationName
    ? `The name should match your registered organisation name: ${formData.organisationName}.`
    : "The name should match your organisation's registered bank account holder.";

  const isNameClose = () => {
    if (!formData.organisationName || !formData.ibanAccountHolder) return false;
    const left = formData.organisationName.toLowerCase().replace(/[^a-z0-9]/g, "");
    const right = formData.ibanAccountHolder.toLowerCase().replace(/[^a-z0-9]/g, "");
    return left === right || left.includes(right) || right.includes(left);
  };

  const formRows = [
    [
      {
        name: "iban",
        type: "text",
        label: "Organisation IBAN",
        required: true,
        placeholder: "e.g. DE89370400440532013000",
        description:
          "Enter the IBAN of your organisation's official bank account. This must be the account registered in your organisation's name.",
      },
    ],
    [
      {
        name: "ibanAccountHolder",
        type: "text",
        label: "Account Holder Name",
        required: true,
        placeholder: "e.g. DIVK Deutscher Interessenverband der Kleingenossenschaften e.V.",
        description: ibanAccountHolderHint,
      },
    ],
    [
      {
        name: "bic",
        type: "text",
        label: "BIC",
        required: true,
        placeholder: "e.g. DEUTDEFF500",
        description: "Enter the BIC/SWIFT code for the same bank account.",
      },
    ],
  ];

  return (
    <div className="space-y-6 animate-fadeIn rounded-xl border border-blue-100 dark:border-slate-700 bg-blue-50/60 dark:bg-slate-900/40 p-5 sm:p-6">
      <div className="text-center">
        <div className="flex items-center justify-center w-14 h-14 mx-auto mb-4 bg-white dark:bg-slate-800 rounded-full shadow-sm">
          <ShieldCheck size={28} className="text-blue-600 dark:text-primary/80" />
        </div>
        <h3 className="text-xl font-bold text-gray-800 dark:text-white">
          Verify Your Organisation&apos;s Bank Account
        </h3>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          Step 2a - IBAN Entry
        </p>
      </div>

      {formData.ibanVerified && (
        <div className="rounded-md border border-green-200 bg-green-50 px-3 py-2 text-xs text-green-800">
          IBAN verified successfully.
        </div>
      )}

      {errors?.ibanVerification && (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800" role="alert" aria-live="polite">
          {errors.ibanVerification}
        </div>
      )}

      <FormBuilder
        fields={formRows}
        formData={formData}
        handleChange={handleChange}
        handleBlur={handleBlur}
        errors={errors}
      />

      {formData.ibanAccountHolder && formData.organisationName && !isNameClose() && (
        <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
          The name you entered differs from your registered organisation name. Please ensure this is the correct account.
        </div>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pt-2">
        <button
          type="button"
          onClick={onVerify}
          disabled={isVerifying || formData.ibanVerified}
          className="inline-flex items-center justify-center px-5 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-medium shadow-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
        >
          {formData.ibanVerified ? (
            <>
              <CheckCircle2 size={16} className="mr-2" />
              Verified
            </>
          ) : isVerifying ? (
            <>
              <LoaderCircle size={16} className="mr-2 animate-spin" />
              Verifying...
            </>
          ) : (
            <>
              <CheckCircle2 size={16} className="mr-2" />
              Verify IBAN
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default Page2a;
