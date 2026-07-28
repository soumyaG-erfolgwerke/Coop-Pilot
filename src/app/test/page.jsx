"use client";

import { useState } from "react";
import {
  ClipboardList,
  Check,
  ChevronLeft,
  ChevronRight,
  Send,
} from "lucide-react";
import { FormFieldRenderer } from "@/components/AuditComponents";

const auditSchema = {
  title: "Annual Audit Form",
  description: "Comprehensive audit template",
  settings: {
    collectEmail: false,
    allowMultipleSubmissions: true,
    confirmationMessage: "Your response has been recorded.",
  },
  phases: [
    {
      phaseId: "section_1",
      title: "Basic Information",
      description: "Organization details",
      fields: [
        {
          fieldId: "org_name",
          componentType: "text",
          label: "Organization Name",
          required: true,
          helperText: "Enter organization name",
          validation: {},
        },
        {
          fieldId: "audit_date",
          componentType: "date",
          label: "Audit Date",
          required: true,
          validation: {},
        },
        {
          fieldId: "auditor_name",
          componentType: "text",
          label: "Lead Auditor",
          required: true,
          validation: {},
        },
      ],
    },
    {
      phaseId: "section_2",
      title: "Financial Review",
      description: "Financial compliance checks",
      fields: [
        {
          fieldId: "annual_revenue",
          componentType: "number",
          label: "Annual Revenue",
          required: true,
          validation: {
            min: 0,
          },
        },
        {
          fieldId: "financial_records",
          componentType: "multiple_choice",
          label: "Are financial records maintained?",
          required: true,
          options: [
            {
              id: "yes",
              label: "Yes",
              value: "yes",
            },
            {
              id: "no",
              label: "No",
              value: "no",
            },
            {
              id: "no2",
              label: "Not",
              value: "no",
            },
          ],
          allowOther: false,
        },
        {
          fieldId: "financial_notes",
          componentType: "checkbox",
          label: "Financial Notes",
          required: false,
          validation: {},
        },
      ],
    },
    {
      phaseId: "section_3",
      title: "Document Verification",
      description: "Verify available documents",
      fields: [
        {
          fieldId: "documents_available",
          componentType: "checkbox_group",
          label: "Available Documents",
          required: true,
          options: [
            {
              id: "balance_sheet",
              label: "Balance Sheet",
              value: "balance_sheet",
            },
            {
              id: "cash_book",
              label: "Cash Book",
              value: "cash_book",
            },
            {
              id: "bank_statement",
              label: "Bank Statement",
              value: "bank_statement",
            },
            {
              id: "audit_report",
              label: "Previous Audit Report",
              value: "audit_report",
            },
          ],
          allowOther: true,
        },
      ],
    },
    {
      phaseId: "section_4",
      title: "Compliance Review",
      description: "Compliance assessment",
      fields: [
        {
          fieldId: "compliance_status",
          componentType: "multiple_choice",
          label: "Compliance Status",
          required: true,
          options: [
            {
              id: "compliant",
              label: "Compliant",
              value: "compliant",
            },
            {
              id: "partial",
              label: "Partially Compliant",
              value: "partial",
            },
            {
              id: "non_compliant",
              label: "Non-Compliant",
              value: "non_compliant",
            },
          ],
        },
        {
          fieldId: "compliance_comments",
          componentType: "textarea",
          label: "Compliance Comments",
          required: false,
          validation: {},
        },
      ],
    },
    {
      phaseId: "section_5",
      title: "Attachments",
      description: "Upload supporting files",
      fields: [
        {
          fieldId: "supporting_documents",
          componentType: "file",
          label: "Upload Documents",
          required: false,
          validation: {},
        },
      ],
    },
    {
      phaseId: "section_6",
      title: "Final Assessment",
      description: "Overall audit result",
      fields: [
        {
          fieldId: "audit_passed",
          componentType: "checkbox",
          label: "Audit Passed",
          required: true,
          validation: {},
        },
        {
          fieldId: "final_remarks",
          componentType: "textarea",
          label: "Final Remarks",
          required: true,
          validation: {},
        },
      ],
    },
  ],
};

export default function AuditPlaygroundPage({ onSubmit }) {
  const [formData, setFormData] = useState({});
  const [errors, setErrors] = useState({});
  const [currentPhase, setCurrentPhase] = useState(0);

  if (!auditSchema || !auditSchema.phases || !auditSchema.phases.length) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        No audit schema available
      </div>
    );
  }

  const phase = auditSchema.phases[currentPhase];
  const totalPhases = auditSchema.phases.length;
  const progress = ((currentPhase + 1) / totalPhases) * 100;

  // --- LOGIC: Visibility based on Conditional Logic ---
  const isFieldVisible = (field) => {
    if (!field.showWhen) return true;
    return formData[field.showWhen.fieldId] === field.showWhen.equals;
  };

  // --- LOGIC: Comprehensive Validation ---
  const validateCurrentPhase = () => {
    const newErrors = {};
    let isValid = true;

    phase.fields.forEach((field) => {
      // Skip validation for fields hidden by logic
      if (!isFieldVisible(field)) return;

      const val = formData[field.fieldId];
      const isEmpty =
        val === undefined ||
        val === null ||
        (typeof val === "string" && val.trim() === "") ||
        val === false ||
        (Array.isArray(val) && val.length === 0);

      // 1. Required Check
      if (field.required && isEmpty) {
        newErrors[field.fieldId] = "This is a required question.";
        isValid = false;
        return; // Stop validating this specific field further if it's empty
      }

      // 2. Extra Constraint Validation (if not empty)
      if (!isEmpty && field.validation) {
        // Number limits
        if (field.componentType === "number") {
          const numVal = Number(val);
          if (
            field.validation.min !== undefined &&
            numVal < field.validation.min
          ) {
            newErrors[field.fieldId] =
              `Must be at least ${field.validation.min}.`;
            isValid = false;
          }
          if (
            field.validation.max !== undefined &&
            numVal > field.validation.max
          ) {
            newErrors[field.fieldId] =
              `Must be at most ${field.validation.max}.`;
            isValid = false;
          }
        }

        // Text limits/patterns
        if (
          field.componentType === "text" ||
          field.componentType === "textarea"
        ) {
          if (
            field.validation.minLength &&
            val.length < field.validation.minLength
          ) {
            newErrors[field.fieldId] =
              `Requires at least ${field.validation.minLength} characters.`;
            isValid = false;
          }
          if (
            field.validation.maxLength &&
            val.length > field.validation.maxLength
          ) {
            newErrors[field.fieldId] =
              `Cannot exceed ${field.validation.maxLength} characters.`;
            isValid = false;
          }
          if (field.validation.pattern) {
            const regex = new RegExp(field.validation.pattern);
            if (!regex.test(val)) {
              newErrors[field.fieldId] = "Does not match the required format.";
              isValid = false;
            }
          }
        }
      }
    });

    setErrors(newErrors);
    return isValid;
  };

  // --- HANDLERS ---
  const handleChange = (fieldId, value) => {
    setFormData((prev) => ({ ...prev, [fieldId]: value }));
    // Clear error dynamically as the user corrects it
    if (errors[fieldId]) {
      setErrors((prev) => ({ ...prev, [fieldId]: null }));
    }
  };

  const goNext = () => {
    if (validateCurrentPhase()) {
      if (currentPhase < totalPhases - 1) {
        setCurrentPhase(currentPhase + 1);
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    } else {
      // Provide a slight visual scroll cue to look at errors
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const goPrevious = () => {
    if (currentPhase > 0) {
      setCurrentPhase(currentPhase - 1);
      setErrors({}); // Clear errors when going back
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const jumpToPhase = (index) => {
    // Standard Google Form logic: you can freely go backwards,
    // but going forwards requires passing the current phase's validation
    if (index < currentPhase) {
      setCurrentPhase(index);
      setErrors({});
    } else if (index > currentPhase) {
      // If trying to jump ahead, validate current first
      if (validateCurrentPhase()) {
        // Note: For multi-step leaps, technically you'd validate every step in between,
        // but for safety, we just restrict jumping forward entirely or only 1 step.
        // Easiest robust UX: Only allow free-jumping backwards.
        if (index === currentPhase + 1) {
          goNext();
        }
      }
    }
  };

  // const handleSubmit = () => {
  //   if (validateCurrentPhase()) {
  //     console.log("Final Submit Payload:", formData);
  //     alert(
  //       auditSchema.settings.confirmationMessage ||
  //         "Audit Submitted Successfully!",
  //     );
  //     // Typically you would reset form or redirect here
  //   } else {
  //     window.scrollTo({ top: 0, behavior: "smooth" });
  //   }
  // };

  const handleSubmit = async () => {
    if (!validateCurrentPhase()) {
      return;
    }

    if (onSubmit) {
      await onSubmit(formData);
      return;
    }

    // console.log(formData);
  };

  return (
    <div className="max-w-7xl p-4 sm:p-6 lg:p-8 mx-auto animate-fadeIn min-h-screen flex flex-col lg:flex-row gap-6 lg:gap-8 items-start">
      {/* ========================================== */}
      {/* LEFT SIDEBAR: Header & Navigation Elements */}
      {/* ========================================== */}
      <div className="w-full lg:w-72 shrink-0 flex flex-col gap-6 lg:sticky lg:top-8">
        {/* HEADER */}
        <div className="flex items-start gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
          <div className="p-3 bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 rounded-xl shadow-sm shrink-0">
            <ClipboardList className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight">
              {auditSchema.title}
            </h1>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1.5">
              {auditSchema.description ||
                "Fill out the required phases to complete the audit."}
            </p>
          </div>
        </div>

        {/* PROGRESS BAR */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
          <div className="flex justify-between mb-3 text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
            <span>Progress</span>
            <span className="text-indigo-600 dark:text-indigo-400">
              {Math.round(progress)}%
            </span>
          </div>
          <div className="h-2.5 overflow-hidden bg-slate-100 dark:bg-slate-800 rounded-full shadow-inner">
            <div
              className="h-full transition-all duration-500 ease-out bg-indigo-600 rounded-full"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* VERTICAL PHASE NAVIGATION PILLS */}
        <div className="flex flex-col gap-2">
          <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-2 px-1">
            Sections
          </h3>
          {auditSchema.phases.map((phaseItem, index) => {
            const isActive = currentPhase === index;
            const isCompleted = index < currentPhase;
            const isDisabled = index > currentPhase;

            return (
              <button
                key={phaseItem.phaseId}
                onClick={() => jumpToPhase(index)}
                disabled={isDisabled}
                className={`flex items-center gap-3 px-4 py-3.5 text-sm font-bold rounded-xl transition-all duration-200 text-left border focus:outline-none focus:ring-2 focus:ring-offset-1 dark:focus:ring-offset-slate-900 ${
                  isActive
                    ? "bg-indigo-600 text-white border-indigo-600 shadow-sm shadow-indigo-500/20"
                    : isCompleted
                      ? "bg-white text-indigo-700 border-indigo-100 hover:bg-indigo-50 dark:bg-slate-900 dark:text-indigo-400 dark:border-indigo-500/20 dark:hover:bg-indigo-900/30 cursor-pointer"
                      : "bg-slate-50 text-slate-400 border-transparent opacity-70 cursor-not-allowed dark:bg-slate-800/50 dark:text-slate-500"
                }`}
              >
                {isCompleted ? (
                  <div className="w-6 h-6 shrink-0 rounded-full bg-indigo-100 dark:bg-indigo-800/50 flex items-center justify-center">
                    <Check
                      size={14}
                      strokeWidth={3}
                      className="text-indigo-700 dark:text-indigo-300"
                    />
                  </div>
                ) : (
                  <span
                    className={`flex items-center justify-center shrink-0 w-6 h-6 rounded-full text-[11px] ${
                      isActive
                        ? "bg-white/20 text-white"
                        : "bg-slate-200 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
                    }`}
                  >
                    {index + 1}
                  </span>
                )}
                <span className="truncate">{phaseItem.title}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ========================================== */}
      {/* CENTER COLUMN: Main Form Container         */}
      {/* ========================================== */}
      <div className="flex-1 w-full flex flex-col gap-6 min-w-0">
        {/* ACTIVE PHASE TITLE */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm p-6 sm:p-8 animate-fadeIn">
          <span className="inline-block px-3 py-1 mb-3 text-[10px] font-bold uppercase tracking-widest text-indigo-600 bg-indigo-50 rounded-lg dark:bg-indigo-500/10 dark:text-indigo-400">
            Phase {currentPhase + 1}
          </span>
          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">
            {phase.title}
          </h2>
          {phase.description && (
            <p className="mt-2 text-sm font-medium text-slate-500 dark:text-slate-400 leading-relaxed">
              {phase.description}
            </p>
          )}
        </div>

        {/* FIELDS CONTAINER */}
        <div className="space-y-6">
          {phase.fields.filter(isFieldVisible).map((field) => (
            <div
              key={field.fieldId}
              className={`relative bg-white dark:bg-slate-900 border rounded-2xl shadow-sm p-6 sm:p-8 animate-fadeIn transition-colors ${
                errors[field.fieldId]
                  ? "border-rose-300 dark:border-rose-800/50 ring-1 ring-rose-500/10"
                  : "border-slate-200 dark:border-slate-800"
              }`}
            >
              <FormFieldRenderer
                key={field.fieldId}
                field={field}
                formData={formData}
                updateField={handleChange}
              />

              {/* ERROR STATE INJECTION */}
              {errors[field.fieldId] && (
                <div className="flex items-center gap-1.5 mt-4 pt-3 border-t border-rose-100 dark:border-rose-900/30 text-[13px] font-bold text-rose-600 dark:text-rose-400 animate-fadeIn">
                  <div className="w-1.5 h-1.5 rounded-full bg-rose-500 dark:bg-rose-400 shrink-0"></div>
                  {errors[field.fieldId]}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* DEBUG PANEL */}
        <div className="p-5 mt-4 border border-slate-200 dark:border-slate-800 rounded-2xl bg-slate-50 dark:bg-slate-900/50">
          <h3 className="mb-2 text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
            Debug: Form Data
          </h3>
          <pre className="overflow-auto text-[11px] font-mono text-indigo-700 dark:text-indigo-400">
            {JSON.stringify(formData, null, 2)}
          </pre>
        </div>
      </div>

      {/* ========================================== */}
      {/* RIGHT SIDEBAR: Floating Modal Actions      */}
      {/* ========================================== */}
      <div className="w-full lg:w-64 shrink-0 lg:sticky lg:top-8 z-10">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl shadow-slate-200/40 dark:shadow-none p-5 flex flex-col justify-between min-h-[220px]">
          {/* Top Info Context */}
          <div className="text-center">
            <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
              Audit Progress Hub
            </h4>
            <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
              Review carefully before advancing. Ensure entries match all
              regulatory validation checkpoints.
            </p>
          </div>

          {/* Action Buttons Layer */}
          <div className="flex flex-col gap-3 mt-6">
            <div className="h-px w-full bg-slate-100 dark:bg-slate-800 mb-1"></div>

            {currentPhase === totalPhases - 1 ? (
              <button
                type="button"
                onClick={handleSubmit}
                className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 text-sm font-bold text-white bg-emerald-600 rounded-xl hover:bg-emerald-700 shadow-sm shadow-emerald-500/20 transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900 hover:-translate-y-0.5"
              >
                Submit Form <Send size={16} />
              </button>
            ) : (
              <button
                type="button"
                onClick={goNext}
                className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 text-sm font-bold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 shadow-sm shadow-indigo-500/20 transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900 hover:-translate-y-0.5"
              >
                Next Phase <ChevronRight size={16} />
              </button>
            )}

            <button
              type="button"
              onClick={goPrevious}
              disabled={currentPhase === 0}
              className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-bold text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-700 transition-all focus:outline-none focus:ring-2 focus:ring-slate-200"
            >
              <ChevronLeft size={16} /> Previous
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
