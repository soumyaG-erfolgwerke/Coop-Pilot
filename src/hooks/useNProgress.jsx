"use client";

// hooks/useNProgress.jsx
import { useEffect } from "react";
import { usePathname } from "next/navigation";
import NProgress from "nprogress";
import 'nprogress/nprogress.css';

export default function useNProgress() {
  const pathname = usePathname();

  useEffect(() => {
    NProgress.start();
    NProgress.done();
  }, [pathname]);
}
