import React, { useState } from "react";
import { XCircle } from "lucide-react";
import { toast } from "react-hot-toast";
import { rejectKycAction } from "@/lib/kycReviewClientService";

const KycRejectionModal = ({ isOpen, onClose, onSuccess, userId, coopId }) => {
  const [rejectReason, setRejectReason] = useState("");
  const [askResubmission, setAskResubmission] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleConfirmReject = async () => {
    if (!rejectReason.trim()) {
      toast.error("Please provide a reason for rejection.");
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await rejectKycAction(userId, rejectReason, askResubmission, coopId);
      if (result.success) {
        toast.success("Application rejected successfully.");
        onSuccess();
      } else {
        toast.error(result.error || "Rejection failed");
      }
    } catch (error) {
      console.error("Failed to reject KYC:", error);
      toast.error("An error occurred during rejection.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-gray-100 dark:border-slate-700 overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-4 text-red-600 dark:text-red-400">
            <XCircle size={24} />
            <h3 className="text-xl font-bold">Reject KYC Application</h3>
          </div>

          <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
            Please provide a clear reason for rejecting this member's verification. This feedback will be visible to the user.
          </p>

          <textarea
            autoFocus
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="e.g., ID document is blurry or expired..."
            className="w-full h-32 p-3 text-sm bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none transition-all resize-none dark:text-white"
          />

          <div className="flex items-center gap-3 mt-4 px-1">
            <input
              type="checkbox"
              id="askResubmission"
              checked={askResubmission}
              onChange={(e) => setAskResubmission(e.target.checked)}
              className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500 dark:bg-slate-900 dark:border-slate-700 cursor-pointer"
            />
            <label
              htmlFor="askResubmission"
              className="text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer select-none"
            >
              Ask for resubmission
            </label>
          </div>

          <div className="flex gap-3 mt-6">
            <button
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 px-4 py-2.5 text-sm font-semibold text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-slate-700 rounded-xl hover:bg-gray-200 dark:hover:bg-slate-600 transition-all disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmReject}
              disabled={isSubmitting || !rejectReason.trim()}
              className="flex-1 px-4 py-2.5 text-sm font-semibold text-white bg-red-600 rounded-xl hover:bg-red-700 shadow-lg shadow-red-600/20 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              ) : null}
              Confirm Rejection
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default KycRejectionModal;
