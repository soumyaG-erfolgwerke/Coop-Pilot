"use client";
import React, { useState, useEffect } from "react";
import {
  getNotificationsForUser,
  markNotificationAsRead,
} from "@/lib/notificationService";
import { useAuth } from "@/hooks/useAuth";
import { initRealtimeNotifications } from "@/lib/initRealtimeNotifications";

// --- Helper Components ---

// Icon for the close button, now with dark mode support
const CloseIcon = ({}) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="18"
    height="18"
    viewBox="0 0 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="text-gray-500 transition-colors duration-200 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white"
  >
    <line x1="18" y1="6" x2="6" y2="18"></line>
    <line x1="6" y1="6" x2="18" y2="18"></line>
  </svg>
);

// A simple loading spinner component, now with dark mode support
const Spinner = () => (
  <div className="flex items-center justify-center h-full">
    <div className="w-8 h-8 border-4 border-gray-200 rounded-full border-t-indigo-600 dark:border-gray-600 dark:border-t-indigo-500 animate-spin"></div>
  </div>
);

/**
 * A single notification item with entrance and exit animations.
 * @param {object} props - The component props.
 * @param {object} props.notification - The notification object { id, message, timestamp }.
 * @param {function} props.onDismiss - The function to call when the notification is dismissed.
 */
const NotificationItem = ({ notification, onDismiss }) => {
  const [isExiting, setIsExiting] = useState(false);
  const [isEntering, setIsEntering] = useState(true);

  // Trigger the entrance animation on mount
  useEffect(() => {
    const timer = setTimeout(() => setIsEntering(false), 10); // Start transition after a tiny delay
    return () => clearTimeout(timer);
  }, []);

  const handleDismissClick = () => {
    // console.log("nid", notification.$id);
    setIsExiting(true);
    setTimeout(() => {
      onDismiss(notification.$id);
    }, 500); // This duration should match the CSS transition duration
  };

  return (
    <div
      className={`
                relative flex items-start justify-between w-full p-4 pr-10
                bg-white dark:bg-gray-800 rounded-lg shadow-lg dark:shadow-2xl border border-gray-200 dark:border-gray-700
                transition-all duration-500 ease-in-out
                ${
                  isEntering
                    ? "opacity-0 transform -translate-x-full"
                    : "opacity-100 translate-x-0"
                }
                ${
                  isExiting
                    ? "opacity-0 transform scale-90"
                    : "opacity-100 scale-100"
                }
            `}
    >
      {/* Main content */}
      <div className="flex-grow">
        <p className="text-sm italic text-gray-800 dark:text-gray-200">
          {notification.message}
        </p>
        <p className="mt-2 text-xs text-gray-400 dark:text-gray-500">
          {new Date(notification.timestamp).toLocaleString()}
        </p>
      </div>

      {/* Close button */}
      <button
        onClick={handleDismissClick}
        className="absolute p-1 rounded-full top-2 right-2 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-400 dark:focus:ring-indigo-600"
        aria-label="Dismiss notification"
      >
        <CloseIcon />
      </button>
    </div>
  );
};

/**
 * A self-contained box that fetches and displays a list of notifications.
 * It will fill the width and height of its parent container.
 */
const NotifiBox = () => {
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const fetchNotifications = async () => {
      console.log("Fetching notifications...");
      setIsLoading(true);
      const notificationData = await getNotificationsForUser(user.email);
      // console.log(notificationData);
      setNotifications(notificationData);
      setIsLoading(false);
    };
    const unsubscribe = initRealtimeNotifications({
      onCreate: () => {
        console.log("🔔 New notification detected");
        fetchNotifications(); // Re-fetch on create
      },
    });

    // 🔃 Initial fetch
    fetchNotifications();

    return () => {
      unsubscribe(); // 🧹 Clean up realtime subscription
    };
  }, []);

  const handleDismiss = (id) => {
    const dismissedNotification = notifications.find((n) => n.$id === id);
    if (dismissedNotification) {
      console.log(`Notification marked as read:`, dismissedNotification);
      markNotificationAsRead(id);
    }

    setNotifications((prevNotifications) =>
      prevNotifications.filter((notification) => notification.$id !== id)
    );
  };

  return (
    <div className="flex flex-col w-full h-full overflow-hidden border border-gray-300 shadow-inner bg-gray-50 dark:bg-gray-900/50 dark:border-gray-700 rounded-xl">
      <h2 className="p-4 text-lg font-semibold text-gray-800 border-b border-gray-200 dark:text-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-800/50">
        Notifications
      </h2>

      <div className="flex-grow w-full p-4 space-y-3 overflow-y-auto">
        {isLoading ? (
          <Spinner />
        ) : notifications.length > 0 ? (
          notifications.map((notification) => (
            <NotificationItem
              key={notification.$id}
              notification={notification}
              onDismiss={handleDismiss}
            />
          ))
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-500 dark:text-gray-400">
              You have no new notifications.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default NotifiBox;