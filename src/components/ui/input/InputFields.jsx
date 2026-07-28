import React, { useEffect } from "react";
import FieldLabel from "./FieldLabel";
import InfoTooltip from "./InfoTooltip";
import toast from "react-hot-toast";

export function TextInputField({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  maxLength,
  isRequired = true,
  infoMessage,
  disabled = false,
  helperText,
}) {
  const inputId = React.useId();
  return (
    <div className="relative w-full">
      <input
        id={inputId}
        type={type}
        value={Number.isNaN(value) ? "" : (value ?? "")}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder || " "}
        maxLength={maxLength}
        required={isRequired}
        disabled={disabled}
        className={`block w-full px-3.5 pb-2 pt-6 text-sm border rounded-md appearance-none peer placeholder:opacity-0 focus:placeholder:opacity-100 transition-all duration-200 ${
          disabled
            ? "bg-gray-100/70 text-gray-400 border-gray-200 cursor-not-allowed dark:bg-slate-800/50 dark:text-slate-500 dark:border-slate-700/80"
            : "bg-slate-50/50 hover:bg-slate-50 dark:bg-slate-800/40 dark:hover:bg-slate-800/60 dark:text-white border-gray-200 hover:border-gray-300 dark:border-slate-700 dark:hover:border-slate-600 focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 dark:focus:ring-blue-400/15"
        } ${infoMessage && !disabled ? "pr-10" : ""}`}
      />
      <FieldLabel
        htmlFor={inputId}
        label={label}
        isRequired={isRequired}
        isDisabled={disabled}
        labelClassName={`absolute text-sm duration-200 transform -translate-y-3 scale-[0.82] top-4 z-10 origin-[0] start-3.5 cursor-text select-none
          peer-placeholder-shown:scale-100 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:top-1/2
          peer-focus:top-4 peer-focus:scale-[0.82] peer-focus:-translate-y-3
          ${
            disabled
              ? "text-gray-400 dark:text-gray-500"
              : "text-gray-400 dark:text-gray-500 peer-focus:text-blue-500 peer-focus:dark:text-blue-400 font-medium"
          }`}
      />
      <InfoTooltip
        message={infoMessage}
        isDisabled={disabled}
        align="right"
        className="absolute right-3 top-1/2 -translate-y-1/2"
      />
      {helperText && (
        <div className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {helperText}
        </div>
      )}
    </div>
  );
}

export function ToggleField({
  label,
  checked = false,
  onChange,
  infoMessage,
  isRequired = true,
  disabled = false,
}) {
  const inputId = React.useId();
  return (
    <div className="space-y-2">
      <FieldLabel
        htmlFor={inputId}
        label={label}
        isRequired={isRequired}
        infoMessage={infoMessage}
        isDisabled={disabled}
        labelClassName="block text-sm font-medium text-gray-700 dark:text-gray-300"
      />
      <button
        id={inputId}
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => !disabled && onChange(!checked)}
        className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${
          checked ? "bg-blue-600" : "bg-gray-300 dark:bg-slate-600"
        } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
      >
        <span
          className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
            checked ? "translate-x-6" : "translate-x-1"
          }`}
        />
      </button>
    </div>
  );
}

export function SelectField({
  label,
  value,
  onChange,
  options = [],
  isRequired = true,
  infoMessage,
  labelClassName = "",
}) {
  const inputId = React.useId();
  return (
    <div className="relative w-full">
      <select
        id={inputId}
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        required={isRequired}
        className={`block w-full px-3.5 pb-2 pt-6 text-sm border rounded-md peer bg-slate-50/50 hover:bg-slate-50 dark:bg-slate-800/40 dark:hover:bg-slate-800/60 dark:text-white border-gray-200 hover:border-gray-300 dark:border-slate-700 dark:hover:border-slate-600 focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 dark:focus:ring-blue-400/15 transition-all duration-200 ${infoMessage ? "pr-16" : ""}`}
      >
        <option value="">{`--- Select ${label} ---`}</option>
        {options.map((option) => {
          const item =
            typeof option === "string"
              ? { value: option, label: option }
              : option;

          return (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          );
        })}
      </select>
      <FieldLabel
        htmlFor={inputId}
        label={label}
        isRequired={isRequired}
        labelClassName={`absolute text-sm duration-200 transform -translate-y-3 scale-[0.82] top-4 z-10 origin-[0] start-3.5 text-gray-400 dark:text-gray-500 peer-focus:text-blue-500 peer-focus:dark:text-blue-400 font-medium cursor-pointer ${labelClassName}`}
      />
      <InfoTooltip
        message={infoMessage}
        align="right"
        className="absolute right-9 top-1/2 -translate-y-1/2"
      />
    </div>
  );
}

export function TextAreaField({
  label,
  value,
  onChange,
  rows = 3,
  placeholder,
  isRequired = true,
  infoMessage,
}) {
  const inputId = React.useId();
  return (
    <div className="relative w-full">
      <textarea
        id={inputId}
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        placeholder={placeholder || " "}
        required={isRequired}
        className={`block w-full px-3.5 pb-2 pt-6 text-sm border rounded-md resize-none peer bg-slate-50/50 hover:bg-slate-50 dark:bg-slate-800/40 dark:hover:bg-slate-800/60 dark:text-white border-gray-200 hover:border-gray-300 dark:border-slate-700 dark:hover:border-slate-600 focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 dark:focus:ring-blue-400/15 placeholder:opacity-0 focus:placeholder:opacity-100 transition-all duration-200 ${infoMessage ? "pr-10" : ""}`}
      />
      <FieldLabel
        htmlFor={inputId}
        label={label}
        isRequired={isRequired}
        labelClassName={`absolute text-sm duration-200 transform -translate-y-3 scale-[0.82] top-4 z-10 origin-[0] start-3.5 cursor-text select-none
          peer-placeholder-shown:scale-100 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:top-6 peer-placeholder-shown:bg-transparent peer-placeholder-shown:px-0
          peer-focus:top-4 peer-focus:scale-[0.82] peer-focus:-translate-y-3 text-gray-400 dark:text-gray-500 peer-focus:text-blue-500 peer-focus:dark:text-blue-400 font-medium`}
      />
      <InfoTooltip
        message={infoMessage}
        align="right"
        className="absolute right-3.5 top-3"
      />
    </div>
  );
}

export function FileInputField({
  label,
  onChange,
  accept,
  disabled = false,
  isLoading = false,
  isRequired = false,
  infoMessage,
  validateFormats = [],
  validateSize = 1024 * 1024, // 1MB default (fixed the syntax error)
}) {
  const inputId = React.useId();
  const validateFile = (file) => {
    // Validate file format
    if (validateFormats.length > 0) {
      const fileExtension = file.name.split(".").pop()?.toLowerCase();
      const fileType = file.type.split("/")[1]?.toLowerCase();

      const isValidFormat = validateFormats.some(
        (format) =>
          fileExtension === format.toLowerCase() ||
          fileType === format.toLowerCase(),
      );

      if (!isValidFormat) {
        toast.error(
          `Invalid file format. Allowed formats: ${validateFormats.join(", ")}`,
        );
        return false;
      }
    }

    // Validate file size
    if (validateSize && file.size > validateSize) {
      const sizeInMB = (validateSize / (1024 * 1024)).toFixed(1);
      toast.error(`File size exceeds ${sizeInMB}MB limit`);
      return false;
    }

    return true;
  };

  return (
    <div className="space-y-2">
      <FieldLabel
        htmlFor={inputId}
        label={label}
        isRequired={isRequired}
        infoMessage={infoMessage}
        isDisabled={disabled}
        labelClassName="block text-sm font-medium text-gray-700 dark:text-gray-300"
      />
      <input
        id={inputId}
        type="file"
        accept={accept}
        onChange={(e) => {
          const file = e.target.files?.[0];

          if (!file) {
            onChange(null);
            return;
          }

          if (validateFile(file)) {
            onChange(file);
          } else {
            // Reset the input value so the same file can be selected again
            e.target.value = "";
          }
        }}
        disabled={disabled || isLoading}
        className={`w-full px-3.5 py-2.5 border rounded-xl transition-all duration-200 ${
          disabled || isLoading
            ? "bg-gray-100/70 text-gray-400 border-gray-200 cursor-not-allowed dark:bg-slate-800/50 dark:text-slate-500 dark:border-slate-700/80"
            : "bg-slate-50/50 hover:bg-slate-50 dark:bg-slate-800/40 dark:hover:bg-slate-800/60 dark:text-white border-gray-200 hover:border-gray-300 dark:border-slate-700 dark:hover:border-slate-600 focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 dark:focus:ring-blue-400/15"
        } file:mr-4 file:py-1.5 file:px-3.5 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-slate-800 dark:file:text-blue-400`}
      />
      {isLoading && (
        <p className="text-sm text-gray-500 dark:text-gray-400">Uploading...</p>
      )}
    </div>
  );
}
