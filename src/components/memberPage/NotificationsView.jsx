"use client";
import React, { useState, useEffect } from "react";
import {
  LayoutDashboard,
  PieChart,
  Vote,
  ShieldCheck,
  Users,
  Bell,
  FileText,
  Leaf,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Edit3,
  UploadCloud,
  Search,
  Filter,
  Plus,
  MoreHorizontal,
  CalendarDays,
  Info,
  CheckCircle,
  AlertTriangle,
  Sun,
  Moon,
  AlignLeft,
  ExternalLink,
  Download,
  ThumbsUp,
  ThumbsDown,
} from "lucide-react";

const mockNotifications = [
  {
    id: 1,
    title: "New Document Uploaded",
    content:
      "The Q1 financial report has been uploaded to the Governance section.",
    type: "System",
    date: "3 days ago",
    read: false,
  },
  {
    id: 2,
    title: "Upcoming Vote Reminder",
    content: "The vote for the new board member election closes in 2 days.",
    type: "Reminder",
    date: "1 day ago",
    read: false,
  },
  {
    id: 3,
    title: "Meeting Minutes Available",
    content: "Minutes for the last board meeting are now available.",
    type: "Announcement",
    date: "1 week ago",
    read: true,
  },
];

export default function NotificationsView() {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [type, setType] = useState("Announcement");

  const handleCreateNotification = (e) => {
    e.preventDefault();
    // console.log("New Test Notification:", {title, content, type});
    // Add to mockNotifications or send to backend
    setTitle("");
    setContent("");
  };
  return (
    <div className="grid grid-cols-1 gap-8 p-6 animate-fadeIn lg:grid-cols-3">
      <div className="lg:col-span-2">
        <h2 className="mb-4 text-2xl font-semibold text-gray-800 dark:text-white">
          Announcements
        </h2>
        <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">
          Important updates and notifications.
        </p>
        {mockNotifications.length > 0 ? (
          <ul className="space-y-4">
            {mockNotifications.map((notif) => (
              <li
                key={notif.id}
                className={`p-4 rounded-lg border-l-4 flex items-start gap-3 ${
                  notif.read
                    ? "bg-gray-50 dark:bg-slate-800/50 border-gray-300 dark:border-slate-600"
                    : "bg-blue-50 dark:bg-primary-dark-900/30 border-primary dark:border-primary/80 shadow-md"
                }`}
              >
                <div
                  className={`mt-1 p-1.5 rounded-full ${
                    notif.read
                      ? "bg-gray-200 dark:bg-slate-700"
                      : "bg-blue-200 dark:bg-primary-dark-700"
                  }`}
                >
                  <Bell
                    size={16}
                    className={
                      notif.read
                        ? "text-gray-500 dark:text-gray-400"
                        : "text-blue-600 dark:text-blue-300"
                    }
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between">
                    <h4
                      className={`font-semibold ${
                        notif.read
                          ? "text-gray-700 dark:text-gray-300"
                          : "text-blue-primary dark:text-blue-200"
                      }`}
                    >
                      {notif.title}
                    </h4>
                    <span className="text-xs text-gray-400 dark:text-gray-500">
                      {notif.date}
                    </span>
                  </div>
                  <p
                    className={`text-sm mt-0.5 ${
                      notif.read
                        ? "text-gray-600 dark:text-gray-400"
                        : "text-blue-700 dark:text-blue-300"
                    }`}
                  >
                    {notif.content}
                  </p>
                  {!notif.read && (
                    <button className="mt-1 text-xs text-blue-600 dark:text-primary/80 hover:underline">
                      Mark as read
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="py-10 text-center bg-white rounded-lg shadow dark:bg-slate-800">
            <Bell
              size={40}
              className="mx-auto mb-3 text-gray-300 dark:text-slate-600"
            />
            <p className="text-gray-500 dark:text-gray-400">
              No new notifications.
            </p>
          </div>
        )}
      </div>
      <div className="p-6 bg-white shadow-lg lg:col-span-1 dark:bg-slate-800 rounded-xl h-fit">
        <h3 className="mb-1 text-xl font-semibold text-gray-800 dark:text-white">
          Create Test Notification
        </h3>
        <p className="mb-4 text-xs text-gray-500 dark:text-gray-400">
          This is a tool for testing notifications. In production, notifications
          are typically system-generated.
        </p>
        <form onSubmit={handleCreateNotification} className="space-y-4">
          <div>
            <label
              htmlFor="notifTitle"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Title
            </label>
            <input
              type="text"
              id="notifTitle"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="block w-full px-3 py-2 mt-1 bg-white border border-gray-300 rounded-md shadow-sm dark:border-slate-600 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm dark:bg-slate-700"
              required
            />
          </div>
          <div>
            <label
              htmlFor="notifContent"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Content
            </label>
            <textarea
              id="notifContent"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows="3"
              className="block w-full px-3 py-2 mt-1 bg-white border border-gray-300 rounded-md shadow-sm dark:border-slate-600 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm dark:bg-slate-700"
              required
            />
          </div>
          <div>
            <label
              htmlFor="notifType"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Type
            </label>
            <select
              id="notifType"
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="block w-full px-3 py-2 mt-1 bg-white border border-gray-300 rounded-md shadow-sm appearance-none dark:border-slate-600 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm dark:bg-slate-700"
            >
              <option>Announcement</option>
              <option>Reminder</option>
              <option>System</option>
              <option>Urgent</option>
            </select>
          </div>
          <button
            type="submit"
            className="w-full px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium"
          >
            Create Notification
          </button>
        </form>
      </div>
    </div>
  );
}

