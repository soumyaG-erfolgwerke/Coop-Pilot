"use client";

import { FormField } from "@/components/orgadmin/FoundingAudit/FormFields";
import { G7ValidationSchema } from "@/lib/founding-audit/schema";
import { foundingAuditService } from "@/lib/foundingAuditService";
import {
  AlertCircle,
  CheckCircle2,
  FileCheck,
  HelpCircle,
  Loader2,
  Lock,
  ShieldAlert,
} from "lucide-react";
import { forwardRef, useImperativeHandle, useState } from "react";
import { toast } from "react-hot-toast";
import { useRouter } from "next/navigation";

const PhaseG7Gutachten = forwardRef(
  (
    {
      data,
      onChange,
      isReadOnly,
      auditId,
      crossPhaseSummary = {},
      phaseStatuses = {},
      isGloballyLocked,
    },
    ref,
  ) => {
    const router = useRouter();
    const [localErrors, setLocalErrors] = useState({});
    const [isGenerating, setIsGenerating] = useState(false);
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);

    // 1. PHASE STATUSES ENGINE: Compute gatekeeper condition in real time
    const requiredPrecedingPhases = ["G1", "G2", "G3", "G4", "G5", "G6"];
    const allPrecedingSubmitted = requiredPrecedingPhases.every(
      (phase) => phaseStatuses?.[phase] === "SUBMITTED",
    );

    // Unpack individual computed boolean tokens from the real-time crossPhaseSummary
    const {
      allStatutesCompliant = true,
      allMembersSuitable = true,
      capitalPaidIn = true,
      noRiskIdentified = true,
      purposeResultErfuellt = true,
    } = crossPhaseSummary;

    // 2. MASTER EVALUATION BOOLEAN: Positive is disabled if any individual check is false
    const isPositivAllowed =
      allStatutesCompliant &&
      allMembersSuitable &&
      capitalPaidIn &&
      noRiskIdentified &&
      purposeResultErfuellt;

    // 3. IMPERATIVE HANDLE: Handles standard draft saves and stage submissions
    useImperativeHandle(ref, () => ({
      validate() {
        const result = G7ValidationSchema.safeParse(data);

        if (result.success) {
          setLocalErrors({});
          return true;
        }

        const errorsMap = {};
        result.error.issues.forEach((issue) => {
          if (issue.path[0]) {
            errorsMap[issue.path[0].toString()] = issue.message;
          }
        });

        setLocalErrors(errorsMap);
        return false;
      },
    }));

    const clearError = (key) => {
      setLocalErrors((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    };

    const updateField = (key, value) => {
      const updated = {
        ...data,
        [key]: value,
      };

      // Structural Reset: Auto-wipe conditions block if result is changed from conditional
      if (key === "gutachtenResult" && value !== "BEDINGT_POSITIV") {
        updated.gutachtenConditions = "";
      }

      onChange(updated);

      if (localErrors[key]) {
        clearError(key);
      }
    };

    // State strategies assignment maps
    const strategies = {
      text: (key) => ({
        value: data?.[key] ?? "",
        onChange: (e) => updateField(key, e.target.value),
      }),
    };

    const bind = (key) => ({
      disabled: isReadOnly,
      error: localErrors[key],
      ...strategies.text(key),
    });

    // =========================================================================
    // CONDITIONAL CONDENSED RENDERING: GATEKEEPER BLOCK INTERACTION
    // =========================================================================
    if (!allPrecedingSubmitted) {
      return (
        <div className="max-w-xl p-8 mx-auto my-10 space-y-4 text-center border-2 border-gray-200 border-dashed select-none bg-gray-50/50 rounded-2xl animate-fadeIn">
          <div className="flex items-center justify-center w-12 h-12 mx-auto border rounded-full shadow-sm bg-amber-50 text-amber-500 border-amber-100">
            <Lock className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-gray-800">
              Gutachten Generation Locked
            </h3>
            <p className="max-w-sm mx-auto text-xs leading-relaxed text-gray-400">
              German cooperative audit framework rules require all preceding
              evaluation phases (G1 to G6) to be validated, submitted, and
              locked before final certification can occur.
            </p>
          </div>
          <div className="flex flex-wrap justify-center max-w-md gap-2 pt-2 mx-auto">
            {requiredPrecedingPhases.map((phase) => {
              const isDone = phaseStatuses?.[phase] === "SUBMITTED";
              return (
                <span
                  key={phase}
                  className={`text-[10px] font-mono font-bold px-2.5 py-1 border rounded shadow-inner flex items-center gap-1 ${
                    isDone
                      ? "bg-green-50 border-green-200 text-green-700"
                      : "bg-white border-gray-200 text-gray-400"
                  }`}
                >
                  {phase}: {isDone ? "✓" : "Locked"}
                </span>
              );
            })}
          </div>
        </div>
      );
    }

    // =========================================================================
    // EXECUTION ENGINE: CONFIRMED SUBMISSION, AUTO-DOWNLOAD & ROUTING
    // =========================================================================
    const handleCompileFinalReport = async () => {
      setIsConfirmModalOpen(false);
      try {
        setIsGenerating(true);

        const responseResult = await foundingAuditService.generateGutachten(
          auditId,
          data,
        );

        toast.success("Gutachten generated and compiled successfully.");

        if (responseResult?.fileUrl) {
          window.open(responseResult.fileUrl, "_blank");
        }
        router.push("?tab=founding-audit");
      } catch (error) {
        toast.error(
          error.message || "Failed to finalize and compile Gutachten.",
        );
      } finally {
        setIsGenerating(false);
      }
    };

    return (
      <div className="space-y-6 overflow-visible select-none animate-fadeIn">
        {/* Title */}
        <div className="pb-3 border-b border-gray-100">
          <h2 className="text-xl font-bold tracking-tight text-gray-900">
            Phase G7: Final Audit Opinion & Report Generation
          </h2>
          <p className="max-w-2xl mt-1 text-xs leading-relaxed text-gray-400">
            Review cross-phase criteria results, render legal statements, and
            generate the signed legal certification document.
          </p>
        </div>

        {/* INDIVIDUAL CROSS-PHASE STATUS CARDS */}
        <div className="p-4 space-y-4 border border-gray-200 bg-gray-100/50 rounded-xl">
          <h3 className="text-[10px] font-bold tracking-wider text-gray-400 uppercase">
            Compliance Summary: Key Evaluation Criteria Across All Phases
          </h3>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
            <StatusMetricCard
              label="Statutes Compliance (G3)"
              isPassed={allStatutesCompliant}
              failText="Deficiencies Found in Text"
              passText="Fully Compliant"
            />
            <StatusMetricCard
              label="Directors Suitability (G4)"
              isPassed={allMembersSuitable}
              failText="Unsuitable Executives Added"
              passText="All Directors Eligible"
            />
            <StatusMetricCard
              label="Capital Contribution (G5)"
              isPassed={capitalPaidIn}
              failText="Capital Funding Missing"
              passText="Fully Paid-In Account"
            />
            <StatusMetricCard
              label="Economic Viability (G5)"
              isPassed={noRiskIdentified}
              failText="Insolvency / Threat Risk Flagged"
              passText="No Operational Threat Found"
            />
            <StatusMetricCard
              label="Cooperative Purpose (G6)"
              isPassed={purposeResultErfuellt}
              failText="Non-Compliant Business Setup"
              passText="Genuine Purpose Verified"
            />
          </div>

          {/* VERBATIM LEGALLY PRESCRIBED GERMAN REJECTION SUMMARY BLOCK */}
          {!isPositivAllowed && (
            <div className="flex items-start gap-3 p-4 text-xs font-semibold leading-relaxed text-red-800 border border-red-200 shadow-sm bg-red-50 rounded-xl animate-fadeIn">
              <ShieldAlert className="w-4 h-4 shrink-0 text-red-500 mt-0.5" />
              <p>
                Aufgrund folgender Feststellungen kann kein uneingeschränkt
                positives Gutachten ausgestellt werden. / Due to the following
                findings, an unconditionally positive opinion cannot be issued.
              </p>
            </div>
          )}
        </div>

        {/* DATA INPUT LAYER: Reuses FormField primitives */}
        <div className="grid items-start grid-cols-1 gap-6 sm:grid-cols-2">
          <FormField
            label="Overall Gutachten Result Statement"
            as="select"
            required
            {...bind("gutachtenResult")}
          >
            <option value="">Please select...</option>
            {/* Programmatically disabled based on computed parameters */}
            <option value="POSITIV" disabled={!isPositivAllowed}>
              POSITIV
            </option>
            <option value="BEDINGT_POSITIV">BEDINGT POSITIV</option>
            <option value="NEGATIV">NEGATIV</option>
          </FormField>

          <FormField
            label="Official Certification Date"
            type="date"
            required
            {...bind("gutachtenDate")}
          />
        </div>

        {/* Conditional display logic block based on chosen evaluation status */}
        {data?.gutachtenResult === "BEDINGT_POSITIV" && (
          <div className="animate-fadeIn">
            <FormField
              label="Specific Conditions & Compliance Obligations (Auflagen)"
              as="textarea"
              rows={3}
              placeholder="List the precise amendments or conditions that the cooperative must resolve..."
              {...bind("gutachtenConditions")}
            />
          </div>
        )}

        <FormField
          label="Reasoning Summary Statement (Begründung des Ergebnisses)"
          as="textarea"
          rows={5}
          placeholder="Provide the core legal justification statement. Explicit reference to statutory provisions under §11 Abs. 2 Nr. 3 GenG is legally required inside this block..."
          {...bind("reasoning")}
        />

        {/* CONDITIONAL SUBMITTED SECTION: Displays final QES button inside layout when phase is locked */}
        {isReadOnly && !isGloballyLocked && (
          <div className="flex justify-end pt-5 border-t border-gray-100 animate-fadeIn">
            <button
              type="button"
              disabled={isGenerating}
              onClick={() => setIsConfirmModalOpen(true)}
              className="flex items-center gap-2 px-5 py-3 text-sm font-bold text-white transition bg-green-600 rounded-lg select-none hover:bg-green-700 active:bg-green-800 disabled:opacity-40"
            >
              {isGenerating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <FileCheck className="w-4 h-4" />
              )}
              <span>
                {isGenerating
                  ? "Generating ..."
                  : "Sign & Generate Gutachten"}
              </span>
            </button>
          </div>
        )}

        {/* =========================================================================
            ATOMIC CONFIRMATION TEXT MODAL
           ========================================================================= */}
        {isConfirmModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-950/40 backdrop-blur-sm animate-fadeIn">
            <div className="w-full max-w-md p-6 space-y-4 text-center bg-white border border-gray-100 shadow-2xl rounded-xl animate-scaleUp">
              <div className="flex items-center justify-center w-12 h-12 mx-auto text-blue-600 border border-blue-100 rounded-full shadow-sm bg-blue-50">
                <HelpCircle className="w-5 h-5" />
              </div>

              <div className="space-y-1.5">
                <h3 className="text-sm font-bold text-gray-900">
                  Confirm Legal Finalization
                </h3>
                <p className="px-2 text-xs leading-relaxed text-gray-400">
                  Are you sure you want to execute the digital signature and generate the final report? This will lock all phase data properties permanently. This action cannot be reversed.
                </p>
              </div>

              <div className="flex justify-center gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setIsConfirmModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-gray-500 transition border border-gray-200 rounded-lg hover:bg-gray-50"
                >
                  Cancel and Review
                </button>
                <button
                  type="button"
                  onClick={handleCompileFinalReport}
                  className="px-4 py-2 text-xs font-bold text-white transition bg-green-600 rounded-lg shadow-sm hover:bg-green-700 active:bg-green-800"
                >
                  Confirm and Sign
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  },
);

/**
 * Isolated Atomic View Sub-Component: Renders uniform scorecard panels for cross-phase tokens
 */
const StatusMetricCard = ({ label, isPassed, failText, passText }) => (
  <div className="p-3 bg-white border border-gray-200 rounded-xl flex items-center justify-between gap-3 text-[11px] font-bold">
    <div className="space-y-0.5 truncate">
      <span className="block tracking-tight text-gray-400">{label}</span>
      <span
        className={
          isPassed ? "text-green-600 truncate" : "text-amber-600 truncate"
        }
      >
        {isPassed ? passText : failText}
      </span>
    </div>
    <div className="shrink-0">
      {isPassed ? (
        <CheckCircle2 className="w-4 h-4 text-green-500 fill-green-50" />
      ) : (
        <AlertCircle className="w-4 h-4 text-amber-500 fill-amber-50" />
      )}
    </div>
  </div>
);

StatusMetricCard.displayName = "StatusMetricCard";
PhaseG7Gutachten.displayName = "PhaseG7Gutachten";

export { PhaseG7Gutachten };
