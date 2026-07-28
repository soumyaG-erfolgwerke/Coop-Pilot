"use client";
import { getMembersOfCoop } from "@/lib/transactionService";
import { createGroup, getGroups, deleteGroup, updateGroup} from "@/lib/groupService";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import GroupDetailsModal from "./GroupDetailsModal";
import { motion, AnimatePresence } from "framer-motion";
import {Users, Plus, Save, X, Eye, Edit3, Trash2, Loader2, CheckCircle2, UserCheck, AlertCircle} from "lucide-react";

export default function CreateGroup({ coopId, userId }) {
  const [name, setName] = useState("");
  const [members, setMembers] = useState([]);
  const [groups, setGroups] = useState([]);
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [isAllMembers, setIsAllMembers] = useState(false);
  const [editingGroup, setEditingGroup] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [viewGroup, setViewGroup] = useState(null);
  const [pageLoading, setPageLoading] = useState(false);
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, groupId: null });
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (!coopId) return;

    const init = async () => {
      setPageLoading(true);

      setGroups([]);
      setMembers([]);
      setSelectedMembers([]);
      setIsAllMembers(false);
      setEditingGroup(null);
      setViewGroup(null);
      setName("");

      await Promise.all([fetchMembers(), fetchGroupsData()]);

      setPageLoading(false);
    };

    init();
  }, [coopId]);

  const fetchMembers = async () => {
    try {
      const response = await getMembersOfCoop(coopId);

      const formattedMembers = response.map((member) => ({
        id: member.userId,
        name: member.membername || "Unknown",
      }));

      setMembers(formattedMembers);
    } catch {
      setError("Failed to load members");
      toast.error("Failed to load members");
    }
  };

  const fetchGroupsData = async () => {
    const res = await getGroups(coopId);
    if (res.success) {
      setGroups(res.data);
    }
  };

  const toggleMember = (id) => {
    setSelectedMembers((prev) =>
      prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id],
    );
  };

  const resetForm = () => {
    setName("");
    setSelectedMembers([]);
    setIsAllMembers(false);
    setEditingGroup(null);
  };

    const handleCreate = async () => {
    try {
        if (!name.trim()) throw new Error("Group name required");

        if (!isAllMembers && selectedMembers.length === 0) {
        throw new Error("Select members");
        }

        setLoading(true);

        const res = await createGroup({
        name,
        coopId,
        createdBy: userId,
        members: selectedMembers,
        isAllMembers,
        });

        console.log("Created group:", res);

        if (!res.success || !res.data?.$id) {
        throw new Error("Invalid group response");
        }
        
        await fetchGroupsData();

        toast.success("Group created");
        resetForm();

    } catch (err) {
        toast.error(err.message);
    } finally {
        setLoading(false);
    }
    };

  const startEdit = (group) => {
    setEditingGroup(group.$id);
    setName(group.name);
    setIsAllMembers(group.isAllMembers);

    setSelectedMembers([]);
  };

  const handleUpdate = async () => {
    try {
      setLoading(true);

      const res = await updateGroup({
        groupId: editingGroup,
        name,
        members: selectedMembers,
        isAllMembers,
      });

      if (!res.success) throw new Error(res.error);

      toast.success("Group updated");
      fetchGroupsData();
      resetForm();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const initiateDelete = (groupId) => {
    setDeleteModal({ isOpen: true, groupId });
  };

  const cancelDelete = () => {
    setDeleteModal({ isOpen: false, groupId: null });
  };

  const confirmDelete = async () => {
    const { groupId } = deleteModal;
    if (!groupId) return;

    setIsDeleting(true);

    try {
      const res = await deleteGroup(groupId);

      if (res.success) {
        toast.success("Group deleted");
        fetchGroupsData();
      } else {
        toast.error(res.error);
      }
    } catch (error) {
      toast.error("An unexpected error occurred.");
    } finally {
      setIsDeleting(false);
      setDeleteModal({ isOpen: false, groupId: null });
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } },
  };
  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0 },
  };

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
      <div className="flex items-center gap-3 pb-4 border-b border-gray-200 dark:border-slate-800">
        <div className="p-2.5 bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 rounded-xl shadow-sm">
          <Users className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
            Group Management
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Create and manage communication or access groups within the
            cooperative.
          </p>
        </div>
      </div>

      <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 rounded-xl p-4 flex items-start sm:items-center gap-2">
          <div className="p-2 bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-500 rounded-lg shrink-0">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <p className="text-xs text-amber-700 dark:text-amber-400/80 mt-0.5 font-medium">
              Please note: All group creations, edits, and deletions made here will be applied strictly to this cooperative.
            </p>
          </div>
        </div>

      {pageLoading ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center py-20 w-full"
        >
          <div className="flex flex-col items-center justify-center min-h-[200px] text-gray-500 dark:text-gray-400 gap-3">
            <div className="w-8 h-8 border-4 border-indigo-600 rounded-full border-t-transparent animate-spin"></div>
            <p>Loading group data...</p>
          </div>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-1 lg:sticky lg:top-8 space-y-6"
          >
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-800">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                  {editingGroup ? "Edit Group" : "Create New Group"}
                </h3>
                {editingGroup && (
                  <span className="px-2.5 py-1 bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 text-xs font-bold uppercase tracking-wider rounded-md">
                    Editing
                  </span>
                )}
              </div>

              <div className="space-y-5">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Group Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Board Members"
                    className="w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                  />
                </div>

                <label
                  className={`flex items-center gap-3 p-4 border rounded-xl cursor-pointer transition-all ${isAllMembers ? "bg-indigo-50 border-indigo-200 dark:bg-indigo-900/20 dark:border-indigo-800/50" : "bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-800"}`}
                >
                  <div className="relative flex items-center justify-center">
                    <input
                      type="checkbox"
                      checked={isAllMembers}
                      onChange={(e) => setIsAllMembers(e.target.checked)}
                      className="w-5 h-5 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 cursor-pointer"
                    />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-gray-900 dark:text-white">
                      Include All Members
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      Automatically adds everyone in the coop.
                    </span>
                  </div>
                </label>

                <AnimatePresence>
                  {!isAllMembers && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="space-y-1.5 pt-1">
                        <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider flex justify-between">
                          <span>Select Members</span>
                          <span className="text-indigo-600 dark:text-indigo-400">
                            {selectedMembers.length} selected
                          </span>
                        </label>
                        <div className="max-h-64 overflow-y-auto p-2 bg-gray-50 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700 rounded-xl space-y-1 custom-scrollbar">
                          {members.length === 0 ? (
                            <p className="p-3 text-sm text-center text-gray-500">
                              No members found.
                            </p>
                          ) : (
                            members.map((m) => {
                              const isSelected = selectedMembers.includes(m.id);
                              return (
                                <label
                                  key={m.id}
                                  className={`flex items-center gap-3 p-2.5 rounded-lg cursor-pointer transition-colors border ${isSelected ? "bg-indigo-50/50 border-indigo-100 dark:bg-indigo-900/20 dark:border-indigo-800/30" : "border-transparent hover:bg-white hover:border-gray-200 dark:hover:bg-slate-800 dark:hover:border-slate-600"}`}
                                >
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={() => toggleMember(m.id)}
                                    className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 cursor-pointer"
                                  />
                                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/50 dark:to-purple-900/50 text-indigo-700 dark:text-indigo-300 flex items-center justify-center text-xs font-bold uppercase shadow-inner">
                                    {m.name.charAt(0)}
                                  </div>
                                  <span
                                    className={`text-sm font-medium ${isSelected ? "text-indigo-900 dark:text-indigo-100" : "text-gray-700 dark:text-gray-300"}`}
                                  >
                                    {m.name}
                                  </span>
                                </label>
                              );
                            })
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="pt-4 border-t border-gray-100 dark:border-slate-800 flex gap-3">
                  {editingGroup ? (
                    <>
                      <button
                        onClick={resetForm}
                        disabled={loading}
                        className="flex-1 flex justify-center items-center gap-2 px-4 py-2.5 bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-slate-600 rounded-xl text-sm font-bold hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
                      >
                        <X className="w-4 h-4" /> Cancel
                      </button>
                      <button
                        onClick={handleUpdate}
                        disabled={loading}
                        className="flex-1 flex justify-center items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 shadow-md shadow-indigo-600/20 transition-all disabled:opacity-50 disabled:shadow-none"
                      >
                        {loading ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Save className="w-4 h-4" />
                        )}
                        Update
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={handleCreate}
                      disabled={loading}
                      className="w-full flex justify-center items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 shadow-md shadow-indigo-600/20 transition-all disabled:opacity-50 disabled:shadow-none"
                    >
                      {loading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Plus className="w-4 h-4" />
                      )}
                      Create Group
                    </button>
                  )}
                </div>
              </div>
            </div>
          </motion.div>

          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                Active Groups
              </h2>
              <span className="px-3 py-1 bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-300 text-xs font-bold rounded-full">
                {groups.length} Total
              </span>
            </div>

            {groups.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-12 bg-white dark:bg-slate-900 border border-dashed border-gray-300 dark:border-slate-700 rounded-2xl">
                <div className="p-4 bg-gray-50 dark:bg-slate-800 rounded-full mb-4">
                  <Users className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-base font-bold text-gray-900 dark:text-white mb-1">
                  No groups created yet
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center max-w-sm">
                  Use the form on the left to create your first group and assign
                  members.
                </p>
              </div>
            ) : (
                <motion.div
                    className="relative max-h-[30rem] overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-4"
                >
                    <AnimatePresence>
                    {groups.map((g, index) => (
                        <motion.div
                        key={g.$id ?? `group-${g.name}-${g.isAllMembers ? "all" : g.memberCount}-${index}`}
                        variants={itemVariants}
                        initial="hidden" 
                        animate="show"
                        exit="hidden"
                        layout
                        className="bg-white dark:bg-slate-900 p-5 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-800 hover:shadow-md transition-shadow group flex flex-col justify-between h-full"
                        >
                        <div>
                            <div className="flex items-start justify-between mb-3">
                            <div className="p-2.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-xl">
                                <Users className="w-5 h-5" />
                            </div>
                            {g.isAllMembers && (
                                <span className="flex items-center gap-1 px-2 py-1 bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400 text-[10px] font-bold uppercase tracking-wider rounded-md border border-green-200 dark:border-green-900/50">
                                <UserCheck className="w-3 h-3" /> All
                                </span>
                            )}
                            </div>
                            
                            <h3 className="text-base font-bold text-gray-900 dark:text-white mb-1 line-clamp-1">
                            {g.name}
                            </h3>
                            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                            {g.isAllMembers ? "Entire Cooperative" : `${g.memberCount} Members`}
                            </p>
                        </div>

                        <div className="flex items-center gap-2 mt-6 pt-4 border-t border-gray-100 dark:border-slate-800">
                            <button
                            onClick={() => setViewGroup(g)}
                            className="flex-1 flex justify-center items-center gap-1.5 p-2 bg-gray-50 dark:bg-slate-800 hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-300 text-xs font-bold rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-gray-200"
                            >
                            <Eye className="w-4 h-4" /> View
                            </button>
                            
                            <button
                            onClick={() => startEdit(g)}
                            className="flex-1 flex justify-center items-center gap-1.5 p-2 bg-indigo-50 dark:bg-indigo-900/20 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 text-xs font-bold rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-200"
                            >
                            <Edit3 className="w-4 h-4" /> Edit
                            </button>

                            <button
                            onClick={() => initiateDelete(g.$id)}
                            className="p-2 text-red-500 bg-red-50 hover:bg-red-100 dark:bg-red-900/10 dark:hover:bg-red-900/30 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-red-200"
                            title="Delete Group"
                            >
                            <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                        </motion.div>
                    ))}
                    </AnimatePresence>
                </motion.div>
            )}
          </div>
        </div>
      )}

      {viewGroup && (
        <GroupDetailsModal
          group={viewGroup}
          onClose={() => setViewGroup(null)}
        />
      )}

      <AnimatePresence>
        {deleteModal.isOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
              onClick={cancelDelete}
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl p-6 border border-slate-200 dark:border-slate-800 overflow-hidden"
            >
              <div className="flex flex-col items-center text-center">
                <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-500 rounded-full flex items-center justify-center mb-4 ring-4 ring-red-50 dark:ring-red-900/10">
                  <AlertCircle className="w-6 h-6" />
                </div>

                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                  Delete Group?
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
                  Are you sure you want to permanently delete this group? This action cannot be undone and will remove all members from this specific grouping.
                </p>

                <div className="flex w-full gap-3">
                  <button
                    onClick={cancelDelete}
                    disabled={isDeleting}
                    className="flex-1 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-sm font-bold rounded-xl transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmDelete}
                    disabled={isDeleting}
                    className="flex-1 flex justify-center items-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white text-sm font-bold rounded-xl shadow-sm shadow-red-600/20 transition-all disabled:opacity-50 disabled:shadow-none"
                  >
                    {isDeleting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                    {isDeleting ? "Deleting..." : "Yes, Delete"}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
