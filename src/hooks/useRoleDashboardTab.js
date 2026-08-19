"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

const normalizeTab = (value) => {
  if (!value || typeof value !== "string") {
    return "";
  }

  return value.trim().toLowerCase();
};

export function useRoleDashboardTab(tabMap, defaultView) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const lastReplacedRef = useRef(null);

  const safeTabMap = useMemo(() => tabMap || {}, [tabMap]);

  const allowedViews = useMemo(
    () => new Set(Object.values(safeTabMap).filter((value) => typeof value === "string")),
    [safeTabMap]
  );

  const viewToTab = useMemo(() => {
    return Object.entries(safeTabMap).reduce((acc, [tab, view]) => {
      if (typeof view === "string" && view.length > 0) {
        if (!acc[view]) {
          acc[view] = tab;
        }
      }
      return acc;
    }, {});
  }, [safeTabMap]);

  const [activeView, setActiveView] = useState(defaultView);

  const currentTab = normalizeTab(searchParams.get("tab"));

  useEffect(() => {
    const resolvedView = safeTabMap[currentTab];

    if (resolvedView && allowedViews.has(resolvedView)) {
      if (resolvedView !== activeView) {
        setActiveView(resolvedView);
      }
      return;
    }

    const defaultTab = viewToTab[defaultView];
    if (defaultTab && currentTab !== defaultTab) {
      if (allowedViews.has(defaultView) && activeView !== defaultView) {
        setActiveView(defaultView);
      }
      const params = new URLSearchParams(searchParams.toString());
      params.set("tab", defaultTab);
      const nextQuery = params.toString();
      const nextUrl = nextQuery ? `${pathname}?${nextQuery}` : pathname;

      if (lastReplacedRef.current !== nextUrl) {
        lastReplacedRef.current = nextUrl;
        router.replace(nextUrl, { scroll: false });
      }
    }
  }, [currentTab, safeTabMap, allowedViews, viewToTab, defaultView, activeView, pathname, router, searchParams]);

  const setView = useCallback(
    (nextView) => {
      if (!allowedViews.has(nextView)) {
        return;
      }

      if (nextView !== activeView) {
        setActiveView(nextView);
      }

      const nextTab = viewToTab[nextView];
      if (!nextTab) {
        return;
      }

      const tabInUrl = normalizeTab(searchParams.get("tab"));
      if (tabInUrl !== nextTab) {
        const params = new URLSearchParams(searchParams.toString());
        params.set("tab", nextTab);
        const nextQuery = params.toString();
        const nextUrl = nextQuery ? `${pathname}?${nextQuery}` : pathname;

        if (lastReplacedRef.current !== nextUrl) {
          lastReplacedRef.current = nextUrl;
          router.push(nextUrl, { scroll: false });
        }
      }
    },
    [activeView, allowedViews, pathname, router, searchParams, viewToTab]
  );

  return {
    activeView,
    setActiveView: setView,
  };
}