"use client";

import { getDocumentsofCoop } from "@/lib/coopService";
import { getGroups } from "@/lib/groupService";
import { getMembersOfCoop } from "@/lib/transactionService";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
  Eye,
  Download,
  X,
  Share2,
  Send,
  FileText,
  Users,
  User,
  Loader2,
  Clock,
  AlertCircle,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { getViewUrl } from "@/lib/fileUrlService";
import dynamic from "next/dynamic";

const ViewerContent = dynamic(() => import("../fileViewer"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center p-12 w-full h-full min-h-[300px]">
      <div className="w-8 h-8 border-4 rounded-full border-primary/20 border-t-primary animate-spin"></div>
    </div>
  ),
});

const guessMimeType = (fileName = "") => {
  const ext = fileName.split(".").pop().toLowerCase();
  if (ext === "pdf") return "application/pdf";
  if (["jpg", "jpeg", "png", "gif"].includes(ext)) return `image/${ext}`;
  if (["doc", "docx"].includes(ext)) return "application/msword";
  if (["xls", "xlsx"].includes(ext)) return "application/vnd.ms-excel";
  return "";
};

export default function DocShare({ coopId, userId }) {
  const [documents, setDocuments] = useState([]);
  const [groups, setGroups] = useState([]);
  const [members, setMembers] = useState([]);
  const [sharedDocs, setSharedDocs] = useState([]);

  const [selectedDoc, setSelectedDoc] = useState("");
  const [selectedGroup, setSelectedGroup] = useState("");
  const [selectedUser, setSelectedUser] = useState("");
  const [viewingDoc, setViewingDoc] = useState(null);

  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);

  useEffect(() => {
    if (!coopId || !userId) {
      setPageLoading(false);
      return;
    }

    const fetchDocuments = async () => {
      try {
        const res = await getDocumentsofCoop(coopId, userId);

        const flatDocs = Object.values(res.grouped || {})
          .flat()
          .filter((doc) => !doc.isArchived);

        setDocuments(flatDocs);
      } catch {
        toast.error("Failed to fetch documents");
      }
    };

    const fetchGroups = async () => {
      try {
        const res = await getGroups(coopId);
        if (res.success) setGroups(res.data);
      } catch {
        toast.error("Failed to fetch groups");
      }
    };

    const fetchMembers = async () => {
      try {
        const res = await getMembersOfCoop(coopId);
        const formatted = res.map((m) => ({
          id: m.userId,
          name: m.membername || "Unknown",
        }));
        setMembers(formatted);
      } catch {
        toast.error("Failed to fetch members");
      }
    };

    const initLoad = async () => {
      setPageLoading(true);

      setDocuments([]);
      setGroups([]);
      setMembers([]);
      setSharedDocs([]);
      setSelectedDoc("");
      setSelectedGroup("");
      setSelectedUser("");
      setViewingDoc(null);

      await Promise.allSettled([
        fetchDocuments(),
        fetchGroups(),
        fetchMembers(),
        fetchSharedDocs(),
      ]);

      setPageLoading(false);
    };

    initLoad();
  }, [coopId, userId]);

    const fetchSharedDocs = async () => {
      try {
        const res = await fetch(
          `/api/coops/docServices/share?adminId=${userId}&coopId=${coopId}`,
          {
            credentials: "include",
          },
        );

        const data = await res.json();

        if (data.success) {
          const docsArray = data.documents || data.data || [];

          const normalized = Array.isArray(docsArray)
            ? docsArray.map((d) => ({
                ...d,
                fileUrl: `/api/fileServices/view?fileId=${d.fileId}`,
              }))
            : [];

          setSharedDocs(normalized);
        }
      } catch (err) {
        console.error(err);
        toast.error("Failed to fetch shared documents");
      }
    };

  const handleShare = async () => {
    try {
      if (!selectedDoc) throw new Error("Select a document");
      if (!selectedGroup && !selectedUser)
        throw new Error("Select group or member");

      setLoading(true);

      const payload = selectedGroup
        ? {
            documentId: selectedDoc,
            sharedWithType: "GROUP",
            groupId: selectedGroup,
            sharedBy: userId,
            coopId,
          }
        : {
            documentId: selectedDoc,
            sharedWithType: "USER",
            userId: selectedUser,
            sharedBy: userId,
            coopId,
          };

      const res = await fetch("/api/coops/docServices/share", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error);

      toast.success("Document shared successfully");

      fetchSharedDocs();

      setSelectedDoc("");
      setSelectedGroup("");
      setSelectedUser("");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = (doc) => {
    if (doc.fileId) {
      window.open(`/api/fileServices/download?fileId=${doc.fileId}`);
    } else if (doc.fileUrl) {
      window.open(doc.fileUrl.replace("/view", "/download"));
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0 },
  };

  return (
    <div className="p-4 mx-auto space-y-8 max-w-7xl sm:p-6 lg:p-8">
      <div className="flex items-center gap-3 pb-4 border-b border-gray-200 dark:border-slate-800">
        <div className="p-2.5 bg-primary/10 dark:bg-primary-dark/20 text-primary dark:text-primary-dark rounded-xl shadow-sm">
          <Share2 className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-gray-900 sm:text-3xl dark:text-white">
            Document Sharing
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Securely distribute cooperative documents to specific groups or
            individual members.
          </p>
        </div>
      </div>

      <div className="flex items-start gap-2 p-4 border bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800/50 rounded-xl sm:items-center">
        <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-500 shrink-0">
          <AlertCircle className="w-6 h-6" />
        </div>
        <div className="flex-1">
          <p className="text-xs text-amber-700 dark:text-amber-400/80 mt-0.5 font-medium">
            Please note: All document uploads, edits, and deletions made here
            will be applied strictly to this cooperative.
          </p>
        </div>
      </div>

      {pageLoading ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center w-full py-20"
        >
          <div className="flex flex-col items-center justify-center min-h-[200px] text-gray-500 dark:text-gray-400 gap-3">
            <div className="w-8 h-8 border-4 border-indigo-600 rounded-full border-t-transparent animate-spin"></div>
            <p>Loading sharing data...</p>
          </div>
        </motion.div>
      ) : (
        <div className="grid items-start grid-cols-1 gap-8 lg:grid-cols-3">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6 lg:col-span-1 lg:sticky lg:top-8"
          >
            <div className="p-6 bg-white border border-gray-200 shadow-sm dark:bg-slate-900 rounded-2xl dark:border-slate-800">
              <div className="flex items-center gap-2 mb-6">
                <Send className="w-5 h-5 text-primary" />
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                  Share a Document
                </h2>
              </div>

              <div className="space-y-5">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold tracking-wider text-gray-500 uppercase dark:text-gray-400">
                    Select Document <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={selectedDoc}
                    disabled={documents.length === 0}
                    onChange={(e) => setSelectedDoc(e.target.value)}
                    className="w-full px-4 py-3 text-sm font-medium text-gray-900 truncate transition-all border border-gray-200 outline-none bg-gray-50 dark:bg-slate-800 dark:border-slate-700 rounded-xl dark:text-white focus:ring-2 focus:ring-primary/50"
                  >
                    <option value="">Choose a document...</option>
                    {documents.map((doc) => (
                      <option
                        key={`${doc.$id}-${doc.shareInfo?.sharedAt}`}
                        value={doc.$id}
                      >
                        [{doc.category}] {doc.fileName}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="p-4 space-y-4 border border-gray-200 dark:border-slate-700 rounded-xl bg-gray-50/50 dark:bg-slate-800/30">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5" /> Share with Group
                    </label>
                    <select
                      value={selectedGroup}
                      onChange={(e) => {
                        setSelectedGroup(e.target.value);
                        setSelectedUser("");
                      }}
                      className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg text-sm font-medium text-gray-900 dark:text-white focus:ring-2 focus:ring-primary/50 outline-none transition-all"
                    >
                      <option value="">No Group Selected</option>
                      {groups.map((g) => (
                        <option key={g.$id} value={g.$id}>
                          {g.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-px bg-gray-200 dark:bg-slate-700"></div>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                      OR
                    </span>
                    <div className="flex-1 h-px bg-gray-200 dark:bg-slate-700"></div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5" /> Share with Member
                    </label>
                    <select
                      value={selectedUser}
                      onChange={(e) => {
                        setSelectedUser(e.target.value);
                        setSelectedGroup("");
                      }}
                      className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg text-sm font-medium text-gray-900 dark:text-white focus:ring-2 focus:ring-primary/50 outline-none transition-all"
                    >
                      <option value="">No Member Selected</option>
                      {members.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    onClick={handleShare}
                    disabled={
                      loading ||
                      !selectedDoc ||
                      (!selectedGroup && !selectedUser)
                    }
                    className="flex items-center justify-center w-full gap-2 px-4 py-3 text-sm font-bold text-white transition-all shadow-md bg-primary rounded-xl hover:bg-primary-dark shadow-primary/20 disabled:opacity-50 disabled:shadow-none"
                  >
                    {loading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Share2 className="w-4 h-4" />
                    )}
                    Share Document
                  </button>
                </div>
              </div>
            </div>
          </motion.div>

          <div className="space-y-4 lg:col-span-2">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                Active Shares
              </h2>
              <span className="px-3 py-1 text-xs font-bold text-gray-600 bg-gray-100 rounded-full dark:bg-slate-800 dark:text-gray-300">
                {sharedDocs.length} Total
              </span>
            </div>

            {sharedDocs.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-12 bg-white border border-gray-300 border-dashed dark:bg-slate-900 dark:border-slate-700 rounded-2xl">
                <div className="p-4 mb-4 rounded-full bg-gray-50 dark:bg-slate-800">
                  <FileText className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="mb-1 text-base font-bold text-gray-900 dark:text-white">
                  No documents shared yet
                </h3>
                <p className="max-w-sm text-sm text-center text-gray-500 dark:text-gray-400">
                  Use the form on the left to securely share documents with
                  groups or members.
                </p>
              </div>
            ) : (
              <div className="relative space-y-3 overflow-y-auto max-h-96 scrollbar-thin scrollbar-thumb-slate-400 dark:scrollbar-thumb-slate-600">
                <AnimatePresence>
                  {(Array.isArray(sharedDocs) ? sharedDocs : []).map(
                    (doc, index) => (
                      <motion.div
                        key={`${doc.$id}-${doc.shareInfo?.sharedAt}`}
                        variants={itemVariants}
                        initial="hidden"
                        animate="show"
                        exit="hidden"
                        layout
                        className="flex flex-col justify-between gap-4 p-4 transition-all duration-200 bg-white border border-gray-200 sm:flex-row sm:items-center sm:p-5 dark:bg-slate-900 dark:border-slate-800 rounded-2xl hover:shadow-md hover:border-primary/30 dark:hover:border-primary-dark/40 group"
                      >
                        <div className="flex items-start flex-1 min-w-0 gap-4">
                          <div className="p-3 transition-transform bg-primary/10 dark:bg-primary-dark/20 text-primary dark:text-primary-dark rounded-xl shrink-0 group-hover:scale-105">
                            <FileText className="w-5 h-5" />
                          </div>
                          <div className="min-w-0">
                            <h3
                              className="mb-1 text-sm font-bold text-gray-900 truncate dark:text-white"
                              title={doc.fileName}
                            >
                              {doc.fileName}
                            </h3>
                            <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-gray-500 dark:text-gray-400">
                              <span className="px-2 py-0.5 bg-gray-100 dark:bg-slate-800 rounded-md uppercase tracking-wider text-[10px] font-bold text-gray-600 dark:text-gray-300">
                                {doc.category}
                              </span>
                              <span>•</span>
                              <span className="flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5" />
                                {new Date(
                                  doc.uploadedAt || doc.$createdAt,
                                ).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col items-start w-full gap-4 pt-4 border-t border-gray-100 sm:flex-row sm:items-center sm:gap-6 sm:pt-0 sm:border-0 dark:border-slate-800 sm:w-auto shrink-0">
                          {doc.shareInfo && (
                            <div className="flex flex-col w-full gap-1 px-3 py-2 text-xs border rounded-lg bg-primary/5 dark:bg-primary-dark/10 border-primary/10 dark:border-primary-dark/30 sm:w-48">
                              <div className="flex items-center justify-between">
                                <span
                                  className="font-semibold truncate text-slate-900 dark:text-slate-100"
                                  title={doc.shareInfo.target}
                                >
                                  {doc.shareInfo.type === "GROUP" ? (
                                    <Users className="w-3 h-3 inline mr-1 -mt-0.5" />
                                  ) : (
                                    <User className="w-3 h-3 inline mr-1 -mt-0.5" />
                                  )}
                                  {doc.shareInfo.target}
                                </span>
                              </div>
                              <p className="text-[10px] text-primary/80 dark:text-primary-dark">
                                {new Date(
                                  doc.shareInfo.sharedAt,
                                ).toLocaleString([], {
                                  dateStyle: "short",
                                  timeStyle: "short",
                                })}
                              </p>
                            </div>
                          )}

                          <button
                            onClick={() => {
                              setViewingDoc({
                                fileName: doc.fileName,
                                fileUrl: getViewUrl(doc.fileId),
                                mimeType: doc.mimeType || guessMimeType(doc.fileName),
                                fileId: doc.fileId
                              });
                            }}
                            className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 py-2 bg-gray-50 dark:bg-slate-800 hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-300 text-xs font-bold rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-gray-200 border border-gray-200 dark:border-slate-700"
                          >
                            <Eye size={16} /> View
                          </button>
                        </div>
                      </motion.div>
                    ),
                  )}
                </AnimatePresence>
              </div>
            )}
          </div>
        </div>
      )}

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
              <div className="z-20 flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-slate-800 bg-gray-50/80 dark:bg-slate-900/80 shrink-0">
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="p-2.5 bg-primary/10 dark:bg-primary-dark/20 text-primary dark:text-primary-dark rounded-xl shrink-0">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div className="truncate">
                    <h3 className="text-base font-bold text-gray-900 truncate dark:text-white">
                      {viewingDoc.fileName}
                    </h3>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => setViewingDoc(null)}
                    className="p-2.5 text-gray-400 hover:text-gray-900 hover:bg-gray-200 dark:hover:bg-slate-800 dark:hover:text-white rounded-xl transition-colors bg-gray-100 dark:bg-slate-800/50"
                    title="Close Viewer"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>

              <div className="relative flex-1 w-full h-full min-h-0 overflow-hidden bg-gray-100 dark:bg-slate-950">
                <ViewerContent doc={viewingDoc} onDownload={handleDownload} />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
