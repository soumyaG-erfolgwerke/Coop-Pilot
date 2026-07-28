import React from "react";

const InputFieldWrapper = ({
  label,
  htmlFor,
  required = false,
  optional = false,
  icon,
  description,
  error,
  errorList,
  className = "",
  labelClassName = "",
  children,
}) => {
  const hasIcon = Boolean(icon);
  const shouldInjectIcon =
    hasIcon && React.Children.count(children) === 1 && React.isValidElement(children);
  const content = shouldInjectIcon ? React.cloneElement(children, { hasIcon: true }) : children;

  return (
    <div className={`animate-fadeInUp ${className}`.trim()}>
      {label && (
        <label
          htmlFor={htmlFor}
          className={`block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300 ${
            labelClassName
          }`.trim()}
        >
          {label}
          {required && <span className="text-red-500"> *</span>}
          {optional && !required && <span className="text-xs text-gray-400"> (optional)</span>}
        </label>
      )}
      {hasIcon ? (
        <div className="relative">
          <div className="absolute inset-y-0 left-0 z-10 flex items-center pl-3 pointer-events-none">
            {icon}
          </div>
          {content}
        </div>
      ) : (
        content
      )}
      {description && <p className="mt-1 text-xs text-gray-500">{description}</p>}
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
      {Array.isArray(errorList) &&
        errorList
          .filter(Boolean)
          .map((item, index) => (
            <p key={`${htmlFor || label || "field"}-error-${index}`} className="mt-1 text-xs text-red-500">
              {item}
            </p>
          ))}
    </div>
  );
};

export default InputFieldWrapper;
