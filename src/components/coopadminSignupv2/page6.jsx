"use client";

import React, { useState } from "react";
import {
  Upload,
  FileText,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { uploadOnboardingSatzung } from "@/lib/onboardingService";


const Page6 = ({
  formData,
  handleChange,
  errors,
}) => {
  const [uploading, setUploading] =
    useState(false);

  const [uploadError, setUploadError] =
    useState("");

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];

    if (!file) return;

    try {
      setUploading(true);
      setUploadError("");

      handleChange({
        target: {
          name: "satzungFile",
          value: file,
        },
      });
    } catch (error) {
      console.error(error);

      setUploadError(
        error.message ||
          "Failed to upload Satzung"
      );
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="text-center">
        <div className="flex items-center justify-center w-16 h-16 mx-auto bg-blue-50 rounded-2xl">
          <FileText className="w-8 h-8 text-blue-600" />
        </div>

        <h2 className="mt-4 text-3xl font-bold text-slate-900 dark:text-white">
          Upload Satzung
        </h2>

        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          Please upload the cooperative's Satzung.
        </p>
      </div>

      <div className="p-6 border-2 border-dashed rounded-2xl border-slate-300 dark:border-slate-700">
        <input
          type="file"
          accept=".pdf,.docx"
          onChange={handleFileUpload}
          className="hidden"
          id="satzung-upload"
        />

        <label
          htmlFor="satzung-upload"
          className="flex flex-col items-center justify-center cursor-pointer"
        >
          {uploading ? (
            <>
              <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />

              <p className="mt-4 text-sm font-medium">
                Uploading Satzung...
              </p>
            </>
          ) : formData.satzungFile ? (
            <>
              <CheckCircle2 className="w-10 h-10 text-green-600" />

              <p className="mt-4 font-semibold text-green-700">
                Satzung uploaded successfully
              </p>

              <p className="mt-1 text-sm text-slate-500">
                {formData.satzungFile?.name}
              </p>
            </>
          ) : (
            <>
              <Upload className="w-10 h-10 text-slate-400" />

              <p className="mt-4 font-semibold">
                Click to upload Satzung
              </p>

              <p className="mt-1 text-sm text-slate-500">
                PDF or DOCX up to 25MB
              </p>
            </>
          )}
        </label>
      </div>

      {uploadError && (
        <div className="flex items-start gap-2 p-4 text-red-700 border border-red-200 rounded-xl bg-red-50">
          <AlertCircle size={18} />

          <p className="text-sm">
            {uploadError}
          </p>
        </div>
      )}
    </div>
  );
};

export default Page6;