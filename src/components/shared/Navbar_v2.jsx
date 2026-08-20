"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { ButtonFlippedRevealV2 } from "../ui/Buttons";
import NavLinks from "../ui/nav/navlinks/NavLinks";
import MobileNavLinks from "../ui/nav/navlinks/MobileNavLinks";
import { usePathname } from "next/navigation";
import { NavLinks as navLinks } from "../../assets/data/json/NavLinks";
import { Menu, X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import BrandLogo from "../ui/nav/navlinks/BrandLogo";
import { useLanguage } from "../../contexts/LanguageContext"; // Adjust path if needed

const Navbar = () => {
  const pathname = usePathname();
  const { language, toggleLanguage, t } = useLanguage();
  
  const [selectedDropdown, setSelectedDropdown] = useState(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [expandedAccordion, setExpandedAccordion] = useState(null);
  const navRef = useRef(null);

  // Check if the link is active based on pathname
  const isActive = (href) => {
    if (href === "/") {
      return pathname === "/";
    }
    return pathname === href || pathname.startsWith(href + "/");
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (navRef.current && !navRef.current.contains(event.target)) {
        setSelectedDropdown(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Disable page scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isMobileMenuOpen]);

  // Close mobile menu on pathname change
  useEffect(() => {
    setIsMobileMenuOpen(false);
    setExpandedAccordion(null);
  }, [pathname]);

  return (
    <div className="sticky top-0 z-50 w-full h-auto">
      <nav
        ref={navRef}
        className="flex flex-row items-center justify-between px-6 py-4 border-b bg-white/70 backdrop-blur-md border-slate-100"
      >
        {/* Left side */}
        <div className="nav-left">
          <BrandLogo />
        </div>

        {/* Center navigation links (desktop) */}
        <div className="flex-row items-center justify-center hidden gap-4 lg:flex nav-center">
          <ul className="flex flex-row items-center justify-center gap-3">
            {navLinks.map((link, index) => (
              <li key={index}>
                <NavLinks
                  href={link.href}
                  isActive={isActive(link.href)}
                  toggle={link.toggle}
                  selectedDropdown={selectedDropdown}
                  data={link.toggle ? link.data : null}
                  index={index}
                  onClick={() =>
                    setSelectedDropdown(
                      selectedDropdown === index + 1 ? null : index + 1,
                    )
                  }
                >
                  {t(link.title)}
                </NavLinks>
              </li>
            ))}
          </ul>
        </div>

        {/* Right side - buttons (desktop) */}
        <div className="flex-row items-center justify-center hidden gap-3 lg:flex nav-right">
          
          {/* Language Toggle */}
           <button
    onClick={toggleLanguage}
    className="flex items-center gap-1.5 px-3 py-1.5 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full border border-gray-200 dark:border-slate-700 transition-all duration-300 active:scale-95"
    title={language === "de" ? "Switch to English" : "Auf Deutsch wechseln"}
  >
    <img
      // Keeps your original image logic (UK flag when "de")
      src={language === "de" ? "/icons/uk.webp" : "/icons/german.webp"}
      alt={language === "de" ? "English" : "Deutsch"}
      className="w-5 h-5 rounded-full object-cover shrink-0"
    />
    {/* FIXED: Flips the text to match the target flag */}
    <span className="text-xs font-semibold uppercase">
      {language === "de" ? "en" : "de"}
    </span>
  </button>

          {/* Empty div for spacing */}
          <div className="w-[3px] h-8 bg-slate-200 rounded-full mx-1" />
          
          <div className="flex flex-row items-center justify-center gap-2">
            <Link href="https://cal.eu/hystandards/30min">
              <ButtonFlippedRevealV2 className="p-2 border-[2px] border-primary text-primary font-semibold capitalize">
                <p className="px-2">{t("Book free Demo")}</p>
              </ButtonFlippedRevealV2>
            </Link>
            <Link href="/choose-role">
              <ButtonFlippedRevealV2 className="p-2 px-4 border-[2px] border-primary bg-primary text-white font-semibold">
                <p className="px-2">{t("Try for Free")}</p>
              </ButtonFlippedRevealV2>
            </Link>
          </div>
        </div>

        {/* Mobile menu trigger & Language toggle */}
        <div className="flex items-center gap-4 lg:hidden">
          
          {/* Mobile Language Toggle */}
            <button
    onClick={toggleLanguage}
    className="flex items-center gap-1.5 px-3 py-1.5 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full border border-gray-200 dark:border-slate-700 transition-all duration-300 active:scale-95"
    title={language === "de" ? "Switch to English" : "Auf Deutsch wechseln"}
  >
    <img
      // Keeps your original image logic (UK flag when "de")
      src={language === "de" ? "/icons/uk.webp" : "/icons/german.webp"}
      alt={language === "de" ? "English" : "Deutsch"}
      className="w-5 h-5 rounded-full object-cover shrink-0"
    />
    {/* FIXED: Flips the text to match the target flag */}
    <span className="text-xs font-semibold uppercase">
      {language === "de" ? "en" : "de"}
    </span>
  </button>

          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 transition-colors text-slate-600 hover:text-primary focus:outline-none"
            aria-label="Toggle Menu"
          >
            {isMobileMenuOpen ? <X size={26} /> : <Menu size={26} />}
          </button>
        </div>
      </nav>

      {/* Slide-in Mobile Drawer */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            {/* Backdrop overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 z-40 bg-slate-950/40 backdrop-blur-sm lg:hidden"
            />

            {/* Drawer Container Panel */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 220 }}
              className="fixed top-0 right-0 z-50 flex flex-col w-full h-full max-w-sm bg-white border-l shadow-2xl lg:hidden border-slate-100"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
                <BrandLogo />
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-2 transition-colors text-slate-500 hover:text-primary focus:outline-none"
                  aria-label="Close Menu"
                >
                  <X size={26} />
                </button>
              </div>

              {/* Navigation Links Body */}
              <div className="flex flex-col flex-1 gap-4 px-6 py-6 overflow-y-auto">
                <ul className="flex flex-col gap-2">
                  {navLinks.map((link, index) => {
                    const isActive = pathname
                      ? pathname.includes(link.href)
                      : false;
                    return (
                      <MobileNavLinks
                        key={index}
                        href={link.href}
                        isActive={isActive}
                        toggle={link.toggle}
                        isExpanded={expandedAccordion === index}
                        onToggle={() =>
                          setExpandedAccordion(
                            expandedAccordion === index ? null : index,
                          )
                        }
                        onCloseMenu={() => setIsMobileMenuOpen(false)}
                        data={link.toggle ? link.data : null}
                      >
                        {t(link.title)}
                      </MobileNavLinks>
                    );
                  })}
                </ul>
              </div>

              {/* Drawer Footer with Buttons */}
              <div className="flex flex-col gap-3 p-6 border-t border-slate-100">
                <Link href="https://cal.eu/hystandards/30min">
                  <ButtonFlippedRevealV2
                    className="w-full py-3 border-[3px] border-primary text-primary font-semibold flex justify-center"
                    fullWidth={true}
                  >
                    <p className="px-2">{t("Book free Demo")}</p>
                  </ButtonFlippedRevealV2>
                </Link>
                <Link href="/choose-role">
                  <ButtonFlippedRevealV2
                    className="w-full py-3 border-[3px] border-primary bg-primary text-white font-semibold flex justify-center"
                    fullWidth={true}
                  >
                    <p className="px-2">{t("Sign Up")}</p>
                  </ButtonFlippedRevealV2>
                </Link>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Navbar;