"use client";

import {
  FormField,
  RadioGroupField,
} from "@/components/orgadmin/FoundingAudit/FormFields";
import { G6_METADATA } from "@/lib/founding-audit/formMetadata";
import { G6ValidationSchema } from "@/lib/founding-audit/schema";
import { AlertCircle } from "lucide-react";
import { forwardRef, useImperativeHandle, useState } from "react";

const YES_NO_OPTIONS = [
  { label: "Yes (Ja)", value: "JA" },
  { label: "No (Nein)", value: "NEIN" },
];

const PhaseG6Conclusion = forwardRef(({ data, onChange, isReadOnly }, ref) => {
  const [localErrors, setLocalErrors] = useState({});

  // Parent Wizard Form Validation Bridge Coupler
  useImperativeHandle(ref, () => ({
    validate() {
      const result = G6ValidationSchema.safeParse(data);

      if (result.success) {
        setLocalErrors({});
        return true;
      }

      const errorsMap = {};
      result.error.issues.forEach((issue) => {
        if (issue.path[0]) {
          errorsMap[issue.path[0].toString()] = issue.message;
        }
      });

      setLocalErrors(errorsMap);
      return false;
    },
  }));

  const clearError = (key) => {
    setLocalErrors((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const updateField = (key, value) => {
    onChange({
      ...data,
      [key]: value,
    });

    if (localErrors[key]) {
      clearError(key);
    }
  };

  // State strategies pattern matching your Phase G5 implementation perfectly
  const strategies = {
    text: (key) => ({
      value: data?.[key] ?? "",
      onChange: (e) => updateField(key, e.target.value),
    }),
    radio: (key) => ({
      value: data?.[key] ?? "",
      onChange: (value) => updateField(key, value),
    }),
  };

  const bind = (key, type = "text") => ({
    disabled: isReadOnly,
    error: localErrors[key],
    ...strategies[type](key),
  });

  return (
    <div className="space-y-8 select-none animate-fadeIn">
      {/* Subsection Header */}
      <div>
        <h2 className="pb-3 text-xl font-bold tracking-tight text-gray-900 border-b border-gray-100">
          Phase G6: Cooperative Purpose Check
        </h2>
        <p className="max-w-2xl mt-1 text-xs leading-relaxed text-gray-400">
          Written assessment of whether the planned business model constitutes a
          genuine cooperative purpose under §1 GenG.
        </p>
      </div>

      {/* RENDER LIST: Loop over the 6 translated layout items */}
      <div className="">
        {G6_METADATA.map((item) => {
          const isDeficient = data?.[item.key] === "NEIN";

          return (
            <div
              key={item.key}
              className={`border-t p-2 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between bg-white transition-all duration-150 ${
                isDeficient
                  ? "border-red-200 bg-red-50/5 shadow-sm"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <div className="max-w-xl space-y-1">
                <h3
                  className={`text-sm font-bold ${isDeficient ? "text-red-900" : "text-gray-900"}`}
                >
                  {item.subText}*
                </h3>
                <p className="text-[10px] text-gray-400 font-mono italic">
                  {item.label}
                </p>

                {isDeficient && (
                  <div className="flex items-center gap-1 text-[10px] font-bold text-red-600 bg-red-50 border border-red-100 px-2 py-0.5 rounded mt-2 max-w-max animate-fadeIn">
                    <AlertCircle className="w-3 h-3 text-red-500 shrink-0" />
                    <span>{item.failAlert}</span>
                  </div>
                )}
              </div>

              <div className="self-end shrink-0 sm:self-center">
                <RadioGroupField
                  options={YES_NO_OPTIONS}
                  {...bind(item.key, "radio")}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* FINAL CONCLUSION CARD BLOCK */}
      <div className="p-6 space-y-6 border border-gray-200 bg-gray-50/50 rounded-xl">
        <h3 className="pb-2 text-xs font-bold tracking-wider text-gray-400 uppercase border-b border-gray-100">
          Overall Purpose Assessment Conclusions
        </h3>

        <div className="grid items-start grid-cols-1 gap-6 md:grid-cols-12">
          {/* Cooperative Purpose Outcome Dropdown Selector */}
          <div className="md:col-span-4 flex flex-col gap-1.5 w-full">
            <label className="text-sm font-semibold text-gray-700">
              Cooperative Purpose Result <span className="text-red-500">*</span>
            </label>
            <select
              disabled={isReadOnly}
              value={data?.result ?? ""}
              onChange={(e) => updateField("result", e.target.value)}
              className={`w-full text-sm rounded-lg border px-3.5 py-2.5 bg-white transition focus:outline-none focus:ring-2 ${
                localErrors.result
                  ? "border-red-400 focus:border-red-500 focus:ring-red-500/20"
                  : "border-gray-300 focus:border-blue-500 focus:ring-blue-500/20"
              }`}
            >
              <option value="">Please select...</option>
              <option value="ERFUELLT">Compliant</option>
              <option value="BEDINGT">Needs Revision</option>
              <option value="NICHT_ERFUELLT">Not Compliant</option>
            </select>
            {localErrors.result && (
              <span className="text-xs font-medium text-red-500 mt-0.5">
                {localErrors.result}
              </span>
            )}
          </div>

          {/* Written Assessment Remarks Textarea Component */}
          <div className="w-full md:col-span-8">
            <FormField
              label="Written Assessment Statement (Stellungnahme) *"
              as="textarea"
              rows={4}
              placeholder="Auditor's written assessment of whether the planned business model constitutes a genuine cooperative purpose. Feeds directly into the Gutachten document..."
              {...bind("purposeStatement", "text")}
            />
          </div>
        </div>
      </div>
    </div>
  );
});

PhaseG6Conclusion.displayName = "PhaseG6Conclusion";
export { PhaseG6Conclusion };