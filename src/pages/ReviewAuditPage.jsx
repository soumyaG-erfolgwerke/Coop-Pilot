"use client";
import React, { useState, useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  CheckCircle,
  Circle,
  ArrowLeft,
  ArrowRight,
  FileText,
  X,
  PlusCircle,
} from "lucide-react";
import { AuditStatusColors, AuditStatusEnum } from "../lib/AuditStatus";
import { getCoopByIdForAudit as getCoopById } from "../lib/getCoopsService";
import { getAuditData, setAuditStatusUnderReview } from "../lib/AuditService";
import Step1_Overview from "../components/ReviewAudit/Step1_Overview";
import Step2_Checklist from "../components/ReviewAudit/Step2_Checklist";
import Step3_GeneralInfo from "../components/ReviewAudit/Step3_GeneralInfo";
import Step4_GeneralAuditDeclaration from "../components/ReviewAudit/Step4_GeneralAuditDeclaration";
import Step5_KeepingTheBooks from "../components/ReviewAudit/Step5_KeepingTheBooks";
import ReviewModal from "../components/ReviewAudit/ReviewModal";
import { useAuth } from "../hooks/useAuth";
import CreateTicketButton from "../components/AuditerPage/CreateTicketButton";
import TicketsByCoopModal from "../components/AuditerPage/TicketsByCoopModal";
import AuditStatusButtons from "../components/ReviewAudit/AuditStatusButtons";
import AuditReportModal from "../components/AuditerPage/AuditReportModal";
import SubAuditStatusButtons from "@/components/ReviewAudit/SubAuditStatusButtons";

//Todo: import real components from their files instead of using mocks below

// --- Helper Components & Mocks ---
// In a real app, these would be in separate files.

// Mock UI Button Component (from components/Audit/AuditUi.js)
const Button = ({
  onClick,
  children,
  variant = "primary",
  disabled = false,
  customColors = {},
}) => {
  const baseStyles =
    "px-4 py-2 rounded-md font-semibold text-white focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2";

  const variants = {
    primary: `bg-blue-600 hover:bg-blue-700 focus:ring-primary ${
      customColors.primary || ""
    }`,
    secondary:
      "bg-gray-200 hover:bg-gray-300 text-gray-800 focus:ring-gray-400",
    icon: "bg-transparent hover:bg-gray-100 text-blue-600 p-2 rounded-full",
  };

  return (
    <button
      onClick={onClick}
      className={`${baseStyles} ${variants[variant]}`}
      disabled={disabled}
    >
      {children}
    </button>
  );
};

// Mock Logo Components
const GreenValleyOrganicsLogo = ({ className }) => (
  <svg
    className={className}
    viewBox="0 0 100 100"
    xmlns="http://www.w3.org/2000/svg"
  >
    <circle cx="50" cy="50" r="50" fill="#4ade80" />
    <text
      x="50"
      y="60"
      fontSize="40"
      fill="#ffffff"
      textAnchor="middle"
      fontFamily="Arial, sans-serif"
      fontWeight="bold"
    >
      GVO
    </text>
  </svg>
);
const SunriseDairyCollectiveLogo = ({ className }) => (
  <svg
    className={className}
    viewBox="0 0 100 100"
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect width="100" height="100" rx="15" fill="#fbbf24" />
    <text
      x="50"
      y="60"
      fontSize="40"
      fill="#ffffff"
      textAnchor="middle"
      fontFamily="Arial, sans-serif"
      fontWeight="bold"
    >
      SDC
    </text>
  </svg>
);
const CoastalFishermenUnionLogo = ({ className }) => (
  <svg
    className={className}
    viewBox="0 0 100 100"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M 0,50 a 50,50 0 1,1 100,0 a 50,50 0 1,1 -100,0" fill="#60a5fa" />
    <text
      x="50"
      y="60"
      fontSize="40"
      fill="#ffffff"
      textAnchor="middle"
      fontFamily="Arial, sans-serif"
      fontWeight="bold"
    >
      CFU
    </text>
  </svg>
);

// Mock Step Components (e.g., components/Audit/Step1_Overview.js)
const MockStepComponent = ({ title, formData, isReadOnly }) => (
  <div className="p-6 bg-white border border-gray-200 rounded-lg shadow-md">
    <h2 className="mb-4 text-2xl font-bold text-gray-800">{title}</h2>
    <p className="mb-2 text-sm font-medium text-gray-600">
      This is a read-only view of the audit data for this section.
    </p>
    <div className="p-4 mt-4 overflow-y-auto rounded-md bg-gray-50 max-h-60">
      <pre className="text-xs text-gray-700 whitespace-pre-wrap">
        {JSON.stringify(formData, null, 2)}
      </pre>
    </div>
    {isReadOnly && (
      <div className="p-3 mt-4 text-center bg-yellow-100 border border-yellow-300 rounded-md">
        <p className="text-sm font-medium text-yellow-800">
          Editing is disabled in review mode.
        </p>
      </div>
    )}
  </div>
);

const MOCK_COOPERATIVES = {
  "coop-001": {
    name: "Green Valley Organics",
    logoComponent: GreenValleyOrganicsLogo,
    auditStatus: "SUBMITTED",
  },
  "coop-002": {
    name: "Sunrise Dairy Collective",
    logoComponent: SunriseDairyCollectiveLogo,
    auditStatus: "IN_PROGRESS",
  },
  "coop-003": {
    name: "Coastal Fishermen Union",
    logoComponent: CoastalFishermenUnionLogo,
    auditStatus: "APPROVED",
  },
};

const MOCK_AUDIT_DATA = {
  "coop-001": JSON.stringify({
    overview: { mission: "To provide fresh, organic produce." },
    checklist: { item1: true, item2: false },
    generalInfo: { members: 50 },
    declaration: { signed: true },
    books: { balanced: true },
    comments: [
      {
        text: "Initial submission looks good, but please double-check the figures in the 'Books' section.",
        timestamp: new Date("2025-07-05T10:00:00Z"),
      },
    ],
  }),
};

// --- Main Review Page Component ---
function ReviewAuditPage({ coopId }) {
  const mainSteps = [
    { name: "Overview", component: Step1_Overview, formDataKey: "overview" },
    {
      name: "Checklist & Documents",
      component: Step2_Checklist,
      formDataKey: "checklist",
    },
    {
      name: "General Info",
      component: Step3_GeneralInfo,
      formDataKey: "generalInfo",
    },
    {
      name: "Audit Declaration",
      component: Step4_GeneralAuditDeclaration,
      formDataKey: "declaration",
    },
    {
      name: "Keeping the Books",
      component: Step5_KeepingTheBooks,
      formDataKey: "books",
    },
  ];

  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [formData, setFormData] = useState({});
  const [cooperative, setCooperative] = useState(null);
  //   const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [reload, setReload] = useState(0);
  const { user } = useAuth();
  const notificationSentRef = useRef(false);

  useEffect(() => {
    const fetchAllData = async () => {
      setIsLoading(true);
      const coopData = await getCoopById(coopId);
      if (coopData) setCooperative(coopData);
      setIsLoading(false);
    };
    if (coopId) fetchAllData();
  }, [coopId, reload]);

  useEffect(() => {
    const fetchExistingAudit = async () => {
      try {
        const data = await getAuditData(coopId);

        if (data && data.auditData) {
          const jsondata =
            typeof data.auditData === "string"
              ? JSON.parse(data.auditData)
              : data.auditData;

          if (jsondata) {
            setFormData({
              checklist: jsondata.checklist || [],
              documentChecks: jsondata.documentChecks || [],
              ...jsondata,
            });
          }
        } else {
          console.error(`Audit data for "${coopId}" not found or empty.`);
        }

        // Only change status once per session and only if status is SUBMITTED
        // Notification is sent automatically by updateAuditStatus via createNotificationForCoop
        if (
          cooperative &&
          cooperative.auditStatus === "SUBMITTED" &&
          !notificationSentRef.current
        ) {
          notificationSentRef.current = true;

          await setAuditStatusUnderReview(coopId, cooperative?.currentAuditId);
        }
      } catch (err) {
        console.error("Failed to fetch existing audit on review page:", err);
      }
    };
    if (coopId && cooperative) {
      fetchExistingAudit();
    }
  }, [cooperative]);

  //   const handleAction = async (status, comments) => {
  //     // console.log(`Audit ${status} with comments:`, comments);
  //     await updateAuditStatus(coopId, status, comments);
  //     setIsModalOpen(false);
  //     setReload(Date.now()); // Reload data to show updated status
  //   };

  const handleNext = () =>
    currentStepIndex < mainSteps.length - 1 &&
    setCurrentStepIndex(currentStepIndex + 1);
  const handleBack = () =>
    currentStepIndex > 0 && setCurrentStepIndex(currentStepIndex - 1);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen font-sans bg-slate-50">
        <p>Loading audit data...</p>
      </div>
    );
  }

  const CurrentStepComponent = mainSteps[currentStepIndex].component;
  const currentFormDataKey = mainSteps[currentStepIndex].formDataKey;
  const Logo = cooperative?.logoComponent;
  const stepStatuses = mainSteps.map((_, index) =>
    index <= currentStepIndex ? "complete" : "upcoming",
  );

  return (
    <>
      <div className="min-h-screen mt-2 font-sans bg-slate-50">
        <div className="container px-2 py-2 mx-auto md:py-2">
          {cooperative && (
            <section className="mb-8">
              <div className="relative overflow-hidden bg-white border shadow-sm rounded-2xl border-slate-200 dark:border-slate-700 dark:bg-slate-800">
                {/* subtle accent bar */}
                <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-indigo-500 via-sky-500 to-emerald-500" />

                <div className="p-2 sm:p-2">
                  <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                    {/* Left: Logo + name + status */}
                    <div className="flex items-start gap-4">
                      {Logo && (
                        <div className="shrink-0">
                          <Logo className="h-14 w-14 sm:h-16 sm:w-16 rounded-xl ring-1 ring-slate-200 dark:ring-slate-600" />
                        </div>
                      )}

                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-3">
                          <h1 className="text-2xl font-semibold tracking-tight truncate sm:text-3xl text-slate-900 dark:text-white">
                            {cooperative.name}
                          </h1>

                          {cooperative.auditStatus && (
                            <span
                              className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs sm:text-sm font-medium
                    ${
                      AuditStatusColors[cooperative.auditStatus] ||
                      "bg-gray-200 text-gray-800 dark:bg-slate-700 dark:text-slate-100"
                    }`}
                              title="Audit status"
                            >
                              {AuditStatusEnum[cooperative.auditStatus]}
                            </span>
                          )}
                        </div>

                        {/* Audit status action buttons */}
                        <div className="flex items-center gap-2 mt-3">
                          {false ? (
                            <AuditStatusButtons
                              coopId={cooperative.id}
                              currentStatus={cooperative.auditStatus}
                              onUpdated={(next) => {
                                // refresh data (simple)
                                setReload(Date.now());
                              }}
                            />
                          ) : (
                            <SubAuditStatusButtons
                              coopId={cooperative.id}
                              currentStatus={cooperative.auditStatus}
                            />
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right: actions */}
                    <div className="flex items-center gap-2 sm:gap-3">
                      <CreateTicketButton
                        coopid={coopId}
                        auditId={cooperative?.currentAuditId}
                      />
                      <TicketsByCoopModal coopId={coopId} />
                      <AuditReportModal coopId={coopId} />
                    </div>
                  </div>
                </div>
              </div>
            </section>
          )}

          <div className="flex flex-col gap-8 md:flex-row lg:gap-12">
            <aside className="self-start w-full md:w-1/4 lg:w-1/5 md:sticky md:top-8">
              <h2 className="mb-4 font-bold text-gray-700">Audit Sections</h2>
              <nav>
                <ul>
                  {mainSteps.map((step, index) => (
                    <li
                      key={step.name}
                      className="flex py-2.5 cursor-pointer"
                      onClick={() => setCurrentStepIndex(index)}
                    >
                      <div className="flex flex-col items-center mr-4">
                        {stepStatuses[index] === "complete" ? (
                          <CheckCircle
                            className={`h-6 w-6 ${
                              index === currentStepIndex
                                ? "text-blue-600"
                                : "text-gray-400"
                            }`}
                          />
                        ) : (
                          <Circle className="w-6 h-6 text-gray-300" />
                        )}
                        {index < mainSteps.length - 1 && (
                          <div className="w-px h-10 mt-1 bg-gray-300"></div>
                        )}
                      </div>
                      <span
                        className={`font-medium ${
                          index === currentStepIndex
                            ? "text-blue-600"
                            : "text-gray-500"
                        }`}
                      >
                        {step.name}
                      </span>
                    </li>
                  ))}
                </ul>
              </nav>
            </aside>

            <main className="w-full md:w-3/4 lg:w-4/5">
              <div className="mb-8">
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <motion.div
                    className="bg-blue-600 h-2.5 rounded-full"
                    animate={{
                      width: `${
                        (currentStepIndex / (mainSteps.length - 1)) * 100
                      }%`,
                    }}
                    transition={{ ease: "easeInOut", duration: 0.5 }}
                  />
                </div>
              </div>

              <AnimatePresence mode="wait">
                <motion.div
                  key={currentStepIndex}
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -50 }}
                  transition={{ duration: 0.3 }}
                >
                  <CurrentStepComponent
                    formData={formData}
                    setFormData={setFormData}
                  />
                </motion.div>
              </AnimatePresence>

              <div className="flex items-center justify-between pt-6 mt-12 border-t border-gray-200">
                <Button
                  onClick={handleBack}
                  variant="secondary"
                  disabled={currentStepIndex === 0}
                >
                  <ArrowLeft className="w-5 h-5" /> Previous Section
                </Button>
                {currentStepIndex < mainSteps.length - 1 ? (
                  <Button onClick={handleNext}>
                    Next Section <ArrowRight className="w-5 h-5" />
                  </Button>
                ) : (
                  <span className="font-medium text-gray-500">
                    End of Audit Document
                  </span>
                )}
              </div>
            </main>
          </div>
        </div>
      </div>
    </>
  );
}

export default ReviewAuditPage;
