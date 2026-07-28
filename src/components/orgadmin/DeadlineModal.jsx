"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import { CalendarDays, X, ChevronLeft, ChevronRight } from "lucide-react";
import { DateTime } from "luxon";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

export default function DeadlineModal({
  open,
  onClose,
  coop,
  onSave,
  loading,
}) {
  const [selectedDate, setSelectedDate] = useState(null);
  const [openCal, setOpenCal] = useState(false);
  const [viewDate, setViewDate] = useState(new Date());
  const [openUpward, setOpenUpward] = useState(false);
  
  const containerRef = useRef(null);

  useEffect(() => {
    if (coop?.currentAuditDeadline) {
      const d = new Date(coop.currentAuditDeadline);
      setSelectedDate(d);
      setViewDate(d);
    } else {
      setSelectedDate(null);
      setViewDate(new Date());
    }
  }, [coop]);

  // Dynamic screen height detection to determine drop direction
  useEffect(() => {
    if (!openCal || !containerRef.current) return;

    const handlePositioning = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const spaceBelow = window.innerHeight - rect.bottom;
        // 320px accounts for the approximate height of the calendar dropdown
        setOpenUpward(spaceBelow < 250);
      }
    };

    handlePositioning();
    window.addEventListener("resize", handlePositioning);
    return () => window.removeEventListener("resize", handlePositioning);
  }, [openCal]);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const isSameDay = (a, b) =>
    a &&
    b &&
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();

  const isDisabled = (d) => d <= today;

  const formatDate = (d) =>
    d
      ? d.toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        })
      : "Select date";

  const days = useMemo(() => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    const startOffset = firstDay.getDay();
    const totalDays = lastDay.getDate();

    const arr = [];

    for (let i = 0; i < startOffset; i++) arr.push(null);
    for (let i = 1; i <= totalDays; i++) {
      arr.push(new Date(year, month, i));
    }

    return arr;
  }, [viewDate]);

  const yearsRange = useMemo(() => {
    const currentYear = new Date().getFullYear();
    return Array.from({ length: 25 }, (_, i) => currentYear - 5 + i);
  }, []);

  const changeMonth = (dir) => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + dir, 1));
  };

  const handleMonthSelect = (monthIndex) => {
    setViewDate(new Date(viewDate.getFullYear(), monthIndex, 1));
  };

  const handleYearSelect = (year) => {
    setViewDate(new Date(year, viewDate.getMonth(), 1));
  };

  if (!open || !coop) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 overflow-y-auto bg-black/30 backdrop-blur-[2px] sm:items-center">
      {/* Clickable Backdrop overlay */}
      <div onClick={onClose} className="fixed inset-0 pointer-events-auto" />

      {/* Modal Box wrapper */}
      <div className="relative my-auto w-full max-w-md rounded-2xl border border-slate-200 bg-white shadow-[0_8px_30px_rgba(0,0,0,0.08)] dark:bg-slate-800 dark:border-slate-800 z-10">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-700">
          <div>
            <h2 className="text-[15px] font-semibold text-slate-900 dark:text-white">
              Update deadline
            </h2>
            <p className="text-xs text-slate-500 dark:text-gray-400">Set audit completion date</p>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-500 hover:bg-slate-100 dark:text-gray-400 dark:hover:bg-gray-700"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-5 py-4 space-y-5">
          <div className="p-3 border rounded-xl border-slate-200 dark:border-slate-700 dark:bg-slate-900/50">
            <p className="text-sm font-medium text-slate-900 dark:text-white">{coop.name}</p>
            <p className="text-xs text-slate-500 dark:text-gray-400">{coop.RegNumber}</p>
          </div>

          <div className="space-y-1">
            <p className="text-xs text-slate-500 dark:text-gray-400">Current deadline</p>
            <p className="text-sm font-medium text-slate-900 dark:text-white">
              {coop.currentAuditDeadline
                ? DateTime.fromISO(coop.currentAuditDeadline).toFormat("dd LLL yyyy")
                : "Not set"}
            </p>
          </div>

          <div>
            <p className="mb-2 text-xs text-slate-500 dark:text-gray-400">New deadline</p>

            {/* Isolate trigger and panel element into its own relative container */}
            <div className="relative" ref={containerRef}>
              <button
                onClick={() => setOpenCal((v) => !v)}
                className="flex items-center justify-between w-full h-10 px-3 text-sm border rounded-md border-slate-200 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-700 dark:text-gray-300 dark:hover:bg-gray-600"
              >
                <span className="text-slate-900 dark:text-white">{formatDate(selectedDate)}</span>
                <CalendarDays className="w-4 h-4 text-slate-400 dark:text-gray-400" />
              </button>

              {openCal && (
                <div 
                  className={`absolute left-0 right-0 z-50 rounded-xl border border-slate-200 bg-white p-3 shadow-[0_8px_25px_rgba(0,0,0,0.08)] dark:border-slate-700 dark:bg-slate-800 transition-all ${
                    openUpward ? "bottom-full mb-2" : "top-full mt-2"
                  }`}
                >
                  {/* Header selectors for Month and Year */}
                  <div className="flex items-center justify-between gap-1 mb-3">
                    <button
                      onClick={() => changeMonth(-1)}
                      className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 hover:text-slate-900 dark:text-gray-400 dark:hover:text-white"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>

                    <div className="flex items-center gap-1.5">
                      {/* Month Picker dropdown */}
                      <select
                        value={viewDate.getMonth()}
                        onChange={(e) => handleMonthSelect(parseInt(e.target.value))}
                        className="text-xs font-semibold bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-600 rounded-md py-1 px-1.5 focus:outline-none focus:ring-1 focus:ring-slate-400 cursor-pointer"
                      >
                        {MONTHS.map((monthName, idx) => (
                          <option key={monthName} value={idx} className="dark:bg-slate-800">
                            {monthName}
                          </option>
                        ))}
                      </select>

                      {/* Year Picker dropdown */}
                      <select
                        value={viewDate.getFullYear()}
                        onChange={(e) => handleYearSelect(parseInt(e.target.value))}
                        className="text-xs font-semibold bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-600 rounded-md py-1 px-1.5 focus:outline-none focus:ring-1 focus:ring-slate-400 cursor-pointer"
                      >
                        {yearsRange.map((year) => (
                          <option key={year} value={year} className="dark:bg-slate-800">
                            {year}
                          </option>
                        ))}
                      </select>
                    </div>

                    <button
                      onClick={() => changeMonth(1)}
                      className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 hover:text-slate-900 dark:text-gray-400 dark:hover:text-white"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-7 text-[10px] text-slate-400 dark:text-gray-500 font-medium tracking-wider mb-1">
                    {["SU", "MO", "TU", "WE", "TH", "FR", "SA"].map((d) => (
                      <div key={d} className="py-1 text-center">
                        {d}
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-7 gap-1 text-sm">
                    {days.map((d, i) => {
                      if (!d) return <div key={i} />;

                      const disabled = isDisabled(d);
                      const selected = isSameDay(d, selectedDate);

                      return (
                        <button
                          key={i}
                          type="button"
                          disabled={disabled}
                          onClick={() => {
                            if (disabled) return;
                            setSelectedDate(d);
                            setOpenCal(false);
                          }}
                          className={`h-8 rounded-md text-xs transition-colors ${
                            selected
                              ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 font-semibold"
                              : "hover:bg-slate-100 dark:hover:bg-slate-700"
                          } ${
                            disabled
                              ? "cursor-not-allowed text-slate-200 dark:text-slate-700"
                              : "text-slate-700 dark:text-gray-300"
                          }`}
                        >
                          {d.getDate()}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 px-5 py-3 border-t border-slate-100 dark:border-slate-700">
          <button
            onClick={onClose}
            className="rounded-md border border-slate-200 px-3 py-1.5 text-sm font-medium hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
          >
            Cancel
          </button>

          <button
            disabled={!selectedDate || loading}
            onClick={() => {
              if (!selectedDate) return;
              const date = DateTime.fromJSDate(selectedDate).startOf("day"); 
              onSave(date.toISODate());
            }}
            className="rounded-md bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200 disabled:opacity-50"
          >
            {loading ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}