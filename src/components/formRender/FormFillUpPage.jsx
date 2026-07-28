"use client";

import { useState, useEffect, useCallback } from "react";
import {
  ClipboardList,
  Check,
  ChevronLeft,
  ChevronRight,
  Send,
  CloudLightning,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { FormFieldRenderer } from "@/components/AuditComponents";
import FadePopUp from "../FadePopUp";
import { useAuth } from "@/hooks/useAuth";

const extractAnswersFromSchema = (schema) => {
  const answers = {};

  schema?.phases?.forEach((phase) => {
    phase.fields?.forEach((field) => {
      if (field.answer !== undefined && field.answer !== null) {
        answers[field.fieldId] = field.answer;
      } else {
        switch (field.componentType) {
          case "checkbox":
            answers[field.fieldId] = false;
            break;
          case "checkbox_group":
            answers[field.fieldId] = [];
            break;
          default:
            answers[field.fieldId] = "";
        }
      }
    });
  });

  return answers;
};

export default function FormFillUpPage({
  auditSchema,
  initialData = {},
  onAutoSave,
  onSubmit,
}) {
  const [formData, setFormData] = useState(() =>
    extractAnswersFromSchema(auditSchema),
  );
  const [errors, setErrors] = useState({});
  const [currentPhase, setCurrentPhase] = useState(0);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const { user } = useAuth();

  const isFieldVisible = useCallback(
    (field) => {
      if (!field.showWhen) return true;
      return formData[field.showWhen.fieldId] === field.showWhen.equals;
    },
    [formData],
  );

  const compileFinalPayload = useCallback(() => {
    if (!auditSchema) return {};

    const finalDocument = JSON.parse(JSON.stringify(auditSchema));

    const macros = [];

    finalDocument.phases.forEach((phase) => {
      phase.fields.forEach((field) => {
        const answer =
          formData[field.fieldId] !== undefined
            ? formData[field.fieldId]
            : null;

        field.answer = answer;
        field.wasVisible = isFieldVisible(field);

        // Collect report macros
        if (
          field.macroKey &&
          typeof field.macroKey === "string" &&
          field.macroKey.trim() !== ""
        ) {
          macros.push({
            key: field.macroKey.trim(),
            value: answer,
          });
        }
      });
    });

    finalDocument.macros = macros;
    finalDocument.completedAt = new Date().toISOString();

    return finalDocument;
  }, [auditSchema, formData, isFieldVisible]);

  useEffect(() => {
    if (!hasUnsavedChanges || !formData || Object.keys(formData).length === 0) {
      return;
    }

    const timeoutId = setTimeout(async () => {
      if (!onAutoSave) return;

      setIsSaving(true);

      try {
        const draftPayload = compileFinalPayload();

        draftPayload.status = "draft";

        await onAutoSave(draftPayload);

        setLastSaved(new Date());
        setHasUnsavedChanges(false);
      } catch (error) {
        console.error("Auto save failed:", error);
      } finally {
        setIsSaving(false);
      }
    }, 3000);

    return () => clearTimeout(timeoutId);
  }, [formData, onAutoSave, compileFinalPayload, hasUnsavedChanges]);

  if (!auditSchema || !auditSchema.phases || !auditSchema.phases.length) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen font-bold bg-gray-50 dark:bg-gray-950 text-gray-500">
        <AlertCircle className="w-12 h-12 mb-4 text-gray-300" />
        <p className="text-xl">No audit schema available</p>
      </div>
    );
  }

  const phase = auditSchema.phases[currentPhase];
  const totalPhases = auditSchema.phases.length;

  const validateCurrentPhase = () => {
    const newErrors = {};
    let isValid = true;

    phase.fields.forEach((field) => {
      if (!isFieldVisible(field)) return;

      const val = formData[field.fieldId];
      const isEmpty =
        val === undefined ||
        val === null ||
        (typeof val === "string" && val.trim() === "") ||
        val === false ||
        (Array.isArray(val) && val.length === 0);

      if (field.required && isEmpty) {
        newErrors[field.fieldId] = "This is a required question.";
        isValid = false;
        return;
      }

      if (!isEmpty && field.validation) {
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

  const handleChange = (fieldId, value) => {
    setFormData((prev) => ({ ...prev, [fieldId]: value }));
    setHasUnsavedChanges(true);

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
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const goPrevious = () => {
    if (!validateCurrentPhase()) {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    if (currentPhase > 0) {
      setCurrentPhase(currentPhase - 1);
      setErrors({});
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const jumpToPhase = (index) => {
    if (!validateCurrentPhase()) {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    if (index < currentPhase) {
      setCurrentPhase(index);
      setErrors({});
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else if (index === currentPhase + 1) {
      setCurrentPhase(index);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handlePreSubmit = () => {
    if (!validateCurrentPhase()) {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    setIsSubmitModalOpen(true);
  };

  const confirmSubmit = async () => {
    setIsSubmitModalOpen(false);
    if (onSubmit) {
      const payload = compileFinalPayload();
      payload.status = "submitted";
      await onSubmit(payload);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 font-sans text-gray-900 dark:text-gray-100 pb-12">
      <div className="max-w-7xl mx-auto p-4 flex flex-col lg:flex-row gap-4 lg:gap-5 items-start animate-fadeIn">
        {/* SIDEBAR */}
        <div className="w-full lg:w-80 shrink-0 lg:sticky lg:top-4 flex flex-col gap-4 z-10">
          {/* Audit Info Card */}
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-md shadow-sm p-4">
            <div className="flex items-start gap-3">
              <div className="p-2.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-md shrink-0">
                <ClipboardList className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-lg font-bold leading-tight text-gray-900 dark:text-white">
                  {auditSchema.title}
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {auditSchema.description ||
                    "Complete the audit form fields below."}
                </p>
                <div className="mt-2.5">
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold uppercase tracking-wide border ${
                      auditSchema &&
                      ((auditSchema.auditType || "").toLowerCase() === "full" ||
                        (auditSchema.title || "")
                          .toLowerCase()
                          .includes("full"))
                        ? "text-purple-700 bg-purple-50 border-purple-200 dark:text-purple-400 dark:bg-purple-900/20 dark:border-purple-800"
                        : "text-blue-700 bg-blue-50 border-blue-200 dark:text-blue-400 dark:bg-blue-900/20 dark:border-blue-800"
                    }`}
                  >
                    {auditSchema &&
                    ((auditSchema.auditType || "").toLowerCase() === "full" ||
                      (auditSchema.title || "").toLowerCase().includes("full"))
                      ? "Full Comprehensive Form"
                      : "Simple Audit Form"}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-5 pt-4 border-t border-gray-100 dark:border-gray-800 flex items-center gap-2 text-sm font-medium">
              {isSaving ? (
                <span className="flex items-center gap-1.5 text-yellow-600 dark:text-yellow-500">
                  <CloudLightning size={16} /> Saving draft...
                </span>
              ) : lastSaved ? (
                <span className="flex items-center gap-1.5 text-green-600 dark:text-green-500">
                  <CheckCircle2 size={16} /> Draft Saved
                </span>
              ) : (
                <span className="text-gray-400">Ready for inputs...</span>
              )}
            </div>
          </div>

          {/* Stepper Card */}
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-md shadow-sm p-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-4">
              Sections
            </h3>
            <div className="flex flex-col gap-1 relative">
              <div className="absolute left-[22px] top-4 bottom-4 w-px bg-gray-200 dark:bg-gray-700 z-0"></div>

              {auditSchema.phases.map((phaseItem, index) => {
                const isActive = currentPhase === index;
                const isCompleted = index < currentPhase;
                const isDisabled = index > currentPhase;

                return (
                  <button
                    key={phaseItem.phaseId}
                    onClick={() => jumpToPhase(index)}
                    disabled={isDisabled}
                    className={`group relative z-10 flex items-center gap-3 p-2 text-sm font-medium rounded-md transition-colors focus:outline-none text-left
                      ${
                        isActive
                          ? "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300"
                          : isCompleted
                            ? "hover:bg-gray-50 dark:hover:bg-gray-800/50 text-gray-700 dark:text-gray-300 cursor-pointer"
                            : "text-gray-400 dark:text-gray-600 cursor-not-allowed opacity-60"
                      }
                    `}
                  >
                    {isCompleted ? (
                      <div className="flex items-center justify-center w-7 h-7 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 border border-green-200 dark:border-green-800 shrink-0">
                        <Check size={14} strokeWidth={3} />
                      </div>
                    ) : (
                      <div
                        className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold shrink-0 border
                          ${
                            isActive
                              ? "bg-blue-600 border-blue-600 text-white"
                              : "bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-600 text-gray-500"
                          }
                        `}
                      >
                        {index + 1}
                      </div>
                    )}
                    <span className="truncate">{phaseItem.title}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* MAIN CONTENT AREA */}
        <div className="flex flex-col flex-1 w-full min-w-0 gap-4">
          {/* Phase Header */}
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-md shadow-sm p-4 sm:p-6">
            <div className="flex items-center gap-3 mb-4">
              <span className="inline-flex items-center px-2.5 py-1 text-xs font-bold uppercase tracking-wider text-blue-700 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400 rounded-md">
                Section {currentPhase + 1} of {totalPhases}
              </span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {phase.title}
            </h2>
            {phase.description && (
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                {phase.description}
              </p>
            )}
          </div>

          {/* Form Fields container */}
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-md shadow-sm p-4 sm:p-6 space-y-4">
            {phase.fields.filter(isFieldVisible).map((field) => (
              <div
                key={field.fieldId}
                className={`relative transition-all duration-200 border-l-4 pl-4 py-2 ${
                  errors[field.fieldId]
                    ? "border-red-500"
                    : "border-transparent"
                }`}
              >
                <FormFieldRenderer
                  key={field.fieldId}
                  field={field}
                  formData={formData}
                  updateField={handleChange}
                  error={errors[field.fieldId]}
                />
              </div>
            ))}
          </div>

          {/* Actions panel */}
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-md shadow-sm p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <button
              type="button"
              onClick={goPrevious}
              disabled={currentPhase === 0}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-800 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
            >
              <ChevronLeft size={16} /> Go Back
            </button>

            {currentPhase === totalPhases - 1 ? (
              <button
                type="button"
                onClick={handlePreSubmit}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 text-sm font-semibold text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
              >
                Finalize & Submit <Send size={16} />
              </button>
            ) : (
              <button
                type="button"
                onClick={goNext}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 text-sm font-semibold text-white bg-blue-700 border border-transparent rounded-md hover:bg-blue-800 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
              >
                Save & Continue <ChevronRight size={16} />
              </button>
            )}
          </div>
        </div>
      </div>

      <FadePopUp
        isOpen={isSubmitModalOpen}
        onClose={() => setIsSubmitModalOpen(false)}
        rotateDirection="Y"
        animationDuration={300}
        overlayClassName="bg-gray-900/50 backdrop-blur-sm"
      >
        <div className="bg-white dark:bg-gray-900 p-8 rounded-md shadow-2xl max-w-md w-full border border-gray-200 dark:border-gray-800 m-4 relative overflow-hidden">
          <div className="relative z-10">
            <div className="flex items-center justify-center w-12 h-12 mb-5 bg-green-100 dark:bg-green-900/30 rounded-full text-green-600 dark:text-green-400">
              <CheckCircle2 size={24} strokeWidth={2.5} />
            </div>

            <h3 className="mb-2 text-xl font-bold text-gray-900 dark:text-white">
              Confirm Submission
            </h3>

            <p className="mb-6 text-sm text-gray-600 dark:text-gray-400">
              You have completed all {totalPhases} sections of the form. Once
              submitted, you may not be able to edit your responses. Are you
              sure you want to proceed?
            </p>

            <div className="flex gap-3 justify-end mt-8">
              <button
                onClick={() => setIsSubmitModalOpen(false)}
                className="px-4 py-2 text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
              >
                Review Again
              </button>
              <button
                onClick={confirmSubmit}
                className="px-4 py-2 text-sm font-semibold text-white bg-green-600 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
              >
                Yes, Submit
              </button>
            </div>
          </div>
        </div>
      </FadePopUp>
    </div>
  );
}
