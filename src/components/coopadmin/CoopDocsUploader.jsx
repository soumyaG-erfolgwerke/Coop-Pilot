"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { FileText, UploadCloud, Trash2, Folder, ChevronDown, ChevronRight, Loader2, X, AlertCircle, Search, Filter, Calendar} from "lucide-react";
import { getDocumentsofCoop, uploadDocuments } from "@/lib/coopService";
import DocumentCard from "../ui/DocumentCard";
import dynamic from "next/dynamic";

const ViewerContent = dynamic(() => import("../fileViewer"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center p-12 w-full h-full min-h-[300px]">
      <div className="w-8 h-8 border-4 rounded-full border-primary/20 border-t-primary animate-spin"></div>
    </div>
  ),
});

const CATEGORIES = [
  "SATZUNG",
  "NIEDERSCHRIFTEN",
  "BEITRITTSERKLÄRUNGEN",
  "FINANZEN",
  "PRÜFUNGSBERICHTE",
  "KORRESPONDENZ",
  "KYC",
  "SONSTIGES",
];

const CustomToggle = ({ checked, onChange, label, disabled }) => (
  <label className={`flex items-center gap-3 ${disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer group"}`}>
    <div className="relative flex items-center">
      <input
        type="checkbox"
        className="sr-only"
        checked={checked}
        disabled={disabled}
        onChange={(e) => !disabled && onChange(e.target.checked)}
      />
      <div
        className={`block w-10 h-5 rounded-full transition-colors duration-300 shadow-inner ${
          checked ? "bg-primary" : "bg-slate-200 dark:bg-slate-700"
        }`}
      ></div>
      <div
        className={`absolute left-1 top-1 bg-white w-3 h-3 rounded-full transition-transform duration-300 shadow-sm ${
          checked ? "translate-x-5" : "translate-x-0"
        }`}
      ></div>
    </div>
    <span className="text-sm font-semibold transition-colors select-none text-slate-700 dark:text-slate-300 group-hover:text-primary dark:group-hover:text-primary-dark">
      {label}
    </span>
  </label>
);

const allowedTypes = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document", 
  "application/vnd.ms-excel", 
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", 
];

export default function CoopDocsUploader({ coopId, userId }) {
  const [documents, setDocuments] = useState([]);
  const [uploadedDocs, setUploadedDocs] = useState({});
  const [uploading, setUploading] = useState(false);
  const [loadingDocs, setLoadingDocs] = useState(false);
  const [openCategory, setOpenCategory] = useState(null);
  const [viewingDoc, setViewingDoc] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("ALL");
  const [filterDate, setFilterDate] = useState("");

  const fileInputRef = useRef(null);

  const fetchDocs = async () => {
    setLoadingDocs(true);
    try {
      const res = await getDocumentsofCoop(coopId);
      setUploadedDocs(res.grouped || {});
    } catch (err) {
      toast.error(err.message || "Failed to load documents");
    } finally {
      setLoadingDocs(false);
    }
  };

  useEffect(() => {
    if (coopId) fetchDocs();
  }, [coopId]);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const MAX_SIZE = 25 * 1024 * 1024;

    if (!allowedTypes.includes(file.type)) {
      toast.error("Invalid file type");
      return;
    }

    if (file.size > MAX_SIZE) {
      toast.error(`"${file.name}" exceeds the 25MB limit.`);
      return;
    }

    const newDoc = {
      file,
      category: "",
      subCategory: "",
      visibleToMembers: false,
      downloadAllowed: false,
      effectiveFrom: "",
      id: Math.random().toString(36).substr(2, 9),
    };

    setDocuments([newDoc]);

    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removePendingDoc = (idToRemove) => {
    setDocuments((prev) => prev.filter((doc) => doc.id !== idToRemove));
  };

  const updateDoc = (id, field, value) => {
    setDocuments((prev) =>
      prev.map((doc) => {
        if (doc.id !== id) return doc;
        
        const updatedDoc = { ...doc, [field]: value };
        if (field === "category" && value === "SATZUNG") {
          updatedDoc.visibleToMembers = true;
        }
        return updatedDoc;
      }),
    );
  };

  const toggleCategory = (cat) => {
    setOpenCategory(openCategory === cat ? null : cat);
  };

  const handleUpload = async () => {
    if (!documents.length) {
      toast.error("Please select a file first");
      return;
    }

    const doc = documents[0];

    if (!doc.category) {
      toast.error(`Category is required for ${doc.file.name}`);
      return;
    }

    if (doc.category === "SATZUNG" && !doc.effectiveFrom) {
      toast.error("Effective date is required for SATZUNG documents");
      return;
    }

    setUploading(true);

    try {
      const payload = {
        ...doc,
        coopId,
        uploadedBy: userId,
      };

      await uploadDocuments(payload);

      toast.success("Document uploaded successfully");

      setDocuments([]);
      await fetchDocs();
    } catch (err) {
      toast.error(err.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = (docToDownload) => {
    if (!docToDownload.fileUrl) return;
    const link = document.createElement("a");
    link.href = docToDownload.fileUrl;
    link.download = docToDownload.fileName || "document";
    link.target = "_blank";
    link.click();
  };

  const filteredGroupedDocs = useMemo(() => {
    const flattened = [];
    Object.entries(uploadedDocs).forEach(([cat, docs]) => {
      docs.forEach((doc) => flattened.push({ ...doc, category: cat }));
    });

    const filtered = flattened.filter((doc) => {
      if (searchTerm && !doc.fileName?.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }
      if (filterCategory !== "ALL" && doc.category !== filterCategory) {
        return false;
      }
      if (filterDate) {
        const dateObj = new Date(doc.uploadedAt || doc.$createdAt);
        const localDateStr = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}-${String(dateObj.getDate()).padStart(2, '0')}`;
        if (localDateStr !== filterDate) {
          return false;
        }
      }
      return true;
    });

    const grouped = {};
    filtered.forEach((doc) => {
      if (!grouped[doc.category]) grouped[doc.category] = [];
      grouped[doc.category].push(doc);
    });
    
    Object.keys(grouped).forEach((cat) => {
      if (cat === "SATZUNG") {
        grouped[cat].sort((a, b) => {
          const dateA = a.effectiveFrom ? new Date(a.effectiveFrom).getTime() : 0;
          const dateB = b.effectiveFrom ? new Date(b.effectiveFrom).getTime() : 0;
          return dateB - dateA;
        });
      } else {
        grouped[cat].sort((a, b) => {
          const dateA = new Date(a.uploadedAt || a.$createdAt || 0).getTime();
          const dateB = new Date(b.uploadedAt || b.$createdAt || 0).getTime();
          return dateB - dateA;
        });
      }
    });

    return grouped;
  }, [uploadedDocs, searchTerm, filterCategory, filterDate]); 

  const categoriesToDisplay = filterCategory === "ALL" ? CATEGORIES : [filterCategory];

  return (
    <div className="max-w-6xl p-4 mx-auto space-y-12 sm:p-6 lg:p-8">
      <div className="flex flex-col justify-between gap-4 pb-6 border-b md:flex-row md:items-center border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Document Center
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1.5">
            Manage cooperative statutes, financial reports, and correspondence.
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

      <section className="space-y-6">
        <h2 className="flex items-center gap-3 text-xl font-bold text-slate-900 dark:text-white">
          <div className="p-2 bg-primary/10 dark:bg-primary/20 text-primary dark:text-primary-dark rounded-xl">
            <UploadCloud className="w-5 h-5" />
          </div>
          Upload New Documents
        </h2>

        <div
          onClick={() => fileInputRef.current?.click()}
          className="relative flex flex-col items-center justify-center w-full p-10 transition-all duration-300 border-2 border-dashed cursor-pointer group bg-primary/5 dark:bg-primary/10 border-primary/20 dark:border-primary/30 rounded-3xl hover:bg-primary/10 dark:hover:bg-primary/20"
        >
          <input
            type="file"
            onChange={handleFileChange}
            className="hidden"
            ref={fileInputRef}
            accept=".pdf,.docx,.jpg,.jpeg,.png,.xlsx,.xls"
          />
          <div className="p-4 mb-4 transition-transform duration-300 bg-white rounded-full shadow-sm dark:bg-slate-800 ring-1 ring-primary/20 dark:ring-primary/30 group-hover:scale-110">
            <UploadCloud className="w-8 h-8 text-primary dark:text-primary-dark" />
          </div>
          <div>
            <p className="mb-1 text-base font-bold text-center transition-colors text-slate-900 dark:text-white group-hover:text-primary">
              Click to browse or drag files here
            </p>
            <p className="text-sm text-center text-slate-500 dark:text-slate-400">
              Supports PDF,XLSX ,DOCX, JPG, PNG (Max 25MB per file)
            </p>
          </div>
        </div>

        <AnimatePresence>
          {documents.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-6 space-y-5 overflow-hidden"
            >
              {documents.map((doc) => (
                <motion.div
                  key={doc.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="relative p-6 transition-all bg-white border shadow-sm dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:shadow-md rounded-2xl group"
                >
                  <button
                    onClick={() => removePendingDoc(doc.id)}
                    className="absolute p-2 transition-colors top-5 right-5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl"
                    title="Remove file"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>

                  <div className="flex items-center gap-4 pr-12 mb-6">
                    <div className="p-3 bg-primary/10 dark:bg-primary/20 text-primary dark:text-primary-dark rounded-xl">
                      <FileText className="w-6 h-6" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-base font-bold truncate text-slate-900 dark:text-white">
                        {doc.file.name}
                      </p>
                      <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                        {(doc.file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-5 mb-6 md:grid-cols-2">
                    <div className="space-y-2">
                      <label className="text-xs font-bold tracking-wider uppercase text-slate-500 dark:text-slate-400">
                        Category <span className="text-primary">*</span>
                      </label>
                      <select
                        value={doc.category}
                        onChange={(e) =>
                          updateDoc(doc.id, "category", e.target.value)
                        }
                        className="w-full px-4 py-3 text-sm font-medium transition-all border outline-none bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/50"
                      >
                        <option value="">Select Category</option>
                        {CATEGORIES.map((cat) => (
                          <option key={cat} value={cat}>
                            {cat}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold tracking-wider uppercase text-slate-500 dark:text-slate-400">
                        Subcategory
                      </label>
                      <input
                        type="text"
                        placeholder="Optional description"
                        value={doc.subCategory}
                        onChange={(e) =>
                          updateDoc(doc.id, "subCategory", e.target.value)
                        }
                        className="w-full px-4 py-3 text-sm font-medium transition-all border outline-none bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/50 placeholder:font-normal"
                      />
                    </div>
                    {doc.category === "SATZUNG" && (
  <div className="space-y-2">
    <label className="text-xs font-bold tracking-wider uppercase text-slate-500 dark:text-slate-400">
      Effective Date & Time <span className="text-primary">*</span>
    </label>
    <input
      type="datetime-local"
      min={new Date(new Date().setDate(new Date().getDate() + 1)).toISOString().slice(0, 16)}
      value={doc.effectiveFrom || ""}
      onChange={(e) =>
        updateDoc(doc.id, "effectiveFrom", e.target.value)
      }
      className="w-full px-4 py-3 text-sm font-medium transition-all border outline-none bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/50"
    />
  </div>
)}
                  </div>

                  <div className="flex flex-col gap-6 pt-5 border-t sm:flex-row border-slate-100 dark:border-slate-800">
                    <CustomToggle
                      checked={doc.category === "SATZUNG" ? true : doc.visibleToMembers}
                      disabled={doc.category === "SATZUNG"}
                      onChange={(val) =>
                        updateDoc(doc.id, "visibleToMembers", val)
                      }
                      label="Visible to Members"
                    />
                    <CustomToggle
                      checked={doc.downloadAllowed}
                      onChange={(val) =>
                        updateDoc(doc.id, "downloadAllowed", val)
                      }
                      label="Allow Downloading"
                    />
                  </div>
                </motion.div>
              ))}

              <div className="flex justify-end pt-2">
                <button
                  onClick={handleUpload}
                  disabled={uploading}
                  className="flex items-center gap-2 px-8 py-3.5 bg-primary text-white text-sm font-bold rounded-xl shadow-md shadow-primary/20 hover:bg-primary-dark hover:shadow-primary/30 hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:transform-none disabled:shadow-none focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary dark:focus:ring-offset-slate-900"
                >
                  {uploading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" /> Processing
                      Upload...
                    </>
                  ) : (
                    <>
                      <UploadCloud className="w-5 h-5" /> Upload File
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      <section className="space-y-6">
        <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
              <Folder className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              Cooperative Repository
            </h2>
          </div>
        </div>

        {!loadingDocs && Object.keys(uploadedDocs).length > 0 && (
          <div className="flex flex-col gap-4 p-4 mb-6 bg-white border shadow-sm sm:flex-row dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-2xl">
            <div className="relative flex-1">
              <Search className="absolute w-5 h-5 -translate-y-1/2 left-3 top-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search by document name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 text-slate-900 dark:text-white transition-all"
              />
              {searchTerm && (
                <button onClick={() => setSearchTerm("")} className="absolute -translate-y-1/2 right-3 top-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            
            <div className="relative sm:w-56 shrink-0">
              <Filter className="absolute w-5 h-5 -translate-y-1/2 left-3 top-1/2 text-slate-400" />
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="w-full pl-10 pr-10 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 text-slate-900 dark:text-white appearance-none cursor-pointer transition-all"
              >
                <option value="ALL">All Categories</option>
                {CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
              <ChevronDown className="absolute w-4 h-4 -translate-y-1/2 pointer-events-none right-3 top-1/2 text-slate-400" />
            </div>

            <div className="relative sm:w-48 shrink-0">
              <Calendar className="absolute w-5 h-5 -translate-y-1/2 left-3 top-1/2 text-slate-400" />
              <input
                type="date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 text-slate-900 dark:text-white transition-all cursor-pointer"
              />
            </div>
          </div>
        )}

        {loadingDocs ? (
          <div className="flex flex-col items-center justify-center gap-4 py-16 bg-white border shadow-sm text-slate-500 dark:text-slate-400 dark:bg-slate-900 rounded-3xl border-slate-200 dark:border-slate-800">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="font-medium">Syncing repository...</p>
          </div>
        ) : Object.keys(uploadedDocs).length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed bg-slate-50/50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 rounded-3xl">
            <div className="flex items-center justify-center w-16 h-16 mb-4 bg-white rounded-full shadow-sm dark:bg-slate-800">
              <Folder className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="mb-1 text-lg font-bold text-slate-900 dark:text-white">
              No Documents Found
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Upload documents above to populate the repository.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {categoriesToDisplay.map((category) => {
              const docs = filteredGroupedDocs[category] || [];

              const groupedBySub = docs.reduce((acc, doc) => {
                const key =
                  doc.subCategory && doc.subCategory.trim() !== ""
                    ? doc.subCategory
                    : "GENERAL";
                if (!acc[key]) acc[key] = [];
                acc[key].push(doc);
                return acc;
              }, {});

              const isOpen = openCategory === category;

              return (
                <div
                  key={category}
                  className="overflow-hidden transition-all duration-300 bg-white border shadow-sm dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-2xl"
                >
                  <button
                    onClick={() => toggleCategory(category)}
                    className="flex items-center justify-between w-full p-5 text-left transition-colors sm:px-6 hover:bg-slate-50 dark:hover:bg-slate-800/50 focus:outline-none"
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-2 rounded-lg bg-primary/10 dark:bg-primary/20 text-primary dark:text-primary-dark">
                        <Folder className="w-5 h-5" />
                      </div>
                      <span className="text-base font-bold tracking-wide text-slate-900 dark:text-white">
                        {category}
                      </span>
                      <span className="flex items-center justify-center min-w-[28px] h-7 px-2.5 text-xs font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded-full">
                        {docs.length}
                      </span>
                    </div>
                    <div className="p-1 transition-transform duration-300 text-slate-400 dark:text-slate-500">
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
                        <div className="flex flex-col gap-8 p-5 border-t border-slate-100 dark:border-slate-800 sm:p-6 bg-slate-50/30 dark:bg-slate-900/50">
                          {Object.entries(groupedBySub).length === 0 ? (
                            <div className="py-8 text-center">
                              <p className="text-sm font-medium text-slate-400 dark:text-slate-500">
                                No documents found for this category/filter.
                              </p>
                            </div>
                          ) : (
                            Object.entries(groupedBySub).map(
                              ([sub, subDocs]) => (
                                <div key={sub}>
                                  {sub !== "GENERAL" && (
                                    <div className="flex items-center gap-3 mb-5">
                                      <h4 className="text-[10px] font-bold text-primary dark:text-primary-dark uppercase tracking-widest bg-primary/10 dark:bg-primary/20 px-3 py-1 rounded-full border border-primary/20 dark:border-primary/30">
                                        <Folder className="w-3 h-3 inline-block mr-1.5 -mt-0.5" />
                                        {sub}
                                      </h4>
                                      <div className="flex-1 h-px bg-primary/20 dark:bg-primary/30"></div>
                                    </div>
                                  )}

                                  <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
                                    {subDocs.map((doc) => (
                                      <DocumentCard
                                        key={doc.$id}
                                        doc={doc}
                                        onView={setViewingDoc}
                                        onDownload={handleDownload}
                                      />
                                    ))}
                                  </div>
                                </div>
                              ),
                            )
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
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
              className="relative w-full max-w-5xl h-[85vh] bg-white dark:bg-slate-900 rounded-3xl shadow-2xl flex flex-col overflow-hidden"
            >
              <div className="z-20 flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="truncate">
                    <h3 className="text-base font-bold truncate text-slate-900 dark:text-white">
                      {viewingDoc.fileName}
                    </h3>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => setViewingDoc(null)}
                    className="p-2 transition-colors rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-200 dark:hover:bg-slate-800 dark:hover:text-slate-200"
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
