"use client";

import React, { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { ArrowLeft } from "lucide-react";
import {
  fetchCoopsForOrgAdmin,
  fetchCoopHistoryForOrgAdmin,
  fetchCoopsForAuditor,
  fetchCoopHistoryForAuditor,
} from "@/lib/orgCoopsService";
import { HistoryPage, StatusBadge } from "./CoopHistory";
import { useAuth } from "@/hooks/useAuth";

export default function Cooperatives({ auditOrg }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();

  const tab = searchParams.get("tab");
  const coopId = searchParams.get("coopId");

  const [coops, setCoops] = useState([]);
  const [selectedCoop, setSelectedCoop] = useState(null);

  // Loading status states
  const [loadingCoops, setLoadingCoops] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);

  /* ---------------- LOAD COOPS ---------------- */
  useEffect(() => {
    const load = async () => {
      setLoadingCoops(true);
      try {
        let data = [];
        if (user.role === "org_admin") {
          data = await fetchCoopsForOrgAdmin(auditOrg.id);
        } else if (
          user.role === "auditer" ||
          user.role === "aud_E" ||
          user.role === "aud_T"
        ) {
          data = await fetchCoopsForAuditor(auditOrg.id);
        }
        setCoops(data?.cooperatives || []);
      } catch {
        toast.error("Failed to load cooperatives");
      } finally {
        setLoadingCoops(false);
      }
    };

    if (auditOrg?.id) load();
  }, [auditOrg?.id]);

  /* ---------------- LOAD HISTORY ---------------- */
  useEffect(() => {
    const loadHistory = async () => {
      if (!coopId || !coops.length) return;

      const coop = coops.find((c) => c.id === coopId);
      if (!coop) return;

      setLoadingHistory(true);
      try {
        let data;
        if (user.role === "org_admin") {
          data = await fetchCoopHistoryForOrgAdmin(auditOrg.id, coopId);
        } else if (
          user.role === "auditer" ||
          user.role === "aud_E" ||
          user.role === "aud_T"
        ) {
          data = await fetchCoopHistoryForAuditor(auditOrg.id, coopId);
        }

        setSelectedCoop({
          ...coop,
          history: data?.history || [],
        });
      } catch {
        toast.error("Failed to load history");
      } finally {
        setLoadingHistory(false);
      }
    };

    loadHistory();
  }, [coopId, coops, auditOrg?.id]);

  /* ---------------- OPEN HISTORY ---------------- */
  const openHistory = (id) => {
    router.push(`/dashboard?tab=coops&coopId=${id}`);
  };

  /* ---------------- CLOSE HISTORY ---------------- */
  const closeHistory = () => {
    router.push(`/dashboard?tab=coops`);
    setSelectedCoop(null);
  };

  /* ---------------- HISTORY VIEW ---------------- */
  // Switched instantly if coopId is present to prevent frozen appearance
  if (tab === "coops" && coopId) {
    // Dynamically look up from local array if async state selectedCoop hasn't finalized yet
    const currentCoop = selectedCoop || coops.find((c) => c.id === coopId);

    return (
      <HistoryPage
        coop={currentCoop}
        history={selectedCoop?.id === coopId ? selectedCoop.history || [] : []}
        isLoading={loadingHistory}
        onBack={closeHistory}
        auditOrg={auditOrg}
      />
    );
  }

  /* ---------------- LIST VIEW ---------------- */
  if (tab !== "coops") return null;

  return (
    <div className="p-6 m-2 overflow-x-auto bg-white border rounded-lg dark:bg-gray-800 dark:border-gray-600">
      <table className="w-full">
        <thead>
          <tr className="text-sm text-gray-600 border-b dark:border-gray-600 dark:text-gray-400">
            <th className="py-3 text-left">Cooperative</th>
            <th>Location</th>
            <th>Status</th>
            <th>Audit</th>
            <th>Action</th>
          </tr>
        </thead>

        <tbody>
          {loadingCoops ? (
            Array.from({ length: 4 }).map((_, rowIndex) => (
              <tr key={rowIndex} className="animate-pulse border-b dark:border-gray-700">
                <td className="flex items-center gap-3 py-4">
                  <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-205 dark:bg-gray-700 rounded w-36"></div>
                    <div className="h-3 bg-gray-205 dark:bg-gray-700 rounded w-20"></div>
                  </div>
                </td>
                <td>
                  <div className="h-4 bg-gray-205 dark:bg-gray-700 rounded w-24 mx-auto"></div>
                </td>
                <td>
                  <div className="h-6 bg-gray-205 dark:bg-gray-700 rounded-full w-20 mx-auto"></div>
                </td>
                <td>
                  <div className="h-6 bg-gray-205 dark:bg-gray-700 rounded-full w-20 mx-auto"></div>
                </td>
                <td>
                  <div className="h-8 bg-gray-205 dark:bg-gray-700 rounded w-24 mx-auto"></div>
                </td>
              </tr>
            ))
          ) : coops.length === 0 ? (
            <tr>
              <td colSpan={6} className="p-6 text-center text-gray-400">
                No cooperatives found
              </td>
            </tr>
          ) : (
            coops.map((coop) => (
              <tr
                key={coop.id}
                className="border-b hover:bg-gray-50 dark:hover:bg-gray-900 dark:border-gray-600"
              >
                <td className="flex items-center gap-3 py-4">
                  <img
                    src={coop.logo}
                    className="w-10 h-10 border rounded-lg"
                  />
                  <div>
                    <p className="font-medium">{coop.name}</p>
                    <p className="text-xs text-gray-400">{coop.RegNumber}</p>
                  </div>
                </td>

                <td className="text-sm text-center">
                  {coop.state}, {coop.country}
                </td>

                <td className="text-center">
                  <StatusBadge status={coop.status} />
                </td>

                <td className="text-center">
                  <StatusBadge status={coop.auditStatus} />
                </td>

                <td className="text-center">
                  <button
                    onClick={() => openHistory(coop.id)}
                    className="bg-indigo-600 text-white px-3 py-1.5 rounded-lg text-sm hover:bg-indigo-700"
                  >
                    View Details
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
