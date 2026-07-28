"use client";

import { CheckboxField } from "@/components/orgadmin/FoundingAudit/FormFields";
import { G4ValidationSchema } from "@/lib/founding-audit/schema";
import { foundingAuditService } from "@/lib/foundingAuditService";
import { ConfirmModal } from "@/components/orgadmin/FoundingAudit/Dashboard";
import {
  AlertTriangle,
  Check,
  Edit2,
  FileText,
  Loader2,
  Plus,
  Trash2,
  Upload,
} from "lucide-react";
import {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useMemo,
  useState,
} from "react";
import { toast } from "react-hot-toast";

// ─────────────────────────────────────────────────────────────────────────────
// TYPES (JSDoc for IDE support)
// ─────────────────────────────────────────────────────────────────────────────
/**
 * @typedef {'FOUNDING_MEMBER'|'VORSTAND'|'AUFSICHTSRAT'|'BEVOLLMAECHTIGTER'} MemberType
 * @typedef {{ id: string, memberType: MemberType, title?: string, firstName: string,
 *   lastName: string, dateOfBirth?: string|null, address?: string|null, role?: string|null,
 *   shares?: number|null, shareValueEur?: number|null, capitalCommittedEur?: number|null,
 *   cvUrl?: string|null, suitabilityAssessment?: string|null, suitabilityResult?: string|null
 * }} Member
 * @typedef {{ isAufsichtsratWaived: boolean, members: Member[] }} G4Data
 */

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────
const MEMBER_TYPES = /** @type {const} */ ({
  FOUNDING_MEMBER: "FOUNDING_MEMBER",
  VORSTAND: "VORSTAND",
  AUFSICHTSRAT: "AUFSICHTSRAT",
  BEVOLLMAECHTIGTER: "BEVOLLMAECHTIGTER",
});

const APPEND_KEY = (type) => `append-${type}`;

// ─────────────────────────────────────────────────────────────────────────────
// ROOT COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
const PhaseG4Organs = forwardRef(
  ({ data, onChange, isReadOnly, auditId }, ref) => {
    /**
     * STATE ARCHITECTURE
     *
     * activeEditRowId  – at most ONE row is in edit mode at a time. null = none.
     * syncingId        – the id of the row (or APPEND_KEY(type)) currently awaiting
     *                    a network response. null = idle. Drives all loading spinners.
     * uploadingRowId   – row whose CV file is currently uploading (separate from
     *                    general sync so the save button remains usable).
     * localErrors      – flat map of `${memberId}-${fieldKey}` → error message,
     *                    reset per-row on successful save.
     */
    const [activeEditRowId, setActiveEditRowId] = useState(null);
    const [syncingId, setSyncingId] = useState(null);
    const [uploadingRowId, setUploadingRowId] = useState(null);
    const [localErrors, setLocalErrors] = useState({});
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [memberToDelete, setMemberToDelete] = useState(null);

    const members = data?.members ?? [];
    const isAufsichtsratWaived = !!data?.isAufsichtsratWaived;

    // ── Derived slices ──────────────────────────────────────────────────────────
    const foundingMembers = useMemo(
      () =>
        members.filter((m) => m.memberType === MEMBER_TYPES.FOUNDING_MEMBER),
      [members],
    );
    const vorstandMembers = useMemo(
      () => members.filter((m) => m.memberType === MEMBER_TYPES.VORSTAND),
      [members],
    );
    const aufsichtsratMembers = useMemo(
      () => members.filter((m) => m.memberType === MEMBER_TYPES.AUFSICHTSRAT),
      [members],
    );
    const representativeMembers = useMemo(
      () =>
        members.filter((m) => m.memberType === MEMBER_TYPES.BEVOLLMAECHTIGTER),
      [members],
    );

    const totalCommittedCapital = useMemo(
      () =>
        foundingMembers.reduce(
          (sum, m) =>
            sum + Number(m.shares || 0) * Number(m.shareValueEur || 0),
          0,
        ),
      [foundingMembers],
    );

    // ── Helpers ─────────────────────────────────────────────────────────────────

    /** Clear all errors that belong to a given row id. */
    const clearRowErrors = useCallback((rowId) => {
      setLocalErrors((prev) => {
        const next = { ...prev };
        Object.keys(next).forEach((k) => {
          if (k.startsWith(`${rowId}-`)) delete next[k];
        });
        return next;
      });
    }, []);

    /** Patch a single field on a member inside the parent data tree. */
    const patchMemberField = useCallback(
      (rowId, field, value) => {
        onChange({
          ...data,
          members: members.map((m) =>
            m.id === rowId ? { ...m, [field]: value } : m,
          ),
        });
      },
      [data, members, onChange],
    );

    // ── Edit row management ─────────────────────────────────────────────────────

    /**
     * Request edit mode for a row. If another row is already open we refuse
     * and toast — simplifies state dramatically vs silent multi-open.
     */
    const requestEditRow = useCallback(
      (rowId) => {
        if (activeEditRowId !== null && activeEditRowId !== rowId) {
          toast.error("Save or discard the open row before editing another.");
          return;
        }
        setActiveEditRowId(rowId);
      },
      [activeEditRowId],
    );

    // ── Network handlers ────────────────────────────────────────────────────────

    const handleAppendRow = useCallback(
      async (memberType) => {
        if (activeEditRowId !== null) {
          toast.error("Save or discard the open row before adding a new one.");
          return;
        }
        const key = APPEND_KEY(memberType);
        try {
          setSyncingId(key);
          const newDoc = await foundingAuditService.addOrganMember(auditId, {
            memberType,
          });
          onChange({ ...data, members: [...members, newDoc] });
          setActiveEditRowId(newDoc.id);
        } catch (err) {
          toast.error(err.message || "Failed to create row.");
        } finally {
          setSyncingId(null);
        }
      },
      [activeEditRowId, auditId, data, members, onChange],
    );

    const handleSaveRow = useCallback(
      async (rowId) => {
        const payload = members.find((m) => m.id === rowId);
        if (!payload) return;
        try {
          setSyncingId(rowId);
          await foundingAuditService.updateOrganMember(auditId, rowId, payload);
          setActiveEditRowId(null);
          clearRowErrors(rowId);
          toast.success("Changes saved.");
        } catch (err) {
          toast.error(err.message || "Failed to save row.");
        } finally {
          setSyncingId(null);
        }
      },
      [auditId, clearRowErrors, members],
    );

    const requestDeleteRow = useCallback((rowId) => {
      setMemberToDelete(rowId);
      setIsDeleteModalOpen(true);
    }, []);

    const executeDeleteRow = useCallback(async () => {
      if (!memberToDelete) return;
      const rowId = memberToDelete;
      const member = members.find((m) => m.id === rowId);

      setIsDeleteModalOpen(false);
      setMemberToDelete(null);

      try {
        setSyncingId(rowId);
        if (member.cvUrl) {
          await foundingAuditService.deleteAuditFile(member.cvUrl);
        }
        await foundingAuditService.deleteOrganMember(auditId, rowId);
        if (activeEditRowId === rowId) setActiveEditRowId(null);
        clearRowErrors(rowId);
        onChange({ ...data, members: members.filter((m) => m.id !== rowId) });
        toast.success("Member removed.");
      } catch (err) {
        toast.error(err.message || "Failed to delete row.");
      } finally {
        setSyncingId(null);
      }
    }, [memberToDelete, activeEditRowId, auditId, clearRowErrors, data, members, onChange]);

    const handleUploadCV = useCallback(
      async (rowId, file) => {
        const member = members.find((m) => m.id === rowId);

        if (!file) {
          if (member?.cvUrl) {
            await foundingAuditService.deleteAuditFile(member.cvUrl);
          }
          patchMemberField(rowId, "cvUrl", null);
          return;
        }
        try {
          setUploadingRowId(rowId);
          const result = await foundingAuditService.uploadAuditFile(file);
          patchMemberField(rowId, "cvUrl", result.fileUrl);
          toast.success("CV uploaded.");
        } catch (err) {
          toast.error(err.message || "Upload failed.");
        } finally {
          setUploadingRowId(null);
        }
      },
      [patchMemberField, members],
    );

    // ── Waiver toggle ───────────────────────────────────────────────────────────

    const handleWaiverToggle = useCallback(
      (booleanVal) => {
        setActiveEditRowId(null);
        onChange({
          ...data,
          isAufsichtsratWaived: booleanVal,
        });
      },
      [data, onChange],
    );

    // ── Imperative validation handle ────────────────────────────────────────────

    useImperativeHandle(ref, () => ({
      validate() {
        if (activeEditRowId !== null) {
          toast.error("Save the open member row before submitting this phase.");
          return false;
        }
        const result = G4ValidationSchema.safeParse({
          isAufsichtsratWaived,
          members,
        });
        if (result.success) {
          setLocalErrors({});
          return true;
        }
        const errorsMap = {};
        result.error.issues.forEach((issue) => {
          if (issue.path[0] === "members" && issue.path[1] !== undefined) {
            const targetMember = members[issue.path[1]];
            const fieldKey = issue.path[2] || "global";
            if (targetMember?.id) {
              errorsMap[`${targetMember.id}-${fieldKey}`] = issue.message;
            }
          } else if (issue.path[0]) {
            errorsMap[String(issue.path[0])] = issue.message;
          }
        });
        setLocalErrors(errorsMap);
        return false;
      },
    }));

    // ── Shared row-action props factory ─────────────────────────────────────────
    // Avoids repeating the same 5 props at every call site.
    const rowActions = (member) => ({
      isEditing: activeEditRowId === member.id,
      // A row is "busy" when it is syncing itself OR when an append for its type
      // is in flight (disables Edit/Delete on all rows of that type).
      isSyncing:
        syncingId === member.id || syncingId === APPEND_KEY(member.memberType),
      onFieldChange: patchMemberField,
      onToggleEdit: () => requestEditRow(member.id),
      onSave: () => handleSaveRow(member.id),
      onDelete: () => requestDeleteRow(member.id),
    });

    // ── Render ──────────────────────────────────────────────────────────────────
    return (
      <div className="space-y-8 overflow-visible select-none animate-fadeIn">
        {/* ── Header ── */}
        <div className="pb-4 border-b border-gray-100">
          <h2 className="text-xl font-bold tracking-tight text-gray-900">
            Phase G4: Founding Members &amp; Organs Registry
          </h2>
          <p className="max-w-2xl mt-1 text-xs leading-relaxed text-gray-400">
            Record capital subscriptions, establish administrative board
            formations, and verify suitability criteria under §11 GenG
            parameters.
          </p>
        </div>

        {/* ── Waiver control ── */}
        <div className="max-w-xl">
          <CheckboxField
            label="Waive Supervisory Board Assembly Formation (Aufsichtsrat Verzicht)"
            subtext="German law permits cooperatives with fewer than 20 total members to waive the Aufsichtsrat body, electing a single General Assembly Representative instead (§36 GenG)."
            disabled={isReadOnly}
            checked={isAufsichtsratWaived}
            onChange={handleWaiverToggle}
          />
          {localErrors.isAufsichtsratWaived && (
            <span className="block mt-1 text-xs font-semibold text-red-500 animate-pulse">
              {localErrors.isAufsichtsratWaived}
            </span>
          )}
        </div>

        {/* ── Error Summary ── */}
        {Object.keys(localErrors).length > 0 && (
          <div className="p-3 mb-4 border border-red-200 rounded-md bg-red-50">
            <h4 className="text-sm font-medium text-red-800">
              Please fix the following issues:
            </h4>

            <ul className="pl-5 mt-2 space-y-1 text-xs text-red-700 list-disc">
              {Object.entries(localErrors).map(([key, message]) => (
                <li key={key}>{message}</li>
              ))}
            </ul>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════════
          SECTION 1 — FOUNDING MEMBERS (table layout)
          ══════════════════════════════════════════════════════════════════════ */}
        <section className="space-y-4">
          <SectionHeader
            title={`1. Capital Share Founding Members (${foundingMembers.length})`}
            isReadOnly={isReadOnly}
            isSyncing={syncingId === APPEND_KEY(MEMBER_TYPES.FOUNDING_MEMBER)}
            onAdd={() => handleAppendRow(MEMBER_TYPES.FOUNDING_MEMBER)}
            addLabel="Add Founding Member"
          />

          {totalCommittedCapital > 0 && totalCommittedCapital < 2500 && (
            <div className="flex items-start gap-3 p-4 text-xs font-semibold leading-relaxed border bg-amber-50 border-amber-200 rounded-xl text-amber-800 animate-fadeIn">
              <AlertTriangle className="w-4 h-4 shrink-0 text-amber-500 mt-0.5" />
              <p>
                The total committed capital is under 2,500 €. There is no legal
                minimum for eGs, but sufficient starting capital is advisable
                for economic viability.
              </p>
            </div>
          )}

          {foundingMembers.length > 0 && (
            <div className="overflow-visible bg-white border border-gray-200 shadow-sm rounded-xl">
              <table className="w-full text-left border-collapse table-fixed">
                <thead>
                  <tr className="bg-gray-50/80 border-b border-gray-200 text-[10px] font-bold uppercase tracking-wider text-gray-400 select-none h-10">
                    <th className="pl-4 w-[12%]">Title</th>
                    <th className="w-[23%] px-2">First Name *</th>
                    <th className="w-[23%] px-2">Last Name *</th>
                    <th className="w-[12%] px-2">Shares *</th>
                    <th className="w-[14%] px-2">Value (€) *</th>
                    <th className="w-[16%] px-2">Total Capital</th>
                    <th className="w-[10%] text-center pr-4" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {foundingMembers.map((member) => (
                    <FoundingMemberRow
                      key={member.id}
                      member={member}
                      isReadOnly={isReadOnly}
                      errors={localErrors}
                      {...rowActions(member)}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* ══════════════════════════════════════════════════════════════════════
          SECTION 2 — VORSTAND
          ══════════════════════════════════════════════════════════════════════ */}
        <section className="space-y-4">
          <SectionHeader
            title={`2. Executive Management Board Members (Vorstand) (${vorstandMembers.length})`}
            isReadOnly={isReadOnly}
            isSyncing={syncingId === APPEND_KEY(MEMBER_TYPES.VORSTAND)}
            onAdd={() => handleAppendRow(MEMBER_TYPES.VORSTAND)}
            addLabel="Add Vorstand Member"
          />
          <div className="space-y-4">
            {vorstandMembers.map((member) => (
              <BoardMemberCardRow
                key={member.id}
                member={member}
                isReadOnly={isReadOnly}
                isUploading={uploadingRowId === member.id}
                errors={localErrors}
                onUploadCV={handleUploadCV}
                {...rowActions(member)}
              />
            ))}
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════════════════
          SECTION 3 — CONDITIONAL: AUFSICHTSRAT or BEVOLLMÄCHTIGTER
          ══════════════════════════════════════════════════════════════════════ */}
        {!isAufsichtsratWaived ? (
          <section className="space-y-4 animate-fadeIn">
            <SectionHeader
              title={`3. Supervisory Board Governance (Aufsichtsrat) (${aufsichtsratMembers.length})`}
              isReadOnly={isReadOnly}
              isSyncing={syncingId === APPEND_KEY(MEMBER_TYPES.AUFSICHTSRAT)}
              onAdd={() => handleAppendRow(MEMBER_TYPES.AUFSICHTSRAT)}
              addLabel="Add Aufsichtsrat Member"
            />
            <div className="space-y-4">
              {aufsichtsratMembers.map((member) => (
                <BoardMemberCardRow
                  key={member.id}
                  member={member}
                  isReadOnly={isReadOnly}
                  isUploading={uploadingRowId === member.id}
                  errors={localErrors}
                  onUploadCV={handleUploadCV}
                  {...rowActions(member)}
                />
              ))}
            </div>
          </section>
        ) : (
          <section className="space-y-4 animate-fadeIn">
            <SectionHeader
              title="3. General Assembly Authorised Representative (Bevollmächtigter)"
              isReadOnly={isReadOnly}
              // Only allow adding if none exist yet (single representative rule)
              isSyncing={
                syncingId === APPEND_KEY(MEMBER_TYPES.BEVOLLMAECHTIGTER)
              }
              onAdd={
                representativeMembers.length === 0
                  ? () => handleAppendRow(MEMBER_TYPES.BEVOLLMAECHTIGTER)
                  : null
              }
              addLabel="Assign Representative"
            />
            <div className="space-y-2">
              {representativeMembers.map((member) => (
                <RepresentativeCardRow
                  key={member.id}
                  member={member}
                  isReadOnly={isReadOnly}
                  errors={localErrors}
                  {...rowActions(member)}
                />
              ))}
            </div>
          </section>
        )}
        <ConfirmModal
          open={isDeleteModalOpen}
          title="Delete Member"
          message="Permanently delete this member entry? This operation cannot be undone."
          onCancel={() => {
            setIsDeleteModalOpen(false);
            setMemberToDelete(null);
          }}
          onConfirm={executeDeleteRow}
        />
      </div>
    );
  },
);

PhaseG4Organs.displayName = "PhaseG4Organs";

// ─────────────────────────────────────────────────────────────────────────────
// SHARED SECTION HEADER
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @param {{ title: string, isReadOnly: boolean, isSyncing: boolean,
 *   onAdd: (() => void) | null, addLabel: string }} props
 */
const SectionHeader = ({ title, isReadOnly, isSyncing, onAdd, addLabel }) => (
  <div className="flex items-center justify-between pb-2 border-b border-gray-100">
    <h3 className="text-sm font-bold text-gray-800">{title}</h3>
    {!isReadOnly && onAdd && (
      <button
        type="button"
        disabled={isSyncing}
        onClick={onAdd}
        className="flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:text-blue-700 transition disabled:opacity-50"
      >
        {isSyncing ? (
          <Loader2 className="w-3 h-3 animate-spin" />
        ) : (
          <Plus className="w-3.5 h-3.5" />
        )}
        {addLabel}
      </button>
    )}
  </div>
);

SectionHeader.displayName = "SectionHeader";

// ─────────────────────────────────────────────────────────────────────────────
// ROW ACTION CONTROLS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Edit/Save + Delete button pair.
 * isSyncing is a boolean — true when THIS row's network call is in flight.
 *
 * @param {{ isEditing: boolean, isReadOnly: boolean, isSyncing: boolean,
 *   onSave: () => void, onEdit: () => void, onDelete: () => void }} props
 */
const RowControls = ({
  isEditing,
  isReadOnly,
  isSyncing,
  onSave,
  onEdit,
  onDelete,
}) => {
  if (isReadOnly) return null;
  return (
    <div className="flex items-center gap-1.5">
      {isEditing ? (
        <button
          type="button"
          disabled={isSyncing}
          onClick={onSave}
          className="flex items-center justify-center text-white transition bg-green-500 border border-green-600 rounded-lg shadow-sm w-7 h-7 hover:bg-green-600 disabled:opacity-40"
          title="Save"
        >
          {isSyncing ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Check className="w-3.5 h-3.5 stroke-[3]" />
          )}
        </button>
      ) : (
        <button
          type="button"
          disabled={isSyncing}
          onClick={onEdit}
          className="flex items-center justify-center text-gray-500 transition bg-white border border-gray-200 rounded-lg shadow-sm w-7 h-7 hover:border-gray-300 hover:text-gray-800 disabled:opacity-40"
          title="Edit"
        >
          <Edit2 className="w-3.5 h-3.5" />
        </button>
      )}
      <button
        type="button"
        disabled={isSyncing}
        onClick={onDelete}
        className="flex items-center justify-center text-gray-400 transition bg-white border border-gray-200 rounded-lg shadow-sm w-7 h-7 hover:border-red-200 hover:text-red-500 disabled:opacity-40"
        title="Delete"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};

RowControls.displayName = "RowControls";

// ─────────────────────────────────────────────────────────────────────────────
// FOUNDING MEMBER ROW (table row)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @param {{ member: Member, isReadOnly: boolean, isEditing: boolean,
 *   isSyncing: boolean, errors: Record<string, string>,
 *   onFieldChange: (id: string, field: string, value: any) => void,
 *   onToggleEdit: () => void, onSave: () => void, onDelete: () => void }} props
 */
const FoundingMemberRow = ({
  member,
  isReadOnly,
  isEditing,
  isSyncing,
  errors,
  onFieldChange,
  onToggleEdit,
  onSave,
  onDelete,
}) => {
  const e = (field) => errors[`${member.id}-${field}`];
  const field = (name, value, onChange, extraClass = "") => ({
    disabled: !isEditing || isReadOnly,
    value: value ?? "",
    onChange,
    className: `w-full px-2 py-1 border rounded bg-white disabled:bg-transparent
      disabled:border-transparent focus:outline-none text-xs font-semibold
      ${e(name) ? "border-red-400" : "border-gray-300"} ${extraClass}`,
  });

  const rowBg =
    e("firstName") || e("lastName") ? "bg-red-50/30" : "hover:bg-gray-50/40";

  return (
    <tr className={`h-12 transition-colors text-xs font-semibold ${rowBg}`}>
      {/* Title */}
      <td className="pl-4">
        <select
          disabled={!isEditing || isReadOnly}
          value={member.title || ""}
          onChange={(e) => onFieldChange(member.id, "title", e.target.value)}
          className="w-full px-1 py-1 text-xs text-gray-800 bg-white border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-transparent disabled:border-transparent"
        >
          <option value="">—</option>
          <option value="Dr.">Dr.</option>
          <option value="Prof.">Prof.</option>
          <option value="Prof. Dr.">Prof. Dr.</option>
        </select>
      </td>

      {/* First name */}
      <td className="px-2">
        <input
          type="text"
          placeholder="First name"
          {...field("firstName", member.firstName, (e) =>
            onFieldChange(member.id, "firstName", e.target.value),
          )}
        />
      </td>

      {/* Last name */}
      <td className="px-2">
        <input
          type="text"
          placeholder="Last name"
          {...field("lastName", member.lastName, (e) =>
            onFieldChange(member.id, "lastName", e.target.value),
          )}
        />
      </td>

      {/* Shares */}
      <td className="px-2">
        <input
          type="number"
          min="1"
          disabled={!isEditing || isReadOnly}
          value={member.shares ?? ""}
          onChange={(e) =>
            onFieldChange(
              member.id,
              "shares",
              e.target.value ? parseInt(e.target.value, 10) : null,
            )
          }
          className="w-full px-2 py-1 font-mono text-xs border border-gray-300 rounded focus:outline-none disabled:bg-transparent disabled:border-transparent"
        />
      </td>

      {/* Share value */}
      <td className="px-2">
        <input
          type="number"
          min="0"
          disabled={!isEditing || isReadOnly}
          value={member.shareValueEur ?? ""}
          onChange={(e) =>
            onFieldChange(
              member.id,
              "shareValueEur",
              e.target.value ? parseFloat(e.target.value) : null,
            )
          }
          className="w-full px-2 py-1 font-mono text-xs border border-gray-300 rounded focus:outline-none disabled:bg-transparent disabled:border-transparent"
        />
      </td>

      {/* Computed total */}
      <td className="px-2 font-mono text-gray-500 text-[11px]">
        {(
          Number(member.shares || 0) * Number(member.shareValueEur || 0)
        ).toLocaleString("de-DE", { minimumFractionDigits: 2 })}{" "}
        €
      </td>

      {/* Controls */}
      <td className="pr-4 text-center">
        <RowControls
          isEditing={isEditing}
          isReadOnly={isReadOnly}
          isSyncing={isSyncing}
          onSave={onSave}
          onEdit={onToggleEdit}
          onDelete={onDelete}
        />
      </td>
    </tr>
  );
};

FoundingMemberRow.displayName = "FoundingMemberRow";

// ─────────────────────────────────────────────────────────────────────────────
// BOARD MEMBER CARD (VORSTAND / AUFSICHTSRAT)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @param {{ member: Member, isReadOnly: boolean, isEditing: boolean,
 *   isSyncing: boolean, isUploading: boolean, errors: Record<string, string>,
 *   onFieldChange: (id: string, field: string, value: any) => void,
 *   onUploadCV: (id: string, file: File | null) => void,
 *   onToggleEdit: () => void, onSave: () => void, onDelete: () => void }} props
 */
const BoardMemberCardRow = ({
  member,
  isReadOnly,
  isEditing,
  isSyncing,
  isUploading,
  errors,
  onFieldChange,
  onUploadCV,
  onToggleEdit,
  onSave,
  onDelete,
}) => {
  const e = (field) => errors[`${member.id}-${field}`];
  const hasError = Object.keys(errors).some((k) =>
    k.startsWith(`${member.id}-`),
  );

  const inputCls = (field) =>
    `w-full border rounded-md px-2 py-1.5 focus:outline-none bg-white text-xs font-bold
     disabled:bg-gray-50/50 ${e(field) ? "border-red-400" : "border-gray-300"}`;

  const isVorstand = member.memberType === MEMBER_TYPES.VORSTAND;

  return (
    <div
      className={`border rounded-xl p-5 space-y-4 bg-white shadow-sm transition-all
        ${hasError ? "border-red-200 bg-red-50/5" : "border-gray-200 hover:border-gray-300/80"}`}
    >
      {/* ── Row 1: Identity fields ── */}
      <div className="grid grid-cols-1 gap-4 text-xs font-bold sm:grid-cols-4">
        {/* Title + First name */}
        <div className="grid grid-cols-3 gap-2 sm:col-span-2">
          <div>
            <label className="text-[10px] text-gray-400 block mb-0.5">
              Title
            </label>
            <input
              type="text"
              placeholder="Dr."
              disabled={!isEditing || isReadOnly}
              value={member.title || ""}
              onChange={(e) =>
                onFieldChange(member.id, "title", e.target.value)
              }
              className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-xs
                focus:outline-none bg-white disabled:bg-gray-50/50"
            />
          </div>
          <div className="col-span-2">
            <label className="text-[10px] text-gray-400 block mb-0.5">
              First Name *
            </label>
            <input
              type="text"
              disabled={!isEditing || isReadOnly}
              value={member.firstName || ""}
              onChange={(e) =>
                onFieldChange(member.id, "firstName", e.target.value)
              }
              className={inputCls("firstName")}
            />
          </div>
        </div>

        {/* Last name */}
        <div>
          <label className="text-[10px] text-gray-400 block mb-0.5">
            Last Name *
          </label>
          <input
            type="text"
            disabled={!isEditing || isReadOnly}
            value={member.lastName || ""}
            onChange={(e) =>
              onFieldChange(member.id, "lastName", e.target.value)
            }
            className={inputCls("lastName")}
          />
        </div>

        {/* Role */}
        <div>
          <label className="text-[10px] text-gray-400 block mb-0.5">
            Function Role *
          </label>
          <select
            disabled={!isEditing || isReadOnly}
            value={member.role || ""}
            onChange={(e) => onFieldChange(member.id, "role", e.target.value)}
            className="w-full border border-gray-300 rounded-md px-2 py-1.5 bg-white
              text-xs text-gray-800 focus:outline-none disabled:bg-gray-50/50"
          >
            {isVorstand ? (
              <>
                <option value="">Select</option>
                <option value="VORSITZENDER">Vorsitzender</option>
                <option value="STELLVERTRETENDER">
                  Stellvertretender Vorsitzender
                </option>
                <option value="MITGLIED">Mitglied</option>
              </>
            ) : (
              <>
                <option value="">Select</option>
                <option value="VORSITZENDER">Vorsitzender (AR-Chair)</option>
                <option value="STELLVERTRETENDER">
                  Stellvertretender Vorsitzender
                </option>
                <option value="MITGLIED">Mitglied</option>
              </>
            )}
          </select>
        </div>

        {/* Date of birth */}
        <div>
          <label className="text-[10px] text-gray-400 block mb-0.5">
            Date of Birth *
          </label>
          <input
            type="date"
            disabled={!isEditing || isReadOnly}
            value={member.dateOfBirth?.substring(0, 10) || ""}
            onChange={(e) =>
              onFieldChange(member.id, "dateOfBirth", e.target.value)
            }
            className={inputCls("dateOfBirth")}
          />
        </div>

        {/* Address */}
        <div className="sm:col-span-3">
          <label className="text-[10px] text-gray-400 block mb-0.5">
            {isVorstand
              ? "Full Residential Address *"
              : "Residential City / Seat Reference"}
          </label>
          <input
            type="text"
            disabled={!isEditing || isReadOnly}
            placeholder="Street, ZIP, City"
            value={member.address || ""}
            onChange={(e) =>
              onFieldChange(member.id, "address", e.target.value)
            }
            className={inputCls("address")}
          />
        </div>
      </div>

      {/* ── Row 2: CV + Suitability + Controls ── */}
      <div className="grid items-center grid-cols-1 gap-4 pt-3 text-xs font-bold border-t sm:grid-cols-12 border-gray-50">
        {/* CV upload */}
        <div className="sm:col-span-3">
          <label className="text-[10px] text-gray-400 block mb-1">
            CV Attachment (PDF) *
          </label>
          <CVWidget
            member={member}
            isEditing={isEditing}
            isReadOnly={isReadOnly}
            isUploading={isUploading}
            hasError={!!e("cvUrl")}
            onUpload={onUploadCV}
          />
        </div>

        {/* Suitability commentary */}
        <div className="sm:col-span-6">
          <label className="text-[10px] text-gray-400 block mb-1">
            Auditor Suitability Evaluation Commentary
          </label>
          <textarea
            rows={1}
            disabled={!isEditing || isReadOnly}
            value={member.suitabilityAssessment || ""}
            onChange={(e) =>
              onFieldChange(member.id, "suitabilityAssessment", e.target.value)
            }
            placeholder="Assess reliability and credentials..."
            className="w-full border border-gray-300 rounded-md px-2.5 py-1.5 text-xs
              focus:outline-none font-medium text-gray-700 disabled:bg-transparent
              disabled:border-transparent disabled:px-0"
          />
        </div>

        {/* Suitability result */}
        <div className="sm:col-span-2">
          <label className="text-[10px] text-gray-400 block mb-1">
            Suitability Result *
          </label>
          <select
            disabled={!isEditing || isReadOnly}
            value={member.suitabilityResult || ""}
            onChange={(e) =>
              onFieldChange(member.id, "suitabilityResult", e.target.value)
            }
            className="w-full border border-gray-300 rounded-md px-2 py-1.5 bg-white
              text-xs focus:outline-none text-gray-800 disabled:bg-gray-50/50"
          >
            <option value="">Select</option>
            <option value="GEEIGNET">Geeignet</option>
            <option value="BEDINGT_GEEIGNET">Bedingt geeignet</option>
            <option value="NICHT_GEEIGNET">Nicht geeignet</option>
          </select>
        </div>

        {/* Row action controls */}
        <div className="flex items-center justify-end h-full pt-3 sm:col-span-1 sm:pt-0">
          <RowControls
            isEditing={isEditing}
            isReadOnly={isReadOnly}
            isSyncing={isSyncing}
            onSave={onSave}
            onEdit={onToggleEdit}
            onDelete={onDelete}
          />
        </div>
      </div>
    </div>
  );
};

BoardMemberCardRow.displayName = "BoardMemberCardRow";

// ─────────────────────────────────────────────────────────────────────────────
// REPRESENTATIVE CARD ROW
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @param {{ member: Member, isReadOnly: boolean, isEditing: boolean,
 *   isSyncing: boolean, errors: Record<string, string>,
 *   onFieldChange: (id: string, field: string, value: any) => void,
 *   onToggleEdit: () => void, onSave: () => void, onDelete: () => void }} props
 */
const RepresentativeCardRow = ({
  member,
  isReadOnly,
  isEditing,
  isSyncing,
  errors,
  onFieldChange,
  onToggleEdit,
  onSave,
  onDelete,
}) => {
  const e = (field) => errors[`${member.id}-${field}`];
  const hasError = !!e("firstName") || !!e("lastName");

  return (
    <div
      className={`flex flex-col md:flex-row items-start md:items-center justify-between
        border p-4 rounded-xl gap-4 text-xs font-bold bg-white border-dashed
        ${hasError ? "border-red-300 bg-red-50/5" : "border-gray-200"}`}
    >
      <div className="grid items-center flex-1 w-full grid-cols-1 gap-4 sm:grid-cols-3">
        <div>
          <label className="text-[10px] text-gray-400 block mb-0.5">
            Representative First Name *
          </label>
          <input
            type="text"
            disabled={!isEditing || isReadOnly}
            value={member.firstName || ""}
            onChange={(e) =>
              onFieldChange(member.id, "firstName", e.target.value)
            }
            className={`w-full border rounded-md px-2 py-1.5 text-xs focus:outline-none
              bg-white disabled:bg-transparent disabled:border-transparent
              ${e("firstName") ? "border-red-400" : "border-gray-300"}`}
          />
        </div>
        <div>
          <label className="text-[10px] text-gray-400 block mb-0.5">
            Representative Last Name *
          </label>
          <input
            type="text"
            disabled={!isEditing || isReadOnly}
            value={member.lastName || ""}
            onChange={(e) =>
              onFieldChange(member.id, "lastName", e.target.value)
            }
            className={`w-full border rounded-md px-2 py-1.5 text-xs focus:outline-none
              bg-white disabled:bg-transparent disabled:border-transparent
              ${e("lastName") ? "border-red-400" : "border-gray-300"}`}
          />
        </div>
        <div className="flex justify-end gap-2 pt-4 sm:pt-2">
          <RowControls
            isEditing={isEditing}
            isReadOnly={isReadOnly}
            isSyncing={isSyncing}
            onSave={onSave}
            onEdit={onToggleEdit}
            onDelete={onDelete}
          />
        </div>
      </div>
    </div>
  );
};

RepresentativeCardRow.displayName = "RepresentativeCardRow";

// ─────────────────────────────────────────────────────────────────────────────
// CV UPLOAD WIDGET
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @param {{ member: Member, isEditing: boolean, isReadOnly: boolean,
 *   isUploading: boolean, hasError: boolean,
 *   onUpload: (id: string, file: File | null) => void }} props
 */
const CVWidget = ({
  member,
  isEditing,
  isReadOnly,
  isUploading,
  hasError,
  onUpload,
}) => {
  if (member.cvUrl) {
    return (
      <div
        className="flex items-center justify-between bg-gray-50 border border-gray-100
          rounded-md px-2 py-1.5 h-[34px] w-full max-w-[200px]"
      >
        <a
          href={member.cvUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-blue-600 font-bold hover:underline
            truncate max-w-[80%] text-[11px]"
        >
          <FileText className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
          <span className="truncate">View_CV.pdf</span>
        </a>
        {isEditing && !isReadOnly && (
          <button
            type="button"
            onClick={() => onUpload(member.id, null)}
            className="text-gray-400 hover:text-red-500 text-[10px] font-semibold
              transition px-1"
          >
            Remove
          </button>
        )}
      </div>
    );
  }

  const inactive = !isEditing || isReadOnly || isUploading;

  return (
    <label
      className={`flex items-center gap-1.5 px-3 py-1.5 border rounded-md text-[11px]
        font-bold text-gray-600 transition shadow-sm h-[34px] w-full max-w-[200px] bg-white
        ${
          inactive
            ? "opacity-50 pointer-events-none border-gray-200"
            : hasError
              ? "border-red-300 hover:bg-red-50/5 cursor-pointer"
              : "border-gray-300 hover:bg-gray-50 cursor-pointer"
        }`}
    >
      {isUploading ? (
        <Loader2 className="w-3.5 h-3.5 text-blue-600 animate-spin" />
      ) : (
        <Upload className="w-3.5 h-3.5 text-gray-400" />
      )}
      <span>{isUploading ? "Uploading…" : "Upload PDF"}</span>
      <input
        type="file"
        accept="application/pdf"
        className="hidden"
        disabled={inactive}
        onChange={(e) => onUpload(member.id, e.target.files?.[0] ?? null)}
      />
    </label>
  );
};

CVWidget.displayName = "CVWidget";

export { PhaseG4Organs };
