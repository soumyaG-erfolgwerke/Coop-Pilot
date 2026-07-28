"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Send,
  Inbox,
  Edit3,
  User,
  CheckCircle,
  Copy,
  Check,
  Mail,
  ArrowLeft,
  Paperclip,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Sparkles,
  Settings,
  Star,
  ShieldCheck,
  Lock,
  Zap,
  Download,
} from "lucide-react";
import { useAuth } from "../../hooks/useAuth.js";
import { useSearchParams } from "next/navigation";
import {
  mailSetup,
  getInbox,
  sentMails,
  messageByUid,
  isMailExist,
  getSentMails,
} from "../../lib/mailServicesV2.js";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import { fetchCooperativeSettings } from "../../lib/cooperativeSettingsService.js";

const getInitials = (fromStr) => {
  if (!fromStr) return "?";
  const match = fromStr.match(/^([^<]+)/);
  let name = match ? match[1].trim() : fromStr;
  name = name.replace(/['"]/g, "");
  const parts = name.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
};

const getSenderName = (fromStr) => {
  if (!fromStr) return "Unknown";
  const match = fromStr.match(/^([^<]+)/);
  if (match) {
    let name = match[1].trim().replace(/['"]/g, "");
    if (name) return name;
  }
  return fromStr.split("@")[0];
};

export default function MailDashboard({ selectedCoopId }) {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const [hasAppliedParams, setHasAppliedParams] = useState(false);

  // Mailbox connection state
  const [isCheckingMail, setIsCheckingMail] = useState(true);
  const [hasMailbox, setHasMailbox] = useState(false);
  const [mailboxInfo, setMailboxInfo] = useState(null);

  // Tab & View control
  const [activeTab, setActiveTab] = useState("inbox"); // 'inbox', 'sent', or 'compose'
  const [selectedMailUid, setSelectedMailUid] = useState(null);
  const [selectedMailDetails, setSelectedMailDetails] = useState(null);
  const [isLoadingMailDetails, setIsLoadingMailDetails] = useState(false);

  // Inbox records
  const [inboxMails, setInboxMails] = useState([]);
  const [inboxTotal, setInboxTotal] = useState(0);
  const [inboxPage, setInboxPage] = useState(1);
  const inboxLimit = 10;
  const [isLoadingInbox, setIsLoadingInbox] = useState(false);

  // Sent records
  const [sentMailsList, setSentMailsList] = useState([]);
  const [sentTotal, setSentTotal] = useState(0);
  const [sentPage, setSentPage] = useState(1);
  const [isLoadingSent, setIsLoadingSent] = useState(false);

  // Compose state
  const [composeTo, setComposeTo] = useState("");
  const [composeToInput, setComposeToInput] = useState("");
  const [composeSubject, setComposeSubject] = useState("");
  const [composeBody, setComposeBody] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [attachments, setAttachments] = useState([]);

  // Setup state
  const [setupName, setSetupName] = useState("");
  const [setupEmail, setSetupEmail] = useState("");
  const [isSettingUp, setIsSettingUp] = useState(false);

  // Utility states
  const [copied, setCopied] = useState(false);

  // Email Templates for Cooperative Administrators
  const [coopName, setCoopName] = useState("");
  const [activeMembers, setActiveMembers] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [templateLanguage, setTemplateLanguage] = useState("de");
  const [templateVals, setTemplateVals] = useState({
    coopName: "",
    agmDate: "",
    agmTime: "",
    agmLocation: "",
    onlineLink: "",
    agendaItems: "",
    salutation: "",
    lastName: "",
    messageText: "",
  });

  const [noticeWarning, setNoticeWarning] = useState("");
  const [isNoticeBlocked, setIsNoticeBlocked] = useState(false);
  const [bulkProgress, setBulkProgress] = useState(null);
  const [agmNoticePeriodDays, setAgmNoticePeriodDays] = useState(14);

  const getMinDate = () => {
    const minDate = new Date();
    minDate.setDate(minDate.getDate() + agmNoticePeriodDays);
    const year = minDate.getFullYear();
    const month = String(minDate.getMonth() + 1).padStart(2, "0");
    const day = String(minDate.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  // Prefill template coop name when fetched
  useEffect(() => {
    if (coopName) {
      setTemplateVals((prev) => ({ ...prev, coopName }));

      // If template is MANUAL_INDIVIDUAL or MANUAL_ALL_MEMBERS, update placeholders if present
      if (
        selectedTemplate === "MANUAL_INDIVIDUAL" ||
        selectedTemplate === "MANUAL_ALL_MEMBERS"
      ) {
        setComposeSubject((prev) => {
          if (
            !prev ||
            prev === "Mitteilung" ||
            prev === "Message" ||
            prev.includes("[COOP_NAME]")
          ) {
            return templateLanguage === "de"
              ? `Mitteilung von ${coopName}`
              : `Message from ${coopName}`;
          }
          return prev;
        });
        setComposeBody((prev) => {
          if (!prev || prev.includes("[COOP_NAME]")) {
            return prev.replaceAll("[COOP_NAME]", coopName);
          }
          return prev;
        });
      }
    }
  }, [coopName, selectedTemplate, templateLanguage]);

  // Handle pre-filled templates via URL query parameters (Trigger: Admin opens 'Neue Nachricht' or 'Nachricht an alle Mitglieder')
  useEffect(() => {
    if (searchParams && !hasAppliedParams) {
      const composeParam = searchParams.get("compose");
      if (composeParam === "true") {
        const emailParam = searchParams.get("email");
        const salutationParam = searchParams.get("salutation");
        const lastNameParam = searchParams.get("lastName");
        const templateParam = searchParams.get("template");

        setActiveTab("compose");
        if (emailParam) {
          setComposeTo(emailParam);
        }
        if (templateParam === "MANUAL_INDIVIDUAL") {
          setSelectedTemplate("MANUAL_INDIVIDUAL");
          setTemplateVals((prev) => ({
            ...prev,
            salutation: salutationParam || "",
            lastName: lastNameParam || "",
          }));

          const nameToUse = coopName || templateVals.coopName || "";
          let subject = "";
          let body = "";

          if (templateLanguage === "de") {
            subject = nameToUse ? `Mitteilung von ${nameToUse}` : "Mitteilung";
            body =
              `Sehr geehrte/r ${salutationParam || "[ANREDE]"} ${lastNameParam || "[NACHNAME]"},\n\n` +
              `[Admin writes message here]\n\n` +
              `Mit freundlichen Grüßen,\n` +
              `Der Vorstand von ${nameToUse || "[COOP_NAME]"}`;
          } else {
            subject = nameToUse ? `Message from ${nameToUse}` : "Message";
            body =
              `Dear ${salutationParam || "[ANREDE]"} ${lastNameParam || "[NACHNAME]"},\n\n` +
              `[Admin writes message here]\n\n` +
              `Kind regards,\n` +
              `The Board of ${nameToUse || "[COOP_NAME]"}`;
          }

          setComposeSubject(subject);
          setComposeBody(body);
        } else if (templateParam === "MANUAL_ALL_MEMBERS") {
          setSelectedTemplate("MANUAL_ALL_MEMBERS");

          const nameToUse = coopName || templateVals.coopName || "";
          let subject = "";
          let body = "";

          if (templateLanguage === "de") {
            subject = nameToUse ? `Mitteilung von ${nameToUse}` : "Mitteilung";
            body =
              `Sehr geehrte Mitglieder,\n\n` +
              `[Admin writes message here]\n\n` +
              `Mit freundlichen Grüßen,\n` +
              `Der Vorstand von ${nameToUse || "[COOP_NAME]"}`;
          } else {
            subject = nameToUse ? `Message from ${nameToUse}` : "Message";
            body =
              `Dear members,\n\n` +
              `[Admin writes message here]\n\n` +
              `Kind regards,\n` +
              `The Board of ${nameToUse || "[COOP_NAME]"}`;
          }

          setComposeSubject(subject);
          setComposeBody(body);
        }
        setHasAppliedParams(true);
      }
    }
  }, [searchParams, coopName, templateLanguage, hasAppliedParams]);

  // Prefill ad-hoc template details when selected manually
  useEffect(() => {
    if (selectedTemplate === "MANUAL_INDIVIDUAL") {
      if (!composeSubject && !composeBody) {
        const nameToUse = coopName || templateVals.coopName || "[COOP_NAME]";
        let subject = "";
        let body = "";

        if (templateLanguage === "de") {
          subject = `Mitteilung von ${nameToUse}`;
          body =
            `Sehr geehrte/r ${templateVals.salutation || "[ANREDE]"} ${templateVals.lastName || "[NACHNAME]"},\n\n` +
            `[Admin writes message here]\n\n` +
            `Mit freundlichen Grüßen,\n` +
            `Der Vorstand von ${nameToUse}`;
        } else {
          subject = `Message from ${nameToUse}`;
          body =
            `Dear ${templateVals.salutation || "[ANREDE]"} ${templateVals.lastName || "[NACHNAME]"},\n\n` +
            `[Admin writes message here]\n\n` +
            `Kind regards,\n` +
            `The Board of ${nameToUse}`;
        }

        setComposeSubject(subject);
        setComposeBody(body);
      }
    } else if (selectedTemplate === "MANUAL_ALL_MEMBERS") {
      if (!composeSubject && !composeBody) {
        const nameToUse = coopName || templateVals.coopName || "[COOP_NAME]";
        let subject = "";
        let body = "";

        if (templateLanguage === "de") {
          subject = `Mitteilung von ${nameToUse}`;
          body =
            `Sehr geehrte Mitglieder,\n\n` +
            `[Admin writes message here]\n\n` +
            `Mit freundlichen Grüßen,\n` +
            `Der Vorstand von ${nameToUse}`;
        } else {
          subject = `Message from ${nameToUse}`;
          body =
            `Dear members,\n\n` +
            `[Admin writes message here]\n\n` +
            `Kind regards,\n` +
            `The Board of ${nameToUse}`;
        }

        setComposeSubject(subject);
        setComposeBody(body);
      }
    }
  }, [selectedTemplate, templateLanguage, coopName]);

  // Auto-fill active member emails for the MANUAL_ALL_MEMBERS template
  useEffect(() => {
    if (selectedTemplate === "MANUAL_ALL_MEMBERS" && activeMembers.length > 0) {
      const emails = activeMembers
        .map((m) => m.memberemail || m.email)
        .filter((email) => email && email !== "Unknown");

      if (emails.length > 0) {
        setComposeTo((prev) => {
          if (!prev || prev.split(",").length < 2) {
            return emails.join(", ");
          }
          return prev;
        });
      }
    }
  }, [selectedTemplate, activeMembers]);

  // Notice Period Compliance validation (§45 GenG)
  useEffect(() => {
    if (selectedTemplate === "AGM_INVITATION" && templateVals.agmDate) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const [year, month, day] = templateVals.agmDate.split("-").map(Number);
      const agm = new Date(year, month - 1, day);

      const diffTime = agm.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays < agmNoticePeriodDays) {
        setNoticeWarning(
          `⚠️ Blocked by §45 GenG: Invitations must be sent at least ${agmNoticePeriodDays} days in advance. Selected date is only ${diffDays >= 0 ? diffDays : 0} days away.`,
        );
        setIsNoticeBlocked(true);
      } else {
        setNoticeWarning("");
        setIsNoticeBlocked(false);
      }
    } else {
      setNoticeWarning("");
      setIsNoticeBlocked(false);
    }
  }, [selectedTemplate, templateVals.agmDate, agmNoticePeriodDays]);

  // Fetch Cooperative Details & Active Members
  useEffect(() => {
    if (selectedCoopId && user?.role?.toLowerCase() === "coopadmin") {
      const loadCoopData = async () => {
        try {
          const res = await fetch(`/api/coops/${selectedCoopId}`);
          if (res.ok) {
            const data = await res.json();
            setCoopName(data.name || "");
          }

          const membersRes = await fetch(
            `/api/coop-r-member/members-of-coop?coopId=${selectedCoopId}`,
          );
          if (membersRes.ok) {
            const data = await membersRes.json();
            if (data.success) {
              setActiveMembers(data.members || []);
            }
          }

          try {
            const settings = await fetchCooperativeSettings(selectedCoopId);
            if (
              settings &&
              settings.agm_notice_period_days !== undefined &&
              settings.agm_notice_period_days !== ""
            ) {
              const parsedDays = Number(settings.agm_notice_period_days);
              setAgmNoticePeriodDays(!isNaN(parsedDays) ? parsedDays : 14);
            }
          } catch (settingsErr) {
            console.error(
              "Failed to load cooperative settings in MailDashboard:",
              settingsErr,
            );
          }
        } catch (err) {
          console.error("Failed to load template data:", err);
        }
      };
      loadCoopData();
    }
  }, [selectedCoopId, user?.role]);

  // File to base64 converter helper
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    const MAX_FILE_SIZE = 4 * 1024 * 1024; //! 4MB limit

    files.forEach((file) => {
      if (file.size > MAX_FILE_SIZE) {
        toast.error(`File "${file.name}" is too large. Maximum size is 4MB.`);
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setAttachments((prev) => [
          ...prev,
          {
            filename: file.name,
            contentType: file.type,
            content: reader.result.split(",")[1],
          },
        ]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleRemoveAttachment = (index) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  // Compile and Apply AGM template variables to the standard Composer
  const handleApplyTemplate = () => {
    if (selectedTemplate === "AGM_INVITATION") {
      if (isNoticeBlocked) {
        toast.error("Notice period compliance violated (§45 GenG).");
        return;
      }

      const emails = activeMembers
        .map((m) => m.memberemail || m.email)
        .filter((email) => email && email !== "Unknown");

      if (emails.length === 0) {
        toast.error("No active members found to send to.");
        return;
      }

      setComposeTo(emails.join(", "));

      let subject = "";
      let body = "";

      if (templateLanguage === "de") {
        subject = `Einladung zur Generalversammlung — ${templateVals.coopName} am ${templateVals.agmDate}`;
        body =
          `Sehr geehrte Mitglieder,\n\n` +
          `wir laden Sie herzlich zur Generalversammlung von ${templateVals.coopName} ein.\n\n` +
          `Datum: ${templateVals.agmDate}\n` +
          `Uhrzeit: ${templateVals.agmTime} Uhr\n` +
          `Ort: ${templateVals.agmLocation}\n` +
          `${templateVals.onlineLink ? `Online-Link: ${templateVals.onlineLink}\n` : ""}\n` +
          `Tagesordnung:\n` +
          `${templateVals.agendaItems}\n\n` +
          `Die vollständige Tagesordnung finden Sie im Anhang.\n\n` +
          `Mit freundlichen Grüßen,\n` +
          `Der Vorstand von ${templateVals.coopName}`;
      } else {
        subject = `Invitation to General Assembly — ${templateVals.coopName} on ${templateVals.agmDate}`;
        body =
          `Dear Members,\n\n` +
          `You are cordially invited to the General Assembly of ${templateVals.coopName}.\n\n` +
          `Date: ${templateVals.agmDate}\n` +
          `Time: ${templateVals.agmTime}\n` +
          `Location: ${templateVals.agmLocation}\n` +
          `${templateVals.onlineLink ? `Online Link: ${templateVals.onlineLink}\n` : ""}\n` +
          `Agenda:\n` +
          `${templateVals.agendaItems}\n\n` +
          `The full agenda is attached as PDF.\n\n` +
          `Kind regards,\n` +
          `The Board of ${templateVals.coopName}`;
      }

      setComposeSubject(subject);
      setComposeBody(body);
      toast.success("AGM Invitation template applied successfully!");
    } else if (selectedTemplate === "MANUAL_INDIVIDUAL") {
      let subject = "";
      let body = "";

      if (templateLanguage === "de") {
        subject = `Mitteilung von ${templateVals.coopName}`;
        body =
          `Sehr geehrte/r ${templateVals.salutation} ${templateVals.lastName},\n\n` +
          `${templateVals.messageText}\n\n` +
          `Mit freundlichen Grüßen,\n` +
          `Der Vorstand von ${templateVals.coopName}`;
      } else {
        subject = `Message from ${templateVals.coopName}`;
        body =
          `Dear ${templateVals.salutation} ${templateVals.lastName},\n\n` +
          `${templateVals.messageText}\n\n` +
          `Kind regards,\n` +
          `The Board of ${templateVals.coopName}`;
      }

      setComposeSubject(subject);
      setComposeBody(body);
      toast.success("General template applied successfully!");
    } else if (selectedTemplate === "MANUAL_ALL_MEMBERS") {
      const emails = activeMembers
        .map((m) => m.memberemail || m.email)
        .filter((email) => email && email !== "Unknown");

      if (emails.length === 0) {
        toast.error("No active members found to send to.");
        return;
      }

      setComposeTo(emails.join(", "));

      let subject = "";
      let body = "";

      if (templateLanguage === "de") {
        subject = `Mitteilung von ${templateVals.coopName}`;
        body =
          `Sehr geehrte Mitglieder,\n\n` +
          `${templateVals.messageText || "[Admin writes message here]"}\n\n` +
          `Mit freundlichen Grüßen,\n` +
          `Der Vorstand von ${templateVals.coopName}`;
      } else {
        subject = `Message from ${templateVals.coopName}`;
        body =
          `Dear members,\n\n` +
          `${templateVals.messageText || "[Admin writes message here]"}\n\n` +
          `Kind regards,\n` +
          `The Board of ${templateVals.coopName}`;
      }

      setComposeSubject(subject);
      setComposeBody(body);
      toast.success("All-members template applied successfully!");
    }
  };

  const checkMailboxExistence = async () => {
    if (!user?.email) return;
    setIsCheckingMail(true);
    try {
      const res = await isMailExist(user.email);
      if (res.success && res.exists) {
        setHasMailbox(true);
        setMailboxInfo(res.mail);
        setSetupName(res.mail.name || user?.name || "");
        setSetupEmail(res.mail.email || user?.email || "");
      } else {
        setHasMailbox(false);
        // Default form values
        setSetupName(user?.name || "");
        setSetupEmail(user?.email || "");
      }
    } catch (err) {
      console.error("Error checking mailbox existence:", err);
    } finally {
      setIsCheckingMail(false);
    }
  };

  useEffect(() => {
    if (user?.email) {
      checkMailboxExistence();
    }
  }, [user]);

  // Fetch inbox records
  const fetchInbox = async (page) => {
    if (!user?.email) return;
    setIsLoadingInbox(true);
    try {
      const res = await getInbox(user.email, page, inboxLimit);
      if (res.success) {
        setInboxMails(res.data || []);
        setInboxTotal(res.total || 0);
      } else {
        toast.error(res.error || "Failed to fetch inbox records.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Could not load inbox.");
    } finally {
      setIsLoadingInbox(false);
    }
  };

  // Fetch sent records
  const fetchSent = async (page) => {
    if (!user?.email) return;
    setIsLoadingSent(true);
    try {
      const res = await getSentMails(user.email, page, inboxLimit);
      if (res.success) {
        setSentMailsList(res.data || []);
        setSentTotal(res.total || 0);
      } else {
        toast.error(res.error || "Failed to fetch sent records.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Could not load sent messages.");
    } finally {
      setIsLoadingSent(false);
    }
  };

  // Trigger inbox fetches
  useEffect(() => {
    if (hasMailbox && activeTab === "inbox") {
      fetchInbox(inboxPage);
    }
  }, [hasMailbox, activeTab, inboxPage]);

  // Trigger sent fetches
  useEffect(() => {
    if (hasMailbox && activeTab === "sent") {
      fetchSent(sentPage);
    }
  }, [hasMailbox, activeTab, sentPage]);

  // View individual email details
  const handleViewMail = async (uid) => {
    setSelectedMailUid(uid);
    setSelectedMailDetails(null);
    setIsLoadingMailDetails(true);
    const folder = activeTab === "sent" ? "Sent" : "INBOX";
    try {
      const res = await messageByUid(user.email, uid, folder);
      if (res.success) {
        setSelectedMailDetails(res);
        // Proactively set isRead to true locally if it is in the inbox
        if (folder === "INBOX") {
          setInboxMails((prev) =>
            prev.map((m) => (m.uid === uid ? { ...m, isRead: true } : m)),
          );
        }
      } else {
        toast.error(res.error || "Failed to load email details.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to load message.");
    } finally {
      setIsLoadingMailDetails(false);
    }
  };

  // Close details view
  const handleBackToInbox = () => {
    setSelectedMailUid(null);
    setSelectedMailDetails(null);
  };

  const handleDownloadAttachment = async (att) => {
    if (!att.content) {
      toast.error("Attachment content is not available.");
      return;
    }

    try {
      const base64Response = await fetch(
        `data:${att.contentType || "application/octet-stream"};base64,${att.content}`,
      );
      const blob = await base64Response.blob();

      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = att.filename || "attachment";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);
      toast.success(`Downloaded ${att.filename}`);
    } catch (err) {
      console.error("Failed to download attachment:", err);
      toast.error("Failed to download attachment.");
    }
  };

  // Send an email
  const handleComposeSend = async (e) => {
    e.preventDefault();
    if (!composeTo || !composeSubject || !composeBody) {
      toast.error("Please fill in all compose fields.");
      return;
    }

    const recipients = composeTo
      .split(",")
      .map((email) => email.trim())
      .filter((email) => email && email.includes("@"));

    if (recipients.length === 0) {
      toast.error("Please enter at least one valid recipient email address.");
      return;
    }

    setIsSending(true);

    if (recipients.length > 1) {
      const total = recipients.length;
      setBulkProgress({ current: 0, total });
      const loadingToast = toast.loading(
        `Processing bulk mail queue (0/${total})...`,
      );

      let successCount = 0;
      let failCount = 0;

      try {
        for (let i = 0; i < total; i++) {
          const recipient = recipients[i];

          // Wait 1200ms before sending subsequent messages (max 50/minute)
          if (i > 0) {
            await new Promise((resolve) => setTimeout(resolve, 1200));
          }

          try {
            const res = await sentMails(
              user.email,
              composeSubject,
              composeBody,
              recipient,
              attachments,
            );
            if (res.success) {
              successCount++;
            } else {
              failCount++;
              console.error(`Failed to send email to ${recipient}:`, res.error);
            }
          } catch (err) {
            failCount++;
            console.error(`Error sending email to ${recipient}:`, err);
          }

          setBulkProgress({ current: i + 1, total });
          toast.loading(`Processing bulk mail queue (${i + 1}/${total})...`, {
            id: loadingToast,
          });
        }

        if (successCount > 0) {
          toast.success(
            `Bulk send completed! ${successCount} sent successfully.${failCount > 0 ? ` ${failCount} failed.` : ""}`,
            { id: loadingToast },
          );
          setComposeTo("");
          setComposeSubject("");
          setComposeBody("");
          setAttachments([]);
          setActiveTab("sent");
          setSentPage(1);
          fetchSent(1);
        } else {
          toast.error("All bulk emails failed to send.", { id: loadingToast });
        }
      } catch (err) {
        console.error("Bulk sending process error:", err);
        toast.error("Bulk sending encountered an error.", { id: loadingToast });
      } finally {
        setBulkProgress(null);
        setIsSending(false);
      }
    } else {
      const loadingToast = toast.loading("Sending message...");
      try {
        const res = await sentMails(
          user.email,
          composeSubject,
          composeBody,
          recipients[0],
          attachments,
        );
        if (res.success) {
          toast.success("Email sent successfully!", { id: loadingToast });
          setComposeTo("");
          setComposeSubject("");
          setComposeBody("");
          setAttachments([]);
          setActiveTab("sent");
          setSentPage(1);
          fetchSent(1);
        } else {
          toast.error(res.error || "Failed to send email.", {
            id: loadingToast,
          });
        }
      } catch (err) {
        console.error(err);
        toast.error("Failed to transmit email.", { id: loadingToast });
      } finally {
        setIsSending(false);
      }
    }
  };

  // Complete first-time mailbox registration
  const handleSetupSubmit = async (e) => {
    e.preventDefault();
    if (!setupName || !setupEmail) {
      toast.error("Name and forwarding email are required.");
      return;
    }

    setIsSettingUp(true);
    const loadingToast = toast.loading("Configuring mailbox alias...");
    try {
      const res = await mailSetup(user.email, setupEmail, setupName);
      if (res.success) {
        toast.success("Mailbox alias established!", { id: loadingToast });
        await checkMailboxExistence();
      } else {
        toast.error(res.error || "Failed to setup mailbox.", {
          id: loadingToast,
        });
      }
    } catch (err) {
      console.error(err);
      toast.error("Mailbox setup failed.", { id: loadingToast });
    } finally {
      setIsSettingUp(false);
    }
  };

  const handleCopyAlias = () => {
    if (!mailboxInfo?.aliasEmail) return;
    navigator.clipboard.writeText(mailboxInfo.aliasEmail);
    setCopied(true);
    toast.success("Copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  if (isCheckingMail) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <div className="relative flex items-center justify-center w-16 h-16">
          <motion.div
            className="absolute inset-0 rounded-full bg-indigo-500/10 dark:bg-indigo-400/10"
            animate={{ scale: [1, 1.8, 1], opacity: [0.3, 0, 0.3] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="absolute rounded-full inset-2 bg-indigo-500/20 dark:bg-indigo-400/20"
            animate={{ scale: [1, 1.5, 1], opacity: [0.6, 0, 0.6] }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 0.4,
            }}
          />
          <div className="relative flex items-center justify-center w-10 h-10 text-white bg-indigo-600 rounded-full shadow-lg dark:bg-indigo-500 shadow-indigo-500/35">
            <Mail size={18} className="animate-pulse" />
          </div>
        </div>
        <p className="text-xs font-black tracking-widest uppercase text-slate-400 dark:text-slate-500 animate-pulse">
          Verifying Mailbox Status...
        </p>
      </div>
    );
  }

  // WIZARD VIEW: Mailbox does not exist
  if (!hasMailbox) {
    return (
      <div className="flex items-center justify-center p-4 md:p-8 min-h-[500px]">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-4xl overflow-hidden bg-white border border-slate-150/65 shadow-2xl dark:bg-slate-900/70 rounded-3xl dark:border-slate-800/80 backdrop-blur-xl grid grid-cols-1 md:grid-cols-12 min-h-[480px]"
        >
          {/* Left Panel: Features & Information (Marketing Column) */}
          <div className="relative flex flex-col justify-between p-8 overflow-hidden text-white md:col-span-5 bg-gradient-to-br from-indigo-900 via-indigo-950 to-slate-900">
            {/* Background Mesh Glow */}
            <div className="absolute top-0 right-0 w-48 h-48 rounded-full pointer-events-none bg-indigo-500/10 blur-3xl" />
            <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full pointer-events-none bg-blue-500/10 blur-3xl" />

            <div className="relative space-y-6">
              <div className="inline-flex p-3 border shadow-inner bg-white/10 rounded-2xl backdrop-blur-md border-white/10">
                <Mail size={28} className="text-indigo-300" />
              </div>
              <div>
                <h2 className="text-2xl font-black leading-tight tracking-tight">
                  Secure Mailbox <br />
                  Alias Setup
                </h2>
                <p className="mt-2 text-xs font-semibold leading-relaxed text-indigo-200/70">
                  Establish a protected, cooperative alias address that
                  integrates directly into your personal workflow.
                </p>
              </div>

              {/* Feature Highlights */}
              <div className="pt-2 space-y-4">
                <div className="flex items-start gap-3">
                  <div className="p-1.5 bg-indigo-500/20 rounded-lg text-indigo-300 shrink-0 mt-0.5">
                    <ShieldCheck size={14} />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">
                      Privacy Protection
                    </h4>
                    <p className="text-[10px] text-indigo-200/60 leading-relaxed">
                      Mask your primary email address. Keep cooperative
                      operations secure and spam-free.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-1.5 bg-indigo-500/20 rounded-lg text-indigo-300 shrink-0 mt-0.5">
                    <Zap size={14} />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">
                      Instant Forwarding
                    </h4>
                    <p className="text-[10px] text-indigo-200/60 leading-relaxed">
                      All incoming messages are immediately auto-forwarded to
                      your configured target inbox.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-1.5 bg-indigo-500/20 rounded-lg text-indigo-300 shrink-0 mt-0.5">
                    <Sparkles size={14} />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">
                      Cooperative Settings Sync
                    </h4>
                    <p className="text-[10px] text-indigo-200/60 leading-relaxed">
                      Fully complies with AGM communication structures and
                      notice-period compliance requirements.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="relative pt-6 border-t border-white/10 text-[10px] text-indigo-200/50 flex items-center gap-1.5 font-medium">
              <Lock size={12} className="text-indigo-400" />
              <span>End-to-end routing security activated.</span>
            </div>
          </div>

          {/* Right Panel: Interactive Form */}
          <form
            onSubmit={handleSetupSubmit}
            className="flex flex-col justify-center p-8 space-y-6 bg-white md:p-10 md:col-span-7 dark:bg-slate-900"
          >
            <div>
              <h3 className="text-lg font-black tracking-tight text-slate-800 dark:text-white">
                Configure Settings
              </h3>
              <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 mt-0.5">
                Provide your details to spin up your mailbox alias
              </p>
            </div>

            <div className="space-y-4">
              {/* Name Input */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  Display Name
                </label>
                <div className="relative flex items-center">
                  <div className="absolute pointer-events-none left-4 text-slate-400">
                    <User size={16} />
                  </div>
                  <input
                    type="text"
                    value={setupName}
                    onChange={(e) => setSetupName(e.target.value)}
                    placeholder="e.g. John Doe"
                    required
                    className="w-full py-3 pr-4 text-xs font-medium transition-all duration-200 border outline-none pl-11 md:text-sm border-slate-200 dark:border-slate-800 rounded-2xl bg-slate-50/50 dark:bg-slate-950/40 text-slate-800 dark:text-slate-100 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 dark:focus:border-indigo-500/80 placeholder-slate-400/70"
                  />
                </div>
              </div>

              {/* Forwarding Email Input */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  Forwarding Email
                </label>
                <div className="relative flex items-center">
                  <div className="absolute pointer-events-none left-4 text-slate-400">
                    <Mail size={16} />
                  </div>
                  <input
                    type="email"
                    value={setupEmail}
                    onChange={(e) => setSetupEmail(e.target.value)}
                    placeholder="e.g. john.doe@example.com"
                    required
                    className="w-full py-3 pr-4 text-xs font-medium transition-all duration-200 border outline-none pl-11 md:text-sm border-slate-200 dark:border-slate-800 rounded-2xl bg-slate-50/50 dark:bg-slate-950/40 text-slate-800 dark:text-slate-100 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 dark:focus:border-indigo-500/80 placeholder-slate-400/70"
                  />
                </div>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 leading-relaxed font-semibold">
                  Messages received on your alias will be instantly forwarded to
                  this destination.
                </p>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isSettingUp}
                className="w-full flex items-center justify-center gap-2 py-3.5 px-4 bg-gradient-to-r from-indigo-600 via-indigo-650 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white font-black rounded-2xl shadow-lg shadow-indigo-600/20 hover:shadow-indigo-600/35 active:scale-[0.98] transition-all disabled:opacity-50 text-xs md:text-sm tracking-wide"
              >
                {isSettingUp ? (
                  <>
                    <RefreshCw className="text-white animate-spin" size={16} />
                    <span>Configuring Mailbox Alias...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={16} />
                    <span>Generate Mailbox Alias</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    );
  }

  // CORE DASHBOARD VIEW
  return (
    <div className="flex flex-col lg:flex-row gap-1 pr-1 min-h-[500px]">
      {/* 1. SIDEBAR CONFIG / DIRECTORY PANEL */}
      <div className="flex flex-col space-y-3 lg:w-56 shrink-0">
        {/* Gmail-Style Compose Button */}
        <div className="flex flex-row items-center justify-center pr-4">
          <button
            onClick={() => {
              setActiveTab("compose");
              handleBackToInbox();
            }}
            className="flex items-center gap-3 px-6 py-4 bg-[#c2e7ff] hover:bg-[#b3dcff] text-[#001d35] dark:bg-blue-900/30 dark:text-blue-300 dark:hover:bg-blue-800/40 font-bold text-sm rounded-lg shadow-sm hover:shadow-md transition-all duration-200"
          >
            <Edit3 size={20} className="stroke-[2.5]" />
            <span>Compose</span>
          </button>
        </div>

        {/* Navigation Actions */}
        <div className="flex flex-col pr-4 space-y-0.5">
          <button
            onClick={() => {
              setActiveTab("inbox");
              handleBackToInbox();
            }}
            className={`w-full flex items-center justify-between px-6 py-2 rounded-r-full text-xs font-semibold transition-all ${activeTab === "inbox"
                ? "bg-[#d3e3fd] text-[#041e49] dark:bg-blue-955/60 dark:text-blue-300 font-bold"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-200/80 dark:hover:bg-slate-800/50"
              }`}
          >
            <div className="flex items-center gap-3">
              <Inbox
                size={16}
                className={
                  activeTab === "inbox"
                    ? "text-[#041e49] dark:text-blue-300"
                    : "text-slate-500"
                }
              />
              <span>Inbox</span>
            </div>
            {inboxTotal > 0 && (
              <span className="text-[10px] font-bold text-slate-550 dark:text-slate-400">
                {inboxTotal}
              </span>
            )}
          </button>

          <button
            onClick={() => {
              setActiveTab("sent");
              handleBackToInbox();
            }}
            className={`w-full flex items-center justify-between px-6 py-2 rounded-r-full text-xs font-semibold transition-all ${activeTab === "sent"
                ? "bg-[#d3e3fd] text-[#041e49] dark:bg-blue-955/60 dark:text-blue-300 font-bold"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-200/80 dark:hover:bg-slate-800/50"
              }`}
          >
            <div className="flex items-center gap-3">
              <Send
                size={16}
                className={
                  activeTab === "sent"
                    ? "text-[#041e49] dark:text-blue-300"
                    : "text-slate-500"
                }
              />
              <span>Sent</span>
            </div>
            {sentTotal > 0 && (
              <span className="text-[10px] font-bold text-slate-550 dark:text-slate-400">
                {sentTotal}
              </span>
            )}
          </button>
        </div>

        {/* Alias Status Card */}
        <div className="px-4 pt-4 space-y-3 border-t border-slate-100 dark:border-slate-850/60">
          <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-400">
            <span>Mailbox Status</span>
            <span className="flex items-center gap-1 px-3 py-0.5 font-semibold text-green-500 rounded-full bg-green-500/10">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
              Active
            </span>
          </div>

          <div className="space-y-1">
            <span className="text-[9px] font-bold text-slate-400 block">
              Alias Address
            </span>
            <div className="flex items-center justify-between p-2 border rounded-xl bg-slate-50/50 dark:bg-slate-900/30 border-slate-100 dark:border-slate-800/50">
              <span className="text-[11px] font-medium text-slate-700 dark:text-slate-300 truncate pr-2 select-all">
                {mailboxInfo?.aliasEmail}
              </span>
              <button
                onClick={handleCopyAlias}
                className="p-1 transition-colors rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                title="Copy email alias"
              >
                {copied ? (
                  <Check size={12} className="text-green-500" />
                ) : (
                  <Copy size={12} />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 2. DYNAMIC WORKSPACE PANEL */}
      <div className="flex flex-col flex-grow min-w-0 overflow-hidden bg-white border shadow-sm dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 rounded-2xl">
        {/* Dynamic Header */}
        <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900 min-h-[48px]">
          {/* Left Actions */}
          <div className="flex items-center gap-1">
            {selectedMailUid ? (
              <button
                onClick={handleBackToInbox}
                className="p-2 transition-colors rounded-full text-slate-650 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                title="Back to list"
              >
                <ArrowLeft size={16} />
              </button>
            ) : activeTab === "compose" ? (
              <span className="px-2 text-sm font-bold text-slate-800 dark:text-slate-200">
                New Message
              </span>
            ) : (
              <>
                {/* Checkbox */}
                {/* <div className="flex items-center justify-center p-2 transition-colors rounded-full cursor-pointer text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800">
                  <input
                    type="checkbox"
                    className="rounded border-slate-350 text-blue-650 focus:ring-blue-500 w-3.5 h-3.5"
                  />
                </div> */}

                {/* Refresh button */}
                {activeTab === "inbox" && (
                  <button
                    onClick={() => fetchInbox(inboxPage)}
                    disabled={isLoadingInbox}
                    className="flex items-center justify-center p-2 transition-colors rounded-full text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                    title="Refresh"
                  >
                    <RefreshCw
                      size={16}
                      className={isLoadingInbox ? "animate-spin" : ""}
                    />
                  </button>
                )}
                {activeTab === "sent" && (
                  <button
                    onClick={() => fetchSent(sentPage)}
                    disabled={isLoadingSent}
                    className="flex items-center justify-center p-2 transition-colors rounded-full text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                    title="Refresh"
                  >
                    <RefreshCw
                      size={16}
                      className={isLoadingSent ? "animate-spin" : ""}
                    />
                  </button>
                )}
              </>
            )}
          </div>

          {/* Right Actions / Pagination */}
          <div className="flex items-center gap-3">
            {!selectedMailUid && activeTab === "inbox" && inboxTotal > 0 && (
              <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
                <span>
                  {`${(inboxPage - 1) * inboxLimit + 1}–${Math.min(inboxPage * inboxLimit, inboxTotal)} of ${inboxTotal}`}
                </span>
                <div className="flex items-center">
                  <button
                    onClick={() =>
                      setInboxPage((prev) => Math.max(1, prev - 1))
                    }
                    disabled={inboxPage === 1}
                    className="p-1.5 text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-30 disabled:hover:bg-transparent"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <button
                    onClick={() =>
                      setInboxPage((prev) =>
                        Math.min(Math.ceil(inboxTotal / inboxLimit), prev + 1),
                      )
                    }
                    disabled={inboxPage >= Math.ceil(inboxTotal / inboxLimit)}
                    className="p-1.5 text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-30 disabled:hover:bg-transparent"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}
            {!selectedMailUid && activeTab === "sent" && sentTotal > 0 && (
              <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
                <span>
                  {`${(sentPage - 1) * inboxLimit + 1}–${Math.min(sentPage * inboxLimit, sentTotal)} of ${sentTotal}`}
                </span>
                <div className="flex items-center">
                  <button
                    onClick={() => setSentPage((prev) => Math.max(1, prev - 1))}
                    disabled={sentPage === 1}
                    className="p-1.5 text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-30 disabled:hover:bg-transparent"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <button
                    onClick={() =>
                      setSentPage((prev) =>
                        Math.min(Math.ceil(sentTotal / inboxLimit), prev + 1),
                      )
                    }
                    disabled={sentPage >= Math.ceil(sentTotal / inboxLimit)}
                    className="p-1.5 text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-30 disabled:hover:bg-transparent"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Dynamic Inner Content */}
        <div className="flex-grow p-2 overflow-y-auto">
          <AnimatePresence mode="wait">
            {/* VIEW A SPECIFIC EMAIL DETAIL */}
            {selectedMailUid ? (
              <motion.div
                key="mail-details"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                {/* Back Button */}
                <button
                  onClick={handleBackToInbox}
                  className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-100 dark:bg-slate-800 dark:text-slate-300 dark:hover:text-white px-3 py-1.5 rounded-lg transition-colors"
                >
                  <ArrowLeft size={14} />
                  <span>Back to List</span>
                </button>

                {isLoadingMailDetails ? (
                  <div className="flex flex-col items-center justify-center gap-3 py-20">
                    <div className="w-8 h-8 rounded-full border-3 border-primary border-t-transparent animate-spin" />
                    <p className="text-xs font-bold tracking-wider text-gray-400 uppercase">
                      Loading full message content...
                    </p>
                  </div>
                ) : selectedMailDetails ? (
                  <div className="space-y-4">
                    {/* Gmail Detail Header */}
                    <div className="space-y-3">
                      <h2 className="px-1 text-lg font-semibold text-slate-800 dark:text-white">
                        {selectedMailDetails.subject || "(No Subject)"}
                      </h2>

                      {/* Sender Info Row */}
                      <div className="flex items-start justify-between gap-4 px-1">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center justify-center text-xs font-bold uppercase rounded-full w-9 h-9 bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 shrink-0">
                            {getInitials(selectedMailDetails.from)}
                          </div>
                          <div className="text-xs leading-normal">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-bold text-slate-800 dark:text-slate-100">
                                {getSenderName(selectedMailDetails.from)}
                              </span>
                              <span className="text-slate-400 font-medium text-[11px]">
                                &lt;{selectedMailDetails.from}&gt;
                              </span>
                            </div>
                            <div className="text-slate-400 text-[11px] mt-0.5">
                              to {selectedMailDetails.to}
                            </div>
                          </div>
                        </div>

                        <div className="text-[11px] font-bold text-slate-400 whitespace-nowrap pt-1">
                          {selectedMailDetails.date
                            ? new Date(
                              selectedMailDetails.date,
                            ).toLocaleString()
                            : "Date N/A"}
                        </div>
                      </div>
                    </div>

                    {/* Attachments Section */}
                    {selectedMailDetails.attachments?.length > 0 && (
                      <div className="p-3 space-y-2 border border-slate-200/60 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-900/30">
                        <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300">
                          <Paperclip size={14} />
                          <span>
                            Attachments (
                            {selectedMailDetails.attachments.length})
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {selectedMailDetails.attachments.map((att, index) => (
                            <button
                              key={index}
                              onClick={() => handleDownloadAttachment(att)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-[11px] font-bold text-slate-650 dark:text-slate-300 shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition active:scale-95 text-left"
                            >
                              <Paperclip size={12} className="text-slate-400" />
                              <span>{att.filename}</span>
                              <span className="font-medium text-gray-400">
                                ({(att.size / 1024).toFixed(1)} KB)
                              </span>
                              <Download
                                size={12}
                                className="text-indigo-650 dark:text-indigo-400 ml-1.5"
                              />
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* HTML Iframe parser with Sandboxing styled as a paper sheet */}
                    <div className="p-4 border sm:p-6 bg-slate-50 dark:bg-slate-950/40 rounded-2xl border-slate-100 dark:border-slate-800/80">
                      <div className="overflow-hidden bg-white border shadow-sm border-slate-200/60 dark:border-slate-850 rounded-xl">
                        <iframe
                          srcDoc={
                            selectedMailDetails.html ||
                            `<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 14px; line-height: 1.6; color: #334155; white-space: pre-wrap; padding: 16px;">${(selectedMailDetails.text || "(No content)").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")}</div>`
                          }
                          className="w-full h-[450px] border-none bg-white"
                          sandbox="allow-popups allow-popups-to-escape-sandbox"
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="py-10 font-bold text-center text-red-500">
                    Could not resolve email body.
                  </div>
                )}
              </motion.div>
            ) : activeTab === "inbox" ? (
              /* INBOX TAB */
              <motion.div
                key="inbox-panel"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-4"
              >
                {isLoadingInbox ? (
                  <div className="flex flex-col items-center justify-center gap-3 py-20">
                    <div className="w-8 h-8 rounded-full border-3 border-primary border-t-transparent animate-spin" />
                    <p className="text-xs font-bold tracking-wider text-gray-400 uppercase">
                      Loading incoming messages...
                    </p>
                  </div>
                ) : inboxMails.length === 0 ? (
                  <div className="py-20 space-y-3 text-center">
                    <div className="inline-flex p-4 text-gray-300 rounded-full bg-gray-50 dark:bg-slate-900">
                      <Inbox size={48} className="opacity-50" />
                    </div>
                    <p className="text-sm font-bold tracking-widest text-gray-400 uppercase">
                      No incoming messages found
                    </p>
                    <p className="text-xs text-gray-400">
                      Emails sent to your alias will appear here
                    </p>
                  </div>
                ) : (
                  <div className="overflow-hidden border divide-y border-slate-100 dark:border-slate-800/80 rounded-xl divide-slate-100 dark:divide-slate-800/80">
                    {/* Mail list */}
                    {inboxMails.map((mail) => {
                      const senderName = getSenderName(mail.from);
                      const initials = getInitials(mail.from);
                      return (
                        <div
                          key={mail.uid}
                          onClick={() => handleViewMail(mail.uid)}
                          className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer transition-all ${mail.isRead
                              ? "bg-slate-50/20 hover:bg-slate-150/40 dark:bg-slate-900/10 dark:hover:bg-slate-800/40 text-slate-600 dark:text-slate-400"
                              : "bg-white hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-850 text-slate-900 dark:text-slate-100 font-semibold border-l-4 border-l-blue-600"
                            }`}
                        >
                          {/* Selection Checkbox & Star */}
                          <div className="flex items-center gap-2 shrink-0">
                            {/* <input
                              type="checkbox"
                              onClick={(e) => e.stopPropagation()}
                              className="rounded border-slate-300 dark:border-slate-700 text-blue-600 focus:ring-blue-500 w-3.5 h-3.5 bg-transparent"
                            /> */}
                            <button
                              type="button"
                              onClick={(e) => e.stopPropagation()}
                              className="transition-colors text-slate-350 hover:text-yellow-500 dark:text-slate-600 dark:hover:text-yellow-500"
                            >
                              <Star size={16} />
                            </button>
                          </div>

                          {/* Avatar Column */}
                          <div className="shrink-0">
                            <div
                              className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-[10px] uppercase ${mail.isRead
                                  ? "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                                  : "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300"
                                }`}
                            >
                              {initials}
                            </div>
                          </div>

                          {/* Sender Name Column */}
                          <div className="truncate w-28 sm:w-36 md:w-44 shrink-0">
                            <span
                              className={
                                mail.isRead ? "font-medium" : "font-bold"
                              }
                            >
                              {senderName}
                            </span>
                          </div>

                          {/* Subject / Concatenated Snippet */}
                          <div className="flex-grow min-w-0 pr-2 truncate">
                            <span
                              className={
                                mail.isRead
                                  ? "text-slate-700 dark:text-slate-300"
                                  : "text-slate-900 dark:text-slate-100 font-bold"
                              }
                            >
                              {mail.subject || "(No Subject)"}
                            </span>
                          </div>

                          {/* Date Column */}
                          <div className="shrink-0 text-[10px] font-bold text-slate-400 whitespace-nowrap pl-2">
                            {mail.date
                              ? new Date(mail.date).toLocaleDateString()
                              : ""}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </motion.div>
            ) : activeTab === "sent" ? (
              /* SENT BOX TAB */
              <motion.div
                key="sent-panel"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-2"
              >
                {isLoadingSent ? (
                  <div className="flex flex-col items-center justify-center gap-3 py-20">
                    <div className="w-8 h-8 rounded-full border-3 border-primary border-t-transparent animate-spin" />
                    <p className="text-xs font-bold tracking-wider text-gray-400 uppercase">
                      Loading sent messages...
                    </p>
                  </div>
                ) : sentMailsList.length === 0 ? (
                  <div className="py-20 space-y-3 text-center">
                    <div className="inline-flex p-4 text-gray-300 rounded-full bg-gray-50 dark:bg-slate-900">
                      <Send size={48} className="opacity-50" />
                    </div>
                    <p className="text-sm font-bold tracking-widest text-gray-400 uppercase">
                      No sent messages found
                    </p>
                    <p className="text-xs text-gray-400">
                      Messages you send will appear here
                    </p>
                  </div>
                ) : (
                  <div className="overflow-hidden border divide-y border-slate-100 dark:border-slate-800/80 rounded-xl divide-slate-100 dark:divide-slate-800/80">
                    {/* Mail list */}
                    {sentMailsList.map((mail) => {
                      const recipientName = getSenderName(mail.to);
                      const initials = getInitials(mail.to);
                      return (
                        <div
                          key={mail.uid}
                          onClick={() => handleViewMail(mail.uid)}
                          className="flex items-center gap-3 px-4 py-2.5 cursor-pointer transition-all bg-slate-50/20 hover:bg-slate-150/40 dark:bg-slate-900/10 dark:hover:bg-slate-800/40 text-slate-600 dark:text-slate-400"
                        >
                          {/* Selection Checkbox & Star */}
                          <div className="flex items-center gap-2 shrink-0">
                            <input
                              type="checkbox"
                              onClick={(e) => e.stopPropagation()}
                              className="rounded border-slate-300 dark:border-slate-700 text-blue-600 focus:ring-blue-500 w-3.5 h-3.5 bg-transparent"
                            />
                            <button
                              type="button"
                              onClick={(e) => e.stopPropagation()}
                              className="transition-colors text-slate-350 hover:text-yellow-500 dark:text-slate-600 dark:hover:text-yellow-500"
                            >
                              <Star size={16} />
                            </button>
                          </div>

                          {/* Avatar Column */}
                          <div className="shrink-0">
                            <div className="w-7 h-7 rounded-full flex items-center justify-center font-bold text-[10px] uppercase bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                              {initials}
                            </div>
                          </div>

                          {/* Recipient Column */}
                          <div className="truncate w-28 sm:w-36 md:w-44 shrink-0">
                            <span className="font-medium text-slate-700 dark:text-slate-300">
                              To: {recipientName}
                            </span>
                          </div>

                          {/* Subject */}
                          <div className="flex-grow min-w-0 pr-2 truncate">
                            <span className="text-slate-700 dark:text-slate-300">
                              {mail.subject || "(No Subject)"}
                            </span>
                          </div>

                          {/* Date Column */}
                          <div className="shrink-0 text-[10px] font-bold text-slate-400 whitespace-nowrap pl-2">
                            {mail.date
                              ? new Date(mail.date).toLocaleDateString()
                              : ""}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </motion.div>
            ) : (
              /* COMPOSE TAB */
              <motion.div
                key="compose-panel"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="w-full"
              >
                <div
                  className={`grid grid-cols-1 ${user?.role?.toLowerCase() === "coopadmin" ? "lg:grid-cols-12" : ""} gap-2`}
                >
                  {/* Left Column: Template Builder (Only for Coop Admin) */}
                  {user?.role?.toLowerCase() === "coopadmin" && (
                    <div className="p-5 space-y-4 border border-gray-100 lg:col-span-3 bg-gray-50/50 dark:bg-slate-900/30 rounded-2xl dark:border-slate-800">
                      <div>
                        <h3 className="mb-1 text-sm font-black tracking-wider uppercase text-slate-800 dark:text-white">
                          Email Templates
                        </h3>
                        <p className="text-[11px] text-gray-400 font-medium">
                          Quickly format and pre-fill compliance notices for
                          your members.
                        </p>
                      </div>

                      <div>
                        <label className="block mb-1 text-xs font-black tracking-wider text-gray-500 uppercase dark:text-gray-400">
                          Select Template
                        </label>
                        <select
                          value={selectedTemplate}
                          onChange={(e) => setSelectedTemplate(e.target.value)}
                          className="w-full px-3 py-2 text-sm bg-white border border-gray-200 outline-none dark:border-slate-700 rounded-xl dark:bg-slate-800 focus:ring-2 focus:ring-primary focus:border-transparent dark:text-white"
                        >
                          <option value="">None (Custom Email)</option>
                          <option value="AGM_INVITATION">AGM Invitation</option>
                          <option value="MANUAL_INDIVIDUAL">
                            General Mail
                          </option>
                          <option value="MANUAL_ALL_MEMBERS">
                            Nachricht an alle Mitglieder
                          </option>
                        </select>
                      </div>

                      {selectedTemplate === "AGM_INVITATION" && (
                        <div className="pt-2 space-y-3 border-t border-gray-100 dark:border-slate-800/80 animate-fadeIn">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-black uppercase text-gray-400">
                              Template Options
                            </span>
                            <div className="flex gap-1.5">
                              <button
                                type="button"
                                onClick={() => setTemplateLanguage("de")}
                                className={`px-2 py-0.5 text-[10px] font-bold rounded-md transition-colors ${templateLanguage === "de" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 dark:bg-slate-800 dark:text-gray-400"}`}
                              >
                                German
                              </button>
                              <button
                                type="button"
                                onClick={() => setTemplateLanguage("en")}
                                className={`px-2 py-0.5 text-[10px] font-bold rounded-md transition-colors ${templateLanguage === "en" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 dark:bg-slate-800 dark:text-gray-400"}`}
                              >
                                English
                              </button>
                            </div>
                          </div>

                          <div>
                            <label className="block mb-1 text-[10px] font-black uppercase tracking-wider text-gray-400">
                              Cooperative Name
                            </label>
                            <input
                              type="text"
                              value={templateVals.coopName}
                              onChange={(e) =>
                                setTemplateVals((prev) => ({
                                  ...prev,
                                  coopName: e.target.value,
                                }))
                              }
                              className="w-full px-3 py-1.5 text-xs border border-gray-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 outline-none dark:text-white"
                            />
                          </div>

                          <div className="grid grid-cols-1 gap-2">
                            <div>
                              <label className="block mb-1 text-[10px] font-black uppercase tracking-wider text-gray-400">
                                Date of Assembly
                              </label>
                              <input
                                type="date"
                                required
                                min={getMinDate()}
                                value={templateVals.agmDate}
                                onChange={(e) =>
                                  setTemplateVals((prev) => ({
                                    ...prev,
                                    agmDate: e.target.value,
                                  }))
                                }
                                className="w-full px-3 py-1.5 text-xs border border-gray-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 outline-none dark:text-white"
                              />
                              <p className="mt-1 text-[10px] text-gray-500 dark:text-gray-400 font-medium">
                                {templateLanguage === "de"
                                  ? `Mindestfrist beträgt ${agmNoticePeriodDays} Tage.`
                                  : `Minimum notice period is ${agmNoticePeriodDays} days.`}
                              </p>
                            </div>
                            <div>
                              <label className="block mb-1 text-[10px] font-black uppercase tracking-wider text-gray-400">
                                Time of Assembly
                              </label>
                              <input
                                type="time"
                                required
                                value={templateVals.agmTime}
                                onChange={(e) =>
                                  setTemplateVals((prev) => ({
                                    ...prev,
                                    agmTime: e.target.value,
                                  }))
                                }
                                className="w-full px-3 py-1.5 text-xs border border-gray-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 outline-none dark:text-white"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block mb-1 text-[10px] font-black uppercase tracking-wider text-gray-400">
                              Location
                            </label>
                            <input
                              type="text"
                              required
                              value={templateVals.agmLocation}
                              onChange={(e) =>
                                setTemplateVals((prev) => ({
                                  ...prev,
                                  agmLocation: e.target.value,
                                }))
                              }
                              placeholder="e.g. Hotel Hall or Online Zoom link"
                              className="w-full px-3 py-1.5 text-xs border border-gray-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 outline-none dark:text-white"
                            />
                          </div>

                          <div>
                            <label className="block mb-1 text-[10px] font-black uppercase tracking-wider text-gray-400">
                              Online Link (Optional)
                            </label>
                            <input
                              type="text"
                              value={templateVals.onlineLink}
                              onChange={(e) =>
                                setTemplateVals((prev) => ({
                                  ...prev,
                                  onlineLink: e.target.value,
                                }))
                              }
                              placeholder="e.g. https://zoom.us/j/..."
                              className="w-full px-3 py-1.5 text-xs border border-gray-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 outline-none dark:text-white"
                            />
                          </div>

                          <div>
                            <label className="block mb-1 text-[10px] font-black uppercase tracking-wider text-gray-400">
                              Agenda Items (Tagesordnung)
                            </label>
                            <textarea
                              required
                              rows={4}
                              value={templateVals.agendaItems}
                              onChange={(e) =>
                                setTemplateVals((prev) => ({
                                  ...prev,
                                  agendaItems: e.target.value,
                                }))
                              }
                              placeholder="1. Opening of Assembly&#10;2. Presentation of accounts&#10;3. Auditor's report"
                              className="w-full px-3 py-1.5 text-xs border border-gray-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 outline-none dark:text-white leading-relaxed resize-none"
                            />
                          </div>

                          {noticeWarning && (
                            <div className="p-3 bg-red-50 border border-red-100 rounded-xl dark:bg-red-950/20 dark:border-red-900/30 text-[11px] font-semibold text-red-600 dark:text-red-400 leading-relaxed">
                              {noticeWarning}
                            </div>
                          )}

                          <button
                            type="button"
                            disabled={
                              isNoticeBlocked ||
                              !templateVals.agmDate ||
                              !templateVals.agmTime ||
                              !templateVals.agmLocation ||
                              !templateVals.agendaItems
                            }
                            onClick={handleApplyTemplate}
                            className="w-full flex items-center justify-center gap-1.5 py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs active:scale-[0.98] transition-all disabled:opacity-40 disabled:hover:bg-blue-600 disabled:active:scale-100"
                          >
                            <Sparkles size={14} />
                            <span>
                              Apply Template & Fill Active Members (
                              {activeMembers.length})
                            </span>
                          </button>
                        </div>
                      )}

                      {selectedTemplate === "MANUAL_INDIVIDUAL" && (
                        <div className="pt-2 space-y-3 border-t border-gray-100 dark:border-slate-800/80 animate-fadeIn">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-black uppercase text-gray-400">
                              Template Options
                            </span>
                            <div className="flex gap-1.5">
                              <button
                                type="button"
                                onClick={() => setTemplateLanguage("de")}
                                className={`px-2 py-0.5 text-[10px] font-bold rounded-md transition-colors ${templateLanguage === "de" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 dark:bg-slate-800 dark:text-gray-400"}`}
                              >
                                German
                              </button>
                              <button
                                type="button"
                                onClick={() => setTemplateLanguage("en")}
                                className={`px-2 py-0.5 text-[10px] font-bold rounded-md transition-colors ${templateLanguage === "en" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 dark:bg-slate-800 dark:text-gray-400"}`}
                              >
                                English
                              </button>
                            </div>
                          </div>

                          <div>
                            <label className="block mb-1 text-[10px] font-black uppercase tracking-wider text-gray-400">
                              Cooperative Name
                            </label>
                            <input
                              type="text"
                              value={templateVals.coopName}
                              onChange={(e) =>
                                setTemplateVals((prev) => ({
                                  ...prev,
                                  coopName: e.target.value,
                                }))
                              }
                              className="w-full px-3 py-1.5 text-xs border border-gray-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 outline-none dark:text-white"
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="block mb-1 text-[10px] font-black uppercase tracking-wider text-gray-400">
                                Salutation (Anrede)
                              </label>
                              <input
                                type="text"
                                required
                                value={templateVals.salutation}
                                onChange={(e) =>
                                  setTemplateVals((prev) => ({
                                    ...prev,
                                    salutation: e.target.value,
                                  }))
                                }
                                placeholder="e.g. Herr / Frau / Mr. / Ms."
                                className="w-full px-3 py-1.5 text-xs border border-gray-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 outline-none dark:text-white"
                              />
                            </div>
                            <div>
                              <label className="block mb-1 text-[10px] font-black uppercase tracking-wider text-gray-400">
                                Last Name (Nachname)
                              </label>
                              <input
                                type="text"
                                required
                                value={templateVals.lastName}
                                onChange={(e) =>
                                  setTemplateVals((prev) => ({
                                    ...prev,
                                    lastName: e.target.value,
                                  }))
                                }
                                placeholder="e.g. Schmidt"
                                className="w-full px-3 py-1.5 text-xs border border-gray-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 outline-none dark:text-white"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block mb-1 text-[10px] font-black uppercase tracking-wider text-gray-400">
                              Message Content
                            </label>
                            <textarea
                              required
                              rows={5}
                              value={templateVals.messageText}
                              onChange={(e) =>
                                setTemplateVals((prev) => ({
                                  ...prev,
                                  messageText: e.target.value,
                                }))
                              }
                              placeholder="Write your custom message text here..."
                              className="w-full px-3 py-1.5 text-xs border border-gray-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 outline-none dark:text-white leading-relaxed resize-none"
                            />
                          </div>

                          <button
                            type="button"
                            disabled={
                              !templateVals.salutation ||
                              !templateVals.lastName ||
                              !templateVals.messageText
                            }
                            onClick={handleApplyTemplate}
                            className="w-full flex items-center justify-center gap-1.5 py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs active:scale-[0.98] transition-all disabled:opacity-40"
                          >
                            <Sparkles size={14} />
                            <span>Apply Template to Compose</span>
                          </button>
                        </div>
                      )}

                      {selectedTemplate === "MANUAL_ALL_MEMBERS" && (
                        <div className="pt-2 space-y-3 border-t border-gray-100 dark:border-slate-800/80 animate-fadeIn">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-black uppercase text-gray-400">
                              Template Options
                            </span>
                            <div className="flex gap-1.5">
                              <button
                                type="button"
                                onClick={() => setTemplateLanguage("de")}
                                className={`px-2 py-0.5 text-[10px] font-bold rounded-md transition-colors ${templateLanguage === "de" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 dark:bg-slate-800 dark:text-gray-400"}`}
                              >
                                German
                              </button>
                              <button
                                type="button"
                                onClick={() => setTemplateLanguage("en")}
                                className={`px-2 py-0.5 text-[10px] font-bold rounded-md transition-colors ${templateLanguage === "en" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 dark:bg-slate-800 dark:text-gray-400"}`}
                              >
                                English
                              </button>
                            </div>
                          </div>

                          <div>
                            <label className="block mb-1 text-[10px] font-black uppercase tracking-wider text-gray-400">
                              Cooperative Name
                            </label>
                            <input
                              type="text"
                              value={templateVals.coopName}
                              onChange={(e) =>
                                setTemplateVals((prev) => ({
                                  ...prev,
                                  coopName: e.target.value,
                                }))
                              }
                              className="w-full px-3 py-1.5 text-xs border border-gray-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 outline-none dark:text-white"
                            />
                          </div>

                          <div>
                            <label className="block mb-1 text-[10px] font-black uppercase tracking-wider text-gray-400">
                              Message Content
                            </label>
                            <textarea
                              required
                              rows={5}
                              value={templateVals.messageText}
                              onChange={(e) =>
                                setTemplateVals((prev) => ({
                                  ...prev,
                                  messageText: e.target.value,
                                }))
                              }
                              placeholder="Write your custom message to all members here..."
                              className="w-full px-3 py-1.5 text-xs border border-gray-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 outline-none dark:text-white leading-relaxed resize-none"
                            />
                          </div>

                          <button
                            type="button"
                            onClick={handleApplyTemplate}
                            className="w-full flex items-center justify-center gap-1.5 py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs active:scale-[0.98] transition-all disabled:opacity-40"
                          >
                            <Sparkles size={14} />
                            <span>
                              Apply Template & Fill Active Members (
                              {activeMembers.length})
                            </span>
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Right Column: Compose Email Form */}
                  <div
                    className={`${user?.role?.toLowerCase() === "coopadmin" ? "lg:col-span-9" : "w-full"} w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-md overflow-hidden flex flex-col`}
                  >
                    {/* Compose Header */}
                    {user?.role?.toLowerCase() === "coopadmin" && (
                      <div className="bg-slate-50 dark:bg-slate-800/80 px-4 py-2.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-350">
                          New Message
                        </span>
                      </div>
                    )}

                    <form
                      onSubmit={handleComposeSend}
                      className="flex flex-col flex-grow h-full p-4 space-y-4"
                    >
                      {/* To Field with Chips */}
                      <div className="flex items-start gap-2 border-b border-slate-100 dark:border-slate-800/80 py-1.5 flex-wrap min-h-[36px]">
                        <span className="w-8 pt-1 text-xs font-bold text-slate-400 shrink-0">
                          To
                        </span>
                        <div className="flex flex-wrap gap-1.5 flex-grow items-center min-w-0">
                          {(composeTo
                            ? composeTo
                              .split(",")
                              .map((e) => e.trim())
                              .filter(Boolean)
                            : []
                          ).map((email, idx) => (
                            <div
                              key={idx}
                              className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-blue-50 dark:bg-blue-900/30 border border-blue-100 dark:border-blue-900/40 rounded-full text-xs font-medium text-blue-750 dark:text-blue-300"
                            >
                              <span className="max-w-[200px] truncate">
                                {email}
                              </span>
                              <button
                                type="button"
                                onClick={() => {
                                  const chips = composeTo
                                    .split(",")
                                    .map((e) => e.trim())
                                    .filter(Boolean);
                                  const updated = chips.filter(
                                    (_, i) => i !== idx,
                                  );
                                  setComposeTo(updated.join(", "));
                                }}
                                className="text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-200 font-bold ml-0.5 text-[11px]"
                              >
                                ×
                              </button>
                            </div>
                          ))}
                          <input
                            type="text"
                            value={composeToInput}
                            onChange={(e) => setComposeToInput(e.target.value)}
                            onKeyDown={(e) => {
                              const chips = composeTo
                                ? composeTo
                                  .split(",")
                                  .map((e) => e.trim())
                                  .filter(Boolean)
                                : [];
                              if (
                                e.key === "Enter" ||
                                e.key === "," ||
                                e.key === "Tab" ||
                                e.key === " "
                              ) {
                                e.preventDefault();
                                const val = composeToInput
                                  .trim()
                                  .replace(/,$/, "");
                                if (val) {
                                  if (val.includes("@")) {
                                    if (!chips.includes(val)) {
                                      const newTo = composeTo
                                        ? `${composeTo}, ${val}`
                                        : val;
                                      setComposeTo(newTo);
                                    }
                                    setComposeToInput("");
                                  } else {
                                    toast.error(
                                      "Please enter a valid email address.",
                                    );
                                  }
                                }
                              } else if (
                                e.key === "Backspace" &&
                                !composeToInput &&
                                chips.length > 0
                              ) {
                                const updated = chips.slice(0, -1);
                                setComposeTo(updated.join(", "));
                              }
                            }}
                            onBlur={() => {
                              const chips = composeTo
                                ? composeTo
                                  .split(",")
                                  .map((e) => e.trim())
                                  .filter(Boolean)
                                : [];
                              const val = composeToInput
                                .trim()
                                .replace(/,$/, "");
                              if (val && val.includes("@")) {
                                if (!chips.includes(val)) {
                                  const newTo = composeTo
                                    ? `${composeTo}, ${val}`
                                    : val;
                                  setComposeTo(newTo);
                                }
                                setComposeToInput("");
                              }
                            }}
                            onPaste={(e) => {
                              e.preventDefault();
                              const pasteData = e.clipboardData.getData("text");
                              const pastedEmails = pasteData
                                .split(/[\s,;]+/)
                                .map((email) => email.trim())
                                .filter(
                                  (email) => email && email.includes("@"),
                                );

                              if (pastedEmails.length > 0) {
                                const chips = composeTo
                                  ? composeTo
                                    .split(",")
                                    .map((e) => e.trim())
                                    .filter(Boolean)
                                  : [];
                                const combined = [...chips];
                                pastedEmails.forEach((email) => {
                                  if (!combined.includes(email)) {
                                    combined.push(email);
                                  }
                                });
                                setComposeTo(combined.join(", "));
                                setComposeToInput("");
                              }
                            }}
                            required={
                              (composeTo
                                ? composeTo
                                  .split(",")
                                  .map((e) => e.trim())
                                  .filter(Boolean)
                                : []
                              ).length === 0
                            }
                            placeholder={
                              (composeTo
                                ? composeTo
                                  .split(",")
                                  .map((e) => e.trim())
                                  .filter(Boolean)
                                : []
                              ).length === 0
                                ? "recipients@example.com (comma, space, or enter to add)"
                                : ""
                            }
                            className="flex-grow min-w-[150px] p-0 text-xs bg-transparent border-none outline-none focus:ring-0 text-slate-800 dark:text-slate-100 py-0.5"
                          />
                        </div>
                      </div>

                      {/* Subject Field */}
                      <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800/80 py-1.5">
                        <span className="w-8 text-xs font-bold text-slate-400 shrink-0">
                          Sub
                        </span>
                        <input
                          type="text"
                          required
                          value={composeSubject}
                          onChange={(e) => setComposeSubject(e.target.value)}
                          placeholder="Subject"
                          className="flex-grow p-0 text-xs bg-transparent border-none outline-none focus:ring-0 text-slate-800 dark:text-slate-100"
                        />
                      </div>

                      {/* Message Body Field */}
                      <div className="flex flex-col flex-grow pt-1">
                        <textarea
                          required
                          value={composeBody}
                          onChange={(e) => setComposeBody(e.target.value)}
                          placeholder="Write your email body text here..."
                          className="w-full flex-grow p-0 text-xs leading-relaxed bg-transparent border-none outline-none resize-none focus:ring-0 text-slate-805 dark:text-slate-100 min-h-[200px]"
                        />
                      </div>

                      {/* Attachments Section */}
                      <div className="flex flex-col gap-2 pt-3 border-t border-slate-100 dark:border-slate-800/80">
                        {attachments.length > 0 && (
                          <div className="flex flex-wrap gap-2 pb-1">
                            {attachments.map((att, idx) => (
                              <div
                                key={idx}
                                className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-300"
                              >
                                <Paperclip
                                  size={12}
                                  className="text-slate-400"
                                />
                                <span className="max-w-[150px] truncate text-[11px]">
                                  {att.filename}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveAttachment(idx)}
                                  className="text-xs font-bold text-red-500 hover:text-red-700"
                                >
                                  ×
                                </button>
                              </div>
                            ))}
                          </div>
                        )}

                        {bulkProgress && (
                          <div className="flex items-center justify-between p-3 mb-2 border border-blue-100 bg-blue-50/50 rounded-xl dark:bg-blue-955/20 dark:border-blue-900/30 animate-fadeIn">
                            <div className="space-y-1.5 flex-grow mr-4">
                              <p className="text-[11px] font-bold text-blue-750 dark:text-blue-400">
                                Processing bulk mail queue (
                                {bulkProgress.current} / {bulkProgress.total})
                              </p>
                              <div className="w-full h-1.5 bg-gray-200 dark:bg-slate-800 rounded-full overflow-hidden">
                                <div
                                  className="h-full transition-all duration-300 bg-blue-600"
                                  style={{
                                    width: `${(bulkProgress.current / bulkProgress.total) * 100}%`,
                                  }}
                                />
                              </div>
                            </div>
                            <span className="text-xs font-bold text-blue-750 dark:text-blue-400 whitespace-nowrap">
                              {Math.round(
                                (bulkProgress.current / bulkProgress.total) *
                                100,
                              )}
                              %
                            </span>
                          </div>
                        )}

                        {/* Footer Compose Actions */}
                        <div className="flex items-center justify-end pt-3 border-t border-slate-100 dark:border-slate-800/80">
                          <div className="flex items-center gap-3">
                            <label className="p-2 transition-all rounded-full cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-700 dark:hover:text-slate-350">
                              <Paperclip size={16} />
                              <input
                                type="file"
                                multiple
                                className="hidden"
                                onChange={handleFileChange}
                              />
                            </label>
                            <button
                              type="submit"
                              disabled={isSending}
                              className="flex items-center gap-2 py-2 px-6 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-full shadow-sm hover:shadow active:scale-[0.98] transition-all disabled:opacity-50 text-xs"
                            >
                              {isSending ? (
                                <>
                                  <RefreshCw
                                    className="animate-spin"
                                    size={14}
                                  />
                                  <span>Sending...</span>
                                </>
                              ) : (
                                <>
                                  <span>Send</span>
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    </form>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
