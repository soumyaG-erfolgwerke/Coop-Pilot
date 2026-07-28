"use client";

import React from "react";
import NavLink from "../NavLink";
import { ButtonFlippedReveal, ButtonOutlineHoverSolid } from "../Buttons";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { usePathname } from "next/navigation";
import LanguageSelect from "../LanguageSelect";

const DesktopMenu = ({ solutionItems, handleNavigation }) => {
  const navbarRef = React.useRef(null);
  const pathname = usePathname();

  const activeClass =
    pathname === "/"
      ? "text-blue-600 font-medium"
      : "text-white hover:text-cyan-200 font-medium";
  const inactiveClass =
    pathname === "/"
      ? "text-gray-700 hover:text-dark-tint font-medium"
      : "text-white hover:text-cyan-200 font-medium";

  return (
    <nav
      className="hidden [@media(min-width:940px)]:flex items-center space-x-2"
      id="navbar"
      ref={navbarRef}
    >
      <LanguageSelect />
      <NavLink
        onClick={() => handleNavigation("/")}
        className={`transition-colors duration-200 px-2 py-1 rounded-md ${
          pathname === "/" ? activeClass : inactiveClass
        }`}
        isActive={pathname === "/"}
      >
        Home
      </NavLink>

      <div className="relative group">
        <NavLink
          onClick={() => handleNavigation("/solutions")}
          toggle={true}
          className={`transition-colors duration-200 px-2 py-1 rounded-md ${
            pathname.startsWith("/solutions")
              ? activeClass
              : inactiveClass
          }`}
          isActive={pathname.startsWith("/solutions")}
        >
          Solution
        </NavLink>

        <div className="absolute left-0 z-50 py-2 transition-transform duration-200 ease-in-out origin-top-left scale-0 bg-white border border-gray-200 rounded-lg shadow-lg top-full w-max group-hover:scale-100">
          {solutionItems.map((item, index) => (
            <button
              key={index}
              onClick={
                () => handleNavigation(`/solutions`)
                // handleNavigation(
                //   `/solutions/${item.toLowerCase().replace(" ", "-")}`
                // )
              }
              className="block w-full px-4 py-2 text-sm text-left text-gray-700 transition-colors duration-150 hover:bg-blue-50"
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      <NavLink
        onClick={() => handleNavigation("/about")}
        className={`transition-colors duration-200 px-2 py-1 rounded-md ${
          pathname.startsWith("/about") ? activeClass : inactiveClass
        }`}
        isActive={pathname.startsWith("/about")}
      >
        About
      </NavLink>

      <NavLink
        onClick={() => handleNavigation("/about#contact")}
        className={`transition-colors duration-200 px-2 py-1 rounded-md ${
          pathname === "/about#contact" ? activeClass : inactiveClass
        }`}
        isActive={pathname === "/about#contact"}
      >
        Contact
      </NavLink>
      {/* Desktop Action Buttons */}
      <div className="items-center hidden space-x-4 md:flex">
        <ButtonOutlineHoverSolid
          onClick={() => handleNavigation("/signinpage")}
          className={`h-[58px] rounded-2xl px-4 text-center hover:text-white hover:bg-dark-tint "
            
            ${
              pathname!=="/"
                ? "border-white text-white"
                : "border-dark-tint text-dark-tint"
            }`
          
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
          className={`rounded-2xl py-5 px-4 h-[58px] flex gap-1 items-center justify-center
            ${
              pathname.startsWith("/solutions")
                ? "border-dark-tint"
                : "border-white"
            }
            ${
              pathname.startsWith("/about")
                ? "bg-white text-primary"
                : "bg-primary text-white"
            }`}
        >
          Get Started
        </ButtonFlippedReveal>
      </div>
    </nav>
  );
};

export default DesktopMenu;

