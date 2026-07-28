"use client";

import { G2ValidationSchema } from "@/lib/founding-audit/schema";
import { foundingAuditService } from "@/lib/foundingAuditService";
import { AlertCircle, FileText, Loader2, Trash2, Upload } from "lucide-react";
import { forwardRef, useImperativeHandle, useState } from "react";
import { toast } from "react-hot-toast";
import { G2_METADATA } from "@/lib/founding-audit/formMetadata";

const getFileNameFromUrl = (url) => {
  if (!url) return "Document.pdf";
  const match = url.match(/[?&]filename=([^&]+)/);
  if (!match) return "Document.pdf";
  const rawFilename = match[1];
  try {
    return decodeURIComponent(rawFilename);
  } catch {
    return rawFilename.replace(/%20/g, " ");
  }
};

const PhaseG2Documents = forwardRef(({ data, onChange, isReadOnly }, ref) => {
  const [localErrors, setLocalErrors] = useState({});
  const [uploadingItemId, setUploadingItemId] = useState(null);

  const currentItems = data?.items ?? [];

  useImperativeHandle(ref, () => ({
    validate() {
      const result = G2ValidationSchema.safeParse({ items: currentItems });
      if (result.success) {
        setLocalErrors({});
        return true;
      }

      const errorsMap = {};
      result.error.issues.forEach((issue) => {
        const rowIndex = issue.path[1];
        const fieldKey = issue.path[2];
        if (rowIndex !== undefined && fieldKey) {
          errorsMap[`${rowIndex}-${fieldKey}`] = issue.message;
        }
      });
      setLocalErrors(errorsMap);
      return false;
    },
  }));

  const handleUpdateField = (index, field, value) => {
    const updatedItems = currentItems.map((item, idx) => {
      if (idx !== index) return item;
      const mutatedRow = { ...item, [field]: value };

      if (field === "notApplicable" && value === true) {
        mutatedRow.checked = false;
        mutatedRow.fileUrls = [];
      }
      return mutatedRow;
    });

    onChange({ items: updatedItems });

    // Target error clearing
    setLocalErrors((prev) => {
      const next = { ...prev };
      delete next[`${index}-${field}`];
      delete next[`${index}-checked`];
      delete next[`${index}-fileUrls`];
      return next;
    });
  };

  const handleFileUploadStream = async (index, itemId, file) => {
    if (!file) return;
    try {
      setUploadingItemId(itemId);
      const result = await foundingAuditService.uploadAuditFile(file);
      const targetItem = currentItems[index];
      const updatedUrls = [...(targetItem.fileUrls ?? []), result.fileUrl];

      handleUpdateField(index, "fileUrls", updatedUrls);
      toast.success(`${file.name} attached successfully.`);
    } catch (err) {
      toast.error(err.message || "Failed to attach document copy.");
    } finally {
      setUploadingItemId(null);
    }
  };

  const handleFilePurgeStream = async (index, fileUrl) => {
    try {
      const targetItem = currentItems[index];
      const updatedUrls = targetItem.fileUrls.filter((url) => url !== fileUrl);

      handleUpdateField(index, "fileUrls", updatedUrls);
      await foundingAuditService.deleteAuditFile(fileUrl);
      toast.success("Attachment removed successfully.");
    } catch (err) {
      toast.error(err.message || "Failed to remove attachment.");
    }
  };

  return (
    <div className="space-y-6 overflow-visible select-none animate-fadeIn">
      <div className="pb-4 border-b border-gray-100">
        <h2 className="text-xl font-bold tracking-tight text-gray-900">
          Phase G2: Founding Documents Registry
        </h2>
        <p className="max-w-2xl mt-1 text-xs leading-relaxed text-gray-400">
          Review, check presence parameters, and attach digital PDF copies for
          each mandatory or operational legal instrument.
        </p>
      </div>

      <div className="space-y-4 overflow-visible">
        {currentItems.map((item, index) => (
          <DocumentCardItem
            key={item.itemId}
            item={item}
            index={index}
            isReadOnly={isReadOnly}
            isUploading={uploadingItemId === item.itemId}
            isMandatory={!!G2_METADATA[index]?.isLocked}
            errorMap={localErrors}
            onUpdateField={handleUpdateField}
            onUploadFile={handleFileUploadStream}
            onDeleteFile={handleFilePurgeStream}
          />
        ))}
      </div>
    </div>
  );
});

/**
 * Isolated Atomic Sub-Component
 */
const DocumentCardItem = ({
  item,
  index,
  isReadOnly,
  isUploading,
  isMandatory,
  errorMap,
  onUpdateField,
  onUploadFile,
  onDeleteFile,
}) => {
  const isWaived = !!item.notApplicable;

  const hasVerificationError = errorMap[`${index}-checked`];
  const hasFileError = errorMap[`${index}-fileUrls`];
  const inputError = errorMap[`${index}-auditorNote`];

  // Centralized Matrix Permissions Map
  const permissions = {
    canMarkNotApplicable: !isReadOnly && !isMandatory,
    canVerify: !isReadOnly && !isWaived,
    canEditNotes: !isReadOnly && !isWaived,
    canUpload: !isReadOnly && !isWaived && !isUploading,
    canDeleteFiles: !isReadOnly && !isWaived && !isUploading,
  };

  const cardBorderClass =
    hasVerificationError || hasFileError
      ? "border-red-200 bg-red-50/10 shadow-red-50/10"
      : isWaived
        ? "border-gray-200 bg-gray-50/60 opacity-75"
        : "border-gray-200 bg-white hover:border-gray-300/80 shadow-gray-100/50";

  return (
    <div
      className={`border rounded-xl p-5 transition-all duration-150 shadow-sm space-y-4 overflow-visible ${cardBorderClass}`}
    >
      {/* Identity Headers */}
      <div className="flex items-start justify-between w-full border-b border-gray-50 pb-2.5">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="text-[10px] font-mono font-bold bg-gray-100 text-gray-500 px-2 py-0.5 border border-gray-200/60 rounded shadow-inner">
              {G2_METADATA[index]?.itemId}
            </span>
            <h3
              className={`text-sm font-bold tracking-tight ${isWaived ? "text-gray-400 line-through" : "text-gray-900"}`}
            >
              {G2_METADATA[index]?.nameEn}
            </h3>
            {G2_METADATA[index]?.isLocked && (
              <span className="text-[9px] bg-blue-50 text-blue-600 font-semibold px-1.5 py-0.5 rounded border border-blue-100 uppercase tracking-wider">
                Mandatory
              </span>
            )}
          </div>
          <p className="text-[11px] text-gray-400 font-mono italic pl-1">
            {G2_METADATA[index]?.intent}
          </p>
        </div>
      </div>

      {/* Control Configuration Interface Grid */}
      <div className="grid items-center grid-cols-1 gap-5 overflow-visible md:grid-cols-12">
        {/* Checkbox Actions */}
        <div className="flex items-center gap-5 md:col-span-4">
          <label className="flex items-center gap-2 text-xs font-bold text-gray-600 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={isWaived}
              disabled={!permissions.canMarkNotApplicable}
              onChange={(e) =>
                onUpdateField(index, "notApplicable", e.target.checked)
              }
              className="w-4 h-4 text-blue-600 transition border-gray-300 rounded focus:ring-blue-500/20 disabled:opacity-40 disabled:cursor-not-allowed"
            />
            <span>Not Applicable</span>
          </label>

          <label className="relative flex items-center gap-2 text-xs font-bold cursor-pointer select-none">
            <input
              type="checkbox"
              checked={!!item.checked}
              disabled={!permissions.canVerify}
              onChange={(e) =>
                onUpdateField(index, "checked", e.target.checked)
              }
              className="w-4 h-4 text-green-600 transition border-gray-300 rounded focus:ring-green-500/20 disabled:opacity-30 disabled:cursor-not-allowed"
            />
            <span className={isWaived ? "text-gray-300" : "text-gray-800"}>
              Verified Present
            </span>

            {hasVerificationError && (
              <span className="absolute -bottom-4 left-0 text-[9px] text-red-500 font-bold whitespace-nowrap animate-pulse flex items-center gap-0.5">
                <AlertCircle className="w-2.5 h-2.5" /> Check required
              </span>
            )}
          </label>
        </div>

        {/* Input/Attachment Controls */}
        <div className="w-full overflow-visible md:col-span-8">
          {!isWaived ? (
            <div className="space-y-2 overflow-visible">
              <div className="flex items-center w-full gap-3 overflow-visible">
                {/* Upload Anchor */}
                <label
                  className={`flex items-center gap-1.5 px-3 py-2 border border-gray-200/80 hover:border-gray-300 bg-white hover:bg-gray-50 rounded-lg text-[11px] font-bold text-gray-600 transition shadow-sm select-none shrink-0 cursor-pointer ${
                    !permissions.canUpload
                      ? "opacity-50 pointer-events-none cursor-not-allowed"
                      : ""
                  }`}
                >
                  {isUploading ? (
                    <Loader2 className="w-3.5 h-3.5 text-blue-600 animate-spin" />
                  ) : (
                    <Upload className="w-3.5 h-3.5 text-gray-400" />
                  )}
                  <span>Attach PDF</span>
                  <input
                    type="file"
                    accept="application/pdf"
                    className="hidden"
                    disabled={!permissions.canUpload}
                    onChange={(e) =>
                      onUploadFile(index, item.itemId, e.target.files?.[0])
                    }
                  />
                </label>

                {/* Annotation Reference Field */}
                <div className="relative w-full">
                  <input
                    type="text"
                    placeholder="Add auditor annotations or legal reference markers..."
                    value={item.auditorNote ?? ""}
                    disabled={!permissions.canEditNotes}
                    onChange={(e) =>
                      onUpdateField(index, "auditorNote", e.target.value)
                    }
                    className={`w-full px-3 py-2 text-xs font-semibold text-gray-700 placeholder-gray-300 transition bg-white border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/10 disabled:bg-transparent disabled:border-transparent disabled:px-0 disabled:text-gray-400 ${
                      inputError
                        ? "border-red-300 focus:border-red-500"
                        : "border-gray-200 focus:border-blue-500"
                    }`}
                  />
                </div>
              </div>

              {/* Dynamic Native File Names Map */}
              {item.fileUrls && item.fileUrls.length > 0 && (
                <div className="pt-1 pr-1 space-y-1 overflow-y-auto max-h-24">
                  {item.fileUrls.map((url) => (
                    <div
                      key={url}
                      className="flex items-center justify-between bg-gray-50 border border-gray-100 rounded-lg px-3 py-1 text-[11px] h-7 animate-fadeIn"
                    >
                      <a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 text-blue-600 font-bold hover:underline truncate max-w-[90%]"
                      >
                        <FileText className="flex-shrink-0 w-3.5 h-3.5 text-blue-400" />
                        <span className="truncate">
                          {getFileNameFromUrl(url)}
                        </span>
                      </a>

                      <button
                        type="button"
                        disabled={!permissions.canDeleteFiles}
                        onClick={() => onDeleteFile(index, url)}
                        className="p-1 text-gray-400 transition-colors rounded hover:text-red-500 disabled:opacity-30 disabled:pointer-events-none"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {hasFileError && (
                <span className="text-[10px] text-red-500 font-bold flex items-center gap-1 mt-1 animate-pulse">
                  <AlertCircle className="w-3 h-3 shrink-0" /> At least one
                  verified digital file upload copy is legally required.
                </span>
              )}
            </div>
          ) : (
            <span className="block pl-1 text-xs italic font-medium text-gray-400 select-none">
              Document row check waived by organization.
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

PhaseG2Documents.displayName = "PhaseG2Documents";
DocumentCardItem.displayName = "DocumentCardItem";
export { PhaseG2Documents };
