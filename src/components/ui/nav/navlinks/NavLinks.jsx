import React from "react";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import NavSection from "./NavSection";

const NavLinks = ({
  children,
  className,
  href,
  isActive,
  toggle,
  selectedDropdown,
  onClick,
  data,
  index,
}) => {
  const activeClassName = isActive
    ? "text-primary border-b-2 border-primary font-semibold"
    : "text-slate-600 hover:text-primary";

  return (
    <div
      className={`relative flex flex-row items-center justify-center gap-1 text-[18px] transition-all duration-300 capitalize px-2 py-0.5 select-none cursor-pointer ${className}`}
      onClick={onClick}
    >
      {toggle ? (
        <div
          className={`p-0 font-medium bg-transparent border-none cursor-pointer focus:outline-none ${activeClassName}`}
        >
          {children}
        </div>
      ) : (
        <Link href={href} className={`font-medium ${activeClassName}`}>
          {children}
        </Link>
      )}

      {toggle && (
        <ChevronDown
          size={18}
          className={`transition-transform duration-300 ease-in-out text-slate-500 hover:text-primary ${
            selectedDropdown === index + 1
              ? "rotate-180 text-primary"
              : "rotate-0"
          }`}
        />
      )}

      <AnimatePresence mode="wait">
        {toggle && selectedDropdown === index + 1 && data && (
          <motion.div
            key={`dropdown-${index}`}
            initial={{ opacity: 0, y: 15, scale: 0.75 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.75 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="absolute top-10 left-6 origin-top-left w-[35vw] min-h-[50vh] overflow-y-auto bg-white border border-slate-100 shadow-xl rounded-xl flex flex-col py-6 gap-1.5 z-50 cursor-default"
            onClick={(e) => e.stopPropagation()}
          >
            <NavSection data={data} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NavLinks;
