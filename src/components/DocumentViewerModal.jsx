import React from "react";
import FadePopUp from "./FadePopUp";
import { X, Download, Maximize2, ExternalLink, FileText, Info } from "lucide-react";

export default function DocumentViewerModal({ isOpen, onClose, fileUrl, fileName, fileType }) {
  if (!isOpen) return null;

  const isImage = fileUrl?.match(/\.(jpeg|jpg|gif|png|webp|svg)$/i) || fileType?.includes('image');
  const isPdf = fileUrl?.match(/\.(pdf)$/i) || fileType?.includes('pdf');

  return (
    <FadePopUp
      isOpen={isOpen}
      onClose={onClose}
      overlayClassName="fixed inset-0 z-[99999] flex items-center justify-center p-4 sm:p-6 bg-gray-900/90 backdrop-blur-sm"
      className="relative z-10 w-full max-w-6xl h-[90vh] rounded-md bg-gray-950 shadow-2xl flex flex-col overflow-hidden border border-gray-800"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-800 bg-gray-900 shrink-0">
        <div className="flex items-center gap-4 overflow-hidden">
          <div className="flex items-center justify-center w-12 h-12 text-gray-300 bg-gray-800 border border-gray-700 rounded-md shrink-0">
            {isImage ? <Maximize2 size={24} /> : <FileText size={24} />}
          </div>
          <div className="min-w-0">
            <h2 className="text-base font-bold leading-tight text-gray-100 truncate">
              {fileName || "Document Viewer"}
            </h2>
            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500 truncate mt-1">
              {isImage ? "Image Preview" : isPdf ? "PDF Document" : "File Preview"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0 ml-4">
          <a
            href={fileUrl}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-gray-300 transition-colors bg-gray-800 border border-gray-700 rounded-md hover:bg-gray-700 hover:text-white"
            title="Open in new tab"
          >
            <ExternalLink size={14} />
            <span className="hidden sm:inline">Open in new tab</span>
          </a>
          <button
            onClick={onClose}
            className="p-2.5 text-gray-400 transition-colors rounded-md hover:bg-gray-800 hover:text-white bg-transparent"
          >
            <X size={20} />
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-auto bg-gray-950 flex items-center justify-center p-4">
        {isImage ? (
          <img
            src={fileUrl}
            alt={fileName || "Document"}
            className="max-w-full max-h-full object-contain rounded-md shadow-lg"
          />
        ) : isPdf ? (
          <div className="w-full h-full flex flex-col gap-4">
            <div className="flex items-start gap-3 p-3 bg-blue-900/20 border border-blue-800/50 rounded-md shrink-0">
              <Info size={18} className="text-blue-400 mt-0.5 shrink-0" />
              <div className="text-sm text-blue-200">
                <p className="font-semibold text-blue-300 mb-0.5">Is the preview blocked?</p>
                <p className="text-blue-200/80">
                  Some websites (like w3.org) have strict security policies that block embedding. If you see a browser error below, click the <strong className="text-blue-100">Open in new tab</strong> button at the top right to view the document securely.
                </p>
              </div>
            </div>
            <iframe
              src={`${fileUrl}#toolbar=0`}
              className="flex-1 w-full border-0 rounded-md bg-white shadow-lg"
              title={fileName || "PDF Viewer"}
            />
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center text-center max-w-md mx-auto p-8">
            <div className="w-24 h-24 bg-gray-800 rounded-full flex items-center justify-center mb-6 text-gray-400 border border-gray-700">
              <FileText size={48} />
            </div>
            <h3 className="text-xl font-bold text-gray-100 mb-3">No Preview Available</h3>
            <p className="text-gray-400 text-sm mb-8 leading-relaxed">
              This file type cannot be previewed directly in the browser. You can open it in a new tab to download or view it with a supported application.
            </p>
            <a
              href={fileUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold text-gray-950 transition-all bg-gray-100 border border-transparent rounded-md hover:bg-white hover:scale-105"
            >
              <Download size={16} /> Download File
            </a>
          </div>
        )}
      </div>
    </FadePopUp>
  );
}
