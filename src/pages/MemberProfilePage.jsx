"use client";
import React, { useEffect, useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import toast from "react-hot-toast";
import { User, Mail, Phone, MapPin, Calendar, Hash, ShieldCheck, Edit3, Info, X, Clock, History, UploadCloud, File as FileIcon, Trash2, Lock, Loader2, Download, Loader, KeyRound, Key} from "lucide-react";
import TrustcaptchaComponent from "@/components/shared/TrustCaptchaWrapper";

import { getProfileByUserId } from "@/lib/profileService";
import { getCoopById } from "@/lib/getCoopsService";
import GenerateMembershipPDF from "@/components/pdf/GenerateMembershipPDF";
import { validatePassword } from "@/helpers/passwordValidator";

const REQUIRES_DOC_FIELDS = ["street", "houseNo", "postalCode", "location"];

export default function MemberProfileView({coops=[]}) {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editData, setEditData] = useState({});
  const [requests, setRequests] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const fileInputRef = useRef(null);
  const [coopData, setCoopData] = useState(null);
  const [signatureDetails, setSignatureDetails] = useState({ sign: "", place: "" });
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false)
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [oldPass, setOldPass] = useState("");
  const [newPass, setNewPass] = useState("");
  const [newPass2, setNewPass2] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);
  const [captchaToken, setCaptchaToken] = useState("");


  const isDeployment = process.env.NEXT_PUBLIC_NODE_ENV === "production";
  
  const [formData, setFormData] = useState({
    salutation: "",
    title: "",
    FirstName: "",
    LastName: "",
    street: "",
    houseNo: "",
    add: "",
    postalCode: "",
    telephoneNo: "",
    location: "",
    email: "",
    dateOfBirth: "",
    status: "",
    memberNumber: "",
    entryDate: "",
    howHeard: "",
    wantToBe: "",
    role: "",
    accountHolder: "",
    ibanNo: "",
    taxId: "",
    kycStatus: "PENDING",
  });

  const fetchRequests = useCallback(async () => {
    if (!user?.$id) return;
    try {
      const res = await fetch(`/api/userServices/profileRequests?userId=${user.$id}`);
      const result = await res.json();
      if (result.success) {
        setRequests(result.data);
      }
    } catch (err) {
      console.error(err);
    }
  }, [user]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  useEffect(() => {
    const fetchCoop = async () => {
      if (!user?.$id || !coops || coops.length === 0) return;

      try {
        const res = await getCoopById(coops[0].coopId);
        setCoopData(res);

        // Fetch latest coopxmember document for this user & coop
        const coopId = coops[0].coopId;
        const memberRes = await fetch(`/api/coop-r-member?userId=${user.$id}&coopId=${coopId}`);
        const memberData = await memberRes.json();
        if (memberData.success && memberData.membership && memberData.membership.length > 0) {
          const latestMembership = memberData.membership[0];
          const latestMemberNumber = latestMembership.membershipId || "";
          setFormData(prev => ({
            ...prev,
            memberNumber: latestMemberNumber,
            status: latestMembership.status || "Pending"
          }));
        } else {
          setFormData(prev => ({
            ...prev,
            memberNumber: "",
            status: "Unknown"
          }));
        }

        // Fetch cooperative-specific KYC status
        try {
          const kycRes = await fetch(`/api/member/kyc-status?coopId=${coopId}`);
          const kycResult = await kycRes.json();
          if (kycResult.success) {
            setFormData(prev => ({
              ...prev,
              kycStatus: kycResult.kycStatus || "PENDING"
            }));
          }
        } catch (err) {
          console.error("Failed to fetch cooperative-specific KYC status:", err);
        }

        // Fetch user signature and place
        try {
          const userTextFormRes = await fetch(`/api/coop-r-member/user-text-form?userId=${user.$id}&coopId=${coopId}`);
          const userTextFormData = await userTextFormRes.json();
          if (userTextFormData.success && userTextFormData.form) {
            setSignatureDetails({
              sign: userTextFormData.form.sign || "",
              place: userTextFormData.form.place || ""
            });
          } else {
            setSignatureDetails({ sign: "", place: "" });
          }
        } catch (err) {
          console.error("Failed to fetch user signature details:", err);
        }
      } catch (error) {
        console.error("Failed to fetch coop or membership:", error);
      }
    };

    fetchCoop();
  }, [coops, user]);

  const changePassword = async () => {
    if (changingPassword) return;

    const oldP = oldPass.trim();
    const newP = newPass.trim();
    const newP2 = newPass2.trim();

    if (!oldP || !newP || !newP2) {
      return toast.error("Please fill in all password fields.");
    }

    if (newP !== newP2) {
      return toast.error("New passwords do not match");
    }

    if (oldP === newP) {
      return toast.error("New password must be different");
    }

    const errors = validatePassword(newP);

    if (errors.length > 0) {
      toast.error("Password must include " + errors.join(", "));
      return;
    }

    if (isDeployment && captchaToken.trim() === "") {
      toast.error("Please complete the CAPTCHA.");
      return;
    }

    setChangingPassword(true);
    const loadingToast = toast.loading("Processing...");

    try {
      const response = await fetch("/api/userServices/update/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ oldPassword: oldP, newPassword: newP, captchaToken }),
      });


      const responseText = await response.text();
      let result = null;

      if (responseText) {
        try {
          result = JSON.parse(responseText);
        } catch {
          result = null;
        }
      }

      if (!response.ok) {
        setCaptchaToken("");
        throw new Error(result?.error || responseText || "Server error");
      }

      if (!result) {
        setCaptchaToken("");
        throw new Error("Invalid server response");
      }

      if (!result.success) {
        setCaptchaToken("");
        throw new Error(result.error || "Failed to update password");
      }

      toast.success("Password updated successfully", { id: loadingToast });

      setOldPass("");
      setNewPass("");
      setNewPass2("");
      setCaptchaToken("");
      setShowPasswordModal(false);


    } catch (e) {
      setCaptchaToken("");
      toast.error(e.message, { id: loadingToast });
    } finally {
      setChangingPassword(false);
    }
  };

  const closePasswordModal = () => {
    setOldPass("");
    setNewPass("");
    setNewPass2("");
    setCaptchaToken("");
    setChangingPassword(false);
    setShowPasswordModal(false);

  };

  const handleRequestModification = () => {
    setEditData({ ...formData, description: "" });
    setSelectedFile(null);
    setShowModal(true);
  };

  const currentChanges = {};
  for (const key in editData) {
    if (key === "description") continue;
    const original = (formData[key] ?? "").toString().trim();
    const updated = (editData[key] ?? "").toString().trim();
    if (original !== updated) {
      currentChanges[key] = updated;
    }
  }
  const hasChanges = Object.keys(currentChanges).length > 0;
  const hasDescription = editData.description?.trim().length > 0;
  const needsDocs = Object.keys(currentChanges).some((key) => REQUIRES_DOC_FIELDS.includes(key));

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const MAX_SIZE = 10 * 1024 * 1024; 
      
      if (file.size > MAX_SIZE) {
        toast.error(`"${file.name}" exceeds the 10MB limit.`);
        e.target.value = null; 
        return;
      }

      setSelectedFile(file);
    }
  };

  const removeFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = null;
    }
  };

  const handleSubmitRequest = async () => {
    const finalChanges = {};
    for (const key in editData) {
      if (key === "description") continue;
      const original = (formData[key] ?? "").toString().trim();
      const updated = (editData[key] ?? "").toString().trim();
      if (original !== updated) {
        finalChanges[key] = updated;
      }
    }

    if (Object.keys(finalChanges).length === 0) {
      toast.error("No changes detected.");
      return;
    }

    const requiresDocuments = Object.keys(finalChanges).some(k => REQUIRES_DOC_FIELDS.includes(k));

    if (requiresDocuments && !selectedFile) {
      toast.error("A supporting document is required for residential address changes.");
      return;
    }

    setIsSubmitting(true);

    try {
      const formDataToSend = new FormData();
      formDataToSend.append("userId", user.$id);
      formDataToSend.append("requestedData", JSON.stringify(finalChanges));
      formDataToSend.append("description", editData.description || "");

      if (selectedFile) {
        formDataToSend.append("documents", selectedFile);
      }

      const res = await fetch("/api/userServices/profileRequests", {
        method: "POST",
        body: formDataToSend,
      });

      const result = await res.json();

      if (result.success) {
        toast.success("Update request submitted successfully");
        setShowModal(false);
        await fetchRequests();
      } else {
        toast.error(result.error || "Submission failed");
      }
    } catch (err) {
      toast.error("Failed to submit request");
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    if (!user?.$id) return;

    const load = async () => {
      try {
        setIsLoading(true);
        const result = await getProfileByUserId(user.$id);

        if (result.success && result.data) {
          const d = result.data;
          setFormData(prev => ({
            salutation: d.salutation ?? "",
            title: d.title ?? "",
            FirstName: d.FirstName ?? "",
            LastName: d.LastName ?? "",
            street: d.street ?? "",
            houseNo: d.houseNo ?? "",
            add: d.add ?? "",
            postalCode: d.postalCode ?? "",
            location: d.location ?? "",
            email: d.email ?? "",
            telephoneNo: d.telephoneNo ?? "",
            dateOfBirth: d.dateOfBirth ?? "",
            status: prev.status || "",
            memberNumber: prev.memberNumber || d.memberNumber || "",
            entryDate: d.entryDate ?? "",
            howHeard: d.howHeard || "",
            wantToBe: d.wantToBe || "",
            role: d.role || "",
            accountHolder: d.accountHolder || "",
            ibanNo: d.ibanNo || "",
            taxId: d.taxId || "",
            kycStatus: prev.kycStatus || "PENDING",
          }));
        }
      } catch (e) {
        console.error("Failed to load profile:", e);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [user]);

  const formatDateDE = (dateString) => {
    if (!dateString) return "—";
    if (/^\d{2}\.\d{2}\.\d{4}$/.test(dateString)) return dateString;

    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;

    return new Intl.DateTimeFormat("de-DE", {
      day: "2-digit", month: "2-digit", year: "numeric", timeZone: "UTC",
    }).format(date);
  };

  const fullName = [formData.salutation, formData.title, formData.FirstName, formData.LastName]
    .filter(Boolean).join(" ") || "—";
  const initials = (formData.FirstName?.[0] || "") + (formData.LastName?.[0] || "") || "U";
  const addressMain = [
    [formData.street, formData.houseNo].filter(Boolean).join(" "),
    [formData.postalCode, formData.location].filter(Boolean).join(" ")
  ].filter(Boolean).join(", ");
  const fullAddress = addressMain ? `${addressMain} ${formData.add ? `(${formData.add})` : ""}`.trim() : "—";

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-10 h-10 border-4 border-indigo-600 rounded-full shadow-md border-t-transparent animate-spin"></div>
      </div>
    );
  }

  const ProfileField = ({ icon: Icon, label, value }) => (
    <div className="flex items-start gap-4 p-4 transition-colors rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/50">
      <div className="p-2.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg shrink-0">
        <Icon className="w-5 h-5" />
      </div>
      <div className="flex flex-col min-w-0">
        <span className="text-sm font-medium text-gray-500 dark:text-gray-400">{label}</span>
        <span className="mt-1 font-medium text-gray-900 truncate dark:text-white">{value}</span>
      </div>
    </div>
  );

  const containerVariants = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } };
  const itemVariants = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

  return (
    <>
      <div className="max-w-5xl p-4 mx-auto sm:p-6 lg:p-8">
        <motion.div variants={containerVariants} initial="hidden" animate="show" className="pb-4 pl-1 text-2xl font-semibold text-gray-800 dark:text-white">
          <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Meine Stammdaten <span className="font-normal text-gray-400">/ My Profile</span>
          </h2>
        </div>
        </motion.div>

        <motion.div variants={containerVariants} initial="hidden" animate="show" className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <motion.div variants={itemVariants} className="lg:col-span-1">
            <div className="relative flex flex-col h-full overflow-hidden transition-all duration-300 bg-white border border-gray-200 shadow-sm dark:bg-slate-900 dark:border-slate-800 hover:shadow-md rounded-2xl">

              <div className="relative w-full h-24 bg-gradient-to-br from-indigo-500 via-purple-500 to-indigo-600"/>

              <div className="relative flex flex-col items-center flex-1 px-6 pb-6 text-center">

                <div className="w-28 h-28 bg-white dark:bg-slate-900 rounded-full p-1.5 -mt-12 mb-4 shadow-lg ring-1 ring-black/5 dark:ring-white/10 relative z-10">
                  <div className="flex items-center justify-center w-full h-full text-2xl font-bold tracking-wider text-indigo-600 uppercase rounded-full shadow-inner bg-gradient-to-br from-transparent to-purple-300 dark:from-indigo-900/40 dark:to-purple-900/40 dark:text-indigo-300">
                    {initials}
                  </div>
                </div>

                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1.5 tracking-tight">
                  {fullName}
                </h2>

                <p className="px-3 py-1 mb-4 text-xs font-bold tracking-wider text-indigo-600 uppercase border border-indigo-100 rounded-full dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 dark:border-indigo-800/30">
                  Member Profile
                </p>
                
                <div className="w-full p-4 mb-4 space-y-3 text-left border shadow-sm bg-gray-50 dark:bg-slate-800/50 rounded-xl border-gray-500/17 dark:border-slate-700/50">
                  
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white border border-gray-100 rounded-lg shadow-sm dark:bg-slate-700 dark:border-slate-600">
                        <Hash className="w-4 h-4 text-indigo-500 dark:text-indigo-400 shrink-0" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] uppercase font-bold text-gray-400 dark:text-gray-500 tracking-wider">Member ID</p>
                      <p className="text-sm font-semibold text-gray-900 truncate dark:text-gray-100">{formData.memberNumber || "—"}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white border border-gray-100 rounded-lg shadow-sm dark:bg-slate-700 dark:border-slate-600">
                        <Calendar className="w-4 h-4 text-indigo-500 dark:text-indigo-400 shrink-0" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] uppercase font-bold text-gray-400 dark:text-gray-500 tracking-wider">Entry Date</p>
                      <p className="text-sm font-semibold text-gray-900 truncate dark:text-gray-100">{formatDateDE(formData.entryDate)}</p>
                    </div>
                  </div>
                </div>

                <button
                  onClick={async () => {
                    if (isGeneratingPdf) return;
                    await GenerateMembershipPDF({
                      formData,
                      coopData,
                      coops,
                      formatDateDE,
                      setIsGeneratingPdf,
                      signatureDetails
                    });
                  }}
                  disabled={!(coopData || (coops && coops.length > 0)) || isGeneratingPdf}
                  className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 mb-1 border text-sm font-bold rounded-xl transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500/50 group
                  ${
                    coopData || (coops && coops.length > 0)
                      ? "bg-indigo-50 text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-900/30 dark:text-indigo-400 dark:hover:bg-indigo-900/50 border-indigo-100 dark:border-indigo-800/50"
                      : "bg-gray-100 text-gray-400 cursor-not-allowed border-gray-200 dark:bg-slate-800 dark:text-gray-500"
                  }`}
                >
                  {isGeneratingPdf ? (<Loader className="w-4 h-4 transition-transform animate-spin group-hover:scale-110" />):(<Download className="w-4 h-4 transition-transform group-hover:scale-110" />)}
                  Membership Application
                </button>

                <div className="flex items-center gap-1 mt-1 text-xs text-slate-400">
                  <Info className="w-3 h-3" />
                  {coopData
                    ? "Download your membership application (Select coop above)."
                    : "Please select a cooperative first to enable download."}
                </div>

                <div className="w-full pt-4 mt-auto border-t border-gray-100 dark:border-slate-800/60">
                  <button 
                    onClick={() => setShowPasswordModal(true)} 
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 text-sm font-bold rounded-xl transition-all focus:outline-none focus:ring-2 focus:ring-gray-200 dark:focus:ring-slate-700 shadow-sm group"
                  >
                    <KeyRound className="w-4 h-4 text-gray-400 transition-colors dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-300" />
                    Change Password
                  </button>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div variants={itemVariants} className="space-y-6 lg:col-span-2">
            <div className="overflow-hidden bg-white border border-gray-200 shadow-sm dark:bg-gray-800 dark:border-gray-700 rounded-2xl">
              <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 dark:border-gray-700">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Personal Details</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Your contact and identifying information.</p>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-2 p-2 sm:grid-cols-2">
                <ProfileField icon={User} label="Full Name" value={fullName} />
                <ProfileField icon={Calendar} label="Date of Birth" value={formatDateDE(formData.dateOfBirth)} />
                <ProfileField icon={Mail} label="Email Address" value={formData.email || "—"} />
                <ProfileField icon={Phone} label="Telephone" value={formData.telephoneNo || "—"} />
                <div className="sm:col-span-2">
                  <ProfileField icon={MapPin} label="Home Address" value={fullAddress} />
                </div>
              </div>
            </div>

            <div className="overflow-hidden bg-white border border-gray-200 shadow-sm dark:bg-gray-800 dark:border-gray-700 rounded-2xl">
              <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Account & KYC Status</h3>
              </div>
              <div className="grid grid-cols-1 gap-2 p-2 sm:grid-cols-2">
                <ProfileField 
                  icon={ShieldCheck} 
                  label="Membership Status" 
                  value={
                    (() => {
                      const status = formData.status || "Unknown";
                      const statusLower = status.toLowerCase();
                      let statusText = status;
                      if (statusLower === "noticegiven" || statusLower === "notice given") {
                        statusText = "Notice Given";
                      }
                      
                      let colorClass = "bg-gray-50 text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700";
                      if (statusLower === "active") {
                        colorClass = "bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-900/50";
                      } else if (statusLower === "noticegiven" || statusLower === "notice given") {
                        colorClass = "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-900/50";
                      } else if (statusLower === "pending") {
                        colorClass = "bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-900/50";
                      } else if (statusLower === "rejected") {
                        colorClass = "bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-900/50";
                      }

                      return (
                        <span className={`mt-1 inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-semibold border ${colorClass}`}>
                          {statusText}
                        </span>
                      );
                    })()
                  } 
                />
                <ProfileField 
                  icon={FileIcon} 
                  label="KYC Verification" 
                  value={
                    <span className={`mt-1 inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-semibold border ${formData.kycStatus?.toLowerCase() === "verified" || formData.kycStatus?.toLowerCase() === "approved" ? "bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-900/50" : formData.kycStatus?.toLowerCase() === "pending" ? "bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-900/50" : "bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-900/50"}`}>
                      {{
                        PENDING: "Pending",
                        VERIFIED: "Verified",
                        REJECTED: "Rejected",
                        RESUBMISSION_REQUIRED: "Resubmission Required"
                      }[formData.kycStatus?.toUpperCase()] || formData.kycStatus || "Pending"}
                    </span>
                  } 
                />
              </div>
            </div>
          </motion.div>

          <motion.div variants={itemVariants} className="lg:col-span-3">
            <div className="flex flex-col items-center justify-between gap-6 p-6 border border-indigo-100 bg-indigo-50 dark:bg-indigo-900/10 dark:border-indigo-900/30 rounded-2xl sm:flex-row">
              <div className="flex items-start gap-4">
                <div className="p-2 text-indigo-600 bg-indigo-100 rounded-full dark:bg-indigo-900/50 dark:text-indigo-400 shrink-0"><Info className="w-5 h-5" /></div>
                <p className="mt-1 text-sm text-indigo-700 dark:text-indigo-400">If any of your personal data or residential details are incorrect, please request a modification to update our records.</p>
              </div>
              <button onClick={handleRequestModification} className="w-full sm:w-auto shrink-0 flex items-center justify-center gap-2 px-5 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-600 rounded-xl shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-indigo-50 dark:hover:bg-gray-700 transition-all focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                <Edit3 className="w-4 h-4" /> Request Change
              </button>
            </div>
          </motion.div>

          <motion.div variants={itemVariants} className="lg:col-span-3">
            <div className="overflow-hidden bg-white border border-gray-200 shadow-sm dark:bg-gray-800 dark:border-gray-700 rounded-2xl">
              <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-100 dark:border-gray-700">
                <div className="p-2 text-gray-600 bg-gray-100 rounded-lg dark:bg-gray-700 dark:text-gray-300"><History className="w-5 h-5" /></div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Update Requests History</h3>
              </div>
              <div className="p-4 sm:p-6">
                {requests.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-gray-400 dark:text-gray-500">
                    <Clock className="w-10 h-10 mb-3 opacity-50" />
                    <p className="text-sm font-medium">No pending or past requests.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {requests.map((r) => {
                      let requestedFields = "Unknown";
                      try {
                        const parsed = JSON.parse(r.requestedData || "{}");
                        requestedFields = Object.keys(parsed).join(", ") || "No changes detected";
                      } catch(e) {}
                      return (
                        <div key={r.$id} className={`flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 bg-gray-50/50 dark:bg-slate-900/30 border border-gray-300 dark:border-slate-700 rounded-xl transition-colors gap-4 ${r.status === "PENDING" ? "bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-900/50" : r.status === "APPROVED" ? "bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-900/50" : "bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-900/50"}`}>
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <Calendar className="w-4 h-4 text-gray-400" />
                              <p className="text-sm font-bold text-gray-900 dark:text-gray-100">{formatDateDE(r.createdAt)}</p>
                            </div>
                            <div className="flex items-start gap-2">
                              <Edit3 className="w-4 h-4 text-gray-400 mt-0.5" />
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                <p><span className="font-medium text-gray-700 dark:text-gray-300">Fields Updated:</span> {requestedFields}</p>
                                {r.description && <p className="mt-1 font-bold text-black dark:text-white"><span className="font-medium text-gray-700 dark:text-gray-300">Reason:</span> {r.description}</p>}
                              </div>
                            </div>
                          </div>
                          <span className={`shrink-0 inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${r.status === "PENDING" ? "bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-900/50" : r.status === "APPROVED" ? "bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-900/50" : "bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-900/50"}`}>
                            {r.status}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>

      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => !isSubmitting && setShowModal(false)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />

            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} transition={{ duration: 0.2, ease: "easeOut" }} className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
              
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-900/50 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="p-2 text-indigo-600 bg-indigo-100 rounded-lg dark:bg-indigo-900/30 dark:text-indigo-400"><Edit3 className="w-5 h-5" /></div>
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white">Request Profile Update</h2>
                </div>
                <button disabled={isSubmitting} onClick={() => setShowModal(false)} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-200 dark:hover:bg-slate-800 dark:hover:text-gray-300 rounded-full transition-colors disabled:opacity-50"><X size={20} /></button>
              </div>

              <div className="p-6 space-y-6 overflow-y-auto custom-scrollbar">
                <div className="space-y-4">
                  <h3 className="pb-2 text-sm font-bold text-gray-900 border-b border-gray-100 dark:text-white dark:border-slate-800">Personal Identity</h3>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        <Lock className="w-3 h-3" /> Salutation
                      </label>
                      <input disabled className="w-full px-4 py-2.5 bg-gray-100 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700 text-gray-500 dark:text-gray-400 rounded-xl cursor-not-allowed" value={formData.salutation || ""} />
                    </div>
                    <div className="space-y-1.5">
                      <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        <Lock className="w-3 h-3" /> Title
                      </label>
                      <input disabled className="w-full px-4 py-2.5 bg-gray-100 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700 text-gray-500 dark:text-gray-400 rounded-xl cursor-not-allowed" value={formData.title || ""} />
                    </div>
                    <div className="space-y-1.5">
                      <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        <Lock className="w-3 h-3" /> First Name
                      </label>
                      <input disabled className="w-full px-4 py-2.5 bg-gray-100 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700 text-gray-500 dark:text-gray-400 rounded-xl cursor-not-allowed" value={formData.FirstName || ""} />
                    </div>
                    <div className="space-y-1.5">
                      <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        <Lock className="w-3 h-3" /> Last Name
                      </label>
                      <input disabled className="w-full px-4 py-2.5 bg-gray-100 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700 text-gray-500 dark:text-gray-400 rounded-xl cursor-not-allowed" value={formData.LastName || ""} />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="pb-2 text-sm font-bold text-gray-900 border-b border-gray-100 dark:text-white dark:border-slate-800">Contact Information</h3>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        <Lock className="w-3 h-3" /> Email Address
                      </label>
                      <input disabled className="w-full px-4 py-2.5 bg-gray-100 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700 text-gray-500 dark:text-gray-400 rounded-xl cursor-not-allowed" value={formData.email || ""} />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold tracking-wider text-gray-600 uppercase dark:text-gray-400">Telephone Number</label>
                      <input className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="+49..." value={editData.telephoneNo || ""} onChange={(e) => setEditData({ ...editData, telephoneNo: e.target.value })} />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="pb-2 text-sm font-bold text-gray-900 border-b border-gray-100 dark:text-white dark:border-slate-800">Residential Address</h3>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <div className="sm:col-span-2 space-y-1.5">
                      <label className="text-xs font-semibold tracking-wider text-gray-600 uppercase dark:text-gray-400">Street</label>
                      <input className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500" value={editData.street || ""} onChange={(e) => setEditData({ ...editData, street: e.target.value })} />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold tracking-wider text-gray-600 uppercase dark:text-gray-400">House No.</label>
                      <input className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500" value={editData.houseNo || ""} onChange={(e) => setEditData({ ...editData, houseNo: e.target.value })} />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold tracking-wider text-gray-600 uppercase dark:text-gray-400">Postal Code</label>
                      <input className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500" value={editData.postalCode || ""} onChange={(e) => setEditData({ ...editData, postalCode: e.target.value })} />
                    </div>
                    <div className="sm:col-span-2 space-y-1.5">
                      <label className="text-xs font-semibold tracking-wider text-gray-600 uppercase dark:text-gray-400">Location / City</label>
                      <input className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500" value={editData.location || ""} onChange={(e) => setEditData({ ...editData, location: e.target.value })} />
                    </div>
                    <div className="sm:col-span-3 space-y-1.5">
                      <label className="text-xs font-semibold tracking-wider text-gray-600 uppercase dark:text-gray-400">Additional Address Info</label>
                      <input className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="c/o, Floor, Apartment" value={editData.add || ""} onChange={(e) => setEditData({ ...editData, add: e.target.value })} />
                    </div>
                  </div>
                </div>

                {needsDocs && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="pt-2 space-y-4">
                    <div className="flex items-center justify-between pb-2 border-b border-gray-100 dark:border-slate-800">
                      <h3 className="flex items-center gap-2 text-sm font-bold text-gray-900 dark:text-white">
                        Supporting Document
                        <span className="text-[10px] bg-red-100 text-red-600 px-2 py-0.5 rounded-full uppercase tracking-widest font-bold">Required</span>
                      </h3>
                    </div>
                    
                    <div className="p-4 border border-orange-200 bg-orange-50 dark:bg-orange-900/10 dark:border-orange-900/30 rounded-xl">
                      <p className="text-xs text-orange-800 dark:text-orange-300">
                        Modifying residential details require proper document upload.
                      </p>
                      
                      <div className="mt-4">
                        <input
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png"
                          className="hidden"
                          ref={fileInputRef}
                          onChange={handleFileChange}
                        />
                        
                        {!selectedFile ? (
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="flex flex-col items-center justify-center w-full gap-2 py-6 transition-colors bg-white border-2 border-indigo-300 border-dashed dark:border-indigo-700/50 rounded-xl dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-slate-800/80"
                          >
                            <UploadCloud className="w-8 h-8 text-indigo-500" />
                            <span className="text-sm font-medium text-indigo-700 dark:text-indigo-400">Click to upload a file</span>
                            <span className="text-xs text-gray-400">PDF, JPG, or PNG up to 10MB</span>
                          </button>
                        ) : (
                          <div className="flex items-center justify-between p-3 bg-white border border-indigo-200 shadow-sm dark:bg-slate-800 rounded-xl dark:border-indigo-800">
                            <div className="flex items-center gap-3 overflow-hidden">
                              <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 shrink-0">
                                <FileIcon className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                              </div>
                              <div className="flex flex-col min-w-0">
                                <span className="text-sm font-semibold text-gray-900 truncate dark:text-gray-100">
                                  {selectedFile.name}
                                </span>
                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                  {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className="p-2 text-gray-500 transition-colors rounded-lg hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-slate-700 dark:hover:text-indigo-400"
                                title="Replace file"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={removeFile}
                                className="p-2 text-red-500 transition-colors rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20"
                                title="Remove file"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}

                <div className="space-y-1.5 pt-2">
                  <label className="text-xs font-semibold tracking-wider text-gray-600 uppercase dark:text-gray-400">Reason for Update <span className="text-lg text-red-500">*</span></label>
                  <textarea
                    rows="3"
                    className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all resize-none"
                    placeholder="Briefly explain the reason for this change (e.g., moved to a new house, new phone number)."
                    value={editData.description || ""}
                    onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-900/50 shrink-0">
                <button
                  disabled={isSubmitting}
                  onClick={() => setShowModal(false)}
                  className="px-5 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  disabled={!hasChanges || !hasDescription || (needsDocs && !selectedFile) || isSubmitting}
                  onClick={handleSubmitRequest}
                  className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Submitting...
                    </>
                  ) : (
                    "Submit Request"
                  )}
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showPasswordModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => !changingPassword && closePasswordModal()} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />

            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} transition={{ duration: 0.2, ease: "easeOut" }} className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
              
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-900/50 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="p-2 text-indigo-600 bg-indigo-100 rounded-lg dark:bg-indigo-900/30 dark:text-indigo-400"><Key className="w-5 h-5" /></div>
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white">Change Password</h2>
                </div>
                <button disabled={changingPassword} onClick={closePasswordModal} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-200 dark:hover:bg-slate-800 dark:hover:text-gray-300 rounded-full transition-colors disabled:opacity-50"><X size={20} /></button>
              </div>

              <div className="p-6 space-y-4 overflow-y-auto custom-scrollbar">
                <div className="space-y-1.5">
                  <label htmlFor="oldPass" className="text-xs font-semibold tracking-wider text-gray-600 uppercase dark:text-gray-400">Current Password</label>
                  <input id="oldPass" type="password" autoComplete="current-password" disabled={changingPassword} className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Enter current password" value={oldPass} onChange={(e) => setOldPass(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="newPass" className="text-xs font-semibold tracking-wider text-gray-600 uppercase dark:text-gray-400">New Password</label>
                  <input id="newPass" type="password" autoComplete="new-password" disabled={changingPassword} className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Enter new password" value={newPass} onChange={(e) => setNewPass(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="newPass2" className="text-xs font-semibold tracking-wider text-gray-600 uppercase dark:text-gray-400">Confirm New Password</label>
                  <input id="newPass2" type="password" autoComplete="new-password" disabled={changingPassword} className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Confirm new password" value={newPass2} onChange={(e) => setNewPass2(e.target.value)} />
                </div>
                <div className="mt-4">
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
              </div>


              <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-900/50 shrink-0">
                <button
                  disabled={changingPassword}
                  onClick={closePasswordModal}
                  className="px-5 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  disabled={changingPassword || !oldPass?.trim() || !newPass?.trim() || !newPass2?.trim()}
                  onClick={changePassword}
                  className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {changingPassword ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Updating...
                    </>
                  ) : (
                    "Update Password"
                  )}
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}