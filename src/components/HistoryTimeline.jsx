import React from "react";
import {
  Clock,
  CheckCircle,
  AlertCircle,
  UserMinus,
  XCircle,
  Info,
  History,
} from "lucide-react";

const HistoryTimeline = ({ membership }) => {
  if (!membership) return null;

  let historyLogs = [];
  if (membership.historyJson) {
    try {
      historyLogs = JSON.parse(membership.historyJson);
      if (!Array.isArray(historyLogs)) {
        historyLogs = [];
      }
    } catch (e) {
      console.error("Failed to parse historyJson:", e);
      historyLogs = [];
    }
  }

  // Ensure the latest status from membership.status is represented in the timeline
  if (membership.status) {
    const lastEntry = historyLogs[historyLogs.length - 1];
    if (!lastEntry || lastEntry.status.toLowerCase() !== membership.status.toLowerCase()) {
      historyLogs.push({
        status: membership.status,
        changedAt: membership.$updatedAt || membership.$createdAt || new Date().toISOString()
      });
    }
  }

  // Helper to map status to icon, colors, and label
  const getStatusConfig = (status) => {
    const s = (status || "").toLowerCase();
    switch (s) {
      case "pending":
        return {
          icon: Clock,
          color: "text-amber-500 bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900/50",
          label: "Application Pending",
          description: "Your application is submitted and under review."
        };
      case "active":
        return {
          icon: CheckCircle,
          color: "text-emerald-500 bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900/50",
          label: "Membership Active",
          description: "Application approved! You are an active member of this cooperative."
        };
      case "noticegiven":
        return {
          icon: AlertCircle,
          color: "text-orange-500 bg-orange-50 dark:bg-orange-950/30 border-orange-200 dark:border-orange-900/50",
          label: "Notice Given",
          description: "Notice to terminate membership has been registered."
        };
      case "former":
        return {
          icon: UserMinus,
          color: "text-gray-500 bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700",
          label: "Former Member",
          description: "Membership has ended. Thank you for your participation."
        };
      case "rejected":
        return {
          icon: XCircle,
          color: "text-rose-500 bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900/50",
          label: "Application Rejected",
          description: "The application could not be approved at this time."
        };
      default:
        return {
          icon: Info,
          color: "text-blue-500 bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-900/50",
          label: status,
          description: "Status changed."
        };
    }
  };

  return (
    <div className="mt-8 overflow-hidden bg-white border border-gray-200/80 rounded-2xl shadow-sm">
      <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-gray-50 to-white">
        <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
          <History className="w-5 h-5 text-blue-600" />
          Application & Membership History
        </h3>
        {membership.membershipId && (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-100">
            ID: {membership.membershipId}
          </span>
        )}
      </div>

      <div className="p-6">
        <div className="relative pl-6 border-l-2 border-dashed border-gray-200/80 space-y-8">
          {[...historyLogs].reverse().map((log, index) => {
            const config = getStatusConfig(log.status);
            const StatusIcon = config.icon;
            const formattedDate = new Date(log.changedAt).toLocaleString("de-DE", {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit"
            });

            return (
              <div key={index} className="relative group transition-all duration-200">
                {/* Timeline node */}
                <div className={`absolute -left-[37px] top-0.5 flex items-center justify-center w-8 h-8 rounded-full border-2 shadow-sm transition-transform duration-200 group-hover:scale-110 ${config.color}`}>
                  <StatusIcon className="w-4 h-4" />
                </div>

                <div className="pl-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                    <span className="font-bold text-gray-900 text-md group-hover:text-blue-600 transition-colors">
                      {config.label}
                    </span>
                    <span className="text-xs font-medium text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full w-max">
                      {formattedDate}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-gray-500 leading-relaxed">
                    {config.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default HistoryTimeline;
