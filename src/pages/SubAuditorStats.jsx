"use client";
import React, { useMemo } from "react";
import { Building2, FileUp, Hourglass, CheckCircle } from "lucide-react";

const StatCard = ({ title, value, description, Icon, iconColor }) => {
  return (
    <div className="bg-white dark:bg-slate-800 p-5 rounded-xl shadow-lg transition-all">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">{value}</p>
          <p className="text-xs text-gray-400 dark:text-gray-500">{description}</p>
        </div>

        <div
          className={`p-3 rounded-full bg-opacity-20 ${iconColor.replace(
            "text-",
            "bg-"
          )} ${iconColor}`}
        >
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </div>
  );
};

export default function SubAuditorStats({ cooperatives = [] }) {
  const stats = useMemo(() => {
    const total = cooperatives.length;
    const submitted = cooperatives.filter((c) => c.auditStatus === "SUBMITTED").length;
    const underReview = cooperatives.filter((c) => c.auditStatus === "UNDER_REVIEW").length;
    const approved = cooperatives.filter((c) => c.auditStatus === "APPROVED").length;

    return [
      {
        title: "Total Submissions",
        value: total,
        description: "All registered cooperatives",
        Icon: Building2,
        iconColor: "text-primary",
      },
      {
        title: "Submitted",
        value: submitted,
        description: "Awaiting initial review",
        Icon: FileUp,
        iconColor: "text-amber-500",
      },
      {
        title: "Under Review",
        value: underReview,
        description: "Currently being reviewed",
        Icon: Hourglass,
        iconColor: "text-indigo-500",
      },
      {
        title: "Approved",
        value: approved,
        description: "Successfully approved",
        Icon: CheckCircle,
        iconColor: "text-green-500",
      },
    ];
  }, [cooperatives]);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 my-8">
      {stats.map((s, i) => (
        <StatCard
          key={i}
          title={s.title}
          value={s.value}
          description={s.description}
          Icon={s.Icon}
          iconColor={s.iconColor}
        />
      ))}
    </div>
  );
}


