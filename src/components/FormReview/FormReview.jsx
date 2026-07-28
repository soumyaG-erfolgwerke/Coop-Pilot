"use client";

import React, { useState, useCallback } from "react";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Eye,
  CheckCircle2,
  XCircle,
  FileText,
  Download,
  AlertTriangle,
  Paperclip,
  ShieldAlert,
  Search,
  ExternalLink,
} from "lucide-react";
import DocumentViewerModal from "../DocumentViewerModal";

const extractAnswersFromSchema = (schema) => {
  const answers = {};
  schema?.phases?.forEach((phase) => {
    phase.fields?.forEach((field) => {
      if (field.answer !== undefined && field.answer !== null) {
        answers[field.fieldId] = field.answer;
      } else {
        switch (field.componentType) {
          case "checkbox":
            answers[field.fieldId] = false;
            break;
          case "checkbox_group":
            answers[field.fieldId] = [];
            break;
          default:
            answers[field.fieldId] = "";
        }
      }
    });
  });
  return answers;
};

export default function FormReview({ audit }) {
  const [currentPhase, setCurrentPhase] = useState(0);
  const [viewerFile, setViewerFile] = useState(null);
  const [formData] = useState(() => extractAnswersFromSchema(audit));

  if (!audit || !audit.phases || !audit.phases.length) return null;

  const totalPhases = audit.phases.length;
  const phase = audit.phases[currentPhase];
  const progress = ((currentPhase + 1) / totalPhases) * 100;

  const isFieldVisible = useCallback(
    (field) => {
      if (!field.showWhen) return true;
      return formData[field.showWhen.fieldId] === field.showWhen.equals;
    },
    [formData],
  );

  const goNext = () => {
    if (currentPhase < totalPhases - 1) {
      setCurrentPhase(currentPhase + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const goPrevious = () => {
    if (currentPhase > 0) {
      setCurrentPhase(currentPhase - 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const renderAnswer = (field) => {
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
        return (
          <div className="flex items-center gap-2">
            {field.answer ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-sm font-bold border border-green-200 dark:border-green-800">
                <CheckCircle2 size={16} /> Yes
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-sm font-bold border border-gray-200 dark:border-gray-700">
                <XCircle size={16} /> No
              </span>
            )}
          </div>
        );

      case "checkbox_group":
      case "multi_select":
        const answersArray = Array.isArray(field.answer)
          ? field.answer
          : [field.answer];
        return (
          <div className="flex flex-wrap gap-2">
            {answersArray.map((ans, i) => (
              <span
                key={i}
                className="inline-flex items-center px-2.5 py-1 rounded-md bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-sm font-semibold border border-gray-200 dark:border-gray-700"
              >
                {ans}
              </span>
            ))}
          </div>
        );

      case "file":
      case "doc_upload":
      case "file_upload": {
        const files = Array.isArray(field.answer) ? field.answer : [field.answer];
        return (
          <div className="flex flex-col gap-2">
            {files.map((f, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setViewerFile(f)}
                className="inline-flex items-center text-left gap-3 p-2.5 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 transition-all max-w-sm group"
              >
                <div className="flex items-center justify-center w-8 h-8 text-blue-600 rounded bg-blue-50 dark:bg-blue-900/30 dark:text-blue-400 shrink-0 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/50 transition-colors">
                  <Paperclip size={16} />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-sm font-medium truncate text-gray-700 dark:text-gray-300 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {f.fileName || "View Document"}
                  </span>
                  <span className="text-[10px] text-gray-500 uppercase tracking-wider">
                    {f.fileExtension || "FILE"}
                  </span>
                </div>
                <ExternalLink size={14} className="ml-auto text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            ))}
          </div>
        );
      }

      case "textarea":
        return (
          <div className="max-w-3xl text-sm font-medium leading-relaxed whitespace-pre-wrap p-3 border rounded-md bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300">
            {String(field.answer)}
          </div>
        );

      default:
        return (
          <span className="text-base font-semibold text-gray-900 dark:text-gray-100">
            {String(field.answer)}
          </span>
        );
    }
  };

  return (
    <div className="flex flex-col items-start w-full gap-3 lg:flex-row lg:gap-4 animate-fadeIn mt-3">
      {/* SIDEBAR: Document Index */}
      <div className="z-10 flex flex-col w-full gap-3 lg:w-72 shrink-0 lg:sticky lg:top-4">
        <div className="p-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-md shadow-sm">
          <div className="mb-2 text-[10px] font-bold uppercase tracking-wider text-gray-500">
            <span>Review Progress</span>
            <span className="float-right text-blue-600">{Math.round(progress)}%</span>
          </div>
          <div className="h-1.5 overflow-hidden bg-gray-200 dark:bg-gray-800 rounded-full">
            <div
              className="h-full transition-all duration-700 ease-out rounded-full bg-blue-600"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-md shadow-sm p-3">
          <h3 className="text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2 px-2">
            Document Index
          </h3>
          <div className="flex flex-col gap-1 relative">
            <div className="absolute left-[20px] top-4 bottom-4 w-px bg-gray-200 dark:bg-gray-700 z-0"></div>
            {audit.phases.map((phaseItem, index) => {
              const isActive = currentPhase === index;
              const isCompleted = index < currentPhase;

              return (
                <button
                  key={phaseItem.phaseId}
                  onClick={() => setCurrentPhase(index)}
                  className={`group relative z-10 flex items-center gap-3 p-1.5 text-sm font-medium rounded-md transition-all text-left ${
                    isActive
                      ? "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300"
                      : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                  }`}
                >
                  {isCompleted ? (
                    <div className="flex items-center justify-center w-7 h-7 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 border border-green-200 dark:border-green-800 shrink-0">
                      <Check size={14} strokeWidth={3} />
                    </div>
                  ) : (
                    <div
                      className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold shrink-0 border
                        ${
                          isActive
                            ? "bg-blue-600 border-blue-600 text-white"
                            : "bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-600 text-gray-500"
                        }
                      `}
                    >
                      {index + 1}
                    </div>
                  )}
                  <span className="truncate">{phaseItem.title}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="flex flex-col flex-1 w-full min-w-0 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-md shadow-sm">
        <div className="p-4 sm:p-5 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center gap-3 mb-2">
            <span className="inline-flex items-center px-2.5 py-1 text-xs font-bold uppercase tracking-wider text-blue-700 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400 rounded-md">
              Section {currentPhase + 1} of {totalPhases}
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
            {phase.title}
          </h2>
          {phase.description && (
            <p className="max-w-2xl mt-1 text-sm text-gray-500 dark:text-gray-400">
              {phase.description}
            </p>
          )}
        </div>

        <div className="divide-y divide-gray-100 dark:divide-gray-800/60 p-4 sm:p-5">
          {phase.fields.filter(isFieldVisible).map((field, index) => {
            const isTextArea = field.componentType === "textarea";

            return (
              <div
                key={field.fieldId}
                className={`py-4 flex flex-col ${isTextArea ? "gap-2" : "md:flex-row md:items-start gap-3 md:gap-6"} first:pt-0 last:pb-0`}
              >
                <div
                  className={`${isTextArea ? "w-full" : "md:w-5/12 lg:w-1/3"} shrink-0`}
                >
                  <div className="flex items-start gap-3">
                    <p className="text-sm font-semibold leading-snug text-gray-700 dark:text-gray-300">
                      {field.label}
                    </p>
                  </div>
                </div>

                <div
                  className={`${isTextArea ? "w-full pl-7" : "md:w-7/12 lg:w-2/3"} min-w-0`}
                >
                  {renderAnswer(field)}
                </div>
              </div>
            );
          })}
        </div>

        {/* Actions panel */}
        <div className="p-4 sm:p-6 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 flex flex-col sm:flex-row items-center justify-between gap-4 rounded-b-md">
          <button
            type="button"
            onClick={goPrevious}
            disabled={currentPhase === 0}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-800 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
          >
            <ChevronLeft size={16} /> Previous
          </button>

          {currentPhase === totalPhases - 1 ? (
            <div className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 text-sm font-bold text-green-700 bg-green-100 border border-green-200 rounded-md dark:bg-green-900/30 dark:border-green-800 dark:text-green-400">
              <CheckCircle2 size={16} /> End of Document
            </div>
          ) : (
            <button
              type="button"
              onClick={goNext}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 text-sm font-semibold text-white transition-colors bg-blue-700 border border-transparent rounded-md hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
            >
              Next Section <ChevronRight size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Document Viewer Modal */}
      <DocumentViewerModal
        isOpen={!!viewerFile}
        onClose={() => setViewerFile(null)}
        fileUrl={viewerFile?.url || viewerFile?.fileUrl}
        fileName={viewerFile?.fileName}
        fileType={viewerFile?.fileExtension}
      />
    </div>
  );
}
