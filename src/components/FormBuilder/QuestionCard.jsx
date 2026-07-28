"use client";

import React, { useState } from "react";
import {
  Copy,
  Trash2,
  Circle,
  X,
  GripHorizontal,
  ChevronDown,
  Calendar,
  UploadCloud,
  AlertCircle,
  CheckSquare,
  Filter,
} from "lucide-react";
import {
  FIELD_TYPES,
  OPTION_TYPES,
  TEXT_TYPES,
  NUMBER_TYPES,
  QUESTION_SCHEMAS,
} from "./schemas";

export default function QuestionCard({
  phaseId,
  field,
  isActive,
  onActivate,
  updateQuestion,
  deleteQuestion,
  duplicateQuestion,
  disableDelete,
  errors,
  previousQuestions,
  draggedItem,
  dragOverItem,
  onDragStart,
  onDragOverCard,
  onDrop,
  onDragEnd,
}) {
  const supportsOptions = OPTION_TYPES.includes(field.componentType);
  const isNumber = NUMBER_TYPES.includes(field.componentType);
  const isText = TEXT_TYPES.includes(field.componentType);

  const [showLogic, setShowLogic] = useState(!!field.showWhen);
  const [showValidation, setShowValidation] = useState(
    Object.keys(field.validation || {}).length > 0,
  );
  const [isDraggable, setIsDraggable] = useState(false);
  const [showMacroInput, setShowMacroInput] = useState(!!field.macroKey);

  const handleTypeChange = (e) => {
    const newType = e.target.value;
    const schemaTemplate = QUESTION_SCHEMAS[newType] || QUESTION_SCHEMAS.text;

    const updates = {
      componentType: newType,
      validation: { ...schemaTemplate.validation },
    };

    if (OPTION_TYPES.includes(newType)) {
      updates.options =
        field.options && field.options.length > 0
          ? field.options
          : [{ id: crypto.randomUUID(), label: "Option 1", value: "option_1" }];
      updates.allowOther = schemaTemplate.allowOther ?? false;
    } else {
      updates.options = undefined;
      updates.allowOther = undefined;
    }

    updateQuestion(phaseId, field.fieldId, updates);
  };

  const handleOptionLabelChange = (id, newLabel) => {
    const newOptions = field.options.map((o) => {
      if (o.id === id) {
        const autoValue =
          newLabel
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "_")
            .replace(/(^_|_$)/g, "") || `opt_${id}`;
        return { ...o, label: newLabel, value: autoValue };
      }
      return o;
    });
    updateQuestion(phaseId, field.fieldId, { options: newOptions });
  };

  const handleOptionValueChange = (id, newValue) => {
    const newOptions = field.options.map((o) =>
      o.id === id ? { ...o, value: newValue } : o,
    );
    updateQuestion(phaseId, field.fieldId, { options: newOptions });
  };

  const addOption = () => {
    const numOpts = field.options?.length || 0;
    const newId = crypto.randomUUID();
    updateQuestion(phaseId, field.fieldId, {
      options: [
        ...(field.options || []),
        {
          id: newId,
          label: `Option ${numOpts + 1}`,
          value: `option_${numOpts + 1}`,
        },
      ],
    });
  };

  const removeOption = (idToRemove) => {
    updateQuestion(phaseId, field.fieldId, {
      options: field.options.filter((opt) => opt.id !== idToRemove),
    });
  };

  // ---- INACTIVE MODE ----
  if (!isActive) {
    const isDragging = draggedItem && draggedItem.fieldId === field.fieldId;
    const isDragOver = dragOverItem && dragOverItem.fieldId === field.fieldId;
    const dragPosition = isDragOver ? dragOverItem.position : null;

    return (
      <div
        onClick={onActivate}
        onFocusCapture={onActivate}
        id={field.fieldId}
        draggable={isDraggable}
        onDragStart={(e) => onDragStart(e, phaseId, field.fieldId)}
        onDragOver={(e) => onDragOverCard(e, phaseId, field.fieldId)}
        onDrop={(e) => onDrop(e, phaseId, field.fieldId)}
        onDragEnd={onDragEnd}
        className={`bg-white dark:bg-slate-900 rounded-2xl border shadow-sm p-6 sm:p-8 cursor-pointer hover:shadow-md hover:border-indigo-200 dark:hover:border-indigo-800 transition-all group relative 
          ${
            errors
              ? "border-rose-400 ring-1 ring-rose-400"
              : "border-slate-200 dark:border-slate-800"
          }
          ${isDragging ? "opacity-40" : ""}
          ${isDragOver && dragPosition === "top" ? "border-t-4 border-t-indigo-600 dark:border-t-indigo-500" : ""}
          ${isDragOver && dragPosition === "bottom" ? "border-b-4 border-b-indigo-600 dark:border-b-indigo-500" : ""}
        `}
      >
        <div
          className="absolute transition-opacity -translate-x-1/2 opacity-0 top-2 left-1/2 group-hover:opacity-100 cursor-grab active:cursor-grabbing"
          onMouseEnter={() => setIsDraggable(true)}
          onMouseLeave={() => setIsDraggable(false)}
        >
          <GripHorizontal
            size={20}
            className="text-slate-300 dark:text-slate-600"
          />
        </div>

        {errors && (
          <div className="mb-4">
            <span className="bg-rose-100 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400 text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-md">
              Validation Errors
            </span>
          </div>
        )}

        {field.macroKey && (
          <div className="mb-3">
            <span className="bg-indigo-100 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400 text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-md">
              Macro: {field.macroKey}
            </span>
          </div>
        )}

        <div className="flex items-start text-base font-bold leading-snug text-slate-800 dark:text-slate-100">
          {field.label || "Untitled Question"}
          {field.required && (
            <span className="ml-1 text-lg leading-none text-rose-500">*</span>
          )}
        </div>

        {field.helperText && (
          <div className="mt-2 mb-4 text-xs font-medium text-slate-500 dark:text-slate-400">
            {field.helperText}
          </div>
        )}
        {!field.helperText && <div className="mb-5"></div>}

        <div className="text-sm font-medium text-slate-500 dark:text-slate-400">
          {field.componentType === "text" && (
            <div className="w-1/2 pb-2 border-b border-dashed border-slate-300 dark:border-slate-700">
              Short answer text
            </div>
          )}
          {field.componentType === "textarea" && (
            <div className="w-3/4 pb-8 border-b border-dashed border-slate-300 dark:border-slate-700">
              Long answer text
            </div>
          )}
          {field.componentType === "number" && (
            <div className="w-1/3 pb-2 border-b border-dashed border-slate-300 dark:border-slate-700">
              Number
            </div>
          )}
          {field.componentType === "date" && (
            <div className="flex items-center w-1/3 gap-2 pb-2 border-b border-dashed border-slate-300 dark:border-slate-700">
              <Calendar size={14} /> Month, day, year
            </div>
          )}
          {field.componentType === "file" && (
            <div className="border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2.5 inline-flex items-center gap-2 bg-slate-50 dark:bg-slate-800">
              <UploadCloud size={16} /> Upload file
            </div>
          )}
          {field.componentType === "checkbox" && (
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0 w-5 h-5 border-2 rounded border-slate-300 dark:border-slate-600" />{" "}
              Single Confirmation
            </div>
          )}
          {field.componentType === "select" && (
            <div className="border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2.5 w-1/2 flex justify-between items-center bg-slate-50 dark:bg-slate-800">
              <span className="text-slate-400">Select an option...</span>{" "}
              <ChevronDown size={16} />
            </div>
          )}
          {["multiple_choice", "checkbox_group"].includes(
            field.componentType,
          ) && (
            <div className="space-y-3">
              {field.options?.map((opt) => (
                <div key={opt.id} className="flex items-center gap-3">
                  {field.componentType === "checkbox_group" ? (
                    <div className="flex-shrink-0 w-5 h-5 border-2 rounded border-slate-300 dark:border-slate-600" />
                  ) : (
                    <Circle
                      size={20}
                      className="flex-shrink-0 text-slate-300 dark:text-slate-600"
                    />
                  )}
                  <span className="text-slate-700 dark:text-slate-300">
                    {opt.label}
                  </span>
                </div>
              ))}
              {field.allowOther && (
                <div className="flex items-center gap-3">
                  {field.componentType === "checkbox_group" ? (
                    <div className="flex-shrink-0 w-5 h-5 border-2 rounded border-slate-300 dark:border-slate-600" />
                  ) : (
                    <Circle
                      size={20}
                      className="flex-shrink-0 text-slate-300 dark:text-slate-600"
                    />
                  )}
                  <span className="w-1/3 pb-1 border-b border-dashed text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700">
                    Other...
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ---- ACTIVE MODE ----
  const isDragging = draggedItem && draggedItem.fieldId === field.fieldId;
  const isDragOver = dragOverItem && dragOverItem.fieldId === field.fieldId;
  const dragPosition = isDragOver ? dragOverItem.position : null;

  const macroErrors =
    errors?.filter(
      (e) =>
        e.toLowerCase().includes("macro") ||
        e.toLowerCase().includes("duplicate macro"),
    ) || [];

  const labelErrors =
    errors?.filter(
      (e) =>
        !e.toLowerCase().includes("macro") &&
        !e.toLowerCase().includes("duplicate macro"),
    ) || [];

  return (
    <div
      id={field.fieldId}
      onFocusCapture={onActivate}
      draggable={isDraggable}
      onDragStart={(e) => onDragStart(e, phaseId, field.fieldId)}
      onDragOver={(e) => onDragOverCard(e, phaseId, field.fieldId)}
      onDrop={(e) => onDrop(e, phaseId, field.fieldId)}
      onDragEnd={onDragEnd}
      className={`bg-white dark:bg-slate-900 rounded-2xl shadow-md border p-6 sm:p-8 relative transition-all
        ${
          errors
            ? "border-rose-400 ring-2 ring-rose-500/20"
            : "border-indigo-300 dark:border-indigo-700 ring-2 ring-indigo-500/20"
        }
        ${isDragging ? "opacity-40" : ""}
        ${isDragOver && dragPosition === "top" ? "border-t-4 border-t-indigo-600 dark:border-t-indigo-500" : ""}
        ${isDragOver && dragPosition === "bottom" ? "border-b-4 border-b-indigo-600 dark:border-b-indigo-500" : ""}
      `}
    >
      {/* Drag Handle */}
      <div
        className="absolute -translate-x-1/2 top-2 left-1/2 cursor-grab active:cursor-grabbing"
        onMouseEnter={() => setIsDraggable(true)}
        onMouseLeave={() => setIsDraggable(false)}
      >
        <GripHorizontal
          size={20}
          className="transition-colors text-slate-300 dark:text-slate-600 hover:text-slate-500"
        />
      </div>

      <div className="flex flex-col gap-6 mt-4 md:flex-row">
        {/* Main Inputs */}
        <div className="flex-1 space-y-4">
          <div>
            <input
              value={field.label}
              onChange={(e) =>
                updateQuestion(phaseId, field.fieldId, {
                  label: e.target.value,
                })
              }
              placeholder="Question Title"
              className="w-full bg-slate-50 dark:bg-slate-800/50 px-4 py-3.5 rounded-xl border border-slate-200 dark:border-slate-700 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/50 outline-none text-base font-bold text-slate-900 dark:text-white transition-all placeholder:font-normal"
            />
            {labelErrors.length > 0 && (
              <ul className="px-1 mt-2 space-y-1 text-xs font-bold text-rose-500">
                {labelErrors.map((e, i) => (
                  <li key={i} className="flex items-center gap-1">
                    <AlertCircle size={12} /> {e}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <input
            value={field.helperText || ""}
            onChange={(e) =>
              updateQuestion(phaseId, field.fieldId, {
                helperText: e.target.value,
              })
            }
            placeholder="Helper text / Description (Optional)"
            className="w-full pb-2 text-sm font-medium transition-colors bg-transparent border-b outline-none border-slate-200 dark:border-slate-800 focus:border-indigo-500 text-slate-500 dark:text-slate-400"
          />

          {showMacroInput && (
            <div className="pt-2 animate-fadeIn">
              <label className="block mb-1.5 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                Report Macro Key
              </label>
              <input
                type="text"
                value={field.macroKey || ""}
                onChange={(e) =>
                  updateQuestion(phaseId, field.fieldId, {
                    macroKey: e.target.value,
                  })
                }
                placeholder="e.g., cooperative_name"
                className="w-full px-4 py-2.5 text-sm font-mono font-medium transition-colors bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/50 text-slate-900 dark:text-white placeholder:font-sans placeholder:text-slate-400"
              />

              {macroErrors.length > 0 && (
                <ul className="mt-2 space-y-1 text-xs font-bold text-rose-500">
                  {macroErrors.map((e, i) => (
                    <li key={i} className="flex items-center gap-1">
                      <AlertCircle size={12} /> {e}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>

        {/* Type Selector */}
        <div className="relative md:w-64 shrink-0 h-max">
          <select
            value={field.componentType}
            onChange={handleTypeChange}
            className="w-full appearance-none bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-700 dark:text-slate-200 py-3.5 pl-11 pr-10 hover:border-indigo-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/50 outline-none cursor-pointer transition-all"
          >
            {FIELD_TYPES.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
          <div className="absolute -translate-y-1/2 pointer-events-none left-4 top-1/2 text-slate-400">
            {FIELD_TYPES.find((t) => t.value === field.componentType)?.icon}
          </div>
          <ChevronDown
            size={18}
            className="absolute -translate-y-1/2 pointer-events-none right-4 top-1/2 text-slate-400"
          />
        </div>
      </div>

      {/* OPTIONS BUILDER */}
      <div className="mt-8">
        {supportsOptions && (
          <div className="space-y-3">
            {(field.options || []).map((option, index) => (
              <div
                key={option.id}
                className="flex flex-col gap-3 p-3 transition-colors border sm:flex-row sm:items-center bg-slate-50 dark:bg-slate-800/30 border-slate-100 dark:border-slate-800 rounded-xl group hover:border-indigo-200 dark:hover:border-indigo-800/50"
              >
                <div className="flex items-center flex-1 gap-3">
                  <div className="shrink-0 text-slate-300 dark:text-slate-600">
                    {field.componentType === "checkbox_group" ? (
                      <div className="flex-shrink-0 w-5 h-5 border-2 rounded border-slate-300 dark:border-slate-600" />
                    ) : field.componentType === "select" ? (
                      <span className="text-sm font-bold">{index + 1}.</span>
                    ) : (
                      <Circle size={20} />
                    )}
                  </div>
                  <input
                    value={option.label}
                    onChange={(e) =>
                      handleOptionLabelChange(option.id, e.target.value)
                    }
                    placeholder={`Option ${index + 1}`}
                    className="flex-1 bg-transparent py-1.5 border-b border-transparent focus:border-indigo-500 outline-none text-sm font-bold text-slate-800 dark:text-slate-100 transition-colors"
                  />
                </div>

                <div className="flex items-center gap-3 pt-3 pl-8 border-t sm:pl-0 sm:border-t-0 sm:border-l border-slate-200 dark:border-slate-700 sm:pt-0 sm:pl-4">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    Val:
                  </span>
                  <input
                    value={option.value}
                    onChange={(e) =>
                      handleOptionValueChange(option.id, e.target.value)
                    }
                    placeholder="internal_value"
                    className="w-32 bg-transparent py-1.5 border-b border-dashed border-slate-300 dark:border-slate-600 focus:border-indigo-500 focus:border-solid outline-none text-xs text-slate-500 dark:text-slate-400 font-mono transition-colors"
                  />
                  <button
                    onClick={() => removeOption(option.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition-colors outline-none ml-auto sm:ml-0"
                    title="Remove Option"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>
            ))}

            {field.allowOther && (
              <div className="flex items-center gap-3 p-3 border bg-slate-50 dark:bg-slate-800/30 border-slate-100 dark:border-slate-800 rounded-xl group">
                <div className="shrink-0 text-slate-300 dark:text-slate-600">
                  {field.componentType === "checkbox_group" ? (
                    <div className="flex-shrink-0 w-5 h-5 border-2 rounded border-slate-300 dark:border-slate-600" />
                  ) : (
                    <Circle size={20} />
                  )}
                </div>
                <input
                  readOnly
                  value="Other..."
                  className="flex-1 bg-transparent py-1.5 text-sm font-medium text-slate-500 outline-none"
                />
                <button
                  onClick={() =>
                    updateQuestion(phaseId, field.fieldId, {
                      allowOther: false,
                    })
                  }
                  className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
            )}

            <div className="flex items-center gap-3 pt-2 pl-3">
              <div className="shrink-0 text-slate-300 dark:text-slate-600">
                {field.componentType === "checkbox_group" ? (
                  <div className="flex-shrink-0 w-5 h-5 border-2 rounded border-slate-300 dark:border-slate-600" />
                ) : field.componentType === "select" ? (
                  <span className="text-sm font-bold text-slate-400">
                    {(field.options?.length || 0) + 1}.
                  </span>
                ) : (
                  <Circle size={20} />
                )}
              </div>
              <input
                readOnly
                placeholder="Add option"
                onClick={addOption}
                className="w-24 py-1 text-sm font-medium transition-colors bg-transparent border-b border-transparent outline-none cursor-pointer hover:border-slate-300 dark:hover:border-slate-600 text-slate-400"
              />

              {!field.allowOther &&
                ["multiple_choice", "checkbox_group"].includes(
                  field.componentType,
                ) && (
                  <span className="flex items-center gap-2 text-sm font-medium text-slate-400">
                    or
                    <button
                      onClick={() =>
                        updateQuestion(phaseId, field.fieldId, {
                          allowOther: true,
                        })
                      }
                      className="text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 px-3 py-1.5 rounded-lg transition-colors"
                    >
                      Add "Other"
                    </button>
                  </span>
                )}
            </div>
          </div>
        )}
      </div>

      {/* VALIDATION & LOGIC PANELS */}
      <div className="pt-6 mt-8 space-y-4 border-t border-slate-100 dark:border-slate-800">
        {showValidation && (
          <div className="p-5 border bg-slate-50 dark:bg-slate-800/50 rounded-xl border-slate-200 dark:border-slate-700 animate-fadeIn">
            <h4 className="flex items-center gap-2 mb-4 text-xs font-bold tracking-widest uppercase text-slate-500 dark:text-slate-400">
              <CheckSquare size={14} /> Validation Rules
            </h4>

            <div className="flex flex-wrap gap-5">
              {isNumber && (
                <>
                  <label className="flex items-center text-sm font-bold text-slate-700 dark:text-slate-300">
                    Min Value:
                    <input
                      type="number"
                      value={field.validation.min || ""}
                      onChange={(e) =>
                        updateQuestion(phaseId, field.fieldId, {
                          validation: {
                            ...field.validation,
                            min: Number(e.target.value),
                          },
                        })
                      }
                      className="w-24 px-3 py-2 ml-3 bg-white border rounded-lg outline-none dark:bg-slate-900 border-slate-200 dark:border-slate-600 focus:ring-2 focus:ring-indigo-500"
                    />
                  </label>
                  <label className="flex items-center text-sm font-bold text-slate-700 dark:text-slate-300">
                    Max Value:
                    <input
                      type="number"
                      value={field.validation.max || ""}
                      onChange={(e) =>
                        updateQuestion(phaseId, field.fieldId, {
                          validation: {
                            ...field.validation,
                            max: Number(e.target.value),
                          },
                        })
                      }
                      className="w-24 px-3 py-2 ml-3 bg-white border rounded-lg outline-none dark:bg-slate-900 border-slate-200 dark:border-slate-600 focus:ring-2 focus:ring-indigo-500"
                    />
                  </label>
                </>
              )}
              {isText && (
                <>
                  <label className="flex items-center text-sm font-bold text-slate-700 dark:text-slate-300">
                    Min Chars:
                    <input
                      type="number"
                      value={field.validation.minLength || ""}
                      onChange={(e) =>
                        updateQuestion(phaseId, field.fieldId, {
                          validation: {
                            ...field.validation,
                            minLength: Number(e.target.value),
                          },
                        })
                      }
                      className="w-24 px-3 py-2 ml-3 bg-white border rounded-lg outline-none dark:bg-slate-900 border-slate-200 dark:border-slate-600 focus:ring-2 focus:ring-indigo-500"
                    />
                  </label>
                  <label className="flex items-center text-sm font-bold text-slate-700 dark:text-slate-300">
                    Max Chars:
                    <input
                      type="number"
                      value={field.validation.maxLength || ""}
                      onChange={(e) =>
                        updateQuestion(phaseId, field.fieldId, {
                          validation: {
                            ...field.validation,
                            maxLength: Number(e.target.value),
                          },
                        })
                      }
                      className="w-24 px-3 py-2 ml-3 bg-white border rounded-lg outline-none dark:bg-slate-900 border-slate-200 dark:border-slate-600 focus:ring-2 focus:ring-indigo-500"
                    />
                  </label>
                  <label className="flex items-center w-full text-sm font-bold text-slate-700 dark:text-slate-300 sm:w-auto">
                    Pattern (Regex):
                    <input
                      type="text"
                      value={field.validation.pattern || ""}
                      onChange={(e) =>
                        updateQuestion(phaseId, field.fieldId, {
                          validation: {
                            ...field.validation,
                            pattern: e.target.value,
                          },
                        })
                      }
                      className="flex-1 px-3 py-2 ml-3 font-mono text-xs bg-white border rounded-lg outline-none sm:w-56 dark:bg-slate-900 border-slate-200 dark:border-slate-600 focus:ring-2 focus:ring-indigo-500"
                      placeholder="^A-Z$"
                    />
                  </label>
                </>
              )}
              {!isNumber && !isText && (
                <span className="flex items-center gap-2 text-sm font-medium text-slate-400">
                  <AlertCircle size={14} /> No extra validation rules available
                  for this type.
                </span>
              )}
            </div>
          </div>
        )}

        {showLogic && (
          <div className="p-5 border border-indigo-100 bg-indigo-50/50 dark:bg-indigo-900/10 rounded-xl dark:border-indigo-800/30 animate-fadeIn">
            <h4 className="flex items-center gap-2 mb-4 text-xs font-bold tracking-widest text-indigo-600 uppercase dark:text-indigo-400">
              <Filter size={14} /> Conditional Logic (Show When)
            </h4>

            {previousQuestions.length === 0 ? (
              <p className="text-sm font-medium text-indigo-500/80">
                Add multiple choice or dropdown questions before this one to
                configure logic.
              </p>
            ) : (
              <div className="flex flex-col items-center gap-4 sm:flex-row">
                <select
                  value={field.showWhen?.fieldId || ""}
                  onChange={(e) => {
                    if (!e.target.value) {
                      const copy = { ...field };
                      delete copy.showWhen;
                      updateQuestion(phaseId, field.fieldId, copy);
                    } else {
                      updateQuestion(phaseId, field.fieldId, {
                        showWhen: { fieldId: e.target.value, equals: "" },
                      });
                    }
                  }}
                  className="flex-1 w-full px-4 py-3 text-sm font-bold bg-white border border-indigo-200 outline-none dark:bg-slate-900 dark:border-indigo-800 rounded-xl text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">-- Always Show --</option>
                  {previousQuestions.map((q) => (
                    <option key={q.fieldId} value={q.fieldId}>
                      {q.label || "Untitled Question"}
                    </option>
                  ))}
                </select>

                <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">
                  Equals
                </span>

                <select
                  disabled={!field.showWhen?.fieldId}
                  value={field.showWhen?.equals || ""}
                  onChange={(e) =>
                    updateQuestion(phaseId, field.fieldId, {
                      showWhen: { ...field.showWhen, equals: e.target.value },
                    })
                  }
                  className="flex-1 w-full px-4 py-3 text-sm font-bold bg-white border border-indigo-200 outline-none dark:bg-slate-900 dark:border-indigo-800 rounded-xl text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:bg-slate-50 dark:disabled:bg-slate-800"
                >
                  <option value="">-- Select Value --</option>
                  {field.showWhen?.fieldId &&
                    previousQuestions
                      .find((q) => q.fieldId === field.showWhen.fieldId)
                      ?.options?.map((o) => (
                        <option key={o.id} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                </select>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex flex-col justify-between gap-6 pt-5 mt-8 border-t border-slate-100 dark:border-slate-800 sm:flex-row sm:items-center">
        <div className="flex gap-2">
          <button
            onClick={() => setShowValidation(!showValidation)}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
              showValidation
                ? "bg-slate-200 text-slate-800 dark:bg-slate-700 dark:text-white"
                : "text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            Validation
          </button>
          <button
            onClick={() => setShowLogic(!showLogic)}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
              showLogic
                ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-400"
                : "text-slate-500 hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-indigo-900/20 dark:hover:text-indigo-400"
            }`}
          >
            Logic
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-4 sm:ml-auto">
          <div className="flex gap-1">
            <button
              onClick={() => duplicateQuestion(phaseId, field)}
              className="p-2.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-slate-800 dark:hover:text-indigo-400 rounded-xl transition-colors"
              title="Duplicate"
            >
              <Copy size={18} />
            </button>
            <button
              onClick={() => deleteQuestion(phaseId, field.fieldId)}
              disabled={disableDelete}
              className="p-2.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-800 dark:hover:text-rose-400 rounded-xl transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              title="Delete"
            >
              <Trash2 size={18} />
            </button>
          </div>

          <div className="hidden w-px h-8 mx-1 bg-slate-200 dark:bg-slate-700 sm:block"></div>

          <div className="flex items-center gap-4">
            <label className="flex items-center gap-3 cursor-pointer group">
              <span className="text-sm font-bold transition-colors select-none text-slate-700 dark:text-slate-300 group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                Macro
              </span>
              <div className="relative inline-flex items-center">
                <input
                  type="checkbox"
                  checked={showMacroInput}
                  onChange={(e) => {
                    const isChecked = e.target.checked;
                    setShowMacroInput(isChecked);
                    if (isChecked) {
                      updateQuestion(phaseId, field.fieldId, {
                        macroKey: `macro_${crypto.randomUUID().replace(/-/g, "").substring(0, 6)}`,
                      });
                    } else {
                      updateQuestion(phaseId, field.fieldId, {
                        macroKey: "",
                      });
                    }
                  }}
                  className="sr-only peer"
                />
                <div
                  className={`w-11 h-6 rounded-full transition-colors ${showMacroInput ? "bg-indigo-600" : "bg-slate-300 dark:bg-slate-600"}`}
                ></div>
                <div
                  className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform shadow-sm ${showMacroInput ? "translate-x-5" : "translate-x-0"}`}
                ></div>
              </div>
            </label>

            <label className="flex items-center gap-3 cursor-pointer group">
              <span className="text-sm font-bold transition-colors select-none text-slate-700 dark:text-slate-300 group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                Required
              </span>
              <div className="relative inline-flex items-center">
                <input
                  type="checkbox"
                  checked={field.required}
                  onChange={(e) =>
                    updateQuestion(phaseId, field.fieldId, {
                      required: e.target.checked,
                    })
                  }
                  className="sr-only peer"
                />
                <div
                  className={`w-11 h-6 rounded-full transition-colors ${field.required ? "bg-indigo-600" : "bg-slate-300 dark:bg-slate-600"}`}
                ></div>
                <div
                  className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform shadow-sm ${field.required ? "translate-x-5" : "translate-x-0"}`}
                ></div>
              </div>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
