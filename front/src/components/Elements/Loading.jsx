import React from "react";

export default function Loading({ className = "" }) {
  return (
    <div className={`h-screen w-full p-3 sm:p-4 ${className}`.trim()}>
      <div className="relative h-full bg-white/20 text-slate-900 dark:bg-black/20 dark:text-white backdrop-blur-md border-2 border-slate-200/70 dark:border-white/10 rounded-3xl p-4 overflow-y-auto transition-colors duration-300 flex justify-center items-center">
        <div className="flex items-center justify-center p-5">
          <div className="flex space-x-2 animate-pulse">
            <div className="w-3 h-3 bg-gray-500 dark:bg-gray-100 rounded-full"></div>
            <div className="w-3 h-3 bg-gray-500 dark:bg-gray-100 rounded-full"></div>
            <div className="w-3 h-3 bg-gray-500 dark:bg-gray-100 rounded-full"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
