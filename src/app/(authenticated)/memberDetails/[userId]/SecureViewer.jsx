"use client";

import React, { useState, useEffect, useRef } from "react";
import { 
  FileText, 
  FileImage, 
  File 
} from "lucide-react";
import * as pdfjsLib from "pdfjs-dist";

// Set up the worker for pdf.js using the local bundled worker
// This ensures Next.js bundles the worker with your app instead of fetching from a CDN
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).toString();

const PDFPage = ({ page, scale }) => {
  const canvasRef = useRef(null);
  const renderTaskRef = useRef(null);

  useEffect(() => {
    const renderPage = async () => {
      if (!page || !canvasRef.current) return;
      
      // Cancel any ongoing render task
      if (renderTaskRef.current) {
        renderTaskRef.current.cancel();
      }

      const canvas = canvasRef.current;
      const context = canvas.getContext("2d");
      
      // Calculate the output scale (DPI) for high-resolution screens
      const outputScale = window.devicePixelRatio || 1;
      
      // Render the PDF at the higher resolution
      const viewport = page.getViewport({ scale: scale * outputScale });

      canvas.width = viewport.width;
      canvas.height = viewport.height;
      
      // Use CSS to scale it back down to the correct visual size
      canvas.style.width = `${viewport.width / outputScale}px`;
      canvas.style.height = `${viewport.height / outputScale}px`;

      const renderContext = {
        canvasContext: context,
        viewport: viewport,
      };

      const renderTask = page.render(renderContext);
      renderTaskRef.current = renderTask;

      try {
        await renderTask.promise;
      } catch (err) {
        if (err.name === "RenderingCancelledException") {
          // Expected when a new render starts
        } else {
          console.error("Render Error:", err);
        }
      }
    };

    renderPage();

    return () => {
      if (renderTaskRef.current) {
        renderTaskRef.current.cancel();
      }
    };
  }, [page, scale]);

  return (
    <div className="mb-8 overflow-hidden bg-white border border-gray-300 rounded-sm shadow-2xl">
      <canvas ref={canvasRef} />
    </div>
  );
};

const SecureViewer = ({ doc }) => {
  const [pages, setPages] = useState([]);
  const [scale, setScale] = useState(1.0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPDF = async () => {
      if (!doc || !doc.mimeType?.includes("pdf")) return;
      
      try {
        setLoading(true);
        // Using getDocument with the file URL directly
        const loadingTask = pdfjsLib.getDocument({
          url: doc.fileUrl,
          // Disable range requests for simpler fetching in development
          disableRange: true,
          disableStream: true
        });
        
        const pdf = await loadingTask.promise;
        
        const loadedPages = [];
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          loadedPages.push(page);
        }
        setPages(loadedPages);
      } catch (err) {
        console.error("Custom PDF Load Error:", err);
      } finally {
        setLoading(false);
      }
    };

    loadPDF();
  }, [doc]);

  if (!doc) return (
    <div className="flex flex-col items-center justify-center h-full p-12 italic text-gray-400 border-2 border-gray-200 border-dashed bg-gray-50 dark:bg-slate-900/50 rounded-xl dark:border-slate-800">
      <File className="w-12 h-12 mb-2 opacity-20" />
      <p>No document attached to this application attempt.</p>
    </div>
  );

  const isImage = doc.mimeType?.toLowerCase().includes("image");
  const isPDF = doc.mimeType?.toLowerCase().includes("pdf");

  return (
    <div className="relative flex flex-col w-full mt-4 overflow-hidden bg-white border border-gray-200 shadow-xl dark:bg-slate-950 rounded-xl dark:border-slate-800">
      {/* Viewer Header / Toolbar */}
      <div className="sticky top-0 z-20 flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-gray-50 dark:bg-slate-900 dark:border-slate-800">
        <div className="flex items-center gap-3 overflow-hidden">
          {isPDF ? <FileText className="text-red-500" size={20} /> : <FileImage className="text-blue-500" size={20} />}
          <div className="flex flex-col truncate">
            <p className="text-sm font-bold text-gray-900 truncate dark:text-white">{doc.fileName}</p>
            {doc.documentType && (
              <span className="text-[10px] font-bold tracking-wider text-gray-500 uppercase dark:text-gray-400">
                {doc.documentType}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4">
          {isPDF && (
            <div className="flex items-center gap-2 px-2 py-1 bg-white border border-gray-200 rounded-lg shadow-sm dark:bg-slate-800 dark:border-slate-700">
              <button 
                onClick={() => setScale(prev => Math.max(0.5, prev - 0.1))}
                className="p-1 text-gray-600 rounded hover:bg-gray-100 dark:hover:bg-slate-700 dark:text-gray-400"
              >
                <span className="text-lg font-bold">−</span>
              </button>
              <span className="w-12 text-xs font-bold text-center text-gray-700 dark:text-gray-300">
                {Math.round(scale * 100)}%
              </span>
              <button 
                onClick={() => setScale(prev => Math.min(2.0, prev + 0.1))}
                className="p-1 text-gray-600 rounded hover:bg-gray-100 dark:hover:bg-slate-700 dark:text-gray-400"
              >
                <span className="text-lg font-bold">+</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Viewer Content Area */}
      <div className="flex-grow min-h-[500px] max-h-[800px] overflow-auto bg-gray-200 dark:bg-slate-950 flex flex-col items-center p-6 custom-scrollbar relative">
        {loading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-gray-100 dark:bg-slate-950">
            <div className="w-8 h-8 border-4 rounded-full border-primary border-t-transparent animate-spin" />
          </div>
        )}

        {isImage ? (
          <img
            src={doc.fileUrl}
            alt={doc.fileName}
            onLoad={() => setLoading(false)}
            className="object-contain h-auto max-w-full rounded-lg shadow-2xl"
          />
        ) : isPDF ? (
          <div className="flex flex-col items-center gap-6">
            {pages.map((page, index) => (
              <PDFPage key={`page_${index + 1}`} page={page} scale={scale} />
            ))}
          </div>
        ) : (
          <div className="p-8 text-center bg-white border border-gray-200 shadow-sm dark:bg-slate-900 rounded-xl dark:border-slate-800">
            <p className="mb-4 text-gray-500">Preview not available for this format.</p>
            <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer" className="font-bold underline text-primary">Open in new tab</a>
          </div>
        )}
      </div>

      {/* Viewer Footer (Page Info) */}
      {isPDF && pages.length > 0 && (
        <div className="px-4 py-2 bg-gray-50 dark:bg-slate-900 border-t border-gray-200 dark:border-slate-800 flex justify-center text-[10px] font-bold text-gray-500 uppercase tracking-widest">
          {pages.length} Page{pages.length > 1 ? 's' : ''} Loaded 
        </div>
      )}
    </div>
  );
};

export default SecureViewer;
