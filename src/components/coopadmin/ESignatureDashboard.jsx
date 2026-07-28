"use client";

import React from "react";
import { PenTool, FileCheck, Clock, AlertCircle, Send, FileText, Users, Shield, Handshake, ScrollText, Building2, Scale, BookOpen } from "lucide-react";

const templates = [
  { name: "Membership Agreement", description: "Standard cooperative membership sign-up form with terms & conditions.", icon: Users, color: "bg-blue-500" },
  { name: "Board Resolution", description: "Template for board decisions requiring multiple director signatures.", icon: Scale, color: "bg-indigo-500" },
  { name: "NDA / Confidentiality", description: "Non-disclosure agreement for partners, vendors, or new members.", icon: Shield, color: "bg-rose-500" },
  { name: "Loan Agreement", description: "Member or project loan contract with repayment schedule.", icon: Handshake, color: "bg-emerald-500" },
  { name: "Bylaw Amendment", description: "Propose and ratify changes to the cooperative's bylaws.", icon: ScrollText, color: "bg-amber-500" },
  { name: "Power of Attorney", description: "Authorize a representative to act on behalf of a member.", icon: Building2, color: "bg-purple-500" },
  { name: "Employment Contract", description: "Standard employment agreement for cooperative staff.", icon: FileText, color: "bg-sky-500" },
  { name: "Meeting Minutes", description: "Record and co-sign official minutes from assemblies or board meetings.", icon: BookOpen, color: "bg-teal-500" },
];

const stats = [
  { label: "Total Documents", value: "24", icon: FileCheck, color: "bg-violet-500" },
  { label: "Pending Signatures", value: "5", icon: Clock, color: "bg-amber-500" },
  { label: "Completed", value: "18", icon: PenTool, color: "bg-emerald-500" },
  { label: "Expired", value: "1", icon: AlertCircle, color: "bg-rose-500" },
];

const documents = [
  { name: "Membership Agreement – M. Schmidt", status: "Pending", signers: "2/3", date: "01 Mar 2026", type: "Agreement" },
  { name: "Board Resolution – Q1 Budget", status: "Completed", signers: "5/5", date: "20 Feb 2026", type: "Resolution" },
  { name: "Bylaw Amendment v3.2", status: "Pending", signers: "1/4", date: "28 Feb 2026", type: "Amendment" },
  { name: "Loan Agreement – Solar Project", status: "Completed", signers: "3/3", date: "15 Feb 2026", type: "Agreement" },
  { name: "NDA – Partner Corp GmbH", status: "Expired", signers: "0/2", date: "10 Jan 2026", type: "NDA" },
];

export default function ESignatureDashboard() {
  return (
    <div className="p-4 sm:p-6 space-y-6 animate-fadeIn">
      {/* Coming Soon Banner */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 p-6 text-white">
        <div className="relative z-10">
          <span className="inline-block px-3 py-1 mb-3 text-xs font-semibold bg-white/20 rounded-full">
            COMING SOON
          </span>
          <h2 className="text-2xl font-bold mb-1">eSignature</h2>
          <p className="text-violet-100 text-sm max-w-lg">
            Send, track, and manage legally binding electronic signatures for all your cooperative documents. Streamline approvals and reduce paperwork.
          </p>
        </div>
        <div className="absolute -right-6 -top-6 w-32 h-32 bg-white/10 rounded-full" />
        <div className="absolute -right-2 -bottom-8 w-24 h-24 bg-white/5 rounded-full" />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <div
            key={stat.label}
            className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-md opacity-0 animate-fadeInUp"
            style={{ animationDelay: `${i * 100}ms` }}
          >
            <div className="flex items-center justify-between mb-2">
              <div className={`p-2 rounded-full ${stat.color}`}>
                <stat.icon size={18} className="text-white" />
              </div>
              <span className="text-2xl font-bold text-gray-800 dark:text-white">{stat.value}</span>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Documents Table */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Signature Requests</h3>
          <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-violet-600 rounded-lg hover:bg-violet-700 transition-colors cursor-not-allowed opacity-60">
            <Send size={14} /> Send for Signature
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b dark:border-slate-700">
                <th className="pb-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Document</th>
                <th className="pb-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Type</th>
                <th className="pb-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Signers</th>
                <th className="pb-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Date</th>
                <th className="pb-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Status</th>
              </tr>
            </thead>
            <tbody>
              {documents.map((doc) => (
                <tr key={doc.name} className="border-b dark:border-slate-700/50">
                  <td className="py-3 text-sm font-medium text-gray-800 dark:text-white">{doc.name}</td>
                  <td className="py-3">
                    <span className="px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-600 dark:bg-slate-700 dark:text-gray-300 rounded">
                      {doc.type}
                    </span>
                  </td>
                  <td className="py-3 text-sm text-gray-500 dark:text-gray-400">{doc.signers}</td>
                  <td className="py-3 text-sm text-gray-500 dark:text-gray-400">{doc.date}</td>
                  <td className="py-3">
                    <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${
                      doc.status === "Completed"
                        ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
                        : doc.status === "Pending"
                        ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300"
                        : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300"
                    }`}>
                      {doc.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Templates */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Ready-to-Use Templates</h3>
          <span className="text-sm text-gray-500 dark:text-gray-400">{templates.length} templates</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {templates.map((tpl, i) => (
            <div
              key={tpl.name}
              className="bg-white dark:bg-slate-800 rounded-xl p-5 shadow-md hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5 opacity-0 animate-fadeInUp group cursor-not-allowed"
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <div className={`inline-flex p-2.5 rounded-lg ${tpl.color} mb-3`}>
                <tpl.icon size={20} className="text-white" />
              </div>
              <h4 className="font-semibold text-gray-800 dark:text-white text-sm mb-1">{tpl.name}</h4>
              <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed mb-3">{tpl.description}</p>
              <button className="w-full py-2 text-xs font-medium text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-900/20 rounded-lg group-hover:bg-violet-100 dark:group-hover:bg-violet-900/30 transition-colors cursor-not-allowed opacity-70">
                Use Template
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
