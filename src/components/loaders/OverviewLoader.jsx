import React from "react";

const OverviewLoader = ({ stat }) => {
  const isCompliance = stat?.title === "Compliance";

  return (
    <>
      {/* Top Row: Icon on left, Grade skeleton on right if applicable */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center justify-center w-10 h-10 bg-gray-200 rounded-full dark:bg-slate-700 sm:w-12 sm:h-12 animate-pulse" />
        {isCompliance && (
          <div className="w-12 h-8 bg-gray-200 rounded-xl dark:bg-slate-700 animate-pulse" />
        )}
      </div>

      {/* Middle 1: Title Skeleton */}
      <div className="h-5 mb-2 bg-gray-200 rounded w-28 dark:bg-slate-700 animate-pulse" />

      {/* Middle 2: Change description Skeleton */}
      <div className="w-36 h-3.5 bg-gray-100 dark:bg-slate-800 rounded animate-pulse" />

      {/* Bottom Row: Value on left, Review button skeleton on right if applicable */}
      <div className="flex items-end justify-between mt-3">
        <div className="bg-gray-200 rounded w-14 h-7 dark:bg-slate-700 animate-pulse" />
        <div className="w-16 h-5 bg-gray-100 dark:bg-slate-800 rounded-2xl animate-pulse" />
      </div>
    </>
  );
};

export default OverviewLoader;
