"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import ReactDOM from "react-dom";
import {
  ArrowDown,
  ArrowDown01,
  CalendarDays,
  CalendarSync,
  Check,
  CheckCircle,
  ChevronDown,
  CircleAlert,
  CircleCheck,
  CircleX,
  Clock,
  FileText,
  FolderCog,
  Plus,
  Radio,
  RefreshCcw,
  RefreshCw,
  TrendingUp,
  Users,
  Trash2,
} from "lucide-react";
import {
  closeAssemblyPolls,
  closePoll,
  createPolls,
  getPollsByCoopId,
} from "@/lib/votingService.js";
import { getAssemblyById, updateAssemblyStatus } from "@/lib/assemblyService";
import calculateQuorum from "@/services/quorum/calculateQuorum";
import { UpdateQuorumOfAssembly } from "@/services/quorum/QuorumServices";
import toast from "react-hot-toast";
import { NiederschriftModal } from "../NiederschriftView";
import { getCoopById } from "@/lib/getCoopsService";
import { normalizeAssemblyStatus } from "@/lib/helpers/_auxilaryHelpers";
import TiltPopUp from "@/components/pop-ups/TiltPopUp";
import FadePopUp from "@/components/FadePopUp";

const statusGroups = [
  {
    key: "live",
    title: "Live / Ongoing Assemblies",
    description: "Assemblies currently active or in progress.",
    icon: Radio,
  },
  {
    key: "draft",
    title: "Draft Assemblies",
    description: "Assemblies prepared but not yet sent.",
    icon: FileText,
  },
  {
    key: "upcoming",
    title: "Upcoming Assemblies",
    description: "Invitations sent for future assemblies.",
    icon: Clock,
  },
  {
    key: "closed",
    title: "Closed Assemblies",
    description: "Finished assemblies kept for history.",
    icon: CheckCircle,
  },
];

const formatLabels = {
  praesenz: "Physical",
  virtuell: "Virtual",
  hybrid: "Hybrid",
  gestreckt: "Stretched Procedure",
};

const formatDate = (value) => {
  if (!value) return "No date set";
  return new Date(value).toLocaleString("en", {
    dateStyle: "medium",
    timeStyle: "short",
  });
};

export const normalizeStatus = normalizeAssemblyStatus;

const FieldError = ({ children }) =>
  children ? (
    <p className="mt-1.5 text-xs font-semibold text-red-500 dark:text-red-400 flex items-center gap-1">
      <CircleAlert className="w-3.5 h-3.5 shrink-0" />
      {children}
    </p>
  ) : null;

const Label = ({ children, required = false }) => (
  <label className="block mb-2 text-xs font-bold tracking-wider text-gray-500 uppercase dark:text-gray-400">
    {children}
    {required && <span className="ml-1 font-bold text-red-500">*</span>}
  </label>
);

const modalInputClass =
  "w-full px-4 py-2.5 text-sm border border-gray-300 rounded-xl bg-white dark:bg-slate-800 dark:text-white dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm";

const AssemblyCard = ({
  assembly,
  assemblyPolls,
  onMakeLive,
  onCloseAssembly,
  onCreatePoll,
  onClosePolls,
  onManagePolls,
  onEditAssembly,
  onDiscardAssembly,
  isUpdating,
  isClosing,
}) => {
  if (!assembly) {
    return null;
  }

  const status = assembly.status;
  const canMakeLive =
    assembly.status === "invited" ||
    assembly.status === "upcoming" ||
    status === "upcoming";
  const isLive = status === "live";
  const isClosed = status === "closed";
  const [isChecking, setIsChecking] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isQuorumMet, setIsQuorumMet] = useState(assembly.quorumMet || false);
  const [quorumValue, setQuorumValue] = useState(assembly.quorum || 0);

  const closedPolls = (assemblyPolls || []).filter((poll) => {
    if (poll.status) return poll.status === "closed";
    if (!poll.endTime) return false;
    return new Date(poll.endTime) <= new Date();
  });

  const statusClasses = {
    live: "text-emerald-700 bg-emerald-50 border border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/50",
    draft:
      "text-gray-600 bg-gray-50 border border-gray-200 dark:bg-slate-700 dark:text-gray-300 dark:border-slate-600",
    upcoming:
      "text-blue-700 bg-blue-50 border border-blue-200 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-900/50",
    closed:
      "text-rose-700 bg-rose-50 border border-rose-200 dark:bg-rose-950/20 dark:text-rose-400 dark:border-rose-900/50",
    default:
      "text-gray-700 bg-gray-100 border border-gray-200 dark:bg-slate-700 dark:text-gray-200",
  };

  const onCalculateQuorum = async (assembly, notify = true) => {
    setIsChecking(true);
    try {
      const { quorumPercentage, isQuorumMet } = await calculateQuorum(assembly);
      setIsQuorumMet(isQuorumMet);
      setQuorumValue(quorumPercentage);
      await UpdateQuorumOfAssembly(assembly.id, quorumPercentage, isQuorumMet);

      if (notify) {
        if (isQuorumMet) {
          toast.success(
            `Quorum met at ${quorumPercentage}%. You can now make the assembly live.`,
          );
        } else {
          toast.error(
            `Quorum not met. Current quorum is ${quorumPercentage}%.`,
          );
        }
      }
    } catch (error) {
      console.error("Error updating quorum:", error);
      toast.error("Failed to calculate quorum.");
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <article className="p-5 transition-all duration-300 bg-white border border-gray-200 shadow-xs hover:border-gray-300 dark:bg-slate-800 dark:border-slate-700 hover:dark:border-slate-600 rounded-2xl hover:shadow-sm">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div className="space-y-1.5">
          <h4 className="flex flex-wrap items-center gap-2 text-sm font-extrabold text-gray-900 dark:text-white">
            {assembly.title || "Untitled Assembly"}
            <span
              className={`inline-flex items-center px-2.5 py-0.5 text-[10px] font-bold rounded-full uppercase tracking-wider ${
                statusClasses[status] || statusClasses.default
              }`}
            >
              {status === "live" && (
                <span className="relative flex h-2 w-2 mr-1.5 shrink-0">
                  <span className="absolute inline-flex w-full h-full rounded-full opacity-75 animate-ping bg-emerald-400"></span>
                  <span className="relative inline-flex w-2 h-2 rounded-full bg-emerald-500"></span>
                </span>
              )}
              {status}
            </span>
            {quorumValue !== null && (
              <span
                className={`inline-flex items-center px-2.5 py-0.5 text-[10px] font-bold rounded-full border ${
                  isQuorumMet
                    ? "bg-green-50/50 text-green-800 border-green-100 dark:bg-green-950/10 dark:border-green-900/30 dark:text-green-305"
                    : "bg-gray-50/50 text-gray-500 border-gray-200 dark:bg-slate-900/10 dark:border-slate-700 dark:text-gray-400"
                }`}
              >
                {isQuorumMet ? (
                  <CircleCheck
                    size={12}
                    className="inline-block mr-1 text-green-500 shrink-0"
                  />
                ) : (
                  <CircleAlert
                    size={12}
                    className="inline-block mr-1 text-gray-400 shrink-0"
                  />
                )}
                Quorum: {quorumValue ? `${quorumValue}%` : "0%"}
              </span>
            )}
          </h4>
          <p className="text-xs text-gray-450 dark:text-gray-400 font-semibold flex items-center gap-1.5">
            <span className="px-2 py-0.5 bg-gray-100 dark:bg-slate-700 rounded-md text-[10px] uppercase font-bold text-gray-650 dark:text-gray-300">
              {formatLabels[assembly.format] || assembly.format || "Assembly"}
            </span>
            <span>•</span>
            <span className="text-gray-550 dark:text-gray-400">
              {formatDate(assembly.startDateTime)}
            </span>
          </p>
        </div>
        {isClosed && (
          <div>
            <button
              type="button"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-blue-600 bg-blue-50/50 hover:bg-blue-50 hover:underline dark:bg-slate-700 dark:text-blue-400 rounded-lg transition-colors border border-transparent hover:border-blue-150"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              <ChevronDown
                className={`w-3.5 h-3.5 transition-transform duration-200 ${
                  isExpanded ? "rotate-180" : "rotate-0"
                }`}
              />
              {isExpanded ? "Collapse Results" : "View Results"}
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 mt-4 sm:grid-cols-4">
        {[
          { label: "Agenda Topics", value: assembly.agendaCount || 0 },
          {
            label: "Invited Members",
            value: assembly.attendanceSummary?.totalMembers || 0,
          },
          {
            label: "Represented",
            value: assembly.attendanceSummary?.representedMembers || 0,
          },
          {
            label: "Represented Shares",
            value: assembly.attendanceSummary?.representedShares || 0,
          },
        ].map((stat, idx) => (
          <div
            key={idx}
            className="p-3 border bg-gray-50/40 dark:bg-slate-900/10 border-gray-150/40 dark:border-slate-805 rounded-xl"
          >
            <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
              {stat.label}
            </p>
            <p className="text-base font-extrabold text-gray-900 dark:text-white mt-0.5">
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      {!isClosed && (
        <div className="flex flex-wrap items-center justify-between gap-3 pt-4 mt-5 border-t border-gray-100 dark:border-slate-700/50">
          <div className="flex flex-wrap gap-2">
            {canMakeLive && (
              <>
                <button
                  type="button"
                  onClick={() => onCalculateQuorum?.(assembly)}
                  disabled={isChecking || isQuorumMet}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-blue-600 border border-blue-200 hover:text-white hover:bg-blue-600 hover:border-blue-600 rounded-xl bg-blue-50/50 dark:bg-blue-900/10 dark:text-blue-400 dark:border-blue-800/50 dark:hover:bg-blue-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isChecking ? (
                    <RefreshCw
                      size={14}
                      className="text-blue-600 animate-spin"
                    />
                  ) : (
                    <CalendarSync size={14} />
                  )}
                  {isChecking ? "Checking..." : "Calculate Quorum"}
                </button>
                <div
                  className="relative"
                  title={
                    !isQuorumMet
                      ? "Quorum not met. Please calculate quorum first."
                      : ""
                  }
                >
                  {isQuorumMet && (
                    <button
                      type="button"
                      onClick={() => onMakeLive?.(assembly.id)}
                      disabled={isUpdating || !isQuorumMet}
                      className="inline-flex items-center gap-1.5 px-4.5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md shadow-emerald-500/10 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {isUpdating ? (
                        <RefreshCw size={14} className="animate-spin" />
                      ) : (
                        <Radio size={14} />
                      )}
                      {isUpdating ? "Updating..." : "Make Live"}
                    </button>
                  )}
                </div>
              </>
            )}
            {isLive && (
              <>
                <button
                  type="button"
                  onClick={() => onCreatePoll?.(assembly)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-blue-600 border border-blue-200 hover:bg-blue-600 hover:text-white rounded-xl bg-blue-50/50 dark:bg-blue-900/10 dark:text-blue-400 dark:border-blue-800/50 dark:hover:bg-blue-600 transition-all"
                >
                  <Plus size={14} />
                  Create Poll
                </button>
                <button
                  type="button"
                  onClick={() => onManagePolls?.(assembly)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-gray-700 border border-gray-200 bg-white hover:bg-gray-50 rounded-xl dark:bg-slate-700 dark:text-gray-200 dark:border-slate-600 dark:hover:bg-slate-650 transition-all"
                >
                  <FolderCog size={14} />
                  Manage Polls
                </button>
              </>
            )}
            {status === "draft" && (
              <button
                type="button"
                onClick={() => onEditAssembly?.(assembly)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-blue-600 border border-blue-200 hover:bg-blue-600 hover:text-white rounded-xl bg-blue-50/50 dark:bg-blue-900/10 dark:text-blue-400 dark:border-blue-800/50 dark:hover:bg-blue-600 transition-all"
              >
                <FileText size={14} />
                Edit Draft
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-2 ml-auto">
            {status === "draft" ? (
              <button
                type="button"
                onClick={() => onDiscardAssembly?.(assembly)}
                disabled={isClosing}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-rose-700 border border-rose-200 hover:bg-rose-600 hover:text-white rounded-xl bg-rose-50/50 dark:bg-rose-900/10 dark:text-rose-400 dark:border-rose-800/50 dark:hover:bg-rose-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isClosing ? (
                  <RefreshCw size={14} className="animate-spin" />
                ) : (
                  <Trash2 size={14} />
                )}
                {isClosing ? "Discarding..." : "Discard Assembly"}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => onCloseAssembly?.(assembly, isLive)}
                disabled={isClosing}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-rose-700 border border-rose-200 hover:bg-rose-600 hover:text-white rounded-xl bg-rose-50/50 dark:bg-rose-900/10 dark:text-rose-400 dark:border-rose-800/50 dark:hover:bg-rose-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isClosing ? (
                  <RefreshCw size={14} className="animate-spin" />
                ) : (
                  <CircleX size={14} />
                )}
                {isClosing ? "Closing..." : "Close Assembly"}
              </button>
            )}
          </div>
        </div>
      )}

      {isExpanded && isClosed && (
        <div className="pt-5 mt-4 space-y-3 border-t border-gray-100 dark:border-slate-700">
          <div className="flex items-center gap-2 text-xs font-bold tracking-wider text-gray-500 uppercase dark:text-gray-400">
            <TrendingUp size={14} className="text-blue-500" />
            Voting Results
          </div>
          {closedPolls.length === 0 ? (
            <p className="py-2 text-xs font-medium text-gray-450 dark:text-gray-500">
              No results available for this assembly.
            </p>
          ) : (
            <div className="space-y-3.5">
              {closedPolls.map((poll) => (
                <div
                  key={poll.$id}
                  className="flex flex-col justify-between gap-4 p-4 border shadow-xs md:flex-row md:items-center border-gray-150 dark:border-slate-750 bg-gray-55/30 dark:bg-slate-800/20 rounded-xl"
                >
                  <div className="max-w-xs shrink-0">
                    <p className="text-xs font-bold tracking-wide text-gray-800 uppercase dark:text-gray-200">
                      {poll.title}
                    </p>
                    {poll.description && (
                      <p className="text-[11px] text-gray-400 dark:text-gray-550 mt-1 leading-snug">
                        {poll.description}
                      </p>
                    )}
                  </div>
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-4 text-[10px] font-bold text-gray-500 uppercase tracking-wide">
                      <span className="flex items-center gap-1">
                        <CircleCheck className="w-3.5 h-3.5 text-emerald-500" />{" "}
                        Yes: {poll.yesCount || 0}
                      </span>
                      <span className="flex items-center gap-1">
                        <CircleX className="w-3.5 h-3.5 text-rose-500" /> No:{" "}
                        {poll.noCount || 0}
                      </span>
                      <span className="flex items-center gap-1">
                        <CircleAlert className="w-3.5 h-3.5 text-slate-400" />{" "}
                        Abstain: {poll.abstainCount || 0}
                      </span>
                    </div>
                    <div className="space-y-1.5">
                      {(() => {
                        const yes = Number(poll.yesCount || 0);
                        const no = Number(poll.noCount || 0);
                        const abstain = Number(poll.abstainCount || 0);
                        const total = yes + no + abstain || 1;
                        const yesPct = Math.round((yes / total) * 100);
                        const noPct = Math.round((no / total) * 100);
                        const abstainPct = Math.round((abstain / total) * 100);

                        return (
                          <>
                            <div className="flex items-center gap-2.5 text-[10px] font-semibold text-gray-500">
                              <span className="w-12 text-right shrink-0">
                                Yes ({yesPct}%)
                              </span>
                              <div className="flex-1 h-2 overflow-hidden bg-gray-200 rounded-full dark:bg-slate-700">
                                <div
                                  className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-emerald-500"
                                  style={{ width: `${yesPct}%` }}
                                />
                              </div>
                            </div>
                            <div className="flex items-center gap-2.5 text-[10px] font-semibold text-gray-500">
                              <span className="w-12 text-right shrink-0">
                                No ({noPct}%)
                              </span>
                              <div className="flex-1 h-2 overflow-hidden bg-gray-200 rounded-full dark:bg-slate-700">
                                <div
                                  className="h-full rounded-full bg-gradient-to-r from-rose-400 to-rose-500"
                                  style={{ width: `${noPct}%` }}
                                />
                              </div>
                            </div>
                            <div className="flex items-center gap-2.5 text-[10px] font-semibold text-gray-500">
                              <span className="w-12 text-right shrink-0">
                                Abs ({abstainPct}%)
                              </span>
                              <div className="flex-1 h-2 overflow-hidden bg-gray-200 rounded-full dark:bg-slate-700">
                                <div
                                  className="h-full rounded-full bg-gradient-to-r from-slate-400 to-slate-500"
                                  style={{ width: `${abstainPct}%` }}
                                />
                              </div>
                            </div>
                          </>
                        );
                      })()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </article>
  );
};

const EmptyGroup = () => (
  <div className="p-8 text-xs font-bold tracking-wider text-center text-gray-400 uppercase border-2 border-dashed select-none border-gray-150 rounded-2xl bg-gray-50/50 dark:bg-slate-800/20 dark:border-slate-700/60 dark:text-gray-500">
    No assemblies found in this status
  </div>
);

export default function AssemblyDashboardView({
  assemblies = [],
  onCreateAssembly,
  onAssemblyUpdate,
  onEditAssembly,
  onDiscardAssembly,
  selectedCoop,
}) {
  const [activeTab, setActiveTab] = useState("all");
  const [actionError, setActionError] = useState("");
  const [actionId, setActionId] = useState("");
  const [pollAssembly, setPollAssembly] = useState(null);
  const [isPollModalOpen, setIsPollModalOpen] = useState(false);
  const [isCreatingPoll, setIsCreatingPoll] = useState(false);
  const [manageAssembly, setManageAssembly] = useState(null);
  const [managePolls, setManagePolls] = useState([]);
  const [manageLoading, setManageLoading] = useState(false);
  const [pollsByAssembly, setPollsByAssembly] = useState({});
  const [isClosing, setIsClosing] = useState(false);
  const [niederschriftModalOpen, setNiederschriftModalOpen] = useState(false);
  const [closingAssembly, setClosingAssembly] = useState(null);
  const [coopData, setCoopData] = useState(null);
  const [closingAssemblyVotes, setClosingAssemblyVotes] = useState([]);
  const [assemblyVotes, setAssemblyVotes] = useState([]);
  const [pdfGenerated, setPdfGenerated] = useState(false);
  const [discardConfirmAssembly, setDiscardConfirmAssembly] = useState(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const groupedAssemblies = useMemo(() => {
    return assemblies.reduce(
      (groups, assembly) => {
        const status = normalizeStatus(assembly);
        if (status === "discarded") return groups;
        groups[status].push(assembly);
        groups.all.push(assembly);
        return groups;
      },
      { all: [], live: [], draft: [], upcoming: [], closed: [] },
    );
  }, [assemblies]);

  useEffect(() => {
    const fetchCoop = async () => {
      try {
        const res = await getCoopById(selectedCoop);
        setCoopData(res);
      } catch (err) {
        console.error(err);
      }
    };

    if (selectedCoop) {
      fetchCoop();
    }
  }, [selectedCoop]);

  const visibleAssemblies =
    activeTab === "all"
      ? groupedAssemblies
      : { [activeTab]: groupedAssemblies[activeTab] || [] };

  useEffect(() => {
    const loadAssemblyPolls = async () => {
      if (assemblies.length === 0) return;
      const coopIds = Array.from(new Set(assemblies.map((a) => a.coopId)));
      if (coopIds.length !== 1) return;

      try {
        const polls = await getPollsByCoopId(coopIds[0]);
        const grouped = polls.reduce((acc, poll) => {
          if (!poll.assemblyId) return acc;
          if (!acc[poll.assemblyId]) acc[poll.assemblyId] = [];
          acc[poll.assemblyId].push(poll);
          return acc;
        }, {});
        setPollsByAssembly(grouped);
      } catch {
        setPollsByAssembly({});
      }
    };

    loadAssemblyPolls();
  }, [assemblies]);

  const handleMakeLive = async (assemblyId) => {
    setActionId(assemblyId);
    setActionError("");
    try {
      const updated = await updateAssemblyStatus(assemblyId, "live");
      onAssemblyUpdate?.(updated);
    } catch (error) {
      setActionError(error.message || "Failed to update assembly status.");
    } finally {
      setActionId("");
    }
  };

  const fetchClosingAssemblyVotes = async (assemblyId) => {
    try {
      const res = await fetch(
        `/api/assembly/${encodeURIComponent(assemblyId)}/assemblyVotes`,
      );
      const data = await res.json();
      setClosingAssemblyVotes(
        data.votes.map((vote) => ({
          ...vote,
          yes: vote.yesCount || 0,
          no: vote.noCount || 0,
          abstain: vote.abstainCount || 0,
          title: vote.titleAssembly || "Untitled Poll",
        })),
      );
      const assemblyDetails = await getAssemblyById(assemblyId);
      setClosingAssembly(assemblyDetails);
      if (!assemblyVotes) {
        throw new Error("Failed to fetch assembly votes.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const openPollModal = (assembly) => {
    setPollAssembly(assembly);
    setIsPollModalOpen(true);
    setActionError("");
  };

  const closeAssembly = async (assemblyId) => {
    setIsClosing(true);
    setActionError("");
    try {
      const updated = await updateAssemblyStatus(assemblyId, "closed");
      onAssemblyUpdate?.(updated);
    } catch (error) {
      setActionError(error.message || "Failed to close assembly.");
    } finally {
      setNiederschriftModalOpen(false);
      setActionId("");
      setIsClosing(false);
    }
  };

  const handleCloseAssembly = async (assembly, isLive = true) => {
    const assemblyId = assembly.id;
    setIsClosing(true);
    setActionError("");
    try {
      if (isLive) {
        await fetchClosingAssemblyVotes(assemblyId);
        setNiederschriftModalOpen(true);
      }
      if (pdfGenerated || !isLive) {
        const updated = await updateAssemblyStatus(
          assemblyId,
          "closed",
          isLive,
        );
        onAssemblyUpdate?.(updated);
      }
    } catch (error) {
      setActionError(error.message || "Failed to close assembly.");
    } finally {
      setIsClosing(false);
    }
  };

  const handleCreatePoll = async (pollData) => {
    if (!pollAssembly) return;
    setIsCreatingPoll(true);
    setActionError("");
    try {
      await createPolls(
        pollAssembly.coopId,
        pollData.options,
        pollData.endTime,
        pollData.title,
        pollData.description,
        pollData.isCritical || false,
        pollAssembly.id,
      );
      setIsPollModalOpen(false);
      setPollAssembly(null);
    } catch (error) {
      setActionError(error.message || "Failed to create poll.");
    } finally {
      setIsCreatingPoll(false);
    }
  };

  const handleClosePolls = async (assembly) => {
    setActionId(assembly.id);
    setActionError("");
    try {
      await closeAssemblyPolls(assembly.id, assembly.coopId);
    } catch (error) {
      setActionError(error.message || "Failed to close polls.");
    } finally {
      setActionId("");
    }
  };

  const handleManagePolls = async (assembly) => {
    setManageAssembly(assembly);
    setManagePolls([]);
    setManageLoading(true);
    setActionError("");
    try {
      const polls = await getPollsByCoopId(assembly.coopId);
      setManagePolls(polls.filter((poll) => poll.assemblyId === assembly.id));
    } catch (error) {
      setActionError(error.message || "Failed to load polls.");
    } finally {
      setManageLoading(false);
    }
  };

  const handleClosePoll = async (pollId, coopId) => {
    setActionError("");
    try {
      const updated = await closePoll(pollId, coopId);
      setManagePolls((prev) =>
        prev.map((poll) => (poll.$id === updated.$id ? updated : poll)),
      );
    } catch (error) {
      setActionError(error.message || "Failed to close poll.");
    }
  };

  return (
    <div className="p-4 space-y-6 sm:p-6 animate-fadeIn">
      {/* Header Panel */}
      <div className="flex flex-col gap-4 p-6 bg-white border border-gray-100 shadow-sm md:flex-row md:items-center md:justify-between dark:bg-slate-800 dark:border-slate-700 rounded-2xl">
        <div>
          <h2 className="text-xl font-extrabold tracking-wide text-gray-900 dark:text-white">
            Assembly History
          </h2>
          <p className="mt-1 text-xs font-semibold text-gray-500 dark:text-gray-400">
            Track draft, live, upcoming, and closed general assemblies.
          </p>
        </div>
        <button
          type="button"
          onClick={onCreateAssembly}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-all shadow-sm hover:shadow-md duration-200"
        >
          <Plus size={15} />
          Create Assembly
        </button>
      </div>

      {/* Premium Tabs Filter Bar */}
      <div className="inline-flex flex-wrap gap-1 p-1 border bg-gray-100/80 dark:bg-slate-800/80 border-gray-200/50 dark:border-slate-700/50 rounded-xl">
        {[
          { key: "all", label: "All" },
          { key: "live", label: "Live" },
          { key: "draft", label: "Draft" },
          { key: "upcoming", label: "Upcoming" },
          { key: "closed", label: "Closed" },
        ].map((tab) => {
          const isActive = activeTab === tab.key;
          const count = groupedAssemblies[tab.key]?.length || 0;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition-all duration-200 flex items-center gap-1.5 ${
                isActive
                  ? "bg-white text-blue-600 shadow-sm dark:bg-slate-700 dark:text-blue-450"
                  : "text-gray-550 hover:text-gray-805 dark:text-gray-400 dark:hover:text-gray-200"
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`px-2 py-0.5 text-[10px] font-extrabold rounded-full ${
                  isActive
                    ? "bg-blue-50 text-blue-600 dark:bg-slate-800 dark:text-blue-400"
                    : "bg-gray-200 text-gray-600 dark:bg-slate-600 dark:text-gray-300"
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      <div className="space-y-6">
        {actionError && (
          <div className="p-4 text-xs font-semibold text-red-700 border border-red-200 rounded-xl bg-red-50 dark:border-red-800 dark:bg-red-900/20 dark:text-red-200">
            {actionError}
          </div>
        )}

        {activeTab === "all" ? (
          Object.entries(visibleAssemblies).map(([status, items]) => {
            if (status === "all") return null;
            if (items.length === 0) return null;

            const group = statusGroups.find((g) => g.key === status);
            if (!group) return null;

            const Icon = group.icon;

            return (
              <section
                key={status}
                className="pb-4 space-y-4 overflow-hidden border shadow-xs bg-white/70 border-gray-150/60 rounded-2xl dark:bg-slate-800/70 dark:border-slate-700/80 backdrop-blur-xs animate-fadeIn"
              >
                <div className="flex items-start gap-4 p-5 border-b border-gray-100 bg-gray-50/50 dark:bg-slate-800/50 dark:border-slate-700 shrink-0">
                  <div
                    className={`flex items-center justify-center rounded-xl w-10 h-10 shadow-xs shrink-0 ${
                      status === "live"
                        ? "bg-emerald-500 text-white shadow-emerald-500/20"
                        : status === "upcoming"
                          ? "bg-blue-500 text-white shadow-blue-500/20"
                          : status === "draft"
                            ? "bg-gray-500 text-white shadow-gray-500/20"
                            : "bg-rose-500 text-white shadow-rose-500/20"
                    }`}
                  >
                    <Icon size={18} />
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold tracking-wide text-gray-900 dark:text-white">
                      {group.title}
                    </h3>
                    <p className="mt-0.5 text-xs text-gray-400 dark:text-gray-550 font-medium">
                      {group.description}
                    </p>
                  </div>
                </div>

                <div className="px-5 space-y-4">
                  {items.map((assembly) => (
                    <AssemblyCard
                      key={assembly.id}
                      assembly={assembly}
                      assemblyPolls={pollsByAssembly[assembly.id] || []}
                      onMakeLive={handleMakeLive}
                      onCloseAssembly={handleCloseAssembly}
                      onCreatePoll={openPollModal}
                      onClosePolls={handleClosePolls}
                      onManagePolls={handleManagePolls}
                      onEditAssembly={onEditAssembly}
                      onDiscardAssembly={(a) => setDiscardConfirmAssembly(a)}
                      isClosing={isClosing}
                      isUpdating={actionId === assembly.id}
                    />
                  ))}
                </div>
              </section>
            );
          })
        ) : (
          <div className="p-6 space-y-4 border shadow-xs bg-white/70 border-gray-150/60 rounded-2xl dark:bg-slate-800/70 dark:border-slate-700/80 backdrop-blur-xs">
            {(visibleAssemblies[activeTab] || []).length === 0 ? (
              <EmptyGroup />
            ) : (
              (visibleAssemblies[activeTab] || []).map((assembly) => (
                <AssemblyCard
                  key={assembly.id}
                  assembly={assembly}
                  assemblyPolls={pollsByAssembly[assembly.id] || []}
                  onMakeLive={handleMakeLive}
                  onCloseAssembly={handleCloseAssembly}
                  onCreatePoll={openPollModal}
                  onClosePolls={handleClosePolls}
                  onManagePolls={handleManagePolls}
                  onEditAssembly={onEditAssembly}
                  onDiscardAssembly={(a) => setDiscardConfirmAssembly(a)}
                  isClosing={isClosing}
                  isUpdating={actionId === assembly.id}
                />
              ))
            )}
          </div>
        )}
      </div>

      {ReactDOM.createPortal(
        <FadePopUp
          isOpen={isMounted && manageAssembly}
          onClose={() => setManageAssembly(null)}
          closeOnOverlayClick={!isCreatingPoll}
          overlayClassName="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs"
          className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-xl max-h-[90vh] overflow-hidden border border-gray-150 dark:border-slate-700"
        >
          <ManagePollsModal
            assembly={manageAssembly}
            polls={managePolls}
            isLoading={manageLoading}
            onClose={() => setManageAssembly(null)}
            onClosePoll={handleClosePoll}
          />
        </FadePopUp>,
        document.body,
      )}

      {ReactDOM.createPortal(
        <FadePopUp
          isOpen={isMounted && isPollModalOpen && pollAssembly}
          onClose={() => {
            setIsPollModalOpen(false);
            setPollAssembly(null);
          }}
          closeOnOverlayClick={!isCreatingPoll}
          overlayClassName="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs"
          className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-xl max-h-[90vh] overflow-hidden border border-gray-150 dark:border-slate-700"
        >
          <CreatePollModal
            assembly={pollAssembly}
            defaultTitle={`Poll - ${pollAssembly?.title || "Assembly"}`}
            onClose={() => {
              if (isCreatingPoll) return;
              setIsPollModalOpen(false);
              setPollAssembly(null);
            }}
            onSubmit={handleCreatePoll}
            isSubmitting={isCreatingPoll}
          />
        </FadePopUp>,
        document.body,
      )}

      {niederschriftModalOpen && (
        <NiederschriftModal
          onClose={() => setNiederschriftModalOpen(false)}
          assembly={closingAssembly}
          coopData={coopData}
          results={closingAssemblyVotes}
          setPdfGenerated={setPdfGenerated}
          afterAction={() => {
            closeAssembly(closingAssembly.id);
          }}
        />
      )}

      {isMounted &&
        discardConfirmAssembly &&
        ReactDOM.createPortal(
          <DiscardConfirmModal
            assembly={discardConfirmAssembly}
            onClose={() => setDiscardConfirmAssembly(null)}
            onConfirm={() => {
              onDiscardAssembly?.(discardConfirmAssembly);
            }}
          />,
          document.body,
        )}

      {assemblies.length === 0 && (
        <div className="flex items-center justify-center gap-3 p-6 mt-5 text-xs font-bold tracking-wide text-gray-500 uppercase bg-white border shadow-xs border-gray-150 rounded-2xl dark:bg-slate-800 dark:border-slate-700 dark:text-gray-400">
          <Users size={16} className="font-semibold text-gray-400" />
          <span>Create an assembly draft to populate this history view</span>
          <CalendarDays size={16} className="ml-auto text-gray-400 shrink-0" />
        </div>
      )}
    </div>
  );
}

const ManagePollsModal = ({
  assembly,
  polls,
  isLoading,
  onClose,
  onClosePoll,
}) => {
  const [isOpen, setIsOpen] = useState(true);

  const handleClose = () => {
    setIsOpen(false);
    setTimeout(onClose, 300);
  };

  return (
    // <TiltPopUp
    //   isOpen={isOpen}
    //   onClose={handleClose}
    //   overlayClassName="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs"
    //   className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden border border-gray-150 dark:border-slate-700"
    // >
    <>
      <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-slate-700">
        <div>
          <h3 className="text-lg font-extrabold tracking-wide text-gray-900 dark:text-white">
            Manage Polls
          </h3>
          <p className="text-xs text-gray-400 dark:text-gray-500 font-semibold mt-0.5">
            {assembly?.title || "Assembly"}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-1.5 text-gray-400 hover:text-gray-650 dark:hover:text-white transition-colors rounded-full hover:bg-gray-100 dark:hover:bg-slate-700"
        >
          <CircleX size={18} />
        </button>
      </div>

      <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="w-6 h-6 text-blue-500 animate-spin" />
          </div>
        )}
        {!isLoading && polls?.length === 0 && (
          <p className="py-12 text-sm font-medium text-center text-gray-500 dark:text-gray-400">
            No polls available for this assembly.
          </p>
        )}
        {!isLoading &&
          polls.map((poll) => (
            <div
              key={poll?.$id}
              className="p-4 space-y-3 border shadow-xs border-gray-150 dark:border-slate-750 bg-gray-50/20 dark:bg-slate-900/10 rounded-xl"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h4 className="text-sm font-bold text-gray-900 dark:text-white">
                    {poll?.title}
                  </h4>
                  {poll?.description && (
                    <p className="mt-1 text-xs font-semibold leading-normal text-gray-500 dark:text-gray-400">
                      {poll?.description}
                    </p>
                  )}
                  <div className="mt-2.5 flex items-center gap-1.5 font-bold">
                    <span className="text-[10px] text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                      Status:
                    </span>
                    <span
                      className={`px-2 py-0.5 text-[9px] uppercase tracking-wider rounded-md ${
                        poll?.status === "closed"
                          ? "text-rose-700 bg-rose-50 dark:bg-rose-950/20 dark:text-rose-400"
                          : "text-emerald-700 bg-emerald-50 dark:bg-emerald-950/20 dark:text-emerald-450 animate-pulse"
                      }`}
                    >
                      {poll?.status || "live"}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onClosePoll(poll?.$id, poll?.coopId)}
                  disabled={poll?.status === "closed"}
                  className={`px-3.5 py-2 text-xs font-bold rounded-xl transition-all shrink-0 ${
                    poll?.status === "closed"
                      ? "text-gray-450 bg-gray-100/50 cursor-not-allowed dark:bg-slate-850 dark:text-slate-505 border border-transparent"
                      : "text-rose-700 border border-rose-200 hover:bg-rose-600 hover:text-white bg-rose-50/50 dark:bg-rose-900/10 dark:text-rose-405 dark:border-rose-900/50 dark:hover:bg-rose-600 transition-all"
                  }`}
                >
                  {poll?.status === "closed" ? "Closed" : "Close Poll"}
                </button>
              </div>
              <div className="flex items-center gap-4 pt-2 border-t border-gray-105 dark:border-slate-800 text-[10px] font-bold text-gray-500 uppercase tracking-wide">
                <span className="flex items-center gap-1">
                  <CircleCheck className="w-3.5 h-3.5 text-emerald-500" /> Yes:{" "}
                  {poll?.yesCount || 0}
                </span>
                <span className="flex items-center gap-1">
                  <CircleX className="w-3.5 h-3.5 text-rose-500" /> No:{" "}
                  {poll?.noCount || 0}
                </span>
                <span className="flex items-center gap-1">
                  <CircleAlert className="w-3.5 h-3.5 text-slate-400" />{" "}
                  Abstain: {poll?.abstainCount || 0}
                </span>
              </div>
            </div>
          ))}
      </div>
    </>
    // </TiltPopUp>
  );
};

const CreatePollModal = ({
  assembly,
  defaultTitle,
  onClose,
  onSubmit,
  isSubmitting,
}) => {
  const [isOpen, setIsOpen] = useState(true);
  const [title, setTitle] = useState(defaultTitle || "");
  const [description, setDescription] = useState("");
  const [options, setOptions] = useState([
    { name: "JA (Yes)", votes: 0 },
    { name: "NEIN (No)", votes: 0 },
    { name: "ENTHALTUNG (Abstain)", votes: 0 },
  ]);
  const [endTime, setEndTime] = useState("");
  const [isCritical, setIsCritical] = useState(false);
  const [errors, setErrors] = useState({});

  const getCurrentDateTime = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const validate = () => {
    const nextErrors = {};
    if (!title.trim()) nextErrors.title = "Title is required";
    if (!endTime) nextErrors.endTime = "End time is required";
    if (endTime) {
      const end = new Date(endTime);
      if (end <= new Date()) {
        nextErrors.endTime = "End time must be in the future";
      } else if (
        assembly?.endDateTime &&
        end > new Date(assembly.endDateTime)
      ) {
        nextErrors.endTime = `End time cannot be after the assembly's end date/time (${formatDate(assembly.endDateTime)})`;
      }
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (isSubmitting) return;
    if (validate()) {
      onSubmit({ title, description, options, endTime, isCritical });
    }
  };

  const handleClose = () => {
    if (isSubmitting) return;
    setIsOpen(false);
    // setTimeout(onClose, 300);
  };

  return (
    // <TiltPopUp
    //   isOpen={isOpen}
    //   onClose={handleClose}
    //   closeOnOverlayClick={!isSubmitting}
    //   overlayClassName="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs"
    //   className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-xl max-h-[90vh] overflow-hidden border border-gray-150 dark:border-slate-700"
    // >
    <div className="relative">
      <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-slate-700">
        <h3 className="text-lg font-extrabold tracking-wide text-gray-900 dark:text-white">
          Create New Poll
        </h3>
        <button
          type="button"
          onClick={onClose}
          disabled={isSubmitting}
          className="p-1.5 text-gray-400 hover:text-gray-650 dark:hover:text-white transition-colors rounded-full hover:bg-gray-100 dark:hover:bg-slate-700 disabled:opacity-60"
        >
          <CircleX size={18} />
        </button>
      </div>

      <form
        onSubmit={handleSubmit}
        className="p-6 space-y-5 overflow-y-auto max-h-[70vh]"
      >
        <div>
          <Label required>Title</Label>
          <input
            className={modalInputClass}
            value={title}
            disabled={isSubmitting}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Enter poll title"
          />
          <FieldError>{errors.title}</FieldError>
        </div>

        <div>
          <Label>Description</Label>
          <textarea
            className={modalInputClass}
            rows={3}
            value={description}
            disabled={isSubmitting}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Provide a brief background or context for this vote..."
          />
        </div>

        <div>
          <Label>Voting Options</Label>
          <div className="space-y-2.5">
            {options.map((opt, index) => (
              <div
                key={index}
                className="flex items-center gap-3 px-4 py-2.5 border border-gray-150 dark:border-slate-750 bg-gray-50/50 dark:bg-slate-900/20 rounded-xl"
              >
                <Radio className="w-4 h-4 text-blue-500 shrink-0" />
                <span className="text-xs font-bold text-gray-700 dark:text-gray-305">
                  {opt.name}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div>
          <Label required>Voting End Time</Label>
          <input
            type="datetime-local"
            className={modalInputClass}
            value={endTime}
            disabled={isSubmitting}
            min={getCurrentDateTime()}
            max={assembly?.endDateTime || undefined}
            onChange={(event) => setEndTime(event.target.value)}
          />
          <FieldError>{errors.endTime}</FieldError>
        </div>

        <div className="flex items-center gap-2.5 p-3.5 bg-amber-50/20 border border-amber-200/20 dark:bg-amber-950/10 dark:border-amber-900/30 rounded-xl">
          <input
            id="criticalPoll"
            type="checkbox"
            className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
            checked={isCritical}
            disabled={isSubmitting}
            onChange={(event) => setIsCritical(event.target.checked)}
          />
          <label
            htmlFor="criticalPoll"
            className="text-xs font-bold cursor-pointer select-none text-amber-800 dark:text-amber-300"
          >
            Mark as critical resolution (requires strict quorum)
          </label>
        </div>

        <div className="flex justify-end gap-3 pt-3 border-t border-gray-100 dark:border-slate-700">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2.5 text-xs font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 dark:bg-slate-700 dark:text-gray-200 dark:hover:bg-slate-600 rounded-xl disabled:opacity-60 transition-all"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-5 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 rounded-xl shadow-md shadow-blue-500/10 disabled:opacity-60 transition-all"
          >
            {isSubmitting ? "Creating..." : "Create Poll"}
          </button>
        </div>
      </form>
      {/* </TiltPopUp> */}
    </div>
  );
};

const DiscardConfirmModal = ({ assembly, onClose, onConfirm }) => {
  const [isOpen, setIsOpen] = useState(true);

  const handleClose = () => {
    setIsOpen(false);
    setTimeout(onClose, 300);
  };

  const handleConfirm = () => {
    onConfirm();
    handleClose();
  };

  return (
    <TiltPopUp
      isOpen={isOpen}
      onClose={handleClose}
      overlayClassName="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs"
      className="w-full max-w-md overflow-hidden bg-white border shadow-xl dark:bg-slate-800 rounded-2xl border-gray-150 dark:border-slate-700"
    >
      <div className="p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-rose-50 dark:bg-rose-950/30 text-rose-600">
            <Trash2 size={20} />
          </div>
          <h3 className="text-base font-extrabold text-gray-900 dark:text-white">
            Discard Draft Assembly
          </h3>
        </div>
        <p className="text-xs font-medium leading-relaxed text-gray-550 dark:text-gray-400">
          Are you sure you want to discard the draft assembly{" "}
          <strong>"{assembly.title || "Untitled"}"</strong>? This status will be
          marked as discarded and it will be hidden from your history dashboard.
          This action cannot be undone.
        </p>
        <div className="flex justify-end gap-3 pt-3 border-t border-gray-100 dark:border-slate-700">
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-2.5 text-xs font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 dark:bg-slate-700 dark:text-gray-200 dark:hover:bg-slate-600 rounded-xl transition-all"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="px-5 py-2.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-md shadow-rose-500/10 transition-all"
          >
            Discard
          </button>
        </div>
      </div>
    </TiltPopUp>
  );
};
