"use client";
import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../../hooks/useAuth";
import toast from "react-hot-toast";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";
import TrustcaptchaComponent from "@/components/shared/TrustCaptchaWrapper";


export const ROLE_MAP = {
  coopadmin: {
    label: "Coop Admin",
    className: "text-green-800 dark:text-green-400",
  },
  superuser: {
    label: "Super User",
    className: "text-blue-800 dark:text-blue-400",
  },
  auditer: {
    label: "Auditor",
    className: "text-purple-800 dark:text-purple-400",
  },
  auditerE: {
    label: "Sub-Auditor",
    className: "text-yellow-800 dark:text-yellow-400",
  },
  aud_E: {
    label: "Sub-Auditor",
    className: "text-yellow-800 dark:text-yellow-400",
  },
  auditerT: {
    label: "Trainee Auditor",
    className: "text-indigo-80 dark:text-indigo-400",
  },
  aud_T: {
    label: "Trainee Auditor",
    className: " text-indigo-80, dark:text-indigo-400",
  },
  org_admin: {
    label: "Organization Admin",
    className: "text-red-800 dark:text-red-400",
  },
};

export default function ProfileUpdateForm() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("User Details");
  const [changingPassword, setChangingPassword] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);

  // Appwrite database profile fields
  const [formData, setFormData] = useState({
    salutation: "",
    title: "",
    FirstName: "",
    LastName: "",
    street: "",
    houseNo: "",
    add: "",
    postalCode: "",
    location: "",
    bday: "",
  });

  // Password change fields
  const [oldPass, setOldPass] = useState("");
  const [newPass, setNewPass] = useState("");
  const [newPass2, setNewPass2] = useState("");

  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showNew2, setShowNew2] = useState(false);

  const [captchaToken, setCaptchaToken] = useState("");

  const [docId, setDocId] = useState("");

  const isDeployment = process.env.NODE_ENV === "production";


  const isOnline = useNetworkStatus();

  // Load profile values on mount
  useEffect(() => {
    const load = async () => {
      if (!user) return;

      try {
        const response = await fetch(
          `/api/userServices/update/profile?userId=${encodeURIComponent(user.$id)}`,
        );
        const result = await response.json();

        if (result.success && result.data) {
          const d = result.data;
          setDocId(d.docId);

          setFormData({
            salutation: d.salutation ?? "",
            title: d.title ?? "",
            FirstName: d.FirstName ?? "",
            LastName: d.LastName ?? "",
            street: d.street ?? "",
            houseNo: d.houseNo ?? "",
            add: d.add ?? "",
            postalCode: d.postalCode ?? "",
            location: d.location ?? "",
            bday: d.bday ?? "",
          });
        }
      } catch (e) {
        console.error("Failed to load profile:", e);
      }
    };
    load();
  }, [user]);

  const handleFormChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Save profile changes
  const handleSaveProfile = async () => {
    setSavingProfile(true);
    const loadingToast = toast.loading("Saving profile changes...");
    try {
      const response = await fetch("/api/userServices/update/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ docId, ...formData }),
      });
      const result = await response.json();
      if (!result.success) throw new Error(result.error);
      toast.success("Profile saved successfully", { id: loadingToast });
    } catch (e) {
      toast.error(e.message, { id: loadingToast });
    } finally {
      setSavingProfile(false);
    }
  };

  // Change Password
  const changePassword = async () => {
    if (!oldPass || !newPass || !newPass2) {
      toast.error("Please fill in all password fields");
      return;
    }

    if (newPass !== newPass2) {
      toast.error("New passwords do not match");
      return;
    }

    if (isDeployment && captchaToken.trim() === "") {
      toast.error("Please complete the CAPTCHA.");
      return;
    }
    setChangingPassword(true);
    const loadingToast = toast.loading("Updating password...");

    try {
      const response = await fetch("/api/userServices/update/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ oldPassword: oldPass, newPassword: newPass, captchaToken }),
      });
      const result = await response.json();
      if (!result.success) {
        setCaptchaToken("");
        throw new Error(result.error);
      }


      // Clear inputs completely
      setOldPass("");
      setNewPass("");
      setNewPass2("");

      toast.success("Password updated successfully", { id: loadingToast });
    } catch (e) {
      setCaptchaToken("");
      toast.error(e.message, { id: loadingToast });
    } finally {
      setChangingPassword(false);
    }
  };

  // Computed full name and avatar initials
  const computedFullName =
    `${formData.FirstName || ""} ${formData.LastName || ""}`.trim() ||
    user?.name ||
    "User";
  const initials =
    formData.FirstName && formData.LastName
      ? `${formData.FirstName[0]}${formData.LastName[0]}`.toUpperCase()
      : user?.name
        ? user.name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .slice(0, 2)
            .toUpperCase()
        : "US";

        console.log({isOnline})

  return (
    <div className="pb-10 space-y-6 text-gray-800 dark:text-gray-200">
      {/* Main Content Grid */}
      <div className="grid items-start grid-cols-1 gap-6 lg:grid-cols-4">
        {/* Left Panel - Tabs & Forms (75% width) */}
        <div className="order-2 space-y-6 lg:col-span-3 lg:order-1">
          {/* Tab Navigation */}
          <div className="border-b border-gray-200 dark:border-slate-700">
            <nav className="flex space-x-4 overflow-x-auto" aria-label="Tabs">
              {["User Details", "Basic Details", "Settings"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`py-3 px-2 text-sm font-semibold border-b-2 whitespace-nowrap transition-colors outline-none ${
                    activeTab === tab
                      ? "border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400"
                      : "border-transparent text-gray-500 dark:text-slate-400 hover:text-gray-800 dark:hover:text-slate-200"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content Panel */}
          <div className="px-2 py- dark:border-slate-700">
            {/* 1. USER DETAILS TAB */}
            {activeTab === "User Details" && (
              <div className="space-y-6">
                {/* Basic Info Grid */}
                <div className="space-y-4">
                  <div className="flex items-start justify-between w-full">
                    <h3 className="text-sm font-bold tracking-wider text-gray-900 uppercase dark:text-white">
                      Basic Info
                    </h3>
                    {/* Save Button */}
                    <button
                      onClick={handleSaveProfile}
                      disabled={savingProfile}
                      className="px-6 py-2 text-sm font-semibold text-white transition-colors bg-indigo-600 rounded-lg shadow-sm hover:bg-indigo-700 disabled:opacity-50"
                    >
                      {savingProfile ? "Saving..." : "Save Profile"}
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                    {/* Email (mandatory, read-only) */}
                    <div>
                      <label className="block mb-1.5 text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                        Email <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        disabled
                        value={user?.email || ""}
                        className="w-full px-3.5 py-2 border rounded-lg bg-gray-50 text-gray-500 dark:bg-slate-900/50 dark:border-slate-700 dark:text-slate-400 cursor-not-allowed font-mono text-sm"
                      />
                    </div>

                    {/* Salutation */}
                    <div>
                      <label className="block mb-1.5 text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                        Salutation
                      </label>
                      <select
                        name="salutation"
                        value={formData.salutation}
                        onChange={handleFormChange}
                        className="w-full px-3.5 py-2 border rounded-lg bg-white border-gray-300 dark:bg-slate-700 dark:border-slate-600 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                      >
                        <option value="">Select...</option>
                        <option>Mr.</option>
                        <option>Mrs.</option>
                        <option>Ms.</option>
                        <option>Dr.</option>
                      </select>
                    </div>

                    {/* Title */}
                    <div>
                      <label className="block mb-1.5 text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                        Title
                      </label>
                      <input
                        type="text"
                        name="title"
                        value={formData.title}
                        onChange={handleFormChange}
                        placeholder="e.g. Director"
                        className="w-full px-3.5 py-2 border rounded-lg bg-white border-gray-300 dark:bg-slate-700 dark:border-slate-600 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                      />
                    </div>

                    {/* First Name (mandatory) */}
                    <div>
                      <label className="block mb-1.5 text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                        First Name <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="FirstName"
                        value={formData.FirstName}
                        onChange={handleFormChange}
                        className="w-full px-3.5 py-2 border rounded-lg bg-white border-gray-300 dark:bg-slate-700 dark:border-slate-600 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                      />
                    </div>

                    {/* Last Name */}
                    <div>
                      <label className="block mb-1.5 text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                        Last Name
                      </label>
                      <input
                        type="text"
                        name="LastName"
                        value={formData.LastName}
                        onChange={handleFormChange}
                        className="w-full px-3.5 py-2 border rounded-lg bg-white border-gray-300 dark:bg-slate-700 dark:border-slate-600 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 2. BASIC DETAILS TAB */}
            {activeTab === "Basic Details" && (
              <div className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <h3 className="text-sm font-bold tracking-wider text-gray-900 uppercase dark:text-white">
                      Basic Details
                    </h3>
                    {/* Save Button */}
                    <button
                      onClick={handleSaveProfile}
                      disabled={savingProfile}
                      className="px-6 py-2 text-sm font-semibold text-white transition-colors bg-indigo-600 rounded-lg shadow-sm hover:bg-indigo-700 disabled:opacity-50"
                    >
                      {savingProfile ? "Saving..." : "Save Profile"}
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                    {/* Date of Birth */}
                    <div>
                      <label className="block mb-1.5 text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                        Date of Birth
                      </label>
                      <input
                        type="date"
                        name="bday"
                        value={formData.bday}
                        onChange={handleFormChange}
                        className="w-full px-3.5 py-2 border rounded-lg bg-white border-gray-300 dark:bg-slate-700 dark:border-slate-600 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Address Info Grid (Shifted here from User Details tab) */}
                <div className="pt-6 space-y-4 border-t border-gray-100 dark:border-slate-700/50">
                  <h3 className="text-sm font-bold tracking-wider text-gray-900 uppercase dark:text-white">
                    Address Details
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-4">
                    <div className="md:col-span-2">
                      <label className="block mb-1.5 text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                        Street
                      </label>
                      <input
                        type="text"
                        name="street"
                        value={formData.street}
                        onChange={handleFormChange}
                        className="w-full px-3.5 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block mb-1.5 text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                        House No
                      </label>
                      <input
                        type="text"
                        name="houseNo"
                        value={formData.houseNo}
                        onChange={handleFormChange}
                        className="w-full px-3.5 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block mb-1.5 text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                        No. Addition
                      </label>
                      <input
                        type="text"
                        name="add"
                        value={formData.add}
                        onChange={handleFormChange}
                        className="w-full px-3.5 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block mb-1.5 text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                        Postal Code
                      </label>
                      <input
                        type="text"
                        name="postalCode"
                        value={formData.postalCode}
                        onChange={handleFormChange}
                        className="w-full px-3.5 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block mb-1.5 text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                        Location / City
                      </label>
                      <input
                        type="text"
                        name="location"
                        value={formData.location}
                        onChange={handleFormChange}
                        className="w-full px-3.5 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Save Button */}
                {/* <div className="flex justify-end pt-4">
                  
                </div> */}
              </div>
            )}

            {/* 3. SETTINGS TAB */}
            {activeTab === "Settings" && (
              <div className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-sm font-bold tracking-wider text-gray-900 uppercase dark:text-white">
                    Change Password
                  </h3>

                  <div className="grid max-w-lg grid-cols-1 gap-4">
                    {/* OLD PASSWORD */}
                    <div className="relative">
                      <input
                        type={showOld ? "text" : "password"}
                        placeholder="Old password"
                        value={oldPass}
                        onChange={(e) => setOldPass(e.target.value)}
                        autoComplete="current-password"
                        className="w-full px-3.5 py-2 pr-10 border rounded-lg bg-white border-gray-300 dark:bg-slate-700 dark:border-slate-600 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                      <button
                        type="button"
                        onClick={() => setShowOld(!showOld)}
                        className="absolute text-gray-500 -translate-y-1/2 right-3 top-1/2 dark:text-gray-400 hover:text-gray-800"
                      >
                        {showOld ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>

                    {/* NEW PASSWORD */}
                    <div className="relative">
                      <input
                        type={showNew ? "text" : "password"}
                        placeholder="New password"
                        value={newPass}
                        onChange={(e) => setNewPass(e.target.value)}
                        autoComplete="new-password"
                        className="w-full px-3.5 py-2 pr-10 border rounded-lg bg-white border-gray-300 dark:bg-slate-800 dark:border-slate-600 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNew(!showNew)}
                        className="absolute text-gray-500 -translate-y-1/2 right-3 top-1/2 dark:text-gray-400 hover:text-gray-800"
                      >
                        {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>

                    {/* CONFIRM NEW PASSWORD */}
                    <div className="relative">
                      <input
                        type={showNew2 ? "text" : "password"}
                        placeholder="Confirm new password"
                        value={newPass2}
                        onChange={(e) => setNewPass2(e.target.value)}
                        autoComplete="new-password"
                        className="w-full px-3.5 py-2 pr-10 border rounded-lg bg-white border-gray-300 dark:bg-slate-800 dark:border-slate-600 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNew2(!showNew2)}
                        className="absolute text-gray-500 -translate-y-1/2 right-3 top-1/2 dark:text-gray-400 hover:text-gray-800"
                      >
                        {showNew2 ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  <div className="pt-2">
                    <div className="mb-4">
                      {isDeployment && (
                        <>
                          {/* TrustCaptcha temporarily disabled.
                              Google reCAPTCHA is currently the active provider.
                              Existing implementation retained for future use.
                          <TrustcaptchaComponent
                            sitekey={process.env.NEXT_PUBLIC_TRUST_CAPTCHA_SITE_KEY}
                            onCaptchaSolved={(event) => {
                              setCaptchaToken(event.detail);
                            }}
                            onCaptchaFailed={() => {
                              setCaptchaToken("");
                            }}
                          />
                          */}
                          <TrustcaptchaComponent
                            captchaToken={captchaToken}
                            onCaptchaSolved={(event) => {
                              setCaptchaToken(event.detail);
                            }}
                            onCaptchaFailed={() => {
                              setCaptchaToken("");
                            }}
                          />
                        </>
                      )}
                    </div>
                    <button
                      onClick={changePassword}
                      disabled={changingPassword}
                      className="flex items-center gap-2 px-6 py-2 text-sm font-semibold text-white transition-colors bg-indigo-600 rounded-lg shadow-sm hover:bg-indigo-700 disabled:opacity-50"
                    >
                      {changingPassword && (
                        <Loader2 size={16} className="animate-spin" />
                      )}
                      {changingPassword ? "Updating..." : "Update Password"}
                    </button>
                  </div>

                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Sidebar Panel - Simplified User Card (25% width) */}
        <div className="order-1 h-full lg:col-span-1 lg:border-l lg:order-2">
          <div className="px-4 space-y-4">
            {/* Avatar initials box */}
            <div className="flex items-center justify-center w-24 h-24 mx-auto text-3xl font-bold text-indigo-700 border-2 border-indigo-100 shadow-sm lg:mx-0 rounded-2xl bg-indigo-50 dark:bg-indigo-950/30 dark:border-indigo-900/30 dark:text-indigo-400">
              {initials}
            </div>

            {/* Name and Email - wrapped properly to fit without truncate */}
            <div className="space-y-1 text-center lg:text-start">
              <div className="flex items-center justify-center gap-2 lg:justify-start">
                <h2
                  className="text-base font-bold text-gray-900 break-words dark:text-white"
                  title={computedFullName}
                >
                  {computedFullName}
                </h2>
                {/* {isOnline && ( */}
                  <div className="flex items-center justify-center">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${isOnline ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" : "bg-gray-300 text-gray-800 dark:bg-gray-600/30 dark:text-gray-400"}`}
                    >
                      {isOnline ? "Online" : "Offline"}
                    </span>
                  </div>
                {/* )} */}
              </div>
              <p
                className="font-mono text-xs text-gray-500 break-all dark:text-slate-400"
                title={user?.email}
              >
                {user?.email}
              </p>
              {/* add role from user.role */}
              {user?.role && (
                <p
                  className={`font-medium text-xs break-all ${ROLE_MAP[user.role]?.className || ""}`}
                >
                  {ROLE_MAP[user.role].label || user.role}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
