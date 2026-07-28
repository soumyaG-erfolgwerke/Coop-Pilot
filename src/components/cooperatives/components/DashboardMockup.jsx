import React from "react";

const DashboardMockup = ({
  title,
  status,
  statusColor = "text-emerald-400",
  headerBg = "bg-[#043e44]",
  children,
}) => {
  return (
    <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden w-full max-w-[550px] mx-auto">
      {/* Dashboard Title Bar */}
      <div className={`${headerBg} px-6 py-4 flex items-center justify-between`}>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 bg-red-400 rounded-full" />
          <span className="w-3 h-3 bg-yellow-400 rounded-full" />
          <span className="w-3 h-3 bg-green-400 rounded-full" />
          <span className="ml-2 text-xs font-semibold tracking-wide text-white uppercase font-dmsans">
            {title}
          </span>
        </div>
        {status && (
          <span className={`${statusColor} text-[10px] sm:text-xs font-bold font-dmsans uppercase`}>
            {status}
          </span>
        )}
      </div>

      {/* Content Area */}
      <div className="flex flex-col gap-5 p-5 sm:p-6 bg-slate-50/50">
        {children}
      </div>
    </div>
  );
};

export default DashboardMockup;
