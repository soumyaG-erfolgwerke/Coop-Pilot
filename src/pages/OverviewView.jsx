"use client";
import React, { useEffect, useState } from "react";
import SubAuditorStats from "./SubAuditorStats.jsx";
import { getAllActivatedCoops } from "../lib/getCoopsService.js";

export default function OverviewView() {
  const [cooperatives, setCooperatives] = useState([]);

  useEffect(() => {
    (async () => {
      const data = await getAllActivatedCoops();
      setCooperatives(data || []);
    })();
  }, []);

  return (
    <div className="px-6 pt-6">
      {/* ====== LIFE CYCLE SECTION ====== */}
      <section className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6">
        <h1 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
          Life cycle of an Audit
        </h1>

        {/* CASE 1 */}
        <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
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
        <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
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
        <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
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

      {/* ====== ADDING THE DYNAMIC STAT CARDS BELOW ====== */}
      <div className="mt-8">
        <SubAuditorStats cooperatives={cooperatives} />
      </div>
    </div>
  );
}

/* --- REUSABLE UI COMPONENTS --- */
function CyclePill({ label }) {
  return (
    <span className="px-3 py-1 rounded-full border border-gray-300 text-xs text-gray-700 dark:text-gray-200">
      {label}
    </span>
  );
}

function YesPill({ label }) {
  return (
    <span className="px-3 py-1 rounded-full bg-green-50 text-green-700 text-xs border border-green-200">
      {label}
    </span>
  );
}

function NoPill({ label }) {
  return (
    <span className="px-3 py-1 rounded-full bg-rose-50 text-rose-700 text-xs border border-rose-200">
      {label}
    </span>
  );
}

function Arrow() {
  return <span className="mx-2 text-gray-400">→</span>;
}
