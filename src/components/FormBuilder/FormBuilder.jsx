"use client";

import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
  Plus,
  Trash2,
  Copy,
  Settings2,
  Eye,
  AlertCircle,
  Equal,
  Save,
  MoreVertical,
  Check,
} from "lucide-react";
import { FormFieldRenderer } from "@/components/AuditComponents";
import FadePopUp from "@/components/FadePopUp";
import QuestionCard from "./QuestionCard";
import {
  OPTION_TYPES,
  QUESTION_SCHEMAS,
  DEFAULT_SCHEMA,
} from "./schemas";

const MACRO_REGEX = /^[a-z][a-z0-9_]*$/;

export default function FormBuilderPage({
  auditForm,
  initialSchema,
  onSave,
  onPublish,
  onDiscard,
  saving,
  orgId,
  auditType,
  formId,
}) {
  const isCompleted =
    auditForm &&
    ["COMPLETED", "Completed"].includes(
      auditForm.AuditStatus || auditForm.status,
    );

  const isDiscarded =
    auditForm &&
    ["DISCARDED", "Discarded"].includes(
      auditForm.AuditStatus || auditForm.status,
    );

  const isReadOnly = isCompleted || isDiscarded;

  const [schema, setSchema] = useState(initialSchema || DEFAULT_SCHEMA);
  const [activeId, setActiveId] = useState(
    schema?.phases?.[0]?.phaseId || "header",
  );
  const [viewMode, setViewMode] = useState(isReadOnly ? "preview" : "builder");
  const [builderErrors, setBuilderErrors] = useState({});
  const [previewData, setPreviewData] = useState({});
  const [barTop, setBarTop] = useState(0);

  // Drag-and-drop state
  const [draggedItem, setDraggedItem] = useState(null); // { phaseId, fieldId }
  const [dragOverItem, setDragOverItem] = useState(null); // { phaseId, fieldId, position: 'top' | 'bottom', isHeader?: boolean }

  // Dropdown & modal states
  const [showDropdown, setShowDropdown] = useState(false);
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);

  useEffect(() => {
    const updatePosition = () => {
      const activeEl = document.getElementById(activeId);
      const containerEl = document.getElementById("builder-container");
      if (!activeEl || !containerEl) return;

      const containerRect = containerEl.getBoundingClientRect();
      const activeRect = activeEl.getBoundingClientRect();

      const cardTop = activeRect.top - containerRect.top;
      const cardBottom = activeRect.bottom - containerRect.top;

      // Header offset to clear the sticky top nav (~80px height + safety padding)
      const stickyHeaderHeight = 85;
      const viewportTop = -containerRect.top + stickyHeaderHeight;

      // Floating action bar height on desktop is around 120px
      const barHeight = 120;

      // Align with the top of the active card (plus top offset)
      const targetTop = cardTop + 8;

      // Stick to the viewport top if scrolled past the top of the card
      let y = Math.max(targetTop, viewportTop);

      // But do not go beyond the bottom of the card minus the bar height
      const maxTop = cardBottom - barHeight - 8;
      y = Math.min(y, Math.max(targetTop, maxTop));

      setBarTop(y);
    };

    updatePosition();

    // Event listeners
    window.addEventListener("scroll", updatePosition);
    window.addEventListener("resize", updatePosition);

    // Watch for size changes using ResizeObserver (extremely robust for layout shifts!)
    let resizeObserver;
    const containerEl = document.getElementById("builder-container");
    if (containerEl && typeof ResizeObserver !== "undefined") {
      resizeObserver = new ResizeObserver(updatePosition);
      resizeObserver.observe(containerEl);
    }

    return () => {
      window.removeEventListener("scroll", updatePosition);
      window.removeEventListener("resize", updatePosition);
      if (resizeObserver && containerEl) {
        resizeObserver.unobserve(containerEl);
      }
    };
  }, [activeId, schema]);

  // 1. Sync with incoming template data
  useEffect(() => {
    if (initialSchema) {
      setSchema(initialSchema);
    }
  }, [initialSchema]);

  const validateSchema = () => {
    const errors = {};
    if (!schema.title?.trim()) errors.header = ["Form title is required"];

    const fieldIds = new Set();
    const macroKeys = new Set();

    schema.phases.forEach((p) => {
      if (!p.title?.trim()) {
        errors[p.phaseId] = errors[p.phaseId] || [];
        errors[p.phaseId].push("Phase title is required");
      }
      if (p.fields.length === 0) {
        errors[p.phaseId] = errors[p.phaseId] || [];
        errors[p.phaseId].push("Phase must have at least one question");
      }

      p.fields.forEach((f) => {
        const fErrors = [];
        if (!f.label?.trim()) fErrors.push("Question label cannot be empty.");
        if (fieldIds.has(f.fieldId))
          fErrors.push("Duplicate field ID detected.");
        fieldIds.add(f.fieldId);

        if (f.macroKey && f.macroKey.trim() !== "") {
          if (!MACRO_REGEX.test(f.macroKey)) {
            fErrors.push("Macro key must start with a lowercase letter and contain only lowercase letters, numbers, and underscores.");
          }
          if (macroKeys.has(f.macroKey)) {
            fErrors.push(`Duplicate macro key '${f.macroKey}'. Macros must be unique.`);
          }
          macroKeys.add(f.macroKey);
        }

        if (OPTION_TYPES.includes(f.componentType)) {
          if ((!f.options || f.options.length === 0) && !f.allowOther) {
            fErrors.push(
              "Choice questions must have at least one option or allow 'Other'.",
            );
          }
          const optValues = new Set();
          f.options?.forEach((o) => {
            if (!o.label?.trim())
              fErrors.push("Option labels cannot be empty.");
            if (!o.value?.trim())
              fErrors.push("Option values cannot be empty.");
            if (optValues.has(o.value))
              fErrors.push(`Duplicate option value: '${o.value}'`);
            optValues.add(o.value);
          });
        }
        if (fErrors.length > 0) errors[f.fieldId] = fErrors;
      });
    });

    setBuilderErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // 3. Publish Flow Transition
  const handlePublish = async () => {
    if (!validateSchema()) {
      setViewMode("builder");
      return;
    }

    if (onPublish) {
      await onPublish(schema);
    } else {
      toast.error("Publish handler is not provided.");
    }
  };

  // 4. Explicit Draft Trigger
  const handleSaveDraft = async () => {
    try {
      await onSave(schema, "DRAFT");
      toast.success("Draft saved successfully.");
    } catch (error) {
      toast.error("Failed to save draft.");
    }
  };

  // 5. Discard Flow Trigger
  const handleDiscard = async () => {
    setShowDropdown(false);
    setShowDiscardConfirm(true);
  };

  const handleConfirmDiscard = async () => {
    setShowDiscardConfirm(false);
    if (onDiscard) {
      await onDiscard();
    } else {
      toast.error("Discard handler is not provided.");
    }
  };

  // --- DRAG AND DROP HANDLERS ---
  const handleDragStart = (e, phaseId, fieldId) => {
    setDraggedItem({ phaseId, fieldId });
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOverCard = (e, targetPhaseId, targetFieldId) => {
    e.preventDefault();
    if (!draggedItem) return;

    if (draggedItem.fieldId === targetFieldId) {
      setDragOverItem(null);
      return;
    }

    const rect = e.currentTarget.getBoundingClientRect();
    const relativeY = e.clientY - rect.top;
    const position = relativeY < rect.height / 2 ? "top" : "bottom";

    setDragOverItem({
      phaseId: targetPhaseId,
      fieldId: targetFieldId,
      position,
    });
  };

  const handleDragOverPhaseHeader = (e, targetPhaseId) => {
    e.preventDefault();
    if (!draggedItem) return;
    setDragOverItem({ phaseId: targetPhaseId, isHeader: true });
  };

  const handleDrop = (e, targetPhaseId, targetFieldId, isHeader = false) => {
    e.preventDefault();
    if (!draggedItem || !dragOverItem) return;

    reorderQuestions(draggedItem, dragOverItem);
    setDraggedItem(null);
    setDragOverItem(null);
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
    setDragOverItem(null);
  };

  const reorderQuestions = (source, target) => {
    const { phaseId: sourcePhaseId, fieldId: sourceFieldId } = source;

    const sourcePhaseIndex = schema.phases.findIndex(
      (p) => p.phaseId === sourcePhaseId,
    );
    if (sourcePhaseIndex === -1) return;
    const sourcePhase = schema.phases[sourcePhaseIndex];

    const sourceFieldIndex = sourcePhase.fields.findIndex(
      (f) => f.fieldId === sourceFieldId,
    );
    if (sourceFieldIndex === -1) return;
    const draggedField = sourcePhase.fields[sourceFieldIndex];

    const newPhases = schema.phases.map((p) => ({
      ...p,
      fields: [...p.fields],
    }));

    newPhases[sourcePhaseIndex].fields.splice(sourceFieldIndex, 1);

    const targetPhaseIndex = newPhases.findIndex(
      (p) => p.phaseId === target.phaseId,
    );
    if (targetPhaseIndex === -1) return;
    const targetPhase = newPhases[targetPhaseIndex];

    if (target.isHeader) {
      targetPhase.fields.unshift(draggedField);
    } else {
      const targetFieldIndex = targetPhase.fields.findIndex(
        (f) => f.fieldId === target.fieldId,
      );
      if (targetFieldIndex === -1) {
        targetPhase.fields.push(draggedField);
      } else {
        if (target.position === "bottom") {
          targetPhase.fields.splice(targetFieldIndex + 1, 0, draggedField);
        } else {
          targetPhase.fields.splice(targetFieldIndex, 0, draggedField);
        }
      }
    }

    setSchema({ ...schema, phases: newPhases });
  };

  // --- HELPERS ---
  const getActivePhaseIndex = () => {
    for (let p = 0; p < schema.phases.length; p++) {
      if (schema.phases[p].phaseId === activeId) return p;
      if (schema.phases[p].fields.some((f) => f.fieldId === activeId)) return p;
    }
    return 0;
  };

  const getPreviousChoiceQuestions = (currentFieldId) => {
    const prev = [];
    for (const p of schema.phases) {
      for (const f of p.fields) {
        if (f.fieldId === currentFieldId) return prev;
        if (OPTION_TYPES.includes(f.componentType)) prev.push(f);
      }
    }
    return prev;
  };

  // --- ACTIONS: PHASES ---
  const addPhase = () => {
    const pIndex = getActivePhaseIndex();
    const newPhaseId = `phase_${crypto.randomUUID()}`;
    const newFieldId = crypto.randomUUID();

    const newPhase = {
      phaseId: newPhaseId,
      title: "Untitled Section",
      description: "",
      fields: [
        {
          fieldId: newFieldId,
          componentType: "multiple_choice",
          label: "",
          required: false,
          macroKey: "",
          validation: {},
          options: [
            { id: crypto.randomUUID(), label: "Option 1", value: "option_1" },
          ],
          allowOther: false,
        },
      ],
    };

    const newPhases = [...schema.phases];
    newPhases.splice(pIndex + 1, 0, newPhase);
    setSchema({ ...schema, phases: newPhases });
    setActiveId(newPhaseId);
  };

  const updatePhase = (phaseId, updates) => {
    setSchema((prev) => ({
      ...prev,
      phases: prev.phases.map((p) =>
        p.phaseId === phaseId ? { ...p, ...updates } : p,
      ),
    }));
    if (builderErrors[phaseId])
      setBuilderErrors((prev) => ({ ...prev, [phaseId]: undefined }));
  };

  const duplicatePhase = (phaseId) => {
    const pIndex = schema.phases.findIndex((p) => p.phaseId === phaseId);
    const phase = schema.phases[pIndex];
    const newPhaseId = `phase_${crypto.randomUUID()}`;

    const newPhase = {
      ...phase,
      phaseId: newPhaseId,
      title: `${phase.title} (Copy)`,
      fields: phase.fields.map((f) => ({
        ...f,
        fieldId: crypto.randomUUID(),
        options: f.options?.map((o) => ({ ...o, id: crypto.randomUUID() })),
      })),
    };

    const newPhases = [...schema.phases];
    newPhases.splice(pIndex + 1, 0, newPhase);
    setSchema({ ...schema, phases: newPhases });
    setActiveId(newPhaseId);
  };

  const deletePhase = (phaseId) => {
    if (schema.phases.length <= 1) return;
    setSchema((prev) => ({
      ...prev,
      phases: prev.phases.filter((p) => p.phaseId !== phaseId),
    }));
    setActiveId(schema.phases[0].phaseId);
  };

  // --- ACTIONS: QUESTIONS ---
  const addQuestion = () => {
    const pIndex = getActivePhaseIndex();
    const phase = schema.phases[pIndex];
    const newFieldId = crypto.randomUUID();
    const insertIndex = phase.fields.length; // Always append to the end of the section

    const newFields = [...phase.fields];
    newFields.splice(insertIndex, 0, {
      ...QUESTION_SCHEMAS.multiple_choice,
      fieldId: newFieldId,
      label: "",
      macroKey: "",
      options: [
        { id: crypto.randomUUID(), label: "Option 1", value: "option_1" },
      ],
    });

    const newPhases = [...schema.phases];
    newPhases[pIndex] = { ...phase, fields: newFields };
    setSchema({ ...schema, phases: newPhases });
    setActiveId(newFieldId);
  };

  const updateQuestion = (phaseId, fieldId, updates) => {
    setSchema((prev) => ({
      ...prev,
      phases: prev.phases.map((p) => {
        if (p.phaseId !== phaseId) return p;
        return {
          ...p,
          fields: p.fields.map((f) =>
            f.fieldId === fieldId ? { ...f, ...updates } : f,
          ),
        };
      }),
    }));
    if (builderErrors[fieldId])
      setBuilderErrors((prev) => ({ ...prev, [fieldId]: undefined }));
  };

  const deleteQuestion = (phaseId, fieldId) => {
    setSchema((prev) => {
      const pIndex = prev.phases.findIndex((p) => p.phaseId === phaseId);
      const phase = prev.phases[pIndex];

      if (phase.fields.length <= 1) return prev;

      const fIndex = phase.fields.findIndex((f) => f.fieldId === fieldId);
      const newFields = phase.fields.filter((f) => f.fieldId !== fieldId);

      if (activeId === fieldId) {
        if (fIndex < phase.fields.length - 1)
          setActiveId(phase.fields[fIndex + 1].fieldId);
        else if (fIndex > 0) setActiveId(phase.fields[fIndex - 1].fieldId);
        else setActiveId(phaseId);
      }

      const newPhases = [...prev.phases];
      newPhases[pIndex] = { ...phase, fields: newFields };
      return { ...prev, phases: newPhases };
    });
  };

  const duplicateQuestion = (phaseId, field) => {
    const newFieldId = crypto.randomUUID();
    setSchema((prev) => ({
      ...prev,
      phases: prev.phases.map((p) => {
        if (p.phaseId !== phaseId) return p;
        const fIndex = p.fields.findIndex((f) => f.fieldId === field.fieldId);
        const newFields = [...p.fields];
        newFields.splice(fIndex + 1, 0, {
          ...field,
          fieldId: newFieldId,
          options: field.options?.map((opt) => ({
            ...opt,
            id: crypto.randomUUID(),
          })),
        });
        return { ...p, fields: newFields };
      }),
    }));
    setActiveId(newFieldId);
  };

  // --- PREVIEW SCREEN ---
  if (viewMode === "preview") {
    return (
      <div className="min-h-screen pb-32 bg-slate-50 dark:bg-slate-950">
        <div className="sticky top-0 z-50 flex items-center justify-between px-4 py-4 bg-white border-b shadow-sm dark:bg-slate-900 border-slate-200 dark:border-slate-800 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 text-indigo-600 bg-indigo-100 dark:bg-indigo-900/40 dark:text-indigo-400 rounded-xl">
              <Eye size={20} />
            </div>
            <span className="hidden text-lg font-bold text-slate-900 dark:text-white sm:block">
              Preview Mode
            </span>
          </div>
          {isReadOnly ? (
            <button
              onClick={() => {
                window.location.href = `/dashboard?tab=form_builder`;
              }}
              className="bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-bold transition-all shadow-sm focus:ring-2 focus:ring-indigo-500"
            >
              Back to Dashboard
            </button>
          ) : (
            <button
              onClick={() => setViewMode("builder")}
              className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 px-6 py-2.5 rounded-xl font-bold transition-colors focus:ring-2 focus:ring-slate-400"
            >
              Exit Preview
            </button>
          )}
        </div>

        <div className="relative max-w-3xl px-4 pt-8 mx-auto space-y-6">
          <div className="overflow-hidden bg-white border border-t-8 shadow-sm dark:bg-slate-900 rounded-2xl border-slate-200 dark:border-slate-800 border-t-indigo-600 dark:border-t-indigo-500">
            <div className="p-8">
              <h1 className="mb-2 text-3xl font-extrabold text-slate-900 dark:text-white">
                {schema.title}
              </h1>
              <p className="text-sm whitespace-pre-wrap text-slate-500 dark:text-slate-400">
                {schema.description}
              </p>
            </div>
          </div>

          {schema.phases.map((phase) => (
            <div key={phase.phaseId} className="space-y-6">
              {schema.phases.length > 1 && (
                <div className="p-6 bg-white border border-t-8 shadow-sm dark:bg-slate-900 rounded-2xl border-slate-200 dark:border-slate-800 sm:p-8 border-t-indigo-400 dark:border-t-indigo-400">
                  <h2 className="mb-2 text-2xl font-bold text-slate-900 dark:text-white">
                    {phase.title}
                  </h2>
                  {phase.description && (
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      {phase.description}
                    </p>
                  )}
                </div>
              )}

              {phase.fields.map((field) => {
                if (field.showWhen) {
                  const targetVal = previewData[field.showWhen.fieldId];
                  if (targetVal !== field.showWhen.equals) return null;
                }

                return (
                  <div
                    key={field.fieldId}
                    className="p-6 bg-white border shadow-sm dark:bg-slate-900 rounded-2xl border-slate-200 dark:border-slate-800 sm:p-8"
                  >
                    <FormFieldRenderer
                      field={field}
                      formData={previewData}
                      updateField={(id, val) =>
                        setPreviewData((prev) => ({ ...prev, [id]: val }))
                      }
                    />
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Guard against entering builder mode for read-only templates
  if (isReadOnly && viewMode === "builder") {
    setViewMode("preview");
    return null;
  }

  // --- BUILDER SCREEN ---
  return (
    <div className="min-h-screen pb-32 bg-slate-50 dark:bg-slate-950">
      {/* HEADER NAV */}
      <div className="sticky top-0 z-50 flex items-center justify-between px-4 py-4 transition-colors bg-white border-b shadow-sm dark:bg-slate-900 border-slate-200 dark:border-slate-800 sm:px-6">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 text-white bg-indigo-600 shadow-sm dark:bg-indigo-500 rounded-xl">
            <Settings2 size={22} />
          </div>
          <span className="hidden text-lg font-bold tracking-tight text-slate-900 dark:text-white sm:block">
            Form Builder
          </span>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={() => setViewMode("preview")}
            className="p-2.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-xl transition-colors focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            title="Preview"
          >
            <Eye size={20} />
          </button>

          <button
            onClick={handleSaveDraft}
            disabled={saving}
            className="p-2.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-xl transition-colors focus:ring-2 focus:ring-indigo-500 focus:outline-none hidden sm:flex items-center gap-2 disabled:opacity-50"
            title="Save Draft"
          >
            <Save size={18} />
          </button>

          <button
            onClick={handlePublish}
            disabled={saving}
            className="bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-bold transition-all shadow-sm shadow-indigo-500/20 flex items-center gap-2 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900 hover:-translate-y-0.5 disabled:opacity-50"
          >
            <Check size={18} />{" "}
            <span className="hidden sm:inline">Publish</span>
          </button>

          <div className="relative">
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              disabled={saving}
              className="p-2.5 text-slate-500 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors focus:ring-2 focus:ring-slate-400 focus:outline-none disabled:opacity-50"
              title="More options"
            >
              <MoreVertical size={20} />
            </button>

            {showDropdown && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowDropdown(false)}
                />
                <div className="absolute right-0 z-50 w-48 py-2 mt-2 bg-white border shadow-xl dark:bg-slate-900 rounded-2xl border-slate-200 dark:border-slate-800 animate-fadeIn">
                  <button
                    onClick={handleDiscard}
                    className="flex items-center w-full gap-3 px-4 py-3 text-sm font-semibold transition-colors text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20"
                  >
                    <Trash2 size={16} />
                    Discard Template
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <div
        id="builder-container"
        className="relative max-w-3xl px-4 pt-8 mx-auto"
      >
        {/* VALIDATION ERRORS BANNER */}
        {Object.keys(builderErrors).length > 0 && viewMode === "builder" && (
          <div className="flex items-start gap-3 p-5 mb-8 border bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/20 rounded-2xl animate-fadeIn">
            <AlertCircle className="text-rose-500 shrink-0 mt-0.5" size={20} />
            <div>
              <h3 className="font-bold text-rose-800 dark:text-rose-300">
                Please fix validation errors
              </h3>
              <p className="mt-1 text-sm font-medium text-rose-600 dark:text-rose-400/80">
                Review the fields highlighted below before publishing.
              </p>
            </div>
          </div>
        )}

        {/* --- BUILDER VIEW --- */}
        {viewMode === "builder" && (
          <div className="animate-fadeIn">
            {/* Form Header */}
            <div
              id="header"
              onClick={() => setActiveId("header")}
              onFocusCapture={() => setActiveId("header")}
              className={`relative bg-white dark:bg-slate-900 rounded-2xl shadow-sm border overflow-hidden transition-all duration-200 cursor-text mb-8 ${
                activeId === "header"
                  ? "shadow-md border-indigo-300 dark:border-indigo-700 ring-2 ring-indigo-500/20"
                  : "border-slate-200 dark:border-slate-800"
              } ${builderErrors.header ? "border-rose-400 ring-2 ring-rose-500/20" : ""}`}
            >
              <div className="w-full h-3 bg-indigo-600 dark:bg-indigo-500"></div>

              <div className="p-6 space-y-5 sm:p-8">
                <div>
                  <input
                    value={schema.title}
                    onChange={(e) => {
                      setSchema({ ...schema, title: e.target.value });
                      if (builderErrors.header)
                        setBuilderErrors((p) => ({ ...p, header: undefined }));
                    }}
                    className={`w-full text-3xl sm:text-4xl font-extrabold bg-transparent pb-2 outline-none transition-colors dark:text-white ${
                      activeId === "header"
                        ? "border-b-2 border-indigo-600 dark:border-indigo-500"
                        : "border-b-2 border-transparent"
                    }`}
                    placeholder="Form title"
                  />
                  {builderErrors.header && (
                    <p className="mt-2 text-xs font-bold text-rose-500">
                      {builderErrors.header[0]}
                    </p>
                  )}
                </div>

                <input
                  value={schema.description}
                  onChange={(e) =>
                    setSchema({ ...schema, description: e.target.value })
                  }
                  className={`w-full text-sm font-medium bg-transparent pb-2 outline-none transition-colors text-slate-600 dark:text-slate-400 ${
                    activeId === "header"
                      ? "border-b border-indigo-300 dark:border-indigo-700"
                      : "border-b border-transparent"
                  }`}
                  placeholder="Form description"
                />
              </div>
            </div>

            {/* Phases */}
            {schema.phases.map((phase, index) => (
              <div key={phase.phaseId} className="mb-10 space-y-4">
                {/* Phase Header */}
                <div
                  id={phase.phaseId}
                  onClick={() => setActiveId(phase.phaseId)}
                  onFocusCapture={() => setActiveId(phase.phaseId)}
                  onDragOver={(e) =>
                    handleDragOverPhaseHeader(e, phase.phaseId)
                  }
                  onDrop={(e) => handleDrop(e, phase.phaseId, null, true)}
                  className={`relative bg-white dark:bg-slate-900 rounded-2xl shadow-sm border overflow-hidden transition-all duration-200 cursor-text 
                    ${
                      activeId === phase.phaseId
                        ? "shadow-md border-indigo-300 dark:border-indigo-700 ring-2 ring-indigo-500/20"
                        : "border-slate-200 dark:border-slate-800"
                    } 
                    ${builderErrors[phase.phaseId] ? "border-rose-400 ring-2 ring-rose-500/20" : ""}
                    ${dragOverItem && dragOverItem.phaseId === phase.phaseId && dragOverItem.isHeader ? "border-t-4 border-t-indigo-600 dark:border-t-indigo-500" : ""}
                  `}
                >
                  <div className="p-6 space-y-5 sm:p-8">
                    <div className="flex flex-col justify-between gap-4 mb-2 sm:flex-row sm:items-center">
                      <span className="bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-400 text-xs font-bold uppercase tracking-widest px-3 py-1.5 rounded-lg w-max">
                        Section {index + 1} of {schema.phases.length}
                      </span>
                      <div className="flex gap-1 p-1 border rounded-lg bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            duplicatePhase(phase.phaseId);
                          }}
                          className="text-slate-400 hover:text-indigo-600 hover:bg-white dark:hover:bg-slate-700 rounded transition-all p-1.5"
                          title="Duplicate Section"
                        >
                          <Copy size={16} />
                        </button>
                        {schema.phases.length > 1 && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deletePhase(phase.phaseId);
                            }}
                            className="text-slate-400 hover:text-rose-600 hover:bg-white dark:hover:bg-slate-700 rounded transition-all p-1.5"
                            title="Delete Section"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </div>

                    <div>
                      <input
                        value={phase.title}
                        onChange={(e) =>
                          updatePhase(phase.phaseId, { title: e.target.value })
                        }
                        className={`w-full text-2xl font-bold bg-transparent pb-2 outline-none transition-colors dark:text-white ${
                          activeId === phase.phaseId
                            ? "border-b-2 border-indigo-600 dark:border-indigo-500"
                            : "border-b-2 border-transparent"
                        }`}
                        placeholder="Section title"
                      />
                      {builderErrors[phase.phaseId] && (
                        <ul className="mt-2 space-y-1 text-xs font-bold text-rose-500">
                          {builderErrors[phase.phaseId].map((e, i) => (
                            <li key={i} className="flex items-center gap-1">
                              <AlertCircle size={12} /> {e}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>

                    <input
                      value={phase.description}
                      onChange={(e) =>
                        updatePhase(phase.phaseId, {
                          description: e.target.value,
                        })
                      }
                      className={`w-full text-sm font-medium bg-transparent pb-2 outline-none transition-colors text-slate-600 dark:text-slate-400 ${
                        activeId === phase.phaseId
                          ? "border-b border-indigo-300 dark:border-indigo-700"
                          : "border-b border-transparent"
                      }`}
                      placeholder="Description (optional)"
                    />
                  </div>
                </div>

                {/* Questions */}
                <div className="space-y-4">
                  {phase.fields.map((field) => (
                    <QuestionCard
                      key={field.fieldId}
                      phaseId={phase.phaseId}
                      field={field}
                      isActive={activeId === field.fieldId}
                      onActivate={() => setActiveId(field.fieldId)}
                      updateQuestion={updateQuestion}
                      deleteQuestion={deleteQuestion}
                      duplicateQuestion={duplicateQuestion}
                      disableDelete={phase.fields.length <= 1}
                      errors={builderErrors[field.fieldId]}
                      previousQuestions={getPreviousChoiceQuestions(
                        field.fieldId,
                      )}
                      draggedItem={draggedItem}
                      dragOverItem={dragOverItem}
                      onDragStart={handleDragStart}
                      onDragOverCard={handleDragOverCard}
                      onDrop={handleDrop}
                      onDragEnd={handleDragEnd}
                    />
                  ))}
                </div>
              </div>
            ))}

            {/* FLOATING ACTION BAR */}
            <div
              style={{
                "--bar-top": `${barTop}px`,
              }}
              className="fixed bottom-0 left-0 right-0 z-40 flex justify-center gap-4 p-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 shadow-[0_-8px_24px_rgba(0,0,0,0.07)] sm:absolute sm:top-0 sm:bottom-auto sm:left-auto sm:-right-16 sm:w-12 sm:flex-col sm:rounded-2xl sm:border sm:p-2 sm:shadow-lg sm:translate-y-[var(--bar-top)] transition-[transform] duration-300 ease-[cubic-bezier(0.25,0.8,0.25,1)]"
            >
              <button
                onClick={addQuestion}
                className="p-1 transition-colors text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 dark:hover:text-indigo-400 rounded-xl tooltip"
                title="Add Question"
              >
                <Plus size={22} />
              </button>
              <div className="w-px h-6 mx-auto my-1 sm:w-8 sm:h-px bg-slate-200 dark:bg-slate-800"></div>
              <button
                onClick={addPhase}
                className="p-1 transition-colors text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 dark:hover:text-indigo-400 rounded-xl tooltip"
                title="Add Section"
              >
                <Equal size={22} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* PREMIUM FADE CONFIRMATION MODAL */}
      <FadePopUp
        isOpen={showDiscardConfirm}
        onClose={() => setShowDiscardConfirm(false)}
        closeOnOverlayClick={false}
        overlayClassName="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
        className="w-full max-w-md"
      >
        <div className="p-6 space-y-6 overflow-hidden bg-white border shadow-2xl dark:bg-slate-900 rounded-3xl border-slate-200 dark:border-slate-800 sm:p-8">
          <div className="flex items-center gap-4 text-rose-600">
            <div className="p-3 bg-rose-50 dark:bg-rose-950/30 rounded-2xl">
              <AlertCircle size={28} />
            </div>
            <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">
              Discard Draft Template?
            </h3>
          </div>

          <p className="text-sm font-medium leading-relaxed text-slate-500 dark:text-slate-400">
            Are you sure you want to discard this form draft? All unsaved
            changes will be lost, and this version will be marked as
            **Discarded**. This action cannot be undone.
          </p>

          <div className="flex flex-col gap-3 pt-2 sm:flex-row">
            <button
              onClick={() => setShowDiscardConfirm(false)}
              className="flex-1 px-5 py-3 text-sm font-bold transition-colors text-slate-700 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 rounded-xl"
            >
              Keep Editing
            </button>
            <button
              onClick={handleConfirmDiscard}
              className="flex-1 px-5 py-3 text-sm font-bold text-white transition-colors shadow-sm bg-rose-600 hover:bg-rose-700 dark:bg-rose-500 dark:hover:bg-rose-600 rounded-xl shadow-rose-500/10"
            >
              Discard Draft
            </button>
          </div>
        </div>
      </FadePopUp>
    </div>
  );
}