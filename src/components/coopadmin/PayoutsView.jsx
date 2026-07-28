"use client";

import React, { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { Search, Eye, Wallet, Landmark, RefreshCcw, X, CreditCard, Calendar, CheckCircle2 } from "lucide-react";
import toast from "react-hot-toast";

// Helper function to format ISO date strings to German format
const formatDate = (isoString) => {
  if (!isoString) return "—";
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return isoString;
    return d.toLocaleDateString("de-DE");
  } catch (error) {
    return isoString;
  }
};

export default function PayoutsView({ selectedCoop, coops }) {
  const [payouts, setPayouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("pending"); // "pending" | "completed"
  const [searchQuery, setSearchQuery] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  // Modals state
  const [selectedPayoutForPay, setSelectedPayoutForPay] = useState(null);
  const [selectedPayoutForView, setSelectedPayoutForView] = useState(null);
  const [transactionIdInput, setTransactionIdInput] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch payouts for the selected cooperative
  useEffect(() => {
    const fetchPayouts = async () => {
      if (!selectedCoop) return;
      try {
        setLoading(true);
        const res = await fetch(`/api/coop-r-member/pending-payouts?coopId=${selectedCoop}`);
        const data = await res.json();
        if (data.success) {
          setPayouts(data.payouts || []);
        } else {
          toast.error(data.error || "Failed to load payouts.");
        }
      } catch (err) {
        console.error("Error loading payouts:", err);
        toast.error("An error occurred while loading payouts.");
      } finally {
        setLoading(false);
      }
    };

    fetchPayouts();
  }, [selectedCoop, refreshKey]);

  // Filter payouts based on tab and search query
  const filteredPayouts = useMemo(() => {
    return payouts.filter((p) => {
      // Tab filter
      const tabMatch = activeTab === "pending" ? p.isPayPending : !p.isPayPending;
      if (!tabMatch) return false;

      // Search query filter
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      const memberName = p.memberProfile?.name?.toLowerCase() || "";
      const memberEmail = p.memberProfile?.email?.toLowerCase() || "";
      const memberIban = p.memberProfile?.iban?.toLowerCase() || "";
      const memberId = p.memberId?.toLowerCase() || "";
      const txId = p.TransactionId?.toLowerCase() || "";

      return (
        memberName.includes(q) ||
        memberEmail.includes(q) ||
        memberIban.includes(q) ||
        memberId.includes(q) ||
        txId.includes(q)
      );
    });
  }, [payouts, activeTab, searchQuery]);

  // Statistics calculation
  const stats = useMemo(() => {
    const pending = payouts.filter((p) => p.isPayPending);
    const completed = payouts.filter((p) => !p.isPayPending);

    const pendingTotal = pending.reduce((sum, p) => sum + (parseFloat(p.price) || 0), 0);
    const completedTotal = completed.reduce((sum, p) => sum + (parseFloat(p.price) || 0), 0);

    return {
      pendingCount: pending.length,
      pendingTotal,
      completedCount: completed.length,
      completedTotal,
    };
  }, [payouts]);

  // Handle pay submit
  const handlePaySubmit = async (e) => {
    e.preventDefault();
    if (!selectedPayoutForPay) return;
    if (!transactionIdInput.trim()) {
      toast.error("Transaction ID is required.");
      return;
    }

    try {
      setSubmitting(true);
      const res = await fetch("/api/coop-r-member/pending-payouts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          payoutId: selectedPayoutForPay.id,
          TransactionId: transactionIdInput.trim(),
        }),
      });

      const data = await res.json();
      if (data.success) {
        toast.success("Payout processed successfully!");
        setSelectedPayoutForPay(null);
        setTransactionIdInput("");
        // Trigger refresh
        setRefreshKey((prev) => prev + 1);
      } else {
        toast.error(data.error || "Failed to process payout.");
      }
    } catch (err) {
      console.error("Error submitting payout:", err);
      toast.error("An error occurred while submitting. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 animate-fadeIn">
      {/* Overview stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        <div className="p-6 bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700/80 shadow-md rounded-2xl flex items-center gap-4">
          <div className="p-4 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 rounded-full">
            <Wallet className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500 dark:text-slate-400">Total Pending Payouts</p>
            <p className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-slate-100 mt-0.5">
              €{stats.pendingTotal.toLocaleString("de-DE", { minimumFractionDigits: 2 })}
            </p>
            <p className="text-xs text-gray-400 dark:text-slate-500 mt-1">
              Across {stats.pendingCount} notices given
            </p>
          </div>
        </div>

        <div className="p-6 bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700/80 shadow-md rounded-2xl flex items-center gap-4">
          <div className="p-4 bg-green-50 dark:bg-green-950/20 text-green-600 dark:text-green-400 rounded-full">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500 dark:text-slate-400">Total Paid Out</p>
            <p className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-slate-100 mt-0.5">
              €{stats.completedTotal.toLocaleString("de-DE", { minimumFractionDigits: 2 })}
            </p>
            <p className="text-xs text-gray-400 dark:text-slate-500 mt-1">
              Across {stats.completedCount} processed payouts
            </p>
          </div>
        </div>
      </div>

      {/* Filter and Table Card */}
      <div className="bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700/80 shadow-md rounded-2xl overflow-hidden">
        <div className="p-6 border-b border-gray-100 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          {/* Tab switches */}
          <div className="flex bg-gray-55 dark:bg-slate-900/60 p-1 rounded-xl w-fit">
            <button
              onClick={() => setActiveTab("pending")}
              className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors flex items-center gap-2 ${activeTab === "pending"
                ? "bg-white dark:bg-slate-800 text-red-600 dark:text-red-400 shadow-sm"
                : "text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-300"
                }`}
            >
              Pending
              <span className={`px-1.5 py-0.5 text-[10px] font-bold rounded-full ${activeTab === "pending"
                ? "bg-red-50 text-red-600 dark:bg-red-950/30 dark:text-red-400"
                : "bg-gray-150 dark:bg-slate-800 text-gray-500"
                }`}>
                {stats.pendingCount}
              </span>
            </button>
            <button
              onClick={() => setActiveTab("completed")}
              className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors flex items-center gap-2 ${activeTab === "completed"
                ? "bg-white dark:bg-slate-800 text-green-600 dark:text-green-400 shadow-sm"
                : "text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-300"
                }`}
            >
              Completed
              <span className={`px-1.5 py-0.5 text-[10px] font-bold rounded-full ${activeTab === "completed"
                ? "bg-green-50 text-green-600 dark:bg-green-950/30 dark:text-green-400"
                : "bg-gray-150 dark:bg-slate-800 text-gray-500"
                }`}>
                {stats.completedCount}
              </span>
            </button>
          </div>

          {/* Search bar */}
          <div className="relative max-w-sm w-full">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search member, email, IBAN..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-slate-700 dark:bg-slate-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-xs text-gray-800 dark:text-slate-200"
            />
          </div>
        </div>

        {/* List Table */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 space-y-3">
              <div className="w-8 h-8 border-4 border-indigo-600 rounded-full border-t-transparent animate-spin"></div>
              <span className="text-xs text-gray-500 dark:text-slate-400">Loading payout records...</span>
            </div>
          ) : filteredPayouts.length === 0 ? (
            <div className="py-16 text-center text-gray-400 italic text-sm">
              No payout records found.
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 dark:bg-slate-900/50 text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider border-b border-gray-100 dark:border-slate-700">
                  <th className="py-4 px-6">Member ID & Details</th>
                  <th className="py-4 px-6">Bank Account details</th>
                  <th className="py-4 px-6 text-center">Shares</th>
                  <th className="py-4 px-6 text-right">Payout Amount</th>
                  <th className="py-4 px-6">Submission Date</th>
                  <th className="py-4 px-6">Exit Date</th>
                  {/* {activeTab === "completed" && <th className="py-4 px-6">Transaction ID</th>} */}
                  <th className="py-4 px-6 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                {filteredPayouts.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50/50 dark:hover:bg-slate-900/10 transition-colors text-sm text-gray-800 dark:text-slate-350">
                    {/* Member Details */}
                    <td className="py-4 px-6">
                      <div className="font-semibold text-gray-900 dark:text-slate-100">
                        {p.memberProfile?.name || "Unknown Member"}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
                        {p.memberProfile?.email || "—"} • ID: <span className="font-mono">{p.memberId || "—"}</span>
                      </div>
                    </td>

                    {/* Bank Details */}
                    <td className="py-4 px-6">
                      <div className="text-xs font-semibold text-gray-700 dark:text-slate-300">
                        {p.memberProfile?.accountHolder || "—"}
                      </div>
                      <div className="text-xs font-mono text-gray-500 dark:text-slate-400 mt-0.5">
                        {p.memberProfile?.iban || "—"}
                      </div>
                    </td>

                    {/* Shares count */}
                    <td className="py-4 px-6 text-center font-bold text-gray-900 dark:text-slate-100">
                      {p.shares || 0}
                    </td>

                    {/* Payout Amount */}
                    <td className="py-4 px-6 text-right font-extrabold text-indigo-600 dark:text-indigo-400">
                      €{parseFloat(p.price || 0).toLocaleString("de-DE", { minimumFractionDigits: 2 })}
                    </td>

                    {/* Dates */}
                    <td className="py-4 px-6 text-xs text-gray-600 dark:text-slate-400">
                      {formatDate(p.submissionDate)}
                    </td>
                    <td className="py-4 px-6 text-xs text-gray-600 dark:text-slate-400">
                      {formatDate(p.exitDate)}
                    </td>

                    {/* Transaction ID if completed */}
                    {/* {activeTab === "completed" && (
                      <td className="py-4 px-6">
                        <span className="font-mono text-xs text-indigo-600 dark:text-indigo-350 bg-indigo-50 dark:bg-indigo-950/30 px-2 py-1 rounded">
                          {p.TransactionId}
                        </span>
                      </td>
                    )} */}

                    {/* Action column */}
                    <td className="py-4 px-6 text-right">
                      {p.isPayPending ? (
                        <button
                          onClick={() => {
                            setSelectedPayoutForPay(p);
                            setTransactionIdInput("");
                          }}
                          className="px-3.5 py-1.5 bg-red-600 hover:bg-red-750 text-white text-xs font-bold rounded-lg shadow-sm transition-colors flex items-center gap-1.5 ml-auto"
                        >
                          <Landmark className="w-3.5 h-3.5" />
                          Pay
                        </button>
                      ) : (
                        <button
                          onClick={() => setSelectedPayoutForView(p)}
                          className="p-2 bg-gray-100 hover:bg-gray-250 dark:bg-slate-700 dark:hover:bg-slate-600 text-gray-700 dark:text-gray-300 rounded-lg shadow-sm transition-colors inline-flex"
                          title="View Transaction Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Pay Modal Dialog */}
      {selectedPayoutForPay && mounted && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-800 max-w-md w-full rounded-2xl shadow-xl overflow-hidden border border-gray-100 dark:border-slate-700 my-8 animate-scaleIn">
            <div className="p-6 border-b border-gray-100 dark:border-slate-700 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900 dark:text-slate-100 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-indigo-600" />
                Process Cancellation Payout
              </h3>
              <button
                onClick={() => setSelectedPayoutForPay(null)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handlePaySubmit}>
              <div className="p-6 space-y-4">
                {/* Member detail summary */}
                <div className="p-4 bg-gray-50 dark:bg-slate-900/50 border border-gray-100 dark:border-slate-800 rounded-xl space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-400">Recipient Name</span>
                    <span className="font-semibold text-gray-800 dark:text-slate-200">
                      {selectedPayoutForPay.memberProfile?.name || "—"}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-400">Account Holder</span>
                    <span className="font-semibold text-gray-800 dark:text-slate-200">
                      {selectedPayoutForPay.memberProfile?.accountHolder || "—"}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-400">IBAN</span>
                    <span className="font-mono font-semibold text-gray-850 dark:text-slate-200">
                      {selectedPayoutForPay.memberProfile?.iban || "—"}
                    </span>
                  </div>
                  <div className="my-2 border-t border-gray-200/50 dark:border-slate-800"></div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-400">Shares Cancelled</span>
                    <span className="font-semibold text-gray-800 dark:text-slate-200">
                      {selectedPayoutForPay.shares || 0}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm pt-1">
                    <span className="text-gray-500 font-medium">Payout Value</span>
                    <span className="font-extrabold text-indigo-600 dark:text-indigo-400">
                      €{parseFloat(selectedPayoutForPay.price || 0).toLocaleString("de-DE", { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>

                {/* Input Field for Transaction ID */}
                <div>
                  <label className="block text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                    Bank Transaction Reference ID (Transaction ID)
                  </label>
                  <input
                    type="text"
                    required
                    value={transactionIdInput}
                    onChange={(e) => setTransactionIdInput(e.target.value)}
                    placeholder="Enter transaction, check, or wire transfer reference"
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 dark:border-slate-700 dark:bg-slate-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-sm text-gray-800 dark:text-slate-200 font-semibold"
                  />
                  <p className="text-[10px] text-gray-400 mt-1">
                    Entering this reference registers the transfer. This payout moves to completed and notifies the member.
                  </p>
                </div>
              </div>

              <div className="p-6 bg-gray-50 dark:bg-slate-900/50 border-t border-gray-100 dark:border-slate-700 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedPayoutForPay(null)}
                  className="px-4 py-2 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-150 dark:hover:bg-slate-800 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-755 disabled:bg-gray-300 dark:disabled:bg-slate-700 disabled:text-gray-500 dark:disabled:text-slate-400 rounded-lg shadow-sm transition-colors"
                >
                  {submitting ? "Saving..." : "Confirm Payment"}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Transaction Details Modal (Eye Button) */}
      {selectedPayoutForView && mounted && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-800 max-w-md w-full rounded-2xl shadow-xl overflow-hidden border border-gray-100 dark:border-slate-700 animate-scaleIn">
            <div className="p-6 border-b border-gray-100 dark:border-slate-700 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900 dark:text-slate-100">
                Payout Transaction Reference
              </h3>
              <button
                onClick={() => setSelectedPayoutForView(null)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="space-y-1">
                <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Member</span>
                <p className="text-sm font-semibold text-gray-800 dark:text-slate-200">
                  {selectedPayoutForView.memberProfile?.name || "—"} ({selectedPayoutForView.memberProfile?.email || "—"})
                </p>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Payout Amount</span>
                <p className="text-sm font-bold text-green-600 dark:text-green-400">
                  €{parseFloat(selectedPayoutForView.price || 0).toLocaleString("de-DE", { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Transaction ID / Reference UID</span>
                <div className="bg-gray-55 dark:bg-slate-900 p-4 rounded-xl border border-gray-100 dark:border-slate-800">
                  <code className="text-sm font-mono text-indigo-600 dark:text-indigo-400 break-all select-all font-bold">
                    {selectedPayoutForView.TransactionId}
                  </code>
                </div>
              </div>
            </div>
            <div className="p-6 bg-gray-50 dark:bg-slate-900/50 border-t border-gray-100 dark:border-slate-700 text-right">
              <button
                onClick={() => setSelectedPayoutForView(null)}
                className="px-4 py-2 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
