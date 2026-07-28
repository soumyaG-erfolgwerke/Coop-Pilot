"use client";
import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  Search,
  ArrowUp,
  ArrowDown,
  ChevronsUpDown,
  AlertTriangle,
  Eye,
  CheckCircle,
  XCircle,
  RefreshCcw,
  Filter,
  X,
  Mail,
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
  MoreHorizontal,
  Users,
  Euro,
  Clock,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { getMembersOfCoop } from "../../lib/transactionService";
import UserEmail from "../userComponent/UserEmail";
import UserName from "../userComponent/UserName";
import UserAvatar from "../userComponent/UserAvatar";
import UserKycStatus from "../userComponent/UserKycStatus";
import KycRejectionModal from "../modals/KycRejectionModal";
import KycApprovalModal from "../modals/KycApprovalModal";
import KycResubmissionModal from "../modals/KycResubmissionModal";

// A reusable header component for the sortable table
const SortableTableHeader = ({ column, label, sortConfig, onSort }) => {
  const isSorted = sortConfig.key === column;
  const Icon = isSorted
    ? sortConfig.direction === "ascending"
      ? ArrowUp
      : ArrowDown
    : ChevronsUpDown;

  return (
    <th scope="col" className="px-6 py-4">
      <button
        onClick={() => onSort(column)}
        className="flex items-center gap-1.5 text-xs font-bold tracking-wider text-slate-500 uppercase transition-colors dark:text-slate-400 hover:text-slate-905 dark:hover:text-white group"
      >
        {label}
        <Icon
          size={13}
          className={`transition-opacity duration-205 ${
            isSorted
              ? "opacity-100 text-blue-600 dark:text-blue-400"
              : "opacity-40 group-hover:opacity-75"
          }`}
        />
      </button>
    </th>
  );
};

// A skeleton loader component matching our new grid layout
const SkeletonLoader = () => (
  <div className="overflow-hidden bg-white border shadow-sm dark:bg-slate-800 rounded-2xl border-slate-200/80 dark:border-slate-800/80">
    <div className="hidden w-full border-b border-gray-150 dark:border-slate-700 bg-gray-50/50 dark:bg-slate-700/50 md:flex">
      <div className="flex justify-between w-full px-6 py-4">
        <div className="w-1/4 h-4 rounded bg-slate-200 dark:bg-slate-700 animate-pulse"></div>
        <div className="w-1/6 h-4 rounded bg-slate-200 dark:bg-slate-700 animate-pulse"></div>
        <div className="w-1/12 h-4 rounded bg-slate-200 dark:bg-slate-700 animate-pulse"></div>
        <div className="w-1/6 h-4 rounded bg-slate-200 dark:bg-slate-700 animate-pulse"></div>
        <div className="w-1/6 h-4 rounded bg-slate-200 dark:bg-slate-700 animate-pulse"></div>
      </div>
    </div>
    <div className="divide-y divide-slate-105 dark:divide-slate-800/80 animate-pulse">
      {[...Array(5)].map((_, i) => (
        <div
          key={i}
          className="flex flex-col justify-between gap-4 p-4 md:flex-row md:items-center md:px-6 md:py-5"
        >
          <div className="flex items-center w-full gap-3 md:w-1/3">
            <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 shrink-0"></div>
            <div className="w-full space-y-2">
              <div className="w-2/3 h-4 rounded bg-slate-200 dark:bg-slate-700"></div>
              <div className="w-1/2 h-3 rounded bg-slate-200 dark:bg-slate-700"></div>
            </div>
          </div>
          <div className="w-20 h-5 rounded bg-slate-200 dark:bg-slate-700 md:w-24"></div>
          <div className="w-12 h-4 rounded bg-slate-200 dark:bg-slate-700 md:w-16"></div>
          <div className="w-20 h-4 rounded bg-slate-200 dark:bg-slate-700 md:w-24"></div>
          <div className="w-24 h-6 rounded rounded-full bg-slate-200 dark:bg-slate-700"></div>
          <div className="h-8 rounded bg-slate-200 dark:bg-slate-700 w-28 md:w-32"></div>
        </div>
      ))}
    </div>
  </div>
);

const EmptyState = ({ onClear }) => (
  <div className="flex flex-col items-center justify-center px-4 py-16 text-center bg-white animate-fadeIn dark:bg-slate-900">
    <div className="flex items-center justify-center w-16 h-16 mb-4 border-2 border-dashed text-slate-400 bg-slate-50 dark:bg-slate-805 dark:text-slate-500 rounded-2xl border-slate-200 dark:border-slate-800 animate-scaleIn">
      <Search size={28} />
    </div>
    <h3 className="text-lg font-bold text-slate-850 dark:text-white">
      No members found
    </h3>
    <p className="max-w-xs mt-2 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
      We couldn't find any members matching your current search term or filter
      parameters.
    </p>
    <button
      onClick={onClear}
      className="mt-6 px-5 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 dark:bg-primary dark:hover:bg-primary/95 rounded-xl shadow-sm hover:shadow active:scale-[0.98] transition-all"
    >
      Reset Search & Filters
    </button>
  </div>
);

const MemberDirectoryView = ({ selectedCoop }) => {
  const router = useRouter();

  // State management
  const [members, setMembers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filterField, setFilterField] = useState("kycStatus");
  const [filterOp, setFilterOp] = useState("Equals");
  const [filterVal, setFilterVal] = useState("");
  const [appliedFilterField, setAppliedFilterField] = useState("kycStatus");
  const [appliedFilterOp, setAppliedFilterOp] = useState("Equals");
  const [appliedFilterVal, setAppliedFilterVal] = useState("");
  const [sortConfig, setSortConfig] = useState({
    key: "name",
    direction: "ascending",
  });

  // Expandable cards for mobile view
  const [expandedMemberId, setExpandedMemberId] = useState(null);
  // Copy to clipboard indicator status
  const [copiedId, setCopiedId] = useState(null);

  // Keyboard shortcut input focus
  const searchInputRef = useRef(null);
  // Row actions open dropdown tracking
  const [openMenuId, setOpenMenuId] = useState(null);

  // Modal State for KYC Rejection
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [activeRejectUserId, setActiveRejectUserId] = useState(null);

  // Modal State for KYC Approval
  const [isApproveConfirmOpen, setIsApproveConfirmOpen] = useState(false);
  const [activeApproveUserId, setActiveApproveUserId] = useState(null);

  // Modal State for KYC Resubmission
  const [isResubmitModalOpen, setIsResubmitModalOpen] = useState(false);
  const [activeResubmitUserId, setActiveResubmitUserId] = useState(null);

  const filterRef = useRef(null);

  // Close filter popover on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (filterRef.current && !filterRef.current.contains(event.target)) {
        setIsFilterOpen(false);
      }
    }
    if (isFilterOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isFilterOpen]);

  // Close open row menus when clicking outside
  useEffect(() => {
    const handleCloseMenus = () => setOpenMenuId(null);
    if (openMenuId) {
      document.addEventListener("click", handleCloseMenus);
    }
    return () => document.removeEventListener("click", handleCloseMenus);
  }, [openMenuId]);

  // Keyboard shortcut listener (/ or Ctrl+K to search)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.key === "k" && (e.metaKey || e.ctrlKey)) || e.key === "/") {
        if (document.activeElement !== searchInputRef.current) {
          e.preventDefault();
          searchInputRef.current?.focus();
        }
      }
      if (e.key === "Escape") {
        if (document.activeElement === searchInputRef.current) {
          searchInputRef.current?.blur();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Data fetching and processing effect
  useEffect(() => {
    if (!selectedCoop) {
      setMembers([]);
      return;
    }
    const fetchMemberInfo = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await getMembersOfCoop(selectedCoop);
        const formattedMembers = response.map((member) => ({
          id: member.userId,
          name: member.membername || "",
          email: member.email || member.memberemail || "",
          avatar: (member.membername || "NA")
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase(),
          shares: member.totalShares,
          totalprice: member.totalPrice,
          kycStatus: member.kycStatus,
          role: "Member",
          status: "active",
        }));
        setMembers(formattedMembers);
      } catch (err) {
        console.error("Failed to fetch member info:", err);
        setError("Could not load member data. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchMemberInfo();
  }, [selectedCoop]);

  // Memoized metrics
  const metrics = useMemo(() => {
    const total = members.length;
    const verified = members.filter((m) => m.kycStatus === "VERIFIED").length;
    const pending = members.filter((m) => m.kycStatus === "PENDING").length;
    const rate = total ? Math.round((verified / total) * 100) : 0;
    const capital = members.reduce(
      (sum, m) => sum + (Number(m.totalprice) || 0),
      0,
    );
    return { total, verified, pending, rate, capital };
  }, [members]);

  // Memoized sorting and filtering logic
  const processedMembers = useMemo(() => {
    let sortableItems = [...members];

    if (appliedFilterVal) {
      sortableItems = sortableItems.filter((m) => {
        let status = "";
        if (appliedFilterField === "kycStatus") {
          status = (m.kycStatus || "PENDING").toUpperCase();
        } else if (appliedFilterField === "status") {
          status = (m.status || "").toUpperCase();
        }

        const filterValues = appliedFilterVal
          .toUpperCase()
          .split(",")
          .map((v) => v.trim())
          .filter((v) => !!v);

        if (appliedFilterOp === "Equals") {
          return filterValues.includes(status);
        } else {
          return !filterValues.includes(status);
        }
      });
    }

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
        if (typeof aValue === "number" && typeof bValue === "number") {
          comparison = aValue - bValue;
        } else {
          comparison = String(aValue).localeCompare(String(bValue));
        }
        return sortConfig.direction === "ascending" ? comparison : -comparison;
      });
    }
    return sortableItems;
  }, [
    members,
    searchTerm,
    sortConfig,
    appliedFilterField,
    appliedFilterVal,
    appliedFilterOp,
  ]);

  const handleKycAction = async (targetUserId, action) => {
    setOpenMenuId(null);
    if (action === "reject") {
      setActiveRejectUserId(targetUserId);
      setIsRejectModalOpen(true);
      return;
    }

    if (action === "accept") {
      setActiveApproveUserId(targetUserId);
      setIsApproveConfirmOpen(true);
      return;
    }

    if (action === "resubmit") {
      setActiveResubmitUserId(targetUserId);
      setIsResubmitModalOpen(true);
      return;
    }
  };

  const onKycSuccess = () => {
    setIsApproveConfirmOpen(false);
    setIsRejectModalOpen(false);
    setIsResubmitModalOpen(false);
    router.refresh();
  };

  const handleSort = (key) => {
    let direction = "ascending";
    if (sortConfig.key === key && sortConfig.direction === "ascending") {
      direction = "descending";
    }
    setSortConfig({ key, direction });
  };

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const navigateToCompose = (email = "", salutation = "", lastName = "") => {
    const params = new URLSearchParams();
    params.set("tab", "mails");
    params.set("compose", "true");
    params.set("email", email);
    params.set("salutation", salutation);
    params.set("lastName", lastName);
    params.set("template", "MANUAL_INDIVIDUAL");
    router.push(`/admin?${params.toString()}`);
  };

  const handleSendEmail = async (member) => {
    setOpenMenuId(null);
    try {
      const res = await fetch(
        `/api/userDetails/${member.id}?coopId=${selectedCoop}`,
      );
      const data = await res.json();
      if (data.success) {
        const u = data.user;
        navigateToCompose(
          u.contactEmail || member.email || "",
          u.salutation || "",
          u.LastName || "",
        );
      } else {
        const parts = member.name.split(" ");
        const lastName = parts[parts.length - 1] || "";
        navigateToCompose(member.email || "", "", lastName);
      }
    } catch (err) {
      console.error("Failed to load user details for message:", err);
      const parts = member.name.split(" ");
      const lastName = parts[parts.length - 1] || "";
      navigateToCompose(member.email || "", "", lastName);
    }
  };

  const formatPrice = (price) => {
    if (price === undefined || price === null) return "€0,00";
    const num = typeof price === "number" ? price : parseFloat(price);
    if (isNaN(num)) return price;
    return new Intl.NumberFormat("de-DE", {
      style: "currency",
      currency: "EUR",
    }).format(num);
  };

  const renderStatusBadge = (status) => {
    switch (status) {
      case "active":
        return (
          <span className="px-2.5 py-1 text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-305 rounded-full border border-emerald-100 dark:border-emerald-900/30 shadow-sm transition-all duration-300">
            Active
          </span>
        );
      case "NoticeGiven":
        return (
          <span className="px-2.5 py-1 text-xs font-semibold bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 rounded-full border border-rose-100 dark:border-rose-900/30 shadow-sm transition-all duration-300">
            Notice Given
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 text-xs font-semibold bg-slate-50 text-slate-700 dark:bg-slate-900/40 dark:text-slate-350 rounded-full border border-slate-200 dark:border-slate-800 shadow-sm transition-all duration-300">
            {status}
          </span>
        );
    }
  };

  const clearFilters = () => {
    setFilterField("kycStatus");
    setFilterVal("");
    setFilterOp("Equals");
    setAppliedFilterField("kycStatus");
    setAppliedFilterVal("");
    setAppliedFilterOp("Equals");
    setIsFilterOpen(false);
    setSearchTerm("");
  };

  const renderContent = () => {
    if (isLoading) {
      return <SkeletonLoader />;
    }
    if (error) {
      return (
        <div className="py-16 text-center bg-white animate-fadeIn dark:bg-slate-900">
          <div className="flex flex-col items-center max-w-sm gap-3 px-4 mx-auto text-red-500">
            <div className="p-4 border bg-red-50 dark:bg-red-950/20 rounded-2xl border-red-150 dark:border-red-900/30">
              <AlertTriangle size={32} />
            </div>
            <h3 className="mt-1 text-lg font-bold text-slate-850 dark:text-white">
              Failed to load data
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {error}
            </p>
            <button
              onClick={() => router.refresh()}
              className="px-4 py-2 mt-2 text-xs font-bold transition-all bg-red-100 shadow-sm text-red-750 hover:bg-red-200 dark:bg-red-950/40 dark:text-red-300 rounded-xl"
            >
              Retry Connection
            </button>
          </div>
        </div>
      );
    }
    if (processedMembers.length === 0) {
      return <EmptyState onClear={clearFilters} />;
    }

    return (
      <div className="w-full">
        {/*====== DESKTOP TABLE (Hidden on mobile) ======*/}
        <div className="hidden overflow-x-auto md:block">
          <table className="w-full text-sm text-left border-collapse text-slate-605 dark:text-slate-400">
            <thead className="border-b bg-slate-50/80 dark:bg-slate-800/40 border-slate-150 dark:border-slate-800">
              <tr>
                <SortableTableHeader
                  column="name"
                  label="Member Name"
                  sortConfig={sortConfig}
                  onSort={handleSort}
                />
                <th
                  scope="col"
                  className="px-6 py-4 text-xs font-bold tracking-wider uppercase text-slate-500 dark:text-slate-400"
                >
                  Account Status
                </th>
                <SortableTableHeader
                  column="shares"
                  label="Shares"
                  sortConfig={sortConfig}
                  onSort={handleSort}
                />
                <SortableTableHeader
                  column="totalprice"
                  label="Total Capital"
                  sortConfig={sortConfig}
                  onSort={handleSort}
                />
                <th
                  scope="col"
                  className="px-6 py-4 text-xs font-bold tracking-wider text-center uppercase text-slate-500 dark:text-slate-400"
                >
                  KYC Verification
                </th>
                <th
                  scope="col"
                  className="px-6 py-4 text-xs font-bold tracking-wider text-center uppercase text-slate-505 dark:text-slate-400 animate-none"
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-150 dark:divide-slate-800/60 dark:bg-slate-900">
              {processedMembers.map((member) => (
                <tr
                  key={member.id}
                  className="transition-all duration-150 bg-white dark:bg-slate-900 hover:bg-slate-50/50 dark:hover:bg-slate-800/20"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <UserAvatar id={member.id} name={member.name} size={38} />
                      <div className="min-w-0 ml-1">
                        <div className="font-semibold text-slate-900 dark:text-white text-sm sm:text-base leading-tight truncate max-w-[200px]">
                          <UserName
                            id={member.id}
                            name={member.name}
                            highlight={searchTerm}
                          />
                        </div>
                        <div className="text-xs text-slate-400 dark:text-slate-500 truncate max-w-[200px] mt-0.5">
                          <UserEmail
                            id={member.id}
                            email={member.email}
                            highlight={searchTerm}
                          />
                        </div>
                      </div>
                    </div>
                  </td>

                  <td className="px-6 py-4 text-center whitespace-nowrap">
                    {renderStatusBadge(member.status)}
                  </td>
                  <td className="px-6 py-4 font-mono font-bold text-center text-slate-800 dark:text-slate-205">
                    {member.shares}
                  </td>
                  <td className="px-6 py-4 font-semibold text-center text-slate-900 dark:text-slate-100 whitespace-nowrap">
                    {formatPrice(member.totalprice)}
                  </td>
                  <td className="px-6 py-4 text-center whitespace-nowrap">
                    <UserKycStatus id={member.id} status={member.kycStatus} />
                  </td>
                  <td className="px-6 py-4 text-center whitespace-nowrap">
                    <div className="flex items-center justify-center gap-2">
                      {/* Primary View Profile Link */}
                      <button
                        onClick={() =>
                          router.push(
                            `/memberDetails/${member.id}?coopId=${selectedCoop}`,
                          )
                        }
                        className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-750 dark:border-slate-700 dark:text-slate-200 transition-all shadow-sm active:scale-[0.98]"
                      >
                        View Profile
                      </button>

                      {/* Dropdown triggers for all secondary actions */}
                      <div className="">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setIsFilterOpen(false); // Close filter popover
                            setOpenMenuId(
                              openMenuId === member.id ? null : member.id,
                            );
                          }}
                          className={`p-1.5 rounded-lg border transition-colors ${
                            openMenuId === member.id
                              ? "bg-slate-100 border-slate-300 text-slate-800 dark:bg-slate-800 dark:border-slate-600 dark:text-white"
                              : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-750 dark:bg-slate-900 dark:border-slate-805 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                          }`}
                          title="More actions"
                        >
                          <MoreHorizontal size={14} />
                        </button>

                        {openMenuId === member.id && (
                          <div className="absolute right-0 mt-1.5 w-[190px] bg-white dark:bg-[#121214] border border-slate-200 dark:border-slate-850 rounded-xl shadow-xl z-30 py-1 text-left animate-scaleIn">
                            <button
                              onClick={() => handleSendEmail(member)}
                              className="w-full px-4 py-2.5 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60 flex items-center gap-2.5 transition-colors"
                            >
                              <Mail
                                size={14}
                                className="text-indigo-505 shrink-0"
                              />
                              <span>Send Email</span>
                            </button>

                            {member.kycStatus !== "PENDING" && (
                              <button
                                onClick={() =>
                                  handleKycAction(member.id, "resubmit")
                                }
                                className="w-full px-4 py-2.5 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60 flex items-center gap-2.5 transition-colors"
                              >
                                <RefreshCcw
                                  size={14}
                                  className="text-amber-500 shrink-0"
                                />
                                <span>Request Resubmit</span>
                              </button>
                            )}

                            {member.kycStatus === "PENDING" && (
                              <>
                                <div className="my-1 border-t border-slate-150 dark:border-slate-800/60"></div>
                                <button
                                  onClick={() =>
                                    handleKycAction(member.id, "accept")
                                  }
                                  className="w-full px-4 py-2.5 text-xs font-semibold text-green-700 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-950/20 flex items-center gap-2.5 transition-colors"
                                >
                                  <CheckCircle size={14} className="shrink-0" />
                                  <span>Approve KYC</span>
                                </button>
                                <button
                                  onClick={() =>
                                    handleKycAction(member.id, "reject")
                                  }
                                  className="w-full px-4 py-2.5 text-xs font-semibold text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 flex items-center gap-2.5 transition-colors"
                                >
                                  <XCircle size={14} className="shrink-0" />
                                  <span>Reject KYC</span>
                                </button>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/*====== MOBILE CARDS (Hidden on desktop) ======*/}
        <div className="bg-white divide-y divide-slate-150 dark:divide-slate-800/80 md:hidden dark:bg-slate-900">
          {processedMembers.map((member) => {
            const isExpanded = expandedMemberId === member.id;
            return (
              <div
                key={member.id}
                className={`transition-all duration-200 ${
                  isExpanded
                    ? "bg-slate-50/50 dark:bg-slate-850/20 shadow-inner"
                    : "hover:bg-slate-50/30 dark:hover:bg-slate-800/10"
                }`}
              >
                {/* Card Header (Always Visible) */}
                <div
                  onClick={() =>
                    setExpandedMemberId(isExpanded ? null : member.id)
                  }
                  className="flex items-center justify-between p-4 cursor-pointer select-none"
                >
                  <div className="flex items-center min-w-0">
                    <div className="mr-3 shrink-0">
                      <UserAvatar id={member.id} name={member.name} size={40} />
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-semibold leading-snug truncate text-slate-900 dark:text-white sm:text-base">
                        <UserName
                          id={member.id}
                          name={member.name}
                          highlight={searchTerm}
                        />
                      </div>
                      <div className="flex items-center gap-1.5 mt-0.5 text-xs text-slate-500 dark:text-slate-450">
                        <span className="font-semibold text-slate-700 dark:text-slate-300">
                          {member.shares}{" "}
                          {member.shares === 1 ? "share" : "shares"}
                        </span>
                        <span>•</span>
                        <span>{member.role}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right">
                      <UserKycStatus id={member.id} status={member.kycStatus} />
                    </div>
                    <div className="p-1 transition-colors rounded-lg text-slate-400 dark:text-slate-550 hover:bg-slate-100 dark:hover:bg-slate-805">
                      {isExpanded ? (
                        <ChevronUp size={18} />
                      ) : (
                        <ChevronDown size={18} />
                      )}
                    </div>
                  </div>
                </div>

                {/* Expanded Details Panel */}
                {isExpanded && (
                  <div className="px-4 pt-2 pb-5 text-xs border-t border-slate-100 dark:border-slate-800/40 bg-slate-50/30 dark:bg-slate-950/20 sm:text-sm animate-fadeIn">
                    <div className="grid grid-cols-1 gap-3 mb-4 sm:grid-cols-2">
                      <div>
                        <span className="text-slate-400 dark:text-slate-500 block mb-0.5 font-medium">
                          Email Address
                        </span>
                        <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                          <span className="font-medium truncate max-w-[200px] sm:max-w-xs">
                            <UserEmail
                              id={member.id}
                              email={member.email}
                              highlight={searchTerm}
                            />
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              copyToClipboard(member.email, member.id);
                            }}
                            className="p-1 transition-colors rounded-md text-slate-400 hover:text-slate-650 dark:hover:text-slate-205 hover:bg-slate-150 dark:hover:bg-slate-850"
                            title="Copy Email"
                          >
                            {copiedId === member.id ? (
                              <Check
                                size={14}
                                className="text-green-500 animate-scaleIn"
                              />
                            ) : (
                              <Copy size={14} />
                            )}
                          </button>
                        </div>
                      </div>

                      <div>
                        <span className="text-slate-400 dark:text-slate-500 block mb-0.5 font-medium">
                          Total Capital:{" "}
                          <span className="font-semibold text-slate-800 dark:text-slate-200">
                            {formatPrice(member.totalprice)}
                          </span>
                        </span>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="text-slate-400 dark:text-slate-500 block mb-0.5 font-medium">
                          Account Status: {renderStatusBadge(member.status)}
                        </span>
                      </div>
                    </div>

                    {/* Actions Grid */}
                    <div className="pt-3 border-t border-slate-150 dark:border-slate-800/40">
                      <span className="block mb-2 text-xs font-bold tracking-wider uppercase text-slate-400 dark:text-slate-500">
                        Member Actions
                      </span>
                      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                        <button
                          onClick={() =>
                            router.push(
                              `/memberDetails/${member.id}?coopId=${selectedCoop}`,
                            )
                          }
                          className="flex items-center justify-center gap-2 p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-750 dark:text-slate-250 hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors font-medium shadow-sm active:scale-[0.98]"
                        >
                          <Eye size={16} className="text-blue-500 shrink-0" />
                          <span>View Profile</span>
                        </button>
                        <button
                          onClick={() => handleSendEmail(member)}
                          className="flex items-center justify-center gap-2 p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-750 dark:text-slate-250 hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors font-medium shadow-sm active:scale-[0.98]"
                        >
                          <Mail
                            size={16}
                            className="text-indigo-500 shrink-0"
                          />
                          <span>Send Email</span>
                        </button>
                        <button
                          onClick={() => handleKycAction(member.id, "resubmit")}
                          className="flex items-center justify-center gap-2 p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-750 dark:text-slate-250 hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors font-medium shadow-sm active:scale-[0.98]"
                        >
                          <RefreshCcw
                            size={16}
                            className="text-amber-505 shrink-0"
                          />
                          <span>Resubmit KYC</span>
                        </button>
                        {member.kycStatus === "PENDING" && (
                          <>
                            <button
                              onClick={() =>
                                handleKycAction(member.id, "accept")
                              }
                              className="flex items-center justify-center gap-2 p-2.5 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900 rounded-xl text-green-700 dark:text-green-400 hover:bg-green-100/70 dark:hover:bg-green-950/40 transition-colors font-semibold shadow-sm col-span-2 sm:col-span-1 active:scale-[0.98]"
                            >
                              <CheckCircle size={16} className="shrink-0" />
                              <span>Approve KYC</span>
                            </button>
                            <button
                              onClick={() =>
                                handleKycAction(member.id, "reject")
                              }
                              className="flex items-center justify-center gap-2 p-2.5 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 rounded-xl text-red-700 dark:text-red-400 hover:bg-red-100/70 dark:hover:bg-red-950/40 transition-colors font-semibold shadow-sm col-span-2 sm:col-span-1 active:scale-[0.98]"
                            >
                              <XCircle size={16} className="shrink-0" />
                              <span>Reject KYC</span>
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* KYC Modals */}
        <KycRejectionModal
          isOpen={isRejectModalOpen}
          onClose={() => setIsRejectModalOpen(false)}
          onSuccess={onKycSuccess}
          userId={activeRejectUserId}
          coopId={selectedCoop}
        />

        <KycApprovalModal
          isOpen={isApproveConfirmOpen}
          onClose={() => setIsApproveConfirmOpen(false)}
          onSuccess={onKycSuccess}
          userId={activeApproveUserId}
          coopId={selectedCoop}
        />

        <KycResubmissionModal
          isOpen={isResubmitModalOpen}
          onClose={() => setIsResubmitModalOpen(false)}
          onSuccess={onKycSuccess}
          userId={activeResubmitUserId}
          coopId={selectedCoop}
        />
      </div>
    );
  };

  return (
    <div className="p-4 space-y-5 sm:p-6 animate-fadeIn">
      {/* Directory Title Header */}
      <div className="flex flex-col gap-4 pb-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold leading-none tracking-tight sm:text-3xl text-slate-900 dark:text-white">
            Member Directory
          </h1>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            Manage your cooperative's member roster, track KYC verification
            status, and review total share investments.
          </p>
        </div>

        <button
          onClick={() => {
            const params = new URLSearchParams();
            params.set("tab", "mails");
            params.set("compose", "true");
            params.set("template", "MANUAL_ALL_MEMBERS");
            router.push(`/admin?${params.toString()}`);
          }}
          className="flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-bold text-white bg-slate-900 hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 rounded-xl shadow-md active:scale-[0.98] transition-all h-[44px] whitespace-nowrap self-start sm:self-center shrink-0"
          title="Nachricht an alle Mitglieder"
        >
          <Mail size={16} />
          <span>Message All Members</span>
        </button>
      </div>

      {/* KPI Cards Section */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Members */}
        <div className="flex items-center justify-between p-5 transition-all duration-300 border shadow-sm bg-white/50 dark:bg-slate-800/40 border-slate-200/80 dark:border-slate-700/80 backdrop-blur-md rounded-2xl hover:shadow-md group">
          <div className="space-y-1">
            <span className="text-xs font-bold tracking-wider uppercase text-slate-400 dark:text-slate-500">
              Total Roster
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-semibold leading-tight text-slate-850 dark:text-white">
                {metrics.total}
              </span>
              <span className="text-xs font-semibold text-emerald-650 dark:text-emerald-400">
                active
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Members registered in coop
            </p>
          </div>
          <div className="p-3 text-blue-600 transition-transform duration-300 bg-blue-50 dark:bg-blue-950/40 dark:text-blue-400 rounded-2xl shrink-0 group-hover:scale-110">
            <Users size={22} />
          </div>
        </div>

        {/* Verification Rate with Progress Bar */}
        <div className="flex flex-col justify-between p-5 transition-all duration-300 border shadow-sm bg-white/50 dark:bg-slate-800/40 border-slate-200/80 dark:border-slate-700/80 backdrop-blur-md rounded-2xl hover:shadow-md group">
          <div className="flex items-center justify-between w-full mb-2">
            <div className="space-y-1">
              <span className="text-xs font-semibold tracking-wider uppercase text-slate-400 dark:text-slate-500">
                Verification Rate
              </span>
              <span className="block text-3xl font-semibold leading-tight text-slate-850 dark:text-white">
                {metrics.rate}%
              </span>
            </div>
            <div className="p-3 transition-transform duration-300 bg-emerald-50 text-emerald-650 dark:bg-emerald-950/40 dark:text-emerald-400 rounded-2xl shrink-0 group-hover:scale-110">
              <CheckCircle size={22} />
            </div>
          </div>
          <div className="space-y-1.5 w-full">
            <div className="w-full h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-850">
              <div
                className="h-full transition-all duration-500 rounded-full bg-emerald-500"
                style={{ width: `${metrics.rate}%` }}
              ></div>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {metrics.verified} of {metrics.total} verified
            </p>
          </div>
        </div>

        {/* Total Share Capital */}
        <div className="flex items-center justify-between p-5 transition-all duration-300 border shadow-sm bg-white/50 dark:bg-slate-800/40 border-slate-200/80 dark:border-slate-700/80 backdrop-blur-md rounded-2xl hover:shadow-md group">
          <div className="space-y-1">
            <span className="text-xs font-semibold tracking-wider uppercase text-slate-400 dark:text-slate-500">
              Share Capital
            </span>
            <span className="block text-2xl font-semibold leading-tight sm:text-3xl text-slate-850 dark:text-white">
              {formatPrice(metrics.capital)}
            </span>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Total member investments
            </p>
          </div>
          <div className="p-3 transition-transform duration-300 bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400 rounded-2xl shrink-0 group-hover:scale-110">
            <Euro size={22} />
          </div>
        </div>

        {/* Pending Verification Reviews */}
        <div className="flex items-center justify-between p-5 transition-all duration-300 border shadow-sm bg-white/50 dark:bg-slate-800/40 border-slate-200/80 dark:border-slate-700/80 backdrop-blur-md rounded-2xl hover:shadow-md group">
          <div className="space-y-1">
            <span className="text-xs font-semibold tracking-wider uppercase text-slate-400 dark:text-slate-500">
              Pending KYC
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-semibold leading-tight text-slate-850 dark:text-white">
                {metrics.pending}
              </span>
              {metrics.pending > 0 && (
                <span className="text-xs font-bold text-amber-600 dark:text-amber-450 animate-pulse">
                  requires review
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              KYC applications in queue
            </p>
          </div>
          <div className="p-3 transition-transform duration-300 bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-450 rounded-2xl shrink-0 group-hover:scale-110">
            <Clock size={22} />
          </div>
        </div>
      </div>

      {/* Search and Filters panel */}
      <div className="relative z-30 flex flex-col justify-between gap-3 p-0 font-sans sm:flex-row sm:items-center backdrop-blur-md">
        {/* Modern Search bar with Keyboard Shortcut Hint */}
        <div className="relative flex-grow">
          <Search className="absolute w-4.5 h-4.5 text-slate-400 dark:text-slate-500 -translate-y-1/2 left-3.5 top-1/2 transition-colors pointer-events-none" />
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Search members by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-11 pr-16 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-white/80 dark:bg-slate-900/50 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 dark:focus:ring-blue-500/20 text-sm sm:text-base transition-all"
          />
          <div className="absolute right-3.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5 pointer-events-none select-none">
            {searchTerm ? (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setSearchTerm("");
                }}
                className="pointer-events-auto text-slate-400 hover:text-slate-650 dark:hover:text-slate-300 p-0.5 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
              >
                <X size={14} />
              </button>
            ) : (
              <span className="hidden sm:inline-flex items-center px-1.5 py-0.5 text-[10px] font-semibold text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700 shadow-sm">
                /
              </span>
            )}
          </div>
        </div>

        {/* Filter Popover Container */}
        <div className="relative z-20 w-auto" ref={filterRef}>
          <button
            onClick={() => {
              setOpenMenuId(null); // Close any open row menus
              setIsFilterOpen(!isFilterOpen);
            }}
            className={`flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold border rounded-xl shadow-sm h-[44px] w-full sm:w-auto transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/30 ${
              isFilterOpen || appliedFilterVal
                ? "bg-blue-50 border-blue-200 text-blue-600 dark:bg-blue-950/40 dark:border-blue-900/60 dark:text-blue-300"
                : "bg-white border-slate-200 text-slate-750 dark:bg-slate-900 dark:text-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
            }`}
          >
            <Filter size={16} />
            <span>Filters</span>
            {appliedFilterVal && (
              <span className="flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-blue-600 rounded-full dark:bg-blue-500 animate-scaleIn">
                1
              </span>
            )}
          </button>

          {isFilterOpen && (
            <div className="absolute right-0 z-100 w-[300px] sm:w-[420px] p-5 mt-2 bg-white dark:bg-[#121214] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl animate-fadeIn text-sm">
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-150 dark:border-slate-800">
                <h4 className="flex items-center gap-2 font-bold text-slate-900 dark:text-white">
                  <Filter size={16} className="text-slate-405" />
                  <span>Filter Members</span>
                </h4>
                <button
                  onClick={() => setIsFilterOpen(false)}
                  className="p-1 transition-colors rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5">
                      Field
                    </label>
                    <select
                      value={filterField}
                      onChange={(e) => {
                        setFilterField(e.target.value);
                        setFilterVal("");
                      }}
                      className="w-full px-3 py-2 text-sm border bg-slate-50 dark:bg-slate-900 rounded-xl border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-505/30 dark:text-gray-205"
                    >
                      <option value="kycStatus">KYC Status</option>
                      <option value="status">Account Status</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5">
                      Condition
                    </label>
                    <select
                      value={filterOp}
                      onChange={(e) => setFilterOp(e.target.value)}
                      className="w-full px-3 py-2 text-sm border bg-slate-50 dark:bg-slate-900 rounded-xl border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/30 dark:text-gray-200"
                    >
                      <option value="Equals">Equals</option>
                      <option value="Not Equals">Is Not</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5">
                    Value
                  </label>
                  {filterField === "kycStatus" ? (
                    <select
                      value={filterVal}
                      onChange={(e) => setFilterVal(e.target.value)}
                      className="w-full px-3 py-2 text-sm border bg-slate-50 dark:bg-slate-900 rounded-xl border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/30 dark:text-gray-200"
                    >
                      <option value="">Any KYC Status</option>
                      <option value="PENDING">Pending</option>
                      <option value="VERIFIED">Verified</option>
                      <option value="REJECTED">Rejected</option>
                      <option value="RESUBMISSION_REQUIRED">
                        Resubmission Required
                      </option>
                    </select>
                  ) : (
                    <select
                      value={filterVal}
                      onChange={(e) => setFilterVal(e.target.value)}
                      className="w-full px-3 py-2 text-sm border bg-slate-50 dark:bg-slate-900 rounded-xl border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/30 dark:text-gray-200"
                    >
                      <option value="">Any Status</option>
                      <option value="Active">Active</option>
                      <option value="NoticeGiven">Notice Given</option>
                    </select>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 mt-5 border-t border-slate-150 dark:border-slate-800">
                <button
                  onClick={clearFilters}
                  className="px-4 py-2 text-sm font-semibold transition-colors text-slate-405 hover:text-slate-605 dark:text-slate-500 dark:hover:text-slate-300 focus:outline-none hover:bg-gray-200/50 dark:hover:bg-gray-900/50 rounded-xl"
                >
                  Clear Filters
                </button>
                <button
                  onClick={() => {
                    setAppliedFilterField(filterField);
                    setAppliedFilterVal(filterVal);
                    setAppliedFilterOp(filterOp);
                    setIsFilterOpen(false);
                  }}
                  className="px-5 py-2 text-sm font-bold text-white bg-blue-600 dark:bg-blue-600 hover:bg-blue-700 dark:hover:bg-blue-500 rounded-xl transition-all shadow-sm active:scale-[0.98] focus:outline-none"
                >
                  Apply Filters
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Active Filter Chips Row */}
      {appliedFilterVal && (
        <div className="flex flex-wrap gap-2 p-3 border shadow-inner bg-blue-50/20 dark:bg-slate-800/10 border-slate-200/60 dark:border-slate-808/60 rounded-2xl animate-fadeIn">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 rounded-xl border border-blue-150 dark:border-blue-900/40 shadow-sm">
            <Filter size={12} className="opacity-70 shrink-0" />
            <span>
              {appliedFilterField === "kycStatus"
                ? "KYC Status"
                : "Account Status"}{" "}
              <span className="font-normal text-slate-400 dark:text-slate-500">
                {appliedFilterOp === "Equals" ? "equals" : "is not"}
              </span>{" "}
              <span className="font-bold">{appliedFilterVal}</span>
            </span>
            <button
              onClick={clearFilters}
              className="p-0.5 hover:bg-blue-150 dark:hover:bg-blue-900/50 rounded-full transition-colors ml-1 shrink-0"
              title="Remove filter"
            >
              <X size={12} />
            </button>
          </span>
        </div>
      )}

      {/* Sort selection for mobile view only */}
      <div className="w-full md:hidden">
        <select
          onChange={(e) => {
            const [key, direction] = e.target.value.split("-");
            setSortConfig({ key, direction });
          }}
          className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 text-sm h-[44px]"
        >
          <option value="name-ascending">Sort by Name (A-Z)</option>
          <option value="name-descending">Sort by Name (Z-A)</option>
          <option value="shares-descending">Sort by Shares (High-Low)</option>
          <option value="shares-ascending">Sort by Shares (Low-High)</option>
        </select>
      </div>

      {/* Main Container for Table / Mobile Cards */}
      <div className="overflow-hidden bg-white border shadow-sm dark:bg-slate-900 border-slate-200/80 dark:border-slate-800/80 rounded-2xl">
        {renderContent()}
      </div>
    </div>
  );
};

export default MemberDirectoryView;
