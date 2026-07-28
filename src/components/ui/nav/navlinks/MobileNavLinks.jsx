import React from "react";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import MobileNavSection from "./MobileNavSection";

const MobileNavLinks = ({
  children,
  href,
  isActive,
  toggle,
  isExpanded,
  onToggle,
  onCloseMenu,
  data,
}) => {
  if (toggle) {
    return (
      <li className="pb-2 list-none border-b border-slate-100/50">
        <button
          onClick={onToggle}
          className="flex items-center justify-between w-full py-3 text-lg font-medium text-left capitalize transition-colors text-slate-700 hover:text-primary focus:outline-none"
        >
          <span>{children}</span>
          <ChevronDown
            size={20}
            className={`text-slate-400 transition-transform duration-300 ${
              isExpanded ? "rotate-180 text-primary" : ""
            }`}
          />
        </button>

        {/* Expandable sub-items accordion */}
        <AnimatePresence initial={false}>
          {isExpanded && data && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col gap-3 pl-0.5 mt-1 overflow-hidden"
            >
              <MobileNavSection data={data} onCloseMenu={onCloseMenu} />
            </motion.div>
          )}
        </AnimatePresence>
      </li>
    );
  }

  return (
    <li className="pb-2 list-none border-b border-slate-100/50">
      <Link
        href={href}
        onClick={onCloseMenu}
        className={`block py-3 text-lg font-medium capitalize transition-colors ${
          isActive
            ? "text-primary font-semibold"
            : "text-slate-700 hover:text-primary"
        }`}
      >
        {children}
      </Link>
    </li>
  );
};

export default MobileNavLinks;
