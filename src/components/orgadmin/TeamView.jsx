"use client";

import React, { useState } from "react";
import { Edit2, Users } from "lucide-react";
import TeamMemberDrawer from "./TeamMemberDrawer";
import {
  createOrgAdminTeamMember,
  updateOrgAdminTeamMember,
} from "../../lib/orgAdminService";
import { toast } from "react-hot-toast";
import UserName from "../userComponent/UserName";
import UserEmail from "../userComponent/UserEmail";

const ROLE_OPTIONS = {
  auditer: "Auditor",
  aud_E: "Sub-Auditor",
};

export default function TeamView({
  defaultPassword,
  setDefaultPassword,
  isDrawerOpen,
  setDrawerOpen,
  teamMembers,
  setTeamMembers,
  teamPagination,
  onPageChange,
  onTeamMembersChanged,
  auditOrgName,
  isLoading,
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [editingMember, setEditingMember] = useState(null);
  const existingEmails = teamMembers.map((member) => member.email);
  const existingEmployeeIds = teamMembers.map((member) => member.empId);

  const normalizedSearchQuery = searchQuery.trim().toLowerCase();
  const filteredTeamMembers = normalizedSearchQuery
    ? teamMembers.filter((member) => {
        const name = (member.name || "").toLowerCase();
        const email = (member.email || "").toLowerCase();
        const empId = (member.empId || "").toLowerCase();
        return (
          name.includes(normalizedSearchQuery) ||
          email.includes(normalizedSearchQuery) ||
          empId.includes(normalizedSearchQuery)
        );
      })
    : teamMembers;

  const handleAddMember = async (member) => {
    const response = editingMember
      ? await updateOrgAdminTeamMember({
          ...member,
          id: editingMember.id,
        })
      : await createOrgAdminTeamMember(member);
    const savedMember = response?.document;
    if (!savedMember) {
      toast.error(
        editingMember
          ? "Failed to update team member"
          : "Failed to create team member",
      );
    } else {
      if (onTeamMembersChanged) {
        await onTeamMembersChanged();
      } else {
        setTeamMembers((current) => {
          if (editingMember) {
            return current.map((currentMember) =>
              currentMember.id === editingMember.id
                ? savedMember
                : currentMember,
            );
          }

          return [savedMember, ...current];
        });
      }

      toast.success(
        editingMember
          ? "Team member updated successfully"
          : "Team member created successfully",
      );
    }

    setEditingMember(null);
  };

  const openCreateDrawer = () => {
    setEditingMember(null);
    setDrawerOpen(true);
  };

  const openEditDrawer = (member) => {
    setEditingMember(member);
    setDrawerOpen(true);
  };

  return (
    <div className="px-2 py-2 space-y-2">
      {/* Team Header */}
      <section className="p-6 bg-white border border-gray-200 rounded-lg shadow-sm dark:border-slate-700 dark:bg-slate-800">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Team Management
            </h1>

            <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">
              Manage auditors and team access for {auditOrgName}
            </p>

            <div className="inline-flex items-center px-3 py-1 mt-3 text-sm font-medium text-blue-700 rounded-full bg-blue-50 dark:bg-blue-900/30 dark:text-blue-300">
              {(teamPagination?.total ?? teamMembers.length) || 0} member
              {(teamPagination?.total ?? teamMembers.length) !== 1 ? "s" : ""}
            </div>
          </div>

          <button
            onClick={openCreateDrawer}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-medium text-white shadow-md transition hover:scale-[1.01] hover:bg-primary/90"
          >
            <Users className="w-4 h-4" />
            Add member
          </button>
        </div>
      </section>

      {/* Default Password */}
      <section className="p-5 bg-white border border-gray-200 rounded-lg shadow-sm dark:border-slate-700 dark:bg-slate-800">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
              Default Password
            </h2>

            <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">
              Used when creating new team members. Resets on refresh.
            </p>
          </div>

          <div className="w-full max-w-md">
            <input
              id="default-password"
              type="password"
              value={defaultPassword}
              onChange={(event) => setDefaultPassword(event.target.value)}
              placeholder="Set default password"
              className="w-full rounded-xl border-2 border-gray-400 bg-white px-4 py-2.5 text-sm text-gray-900 shadow-sm outline-none transition focus:border-primary focus:ring-2 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
            />
          </div>
        </div>
      </section>

      {/* Team Members */}
      <section className="bg-white border border-gray-200 rounded-lg shadow-sm dark:border-slate-700 dark:bg-slate-800">
        <div className="p-6 border-b border-gray-200 dark:border-slate-700">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Team Members
              </h2>

              <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">
                Search and manage team members.
              </p>
            </div>

            <div className="w-full max-w-sm">
              <input
                id="team-member-search"
                type="search"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search by name, email or employee id"
                className="w-full rounded-xl border-2 border-gray-400 bg-white px-4 py-2.5 text-sm text-gray-900 shadow-sm outline-none transition focus:border-primary focus:ring-2 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 dark:bg-slate-700/50">
                <th className="px-6 py-4 text-xs font-semibold tracking-wider text-gray-500 uppercase">
                  Member
                </th>
                <th className="px-6 py-4 text-xs font-semibold tracking-wider text-gray-500 uppercase">
                  Email
                </th>
                <th className="px-6 py-4 text-xs font-semibold tracking-wider text-gray-500 uppercase">
                  Employee ID
                </th>
                <th className="px-6 py-4 text-xs font-semibold tracking-wider text-gray-500 uppercase">
                  Role
                </th>
                <th className="px-6 py-4 text-xs font-semibold tracking-wider text-gray-500 uppercase">
                  Status
                </th>
                <th className="px-6 py-4 text-xs font-semibold tracking-wider text-right text-gray-500 uppercase">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody>
              {isLoading ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-8 text-center text-gray-500"
                  >
                    Loading team members...
                  </td>
                </tr>
              ) : filteredTeamMembers.length > 0 ? (
                filteredTeamMembers.map((member) => {
                  const initials = (member.name || "")
                    .split(" ")
                    .slice(0, 2)
                    .map((part) => part[0])
                    .join("")
                    .toUpperCase();

                  return (
                    <tr
                      key={member.email}
                      className="transition border-t border-gray-100 hover:bg-gray-50 dark:border-slate-700 dark:hover:bg-slate-700/30"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center justify-center w-10 h-10 text-sm font-semibold rounded-full bg-primary/10 text-primary">
                            {initials}
                          </div>

                          <div>
                            <div className="font-medium text-gray-900 dark:text-white">
                              <UserName
                                name={member.name}
                                highlight={searchQuery}
                              />
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4 text-gray-600 dark:text-slate-300">
                        <UserEmail
                          email={member.email}
                          highlight={searchQuery}
                        />
                      </td>

                      <td className="px-6 py-4 text-gray-600 dark:text-slate-300">
                        <UserName name={member.empId} highlight={searchQuery} />
                        {console.log("member", member.empId)}
                        {console.log("searchQuery", searchQuery)}
                      </td>

                      <td className="px-6 py-4 text-gray-600 dark:text-slate-300">
                        {ROLE_OPTIONS[member.role] || member.role || "N/A"}
                      </td>

                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium ${
                            member.isActive
                              ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
                              : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300"
                          }`}
                        >
                          <span className="w-2 h-2 bg-current rounded-full" />
                          {member.isActive ? "Active" : "Suspended"}
                        </span>
                      </td>

                      <td className="flex justify-end px-6 py-4 text-right">
                        <button
                          type="button"
                          onClick={() => openEditDrawer(member)}
                          className="flex items-center justify-center gap-2 p-2 transition border border-gray-200 rounded-lg text-primary hover:bg-gray-100 dark:border-slate-600 dark:hover:bg-slate-700 bg-primary/20 "
                        >
                          Edit <Edit2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-10 text-center text-gray-500 dark:text-slate-400"
                  >
                    {normalizedSearchQuery
                      ? `No team members match "${searchQuery.trim()}".`
                      : `No team members found for ${auditOrgName}.`}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {teamPagination?.totalPages > 1 ? (
          <div className="flex flex-col gap-3 px-6 py-4 border-t border-gray-200 sm:flex-row sm:items-center sm:justify-between dark:border-slate-700">
            <p className="text-sm text-gray-500 dark:text-slate-400">
              Page {teamPagination.page} of {teamPagination.totalPages} ·{" "}
              {teamPagination.total} total members
            </p>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onPageChange?.(teamPagination.page - 1)}
                disabled={!teamPagination.hasPrevPage || isLoading}
                className="px-3 py-2 text-sm font-medium text-gray-700 transition border border-gray-200 rounded-lg hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-700"
              >
                Previous
              </button>
              <button
                type="button"
                onClick={() => onPageChange?.(teamPagination.page + 1)}
                disabled={!teamPagination.hasNextPage || isLoading}
                className="px-3 py-2 text-sm font-medium text-white transition rounded-lg bg-primary hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        ) : null}
      </section>
      {/* </div> */}

      <TeamMemberDrawer
        isOpen={isDrawerOpen}
        onClose={() => {
          setEditingMember(null);
          setDrawerOpen(false);
        }}
        defaultPassword={defaultPassword}
        existingEmails={
          editingMember
            ? existingEmails.filter((email) => email !== editingMember.email)
            : existingEmails
        }
        existingEmployeeIds={
          editingMember
            ? existingEmployeeIds.filter(
                (empId) => empId !== editingMember.empId,
              )
            : existingEmployeeIds
        }
        mode={editingMember ? "edit" : "create"}
        initialValues={editingMember}
        onSubmit={handleAddMember}
      />
    </div>
  );
}
