import React from "react";

export function ButtonFlippedReveal({
  className,
  children,
  icon,
  hoverIcon,
  onClick,
  fullWidth = false,
  backgroundImage = "linear-gradient(93.63deg, rgba(127, 145, 175, 1) 3.45%, rgba(153, 153, 153, 0) 117.37%)",
  isshadow = true,
  isBorder = true,
  rounded = "2xl",
  innerPadding = 1,
  ...props
}) {
  const roundedMap = {
    "sm": "rounded-sm",
    "md": "rounded-md",
    "lg": "rounded-lg",
    "xl": "rounded-xl",
    "2xl": "rounded-2xl",
    "3xl": "rounded-3xl",
    "full": "rounded-full",
    "none": "rounded-none"
  };
  const roundedClass = roundedMap[rounded] || "rounded-2xl";

  const spanWidth = fullWidth === "responsive" ? "w-full sm:w-auto" : fullWidth ? "w-full" : "";
  const buttonWidth = fullWidth === "responsive" ? "sm:w-fit w-full" : fullWidth ? "md:w-full" : "md:w-fit";

  return (
    <span
      className={`inline-flex ${spanWidth} ${roundedClass} bg-gradient-to-r`}
      style={{
        padding: `${innerPadding}px`,
        backgroundImage: isBorder ? backgroundImage : "",
        boxShadow: isshadow ? "0px 4px 9.4px 0px rgba(0, 0, 0, 0.25)" : "",
      }}
    >
      <button
        onClick={onClick}
        className={`group ${buttonWidth} ${roundedClass} cursor-pointer w-full ${className}`}
        {...props}
      >
        <span className="relative block overflow-hidden text-[20px]">
          <span className="flex transform transition-transform duration-300 group-hover:-translate-y-full text-[15px] md:text-[20px]">
            {children}
          </span>
          <span className="flex absolute left-0 top-0 transform translate-y-full transition-transform duration-300 group-hover:translate-y-0 text-[15px] md:text-[20px]">
            {children}
          </span>
        </span>
        <span className="relative w-5 h-5">
          <span className="absolute inset-0 transition-opacity duration-300 transform group-hover:opacity-0">
            {icon}
          </span>
          <span className="absolute inset-0 transition-opacity duration-300 transform opacity-0 group-hover:opacity-100">
            {hoverIcon}
          </span>
        </span>
      </button>
    </span>
  );
}

export function ButtonOutlineHoverSolid({
  children,
  onClick,
  className = "border-dark-tint text-dark-tint hover:text-white hover:bg-dark-tint",
  ...props
}) {
  return (
    <button
      onClick={onClick}
      className={`border-2 ${className} bg-transparent text-[15px] md:text-[20px]`}
      {...props}
    >
      {children}
    </button>
  );
}

export function ButtonFlippedRevealV2({
  className,
  children,
  icon,
  hoverIcon,
  onClick,
  fullWidth = false,
  backgroundImage = "linear-gradient(93.63deg, rgba(127, 145, 175, 1) 3.45%, rgba(153, 153, 153, 0) 117.37%)",
  isshadow = true,
  isBorder = true,
  ...props
}) {
  const spanWidth = fullWidth === "responsive" ? "w-full sm:w-auto" : fullWidth ? "w-full" : "";
  const buttonWidth = fullWidth === "responsive" ? "sm:w-fit w-full" : fullWidth ? "md:w-full" : "md:w-fit";

  return (
    <span
      className={`inline-flex rounded-lg p-[1px] ${spanWidth}`}
    >
      <button
        onClick={onClick}
        className={`group ${buttonWidth} rounded-xl cursor-pointer w-full ${className}`}
        {...props}
      >
        <span className="relative block overflow-hidden text-[20px]">
          <span className="flex transform transition-transform duration-300 group-hover:-translate-y-full text-[15px] md:text-[18px]">
            {children}
          </span>
          <span className="flex absolute left-0 top-0 transform translate-y-full transition-transform duration-300 group-hover:translate-y-0 text-[15px] md:text-[18px]">
            {children}
          </span>
        </span>
        <span className="relative w-5 h-5">
          <span className="absolute inset-0 transition-opacity duration-300 transform group-hover:opacity-0">
            {icon}
          </span>
          <span className="absolute inset-0 transition-opacity duration-300 transform opacity-0 group-hover:opacity-100">
            {hoverIcon}
          </span>
        </span>
      </button>
    </span>
  );
}
