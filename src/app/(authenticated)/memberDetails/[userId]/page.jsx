"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import { useAuth } from "@/hooks/useAuth";
import {
  ArrowLeft,
  User,
  MapPin,
  Mail,
  Phone,
  Info,
  ShieldCheck,
  CreditCard,
  Calendar,
  Briefcase
} from "lucide-react";

// Dynamically import the entire SecureViewer with SSR disabled to prevent ALL pdf.js related errors
const SecureViewer = dynamic(() => import("./SecureViewer"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[600px] bg-gray-50 dark:bg-slate-900/50 animate-pulse rounded-xl flex items-center justify-center border-2 border-dashed border-gray-200 dark:border-slate-800">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-4 rounded-full border-primary border-t-transparent animate-spin" />
        <p className="text-xs font-bold tracking-widest text-gray-500 uppercase">Initializing Secure Engine...</p>
      </div>
    </div>
  )
});

import { motion, AnimatePresence } from "framer-motion";

const TreeNode = ({ title, icon: Icon, children, defaultOpen = false }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="mb-4 overflow-hidden bg-white border border-gray-100 shadow-sm dark:bg-slate-800/50 rounded-2xl dark:border-slate-800">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full p-4 transition-colors hover:bg-gray-50 dark:hover:bg-slate-800"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10 text-primary">
            <Icon size={18} />
          </div>
          <span className="text-sm font-bold tracking-tight text-gray-700 dark:text-gray-300">{title}</span>
        </div>
        <motion.span
          animate={{ rotate: isOpen ? 180 : 0 }}
          className="text-gray-400"
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M2.5 4.5L6 8L9.5 4.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </motion.span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="p-4 pt-0 space-y-1">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const DetailItem = ({ icon: Icon, label, value, masked = false }) => (
  <div className="flex items-start p-3 transition-all rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800 group">
    <div className="p-1.5 mr-3 rounded-md bg-gray-50 dark:bg-slate-900 text-gray-400 group-hover:text-primary transition-colors">
      <Icon size={14} />
    </div>
    <div className="flex-grow min-w-0">
      <p className="text-[10px] font-bold tracking-widest text-gray-500 uppercase dark:text-gray-400">
        {label}
      </p>
      <p className={`text-sm font-bold mt-0.5 truncate px-1.5 py-0.5 rounded border border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-900/50 text-slate-700 dark:text-slate-200 ${masked ? "font-mono tracking-widest" : ""}`}>
        {value || "Not provided"}
      </p>
    </div>
  </div>
);

const SectionTitle = ({ children }) => (
  <h3 className="pb-2 mb-6 text-sm font-bold tracking-widest text-gray-400 uppercase border-b border-gray-100 dark:border-slate-700">
    {children}
  </h3>
);

export default function MemberDetailsPage() {
  const { userId } = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [member, setMember] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedHistoryIndex, setSelectedHistoryIndex] = useState(0);

  const searchParams = useSearchParams();
  const coopId = searchParams?.get("coopId");

  useEffect(() => {
    const fetchMemberDetails = async () => {
      try {
        setIsLoading(true);
        const cleanCoopId = coopId && coopId !== "null" && coopId !== "undefined" ? coopId : "";
        const queryParam = cleanCoopId ? `?coopId=${cleanCoopId}` : "";
        const response = await fetch(`/api/userDetails/${userId}${queryParam}`);
        const data = await response.json();

        if (data.success) {
          setMember(data.user);
          // Default to the most recent application
          if (data.user.kycHistory?.length > 0) {
            setSelectedHistoryIndex(0);
          }
        } else {
          setError(data.error || "Failed to fetch user details");
        }
      } catch (err) {
        console.error("Error fetching member details:", err);
        setError("An unexpected error occurred while fetching details");
      } finally {
        setIsLoading(false);
      }
    };

    if (userId) {
      fetchMemberDetails();
    }
  }, [userId, coopId]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-slate-900">
        <div className="w-12 h-12 border-t-2 border-b-2 rounded-full animate-spin border-primary"></div>
      </div>
    );
  }

  const currentHistoryItem = member?.kycHistory?.[selectedHistoryIndex];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
      <main className="w-full">
        <div className="p-6 mx-auto max-w-7xl">
          {/* Header & Back Button */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.back()}
                className="p-2 text-gray-600 transition-colors rounded-full hover:bg-gray-200 dark:hover:bg-slate-800 dark:text-gray-400"
                title="Go Back"
              >
                <ArrowLeft size={24} />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Member Profile</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">KYC Verification Details for {member?.FirstName} {member?.LastName}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {user?.role?.toLowerCase() === "coopadmin" && (
                <button
                  onClick={() => {
                    const params = new URLSearchParams();
                    params.set("tab", "mails");
                    params.set("compose", "true");
                    params.set("email", member?.contactEmail || "");
                    params.set("salutation", member?.salutation || "");
                    params.set("lastName", member?.LastName || "");
                    params.set("template", "MANUAL_INDIVIDUAL");
                    router.push(`/admin?${params.toString()}`);
                  }}
                  className="px-4 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-full flex items-center gap-1.5 shadow active:scale-[0.98] transition-all"
                  title="Neue Nachricht"
                >
                  <Mail size={14} />
                  <span>Neue Nachricht</span>
                </button>
              )}
              <span className={`px-4 py-1.5 text-xs font-bold rounded-full border ${member?.kycStatus === 'VERIFIED'
                ? "bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-900/50"
                : "bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-900/50"
                }`}>
                {member?.kycStatus}
              </span>
            </div>
          </div>

          {error ? (
            <div className="p-6 text-center text-red-500 border border-red-100 bg-red-50 dark:bg-red-900/10 rounded-xl dark:border-red-900/20">
              {error}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 animate-fadeIn">

              {/* LEFT COLUMN: Sticky Tree View Sidebar */}
              <div className="self-start space-y-4 lg:col-span-4 lg:sticky lg:top-8">


                {/* Personal Information Node */}
                <TreeNode title="Personal Information" icon={User} defaultOpen={true}>
                  <DetailItem icon={User} label="Salutation" value={member?.salutation} />
                  <DetailItem icon={User} label="Full Name" value={`${member?.FirstName} ${member?.LastName}`} />
                  <DetailItem icon={Calendar} label="Birthday" value={member?.bday ? new Date(member.bday).toLocaleDateString() : 'N/A'} />
                  <DetailItem icon={Briefcase} label="Title" value={member?.title} />
                </TreeNode>

                {/* Contact & Address Node */}
                <TreeNode title="Contact & Address" icon={MapPin}>
                  <DetailItem icon={Mail} label="Email" value={member?.contactEmail} />
                  <DetailItem icon={Phone} label="Telephone" value={member?.telephoneNo} />
                  <DetailItem icon={MapPin} label="Street" value={`${member?.street} ${member?.houseNo}`} />
                  <DetailItem icon={MapPin} label="Location" value={`${member?.postalCode} ${member?.location}`} />
                </TreeNode>

                {/* Financial Details Node - Always Visible */}
                <TreeNode title="Financial Details" icon={CreditCard} defaultOpen={true}>
                  <div className="space-y-1">
                    <DetailItem icon={User} label="Account Holder" value={member?.accountHolder} masked />
                    <DetailItem icon={CreditCard} label="IBAN Number" value={member?.ibanNo} masked />
                    <DetailItem icon={ShieldCheck} label="Tax ID" value={member?.taxId} masked />
                  </div>
                </TreeNode>
              </div>

              {/* RIGHT COLUMN: KYC History & Viewer */}
              <div className="space-y-6 lg:col-span-8">

                {/* KYC History Tabs */}
                <div className="flex gap-1 p-1 overflow-x-auto bg-white border border-gray-100 dark:bg-slate-800/50 rounded-xl dark:border-slate-800">
                  {member?.kycHistory?.map((item, idx) => (
                    <button
                      key={item.applicationId}
                      onClick={() => setSelectedHistoryIndex(idx)}
                      className={`px-4 py-2 text-xs font-bold rounded-lg whitespace-nowrap transition-all ${selectedHistoryIndex === idx
                        ? "bg-primary text-white shadow-md"
                        : "text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-800"
                        }`}
                    >
                      Attempt #{item.submissionAttempt} ({new Date(item.createdAt).toLocaleDateString()})
                    </button>
                  ))}
                  {(!member?.kycHistory || member.kycHistory.length === 0) && (
                    <div className="px-4 py-2 text-xs italic text-gray-400">No KYC attempts found</div>
                  )}
                </div>

                {/* Selected Application Details */}
                {currentHistoryItem && (
                  <div className="p-6 border border-indigo-100 bg-indigo-50/50 dark:bg-indigo-900/10 rounded-2xl dark:border-indigo-900/20">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-sm font-bold text-indigo-900 dark:text-indigo-300">Application Details</h4>
                      <span className={`px-2 py-0.5 text-[10px] font-black uppercase rounded border ${currentHistoryItem.status === 'VERIFIED' ? "bg-green-100 text-green-700 border-green-200" : "bg-yellow-100 text-yellow-700 border-yellow-200"
                        }`}>
                        {currentHistoryItem.status}
                      </span>
                    </div>
                    {currentHistoryItem.reason && (
                      <div className="p-3 mb-4 text-xs text-red-600 bg-white border border-red-100 rounded-lg dark:bg-slate-800 dark:text-red-400 dark:border-red-900/30">
                        <p className="mb-1 font-bold underline">Reviewer Comment:</p>
                        <p>{currentHistoryItem.reason}</p>
                      </div>
                    )}

                    {/* Secure Document Viewer using pdf.js */}
                    <SecureViewer doc={currentHistoryItem.document} />
                  </div>
                )}

              </div>
            </div>
          )}
        </div>
      </main>

      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.5s ease-out forwards;
        }
      `}</style>
    </div>
  );
}
