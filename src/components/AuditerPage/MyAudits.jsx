"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getMyAudits } from "@/lib/auditDetailService";

import { Eye } from "lucide-react";
import DeadlineBadge from "../orgadmin/DeadlineBadge";
import AuditDetails from "./AuditDetails";

// Premium minimalist badge styling using fine inset rings instead of heavy solid backgrounds
export const STATUS_STYLES = {
  SUBMITTED: "bg-blue-50 text-blue-700 ring-blue-600/10",
  UNDER_REVIEW: "bg-amber-50 text-amber-700 ring-amber-600/15",
  IN_PROGRESS: "bg-purple-50 text-purple-700 ring-purple-700/10",
  APPROVED: "bg-emerald-50 text-emerald-700 ring-emerald-600/10",
  REJECTED: "bg-rose-50 text-rose-700 ring-rose-600/10",
};

const getAuditTags = (audit) => {
  const tags = [];

  const deadline = audit?.deadline;
  const status = audit?.status;

  const isOverdue = deadline && new Date(deadline) < new Date();

  if (status === "SUBMITTED" || status === "UNDER_REVIEW") {
    tags.push({
      label: "Active",
      color: "bg-sky-50 text-sky-700 ring-sky-600/10",
    });

    if (isOverdue) {
      tags.push({
        label: "Overdue",
        color: "bg-red-50 text-red-700 ring-red-600/10",
      });
    }
  }

  if (status === "IN_PROGRESS") {
    tags.push({
      label: "In Progress",
      color: "bg-purple-50 text-purple-700 ring-purple-700/10",
    });
  }

  if (status === "APPROVED" || status === "REJECTED") {
    tags.push({
      label: "Completed",
      color: "bg-emerald-50 text-emerald-700 ring-emerald-600/10",
    });
  }

  return tags;
};

const MyAudits = ({ auditOrg }) => {
  const [audits, setAudits] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const searchParams = useSearchParams();

  const auditId = searchParams.get("auditId");
  const selectedAudit = audits.find((item) => item.audit?.id === auditId);

  const handleDetailsClick = (auditId) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("auditId", auditId);
    router.push(`?${params.toString()}`);
  };

  const handleBack = () => {
    const params = new URLSearchParams(searchParams.toString());

    params.delete("auditId");

    router.replace(`?${params.toString()}`);
  };

  useEffect(() => {
    const fetchAudits = async () => {
      setLoading(true);
      try {
        const data = await getMyAudits({
          orgId: auditOrg.id,
        });

        setAudits(data?.audits || []);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchAudits();
  }, [auditOrg.id]);

  if (auditId && selectedAudit) {
    return <AuditDetails onBack={handleBack} />;
  }

  return (
    <div className="m-2 overflow-hidden bg-white border shadow-sm border-slate-200 rounded-xl">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead className="border-b bg-slate-50/75 border-slate-200">
            <tr>
              <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500">
                Cooperative
              </th>
              <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500">
                Status
              </th>
              <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500">
                Deadline
              </th>
              <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500">
                Tags
              </th>
              <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500 text-right">
                Action
              </th>
            </tr>
          </thead>

          <tbody className="bg-white divide-y divide-slate-100">
            {audits.map((coop) => {
              const tags = getAuditTags(coop.audit);

              return (
                <tr
                  key={coop.coopId}
                  className="transition-colors duration-200 hover:bg-slate-50/50"
                >
                  {/* COOP COLUMN */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3.5">
                      <div className="w-10 h-10 overflow-hidden bg-white border rounded-lg shadow-sm border-slate-100 shrink-0">
                        <img
                          src={coop.coopLogo}
                          alt={coop.coopName}
                          className="object-cover w-full h-full"
                        />
                      </div>

                      <div>
                        <p className="text-sm font-semibold tracking-tight text-slate-900">
                          {coop.coopName}
                        </p>
                        <p className="text-xs font-mono text-slate-400 mt-0.5">
                          ID:{" "}
                          {`${"X".repeat(coop.audit?.id?.length - 4)}${coop.audit?.id?.slice(-4)}`}
                        </p>
                      </div>
                    </div>
                  </td>

                  {/* STATUS */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    {coop.audit ? <span
                      className={`inline-flex items-center rounded-md px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${
                        STATUS_STYLES[coop.audit?.status] ||
                        "bg-slate-50 text-slate-700 ring-slate-600/10"
                      }`}
                    >
                      {coop.audit?.status?.replaceAll("_", " ")}
                    </span>: (
                      <span className="text-xs italic text-slate-400">
                        No audit assigned
                      </span>
                    )}
                  </td>

                  {/* DEADLINE */}
                  <td className="px-6 py-4 text-sm whitespace-nowrap text-slate-600">
                    {coop.audit?.deadline ? (
                      <DeadlineBadge date={coop.audit?.deadline} />
                    ) : (
                      <span className="text-xs italic text-slate-400">
                        No deadline
                      </span>
                    )}
                  </td>

                  {/* TAGS */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-wrap gap-1.5">
                      {tags.map((tag) => (
                        <span
                          key={tag.label}
                          className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${tag.color}`}
                        >
                          {tag.label}
                        </span>
                      ))}
                    </div>
                  </td>

                  {/* ACTION */}
                  <td className="px-6 py-4 text-right whitespace-nowrap">
                    <button
                      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm transition-all hover:bg-slate-50 hover:text-slate-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-600"
                      onClick={() => handleDetailsClick(coop.audit?.id)}
                      disabled={!coop.audit}
                    >
                      <Eye size={14} className="text-slate-400" />
                      Details
                    </button>
                  </td>
                </tr>
              );
            })}

            {audits.length === 0 && !loading && (
              <tr>
                <td
                  colSpan={5}
                  className="py-12 text-sm font-medium text-center text-slate-400 bg-slate-50/20"
                >
                  No audits found
                </td>
              </tr>
            )}

            {loading && (
              <tr>
                <td
                  colSpan={5}
                  className="py-12 text-sm font-medium text-center text-slate-400 bg-slate-50/20"
                >
                  Loading audits...
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default MyAudits;
