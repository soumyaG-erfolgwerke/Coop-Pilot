"use client";

import { useState } from "react";
import {
  File,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Download,
  AlertCircle
} from "lucide-react";
import { Document, Page, pdfjs } from "react-pdf";

import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

export default function ViewerContent({ doc, onDownload }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null); // Added error state
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1.0);

  const isImage = doc?.mimeType?.toLowerCase().includes("image");
  const isPDF = doc?.mimeType?.toLowerCase().includes("pdf");

  const isDocx =
    doc?.mimeType?.includes("wordprocessingml") ||
    doc?.fileName?.toLowerCase().endsWith(".docx");

  const isXlsx =
    doc?.mimeType?.includes("spreadsheetml") ||
    doc?.fileName?.toLowerCase().endsWith(".xlsx");

  function onDocumentLoadSuccess({ numPages }) {
    setNumPages(numPages);
    setLoading(false);
    setError(null);
  }

  function onDocumentLoadError(err) {
    console.error("Failed to load PDF:", err);
    setLoading(false);
    setError("Failed to load the document. It may be broken or restricted.");
  }

  function changePage(offset) {
    setPageNumber((prev) => prev + offset);
  }

  function handleZoom(offset) {
    setScale((prev) => Math.min(Math.max(prev + offset, 0.5), 3));
  }

  const controlButtonClass = "p-1.5 hover:bg-gray-100 dark:hover:bg-slate-700 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed";

  if (!doc?.fileUrl) {
    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-500 bg-gray-50 dark:bg-slate-900">
        <File className="w-12 h-12 mb-3 opacity-20" />
        <p>File URL not available</p>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 w-full h-full bg-gray-100 dark:bg-slate-950">
      
      {loading && !error && (
        <div className="absolute inset-0 flex items-center justify-center z-10 bg-gray-100/80 dark:bg-slate-950/80 backdrop-blur-sm">
          <div className="w-8 h-8 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
        </div>
      )}

      {error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-red-500 z-20">
          <AlertCircle className="w-12 h-12 mb-3 opacity-50" />
          <p className="font-medium">{error}</p>
        </div>
      )}

      {isImage ? (
        <div className="absolute inset-0 p-4 flex items-center justify-center">
          <img
            src={doc.fileUrl}
            alt={doc.fileName}
            onLoad={() => setLoading(false)}
            onError={() => {
              setLoading(false);
              setError("Failed to load image.");
            }}
            className={`max-w-full max-h-full object-contain rounded shadow transition-opacity duration-300 ${
              loading ? "opacity-0" : "opacity-100"
            }`}
          />
        </div>

      ) : isPDF ? (
        <div className="absolute inset-0 overflow-auto flex flex-col items-center bg-gray-200/50 dark:bg-slate-900/50 pt-8 pb-28 px-4">
          <Document
            file={doc.fileUrl}
            onLoadSuccess={onDocumentLoadSuccess}
            onLoadError={onDocumentLoadError} 
            loading={null} 
            className="shadow-lg bg-white rounded"
          >
            <Page
              pageNumber={pageNumber}
              scale={scale}
              renderTextLayer
              renderAnnotationLayer
            />
          </Document>

          {!loading && !error && numPages && (
            <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 px-4 py-2 rounded-full flex items-center gap-4 shadow-xl border border-gray-200 dark:border-slate-700">
              <button onClick={() => changePage(-1)} disabled={pageNumber <= 1} className={controlButtonClass} aria-label="Previous Page">
                <ChevronLeft className="w-5 h-5" />
              </button>

              <span className="text-sm font-medium min-w-[3rem] text-center">
                {pageNumber} / {numPages}
              </span>

              <button onClick={() => changePage(1)} disabled={pageNumber >= numPages} className={controlButtonClass} aria-label="Next Page">
                <ChevronRight className="w-5 h-5" />
              </button>

              <div className="w-px h-6 bg-gray-300 dark:bg-slate-600 mx-1" />

              <button onClick={() => handleZoom(-0.25)} disabled={scale <= 0.5} className={controlButtonClass} aria-label="Zoom Out">
                <ZoomOut className="w-5 h-5" />
              </button>

              <span className="text-sm font-medium min-w-[3rem] text-center">
                {Math.round(scale * 100)}%
              </span>

              <button onClick={() => handleZoom(0.25)} disabled={scale >= 3} className={controlButtonClass} aria-label="Zoom In">
                <ZoomIn className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>

      ) : isDocx || isXlsx ? (
        <iframe
          src={`https://view.officeapps.live.com/op/view.aspx?src=${encodeURIComponent(doc.fileUrl)}`}
          onLoad={() => setLoading(false)}
          onError={() => {
            setLoading(false);
            setError("Failed to load Office viewer.");
          }}
          className={`absolute inset-0 w-full h-full border-0 bg-white transition-opacity duration-300 ${
            loading ? "opacity-0" : "opacity-100"
          }`}
          title={doc.fileName}
        />
        
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-500 p-6 text-center bg-gray-50 dark:bg-slate-900">
          <File className="w-16 h-16 mb-4 opacity-20" />
          <p className="mb-4 font-medium text-slate-700 dark:text-slate-300">Preview not supported</p>
          <p className="text-sm mb-6 max-w-sm">
            We cannot preview this file type in the browser. You can download it to view it locally.
          </p>

          {onDownload && (
            <button
              onClick={() => onDownload(doc)}
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg shadow transition-colors flex items-center"
            >
              <Download className="w-4 h-4 mr-2" />
              Download File
            </button>
          )}
        </div>
      )}
    </div>
  );
}