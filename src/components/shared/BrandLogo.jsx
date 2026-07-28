"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
const coopPilotLogoDark = "/images/CoopPilot-dark.png";
const coopPilotLogo = "/images/CoopPilot.png";
const BrandLogo = ({ path }) => {
  const pathname = usePathname();
  const isHomePage = pathname === "/";
  return (
    <div className="p-1">
      <Link className="flex items-center cursor-pointer" href={path}>
        {/* <h3 className={`text-4xl font-bold transition-colors duration-200
        ${pathname === "/" ? "text-gray-800" : "text-white"}
      `}> */}
        <img
          src={isHomePage ? coopPilotLogo : coopPilotLogoDark}
          alt="CoopPilot Logo"
          className="max-w-[150px] md:max-w-[200px] h-auto"
        />{" "}
        {/* </h3> */}
      </Link>
    </div>
  );
};

export default BrandLogo;
