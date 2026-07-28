"use client";

import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Sparkles } from "lucide-react";

// Static preview data
const statsData = [
  {
    label: "Total Revenue",
    value: "€ 145,200",
    subtitle: "↑ 12% vs last year",
    emoji: "💰",
    bgColor: "bg-orange-50 dark:bg-orange-900/10",
  },
  {
    label: "Total Expenses",
    value: "€ 88,700",
    subtitle: "↑ 8% vs last year",
    emoji: "🏦",
    bgColor: "bg-red-50 dark:bg-red-900/10",
  },
  {
    label: "Net Surplus",
    value: "€ 56,500",
    subtitle: "After all costs",
    emoji: "📈",
    bgColor: "bg-blue-50 dark:bg-blue-900/10",
  },
  {
    label: "Share Capital",
    value: "€ 320,000",
    subtitle: "42 members",
    emoji: "🏛️",
    bgColor: "bg-purple-50 dark:bg-purple-900/10",
  },
];

const chartData = [
  { month: "Jul", Revenue: 3200, Expenses: 2800 },
  { month: "Aug", Revenue: 4100, Expenses: 3600 },
  { month: "Sep", Revenue: 3800, Expenses: 3200 },
  { month: "Oct", Revenue: 5200, Expenses: 4400 },
  { month: "Nov", Revenue: 4800, Expenses: 3800 },
  { month: "Dec", Revenue: 5500, Expenses: 4200 },
  { month: "Jan", Revenue: 5800, Expenses: 4600 },
  { month: "Feb", Revenue: 5400, Expenses: 4100 },
  { month: "Mar", Revenue: 5600, Expenses: 4300 },
];

export default function FinancialAnalysisDashboard() {
  return (
    <div className="p-4 sm:p-6 animate-fadeIn">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
          Financial Analysis
        </h2>
        <span className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-orange-700 bg-orange-100 border border-orange-300 rounded-full dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-700">
          <Sparkles size={16} />
          Coming Soon — Preview
        </span>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 mb-6 sm:grid-cols-2 lg:grid-cols-4 sm:gap-6">
        {statsData.map((stat) => (
          <div
            key={stat.label}
            className="p-5 bg-white border border-gray-100 shadow-sm dark:bg-slate-800 rounded-xl dark:border-slate-700"
          >
            <div
              className={`w-10 h-10 flex items-center justify-center rounded-lg mb-3 text-xl ${stat.bgColor}`}
            >
              {stat.emoji}
            </div>
            <p className="text-2xl font-bold text-gray-800 dark:text-white">
              {stat.value}
            </p>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
              {stat.label}
            </p>
            <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
              {stat.subtitle}
            </p>
          </div>
        ))}
      </div>

      {/* Revenue vs Expenses Chart */}
      <div className="p-5 bg-white border border-gray-100 shadow-sm dark:bg-slate-800 sm:p-6 rounded-xl dark:border-slate-700">
        <h3 className="mb-6 text-lg font-semibold text-gray-800 dark:text-white">
          Revenue vs Expenses — Last 9 Months
        </h3>
        <ResponsiveContainer width="100%" height={320}>
          <BarChart
            data={chartData}
            margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
            barGap={4}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
            <XAxis
              dataKey="month"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#9ca3af", fontSize: 13 }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#9ca3af", fontSize: 13 }}
              tickFormatter={(v) => `€${(v / 1000).toFixed(0)}k`}
            />
            <Tooltip
              formatter={(value, name) => [`€${value.toLocaleString()}`, name]}
              contentStyle={{
                backgroundColor: "#fff",
                border: "1px solid #e5e7eb",
                borderRadius: "8px",
                boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                color: "#1f2937",
                fontWeight: 500,
              }}
              labelStyle={{ color: "#374151", fontWeight: 600 }}
              itemStyle={{ color: "#374151" }}
            />
            <Legend
              verticalAlign="bottom"
              iconType="square"
              iconSize={12}
              wrapperStyle={{ paddingTop: "16px" }}
            />
            <Bar
              dataKey="Revenue"
              fill="#db2777"
              radius={[4, 4, 0, 0]}
              barSize={28}
            />
            <Bar
              dataKey="Expenses"
              fill="#6b7280"
              radius={[4, 4, 0, 0]}
              barSize={28}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
