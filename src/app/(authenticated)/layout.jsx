"use client";

import { Navbar } from "@/components/Navbar";
import { usePathname } from "next/navigation";

export default function AuthenticatedLayout({ children }) {
  const pathname = usePathname();
  const isReportPage = pathname?.includes("/audit/report/");

  if (isReportPage) {
    return <main>{children}</main>;
  }

  return (
    <div>
      <Navbar />
      <main>{children}</main>
    </div>
  );
}
