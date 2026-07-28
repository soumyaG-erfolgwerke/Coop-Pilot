"use client";
import React, { useState, useEffect, useRef } from "react";
import {
  getNotificationsForUser,
  markNotificationAsRead,
} from "../lib/notificationService";
import { useAuth } from "../hooks/useAuth";
import { initRealtimeNotifications } from "../lib/initRealtimeNotifications";

const BellIcon = () => (
  <svg
    className="w-4 h-4 text-indigo-500 dark:text-indigo-400"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
  </svg>
);

const NotificationItem = ({ notification, onDismiss }) => {
  const isUnread = !notification.isRead;

  return (
    <div
      className={`
        relative flex items-center gap-3.5 p-4
        transition-all duration-200 border-b border-gray-100 dark:border-gray-800/60 last:border-none
        hover:bg-gray-50/50 dark:hover:bg-gray-800/20
        ${isUnread ? "bg-white dark:bg-gray-900" : "bg-gray-50/30 dark:bg-gray-900/10 opacity-75"}
      `}
    >
      {/* LEFT ICON ACCENT WITH SHIFTED UNREAD DOT */}
      <div className="relative shrink-0">
        <div
          className={`
            flex items-center justify-center w-9 h-9 rounded-xl transition-colors
            ${isUnread ? "bg-indigo-50 dark:bg-indigo-950/40" : "bg-gray-100 dark:bg-gray-800/70"}
          `}
        >
          <BellIcon />
        </div>

        {isUnread && (
          <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-indigo-500 dark:bg-indigo-400 border-2 border-white dark:border-gray-900 shadow-sm" />
        )}
      </div>

      {/* CONTENT */}
      <div className="flex-1 min-w-0 flex flex-col justify-center">
        <p
          className={`
            text-sm leading-normal tracking-tight break-words
            ${isUnread ? "text-gray-800 dark:text-gray-100 font-medium" : "text-gray-500 dark:text-gray-400"}
          `}
        >
          {notification.message}
        </p>

        <p className="text-[11px] mt-1 text-gray-400 dark:text-gray-500 tracking-wide font-medium">
          {new Date(notification.timestamp).toLocaleString(undefined, {
            dateStyle: "medium",
            timeStyle: "short",
          })}
        </p>
      </div>

      {isUnread && (
        <div className="shrink-0 pl-2">
          <button
            onClick={() => onDismiss(notification.$id)}
            title="Mark as read"
            className="p-2 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:text-indigo-400 dark:hover:bg-indigo-950/50 transition-all group/btn"
          >
            <svg
              className="w-4 h-4 transition-transform group-hover/btn:scale-110"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
};

const PAGE_SIZE = 10;

const NotificationBox = () => {
  const { user } = useAuth();

  const [tab, setTab] = useState("unread");
  const [notifications, setNotifications] = useState([]);

  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const fetchUnread = async () => {
    setLoading(true);
    const data = await getNotificationsForUser(user.email, false);
    setNotifications(data);
    setLoading(false);
  };

  const fetchAll = async (reset = false) => {
    const newOffset = reset ? 0 : offset;
    reset ? setLoading(true) : setLoadingMore(true);

    const data = await getNotificationsForUser(
      user.email,
      true,
      PAGE_SIZE,
      newOffset,
    );

    if (reset) {
      setNotifications(data);
    } else {
      setNotifications((prev) => [...prev, ...data]);
    }

    setHasMore(data.length === PAGE_SIZE);
    setOffset(newOffset + PAGE_SIZE);

    setLoading(false);
    setLoadingMore(false);
  };

  /* ---------------- EFFECT ---------------- */

  const tabRef = useRef(tab);
  const fetchUnreadRef = useRef(fetchUnread);
  const fetchAllRef = useRef(fetchAll);

  useEffect(() => {
    tabRef.current = tab;
    fetchUnreadRef.current = fetchUnread;
    fetchAllRef.current = fetchAll;
  });

  useEffect(() => {
    if (!user?.email) return;

    if (tab === "unread") fetchUnread();
    else fetchAll(true);
  }, [user?.email, tab]);

  useEffect(() => {
    if (!user?.email) return;

    const unsub = initRealtimeNotifications({
      onCreate: () => {
        if (tabRef.current === "unread") {
          fetchUnreadRef.current();
        } else {
          fetchAllRef.current(true);
        }
      },
    });

    return () => unsub?.();
  }, [user?.email]);
  /* ---------------- ACTIONS ---------------- */

  const loadMore = () => {
    if (tab === "all") fetchAll(false);
  };

  const handleDismiss = (id) => {
    markNotificationAsRead(id);
    if (tab === "unread") {
      setNotifications((prev) => prev.filter((n) => n.$id !== id));
    } else {
      setNotifications((prev) =>
        prev.map((n) => (n.$id === id ? { ...n, isRead: true } : n)),
      );
    }
  };

  /* ---------------- RENDER ---------------- */

  return (
    <div className="w-full bg-white dark:bg-gray-900 border border-gray-200/70 dark:border-gray-800/80 rounded-2xl shadow-sm flex flex-col overflow-hidden">
      {/* HEADER CONTROLS */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800/80 bg-white dark:bg-gray-900">
        <div className="flex items-center gap-3">
          <h2 className="font-semibold text-gray-900 dark:text-gray-100 tracking-tight text-base">
            Notifications
          </h2>
          {notifications.length > 0 && (
            <span className="flex items-center justify-center px-2 py-0.5 text-xs font-semibold rounded-full bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400">
              {notifications.length}
            </span>
          )}
        </div>

        {/* SEGMENTED TOGGLE */}
        <div className="flex p-0.5 bg-gray-100/80 dark:bg-gray-800/60 rounded-lg border border-gray-200/20">
          <button
            onClick={() => setTab("unread")}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-all duration-150 ${
              tab === "unread"
                ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
                : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            }`}
          >
            Unread
          </button>
          <button
            onClick={() => setTab("all")}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-all duration-150 ${
              tab === "all"
                ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
                : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            }`}
          >
            All
          </button>
        </div>
      </div>

      {/* BODY FEED CONTAINER */}
      <div className="flex-1 overflow-y-auto max-h-[420px] divide-y divide-gray-100 dark:divide-gray-800/50">
        {loading ? (
          <div className="flex items-center justify-center py-12 text-sm text-gray-400 font-medium">
            <svg
              className="animate-spin -ml-1 mr-2.5 h-4 w-4 text-indigo-500"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            Updating feed...
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-sm text-gray-400 dark:text-gray-500 text-center py-16 font-medium tracking-tight">
            All caught up! No new updates.
          </div>
        ) : (
          <>
            <div className="flex flex-col">
              {notifications.map((n) => (
                <NotificationItem
                  key={n.$id}
                  notification={n}
                  onDismiss={handleDismiss}
                />
              ))}
            </div>

            {/* INTEGRATED LOAD MORE LINK */}
            {tab === "all" && hasMore && (
              <div className="p-3 bg-gray-50/50 dark:bg-gray-900/40 text-center">
                <button
                  onClick={loadMore}
                  disabled={loadingMore}
                  className="text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition"
                >
                  {loadingMore
                    ? "Loading items..."
                    : "View Older Notifications"}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default NotificationBox;
