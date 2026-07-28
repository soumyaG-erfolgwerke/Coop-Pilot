"use client";

import React, { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import toast from "react-hot-toast";

import ResponsiveDrawer from "@/components/shared/ResponsiveDrawer";

import {
  createDiscrepancyForCoopOrg,
  getDiscrepanciesForAuditOrg,
  updateDiscrepancyStatus,
} from "@/lib/auditDiscrepancy";

import CreateDiscrepancyForm, { SEVERITY_MAP } from "./CreateDiscrepancyForm";
import UpdateStatusForm from "./UpdateStatusForm";

const Discrepancy = ({ auditOrgId }) => {
  const searchParams = useSearchParams();
  const { user } = useAuth();

  const coopId = searchParams.get("coopId");

  const isSubAuditor = user?.role === "aud_E" || user?.role === "aud_T";

  const [loading, setLoading] = useState(false);
  const [discrepancies, setDiscrepancies] = useState([]);

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState("create");
  const [selectedDiscrepancy, setSelectedDiscrepancy] = useState(null);

  const loadDiscrepancies = async () => {
    if (!auditOrgId || !coopId) return;

    try {
      setLoading(true);

      const data = await getDiscrepanciesForAuditOrg(auditOrgId, coopId);

      setDiscrepancies(data || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDiscrepancies();
  }, [auditOrgId, coopId]);

  const openCreateDrawer = () => {
    setDrawerMode("create");
    setSelectedDiscrepancy(null);
    setIsDrawerOpen(true);
  };

  const openUpdateDrawer = (discrepancy) => {
    setDrawerMode("update");
    setSelectedDiscrepancy(discrepancy);
    setIsDrawerOpen(true);
  };

  const closeDrawer = () => {
    setIsDrawerOpen(false);
    setSelectedDiscrepancy(null);
  };

  const handleCreateDiscrepancy = async (payload) => {
    try {
      await createDiscrepancyForCoopOrg(payload);

      await loadDiscrepancies();

      closeDrawer();
      toast.success("Discrepancy created successfully");
    } catch (error) {
      toast.error(
        `Failed to create discrepancy. Please try again. ${error.message}`,
      );
    }
  };

  const handleStatusUpdate = async (status) => {
    try {
      if (!selectedDiscrepancy?.id) return;

      await updateDiscrepancyStatus(
        selectedDiscrepancy.id,
        status,
        auditOrgId,
        coopId,
      );

      await loadDiscrepancies();

      closeDrawer();
      toast.success("Status updated successfully");
    } catch (error) {
      toast.error(
        `Failed to update status. Please try again. ${error.message}`,
      );
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "resolved":
        return "bg-green-100 text-green-700";

      case "partially_closed":
        return "bg-yellow-100 text-yellow-700";

      case "open":
      default:
        return "bg-red-100 text-red-700";
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}{" "}
      <div className="flex items-center justify-between">
        {" "}
        <h2 className="text-xl font-semibold">Audit Discrepancies </h2>
        {!isSubAuditor && (
          <button
            onClick={openCreateDrawer}
            className="px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700"
          >
            + New Discrepancy
          </button>
        )}
      </div>
      {/* Table */}
      <div className="overflow-x-auto bg-white border rounded-lg dark:bg-slate-900">
        <table className="min-w-full">
          <thead className="bg-gray-100 dark:bg-slate-800">
            <tr>
              <th className="px-4 py-3 text-sm font-medium text-left">Title</th>

              <th className="px-4 py-3 text-sm font-medium text-left">
                Description
              </th>

              <th className="px-4 py-3 text-sm font-medium">Severity</th>

              <th className="px-4 py-3 text-sm font-medium">Status</th>

              <th className="px-4 py-3 text-sm font-medium">Actions</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              Array.from({ length: 3 }).map((_, rowIndex) => (
                <tr key={rowIndex} className="animate-pulse border-b dark:border-gray-700">
                  <td className="p-4"><div className="h-4 bg-gray-250 dark:bg-gray-700 rounded w-28"></div></td>
                  <td className="p-4">
                    <div className="space-y-2">
                      <div className="h-4 bg-gray-250 dark:bg-gray-700 rounded w-64"></div>
                      <div className="h-3 bg-gray-250 dark:bg-gray-700 rounded w-20"></div>
                    </div>
                  </td>
                  <td className="p-4"><div className="h-6 bg-gray-250 dark:bg-gray-700 rounded-full w-20 mx-auto"></div></td>
                  <td className="p-4"><div className="h-6 bg-gray-250 dark:bg-gray-700 rounded-full w-20 mx-auto"></div></td>
                  <td className="p-4 text-center"><div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-24 mx-auto"></div></td>
                </tr>
              ))
            ) : discrepancies.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-6 text-center">
                  No discrepancies found
                </td>
              </tr>
            ) : (
              discrepancies.map((item) => (
                <tr key={item.id} className="border-t">
                  {/* Title */}
                  <td className="px-4 py-3 font-medium">{item.title}</td>

                  {/* Description */}
                  <td className="max-w-[350px] px-4 py-3">
                    <div className="space-y-1">
                      <p className="text-sm text-gray-700 line-clamp-2 dark:text-gray-300">
                        {item.description}
                      </p>

                      <button
                        onClick={() => openUpdateDrawer(item)}
                        className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        Read More
                      </button>
                    </div>
                  </td>

                  {/* Severity */}
                  <td className="flex items-center justify-center px-4 py-3">
                    <span
                      className={`inline-flex rounded-full  border px-3 py-1 text-xs font-medium ${
                        SEVERITY_MAP[item?.type]?.color
                      }`}
                    >
                      {SEVERITY_MAP[item?.type]?.label}
                    </span>
                  </td>

                  {/* Status */}
                  <td className="px-4 py-3 text-center">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-medium ${getStatusColor(
                        item.status,
                      )}`}
                    >
                      {item.status}
                    </span>
                  </td>

                  {/* Actions */}
                  <td className="flex items-center justify-center px-4 py-3">
                    <button
                      onClick={() => openUpdateDrawer(item)}
                      className="px-3 py-1 text-sm border rounded-md hover:bg-gray-50"
                    >
                      Update Status
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {/* Drawer */}
      <ResponsiveDrawer
        isOpen={isDrawerOpen}
        onClose={closeDrawer}
        title={
          drawerMode === "create"
            ? "Create Discrepancy"
            : selectedDiscrepancy?.title || "Discrepancy Details"
        }
        description={
          drawerMode === "create"
            ? "Record and classify an audit discrepancy."
            : "View discrepancy details and update status."
        }
      >
        {drawerMode === "create" ? (
          <CreateDiscrepancyForm
            auditOrgId={auditOrgId}
            coopId={coopId}
            onSubmit={handleCreateDiscrepancy}
            onClose={closeDrawer}
          />
        ) : (
          <UpdateStatusForm
            discrepancy={selectedDiscrepancy}
            onSubmit={handleStatusUpdate}
            onClose={closeDrawer}
          />
        )}
      </ResponsiveDrawer>
    </div>
  );
};

export default Discrepancy;
