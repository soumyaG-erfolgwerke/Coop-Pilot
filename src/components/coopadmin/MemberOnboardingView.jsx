"use client";

import React, { useState, useEffect, useRef } from "react";
import toast from "react-hot-toast";
import {
  UserPlus,
  UploadCloud,
  Download,
  History,
  Loader2,
  ArrowUpRight,
  FileSpreadsheet,
  Trash2,
  Calendar,
  Mail,
  User,
  Hash,
  Coins
} from "lucide-react";

function getRelativeTime(isoDate) {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return "unknown time";

  const diffMs = date.getTime() - Date.now();
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;
  const week = 7 * day;

  const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

  if (Math.abs(diffMs) < minute) {
    return rtf.format(0, "second");
  }
  if (Math.abs(diffMs) < hour) {
    return rtf.format(Math.round(diffMs / minute), "minute");
  }
  if (Math.abs(diffMs) < day) {
    return rtf.format(Math.round(diffMs / hour), "hour");
  }
  if (Math.abs(diffMs) < week) {
    return rtf.format(Math.round(diffMs / day), "day");
  }
  return rtf.format(Math.round(diffMs / week), "week");
}

export default function MemberOnboardingView({ selectedCoop }) {
  const [activeTab, setActiveTab] = useState("solo"); // "solo" | "bulk"
  const [logs, setLogs] = useState([]);
  const [isLogsLoading, setIsLogsLoading] = useState(false);
  const [logsError, setLogsError] = useState("");

  // Solo state
  const [soloName, setSoloName] = useState("");
  const [soloEmail, setSoloEmail] = useState("");
  const [soloMembershipId, setSoloMembershipId] = useState("");
  const [soloShares, setSoloShares] = useState(1);
  const [soloJoinedDate, setSoloJoinedDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [isSoloSubmitting, setIsSoloSubmitting] = useState(false);

  // Bulk state
  const [bulkFile, setBulkFile] = useState(null);
  const [isDragActive, setIsDragActive] = useState(false);
  const [isBulkSubmitting, setIsBulkSubmitting] = useState(false);
  const fileInputRef = useRef(null);

  // Fetch Onboarding Logs
  const fetchLogs = async () => {
    if (!selectedCoop) return;
    setIsLogsLoading(true);
    setLogsError("");
    try {
      const response = await fetch(`/api/coop-admin/onboard-member?coopId=${selectedCoop}`);
      const res = await response.json();
      if (!response.ok) {
        throw new Error(res.error || "Failed to fetch logs");
      }
      setLogs(res.data || []);
    } catch (err) {
      console.error("Failed to load onboarding logs:", err);
      setLogsError(err.message || "Failed to load onboarding logs");
    } finally {
      setIsLogsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [selectedCoop]);

  // Solo Form Submit
  const handleSoloSubmit = async (e) => {
    e.preventDefault();
    if (!soloName || !soloEmail || !soloMembershipId || soloShares < 0 || !soloJoinedDate) {
      toast.error("Please fill in all required fields.");
      return;
    }

    setIsSoloSubmitting(true);
    try {
      const response = await fetch("/api/coop-admin/onboard-member", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          coopId: selectedCoop,
          name: soloName,
          email: soloEmail,
          membershipId: soloMembershipId,
          shares: soloShares,
          joinedDate: soloJoinedDate,
        }),
      });

      const res = await response.json();
      if (!response.ok) {
        throw new Error(res.error || "Failed to onboard member");
      }

      toast.success("Member onboarded successfully!");
      // Reset form
      setSoloName("");
      setSoloEmail("");
      setSoloMembershipId("");
      setSoloShares(1);
      setSoloJoinedDate(new Date().toISOString().split("T")[0]);

      // Refresh logs
      fetchLogs();
    } catch (err) {
      toast.error(err.message || "Onboarding failed");
    } finally {
      setIsSoloSubmitting(false);
    }
  };

  // Bulk Template Download
  const handleDownloadTemplate = () => {
    const csvContent = "Name,Email,MembershipId,shares,joining date(dd-mm-yyyy)\n";
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "digicoop_member_onboarding_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Template downloaded successfully");
  };

  // Bulk Uploader Drag Drop Handlers
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true);
    } else if (e.type === "dragleave") {
      setIsDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.name.endsWith(".csv") || file.type === "text/csv") {
        setBulkFile(file);
      } else {
        toast.error("Please drop a valid CSV file.");
      }
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.name.endsWith(".csv") || file.type === "text/csv") {
        setBulkFile(file);
      } else {
        toast.error("Please select a valid CSV file.");
      }
    }
  };

  // Bulk Upload Proceed
  const handleBulkSubmit = async () => {
    if (!bulkFile) {
      toast.error("Please upload or drag a CSV file first.");
      return;
    }

    setIsBulkSubmitting(true);
    const formData = new FormData();
    formData.append("file", bulkFile);
    formData.append("coopId", selectedCoop);

    try {
      const response = await fetch("/api/coop-admin/onboard-member", {
        method: "POST",
        body: formData,
      });

      const res = await response.json();
      if (!response.ok) {
        if (res.details && Array.isArray(res.details)) {
          throw new Error(`${res.error}:\n${res.details.slice(0, 5).join("\n")}${res.details.length > 5 ? `\n...and ${res.details.length - 5} more errors` : ""}`);
        }
        throw new Error(res.error || "Failed to process bulk onboarding");
      }

      if (res.warnings && Array.isArray(res.warnings)) {
        toast.success(res.message || "Bulk onboarding processed successfully!");
        toast(
          `Skipped duplicates: ${res.warnings.slice(0, 3).join(", ")}${res.warnings.length > 3 ? ` ...and ${res.warnings.length - 3} more` : ""}`,
          {
            icon: "⚠️",
            duration: 6000
          }
        );
      } else {
        toast.success(res.message || "Bulk onboarding processed successfully!");
      }
      setBulkFile(null);
      fetchLogs();
    } catch (err) {
      toast.error(err.message || "Bulk onboarding failed");
    } finally {
      setIsBulkSubmitting(false);
    }
  };

  return (
    <div className="p-4 space-y-6 sm:p-6 animate-fadeIn">
      {/* Page Header */}
      <div className="flex flex-col gap-1">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Member Onboarding
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Invite single members or batch onboard them via CSV upload.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Onboarding Input Panel */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 shadow-sm rounded-xl overflow-hidden flex flex-col h-fit">
            {/* Tab Header */}
            <div className="flex border-b border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900/50">
              <button
                onClick={() => setActiveTab("solo")}
                className={`flex-1 py-3.5 px-4 text-sm font-semibold border-b-2 flex items-center justify-center gap-2 transition-colors ${activeTab === "solo"
                  ? "border-blue-600 text-blue-600 dark:border-blue-500 dark:text-blue-400 bg-white dark:bg-slate-800"
                  : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100/50 dark:hover:bg-slate-800/50"
                  }`}
              >
                <UserPlus size={16} />
                Add Single Member
              </button>
              <button
                onClick={() => setActiveTab("bulk")}
                className={`flex-1 py-3.5 px-4 text-sm font-semibold border-b-2 flex items-center justify-center gap-2 transition-colors ${activeTab === "bulk"
                  ? "border-blue-600 text-blue-600 dark:border-blue-500 dark:text-blue-400 bg-white dark:bg-slate-800"
                  : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100/50 dark:hover:bg-slate-800/50"
                  }`}
              >
                <FileSpreadsheet size={16} />
                Bulk Onboarding (CSV)
              </button>
            </div>

            <div className="p-6">
              {/* Solo Onboarding Form */}
              {activeTab === "solo" && (
                <form onSubmit={handleSoloSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Full Name */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                        Full Name <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                          <User size={16} />
                        </div>
                        <input
                          type="text"
                          required
                          value={soloName}
                          onChange={(e) => setSoloName(e.target.value)}
                          placeholder="e.g. John Doe"
                          className="w-full pl-9 pr-3 py-2 bg-gray-50 dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-lg text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                        />
                      </div>
                    </div>

                    {/* Email */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                        Email Address <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                          <Mail size={16} />
                        </div>
                        <input
                          type="email"
                          required
                          value={soloEmail}
                          onChange={(e) => setSoloEmail(e.target.value)}
                          placeholder="john@example.com"
                          className="w-full pl-9 pr-3 py-2 bg-gray-50 dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-lg text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                        />
                      </div>
                    </div>

                    {/* Membership ID */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                        Membership ID <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                          <Hash size={16} />
                        </div>
                        <input
                          type="text"
                          required
                          value={soloMembershipId}
                          onChange={(e) => setSoloMembershipId(e.target.value)}
                          placeholder="e.g. MEM-0092"
                          className="w-full pl-9 pr-3 py-2 bg-gray-50 dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-lg text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                        />
                      </div>
                    </div>

                    {/* Shares */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                        Initial Shares <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                          <Coins size={16} />
                        </div>
                        <input
                          type="number"
                          required
                          min="0"
                          value={soloShares}
                          onChange={(e) => setSoloShares(parseInt(e.target.value) || 0)}
                          className="w-full pl-9 pr-3 py-2 bg-gray-50 dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-lg text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                        />
                      </div>
                    </div>

                    {/* Joining Date */}
                    <div className="flex flex-col gap-1.5 md:col-span-2">
                      <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                        Joining Date <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                          <Calendar size={16} />
                        </div>
                        <input
                          type="date"
                          required
                          value={soloJoinedDate}
                          onChange={(e) => setSoloJoinedDate(e.target.value)}
                          className="w-full pl-9 pr-3 py-2 bg-gray-50 dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-lg text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 flex justify-end">
                    <button
                      type="submit"
                      disabled={isSoloSubmitting}
                      className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg text-sm font-semibold flex items-center gap-2 shadow-sm transition outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    >
                      {isSoloSubmitting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Onboarding...
                        </>
                      ) : (
                        <>
                          <UserPlus size={16} />
                          Onboard Member
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}

              {/* Bulk Onboarding (CSV) */}
              {activeTab === "bulk" && (
                <div className="space-y-6">
                  {/* Template Download Panel */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800/40 rounded-lg gap-3">
                    <div>
                      <h4 className="text-sm font-bold text-blue-900 dark:text-blue-300">
                        Need the CSV template?
                      </h4>
                      <p className="text-xs text-blue-700/80 dark:text-blue-400/80 mt-0.5">
                        Download our template to ensure you have the exact CSV layout.
                      </p>
                    </div>
                    <button
                      onClick={handleDownloadTemplate}
                      className="px-4 py-2 bg-white dark:bg-slate-800 border border-blue-200 dark:border-blue-800/60 hover:bg-blue-50 dark:hover:bg-slate-700 text-blue-600 dark:text-blue-400 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm transition outline-none"
                    >
                      <Download size={14} />
                      Download Template
                    </button>
                  </div>

                  {/* Drop zone / Upload Area */}
                  {!bulkFile ? (
                    <div
                      onDragEnter={handleDrag}
                      onDragOver={handleDrag}
                      onDragLeave={handleDrag}
                      onDrop={handleDrop}
                      onClick={() => fileInputRef.current?.click()}
                      className={`border-2 border-dashed rounded-xl py-6 px-4 flex flex-col items-center justify-center text-center cursor-pointer transition ${isDragActive
                        ? "border-blue-500 bg-blue-50/20 dark:bg-blue-900/10"
                        : "border-gray-300 dark:border-slate-700 hover:border-gray-400 dark:hover:border-slate-600 bg-gray-50/50 dark:bg-slate-900/30"
                        }`}
                    >
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".csv"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                      <UploadCloud size={40} className="text-gray-400 dark:text-gray-500 mb-3" />
                      <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                        Drag and drop your CSV file here
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        or click to browse from your device
                      </p>
                      <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-2">
                        Only .csv files up to 10MB are supported
                      </p>
                    </div>
                  ) : (
                    /* File Selected Area */
                    <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900/40 rounded-xl">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg">
                          <FileSpreadsheet size={22} />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 line-clamp-1">
                            {bulkFile.name}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                            {(bulkFile.size / 1024).toFixed(1)} KB
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => setBulkFile(null)}
                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg transition"
                        title="Remove file"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  )}

                  {/* Proceed Button */}
                  <div className="flex justify-end pt-2">
                    <button
                      onClick={handleBulkSubmit}
                      disabled={!bulkFile || isBulkSubmitting}
                      className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed text-white rounded-lg text-sm font-semibold flex items-center gap-2 shadow-sm transition outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    >
                      {isBulkSubmitting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Processing CSV...
                        </>
                      ) : (
                        <>
                          <UploadCloud size={16} />
                          Proceed Onboarding
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Onboarding Activity Timeline */}
        <div className="lg:col-span-1">
          <div className="p-5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 shadow-sm rounded-xl flex flex-col h-[378px]">
            <div className="flex items-center gap-2 pb-4 border-b border-gray-100 dark:border-slate-700/60 mb-4">
              <History size={18} className="text-gray-500 dark:text-gray-400" />
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                Activity Log
              </h3>
            </div>

            {isLogsLoading && (
              <div className="flex-1 flex flex-col items-center justify-center py-12 space-y-3">
                <Loader2 className="w-8 h-8 text-blue-600 animate-spin dark:text-blue-400" />
                <p className="text-xs text-gray-500 dark:text-gray-400">Loading timeline...</p>
              </div>
            )}

            {!isLogsLoading && logsError && (
              <div className="flex-1 flex items-center justify-center p-4 text-center">
                <p className="text-sm text-red-500 dark:text-red-400">{logsError}</p>
              </div>
            )}

            {!isLogsLoading && !logsError && logs.length === 0 && (
              <div className="flex-1 flex flex-col items-center justify-center py-12 text-center">
                <p className="text-sm text-gray-400 dark:text-gray-500">
                  No onboarding history recorded yet.
                </p>
              </div>
            )}

            {!isLogsLoading && !logsError && logs.length > 0 && (
              <div className="flex-1 overflow-y-auto pr-1">
                <ul className="space-y-4 relative ml-3 pl-4 border-l border-gray-200 dark:border-slate-700">
                  {logs.map((log) => {
                    const isBulk = log.type === "BULK";

                    return (
                      <li key={log.$id} className="relative group">
                        {/* Timeline Bullet Point */}
                        <span className="absolute -left-[20.5px] top-[5px] w-2 h-2 rounded-full border-2 border-white dark:border-slate-800 bg-blue-500 ring-4 ring-blue-50 dark:ring-blue-900/20 group-hover:scale-125 transition-transform" />

                        <div className="flex flex-col bg-gray-50/50 dark:bg-slate-900/30 border border-gray-100 dark:border-slate-700/30 rounded-lg p-3 hover:bg-gray-50 dark:hover:bg-slate-700/20 transition duration-150">
                          {/* Log content */}
                          <div className="text-sm text-gray-700 dark:text-gray-300 font-medium leading-relaxed">
                            {isBulk ? (
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span>
                                  <span className="font-semibold text-gray-900 dark:text-white">
                                    {log.onboardedBy}
                                  </span>{" "}
                                  has onboarded member in Bulk
                                </span>
                                {log.bulkUrl && (
                                  <a
                                    href={log.bulkUrl.replace("/view", "/download")}
                                    download
                                    className="inline-flex items-center gap-0.5 text-blue-600 dark:text-blue-400 hover:underline hover:text-blue-800 dark:hover:text-blue-300 focus:outline-none"
                                    title="Download CSV file"
                                  >
                                    <ArrowUpRight size={15} className="shrink-0" />
                                  </a>
                                )}
                              </div>
                            ) : (
                              <span>
                                <span className="font-semibold text-gray-900 dark:text-white">
                                  {log.onboardedBy}
                                </span>{" "}
                                has onboarded{" "}
                                <span className="text-blue-600 dark:text-blue-400 break-all font-semibold">
                                  {log.inviteEmail}
                                </span>{" "}
                                as member
                              </span>
                            )}
                          </div>

                          {/* Relative Time */}
                          <span className="text-[10px] text-gray-400 dark:text-gray-500 mt-1.5 flex items-center gap-1">
                            <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-slate-600" />
                            {getRelativeTime(log.$createdAt)}
                          </span>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
