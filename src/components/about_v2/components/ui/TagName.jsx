"use client";
import { usePathname } from "next/navigation";
import React from "react";

const TagName = ({ className }) => {
  const pathname = usePathname();
  const route = pathname.split("/").pop();
  return (
    <h4 className={`text-gray-400 text-base capitalize ${className}`}>
      Cooppilot {">"} {route.split("-")[1] || route}
    </h4>
  );
};

export default TagName;
