import React, { useState } from "react";
import { RefreshCcw } from "lucide-react";
import { toast } from "react-hot-toast";
import { resubmitKycAction } from "@/lib/kycReviewClientService";

/**
 * KycResubmissionModal - A confirmation modal to ask a member for KYC resubmission.
 */
const KycResubmissionModal = ({ isOpen, onClose, onSuccess, userId, coopId }) => {
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleConfirmResubmit = async () => {
    if (!reason.trim()) {
      toast.error("Please provide a reason for the resubmission request.");
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await resubmitKycAction(userId, reason, coopId);
      if (result.success) {
        toast.success("Resubmission requested successfully.");
        onSuccess();
      } else {
        toast.error(result.error || "Failed to request resubmission.");
      }
    } catch (error) {
      console.error("Failed to request resubmission:", error);
      toast.error("An error occurred while requesting resubmission.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-gray-100 dark:border-slate-700 overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-6 text-center">
          <div className="flex flex-col items-center gap-4 mb-6">
            <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-full text-yellow-600 dark:text-yellow-400">
              <RefreshCcw size={32} className="animate-spin-slow" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">Ask for Resubmission?</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 px-4">
              Please provide a reason for the resubmission request. This helps the member understand what went wrong.
            </p>
          </div>

          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g., The provided ID image is cropped, please upload the full document..."
            className="w-full h-32 p-3 mb-6 text-sm bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-transparent outline-none transition-all resize-none dark:text-white"
          />

          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 px-4 py-2.5 text-sm font-semibold text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-slate-700 rounded-xl hover:bg-gray-200 dark:hover:bg-slate-600 transition-all disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmResubmit}
              disabled={isSubmitting || !reason.trim()}
              className="flex-1 px-4 py-2.5 text-sm font-semibold text-white bg-yellow-600 rounded-xl hover:bg-yellow-700 shadow-lg shadow-yellow-600/20 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              ) : null}
              Request Resubmission
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default KycResubmissionModal;
