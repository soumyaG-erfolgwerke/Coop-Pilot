"use client";

import { FormField } from "@/components/orgadmin/FoundingAudit/FormFields";
import { G3_METADATA } from "@/lib/founding-audit/formMetadata";
import { G3ValidationSchema } from "@/lib/founding-audit/schema";
import { CheckCircle2, XCircle } from "lucide-react";
import { forwardRef, useImperativeHandle, useState } from "react";

const PhaseG3Statutes = forwardRef(({ data, onChange, isReadOnly }, ref) => {
  const [localErrors, setLocalErrors] = useState({});

  const currentItems = data?.items ?? [];
  const overallAssessment = data?.overallAssessment ?? "";
  const generalNotes = data?.notes ?? "";

  useImperativeHandle(ref, () => ({
    validate() {
      const result = G3ValidationSchema.safeParse({
        items: currentItems,
        overallAssessment,
        notes: generalNotes,
      });

      console.log("[G3 VALIDATION RESULT]", result);

      if (result.success) {
        setLocalErrors({});
        return true;
      }

      const errorsMap = {};
      result.error.issues.forEach((issue) => {
        // Top level assessment errors path: ["overallAssessment"]
        if (issue.path.length === 1) {
          errorsMap[issue.path[0]] = issue.message;
        } else {
          // Nested array list row errors path: ["items", rowIndex, fieldKey]
          const rowIndex = issue.path[1];
          const fieldKey = issue.path[2];
          if (rowIndex !== undefined && fieldKey) {
            errorsMap[`${rowIndex}-${fieldKey}`] = issue.message;
          }
        }
      });
      setLocalErrors(errorsMap);
      return false;
    },
  }));

  const clearRowErrors = (index, field) => {
    setLocalErrors((prev) => {
      const copy = { ...prev };
      delete copy[`${index}-${field}`];
      return copy;
    });
  };

  // Mutator handling specific attribute updates inside the row list dictionary array
  const updateRowField = (index, field, value) => {
    const updatedItems = currentItems.map((item, idx) => {
      if (idx !== index) return item;
      const copy = { ...item, [field]: value };

      if (field === "present" && value === "PRESENT") {
        copy.missingNote = "";
      }
      return copy;
    });

    onChange({ ...data, items: updatedItems });

    // Clear the active field error
    clearRowErrors(index, field);

    // Structural Reset: If toggling to PRESENT, scrub the missingNote error too
    if (field === "present" && value === "PRESENT") {
      setLocalErrors((prev) => {
        const copy = { ...prev };
        delete copy[`${index}-missingNote`];
        return copy;
      });
    }
  };

  // Mutator handling top-level flat layout fields (overall assessment dropdown / general notes text)
  const updateGlobalField = (field, value) => {
    onChange({ ...data, [field]: value });
    setLocalErrors((prev) => {
      const copy = { ...prev };
      delete copy[field];
      return copy;
    });
  };

  const strategy = {
    text: (index, field) => ({
      value: currentItems[index]?.[field] ?? "",
      onChange: (e) => updateRowField(index, field, e.target.value),
    }),
  };

  const bindRow = (index, field, type = "text") => ({
    disabled: isReadOnly,
    error: localErrors[`${index}-${field}`],
    ...strategy[type](index, field),
  });

  return (
    <div className="space-y-8 overflow-visible select-none animate-fadeIn">
      {/* Header Context Layout Block */}
      <div className="pb-4 border-b border-gray-100">
        <h2 className="text-xl font-bold tracking-tight text-gray-900">
          Phase G3: Statutory Compliance Verification
        </h2>
        <p className="max-w-2xl mt-1 text-xs leading-relaxed text-gray-400">
          Audit the draft statutes text framework against mandatory compliance
          items mandated under §6 GenG cooperative legislation rules.
        </p>
      </div>

      {/* Main Checklist Card Stack Container */}
      <div className="space-y-4 overflow-visible">
        {currentItems.map((item, index) => {
          const isMissing = item.present === "MISSING";
          const hasMissingNoteError = localErrors[`${index}-missingNote`];

          return (
            <div
              key={item.itemId}
              className={`border rounded-xl p-5 transition-all duration-150 shadow-sm space-y-4 bg-white ${
                isMissing
                  ? "border-red-200 bg-red-50/5 shadow-red-50/5"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              {/* ROW 1: SPACIOUS TITLE DISPLAY (Occupies full top row) */}
              <div className="flex items-start justify-between w-full pb-2.5 border-b border-gray-50 gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2.5">
                    <span className="text-[10px] font-mono font-bold bg-gray-100 text-gray-400 px-2 py-0.5 border border-gray-200/60 rounded">
                      {G3_METADATA[index]?.itemId}
                    </span>
                    <h3 className="text-sm font-bold tracking-tight text-gray-900">
                      {G3_METADATA[index]?.nameEn}
                    </h3>
                  </div>
                  <p className="text-[10px] text-gray-400 font-mono block pl-1">
                    {G3_METADATA[index]?.intent}
                  </p>
                </div>

                {/* Status Evaluation Option Dropdown/Selector Primitives */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={isReadOnly}
                    onClick={() => updateRowField(index, "present", "PRESENT")}
                    className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition flex items-center gap-1.5 ${
                      !isMissing
                        ? "border-green-600 bg-green-50 text-green-700 shadow-sm"
                        : "border-gray-200 bg-white text-gray-400 hover:bg-gray-50 disabled:opacity-50"
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" /> Present
                  </button>
                  <button
                    type="button"
                    disabled={isReadOnly}
                    onClick={() => updateRowField(index, "present", "MISSING")}
                    className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition flex items-center gap-1.5 ${
                      isMissing
                        ? "border-red-600 bg-red-50 text-red-700 shadow-sm animate-shake"
                        : "border-gray-200 bg-white text-gray-400 hover:bg-gray-50 disabled:opacity-50"
                    }`}
                  >
                    <XCircle className="w-3.5 h-3.5" /> Missing
                  </button>
                </div>
              </div>

              {/* ROW 2: REFERENCE PARAMETER DATA FIELD SPLITS */}
              <div className="grid items-start grid-cols-1 gap-4 overflow-visible md:grid-cols-12">
                <div className="md:col-span-4">
                  <FormField
                    label="Statutes Reference"
                    placeholder="e.g., §3, Page 2, Line 14"
                    {...bindRow(index, "pageReference", "text")}
                    className="text-sm"
                  />
                </div>

                <div className="overflow-visible md:col-span-8">
                  {isMissing && (
                    <div className="overflow-visible animate-fadeIn">
                      <FormField
                        label="Deficiency Note / Action Required"
                        placeholder="Describe the omission or specific phrase corrections necessary to achieve court conformity..."
                        {...bindRow(index, "missingNote", "text")}
                        className="text-sm"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* GLOBAL TAB CONCLUSION BOX: Reuses FormField dropdown configurations */}
      <div className="p-6 space-y-5 border border-gray-200 bg-gray-50/50 rounded-xl">
        <h3 className="text-xs font-bold tracking-wider text-gray-400 uppercase">
          Final Verification Result Assessment
        </h3>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="flex flex-col gap-1.5 w-full">
            <label className="text-sm font-semibold text-gray-700">
              Overall Statutes Assessment{" "}
              <span className="text-red-500">*</span>
            </label>
            <select
              disabled={isReadOnly}
              value={overallAssessment}
              onChange={(e) =>
                updateGlobalField("overallAssessment", e.target.value)
              }
              className={`w-full text-sm rounded-lg border px-3.5 py-2.5 transition focus:outline-none focus:ring-2 bg-white ${
                localErrors.overallAssessment
                  ? "border-red-400 focus:border-red-500 focus:ring-red-500/20"
                  : "border-gray-300 focus:border-blue-500 focus:ring-blue-500/20"
              }`}
            >
              <option value="">Please select...</option>
              <option value="ERFUELLT">Compliant</option>
              <option value="BEDINGT">Needs Revision</option>
              <option value="NICHT_ERFUELLT">Not Compliant</option>
            </select>
            {localErrors.overallAssessment && (
              <span className="text-xs font-medium text-red-500 mt-0.5">
                {localErrors.overallAssessment}
              </span>
            )}
          </div>

          <FormField
            label="General Assessment Remarks"
            as="textarea"
            rows={2}
            disabled={isReadOnly}
            value={generalNotes}
            placeholder="Add global conclusions, amendment guidance details, or summary closing arguments..."
            onChange={(e) => updateGlobalField("notes", e.target.value)}
            error={localErrors.notes}
          />
        </div>
      </div>
    </div>
  );
});

PhaseG3Statutes.displayName = "PhaseG3Statutes";
export { PhaseG3Statutes };
