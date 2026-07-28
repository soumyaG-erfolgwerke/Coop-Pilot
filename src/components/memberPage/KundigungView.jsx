"use client";
import React, { useEffect, useState } from "react";
import { Download, Eye, FileText, X, AlertTriangle, UserMinus } from "lucide-react";
import toast from "react-hot-toast";
import { getProfileByUserId } from "../../lib/profileService";
import GenerateCancellationPDF from "../pdf/GenerateCancellationPDF";

export default function KundigungView({ userId }) {
  const formatDate = (dateString) => {
    if (!dateString) return "—";
    try {
      const d = new Date(dateString);
      if (isNaN(d.getTime())) return dateString;
      return d.toLocaleDateString("de-DE");
    } catch {
      return dateString;
    }
  };

  const [payouts, setPayouts] = useState([]);
  const [coops, setCoops] = useState([]);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedTxId, setSelectedTxId] = useState(null);

  // Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedCoopId, setSelectedCoopId] = useState("");
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewData, setPreviewData] = useState(null);

  // Form State
  const [reason, setReason] = useState("");
  const [checkedNonReversible, setCheckedNonReversible] = useState(false);
  const [checkedAcknowledgeProcess, setCheckedAcknowledgeProcess] = useState(false);
  const [signature, setSignature] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchPayouts = async () => {
    try {
      const res = await fetch(`/api/coop-r-member/pending-payouts?userId=${userId}`);
      const data = await res.json();
      if (data.success) {
        setPayouts(data.payouts || []);
      }
    } catch (err) {
      console.error("Error fetching payouts:", err);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Fetch pending payouts
        await fetchPayouts();

        // Fetch coops of this member
        const coopsRes = await fetch(`/api/coop-r-member/coops-of-member?memberId=${userId}`);
        const coopsData = await coopsRes.json();
        if (coopsData.success) {
          setCoops(coopsData.coops || []);
        }

        // Fetch profile for PDF data
        const profileRes = await getProfileByUserId(userId);
        if (profileRes.success) {
          setProfile(profileRes.data);
        }
      } catch (err) {
        console.error("Error fetching cancellation details:", err);
        toast.error("An error occurred while loading cancellation details.");
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchData();
    }
  }, [userId]);

  const handleCoopChange = async (coopId) => {
    setSelectedCoopId(coopId);
    setPreviewData(null);
    if (!coopId) return;

    try {
      setPreviewLoading(true);
      const res = await fetch(`/api/coop-r-member/cancellation-preview?userId=${userId}&coopId=${coopId}`);
      const data = await res.json();
      if (data.success) {
        setPreviewData(data.preview);
      } else {
        toast.error(data.error || "Failed to fetch cooperative membership details.");
        setSelectedCoopId("");
      }
    } catch (err) {
      console.error("Error fetching preview:", err);
      toast.error("An error occurred while loading cooperative details.");
      setSelectedCoopId("");
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleDownload = async (payout) => {
    if (!profile) {
      toast.error("Profile data not loaded yet. Please wait.");
      return;
    }
    await GenerateCancellationPDF({
      payout,
      profile,
      coopName: payout.coopName,
    });
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!selectedCoopId || !previewData) {
      toast.error("Please select a cooperative first.");
      return;
    }
    if (!checkedNonReversible || !checkedAcknowledgeProcess) {
      toast.error("Please accept all legal declarations.");
      return;
    }
    if (!signature.trim()) {
      toast.error("Please provide your signature.");
      return;
    }

    try {
      setSubmitting(true);
      const res = await fetch("/api/coop-r-member/pending-payouts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          coopId: selectedCoopId,
          reason,
          signature,
        }),
      });

      const data = await res.json();
      if (data.success) {
        toast.success("Membership cancellation notice submitted successfully!");
        setShowCreateModal(false);
        // Reset form
        setSelectedCoopId("");
        setPreviewData(null);
        setReason("");
        setCheckedNonReversible(false);
        setCheckedAcknowledgeProcess(false);
        setSignature("");
        // Refresh table list
        await fetchPayouts();
      } else {
        toast.error(data.error || "Failed to submit cancellation notice.");
      }
    } catch (err) {
      console.error("Error submitting cancellation:", err);
      toast.error("An error occurred while submitting. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const selectedCoopName = coops.find((c) => c.coopId === selectedCoopId)?.name || "";

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-indigo-600 rounded-full border-t-transparent animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-6 bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 shadow-sm rounded-2xl flex items-center gap-4">
          <div className="p-4 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-full">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500 dark:text-slate-400">Total Notices Given</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-slate-100">{payouts.length}</p>
          </div>
        </div>

        <div className="p-6 bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 shadow-sm rounded-2xl flex items-center gap-4">
          <div className="p-4 bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-full">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500 dark:text-slate-400">Pending Payments</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-slate-100">
              {payouts.filter((p) => p.isPayPending).length}
            </p>
          </div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 shadow-sm rounded-2xl overflow-hidden">
        <div className="p-6 border-b border-gray-100 dark:border-slate-700 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-slate-100">Cancellation & Payout Notices</h3>
            <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
              Status of your membership cancellation and share payout settlements
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center justify-center px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl shadow-sm transition-colors gap-2"
          >
            <UserMinus className="w-4 h-4" />
            Create Kündigung
          </button>
        </div>

        <div className="overflow-x-auto">
          {payouts.length === 0 ? (
            <div className="p-8 text-center text-gray-400 italic">
              No cancellation notices found.
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 dark:bg-slate-900/50 text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider border-b border-gray-100 dark:border-slate-700">
                  <th className="py-4 px-6">Membership ID</th>
                  <th className="py-4 px-6">Coop Name</th>
                  <th className="py-4 px-6">Submission Date</th>
                  <th className="py-4 px-6">Shares</th>
                  <th className="py-4 px-6">Payouts</th>
                  <th className="py-4 px-6">Status</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                {payouts.map((p) => {
                  const rowClass = p.isPayPending
                    ? "bg-red-50/60 dark:bg-red-950/10 text-red-800 dark:text-red-300"
                    : "bg-green-50/60 dark:bg-green-950/10 text-green-800 dark:text-green-300";

                  return (
                    <tr key={p.id} className={`${rowClass} transition-colors text-sm`}>
                      <td className="py-4 px-6 font-medium">{p.memberId || "—"}</td>
                      <td className="py-4 px-6">{p.coopName}</td>
                      <td className="py-4 px-6">{formatDate(p.submissionDate)}</td>
                      <td className="py-4 px-6">{p.shares || "—"}</td>
                      <td className="py-4 px-6 font-semibold">
                        {p.price ? `€${parseFloat(p.price).toLocaleString("de-DE", { minimumFractionDigits: 2 })}` : "—"}
                      </td>
                      <td className="py-4 px-6">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${p.isPayPending
                          ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                          : "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                          }`}>
                          {p.isPayPending ? "Pending Payout" : "Paid"}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right space-x-2">
                        {/* Eye Button to see Transaction ID */}
                        {p.TransactionId && (
                          <button
                            onClick={() => setSelectedTxId(p.TransactionId)}
                            className="inline-flex items-center justify-center p-2 rounded-lg bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
                            title="View Transaction ID"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        )}
                        {/* Acknowledgment Download Button */}
                        <button
                          onClick={() => handleDownload(p)}
                          className="inline-flex items-center justify-center p-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm transition-colors"
                          title="Download Acknowledgment"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Give Notice Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm overflow-y-auto p-4">
          <div className="bg-white dark:bg-slate-800 max-w-lg w-full rounded-2xl shadow-xl overflow-hidden border border-gray-100 dark:border-slate-700 my-8">
            <div className="p-6 border-b border-gray-100 dark:border-slate-700 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900 dark:text-slate-100">Membership Cancellation Notice</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit}>
              <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
                {/* Coop Dropdown Selection */}
                <div>
                  <label className="block text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                    GenG Name
                  </label>
                  <select
                    value={selectedCoopId}
                    onChange={(e) => handleCoopChange(e.target.value)}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 dark:border-slate-700 dark:bg-slate-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-sm text-gray-800 dark:text-slate-200"
                    required
                  >
                    <option value="">Select a Cooperative</option>
                    {coops.filter((c) => c.status !== "NoticeGiven").map((c) => (
                      <option key={c.coopId} value={c.coopId}>{c.name}</option>
                    ))}
                  </select>
                </div>

                {/* Loading state for preview */}
                {previewLoading && (
                  <div className="flex items-center justify-center py-6">
                    <div className="w-6 h-6 border-2 border-indigo-600 rounded-full border-t-transparent animate-spin"></div>
                  </div>
                )}

                {/* Preview Fields */}
                {previewData && (
                  <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 dark:bg-slate-900/50 rounded-xl border border-gray-100 dark:border-slate-800">
                    <div>
                      <span className="block text-[10px] font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wider">
                        Member ID
                      </span>
                      <span className="text-sm font-semibold text-gray-800 dark:text-slate-200">
                        {previewData.memberId || "—"}
                      </span>
                    </div>

                    <div>
                      <span className="block text-[10px] font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wider">
                        Total Shares
                      </span>
                      <span className="text-sm font-semibold text-gray-800 dark:text-slate-200">
                        {previewData.shares}
                      </span>
                    </div>

                    <div className="mt-2">
                      <span className="block text-[10px] font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wider">
                        Estimated Payout
                      </span>
                      <span className="text-sm font-bold text-green-600 dark:text-green-400">
                        €{previewData.price.toLocaleString("de-DE", { minimumFractionDigits: 2 })}
                      </span>
                    </div>

                    <div className="mt-2">
                      <span className="block text-[10px] font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wider">
                        Submitted At
                      </span>
                      <span className="text-sm font-semibold text-gray-850 dark:text-slate-250">
                        {formatDate(previewData.submissionDate)}
                      </span>
                    </div>

                    <div className="col-span-2 mt-2 pt-2 border-t border-gray-100 dark:border-slate-800">
                      <span className="block text-[10px] font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wider">
                        Exit Date
                      </span>
                      <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400">
                        {formatDate(previewData.exitDate)}
                      </span>
                    </div>
                  </div>
                )}

                {/* Reason Textarea */}
                {previewData && (
                  <>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                        Reason for Cancellation
                      </label>
                      <textarea
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 dark:border-slate-700 dark:bg-slate-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-sm h-20 text-gray-800 dark:text-slate-200"
                        placeholder="Why are you canceling your membership? (Optional)"
                      />
                    </div>

                    {/* Legal Checkboxes */}
                    <div className="space-y-3 pt-2">
                      <label className="flex items-start gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={checkedNonReversible}
                          onChange={(e) => setCheckedNonReversible(e.target.checked)}
                          className="mt-1 rounded border-gray-300 dark:border-slate-600 text-indigo-600 focus:ring-indigo-500/20"
                          required
                        />
                        <span className="text-xs text-gray-600 dark:text-slate-300 select-none">
                          I am aware this step is <strong>not reversible</strong>.
                        </span>
                      </label>

                      <label className="flex items-start gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={checkedAcknowledgeProcess}
                          onChange={(e) => setCheckedAcknowledgeProcess(e.target.checked)}
                          className="mt-1 rounded border-gray-300 dark:border-slate-600 text-indigo-600 focus:ring-indigo-500/20"
                          required
                        />
                        <span className="text-xs text-gray-600 dark:text-slate-300 select-none">
                          I understand and acknowledge the cancellation and payout process of <strong>{selectedCoopName}</strong>.
                        </span>
                      </label>
                    </div>

                    {/* Signature Input */}
                    <div className="pt-2">
                      <label className="block text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                        Signature (Type your full name)
                      </label>
                      <input
                        type="text"
                        value={signature}
                        onChange={(e) => setSignature(e.target.value)}
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 dark:border-slate-700 dark:bg-slate-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-sm font-semibold text-gray-850 dark:text-slate-200"
                        placeholder="First-name Last-name"
                        required
                      />
                    </div>
                  </>
                )}
              </div>

              <div className="p-6 bg-gray-50 dark:bg-slate-900/50 border-t border-gray-100 dark:border-slate-700 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-150 dark:hover:bg-slate-800 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || !previewData || !checkedNonReversible || !checkedAcknowledgeProcess}
                  className="px-4 py-2 text-sm font-semibold text-white bg-red-600 hover:bg-red-750 disabled:bg-gray-300 dark:disabled:bg-slate-700 disabled:text-gray-500 dark:disabled:text-slate-400 rounded-lg shadow-sm transition-colors"
                >
                  {submitting ? "Submitting..." : "Give Notice"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Transaction Details Modal */}
      {selectedTxId && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 max-w-md w-full mx-4 rounded-2xl shadow-xl overflow-hidden border border-gray-100 dark:border-slate-700">
            <div className="p-6 border-b border-gray-100 dark:border-slate-700 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900 dark:text-slate-100">Transaction ID</h3>
              <button
                onClick={() => setSelectedTxId(null)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Below is the Transaction ID associated with this payout:
              </p>
              <div className="bg-gray-50 dark:bg-slate-900 p-4 rounded-xl border border-gray-100 dark:border-slate-800 flex items-center justify-between gap-2">
                <code className="text-sm font-mono text-indigo-600 dark:text-indigo-400 break-all select-all">
                  {selectedTxId}
                </code>
              </div>
            </div>
            <div className="p-6 bg-gray-50 dark:bg-slate-900/50 border-t border-gray-100 dark:border-slate-700 text-right">
              <button
                onClick={() => setSelectedTxId(null)}
                className="px-4 py-2 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
