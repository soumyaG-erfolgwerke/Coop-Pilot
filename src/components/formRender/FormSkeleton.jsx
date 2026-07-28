import React from "react";

export default function FormSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 font-sans pb-12">
      <div className="w-full px-4 py-4 mx-auto max-w-7xl sm:px-4 lg:px-6">
        <div className="animate-pulse flex flex-col gap-3 lg:gap-4 mt-1">
          
          {/* Header Card Skeleton */}
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-md shadow-sm">
            <div className="p-4 sm:p-5">
              <div className="flex flex-col mb-4">
                <div className="flex flex-wrap items-baseline gap-x-4 gap-y-2 mb-3">
                  <div className="h-8 bg-gray-200 dark:bg-gray-800 rounded w-1/3"></div>
                  <div className="flex items-center gap-3">
                    <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-24"></div>
                    <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-24"></div>
                  </div>
                </div>
                <div className="flex items-center gap-3 mt-2">
                  <div className="h-6 bg-gray-200 dark:bg-gray-800 rounded w-20"></div>
                  <div className="h-6 bg-gray-200 dark:bg-gray-800 rounded w-24"></div>
                  <div className="h-6 bg-gray-200 dark:bg-gray-800 rounded w-32"></div>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row justify-between gap-3 pt-4 border-t border-gray-200 dark:border-gray-800">
                <div className="flex gap-3">
                  <div className="h-10 bg-gray-200 dark:bg-gray-800 rounded w-32"></div>
                  <div className="h-10 bg-gray-200 dark:bg-gray-800 rounded w-32"></div>
                </div>
                <div className="flex gap-3 mt-2 sm:mt-0">
                  <div className="h-10 bg-gray-200 dark:bg-gray-800 rounded w-32"></div>
                  <div className="h-10 bg-gray-200 dark:bg-gray-800 rounded w-32"></div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content Layout */}
          <div className="flex flex-col items-start w-full gap-3 lg:flex-row lg:gap-4">
            
            {/* Sidebar Skeleton */}
            <div className="z-10 flex flex-col w-full gap-3 lg:w-72 shrink-0">
              <div className="p-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-md shadow-sm">
                <div className="flex justify-between mb-2">
                  <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded w-20"></div>
                  <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded w-8"></div>
                </div>
                <div className="h-1.5 bg-gray-200 dark:bg-gray-800 rounded-full w-full"></div>
              </div>

              <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-md shadow-sm p-3">
                <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded w-24 mb-4"></div>
                <div className="flex flex-col gap-2 relative">
                  <div className="absolute left-[20px] top-4 bottom-4 w-px bg-gray-200 dark:bg-gray-800 z-0"></div>
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="relative z-10 flex items-center gap-3 p-1.5">
                      <div className="w-7 h-7 bg-gray-200 dark:bg-gray-800 rounded-full shrink-0"></div>
                      <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-3/4"></div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Main Form Content Skeleton */}
            <div className="flex flex-col flex-1 w-full min-w-0 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-md shadow-sm">
              <div className="p-4 sm:p-5 border-b border-gray-200 dark:border-gray-800">
                <div className="h-6 bg-gray-200 dark:bg-gray-800 rounded w-24 mb-3"></div>
                <div className="h-8 bg-gray-200 dark:bg-gray-800 rounded w-1/2 mb-2"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-3/4 mt-2"></div>
              </div>

              <div className="divide-y divide-gray-100 dark:divide-gray-800/60 p-4 sm:p-5">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="py-4 flex flex-col md:flex-row gap-3 md:gap-6 first:pt-0 last:pb-0">
                    <div className="md:w-5/12 lg:w-1/3 shrink-0">
                      <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-full mb-2"></div>
                      <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-4/5"></div>
                    </div>
                    <div className="md:w-7/12 lg:w-2/3 flex-1">
                      <div className="h-10 bg-gray-200 dark:bg-gray-800 rounded w-full"></div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Actions panel skeleton */}
              <div className="p-4 sm:p-5 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 flex justify-between gap-4 rounded-b-md">
                <div className="h-10 bg-gray-200 dark:bg-gray-800 rounded w-28"></div>
                <div className="h-10 bg-gray-200 dark:bg-gray-800 rounded w-32"></div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
