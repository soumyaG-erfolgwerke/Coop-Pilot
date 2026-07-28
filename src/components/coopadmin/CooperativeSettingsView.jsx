"use client";

import React, { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Loader2 } from "lucide-react";
import LegalParametersForm from "./LegalParametersForm";
import SettingsConfirmationModal from "./SettingsConfirmationModal";
import {
  fetchCooperativeSettings,
  getDefaultSettings,
  getSettingsHistory,
  updateCooperativeSettings,
} from "@/lib/cooperativeSettingsService";
import { stripeService } from "@/services/payment/stripeService";

export default function CooperativeSettingsView({ selectedCoop, coops = [] }) {
  const [settings, setSettings] = useState(getDefaultSettings());
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [pendingPayload, setPendingPayload] = useState(null);
  const [warnings, setWarnings] = useState([]);
  const [showConfirm, setShowConfirm] = useState(false);
  const [history, setHistory] = useState([]);
  const [historyError, setHistoryError] = useState("");
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);

  const selectedCoopInfo = coops.find((coop) => coop.id === selectedCoop);

  const loadData = useCallback(async () => {
    if (!selectedCoop) return;
    setIsLoading(true);

    try {
      const nextSettings = await fetchCooperativeSettings(selectedCoop);
      const paymentData = await stripeService.fetchCoopPaymentData(selectedCoop);
      setSettings(nextSettings);

      setIsSubscribed(!!paymentData?.subscription?.isActive);

      setIsHistoryLoading(true);
      setHistoryError("");
      try {
        const nextHistory = await getSettingsHistory(selectedCoop);
        setHistory(nextHistory);
      } catch (historyLoadError) {
        setHistory([]);
        setHistoryError(
          historyLoadError.message || "Failed to load settings history",
        );
      } finally {
        setIsHistoryLoading(false);
      }
    } catch (error) {
      toast.error(error.message || "Failed to load cooperative settings");
      setSettings(getDefaultSettings());
      setHistory([]);
    } finally {
      setIsLoading(false);
    }
  }, [selectedCoop]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const persist = async (payload, reason) => {
    setIsSaving(true);
    try {
      const result = await updateCooperativeSettings(
        selectedCoop,
        payload,
        reason,
      );
      if (!result.success) {
        toast.error(result.errors?.[0] || "Failed to save settings");
        return;
      }

      setSettings(result.settings);
      setWarnings(result.warnings || []);
      toast.success("Cooperative settings updated");
      await loadData();
    } finally {
      setIsSaving(false);
      setPendingPayload(null);
      setShowConfirm(false);
    }
  };

  const handleFormSubmit = (normalized, reason, formWarnings) => {
    if (formWarnings.length > 0) {
      setPendingPayload({ normalized, reason });
      setShowConfirm(true);
      return;
    }

    persist(normalized, reason);
  };

  if (!selectedCoop) {
    return (
      <div className="p-6 m-6 text-sm text-gray-600 bg-white rounded-xl dark:bg-slate-800 dark:text-gray-300">
        Select a cooperative to configure legal parameters.
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-4 space-y-6 sm:p-2 animate-pulse">
        {/* Banner + Logo Header Skeleton */}
        <div className="p-3 bg-white border border-gray-100 shadow-sm dark:bg-slate-800 rounded-2xl dark:border-slate-700 md:p-4">
          <div className="w-full bg-gray-200 dark:bg-slate-700 h-44 md:h-60 rounded-xl" />
          <div className="relative z-10 flex flex-col items-start px-4 pb-2 sm:flex-row sm:items-end">
            <div className="relative inline-block -mt-16 bg-gray-300 border-4 border-white shadow w-28 h-28 sm:w-36 sm:h-36 rounded-2xl dark:bg-slate-600 dark:border-slate-800 sm:-mt-20" />
            <div className="flex-1 min-w-0 mt-3 space-y-2 sm:mt-0 sm:ml-5">
              <div className="w-48 h-6 bg-gray-200 rounded dark:bg-slate-700" />
              <div className="w-32 h-4 rounded bg-gray-150 dark:bg-slate-700/80" />
            </div>
          </div>
        </div>

        {/* Sidebar + Main Grid Skeleton */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-4 lg:grid-cols-5">
          {/* Sidebar Nav Panels Skeleton */}
          <div className="hidden space-y-1 md:block md:col-span-1 lg:col-span-1">
            <div className="p-4 space-y-3 bg-white border border-gray-100 shadow-sm dark:bg-slate-800 dark:border-slate-700 rounded-2xl">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div
                  key={i}
                  className="w-full bg-gray-200 h-9 rounded-xl dark:bg-slate-700"
                />
              ))}
            </div>
          </div>

          {/* Tab Content Panel Skeleton */}
          <div className="space-y-6 md:col-span-3 lg:col-span-4 bg-white dark:bg-slate-800 p-5 md:p-6 border border-gray-100 dark:border-slate-700 shadow-sm rounded-2xl min-h-[350px]">
            <div className="pb-4 space-y-2 border-b border-gray-100 dark:border-slate-700">
              <div className="h-5 bg-gray-200 rounded w-36 dark:bg-slate-700" />
              <div className="w-64 h-3.5 bg-gray-150 rounded dark:bg-slate-700/80" />
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <div className="w-16 h-3 bg-gray-200 rounded dark:bg-slate-700" />
                <div className="w-full h-10 bg-gray-100 border border-gray-100 rounded-xl dark:bg-slate-700/50 dark:border-slate-700/50" />
              </div>
              <div className="space-y-2">
                <div className="w-16 h-3 bg-gray-200 rounded dark:bg-slate-700" />
                <div className="w-full h-10 bg-gray-100 border border-gray-100 rounded-xl dark:bg-slate-700/50 dark:border-slate-700/50" />
              </div>
            </div>

            <div className="space-y-2">
              <div className="w-20 h-3 bg-gray-200 rounded dark:bg-slate-700" />
              <div className="w-full bg-gray-100 border border-gray-100 h-28 rounded-xl dark:bg-slate-700/50 dark:border-slate-700/50" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6 sm:p-2 animate-fadeIn">
      {warnings.length > 0 && (
        <div className="space-y-2">
          {warnings.map((warning, index) => (
            <div
              key={`${warning}-${index}`}
              className="px-3 py-2 text-sm text-yellow-800 border border-yellow-200 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 dark:text-yellow-200 dark:border-yellow-800"
            >
              {warning}
            </div>
          ))}
        </div>
      )}

      <LegalParametersForm
        initialValues={settings}
        isSaving={isSaving}
        onValidationWarnings={setWarnings}
        onNoChanges={() => {
          toast("No changes detected");
        }}
        onSubmit={handleFormSubmit}
        selectedCoop={selectedCoop}
        history={history}
        isHistoryLoading={isHistoryLoading}
        historyError={historyError}
        isSubscribed={isSubscribed}
      />

      <SettingsConfirmationModal
        isOpen={showConfirm}
        warnings={warnings}
        isSaving={isSaving}
        onCancel={() => {
          setShowConfirm(false);
          setPendingPayload(null);
        }}
        onConfirm={() => {
          if (!pendingPayload) return;
          persist(pendingPayload.normalized, pendingPayload.reason);
        }}
      />
    </div>
  );
}
