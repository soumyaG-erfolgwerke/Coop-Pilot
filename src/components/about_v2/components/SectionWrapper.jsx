import React from "react";

const SectionWrapper = ({
  children,
  wrapperClassName,
  className,
  padding = true,
}) => {
  return (
    <section
      className={`flex items-center justify-center w-full ${wrapperClassName} ${padding === true ? "py-8 sm:py-14 md:py-16" : ""}`}
    >
      <div
        className={`w-full flex items-center justify-center max-w-[1560px] ${className}`}
      >
        {children}
      </div>
    </section>
  );
};

export default SectionWrapper;
