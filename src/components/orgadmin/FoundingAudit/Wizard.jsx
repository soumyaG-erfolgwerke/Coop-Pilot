"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { toast } from "react-hot-toast";

import { foundingAuditService } from "@/lib/foundingAuditService";

import { PhaseG1Contact } from "@/components/orgadmin/FoundingAudit/phases/G1Contact";
import { PhaseG2Documents } from "@/components/orgadmin/FoundingAudit/phases/G2Documents";
import { PhaseG3Statutes } from "@/components/orgadmin/FoundingAudit/phases/G3Statutes";
import { PhaseG4Organs } from "@/components/orgadmin/FoundingAudit/phases/G4Organs";
import { PhaseG5Finances } from "@/components/orgadmin/FoundingAudit/phases/G5Finances";
import { PhaseG6Conclusion } from "@/components/orgadmin/FoundingAudit/phases/G6Conclusion";
import { PhaseG7Gutachten } from "@/components/orgadmin/FoundingAudit/phases/G7Gutachten";
import { FoundingAuditSidebar } from "@/components/orgadmin/FoundingAudit/Sidebar";
import { Loader2 } from "lucide-react";

const PHASE_COMPONENTS = {
  G1: { Component: PhaseG1Contact, stateKey: "G1Data" },
  G2: { Component: PhaseG2Documents, stateKey: "G2Data" },
  G3: { Component: PhaseG3Statutes, stateKey: "G3Data" },
  G4: { Component: PhaseG4Organs, stateKey: "G4Data" },
  G5: { Component: PhaseG5Finances, stateKey: "G5Data" },
  G6: { Component: PhaseG6Conclusion, stateKey: "G6Data" },
  G7: { Component: PhaseG7Gutachten, stateKey: "G7Data" },
};

const FoundingAuditWizard = ({ auditId }) => {
  const router = useRouter();
  const [masterState, setMasterState] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("G1");
  const [isDirty, setIsDirty] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const activePhaseRef = useRef(null);

  const loadAudit = async () => {
    try {
      setIsLoading(true);
      const auditDetails = await foundingAuditService.getAuditDetails(auditId);
      setMasterState(auditDetails);
      setActiveTab(auditDetails.currentPhase ?? "G1");
    } catch (error) {
      toast.error("Failed to load audit details. Please try again.");
      router.push("/dashboard?tab=founding-audit");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (auditId) {
      loadAudit();
    }
  }, [auditId]);

  const handleFieldChange = (updatedFields) => {
    const currentKey = PHASE_COMPONENTS[activeTab].stateKey;
    setMasterState((prev) => ({
      ...prev,
      [currentKey]: updatedFields,
      phaseStatuses: {
        ...prev.phaseStatuses,
        [activeTab]:
          prev.phaseStatuses[activeTab] === "SUBMITTED" ? "SUBMITTED" : "DRAFT",
      },
    }));
    setIsDirty(true);
  };

  const handlePhaseSaveDraft = async () => {
    if (isSyncing) return;
    const currentKey = PHASE_COMPONENTS[activeTab].stateKey;
    const currentPhaseData = masterState[currentKey];

    try {
      setIsSyncing(true);
      await foundingAuditService.syncPhaseData(
        auditId,
        activeTab,
        false,
        currentPhaseData,
      );

      setIsDirty(false);
      toast.success(`Draft for Phase ${activeTab} saved successfully.`);
    } catch (error) {
      toast.error(error.message ?? "Failed to save draft state to server.");
    } finally {
      setIsSyncing(false);
    }
  };

  const handlePhaseSubmit = () => {
    const isValid = activePhaseRef.current?.validate();
    if (isValid) {
      handleValidationSuccess();
    } else {
      toast.error("Validation failed! Please check the form for errors.");
    }
  };

  const handleValidationSuccess = async () => {
    if (isSyncing) return;
    const currentKey = PHASE_COMPONENTS[activeTab].stateKey;
    const currentPhaseData = masterState[currentKey];

    try {
      setIsSyncing(true);
      await foundingAuditService.syncPhaseData(
        auditId,
        activeTab,
        true,
        currentPhaseData,
      );

      setMasterState((prev) => ({
        ...prev,
        phaseStatuses: { ...prev.phaseStatuses, [activeTab]: "SUBMITTED" },
      }));

      setIsDirty(false);
      toast.success(
        `Phase ${activeTab} successfully validated, submitted, and locked.`,
      );
    } catch (error) {
      toast.error(
        error.message ?? "Server rejected submission criteria entries.",
      );
    } finally {
      setIsSyncing(false);
    }
  };

  const handlePhaseUnlock = async () => {
    if (isSyncing) return;

    const currentKey = PHASE_COMPONENTS[activeTab].stateKey;
    const currentPhaseData = masterState[currentKey];

    try {
      setIsSyncing(true);
      await foundingAuditService.syncPhaseData(
        auditId,
        activeTab,
        false,
        currentPhaseData,
      );

      setMasterState((prev) => ({
        ...prev,
        phaseStatuses: { ...prev.phaseStatuses, [activeTab]: "DRAFT" },
      }));

      setIsDirty(true);
      toast.success(`Phase ${activeTab} unlocked for editing changes.`);
    } catch (error) {
      toast.error(
        error.message ?? "Failed to release structural lock on database entry.",
      );
    } finally {
      setIsSyncing(false);
    }
  };

  if (isLoading) return <Loader2 className="w-6 h-6 animate-spin" />;
  if (!masterState) return null;

  const { Component, stateKey } = PHASE_COMPONENTS[activeTab];
  const isGloballyLocked = masterState.globalStatus === "SUBMITTED";
  const isReadOnlyView =
    isGloballyLocked || masterState.phaseStatuses?.[activeTab] === "SUBMITTED";

  return (
    <div className="flex w-full h-screen overflow-hidden font-sans antialiased text-gray-900 bg-white">
      <FoundingAuditSidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        statuses={masterState.phaseStatuses}
        isDirty={isDirty}
        auditName={masterState.auditName}
      />

      <div className="flex flex-col flex-1 h-full min-w-0 bg-white">
        <main className="flex-1 w-full p-10 overflow-y-auto">
          <div className="max-w-4xl mx-auto">
            <Component
              ref={activePhaseRef}
              data={masterState[stateKey]}
              onChange={handleFieldChange}
              isReadOnly={isReadOnlyView}
              auditId={auditId}
              phaseStatuses={masterState.phaseStatuses}
              crossPhaseSummary={masterState.crossPhaseSummary}
              isGloballyLocked={isGloballyLocked}
            />
          </div>
        </main>

        <footer className="z-10 flex items-center justify-between flex-shrink-0 w-full h-20 px-10 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center gap-2 text-xs font-semibold tracking-wide uppercase">
            {isGloballyLocked ? (
              <>
                <span className="w-2 h-2 bg-purple-500 rounded-full animate-pulse" />
                <span className="font-bold text-purple-600">
                  Audit Certified & Finalized Archive
                </span>
              </>
            ) : isReadOnlyView ? (
              <>
                <span className="w-2 h-2 bg-blue-500 rounded-full" />
                <span className="text-blue-600">Phase verified & locked</span>
              </>
            ) : isDirty ? (
              <>
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                <span className="text-amber-600">
                  Unsaved changes in this step
                </span>
              </>
            ) : (
              <>
                <span className="w-2 h-2 bg-green-500 rounded-full" />
                <span className="text-gray-500">State synchronized</span>
              </>
            )}
          </div>

          <div className="flex gap-3">
            {/* 2. Hide all mutation controls if the session is finalized */}
            {isGloballyLocked ? (
              <span className="text-xs italic font-medium text-gray-400 select-none">
                Historical records locked down under §11 GenG regulations.
              </span>
            ) : isReadOnlyView ? (
              <button
                onClick={handlePhaseUnlock}
                disabled={isSyncing}
                className="px-5 py-2.5 text-sm font-semibold text-white transition bg-amber-500 rounded-lg shadow-sm hover:bg-amber-600 active:bg-amber-700"
              >
                Unlock Phase to Edit
              </button>
            ) : (
              <>
                <button
                  onClick={handlePhaseSaveDraft}
                  disabled={isSyncing}
                  className="px-4 py-2.5 text-sm font-semibold text-gray-700 transition bg-white border border-gray-300 rounded-lg hover:bg-gray-50 active:bg-gray-100 shadow-sm"
                >
                  Save Draft
                </button>
                <button
                  onClick={handlePhaseSubmit}
                  disabled={isSyncing}
                  className="px-5 py-2.5 text-sm font-semibold text-white transition bg-blue-600 rounded-lg shadow-sm hover:bg-blue-700 active:bg-blue-800"
                >
                  Validate & Submit Phase
                </button>
              </>
            )}
          </div>
        </footer>
      </div>
    </div>
  );
};

export { FoundingAuditWizard };
