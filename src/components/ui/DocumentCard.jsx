"use client";

import { getViewUrl } from "@/lib/fileUrlService";
import { guessMimeType } from "@/lib/guessMimeType";
import { FileText, Calendar, User, Eye, Download, EyeOff, Ban, Share2, Lock, Plus } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";

export default function DocumentCard({
  doc,
  onView,
  isMember,
}) {
  const [registryInput, setRegistryInput] = useState("");
  const [saving, setSaving] = useState(false);
  
  const [localRegistryRef, setLocalRegistryRef] = useState(doc.registerEntryRef || "");

  const handleAddRegistry = async () => {
    if (!registryInput.trim()) return;

    setSaving(true);

    try {
      const res = await fetch("/api/coops/docServices", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          documentId: doc.$id,
          coopId: doc.coopId,
          registerEntryRef: registryInput,
        }),
      });

      const data = await res.json();

      if (!data.success) throw new Error(data.error);

      toast.success("Registry entry added");
      setLocalRegistryRef(registryInput);
      setRegistryInput("");

    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      key={doc.$id}
      className="flex flex-col h-full overflow-hidden transition-all duration-300 bg-white border rounded-lg shadow-sm dark:bg-slate-900 border-slate-300 dark:border-slate-700 hover:shadow-lg hover:-translate-y-1 hover:border-primary/40 dark:hover:border-primary-dark/40 group"
    >
      <div className="flex flex-col flex-1 gap-5 p-5">
        
        <div className="flex items-start gap-4">
          <div className="p-3 transition-transform duration-300 bg-gradient-to-br from-primary/10 to-primary/5 dark:from-primary/20 dark:to-primary-dark/20 text-primary dark:text-primary-dark rounded-xl shrink-0 group-hover:scale-110">
            <FileText className="w-6 h-6" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 
              className="text-base font-semibold truncate text-slate-900 dark:text-slate-100" 
              title={doc.fileName}
            >
              {doc.fileName}
            </h3>
            <div className="flex items-center gap-1.5 mt-1 text-xs text-slate-500 dark:text-slate-400">
              <Calendar className="w-3.5 h-3.5" />
              <span>
                {new Date(doc.uploadedAt).toLocaleString("de-DE", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit"
                })}
              </span>
            </div>
          </div>
        </div>

        {!isMember && <div className="flex flex-wrap gap-2">
          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide border ${
            doc.visibleToMembers 
              ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20" 
              : "bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700"
          }`}>
            {doc.visibleToMembers ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
            {doc.visibleToMembers ? "Visible" : "Hidden"}
          </span>

          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide border ${
            doc.downloadAllowed 
              ? "bg-primary/10 text-primary border-primary/20 dark:bg-primary/10 dark:text-primary-dark dark:border-primary/20" 
              : "bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700"
          }`}>
            {doc.downloadAllowed ? <Download className="w-3 h-3" /> : <Ban className="w-3 h-3" />}
            {doc.downloadAllowed ? "Downloadable" : "No Download"}
          </span>

          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide border ${
            doc.sharedWithMembers 
              ? "bg-primary/10 text-primary border-primary/20 dark:bg-primary/10 dark:text-primary-dark dark:border-primary/20" 
              : "bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700"
          }`}>
            {doc.sharedWithMembers ? <Share2 className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
            {doc.sharedWithMembers ? "Shared with members" : "Not shared"}
          </span>
        </div>}

        {doc.category === "SATZUNG" && (
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
            <div className="flex flex-col gap-0.5">
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Version {doc.version}
              </span>
              {doc.effectiveFrom && (
                <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                  Effective: {new Date(doc.effectiveFrom).toLocaleDateString()}
                </span>
              )}
            </div>
            <div>
              {doc.effectiveFrom && new Date() < new Date(doc.effectiveFrom) ? (
                <span className="px-2.5 py-1 bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400 text-[10px] font-bold tracking-wider uppercase rounded-md">
                  Upcoming
                </span>
              ) : doc.isCurrent ? (
                <span className="px-2.5 py-1 bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary-dark text-[10px] font-bold tracking-wider uppercase rounded-md">
                  Current
                </span>
              ) : (
                <span className="px-2.5 py-1 bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-400 text-[10px] font-bold tracking-wider uppercase rounded-md">
                  Archiviert
                </span>
              )}
            </div>
          </div>
        )}

        {(doc.referenceYear || doc.referenceId || localRegistryRef || !localRegistryRef) && (
          <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
            {doc.referenceYear && (
              <div className="flex flex-col">
                <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase">Ref Year</span>
                <span className="text-xs font-medium text-slate-900 dark:text-slate-200">{doc.referenceYear}</span>
              </div>
            )}
            {doc.referenceId && (
              <div className="flex flex-col min-w-0">
                <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase">Ref ID</span>
                <span className="text-xs font-medium truncate text-slate-900 dark:text-slate-200" title={doc.referenceId}>
                  {doc.referenceId}
                </span>
              </div>
            )}
            {!isMember && doc.category === 'SATZUNG' && (
              <div className="flex flex-col col-span-2 pt-2 mt-1 border-t border-slate-200 dark:border-slate-700/50">
                <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase">Register Entry</span>
                <div className="mt-1">
                  {localRegistryRef ? (
                    <span className="text-xs font-medium text-slate-900 dark:text-slate-200 truncate block bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-1.5 rounded-md">
                      {localRegistryRef}
                    </span>
                  ) : (
                    <div className="flex items-center gap-2 group/input">
                      <input
                        type="text"
                        placeholder="Enter registry reference..."
                        value={registryInput}
                        onChange={(e) => setRegistryInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleAddRegistry();
                        }}
                        className="flex-1 px-3 py-1.5 text-xs rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all placeholder:text-slate-400"
                      />

                      <button
                        onClick={handleAddRegistry}
                        disabled={saving || !registryInput.trim()}
                        className="flex items-center justify-center gap-1 px-3 py-1.5 text-xs font-semibold bg-primary text-white rounded-md hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
                      >
                        {saving ? (
                          "Saving..."
                        ) : (
                          <>
                            <Plus className="w-3.5 h-3.5" /> Add
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {doc.uploadedByProfile && (
          <div className="flex items-center gap-3 pt-2 mt-auto">
            <div className="flex items-center justify-center w-8 h-8 border rounded-full bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 shrink-0">
              <User className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold truncate text-slate-900 dark:text-slate-200">
                {doc.uploadedByProfile.salutation} {doc.uploadedByProfile.firstName} {doc.uploadedByProfile.lastName}
              </p>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate mt-0.5">
                ID: {doc.uploadedBy}
              </p>
            </div>
          </div>
        )}

      </div>

      <div className="flex gap-3 p-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
        <button
          onClick={() => onView({
            fileName: doc.fileName,
            fileUrl: getViewUrl(doc.fileId),
            mimeType: doc.mimeType || guessMimeType(doc.fileName),
            downloadAllowed: doc.downloadAllowed
          })}
          className="flex items-center justify-center flex-1 gap-2 px-4 py-2 text-sm font-medium transition-colors bg-white border rounded-lg shadow-sm text-slate-700 dark:text-slate-200 dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-200 dark:focus:ring-slate-700"
        >
          <Eye className="w-4 h-4" /> View
        </button>
      </div>
    </div>
  );
}