"use client";
import React, { useState, useEffect, useMemo } from "react";
import {
  Search,
  ArrowUp,
  ArrowDown,
  ChevronsUpDown,
  AlertTriangle,
  Eye,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { getFormerMembersOfCoop } from "../../lib/coopRmember";
import UserEmail from "../userComponent/UserEmail";
import UserName from "../userComponent/UserName";
import UserAvatar from "../userComponent/UserAvatar";

// Sortable table header component
const SortableTableHeader = ({ column, label, sortConfig, onSort }) => {
  const isSorted = sortConfig.key === column;
  const Icon = isSorted
    ? sortConfig.direction === "ascending"
      ? ArrowUp
      : ArrowDown
    : ChevronsUpDown;

  return (
    <th scope="col" className="px-6 py-3">
      <button
        onClick={() => onSort(column)}
        className="flex items-center gap-2 text-xs font-semibold text-gray-700 uppercase transition-colors dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
      >
        {label}
        <Icon size={14} className="opacity-50" />
      </button>
    </th>
  );
};

// Skeleton loader
const SkeletonLoader = () => (
  <div className="overflow-x-auto">
    <table className="w-full">
      <thead className="bg-gray-50 dark:bg-slate-700">
        <tr>
          <th className="px-6 py-5">
            <div className="w-24 h-4 bg-gray-200 rounded dark:bg-slate-600"></div>
          </th>
          <th className="px-6 py-5">
            <div className="w-20 h-4 bg-gray-200 rounded dark:bg-slate-600"></div>
          </th>
          <th className="px-6 py-5">
            <div className="w-16 h-4 bg-gray-200 rounded dark:bg-slate-600"></div>
          </th>
          <th className="px-6 py-5">
            <div className="w-12 h-4 bg-gray-200 rounded dark:bg-slate-600"></div>
          </th>
        </tr>
      </thead>
      <tbody className="animate-pulse">
        {[...Array(5)].map((_, i) => (
          <tr key={i} className="border-b dark:border-slate-700">
            <td className="px-6 py-4">
              <div className="flex items-center">
                <div className="w-8 h-8 mr-3 bg-gray-200 rounded-full dark:bg-slate-700"></div>
                <div>
                  <div className="h-4 bg-gray-200 rounded w-28 dark:bg-slate-700"></div>
                  <div className="h-3 mt-2 bg-gray-200 rounded w-36 dark:bg-slate-700"></div>
                </div>
              </div>
            </td>
            <td className="px-6 py-4">
              <div className="w-24 h-4 bg-gray-200 rounded dark:bg-slate-700"></div>
            </td>
            <td className="px-6 py-4">
              <div className="w-16 h-5 bg-gray-200 rounded-full dark:bg-slate-700"></div>
            </td>
            <td className="px-6 py-4">
              <div className="w-5 h-5 bg-gray-200 rounded-full dark:bg-slate-700"></div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const FormerMembersView = ({ selectedCoop }) => {
  const router = useRouter();
  const [members, setMembers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState({
    key: "name",
    direction: "ascending",
  });

  useEffect(() => {
    if (!selectedCoop) {
      setMembers([]);
      return;
    }
    const fetchFormerMembers = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await getFormerMembersOfCoop(selectedCoop);
        const formattedMembers = response.map((member) => ({
          id: member.userId,
          name: member.membername || "",
          email: member.memberemail || "",
          avatar: (member.membername || "NA")
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase(),
          exitDate: member.exitDate || null,
          role: "Former Member",
          status: "Former",
        }));
        setMembers(formattedMembers);
      } catch (err) {
        console.error("Failed to fetch former members:", err);
        setError("Could not load former member data. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchFormerMembers();
  }, [selectedCoop]);

  // Sorting and filtering logic
  const processedMembers = useMemo(() => {
    let sortableItems = [...members];

    if (searchTerm) {
      sortableItems = sortableItems.filter(
        (m) =>
          (m.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
          (m.email || "").toLowerCase().includes(searchTerm.toLowerCase()),
      );
    }

    if (sortConfig.key) {
      sortableItems.sort((a, b) => {
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];
        let comparison = 0;

        if (sortConfig.key === "exitDate") {
          const aTime = aValue ? new Date(aValue).getTime() : 0;
          const bTime = bValue ? new Date(bValue).getTime() : 0;
          comparison = aTime - bTime;
        } else {
          comparison = String(aValue).localeCompare(String(bValue));
        }

        return sortConfig.direction === "ascending" ? comparison : -comparison;
      });
    }
    return sortableItems;
  }, [members, searchTerm, sortConfig]);

  const handleSort = (key) => {
    let direction = "ascending";
    if (sortConfig.key === key && sortConfig.direction === "ascending") {
      direction = "descending";
    }
    setSortConfig({ key, direction });
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "-";
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return dateStr;
      return date.toLocaleDateString("de-DE", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      });
    } catch (e) {
      return dateStr;
    }
  };

  const renderContent = () => {
    if (isLoading) {
      return <SkeletonLoader />;
    }
    if (error) {
      return (
        <div className="py-10 text-center">
          <div className="flex flex-col items-center gap-2 text-red-500">
            <AlertTriangle size={32} />
            <span className="font-semibold">Error</span>
            <p className="text-gray-500 dark:text-gray-400">{error}</p>
          </div>
        </div>
      );
    }
    if (processedMembers.length === 0) {
      return (
        <div className="py-10 text-center text-gray-500 dark:text-gray-400">
          No former members found.
        </div>
      );
    }

    return (
      <>
        {/*====== DESKTOP TABLE ======*/}
        <div className="hidden overflow-x-auto md:block">
          <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
            <thead className="bg-gray-50 dark:bg-slate-700">
              <tr>
                <SortableTableHeader
                  column="name"
                  label="Member"
                  sortConfig={sortConfig}
                  onSort={handleSort}
                />
                <th
                  scope="col"
                  className="px-6 py-3 text-xs font-semibold text-gray-700 uppercase dark:text-gray-300"
                >
                  Status
                </th>
                <SortableTableHeader
                  column="exitDate"
                  label="Exit Date"
                  sortConfig={sortConfig}
                  onSort={handleSort}
                />
                {/* <th
                  scope="col"
                  className="px-6 py-3 text-xs font-semibold text-center text-gray-700 uppercase dark:text-gray-300"
                >
                  Actions
                </th> */}
              </tr>
            </thead>
            <tbody>
              {processedMembers.map((member) => (
                <tr
                  key={member.id}
                  className="transition-colors duration-200 bg-white border-b dark:bg-slate-800 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700/50"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <UserAvatar id={member.id} name={member.name} />
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">
                          <UserName id={member.id} name={member.name} />
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          <UserEmail id={member.id} email={member.email} />
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2.5 py-0.5 text-xs font-medium bg-red-100 text-red-700 dark:bg-red-700/30 dark:text-red-200 rounded-full">
                      Former
                    </span>
                  </td>
                  <td className="px-6 py-4 font-medium text-gray-800 whitespace-nowrap dark:text-gray-200">
                    {formatDate(member.exitDate)}
                  </td>
                  {/* <td className="px-6 py-4 text-center whitespace-nowrap">
                    <div className="flex items-center justify-center">
                      <button
                        onClick={() => router.push(`/memberDetails/${member.id}`)}
                        className="p-1.5 text-blue-600 rounded-full hover:bg-blue-50 dark:text-primary/80 dark:hover:bg-slate-700 transition-colors"
                        title="View Details"
                      >
                        <Eye size={18} />
                      </button>
                    </div>
                  </td> */}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/*====== MOBILE CARDS ======*/}
        <div className="divide-y divide-gray-200 md:hidden dark:divide-slate-700">
          {processedMembers.map((member) => (
            <div
              key={member.id}
              className="p-4 transition-colors duration-200 hover:bg-gray-50 dark:hover:bg-slate-700/50"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="flex items-center justify-center w-10 h-10 mr-4 text-sm font-bold text-red-700 bg-red-100 rounded-full dark:bg-red-900/30 dark:text-red-200 shrink-0">
                    {member.avatar}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {member.name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {member.email}
                    </p>
                  </div>
                </div>
                <span className="px-2 py-0.5 text-xs font-medium bg-red-100 text-red-700 dark:bg-red-700/30 dark:text-red-200 rounded-full">
                  Former
                </span>
              </div>
              <div className="flex items-center justify-between pt-3 mt-4 text-sm border-t border-gray-200 dark:border-slate-700">
                <span className="text-gray-500 dark:text-gray-400">
                  Exit Date
                </span>
                <span className="font-medium text-gray-800 dark:text-gray-200">
                  {formatDate(member.exitDate)}
                </span>
              </div>
              {/* <div className="flex justify-end mt-3">
                <button
                  onClick={() => router.push(`/memberDetails/${member.id}`)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 dark:bg-slate-700 dark:text-primary/80 rounded-md hover:bg-blue-100 dark:hover:bg-slate-600 transition-colors"
                >
                  <Eye size={14} />
                  View Profile
                </button>
              </div> */}
            </div>
          ))}
        </div>
      </>
    );
  };

  return (
    <div className="p-4 sm:p-6 animate-fadeIn">
      <div className="flex flex-col items-center gap-4 mb-4 sm:flex-row">
        <div className="relative flex-grow w-full">
          <Search className="absolute w-5 h-5 text-gray-400 -translate-y-1/2 left-3 top-1/2 dark:text-gray-500" />
          <input
            type="text"
            placeholder="Search former members..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary text-sm sm:text-base"
          />
        </div>
        <div className="w-full md:hidden">
          <select
            onChange={(e) => {
              const [key, direction] = e.target.value.split("-");
              setSortConfig({ key, direction });
            }}
            className="w-full p-2.5 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 h-[46px]"
          >
            <option value="name-ascending">Sort by Name (A-Z)</option>
            <option value="name-descending">Sort by Name (Z-A)</option>
            <option value="exitDate-descending">
              Sort by Exit Date (New-Old)
            </option>
            <option value="exitDate-ascending">
              Sort by Exit Date (Old-New)
            </option>
          </select>
        </div>
      </div>

      <div className="overflow-hidden bg-white border border-gray-200 rounded-lg shadow-md dark:bg-slate-800 dark:border-slate-700">
        {renderContent()}
      </div>
    </div>
  );
};

export default FormerMembersView;
