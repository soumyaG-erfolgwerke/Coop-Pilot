"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  Clock3,
  FileText,
  Loader2,
  Search,
  User2,
  XCircle,
  Phone,
  MapPin,
  Mail,
  UserCircle,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";

export default function ProfileUpdatePage() {
  const [requests, setRequests] = useState([]);
  const [selectedRequest, setSelectedRequest] = useState(null);

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const [search, setSearch] = useState("");
  const [rejectReason, setRejectReason] = useState("");

  const fetchRequests = async () => {
    try {
      setLoading(true);

      const res = await fetch("/api/userServices/profileRequests?admin=true", {
        cache: "no-store",
      });

      const data = await res.json();

      if (data.success) {
        setRequests(data.data || []);

        if (data.data?.length > 0) {
          setSelectedRequest((prev) => {
            if (!prev) return data.data[0];
            const updatedMatch = data.data.find((r) => r.$id === prev.$id);
            return updatedMatch || data.data[0];
          });
        } else {
          setSelectedRequest(null);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const getDocumentViewUrl = (fileId) => {
    if (!fileId) return "";
    const ENDPOINT = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT;
    const PROJECT_ID = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;
    return `${ENDPOINT}/storage/buckets/${process.env.NEXT_PUBLIC_AUDIT_BUCKET_ID}/files/${fileId}/view?project=${PROJECT_ID}`;
  };

  const filteredRequests = useMemo(() => {
    return requests.filter((item) => {
      const searchText = search.toLowerCase();
      const profile = item.currentProfile || {};
      const fullName =
        `${profile.FirstName || ""} ${profile.LastName || ""}`.toLowerCase();

      return (
        item.userId?.toLowerCase().includes(searchText) ||
        item.status?.toLowerCase().includes(searchText) ||
        fullName.includes(searchText)
      );
    });
  }, [requests, search]);

  const handleAction = async (action) => {
    if (!selectedRequest) return;

    if (action === "REJECT" && !rejectReason.trim()) {
      alert("Please provide a rejection reason");
      return;
    }

    try {
      setActionLoading(true);

      const res = await fetch("/api/userServices/profileRequests", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          requestId: selectedRequest.$id,
          action,
          reason: action === "REJECT" ? rejectReason : "",
        }),
      });

      const data = await res.json();

      if (!data.success) {
        alert(data.error || "Something went wrong");
        return;
      }

      await fetchRequests();

      alert(action === "APPROVE" ? "Request Approved" : "Request Rejected");
      setRejectReason("");
    } catch (err) {
      console.error(err);
      alert("Something went wrong");
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "APPROVED":
        return "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20";
      case "REJECTED":
        return "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20";
      default:
        return "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "APPROVED":
        return <CheckCircle2 size={14} className="shrink-0" />;
      case "REJECTED":
        return <XCircle size={14} className="shrink-0" />;
      default:
        return <Clock3 size={14} className="shrink-0" />;
    }
  };

  const requestedData = useMemo(() => {
    try {
      return JSON.parse(selectedRequest?.requestedData || "{}");
    } catch (err) {
      console.error("Failed to parse requestedData:", err);

      return {};
    }
  }, [selectedRequest?.requestedData]);

  const currentProfile = selectedRequest?.currentProfile || {};

  const fields = [
    { key: "street", label: "Street" },
    { key: "houseNo", label: "House No" },
    { key: "add", label: "Additional" },
    { key: "postalCode", label: "Postal Code" },
    { key: "location", label: "Location" },
    { key: "telephoneNo", label: "Telephone No" },
  ];

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-50 dark:bg-slate-950 flex flex-col md:flex-row animate-fadeIn">
      <div className="w-full md:w-[380px] shrink-0 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col h-[calc(100vh-4rem)] sticky top-16">
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 rounded-lg">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h1 className="text-lg font-bold text-slate-900 dark:text-white">
              Update Requests
            </h1>
          </div>

          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by Name, ID or Status..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full py-2.5 pl-9 pr-4 text-sm bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all placeholder:text-slate-400"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-700">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-full gap-3">
              <div className="w-8 h-8 border-4 border-indigo-100 dark:border-slate-800 border-t-indigo-600 dark:border-t-indigo-500 rounded-full animate-spin"></div>
            </div>
          ) : filteredRequests.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-6">
              <User2 className="w-10 h-10 text-slate-300 dark:text-slate-600 mb-3" />
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                No requests found
              </p>
            </div>
          ) : (
            <div className="p-3 space-y-1.5">
              {filteredRequests.map((item) => {
                const isSelected = selectedRequest?.$id === item.$id;
                const profile = item.currentProfile || {};
                const fullName =
                  `${profile.FirstName || "Unknown"} ${profile.LastName || ""}`.trim();

                return (
                  <button
                    key={item.$id}
                    onClick={() => setSelectedRequest(item)}
                    className={`w-full p-4 rounded-xl text-left transition-all duration-200 ${
                      isSelected
                        ? "bg-indigo-50 dark:bg-indigo-500/10 border-2 border-indigo-600 dark:border-indigo-500 shadow-sm"
                        : "bg-white dark:bg-slate-900 border-2 border-zinc-200 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div
                          className={`text-sm font-bold truncate ${isSelected ? "text-indigo-900 dark:text-indigo-300" : "text-slate-900 dark:text-white"}`}
                        >
                          {fullName}
                        </div>
                        <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400 truncate mt-0.5">
                          {item.userId}
                        </div>
                        <div className="mt-1.5 text-[10px] font-medium text-slate-500 uppercase tracking-widest">
                          {new Date(
                            item.createdAt || item.$createdAt,
                          ).toLocaleDateString()}
                        </div>
                      </div>
                      <div
                        className={`flex items-center gap-1 px-2 py-1 text-[10px] font-bold uppercase tracking-wider border rounded-md shrink-0 ${getStatusColor(item.status)}`}
                      >
                        {getStatusIcon(item.status)}
                        <span className="hidden sm:inline-block">
                          {item.status}
                        </span>
                      </div>
                    </div>

                    {item.description && (
                      <p className="mt-2.5 text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                        {item.description}
                      </p>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 h-[calc(100vh-4rem)]">
        {!selectedRequest ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-16 h-16 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl flex items-center justify-center mb-4 shadow-sm">
              <FileText className="w-8 h-8 text-slate-300 dark:text-slate-600" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              No Request Selected
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-sm">
              Select a profile update request from the sidebar to review and
              manage it.
            </p>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="p-6 bg-white border border-slate-200 shadow-sm rounded-2xl dark:border-slate-800 dark:bg-slate-900">
              <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 rounded-full flex items-center justify-center shrink-0">
                    <UserCircle className="w-8 h-8" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      {currentProfile?.FirstName || "Unknown User"}{" "}
                      {currentProfile?.LastName || ""}
                    </h2>

                    <div className="mt-3 flex flex-wrap items-center gap-y-2 gap-x-4 text-sm text-slate-600 dark:text-slate-400">
                      <div className="flex items-center gap-1.5">
                        <Mail className="w-4 h-4 text-slate-400" />
                        <span>
                          {currentProfile?.contactEmail ||
                            currentProfile?.email ||
                            selectedRequest.userId}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Phone className="w-4 h-4 text-slate-400" />
                        <span>{currentProfile?.telephoneNo || "-"}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-4 h-4 text-slate-400" />
                        <span className="truncate max-w-[200px]">
                          {currentProfile?.location || "-"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-start lg:items-end gap-3 shrink-0 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-700">
                  <div
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold border uppercase tracking-wider rounded-md ${getStatusColor(selectedRequest.status)}`}
                  >
                    {getStatusIcon(selectedRequest.status)}
                    {selectedRequest.status}
                  </div>
                  <div className="text-[10px] font-medium text-slate-500 uppercase tracking-widest text-right">
                    Requested on: <br />
                    <span className="text-slate-700 dark:text-slate-300 font-bold">
                      {new Date(
                        selectedRequest.createdAt || selectedRequest.$createdAt,
                      ).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white border border-slate-200 shadow-sm rounded-2xl dark:border-slate-800 dark:bg-slate-900 overflow-hidden flex flex-col">
              <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50 shrink-0">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Data Comparison
                </h3>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[600px]">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700">
                      <th className="px-6 py-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest w-1/4">
                        Field
                      </th>
                      <th className="px-6 py-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest w-2/4">
                        Current Record
                      </th>
                      <th className="px-6 py-3 text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest bg-indigo-50/50 dark:bg-indigo-900/10 w-2/4 border-l border-slate-200 dark:border-slate-700">
                        Requested Change
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                    {fields.map((field) => {
                      const currentValue = currentProfile?.[field.key] || "-";
                      const requestedValue = requestedData[field.key] || "-";
                      const changed = requestedData[field.key] !== undefined;

                      return (
                        <tr
                          key={field.key}
                          className={`transition-colors ${
                            changed
                              ? "bg-amber-50/50 dark:bg-amber-900/10"
                              : "bg-white dark:bg-slate-900"
                          }`}
                        >
                          <td className="px-6 py-4 text-sm font-semibold text-slate-900 dark:text-slate-200">
                            {field.label}
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
                            {currentValue}
                          </td>
                          <td
                            className={`px-6 py-4 text-sm font-medium border-l border-slate-200 dark:border-slate-700 ${
                              changed
                                ? "text-amber-700 dark:text-amber-400 font-bold"
                                : "text-slate-400 dark:text-slate-600 italic"
                            }`}
                          >
                            {changed ? (
                              <div className="flex items-center gap-2">
                                {requestedValue}
                                <ArrowRight className="w-3 h-3 text-amber-500 opacity-50 shrink-0" />
                              </div>
                            ) : (
                              "No change"
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {selectedRequest.description && (
              <div className="p-6 bg-white border border-slate-200 shadow-sm rounded-2xl dark:border-slate-800 dark:bg-slate-900">
                <h3 className="mb-3 text-sm font-bold text-slate-900 dark:text-white uppercase tracking-widest">
                  User Note / Description
                </h3>
                <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700/50">
                  "{selectedRequest.description}"
                </p>
              </div>
            )}

            {selectedRequest.documentId && (
              <div className="p-6 bg-white border border-slate-200 shadow-sm rounded-2xl dark:border-slate-800 dark:bg-slate-900 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-widest">
                    Supporting Document
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    User uploaded a file to verify this change.
                  </p>
                </div>
                <a
                  href={getDocumentViewUrl(selectedRequest.documentId)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-bold text-indigo-600 bg-indigo-50 border border-indigo-200 rounded-xl hover:bg-indigo-100 dark:bg-indigo-900/30 dark:border-indigo-800/50 dark:text-indigo-400 dark:hover:bg-indigo-900/50 transition-colors focus:ring-2 focus:ring-indigo-500 w-full sm:w-auto"
                >
                  <FileText className="w-4 h-4" />
                  View File
                </a>
              </div>
            )}

            {selectedRequest.status !== "PENDING" && (
              <div className="p-6 bg-slate-50 border border-slate-200 shadow-inner rounded-2xl dark:border-slate-800 dark:bg-slate-900/50">
                <h3 className="mb-4 text-sm font-bold text-slate-900 dark:text-white uppercase tracking-widest">
                  Resolution Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-100 dark:border-slate-700">
                    <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                      Processed By
                    </span>
                    <span className="font-semibold text-slate-900 dark:text-slate-200">
                      {selectedRequest.reviewedBy || "System"}
                    </span>
                  </div>
                  <div className="p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-100 dark:border-slate-700">
                    <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                      Processed At
                    </span>
                    <span className="font-semibold text-slate-900 dark:text-slate-200">
                      {selectedRequest.reviewedAt
                        ? new Date(selectedRequest.reviewedAt).toLocaleString()
                        : "-"}
                    </span>
                  </div>
                  {selectedRequest.reason && (
                    <div className="md:col-span-2 p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-100 dark:border-slate-700">
                      <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                        Admin Note / Reason
                      </span>
                      <span className="font-medium text-slate-700 dark:text-slate-300">
                        {selectedRequest.reason}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {selectedRequest.status === "PENDING" && (
              <div className="p-6 bg-white border border-slate-200 shadow-sm rounded-2xl dark:border-slate-800 dark:bg-slate-900 space-y-5">
                <div>
                  <label className="block mb-2 text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-widest">
                    Rejection Reason (Required if rejecting)
                  </label>
                  <textarea
                    rows={3}
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder="Provide a reason if denying this request..."
                    className="w-full p-3 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all placeholder:text-slate-400 resize-y"
                  />
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <button
                    disabled={actionLoading}
                    onClick={() => handleAction("APPROVE")}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3.5 text-sm font-bold text-white transition-all bg-emerald-600 rounded-xl hover:bg-emerald-700 shadow-sm shadow-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900"
                  >
                    {actionLoading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <CheckCircle2 className="w-5 h-5" />
                    )}
                    Approve Request
                  </button>

                  <button
                    disabled={actionLoading}
                    onClick={() => handleAction("REJECT")}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3.5 text-sm font-bold text-rose-700 bg-rose-50 border border-rose-200 transition-all rounded-xl hover:bg-rose-100 hover:text-rose-800 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20 dark:hover:bg-rose-500/20 disabled:opacity-50 disabled:cursor-not-allowed focus:ring-2 focus:ring-rose-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900"
                  >
                    {actionLoading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <XCircle className="w-5 h-5" />
                    )}
                    Reject Request
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
