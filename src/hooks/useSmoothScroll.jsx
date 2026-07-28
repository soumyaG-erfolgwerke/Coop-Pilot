"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";

export default function useSmoothScroll() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (typeof window !== "undefined" && window.location.hash) {
      const element = document.querySelector(window.location.hash);
      if (element) {
        setTimeout(() => {
          element.scrollIntoView({ behavior: "smooth" });
        }, 100); // small delay ensures DOM is ready
      }
    }
  }, [pathname, searchParams]);
}
