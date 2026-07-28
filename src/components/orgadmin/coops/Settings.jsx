import { useEffect, useRef, useState } from "react";
import { getOrgAdminTeamMembers } from "@/lib/orgAdminService";
import {
  assignMembersToCoop,
  fetchAssignedMembersForCoop,
  removeMemberFromCoop,
} from "@/lib/assignAuditors";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

const ROLE_LABELS = {
  auditer: "Auditer",
  aud_E: "Sub-Auditer",
};

const Settings = ({ auditOrgId }) => {
  const searchParams = useSearchParams();
  const coopId = searchParams.get("coopId");
  const { user } = useAuth();

  const isAuditor = user.role === "auditer";

  const inputRef = useRef(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const [searchResults, setSearchResults] = useState([]);
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [assignedMembers, setAssignedMembers] = useState([]);

  const [isSearching, setIsSearching] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);
  const [isLoadingAssignments, setIsLoadingAssignments] = useState(false);

  // debounce
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchTerm), 400);
    return () => clearTimeout(t);
  }, [searchTerm]);

  // load assigned
  const loadAssignedMembers = async () => {
    if (!coopId) return;

    try {
      setIsLoadingAssignments(true);
      const res = await fetchAssignedMembersForCoop(coopId, user.role);
      setAssignedMembers(res?.assignedMembers || []);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingAssignments(false);
    }
  };

  useEffect(() => {
    loadAssignedMembers();
  }, [coopId]);

  const auditorAlreadyAssigned =
    assignedMembers.some((i) => i.role === "auditer") ||
    selectedMembers.some((i) => i.role === "auditer");

  // =========================
  // SEARCH (NO FILTERING ANYMORE)
  // =========================
  useEffect(() => {
    if (!auditOrgId || !debouncedSearch.trim()) {
      setSearchResults([]);
      return;
    }

    const run = async () => {
      try {
        setIsSearching(true);

        const res = await getOrgAdminTeamMembers({
          orgId: auditOrgId,
          search: debouncedSearch,
          limit: 10,
        });

        const members = res?.teamMembers || [];
        setSearchResults(members);
      } catch (e) {
        console.error(e);
      } finally {
        setIsSearching(false);
      }
    };

    run();
  }, [auditOrgId, debouncedSearch]);

  // =========================
  // STATUS RESOLVER
  // =========================
  const getMemberStatus = (member) => {
    const isSelected = selectedMembers.some((m) => m.id === member.id);

    const assigned = assignedMembers.find((a) => a.member?.id === member.id);

    const isAlreadyAssigned = !!assigned;

    const isAuditerRole = member.role === "auditer";

    const blockedBecauseAuditer =
      auditorAlreadyAssigned &&
      isAuditerRole &&
      !isSelected &&
      !isAlreadyAssigned;

    return {
      isSelected,
      isAlreadyAssigned,
      assignedRole: assigned?.role,
      blockedBecauseAuditer,
    };
  };

  // =========================
  // SELECT
  // =========================
  const handleSelectMember = (member) => {
    const status = getMemberStatus(member);

    if (status.isSelected) return;

    if (status.blockedBecauseAuditer) {
      alert("Cannot select: another auditer is already assigned.");
      return;
    }

    setSelectedMembers((p) => [...p, member]);
    setSearchTerm("");
    setSearchResults([]);

    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const removeSelectedMember = (id) => {
    setSelectedMembers((p) => p.filter((m) => m.id !== id));
  };

  const handleAssignMembers = async () => {
    if (!selectedMembers.length) return;

    try {
      setIsAssigning(true);

      await assignMembersToCoop({
        coopId,
        members: selectedMembers.map((m) => ({
          memberId: m.id,
          role: m.role,
        })),
        role: user.role,
      });

      setSelectedMembers([]);
      await loadAssignedMembers();
    } catch (e) {
      console.error(e);
    } finally {
      setIsAssigning(false);
    }
  };

  const handleUnassign = async (id) => {
    try {
      await removeMemberFromCoop(id, user.role);
      await loadAssignedMembers();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-gray-900 dark:text-gray-100">
          Auditor-Team Assignment
        </h1>
        <p className="text-sm text-gray-500">
          Search and assign auditors & sub-auditors
        </p>
      </div>

      {/* SEARCH */}
      <div className="relative p-5 bg-white border rounded-lg shadow-sm dark:bg-gray-800">
        <h2 className="mb-4 text-lg font-semibold">
          Assign {!isAuditor && "Auditors & "}Sub-Auditors
        </h2>

        <div
          className="flex flex-wrap items-center gap-2 px-3 py-2 border rounded-xl bg-gray-50 dark:bg-gray-600"
          onClick={() => inputRef.current?.focus()}
        >
          {selectedMembers.map((m) => (
            <div
              key={m.id}
              className="flex items-center gap-1 px-3 py-1 text-sm text-blue-700 rounded-full bg-blue-50 dark:bg-blue-600 dark:text-blue-300"
            >
              {m.name}
              <button onClick={() => removeSelectedMember(m.id)}>×</button>
            </div>
          ))}

          <input
            ref={inputRef}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search members..."
            className="flex-1 text-sm text-gray-900 placeholder-gray-400 bg-transparent outline-none dark:text-gray-100 dark:placeholder-gray-500"
          />
        </div>

        {/* DROPDOWN */}
        {searchTerm && (
          <div className="absolute z-50 mt-2 max-h-72 rounded-xl border bg-white dark:bg-gray-800 dark:shadow-lg w-[85%]">
            {isSearching && (
              <div className="p-3 text-sm text-gray-500">Searching...</div>
            )}

            {!isSearching &&
              searchResults.map((member) => {
                const status = getMemberStatus(member);

                return (
                  <button
                    key={member.id}
                    onClick={() => handleSelectMember(member)}
                    disabled={
                      status.blockedBecauseAuditer || status.isAlreadyAssigned
                    }
                    className={`flex items-center justify-between px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-600 w-full pr-10 rounded-xl ${
                      status.blockedBecauseAuditer || status.isAlreadyAssigned
                        ? "opacity-50 cursor-not-allowed"
                        : ""
                    }`}
                  >
                    <div>
                      <div className="text-sm font-medium">{member.name}</div>
                      <div className="text-xs text-gray-500">
                        {member.email}
                      </div>

                      <div className="mt-1 text-xs">
                        {status.isAlreadyAssigned && (
                          <span className="text-green-600">
                            Already assigned (
                            {ROLE_LABELS[status.assignedRole] ||
                              status.assignedRole}
                            )
                          </span>
                        )}

                        {status.blockedBecauseAuditer && (
                          <span className="text-red-600">
                            Cannot select: another auditer already exists
                          </span>
                        )}
                      </div>
                    </div>

                    <span className="px-2 py-1 text-xs capitalize bg-gray-100 rounded-full dark:bg-gray-600">
                      {ROLE_LABELS[member.role] || member.role}
                    </span>
                  </button>
                );
              })}

            {!isSearching && searchResults.length === 0 && (
              <div className="p-3 text-sm text-gray-500">No results found</div>
            )}
          </div>
        )}

        <button
          onClick={handleAssignMembers}
          disabled={!selectedMembers.length || isAssigning}
          className="mt-5 rounded-xl bg-primary-dark/80 px-5 py-2.5 text-sm text-white disabled:opacity-50"
        >
          {isAssigning
            ? "Assigning..."
            : `Assign Selected (${selectedMembers.length})`}
        </button>
      </div>

      {/* TABLE */}
      <div className="mt-8">
        <h3 className="mb-4 text-lg font-semibold">
          Assigned{!isAuditor && " Auditors &"} Sub-Auditors
        </h3>

        <table className="w-full text-sm">
          <thead className="text-xs uppercase bg-slate-200 dark:bg-gray-600">
            <tr>
              <th className="p-3 text-left">Name</th>
              <th className="p-3 text-left">Email</th>
              <th className="p-3 text-left">Role</th>
              <th className="p-3 text-right">Action</th>
            </tr>
          </thead>

          <tbody>
            {isLoadingAssignments ? (
              Array.from({ length: 3 }).map((_, rowIndex) => (
                <tr key={rowIndex} className="animate-pulse border-b dark:border-gray-700">
                  <td className="p-4"><div className="h-4 bg-gray-250 dark:bg-gray-700 rounded w-28"></div></td>
                  <td className="p-4"><div className="h-4 bg-gray-250 dark:bg-gray-700 rounded w-36"></div></td>
                  <td className="p-4"><div className="h-4 bg-gray-250 dark:bg-gray-700 rounded w-20"></div></td>
                  <td className="p-4 text-right"><div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-24 ml-auto"></div></td>
                </tr>
              ))
            ) : assignedMembers.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-6 text-center text-gray-400">
                  No members assigned yet.
                </td>
              </tr>
            ) : (
              assignedMembers.map((a) => (
                <tr key={a.id} className="border-t">
                  <td className="p-3">{a.member?.name}</td>
                  <td className="p-3">{a.member?.email}</td>
                  <td className="p-3">{ROLE_LABELS[a.role] || a.role}</td>
                  <td className="p-3 text-right">
                    <button
                      onClick={() => handleUnassign(a.id)}
                      disabled={a.member?.email === user.email}
                      className="text-red-600 bg-red-50 px-3 py-1.5 rounded-lg text-sm hover:bg-red-100 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Unassign {a.member?.email === user.email ? "(You)" : ""}
                    </button>
                  </td>
                </tr>
              )))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Settings;
