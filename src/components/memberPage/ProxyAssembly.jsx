"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import ReactDOM from "react-dom";
import {
  AlertCircle,
  CalendarDays,
  CheckCircle,
  ClipboardList,
  Clock,
  MapPin,
  Radio,
  ThumbsUp,
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
import { castVote, getMemberPollsByCoopId } from "@/lib/votingService";
import { getMemberAssemblyById } from "@/lib/proxyService";
import TiltPopUp from "@/components/pop-ups/TiltPopUp";

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

const modalInputClass =
  "w-full px-4 py-2.5 text-sm border border-gray-255 rounded-xl bg-white dark:bg-slate-805 dark:text-white dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-xs";

const AssemblyCard = ({
  assembly,
  assemblyPolls,
  onOpenVoting,
  isExpanded,
  onToggleDetails,
  isClosedExpanded,
  onToggleClosed,
  isSubmitting,
  isProxyMode = false,
}) => {
  const isWithinCutoff =
    assembly.startDateTime >= new Date(Date.now() - 5 * 60 * 60 * 1000);
  const isTimeEnded =
    assembly.endDateTime && new Date(assembly.endDateTime) <= new Date();
  const isAttending = assembly.attendanceStatus === "present";
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

  return (
    <article className="p-5 bg-white border border-gray-150 hover:border-gray-300 dark:bg-slate-800 dark:border-slate-700 hover:dark:border-slate-600 rounded-2xl shadow-xs hover:shadow-sm transition-all duration-300">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex items-center px-2.5 py-0.5 text-[10px] font-bold rounded-full uppercase tracking-wider ${statusTone}`}
            >
              {statusLabel.toLowerCase() === "live" ? (
                <span className="relative flex h-2 w-2 mr-1.5 shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
              ) : (
                <Radio className="mr-1 shrink-0 text-current" size={12} />
              )}
              {statusLabel}
            </span>
            <span className="px-2 py-0.5 text-[10px] font-bold text-blue-650 bg-blue-50/50 border border-blue-150/40 rounded-md dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800/30 uppercase">
              {formatLabels[assembly.format] || "Assembly"}
            </span>
          </div>
          <h3 className="text-sm font-extrabold text-gray-900 dark:text-white tracking-wide">
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
            onClick={() => onToggleDetails?.()}
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
        <div className="mt-5 pt-4 border-t border-gray-100 dark:border-slate-700/50 space-y-4">
          <div className="flex flex-col gap-2 sm:flex-row">
            {isLive &&
              (assembly.hasProxy && assembly.scope === "FULL" ? (
                <button
                  type="button"
                  onClick={() => onOpenVoting(assembly)}
                  disabled={isUpcoming}
                  className={`inline-flex items-center justify-center gap-1.5 px-4.5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md shadow-blue-500/10 transition-all ${
                    isUpcoming ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                >
                  <Vote size={14} />
                  Open Polls
                </button>
              ) : (
                <div className="inline-flex items-center justify-center gap-1.5 px-4.5 py-2 text-xs font-bold text-gray-450 bg-gray-100/50 dark:bg-slate-850 dark:text-slate-500 border border-transparent rounded-xl select-none">
                  <Vote size={14} className="text-gray-400" />
                  You have only attendance rights
                </div>
              ))}
          </div>
        </div>
      )}

      {isExpanded && assembly.agendaItems?.length > 0 && (
        <div className="pt-4 mt-4 border-t border-gray-100 dark:border-slate-700/50">
          <div className="flex items-center gap-2 mb-3 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            <ClipboardList size={14} className="text-blue-500" />
            Agenda
          </div>
          <ol className="space-y-2.5">
            {assembly.agendaItems.map((item, index) => (
              <li
                key={`${item.title}-${index}`}
                className="p-3 bg-gray-55/30 dark:bg-slate-900/5 border border-gray-150/40 dark:border-slate-800 rounded-xl"
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
        <div className="flex items-center gap-2 pt-4 mt-4 text-xs font-bold text-gray-400 border-t border-gray-100 dark:border-slate-700/50 dark:text-gray-500 uppercase tracking-wider">
          <Users size={14} className="text-gray-400" />
          {assembly.attendanceSummary?.representedMembers || 0} members
          currently represented
        </div>
      )}
    </article>
  );
};

export default function proxyAssembly({
  coops = [],
  proxyAssemblyId,
  proxySession,
}) {
  const [coopId, setCoopId] = useState(null);
  const [assemblyId, setAssemblyId] = useState(null);
  const [assemblyData, setAssemblyData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submittingId, setSubmittingId] = useState("");
  const [error, setError] = useState("");
  const [isExpanded, setIsExpanded] = useState(true);
  const [isClosedExpanded, setIsClosedExpanded] = useState(false);
  const [pollsModalAssembly, setPollsModalAssembly] = useState(null);
  const [pollsLoading, setPollsLoading] = useState(false);
  const [pollsError, setPollsError] = useState("");
  const [activePolls, setActivePolls] = useState([]);
  const [castedPolls, setCastedPolls] = useState([]);
  const [pollsByAssembly, setPollsByAssembly] = useState({});
  const [selectedPoll, setSelectedPoll] = useState(null);
  const [selectedOption, setSelectedOption] = useState(null);
  const [voting, setVoting] = useState(false);
  const [refresh, setRefresh] = useState(false);
  const votingMemberId = proxySession?.ownerUserId;

  const proxyHolderId = proxySession?.proxyHolderId;

  useEffect(() => {
    if (!coops || coops.length === 0) return;
    setCoopId(coops[0]?.coopId);
  }, [coops]);

  useEffect(() => {
    if (!proxyAssemblyId) return;
    setAssemblyId(proxyAssemblyId);
  }, [proxyAssemblyId]);

  const fetchAssembly = useCallback(async () => {
    if (!coopId || !assemblyId) {
      setAssemblyData(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");
    try {
      const data = await getMemberAssemblyById(assemblyId);
      if (data?.proxyTableId !== proxySession?.id) {
        throw new Error("Unauthorized proxy access");
      }
      setAssemblyData(data);
    } catch (err) {
      setError(err.message || "Failed to load assembly.");
    } finally {
      setLoading(false);
    }
  }, [coopId, assemblyId]);

  useEffect(() => {
    fetchAssembly();
  }, [fetchAssembly, refresh]);

  useEffect(() => {
    const loadAssemblyPolls = async () => {
      if (!coopId || !votingMemberId || !assemblyData) return;
      try {
        const currentTime = new Date().toISOString();
        const { activePolls: active, castedPolls: casted } =
          await getMemberPollsByCoopId(coopId, votingMemberId, currentTime);
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
  }, [assemblyData, coopId, votingMemberId]);

  const fetchPollsForAssembly = useCallback(
    async (assembly) => {
      if (!coopId || !votingMemberId || !assembly?.id) return;
      setPollsLoading(true);
      setPollsError("");
      try {
        const currentTime = new Date().toISOString();
        const { activePolls: active, castedPolls: casted } =
          await getMemberPollsByCoopId(coopId, votingMemberId, currentTime);
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
    [coopId, votingMemberId],
  );

  const handleOpenVoting = async (assembly) => {
    setPollsModalAssembly(assembly);
    setSelectedPoll(null);
    setSelectedOption(null);
    await fetchPollsForAssembly(assembly);
  };

  const handleVote = async () => {
    if (!selectedPoll || selectedOption === null || !votingMemberId) return;
    setVoting(true);
    try {
      await castVote(selectedPoll.$id, votingMemberId, selectedOption);
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
    <div className="p-4 sm:p-6 space-y-6 animate-fadeIn">
      <div className="mb-6">
        <div className="p-4 mb-6 border border-purple-200/20 bg-purple-50/50 dark:bg-purple-955/10 dark:border-purple-900/30 rounded-2xl">
          <p className="text-xs font-bold text-purple-700 dark:text-purple-300 uppercase tracking-wider">
            Proxy Voting Session
          </p>
          <p className="mt-1 text-sm text-purple-600 dark:text-purple-400 font-semibold">
            You are voting on behalf of:{" "}
            <span className="font-extrabold">{proxySession?.ownerName}</span>
          </p>
        </div>
        <h2 className="flex items-center gap-2 text-xl font-extrabold text-gray-900 dark:text-white tracking-wide">
          Assembly Details
          <button
            onClick={() => setRefresh(!refresh)}
            className="text-gray-400 hover:text-gray-650 dark:text-gray-450 dark:hover:text-white transition-colors"
          >
            <RotateCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </h2>
        <p className="text-xs text-gray-450 dark:text-gray-400 font-semibold mt-0.5">
          Review assembly details, agenda, and cast votes.
        </p>
      </div>

      {error && (
        <div className="p-4 text-xs font-semibold text-red-700 border border-red-200 rounded-xl bg-red-50 dark:border-red-800 dark:bg-red-900/20 dark:text-red-200">
          {error}
        </div>
      )}

      {!loading ? (
        <>
          {!assemblyData ? (
            <div className="p-12 text-center bg-white/70 border border-gray-150 rounded-2xl dark:bg-slate-800 dark:border-slate-700/80 shadow-xs backdrop-blur-xs select-none">
              <Radio
                size={44}
                className="mx-auto mb-4 text-gray-400 dark:text-gray-600 animate-pulse"
              />
              <h3 className="mb-2 text-sm font-extrabold text-gray-700 dark:text-gray-305 uppercase tracking-wide">
                No assembly available
              </h3>
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-450">
                The requested assembly could not be found or is not available.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              <AssemblyCard
                key={assemblyData.id}
                assembly={assemblyData}
                assemblyPolls={pollsByAssembly[assemblyData.id] || []}
                onOpenVoting={handleOpenVoting}
                isExpanded={isExpanded}
                onToggleDetails={() => setIsExpanded(!isExpanded)}
                isClosedExpanded={isClosedExpanded}
                onToggleClosed={() => setIsClosedExpanded(!isClosedExpanded)}
                isSubmitting={submittingId === assemblyData.id}
                isProxyMode={true}
              />
            </div>
          )}
        </>
      ) : (
        <div className="flex items-center justify-center p-6 h-96">
          <div className="w-10 h-10 border-b-2 border-blue-600 rounded-full animate-spin"></div>
        </div>
      )}

      {pollsModalAssembly && (
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
          isPollEnded={isPollEnded}
        />
      )}

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
  isPollEnded,
}) => {
  const [isOpen, setIsOpen] = useState(true);

  const handleClose = () => {
    setIsOpen(false);
    setTimeout(onClose, 300);
  };

  return (
    <TiltPopUp
      isOpen={isOpen}
      onClose={handleClose}
      overlayClassName="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs"
      className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden border border-gray-150 dark:border-slate-700"
    >
    <div className="flex items-start justify-between p-6 border-b dark:border-slate-700 border-gray-100">
        <div>
          <h3 className="text-lg font-extrabold text-gray-900 dark:text-white tracking-wide">
            Assembly Polls
          </h3>
          <p className="text-xs text-gray-400 dark:text-gray-500 font-semibold mt-0.5">
            {assembly.title}
          </p>
          <div className="flex gap-3 mt-3 text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
            <span>Active: {pollsSummary.activeCount}</span>
            <span>Voted: {pollsSummary.castedCount}</span>
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
          <div className="p-4 text-xs font-semibold text-red-750 border border-red-200 rounded-xl bg-red-50 dark:border-red-850 dark:bg-red-900/20 dark:text-red-200">
            {error}
          </div>
        )}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="w-6 h-6 text-blue-500 animate-spin" />
          </div>
        )}
        {!isLoading && activePolls.length > 0 && (
          <section className="space-y-4">
            <h4 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
              Active Polls
            </h4>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {activePolls.map((poll) => (
                <PollCard
                  key={poll.$id}
                  poll={poll}
                  status="active"
                  onClick={() => onSelectPoll(poll)}
                />
              ))}
            </div>
          </section>
        )}

        {!isLoading && castedPolls.length > 0 && (
          <section className="space-y-4">
            <h4 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
              Your Votes
            </h4>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {castedPolls.map((poll) => (
                <PollCard key={poll.$id} poll={poll} status="voted" />
              ))}
            </div>
          </section>
        )}

        {!isLoading && activePolls.length === 0 && castedPolls.length === 0 && (
          <div className="p-10 text-center bg-gray-50/50 dark:bg-slate-805 rounded-2xl border border-dashed border-gray-200 dark:border-slate-700 select-none">
            <Vote
              size={40}
              className="mx-auto mb-3 text-gray-400 dark:text-gray-600 animate-pulse"
            />
            <h3 className="mb-2 text-sm font-extrabold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
              No polls available
            </h3>
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-450">
              There are no active or completed polls for this assembly yet.
            </p>
          </div>
        )}
      </div>
    </TiltPopUp>
  );
};

const PollCard = ({ poll, status, onClick }) => {
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
        <div className="flex items-center justify-between mb-3 gap-2">
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
            {poll.isCritical && (
              <span className="px-2 py-0.5 text-[10px] font-bold text-rose-700 bg-rose-50 border border-rose-200 dark:bg-rose-955/20 dark:text-rose-400 dark:border-rose-900/50 rounded-full uppercase tracking-wider">
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
          <p className="mt-1 text-[11px] font-semibold text-gray-450 dark:text-gray-455 line-clamp-2">
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

        {status === "active" && (
          <button
            onClick={onClick}
            className="flex items-center justify-center w-full px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md shadow-blue-500/10 transition-colors"
          >
            <Vote size={14} className="mr-1.5 shrink-0" />
            <span>Cast proxy Vote</span>
          </button>
        )}
        {status === "voted" && (
          <button
            disabled
            className="flex items-center justify-center w-full px-4 py-2 text-xs font-bold text-gray-450 bg-gray-100/50 cursor-not-allowed dark:bg-slate-850 dark:text-slate-505 border border-transparent rounded-xl"
          >
            <CheckCircle size={14} className="mr-1.5 shrink-0 text-gray-450" />
            <span>Vote Casted</span>
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
                <h3 className="text-lg font-extrabold text-gray-900 dark:text-white tracking-wide">
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
            <p className="text-xs text-gray-450 dark:text-gray-400 leading-normal font-semibold">
              {poll.description}
            </p>
          )}
          <div className="flex items-center space-x-4 text-xs font-bold pt-2">
            <span className="flex items-center px-2.5 py-0.5 text-[10px] text-green-700 bg-green-50 border border-green-200/50 dark:bg-green-950/20 dark:text-green-300 dark:border-green-900/50 rounded-full uppercase tracking-wider">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse mr-1.5 shrink-0"></span>
              Poll is Live
            </span>
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-280px)] space-y-5">
          <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
            Select your choice:
          </p>
          <div className="space-y-2.5">
            {options.map((option, index) => (
              <button
                key={index}
                onClick={() => setSelectedOption(index)}
                className={`w-full text-left p-4 rounded-xl border-2 transition-all duration-200 ${
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
                    <CheckCircle size={18} className="text-blue-500 shrink-0 animate-scaleIn" />
                  )}
                </div>
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-4 pt-5 mt-5 text-[11px] border-t border-gray-100 dark:border-slate-700/55 font-semibold text-gray-455">
            <div>
              <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">
                Created On
              </p>
              <p className="font-extrabold text-gray-800 dark:text-gray-205">
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
              <p className="font-extrabold text-gray-800 dark:text-gray-205">
                {new Date(poll.endTime).toLocaleDateString()}
              </p>
              <p className="text-[10px] text-gray-400 dark:text-gray-555">
                {new Date(poll.endTime).toLocaleTimeString()}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between p-6 border-t bg-gray-50 dark:bg-slate-805/50 dark:border-slate-700/80">
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
