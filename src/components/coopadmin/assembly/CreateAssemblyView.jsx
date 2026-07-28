"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  CalendarDays,
  CheckCircle,
  ClipboardList,
  Lock,
  Mail,
  Plus,
  Save,
  Send,
  Trash2,
  Upload,
  Users,
  ChevronLeft,
  ChevronRight,
  Loader2,
  FileText,
  Info,
  MapPin,
  Calendar,
  Laptop,
  Network,
  Building2,
  Clock,
  Sparkles,
  X,
} from "lucide-react";
import {
  createAssembly,
  getAssembliesByCoopId,
  updateAssembly,
} from "@/lib/assemblyService";
import { getMembersOfCoop } from "@/lib/transactionService";
import { getTotalMembersOfCoop } from "@/lib/getMembersDetails";
import { fetchCooperativeSettings } from "@/lib/cooperativeSettingsService";
import TiltPopUp from "@/components/pop-ups/TiltPopUp";
import FadePopUp from "@/components/pop-ups/FadePopUp";
import toast from "react-hot-toast";

const DEFAULT_NOTICE_PERIOD_DAYS = 14;

const assemblyFormats = ["praesenz", "virtuell", "hybrid", "gestreckt"];
const agendaTypes = ["report", "resolution", "other"];

const emptyAgendaItem = {
  title: "",
  type: "report",
  description: "",
};

const texts = {
  en: {
    title: "Create General Assembly",
    subtitle:
      "Draft your assembly details, prepare the agenda, and invite members.",
    status: "Status",
    invited: "Invited",
    draft: "Draft",
    invitedStatus: "Invited",
    loading: "Loading...",
    sentTitle: "Invitation sent successfully",
    sentDescription:
      "The invitation details are now locked. You can still manage member attendance.",
    assemblyData: "1. Assembly Details",
    assemblyDataDescription:
      "Provide the basic scheduling and format information.",
    eventTitle: "Assembly Title",
    eventTitlePlaceholder: "e.g., Annual General Assembly 2026",
    assemblyFormat: "Assembly Format",
    formatLabels: {
      praesenz: "Physical",
      virtuell: "Virtual",
      hybrid: "Hybrid",
      gestreckt: "Stretched Procedure",
    },
    dateTime: "Date & Time",
    startDateTime: "Start Date & Time",
    endDateTime: "End Date & Time",
    location: "Meeting Location",
    locationPlaceholder: "e.g., Hauptstr. 12, Conference Room B",
    platform: "Online Meeting Link / Platform",
    agenda: "2. Agenda & Resolutions",
    agendaDescription:
      "At least one agenda topic is required. Topics are ordered automatically.",
    number: "Topic",
    itemTitle: "Title",
    agendaTitlePlaceholder: "e.g., Approval of financial statements",
    type: "Category",
    agendaTypeLabels: {
      report: "Report",
      resolution: "Resolution",
      other: "Other",
    },
    description: "Background Information / Resolution Draft",
    agendaDescriptionPlaceholder:
      "Provide a brief explanation or the wording of the proposed resolution...",
    removeAgendaItem: "Remove agenda item",
    addAgendaItem: "Add Agenda Item",
    invitation: "3. Invitation & Documents",
    invitationDescription:
      "Verify the invitation text, notice period, and upload attachments.",
    invitationBody: "Invitation Message",
    attachments: "Attachments (PDF)",
    selectPdfs: "Select PDF documents",
    validateNotice: "Bypass Legal Notice Period",
    noticeHelp: (days) =>
      `Cooperative bylaws require a notice period of at least ${days} days.`,
    daysUntil: (days) =>
      `${Math.max(days, 0)} days remaining until assembly starts.`,
    noStartDate: "Please set a start date.",
    overrideReason: "Reason for Bypassing Notice Period",
    overridePlaceholder:
      "Provide a short justification for bypassing the notice period...",
    attendance: "4. Attendance",
    attendanceDescription: "Record members so quorum can be calculated later.",
    present: "Present",
    represented: "Represented",
    absent: "Absent",
    quorumBasis: "Quorum Basis",
    totalShares: "Invited Shares",
    presentShares: "Present Shares",
    representedShares: "Represented Shares",
    loadingMembers: "Members are loading...",
    noMembers: "No active members found.",
    member: "Member",
    shares: "Shares",
    proxyHolder: "Proxy Holder",
    note: "Note",
    namePlaceholder: "Name",
    optionalPlaceholder: "Optional",
    reviewDraft: "Review Draft",
    sendInvitation: "Send Invitation",
    unnamedMember: "Unknown member",
    titleRequired: "Assembly title is required.",
    startRequired: "Date and time are required.",
    endRequired: "End date is required.",
    endAfterStart: "The end date must be after the start date.",
    locationRequired: "Meeting location is required.",
    platformRequired: "Online platform URL is required.",
    invitationRequired: "Invitation message body is required.",
    agendaRequired: "Each agenda item must have a title.",
    overrideRequired: (days) =>
      `An override reason is required when notice period is less than ${days} days.`,
    draftFoundTitle: "Draft Assembly Found",
    draftFoundDesc:
      "An unfinished draft assembly exists for this cooperative. What would you like to do?",
    editDraftBtn: "Edit Existing Draft",
    discardDraftBtn: "Discard & Create New",
    cancelBtn: "Cancel",
    discardSuccess: "Previous draft discarded successfully.",
  },
  de: {
    title: "Generalversammlung erstellen",
    subtitle:
      "Planen Sie die Versammlung, legen Sie die Tagesordnung fest und laden Sie Mitglieder ein.",
    status: "Status",
    invited: "Eingeladen",
    draft: "Entwurf",
    invitedStatus: "Eingeladen",
    loading: "Lädt...",
    sentTitle: "Einladung erfolgreich versendet",
    sentDescription:
      "Die Versammlungsdaten sind gesperrt. Die Anwesenheitsliste kann weiter gepflegt werden.",
    assemblyData: "1. Versammlungsdaten",
    assemblyDataDescription:
      "Geben Sie die grundlegenden Planungsdaten und das Format an.",
    eventTitle: "Titel der Versammlung",
    eventTitlePlaceholder: "z. B. Ordentliche Generalversammlung 2026",
    assemblyFormat: "Versammlungsformat",
    formatLabels: {
      praesenz: "Präsenz",
      virtuell: "Virtuell",
      hybrid: "Hybrid",
      gestreckt: "Gestrecktes Verfahren",
    },
    dateTime: "Datum & Uhrzeit",
    startDateTime: "Startdatum & Uhrzeit",
    endDateTime: "Enddatum & Uhrzeit",
    location: "Versammlungsort",
    locationPlaceholder: "z. B. Hauptstraße 12, Konferenzraum B",
    platform: "Online-Plattform / Link",
    agenda: "2. Tagesordnung & Beschlüsse",
    agendaDescription:
      "Mindestens ein Tagesordnungspunkt ist erforderlich. Die Nummerierung erfolgt automatisch.",
    number: "Punkt",
    itemTitle: "Titel",
    agendaTitlePlaceholder: "z. B. Entlastung des Vorstands",
    type: "Kategorie",
    agendaTypeLabels: {
      report: "Bericht",
      resolution: "Beschlussfassung",
      other: "Sonstiges",
    },
    description: "Erläuterung / Beschlussvorlage",
    agendaDescriptionPlaceholder:
      "Geben Sie eine kurze Erläuterung oder den Entwurf des Beschlusses ein...",
    removeAgendaItem: "Tagesordnungspunkt entfernen",
    addAgendaItem: "Tagesordnungspunkt hinzufügen",
    invitation: "3. Einladung & Dokumente",
    invitationDescription:
      "Prüfen Sie den Einladungstext, die Ladungsfrist und laden Sie Dokumente hoch.",
    invitationBody: "Einladungstext",
    attachments: "Anlagen (PDF)",
    selectPdfs: "PDF-Dokumente auswählen",
    validateNotice: "Einladungsfrist umgehen",
    noticeHelp: (days) =>
      `Laut Satzung beträgt die gesetzliche Einladungsfrist mindestens ${days} Tage.`,
    daysUntil: (days) =>
      `Noch ${Math.max(days, 0)} Tage bis zum Versammlungsbeginn.`,
    noStartDate: "Bitte wählen Sie ein Startdatum.",
    overrideReason: "Begründung für Fristunterschreitung",
    overridePlaceholder:
      "Geben Sie eine kurze Erklärung für die Verkürzung der Einladungsfrist an...",
    attendance: "4. Anwesenheit",
    attendanceDescription:
      "Mitglieder erfassen, damit später die Beschlussfähigkeit berechnet werden kann.",
    present: "Anwesend",
    represented: "Vertreten",
    absent: "Abwesend",
    quorumBasis: "Quorum-Basis",
    totalShares: "Eingeladene Anteile",
    presentShares: "Anwesende Anteile",
    representedShares: "Vertretene Anteile",
    loadingMembers: "Mitglieder werden geladen...",
    noMembers: "Keine aktiven Mitglieder gefunden.",
    member: "Mitglied",
    shares: "Anteile",
    proxyHolder: "Bevollmächtigte Person",
    note: "Notiz",
    namePlaceholder: "Name",
    optionalPlaceholder: "Optional",
    reviewDraft: "Entwurf prüfen",
    sendInvitation: "Einladung versenden",
    unnamedMember: "Unbekanntes Mitglied",
    titleRequired: "Der Titel der Versammlung ist erforderlich.",
    startRequired: "Startdatum und Uhrzeit sind erforderlich.",
    endRequired: "Das Enddatum ist erforderlich.",
    endAfterStart: "Das Enddatum muss nach dem Startdatum liegen.",
    locationRequired: "Der Versammlungsort ist erforderlich.",
    platformRequired: "Der Link zur Online-Plattform ist erforderlich.",
    invitationRequired: "Der Einladungstext ist erforderlich.",
    agendaRequired: "Jeder Tagesordnungspunkt benötigt einen Titel.",
    overrideRequired: (days) =>
      `Bei einer Ladungsfrist unter ${days} Tagen ist eine Begründung erforderlich.`,
    draftFoundTitle: "Entwurf für Versammlung gefunden",
    draftFoundDesc:
      "Es existiert bereits ein unfertiger Entwurf für diese Genossenschaft. Wie möchten Sie fortfahren?",
    editDraftBtn: "Entwurf bearbeiten",
    discardDraftBtn: "Verwerfen & Neu erstellen",
    cancelBtn: "Abbrechen",
    discardSuccess: "Vorheriger Entwurf wurde erfolgreich verworfen.",
  },
};

const getInvitationTemplate = (coopName, lang = "en") =>
  lang === "de"
    ? `Sehr geehrte Mitglieder,

hiermit laden wir Sie zur Generalversammlung der ${coopName || "Genossenschaft"} ein.

Die Tagesordnung, der Versammlungsort bzw. die Zugangsdaten sowie alle Anlagen sind Bestandteil dieser Einladung.

Mit freundlichen Grüßen
Der Vorstand`
    : `Dear members,

You are hereby invited to the General Assembly of ${coopName || "the cooperative"}.

The agenda, meeting location or access details, and all attachments are part of this invitation.

Kind regards
The Board`;

const FieldError = ({ children }) =>
  children ? (
    <p className="mt-1.5 text-xs font-semibold text-red-500 dark:text-red-400 flex items-center gap-1">
      <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
      {children}
    </p>
  ) : null;

const Label = ({ children, required = false }) => (
  <label className="block mb-2 text-xs font-bold tracking-wider text-gray-500 uppercase dark:text-gray-400">
    {children}
    {required && <span className="ml-1 font-bold text-red-500">*</span>}
  </label>
);

const inputClass =
  "w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl bg-white dark:bg-slate-800 dark:text-white dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-xs disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-400 dark:disabled:bg-slate-800/50 dark:disabled:text-slate-500";

const getDaysUntil = (dateTimeValue) => {
  if (!dateTimeValue) return 0;
  const eventDate = new Date(dateTimeValue);
  const diff = eventDate.getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
};

const formatForDateTimeLocal = (isoString) => {
  if (!isoString) return "";
  const date = new Date(isoString);
  if (isNaN(date.getTime())) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

const CreateAssemblySkeleton = () => {
  return (
    <div className="p-4 space-y-6 animate-pulse">
      {/* Header Panel Skeleton */}
      <div className="flex flex-col gap-4 p-6 bg-white border border-gray-100 shadow-sm md:flex-row md:items-center md:justify-between dark:bg-slate-800 dark:border-slate-700 rounded-2xl">
        <div className="flex-1 space-y-2">
          <div className="w-48 h-6 rounded-lg bg-gray-250 dark:bg-slate-705 animate-pulse" />
          <div className="h-4 bg-gray-200 rounded-lg w-72 dark:bg-slate-700 animate-pulse" />
        </div>
        <div className="w-24 h-8 bg-gray-200 rounded-lg dark:bg-slate-700 animate-pulse" />
      </div>

      {/* Premium Stepper Progress Skeleton */}
      <div className="h-20 bg-white border border-gray-100 dark:bg-slate-800 dark:border-slate-700 rounded-2xl animate-pulse" />

      {/* Wizard Step Form Container Skeleton */}
      <div className="p-6 space-y-6 bg-white border border-gray-100 shadow-sm dark:bg-slate-800 dark:border-slate-700 rounded-2xl">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="space-y-2">
            <div className="w-20 h-4 bg-gray-200 rounded dark:bg-slate-700 animate-pulse" />
            <div className="h-10 bg-gray-200 dark:bg-slate-700 rounded-xl animate-pulse" />
          </div>
          <div className="space-y-2">
            <div className="w-20 h-4 bg-gray-200 rounded dark:bg-slate-700 animate-pulse" />
            <div className="h-10 bg-gray-200 dark:bg-slate-700 rounded-xl animate-pulse" />
          </div>
        </div>

        {/* Notice Period Box Skeleton */}
        <div className="h-24 border bg-gray-50/50 dark:bg-slate-900/10 border-gray-150 dark:border-slate-700 rounded-xl animate-pulse" />

        {/* Format radio cards skeleton */}
        <div className="space-y-2">
          <div className="h-4 bg-gray-200 rounded w-28 dark:bg-slate-700 animate-pulse" />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 animate-pulse">
            <div className="h-24 bg-gray-200 dark:bg-slate-700 rounded-xl" />
            <div className="h-24 bg-gray-200 dark:bg-slate-700 rounded-xl" />
            <div className="h-24 bg-gray-200 dark:bg-slate-700 rounded-xl" />
            <div className="h-24 bg-gray-200 dark:bg-slate-700 rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  );
};

const CreateAssemblyView = ({
  selectedCoop,
  coops = [],
  onAssemblySave,
  onCancel,
  initialAssembly,
}) => {
  const currentCoop = coops.find((coop) => coop.id === selectedCoop);
  const [lang, setLang] = useState("en");
  const [members, setMembers] = useState([]);
  const [isLoadingMembers, setIsLoadingMembers] = useState(false);
  const [errors, setErrors] = useState({});
  const [isSent, setIsSent] = useState(false);
  const [isSavingAssembly, setIsSavingAssembly] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [showConfirmBypass, setShowConfirmBypass] = useState(false);
  const [isLoadingSettings, setIsLoadingSettings] = useState(false);
  const [step, setStep] = useState(1);
  const t = texts[lang];

  // Draft check states
  const [isCheckingDraft, setIsCheckingDraft] = useState(false);
  const [foundDraft, setFoundDraft] = useState(null);
  const [showDraftPopUp, setShowDraftPopUp] = useState(false);
  const [isDiscardingDraft, setIsDiscardingDraft] = useState(false);

  const [form, setForm] = useState({
    title: "Ordinary General Assembly",
    format: "praesenz",
    startDateTime: "",
    endDateTime: "",
    location: "",
    platformUrl: "",
    noticePeriodValidation: false,
    overrideReason: "",
    invitationBody: getInvitationTemplate(currentCoop?.name, "en"),
    attachments: [],
    status: "draft",
  });

  const [agendaItems, setAgendaItems] = useState([{ ...emptyAgendaItem }]);
  const [attendance, setAttendance] = useState({});

  const isImmutable = isSent || isLoadingSettings || isCheckingDraft;
  const isStretched = form.format === "gestreckt";
  const requiresLocation =
    form.format === "praesenz" || form.format === "hybrid";
  const requiresPlatform =
    form.format === "virtuell" || form.format === "hybrid";
  const [noticePeriodDays, setNoticePeriodDays] = useState(
    DEFAULT_NOTICE_PERIOD_DAYS,
  );

  useEffect(() => {
    if (!selectedCoop) return;

    const checkDraftAndSettings = async () => {
      setIsCheckingDraft(true);
      setIsLoadingSettings(true);
      try {
        // 1. Fetch assemblies to find draft (only if initialAssembly is not provided)
        if (!initialAssembly) {
          const assemblies = await getAssembliesByCoopId(selectedCoop);
          const draft = assemblies.find((a) => a.status === "draft");
          if (draft) {
            setFoundDraft(draft);
            setShowDraftPopUp(true);
          }
        }

        // 2. Fetch cooperative settings
        const settings = await fetchCooperativeSettings(selectedCoop);
        if (
          settings &&
          settings.agm_notice_period_days !== undefined &&
          settings.agm_notice_period_days !== ""
        ) {
          const parsedDays = Number(settings.agm_notice_period_days);
          setNoticePeriodDays(
            !isNaN(parsedDays) ? parsedDays : DEFAULT_NOTICE_PERIOD_DAYS,
          );
        }
      } catch (err) {
        console.error("Failed to fetch settings/check draft:", err);
      } finally {
        setIsCheckingDraft(false);
        setIsLoadingSettings(false);
      }
    };

    checkDraftAndSettings();
  }, [selectedCoop, initialAssembly]);

  useEffect(() => {
    if (initialAssembly) {
      setForm({
        id: initialAssembly.id,
        title: initialAssembly.title || "",
        format: initialAssembly.format || "praesenz",
        startDateTime: formatForDateTimeLocal(initialAssembly.startDateTime),
        endDateTime: formatForDateTimeLocal(initialAssembly.endDateTime),
        location: initialAssembly.location || "",
        platformUrl: initialAssembly.platformUrl || "",
        noticePeriodValidation: initialAssembly.noticePeriodValidation || false,
        overrideReason: initialAssembly.overrideReason || "",
        invitationBody:
          initialAssembly.invitationBody ||
          getInvitationTemplate(currentCoop?.name, lang),
        attachments: initialAssembly.attachments || [],
        status: "draft",
      });

      if (
        initialAssembly.agendaItems &&
        initialAssembly.agendaItems.length > 0
      ) {
        setAgendaItems(initialAssembly.agendaItems);
      } else {
        setAgendaItems([{ ...emptyAgendaItem }]);
      }

      const nextAttendance = {};
      initialAssembly.attendance?.forEach((att) => {
        nextAttendance[att.memberId] = {
          status: att.status || "absent",
          proxyHolder: att.proxyHolder || "",
          note: att.note || "",
        };
      });
      setAttendance(nextAttendance);
    }
  }, [initialAssembly, currentCoop?.name]);

  useEffect(() => {
    const targetAssembly = initialAssembly || foundDraft;
    if (targetAssembly && members.length > 0) {
      setAttendance((prev) => {
        const next = { ...prev };
        members.forEach((m) => {
          if (!next[m.id]) {
            next[m.id] = {
              status: "absent",
              proxyHolder: "",
              note: "",
            };
          }
        });
        return next;
      });
    }
  }, [members, foundDraft, initialAssembly]);

  const handleEditDraft = () => {
    if (!foundDraft) return;
    setShowDraftPopUp(false);

    setForm({
      id: foundDraft.id,
      title: foundDraft.title || "",
      format: foundDraft.format || "praesenz",
      startDateTime: formatForDateTimeLocal(foundDraft.startDateTime),
      endDateTime: formatForDateTimeLocal(foundDraft.endDateTime),
      location: foundDraft.location || "",
      platformUrl: foundDraft.platformUrl || "",
      noticePeriodValidation: foundDraft.noticePeriodValidation || false,
      overrideReason: foundDraft.overrideReason || "",
      invitationBody:
        foundDraft.invitationBody ||
        getInvitationTemplate(currentCoop?.name, lang),
      attachments: foundDraft.attachments || [],
      status: "draft",
    });

    if (foundDraft.agendaItems && foundDraft.agendaItems.length > 0) {
      setAgendaItems(foundDraft.agendaItems);
    } else {
      setAgendaItems([{ ...emptyAgendaItem }]);
    }

    const nextAttendance = {};
    foundDraft.attendance?.forEach((att) => {
      nextAttendance[att.memberId] = {
        status: att.status || "absent",
        proxyHolder: att.proxyHolder || "",
        note: att.note || "",
      };
    });

    // Merge with fetched members to handle newly added members
    members.forEach((m) => {
      if (!nextAttendance[m.id]) {
        nextAttendance[m.id] = {
          status: "absent",
          proxyHolder: "",
          note: "",
        };
      }
    });

    setAttendance(nextAttendance);
  };

  const handleDiscardDraft = async () => {
    if (!foundDraft) return;
    setIsDiscardingDraft(true);
    try {
      await updateAssembly(foundDraft.id, {
        ...foundDraft,
        status: "discarded",
      });
      toast.success(t.discardSuccess);
      setFoundDraft(null);
      setShowDraftPopUp(false);
    } catch (err) {
      console.error("Failed to discard draft:", err);
      toast.error(
        lang === "de"
          ? "Fehler beim Verwerfen des Entwurfs."
          : "Failed to discard draft.",
      );
    } finally {
      setIsDiscardingDraft(false);
    }
  };

  const handleCancelDraft = () => {
    setShowDraftPopUp(false);
    onCancel?.();
  };

  const daysUntilAssembly = getDaysUntil(form.startDateTime);
  const isNoticePeriodValid = daysUntilAssembly >= noticePeriodDays;

  const getMinDateTime = () => {
    const minDate = new Date();
    minDate.setDate(minDate.getDate() + noticePeriodDays);
    const year = minDate.getFullYear();
    const month = String(minDate.getMonth() + 1).padStart(2, "0");
    const day = String(minDate.getDate()).padStart(2, "0");
    const hours = String(nowHourAndMin().hours).padStart(2, "0");
    const minutes = String(nowHourAndMin().minutes).padStart(2, "0");
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const nowHourAndMin = () => {
    const now = new Date();
    return {
      hours: now.getHours(),
      minutes: now.getMinutes(),
    };
  };

  const getCurrentDateTime = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const recipients = useMemo(
    () => members.filter((member) => (member.status || "active") === "active"),
    [members],
  );

  const attendanceSummary = useMemo(() => {
    return recipients.reduce(
      (summary, member) => {
        const row = attendance[member.id] || {};
        const status = row.status || "absent";
        const shares = Number(member.totalShares || 0);

        summary.totalMembers += 1;
        summary.totalShares += shares;

        if (status === "present") {
          summary.presentMembers += 1;
          summary.representedMembers += 1;
          summary.presentShares += shares;
          summary.representedShares += shares;
        }

        if (status === "proxy") {
          summary.proxyMembers += 1;
          summary.representedMembers += 1;
          summary.proxyShares += shares;
          summary.representedShares += shares;
        }

        return summary;
      },
      {
        totalMembers: 0,
        totalShares: 0,
        presentMembers: 0,
        proxyMembers: 0,
        representedMembers: 0,
        presentShares: 0,
        proxyShares: 0,
        representedShares: 0,
      },
    );
  }, [attendance, recipients]);

  useEffect(() => {
    setForm((prev) => {
      const previousTemplates = [
        getInvitationTemplate(undefined, "en"),
        getInvitationTemplate(undefined, "de"),
        getInvitationTemplate(currentCoop?.name, lang === "en" ? "de" : "en"),
      ];

      if (
        prev.invitationBody &&
        !previousTemplates.includes(prev.invitationBody)
      ) {
        return prev;
      }

      return {
        ...prev,
        invitationBody: getInvitationTemplate(currentCoop?.name, lang),
      };
    });
  }, [currentCoop?.name, lang]);

  useEffect(() => {
    if (!selectedCoop) {
      setMembers([]);
      setAttendance({});
      return;
    }

    const fetchMembers = async () => {
      setIsLoadingMembers(true);
      try {
        const response = await getMembersOfCoop(selectedCoop);
        const num = await getTotalMembersOfCoop(selectedCoop);
        const total = num || response.length || 0;
        const nextMembers = response.map((member) => ({
          id: member.userId,
          name: member.membername || "",
          email: member.memberemail || member.email || "",
          totalShares: Number(member.totalShares || 0),
          status: "active",
        }));

        setMembers(nextMembers);
        setAttendance(
          nextMembers.reduce((acc, member) => {
            acc[member.id] = {
              status: "absent",
              proxyHolder: "",
              note: "",
            };
            return acc;
          }, {}),
        );
      } catch {
        setMembers([]);
        setAttendance({});
      } finally {
        setIsLoadingMembers(false);
      }
    };

    fetchMembers();
  }, [selectedCoop]);

  const updateForm = (key, value) => {
    if (isImmutable) return;
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const updateAgendaItem = (index, key, value) => {
    if (isImmutable) return;
    setAgendaItems((prev) =>
      prev.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [key]: value } : item,
      ),
    );
  };

  const addAgendaItem = () => {
    if (isImmutable) return;
    setAgendaItems((prev) => [
      ...prev,
      { ...emptyAgendaItem, type: "resolution" },
    ]);
  };

  const removeAgendaItem = (index) => {
    if (isImmutable || agendaItems.length === 1) return;
    setAgendaItems((prev) =>
      prev.filter((_, itemIndex) => itemIndex !== index),
    );
  };

  const validateStep1 = () => {
    const nextErrors = { ...errors };
    delete nextErrors.title;
    delete nextErrors.startDateTime;
    delete nextErrors.endDateTime;
    delete nextErrors.location;
    delete nextErrors.platformUrl;
    delete nextErrors.overrideReason;

    if (!form.title.trim()) {
      nextErrors.title = t.titleRequired;
    }
    if (!form.startDateTime) {
      nextErrors.startDateTime = t.startRequired;
    } else {
      const now = new Date();
      const start = new Date(form.startDateTime);
      if (start < now) {
        nextErrors.startDateTime =
          lang === "de"
            ? "Ungültiges Datum: Das Startdatum darf nicht in der Vergangenheit liegen."
            : "Invalid date: The start date cannot be in the past.";
      } else if (!form.noticePeriodValidation) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const startDay = new Date(form.startDateTime);
        startDay.setHours(0, 0, 0, 0);
        const diffTime = startDay.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        if (diffDays < noticePeriodDays) {
          nextErrors.startDateTime =
            lang === "de"
              ? `Ungültiges Datum: Die Einladungsfrist von ${noticePeriodDays} Tagen wurde unterschritten.`
              : `Invalid date: The notice period of ${noticePeriodDays} days is not met.`;
        }
      }
    }
    if (
      form.noticePeriodValidation &&
      !isNoticePeriodValid &&
      !form.overrideReason.trim()
    ) {
      nextErrors.overrideReason =
        typeof t.overrideRequired === "function"
          ? t.overrideRequired(noticePeriodDays)
          : t.overrideRequired;
    }
    if (isStretched && !form.endDateTime) {
      nextErrors.endDateTime = t.endRequired;
    }
    if (
      isStretched &&
      form.startDateTime &&
      form.endDateTime &&
      new Date(form.endDateTime) <= new Date(form.startDateTime)
    ) {
      nextErrors.endDateTime = t.endAfterStart;
    }
    if (requiresLocation && !form.location.trim()) {
      nextErrors.location = t.locationRequired;
    }
    if (requiresPlatform && !form.platformUrl.trim()) {
      nextErrors.platformUrl = t.platformRequired;
    }

    setErrors(nextErrors);
    return (
      !nextErrors.title &&
      !nextErrors.startDateTime &&
      !nextErrors.endDateTime &&
      !nextErrors.location &&
      !nextErrors.platformUrl &&
      !nextErrors.overrideReason
    );
  };

  const validateStep2 = () => {
    const nextErrors = { ...errors };
    delete nextErrors.agenda;

    if (agendaItems.some((item) => !item.title.trim())) {
      nextErrors.agenda = t.agendaRequired;
    }

    setErrors(nextErrors);
    return !nextErrors.agenda;
  };

  const validateStep3 = () => {
    const nextErrors = { ...errors };
    delete nextErrors.invitationBody;

    if (!form.invitationBody.trim()) {
      nextErrors.invitationBody = t.invitationRequired;
    }

    setErrors(nextErrors);
    return !nextErrors.invitationBody;
  };

  const validate = () => {
    const s1 = validateStep1();
    const s2 = validateStep2();
    const s3 = validateStep3();
    return s1 && s2 && s3;
  };

  const buildAssemblyPayload = (status) => {
    const payload = {
      coopId: selectedCoop,
      title: form.title,
      format: form.format,
      startDateTime: form.startDateTime,
      location: form.location,
      platformUrl: form.platformUrl,
      status,
      agendaCount: agendaItems.length,
      agendaItems,
      noticePeriodValidation: form.noticePeriodValidation,
      overrideReason: form.overrideReason,
      invitationBody: form.invitationBody,
      attachments: form.attachments.map((file) => ({
        name: file.name,
        size: file.size,
        type: file.type,
      })),
      attendance: recipients.map((member) => ({
        memberId: member.id,
        memberName: member.name,
        memberEmail: member.email,
        shares: member.totalShares,
        status: attendance[member.id]?.status || "absent",
        proxyHolder: attendance[member.id]?.proxyHolder || "",
        note: attendance[member.id]?.note || "",
      })),
      attendanceSummary,
    };

    if (isStretched) {
      payload.endDateTime = form.endDateTime;
    }

    return payload;
  };

  const persistAssembly = async (status) => {
    if (status === "draft") {
      if (!form.title.trim()) {
        setErrors({ title: t.titleRequired });
        setStep(1);
        return;
      }
      setErrors({});
    } else {
      if (!validate()) {
        // If validation fails, jump to first step containing errors to assist user
        if (
          errors.title ||
          errors.startDateTime ||
          errors.endDateTime ||
          errors.location ||
          errors.platformUrl ||
          errors.overrideReason
        ) {
          setStep(1);
        } else if (errors.agenda) {
          setStep(2);
        } else if (errors.invitationBody) {
          setStep(3);
        }
        return;
      }
    }

    setIsSavingAssembly(true);
    setSubmitError("");
    try {
      let assembly;
      const payload = buildAssemblyPayload(status);
      if (form.id) {
        assembly = await updateAssembly(form.id, payload);
      } else {
        assembly = await createAssembly(payload);
      }
      setForm((prev) => ({ ...prev, status, id: assembly.id }));
      onAssemblySave?.(assembly);
      if (status === "draft") {
        toast.success(
          lang === "de"
            ? "Entwurf erfolgreich gespeichert."
            : "Draft saved successfully.",
        );
      }
      if (status === "upcoming" || status === "invited") {
        setIsSent(true);
      }
    } catch (error) {
      setSubmitError(error.message || "Failed to save assembly.");
    } finally {
      setIsSavingAssembly(false);
    }
  };

  const handleSaveDraft = () => {
    persistAssembly("draft");
  };

  const handleSendInvitation = () => {
    persistAssembly("upcoming");
  };

  const handleStepClick = (targetStep) => {
    if (isImmutable) return;
    if (targetStep === 1) {
      setStep(1);
    } else if (targetStep === 2) {
      if (validateStep1()) {
        setStep(2);
      }
    } else if (targetStep === 3) {
      if (validateStep1() && validateStep2()) {
        setStep(3);
      }
    }
  };

  const handleNext = () => {
    if (step === 1) {
      if (validateStep1()) setStep(2);
    } else if (step === 2) {
      if (validateStep2()) setStep(3);
    }
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  if (isCheckingDraft) {
    return <CreateAssemblySkeleton />;
  }

  return (
    <div className="p-4 space-y-6 animate-fadeIn">
      {/* Header Panel */}
      <div className="flex flex-col gap-4 p-6 bg-white border border-gray-100 shadow-sm md:flex-row md:items-center md:justify-between dark:bg-slate-800 dark:border-slate-700 rounded-2xl">
        <div>
          <h2 className="flex items-center gap-2 text-xl font-extrabold text-gray-900 dark:text-white">
            <Building2 className="w-5 h-5 text-blue-500" />
            {t.title}
          </h2>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            {t.subtitle}
          </p>
        </div>
        <div className="flex items-center self-start gap-3 md:self-center">
          <select
            value={lang}
            onChange={(event) => setLang(event.target.value)}
            className="px-3 py-1.5 text-xs font-semibold border rounded-lg bg-gray-50 hover:bg-gray-100 border-gray-200 dark:bg-slate-700 dark:text-white dark:border-slate-600 transition-colors focus:ring-1 focus:ring-blue-500"
          >
            <option value="en">English</option>
            <option value="de">Deutsch</option>
          </select>

          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg dark:bg-slate-700 dark:border-slate-600 text-xs font-bold text-gray-700 dark:text-gray-200">
            <Users className="w-4 h-4 text-gray-400" />
            <span>{t.invited}:</span>
            <span className="text-blue-600 dark:text-blue-400">
              {isLoadingMembers ? t.loading : recipients.length}
            </span>
          </div>
        </div>
      </div>

      {/* Premium Stepper Progress */}
      <div className="flex items-center justify-center p-5 px-8 overflow-x-auto border border-gray-100 shadow-xs bg-white/60 dark:bg-slate-800/40 dark:border-slate-700 rounded-2xl backdrop-blur-xs">
        <div className="relative flex items-center justify-between w-full">
          {/* Connector Line */}
          <div className="absolute top-5 left-[60px] right-[60px] h-0.5 bg-gray-200 dark:bg-slate-700 -z-10">
            <div
              className="h-full transition-all duration-300 bg-blue-500"
              style={{ width: `${(step - 1) * 50}%` }}
            />
          </div>

          {[
            {
              stepNum: 1,
              label: t.assemblyData,
              desc: lang === "de" ? "Versammlungsdaten" : "Details & Format",
              icon: <CalendarDays className="w-4 h-4" />,
            },
            {
              stepNum: 2,
              label: t.agenda,
              desc: lang === "de" ? "Tagesordnung" : "Agenda & Resolutions",
              icon: <ClipboardList className="w-4 h-4" />,
            },
            {
              stepNum: 3,
              label: t.invitation,
              desc:
                lang === "de" ? "Einladung & Versand" : "Notice & Attachments",
              icon: <Mail className="w-4 h-4" />,
            },
          ].map((item) => {
            const isCompleted = step > item.stepNum;
            const isActive = step === item.stepNum;
            return (
              <button
                key={item.stepNum}
                type="button"
                onClick={() => handleStepClick(item.stepNum)}
                className="relative z-10 flex flex-col items-center text-center bg-transparent border-0 cursor-pointer focus:outline-none group"
                // style={{ width: "160px" }}
              >
                {/* Icon wrapper with a solid background to block out the line underneath */}
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 font-bold text-xs ${
                    isCompleted
                      ? "bg-blue-500 border-blue-500 text-white shadow-md shadow-blue-500/20"
                      : isActive
                        ? "bg-white border-blue-500 text-blue-600 dark:bg-slate-800 ring-4 ring-blue-500/10 shadow-sm font-extrabold"
                        : "bg-gray-50 border-gray-200 text-gray-400 dark:border-slate-700 dark:bg-slate-600"
                  }`}
                >
                  {isCompleted ? (
                    <CheckCircle className="w-5 h-5 text-white" />
                  ) : (
                    item.icon
                  )}
                </div>

                {/* Labels below */}
                <div className="flex flex-col mt-2.5 max-w-fit">
                  <span
                    className={`text-[10px] font-bold uppercase tracking-wider transition-colors duration-205 ${
                      isActive
                        ? "text-blue-600 dark:text-blue-400"
                        : isCompleted
                          ? "text-gray-800 dark:text-gray-200"
                          : "text-gray-400"
                    }`}
                  >
                    {item.label}
                  </span>
                  <span className="text-[10px] text-gray-450 dark:text-gray-500 mt-0.5 leading-tight font-medium">
                    {item.desc}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Lock alert for sent assemblies */}
      {isSent && (
        <div className="flex items-start gap-3 p-4 border border-green-200 rounded-xl bg-green-50/50 dark:border-green-800 dark:bg-green-900/20 animate-fadeIn">
          <Lock
            className="mt-0.5 text-green-600 dark:text-green-300"
            size={18}
          />
          <div>
            <p className="text-sm font-semibold text-green-800 dark:text-green-200">
              {t.sentTitle}
            </p>
            <p className="text-xs text-green-700 dark:text-green-300 mt-0.5">
              {t.sentDescription}
            </p>
          </div>
        </div>
      )}

      {submitError && (
        <div className="p-4 text-sm text-red-700 border border-red-200 rounded-xl bg-red-50 dark:border-red-800 dark:bg-red-900/20 dark:text-red-200 animate-fadeIn">
          {submitError}
        </div>
      )}

      {/* Active Wizard Step Form Container */}
      <div className="space-y-6">
        {/* STEP 1: ASSEMBLY DETAILS */}
        {step === 1 && (
          <div className="space-y-6 animate-fadeIn">
            {/* Main Form Fields Card */}
            <div className="p-6 space-y-6 bg-white border border-gray-100 shadow-sm dark:bg-slate-800 dark:border-slate-700 rounded-2xl">
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div>
                  <Label required>{t.eventTitle}</Label>
                  <input
                    className={inputClass}
                    value={form.title}
                    disabled={isImmutable}
                    onChange={(event) =>
                      updateForm("title", event.target.value)
                    }
                    placeholder={t.eventTitlePlaceholder}
                  />
                  <FieldError>{errors.title}</FieldError>
                </div>

                <div>
                  <Label required>
                    {isStretched ? t.startDateTime : t.dateTime}
                  </Label>
                  <input
                    type="datetime-local"
                    className={inputClass}
                    value={form.startDateTime}
                    disabled={isImmutable}
                    min={
                      !form.noticePeriodValidation
                        ? getMinDateTime()
                        : getCurrentDateTime()
                    }
                    onChange={(event) =>
                      updateForm("startDateTime", event.target.value)
                    }
                  />
                  <FieldError>{errors.startDateTime}</FieldError>
                </div>
              </div>

              {/* Ladungsfrist / Bypass notice period card */}
              <div className="p-4 space-y-4 border border-gray-150 rounded-xl bg-gray-50/50 dark:bg-slate-900/10 dark:border-slate-700">
                <div className="flex items-center justify-between pb-2 border-b border-gray-200 dark:border-slate-700">
                  <h4 className="text-xs font-bold tracking-wider text-gray-500 uppercase dark:text-gray-400">
                    {lang === "de"
                      ? "Einladungsfrist"
                      : "Notice period compliance"}
                  </h4>
                  {/* Custom Toggle Switch */}
                  <button
                    type="button"
                    role="switch"
                    aria-checked={form.noticePeriodValidation}
                    disabled={isImmutable}
                    onClick={() => {
                      if (!form.noticePeriodValidation) {
                        setShowConfirmBypass(true);
                      } else {
                        updateForm("noticePeriodValidation", false);
                      }
                    }}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      form.noticePeriodValidation
                        ? "bg-amber-500"
                        : "bg-gray-200 dark:bg-slate-700"
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        form.noticePeriodValidation
                          ? "translate-x-6"
                          : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <p className="text-[11px] leading-relaxed text-gray-500 dark:text-gray-400">
                      {isLoadingSettings
                        ? lang === "de"
                          ? "Lade Frist..."
                          : "Loading notice period..."
                        : typeof t.noticeHelp === "function"
                          ? t.noticeHelp(noticePeriodDays)
                          : t.noticeHelp}
                    </p>

                    <div
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-semibold ${
                        isNoticePeriodValid
                          ? "bg-green-50/50 dark:bg-green-950/10 border-green-100 dark:border-green-900/30 text-green-800 dark:text-green-300"
                          : "bg-amber-50/50 dark:bg-amber-950/10 border-amber-100 dark:border-amber-900/30 text-amber-800 dark:text-amber-300"
                      }`}
                    >
                      {isNoticePeriodValid ? (
                        <CheckCircle className="w-4 h-4 shrink-0" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 shrink-0" />
                      )}
                      <span>
                        {form.startDateTime
                          ? t.daysUntil(daysUntilAssembly)
                          : t.noStartDate}
                      </span>
                    </div>
                  </div>

                  {/* Override reason textarea */}
                  {!isNoticePeriodValid && form.noticePeriodValidation && (
                    <div className="space-y-1.5 animate-fadeIn">
                      <Label required>{t.overrideReason}</Label>
                      <textarea
                        className={inputClass}
                        rows={2}
                        value={form.overrideReason}
                        disabled={isImmutable}
                        onChange={(event) =>
                          updateForm("overrideReason", event.target.value)
                        }
                        placeholder={t.overridePlaceholder}
                      />
                      <FieldError>{errors.overrideReason}</FieldError>
                    </div>
                  )}
                </div>
              </div>

              {/* Assembly Format Radio Cards */}
              <div className="pt-5 border-t border-gray-100 dark:border-slate-700">
                <Label required>{t.assemblyFormat}</Label>
                <div className="grid grid-cols-1 gap-4 mt-2 sm:grid-cols-2 lg:grid-cols-4">
                  {assemblyFormats.map((format) => {
                    const isActive = form.format === format;
                    return (
                      <button
                        key={format}
                        type="button"
                        disabled={isImmutable}
                        onClick={() => updateForm("format", format)}
                        className={`flex flex-col items-start p-4 rounded-xl border text-left transition-all duration-200 group relative overflow-hidden ${
                          isActive
                            ? "border-blue-500 bg-blue-50/50 dark:bg-blue-950/20 ring-1 ring-blue-500 shadow-sm"
                            : "border-gray-200 dark:border-slate-700 bg-white/60 dark:bg-slate-800/40 hover:bg-gray-50 dark:hover:bg-slate-800/80 hover:border-gray-300 dark:hover:border-slate-650"
                        }`}
                      >
                        <div
                          className={`p-2 rounded-lg mb-3 transition-colors ${
                            isActive
                              ? "bg-blue-500 text-white"
                              : "bg-gray-150 text-gray-500 dark:bg-slate-700 dark:text-gray-400 group-hover:bg-gray-200 dark:group-hover:bg-slate-650"
                          }`}
                        >
                          {format === "praesenz" && (
                            <MapPin className="w-4 h-4" />
                          )}
                          {format === "virtuell" && (
                            <Laptop className="w-4 h-4" />
                          )}
                          {format === "hybrid" && (
                            <Network className="w-4 h-4" />
                          )}
                          {format === "gestreckt" && (
                            <Calendar className="w-4 h-4" />
                          )}
                        </div>
                        <span
                          className={`text-xs font-bold transition-colors ${
                            isActive
                              ? "text-blue-700 dark:text-blue-400"
                              : "text-gray-700 dark:text-gray-300"
                          }`}
                        >
                          {t.formatLabels[format]}
                        </span>
                        <span className="text-[10px] text-gray-400 dark:text-gray-500 mt-1 leading-snug">
                          {format === "praesenz" &&
                            (lang === "de"
                              ? "Physisches Treffen an einem Ort"
                              : "Physical meeting at a specific location")}
                          {format === "virtuell" &&
                            (lang === "de"
                              ? "Reines Online-Treffen per Link"
                              : "Fully remote online meeting via platform")}
                          {format === "hybrid" &&
                            (lang === "de"
                              ? "Physisch vor Ort & Online"
                              : "Combined in-person & online streaming")}
                          {format === "gestreckt" &&
                            (lang === "de"
                              ? "Beschlussfassung über längeren Zeitraum"
                              : "Open voting period over several days")}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Format-Dependent Extra Details Card */}
            {(requiresLocation || requiresPlatform || isStretched) && (
              <div className="p-6 space-y-4 bg-white border border-gray-100 shadow-sm dark:bg-slate-800 dark:border-slate-700 rounded-2xl animate-fadeIn">
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1.5 mb-2">
                  <Info className="w-4 h-4 text-blue-500" />
                  {lang === "de"
                    ? "Zusätzliche Angaben zum Format"
                    : "Format specific details"}
                </h3>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {isStretched && (
                    <div className="md:col-span-2">
                      <Label required>{t.endDateTime}</Label>
                      <input
                        type="datetime-local"
                        className={inputClass}
                        value={form.endDateTime}
                        disabled={isImmutable}
                        min={form.startDateTime || getCurrentDateTime()}
                        onChange={(event) =>
                          updateForm("endDateTime", event.target.value)
                        }
                      />
                      <FieldError>{errors.endDateTime}</FieldError>
                    </div>
                  )}

                  {requiresLocation && (
                    <div className="md:col-span-2">
                      <Label required>{t.location}</Label>
                      <input
                        className={inputClass}
                        value={form.location}
                        disabled={isImmutable}
                        onChange={(event) =>
                          updateForm("location", event.target.value)
                        }
                        placeholder={t.locationPlaceholder}
                      />
                      <FieldError>{errors.location}</FieldError>
                    </div>
                  )}

                  {requiresPlatform && (
                    <div className="md:col-span-2">
                      <Label required>{t.platform}</Label>
                      <input
                        className={inputClass}
                        value={form.platformUrl}
                        disabled={isImmutable}
                        onChange={(event) =>
                          updateForm("platformUrl", event.target.value)
                        }
                        placeholder="https://..."
                      />
                      <FieldError>{errors.platformUrl}</FieldError>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* STEP 2: AGENDA topics */}
        {step === 2 && (
          <div className="space-y-6 animate-fadeIn">
            <div className="p-6 space-y-5 bg-white border border-gray-100 shadow-sm dark:bg-slate-800 dark:border-slate-700 rounded-2xl">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-slate-700">
                <div>
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                    {t.agenda}
                  </h3>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    {t.agendaDescription}
                  </p>
                </div>
                <span className="px-2.5 py-1 text-xs font-bold text-blue-700 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-300 rounded-full border border-blue-200 dark:border-blue-800/50">
                  {agendaItems.length}{" "}
                  {agendaItems.length === 1 ? "Item" : "Items"}
                </span>
              </div>

              <div className="space-y-4">
                {agendaItems.map((item, index) => (
                  <div
                    key={index}
                    className="relative p-4 transition-all border border-gray-200 dark:border-slate-700 rounded-xl bg-gray-50/30 dark:bg-slate-800/10 hover:border-gray-300 dark:hover:border-slate-650 duration-205 group"
                  >
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-[64px_minmax(0,1fr)_220px_40px]">
                      {/* Number */}
                      <div>
                        <Label>{t.number}</Label>
                        <div className="px-3 py-2 text-sm font-extrabold text-center text-blue-600 border border-blue-100 rounded-lg bg-blue-50/50 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-900/50">
                          {index + 1}
                        </div>
                      </div>

                      {/* Title */}
                      <div>
                        <Label required>{t.itemTitle}</Label>
                        <input
                          className={inputClass}
                          value={item.title}
                          disabled={isImmutable}
                          onChange={(event) =>
                            updateAgendaItem(index, "title", event.target.value)
                          }
                          placeholder={t.agendaTitlePlaceholder}
                        />
                      </div>

                      {/* Type Pill Selector */}
                      <div>
                        <Label required>{t.type}</Label>
                        <div className="flex bg-white dark:bg-slate-800 p-0.5 border border-gray-200 dark:border-slate-700 rounded-lg">
                          {agendaTypes.map((type) => {
                            const isSelected = item.type === type;
                            return (
                              <button
                                key={type}
                                type="button"
                                disabled={isImmutable}
                                onClick={() =>
                                  updateAgendaItem(index, "type", type)
                                }
                                className={`flex-1 py-1.5 text-center text-[10px] font-bold rounded-md transition-all uppercase tracking-wide ${
                                  isSelected
                                    ? "bg-blue-500 text-white shadow-xs"
                                    : "text-gray-500 hover:text-gray-800 dark:hover:text-white"
                                }`}
                              >
                                {t.agendaTypeLabels[type]}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Remove item */}
                      <div className="flex items-end justify-center">
                        <button
                          type="button"
                          onClick={() => removeAgendaItem(index)}
                          disabled={isImmutable || agendaItems.length === 1}
                          className="flex items-center justify-center text-red-500 transition-all rounded-lg w-9 h-9 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20 disabled:opacity-40 disabled:hover:bg-transparent"
                          title={t.removeAgendaItem}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>

                    {/* Description */}
                    <div className="mt-3">
                      <Label>{t.description}</Label>
                      <textarea
                        className={inputClass}
                        rows={2}
                        value={item.description}
                        disabled={isImmutable}
                        onChange={(event) =>
                          updateAgendaItem(
                            index,
                            "description",
                            event.target.value,
                          )
                        }
                        placeholder={t.agendaDescriptionPlaceholder}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <FieldError>{errors.agenda}</FieldError>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={addAgendaItem}
                  disabled={isImmutable}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-blue-600 border border-blue-200 hover:text-white hover:bg-blue-600 hover:border-blue-600 rounded-xl bg-blue-50/50 dark:bg-blue-900/10 dark:text-blue-400 dark:border-blue-800/50 dark:hover:bg-blue-600 transition-all"
                >
                  <Plus size={15} />
                  {t.addAgendaItem}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: INVITATION BODY & DOCUMENT ATTACHMENTS */}
        {step === 3 && (
          <div className="space-y-6 animate-fadeIn">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              {/* Message editor body */}
              <div className="p-6 space-y-4 bg-white border border-gray-100 shadow-sm lg:col-span-2 dark:bg-slate-800 dark:border-slate-700 rounded-2xl">
                <div className="flex items-center justify-between pb-2 border-b border-gray-100 dark:border-slate-700">
                  <h3 className="flex items-center gap-2 text-sm font-bold text-gray-900 dark:text-white">
                    <Mail className="w-4 h-4 text-blue-500" />
                    {t.invitationBody}
                  </h3>
                </div>
                <textarea
                  className={`${inputClass} font-sans leading-relaxed`}
                  rows={12}
                  value={form.invitationBody}
                  disabled={isImmutable}
                  onChange={(event) =>
                    updateForm("invitationBody", event.target.value)
                  }
                />
                <FieldError>{errors.invitationBody}</FieldError>
              </div>

              {/* Sidebar attachments dropzone & legal notices */}
              <div className="space-y-6">
                {/* Upload zone */}
                <div className="p-6 space-y-4 bg-white border border-gray-100 shadow-sm dark:bg-slate-800 dark:border-slate-700 rounded-2xl">
                  <h3 className="text-xs font-bold tracking-wider text-gray-400 uppercase">
                    {t.attachments}
                  </h3>

                  <label className="flex flex-col items-center justify-center p-5 text-center transition-all duration-300 border-2 border-gray-200 border-dashed cursor-pointer dark:border-slate-700 hover:border-blue-500 dark:hover:border-slate-500 hover:bg-blue-50/20 dark:hover:bg-slate-900/20 rounded-2xl">
                    <Upload
                      size={24}
                      className="mb-2 text-gray-400 animate-pulse"
                    />
                    <span className="text-xs font-bold text-gray-700 dark:text-gray-300">
                      {t.selectPdfs}
                    </span>
                    <span className="text-[10px] text-gray-400 mt-1">
                      PDF (Max 10MB)
                    </span>
                    <input
                      type="file"
                      accept="application/pdf"
                      multiple
                      className="sr-only"
                      disabled={isImmutable}
                      onChange={(event) =>
                        updateForm(
                          "attachments",
                          Array.from(event.target.files || []),
                        )
                      }
                    />
                  </label>

                  {form.attachments.length > 0 && (
                    <div className="space-y-1.5 pt-2">
                      {form.attachments.map((file) => (
                        <div
                          key={file.name}
                          className="flex items-center gap-2 p-2 border border-gray-100 rounded-lg bg-gray-50 dark:bg-slate-900/40 dark:border-slate-800"
                        >
                          <FileText className="w-4 h-4 text-blue-500 shrink-0" />
                          <p className="flex-1 text-xs font-medium text-gray-700 truncate dark:text-gray-300">
                            {file.name}
                          </p>
                          <span className="text-[9px] text-gray-400 shrink-0">
                            {(file.size / (1024 * 1024)).toFixed(2)} MB
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Inline step-specific errors list banner */}
      {step === 1 &&
        (errors.title ||
          errors.startDateTime ||
          errors.endDateTime ||
          errors.location ||
          errors.platformUrl ||
          errors.overrideReason) && (
          <div className="p-4 border border-red-200 rounded-xl bg-red-50/50 dark:bg-red-950/20 dark:border-red-900/50 animate-shake">
            <div className="flex gap-2.5">
              <AlertTriangle className="w-4.5 h-4.5 text-red-500 shrink-0 mt-0.5" />
              <div className="space-y-1 text-xs font-semibold text-red-700 dark:text-red-350">
                {errors.title && <p>• {errors.title}</p>}
                {errors.startDateTime && <p>• {errors.startDateTime}</p>}
                {errors.endDateTime && <p>• {errors.endDateTime}</p>}
                {errors.location && <p>• {errors.location}</p>}
                {errors.platformUrl && <p>• {errors.platformUrl}</p>}
                {errors.overrideReason && <p>• {errors.overrideReason}</p>}
              </div>
            </div>
          </div>
        )}

      {step === 2 && errors.agenda && (
        <div className="p-4 border border-red-200 rounded-xl bg-red-50/50 dark:bg-red-950/20 dark:border-red-900/50 animate-shake">
          <div className="flex gap-2.5">
            <AlertTriangle className="w-4.5 h-4.5 text-red-500 shrink-0 mt-0.5" />
            <p className="text-xs font-semibold text-red-700 dark:text-red-350">
              {errors.agenda}
            </p>
          </div>
        </div>
      )}

      {step === 3 && errors.invitationBody && (
        <div className="p-4 border border-red-200 rounded-xl bg-red-50/50 dark:bg-red-950/20 dark:border-red-900/50 animate-shake">
          <div className="flex gap-2.5">
            <AlertTriangle className="w-4.5 h-4.5 text-red-500 shrink-0 mt-0.5" />
            <div className="space-y-1 text-xs font-semibold text-red-700 dark:text-red-350">
              {errors.invitationBody && <p>• {errors.invitationBody}</p>}
            </div>
          </div>
        </div>
      )}

      {/* Sticky Bottom Actions Bar */}
      <div className="flex flex-col items-center justify-between gap-4 p-4 bg-white border shadow-sm sm:flex-row dark:bg-slate-800 border-gray-150 dark:border-slate-700 rounded-2xl">
        <div>
          {step > 1 ? (
            <button
              type="button"
              onClick={handleBack}
              disabled={isImmutable}
              className="inline-flex items-center gap-1 px-4 py-2.5 text-xs font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 dark:bg-slate-700 dark:text-gray-200 dark:hover:bg-slate-600 rounded-xl disabled:opacity-50 transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
              {lang === "de" ? "Zurück" : "Back"}
            </button>
          ) : (
            <button
              type="button"
              onClick={handleCancelDraft}
              disabled={isImmutable}
              className="inline-flex items-center gap-1 px-4 py-2.5 text-xs font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 dark:bg-slate-700 dark:text-gray-200 dark:hover:bg-slate-600 rounded-xl transition-all"
            >
              <X className="w-4 h-4" />
              {lang === "de" ? "Abbrechen" : "Cancel"}
            </button>
          )}
        </div>

        <div className="flex flex-col items-center w-full gap-3 sm:flex-row sm:w-auto">
          <button
            type="button"
            onClick={handleSaveDraft}
            disabled={isImmutable || isSavingAssembly}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-5 py-2.5 text-xs font-bold text-gray-800 bg-white border border-gray-300 hover:bg-gray-100 hover:bg-gray-55 hover:border-gray-300 rounded-xl dark:bg-slate-800 dark:text-gray-150 dark:border-slate-700 dark:hover:bg-slate-700 transition-all disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-400 dark:disabled:text-gray-500"
          >
            {isSavingAssembly && form.status === "draft" ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin text-gray-500" />
                <span className="">
                  {lang === "de" ? "Speichern..." : "Saving..."}
                </span>
              </>
            ) : (
              <>
                <Save className="w-3.5 h-3.5 text-gray-500" />
                <span className="">
                  {lang === "de" ? "Als Entwurf speichern" : "Save as Draft"}
                </span>
              </>
            )}
          </button>

          {step < 3 ? (
            <button
              type="button"
              onClick={handleNext}
              disabled={isImmutable}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-5 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md shadow-blue-500/10 transition-all"
            >
              {lang === "de" ? "Weiter" : "Next Step"}
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSendInvitation}
              disabled={isImmutable || isSavingAssembly}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-6 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md shadow-blue-500/15 transition-all"
            >
              {isSavingAssembly &&
              (form.status === "upcoming" || form.status === "invited") ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Send className="w-3.5 h-3.5" />
              )}
              {t.sendInvitation}
            </button>
          )}
        </div>
      </div>

      {/* Confirmation bypass notice warning popup */}
      <TiltPopUp
        isOpen={showConfirmBypass}
        onClose={() => setShowConfirmBypass(false)}
        className="w-full max-w-md p-6 bg-white border border-gray-200 shadow-xl rounded-xl dark:bg-slate-800 dark:border-slate-700"
      >
        <h3 className="mb-2 text-base font-bold text-gray-900 dark:text-white">
          {lang === "de" ? "Sind Sie sicher?" : "Are you sure?"}
        </h3>
        <p className="mb-4 text-xs leading-relaxed text-gray-500 dark:text-gray-400">
          {lang === "de"
            ? `Möchten Sie die Prüfung der Einladungsfrist (${noticePeriodDays} Tage) wirklich umgehen? Dies könnte gegen gesetzliche Vorschriften verstoßen.`
            : `Are you sure you want to bypass the notice period validation (${noticePeriodDays} days)? This may violate statutory or legal bylaws.`}
        </p>
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={() => setShowConfirmBypass(false)}
            className="px-4 py-2 text-xs font-bold text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 dark:bg-slate-700 dark:text-gray-300 dark:hover:bg-slate-600"
          >
            {lang === "de" ? "Abbrechen" : "Cancel"}
          </button>
          <button
            type="button"
            onClick={() => {
              updateForm("noticePeriodValidation", true);
              setShowConfirmBypass(false);
            }}
            className="px-4 py-2 text-xs font-bold text-white rounded-lg shadow-sm bg-amber-500 hover:bg-amber-600"
          >
            {lang === "de" ? "Ja, umgehen" : "Yes, bypass"}
          </button>
        </div>
      </TiltPopUp>

      {/* Draft Found Popup */}
      <FadePopUp
        isOpen={showDraftPopUp}
        onClose={handleCancelDraft}
        className="w-full max-w-md p-6 bg-white border border-gray-200 shadow-xl rounded-2xl dark:bg-slate-800 dark:border-slate-700"
      >
        <div className="flex flex-col items-center space-y-4 text-center">
          <div className="p-3 rounded-full bg-amber-100 dark:bg-amber-950/20 text-amber-500">
            <FileText className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-extrabold text-gray-900 dark:text-white">
            {t.draftFoundTitle}
          </h3>
          <p className="text-xs leading-relaxed text-gray-500 dark:text-gray-400">
            {t.draftFoundDesc}
          </p>
          <div className="flex flex-col w-full gap-2 pt-2">
            <button
              type="button"
              onClick={handleEditDraft}
              className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md transition-all duration-200"
            >
              <Save className="w-3.5 h-3.5" />
              {t.editDraftBtn}
            </button>
            <button
              type="button"
              onClick={handleDiscardDraft}
              disabled={isDiscardingDraft}
              className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs font-bold text-red-600 border border-red-200 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-xl transition-all duration-200"
            >
              {isDiscardingDraft ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Trash2 className="w-3.5 h-3.5" />
              )}
              {t.discardDraftBtn}
            </button>
            <button
              type="button"
              onClick={handleCancelDraft}
              className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs font-bold text-gray-500 bg-gray-50 hover:bg-gray-100 dark:bg-slate-700 dark:text-gray-300 dark:hover:bg-slate-600 rounded-xl transition-all duration-200"
            >
              {t.cancelBtn}
            </button>
          </div>
        </div>
      </FadePopUp>
    </div>
  );
};

export default CreateAssemblyView;
