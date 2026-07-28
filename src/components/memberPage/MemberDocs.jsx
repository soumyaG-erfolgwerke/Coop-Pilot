"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Folder, ChevronDown, ChevronRight, X, ShieldCheck, Download, FileText, CheckCircle, Building, Search, Filter, Calendar,} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import DocumentCard from "../ui/DocumentCard";
import AuditList from "../auditLogs/AuditList";
import { getFilebyUserId } from "@/lib/getfileDetails";
import { getDocumentsofCoop } from "@/lib/coopService";
import { useAuth } from "@/hooks/useAuth";
import dynamic from "next/dynamic";

const ViewerContent = dynamic(() => import("../fileViewer"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center p-12 w-full h-full min-h-[300px]">
      <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
    </div>
  ),
});

const DOCUMENT_CATEGORIES = [
  "SATZUNG",
  "NIEDERSCHRIFTEN",
  "BEITRITTSERKLÄRUNGEN",
  "FINANZEN",
  "PRÜFUNGSBERICHTE",
  "KORRESPONDENZ",
  "KYC",
  "SONSTIGES",
];

export default function DocumentRepositoryView({ coops = [] }) {
  const { user } = useAuth();

  const [coopDocs, setCoopDocs] = useState([]);
  const [kycDocs, setKycDocs] = useState([]);
  const [selectedCoopId, setSelectedCoopId] = useState(null);
  const [openCategory, setOpenCategory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [viewingDoc, setViewingDoc] = useState(null);
  const [auditLogs, setAuditLogs] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("ALL");
  const [filterDate, setFilterDate] = useState("");
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!coops || coops.length === 0) return;
    setSelectedCoopId(coops[0]?.coopId);
  }, [coops]);

  useEffect(() => {
    if (!user?.$id || !selectedCoopId) {
      setLoading(false);
      return;
    }

    const loadAll = async () => {
      try {
        setLoading(true);

        const [kycRes, coopRes, auditRes] = await Promise.all([
          getFilebyUserId(user.$id),
          getDocumentsofCoop(selectedCoopId, user.$id),
          fetch(
            `/api/auditLogs?coopId=${selectedCoopId}&userId=${user.$id}`
          ),
        ]);

        if (kycRes?.success) {
          const normalized = (kycRes.data || []).map((d) => ({
            $id: d.id || d.$id,
            fileName: d.fileName,
            fileUrl: d.fileUrl,
            fileId: d.fileId,
            mimeType: d.mimeType,
            fileSize: d.fileSize,
            uploadedAt: d.uploadedAt,
            visibleToMembers: true,
            downloadAllowed: true,
          }));
          setKycDocs(normalized);
        }

        if (coopRes?.success) {
          const normalized = coopRes.documents.map((d) => ({
            ...d,
            fileUrl: `/api/fileServices/view?fileId=${d.fileId}`,
          }));
          setCoopDocs(normalized);
        }

        const auditData = await auditRes.json();
        if (auditData?.success) {
          setAuditLogs(auditData.logs);
        }
      } catch (err) {
        console.error("Doc load error:", err);
        setError("We encountered an issue loading your documents. Please try refreshing the page.");
      } finally {
        setLoading(false);
      }
    };

    loadAll();
  }, [user?.$id, selectedCoopId]);

  const filteredDocs = useMemo(() => {
    return coopDocs.filter((doc) => {
      if (doc.category === "SATZUNG" && doc.isCurrent !== true) {
        return false;
      }

      if (
        searchTerm &&
        !doc.fileName?.toLowerCase().includes(searchTerm.toLowerCase())
      ) {
        return false;
      }

      if (filterCategory !== "ALL" && doc.category !== filterCategory) {
        return false;
      }

      if (filterDate) {
        const docDate = new Date(doc.uploadedAt || doc.$createdAt)
          .toISOString()
          .split("T")[0];

        if (docDate !== filterDate) {
          return false;
        }
      }

      return true;
    });
  }, [coopDocs, searchTerm, filterCategory, filterDate]);

  const groupedCoop = useMemo(() => {
    return filteredDocs.reduce((acc, doc) => {
      if (!acc[doc.category]) acc[doc.category] = {};

      const sub = doc.subCategory || "GENERAL";

      if (!acc[doc.category][sub]) {
        acc[doc.category][sub] = [];
      }

      acc[doc.category][sub].push(doc);

      return acc;
    }, {});
  }, [filteredDocs]);

  const toggleCategory = (cat) => {
    setOpenCategory(openCategory === cat ? null : cat);
  };

  const handleDownload = (doc) => {
    if (!doc.downloadAllowed) return;
    if (doc.fileUrl.includes("/view")) {
      window.open(doc.fileUrl.replace("/view", "/download"));
    } else {
      window.open(doc.fileUrl);
    }
  };

  const categoriesToDisplay =
    filterCategory === "ALL" ? DOCUMENT_CATEGORIES : [filterCategory];

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] space-y-4">
        <div className="w-12 h-12 border-4 border-indigo-600/20 border-t-indigo-600 rounded-full animate-spin"></div>
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400 animate-pulse">
          Loading document repository...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] space-y-4">
        <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl">
          <X className="w-8 h-8 mb-2 mx-auto" />
          <p className="text-sm font-medium text-center">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
      <div className="flex flex-col gap-2 pb-3 border-b border-slate-200 dark:border-slate-800">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Document Repository
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Access and manage your cooperative's official documents and your
          personal KYC records securely.
        </p>
      </div>

      <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/50 rounded-xl p-3 flex items-start sm:items-center gap-3 shadow-sm">
        <div className="p-2 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-500 rounded-lg shrink-0">
          <CheckCircle className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-medium text-emerald-900 dark:text-emerald-400 flex items-center gap-2">
            <Building className="w-4 h-4 shrink-0 text-emerald-700 dark:text-emerald-500" />
            <span className="shrink-0">Active Cooperative:</span>
            <span className="font-bold truncate" title={coops[0]?.name}>
              {coops[0]?.name || "None selected"}
            </span>
          </h3>
        </div>
      </div>

      <section className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-xl shadow-sm">
            <Folder className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Cooperative Library
          </h2>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 bg-white dark:bg-slate-900 p-4 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm">
          <div className="flex-1 relative">
            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by document name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-slate-900 dark:text-white transition-all"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="sm:w-56 relative shrink-0">
            <Filter className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="w-full pl-10 pr-10 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-slate-900 dark:text-white appearance-none cursor-pointer transition-all"
            >
              <option value="ALL">All Categories</option>
              {DOCUMENT_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>

          <div className="sm:w-48 relative shrink-0">
            <Calendar className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-slate-900 dark:text-white transition-all cursor-pointer"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {categoriesToDisplay.map((cat) => {
            const categoryData = groupedCoop[cat] || {};
            const isOpen = openCategory === cat;
            const totalDocs = Object.values(categoryData).flat().length;

            return (
              <div
                key={cat}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300"
              >
                <button
                  onClick={() => toggleCategory(cat)}
                  className="w-full flex justify-between items-center p-5 sm:px-6 text-left hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors focus:outline-none"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-500 dark:text-indigo-400 rounded-lg">
                      <Folder className="w-5 h-5" />
                    </div>
                    <span className="text-base font-bold text-slate-900 dark:text-white tracking-wide">
                      {cat}
                    </span>
                    <span className="flex items-center justify-center min-w-[28px] h-7 px-2.5 text-xs font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded-full">
                      {totalDocs}
                    </span>
                  </div>
                  <div className="p-1 text-slate-400 dark:text-slate-500 transition-transform duration-300">
                    {isOpen ? (
                      <ChevronDown size={20} />
                    ) : (
                      <ChevronRight size={20} />
                    )}
                  </div>
                </button>

                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: "easeInOut" }}
                    >
                      <div className="border-t border-slate-100 dark:border-slate-800 p-5 sm:p-6 bg-slate-50/30 dark:bg-slate-900/50 flex flex-col gap-8">
                        {Object.entries(categoryData).length === 0 ? (
                          <div className="text-center py-8">
                            <p className="text-sm font-medium text-slate-400 dark:text-slate-500">
                              No documents found for this category/filter.
                            </p>
                          </div>
                        ) : (
                          Object.entries(categoryData).map(([sub, docs]) => (
                            <div key={sub}>
                              {sub !== "GENERAL" && (
                                <div className="flex items-center gap-3 mb-5">
                                  <h4 className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest bg-indigo-50 dark:bg-indigo-900/30 px-3 py-1 rounded-full border border-indigo-100 dark:border-indigo-800/30">
                                    <Folder className="w-3 h-3 inline-block mr-1.5 -mt-0.5" />
                                    {sub}
                                  </h4>
                                  <div className="flex-1 h-px bg-indigo-100 dark:bg-indigo-900/30"></div>
                                </div>
                              )}

                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                                {docs.map((doc) => (
                                  <DocumentCard
                                    isMember
                                    key={doc.$id}
                                    doc={doc}
                                    onView={setViewingDoc}
                                  />
                                ))}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </section>

      <section className="space-y-6 pt-4 border-t border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-xl shadow-sm">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            My KYC Documents
          </h2>
        </div>

        {kycDocs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 bg-white dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-700 rounded-3xl">
            <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4 shadow-sm">
              <ShieldCheck className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">
              No KYC Documents Found
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 text-center max-w-sm">
              Your personal KYC verification documents will appear here once
              uploaded.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {kycDocs.map((doc) => (
              <DocumentCard
                isMember
                key={doc.$id}
                doc={doc}
                onView={setViewingDoc}
              />
            ))}
          </div>
        )}
      </section>

      <AnimatePresence>
        {viewingDoc && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm"
              onClick={() => setViewingDoc(null)}
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-5xl h-[85vh] bg-white dark:bg-slate-900 rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-slate-200 dark:border-slate-800"
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80 z-20 shrink-0">
                <div className="flex items-center gap-4 overflow-hidden">
                  <div className="p-2.5 bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 rounded-xl shrink-0">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div className="truncate">
                    <h3 className="text-base font-bold text-slate-900 dark:text-white truncate">
                      {viewingDoc.fileName}
                    </h3>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {viewingDoc.downloadAllowed && (
                    <button
                      onClick={() => handleDownload(viewingDoc)}
                      className="p-2.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-slate-800 dark:hover:text-indigo-400 rounded-xl transition-colors"
                      title="Download File"
                    >
                      <Download size={20} />
                    </button>
                  )}
                  <button
                    onClick={() => setViewingDoc(null)}
                    className="p-2.5 text-slate-400 hover:text-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 dark:hover:text-white rounded-xl transition-colors bg-slate-100 dark:bg-slate-800/50"
                    title="Close Viewer"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>

              <div className="flex-1 min-h-0 relative w-full h-full overflow-hidden bg-gray-100 dark:bg-slate-950">
                <ViewerContent
                  doc={viewingDoc}
                  onClose={() => setViewingDoc(null)}
                  onDownload={handleDownload}
                />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <section className="space-y-6 pt-4 border-t border-slate-200 dark:border-slate-800">
        <AuditList
          logs={auditLogs}
          currentUserId={user.$id}
          title="Repository Activity"
          actionsFilter={["UPLOAD_DOC", "SATZUNG_VERSION_UPDATE"]}
        />
      </section>
    </div>
  );
}
