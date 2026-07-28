"use client";

import React from "react";
import { Sparkles, FileText, CheckSquare, AlertTriangle } from "lucide-react";

const statsData = [
  {
    label: "Total Invoices",
    value: "5",
    subtitle: "This month",
    icon: FileText,
    iconBg: "bg-blue-50 dark:bg-blue-900/20",
    iconColor: "text-blue-500 dark:text-blue-400",
  },
  {
    label: "Paid",
    value: "€ 6.000",
    subtitle: "2 invoices",
    icon: CheckSquare,
    iconBg: "bg-green-50 dark:bg-green-900/20",
    iconColor: "text-green-500 dark:text-green-400",
  },
  {
    label: "Outstanding",
    value: "€ 6.550",
    subtitle: "3 invoices",
    icon: AlertTriangle,
    iconBg: "bg-orange-50 dark:bg-orange-900/20",
    iconColor: "text-orange-500 dark:text-orange-400",
  },
];

const invoices = [
  { id: "INV-001", member: "Solar GmbH", amount: "€ 4.200", issued: "01.03.2026", due: "15.03.2026", status: "PAID" },
  { id: "INV-002", member: "Wind AG", amount: "€ 1.800", issued: "15.02.2026", due: "01.03.2026", status: "PAID" },
  { id: "INV-003", member: "Grün eG", amount: "€ 3.500", issued: "28.02.2026", due: "14.03.2026", status: "PENDING" },
  { id: "INV-004", member: "EcoKraft", amount: "€ 950", issued: "05.03.2026", due: "10.03.2026", status: "OVERDUE" },
  { id: "INV-005", member: "BioStrom GmbH", amount: "€ 2.100", issued: "01.03.2026", due: "20.03.2026", status: "PENDING" },
];

const statusStyles = {
  PAID: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  PENDING: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  OVERDUE: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

export default function InvoicesDashboard() {
  return (
    <div className="p-4 sm:p-6 animate-fadeIn">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
          Invoices
        </h2>
        <span className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-orange-700 bg-orange-100 border border-orange-300 rounded-full dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-700">
          <Sparkles size={16} />
          Coming Soon — Preview
        </span>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 mb-6 sm:grid-cols-3 sm:gap-6">
        {statsData.map((stat) => (
          <div
            key={stat.label}
            className="flex items-center gap-4 p-5 bg-white border border-gray-100 shadow-sm dark:bg-slate-800 rounded-xl dark:border-slate-700"
          >
            <div className={`w-12 h-12 flex items-center justify-center rounded-xl ${stat.iconBg}`}>
              <stat.icon size={24} className={stat.iconColor} />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800 dark:text-white">
                {stat.value}
              </p>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                {stat.label}
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500">
                {stat.subtitle}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Invoice Table */}
      <div className="bg-white border border-gray-100 shadow-sm dark:bg-slate-800 rounded-xl dark:border-slate-700">
        <div className="flex items-center justify-between px-6 pt-5 pb-4">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
            All Invoices
          </h3>
          <button className="text-sm font-medium text-primary hover:underline dark:text-md-tint">
            + New Invoice
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-t border-gray-100 dark:border-slate-700">
                <th className="px-6 py-3 text-xs font-semibold tracking-wider text-left text-gray-500 uppercase dark:text-gray-400">Invoice</th>
                <th className="px-6 py-3 text-xs font-semibold tracking-wider text-left text-gray-500 uppercase dark:text-gray-400">Member</th>
                <th className="px-6 py-3 text-xs font-semibold tracking-wider text-left text-gray-500 uppercase dark:text-gray-400">Amount</th>
                <th className="px-6 py-3 text-xs font-semibold tracking-wider text-left text-gray-500 uppercase dark:text-gray-400">Issued</th>
                <th className="px-6 py-3 text-xs font-semibold tracking-wider text-left text-gray-500 uppercase dark:text-gray-400">Due</th>
                <th className="px-6 py-3 text-xs font-semibold tracking-wider text-left text-gray-500 uppercase dark:text-gray-400">Status</th>
                <th className="px-6 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-slate-700/50">
              {invoices.map((inv) => (
                <tr key={inv.id} className="transition-colors hover:bg-gray-50 dark:hover:bg-slate-700/30">
                  <td className="px-6 py-4 text-sm font-semibold text-gray-800 dark:text-white">{inv.id}</td>
                  <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">{inv.member}</td>
                  <td className="px-6 py-4 text-sm font-semibold text-gray-800 dark:text-white">{inv.amount}</td>
                  <td className="px-6 py-4 text-sm text-gray-400 dark:text-gray-500">{inv.issued}</td>
                  <td className="px-6 py-4 text-sm text-gray-400 dark:text-gray-500">{inv.due}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 text-[11px] font-semibold rounded-md ${statusStyles[inv.status]}`}>
                      {inv.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-right text-primary hover:underline dark:text-custom-neutral-300">
                    <button>View →</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
