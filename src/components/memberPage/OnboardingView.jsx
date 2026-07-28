"use client";
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  RefreshCcw, 
  CheckCircle,
  AlertTriangle,
  Info,
  Building,
  ArrowRight,
  ShieldCheck,
  Check
} from "lucide-react";
import toast from "react-hot-toast";

const OnboardingView = () => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedCoopIds, setSelectedCoopIds] = useState([]);
  const [error, setError] = useState(null);

  const fetchOnboardingRecords = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/member/onboarding");
      const data = await res.json();
      if (data.success) {
        setRecords(data.data || []);
        // Initially all selected
        setSelectedCoopIds((data.data || []).map(r => r.coopId));
      } else {
        setError(data.error || "Failed to load onboarding invitations");
      }
    } catch (err) {
      console.error("Error fetching onboarding records:", err);
      setError("An unexpected error occurred while loading onboarding records.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOnboardingRecords();
  }, []);

  const handleToggleSelect = (coopId) => {
    if (selectedCoopIds.includes(coopId)) {
      setSelectedCoopIds(selectedCoopIds.filter(id => id !== coopId));
    } else {
      setSelectedCoopIds([...selectedCoopIds, coopId]);
    }
  };

  const handleToggleAll = () => {
    if (selectedCoopIds.length === records.length) {
      setSelectedCoopIds([]);
    } else {
      setSelectedCoopIds(records.map(r => r.coopId));
    }
  };

  const handleProceed = async () => {
    if (selectedCoopIds.length === 0) return;

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/member/onboarding", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ coopIds: selectedCoopIds })
      });

      const data = await res.json();
      if (data.success) {
        toast.success(data.message || "Onboarding completed successfully!");
        // Refresh the list
        await fetchOnboardingRecords();
      } else {
        setError(data.error || "Failed to complete onboarding.");
        toast.error(data.error || "Failed to complete onboarding.");
      }
    } catch (err) {
      console.error("Error during onboarding proceed:", err);
      setError("An unexpected error occurred. Please try again.");
      toast.error("An unexpected error occurred.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <div className="w-12 h-12 border-4 border-blue-600 rounded-full border-t-transparent animate-spin"></div>
        <p className="font-medium text-gray-500">Checking pending invitations...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl p-6 mx-auto space-y-6 animate-fadeIn">
      {/* Header card */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 shadow-sm rounded-2xl p-6">
        <div>
          <h2 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
            <Building className="text-blue-600 dark:text-blue-400" size={24} />
            Cooperative Onboarding
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Accept invitations to join cooperatives where you are pre-registered.
          </p>
        </div>
        <div>
          <button
            onClick={fetchOnboardingRecords}
            disabled={submitting}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-gray-700 dark:text-gray-200 bg-gray-50 dark:bg-slate-700 hover:bg-gray-100 dark:hover:bg-slate-600 border border-gray-200 dark:border-slate-600 rounded-xl transition duration-150"
            title="Refresh invitations list"
          >
            <RefreshCcw size={16} className={`${submitting ? "animate-spin" : ""}`} />
            Manual Refresh
          </button>
        </div>
      </div>

      {error && (
        <motion.div 
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-3 p-4 text-sm text-red-700 border border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800 rounded-xl dark:text-red-400"
        >
          <AlertTriangle size={18} />
          {error}
        </motion.div>
      )}

      {records.length === 0 ? (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-12 text-center bg-white border border-gray-200 shadow-sm dark:bg-slate-800 dark:border-slate-700 rounded-2xl space-y-4"
        >
          <div className="inline-block p-4 text-green-600 bg-green-50 dark:bg-green-950/20 rounded-full">
            <ShieldCheck size={48} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-800 dark:text-white">No Pending Invitations</h3>
            <p className="max-w-md mx-auto text-sm text-gray-500 dark:text-gray-400 mt-1">
              You are currently not whitelisted or pre-registered in any pending cooperatives.
            </p>
          </div>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          {/* Table / List card */}
          <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 shadow-sm rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-700 flex justify-between items-center bg-gray-50/50 dark:bg-slate-900/10">
              <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                Pending Cooperatives ({records.length})
              </span>
              <button
                onClick={handleToggleAll}
                className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-semibold"
              >
                {selectedCoopIds.length === records.length ? "Deselect All" : "Select All"}
              </button>
            </div>

            <div className="divide-y divide-gray-100 dark:divide-slate-700">
              {records.map((record) => {
                const isSelected = selectedCoopIds.includes(record.coopId);
                return (
                  <div 
                    key={record.$id}
                    onClick={() => handleToggleSelect(record.coopId)}
                    className={`flex items-center justify-between p-6 cursor-pointer hover:bg-gray-50/50 dark:hover:bg-slate-700/10 transition-colors ${
                      isSelected ? "bg-blue-50/10 dark:bg-blue-950/5" : ""
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      {/* Checkbox */}
                      <div 
                        className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${
                          isSelected 
                            ? "bg-blue-600 border-blue-600 text-white" 
                            : "border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700"
                        }`}
                      >
                        {isSelected && <Check size={14} className="stroke-[3]" />}
                      </div>
                      
                      <div className="space-y-1">
                        <h4 className="text-md font-bold text-gray-800 dark:text-white">
                          {record.coopName}
                        </h4>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500 dark:text-gray-400">
                          {record.membershipId && (
                            <span>Membership ID: <strong className="font-semibold text-gray-700 dark:text-gray-200">{record.membershipId}</strong></span>
                          )}
                          <span>Shares: <strong className="font-semibold text-gray-700 dark:text-gray-200">{record.shares}</strong></span>
                          <span>Joining Date: <strong className="font-semibold text-gray-700 dark:text-gray-200">{new Date(record.joinedDate).toLocaleDateString()}</strong></span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Action button */}
          <div className="flex justify-end pt-2">
            <button
              onClick={handleProceed}
              disabled={selectedCoopIds.length === 0 || submitting}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 dark:disabled:bg-slate-700 text-white font-semibold rounded-xl shadow-md transition duration-150 flex items-center gap-2"
            >
              {submitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white rounded-full border-t-transparent animate-spin"></div>
                  Accepting Onboarding...
                </>
              ) : (
                <>
                  Proceed Onboarding
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </div>
        </motion.div>
      )}

      {/* Discrepancies message */}
      <div className="flex items-center gap-3 p-4 border bg-gray-50 dark:bg-slate-800/50 border-gray-200 dark:border-slate-700 rounded-xl mt-6">
        <Info size={18} className="text-gray-400 dark:text-gray-500 shrink-0" />
        <p className="text-xs text-gray-500 dark:text-gray-400">
          For any discrepancies please contact respective Cooperative Admins
        </p>
      </div>
    </div>
  );
};

export default OnboardingView;
