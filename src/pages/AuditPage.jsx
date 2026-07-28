"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { CheckCircle, AlertTriangle } from "lucide-react";
import {
  fetchAuditSchemaAndStatus,
  getCoopByIdForAudit as getCoopById,
} from "../lib/getCoopsService";
import { useAuth } from "../hooks/useAuth";
import {
  getAuditData,
  saveAuditData,
  updateAuditData,
} from "../lib/AuditService";
import { AuditStatusEnum, AuditStatusColors } from "../lib/AuditStatus";
import { notifyCoopSubmittedForAudit } from "../lib/customNotificationTemplates";
import toast from "react-hot-toast";
import FormFillUpPage from "@/components/formRender/FormFillUpPage";
import FormSkeleton from "@/components/formRender/FormSkeleton";
import Link from "next/link";

export default function AuditPage({ coopId }) {
  const [auditSchema, setAuditSchema] = useState(null);
  const [auditStatus, setAuditStatus] = useState(null);
  const [cooperative, setCooperative] = useState(null);
  const [initialData, setInitialData] = useState({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const { user } = useAuth();

  useEffect(() => {
    const loadAllData = async () => {
      setIsLoading(true);
      try {
        const coopData = await getCoopById(coopId);
        console.log("coopData", coopData);
        setCooperative(coopData || { name: "Unknown Cooperative" });

        const { auditSchema: fetchedSchema, auditStatus } =
          await fetchAuditSchemaAndStatus(coopId);
        setAuditStatus(auditStatus);
        setAuditSchema(fetchedSchema);

      } catch (error) {
        console.error("Failed to load audit data", error);
        toast.error("Failed to load audit");
      } finally {
        setIsLoading(false);
      }
    };

    if (coopId) {
      loadAllData();
    }
  }, []);

  const formatPayload = (compiledFormData) => {
    return {
      ...compiledFormData,
      cooperativeId: coopId,
      cooperativeName: cooperative?.name,
      submittedBy: user?.email || "Unknown User",
      lastModified: new Date().toISOString(),
    };
  };

  const handleAutoSave = async (compiledFormData) => {
    try {
      const payload = formatPayload(compiledFormData);
      await saveAuditData(
        coopId,
        JSON.stringify(payload),
        cooperative?.currentAuditId,
      );
    } catch (error) {
      console.error("Auto-save failed:", error);
      toast.error("Auto-save connection error");
    }
  };

  const handleSubmit = async (compiledFormData) => {
    const loadingToast = toast.loading("Submitting audit questionnaire...");
    try {
      const payload = formatPayload(compiledFormData);

      await updateAuditData(
        coopId,
        JSON.stringify(payload),
        cooperative?.currentAuditId,
      );

      if (user?.email && cooperative) {
        await notifyCoopSubmittedForAudit(user.email, cooperative);
      }

      toast.success("Audit submitted successfully!", { id: loadingToast });
      setIsSubmitted(true);
    } catch (error) {
      console.error("Submit failed:", error);
      toast.error("Failed to submit audit. Please try again.", {
        id: loadingToast,
      });
    }
  };

  const ScreenWrapper = ({ children }) => (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-50 via-slate-50 to-white dark:from-slate-900 dark:via-slate-950 dark:to-indigo-950/20 font-sans flex items-center justify-center p-2">
      {children}
    </div>
  );

  if (isLoading) {
    return <FormSkeleton />;
  }

  if (isSubmitted) {
    return (
      <ScreenWrapper>
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          className="p-2 sm:p-4 text-center bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl shadow-[0_8px_30px_rgb(0,0,0,0.08)] border border-white/50 dark:border-slate-800 rounded-xl max-w-lg relative overflow-hidden"
        >
          <div className="absolute w-48 h-48 rounded-full -top-24 -right-24 bg-gradient-to-br from-emerald-400/20 to-teal-500/20 blur-3xl"></div>

          <div className="relative z-10">
            <div className="flex items-center justify-center w-20 h-20 mx-auto mb-6 rounded-full shadow-inner bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400">
              <CheckCircle className="w-10 h-10" strokeWidth={2.5} />
            </div>

            <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">
              Audit Submitted!
            </h1>
            <p className="mt-4 font-medium leading-relaxed text-slate-500 dark:text-slate-400">
              Thank you. Your audit questionnaire for{" "}
              <strong className="text-slate-700 dark:text-slate-200">
                {cooperative?.name}
              </strong>{" "}
              has been successfully submitted and is securely saved. It is now
              under review by the administration team.
            </p>
            <Link
              href={`/dashboard`}
              className="inline-flex items-center px-6 py-3 mt-6 font-semibold tracking-wide text-white transition-all duration-200 rounded-lg bg-gradient-to-r from-slate-900 to-slate-700 hover:from-slate-700 hover:to-slate-900 dark:from-slate-200 dark:to-slate-400 dark:hover:from-slate-400 dark:hover:to-slate-200 hover:shadow-lg"
            >
              Back to Dashboard
            </Link>
          </div>
        </motion.div>
      </ScreenWrapper>
    );
  }

  if (auditStatus === "SUBMITTED" || auditStatus === "UNDER_REVIEW") {
    return (
      <ScreenWrapper>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-lg p-2 sm:p-4 text-center bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl shadow-[0_8px_30px_rgb(0,0,0,0.08)] rounded-xl border-t-4 border-t-amber-400 relative overflow-hidden"
        >
          <div className="absolute w-48 h-48 rounded-full -top-24 -right-24 bg-amber-400/10 blur-3xl"></div>

          <div className="relative z-10">
            <div className="flex justify-center mb-6">
              <div className="p-5 shadow-inner bg-amber-100 dark:bg-amber-900/30 rounded-2xl">
                <AlertTriangle
                  className="w-10 h-10 text-amber-600 dark:text-amber-500"
                  strokeWidth={2.5}
                />
              </div>
            </div>

            <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
              Audit Under Review
            </h1>
            <p className="mt-4 font-medium leading-relaxed text-slate-600 dark:text-slate-400">
              The audit for{" "}
              <strong className="text-slate-800 dark:text-slate-200">
                {cooperative?.name}
              </strong>{" "}
              is currently{" "}
              <span
                className={`inline-flex px-2.5 py-1 rounded-lg text-[11px] font-black uppercase tracking-wider ml-1 ${AuditStatusColors[auditStatus] || "bg-slate-200 text-slate-800"}`}
              >
                {AuditStatusEnum[auditStatus] || auditStatus}
              </span>
              .
            </p>

            <div className="w-full h-px my-6 bg-slate-200 dark:bg-slate-800"></div>

            <p className="text-sm font-medium text-slate-500 dark:text-slate-500">
              You cannot edit or view this audit form at the moment. Please
              contact your audit administrator if you require further
              assistance.
            </p>
            <Link
              href={`/dashboard`}
              className="inline-flex items-center px-6 py-3 mt-6 font-semibold tracking-wide text-white transition-all duration-200 rounded-lg bg-gradient-to-r from-slate-900 to-slate-700 hover:from-slate-700 hover:to-slate-900 dark:from-slate-200 dark:to-slate-400 dark:hover:from-slate-400 dark:hover:to-slate-200 hover:shadow-lg"
            >
              Back to Dashboard
            </Link>
          </div>
        </motion.div>
      </ScreenWrapper>
    );
  }

  return (
    <FormFillUpPage
      auditSchema={auditSchema}
      initialData={initialData}
      onAutoSave={handleAutoSave}
      onSubmit={handleSubmit}
    />
  );
}
