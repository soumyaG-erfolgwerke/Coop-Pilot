import React, { useState } from "react";
import { CheckCircle } from "lucide-react";
import { toast } from "react-hot-toast";
import { acceptKycAction } from "@/lib/kycReviewClientService";

const KycApprovalModal = ({ isOpen, onClose, onSuccess, userId, coopId }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleConfirmApprove = async () => {
    setIsSubmitting(true);
    try {
      const result = await acceptKycAction(userId, coopId);

      if (result.success) {
        toast.success("Member verification approved!");
        onSuccess();
      } else {
        toast.error(result.error || "Approval failed");
      }
    } catch (error) {
      console.error("Failed to approve KYC:", error);
      toast.error("An unexpected error occurred during approval.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-gray-100 dark:border-slate-700 overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-4 text-green-600 dark:text-green-400">
            <CheckCircle size={24} />
            <h3 className="text-xl font-bold">Approve Verification?</h3>
          </div>

          <p className="mb-6 text-sm text-gray-600 dark:text-gray-400">
            Are you sure you want to verify this member? This will grant them full access to cooperative services.
          </p>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 px-4 py-2.5 text-sm font-semibold text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-slate-700 rounded-xl hover:bg-gray-200 dark:hover:bg-slate-600 transition-all disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmApprove}
              disabled={isSubmitting}
              className="flex-1 px-4 py-2.5 text-sm font-semibold text-white bg-green-600 rounded-xl hover:bg-green-700 shadow-lg shadow-green-600/20 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              ) : null}
              Confirm & Verify
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default KycApprovalModal;
