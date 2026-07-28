"use client";

import React, { useMemo, useState } from "react";
import { X, Users, CalendarDays, ClipboardList, ShieldCheck, Search, CheckCircle2, UserCircle, MapPin, Clock,
  Briefcase, Activity, Link, KeyRound, Copy, Check, Loader } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function ProxyModal({
  open,
  onClose,
  existingProxy,
  user = {},
  members = [],
  assembly,
  polls = [],
  onAssign,
}) {
  const [search, setSearch] = useState("");
  const [selectedMember, setSelectedMember] = useState(null);
  const [scope, setScope] = useState("FULL");
  const [proxyCredentialsModal, setProxyCredentialsModal] = useState(false);
  const [proxyCredentials, setProxyCredentials] = useState(null);
  const hasExistingProxy = existingProxy && Object.keys(existingProxy).length > 0;
  const [assigningProxy, setAssigningProxy] = useState(false);

  const filteredMembers = useMemo(() => {
    return members.filter((member) => {
      const matchesSearch = member.membername
        ?.toLowerCase()
        .includes(search.toLowerCase());

      const isCurrentUser = member.userId === user?.userId;

      return matchesSearch && !isCurrentUser;
    });
  }, [members, search, user]);

  if (!open || !assembly) return null;

  const handleSubmit = async () => {
    if (!selectedMember) return;
    setAssigningProxy(true);

    try {
      const credentials = generateProxyCredentials();

      const finalData = {
        assemblyId: assembly.id,
        assemblyTitle: assembly.title,
        ownerUserId: user.userId,
        ownerName: user.name,
        ownerEmail: user.email,
        proxyHolderUserId: selectedMember.userId,
        proxyHolderName: selectedMember.membername,
        proxyHolderEmail: selectedMember.memberemail,
        scope,
        submittedAt: new Date().toISOString(),
        expiresAt: assembly.endDateTime,
        status: "EINGEREICHT",

        ...credentials,
      };

      const response = await fetch("/api/assembly/proxy", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(finalData),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || "Failed to create proxy");
      }

      onAssign?.({
        ...finalData,
        hasProxy: true,
      });
      setProxyCredentials(finalData);
      setProxyCredentialsModal(true);
    } catch (error) {
      console.error(error);
      alert(error.message);
    } finally {
      setAssigningProxy(false);
    }
  };

  const generateProxyCredentials = () => {
    const random = Math.random().toString(36).substring(2, 8);
    return {
      proxyUserId: `PX-${random.toUpperCase()}`,
      proxyPassword: Math.random().toString(36).slice(-10),
      proxyLink: `${window.location.origin}/${assembly.coopId}/assembly/${assembly.id}/proxy`,
    };
  };

  const getStatusBadge = (status) => {
    switch (status?.toLowerCase()) {
      case "live":
      case "active":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20">
            <Activity className="w-3 h-3" /> {status}
          </span>
        );
      case "closed":
      case "completed":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700">
            <CheckCircle2 className="w-3 h-3" /> {status}
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-200 dark:bg-indigo-500/10 dark:text-indigo-400 dark:border-indigo-500/20">
            {status || "Scheduled"}
          </span>
        );
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-6xl bg-white dark:bg-slate-900 shadow-2xl rounded-2xl flex flex-col max-h-[93vh] overflow-hidden border border-slate-200 dark:border-slate-800"
        >
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80 shrink-0">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 rounded-xl">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  Assign Proxy (Vollmacht)
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                  Legally authorize another member to represent you at this
                  assembly.
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-700">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 p-6 lg:p-8">
              <div className="lg:col-span-7 space-y-6">
                <section className="bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 rounded-xl p-5">
                  <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-4">
                    <UserCircle className="w-4 h-4" /> Vollmachtgeber
                    (Authorising Member)
                  </h3>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-lg shrink-0">
                      {user?.name?.charAt(0)?.toUpperCase() || "U"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-base font-bold text-slate-900 dark:text-white truncate">
                        {user.name}
                      </p>
                      <div className="flex items-center gap-3 mt-1 text-xs text-slate-500 dark:text-slate-400">
                        <span className="truncate">{user.email}</span>
                        <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-600"></span>
                        <span className="font-mono text-[10px]">
                          ID: {user.userId}
                        </span>
                      </div>
                    </div>
                  </div>
                </section>

                <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
                  <div className="bg-slate-50 dark:bg-slate-800/50 px-5 py-3 border-b border-slate-200 dark:border-slate-700">
                    <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-widest flex items-center gap-2">
                      <CalendarDays className="w-4 h-4 text-indigo-500" />{" "}
                      Assembly Details
                    </h3>
                  </div>
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <h4 className="text-lg font-bold text-slate-900 dark:text-white line-clamp-2">
                        {assembly.title}
                      </h4>
                      <div className="shrink-0 mt-0.5">
                        {getStatusBadge(assembly.status)}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="col-span-2 sm:col-span-1 flex items-start gap-2.5">
                        <Clock className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase">
                            Schedule
                          </p>
                          <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                            {new Date(
                              assembly.startDateTime,
                            ).toLocaleDateString()}{" "}
                            <br />
                            {new Date(
                              assembly.startDateTime,
                            ).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}{" "}
                            -{" "}
                            {new Date(assembly.endDateTime).toLocaleTimeString(
                              [],
                              { hour: "2-digit", minute: "2-digit" },
                            )}
                          </p>
                        </div>
                      </div>
                      <div className="col-span-2 sm:col-span-1 flex items-start gap-2.5">
                        <MapPin className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase">
                            Format & Location
                          </p>
                          <p className="text-sm font-medium text-slate-700 dark:text-slate-300 capitalize">
                            {assembly.format}
                          </p>
                          <p
                            className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5"
                            title={assembly.location || "N/A"}
                          >
                            {assembly.location || "N/A"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </section>

                <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden flex flex-col max-h-[300px]">
                  <div className="bg-slate-50 dark:bg-slate-800/50 px-5 py-3 border-b border-slate-200 dark:border-slate-700 shrink-0">
                    <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-widest flex items-center gap-2">
                      <ClipboardList className="w-4 h-4 text-indigo-500" />{" "}
                      Agenda Items
                    </h3>
                  </div>
                  <div className="p-5 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-700">
                    <div className="space-y-3">
                      {assembly.agendaItems?.length > 0 ? (
                        assembly.agendaItems.map((item, index) => (
                          <div
                            key={index}
                            className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30"
                          >
                            <p className="font-semibold text-sm text-slate-900 dark:text-white">
                              <span className="text-indigo-500 mr-1.5">
                                {index + 1}.
                              </span>
                              {item.title}
                            </p>
                            {item.description && (
                              <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                                {item.description}
                              </p>
                            )}
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-6 text-sm text-slate-400 dark:text-slate-500">
                          No agenda items specified.
                        </div>
                      )}
                    </div>
                  </div>
                </section>
              </div>

              <div className="lg:col-span-5 flex flex-col h-full border-t lg:border-t-0 lg:border-l border-slate-200 dark:border-slate-800 pt-8 lg:pt-0 lg:pl-8">
                {hasExistingProxy ? (
                  <section className="flex flex-col h-full">
                    <div className="flex items-center justify-between mb-5">
                      <div>
                        <h3 className="text-lg font-bold text-indigo-800 dark:text-indigo-300">
                          Proxy Assigned
                        </h3>
                        <p className="mt-1 text-sm text-indigo-700 dark:text-indigo-400">
                          This assembly already has an authorized
                          representative.
                        </p>
                      </div>
                      <span className="px-3 py-1 text-[10px] font-bold uppercase tracking-widest rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/50">
                        {existingProxy.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
                      <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                          Proxy Holder
                        </p>
                        <p className="mt-1 text-sm font-bold text-slate-900 dark:text-white truncate">
                          {existingProxy.proxyHolderName}
                        </p>
                        <p className="mt-0.5 text-xs text-slate-500 truncate">
                          {existingProxy.proxyHolderEmail}
                        </p>
                      </div>

                      <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                          Submitted At
                        </p>
                        <p className="mt-1 text-sm font-medium text-slate-700 dark:text-slate-300">
                          {new Date(
                            existingProxy.submittedAt,
                          ).toLocaleDateString()}{" "}
                          <br />
                          {new Date(
                            existingProxy.submittedAt,
                          ).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <CredentialPreview
                        label="Proxy Login URL"
                        value={existingProxy.proxyLink}
                        icon={Link}
                      />
                      <CredentialPreview
                        label="Proxy User ID"
                        value={existingProxy.proxyUserId}
                        icon={UserCircle}
                      />
                      <CredentialPreview
                        label="Temporary Password"
                        value={existingProxy.proxyPassword}
                        icon={KeyRound}
                      />
                    </div>

                    <div className="mt-auto pt-5">
                      <div className="p-4 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-900/30 rounded-xl flex items-start gap-3">
                        <Clock className="w-5 h-5 text-amber-600 dark:text-amber-500 shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm font-bold text-amber-900 dark:text-amber-400">
                            Validity Notice
                          </p>
                          <p className="text-xs font-medium text-amber-700 dark:text-amber-500/80 mt-1">
                            These credentials remain valid until the assembly
                            officially closes.
                          </p>
                        </div>
                      </div>
                    </div>
                  </section>
                ) : (
                  <>
                    <div className="mb-6 shrink-0">
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-3">
                        <Briefcase className="w-4 h-4 text-indigo-500" /> 1.
                        Scope of Proxy
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div
                          onClick={() => setScope("FULL")}
                          className={`cursor-pointer border rounded-xl p-3.5 transition-all ${
                            scope === "FULL"
                              ? "bg-indigo-50 border-indigo-500 dark:bg-indigo-500/10 dark:border-indigo-500 ring-1 ring-indigo-500"
                              : "bg-white border-slate-200 hover:border-indigo-300 dark:bg-slate-900 dark:border-slate-700 dark:hover:border-indigo-700"
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span
                              className={`text-sm font-bold ${scope === "FULL" ? "text-indigo-700 dark:text-indigo-300" : "text-slate-700 dark:text-slate-300"}`}
                            >
                              Full Voting Rights
                            </span>
                            {scope === "FULL" && (
                              <CheckCircle2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                            )}
                          </div>
                          <p
                            className={`text-[10px] ${scope === "FULL" ? "text-indigo-600/80 dark:text-indigo-400/80" : "text-slate-500"}`}
                          >
                            Proxy can vote on your behalf on all items.
                          </p>
                        </div>

                        <div
                          onClick={() => setScope("LIMITED")}
                          className={`cursor-pointer border rounded-xl p-3.5 transition-all ${
                            scope === "LIMITED"
                              ? "bg-indigo-50 border-indigo-500 dark:bg-indigo-500/10 dark:border-indigo-500 ring-1 ring-indigo-500"
                              : "bg-white border-slate-200 hover:border-indigo-300 dark:bg-slate-900 dark:border-slate-700 dark:hover:border-indigo-700"
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span
                              className={`text-sm font-bold ${scope === "LIMITED" ? "text-indigo-700 dark:text-indigo-300" : "text-slate-700 dark:text-slate-300"}`}
                            >
                              Attendance Only
                            </span>
                            {scope === "LIMITED" && (
                              <CheckCircle2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                            )}
                          </div>
                          <p
                            className={`text-[10px] ${scope === "LIMITED" ? "text-indigo-600/80 dark:text-indigo-400/80" : "text-slate-500"}`}
                          >
                            Proxy represents you for quorum only.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex-1 flex flex-col min-h-0">
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-3">
                        <Users className="w-4 h-4 text-indigo-500" /> 2. Select
                        Proxy Holder
                      </h3>

                      <div className="relative mb-3 shrink-0">
                        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type="text"
                          value={search}
                          onChange={(e) => setSearch(e.target.value)}
                          placeholder="Search by name..."
                          className="w-full pl-10 pr-4 py-2.5 text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-400"
                        />
                      </div>

                      <div className="flex-1 overflow-y-auto space-y-2 pr-2 scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-700 max-h-[170px] border border-slate-200 dark:border-slate-700 rounded-xl p-2 bg-slate-50/50 dark:bg-slate-800/30">
                        {filteredMembers.length > 0 ? (
                          filteredMembers.map((member) => {
                            const isSelected =
                              selectedMember?.userId === member.userId;
                            return (
                              <button
                                key={member.userId}
                                onClick={() =>
                                  setSelectedMember(isSelected ? null : member)
                                }
                                className={`w-full flex items-center justify-between p-3 rounded-lg text-left transition-all ${
                                  isSelected
                                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/20"
                                    : "bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-indigo-300 dark:hover:border-indigo-600"
                                }`}
                              >
                                <div className="min-w-0 pr-4">
                                  <p
                                    className={`text-sm font-bold truncate ${isSelected ? "text-white" : "text-slate-900 dark:text-white"}`}
                                  >
                                    {member.membername}
                                  </p>
                                  <p
                                    className={`text-[10px] truncate mt-0.5 ${isSelected ? "text-indigo-100" : "text-slate-500"}`}
                                  >
                                    {member.memberemail}
                                  </p>
                                </div>
                                {isSelected && (
                                  <CheckCircle2 className="w-5 h-5 text-white shrink-0" />
                                )}
                              </button>
                            );
                          })
                        ) : (
                          <div className="text-center py-8 text-sm text-slate-400 dark:text-slate-500">
                            No members found matching "{search}"
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-800 shrink-0">
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                          Status
                        </span>
                        <span className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 rounded-md">
                          Eingereicht (Submitted)
                        </span>
                      </div>

                      {assigningProxy ? (
                        <button
                          disabled
                          className="w-full flex items-center justify-center gap-2 px-4 py-3.5 text-sm font-bold text-white bg-indigo-400 hover:bg-indigo-500 dark:bg-indigo-500 dark:hover:bg-indigo-600 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Loader className="w-4 h-4 animate-spin" />
                          Assigning Proxy...
                        </button>
                      ) : (
                        <button
                          onClick={handleSubmit}
                          disabled={!selectedMember}
                          className="w-full flex items-center justify-center gap-2 px-4 py-3.5 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <ShieldCheck className="w-4 h-4" />
                          Submit Proxy Authorization
                        </button>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      <ProxyCredentialsModal
        open={proxyCredentialsModal}
        onClose={() => {
          setProxyCredentialsModal(false);
          onClose();
        }}
        credentials={proxyCredentials}
      />
    </>
  );
}

function CredentialPreview({ label, value, icon: Icon }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
        {Icon && <Icon className="w-3.5 h-3.5" />} {label}
      </label>
      <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl group transition-colors hover:border-indigo-300 dark:hover:border-indigo-700">
        <span className="font-mono text-sm font-medium text-slate-800 dark:text-slate-200 truncate pr-4 select-all">
          {value}
        </span>
        <button
          onClick={handleCopy}
          className={`shrink-0 p-1.5 rounded-lg transition-all ${
            copied
              ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400"
              : "text-slate-400 hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-indigo-500/20 dark:hover:text-indigo-400"
          }`}
          title="Copy to clipboard"
        >
          {copied ? <Check size={16} /> : <Copy size={16} />}
        </button>
      </div>
    </div>
  );
}

function ProxyCredentialsModal({ open, onClose, credentials }) {
  if (!open || !credentials) return null;

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 sm:p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            className="relative w-full max-w-xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col"
          >
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200 dark:border-slate-800 bg-emerald-50 dark:bg-emerald-900/10 shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 rounded-full">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                    Proxy Authorized Successfully
                  </h2>
                  <p className="text-xs font-medium text-emerald-700 dark:text-emerald-400/80 mt-0.5">
                    Share these credentials securely with your proxy holder.
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 rounded-full transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-5">
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                <p className="text-[10px] uppercase tracking-widest text-slate-500 dark:text-slate-400 font-bold mb-1">
                  Assembly Context
                </p>
                <p className="text-sm font-bold text-slate-900 dark:text-white">
                  {credentials.assemblyTitle}
                </p>
              </div>

              <div className="space-y-4">
                <CredentialPreview
                  label="Proxy Login URL"
                  value={credentials.proxyLink}
                  icon={Link}
                />
                <CredentialPreview
                  label="Proxy User ID"
                  value={credentials.proxyUserId}
                  icon={UserCircle}
                />
                <CredentialPreview
                  label="Temporary Password"
                  value={credentials.proxyPassword}
                  icon={KeyRound}
                />
              </div>

              <div className="p-4 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-900/30 rounded-xl flex items-start gap-3">
                <Clock className="w-5 h-5 text-amber-600 dark:text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-bold text-amber-900 dark:text-amber-400">
                    Validity Notice
                  </p>
                  <p className="text-xs font-medium text-amber-700 dark:text-amber-500/80 mt-1">
                    These credentials are valid exclusively for this assembly
                    and will automatically expire once the assembly is
                    officially closed.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/80 shrink-0">
              <a
                href={credentials.proxyLink}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300"
              >
                Open Proxy Login &rarr;
              </a>

              <button
                onClick={onClose}
                className="px-6 py-2.5 text-sm font-bold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-slate-200 dark:focus:ring-slate-700"
              >
                Done
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
