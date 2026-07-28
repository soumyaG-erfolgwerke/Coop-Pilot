import React from "react";
import InfoTooltip from "./InfoTooltip";

export default function FieldLabel({
  label,
  htmlFor,
  isRequired = true,
  infoMessage,
  isDisabled = false,
  labelClassName = "block text-sm font-medium",
}) {
  return (
    <label htmlFor={htmlFor} className={`${labelClassName}`}>
      <span className="inline-flex items-center justify-between gap-2">
        <span className={isDisabled ? "text-gray-500 dark:text-gray-700" : ""}>
          {label}
          {isRequired && <span className="text-red-500 ml-1">*</span>}
        </span>
        <InfoTooltip
          message={infoMessage}
          isDisabled={isDisabled}
          align="left"
          className="relative inline-flex"
        />
      </span>
    </label>
  );
}
