"use client";
import React, { useState, useEffect, useMemo, useRef } from "react";
import ReactDOM from "react-dom";
import { useAuth } from "../../hooks/useAuth";
import {
  getTransactionsByCoopId,
  updateTransactionStatus,
} from "../../lib/transactionService"; // Assuming an update function exists
import { Eye, X, Search } from "lucide-react";
import UserEmail from "../userComponent/UserEmail";
import UserName from "../userComponent/UserName";
import useUserCache from "../../hooks/useUserCache";
import SortableHeader from "../shared/SortableHeader";

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

// --- MODAL COMPONENTS ---

const ViewTransactionModal = ({ transaction, onClose }) => {
  if (!transaction) return null;

  const details = {
    "Transaction ID": transaction.$id,
    "Date & Time": formatDate(transaction.time),
    "Member ID": transaction.memberId,
    "Co-op ID": transaction.coopId,
    "Transaction Type": transaction.transactionType,
    Shares: transaction.shares,
    Price: `€${transaction.price.toFixed(2)}`,
    "Purchase For": transaction.buyFor,
    "Verification Status": transaction.verificationStatus,
    "Last Updated": formatDate(transaction.$updatedAt),
  };

  return ReactDOM.createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />
      <div className="relative z-10 w-full max-w-lg m-4 bg-white shadow-2xl dark:bg-slate-800 rounded-xl">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-slate-700">
          <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
            Transaction Details
          </h3>
          <button
            onClick={onClose}
            className="text-gray-500 transition-colors hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <X size={24} />
          </button>
        </div>
        <div className="p-6">
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
        </div>
        <div className="p-4 text-right bg-gray-50 dark:bg-slate-800/50 rounded-b-xl">
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
  const [status, setStatus] = useState(transaction.verificationStatus);

  const handleSave = async () => {
    // Here you would call your API to update the status
    // For now, we'll call the onSave prop which can handle the logic
    await updateTransactionStatus(transaction.$id, status);
    await onSave(transaction.$id, status);
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
            <option value="pending">Pending</option>
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

const TransactionsView = ({ selectedCoop }) => {
  const { user } = useAuth();
  const { getUserById } = useUserCache();
  const getUserByIdRef = useRef(getUserById);

  useEffect(() => {
    getUserByIdRef.current = getUserById;
  }, [getUserById]);

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

  const handleUpdateStatus = async (transactionId, newStatus) => {
    try {
      // Uncomment the line below to use a real API call
      // await updateTransactionStatus(transactionId, { verificationStatus: newStatus });

      // UI update for demonstration
      setTransactions((prev) =>
        prev.map((t) =>
          t.$id === transactionId
            ? {
                ...t,
                verificationStatus: newStatus,
                $updatedAt: new Date().toISOString(),
              }
            : t,
        ),
      );
    } catch (error) {
      console.error("Failed to update status:", error);
      // Optionally show an error message to the user
    }
  };

  const verifiedTransactions = useMemo(() => {
    return transactions.filter(
      (txn) => (txn.verificationStatus || "").toLowerCase() === "verified",
    );
  }, [transactions]);

  const sortedAndFilteredTransactions = useMemo(() => {
    let sorted = [...verifiedTransactions];

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
  }, [verifiedTransactions, sortConfig, searchTerm, memberEmails]);

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

  // const openEditModal = (transaction) => {
  //   setSelectedTransaction(transaction);
  //   setEditModalOpen(true);
  // };

  const closeModals = () => {
    setViewModalOpen(false);
    setEditModalOpen(false);
    setSelectedTransaction(null);
  };

  const StatusBadge = ({ status }) => {
    const baseClasses =
      "px-2.5 py-0.5 text-xs font-medium rounded-full inline-block";
    const statusMap = {
      pending:
        "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
      verified:
        "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
      rejected: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
    };
    return (
      <span
        className={`${baseClasses} ${
          statusMap[status] || "bg-gray-100 text-gray-800"
        }`}
      >
        {status}
      </span>
    );
  };

  // const SortableHeader = ({ children, columnKey }) => {
  //   const isSorted = sortConfig.key === columnKey;
  //   const Icon = isSorted
  //     ? sortConfig.direction === "ascending"
  //       ? ArrowUp
  //       : ArrowDown
  //     : ChevronsUpDown;
  //   return (
  //     <th
  //       onClick={() => requestSort(columnKey)}
  //       className="p-4 text-xs font-medium tracking-wider text-left text-gray-500 uppercase cursor-pointer select-none dark:text-gray-400"
  //     >
  //       <div className="flex items-center">
  //         {children}
  //         <Icon
  //           size={14}
  //           className={`ml-2 ${isSorted ? "text-gray-800 dark:text-gray-200" : ""
  //             }`}
  //         />
  //       </div>
  //     </th>
  //   );
  // };

  return (
    <div className="p-4 sm:p-6 animate-fadeIn">
      <div className="overflow-hidden bg-white shadow-lg dark:bg-slate-800 rounded-xl">
        <div className="p-4 border-b border-gray-200 sm:p-6 dark:border-slate-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Transactions
          </h2>
          <div className="flex items-center mt-4">
            <div className="relative w-full max-w-sm">
              <Search
                className="absolute text-gray-400 -translate-y-1/2 left-3 top-1/2"
                size={18}
              />
              <input
                type="text"
                placeholder="Search transactions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full py-2 pl-10 pr-4 border border-gray-300 rounded-lg dark:border-slate-600 bg-gray-50 dark:bg-slate-700 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:text-white"
              />
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
                  <SortableHeader
                    columnKey="time"
                    requestSort={requestSort}
                    sortConfig={sortConfig}
                  >
                    Date
                  </SortableHeader>
                  <SortableHeader
                    columnKey="memberId"
                    requestSort={requestSort}
                    sortConfig={sortConfig}
                  >
                    Member Email
                  </SortableHeader>
                  <SortableHeader
                    columnKey="transactionType"
                    requestSort={requestSort}
                    sortConfig={sortConfig}
                  >
                    Type
                  </SortableHeader>
                  <SortableHeader
                    columnKey="shares"
                    requestSort={requestSort}
                    sortConfig={sortConfig}
                  >
                    Shares
                  </SortableHeader>
                  <SortableHeader
                    columnKey="price"
                    requestSort={requestSort}
                    sortConfig={sortConfig}
                  >
                    Price
                  </SortableHeader>
                  <SortableHeader
                    columnKey="verificationStatus"
                    requestSort={requestSort}
                    sortConfig={sortConfig}
                  >
                    Status
                  </SortableHeader>
                  <th className="p-4 text-xs font-medium tracking-wider text-center text-gray-500 uppercase dark:text-gray-400">
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
                          highlight={searchTerm}
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
                      <td className="p-4 text-sm whitespace-nowrap">
                        <StatusBadge status={txn.verificationStatus} />
                      </td>
                      <td className="p-4 text-sm font-medium text-center whitespace-nowrap">
                        <div className="flex items-center justify-center space-x-3">
                          <button
                            onClick={() => openViewModal(txn)}
                            className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                            title="View Details"
                          >
                            <Eye size={20} />
                          </button>
                          {/*
                           <button
                            onClick={() => openEditModal(txn)}
                            className="text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-100"
                            title="Edit Status"
                          >
                            <Stamp size={20} />
                          </button>
                          */}
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
          {verifiedTransactions.length} total transactions.
        </div>
      </div>

      {isViewModalOpen && (
        <ViewTransactionModal
          transaction={selectedTransaction}
          onClose={closeModals}
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

export default TransactionsView;
