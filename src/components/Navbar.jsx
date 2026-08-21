"use client";

import React, { useState, useEffect, useRef } from "react";
import { Sun, Moon, Menu, X, LayoutDashboard, LogOut } from "lucide-react";
import { useTheme } from "../contexts/ThemeContext";
import Link from "next/link";
import { useAuth } from "../hooks/useAuth";
import { useRouter } from "next/navigation";
import CreateSuggestionModal from "./coopadmin/SuggestionsModal";
import { useLanguage } from "../contexts/LanguageContext";

// Assuming ThemeContext and useTheme are defined elsewhere and imported.

export const Navbar = () => {
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const { language, toggleLanguage, t } = useLanguage();
  const router = useRouter();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [suggestionModalOpen, setSuggestionModalOpen] = useState(false);

  const profileMenuRef = useRef(null);

  // Close profile dropdown if clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        profileMenuRef.current &&
        !profileMenuRef.current.contains(event.target)
      ) {
        setIsProfileMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const navLinks = [
    { name: t("About Us"), href: "/about" },
    { name: t("Contact Us"), href: "/about#contact" },
  ];

  // A simple avatar with user's initials
  const UserAvatar = ({ name }) => {
    const initials = name
      ? name
          .split(" ")
          .map((n) => n[0])
          .join("")
          .toUpperCase()
      : "?";
    return (
      <div className="flex items-center justify-center w-10 h-10 text-lg font-bold text-white bg-blue-600 rounded-full">
        {initials}
      </div>
    );
  };

  const handleLogout = async () => {
    setIsProfileMenuOpen(false);
    setIsMobileMenuOpen(false);
    await logout(router);
  };

  return (
    <nav className="sticky top-0 z-50 bg-white shadow-lg dark:bg-gray-900">
      <div className="container px-6 mx-auto sm:px-8 lg:px-10">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="flex-shrink-0">
              <h1
                className={`${
                  user?.role === "auditer" || user?.role === "aud_E"
                    ? "ml-10"
                    : ""
                } text-3xl font-bold text-primary dark:text-dark-tint`}
              >
                {/* <BrandLogo path="/" /> */}
                Coop-Pilot
              </h1>
            </Link>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:block">
            <div className="flex items-baseline ml-10 space-x-8">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  className="px-3 py-2 text-sm font-medium text-gray-700 transition-colors duration-300 rounded-md dark:text-gray-300 hover:text-blue-600 dark:hover:text-primary"
                >
                  {link.name}
                </Link>
              ))}
              {user?.role === "member" ? (
                <Link
                  key="explore"
                  href="/explore"
                  className="px-3 py-2 text-sm font-medium text-gray-700 transition-colors duration-300 rounded-md dark:text-gray-300 hover:text-blue-600 dark:hover:text-primary"
                >
                  {t("Explore")}
                </Link>
              ) : null}
              {user?.role === "NA" ? (
                <Link
                  key="add-coop"
                  href="/add-coop"
                  className="px-3 py-2 text-sm font-medium text-gray-700 transition-colors duration-300 rounded-md dark:text-gray-300 hover:text-blue-600 dark:hover:text-primary"
                >
                  {t("Add Cooperative")}
                </Link>
              ) : null}
              {user?.role === "coopadmin" && (
                <button
                  onClick={() => setSuggestionModalOpen(true)}
                  className="px-4 py-2 text-white rounded-lg bg-slate-500 dark:bg-slate-600 font-medium text-sm transition-all duration-150 active:scale-95"
                >
                  {t("Suggest")}
                </button>
              )}
            </div>
          </div>

          {/* Desktop Action Buttons */}
          <div className="items-center hidden space-x-6 md:flex">
            {/* Language Toggle Button */}
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
              onClick={toggleTheme}
              className="p-2 text-gray-600 transition-colors duration-300 rounded-full dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
            >
              {theme === "light" ? <Moon size={20} /> : <Sun size={20} />}
            </button>

            {user ? (
              // Profile Dropdown (Desktop)
              <div className="relative" ref={profileMenuRef}>
                <button
                  onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                  className="flex items-center p-2 space-x-3 transition-all duration-300 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <UserAvatar name={user.name} />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {user.name}
                  </span>
                </button>
                {isProfileMenuOpen && (
                  <div className="absolute right-0 w-48 py-2 mt-3 bg-white rounded-md shadow-lg dark:bg-gray-800 ring-1 ring-black ring-opacity-5">
                    <Link
                      href="/dashboard"
                      onClick={() => setIsProfileMenuOpen(false)}
                      className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      <LayoutDashboard size={16} className="mr-2" />
                      {t("Dashboard")}
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="flex items-center w-full px-4 py-2 text-sm text-left text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      <LogOut size={16} className="mr-2" />
                      {t("Logout")}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link
                  href="/signinpage"
                  className="px-4 py-2 text-sm font-medium text-gray-700 transition-colors duration-300 border border-gray-300 rounded-md dark:text-gray-300 hover:text-blue-600 dark:hover:text-primary dark:border-gray-600"
                >
                  {t("Sign In")}
                </Link>
                <Link
                  href="/choose-role"
                  className="px-4 py-2 text-sm font-medium text-white transition-colors duration-300 bg-blue-600 rounded-md hover:bg-blue-700"
                >
                  {t("Get Started")}
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex items-center md:hidden space-x-2">
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
              onClick={toggleTheme}
              className="p-2 text-gray-600 rounded-full dark:text-gray-400 focus:outline-none"
            >
              {theme === "light" ? <Moon size={20} /> : <Sun size={20} />}
            </button>
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 text-gray-600 rounded-md dark:text-gray-400 focus:outline-none"
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="bg-white border-t border-gray-200 md:hidden dark:bg-gray-900 dark:border-gray-700">
          <div className="px-4 pt-4 pb-3 space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className="block px-4 py-2 text-base font-medium text-gray-700 rounded-md dark:text-gray-300 hover:text-blue-600 dark:hover:text-primary"
              >
                {link.name}
              </Link>
            ))}
            <div className="my-4 border-t border-gray-200 dark:border-gray-700"></div>

            {user ? (
              <div className="px-4">
                <div className="flex items-center mb-3">
                  <UserAvatar name={user.name} />
                  <div className="ml-3">
                    <p className="text-base font-medium text-gray-800 dark:text-white">
                      {user.name}
                    </p>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      {user.email}
                    </p>
                  </div>
                </div>
                <Link
                  href="/dashboard"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center w-full px-4 py-2 text-base font-medium text-left text-gray-700 rounded-md dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <LayoutDashboard size={20} className="mr-3" />
                  {t("Dashboard")}
                </Link>
                <button
                  onClick={handleLogout}
                  className="flex items-center w-full px-4 py-2 mt-2 text-base font-medium text-left text-gray-700 rounded-md dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <LogOut size={20} className="mr-3" />
                  {t("Logout")}
                </button>
              </div>
            ) : (
              <>
                <Link
                  href="/signinpage"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block px-4 py-2 mt-2 text-base font-medium text-gray-700 border border-gray-300 rounded-md dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 dark:border-gray-600"
                >
                  {t("Sign In")}
                </Link>
                <Link
                  href="/choose-role"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block px-4 py-2 mt-1 text-base font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                >
                  {t("Get Started")}
                </Link>
              </>
            )}
          </div>
        </div>
      )}

      <CreateSuggestionModal
        isOpen={suggestionModalOpen}
        onClose={() => setSuggestionModalOpen(false)}
      />
    </nav>
  );
};
