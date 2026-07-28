"use client";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Users, Loader2, ShieldCheck, Mail, User } from "lucide-react";

export default function GroupDetailsModal({ group, onClose }) {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!group) return;
    fetchMembers();
  }, [group]);

  const fetchMembers = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/coops/groupMembers?groupId=${group.$id}`
      );

      const data = await res.json();

      if (data.success) {
        setMembers(data.members);
      }
    } catch (err) {
      console.error("Failed to fetch members");
    } finally {
      setLoading(false);
    }
  };

  if (!group) return null;

  const getKycBadge = (status) => {
    const s = (status || "").toUpperCase();
    if (s === "VERIFIED" || s === "APPROVED") {
      return "bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-900/50";
    }
    if (s === "PENDING") {
      return "bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-900/50";
    }
    if (s === "REJECTED") {
      return "bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-900/50";
    }
    return "bg-gray-50 text-gray-600 border-gray-200 dark:bg-slate-700 dark:text-gray-400 dark:border-slate-600";
  };

  return (
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
        transition={{ duration: 0.2, ease: "easeOut" }}
        className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border border-gray-200 dark:border-slate-800"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-900/50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-xl">
              <Users className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
              Group Details
            </h2>
          </div>
          <button 
            onClick={onClose} 
            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-200 dark:hover:bg-slate-800 dark:hover:text-gray-300 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <X size={20} />
          </button>
        </div>

        <div className="px-6 pt-6 pb-2 shrink-0">
          <div className="bg-indigo-50/50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-800/30 rounded-xl p-4 flex items-center justify-between">
            <div>
              <p className="text-base font-bold text-gray-900 dark:text-white mb-0.5">
                {group.name}
              </p>
              <p className="text-sm font-medium text-indigo-600 dark:text-indigo-400">
                {group.isAllMembers ? "All Members Group" : "Custom Group"}
              </p>
            </div>
            {!loading && (
              <div className="px-3 py-1.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 shadow-sm rounded-lg flex flex-col items-center justify-center">
                <span className="text-sm font-extrabold text-gray-900 dark:text-white leading-none">
                  {members.length}
                </span>
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mt-0.5">
                  Members
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-500 dark:text-gray-400">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-500 mb-3" />
              <p className="text-sm font-medium">Loading members...</p>
            </div>
          ) : members.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-500 dark:text-gray-400">
              <div className="w-12 h-12 bg-gray-50 dark:bg-slate-800 rounded-full flex items-center justify-center mb-3">
                <User className="w-6 h-6 opacity-40" />
              </div>
              <p className="text-sm font-medium">No members found in this group.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {members.map((m) => (
                <div
                  key={m.userId}
                  className="flex items-center justify-between p-3.5 bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 hover:border-indigo-200 dark:hover:border-indigo-800/50 rounded-xl transition-colors shadow-sm group"
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className="w-10 h-10 shrink-0 bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/40 dark:to-purple-900/40 text-indigo-700 dark:text-indigo-300 rounded-full flex items-center justify-center text-sm font-bold uppercase shadow-inner">
                      {m.name.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-gray-900 dark:text-gray-100 truncate">
                        {m.name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1.5 truncate mt-0.5">
                        <Mail className="w-3 h-3 shrink-0" />
                        {m.email || "No email"}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-gray-100 dark:border-slate-800 bg-gray-50/80 dark:bg-slate-900/80 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-6 py-2.5 text-sm font-bold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 shadow-md shadow-indigo-600/20 transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-slate-900"
          >
            Close
          </button>
        </div>

      </motion.div>
    </div>
  );
}