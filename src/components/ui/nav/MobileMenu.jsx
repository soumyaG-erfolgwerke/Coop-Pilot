"use client";

import React from "react";
import { X, ChevronLeft, ArrowRight, ArrowUpRight } from "lucide-react";
import NavLink from "../NavLink";
import { ButtonFlippedReveal, ButtonOutlineHoverSolid } from "../Buttons";
import { usePathname } from "next/navigation";
import LanguageSelect from "../LanguageSelect";

const MobileMenu = ({
  isMobileMenuOpen,
  setIsMobileMenuOpen,
  isSolutionDropdownOpen,
  toggleSolutionDropdown,
  solutionItems,
  handleNavigation,
}) => {
  const pathname = usePathname();

  const activeClass = "text-blue-600 font-medium";
  const inactiveClass = "text-gray-700 hover:text-blue-600 font-medium";

  return (
    <div
      className={`fixed flex justify-end top-0 inset-0 z-50 [@media(min-width:940px)]:hidden transition-opacity duration-300 max-h-screen ${
        isMobileMenuOpen ? "opacity-100 " : "hidden pointer-events-none"
      }`}
    >
      {/* Background overlay */}
      <div
        className="absolute inset-0 bg-opacity-50 backdrop-blur-xs"
        onClick={() => setIsMobileMenuOpen(false)}
      ></div>

      {/* Sliding menu panel */}
      <div
        className={`flex flex-col justify-between absolute top-0 right-0 h-fit w-75 max-w-sm bg-white shadow-xl transform transition-all duration-300 ease-in-out ${
          isMobileMenuOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header with close button */}
        <div className="flex items-center justify-between px-6 py-2 border-gray-200">
          {/* <h2 className="text-xl font-bold text-gray-800">DigiCoop</h2> */}
          <button
            onClick={() => setIsMobileMenuOpen(false)}
            className="p-2 transition-colors duration-200 rounded-full hover:bg-gray-100"
          >
            <X className="w-6 h-6 text-gray-600" />
          </button>
        </div>

        {/* Navigation content */}
        <div className="flex flex-col justify-between h-screen ">
          <nav className="flex flex-col justify-between px-6 py-0 text-right">
            <div className="justify-end flex-1 space-y-2">
              <NavLink
                onClick={() => handleNavigation("/")}
                className={`w-full text-right flex items-center justify-end px-4 py-3 text-base hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200 ${
                  pathname === "/" ? activeClass : inactiveClass
                }`}
                isActive={pathname === "/"}
              >
                Home
              </NavLink>

              <div>
                <NavLink
                  onClick={toggleSolutionDropdown}
                  className={`w-full text-left flex items-center justify-end px-2 py-3 text-base hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200 ${
                    pathname.startsWith("/solutions")
                      ? activeClass
                      : inactiveClass
                  }`}
                  isActive={pathname.startsWith("/solutions")}
                >
                  <ChevronLeft
                    className={`h-4 w-4 transition-transform duration-200 ${
                      isSolutionDropdownOpen ? "rotate-90" : ""
                    }`}
                  />
                  Solution
                </NavLink>

                {/* Solution submenu with slide animation */}
                <div
                  className={`overflow-hidden transition-all duration-300 ${
                    isSolutionDropdownOpen
                      ? "max-h-96 opacity-100"
                      : "max-h-0 opacity-0"
                  }`}
                >
                  <div className="mt-2 ml-4 space-y-1">
                    {solutionItems.map((item, index) => (
                      <button
                        key={index}
                        onClick={
                          () => handleNavigation(`/solutions`)
                          // handleNavigation(
                          //   `/solutions/${item.toLowerCase().replace(" ", "-")}`
                          // )
                        }
                        className="block w-full px-4 py-2 text-sm text-right text-gray-600 transition-colors duration-200 rounded-lg hover:text-blue-600 hover:bg-blue-50"
                      >
                        {item}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <NavLink
                onClick={() => handleNavigation("/about")}
                className={`w-full text-right flex items-center justify-end px-4 py-3 text-base hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200 ${
                  pathname.startsWith("/about")
                    ? activeClass
                    : inactiveClass
                }`}
                isActive={pathname === "/about"}
              >
                About
              </NavLink>

              <NavLink
                onClick={() => handleNavigation("/about#contact")}
                className={`w-full text-right flex items-center justify-end px-4 py-3 text-base hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200 ${
                  pathname.startsWith("/about#contact")
                    ? activeClass
                    : inactiveClass
                }`}
                isActive={pathname === "/about#contact"}
              >
                Contact
              </NavLink>
            </div>
          </nav>
        </div>
        {/* Bottom action buttons */}
        <div className="bottom-0 flex flex-col p-4 mt-4 space-y-3 border-gray-200">
          <LanguageSelect />
          <ButtonOutlineHoverSolid
            onClick={() => handleNavigation("/signinpage")}
            className={
              "h-[58px] rounded-2xl px-4 text-center border-dark-tint text-dark-tint hover:text-white hover:bg-dark-tint"
            }
          >
            Log In
          </ButtonOutlineHoverSolid>
          <ButtonFlippedReveal
            onClick={() => handleNavigation("/choose-role")}
            icon={<ArrowRight />}
            hoverIcon={
              <ArrowUpRight className="bg-white rounded-full text-primary" />
            }
            fullWidth={true}
            className={
              "flex bg-primary text-white rounded-2xl py-5 px-4 h-[58px] justify-center w-full"
            }
          >
            Get Started
          </ButtonFlippedReveal>
        </div>
      </div>
    </div>
  );
};

export default MobileMenu;
