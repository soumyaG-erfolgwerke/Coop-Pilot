"use client";

import { useAuth } from "@/hooks/useAuth";
import { foundingAuditService } from "@/lib/foundingAuditService";
import {
  Archive,
  CheckCircle,
  ChevronDown,
  Download,
  FolderOpen,
  Loader2,
  MoreVertical,
  Plus,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { toast } from "react-hot-toast";
import { FoundingAuditWizard } from "./Wizard";

const FoundingAuditDashboard = ({ auditOrg }) => {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Read active sub-routing properties straight out of Next.js query parameter streams
  const activeAuditId = searchParams.get("auditId");

  const [activeMenuId, setActiveMenuId] = useState(null);
  const [audits, setAudits] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);

  // Modal local UI execution states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [auditNameInput, setAuditNameInput] = useState("");

  const orgId = auditOrg?.id;
  const userId = useAuth()?.user?.name || "unknown-user";

  const fetchAudits = async () => {
    try {
      setIsLoading(true);
      const data = await foundingAuditService.getAllOrgAudits(orgId);
      setAudits(data || []);
    } catch (error) {
      toast.error(error.message || "Failed to sync audit records.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (orgId) {
      fetchAudits();
    }
  }, [orgId, activeAuditId]);

  const handleCreateNewAudit = async (e) => {
    e.preventDefault();
    if (!auditNameInput.trim()) {
      toast.error("Please provide a valid name identifier.");
      return;
    }

    try {
      setIsCreating(true);
      const newAuditDoc = await foundingAuditService.createNewAudit(
        orgId,
        userId,
        auditNameInput.trim(),
      );
      toast.success("New founding audit instance initialized.");

      setAuditNameInput("");
      setIsModalOpen(false);
      await fetchAudits();

      router.push(`?tab=founding-audit&auditId=${newAuditDoc.$id}`);
    } catch (error) {
      toast.error(error.message || "Failed to create new audit instance.");
    } finally {
      setIsCreating(false);
    }
  };

  // Conditional Rendering of Wizard Interface
  if (activeAuditId) {
    return <FoundingAuditWizard auditId={activeAuditId} />;
  }

  // Model partitioning matching globalStatus attributes
  const activeAudits = audits.filter(
    (a) => a.globalStatus === "IN_PROGRESS" || !a.globalStatus,
  );
  const submittedAudits = audits.filter(
    (a) => a.globalStatus === "SUBMITTED" || a.globalStatus === "APPROVED",
  );
  const archivedAudits = audits.filter((a) => a.globalStatus === "ARCHIVED");

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[450px] gap-3">
        <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
        <span className="text-xs font-semibold tracking-wider text-gray-400 uppercase">
          Loading Audits...
        </span>
      </div>
    );
  }

  return (
    <div className="max-w-6xl px-8 py-10 mx-auto space-y-8 font-sans antialiased text-gray-900 select-none">
      {/* Refined Minimalist Header Bar Layout */}
      <div className="flex items-center justify-between pb-6 border-b border-gray-100">
        <div className="space-y-1">
          <h1 className="text-xl font-bold tracking-tight text-gray-900">
            Founding Audits
          </h1>
          <p className="text-xs text-gray-400">
            Legal verification processing queue under §11 Abs. 2 Nr. 3 GenG
            legislative requirements.
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          disabled={isCreating}
          className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white transition-all duration-150 bg-blue-600 rounded-lg shadow-sm hover:bg-blue-700 active:bg-blue-800 disabled:bg-blue-400"
        >
          {isCreating ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Plus className="w-3.5 h-3.5 stroke-[3]" />
          )}
          Create New Audit
        </button>
      </div>

      {/* CORE CONTROL CONTAINER: Reusable Uniform Accordion Structures */}
      <div className="space-y-4">
        <AccordionSection
          title="Active Audits"
          count={activeAudits.length}
          icon={<FolderOpen className="w-4 h-4 text-amber-500" />}
          initialOpen={true}
          activeMenuId={activeMenuId}
          setActiveMenuId={setActiveMenuId}
        >
          <AuditRowTable
            variant="active"
            dataList={activeAudits}
            router={router}
            activeMenuId={activeMenuId}
            setActiveMenuId={setActiveMenuId}
            onRefresh={fetchAudits}
          />
        </AccordionSection>

        <AccordionSection
          title="Submitted"
          count={submittedAudits.length}
          icon={<CheckCircle className="w-4 h-4 text-green-500" />}
          initialOpen={false}
          activeMenuId={activeMenuId}
          setActiveMenuId={setActiveMenuId}
        >
          <AuditRowTable
            variant="submitted"
            dataList={submittedAudits}
            router={router}
            activeMenuId={activeMenuId}
            setActiveMenuId={setActiveMenuId}
            onRefresh={fetchAudits}
          />
        </AccordionSection>

        <AccordionSection
          title="Archived"
          count={archivedAudits.length}
          icon={<Archive className="w-4 h-4 text-gray-400" />}
          initialOpen={false}
          activeMenuId={activeMenuId}
          setActiveMenuId={setActiveMenuId}
        >
          <AuditRowTable
            variant="archived"
            dataList={archivedAudits}
            router={router}
            activeMenuId={activeMenuId}
            setActiveMenuId={setActiveMenuId}
            onRefresh={fetchAudits}
          />
        </AccordionSection>

        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-950/40 backdrop-blur-sm animate-fadeIn">
            <div className="w-full max-w-md p-6 space-y-4 bg-white border border-gray-100 shadow-2xl rounded-xl animate-scaleUp">
              <h3 className="text-sm font-bold text-gray-900">
                Create Founding Audit
              </h3>

              <CreateNewForm
                value={auditNameInput}
                onChange={setAuditNameInput}
                onSubmit={handleCreateNewAudit}
                isCreating={isCreating}
                onCancel={() => {
                  setIsModalOpen(false);
                  setAuditNameInput("");
                }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * Reusable Functional Shell: Uniform Accordion Section Wrapper
 */

const AccordionSection = ({
  title,
  count,
  icon,
  initialOpen,
  setActiveMenuId,
  children,
}) => {
  const [isOpen, setIsOpen] = useState(initialOpen);

  return (
    <div className="overflow-visible bg-white border shadow-sm rounded-xl border-gray-200/80">
      <button
        onClick={() => {
          setIsOpen(!isOpen);
          setActiveMenuId(null);
        }}
        className="w-full px-5 py-3.5 flex items-center justify-between bg-gray-50/50 hover:bg-gray-50 transition text-xs font-bold text-gray-700 select-none"
      >
        <div className="flex items-center gap-2.5">
          {icon}
          <span>{title}</span>
          <span className="text-[10px] bg-gray-200/80 text-gray-500 px-1.5 py-0.5 rounded-full font-bold ml-0.5">
            {count}
          </span>
        </div>
        <ChevronDown
          className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
        />
      </button>
      {isOpen && (
        <div className="overflow-visible bg-white border-t border-gray-100 animate-fadeIn">
          {children}
        </div>
      )}
    </div>
  );
};

const AuditRowTable = ({
  dataList,
  variant,
  router,
  activeMenuId,
  setActiveMenuId,
  onRefresh,
}) => {
  if (dataList.length === 0) {
    return (
      <div className="py-6 text-xs font-medium text-center text-gray-400 border border-gray-100 border-dashed bg-gray-50/30 rounded-xl">
        No records found.
      </div>
    );
  }

  const isSubmittedVariant = variant === "submitted";

  return (
    <div className="w-full overflow-visible">
      <table className="w-full overflow-visible text-left border-collapse table-fixed">
        <thead>
          <tr className="bg-gray-100/80 text-[10px] font-bold uppercase tracking-wider text-gray-400 select-none h-10">
            <th className="pl-5 w-[33%] rounded-l-lg">Audit Name</th>
            <th className="w-[14%] px-3">Sector</th>
            <th className="w-[16%] px-3">Location Seat</th>
            <th className="w-[13%] px-3">Created At</th>
            <th className="w-[14%] px-3">
              {isSubmittedVariant ? "Submitted At" : "Last Updated"}
            </th>
            {isSubmittedVariant && (
              <th className="w-[6%] text-center px-1">Doc</th>
            )}
            <th className="w-[4%] text-center pr-4 rounded-r-lg"></th>
          </tr>
        </thead>
        <tbody className="overflow-visible text-xs text-gray-600 border-b border-gray-100 divide-y divide-gray-100 border-x rounded-b-xl">
          {dataList.map((audit) => (
            <tr
              key={audit.$id}
              className="h-12 overflow-visible transition-colors cursor-pointer hover:bg-gray-50/70"
              onClick={() =>
                router.push(`?tab=founding-audit&auditId=${audit.$id}`)
              }
            >
              <td className="pl-5 pr-4 font-bold text-gray-900 truncate transition-colors group hover:text-blue-600">
                {audit.auditName || "Untitled Session"}
              </td>
              <td className="px-3 font-semibold text-gray-400 truncate">
                {audit.sector || "—"}
              </td>
              <td className="px-3 text-gray-500 truncate">
                {audit.proposedCity || "—"}
              </td>
              <td className="px-3 font-mono text-[11px] text-gray-400">
                {new Date(audit.$createdAt).toLocaleDateString("de-DE")}
              </td>
              <td className="px-3 font-mono text-[11px] text-gray-400">
                {isSubmittedVariant && audit.submittedAt
                  ? new Date(audit.submittedAt).toLocaleDateString("de-DE")
                  : new Date(audit.$updatedAt).toLocaleDateString("de-DE")}
              </td>

              {/* Inline PDF Download Option for Submitted Lists */}
              {isSubmittedVariant && (
                <td
                  className="px-1 text-center"
                  onClick={(e) => e.stopPropagation()}
                >
                  {audit.gutachtenUrl ? (
                    <a
                      href={audit.gutachtenUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center p-1.5 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-md transition"
                      title="Download Audit Report (Gutachten)"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </a>
                  ) : (
                    <span className="text-gray-300 text-[10px] italic">—</span>
                  )}
                </td>
              )}

              <td
                className="pr-4 overflow-visible text-center"
                onClick={(e) => e.stopPropagation()}
              >
                <InlineActionMenu
                  variant={variant}
                  auditId={audit.$id}
                  activeMenuId={activeMenuId}
                  setActiveMenuId={setActiveMenuId}
                  onRefresh={onRefresh}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

/**
 * Isolated Controller Overlay: Dropdown context menu insulated against truncation
 */
const InlineActionMenu = ({
  auditId,
  variant,
  activeMenuId,
  setActiveMenuId,
  onRefresh,
}) => {
  const menuRef = useRef(null);
  const isOpen = activeMenuId === auditId;
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setActiveMenuId(null);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, setActiveMenuId]);

  const handleUpdateStatus = async (targetStatus) => {
    try {
      setIsProcessing(true);
      setActiveMenuId(null);
      await foundingAuditService.modifyAuditInstance(auditId, {
        globalStatus: targetStatus,
      });
      toast.success(
        targetStatus === "ARCHIVED"
          ? "Audit record moved to archive."
          : "Audit session record restored.",
      );
      await onRefresh();
    } catch (err) {
      toast.error(err.message || "Failed to execute transition action.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeleteInstance = async () => {
    try {
      setIsProcessing(true);
      setIsDeleteModalOpen(false);
      setActiveMenuId(null);

      // Update the status to 'DELETED' instead of dropping the document record
      await foundingAuditService.modifyAuditInstance(auditId, {
        globalStatus: "DELETED",
      });

      toast.success("Audit record deleted permanently.");
      await onRefresh();
    } catch (err) {
      toast.error(err.message || "Failed to update audit record status.");
      setIsProcessing(false);
    }
  };

  return (
    <div
      className="relative inline-block overflow-visible text-left"
      ref={menuRef}
    >
      <button
        onClick={() =>
          !isProcessing && setActiveMenuId(isOpen ? null : auditId)
        }
        disabled={isProcessing}
        className="inline-flex items-center justify-center w-6 h-6 text-gray-400 transition-colors rounded-md hover:text-gray-600 hover:bg-gray-100 focus:outline-none disabled:opacity-50"
      >
        {isProcessing ? (
          <Loader2 className="w-3 h-3 text-blue-500 animate-spin" />
        ) : (
          <MoreVertical className="w-3.5 h-3.5 stroke-[2.5]" />
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-1 w-44 rounded-lg bg-white border border-gray-200 shadow-xl z-50 py-1 animate-fadeIn text-left text-[11px] font-bold text-gray-500">
          {/* SURGICAL CONDITIONAL MENUS: Completely blocks archiving on submitted rows */}
          {variant === "active" && (
            <button
              onClick={() => handleUpdateStatus("ARCHIVED")}
              className="block w-full px-3.5 py-2 transition-colors hover:bg-gray-50 hover:text-gray-900 text-left"
            >
              Archive Audit
            </button>
          )}

          {variant === "archived" && (
            <button
              onClick={() => handleUpdateStatus("IN_PROGRESS")}
              className="block w-full px-3.5 py-2 transition-colors hover:bg-gray-50 hover:text-gray-900 text-left"
            >
              Restore Audit Session
            </button>
          )}

          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsDeleteModalOpen(true);
            }}
            className="block w-full px-3.5 py-2 transition-colors border-t border-gray-100 text-red-500 hover:bg-red-50 hover:text-red-600 text-left"
          >
            Delete Permanently
          </button>
        </div>
      )}

      <ConfirmModal
        open={isDeleteModalOpen}
        title="Remove Audit Instance"
        message="Are you sure you want to delete this audit instance? This operation cannot be undone."
        onCancel={(e) => {
          e?.stopPropagation();
          setIsDeleteModalOpen(false);
        }}
        onConfirm={(e) => {
          e?.stopPropagation();
          handleDeleteInstance();
        }}
      />
    </div>
  );
};

const CreateNewForm = ({ value, onChange, onSubmit, isCreating, onCancel }) => {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <label className="text-xs font-bold text-gray-600">
        Internal Audit Tracking Name <span className="text-red-500">*</span>
      </label>
      <input
        type="text"
        required
        autoFocus
        disabled={isCreating}
        value={value}
        placeholder="e.g., Gründungsprüfung Solar-Grid Berlin eG"
        onChange={(e) => onChange(e.target.value)}
        className="w-full text-xs font-semibold px-3.5 py-2.5 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition disabled:bg-gray-50 disabled:text-gray-400"
      />

      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={isCreating}
          className="px-3.5 py-2 text-xs font-bold text-gray-500 hover:bg-gray-50 rounded-lg transition border border-gray-200"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isCreating}
          className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:bg-blue-400 rounded-lg transition shadow-sm"
        >
          {isCreating && <Loader2 className="w-3 h-3 animate-spin" />}
          Confirm & Create
        </button>
      </div>
    </form>
  );
};

export const ConfirmModal = ({ open, title, message, onCancel, onConfirm, deleteOverride }) => {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      // Prevent clicks inside the backdrop from triggering the table row routing
      onClick={(e) => e.stopPropagation()}
    >
      <div className="w-full max-w-md p-5 bg-white shadow-lg rounded-xl dark:bg-slate-800">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          {title}
        </h2>

        <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
          {message}
        </p>

        <div className="flex justify-end gap-3 mt-5">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm transition-colors border rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 dark:text-gray-200 dark:border-slate-600"
          >
            Cancel
          </button>

          <button
            onClick={onConfirm}
            className="px-4 py-2 text-sm text-white transition-colors bg-red-600 rounded-lg hover:bg-red-700"
          >
            {deleteOverride ? deleteOverride : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default FoundingAuditDashboard;
