import React, { forwardRef, useState } from "react";
import { Eye, EyeOff } from "lucide-react";

const TextInput = forwardRef(
  (
    {
      id,
      name,
      type = "text",
      value,
      onChange,
      onBlur,
      placeholder,
      error,
      hasIcon = false,
      icon,
      className = "",
      ...rest
    },
    ref
  ) => {
    const isPasswordField = type === "password";
    const [showPassword, setShowPassword] = useState(false);
    const showIcon = Boolean(icon);
    const needsIconPadding = showIcon || hasIcon;
    const needsRightPadding = isPasswordField;
    const currentType = isPasswordField && showPassword ? "text" : type;
    const inputClassName = `mt-1 block w-full ${
      needsIconPadding ? "pl-10" : "px-3"
    } py-2.5 ${needsRightPadding ? "pr-10" : "pr-3"} border ${
      error ? "border-red-500" : "border-gray-300 dark:border-slate-600"
    } bg-white dark:bg-slate-700 rounded-md shadow-sm focus:outline-none focus:ring-2 ${
      error ? "focus:ring-red-500" : "focus:ring-primary dark:focus:ring-primary/80"
    } sm:text-sm transition-all dark:text-gray-300 duration-200 ${className}`.trim();

    const input = (
      <input
        ref={ref}
        id={id}
        name={name}
          type={currentType}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        placeholder={placeholder}
        className={inputClassName}
        {...rest}
      />
    );

    if (!showIcon && !isPasswordField) {
      return input;
    }

    return (
      <div className="relative">
        <div className="absolute inset-y-0 left-0 z-10 flex items-center pl-3 pointer-events-none">
          {icon}
        </div>
        {isPasswordField && (
          <button
            type="button"
            aria-label={showPassword ? "Hide password" : "Show password"}
            onClick={() => setShowPassword((current) => !current)}
            className="absolute inset-y-0 right-0 z-10 flex items-center pr-3 text-gray-500 transition-colors hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        )}
        {input}
      </div>
    );
  }
);

TextInput.displayName = "TextInput";

export default TextInput;
