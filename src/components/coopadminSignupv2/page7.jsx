"use client";

import React, { useMemo, useEffect, useState } from "react";

import {
  ShieldCheck,
  MapPin,
  Building,
  UserX,
  Building2,
  UserCircle,
  Check,
  AlertCircle,
  Lock,
} from "lucide-react";

import { useSearchParams } from "next/navigation";

const Page7 = ({
  formData,
  handleChange,
  errors,
  auditOrgs = [],
  loading = false,
}) => {
  const searchParams = useSearchParams();

  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const paramOrg = searchParams.get("id")|| searchParams.get("ID") || searchParams.get("orgId") || searchParams.get("publicid") ||searchParams.get("publicId") || searchParams.get("PublicId") || searchParams.get("publicID") || searchParams.get("ORGID") || searchParams.get("OrgId") || searchParams.get("OrgID");

  const matchedAuditor = useMemo(() => {
    if (!paramOrg) return null;

    return auditOrgs.find(
      (auditor) => auditor.publicId === paramOrg || auditor.name === paramOrg,
    );
  }, [paramOrg, auditOrgs]);

  const isLocked = isMounted ? Boolean(paramOrg && matchedAuditor) : false;

  const visibleAuditOrgs =
    isLocked && matchedAuditor ? [matchedAuditor] : auditOrgs;

  useEffect(() => {
    if (matchedAuditor && formData.auditOrg?.data?.$id !== matchedAuditor.$id) {
      handleChange({
        target: {
          name: "auditOrg",
          value: {
            type: "linked",
            data: matchedAuditor,
          },
        },
      });
    }
  }, [matchedAuditor]);

  const handleSelectAuditor = (auditor) => {
    if (isLocked) return;

    const isUrlMatched =
      paramOrg && matchedAuditor && auditor.$id === matchedAuditor.$id;

    handleChange({
      target: {
        name: "auditOrg",
        value: isUrlMatched
          ? {
              type: "linked",
              data: auditor,
            }
          : {
              type: "note",
              data: auditor,
            },
      },
    });
  };

  const handleCustomNameChange = (e) => {
    handleChange({
      target: {
        name: "auditOrg",
        value: {
          ...formData.auditOrg,
          data: {
            ...formData.auditOrg?.data,
            name: e.target.value,
          },
        },
      },
    });
  };

  return (
    <div className="max-w-3xl pt-4 mx-auto space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="space-y-3 text-center">
        <div className="flex items-center justify-center w-16 h-16 mx-auto border border-indigo-100 shadow-sm bg-indigo-50 dark:bg-indigo-900/30 rounded-2xl dark:border-indigo-800/50">
          <ShieldCheck className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
        </div>

        <h2 className="text-2xl font-extrabold tracking-tight sm:text-3xl text-slate-900 dark:text-white">
          Select Auditor
        </h2>

        <p className="max-w-sm mx-auto text-sm text-slate-500 dark:text-slate-400">
          Choose the official auditing body responsible for your cooperative's
          financial compliance.
        </p>

        {/* {isLocked && (
          <div className="flex items-start max-w-md gap-3 p-4 mx-auto mt-4 text-left border border-indigo-200 bg-indigo-50 rounded-xl dark:bg-indigo-900/20 dark:border-indigo-800/50">
            <Lock className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />

            <div>
              <p className="text-sm font-bold text-indigo-800 dark:text-indigo-300">
                Selection Locked
              </p>

              <p className="mt-0.5 text-xs font-medium text-indigo-700/80 dark:text-indigo-400/80">
                Your auditor has been automatically assigned based on your
                organization profile.
              </p>
            </div>
          </div>
        )} */}
      </div>

      <div className="space-y-4">
        {/* Audit Orgs */}
        <div className="max-h-[400px] overflow-y-auto border-2 border-zinc-300 dark:border-zinc-700 rounded-2xl p-2 space-y-4 pr-2 scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-700">
          {loading ? (
            <div className="flex items-center justify-center py-10">
              <div className="w-6 h-6 border-2 border-indigo-500 rounded-full border-t-transparent animate-spin" />
            </div>
          ) : (
            visibleAuditOrgs.map((auditor) => {
              const isSelected = formData.auditOrg?.data?.$id === auditor.$id;

              const isDisabled = isLocked && !isSelected;

              return (
                <button
                  key={auditor.$id}
                  type="button"
                  onClick={() => handleSelectAuditor(auditor)}
                  disabled={isDisabled}
                  className={`relative w-full text-left p-5 sm:p-6 transition-all duration-200 border rounded-2xl group ${
                    isSelected
                      ? "bg-indigo-50 border-indigo-500 dark:bg-indigo-500/10 dark:border-indigo-500 ring-1 ring-indigo-500 shadow-sm"
                      : "bg-white border-slate-200 dark:bg-slate-900 dark:border-slate-700 shadow-sm"
                  } ${
                    isDisabled
                      ? "opacity-60 cursor-not-allowed grayscale-[30%]"
                      : !isSelected
                        ? "hover:border-indigo-300 dark:hover:border-indigo-700"
                        : ""
                  }`}
                >
                  <div className="flex items-start gap-4 sm:gap-5">
                    <div
                      className={`hidden sm:flex p-3 rounded-xl shrink-0 mt-1 transition-colors ${
                        isSelected
                          ? "bg-indigo-100 text-indigo-600 dark:bg-indigo-600/20 dark:text-indigo-400"
                          : "bg-slate-50 text-slate-400 dark:bg-slate-800 dark:text-slate-500"
                      }`}
                    >
                      <Building2 className="w-6 h-6" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-1">
                        <div>
                          <h3
                            className={`text-lg font-bold truncate ${
                              isSelected
                                ? "text-indigo-900 dark:text-indigo-100"
                                : "text-slate-900 dark:text-white"
                            }`}
                          >
                            {auditor.OrgName}
                          </h3>
                          {/* 
                          <span className="inline-block mt-1.5 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest rounded-md bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                            ID: {auditor.$id}
                          </span> */}
                        </div>

                        <div
                          className={`shrink-0 flex items-center justify-center w-6 h-6 rounded-full border-2 transition-colors mt-1 ${
                            isSelected
                              ? "bg-indigo-600 border-indigo-600 dark:bg-indigo-500 dark:border-indigo-500"
                              : "border-slate-300 dark:border-slate-600"
                          }`}
                        >
                          {isSelected && (
                            <Check className="w-3.5 h-3.5 text-white" />
                          )}
                        </div>
                      </div>

                      <div className="flex flex-col gap-3 mt-5 sm:flex-row sm:items-center sm:gap-6">
                        {/* <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                            <UserCircle className="w-4 h-4 text-slate-400 shrink-0" />

                            <span className="truncate">
                              <span className="font-semibold text-slate-700 dark:text-slate-300">
                                Head:
                              </span>{" "}
                              {
                                auditor.headAuditor
                              }
                            </span>
                          </div> */}

                        <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                          <MapPin className="w-4 h-4 text-slate-400 shrink-0" />

                          <span className="truncate">
                            {auditor.City}, {auditor.state}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Extra Options */}
        {!isLocked && (
          <div className="pt-2 space-y-4">
            {/* OTHER */}
            <div className="relative">
              <button
                type="button"
                onClick={() =>
                  handleSelectAuditor({
                    $id: "OTHER",
                    name: "",
                  })
                }
                className={`relative w-full text-left p-5 sm:p-6 transition-all duration-200 border rounded-2xl group ${
                  formData.auditOrg?.data?.$id === "OTHER"
                    ? "bg-indigo-50 border-indigo-500 dark:bg-indigo-500/10 dark:border-indigo-500 ring-1 ring-indigo-500 shadow-sm"
                    : "bg-white border-slate-200 hover:border-indigo-300 dark:bg-slate-900 dark:border-slate-700 dark:hover:border-indigo-700 shadow-sm"
                }`}
              >
                <div className="flex items-center gap-4 sm:gap-5">
                  <div
                    className={`hidden sm:flex p-3 rounded-xl shrink-0 transition-colors ${
                      formData.auditOrg?.data?.$id === "OTHER"
                        ? "bg-indigo-100 text-indigo-600 dark:bg-indigo-600/20 dark:text-indigo-400"
                        : "bg-slate-50 text-slate-400 dark:bg-slate-800 dark:text-slate-500"
                    }`}
                  >
                    <Building className="w-6 h-6" />
                  </div>

                  <div className="flex items-center justify-between flex-1 min-w-0 gap-4">
                    <div>
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                        Other Auditor
                      </h3>

                      <p className="mt-0.5 text-sm font-medium text-slate-500 dark:text-slate-400">
                        Enter a custom audit partner organization.
                      </p>
                    </div>

                    <div
                      className={`shrink-0 flex items-center justify-center w-6 h-6 rounded-full border-2 ${
                        formData.auditOrg?.data?.$id === "OTHER"
                          ? "bg-indigo-600 border-indigo-600 dark:bg-indigo-500 dark:border-indigo-500"
                          : "border-slate-300 dark:border-slate-600"
                      }`}
                    >
                      {formData.auditOrg?.data?.$id === "OTHER" && (
                        <Check className="w-3.5 h-3.5 text-white" />
                      )}
                    </div>
                  </div>
                </div>
              </button>

              {formData.auditOrg?.data?.$id === "OTHER" && (
                <div className="p-5 mt-3 bg-white border border-indigo-200 shadow-sm sm:p-6 rounded-2xl dark:bg-slate-900 dark:border-indigo-800/50 animate-fadeIn">
                  <label
                    htmlFor="customAuditor"
                    className="block mb-2 text-xs font-bold tracking-widest uppercase text-slate-700 dark:text-slate-300"
                  >
                    Custom Organization Name
                  </label>

                  <input
                    type="text"
                    id="customAuditor"
                    value={formData.auditOrg?.data?.name || ""}
                    onChange={handleCustomNameChange}
                    placeholder="Enter the official name..."
                    className="w-full px-4 py-3 text-sm font-medium transition-all border outline-none bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 dark:text-white"
                  />
                </div>
              )}
            </div>

            {/* NONE */}
            <button
              type="button"
              onClick={() =>
                handleSelectAuditor({
                  $id: "NONE",
                  name: "No Audit Partner",
                })
              }
              className={`relative w-full text-left p-5 sm:p-6 transition-all duration-200 border rounded-2xl group ${
                formData.auditOrg?.data?.$id === "NONE"
                  ? "bg-indigo-50 border-indigo-500 dark:bg-indigo-500/10 dark:border-indigo-500 ring-1 ring-indigo-500 shadow-sm"
                  : "bg-white border-slate-200 hover:border-indigo-300 dark:bg-slate-900 dark:border-slate-700 dark:hover:border-indigo-700 shadow-sm"
              }`}
            >
              <div className="flex items-center gap-4 sm:gap-5">
                <div
                  className={`hidden sm:flex p-3 rounded-xl shrink-0 transition-colors ${
                    formData.auditOrg?.data?.$id === "NONE"
                      ? "bg-indigo-100 text-indigo-600 dark:bg-indigo-600/20 dark:text-indigo-400"
                      : "bg-slate-50 text-slate-400 dark:bg-slate-800 dark:text-slate-500"
                  }`}
                >
                  <UserX className="w-6 h-6" />
                </div>

                <div className="flex items-center justify-between flex-1 min-w-0 gap-4">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                      No Audit Partner
                    </h3>

                    <p className="mt-0.5 text-sm font-medium text-slate-500 dark:text-slate-400">
                      Proceed without selecting an auditor right now.
                    </p>
                  </div>

                  <div
                    className={`shrink-0 flex items-center justify-center w-6 h-6 rounded-full border-2 ${
                      formData.auditOrg?.data?.$id === "NONE"
                        ? "bg-indigo-600 border-indigo-600 dark:bg-indigo-500 dark:border-indigo-500"
                        : "border-slate-300 dark:border-slate-600"
                    }`}
                  >
                    {formData.auditOrg?.data?.$id === "NONE" && (
                      <Check className="w-3.5 h-3.5 text-white" />
                    )}
                  </div>
                </div>
              </div>
            </button>
          </div>
        )}
      </div>

      {/* Error */}
      {errors.auditOrg && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 dark:bg-rose-900/20 dark:border-rose-800/50">
          <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />

          <p className="text-sm font-bold text-rose-800 dark:text-rose-300">
            {errors.auditOrg}
          </p>
        </div>
      )}
    </div>
  );
};

export default Page7;
