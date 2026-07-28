"use client";

import React, { useState, useRef, useEffect } from "react";
import { UploadCloud, Check, X, Loader2, FileText, Tag } from "lucide-react";
import { uploadAuditFilesAndGetURL } from "@/lib/AuditService"; // Ensure this path is correct
import toast from "react-hot-toast";

// --- SHARED STYLES ---
const labelStyles =
  "block mb-1.5 text-sm font-semibold text-gray-800 dark:text-gray-200 flex items-center flex-wrap gap-1";
const inputStyles =
  "w-full px-3 py-1.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md text-sm text-gray-900 dark:text-gray-100 transition-colors focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 disabled:opacity-60 disabled:bg-gray-100 dark:disabled:bg-gray-700 disabled:cursor-not-allowed placeholder:text-gray-400 read-only:bg-gray-100 dark:read-only:bg-gray-700 read-only:opacity-80";

// --- COMPONENTS ---

const MacroIndicator = ({ macroKey }) => {
  if (!macroKey) return null;
  return (
    <span
      className="inline-flex items-center gap-1 ml-1 px-1.5 py-0.5 rounded-md text-[10px] font-bold tracking-wider uppercase bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400 border border-blue-100 dark:border-blue-500/20 select-none"
      title={`Linked to report macro: ${macroKey}`}
    >
      <Tag size={10} /> Macro
    </span>
  );
};

export const FormInput = ({
  fieldId = "",
  label = "",
  value = "",
  onChange = () => {},
  required = false,
  disabled = false,
  readOnly = false,
  placeholder = "",
  helperText = "",
  validation = {},
  macroKey = "",
}) => {
  const isRequired = required || validation.required;
  return (
    <div className="mb-3 animate-fadeIn">
      <label htmlFor={fieldId} className={labelStyles}>
        {label}
        {isRequired && <span className="text-red-600">*</span>}
        <MacroIndicator macroKey={macroKey} />
      </label>
      <input
        id={fieldId}
        name={fieldId}
        type="text"
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        readOnly={readOnly}
        placeholder={placeholder}
        className={inputStyles}
        minLength={validation.minLength}
        maxLength={validation.maxLength}
      />
      {helperText && (
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          {helperText}
        </p>
      )}
    </div>
  );
};

export const FormTextarea = ({
  fieldId = "",
  label = "",
  value = "",
  onChange = () => {},
  required = false,
  disabled = false,
  readOnly = false,
  placeholder = "",
  helperText = "",
  validation = {},
  rows = 4,
  macroKey = "",
}) => {
  const isRequired = required || validation.required;
  return (
    <div className="mb-3 animate-fadeIn">
      <label htmlFor={fieldId} className={labelStyles}>
        {label}
        {isRequired && <span className="text-red-600">*</span>}
        <MacroIndicator macroKey={macroKey} />
      </label>
      <textarea
        id={fieldId}
        name={fieldId}
        rows={rows}
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        readOnly={readOnly}
        placeholder={placeholder}
        className={`${inputStyles} resize-y`}
        minLength={validation.minLength}
        maxLength={validation.maxLength}
      />
      {helperText && (
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          {helperText}
        </p>
      )}
    </div>
  );
};

export const FormNumberInput = ({
  fieldId = "",
  label = "",
  value = "",
  onChange = () => {},
  min,
  max,
  required = false,
  disabled = false,
  readOnly = false,
  placeholder = "",
  helperText = "",
  validation = {},
  macroKey = "",
}) => {
  const isRequired = required || validation.required;
  const minVal = validation.min ?? min;
  const maxVal = validation.max ?? max;
  return (
    <div className="mb-3 animate-fadeIn">
      <label htmlFor={fieldId} className={labelStyles}>
        {label}
        {isRequired && <span className="text-red-600">*</span>}
        <MacroIndicator macroKey={macroKey} />
      </label>
      <input
        id={fieldId}
        name={fieldId}
        type="number"
        value={value ?? ""}
        min={minVal}
        max={maxVal}
        onChange={(e) =>
          onChange(e.target.value === "" ? "" : Number(e.target.value))
        }
        disabled={disabled}
        readOnly={readOnly}
        placeholder={placeholder}
        className={inputStyles}
      />
      {helperText && (
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          {helperText}
        </p>
      )}
    </div>
  );
};

export const FormDatePicker = ({
  fieldId = "",
  label = "",
  value = "",
  onChange = () => {},
  required = false,
  disabled = false,
  readOnly = false,
  helperText = "",
  validation = {},
  macroKey = "",
}) => {
  const isRequired = required || validation.required;
  const minVal = validation.min;
  const maxVal = validation.max;
  return (
    <div className="mb-3 animate-fadeIn">
      <label htmlFor={fieldId} className={labelStyles}>
        {label}
        {isRequired && <span className="text-red-600">*</span>}
        <MacroIndicator macroKey={macroKey} />
      </label>
      <input
        id={fieldId}
        name={fieldId}
        type="date"
        value={value || ""}
        min={minVal}
        max={maxVal}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        readOnly={readOnly}
        className={inputStyles}
      />
      {helperText && (
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          {helperText}
        </p>
      )}
    </div>
  );
};

export const FormSelect = ({
  fieldId = "",
  label = "",
  value = "",
  onChange = () => {},
  options = [],
  required = false,
  disabled = false,
  readOnly = false,
  helperText = "",
  validation = {},
  macroKey = "",
}) => {
  const isRequired = required || validation.required;
  return (
    <div className="mb-3 animate-fadeIn">
      <label htmlFor={fieldId} className={labelStyles}>
        {label}
        {isRequired && <span className="text-red-600">*</span>}
        <MacroIndicator macroKey={macroKey} />
      </label>
      <select
        id={fieldId}
        name={fieldId}
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled || readOnly}
        className={`${inputStyles} appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%2364748B%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-no-repeat bg-[position:right_1rem_center] bg-[length:1.2em_1.2em] pr-10`}
      >
        <option value="" disabled>
          Select an option...
        </option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {helperText && (
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          {helperText}
        </p>
      )}
    </div>
  );
};

export const MultipleChoiceGroup = ({
  fieldId = "",
  label = "",
  value = "",
  onChange = () => {},
  options = [],
  required = false,
  disabled = false,
  readOnly = false,
  helperText = "",
  validation = {},
  allowOther = false,
  macroKey = "",
}) => {
  const isRequired = required || validation.required;
  const inputRef = useRef(null);

  const isKnownOption = options.some((o) => o.value === value);
  const isOtherSelected = allowOther && value !== "" && !isKnownOption;
  const [otherText, setOtherText] = useState(isOtherSelected ? value : "");

  const handleOtherRadioSelect = () => {
    onChange(otherText);
    if (inputRef.current) inputRef.current.focus();
  };

  const handleOtherTextChange = (e) => {
    const newText = e.target.value;
    setOtherText(newText);
    onChange(newText);
  };

  return (
    <div className="mb-3 animate-fadeIn">
      <label className={labelStyles}>
        {label}
        {isRequired && <span className="text-red-600">*</span>}
        <MacroIndicator macroKey={macroKey} />
      </label>

      <div className="mt-1.5 space-y-1.5">
        {options.map((option) => (
          <label
            key={option.id || option.value}
            className={`
              flex items-center gap-2 p-2 rounded-md transition-colors border
              ${
                disabled || readOnly
                  ? "opacity-60 cursor-not-allowed bg-gray-50 border-gray-200 dark:bg-gray-800 dark:border-gray-700"
                  : "cursor-pointer hover:bg-blue-50 border-gray-300 dark:border-gray-600 dark:hover:bg-gray-800"
              }
              ${
                value === option.value
                  ? "bg-blue-50 border-blue-600 dark:bg-blue-900/20 dark:border-blue-500"
                  : "bg-white dark:bg-gray-900"
              }
            `}
          >
            <input
              type="radio"
              name={fieldId}
              value={option.value}
              checked={value === option.value}
              disabled={disabled || readOnly}
              onChange={() => {
                setOtherText("");
                onChange(option.value);
              }}
              className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-600 dark:focus:ring-blue-600 dark:ring-offset-gray-900 focus:ring-2 dark:bg-gray-800 dark:border-gray-600 accent-blue-600 cursor-pointer disabled:cursor-not-allowed"
            />
            <span
              className={`text-sm font-medium ${
                value === option.value ? "text-blue-900 dark:text-blue-100" : "text-gray-900 dark:text-gray-100"
              }`}
            >
              {option.label}
            </span>
          </label>
        ))}

        {allowOther && (
          <div
            className={`
              flex items-center gap-2 p-2 rounded-md transition-colors border
              ${disabled || readOnly ? "opacity-60 cursor-not-allowed bg-gray-50 border-gray-200 dark:bg-gray-800 dark:border-gray-700" : "hover:bg-blue-50 border-gray-300 dark:border-gray-600 dark:hover:bg-gray-800"}
              ${
                isOtherSelected
                  ? "bg-blue-50 border-blue-600 dark:bg-blue-900/20 dark:border-blue-500"
                  : "bg-white dark:bg-gray-900"
              }
            `}
          >
            <label className={`flex items-center gap-2 flex-1 ${disabled || readOnly ? "cursor-not-allowed" : "cursor-pointer"}`}>
              <input
                type="radio"
                name={fieldId}
                checked={isOtherSelected}
                onChange={handleOtherRadioSelect}
                disabled={disabled || readOnly}
                className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-600 dark:focus:ring-blue-600 dark:ring-offset-gray-900 focus:ring-2 dark:bg-gray-800 dark:border-gray-600 accent-blue-600 cursor-pointer disabled:cursor-not-allowed"
              />
              <span className={`text-sm font-medium whitespace-nowrap ${isOtherSelected ? "text-blue-900 dark:text-blue-100" : "text-gray-900 dark:text-gray-100"}`}>
                Other:
              </span>
            </label>

            <input
              ref={inputRef}
              type="text"
              value={otherText}
              onChange={handleOtherTextChange}
              onFocus={handleOtherRadioSelect}
              disabled={disabled || readOnly}
              className={`
                flex-1 bg-white dark:bg-gray-800 border px-2 py-1 text-sm font-medium transition-colors
                focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 dark:text-white
                rounded-md disabled:bg-gray-100 disabled:cursor-not-allowed
                ${isOtherSelected ? "border-blue-600" : "border-gray-300 dark:border-gray-600"}
              `}
              placeholder={isOtherSelected ? "Please specify..." : "Other (optional)"}
            />
          </div>
        )}
      </div>

      {helperText && (
        <p className="mt-1 text-xs text-gray-500">{helperText}</p>
      )}
    </div>
  );
};

export const CheckboxGroup = ({
  fieldId = "",
  label = "",
  value = [],
  onChange = () => {},
  options = [],
  required = false,
  disabled = false,
  readOnly = false,
  helperText = "",
  validation = {},
  allowOther = false,
  macroKey = "",
}) => {
  const isRequired = required || validation.required;
  const inputRef = useRef(null);

  const selectedValues = Array.isArray(value) ? value : [];
  const knownValuesSet = new Set(options.map((o) => o.value));

  const standardSelected = selectedValues.filter((v) => knownValuesSet.has(v));
  const otherValues = selectedValues.filter((v) => !knownValuesSet.has(v));

  const isOtherChecked = otherValues.length > 0;
  const [otherText, setOtherText] = useState(otherValues[0] || "");

  const handleToggle = (optionValue) => {
    if (selectedValues.includes(optionValue)) {
      onChange(selectedValues.filter((v) => v !== optionValue));
    } else {
      onChange([...selectedValues, optionValue]);
    }
  };

  const handleOtherToggle = () => {
    if (isOtherChecked) {
      onChange(standardSelected);
      setOtherText("");
    } else {
      onChange([...standardSelected, otherText]);
      if (inputRef.current) inputRef.current.focus();
    }
  };

  const handleOtherTextChange = (e) => {
    const newText = e.target.value;
    setOtherText(newText);
    onChange([...standardSelected, newText]);
  };

  return (
    <div className="mb-3 animate-fadeIn">
      <label className={labelStyles}>
        {label}
        {isRequired && <span className="text-red-600">*</span>}
        <MacroIndicator macroKey={macroKey} />
      </label>

      <div className="mt-1.5 space-y-1.5">
        {options.map((option) => (
          <label
            key={option.id || option.value}
            className={`
              flex items-center gap-2 p-2 rounded-md transition-colors border
              ${
                disabled || readOnly
                  ? "opacity-60 cursor-not-allowed bg-gray-50 border-gray-200 dark:bg-gray-800 dark:border-gray-700"
                  : "cursor-pointer hover:bg-blue-50 border-gray-300 dark:border-gray-600 dark:hover:bg-gray-800"
              }
              ${
                selectedValues.includes(option.value)
                  ? "bg-blue-50 border-blue-600 dark:bg-blue-900/20 dark:border-blue-500"
                  : "bg-white dark:bg-gray-900"
              }
            `}
          >
            <input
              type="checkbox"
              checked={selectedValues.includes(option.value)}
              disabled={disabled || readOnly}
              onChange={() => handleToggle(option.value)}
              className="w-4 h-4 text-blue-600 bg-white border-gray-300 rounded focus:ring-blue-600 dark:focus:ring-blue-600 dark:ring-offset-gray-900 focus:ring-2 dark:bg-gray-800 dark:border-gray-600 accent-blue-600 cursor-pointer disabled:cursor-not-allowed"
            />
            <span className={`text-sm font-medium ${selectedValues.includes(option.value) ? "text-blue-900 dark:text-blue-100" : "text-gray-900 dark:text-gray-100"}`}>
              {option.label}
            </span>
          </label>
        ))}

        {allowOther && (
          <div
            className={`
              flex items-center gap-2 p-2 rounded-md transition-colors border
              ${disabled || readOnly ? "opacity-60 cursor-not-allowed bg-gray-50 border-gray-200 dark:bg-gray-800 dark:border-gray-700" : "hover:bg-blue-50 border-gray-300 dark:border-gray-600 dark:hover:bg-gray-800"}
              ${
                isOtherChecked
                  ? "bg-blue-50 border-blue-600 dark:bg-blue-900/20 dark:border-blue-500"
                  : "bg-white dark:bg-gray-900"
              }
            `}
          >
            <label className={`flex items-center gap-2 flex-1 ${disabled || readOnly ? "cursor-not-allowed" : "cursor-pointer"}`}>
              <input
                type="checkbox"
                checked={isOtherChecked}
                disabled={disabled || readOnly}
                onChange={handleOtherToggle}
                className="w-4 h-4 text-blue-600 bg-white border-gray-300 rounded focus:ring-blue-600 dark:focus:ring-blue-600 dark:ring-offset-gray-900 focus:ring-2 dark:bg-gray-800 dark:border-gray-600 accent-blue-600 cursor-pointer disabled:cursor-not-allowed"
              />
              <span className={`text-sm font-medium whitespace-nowrap ${isOtherChecked ? "text-blue-900 dark:text-blue-100" : "text-gray-900 dark:text-gray-100"}`}>
                Other:
              </span>
            </label>
            <input
              ref={inputRef}
              type="text"
              value={otherText}
              onChange={handleOtherTextChange}
              onFocus={() => {
                if (!isOtherChecked) handleOtherToggle();
              }}
              disabled={disabled || readOnly}
              className={`
                flex-1 bg-white dark:bg-gray-800 border px-2 py-1 text-sm font-medium transition-colors
                focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 dark:text-white
                rounded-md disabled:bg-gray-100 disabled:cursor-not-allowed
                ${isOtherChecked ? "border-blue-600" : "border-gray-300 dark:border-gray-600"}
              `}
              placeholder={isOtherChecked ? "Please specify..." : ""}
            />
          </div>
        )}
      </div>

      {helperText && (
        <p className="mt-1 text-xs text-gray-500">{helperText}</p>
      )}
    </div>
  );
};

export const FormCheckbox = ({
  fieldId = "",
  label = "",
  value = false,
  onChange = () => {},
  disabled = false,
  readOnly = false,
  helperText = "",
  validation = {},
  required = false,
  macroKey = "",
}) => {
  const isRequired = required || validation.required;

  return (
    <div className="mb-3 animate-fadeIn">
      <label
        htmlFor={fieldId}
        className={`flex items-start gap-2 p-2 rounded-md transition-colors border
          ${
            disabled || readOnly
              ? "opacity-60 cursor-not-allowed bg-gray-50 border-gray-200 dark:bg-gray-800 dark:border-gray-700"
              : "cursor-pointer hover:bg-blue-50 border-gray-300 dark:border-gray-600 dark:hover:bg-gray-800"
          }
          ${
            value
              ? "bg-blue-50 border-blue-600 dark:bg-blue-900/20 dark:border-blue-500"
              : "bg-white dark:bg-gray-900"
          }
        `}
      >
        <div className="flex items-center h-5 mt-0.5">
          <input
            id={fieldId}
            name={fieldId}
            type="checkbox"
            checked={Boolean(value)}
            disabled={disabled || readOnly}
            onChange={(e) => onChange(e.target.checked)}
            required={isRequired}
            className="w-4 h-4 text-blue-600 bg-white border-gray-300 rounded focus:ring-blue-600 dark:focus:ring-blue-600 dark:ring-offset-gray-900 focus:ring-2 dark:bg-gray-800 dark:border-gray-600 accent-blue-600 cursor-pointer disabled:cursor-not-allowed"
          />
        </div>
        <div className="flex flex-col flex-1">
          <span className={`text-sm font-medium flex items-center flex-wrap gap-1 ${value ? "text-blue-900 dark:text-blue-100" : "text-gray-900 dark:text-gray-100"}`}>
            {label}
            {isRequired && <span className="text-red-600">*</span>}
            <MacroIndicator macroKey={macroKey} />
          </span>
          {helperText && (
            <p className="mt-1 text-xs text-gray-500">
              {helperText}
            </p>
          )}
        </div>
      </label>
    </div>
  );
};

export const FileUpload = ({
  fieldId = "",
  label = "",
  value = null,
  onChange = () => {},
  multiple = false,
  disabled = false,
  readOnly = false,
  helperText = "",
  validation = {},
  required = false,
  macroKey = "",
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const isRequired = required || validation.required;

  const handleFileChange = async (e) => {
    const files = Array.from(e.target.files);
    if (!files || files.length === 0) return;

    setIsUploading(true);
    try {
      if (multiple) {
        const uploadedFiles = await Promise.all(
          files.map(async (file) => {
            const fileUrl = await uploadAuditFilesAndGetURL(file);
            return {
              fileName: file.name,
              fileType: file.type,
              fileUrl: fileUrl,
            };
          })
        );
        onChange(uploadedFiles);
      } else {
        const file = files[0];
        const fileUrl = await uploadAuditFilesAndGetURL(file);
        onChange({
          fileName: file.name,
          fileType: file.type,
          fileUrl: fileUrl,
        });
      }
      toast.success("File uploaded successfully");
    } catch (error) {
      console.error("Upload Error:", error);
      toast.error("Failed to upload file. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  const removeFile = (indexToRemove = null) => {
    if (multiple && Array.isArray(value)) {
      const newFiles = value.filter((_, idx) => idx !== indexToRemove);
      onChange(newFiles.length > 0 ? newFiles : null);
    } else {
      onChange(null);
    }
  };

  const renderUploadedFiles = () => {
    const filesArray = Array.isArray(value) ? value : [value];

    return (
      <div className="mt-1.5 space-y-1.5">
        {filesArray.map((fileObj, idx) => (
          <div
            key={idx}
            className="flex items-center justify-between p-2 border bg-blue-50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800/50 rounded-md animate-fadeIn"
          >
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="text-blue-600 dark:text-blue-400 shrink-0">
                <FileText size={16} />
              </div>
              <div className="truncate">
                <p className="text-sm font-medium truncate text-gray-900 dark:text-gray-100">
                  {fileObj.fileName}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Document attached
                </p>
              </div>
            </div>
            {!disabled && !readOnly && (
              <button
                type="button"
                onClick={() => removeFile(idx)}
                className="p-1 transition-colors rounded-md text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                title="Remove file"
              >
                <X size={14} />
              </button>
            )}
          </div>
        ))}
      </div>
    );
  };

  const showDropzone = !value || (multiple && Array.isArray(value));

  return (
    <div className="w-full mb-3 animate-fadeIn">
      <label htmlFor={fieldId} className={labelStyles}>
        {label}
        {isRequired && <span className="text-red-600">*</span>}
        <MacroIndicator macroKey={macroKey} />
      </label>

      {value && (!Array.isArray(value) || value.length > 0) && renderUploadedFiles()}

      {showDropzone && (
        <div className={`relative ${value ? "mt-1.5" : ""}`}>
          <label
            className={`flex flex-col items-center justify-center w-full h-24 border-2 border-dashed rounded-md transition-all ${
              disabled || readOnly
                ? "opacity-60 cursor-not-allowed border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800"
                : isUploading
                  ? "border-blue-400 bg-blue-50 dark:bg-blue-900/10 cursor-wait"
                  : "border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
            }`}
          >
            <div className="flex flex-col items-center justify-center pt-4 pb-4">
              {isUploading ? (
                <>
                  <Loader2 className="w-5 h-5 mb-1.5 text-blue-600 animate-spin" />
                  <p className="text-sm font-medium text-blue-600 dark:text-blue-400">
                    Uploading...
                  </p>
                </>
              ) : (
                <>
                  <UploadCloud className="w-5 h-5 mb-1.5 text-gray-400" />
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Click to upload document{multiple ? "s" : ""}
                  </p>
                  <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                    {validation?.accept || "Any file type supported"}
                  </p>
                </>
              )}
            </div>
            <input
              id={fieldId}
              name={fieldId}
              type="file"
              multiple={multiple}
              disabled={disabled || readOnly || isUploading}
              onChange={handleFileChange}
              accept={validation?.accept}
              className="hidden"
            />
          </label>
        </div>
      )}

      {helperText && (
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          {helperText}
        </p>
      )}
    </div>
  );
};

export const COMPONENT_REGISTRY = {
  text: FormInput,
  textarea: FormTextarea,
  number: FormNumberInput,
  date: FormDatePicker,
  select: FormSelect,
  checkbox: FormCheckbox,
  file: FileUpload,
  multiple_choice: MultipleChoiceGroup,
  checkbox_group: CheckboxGroup,
};

export const FormFieldRenderer = ({
  field = {},
  formData = {},
  updateField = () => {},
  error = null,
  disabled = false,
}) => {
  const Component = COMPONENT_REGISTRY[field.componentType];

  if (!Component) {
    return (
      <div className="p-3 mb-4 text-sm text-red-700 border border-red-200 bg-red-50 rounded-md">
        Unknown component type: <strong>{field.componentType}</strong>
      </div>
    );
  }

  // --- CONDITIONAL VISIBILITY LOGIC (showWhen) ---
  if (
    field.showWhen &&
    field.showWhen.fieldId &&
    field.showWhen.equals !== undefined
  ) {
    const controllingValue = formData?.[field.showWhen.fieldId];
    let isVisible = false;

    // Handle Checkbox Groups (Array of values) vs Radio/Select (Single String)
    if (Array.isArray(controllingValue)) {
      isVisible = controllingValue.includes(field.showWhen.equals);
    } else {
      isVisible = controllingValue === field.showWhen.equals;
    }

    if (!isVisible) {
      return null;
    }
  }

  const value = formData?.[field.fieldId];

  const handleFieldChange = (newValue) => {
    updateField(field.fieldId, newValue);
  };

  return (
    <div className="relative animate-fadeIn">
      <Component
        {...field}
        fieldId={field.fieldId}
        value={value}
        onChange={handleFieldChange}
        disabled={disabled || field.disabled}
      />

      {/* INLINE ERROR DISPLAY */}
      {error && (
        <div className="flex items-center gap-1.5 mt-[-8px] mb-3 text-xs font-semibold text-red-600 animate-fadeIn">
          <div className="w-1.5 h-1.5 rounded-full bg-red-600"></div>
          {error}
        </div>
      )}
    </div>
  );
};