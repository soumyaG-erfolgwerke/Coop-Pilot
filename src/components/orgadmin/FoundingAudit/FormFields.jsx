const FormField = ({
  label,
  error,
  as: Tag = "input",
  className = "",
  ...props
}) => (
  <div className={`flex flex-col gap-1.5 w-full ${className}`}>
    <label className="text-sm font-semibold text-gray-700">
      {label} {props.required && <span className="text-red-500">*</span>}
    </label>
    <Tag
      {...props}
      className={`w-full text-sm rounded-lg border px-3.5 py-2.5 transition focus:outline-none focus:ring-2 disabled:bg-gray-50 disabled:text-gray-400 ${
        error
          ? "border-red-400 bg-red-50/20 focus:border-red-500 focus:ring-red-500/20"
          : "border-gray-300 bg-white focus:border-blue-500 focus:ring-blue-500/20"
      }`}
    />
    {error && (
      <span className="text-xs font-medium text-red-500 mt-0.5">{error}</span>
    )}
  </div>
);

const RadioGroupField = ({
  label,
  options,
  value,
  onChange,
  disabled,
  error,
  subText,
  required = false,
}) => (
  <div className="flex flex-col gap-2">
    <label className="text-sm font-semibold text-gray-700 flex gap-1.5">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    {subText && <p className="text-xs text-gray-400">{subText}</p>}
    <div className="flex gap-4 mt-1">
      {options.map((option) => {
        const isChecked = value === option.value;
        return (
          <label
            key={option.value}
            className={`flex items-center gap-2.5 px-4 py-2.5 border rounded-lg cursor-pointer transition select-none text-sm font-medium ${
              disabled ? "opacity-60 pointer-events-none" : ""
            } ${
              isChecked
                ? "border-blue-600 bg-blue-50/30 text-blue-700"
                : "border-gray-200 bg-white hover:bg-gray-50 text-gray-600"
            }`}
          >
            <input
              type="radio"
              disabled={disabled}
              checked={isChecked}
              onChange={() => onChange(option.value)}
              className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
              required={required}
            />
            {option.label}
          </label>
        );
      })}
    </div>
    {error && (
      <span className="text-xs font-medium text-red-500 mt-0.5">{error}</span>
    )}
  </div>
);

const CheckboxField = ({
  label,
  subtext,
  checked,
  onChange,
  disabled,
  error,
}) => {
  const containerClass = !!error
    ? "border-red-300 bg-red-50/10"
    : checked
      ? "border-green-200 bg-green-50/10"
      : "border-gray-200 bg-gray-50/40";

  return (
    <div className={`border rounded-xl p-5 transition ${containerClass}`}>
      <label
        className={`flex gap-3 items-start ${disabled ? "pointer-events-none" : "cursor-pointer"}`}
      >
        <input
          type="checkbox"
          disabled={disabled}
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 mt-0.5 flex-shrink-0"
        />
        <div className="flex flex-col gap-0.5">
          <span className="text-sm font-bold text-gray-900">{label}</span>
          {subtext && (
            <p className="max-w-3xl mt-1 text-xs leading-relaxed text-gray-500">
              {subtext}
            </p>
          )}
        </div>
      </label>
      {error && (
        <span className="block mt-2 text-xs font-medium text-red-500 pl-7">
          {error}
        </span>
      )}
    </div>
  );
};

export { FormField, RadioGroupField, CheckboxField };
