"use client";

import { useCallback, useEffect, useState } from "react";
import { Bell } from "lucide-react";
import WhatsNewPanel from "@/components/whats-new/WhatsNewPanel";
import { useAuth } from "@/hooks/useAuth";

export default function WhatsNewBell() {
  const { user } = useAuth();
  const [enabled, setEnabled] = useState(false);
  const [announcements, setAnnouncements] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const [shaking, setShaking] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    try {
      const response = await fetch("/api/whats-new", { credentials: "include", cache: "no-store" });
      if (!response.ok) return;
      const payload = await response.json();
      setEnabled(payload.enabled === true);
      setAnnouncements(Array.isArray(payload.announcements) ? payload.announcements : []);
      setUnreadCount(Number(payload.unreadCount) || 0);
    } catch {
      // The changelog must never prevent normal navigation from rendering.
    }
  }, [user]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    if (!unreadCount) return undefined;
    setShaking(true);
    const timer = window.setTimeout(() => setShaking(false), 2400);
    return () => window.clearTimeout(timer);
  }, [unreadCount]);

  async function markAllRead() {
    const response = await fetch("/api/whats-new/read", { method: "POST", credentials: "include" });
    if (!response.ok) return;
    setUnreadCount(0);
    setShaking(false);
  }

  if (!user || !enabled) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="relative rounded-full p-2 text-slate-600 transition-colors hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
        title="What's new announcements"
        aria-label={unreadCount ? `What's new: ${unreadCount} unread` : "What's new"}
      >
        <Bell size={20} className={shaking ? "origin-top animate-whats-new-shake" : ""} />
        {unreadCount > 0 && (
          <span className="absolute right-0.5 top-0.5 flex h-3 w-3" aria-hidden="true">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-400 opacity-75" />
            <span className="relative inline-flex h-3 w-3 rounded-full border-2 border-white bg-rose-600 dark:border-slate-900" />
          </span>
        )}
      </button>
      <WhatsNewPanel
        open={open}
        onClose={() => setOpen(false)}
        announcements={announcements}
        unreadCount={unreadCount}
        onMarkAllRead={markAllRead}
      />
      <style jsx global>{`
        @keyframes whats-new-shake {
          0%, 100% { transform: rotate(0deg); }
          12%, 36%, 60%, 84% { transform: rotate(13deg); }
          24%, 48%, 72% { transform: rotate(-13deg); }
        }
        .animate-whats-new-shake { animation: whats-new-shake 0.8s ease-in-out 3; }
        @media (prefers-reduced-motion: reduce) {
          .animate-whats-new-shake { animation: none; }
        }
      `}</style>
    </>
  );
}
