"use client";

import React, { useState, useEffect } from "react";
import useUserCache from "../../hooks/useUserCache";
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  RefreshCcw, 
  AlertCircle 
} from "lucide-react";

/**
 * Smart KYC Status Badge
 * Can either take a 'status' directly or fetch it using an 'id'.
 */
const UserKycStatus = ({ id, status: directStatus }) => {
  const [kycStatus, setKycStatus] = useState(directStatus || "PENDING");
  const { getUserById } = useUserCache();

  useEffect(() => {
    // Only fetch if a status wasn't provided directly
    if (id && !directStatus) {
      async function fetchKyc(userId) {
        if (!userId) return;
        try {
          const userDetails = await getUserById(userId);
          setKycStatus(userDetails.kycStatus || "PENDING");
        } catch (err) {
          console.error("Failed to fetch kyc status for", userId, err);
        }
      }
      fetchKyc(id);
    } else if (directStatus) {
      setKycStatus(directStatus);
    }
  }, [id, directStatus, getUserById]);

  const getStatusConfig = (status) => {
    switch (status?.toUpperCase()) {
      case "VERIFIED":
        return {
          label: "Verified",
          icon: CheckCircle,
          styles: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800",
        };
      case "REJECTED":
        return {
          label: "Rejected",
          icon: XCircle,
          styles: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800",
        };
      case "RESUBMISSION_REQUIRED":
        return {
          label: "Resubmission",
          icon: RefreshCcw,
          styles: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 border-orange-200 dark:border-orange-800",
        };
      case "PENDING":
      case undefined:
      case null:
      case "":
        return {
          label: "Pending",
          icon: Clock,
          styles: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800",
        };
      default:
        return {
          label: status,
          icon: AlertCircle,
          styles: "bg-slate-100 text-slate-700 dark:bg-slate-900/30 dark:text-slate-400 border-slate-200 dark:border-slate-800",
        };
    }
  };

  const config = getStatusConfig(kycStatus);
  const Icon = config.icon;

  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold border shadow-sm transition-all duration-300 ${config.styles}`}>
      {Icon && <Icon size={12} className={kycStatus === "RESUBMISSION_REQUIRED" ? "animate-spin-slow" : ""} />}
      {config.label}
    </span>
  );
};

export default UserKycStatus;
