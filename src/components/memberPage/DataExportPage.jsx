"use client";
import React, { useState } from "react";
import {
  Download,
  FileText,
  Database,
  ShieldCheck,
  Info,
  Loader2,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { getExportData } from "@/lib/dataExport";

export default function DataExportPage() {
  const { user } = useAuth();
  const [loadingType, setLoadingType] = useState(null);

  const handleExport = async (type) => {
    if (!user?.$id) return;

    try {
      setLoadingType(type);

      const result = await getExportData(user.$id);

      if (!result.success)
        throw new Error(result.error || "Failed to fetch export data");

      if (type === "json") {
        const blob = new Blob([JSON.stringify(result.data, null, 2)], {
          type: "application/json",
        });

        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `GDPR_Export_${user.$id}.json`;
        a.click();
        URL.revokeObjectURL(url);
      } else {
        generatePDF(result.data);
      }
    } catch (err) {
      console.error("Export Error:", err);
      toast.error("Failed to generate export.");
    } finally {
      setLoadingType(null);
    }
  };

const generatePDF = (data) => {
  const doc = new jsPDF();

  let currentY = 20;

  doc.setFontSize(18);
  doc.setTextColor(30);
  doc.text("DATA EXPORT REPORT", 14, currentY);

  currentY += 6;

  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(
    "Generated under GDPR Article 15 (Right of Access)",
    14,
    currentY
  );

  currentY += 5;

  doc.text(
    `Generated: ${new Date(data.generatedAt).toLocaleString("de-DE")}`,
    14,
    currentY
  );

  currentY += 6;
  doc.setDrawColor(200);
  doc.line(14, currentY, 196, currentY);

  currentY += 8;
  doc.setFontSize(13);
  doc.setTextColor(40);
  doc.text("1. Personal Data", 14, currentY);

  currentY += 6;
  doc.setFontSize(10);

  const p = data.profile || {};

  const profileLines = [
    `Name: ${p.FirstName || ""} ${p.LastName || ""}`,
    `Email: ${p.email || "—"}`,
    `Phone: ${p.telephoneNo || "—"}`,
    `Address: ${p.street || ""} ${p.houseNo || ""}`,
    `City: ${p.postalCode || ""} ${p.location || ""}`,
  ];

  profileLines.forEach((line) => {
    doc.text(line, 14, currentY);
    currentY += 5;
  });

  currentY += 4;

  const shareRows = (data.shares || []).map((s) => [
    s.coopName,
    s.totalShares,
    `€ ${Number(s.totalPrice || 0).toLocaleString("de-DE", {
      minimumFractionDigits: 2,
    })}`,
  ]);

  autoTable(doc, {
    startY: currentY,
    head: [["Cooperative", "Shares", "Investment (€)"]],
    body: shareRows,
    theme: "grid",
    headStyles: {
      fillColor: [30, 64, 175],
      textColor: 255,
    },
    styles: { fontSize: 10 },
    columnStyles: {
      1: { halign: "right" },
      2: { halign: "right" },
    },
  });

  currentY = doc.lastAutoTable.finalY + 6;

  doc.setFontSize(11);
  doc.setTextColor(20);

  doc.text(
    `Total Shares: ${data.summary?.totalShares || 0}`,
    14,
    currentY
  );
  currentY += 5;

  doc.text(
    `Total Investment: € ${Number(
      data.summary?.totalInvestment || 0
    ).toLocaleString("de-DE", { minimumFractionDigits: 2 })}`,
    14,
    currentY
  );

  currentY += 10;

  const txRows = (data.transactions || []).map((t) => [
    t.coopName,
    t.transactionType,
    t.shares,
    `€ ${Number(t.price || 0).toLocaleString("de-DE")}`,
    t.verificationStatus,
  ]);

  autoTable(doc, {
    startY: currentY,
    head: [["Coop", "Type", "Shares", "Amount", "Status"]],
    body: txRows,
    theme: "striped",
    headStyles: { fillColor: [30, 64, 175] },
    styles: { fontSize: 9 },
    columnStyles: {
      2: { halign: "right" },
      3: { halign: "right" },
    },
  });

  currentY = doc.lastAutoTable.finalY + 6;

  const docRows = (data.documents || []).map((d) => [
    d.fileName,
    d.category,
    d.status,
  ]);

  autoTable(doc, {
    startY: currentY,
    head: [["Document", "Category", "Status"]],
    body: docRows,
    theme: "striped",
    headStyles: { fillColor: [30, 64, 175] },
    styles: { fontSize: 9 },
  });

  const pageCount = doc.internal.getNumberOfPages();

  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);

    doc.setFontSize(8);
    doc.setTextColor(150);

    doc.text(
      `Confidential | Generated for data subject | Page ${i}/${pageCount}`,
      14,
      doc.internal.pageSize.height - 8
    );
  }

  const fileName = `DataExport_${user?.$id}_${new Date().toISOString().slice(0,10)}.pdf`;
  doc.save(fileName);
};

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
      <div className="flex items-center gap-3 pb-4 border-b border-gray-100 dark:border-slate-800">
        <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl dark:bg-indigo-900/30 dark:text-indigo-400">
          <Download className="w-10 h-10" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Datenabruf{" "}
            <span className="text-gray-400 font-normal">/ Data Export</span>
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-1">
            GDPR Article 15 Compliance Tool
          </p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-6 sm:p-8">
          <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-6">
            Choose your export format
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            <button
              onClick={() => handleExport("pdf")}
              disabled={loadingType !== null}
              className={`relative flex flex-col items-center justify-center gap-3 p-6 sm:p-8 rounded-xl border-2 transition-all group ${
                loadingType === "pdf"
                  ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20"
                  : "border-gray-200 dark:border-slate-700 hover:border-indigo-500 hover:bg-indigo-50/50 dark:hover:bg-slate-700/50 dark:hover:border-indigo-400 bg-white dark:bg-slate-800"
              }`}
            >
              {loadingType === "pdf" ? (
                <Loader2 className="w-10 h-10 text-indigo-600 dark:text-indigo-400 animate-spin" />
              ) : (
                <FileText className="w-10 h-10 text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform" />
              )}
              <div className="text-center">
                <span className="block font-bold text-gray-900 dark:text-white">
                  PDF Format
                </span>
                <span className="block text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Best for viewing and printing
                </span>
              </div>
            </button>

            <button
              onClick={() => handleExport("json")}
              disabled={loadingType !== null}
              className={`relative flex flex-col items-center justify-center gap-3 p-6 sm:p-8 rounded-xl border-2 transition-all group ${
                loadingType === "json"
                  ? "border-gray-500 bg-gray-50 dark:bg-slate-700"
                  : "border-gray-200 dark:border-slate-700 hover:border-gray-500 hover:bg-gray-50/50 dark:hover:bg-slate-700/50 dark:hover:border-gray-400 bg-white dark:bg-slate-800"
              }`}
            >
              {loadingType === "json" ? (
                <Loader2 className="w-10 h-10 text-gray-700 dark:text-gray-300 animate-spin" />
              ) : (
                <Database className="w-10 h-10 text-gray-700 dark:text-gray-300 group-hover:scale-110 transition-transform" />
              )}
              <div className="text-center">
                <span className="block font-bold text-gray-900 dark:text-white">
                  JSON Format
                </span>
                <span className="block text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Best for data portability
                </span>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
