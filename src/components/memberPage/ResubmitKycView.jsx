"use client";
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Upload, 
  FileText, 
  AlertTriangle, 
  Info, 
  CheckCircle,
  X,
  CreditCard,
  UserCheck,
  ShieldAlert
} from "lucide-react";

import { useAuth } from "../../hooks/useAuth";
import useUserCache from "../../hooks/useUserCache";

const ResubmitKycView = ({ coopId }) => {
  const { user } = useAuth();
  const { refreshUser } = useUserCache();
  const [docType, setDocType] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [kycData, setKycData] = useState(null);
  const [error, setError] = useState(null);

  const fetchStatus = async () => {
    setLoading(true);
    try {
      const url = coopId ? `/api/member/kyc-status?coopId=${encodeURIComponent(coopId)}` : "/api/member/kyc-status";
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setKycData(data);
      }
    } catch (err) {
      console.error("Failed to fetch KYC status:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, [coopId]);

  const handleSubmit = async () => {
    if (!selectedFile || !docType || !user?.userId) return;

    setSubmitting(true);
    setError(null);

    // Map frontend IDs to backend document types
    const typeMapping = {
      id_card: "Personalausweis",
      passport: "Reisepass",
      residence_permit: "Aufenthaltstitel",
    };

    try {
      const formData = new FormData();
      formData.append("userId", user.userId);
      formData.append("file", selectedFile);
      formData.append("documentType", typeMapping[docType]);
      if (coopId) {
        formData.append("coopId", coopId);
      }

      const res = await fetch("/api/uploadKycDocument", {
        method: "POST",
        body: formData,
      });

      const result = await res.json();

      if (result.success) {
        // 1. Force refresh the user cache to update sidebar/header badges
        await refreshUser(user.userId);
        
        // 2. Refresh the local view status
        await fetchStatus();
      } else {
        setError(result.error || "Failed to upload document");
      }
    } catch (err) {
      console.error("Upload error:", err);
      setError("An unexpected error occurred during upload.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const onDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = () => {
    setIsDragging(false);
  };

  const onDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <div className="w-12 h-12 border-4 border-blue-600 rounded-full border-t-transparent animate-spin"></div>
        <p className="font-medium text-gray-500">Loading KYC status...</p>
      </div>
    );
  }

  // Case: Admin hasn't requested resubmission
  if (!kycData?.resubmissionRequested) {
    return (
      <div className="max-w-4xl p-6 mx-auto">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-12 space-y-6 text-center bg-white border border-gray-200 shadow-xl dark:bg-slate-800 dark:border-slate-700 rounded-3xl"
        >
          <div className="inline-block p-6 text-green-600 bg-green-100 rounded-full dark:bg-green-900/30">
            <CheckCircle size={64} />
          </div>
          <div>
            <h2 className="mb-2 text-2xl font-bold text-gray-800 dark:text-white">Everything is Up to Date</h2>
            <p className="max-w-md mx-auto text-gray-600 dark:text-gray-400">
              You have successfully submitted your documents. The admin hasn't asked for a resubmission yet. 
            </p>
            <p className="max-w-md mx-auto text-gray-600 dark:text-gray-400">
              Current Status: <span className="font-medium">{kycData.kycStatus}</span>
            </p>
          </div>
          <div className="pt-4">
            <div className="inline-flex items-center gap-2 px-4 py-2 text-sm text-gray-500 rounded-full bg-gray-50 dark:bg-slate-700/50">
              <Info size={16} /> Updated on {new Date().toLocaleDateString()}
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl p-6 mx-auto space-y-6">
      {/* Admin Feedback Section */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-start gap-4 p-6 border bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800 rounded-2xl"
      >
        <div className="p-3 bg-amber-100 dark:bg-amber-800 rounded-xl text-amber-600 dark:text-amber-400">
          <ShieldAlert size={28} />
        </div>
        <div>
          <h3 className="mb-1 text-lg font-bold text-amber-900 dark:text-amber-100">
            KYC Resubmission Required
          </h3>
          <p className="text-amber-800 dark:text-amber-300">
            The administrator has requested fresh documents for your account verification.
          </p>
          {kycData.reason && (
            <div className="p-3 mt-4 italic border rounded-lg bg-white/50 dark:bg-black/20 border-amber-200/50 text-amber-900 dark:text-amber-200">
              " {kycData.reason} "
            </div>
          )}
        </div>
      </motion.div>

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

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {/* Step 1: Document Type */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-4 md:col-span-1"
        >
          <div className="flex items-center gap-2 font-bold text-gray-700 dark:text-gray-200">
            <span className="flex items-center justify-center w-6 h-6 text-sm text-white bg-blue-600 rounded-full">1</span>
            Select Document Category
          </div>
          
          <div className="space-y-3">
            {[
              { id: "id_card", label: "Personalausweis", sub: "ID Card", icon: CreditCard },
              { id: "passport", label: "Reisepass", sub: "Passport", icon: UserCheck },
              { id: "residence_permit", label: "Aufenthaltstitel", sub: "Residence Permit", icon: FileText },
            ].map((type) => (
              <button
                key={type.id}
                disabled={submitting}
                onClick={() => setDocType(type.id)}
                className={`w-full p-4 rounded-xl border flex items-center gap-4 transition-all duration-200 group ${
                  docType === type.id 
                    ? "bg-blue-600 border-blue-600 text-white shadow-lg" 
                    : "bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700 hover:border-blue-400 text-gray-700 dark:text-gray-300"
                } ${submitting ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                <div className={`p-2 rounded-lg ${docType === type.id ? "bg-white/20" : "bg-gray-100 dark:bg-slate-700 group-hover:bg-blue-50 dark:group-hover:bg-blue-900/30"}`}>
                  <type.icon size={20} />
                </div>
                <div className="text-left">
                  <div className="text-sm font-bold">{type.label}</div>
                  <div className={`text-[10px] ${docType === type.id ? "text-blue-100" : "text-gray-500"}`}>{type.sub}</div>
                </div>
              </button>
            ))}
          </div>
        </motion.div>

        {/* Step 2: Upload */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-4 md:col-span-2"
        >
          <div className="flex items-center gap-2 font-bold text-gray-700 dark:text-gray-200">
            <span className="flex items-center justify-center w-6 h-6 text-sm text-white bg-blue-600 rounded-full">2</span>
            Upload Document
          </div>

          <div
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
            className={`relative h-[300px] border-2 border-dashed rounded-3xl flex flex-col items-center justify-center transition-all duration-300 ${
              isDragging 
                ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 scale-[1.02]" 
                : "border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800"
            } ${(!docType || submitting) ? "opacity-50 grayscale cursor-not-allowed" : "cursor-pointer"}`}
          >
            <input 
              type="file" 
              className="absolute inset-0 opacity-0 cursor-pointer disabled:cursor-not-allowed" 
              onChange={handleFileChange}
              disabled={!docType || submitting}
              accept="image/*,.pdf"
            />

            {!selectedFile ? (
              <div className="p-6 text-center pointer-events-none">
                <div className="inline-block p-5 mb-4 text-gray-400 bg-gray-100 rounded-full dark:bg-slate-700">
                  <Upload size={48} className={isDragging ? "animate-bounce text-blue-500" : ""} />
                </div>
                <h4 className="mb-2 text-lg font-bold text-gray-800 dark:text-gray-100">
                  {isDragging ? "Drop to upload" : "Click or drag to upload"}
                </h4>
                <p className="text-sm text-gray-500 max-w-[280px] mx-auto">
                  Only high-quality scans or photos of your document (JPEG, PNG, PDF). Max 5MB.
                </p>
                {!docType && (
                  <div className="flex items-center justify-center gap-2 mt-4 text-xs font-medium text-amber-600">
                    <Info size={14} /> Please select a category first
                  </div>
                )}
              </div>
            ) : (
              <div className="p-6 space-y-4 text-center">
                <div className="inline-block p-5 text-green-600 bg-green-100 rounded-full dark:bg-green-900/30">
                  <CheckCircle size={48} />
                </div>
                <div>
                  <h4 className="text-lg font-bold text-gray-800 dark:text-gray-100">{selectedFile.name}</h4>
                  <p className="text-sm text-gray-500">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
                {!submitting && (
                  <button 
                    onClick={(e) => { e.stopPropagation(); setSelectedFile(null); }}
                    className="flex items-center gap-2 mx-auto text-sm font-bold text-red-500 transition-colors hover:text-red-600"
                  >
                    <X size={16} /> Replace File
                  </button>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center gap-4 p-4 text-sm text-blue-800 bg-blue-50 dark:bg-blue-900/10 rounded-2xl dark:text-blue-300">
            <Info size={20} className="shrink-0" />
            <p>Ensure the document is valid, not expired, and all edges are visible in the upload.</p>
          </div>
        </motion.div>
      </div>

      {/* Button Section */}
      <div className="flex justify-end pt-4">
        <button 
          onClick={handleSubmit}
          disabled={!selectedFile || !docType || submitting}
          className="px-8 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 dark:disabled:bg-slate-700 text-white rounded-xl font-bold transition-all shadow-lg transform active:scale-95 flex items-center gap-2 min-w-[180px] justify-center"
        >
          {submitting ? (
            <>
              <div className="w-4 h-4 border-2 border-white rounded-full border-t-transparent animate-spin"></div>
              Uploading...
            </>
          ) : (
            "Proceed with Upload"
          )}
        </button>
      </div>
    </div>
  );
};

export default ResubmitKycView;
