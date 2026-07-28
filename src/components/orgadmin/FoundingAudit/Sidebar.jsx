import React, { useState } from "react";
import { ConfirmModal } from "@/components/orgadmin/FoundingAudit/Dashboard";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

const FoundingAuditSidebar = ({
  activeTab,
  setActiveTab,
  statuses = {},
  isDirty = false,
  auditName,
}) => {
  const router = useRouter();
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);

  const menuItems = [
    { id: "G1", label: "G1: Mandate & Contact", sub: "Prüfungsauftrag" },
    { id: "G2", label: "G2: Founding Documents", sub: "Gründungsunterlagen" },
    { id: "G3", label: "G3: Statutes Compliance", sub: "Satzungsprüfung" },
    { id: "G4", label: "G4: Members & Organs", sub: "Gründungsmitglieder" },
    { id: "G5", label: "G5: Economic Viability", sub: "Tragfähigkeit" },
    { id: "G6", label: "G6: Cooperative Purpose", sub: "Förderzweckprüfung" },
    { id: "G7", label: "G7: Gutachten Generation", sub: "Gutachten" },
  ];

  const executeNavigation = (id, goBack) => {
    setIsConfirmOpen(false);
    setPendingAction(null);

    if (goBack) {
      router.push("/dashboard?tab=founding-audit");
      return;
    }
    setActiveTab(id);
  };

  const handleTabChange = (id, goBack = false) => {
    if (isDirty) {
      setPendingAction({ id, goBack });
      setIsConfirmOpen(true);
      return;
    }
    executeNavigation(id, goBack);
  };

  const getStatusIndicator = (status, isActive) => {
    switch (status) {
      case "SUBMITTED":
        return (
          <svg
            className={`w-5 h-5 flex-shrink-0 ${isActive ? "text-white" : "text-green-500"}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={3}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M5 13l4 4L19 7"
            />
          </svg>
        );
      case "DRAFT":
        return (
          <span
            className={`flex h-2.5 w-2.5 rounded-full flex-shrink-0 ${
              isActive
                ? "bg-white ring-4 ring-white/30"
                : "bg-amber-500 ring-4 ring-amber-500/20"
            }`}
          />
        );
      default:
        return null;
    }
  };

  return (
    <aside className="flex flex-col justify-between flex-shrink-0 h-full p-5 border-r border-gray-200 select-none w-76 bg-gray-50">
      <div>
        <div className="px-2 mb-6">
          <button
            onClick={() => handleTabChange(null, true)}
            className="flex items-center gap-1 my-2 text-xs text-gray-500 hover:text-gray-700"
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
          <h2 className="text-lg font-bold tracking-tight text-gray-900">
            {auditName || "Founding Audit"}
          </h2>
          <p className="text-[11px] text-gray-400 font-mono mt-0.5 tracking-wider">
            §11 Abs. 2 Nr. 3 GenG Workflow
          </p>
        </div>

        <nav className="space-y-1.5">
          {menuItems.map((item) => {
            const isActive = activeTab === item.id;
            const currentStatus = statuses[item.id];

            return (
              <button
                key={item.id}
                onClick={() => handleTabChange(item.id)}
                className={`w-full text-left px-4 py-3 rounded-lg transition-all duration-150 flex flex-col gap-0.5 border ${
                  isActive
                    ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                    : "bg-white hover:bg-gray-100 text-gray-700 border-gray-200/80 hover:border-gray-300"
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="text-sm font-semibold tracking-tight">
                    {item.label}
                  </span>
                  {getStatusIndicator(currentStatus, isActive)}
                </div>
                <span
                  className={`text-xs ${isActive ? "text-blue-200" : "text-gray-400 font-medium"}`}
                >
                  {item.sub}
                </span>
              </button>
            );
          })}
        </nav>
      </div>

      <div className="pt-3 px-2 text-[11px] text-gray-400 border-t border-gray-200/60 font-medium tracking-wide">
        <p>Platform: CoopPilot Engine v1.0</p>
      </div>

      <ConfirmModal
        deleteOverride="Discard Changes"
        open={isConfirmOpen}
        title="Unsaved Changes"
        message="You have unsaved changes in your form. Are you sure you want to switch phases without saving?"
        onCancel={() => {
          setIsConfirmOpen(false);
          setPendingAction(null);
        }}
        onConfirm={() =>
          executeNavigation(pendingAction?.id, pendingAction?.goBack)
        }
      />
    </aside>
  );
};

export { FoundingAuditSidebar };
