import React from "react";

const NotificationItemSkeleton = () => (
  <div className="relative flex items-center gap-3.5 p-4 border-b border-gray-100 dark:border-gray-800/60 last:border-none">
    {/* Left Icon Accent Skeleton */}
    <div className="relative shrink-0">
      <div className="bg-gray-200 w-9 h-9 rounded-xl dark:bg-slate-700 animate-pulse" />
    </div>

    {/* Content Skeleton */}
    <div className="flex flex-col justify-center flex-1 min-w-0">
      {/* Message line 1 */}
      <div className="w-5/6 h-4 bg-gray-200 rounded dark:bg-slate-700 animate-pulse" />
      {/* Message line 2 */}
      <div className="h-3.5 bg-gray-200 dark:bg-slate-700 rounded w-1/2 mt-2 animate-pulse" />
      {/* Timestamp */}
      <div className="w-1/4 h-3 mt-2 bg-gray-100 rounded dark:bg-slate-800 animate-pulse" />
    </div>
  </div>
);

const NotificationLoader = () => {
  return (
    <div className="flex flex-col w-full overflow-hidden bg-white border shadow-sm dark:bg-gray-900 border-gray-200/70 dark:border-gray-800/80 rounded-2xl">
      {/* HEADER CONTROLS */}
      <div className="flex items-center justify-between px-5 py-4 bg-white border-b border-gray-100 dark:border-gray-800/80 dark:bg-gray-900">
        <div className="flex items-center gap-3">
          <h2 className="text-base font-semibold tracking-tight text-gray-900 dark:text-gray-100">
            Notifications
          </h2>
          <div className="w-6 h-5 bg-gray-200 rounded-full dark:bg-slate-700 animate-pulse" />
        </div>

        {/* SEGMENTED TOGGLE SKELETON */}
        <div className="flex p-0.5 bg-gray-100/80 dark:bg-gray-800/60 rounded-lg border border-gray-200/20">
          <div className="h-6 bg-gray-200 rounded-md w-14 dark:bg-slate-700 animate-pulse" />
          <div className="w-10 h-6" />
        </div>
      </div>

      {/* BODY FEED CONTAINER */}
      <div className="flex-1 overflow-y-auto max-h-[420px] divide-y divide-gray-100 dark:divide-gray-800/50">
        <NotificationItemSkeleton />
        <NotificationItemSkeleton />
        <NotificationItemSkeleton />
      </div>
    </div>
  );
};

export default NotificationLoader;
