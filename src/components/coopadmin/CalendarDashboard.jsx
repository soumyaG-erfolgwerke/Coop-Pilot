"use client";

import React from "react";
import { CalendarDays, Clock, Users, Bell, Plus } from "lucide-react";

const stats = [
  { label: "Upcoming Events", value: "6", icon: CalendarDays, color: "bg-sky-500" },
  { label: "This Week", value: "2", icon: Clock, color: "bg-amber-500" },
  { label: "Attendees Expected", value: "85", icon: Users, color: "bg-emerald-500" },
  { label: "Reminders Set", value: "4", icon: Bell, color: "bg-rose-500" },
];

const events = [
  { title: "Board Meeting", date: "10 Mar 2026", time: "10:00 – 12:00", category: "Meeting", attendees: 7 },
  { title: "Member Onboarding Workshop", date: "14 Mar 2026", time: "14:00 – 16:00", category: "Workshop", attendees: 20 },
  { title: "Annual General Assembly", date: "15 Apr 2026", time: "14:00 – 18:00", category: "Assembly", attendees: 50 },
  { title: "Q1 Financial Review", date: "20 Mar 2026", time: "09:00 – 10:30", category: "Review", attendees: 5 },
  { title: "Community Solar Project Kickoff", date: "02 Apr 2026", time: "11:00 – 13:00", category: "Project", attendees: 15 },
];

const categoryColors = {
  Meeting: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  Workshop: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
  Assembly: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300",
  Review: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  Project: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
};

export default function CalendarDashboard() {
  return (
    <div className="p-4 sm:p-6 space-y-6 animate-fadeIn">
      {/* Coming Soon Banner */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-sky-600 to-cyan-600 p-6 text-white">
        <div className="relative z-10">
          <span className="inline-block px-3 py-1 mb-3 text-xs font-semibold bg-white/20 rounded-full">
            COMING SOON
          </span>
          <h2 className="text-2xl font-bold mb-1">Calendar</h2>
          <p className="text-sky-100 text-sm max-w-lg">
            Manage your cooperative&apos;s events, meetings, and deadlines in one shared calendar. Set reminders and track attendance effortlessly.
          </p>
        </div>
        <div className="absolute -right-6 -top-6 w-32 h-32 bg-white/10 rounded-full" />
        <div className="absolute -right-2 -bottom-8 w-24 h-24 bg-white/5 rounded-full" />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <div
            key={stat.label}
            className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-md opacity-0 animate-fadeInUp"
            style={{ animationDelay: `${i * 100}ms` }}
          >
            <div className="flex items-center justify-between mb-2">
              <div className={`p-2 rounded-full ${stat.color}`}>
                <stat.icon size={18} className="text-white" />
              </div>
              <span className="text-2xl font-bold text-gray-800 dark:text-white">{stat.value}</span>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Events List */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Upcoming Events</h3>
          <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-sky-600 rounded-lg hover:bg-sky-700 transition-colors cursor-not-allowed opacity-60">
            <Plus size={14} /> Add Event
          </button>
        </div>
        <div className="space-y-3">
          {events.map((event) => (
            <div key={event.title} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-700/50 rounded-lg">
              <div className="flex-1">
                <p className="font-medium text-gray-800 dark:text-white">{event.title}</p>
                <div className="flex items-center gap-4 mt-1 text-sm text-gray-500 dark:text-gray-400">
                  <span className="flex items-center gap-1"><CalendarDays size={14} /> {event.date}</span>
                  <span className="flex items-center gap-1"><Clock size={14} /> {event.time}</span>
                  <span className="flex items-center gap-1"><Users size={14} /> {event.attendees}</span>
                </div>
              </div>
              <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${categoryColors[event.category]}`}>
                {event.category}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
