"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  Award,
  CalendarDays,
  CheckCircle,
  ClipboardList,
  Clock,
  MapPin,
  Radio,
  ThumbsUp,
  TrendingUp,
  Users,
  Vote,
  Video,
  X,
  RefreshCw,
  FilePenLine,
  RotateCw,
  CircleCheck,
  CircleAlert,
  ChevronDown,
} from "lucide-react";
import {
  getMemberAssemblies,
  markAssemblyAttendance,
} from "@/lib/assemblyService";
import { castVote, getMemberPollsByCoopId } from "@/lib/votingService";
import { useAuth } from "@/hooks/useAuth";
import ProxyModal from "./ProxyModal";
import { getProxyById } from "@/lib/proxyService";
import { getAllMembers } from "@/lib/helpers/memberHelper";
import TiltPopUp from "@/components/pop-ups/TiltPopUp";
import FadePopUp from "../FadePopUp";

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

const statusGroups = {
  live: {
    title: "Live Assemblies",
    description: "Assemblies currently active or in progress.",
    icon: Radio,
    color: "bg-emerald-500 text-white shadow-emerald-500/20",
  },
  upcoming: {
    title: "Upcoming Assemblies",
    description: "Scheduled future general assemblies.",
    icon: Clock,
    color: "bg-blue-500 text-white shadow-blue-500/20",
  },
  closed: {
    title: "Closed Assemblies",
    description: "Finished assemblies kept for history.",
    icon: CheckCircle,
    color: "bg-rose-500 text-white shadow-rose-500/20",
  },
};

const AssemblyCard = ({
  assembly,
  members,
  user,
  assemblyPolls,
  onAttend,
  onOpenProxy,
  onOpenVoting,
  onShowResults,
  isExpanded,
  onToggleDetails,
  isClosedExpanded,
  onToggleClosed,
  isSubmitting,
}) => {
  const isWithinCutoff =
    assembly.startDateTime >= new Date(Date.now() - 5 * 60 * 60 * 1000);
  const isTimeEnded =
    assembly.endDateTime && new Date(assembly.endDateTime) <= new Date();
  const isAttending =
    assembly.attendanceStatus === "present" ||
    assembly.attendanceStatus === "proxy";
  const isUpcoming = assembly.status === "upcoming";
  const isLive = assembly.status === "live";
  const isClosed =
    assembly.status === "closed" || isWithinCutoff || isTimeEnded;
  const statusLabel = isUpcoming ? "Upcoming" : isClosed ? "Closed" : "Live";

  const statusTone = isClosed
    ? "text-gray-700 bg-gray-100 border border-gray-200 dark:bg-slate-700 dark:text-gray-300 dark:border-slate-600"
    : isUpcoming
      ? "text-blue-700 bg-blue-50 border border-blue-200 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-900/50"
      : "text-emerald-700 bg-emerald-50 border border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/50";

  const closedPolls = useMemo(() => {
    if (!Array.isArray(assemblyPolls)) return [];
    return assemblyPolls.filter((poll) => {
      if (poll.status) return poll.status === "closed";
      if (!poll.endTime) return false;
      return new Date(poll.endTime) <= new Date();
    });
  }, [assemblyPolls]);

  const getResponseButtonConfig = () => {
    if (isAttending) return { icon: CheckCircle, text: "Responded" };
    if (isSubmitting) return { icon: RefreshCw, text: "Saving...", spin: true };
    if (isUpcoming) return { icon: FilePenLine, text: "I am attending" };
    return { icon: AlertCircle, text: "Not Responded" };
  };

  const { icon: Icon, text, spin } = getResponseButtonConfig();

  return (
    <article className="p-5 transition-all duration-300 bg-white border shadow-xs border-gray-150 hover:border-gray-300 dark:bg-slate-800 dark:border-slate-700 hover:dark:border-slate-600 rounded-2xl hover:shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex items-center px-2.5 py-0.5 text-[10px] font-bold rounded-full uppercase tracking-wider ${statusTone}`}
            >
              {statusLabel.toLowerCase() === "live" ? (
                <span className="relative flex h-2 w-2 mr-1.5 shrink-0">
                  <span className="absolute inline-flex w-full h-full rounded-full opacity-75 animate-ping bg-emerald-400"></span>
                  <span className="relative inline-flex w-2 h-2 rounded-full bg-emerald-500"></span>
                </span>
              ) : (
                <Radio className="mr-1 text-current shrink-0" size={12} />
              )}
              {statusLabel}
            </span>
            <span className="px-2 py-0.5 text-[10px] font-bold text-blue-650 bg-blue-50/50 border border-blue-150/40 rounded-md dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800/30 uppercase">
              {formatLabels[assembly.format] || "Assembly"}
            </span>
          </div>
          <h3 className="text-sm font-extrabold tracking-wide text-gray-900 dark:text-white">
            {assembly.title}
          </h3>
          <div className="flex flex-wrap gap-4 mt-3 text-xs font-semibold text-gray-450 dark:text-gray-400">
            <span className="inline-flex items-center gap-1.5">
              <CalendarDays size={14} className="text-gray-400" />
              {formatDate(assembly.startDateTime)}
            </span>
            {assembly.endDateTime && <span className="text-gray-300">•</span>}
            {assembly.endDateTime && (
              <span className="inline-flex items-center gap-1.5">
                <CalendarDays size={14} className="text-gray-400" />
                {formatDate(assembly.endDateTime)}
              </span>
            )}
            {assembly.location && (
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(assembly.location)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-blue-600 hover:underline dark:text-blue-400 font-bold"
              >
                <MapPin size={14} />
                {assembly.location.split(",")[0]}
              </a>
            )}
            {assembly.platformUrl && (
              <a
                href={assembly.platformUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-blue-600 hover:underline dark:text-blue-400 font-bold"
              >
                <Video size={14} />
                {assembly.platformUrl.split("/")[
                  assembly.platformUrl.split("/").length - 1
                ] || "Online Platform"}
              </a>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 lg:self-center shrink-0">
          <button
            type="button"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-blue-650 bg-blue-50/50 hover:bg-blue-50 hover:underline dark:bg-slate-700 dark:text-blue-400 rounded-lg transition-colors border border-transparent hover:border-blue-150"
            onClick={() => onToggleDetails?.(assembly.id)}
          >
            <ChevronDown
              className={`w-3.5 h-3.5 transition-transform duration-200 ${
                isExpanded ? "rotate-180" : "rotate-0"
              }`}
            />
            {isExpanded ? "Collapse" : "Expand"}
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="pt-4 mt-5 space-y-4 border-t border-gray-100 dark:border-slate-700/50">
          <div className="flex flex-wrap gap-2">
            {assembly.hasProxy ? (
              <button
                type="button"
                onClick={() => onOpenProxy?.(assembly)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-purple-700 border border-purple-200 rounded-xl bg-purple-50/50 dark:bg-purple-900/10 dark:text-purple-400 dark:border-purple-800/50 transition-all hover:text-purple-700 dark:hover:text-purple-400 hover:bg-purple-100 dark:hover:bg-purple-900 shadow-xs"
              >
                <Users size={14} />
                Proxy Assigned
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => onAttend(assembly.id)}
                  disabled={!isUpcoming || isAttending || isSubmitting}
                  className={`inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl transition-all ${
                    isAttending
                      ? "text-emerald-700 border border-emerald-200 bg-emerald-50/50 dark:bg-emerald-950/10 dark:text-emerald-300 dark:border-emerald-900/30 cursor-default"
                      : isUpcoming
                        ? "text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md shadow-blue-500/10"
                        : "text-gray-400 bg-gray-100 border border-gray-200 cursor-not-allowed dark:bg-slate-750 dark:text-slate-500 dark:border-slate-800"
                  }`}
                >
                  <Icon size={14} className={spin ? "animate-spin" : ""} />
                  {text}
                </button>

                {isUpcoming && (
                  <button
                    type="button"
                    disabled={isAttending}
                    onClick={() => onOpenProxy?.(assembly)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-purple-700 border border-purple-200 rounded-xl bg-purple-50/50 dark:bg-purple-900/10 dark:text-purple-400 dark:border-purple-800/50 hover:bg-purple-650 hover:text-purple-900 dark:hover:bg-purple-600 hover:border-purple-400 hover:bg-purple-200/60 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    <Users size={14} />
                    Assign Proxy
                  </button>
                )}
              </>
            )}

            {(isLive || isClosed) && isAttending && (
              <button
                type="button"
                onClick={() => onOpenVoting(assembly)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md shadow-blue-500/10 transition-all"
              >
                <Vote size={14} />
                {isClosed ? "View Results" : "Open Polls"}
              </button>
            )}
          </div>
        </div>
      )}

      {isExpanded && assembly.agendaItems?.length > 0 && (
        <div className="pt-4 mt-4 border-t border-gray-100 dark:border-slate-700/50">
          <div className="flex items-center gap-2 mb-3 text-xs font-bold tracking-wider text-gray-500 uppercase dark:text-gray-400">
            <ClipboardList size={14} className="text-blue-500" />
            Agenda
          </div>
          <ol className="space-y-2.5">
            {assembly.agendaItems.map((item, index) => (
              <li
                key={`${item.title}-${index}`}
                className="p-3 border bg-gray-50/30 dark:bg-slate-900/5 border-gray-150/40 dark:border-slate-800 rounded-xl"
              >
                <span className="text-xs font-extrabold text-gray-900 dark:text-white">
                  {index + 1}. {item.title}
                </span>
                {item.description && (
                  <span className="block mt-1 text-[11px] font-semibold text-gray-450 dark:text-gray-450 leading-relaxed">
                    {item.description}
                  </span>
                )}
              </li>
            ))}
          </ol>
        </div>
      )}

      {isExpanded && (isLive || isClosed) && (
        <div className="flex items-center gap-2 pt-4 mt-4 text-xs font-bold tracking-wider text-gray-400 uppercase border-t border-gray-100 dark:border-slate-700/50 dark:text-gray-500">
          <Users size={14} className="text-gray-400" />
          {assembly.attendanceSummary?.representedMembers || 0} members
          currently represented
        </div>
      )}

      {isExpanded && isClosed && (
        <div className="pt-4 mt-4 border-t border-gray-100 dark:border-slate-700/50 space-y-3.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold tracking-wider text-gray-500 uppercase dark:text-gray-400">
              <TrendingUp size={14} className="text-blue-500" />
              Voting Results
            </div>
            <button
              type="button"
              onClick={() => onToggleClosed?.(assembly.id)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-blue-600 bg-blue-50/50 hover:bg-blue-50 hover:underline dark:bg-slate-700 dark:text-blue-400 rounded-lg transition-colors border border-transparent hover:border-blue-150"
            >
              <ChevronDown
                className={`w-3.5 h-3.5 transition-transform duration-200 ${
                  isClosedExpanded ? "rotate-180" : "rotate-0"
                }`}
              />
              {isClosedExpanded ? "Collapse Results" : "View Results"}
            </button>
          </div>
          {closedPolls.length === 0 ? (
            <p className="py-2 text-xs font-medium text-gray-450 dark:text-gray-500">
              No results available yet.
            </p>
          ) : isClosedExpanded ? (
            <div className="space-y-3">
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
                      <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-1 leading-snug">
                        {poll.description}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-[10px] font-bold text-gray-555 uppercase tracking-wide">
                    <span>Yes: {poll.yesCount || 0}</span>
                    <span>No: {poll.noCount || 0}</span>
                    <span>Abstain: {poll.abstainCount || 0}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => onShowResults?.(poll)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-blue-600 border border-blue-200 hover:bg-blue-600 hover:text-white rounded-xl bg-blue-50/50 dark:bg-blue-900/10 dark:text-blue-400 dark:border-blue-800/50 dark:hover:bg-blue-600 transition-all shrink-0"
                  >
                    View Results
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="py-2 text-xs font-medium text-gray-450 dark:text-gray-500">
              Expand to view detailed results.
            </p>
          )}
        </div>
      )}
    </article>
  );
};

export default function AssemblyView({ coops = [] }) {
  const [coopId, setCoopId] = useState(null);
  const [assemblies, setAssemblies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submittingId, setSubmittingId] = useState("");
  const [error, setError] = useState("");
  const [expandedClosedCards, setExpandedClosedCards] = useState({});
  const [expandedCards, setExpandedCards] = useState({});
  const { user } = useAuth();
  const [pollsModalAssembly, setPollsModalAssembly] = useState(null);
  const [pollsLoading, setPollsLoading] = useState(false);
  const [pollsError, setPollsError] = useState("");
  const [activePolls, setActivePolls] = useState([]);
  const [castedPolls, setCastedPolls] = useState([]);
  const [pollsByAssembly, setPollsByAssembly] = useState({});
  const [selectedPoll, setSelectedPoll] = useState(null);
  const [selectedOption, setSelectedOption] = useState(null);
  const [voting, setVoting] = useState(false);
  const [resultsModal, setResultsModal] = useState(null);
  const [proxyModalOpen, setProxyModalOpen] = useState(false);
  const [selectedAssembly, setSelectedAssembly] = useState(null);
  const [activeTab, setActiveTab] = useState("all");
  const [refresh, setRefresh] = useState(false);
  const [members, setMembers] = useState([]);
  const [existingProxy, setExistingProxy] = useState(null);

  useEffect(() => {
    if (!coops || coops.length === 0) return;
    setCoopId(coops[0]?.coopId);
  }, [coops]);

  const fetchAssemblies = useCallback(async () => {
    if (!coopId) {
      setAssemblies([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");
    try {
      const memberAssemblies = await getMemberAssemblies(coopId);
      setAssemblies(memberAssemblies);
    } catch (err) {
      setError(err.message || "Failed to load assemblies.");
    } finally {
      setLoading(false);
    }
  }, [coopId]);

  const fetchMembers = useCallback(async () => {
    if (!coopId) {
      setMembers([]);
    }

    setLoading(true);
    setError("");
    try {
      const memberRes = await getAllMembers(coopId);
      setMembers(memberRes);
    } catch (error) {
      setError(error.message || "Failed to load members of coop");
    } finally {
      setLoading(false);
    }
  }, [coopId]);

  useEffect(() => {
    fetchAssemblies();
  }, [fetchAssemblies, refresh]);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers, refresh]);

  useEffect(() => {
    const loadAssemblyPolls = async () => {
      if (!coopId || !user?.userId || assemblies.length === 0) return;
      try {
        const currentTime = new Date().toISOString();
        const { activePolls: active, castedPolls: casted } =
          await getMemberPollsByCoopId(coopId, user.userId, currentTime);
        const allPolls = [...active, ...casted];
        const grouped = allPolls.reduce((acc, poll) => {
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
  }, [assemblies, coopId, user?.userId]);

  const fetchPollsForAssembly = useCallback(
    async (assembly) => {
      if (!coopId || !user?.userId || !assembly?.id) return;
      setPollsLoading(true);
      setPollsError("");
      try {
        const currentTime = new Date().toISOString();
        const { activePolls: active, castedPolls: casted } =
          await getMemberPollsByCoopId(coopId, user.userId, currentTime);
        setActivePolls(
          active.filter((poll) => poll.assemblyId === assembly.id),
        );
        setCastedPolls(
          casted.filter((poll) => poll.assemblyId === assembly.id),
        );
      } catch (err) {
        setPollsError(err.message || "Failed to load polls.");
      } finally {
        setPollsLoading(false);
      }
    },
    [coopId, user?.userId],
  );

  const handleAttend = async (assemblyId) => {
    setSubmittingId(assemblyId);
    setError("");
    try {
      const result = await markAssemblyAttendance(assemblyId);
      setAssemblies((prev) =>
        prev.map((assembly) =>
          assembly.id === assemblyId
            ? {
                ...assembly,
                attendanceStatus: "present",
                attendanceSummary: result.attendanceSummary,
              }
            : assembly,
        ),
      );
    } catch (err) {
      setError(err.message || "Failed to mark attendance.");
    } finally {
      setSubmittingId("");
    }
  };

  const handleOpenVoting = async (assembly) => {
    setPollsModalAssembly(assembly);
    setSelectedPoll(null);
    setSelectedOption(null);
    setResultsModal(null);
    await fetchPollsForAssembly(assembly);
  };

  const handleOpenProxy = async (assembly) => {
    setExistingProxy(null);
    setSelectedAssembly(assembly);
    if (assembly.hasProxy && assembly.proxyTableId) {
      try {
        const proxy = await getProxyById(assembly.proxyTableId);
        setExistingProxy(proxy);
      } catch (error) {
        console.error(error);
      }
    }
    setProxyModalOpen(true);
  };

  const handleVote = async () => {
    if (!selectedPoll || selectedOption === null || !user?.userId) return;
    setVoting(true);
    try {
      await castVote(selectedPoll.$id, user.userId, selectedOption);
      setActivePolls((prev) => prev.filter((p) => p.$id !== selectedPoll.$id));
      setCastedPolls((prev) => [selectedPoll, ...prev]);
      setSelectedPoll(null);
      setSelectedOption(null);
    } catch (err) {
      setPollsError(err.message || "Failed to cast vote.");
    } finally {
      setVoting(false);
    }
  };

  const isPollEnded = useCallback((poll) => {
    if (poll?.status) return poll.status === "closed";
    return new Date(poll.endTime) <= new Date();
  }, []);

  const pollsSummary = useMemo(
    () => ({
      activeCount: activePolls.length,
      castedCount: castedPolls.length,
    }),
    [activePolls.length, castedPolls.length],
  );

  return (
    <div className="p-4 space-y-6 sm:p-6 animate-fadeIn">
      {/* Header Panel */}
      <div className="flex flex-col gap-4 p-6 bg-white border border-gray-100 shadow-sm md:flex-row md:items-center md:justify-between dark:bg-slate-800 dark:border-slate-700 rounded-2xl">
        <div>
          <h2 className="flex items-center gap-2 text-xl font-extrabold tracking-wide text-gray-900 dark:text-white">
            Assemblies
            <button
              onClick={() => setRefresh(!refresh)}
              className="text-gray-400 transition-colors hover:text-gray-650 dark:hover:text-white"
            >
              <RotateCw
                className={`w-4 h-4 ${loading ? "animate-spin" : ""}`}
              />
            </button>
          </h2>
          <p className="mt-1 text-xs font-semibold text-gray-505 dark:text-gray-400">
            Review upcoming, live, and closed general assemblies.
          </p>
        </div>
      </div>

      {error && (
        <div className="p-4 text-xs font-semibold border border-red-200 text-red-750 rounded-xl bg-red-50 dark:border-red-800 dark:bg-red-900/20 dark:text-red-200">
          {error}
        </div>
      )}

      {!loading ? (
        <>
          {assemblies.length === 0 ? (
            <div className="p-12 text-center border shadow-xs select-none bg-white/70 border-gray-150 rounded-2xl dark:bg-slate-800 dark:border-slate-700/80 backdrop-blur-xs">
              <Radio
                size={44}
                className="mx-auto mb-4 text-gray-400 dark:text-gray-600 animate-pulse"
              />
              <h3 className="mb-2 text-sm font-extrabold tracking-wide text-gray-700 uppercase dark:text-gray-300">
                No assemblies available
              </h3>
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-450">
                Assemblies will appear here once scheduled by the
                administration.
              </p>
            </div>
          ) : (
            <>
              {/* Premium Tabs Filter Bar */}
              <div className="inline-flex flex-wrap gap-1 p-1 border bg-gray-100/80 dark:bg-slate-800/80 border-gray-200/50 dark:border-slate-700/50 rounded-xl">
                {[
                  { key: "all", label: "All" },
                  { key: "live", label: "Live" },
                  { key: "upcoming", label: "Upcoming" },
                  { key: "closed", label: "Closed" },
                ].map((tab) => {
                  const count =
                    tab.key === "all"
                      ? assemblies.length
                      : assemblies.filter(
                          (assembly) => assembly.status === tab.key,
                        ).length;

                  const isActive = activeTab === tab.key;

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
                            ? "bg-blue-50 text-blue-600 dark:bg-slate-800 dark:text-blue-450"
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
                {activeTab === "all" ? (
                  ["live", "upcoming", "closed"].map((status) => {
                    const statusItems = assemblies.filter(
                      (assembly) => assembly.status === status,
                    );
                    if (statusItems.length === 0) return null;

                    const group = statusGroups[status];
                    const Icon = group.icon;

                    return (
                      <section
                        key={status}
                        className="pb-4 space-y-4 overflow-hidden border shadow-xs bg-white/70 border-gray-150/60 rounded-2xl dark:bg-slate-800/70 dark:border-slate-700/80 backdrop-blur-xs animate-fadeIn"
                      >
                        <div className="flex items-start gap-4 p-5 border-b border-gray-100 bg-gray-50/50 dark:bg-slate-800/50 dark:border-slate-700 shrink-0">
                          <div
                            className={`flex items-center justify-center rounded-xl w-10 h-10 shadow-xs shrink-0 ${group.color}`}
                          >
                            <Icon size={18} />
                          </div>
                          <div>
                            <h3 className="text-sm font-extrabold tracking-wide text-gray-900 dark:text-white">
                              {group.title}
                            </h3>
                            <p className="mt-0.5 text-xs text-gray-400 dark:text-gray-505 font-medium font-semibold">
                              {group.description}
                            </p>
                          </div>
                        </div>

                        <div className="px-5 space-y-4">
                          {statusItems.map((assembly) => (
                            <AssemblyCard
                              key={assembly.id}
                              members={members}
                              assembly={assembly}
                              user={user}
                              onOpenProxy={handleOpenProxy}
                              assemblyPolls={pollsByAssembly[assembly.id] || []}
                              onAttend={handleAttend}
                              onOpenVoting={handleOpenVoting}
                              onShowResults={(poll) => setResultsModal(poll)}
                              isExpanded={Boolean(expandedCards[assembly.id])}
                              onToggleDetails={(assemblyId) =>
                                setExpandedCards((prev) => ({
                                  ...prev,
                                  [assemblyId]: !prev[assemblyId],
                                }))
                              }
                              isClosedExpanded={Boolean(
                                expandedClosedCards[assembly.id],
                              )}
                              onToggleClosed={(assemblyId) =>
                                setExpandedClosedCards((prev) => ({
                                  ...prev,
                                  [assemblyId]: !prev[assemblyId],
                                }))
                              }
                              isSubmitting={submittingId === assembly.id}
                            />
                          ))}
                        </div>
                      </section>
                    );
                  })
                ) : (
                  <div className="p-6 space-y-4 border shadow-xs bg-white/70 border-gray-150/60 rounded-2xl dark:bg-slate-800/70 dark:border-slate-700/80 backdrop-blur-xs">
                    {assemblies.filter(
                      (assembly) => assembly.status === activeTab,
                    ).length > 0 ? (
                      <div className="grid grid-cols-1 gap-4">
                        {assemblies
                          .filter((assembly) => assembly.status === activeTab)
                          .map((assembly) => (
                            <AssemblyCard
                              key={assembly.id}
                              assembly={assembly}
                              user={user}
                              members={members}
                              onOpenProxy={handleOpenProxy}
                              assemblyPolls={pollsByAssembly[assembly.id] || []}
                              onAttend={handleAttend}
                              onOpenVoting={handleOpenVoting}
                              onShowResults={(poll) => setResultsModal(poll)}
                              isExpanded={Boolean(expandedCards[assembly.id])}
                              onToggleDetails={(assemblyId) =>
                                setExpandedCards((prev) => ({
                                  ...prev,
                                  [assemblyId]: !prev[assemblyId],
                                }))
                              }
                              isClosedExpanded={Boolean(
                                expandedClosedCards[assembly.id],
                              )}
                              onToggleClosed={(assemblyId) =>
                                setExpandedClosedCards((prev) => ({
                                  ...prev,
                                  [assemblyId]: !prev[assemblyId],
                                }))
                              }
                              isSubmitting={submittingId === assembly.id}
                            />
                          ))}
                      </div>
                    ) : (
                      <EmptyGroup />
                    )}
                  </div>
                )}
              </div>
            </>
          )}
        </>
      ) : (
        <div className="flex items-center justify-center p-6 h-96">
          <div className="w-10 h-10 border-b-2 border-blue-600 rounded-full animate-spin"></div>
        </div>
      )}

      {/* {pollsModalAssembly && ( */}
      <FadePopUp
        isOpen={pollsModalAssembly}
        onClose={() => setPollsModalAssembly(null)}
        overlayClassName="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs"
        className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden border border-gray-150 dark:border-slate-700"
      >
        <AssemblyPollsModal
          assembly={pollsModalAssembly}
          isLoading={pollsLoading}
          error={pollsError}
          activePolls={activePolls}
          castedPolls={castedPolls}
          pollsSummary={pollsSummary}
          onClose={() => setPollsModalAssembly(null)}
          onSelectPoll={(poll) => {
            setSelectedPoll(poll);
            setSelectedOption(null);
          }}
          onShowResults={(poll) => setResultsModal(poll)}
          isPollEnded={isPollEnded}
        />
      </FadePopUp>
      {/* )} */}

      {selectedPoll && (
        <VoteModal
          poll={selectedPoll}
          selectedOption={selectedOption}
          setSelectedOption={setSelectedOption}
          onClose={() => {
            setSelectedPoll(null);
            setSelectedOption(null);
          }}
          onVote={handleVote}
          voting={voting}
        />
      )}

      {resultsModal && (
        <ResultsModal
          poll={resultsModal}
          onClose={() => setResultsModal(null)}
        />
      )}

      <ProxyModal
        open={proxyModalOpen}
        existingProxy={existingProxy}
        onClose={() => setProxyModalOpen(false)}
        members={members}
        user={user}
        assembly={selectedAssembly}
        polls={pollsByAssembly[selectedAssembly?.id] || []}
        onAssign={(data) => {
          setAssemblies((prev) =>
            prev.map((assembly) =>
              assembly.id === selectedAssembly.id
                ? {
                    ...assembly,
                    hasProxy: true,
                    proxyTableId: data.proxyTableId || assembly.proxyTableId,
                  }
                : assembly,
            ),
          );

          setExistingProxy(data);
        }}
      />
    </div>
  );
}

const AssemblyPollsModal = ({
  assembly,
  isLoading,
  error,
  activePolls,
  castedPolls,
  pollsSummary,
  onClose,
  onSelectPoll,
  onShowResults,
  isPollEnded,
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
    //   className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden border border-gray-150 dark:border-slate-700"
    // >
    <>
      <div className="flex items-start justify-between p-6 border-b border-gray-100 dark:border-slate-700">
        <div>
          <h3 className="text-lg font-extrabold tracking-wide text-gray-900 dark:text-white">
            Assembly Polls
          </h3>
          <p className="text-xs text-gray-400 dark:text-gray-500 font-semibold mt-0.5">
            {assembly?.title || ""}
          </p>
          <div className="flex gap-3 mt-3 text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
            <span>Active: {pollsSummary?.activeCount || 0}</span>
            <span>Voted: {pollsSummary?.castedCount || 0}</span>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 text-gray-400 hover:text-gray-650 dark:hover:text-white transition-colors rounded-full hover:bg-gray-100 dark:hover:bg-slate-700"
        >
          <X size={18} />
        </button>
      </div>

      <div className="p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-120px)]">
        {error && (
          <div className="p-4 text-xs font-semibold text-red-700 border border-red-200 rounded-xl bg-red-50 dark:border-red-800 dark:bg-red-900/20 dark:text-red-200">
            {error}
          </div>
        )}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="w-6 h-6 text-blue-500 animate-spin" />
          </div>
        )}
        {!isLoading && activePolls?.length > 0 && (
          <section className="space-y-4">
            <h4 className="text-xs font-bold tracking-wider text-gray-400 uppercase dark:text-gray-500">
              Active Polls
            </h4>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {activePolls?.map((poll) => (
                <PollCard
                  key={poll?.$id}
                  poll={poll}
                  assembly={assembly}
                  status="active"
                  onClick={() => onSelectPoll(poll)}
                />
              ))}
            </div>
          </section>
        )}

        {!isLoading && castedPolls.length > 0 && (
          <section className="space-y-4">
            <h4 className="text-xs font-bold tracking-wider text-gray-400 uppercase dark:text-gray-500">
              Your Votes
            </h4>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {castedPolls.map((poll) => (
                <PollCard
                  key={poll.$id}
                  poll={poll}
                  assembly={assembly}
                  status={isPollEnded(poll) ? "ended" : "voted"}
                  onShowResults={() =>
                    isPollEnded(poll) ? onShowResults(poll) : null
                  }
                />
              ))}
            </div>
          </section>
        )}

        {!isLoading && activePolls.length === 0 && castedPolls.length === 0 && (
          <div className="p-10 text-center border border-gray-200 border-dashed select-none bg-gray-50/50 dark:bg-slate-805 rounded-2xl dark:border-slate-700">
            <Vote
              size={40}
              className="mx-auto mb-3 text-gray-400 dark:text-gray-600 animate-pulse"
            />
            <h3 className="mb-2 text-sm font-extrabold tracking-wide text-gray-700 uppercase dark:text-gray-300">
              No polls available
            </h3>
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-450">
              There are no active or completed polls for this assembly yet.
            </p>
          </div>
        )}
      </div>
    </>
    // </TiltPopUp>
  );
};

const PollCard = ({ poll, status, onClick, onShowResults, assembly }) => {
  const getTimeLeft = (endTime) => {
    const now = new Date();
    const end = new Date(endTime);
    const diffMs = end - now;

    if (diffMs <= 0) return "Ended";

    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor(diffMs / (1000 * 60));

    if (diffDays > 0) {
      return `${diffDays} ${diffDays === 1 ? "day" : "days"} left`;
    } else if (diffHours > 0) {
      return `${diffHours} ${diffHours === 1 ? "hour" : "hours"} left`;
    } else {
      return `${diffMinutes} ${diffMinutes === 1 ? "minute" : "minutes"} left`;
    }
  };
  const yesCount = Number(poll.yesCount || 0);
  const noCount = Number(poll.noCount || 0);
  const abstainCount = Number(poll.abstainCount || 0);
  const totalVotes = yesCount + noCount + abstainCount;

  return (
    <div className="p-5 bg-white border border-gray-150 hover:border-gray-300 dark:bg-slate-800 dark:border-slate-700 hover:dark:border-slate-600 rounded-2xl shadow-xs hover:shadow-sm transition-all duration-300 flex flex-col justify-between min-h-[190px]">
      <div>
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex flex-wrap items-center gap-1.5">
            {status === "active" && (
              <span className="flex items-center px-2 py-0.5 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/50 rounded-full uppercase tracking-wider">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse mr-1.5 shrink-0"></span>
                Active
              </span>
            )}
            {status === "voted" && (
              <span className="flex items-center px-2 py-0.5 text-[10px] font-bold text-gray-650 bg-gray-50 border border-gray-200/50 dark:bg-slate-700 dark:text-gray-300 dark:border-slate-650 rounded-full uppercase tracking-wider">
                <CheckCircle size={12} className="mr-1 text-gray-500" />
                Voted
              </span>
            )}
            {status === "ended" && (
              <span className="flex items-center px-2 py-0.5 text-[10px] font-bold text-blue-750 bg-blue-50 border border-blue-200/50 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-900/50 rounded-full uppercase tracking-wider">
                <Award size={12} className="mr-1" />
                Ended
              </span>
            )}
            {poll.isCritical && (
              <span className="px-2 py-0.5 text-[10px] font-bold text-rose-700 bg-rose-50 border border-rose-200 dark:bg-rose-950/20 dark:text-rose-400 dark:border-rose-900/50 rounded-full uppercase tracking-wider">
                Critical
              </span>
            )}
          </div>
          <span className="flex items-center gap-1 text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider shrink-0">
            <Clock size={12} />
            <span>{getTimeLeft(poll.endTime)}</span>
          </span>
        </div>

        <h3 className="text-xs font-bold text-gray-800 dark:text-gray-205 line-clamp-2">
          {poll.title}
        </h3>
        {poll.description && (
          <p className="mt-1 text-[11px] font-semibold text-gray-450 dark:text-gray-450 line-clamp-2">
            {poll.description}
          </p>
        )}
      </div>

      <div className="mt-4 pt-3.5 border-t border-gray-100 dark:border-slate-700/50 space-y-3">
        <div className="flex items-center justify-between text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
          <div className="flex items-center gap-1">
            <Vote size={12} />
            <span>3 options</span>
          </div>
          <div className="flex items-center gap-1">
            <Users size={12} />
            <span>{totalVotes} voted</span>
          </div>
        </div>

        {status === "active" &&
          (assembly.hasProxy && assembly.scope === "FULL" ? (
            <div className="flex items-center justify-center w-full px-4 py-2 text-xs font-bold text-purple-700 border select-none border-purple-200/50 dark:bg-purple-950/10 dark:text-purple-300 dark:border-purple-900/30 rounded-xl bg-purple-50/50">
              <Vote size={14} className="mr-1.5 shrink-0" />
              <span>Proxy will vote on your behalf</span>
            </div>
          ) : (
            <button
              onClick={onClick}
              className="flex items-center justify-center w-full px-4 py-2 text-xs font-bold text-white transition-colors bg-blue-600 shadow-md hover:bg-blue-700 rounded-xl shadow-blue-500/10"
            >
              <Vote size={14} className="mr-1.5 shrink-0" />
              <span>Cast Your Vote</span>
            </button>
          ))}
        {status === "voted" && (
          <button
            disabled
            className="flex items-center justify-center w-full px-4 py-2 text-xs font-bold border border-transparent cursor-not-allowed text-gray-450 bg-gray-100/50 dark:bg-slate-850 dark:text-slate-500 rounded-xl"
          >
            <CheckCircle size={14} className="mr-1.5 shrink-0 text-gray-400" />
            <span>Vote Casted</span>
          </button>
        )}
        {status === "ended" && (
          <button
            onClick={onShowResults}
            className="flex items-center justify-center w-full px-4 py-2 text-xs font-bold text-blue-600 transition-all border border-blue-200 hover:bg-blue-600 hover:text-white rounded-xl bg-blue-50/50 dark:bg-blue-900/10 dark:text-blue-400 dark:border-blue-800/50"
          >
            <TrendingUp size={14} className="mr-1.5 shrink-0" />
            <span>Results Available</span>
          </button>
        )}
      </div>
    </div>
  );
};

const VoteModal = ({
  poll,
  selectedOption,
  setSelectedOption,
  onClose,
  onVote,
  voting,
}) => {
  const [isOpen, setIsOpen] = useState(true);
  const options = ["JA (Yes)", "NEIN (No)", "ENTHALTUNG (Abstain)"];

  const handleClose = () => {
    if (voting) return;
    setIsOpen(false);
    setTimeout(onClose, 300);
  };

  return (
    <TiltPopUp
      isOpen={isOpen}
      onClose={handleClose}
      closeOnOverlayClick={!voting}
      overlayClassName="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs"
      className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden border border-gray-150 dark:border-slate-700"
    >
      <div className="p-6 border-b border-gray-105 dark:border-slate-700">
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-lg font-extrabold tracking-wide text-gray-900 dark:text-white">
                {poll.title}
              </h3>
              {poll.isCritical && (
                <span className="px-2 py-0.5 text-[10px] font-bold text-rose-700 bg-rose-50 border border-rose-200 dark:bg-rose-950/20 dark:text-rose-400 dark:border-rose-900/50 rounded-full uppercase tracking-wider">
                  Critical Poll
                </span>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-650 dark:hover:text-white transition-colors rounded-full hover:bg-gray-100 dark:hover:bg-slate-700 shrink-0"
          >
            <X size={18} />
          </button>
        </div>
        {poll.description && (
          <p className="text-xs font-semibold leading-normal text-gray-450 dark:text-gray-400">
            {poll.description}
          </p>
        )}
        <div className="flex items-center pt-2 space-x-4 text-xs font-bold">
          <span className="flex items-center px-2.5 py-0.5 text-[10px] text-green-700 bg-green-50 border border-green-200/50 dark:bg-green-950/20 dark:text-green-300 dark:border-green-900/50 rounded-full uppercase tracking-wider">
            <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse mr-1.5 shrink-0"></span>
            Poll is Live
          </span>
        </div>
      </div>

      <div className="p-6 overflow-y-auto max-h-[calc(90vh-280px)] space-y-5">
        <p className="text-xs font-bold tracking-wider text-gray-400 uppercase dark:text-gray-500">
          Select your choice:
        </p>
        <div className="space-y-2.5">
          {options.map((option, index) => (
            <button
              key={index}
              onClick={() => setSelectedOption(index)}
              className={`w-full text-left p-2 rounded-xl border-2 transition-all duration-200 ${
                selectedOption === index
                  ? "border-blue-500 bg-blue-50/50 dark:bg-blue-950/20 dark:border-blue-500"
                  : "border-gray-200 dark:border-slate-700 bg-white/60 dark:bg-slate-800/40 hover:border-gray-300 dark:hover:border-slate-600"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-gray-700 dark:text-gray-200">
                  {option}
                </span>
                {selectedOption === index && (
                  <CheckCircle
                    size={18}
                    className="text-blue-500 shrink-0 animate-scaleIn"
                  />
                )}
              </div>
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-4 pt-5 mt-5 text-[11px] border-t border-gray-100 dark:border-slate-700/55 font-semibold text-gray-450">
          <div>
            <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">
              Created On
            </p>
            <p className="font-extrabold text-gray-800 dark:text-gray-200">
              {new Date(poll.$createdAt).toLocaleDateString()}
            </p>
            <p className="text-[10px] text-gray-400 dark:text-gray-550">
              {new Date(poll.$createdAt).toLocaleTimeString()}
            </p>
          </div>
          <div>
            <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">
              Ends On
            </p>
            <p className="font-extrabold text-gray-800 dark:text-gray-200">
              {new Date(poll.endTime).toLocaleDateString()}
            </p>
            <p className="text-[10px] text-gray-400 dark:text-gray-550">
              {new Date(poll.endTime).toLocaleTimeString()}
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between p-6 border-t bg-gray-50 dark:bg-slate-800/50 dark:border-slate-700/80">
        <div className="flex items-center gap-1.5 text-xs font-bold text-gray-400 dark:text-gray-500">
          <AlertCircle size={15} />
          <span>You can only vote once</span>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={onClose}
            disabled={voting}
            className="px-4.5 py-2.5 text-xs font-bold text-gray-750 bg-gray-100 hover:bg-gray-200 dark:bg-slate-705 dark:text-gray-200 dark:hover:bg-slate-600 rounded-xl disabled:opacity-50 transition-all"
          >
            Cancel
          </button>
          <button
            onClick={onVote}
            disabled={selectedOption === null || voting}
            className="flex items-center justify-center gap-1.5 px-5 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 rounded-xl shadow-md shadow-blue-500/10 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {voting ? (
              <>
                <div className="w-3.5 h-3.5 border-b-2 border-white rounded-full animate-spin"></div>
                <span>Voting...</span>
              </>
            ) : (
              <>
                <ThumbsUp size={14} />
                <span>Submit Vote</span>
              </>
            )}
          </button>
        </div>
      </div>
    </TiltPopUp>
  );
};

const ResultsModal = ({ poll, onClose }) => {
  const [isOpen, setIsOpen] = useState(true);
  const [animateResults, setAnimateResults] = useState(false);
  const yesCount = Number(poll.yesCount || 0);
  const noCount = Number(poll.noCount || 0);
  const abstainCount = Number(poll.abstainCount || 0);
  const totalVotes = yesCount + noCount + abstainCount;
  const maxVotes = Math.max(yesCount, noCount, abstainCount);
  const winnersCount = [yesCount, noCount, abstainCount].filter(
    (count) => count === maxVotes,
  ).length;
  const hasTie = winnersCount > 1;

  const options = [
    {
      name: "JA (Yes)",
      votes: yesCount,
      gradient: "from-emerald-400 to-emerald-500",
    },
    {
      name: "NEIN (No)",
      votes: noCount,
      gradient: "from-rose-400 to-rose-500",
    },
    {
      name: "ENTHALTUNG (Abstain)",
      votes: abstainCount,
      gradient: "from-slate-400 to-slate-500",
    },
  ];

  const handleClose = () => {
    setIsOpen(false);
    setTimeout(onClose, 300);
  };

  return (
    <TiltPopUp
      isOpen={isOpen}
      onClose={handleClose}
      overlayClassName="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs"
      className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden border border-gray-150 dark:border-slate-700"
    >
      <div className="p-6 border-b border-gray-100 dark:border-slate-700">
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-lg font-extrabold tracking-wide text-gray-900 dark:text-white">
                {poll.title}
              </h3>
              {poll.isCritical && (
                <span className="px-2 py-0.5 text-[10px] font-bold text-rose-700 bg-rose-50 border border-rose-200 dark:bg-rose-950/20 dark:text-rose-400 dark:border-rose-900/50 rounded-full uppercase tracking-wider">
                  Critical Poll
                </span>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-650 dark:hover:text-white transition-colors rounded-full hover:bg-gray-100 dark:hover:bg-slate-700 shrink-0"
          >
            <X size={18} />
          </button>
        </div>
        {poll.description && (
          <p className="text-xs font-semibold leading-normal text-gray-450 dark:text-gray-400">
            {poll.description}
          </p>
        )}
        <div className="flex items-center pt-2 space-x-4 text-xs font-bold">
          {!animateResults ? (
            <button
              className="flex items-center gap-1.5 px-2 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 rounded-xl shadow-md shadow-blue-500/10 transition-all"
              onClick={() => setAnimateResults(true)}
            >
              <TrendingUp size={14} />
              <span>Show Poll Results</span>
            </button>
          ) : (
            <span className="flex items-center px-2.5 py-0.5 text-[10px] text-blue-750 bg-blue-50 border border-blue-200/50 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-900/50 rounded-full uppercase tracking-wider">
              <Award size={12} className="mr-1" />
              Poll Ended
            </span>
          )}
        </div>
      </div>

      <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)] space-y-4">
        <div className="space-y-3">
          {options.map((option, index) => {
            const voteCount = option.votes || 0;
            const percentage =
              totalVotes > 0 ? (voteCount / totalVotes) * 100 : 0;
            const isWinner =
              !hasTie && voteCount === maxVotes && animateResults;

            return (
              <div
                key={index}
                className={`p-4 rounded-xl bg-gray-50/50 dark:bg-slate-900/10 border ${
                  isWinner
                    ? "border-green-500/50 dark:border-green-500/30 bg-green-500/5 dark:bg-green-500/5"
                    : "border-gray-150 dark:border-slate-805"
                } transition-all`}
              >
                <div className="flex items-center justify-between gap-2 mb-2 text-xs font-extrabold text-gray-700 dark:text-gray-300">
                  <span
                    className={
                      isWinner ? "text-green-700 dark:text-green-400" : ""
                    }
                  >
                    {option.name}
                  </span>
                  <span className="text-[11px] text-gray-550 dark:text-gray-400">
                    {voteCount} votes ({percentage.toFixed(1)}%)
                  </span>
                </div>

                <div className="w-full h-3 overflow-hidden bg-gray-200 rounded-full dark:bg-slate-700">
                  <div
                    className={`h-full rounded-full transition-all duration-[1200ms] ease-out bg-gradient-to-r ${option.gradient}`}
                    style={{
                      width: animateResults ? `${percentage}%` : "0%",
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-2 gap-4 pt-5 mt-5 text-[11px] border-t border-gray-100 dark:border-slate-700/55 font-semibold text-gray-450">
          <div>
            <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">
              Created On
            </p>
            <p className="font-extrabold text-gray-805 dark:text-gray-200">
              {new Date(poll.$createdAt).toLocaleDateString()}
            </p>
            <p className="text-[10px] text-gray-400 dark:text-gray-550">
              {new Date(poll.$createdAt).toLocaleTimeString()}
            </p>
          </div>
          <div>
            <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">
              Ended On
            </p>
            <p className="font-extrabold text-gray-805 dark:text-gray-200">
              {new Date(poll.endTime).toLocaleDateString()}
            </p>
            <p className="text-[10px] text-gray-400 dark:text-gray-550">
              {new Date(poll.endTime).toLocaleTimeString()}
            </p>
          </div>
        </div>
      </div>
    </TiltPopUp>
  );
};
