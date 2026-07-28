"use client";

import React, { useState } from "react";
import useIsMobile from "@/hooks/useResize";
import MobileMenu from "@/components/ui/nav/MobileMenu";
import MenuButton from "@/components/ui/nav/MenuButton";
import DesktopMenu from "@/components/ui/nav/DesktopMenu";
import { usePathname, useRouter } from "next/navigation";
import BrandLogo from "./BrandLogo";
import useScrollPosition from "../../hooks/useScrollPosition";

function Navbar() {
  const isMobile = useIsMobile();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(isMobile);
  const [isSolutionDropdownOpen, setIsSolutionDropdownOpen] = useState(false);
  const router = useRouter();
  const scrolled = useScrollPosition(50);
  const pathname = usePathname();

  const handleNavigation = (path) => {
    router.push(path);
    setIsMobileMenuOpen(false);
    setIsSolutionDropdownOpen(false);
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
    setIsSolutionDropdownOpen(false);
  };

  const toggleSolutionDropdown = (event) => {
    event.stopPropagation();
    setIsSolutionDropdownOpen(!isSolutionDropdownOpen);
  };

  const solutionItems = ["Digital Audit", "Digital Administration"];

  return (
    <header
      id="navbar"
      className={`w-full top-0 z-40 py-1 sm:py-3 text-lg duration-300 transform ease-in-out
      ${
        pathname.startsWith("/member-signup") ||
        pathname.startsWith("/signinpage") ||
        pathname.startsWith("/coopadmin-signup-v2") ||
        pathname.startsWith("/audit/orgadmin-signup") ||
        pathname.startsWith("/audit/signin") ||
        pathname.startsWith("/choose-role")
          ? "bg-custom-primary-700 text-white"
          : scrolled
          ? pathname.startsWith("/about") ||
            pathname.startsWith("/solutions")
            ? "bg-custom-primary-700 shadow-sm"
            : "bg-white shadow-sm"
          : "bg-transparent text-white"
      }
      ${pathname === "/" ? "sticky" : "fixed"}
    `}
    >
      <div className="px-4 mx-auto sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-12 sm:h-16">
          {/* Logo */}
          <BrandLogo path={"/"} />

          {/* Desktop Navigation */}
          <DesktopMenu
            solutionItems={solutionItems}
            handleNavigation={handleNavigation}
          />

          {/* Mobile Menu Button */}
          <MenuButton isOpen={isMobileMenuOpen} toggleMenu={toggleMobileMenu} />
        </div>
      </div>

      {/* Mobile Menu */}
      <MobileMenu
        isMobileMenuOpen={isMobileMenuOpen}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
        isSolutionDropdownOpen={isSolutionDropdownOpen}
        toggleSolutionDropdown={toggleSolutionDropdown}
        solutionItems={solutionItems}
        handleNavigation={handleNavigation}
      />
    </header>
  );
}

export default Navbar;
