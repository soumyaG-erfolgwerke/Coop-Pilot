"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import toast from "react-hot-toast";
import {
  ShieldCheck,
  Calendar,
  User,
  FileText,
  ClipboardList,
  CheckCircle,
  XCircle,
  RefreshCw,
  AlertCircle,
  Eye,
} from "lucide-react";

import FormSkeleton from "@/components/formRender/FormSkeleton";
import AuditStatusButtons from "@/components/ReviewAudit/AuditStatusButtons";
import CreateTicketButton from "@/components/AuditerPage/CreateTicketButton";
import TicketsByCoopModal from "@/components/AuditerPage/TicketsByCoopModal";
import AuditReportModal from "@/components/AuditerPage/AuditReportModal";

import { getAuditData, getAuditHistoryById } from "@/lib/AuditService";
import { getCoopByIdForAudit as getCoopById } from "@/lib/getCoopsService";
import { AuditStatusColors, AuditStatusEnum } from "@/lib/AuditStatus";
import FormReview from "@/components/FormReview/FormReview";
import SubAuditStatusButtons from "@/components/ReviewAudit/SubAuditStatusButtons";
import { useAuth } from "@/hooks/useAuth";
import { getLogedInUser } from "@/services/userServices/_userHelpers";

export default function AuditReviewPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const coopId = params?.coopId;
  const auditId = params?.auditId;

  const [audit, setAudit] = useState(null);
  const [auditData, setAuditData] = useState(null);
  const [cooperative, setCooperative] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reload, setReload] = useState(0);
  // const [user, setUser] = useState(null);

  const isReviewMode = searchParams.get("review") === "true";
  const { user } = useAuth();

  const loadAudit = async () => {
    // console.log("user", user);
    // setUser(user);
    try {
      setLoading(true);

      const [auditResponse, coopData, auditData] = await Promise.all([
        getAuditData(coopId, auditId),
        getCoopById(coopId),
        getAuditHistoryById(auditId),
      ]);
      // console.log("auditData", auditData);

      setCooperative(coopData);
      setAuditData(auditData);

      if (!auditResponse?.auditData) {
        throw new Error("Audit data not found");
      }

      const parsedAudit =
        typeof auditResponse.auditData === "string"
          ? JSON.parse(auditResponse.auditData)
          : auditResponse.auditData;

      setAudit(parsedAudit);
    } catch (error) {
      // console.error(error);
      toast.error(error.message || "Failed to load audit");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!coopId) return;

    loadAudit();
  }, [coopId, auditId, reload]);

  const Logo = cooperative?.logoComponent;

  if (loading) {
    return <FormSkeleton />;
  }

  if (!audit) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen font-bold bg-slate-50 dark:bg-slate-950 text-slate-500">
        <FileText className="w-12 h-12 mb-4 text-slate-300" />
        <p className="text-xl">Audit not found</p>
      </div>
    );
  }

  if (user?.role === "member") {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen font-bold bg-slate-50 dark:bg-slate-950 text-slate-500">
        <AlertCircle className="w-12 h-12 mb-4 text-slate-300" />
        <p className="text-xl">
          You do not have permission to access this page
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-12 font-sans text-gray-900 bg-gray-50 dark:bg-gray-950 dark:text-gray-100">
      <div className="w-full px-4 py-4 mx-auto space-y-1 max-w-7xl sm:px-4 lg:px-6">
        {cooperative && (
          <section className="animate-fadeIn">
            <div className="bg-white border border-gray-200 rounded-md shadow-sm dark:bg-gray-900 dark:border-gray-800">
              <div className="p-4 sm:p-5">
                {/* Top Section: Title & Meta */}
                <div className="flex flex-col mb-4">
                  <div className="flex flex-wrap items-baseline mb-3 gap-x-4 gap-y-2">
                    <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl dark:text-white">
                      {cooperative.name}
                    </h1>

                    <div className="flex flex-wrap items-center gap-3 text-xs font-medium text-gray-500 dark:text-gray-400">
                      <div className="flex items-center gap-1.5">
                        <User size={14} className="text-gray-400" />
                        <span>{audit.submittedBy || "Unknown User"}</span>
                      </div>
                      <div className="hidden w-px h-3 bg-gray-300 sm:block dark:bg-gray-700"></div>
                      <div className="flex items-center gap-1.5">
                        <Calendar size={14} className="text-gray-400" />
                        <span>
                          {audit.completedAt
                            ? new Date(audit.completedAt).toLocaleDateString()
                            : "No Date"}
                        </span>
                      </div>
                      <div className="hidden w-px h-3 bg-gray-300 sm:block dark:bg-gray-700"></div>
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wide border ${
                          audit &&
                          ((audit.auditType || "").toLowerCase() === "full" ||
                            (audit.title || "").toLowerCase().includes("full"))
                            ? "text-purple-700 bg-purple-50 border-purple-200 dark:text-purple-400 dark:bg-purple-900/20 dark:border-purple-800"
                            : "text-blue-700 bg-blue-50 border-blue-200 dark:text-blue-400 dark:bg-blue-900/20 dark:border-blue-800"
                        }`}
                      >
                        {audit &&
                        ((audit.auditType || "").toLowerCase() === "full" ||
                          (audit.title || "").toLowerCase().includes("full"))
                          ? "Full Comprehensive Form"
                          : "Simple Audit Form"}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center text-xs font-medium text-gray-600 gap-x-3 gap-y-2 dark:text-gray-400">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-bold tracking-wider text-blue-700 uppercase bg-blue-50 dark:bg-blue-900/30 dark:text-blue-400 rounded-md border border-blue-100 dark:border-blue-800">
                      <ClipboardList size={14} />
                      {audit.title}
                    </span>

                    {cooperative.auditStatus && (
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider rounded-md border
                        ${AuditStatusColors[cooperative.auditStatus] || "bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700"}`}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-current opacity-75"></span>
                        {AuditStatusEnum[cooperative.auditStatus] ||
                          cooperative.auditStatus}
                      </span>
                    )}

                    <div className="hidden w-px h-4 mx-1 bg-gray-300 sm:block dark:bg-gray-700"></div>

                    <div
                      className={`flex items-center gap-1.5 px-2 py-1 rounded-md border ${
                        auditData.isSubApproved
                          ? "text-green-700 bg-green-50 border-green-200 dark:text-green-400 dark:bg-green-900/20 dark:border-green-800"
                          : auditData.isSubApproved === false
                            ? "text-red-700 bg-red-50 border-red-200 dark:text-red-400 dark:bg-red-900/20 dark:border-red-800"
                            : "text-yellow-700 bg-yellow-50 border-yellow-200 dark:text-yellow-400 dark:bg-yellow-900/20 dark:border-yellow-800"
                      }`}
                    >
                      {auditData.isSubApproved ? (
                        <CheckCircle size={14} />
                      ) : auditData.isSubApproved === false ? (
                        <XCircle size={14} />
                      ) : (
                        <RefreshCw size={14} />
                      )}
                      <span className="font-semibold">
                        {auditData.isSubApproved
                          ? "Approved by Sub-auditor"
                          : auditData.isSubApproved === false
                            ? "Denied by Sub-auditor"
                            : "Pending Sub-auditor"}
                      </span>
                    </div>
                  </div>

                  {audit.description && (
                    <p className="max-w-3xl mt-4 text-sm leading-relaxed text-gray-600 dark:text-gray-400">
                      {audit.description}
                    </p>
                  )}
                </div>

                {/* Bottom Section: Actions Toolbar */}
                <div className="flex flex-col justify-between gap-3 pt-4 border-t border-gray-200 sm:flex-row sm:items-center dark:border-gray-800">
                  {/* Left Side: Approvals */}
                  <div className="flex flex-wrap items-center gap-3">
                    {(user.role === "org_admin" || user.role === "auditer") &&
                      cooperative.auditStatus !== "IN_PROGRESS" &&
                      isReviewMode && (
                        <AuditStatusButtons
                          auditId={auditId}
                          coopId={cooperative.id}
                          userEmail={user.email}
                          currentStatus={cooperative.auditStatus}
                          reload={() => loadAudit()}
                        />
                      )}
                    {user.role === "aud_E" &&
                      auditData.isSubApproved === null &&
                      cooperative.auditStatus !== "IN_PROGRESS" &&
                      isReviewMode && (
                        <SubAuditStatusButtons
                          auditId={auditId}
                          coopId={coopId}
                          userEmail={user.email}
                          currentStatus={cooperative.auditStatus}
                          reload={() => loadAudit()}
                        />
                      )}
                  </div>

                  {/* Right Side: Quick Actions */}
                  <div className="flex flex-wrap items-center gap-3">
                    {cooperative.auditStatus !== "IN_PROGRESS" &&
                      ["aud_E", "aud_A", "org_admin"].includes(user.role) &&
                      isReviewMode && (
                        <>
                          <CreateTicketButton
                            coopid={coopId}
                            auditId={cooperative?.currentAuditId}
                          />
                          <TicketsByCoopModal coopId={coopId} />
                          <AuditReportModal coopId={coopId} />
                        </>
                      )}

                    {!isReviewMode && (
                      <div className="inline-flex items-center justify-center w-full gap-2 px-4 py-2 text-sm font-semibold text-blue-700 transition-colors border rounded-lg border-blue-200/50 bg-blue-100/40 sm:w-auto focus:outline-none focus:ring-1 focus:ring-blue-500 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-300">
                        <Eye size={16} /> View Mode
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        <div className="pt-2">
          <FormReview audit={audit} />
        </div>
      </div>
    </div>
  );
}
