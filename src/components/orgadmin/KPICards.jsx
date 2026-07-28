// "use client";

// import React, { useEffect, useState } from "react";
// import {
//   Building2,
//   ClipboardCheck,
//   AlertTriangle,
//   ShieldAlert,
// } from "lucide-react";
// import { getStats } from "@/lib/statsService";
// import { useAuth } from "@/hooks/useAuth";

// import Link from "next/link";
// import { ArrowUpRight } from "lucide-react";

// function KPI({
//   title,
//   value,
//   subtitle,
//   icon: Icon,
//   href,
//   accent = "blue",
// }) {
//   const styles = {
//     blue: {
//       iconBg:
//         "bg-blue-50 dark:bg-blue-500/10",
//       iconColor:
//         "text-blue-600 dark:text-blue-400",
//       border:
//         "hover:border-blue-300 dark:hover:border-blue-700",
//     },

//     emerald: {
//       iconBg:
//         "bg-emerald-50 dark:bg-emerald-500/10",
//       iconColor:
//         "text-emerald-600 dark:text-emerald-400",
//       border:
//         "hover:border-emerald-300 dark:hover:border-emerald-700",
//     },

//     amber: {
//       iconBg:
//         "bg-amber-50 dark:bg-amber-500/10",
//       iconColor:
//         "text-amber-600 dark:text-amber-400",
//       border:
//         "hover:border-amber-300 dark:hover:border-amber-700",
//     },

//     rose: {
//       iconBg:
//         "bg-rose-50 dark:bg-rose-500/10",
//       iconColor:
//         "text-rose-600 dark:text-rose-400",
//       border:
//         "hover:border-rose-300 dark:hover:border-rose-700",
//     },
//   };

//   const style = styles[accent];

//   return (
//     <Link href={href}>
//       <div
//         className={`
//           group
//           relative
//           h-full
//           overflow-hidden
//           rounded-2xl
//           border
//           border-zinc-200
//           dark:border-zinc-800
//           bg-white
//           dark:bg-zinc-900
//           p-5
//           transition-all
//           duration-200
//           cursor-pointer
//           hover:-translate-y-1
//           hover:shadow-lg
//           dark:hover:shadow-black/20
//           ${style.border}
//         `}
//       >
//         <div className="flex items-start justify-between">
//           <div
//             className={`
//               flex
//               h-11
//               w-11
//               items-center
//               justify-center
//               rounded-xl
//               ${style.iconBg}
//             `}
//           >
//             <Icon
//               className={`h-5 w-5 ${style.iconColor}`}
//             />
//           </div>

//           <ArrowUpRight
//             className="
//               h-4
//               w-4
//               text-zinc-400
//               transition-all
//               group-hover:text-zinc-700
//               dark:group-hover:text-zinc-200
//               group-hover:translate-x-0.5
//               group-hover:-translate-y-0.5
//             "
//           />
//         </div>

//         <div className="mt-5">
//           <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
//             {title}
//           </p>

//           <h3 className="mt-2 text-3xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
//             {value?.toLocaleString()}
//           </h3>

//           <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400 line-clamp-2">
//             {subtitle}
//           </p>
//         </div>

//         <div
//           className="flex items-center gap-1 mt-4 text-sm font-medium transition-all opacity-0 text-zinc-400 group-hover:opacity-100 group-hover:text-zinc-700 dark:group-hover:text-zinc-300"
//         >
//           View details
//           <ArrowUpRight className="h-3.5 w-3.5" />
//         </div>
//       </div>
//     </Link>
//   );
// }
// export default function OverviewView({ auditOrgName }) {
//   const [stats, setStats] = useState(null);
//   const [loading, setLoading] = useState(true);

//   const {user } = useAuth()

//   useEffect(() => {
//     const loadStats = async () => {
//       try {
//         const res = await getStats(user?.role);
//         setStats(res);
//       } catch (err) {
//         console.error(err);
//       } finally {
//         setLoading(false);
//       }
//     };

//     loadStats();
//   }, []);

//   return (
//     <div className="px-4 py-6 space-y-6 sm:px-6">
//       {/* KPI Cards */}
//       <section className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
//         {loading ? (
//           Array.from({ length: 4 }).map((_, index) => (
//             <div
//               key={index}
//               className="h-36 animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-700"
//             />
//           ))
//         ) : (
//           <>
//             <KPI
//   title="Total Cooperatives"
//   value={stats?.coopsCount || 0}
//   subtitle="Registered under audit coverage"
//   icon={Building2}
//   href="/cooperatives"
//   accent="blue"
// />

// <KPI
//   title="Active Audits"
//   value={stats?.activeAuditsCount || 0}
//   subtitle="Currently in progress"
//   icon={ClipboardCheck}
//   href="/audits"
//   accent="emerald"
// />

// <KPI
//   title="Overdue Audits"
//   value={stats?.overdueAuditsCount || 0}
//   subtitle="Require immediate attention"
//   icon={AlertTriangle}
//   href="/audits?status=overdue"
//   accent="amber"
// />

// <KPI
//   title="Discrepancies Found"
//   value={stats?.totalDiscrepancyCount || 0}
//   subtitle={`${stats?.affectedCoopsForDiscrepancies || 0} cooperatives affected`}
//   icon={ShieldAlert}
//   href="/discrepancies"
//   accent="rose"
// />
//           </>
//         )}
//       </section>
//     </div>
//   );
// }

"use client";

import React, { useEffect, useState } from "react";
import {
  Building2,
  ClipboardCheck,
  AlertTriangle,
  ShieldAlert,
  ArrowUpRight,
} from "lucide-react";
import { getStats } from "@/lib/statsService";
import { useAuth } from "@/hooks/useAuth";
import Link from "next/link";

function KPI({ title, value, subtitle, icon: Icon, href, accent = "blue" }) {
  const styles = {
    blue: {
      iconBg: "bg-blue-50/80 dark:bg-blue-500/10",
      iconColor: "text-blue-600 dark:text-blue-400",
      border:
        "hover:border-blue-500/30 dark:hover:border-blue-400/20 hover:ring-1 hover:ring-blue-500/20",
      hoverBg:
        "hover:from-white hover:to-blue-50/30 dark:hover:from-zinc-900 dark:hover:to-blue-950/10",
    },
    emerald: {
      iconBg: "bg-emerald-50/80 dark:bg-emerald-500/10",
      iconColor: "text-emerald-600 dark:text-emerald-400",
      border:
        "hover:border-emerald-500/30 dark:hover:border-emerald-400/20 hover:ring-1 hover:ring-emerald-500/20",
      hoverBg:
        "hover:from-white hover:to-emerald-50/30 dark:hover:from-zinc-900 dark:hover:to-emerald-950/10",
    },
    amber: {
      iconBg: "bg-amber-50/80 dark:bg-amber-500/10",
      iconColor: "text-amber-600 dark:text-amber-400",
      border:
        "hover:border-amber-500/30 dark:hover:border-amber-400/20 hover:ring-1 hover:ring-amber-500/20",
      hoverBg:
        "hover:from-white hover:to-amber-50/30 dark:hover:from-zinc-900 dark:hover:to-amber-950/10",
    },
    rose: {
      iconBg: "bg-rose-50/80 dark:bg-rose-500/10",
      iconColor: "text-rose-600 dark:text-rose-400",
      border:
        "hover:border-rose-500/30 dark:hover:border-rose-400/20 hover:ring-1 hover:ring-rose-500/20",
      hoverBg:
        "hover:from-white hover:to-rose-50/30 dark:hover:from-zinc-900 dark:hover:to-rose-950/10",
    },
  };

  const style = styles[accent] || styles.blue;

  return (
    <Link href={href} className="block h-full">
      <div
        className={`
          group
          relative
          h-full
          overflow-hidden
          rounded-lg
          border
          border-zinc-200/80
          dark:border-slate-700/80
          bg-white
          dark:bg-slate-800/90
          bg-gradient-to-br
          from-transparent to-transparent
          p-4
          transition-all
          duration-300
          cursor-pointer
          hover:-translate-y-0.5
          hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)]
          dark:hover:shadow-[0_8px_30px_rgb(0,0,0,0.2)]
          ${style.border}
          ${style.hoverBg}
        `}
      >
        {/* Top Section: Icon & Header Text */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className={`
                flex
                h-9
                w-9
                shrink-0
                items-center
                justify-center
                rounded-lg
                border border-transparent
                dark:border-slate-500/50
                transition-transform
                duration-300
                group-hover:scale-105
                ${style.iconBg}
              `}
            >
              <Icon className={`h-4.5 w-4.5 ${style.iconColor}`} />
            </div>

            <div>
              <p className="text-xs font-medium tracking-wide uppercase text-zinc-500 dark:text-zinc-400">
                {title}
              </p>
              <h3 className="mt-0.5 text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                {value?.toLocaleString()}
              </h3>
            </div>
          </div>

          <ArrowUpRight
            className="
              h-4
              w-4
              text-zinc-400
              transition-transform
              duration-300
              group-hover:text-zinc-800
              dark:group-hover:text-slate-200
              group-hover:translate-x-0.5
              group-hover:-translate-y-0.5
            "
          />
        </div>

        {/* Bottom Section: Subtitle & Meta */}
        <div className="flex items-center justify-between pt-3 mt-3 border-t border-zinc-100 dark:border-slate-700/60">
          <p className="text-xs text-zinc-500 dark:text-slate-400 line-clamp-1 max-w-[75%]">
            {subtitle}
          </p>

          <span className="text-[11px] font-medium text-zinc-400 dark:text-zinc-500 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center gap-0.5 shrink-0">
            Details
          </span>
        </div>
      </div>
    </Link>
  );
}

export default function KPICards({ auditOrgId }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const loadStats = async () => {
      try {
        const res = await getStats(user?.role, auditOrgId);
        setStats(res);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, [user?.role, auditOrgId]);

  return (
    <div className="px-4 py-4 space-y-4">
      {/* KPI Cards Grid */}
      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {loading ? (
          Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="h-[110px] animate-pulse rounded-xl bg-zinc-200 dark:bg-zinc-800/60"
            />
          ))
        ) : (
          <>
            <KPI
              title="Total Cooperatives"
              value={stats?.coopsCount || 0}
              subtitle="Registered under organization"
              icon={Building2}
              href="/dashboard?tab=coops"
              accent="blue"
            />

            <KPI
              title="Active Audits"
              value={stats?.activeAuditsCount || 0}
              subtitle="Currently in progress"
              icon={ClipboardCheck}
              href="/dashboard?tab=audit&audit-filter=active"
              accent="emerald"
            />

            <KPI
              title="Overdue Audits"
              value={stats?.overdueAuditsCount || 0}
              subtitle="Require immediate attention"
              icon={AlertTriangle}
              href="/dashboard?tab=audit&audit-filter=overdue"
              accent="amber"
            />

            <KPI
              title="Discrepancies Found"
              value={stats?.totalDiscrepancyCount || 0}
              subtitle={`${stats?.affectedCoopsForDiscrepancies || 0} cooperatives affected`}
              icon={ShieldAlert}
              href="/dashboard?tab=coops"
              accent="rose"
            />
          </>
        )}
      </section>
    </div>
  );
}
