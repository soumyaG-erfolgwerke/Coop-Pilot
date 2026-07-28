"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  X,
  Download,
  FileText,
  Clock,
  MessageSquare,
  User,
  CheckCircle2,
  XCircle,
  Paperclip,
  Building2,
  AlertCircle,
} from "lucide-react";
import { generateAuditPDF } from "@/lib/auditPdfGenerator";
import toast from "react-hot-toast";
import FadePopUp from "../FadePopUp";

export default function AuditDataModal({
  open,
  onClose,
  coop,
  tickets = [],
  comments = [],
  onDownloadPDF,
  auditData,
}) {
  const [downloading, setDownloading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleDownloadPDF = async () => {
    setDownloading(true);
    try {
      if (!auditData) {
        toast.error("No audit data available");
        return;
      }
      const parsedAudit =
        typeof auditData === "string" ? JSON.parse(auditData) : auditData;
      await generateAuditPDF(parsedAudit, coop?.name || "Audit Report");
      toast.success("PDF downloaded successfully");
      onClose();
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error("Failed to generate PDF");
    } finally {
      setDownloading(false);
    }
  };

  const formatDate = (isoString) => {
    if (!isoString) return "N/A";
    try {
      return new Date(isoString).toLocaleString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "N/A";
    }
  };

  const renderFieldValue = (field) => {
    const isEmpty =
      field.answer === undefined ||
      field.answer === null ||
      field.answer === "" ||
      (Array.isArray(field.answer) && field.answer.length === 0);

    if (isEmpty) {
      return (
        <span className="text-sm italic text-gray-400 dark:text-gray-500">
          No response provided
        </span>
      );
    }

    switch (field.componentType) {
      case "checkbox":
      case "toggle":
        return field.answer ? (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-sm font-bold border border-green-200 dark:border-green-800">
            <CheckCircle2 size={14} /> Yes
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-sm font-bold border border-gray-200 dark:border-gray-700">
            <XCircle size={14} /> No
          </span>
        );

      case "checkbox_group":
      case "multi_select":
      case "multiple_choice":
        const answersArray = Array.isArray(field.answer)
          ? field.answer
          : [field.answer];
        return (
          <div className="flex flex-wrap gap-2">
            {answersArray.map((ans, i) => (
              <span
                key={i}
                className="inline-flex items-center px-3 py-1 text-sm font-semibold text-blue-700 border border-blue-200 rounded-md bg-blue-50 dark:bg-blue-900/20 dark:border-blue-800/50 dark:text-blue-300"
              >
                {ans}
              </span>
            ))}
          </div>
        );

      case "file":
      case "doc_upload":
      case "file_upload":
        const files = Array.isArray(field.answer)
          ? field.answer
          : [field.answer];
        return (
          <div className="flex flex-col gap-2">
            {files.map((f, i) => (
              <a
                key={i}
                href={f.url || f.fileUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-3 p-2.5 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 transition-all max-w-sm"
              >
                <div className="flex items-center justify-center w-8 h-8 text-blue-600 rounded bg-blue-50 dark:bg-blue-900/30 dark:text-blue-400 shrink-0">
                  <Paperclip size={16} />
                </div>
                <span className="text-sm font-medium truncate text-gray-700 dark:text-gray-300">
                  {f.fileName || "View Document"}
                </span>
              </a>
            ))}
          </div>
        );

      case "textarea":
        return (
          <div className="p-3 text-sm whitespace-pre-wrap border rounded-md bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300">
            {String(field.answer)}
          </div>
        );

      default:
        return (
          <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
            {String(field.answer)}
          </span>
        );
    }
  };

  if (!mounted) return null;

  const parsedAudit =
    typeof auditData === "string" ? JSON.parse(auditData) : auditData;

  const modalContent = (
    <FadePopUp
      isOpen={open}
      onClose={onClose}
      overlayClassName="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 bg-gray-900/60 backdrop-blur-sm"
      className="relative z-10 w-full max-w-4xl max-h-[90vh] rounded-md bg-white shadow-2xl dark:bg-gray-900 flex flex-col overflow-hidden border border-gray-300 dark:border-gray-700"
    >
      <div className="flex items-center justify-between p-6 border-b shrink-0 border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
        <div className="flex items-center gap-4">
          <div className="flex items-center justify-center w-12 h-12 text-white bg-blue-700 rounded-md shrink-0">
            <Building2 size={24} />
          </div>
          <div>
            <h2 className="text-xl font-bold leading-tight text-gray-900 dark:text-white">
              {parsedAudit?.title || "Submitted Audit Data"}
            </h2>
            <p className="mt-1 text-xs font-bold tracking-wider uppercase text-gray-500 dark:text-gray-400">
              {coop?.name || "Cooperative"}
            </p>
          </div>
        </div>
        <button
          className="p-2 transition-colors rounded-md text-gray-400 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-800 dark:hover:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
          onClick={onClose}
        >
          <X size={24} />
        </button>
      </div>

      <div className="flex-1 p-6 space-y-8 overflow-y-auto bg-gray-50 dark:bg-gray-950 sm:p-8">
        {parsedAudit && parsedAudit.phases ? (
          <div className="space-y-6">
            {parsedAudit.phases.map((phase, index) => (
              <div
                key={phase.phaseId}
                className="overflow-hidden bg-white border border-gray-200 dark:bg-gray-900 dark:border-gray-800 rounded-md shadow-sm"
              >
                <div className="px-5 py-4 border-b bg-gray-100/50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-800">
                  <h3 className="flex items-center gap-2 text-base font-bold text-gray-900 dark:text-white">
                    <span className="flex items-center justify-center w-6 h-6 text-xs text-white bg-blue-700 rounded shrink-0">
                      {index + 1}
                    </span>
                    {phase.title}
                  </h3>
                </div>
                <div className="p-5 space-y-5">
                  {phase.fields?.map((field) => {
                    if (field.wasVisible === false) return null;
                    return (
                      <div
                        key={field.fieldId}
                        className="flex flex-col gap-2 pb-5 border-b sm:flex-row sm:gap-6 border-gray-100 dark:border-gray-800/60 last:border-0 last:pb-0"
                      >
                        <div className="sm:w-1/3 shrink-0">
                          <p className="text-sm font-semibold text-gray-700 dark:text-gray-400">
                            {field.label}
                          </p>
                        </div>
                        <div className="sm:w-2/3">
                          {renderFieldValue(field)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-12 text-center bg-white border border-gray-200 dark:bg-gray-900 dark:border-gray-800 rounded-md shadow-sm">
            <AlertCircle
              size={48}
              className="mx-auto mb-4 text-gray-300 dark:text-gray-700"
            />
            <p className="text-lg font-bold text-gray-500">
              No form data found.
            </p>
          </div>
        )}

        {tickets && tickets.length > 0 && (
          <div>
            <h3 className="flex items-center gap-2 mb-4 text-lg font-bold text-gray-900 dark:text-white">
              <FileText size={20} className="text-yellow-600 dark:text-yellow-500" /> Issued Tickets
            </h3>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {tickets.map((ticket, idx) => (
                <div
                  key={ticket.id}
                  className="p-4 bg-white border border-gray-200 dark:bg-gray-900 dark:border-gray-800 rounded-md shadow-sm"
                >
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100">
                      {ticket.subject || `Ticket ${idx + 1}`}
                    </h4>
                    <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700">
                      {ticket.status || "Unknown"}
                    </span>
                  </div>
                  <p className="mb-3 text-xs truncate text-gray-600 dark:text-gray-400">
                    Scope: {ticket.scope || "N/A"}
                  </p>
                  <div className="flex justify-between items-center text-[10px] text-gray-500">
                    <span>By: {ticket.leadAuditorName?.split(" ")[0]}</span>
                    <span>{formatDate(ticket.createdAt)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {comments && comments.length > 0 && (
          <div>
            <h3 className="flex items-center gap-2 mb-4 text-lg font-bold text-gray-900 dark:text-white">
              <MessageSquare size={20} className="text-blue-700 dark:text-blue-500" /> Auditor
              Comments
            </h3>
            <div className="space-y-3">
              {comments.map((comment, idx) => (
                <div
                  key={idx}
                  className="flex gap-4 p-4 bg-white border border-gray-200 dark:bg-gray-900 dark:border-gray-800 rounded-md shadow-sm"
                >
                  <div className="flex items-center justify-center w-8 h-8 text-blue-700 bg-blue-100 rounded-full dark:bg-blue-900/30 dark:text-blue-400 shrink-0">
                    <User size={14} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-bold text-gray-900 dark:text-gray-100">
                        {comment.creator || "Auditor"}
                      </span>
                      <span className="text-xs text-gray-400">
                        • {formatDate(comment.timestamp)}
                      </span>
                    </div>
                    <p className="text-sm whitespace-pre-wrap text-gray-600 dark:text-gray-400">
                      {comment.text}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between p-4 border-t shrink-0 border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50">
        <div className="flex items-center gap-3 ml-auto">
          <button
            onClick={onClose}
            className="px-6 py-2.5 text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
          >
            Close
          </button>
          <button
            onClick={handleDownloadPDF}
            disabled={downloading}
            className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-semibold text-white bg-blue-700 rounded-md hover:bg-blue-800 disabled:opacity-60 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
          >
            {downloading ? (
              <span className="inline-flex items-center gap-2">
                <div className="w-4 h-4 border-2 rounded-full border-white/30 border-t-white animate-spin"></div>
                Generating...
              </span>
            ) : (
              <>
                <Download size={16} /> Download PDF
              </>
            )}
          </button>
        </div>
      </div>
    </FadePopUp>
  );

  return createPortal(modalContent, document.body);
}
