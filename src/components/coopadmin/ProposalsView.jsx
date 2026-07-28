"use client";
import React, { useState, useEffect, useMemo, useRef } from "react";
import ReactDOM from "react-dom";
import { useAuth } from "../../hooks/useAuth";
import {
  getTransactionsByCoopId,
  updateTransactionStatus,
} from "../../lib/transactionService"; // Assuming an update function exists
import {
  Eye,
  Edit,
  Stamp,
  X,
  ChevronsUpDown,
  ArrowUp,
  ArrowDown,
  Search,
  Filter,
  FileText,
  ExternalLink,
} from "lucide-react";
import UserEmail from "../userComponent/UserEmail";
import useUserCache from "../../hooks/useUserCache";

// Helper function to format ISO date strings
const formatDate = (isoString) => {
  if (!isoString) return "N/A";
  try {
    return new Date(isoString).toLocaleString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch (error) {
    return "Invalid Date";
  }
};

const getDisplayStatusText = (status, isAdminApproved) => {
  if (status === "pending") {
    return isAdminApproved ? "Payment Pending" : "Needs Approval";
  }
  if (status === "verified") return "Verified";
  if (status === "rejected") return "Rejected";
  return status || "N/A";
};

const getDisplayStatusKey = (status, isAdminApproved) => {
  if (status === "pending") {
    return isAdminApproved ? "pending payment" : "pending approval";
  }
  return status || "";
};

// --- MODAL COMPONENTS ---

const ViewTransactionModal = ({ transaction, onClose, selectedCoop }) => {
  if (!transaction) return null;

  const [kycDoc, setKycDoc] = useState(null);
  const [isLoadingKyc, setIsLoadingKyc] = useState(false);
  const [kycError, setKycError] = useState(null);

  useEffect(() => {
    const fetchKycDoc = async () => {
      setIsLoadingKyc(true);
      setKycError(null);
      try {
        // 1. Get member record from coopxmember
        const memRes = await fetch(
          `/api/coop-r-member?userId=${encodeURIComponent(
            transaction.memberId,
          )}&coopId=${encodeURIComponent(transaction.coopId)}`,
        );
        const memData = await memRes.json();
        if (
          !memData.success ||
          !memData.membership ||
          memData.membership.length === 0
        ) {
          setKycError("Membership record not found.");
          return;
        }

        // Find the membership record that contains this transaction's ID in its ProposalKeys list
        const matchingMember = memData.membership.find(
          (m) => m.ProposalKeys && m.ProposalKeys.includes(transaction.$id),
        );
        const targetMember = matchingMember || memData.membership[0];
        const kycDocId = targetMember?.kycDocId;
        if (!kycDocId) {
          setKycError("No KYC document associated with this member.");
          return;
        }

        // 2. Fetch the KYC document itself
        const docRes = await fetch(
          `/api/coop-admin/kyc-document/${encodeURIComponent(kycDocId)}`,
        );
        const docData = await docRes.json();
        if (!docData.success || !docData.document) {
          setKycError("Failed to load KYC document details.");
          return;
        }

        setKycDoc(docData.document);
      } catch (err) {
        console.error("Error fetching KYC document:", err);
        setKycError("Failed to fetch KYC document.");
      } finally {
        setIsLoadingKyc(false);
      }
    };

    fetchKycDoc();
  }, [transaction]);

  const details = {
    "Proposal ID": transaction.$id,
    "Date & Time": formatDate(transaction.time),
    // "Member ID": transaction.memberId,
    "Co-op ": selectedCoop?.name || "Loading...",
    "Proposal Type": transaction.transactionType,
    Shares: transaction.shares,
    Price: `€${transaction.price.toFixed(2)}`,
    "Purchase For": transaction.buyFor,
    "Verification Status": getDisplayStatusText(
      transaction.verificationStatus,
      transaction.isAdminApproved,
    ),
    "Last Updated": formatDate(transaction.$updatedAt),
  };

  return ReactDOM.createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />{" "}
      <div className="relative z-10 w-full max-w-lg m-4 bg-white shadow-2xl dark:bg-slate-800 rounded-xl flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-slate-700 shrink-0">
          <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
            Proposals
          </h3>
          <button
            onClick={onClose}
            className="text-gray-500 transition-colors hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <X size={24} />
          </button>
        </div>
        <div className="flex-1 p-6 overflow-y-auto scrollbar-hide">
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
            {Object.entries(details).map(([key, value]) => (
              <div key={key} className="py-1">
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  {key}
                </dt>
                <dd className="mt-1 text-base text-gray-900 break-words dark:text-gray-100">
                  {String(value)}
                </dd>
              </div>
            ))}
          </dl>

          <hr className="my-6 border-gray-200 dark:border-slate-700" />

          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-200">
              KYC Verification Document
            </h4>
            {isLoadingKyc && (
              <p className="text-sm text-gray-500 dark:text-gray-400 animate-pulse">
                Loading KYC document details...
              </p>
            )}
            {kycError && <p className="text-sm text-red-500">{kycError}</p>}
            {!isLoadingKyc && !kycError && kycDoc && (
              <div className="flex items-center justify-between gap-4 p-3 border border-gray-200 rounded-lg dark:border-slate-700 bg-gray-50 dark:bg-slate-800/50">
                <div className="flex items-center flex-1 min-w-0 space-x-3">
                  <div className="p-2 text-indigo-600 bg-indigo-100 rounded-lg dark:bg-indigo-900/30 dark:text-indigo-400 shrink-0">
                    <FileText size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate dark:text-gray-200">
                      {kycDoc.documentType || "Verification Document"}
                    </p>
                    <p
                      className="text-xs text-gray-500 truncate dark:text-gray-400"
                      title={kycDoc.fileName}
                    >
                      {kycDoc.fileName || "kyc_document"}
                    </p>
                  </div>
                </div>
                <a
                  href={kycDoc.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors shrink-0"
                >
                  <ExternalLink size={14} />
                  View
                </a>
              </div>
            )}
            {!isLoadingKyc && !kycError && !kycDoc && (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                No KYC document available.
              </p>
            )}
          </div>
        </div>
        <div className="p-4 text-right bg-gray-50 dark:bg-slate-800/50 rounded-b-xl shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-800 transition-colors bg-gray-200 rounded-lg dark:bg-slate-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-slate-600"
          >
            Close
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
};

const EditTransactionModal = ({
  transaction,
  onClose,
  onSave,
  setReloadKey,
}) => {
  if (!transaction) return null;
  const [status, setStatus] = useState(
    transaction.verificationStatus === "pending"
      ? "verified"
      : transaction.verificationStatus,
  );

  const handleSave = async () => {
    await onSave(transaction, status);
    setReloadKey(Date.now());
    onClose();
  };

  return ReactDOM.createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />
      <div className="relative z-10 w-full max-w-md m-4 bg-white rounded-lg shadow-xl dark:bg-slate-800">
        <div className="p-5 border-b border-gray-200 dark:border-slate-700">
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-200">
            Edit Transaction Status
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Transaction ID: {transaction.$id}
          </p>
        </div>
        <div className="p-5">
          <label
            htmlFor="status"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Verification Status
          </label>
          <select
            id="status"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="block w-full py-2 pl-3 pr-10 mt-1 text-base text-gray-900 bg-white border-gray-300 rounded-md dark:border-slate-600 dark:bg-slate-700 dark:text-gray-200 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          >
            <option value="verified">Verified</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
        <div className="flex justify-end px-5 py-4 space-x-3 bg-gray-50 dark:bg-slate-800/50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-transparent rounded-md dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-700"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
};

// --- MAIN TRANSACTIONS VIEW COMPONENT ---

const ProposalView = ({ selectedCoop, coops }) => {
  const { user } = useAuth();
  const { getUserById } = useUserCache();
  const getUserByIdRef = useRef(getUserById);

  useEffect(() => {
    getUserByIdRef.current = getUserById;
  }, [getUserById]);

  const activeCoopDoc = coops?.find((c) => c.id === selectedCoop);

  const [transactions, setTransactions] = useState([]);
  const [memberEmails, setMemberEmails] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState({
    key: "time",
    direction: "descending",
  });

  const [isViewModalOpen, setViewModalOpen] = useState(false);
  const [isEditModalOpen, setEditModalOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [reloadkey, setReloadKey] = useState(0);

  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filterField, setFilterField] = useState("verificationStatus");
  const [filterOp, setFilterOp] = useState("Equals");
  const [filterVal, setFilterVal] = useState("");
  const [appliedFilterField, setAppliedFilterField] =
    useState("verificationStatus");
  const [appliedFilterOp, setAppliedFilterOp] = useState("Equals");
  const [appliedFilterVal, setAppliedFilterVal] = useState("");

  useEffect(() => {
    const fetchTransactions = async () => {
      if (!selectedCoop) return;
      setIsLoading(true);
      setError(null);
      try {
        const response = await getTransactionsByCoopId(selectedCoop);
        const docs = response.documents || [];

        // Pre-resolve emails for all unique memberIds
        const uniqueMemberIds = [
          ...new Set(docs.map((txn) => txn.memberId).filter(Boolean)),
        ];
        const emailMap = {};
        await Promise.all(
          uniqueMemberIds.map(async (memberId) => {
            try {
              const u = await getUserByIdRef.current(memberId);
              emailMap[memberId] = u?.email || "";
            } catch (err) {
              console.error(
                "Error resolving user email for memberId",
                memberId,
                err,
              );
            }
          }),
        );

        setMemberEmails(emailMap);
        setTransactions(docs);
      } catch (err) {
        setError("Failed to fetch transactions.");
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchTransactions();
  }, [selectedCoop, reloadkey]);

  const handleUpdateStatus = async (txn, newStatus) => {
    try {
      const res = await fetch("/api/coop-r-member/proposal-status", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          transactionId: txn.$id,
          status: newStatus,
          memberId: txn.memberId,
          coopId: txn.coopId,
          adminEmail: user?.email || "error@err.or",
        }),
      });
      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || "Failed to update status");
      }

      // UI update
      setTransactions((prev) =>
        prev.map((t) =>
          t.$id === txn.$id
            ? {
                ...t,
                verificationStatus: newStatus,
                isAdminApproved:
                  newStatus === "verified" ? true : t.isAdminApproved,
                $updatedAt: new Date().toISOString(),
              }
            : t,
        ),
      );
    } catch (error) {
      console.error("Failed to update status:", error);
      alert(`Failed to update status: ${error.message}`);
    }
  };

  const sortedAndFilteredTransactions = useMemo(() => {
    let sorted = [...transactions];

    if (appliedFilterVal) {
      sorted = sorted.filter((txn) => {
        const status = (txn.verificationStatus || "").toUpperCase();
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

    if (sortConfig.key) {
      sorted.sort((a, b) => {
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];

        if (aValue < bValue)
          return sortConfig.direction === "ascending" ? -1 : 1;
        if (aValue > bValue)
          return sortConfig.direction === "ascending" ? 1 : -1;
        return 0;
      });
    }

    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      return sorted.filter((transaction) => {
        // 1. Search in transaction properties (including transaction ID, member ID, etc.)
        const matchesTransactionProps = Object.values(transaction).some(
          (value) => String(value).toLowerCase().includes(lowerSearch),
        );

        // 2. Search in resolved member email
        const email = memberEmails[transaction.memberId] || "";
        const matchesEmail = email.toLowerCase().includes(lowerSearch);

        return matchesTransactionProps || matchesEmail;
      });
    }

    return sorted;
  }, [
    transactions,
    sortConfig,
    searchTerm,
    appliedFilterField,
    appliedFilterVal,
    appliedFilterOp,
    memberEmails,
  ]);

  const requestSort = (key) => {
    let direction = "ascending";
    if (sortConfig.key === key && sortConfig.direction === "ascending") {
      direction = "descending";
    }
    setSortConfig({ key, direction });
  };

  const openViewModal = (transaction) => {
    setSelectedTransaction(transaction);
    setViewModalOpen(true);
  };

  const openEditModal = (transaction) => {
    setSelectedTransaction(transaction);
    setEditModalOpen(true);
  };

  const closeModals = () => {
    setViewModalOpen(false);
    setEditModalOpen(false);
    setSelectedTransaction(null);
  };

  const StatusBadge = ({ status, isAdminApproved }) => {
    const baseClasses =
      "px-2.5 py-0.5 text-xs font-medium rounded-full inline-block";
    const displayKey = getDisplayStatusKey(status, isAdminApproved);
    const displayText = getDisplayStatusText(status, isAdminApproved);
    const statusMap = {
      "pending approval":
        "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
      "pending payment":
        "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
      verified:
        "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
      rejected: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
    };
    return (
      <span
        className={`${baseClasses} ${statusMap[displayKey] || "bg-gray-100 text-gray-800"}`}
      >
        {displayText}
      </span>
    );
  };

  const SortableHeader = ({ children, columnKey, align = "left" }) => {
    const isSorted = sortConfig.key === columnKey;
    const Icon = isSorted
      ? sortConfig.direction === "ascending"
        ? ArrowUp
        : ArrowDown
      : ChevronsUpDown;
    return (
      <th
        onClick={() => requestSort(columnKey)}
        className={`p-4 text-xs font-medium tracking-wider text-${align} text-gray-500 uppercase cursor-pointer select-none dark:text-gray-400`}
      >
        <div
          className={`flex items-center ${align === "center" ? "justify-center" : ""}`}
        >
          {children}
          <Icon
            size={14}
            className={`ml-2 ${
              isSorted ? "text-gray-800 dark:text-gray-200" : ""
            }`}
          />
        </div>
      </th>
    );
  };

  return (
    <div className="p-4 sm:p-6 animate-fadeIn">
      <div className="overflow-hidden bg-white shadow-lg dark:bg-slate-800 rounded-xl">
        <div className="p-4 border-b border-gray-200 sm:p-6 dark:border-slate-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Share Requests
          </h2>
          <div className="flex flex-col gap-3 mt-4 sm:flex-row sm:items-center">
            <div className="relative w-full max-w-sm">
              <Search
                className="absolute text-gray-400 -translate-y-1/2 left-3 top-1/2"
                size={18}
              />
              <input
                type="text"
                placeholder="Search Proposals"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full py-2 pl-10 pr-4 border border-gray-300 rounded-lg dark:border-slate-600 bg-gray-50 dark:bg-slate-700 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:text-white"
              />
            </div>

            {/* Filter Toggle Button & Popover */}
            <div className="relative z-20 w-full sm:w-auto">
              <button
                onClick={() => setIsFilterOpen(!isFilterOpen)}
                className="flex items-center justify-center w-full gap-2 px-4 py-2 text-sm font-medium text-gray-700 transition-colors bg-white border border-gray-300 rounded-lg shadow-sm sm:w-auto h-[38px] dark:bg-slate-700 dark:text-gray-200 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <Filter size={16} />
                Filters
                {appliedFilterVal && (
                  <span className="flex items-center justify-center w-5 h-5 ml-1 text-xs text-white bg-gray-800 rounded-full dark:bg-gray-200 dark:text-gray-900">
                    1
                  </span>
                )}
              </button>

              {isFilterOpen && (
                <div className="absolute right-0 z-50 w-full p-4 mt-2 bg-white border border-gray-200 rounded-lg shadow-xl sm:w-[480px] dark:bg-[#1a1a1a] dark:border-slate-700 text-sm">
                  <div className="flex items-center gap-2 mb-4">
                    {/* Field Select */}
                    <select
                      value={filterField}
                      onChange={(e) => {
                        setFilterField(e.target.value);
                        setFilterVal("");
                      }}
                      className="w-[30%] px-3 py-1.5 bg-white dark:bg-[#1a1a1a] rounded border border-gray-300 dark:border-[#383838] text-sm focus:ring-2 focus:ring-indigo-500 h-9 outline-none dark:text-gray-200"
                    >
                      <option value="verificationStatus">Status</option>
                    </select>
                    {/* Operation Select */}
                    <select
                      value={filterOp}
                      onChange={(e) => setFilterOp(e.target.value)}
                      className="w-[30%] px-3 py-1.5 bg-white dark:bg-[#1a1a1a] rounded border border-gray-300 dark:border-[#383838] text-sm focus:ring-2 focus:ring-indigo-500 h-9 outline-none dark:text-gray-200"
                    >
                      <option value="Equals">Equals</option>
                      <option value="Not Equals">Not Equals</option>
                    </select>
                    {/* Value Select */}
                    <select
                      value={filterVal}
                      onChange={(e) => setFilterVal(e.target.value)}
                      className="w-[36%] px-3 py-1.5 bg-white dark:bg-[#1a1a1a] rounded border border-gray-300 dark:border-[#383838] text-sm focus:ring-2 focus:ring-indigo-500 h-9 outline-none dark:text-gray-200"
                    >
                      <option value="">Any Status</option>
                      <option value="PENDING">Pending</option>
                      <option value="VERIFIED">Verified</option>
                      <option value="REJECTED">Rejected</option>
                    </select>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex justify-end gap-2 pt-4 mt-2 border-t border-gray-200 dark:border-slate-700">
                    <button
                      onClick={() => {
                        setFilterField("verificationStatus");
                        setFilterVal("");
                        setFilterOp("Equals");
                        setAppliedFilterField("verificationStatus");
                        setAppliedFilterVal("");
                        setAppliedFilterOp("Equals");
                        setIsFilterOpen(false);
                      }}
                      className="px-4 py-1.5 text-sm font-medium text-gray-400 hover:text-gray-600 dark:text-gray-400 dark:hover:text-gray-200 focus:outline-none"
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
                      className="px-4 py-1.5 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 dark:bg-white dark:text-black dark:hover:bg-gray-200 focus:outline-none"
                    >
                      Apply Filters
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {isLoading && (
          <p className="p-6 text-gray-500 dark:text-gray-400">
            Loading transactions...
          </p>
        )}
        {error && <p className="p-6 text-red-500">{error}</p>}

        {!isLoading && !error && (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
              <thead className="bg-gray-50 dark:bg-slate-700/50">
                <tr>
                  <SortableHeader columnKey="time">Date</SortableHeader>
                  <SortableHeader columnKey="memberId">
                    Member Email
                  </SortableHeader>
                  <SortableHeader columnKey="transactionType">
                    Type
                  </SortableHeader>
                  <SortableHeader columnKey="shares">Shares</SortableHeader>
                  <SortableHeader columnKey="price">Price</SortableHeader>
                  <SortableHeader columnKey="verificationStatus" align="center">
                    Status
                  </SortableHeader>
                  <th className="p-4 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-gray-400">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200 dark:bg-slate-800 dark:divide-slate-700">
                {sortedAndFilteredTransactions.length > 0 ? (
                  sortedAndFilteredTransactions.map((txn) => (
                    <tr
                      key={txn.$id}
                      className="hover:bg-gray-50 dark:hover:bg-slate-700/50"
                    >
                      <td className="p-4 text-sm text-gray-600 whitespace-nowrap dark:text-gray-300">
                        {formatDate(txn.time)}
                      </td>
                      <td className="p-4 font-mono text-sm text-gray-500 whitespace-nowrap dark:text-gray-400">
                        {" "}
                        <UserEmail
                          id={txn.memberId}
                          email={memberEmails[txn.memberId]}
                        />{" "}
                      </td>
                      <td className="p-4 text-sm text-gray-800 capitalize whitespace-nowrap dark:text-gray-200">
                        {txn.transactionType}
                      </td>
                      <td className="p-4 text-sm text-gray-800 whitespace-nowrap dark:text-gray-200">
                        {txn.shares}
                      </td>
                      <td className="p-4 text-sm text-gray-800 whitespace-nowrap dark:text-gray-200">
                        €{txn.price.toFixed(2)}
                      </td>
                      <td className="p-4 text-sm text-center whitespace-nowrap">
                        <StatusBadge
                          status={txn.verificationStatus}
                          isAdminApproved={txn.isAdminApproved}
                        />
                      </td>
                      <td className="p-4 text-sm font-medium whitespace-nowrap">
                        <div className="flex items-center space-x-3">
                          <button
                            onClick={() => openViewModal(txn)}
                            className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                            title="View Details"
                          >
                            <Eye size={20} />
                          </button>
                          <button
                            onClick={() => openEditModal(txn)}
                            disabled={
                              !(
                                txn.verificationStatus === "pending" &&
                                !txn.isAdminApproved
                              )
                            }
                            className={`transition-colors ${
                              txn.verificationStatus === "pending" &&
                              !txn.isAdminApproved
                                ? "text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-100 cursor-pointer"
                                : "text-gray-300 dark:text-gray-600 cursor-not-allowed"
                            }`}
                            title={
                              txn.verificationStatus === "pending" &&
                              !txn.isAdminApproved
                                ? "Edit Status"
                                : "Approval not required"
                            }
                          >
                            <Stamp size={20} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan="7"
                      className="p-6 text-center text-gray-500 dark:text-gray-400"
                    >
                      No transactions found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
        <div className="p-4 text-sm text-gray-600 border-t border-gray-200 bg-gray-50 dark:bg-slate-800/50 dark:border-slate-700 dark:text-gray-400">
          Displaying {sortedAndFilteredTransactions.length} of{" "}
          {transactions.length} total transactions.
        </div>
      </div>

      {isViewModalOpen && (
        <ViewTransactionModal
          transaction={selectedTransaction}
          onClose={closeModals}
          selectedCoop={activeCoopDoc}
        />
      )}
      {isEditModalOpen && (
        <EditTransactionModal
          setReloadKey={setReloadKey}
          transaction={selectedTransaction}
          onClose={closeModals}
          onSave={handleUpdateStatus}
        />
      )}
    </div>
  );
};

export default ProposalView;
