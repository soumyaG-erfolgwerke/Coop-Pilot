"use client";
import React, { useEffect, useState } from "react";
import SubAuditorStats from "./SubAuditorStats.jsx";
import { getAllActivatedCoops } from "../../lib/getCoopsService.js";

export default function Overview() {
  const [cooperatives, setCooperatives] = useState([]);

  useEffect(() => {
    (async () => {
      const data = await getAllActivatedCoops();
      setCooperatives(data || []);
    })();
  }, []);

  return (
    <div className="p-6 overflow-hidden ">
      {/* ====== LIFE CYCLE SECTION ====== */}
      <section className="p-6 bg-white border border-gray-200 rounded-2xl dark:border-gray-800 dark:bg-gray-900">
        <h1 className="mb-4 text-xl font-semibold text-gray-800 dark:text-white">
          Life cycle of an Audit
        </h1>

        {/* CASE 1 */}
        <p className="mb-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
          CASE 1: Pre-Audit
        </p>

        <div className="flex flex-wrap items-center gap-2 mb-6">
          <CyclePill label="Create Audit" />
          <CyclePill label="Convert to Open" />
          <CyclePill label="Ready for Visit?" />
          <Arrow />
          <YesPill label="Mark as Scheduled" />
          <NoPill label="Mark as On Hold" />
        </div>

        {/* CASE 2 */}
        <p className="mb-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
          CASE 2: During Audit
        </p>

        <div className="flex flex-wrap items-center gap-2 mb-6">
          <CyclePill label="Open" />
          <CyclePill label="Visit Started?" />
          <CyclePill label="Findings Recorded?" />
          <Arrow />
          <YesPill label="Mark as Completed" />
          <NoPill label="Record Partial Findings" />
        </div>

        {/* CASE 3 */}
        <p className="mb-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
          CASE 3: Post-Audit
        </p>

        <div className="flex flex-wrap items-center gap-2 mb-6">
          <CyclePill label="Completed" />
          <CyclePill label="Report Prepared?" />
          <Arrow />
          <YesPill label="Send Report" />
          <NoPill label="Request Clarification" />
        </div>

        {/* DESCRIPTION */}
        <div>
          <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100">
            In the Audit module, you can:
          </h3>
          <ul className="mt-2 space-y-1 text-sm text-gray-600 dark:text-gray-300">
            <li>✓ Create audits to accompany field inspections.</li>
            <li>
              ✓ Convert an audit into a report to charge or notify stakeholders.
            </li>
            <li>
              ✓ Mark audits as completed, on hold, or record partial findings.
            </li>
          </ul>
        </div>
      </section>
    </div>
  );
}

/* --- REUSABLE UI COMPONENTS --- */
function CyclePill({ label }) {
  return (
    <span className="px-3 py-1 text-xs text-gray-700 border border-gray-300 rounded-full dark:text-gray-200">
      {label}
    </span>
  );
}

function YesPill({ label }) {
  return (
    <span className="px-3 py-1 text-xs text-green-700 border border-green-200 rounded-full bg-green-50">
      {label}
    </span>
  );
}

function NoPill({ label }) {
  return (
    <span className="px-3 py-1 text-xs border rounded-full bg-rose-50 text-rose-700 border-rose-200">
      {label}
    </span>
  );
}

function Arrow() {
  return <span className="mx-2 text-gray-400">→</span>;
}
