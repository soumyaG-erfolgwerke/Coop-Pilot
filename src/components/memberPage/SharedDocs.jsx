"use client";

import { useEffect, useMemo, useState } from "react";
import {Eye, Download, Users, User, FileText, X, Folder, Clock, Building, CheckCircle} from "lucide-react";
import { getViewUrl } from "@/lib/fileUrlService";
import AuditList from "../auditLogs/AuditList";
import toast from "react-hot-toast";
import { AnimatePresence, motion } from "framer-motion";
import dynamic from "next/dynamic";

const ViewerContent = dynamic(() => import("../fileViewer"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center p-12 w-full h-full min-h-[300px]">
      <div className="w-8 h-8 border-4 border-indigo-600/20 border-t-indigo-600 rounded-full animate-spin"></div>
    </div>
  ),
});

export default function SharedDocs({ userId, coops }) {
  const [groups, setGroups] = useState([]);
  const [directDocs, setDirectDocs] = useState([]);
  const [selectedCoop, setSelectedCoop] = useState(null);
  const [selectedGroup, setSelectedGroup] = useState("ALL");
  const [viewingDoc, setViewingDoc] = useState(null);
  const [loading, setLoading] = useState(true);
  const [auditLogs, setAuditLogs] = useState([]);

  useEffect(() => {
    if (!coops || coops.length === 0) return;
    setSelectedCoop(coops[0]);
  }, [coops]);

  useEffect(() => {
    if (!userId || !selectedCoop?.coopId) return;

    const fetchAllData = async () => {
      try {
        setLoading(true);

        const [docsRes, auditRes] = await Promise.all([
          fetch(`/api/coops/groups/members?userId=${userId}&coopId=${selectedCoop.coopId}`).then(r => r.json()),
          fetch(`/api/auditLogs?coopId=${selectedCoop.coopId}&userId=${userId}&role=member`).then(r => r.json())
        ]);

        if (!docsRes.success) throw new Error(docsRes.error);
        if (!auditRes.success) throw new Error(auditRes.error);

        setGroups(docsRes.groups || []);
        setDirectDocs(docsRes.direct || []);
        setAuditLogs(auditRes.logs || []);
      } catch (err) {
        console.error(err);
        toast.error("Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
  }, [userId, selectedCoop?.coopId]);

  useEffect(() => {
    if (!userId || !selectedCoop) return;

    const fetchAuditLogs = async () => {
      try {
        const res = await fetch(
          `/api/auditLogs?coopId=${selectedCoop.coopId}&userId=${userId}`,
        );

        const data = await res.json();

        if (!data.success) throw new Error(data.error);

        setAuditLogs(data.logs || []);
      } catch (err) {
        console.error(err);
        toast.error("Failed to load activity logs");
      }
    };

    fetchAuditLogs();
  }, [userId, selectedCoop]);

  const allDocs = useMemo(() => {
    return [
      ...groups.flatMap((g) =>
        (g.documents || []).map((doc) => ({
          ...doc,
          source: "GROUP",
          groupName: g.groupName,
          groupId: g.groupId,
        }))
      ),
      ...directDocs.map((doc) => ({
        ...doc,
        source: "DIRECT",
      })),
    ];
  }, [groups, directDocs]);

  const filteredDocs = useMemo(() => {
    if (selectedGroup === "ALL") return allDocs;
    if (selectedGroup === "DIRECT") return allDocs.filter((d) => d.source === "DIRECT");
    return allDocs.filter((d) => d.groupId === selectedGroup);
  }, [allDocs, selectedGroup]);

  const handleDownload = (doc) => {
    if (!doc.downloadAllowed) {
      toast.error("Download not allowed");
      return;
    }
    const fileUrl = getViewUrl(doc.fileId);
    if (fileUrl.includes("/view")) {
      window.open(fileUrl.replace("/view", "/download"));
      toast.success("File downloaded successfully");
    } else {
      window.open(fileUrl);
      toast.success("File downloaded successfully");
    }
  };

  const handleView = (doc) => {
    setViewingDoc({
      fileName: doc.fileName,
      fileUrl: getViewUrl(doc.fileId),
      mimeType: doc.mimeType,
      fileId: doc.fileId,
      downloadAllowed: doc.downloadAllowed,
    });
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10, scale: 0.98 },
    show: { opacity: 1, y: 0, scale: 1 },
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 w-full">
        <div className="w-12 h-12 border-4 border-indigo-600/20 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
        <p className="text-sm font-medium text-gray-500 dark:text-gray-400 animate-pulse">
          Loading your shared documents...
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
      <div className="flex items-center gap-3 pb-4 border-b border-gray-200 dark:border-slate-800">
        <div className="p-2.5 bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 rounded-xl shadow-sm">
          <Folder className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
            Shared Documents
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Access documents securely shared directly with you or via your
            groups.
          </p>
        </div>
      </div>

      <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/50 rounded-xl p-3 flex items-start sm:items-center gap-3 shadow-sm">
        <div className="p-2 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-500 rounded-lg shrink-0">
          <CheckCircle className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-medium text-emerald-900 dark:text-emerald-400 flex items-center gap-2">
            <Building className="w-4 h-4 shrink-0 text-emerald-700 dark:text-emerald-500" />
            <span className="shrink-0">Active Cooperative:</span>
            <span className="font-bold truncate" title={selectedCoop?.name}>
              {selectedCoop?.name || "None selected"}
            </span>
          </h3>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
        <div className="lg:col-span-1 lg:sticky lg:top-8 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-sm space-y-2">
          <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4 px-1">
            Filter by Source
          </h3>

          <div className="flex-row relative max-h-80 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-400 dark:scrollbar-thumb-slate-600">
            <button
              onClick={() => setSelectedGroup("ALL")}
              className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${
                selectedGroup === "ALL"
                  ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/30"
                  : "bg-transparent text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800 border border-transparent"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Folder className="w-4 h-4" />
                All Documents
              </div>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] ${selectedGroup === "ALL" ? "bg-indigo-100 dark:bg-indigo-800/50 text-indigo-700 dark:text-indigo-300" : "bg-gray-100 dark:bg-slate-700 text-gray-500"}`}
              >
                {allDocs.length}
              </span>
            </button>

            <button
              onClick={() => setSelectedGroup("DIRECT")}
              className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${
                selectedGroup === "DIRECT"
                  ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/30"
                  : "bg-transparent text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800 border border-transparent"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <User className="w-4 h-4" />
                Directly Shared
              </div>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] ${selectedGroup === "DIRECT" ? "bg-indigo-100 dark:bg-indigo-800/50 text-indigo-700 dark:text-indigo-300" : "bg-gray-100 dark:bg-slate-700 text-gray-500"}`}
              >
                {directDocs.length}
              </span>
            </button>

            <div className="my-2 border-t border-gray-100 dark:border-slate-800"></div>

            {groups.map((g) => {
              const isActive = selectedGroup === g.groupId;
              return (
                <button
                  key={g.groupId}
                  onClick={() => setSelectedGroup(g.groupId)}
                  className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${
                    isActive
                      ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/30"
                      : "bg-transparent text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800 border border-transparent"
                  }`}
                >
                  <div className="flex items-center gap-2.5 truncate pr-2">
                    <Users className="w-4 h-4 shrink-0" />
                    <span className="truncate">{g.groupName}</span>
                  </div>
                  <span
                    className={`shrink-0 px-2 py-0.5 rounded-full text-[10px] ${isActive ? "bg-indigo-100 dark:bg-indigo-800/50 text-indigo-700 dark:text-indigo-300" : "bg-gray-100 dark:bg-slate-700 text-gray-500"}`}
                  >
                    {g.documents?.length || 0}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="lg:col-span-3">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
              {selectedGroup === "ALL"
                ? "All Shared Files"
                : selectedGroup === "DIRECT"
                  ? "Directly Shared Files"
                  : "Group Documents"}
            </h2>
          </div>

          {filteredDocs.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 bg-white dark:bg-slate-900 border border-dashed border-gray-300 dark:border-slate-700 rounded-2xl">
              <div className="p-4 bg-gray-50 dark:bg-slate-800 rounded-full mb-4">
                <FileText className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-base font-bold text-gray-900 dark:text-white mb-1">
                No documents found
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center max-w-sm">
                No files have been shared via this channel yet.
              </p>
            </div>
          ) : (
            <motion.div className="relative max-h-[22rem] border-b border-neutral-200 dark:border-neutral-700 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-400 dark:scrollbar-thumb-slate-600 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              <AnimatePresence mode="popLayout">
                {filteredDocs.map((doc) => (
                  <motion.div
                    key={`${doc.$id}-${doc.sharedAt}`}
                    variants={itemVariants}
                    initial="hidden"
                    animate="show"
                    exit="hidden"
                    layout
                    className="flex flex-col h-full bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl hover:shadow-md hover:border-indigo-200 dark:hover:border-indigo-800/50 transition-all duration-300 group overflow-hidden"
                  >
                    <div className="p-5 flex-1 flex flex-col gap-4">
                      <div className="flex items-start gap-4">
                        <div className="p-3 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-xl shrink-0 group-hover:scale-105 transition-transform duration-300">
                          <FileText className="w-6 h-6" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3
                            className="text-sm font-bold text-gray-900 dark:text-white truncate"
                            title={doc.fileName}
                          >
                            {doc.fileName}
                          </h3>
                          <div className="flex items-center gap-1.5 mt-1 text-xs text-gray-500 dark:text-gray-400">
                            <Clock className="w-3.5 h-3.5" />
                            <span>
                              {new Date(doc.sharedAt).toLocaleDateString(
                                "de-DE",
                              )}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2 mt-auto">
                        <span className="inline-flex items-center px-2 py-1 bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-300 rounded-md text-[10px] font-bold uppercase tracking-wider border border-gray-200 dark:border-slate-700">
                          {doc.category}
                        </span>

                        <span
                          className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border ${
                            doc.source === "DIRECT"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-900/30"
                              : "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-900/30"
                          }`}
                        >
                          {doc.source === "DIRECT" ? (
                            <User className="w-3 h-3" />
                          ) : (
                            <Users className="w-3 h-3" />
                          )}
                          {doc.source === "DIRECT" ? "Direct" : "Group"}
                        </span>
                      </div>

                      {doc.source !== "DIRECT" && (
                        <p className="text-[10px] font-semibold text-gray-400 truncate">
                          Shared via:{" "}
                          <span className="text-gray-600 dark:text-gray-300">
                            {doc.groupName}
                          </span>
                        </p>
                      )}
                    </div>

                    <div className="p-3 border-t border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-900/50 flex gap-3">
                      <button
                        onClick={() => handleView(doc)}
                        className="flex-1 flex justify-center items-center gap-2 px-4 py-2.5 text-xs font-bold text-gray-700 dark:text-gray-200 bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700 rounded-xl transition-colors border border-gray-200 dark:border-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-gray-300"
                      >
                        <Eye className="w-4 h-4" /> View
                      </button>

                      {doc.downloadAllowed && (
                        <button
                          onClick={() => handleDownload(doc)}
                          className="flex-1 flex justify-center items-center gap-2 px-4 py-2.5 text-xs font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-900/20 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 rounded-xl transition-colors border border-indigo-200 dark:border-indigo-800/30 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                          <Download className="w-4 h-4" /> Save
                        </button>
                      )}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          )}
        </div>
      </div>

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
              className="relative w-full max-w-5xl h-[85vh] bg-white dark:bg-slate-900 rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-gray-200 dark:border-slate-800"
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-slate-800 bg-gray-50/80 dark:bg-slate-900/80 z-20 shrink-0">
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="p-2.5 bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 rounded-xl shrink-0">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div className="truncate">
                    <h3 className="text-base font-bold text-gray-900 dark:text-white truncate">
                      {viewingDoc.fileName}
                    </h3>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {viewingDoc.downloadAllowed && (
                    <button
                      onClick={() => handleDownload(viewingDoc)}
                      className="p-2.5 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-slate-800 dark:hover:text-indigo-400 rounded-xl transition-colors"
                      title="Download File"
                    >
                      <Download size={20} />
                    </button>
                  )}
                  <button
                    onClick={() => setViewingDoc(null)}
                    className="p-2.5 text-gray-400 hover:text-gray-900 hover:bg-gray-200 dark:hover:bg-slate-800 dark:hover:text-white rounded-xl transition-colors bg-gray-100 dark:bg-slate-800/50"
                    title="Close Viewer"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>

              <div className="flex-1 min-h-0 relative w-full h-full overflow-hidden bg-gray-100 dark:bg-slate-950">
                <ViewerContent doc={viewingDoc} onDownload={handleDownload} />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="pt-8 mt-8 border-t border-slate-200 dark:border-slate-800">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Group Activity
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Recent events and document shares in your groups.
              </p>
            </div>
          </div>
          <AuditList
            logs={auditLogs}
            currentUserId={userId}
            title=""
            actionsFilter={["MEMBER_ADDED_TO_GROUP", "GROUP_DOC_SHARED"]}
          />
        </div>
      </div>
    </div>
  );
}
