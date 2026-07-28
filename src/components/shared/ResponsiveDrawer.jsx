"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

export default function ResponsiveDrawer({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
}) {
  const [mounted, setMounted] = useState(false);
  const [render, setRender] = useState(isOpen);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // keep rendering while opening or during exit animation
  useEffect(() => {
    if (isOpen) {
      setRender(true);
      const raf = requestAnimationFrame(() => setVisible(true));
      return () => cancelAnimationFrame(raf);
    } else {
      setVisible(false);
      const t = setTimeout(() => setRender(false), 350);
      return () => clearTimeout(t);
    }
  }, [isOpen]);

  // lock body scroll while drawer is present
  useEffect(() => {
    if (!render) return undefined;

    const previousOverflow = document.body.style.overflow;
    const previousPaddingRight = document.body.style.paddingRight || "";

    // compute scrollbar width to avoid layout shift when hiding it
    const scrollbarWidth =
      window.innerWidth - document.documentElement.clientWidth;
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `calc(${previousPaddingRight || 0}px + ${scrollbarWidth}px)`;
    }
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
      document.body.style.paddingRight = previousPaddingRight;
    };
  }, [render]);

  if (!mounted || !render) {
    return null;
  }

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-stretch sm:justify-end">
      <button
        type="button"
        aria-label="Close drawer"
        className={
          visible
            ? "absolute inset-0 rd-backdrop-enter"
            : "absolute inset-0 rd-backdrop-exit"
        }
        onClick={onClose}
      />

      <section
        className={`relative flex h-[min(100vh,100dvh)] w-full max-w-none flex-col overflow-hidden bg-white shadow-2xl outline-none dark:bg-slate-900 sm:w-[min(50vw,42rem)] sm:max-w-[42rem] sm:rounded-l-lg sm:rounded-tr-none ${
          visible ? "rd-drawer-enter" : "rd-drawer-exit"
        }`}
      >
        <div className="flex items-start justify-between gap-4 border-b border-gray-200 px-5 py-4 dark:border-slate-800 sm:px-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {title}
            </h3>
            {description && (
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {description}
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 text-gray-500 transition hover:bg-gray-100 hover:text-gray-800 dark:border-slate-700 dark:text-gray-300 dark:hover:bg-slate-800 dark:hover:text-white"
            aria-label="Close drawer"
          >
            <X size={18} />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6">
          {children}
        </div>

        {footer && (
          <div className="border-t border-gray-200 px-5 py-4 dark:border-slate-800 sm:px-6">
            {footer}
          </div>
        )}
      </section>
    </div>,
    document.body,
  );
}
