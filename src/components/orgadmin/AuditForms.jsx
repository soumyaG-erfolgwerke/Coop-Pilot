"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  LayoutTemplate,
  Plus,
  FileText,
  X,
  ChevronRight,
  Filter,
  Edit3,
  Clock,
  CheckCircle2,
  ListFilter,
  Loader2,
  Search,
  Copy,
  Eye,
  Layers,
  Sparkles,
  RotateCw,
} from "lucide-react";
import toast from "react-hot-toast";
import FadePopUp from "@/components/FadePopUp";
import UserName from "../userComponent/UserName";

export default function AuditForms({ auditOrg, user }) {
  const router = useRouter();
  const searchInputRef = useRef(null);
  const [auditType, setAuditType] = useState("");
  const [isSelectingType, setIsSelectingType] = useState(false);
  const [loading, setLoading] = useState(false);
  const [forms, setForms] = useState([]);
  const [loadingForms, setLoadingForms] = useState(true);

  // Advanced search and filters state
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  const fetchForms = async () => {
    if (!auditOrg?.id) return;

    setLoadingForms(true);
    try {
      const response = await fetch(
        `/api/audit-forms/list?orgId=${auditOrg.id}`,
      );
      const data = await response.json();

      if (data.success) {
        setForms(data.auditForms || []);
      } else {
        toast.error(data.error || "Failed to load audit forms.");
      }
    } catch (error) {
      console.error("Error fetching forms:", error);
      toast.error("Could not reach the server to fetch forms.");
    } finally {
      setLoadingForms(false);
    }
  };

  useEffect(() => {
    fetchForms();
  }, [auditOrg?.id]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (
        e.key === "/" &&
        document.activeElement.tagName !== "INPUT" &&
        document.activeElement.tagName !== "TEXTAREA"
      ) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const getFormTitle = (templatePayload) => {
    if (!templatePayload) return "Untitled Form";
    try {
      const parsed =
        typeof templatePayload === "string"
          ? JSON.parse(templatePayload)
          : templatePayload;
      return parsed.title || "Untitled Form";
    } catch {
      return "Untitled Form";
    }
  };

  const incrementVersion = (versionStr) => {
    const currentYear = new Date().getFullYear();
    if (!versionStr) {
      return `${currentYear}.0`;
    }
    const parts = versionStr.split(".");
    const parsedYear = parseInt(parts[0], 10);
    if (parsedYear === currentYear) {
      const currentRev = parts[1] ? parseInt(parts[1], 10) : 0;
      const nextRev = isNaN(currentRev) ? 1 : currentRev + 1;
      return `${currentYear}.${nextRev}`;
    } else {
      return `${currentYear}.0`;
    }
  };

  // Duplicate / Clone Template Flow

  const handleDuplicate = async (form) => {
    try {
      setLoading(true);
      const newVersion = incrementVersion(form.version);
      let parsedTemplate = {};
      try {
        parsedTemplate =
          typeof form.template === "string"
            ? JSON.parse(form.template)
            : form.template;
      } catch (e) {
        parsedTemplate = form.template || {};
      }

      // Update version inside template title copy if possible
      const updatedTemplate = {
        ...parsedTemplate,
        title: `${parsedTemplate.title || "Form"} (${(form.auditType || "").toLowerCase() === "full" ? "f" : "s"}${newVersion} Copy)`,
      };

      const response = await fetch("/api/audit-forms", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          auditOrgId: auditOrg.id,
          auditType: form.auditType,
          template: updatedTemplate,
          version: newVersion,
        }),
      });

      const data = await response.json();
      if (data.success && data.auditForm) {
        toast.success(`Cloned draft version ${newVersion} created.`);
        fetchForms();
        window.open(
          `/org/${auditOrg.id}/create/${form.auditType}/${data.auditForm.$id}`,
          "_blank",
          "noopener,noreferrer",
        );
      } else {
        toast.error(data.error || "Failed to clone template");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error occurred while cloning template");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSubmit = async () => {
    try {
      if (!auditType) {
        toast.error("Please select an audit type.");
        return;
      }

      if (!auditOrg?.id) {
        toast.error("Organization ID is missing.");
        return;
      }

      setLoading(true);

      // Fetch existing draft for this auditType
      const response = await fetch(
        `/api/audit-forms?orgId=${auditOrg.id}&auditType=${auditType.toLowerCase()}`,
      );
      const data = await response.json();

      if (data.success && data.auditForm) {
        toast.success(
          `A draft already exists for ${auditType} audit. Opening draft.`,
        );
        window.open(
          `/org/${auditOrg.id}/create/${auditType}/${data.auditForm.$id}`,
          "_blank",
          "noopener,noreferrer",
        );
      } else {
        const newFormId = crypto.randomUUID();
        window.open(
          `/org/${auditOrg.id}/create/${auditType}/${newFormId}`,
          "_blank",
          "noopener,noreferrer",
        );
      }

      setIsSelectingType(false);
      setAuditType("");
    } catch (error) {
      console.error(error);
      toast.error(
        error.message || "Failed to check existing drafts / initialize form",
      );
    } finally {
      setLoading(false);
      fetchForms();
    }
  };

  // Filtered forms list computation
  const filteredForms = forms.filter((form) => {
    // 1. Status Filter
    if (statusFilter !== "ALL") {
      const currentStatus = (
        form.AuditStatus ||
        form.status ||
        "DRAFT"
      ).toUpperCase();
      if (currentStatus !== statusFilter.toUpperCase()) return false;
    }

    // 2. Type Filter
    if (typeFilter !== "ALL") {
      const currentType = form.auditType || "";
      if (currentType.toLowerCase() !== typeFilter.toLowerCase()) return false;
    }

    // 3. Search Query Filter
    if (searchQuery.trim() !== "") {
      const query = searchQuery.toLowerCase();
      const title = getFormTitle(form.template).toLowerCase();
      const formId = form.$id.toLowerCase();
      if (!title.includes(query) && !formId.includes(query)) return false;
    }

    return true;
  });

  // Calculate statistics metrics
  const totalCount = forms.length;
  const draftCount = forms.filter(
    (f) => (f.AuditStatus || f.status || "").toUpperCase() === "DRAFT",
  ).length;
  const completedCount = forms.filter((f) =>
    ["COMPLETED", "PUBLISHED"].includes(
      (f.AuditStatus || f.status || "").toUpperCase(),
    ),
  ).length;
  const discardedCount = forms.filter(
    (f) => (f.AuditStatus || f.status || "").toUpperCase() === "DISCARDED",
  ).length;

  return (
    <div className="flex flex-col min-h-screen p-4 bg-slate-50 dark:bg-slate-950 sm:p-6 lg:p-8 animate-fadeIn">
      {/* HEADER SECTION */}
      <div className="flex flex-col gap-4 mb-8 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3.5 bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 rounded-xl shadow-sm">
            <LayoutTemplate className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl text-slate-900 dark:text-white">
              Audit Forms
            </h1>
            <p className="mt-1 text-sm font-medium text-slate-500 dark:text-slate-400">
              Manage templates and view associated cooperatives.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchForms}
            disabled={loadingForms}
            className="flex items-center justify-center p-3.5 bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm text-slate-500 dark:text-slate-400 transition-all hover:text-indigo-600 dark:hover:text-indigo-400 disabled:opacity-50"
            title="Refresh Forms"
          >
            <RotateCw
              size={16}
              className={loadingForms ? "animate-spin" : ""}
            />
          </button>
          <button
            onClick={async () => {
              try {
                setLoading(true);
                const res = await fetch("/api/audit-forms/seed-default", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ orgId: auditOrg.id }),
                });
                const data = await res.json();
                if (data.success) {
                  toast.success("Default template loaded successfully!");
                  fetchForms();
                } else {
                  toast.error(data.error || "Failed to load default template");
                }
              } catch (err) {
                toast.error("Error loading default template");
              } finally {
                setLoading(false);
              }
            }}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 px-6 py-3.5 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600 rounded-xl shadow-md shadow-emerald-500/20 transition-all hover:-translate-y-0.5 disabled:opacity-50"
          >
            <FileText size={18} />
            Load Default Template
          </button>
          <button
            onClick={() => setIsSelectingType(true)}
            className="inline-flex items-center justify-center gap-2 px-6 py-3.5 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 rounded-xl shadow-md shadow-indigo-500/20 transition-all hover:-translate-y-0.5"
          >
            <Plus size={18} />
            Create Template
          </button>
        </div>
      </div>

      {forms.length === 0 && !loadingForms ? (
        /* INTRO EMPTY HUB BANNER */
        <div className="flex flex-col items-center justify-center w-full max-w-6xl p-8 mx-auto mt-4 text-center bg-white border shadow-sm dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-3xl lg:p-12">
          <div className="w-20 h-20 bg-indigo-50 dark:bg-indigo-900/20 rounded-[1.5rem] flex items-center justify-center mb-6 shadow-sm border border-indigo-100 dark:border-indigo-800/30">
            <FileText
              size={36}
              className="text-indigo-600 dark:text-indigo-400"
            />
          </div>

          <h3 className="mb-3 text-2xl font-extrabold sm:text-3xl text-slate-900 dark:text-white">
            Audit Templates Hub
          </h3>

          <p className="max-w-lg mx-auto mb-8 text-base font-medium leading-relaxed text-slate-500 dark:text-slate-400">
            Configure your organization's custom audit framework. Build,
            version, and launch interactive compliance forms from scratch.
          </p>

          <div className="flex flex-col items-center justify-center w-full gap-4 sm:flex-row sm:w-auto">
            <button
              onClick={async () => {
                try {
                  setLoading(true);
                  const res = await fetch("/api/audit-forms/seed-default", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ orgId: auditOrg.id }),
                  });
                  const data = await res.json();
                  if (data.success) {
                    toast.success("Default template loaded successfully!");
                    fetchForms();
                  } else {
                    toast.error(data.error || "Failed to load default template");
                  }
                } catch (err) {
                  toast.error("Error loading default template");
                } finally {
                  setLoading(false);
                }
              }}
              disabled={loading}
              className="w-full sm:w-auto px-10 py-3.5 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600 rounded-xl shadow-sm shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 hover:-translate-y-0.5 disabled:opacity-50"
            >
              <FileText size={18} /> Load Default Template
            </button>
            <button
              onClick={() => setIsSelectingType(true)}
              className="w-full sm:w-auto px-10 py-3.5 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 rounded-xl shadow-sm shadow-indigo-500/20 transition-all flex items-center justify-center gap-2 hover:-translate-y-0.5"
            >
              <Plus size={18} /> Create New Template
            </button>
            <button
              onClick={fetchForms}
              disabled={loadingForms}
              className="w-full sm:w-auto px-10 py-3.5 text-sm font-bold bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 hover:-translate-y-0.5 disabled:opacity-50"
            >
              <RotateCw
                size={18}
                className={loadingForms ? "animate-spin" : ""}
              />{" "}
              Refresh
            </button>
          </div>
        </div>
      ) : (
        /* COMPREHENSIVE DASHBOARD */
        <div className="flex flex-col w-full gap-8 mx-auto max-w-7xl">
          {/* STATS SUMMARY ROW */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <div className="flex items-center justify-between p-5 transition-all bg-white border shadow-sm dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-2xl hover:shadow-md">
              <div>
                <p className="text-xs font-bold tracking-wider uppercase text-slate-400">
                  Total Frameworks
                </p>
                <h3 className="mt-1 text-2xl font-extrabold text-slate-900 dark:text-white">
                  {totalCount}
                </h3>
              </div>
              <div className="p-3 text-indigo-600 bg-indigo-50 dark:bg-indigo-900/30 dark:text-indigo-400 rounded-xl">
                <Layers size={20} />
              </div>
            </div>

            <div className="flex items-center justify-between p-5 transition-all bg-white border shadow-sm dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-2xl hover:shadow-md">
              <div>
                <p className="text-xs font-bold tracking-wider uppercase text-slate-400">
                  Published Active
                </p>
                <h3 className="mt-1 text-2xl font-extrabold text-slate-900 dark:text-white">
                  {completedCount}
                </h3>
              </div>
              <div className="p-3 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-xl">
                <CheckCircle2 size={20} />
              </div>
            </div>

            <div className="flex items-center justify-between p-5 transition-all bg-white border shadow-sm dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-2xl hover:shadow-md">
              <div>
                <p className="text-xs font-bold tracking-wider uppercase text-slate-400">
                  Drafts In Progress
                </p>
                <h3 className="mt-1 text-2xl font-extrabold text-slate-900 dark:text-white">
                  {draftCount}
                </h3>
              </div>
              <div className="p-3 bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-xl">
                <Clock size={20} />
              </div>
            </div>

            <div className="flex items-center justify-between p-5 transition-all bg-white border shadow-sm dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-2xl hover:shadow-md">
              <div>
                <p className="text-xs font-bold tracking-wider uppercase text-slate-400">
                  Discarded History
                </p>
                <h3 className="mt-1 text-2xl font-extrabold text-slate-900 dark:text-white">
                  {discardedCount}
                </h3>
              </div>
              <div className="p-3 bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 rounded-xl">
                <X size={20} />
              </div>
            </div>
          </div>

          {/* LIST & SEARCH CARD */}
          <div className="flex flex-col overflow-hidden bg-white border shadow-sm dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-3xl">
            {/* SEARCH & FILTERS HEADER */}
            <div className="flex flex-col justify-between gap-4 p-6 border-b sm:p-8 border-slate-200 dark:border-slate-800 xl:flex-row xl:items-center bg-slate-50/50 dark:bg-slate-900/50">
              <div>
                <h2 className="flex items-center gap-2 text-xl font-extrabold text-slate-900 dark:text-white">
                  <LayoutTemplate size={20} className="text-indigo-500" />{" "}
                  Templates List
                </h2>
                <p className="mt-1 text-sm font-medium text-slate-500 dark:text-slate-400">
                  View and manage all versions of compliance frameworks.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                {/* Search Bar */}
                <div className="relative flex-1 min-w-[200px] sm:flex-none">
                  <input
                    ref={searchInputRef}
                    type="text"
                    placeholder="Search templates..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-10 py-2.5 text-sm font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm transition-all"
                  />
                  <Search
                    className="absolute -translate-y-1/2 left-3 top-1/2 text-slate-400"
                    size={16}
                  />
                  <kbd className="absolute -translate-y-1/2 right-3 top-1/2 px-1.5 py-0.5 text-[10px] font-bold text-slate-400 bg-slate-100 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-md pointer-events-none">
                    /
                  </kbd>
                </div>

                {/* Status Selector */}
                <div className="flex items-center gap-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 shadow-sm">
                  <ListFilter size={16} className="text-slate-400" />
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="relative pr-6 text-sm font-bold bg-transparent outline-none appearance-none cursor-pointer text-slate-700 dark:text-slate-200"
                  >
                    <option value="ALL">All Statuses</option>
                    <option value="DRAFT">Drafts</option>
                    <option value="COMPLETED">Published</option>
                    <option value="DISCARDED">Discarded</option>
                  </select>
                </div>

                {/* Type Selector */}
                <div className="flex items-center gap-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 shadow-sm">
                  <Filter size={16} className="text-slate-400" />
                  <select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                    className="relative pr-6 text-sm font-bold bg-transparent outline-none appearance-none cursor-pointer text-slate-700 dark:text-slate-200"
                  >
                    <option value="ALL">All Types</option>
                    <option value="Simple">Simplified</option>
                    <option value="Full">Comprehensive</option>
                  </select>
                </div>
              </div>
            </div>

            {/* DATA TABLE */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="text-xs font-bold tracking-widest uppercase border-b bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400">
                    <th className="px-6 py-4">Title</th>
                    <th className="px-6 py-4">Version</th>
                    <th className="px-6 py-4">Type</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Last Updated</th>
                    <th className="px-6 py-4 pr-12 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {loadingForms ? (
                    <tr>
                      <td colSpan="6" className="px-6 py-16 text-center">
                        <div className="inline-flex items-center justify-center gap-3 text-sm font-bold text-slate-500">
                          <Loader2
                            size={20}
                            className="text-indigo-600 animate-spin"
                          />
                          Loading frameworks database...
                        </div>
                      </td>
                    </tr>
                  ) : filteredForms.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="px-6 py-16 text-center">
                        <div className="inline-flex flex-col items-center justify-center text-slate-500 dark:text-slate-400">
                          <Filter size={32} className="mb-3 opacity-50" />
                          <p className="text-base font-bold text-slate-700 dark:text-slate-300">
                            No templates match search query
                          </p>
                          <p className="mt-1 text-sm">
                            Try adjusting your filters or search keywords.
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredForms.map((form) => {
                      const status = (
                        form.AuditStatus ||
                        form.status ||
                        "DRAFT"
                      ).toUpperCase();
                      const isDraft = status === "DRAFT";
                      const isDiscarded = status === "DISCARDED";

                      const formattedDate = new Date(
                        form.$updatedAt,
                      ).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      });

                      return (
                        <tr
                          key={form.$id}
                          className="transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/30 group"
                        >
                          <td className="px-6 py-4">
                            <div className="max-w-xs font-bold truncate text-slate-900 dark:text-white sm:max-w-md">
                              <UserName
                                name={getFormTitle(form.template)}
                                highlight={searchQuery}
                              />
                            </div>
                            <div className="flex items-center text-[10px] font-mono font-medium text-slate-400 dark:text-slate-500 mt-0.5">
                              ID:{" "}
                              <UserName
                                name={form.$id}
                                highlight={searchQuery}
                              />
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm font-bold text-slate-800 dark:text-slate-200">
                            {(form.auditType || "").toLowerCase() === "full"
                              ? "f"
                              : "s"}
                            {form.version || `${new Date().getFullYear()}.0`}
                          </td>
                          <td className="px-6 py-4">
                            <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 capitalize border border-slate-200 dark:border-slate-700">
                              {form.auditType || "Unknown"}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold border ${
                                isDraft
                                  ? "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20"
                                  : isDiscarded
                                    ? "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20"
                                    : "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20"
                              }`}
                            >
                              {isDraft ? (
                                <Clock size={12} />
                              ) : isDiscarded ? (
                                <X size={12} />
                              ) : (
                                <CheckCircle2 size={12} />
                              )}
                              {status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm font-medium text-slate-500 dark:text-slate-400">
                            {formattedDate}
                          </td>
                          <td className="px-6 py-4 pr-6 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {isDraft ? (
                                <button
                                  onClick={() =>
                                    window.open(
                                      `/org/${auditOrg.id}/create/${form.auditType}/${form.$id}`,
                                      "_blank",
                                      "noopener,noreferrer",
                                    )
                                  }
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-indigo-600 hover:text-white bg-indigo-50 hover:bg-indigo-600 dark:bg-indigo-950/40 dark:hover:bg-indigo-600 dark:text-indigo-400 rounded-xl transition-all shadow-sm"
                                >
                                  <Edit3 size={13} />
                                  Edit Draft
                                </button>
                              ) : (
                                <button
                                  onClick={() =>
                                    window.open(
                                      `/org/${auditOrg.id}/create/${form.auditType}/${form.$id}`,
                                      "_blank",
                                      "noopener,noreferrer",
                                    )
                                  }
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-600 hover:text-white bg-slate-100 hover:bg-slate-600 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300 rounded-xl transition-all shadow-sm"
                                >
                                  <Eye size={13} />
                                  Preview
                                </button>
                              )}

                              {!isDiscarded && false && (
                                <button
                                  onClick={() => handleDuplicate(form)}
                                  title="Duplicate / Version-Up Template"
                                  disabled={loading}
                                  className="p-2 transition-colors border border-transparent text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-slate-850 rounded-xl hover:border-indigo-100 dark:hover:border-slate-800"
                                >
                                  <Copy size={14} />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* CREATE AUDIT TYPE SELECTION MODAL */}
      <FadePopUp
        isOpen={isSelectingType}
        onClose={() => {
          setIsSelectingType(false);
          setAuditType("");
        }}
        className="w-full max-w-md"
        overlayClassName="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
      >
        <div className="p-6 space-y-6 overflow-hidden bg-white border shadow-2xl dark:bg-slate-900 rounded-3xl border-slate-200 dark:border-slate-800 sm:p-8">
          <div className="flex items-center gap-4 text-indigo-600 dark:text-indigo-400">
            <div className="p-3 bg-indigo-50 dark:bg-indigo-950/30 rounded-2xl">
              <Sparkles size={24} />
            </div>
            <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">
              Create Audit Template
            </h3>
          </div>

          <p className="text-sm font-medium leading-relaxed text-slate-500 dark:text-slate-400">
            Select the framework type for your new audit template. Once created,
            you can customize sections, fields, and validations inside the form
            builder.
          </p>

          <div className="space-y-3">
            <button
              onClick={() => setAuditType("Simple")}
              className={`w-full flex items-center justify-between p-4 rounded-2xl border text-left transition-all ${
                auditType === "Simple"
                  ? "border-indigo-600 bg-indigo-50/30 dark:border-indigo-500 dark:bg-indigo-900/20"
                  : "border-slate-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-700"
              }`}
            >
              <div>
                <p className="font-bold text-slate-900 dark:text-white">
                  Simplified Audit
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Quick setup, single section, essential queries
                </p>
              </div>
              <ChevronRight
                size={16}
                className={
                  auditType === "Simple"
                    ? "text-indigo-600 dark:text-indigo-400"
                    : "text-slate-400"
                }
              />
            </button>

            <button
              onClick={() => setAuditType("Full")}
              className={`w-full flex items-center justify-between p-4 rounded-2xl border text-left transition-all ${
                auditType === "Full"
                  ? "border-indigo-600 bg-indigo-50/30 dark:border-indigo-500 dark:bg-indigo-900/20"
                  : "border-slate-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-700"
              }`}
            >
              <div>
                <p className="font-bold text-slate-900 dark:text-white">
                  Full Comprehensive Audit
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Multi-section, compliance benchmarks, exhaustive checks
                </p>
              </div>
              <ChevronRight
                size={16}
                className={
                  auditType === "Full"
                    ? "text-indigo-600 dark:text-indigo-400"
                    : "text-slate-400"
                }
              />
            </button>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={() => {
                setIsSelectingType(false);
                setAuditType("");
              }}
              className="flex-1 px-5 py-3.5 text-sm font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleCreateSubmit}
              disabled={!auditType || loading}
              className="flex-1 px-5 py-3.5 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 rounded-xl transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Initializing..." : "Create Draft"}
            </button>
          </div>
        </div>
      </FadePopUp>
    </div>
  );
}
