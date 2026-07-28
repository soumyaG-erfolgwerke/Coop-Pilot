import React from "react";

const SimpleSelect = ({
  id,
  name,
  value,
  options = [],
  placeholder = "Select...",
  onChange,
  onBlur,
  error,
  disabled = false,
  className = "",
  ...rest
}) => {
  const normalizedOptions = options.map((option) =>
    typeof option === "string" ? { value: option, label: option } : option,
  );

  const selectClassName = `block w-full pl-3 py-2.5 pr-8 border ${
    error ? "border-red-500" : "border-gray-300 dark:border-slate-600"
  } bg-white dark:bg-slate-700 rounded-md shadow-sm focus:outline-none focus:ring-2 ${
    error
      ? "focus:ring-red-500"
      : "focus:ring-primary dark:focus:ring-primary/80"
  } sm:text-sm transition-all duration-200 ${
    disabled ? "opacity-50 cursor-not-allowed" : ""
  } ${className}`.trim();

  return (
    <select
      id={id}
      name={name}
      value={value}
      onChange={onChange}
      onBlur={onBlur}
      className={selectClassName}
      disabled={disabled}
      {...rest}
    >
      {placeholder ? <option value="">{placeholder}</option> : null}
      {normalizedOptions.map((option) => (
        <option key={`${option.value}-${option.label}`} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
};

export default SimpleSelect;
