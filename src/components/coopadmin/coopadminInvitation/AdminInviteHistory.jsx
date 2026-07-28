import React, { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import SortableHeader from "@/components/shared/SortableHeader";

const AdminInviteHistory = ({ selectedCoop, refresh }) => {
  const [history, setHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const [sortConfig, setSortConfig] = useState({
    key: "$createdAt",
    direction: "descending",
  });

  useEffect(() => {
    const fetchHistory = async () => {
      if (!selectedCoop) return;
      setIsLoading(true);
      setError("");
      try {
        const res = await fetch(
          `/api/onboardAdmin/fetchHistory/${selectedCoop}`,
        );
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || "Failed to load invite history");
        }
        setHistory(data.history || []);
      } catch (err) {
        console.error(err);
        setError(err.message || "Failed to fetch invite history");
      } finally {
        setIsLoading(false);
      }
    };
    fetchHistory();
  }, [selectedCoop, refresh]);

  const requestSort = (key) => {
    let direction = "ascending";
    if (sortConfig.key === key && sortConfig.direction === "ascending") {
      direction = "descending";
    }
    setSortConfig({ key, direction });
  };

  const sortedHistory = [...history].sort((a, b) => {
    let aValue = a[sortConfig.key];
    let bValue = b[sortConfig.key];

    if (aValue < bValue) {
      return sortConfig.direction === "ascending" ? -1 : 1;
    }
    if (aValue > bValue) {
      return sortConfig.direction === "ascending" ? 1 : -1;
    }
    return 0;
  });

  const tableSkeliton = () => {
    return Array.from({ length: 4 }).map((_, index) => (
      <tr key={index} className="hover:bg-gray-50 dark:hover:bg-slate-700/50">
        {Array.from({ length: 5 }).map((_, index) => (
          <td
            key={index}
            className="p-4 text-sm text-gray-600 whitespace-nowrap dark:text-gray-300"
          >
            <div className="w-20 h-4 rounded-lg bg-gray-300/90 animate-pulse" />
          </td>
        ))}
      </tr>
    ));
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return (
      date.toLocaleDateString() +
      " " +
      date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    );
  };

  return (
    <div className="mt-8">
      <h3 className="mb-4 text-lg font-bold text-gray-900 dark:text-white">
        Invite History
      </h3>
      <div className="overflow-hidden border border-gray-200 rounded-lg shadow-sm dark:border-slate-700">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
            <thead className="bg-gray-50 dark:bg-slate-700/50">
              <tr>
                <SortableHeader
                  columnKey="$createdAt"
                  sortConfig={sortConfig}
                  requestSort={requestSort}
                >
                  Date
                </SortableHeader>
                <SortableHeader
                  columnKey="inviteFullName"
                  sortConfig={sortConfig}
                  requestSort={requestSort}
                >
                  Name
                </SortableHeader>
                <SortableHeader
                  columnKey="inviteEmail"
                  sortConfig={sortConfig}
                  requestSort={requestSort}
                >
                  Email
                </SortableHeader>
                <SortableHeader
                  columnKey="onboardedBy"
                  sortConfig={sortConfig}
                  requestSort={requestSort}
                >
                  Invited By
                </SortableHeader>
                <SortableHeader
                  columnKey="onboarded"
                  sortConfig={sortConfig}
                  requestSort={requestSort}
                >
                  Status
                </SortableHeader>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200 dark:bg-slate-800 dark:divide-slate-700">
              {isLoading ? (
                tableSkeliton()
              ) : error ? (
                <tr>
                  <td colSpan="5" className="p-6 text-center text-red-500">
                    {error}
                  </td>
                </tr>
              ) : sortedHistory.length > 0 ? (
                sortedHistory.map((invite) => (
                  <tr
                    key={invite.$id}
                    className="hover:bg-gray-50 dark:hover:bg-slate-700/50"
                  >
                    <td className="p-4 text-sm text-gray-600 whitespace-nowrap dark:text-gray-300">
                      {formatDate(invite.$createdAt)}
                    </td>
                    <td className="p-4 text-sm font-medium text-gray-900 whitespace-nowrap dark:text-white">
                      {invite.inviteFullName || "N/A"}
                    </td>
                    <td className="p-4 text-sm text-gray-600 whitespace-nowrap dark:text-gray-300">
                      {invite.inviteEmail}
                    </td>
                    <td className="p-4 text-sm text-gray-600 whitespace-nowrap dark:text-gray-300">
                      {invite.onboardedBy || "N/A"}
                    </td>
                    <td className="p-4 text-sm whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          invite.onboarded
                            ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                            : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
                        }`}
                      >
                        {invite.onboarded ? "Accepted" : "Pending"}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan="5"
                    className="p-6 text-center text-gray-500 dark:text-gray-400"
                  >
                    No invite history found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminInviteHistory;
