// eaxctly like ../AuditerPage/AuditStatusButtons.jsx but for subaudits
// and instead of button only take  action (pass/fail) that should send feedback to the user through issues and update the subaudit status to approved
import { setSubAuditStatus } from "@/lib/AuditService";
import { CheckCircle, XCircle } from "lucide-react";
import React, { useState } from "react";
import toast from "react-hot-toast";

const SubAuditStatusButtons = ({
  auditId,
  coopId,
  currentStatus,
  reload,
  userEmail,
}) => {
  const [loading, setLoading] = useState(false);

  const handlePass = async () => {
    setLoading(true);
    try {
      const res = await setSubAuditStatus(auditId, userEmail, true);
      // console.log("res", res);
      if (res.ok) {
        toast.success("Subaudit approved successfully!");
        reload();
      }
    } catch (e) {
      // console.error(e);
      toast.error("Failed to update subaudit status.");
    } finally {
      setLoading(false);
    }
  };

  const handleFail = async () => {
    setLoading(true);
    try {
      const res = await setSubAuditStatus(auditId, userEmail, false);
      // console.log("res", res);
      if (res.ok) {
        toast.success("Subaudit failed successfully!");
        reload();
      }
    } catch (e) {
      // console.error(e);
      toast.error("Failed to update subaudit status.");
    } finally {
      setLoading(false);
    }
  };
  return (
    // change them to 2 buttons only, 1 for pass and 1 for fail
    // and instead of button only take  action (pass/fail) that should send feedback to the user through issues and update the subaudit status to approved
    // in case of fail take list of failed items from the parent
    <div className="flex items-center gap-2">
      <button
        onClick={handlePass}
        disabled={loading}
        className="inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium text-white transition focus:outline-none disabled:opacity-50 bg-emerald-600 hover:bg-emerald-700 disabled:cursor-not-allowed"
      >
        <CheckCircle size={14} />
        {loading === true ? "Updating…" : "Pass"}
      </button>
      <button
        onClick={handleFail}
        disabled={loading}
        className="inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium text-white transition focus:outline-none disabled:opacity-50 bg-rose-600 hover:bg-rose-700 disabled:cursor-not-allowed"
      >
        <XCircle size={14} />
        {loading === true ? "Updating…" : "Fail"}
      </button>
    </div>
  );
};

export default SubAuditStatusButtons;
