"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import createDOMPurify from "dompurify";
import { useParams, useRouter } from "next/navigation";

let reportPurifier;
function sanitizeReportHtml(html) {
  if (typeof window === "undefined") return "";
  reportPurifier ||= createDOMPurify(window);
  return reportPurifier.sanitize(html, {
    USE_PROFILES: { html: true },
    FORBID_TAGS: ["script", "iframe", "object", "embed", "form"],
    FORBID_ATTR: ["srcdoc"],
  });
}
import {
  FileText,
  Save,
  Download,
  CheckCircle2,
  AlertCircle,
  Eye,
  Bold,
  Italic,
  Strikethrough,
  Heading1,
  Heading2,
  Heading3,
  Heading4,
  Heading5,
  Heading6,
  List,
  ListOrdered,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Moon,
  Sun,
  Info,
  Loader2,
  Sparkles,
  FileCode,
  Check,
  ArrowLeft,
  Minus,
  Plus,
  Quote,
  Link,
  Image,
} from "lucide-react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import toast from "react-hot-toast";
import { getCoopById } from "@/lib/getCoopsService";
import { getAuditHistoryById } from "@/lib/AuditService";
import { useAuth } from "@/hooks/useAuth";
import { DEFAULT_TEMPLATE } from "@/assets/data/javascript/Report_Template";
import { fetchAuditorAuditOrg } from "@/lib/auditorService";

const highlightText = (text) => {
  if (!text) return "";

  // 1. Escape HTML
  let html = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  // 2. Highlight macro tokens: {{ ... }}
  html = html.replace(
    /\{\{([^{\s}]+)\}\}/g,
    '<span class="inline-block px-1.5 py-0.5 rounded text-[11px] font-bold font-mono bg-indigo-100 text-indigo-750 dark:bg-indigo-950 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-900/40">$0</span>',
  );

  // 3. Highlight markdown bold: **text**
  html = html.replace(
    /\*\*([^\*\n]+?)\*\*/g,
    '<span class="font-bold text-amber-600 dark:text-amber-400">$0</span>',
  );

  // 4. Highlight markdown italic: *text*
  html = html.replace(
    /(?<=^|\s|[()\[\]{}'"`])\*([^\s\*](?:[^*]*?[^\s\*])?)\*(?=\s|$|[.,;:!?()\[\]{}'"`])/g,
    '<span class="italic text-emerald-600 dark:text-emerald-400">$0</span>',
  );

  // Highlight markdown strikethrough: ~~text~~
  html = html.replace(
    /~~([^~\n]+?)~~/g,
    '<span class="line-through text-gray-400 dark:text-slate-500">$0</span>',
  );

  // 5. Highlight headers starting with #
  html = html.replace(
    /^(#{1,6}\s+)(.+)$/gm,
    '<span class="text-indigo-600 dark:text-indigo-400 font-extrabold">$1</span><span class="font-bold text-slate-800 dark:text-slate-100">$2</span>',
  );

  // 6. Highlight page breaks: ---
  html = html.replace(
    /^---$/gm,
    '<span class="block border-b border-dashed border-indigo-400 dark:border-indigo-600 text-center text-[10px] text-indigo-500 font-bold py-1 select-none">--- [Page Break] ---</span>',
  );

  return html;
};

const cleanMarkdown = (rawText) => {
  if (!rawText) return "";
  // Check if this is the old/default format containing cover pages
  if (
    rawText.includes("# PRÜFUNGSBERICHT") &&
    rawText.includes("## Prüfungsbescheinigung")
  ) {
    const parts = rawText.split(/\r?\n---\r?\n/);
    if (parts.length >= 3) {
      // The report body starts at part index 2 (third page onwards)
      return parts.slice(2).join("\n---\n").trim();
    }
  }
  return rawText.trim();
};

const generateCoverPageHtml = (macros, auditOrg) => {
  const getMacroValue = (key, fallback = "") =>
    macros["@" + key] ?? macros["/" + key] ?? fallback;
  const coopName = getMacroValue("name") || "Cooperative";
  const registeredOffice = getMacroValue("registeredOffice") || "Frankfurt";
  const rawDate =
    getMacroValue("certificatePlaceDate") ||
    new Date().toLocaleDateString("de-DE");
  const publishDate = rawDate.includes(",")
    ? rawDate.split(",")[1].trim()
    : rawDate;

  return `
    <div class="flex-1 flex flex-col justify-center text-center my-auto h-full w-full font-sans p-16" style="display: flex !important; flex-direction: column !important; justify-content: center !important; align-items: center !important; text-align: center !important; height: 100% !important; width: 100% !important; font-family: 'Outfit', 'Inter', sans-serif !important; padding: 40px !important; box-sizing: border-box !important;">
      <img src="${auditOrg?.logo_url || ""}" alt="Logo" style="width: 140px !important; height: 140px !important; margin: 10px auto !important; display: block !important;" />
      <h1 class="text-4xl font-extrabold text-blue-800 tracking-wider mb-2 text-center" style="font-size: 3.2rem !important; line-height: 1 !important; color: #0033a0 !important; font-weight: 800 !important; letter-spacing: 0.05em !important; margin-bottom: 8px !important; text-align: center !important;">
        PRÜFUNGSBERICHT
      </h1>
      <p class="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-8 text-center" style="text-align: center !important; font-size: 12px !important; color: #6b7280 !important; font-weight: 600 !important; text-transform: uppercase !important; letter-spacing: 0.05em !important; margin-bottom: 32px !important; margin-top: 0 !important;">
        über die Prüfung gemäß § 53 Genossenschaftsgesetz
      </p>
      <p class="text-xs text-gray-400 mb-2 text-center" style="text-align: center !important; font-size: 12px !important; color: #9ca3af !important; margin-bottom: 8px !important; margin-top: 0 !important;">der</p>
      <h2 class="text-2xl font-bold text-indigo-950 mb-3 text-center" style="font-size: 1.8rem !important; line-height: 1.2 !important; color: #1e1b4b !important; font-weight: 700 !important; margin-bottom: 12px !important; text-align: center !important;">
        ${coopName}
      </h2>
      <p class="text-sm text-gray-600 mb-3 text-center" style="text-align: center !important; font-size: 14px !important; color: #4b5563 !important; margin-bottom: 12px !important; margin-top: 0 !important;">
        mit Sitz in ${registeredOffice}
      </p>
      <p class="text-sm text-gray-500 mt-3 font-medium text-center" style="text-align: center !important; font-size: 14px !important; color: #6b7280 !important; font-weight: 500 !important; margin-top: 12px !important;">
        vom ${publishDate}
      </p>
      <div class="flex items-center justify-evenly w-full mt-32" style="display: flex !important; flex-direction: row !important; justify-content: space-evenly !important; align-items: center !important; width: 100% !important; margin-top: 128px !important;">
        <div class="text-center" style="text-align: center !important;">
          <p class="font-bold text-indigo-950 text-center" style="text-align: center !important; font-weight: bold !important; color: #1e1b4b !important; margin-bottom: 4px !important;">___________________</p>
          <p class="text-gray-600 text-center" style="text-align: center !important; color: #4b5563 !important; font-size: 14px !important;">- Vorstand -</p>
        </div>
        <div class="flex flex-col items-center select-none" style="display: flex !important; flex-direction: column !important; align-items: center !important;">
          ${
            auditOrg?.stamp_url
              ? `
            <img src="${auditOrg?.stamp_url}" alt="Stamp" class="max-h-36 object-contain opacity-85" style="max-height: 144px !important; object-fit: contain !important; opacity: 0.85 !important;" />
          `
              : `
            <div class="border border-dashed border-gray-300 rounded-lg p-3 text-[10px] text-gray-400 text-center select-none w-36" style="border: 1px dashed #d1d5db !important; border-radius: 8px !important; padding: 12px !important; font-size: 10px !important; color: #9ca3af !important; text-align: center !important; width: 144px !important;">
              [ Organisationsstempel ]
            </div>
          `
          }
        </div>
        <div class="text-center" style="text-align: center !important;">
          <p class="font-bold text-indigo-950 text-center" style="text-align: center !important; font-weight: bold !important; color: #1e1b4b !important; margin-bottom: 4px !important;">___________________</p>
          <p class="text-gray-600 text-center" style="text-align: center !important; color: #4b5563 !important; font-size: 14px !important;">- Vorstand -</p>
        </div>
      </div>
    </div>
  `;
};
// <div class="mt-20 text-center my-auto">Deutscher Interessenverband der Kleingenossenschaften e.V \nHauptgeschäftsstelle: Peiner Landstraße 217 31135 Hildesheim</div>

const generateCertificatePageHtml = (macros, auditOrg) => {
  const getMacroValue = (key, fallback = "") =>
    macros["@" + key] ?? macros["/" + key] ?? fallback;

  const orgName =
    getMacroValue("auditOrgName") || auditOrg?.OrgName || "DIVK e.V.";
  const coopName = getMacroValue("name") || "Cooperative";
  const registeredOffice = getMacroValue("registeredOffice") || "Frankfurt";
  const fiscalYears = getMacroValue("fiscalYears") || "2021";
  const certificatePlaceDate =
    getMacroValue("certificatePlaceDate") ||
    `${auditOrg?.City || "Hildesheim"}, ${new Date().toLocaleDateString("de-DE")}`;
  const associationName = getMacroValue("associationName") || orgName;

  const signer1Name = getMacroValue("signer1Name") || "Björn Erhard";
  const signer1Title = getMacroValue("signer1Title") || "Vorstand";
  const signer2Name = getMacroValue("signer2Name") || "Götz René Turnier";
  const signer2Title = getMacroValue("signer2Title") || "Vorstand";

  return `
    <div class="flex-1 flex flex-col justify-between font-sans text-gray-800 h-[85%] w-full">
      <!-- Address block under letterhead -->
      <div class="flex flex-col justify-end p-4 mb-4 font-sans text-xs select-none rounded-xl">
        <div class="flex flex-col items-end justify-end">
          <p class="text-[9px] font-semibold text-gray-400 uppercase tracking-wide mb-1.5">
            Anschrift des Prüfungsverbands
          </p>
          <p class="font-bold text-gray-900">
            ${auditOrg?.OrgName || "[Organization Name]"}
          </p>
          <p class="text-gray-600">
            ${getMacroValue("streetAddress") || auditOrg?.street || "[Street Address]"}
          </p>
          <p class="text-gray-600">
            ${getMacroValue("postalCode") || auditOrg?.postCode || "[Postal Code]"} ${getMacroValue("city") || auditOrg?.City || "[City]"}
          </p>
          <p>
            Deutsches Format
          </p>
        </div>
      </div>

      <!-- Center content -->
      <div class="my-auto mb-10">
        <h2 class="text-2xl font-bold text-center text-gray-900 mb-20 mt-2" style="font-size: 2rem;">
          Prüfungsbescheinigung
        </h2>
        
        <p class="text-sm mb-8 text-justify">
          Hiermit bescheinigen wir der
        </p>
        
        <div class="my-8 py-4">
          <p class="font-extrabold text-lg text-indigo-950" style="font-size: 1.25rem;">
            ${coopName}
          </p>
          <p class="text-xs text-gray-500 mt-1">
            mit Sitz in ${registeredOffice}
          </p>
        </div>

        <p class="text-sm mb-3 text-justify leading-relaxed">
          die Durchführung der Prüfung gemäß § 53 Abs. 1 Genossenschaftsgesetz.
        </p>

        <p class="text-sm mb-6 text-justify leading-relaxed">
          Die Prüfung wurde durchgeführt für das Geschäftsjahr <strong>${fiscalYears}</strong>.
        </p>

        <div class="mt-12 text-sm">
          <p class="font-semibold text-gray-950">${certificatePlaceDate}</p>
          <p class="text-gray-600 mt-0.5">${associationName}</p>
        </div>
      </div>

      <!-- Signatures side by side -->
      <div class="flex justify-between items-end mt-auto pt-6 select-none">
        <div class="w-[45%] text-left">
          <div class="border-b border-gray-400 w-full mb-1"></div>
          <p class="text-[16px] pl-1.5 text-gray-500 font-medium">${signer1Title}</p>
        </div>
        <div class="w-[45%] text-left">
          <div class="border-b border-gray-400 w-full mb-1"></div>
          <p class="text-[16px] pl-1.5 text-gray-500 font-medium">${signer2Title}</p>
        </div>
      </div>
    </div>
  `;
};

export default function ReportPage() {
  const params = useParams();
  const router = useRouter();
  const coopId = params?.coopId;
  const auditId = params?.auditId;
  const { user } = useAuth();

  const HeadingIcon = ({ level, size = 15 }) => {
    switch (level) {
      case 1:
        return <Heading1 size={size} />;
      case 2:
        return <Heading2 size={size} />;
      case 3:
        return <Heading3 size={size} />;
      case 4:
        return <Heading4 size={size} />;
      case 5:
        return <Heading5 size={size} />;
      case 6:
        return <Heading6 size={size} />;
      default:
        return <Heading1 size={size} />;
    }
  };

  const [cooperative, setCooperative] = useState(null);
  const [auditDoc, setAuditDoc] = useState(null);
  const [markdown, setMarkdown] = useState("");
  const [compiledPages, setCompiledPages] = useState([]);
  const [compiledHtml, setCompiledHtml] = useState("");
  const [macros, setMacros] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [lastSavedTime, setLastSavedTime] = useState(null);

  // Autocomplete state
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [autocompleteQuery, setAutocompleteQuery] = useState("");
  const [autocompleteTrigger, setAutocompleteTrigger] = useState("");
  const [autocompleteCoords, setAutocompleteCoords] = useState({
    top: 0,
    left: 0,
  });

  // Macro Dropdown state
  const [showMacroDropdown, setShowMacroDropdown] = useState(false);
  const [macroSearch, setMacroSearch] = useState("");

  // Toolbar Macro Dropdown state
  const [showToolbarMacroDropdown, setShowToolbarMacroDropdown] =
    useState(false);
  const [toolbarMacroSearch, setToolbarMacroSearch] = useState("");

  // Heading Select & Dropdown state
  const [activeHeadingLevel, setActiveHeadingLevel] = useState(1);
  const [showHeadingDropdown, setShowHeadingDropdown] = useState(false);
  const headingDropdownRef = useRef(null);

  // List Select & Dropdown state
  const [activeListType, setActiveListType] = useState("bullet");
  const [showListDropdown, setShowListDropdown] = useState(false);
  const listDropdownRef = useRef(null);

  const [zoom, setZoom] = useState(0.7);
  const [pageFormat, setPageFormat] = useState("A4");
  const [auditOrg, setAuditOrg] = useState(null);
  const [showBorder, setShowBorder] = useState(false);
  const [openFrontPageModal, setOpenFrontPageModal] = useState(false);

  // Front page modal form states
  const [modalCoopName, setModalCoopName] = useState("");
  const [modalRegisteredOffice, setModalRegisteredOffice] = useState("");
  const [modalFiscalYears, setModalFiscalYears] = useState("");
  const [modalCertificatePlaceDate, setModalCertificatePlaceDate] =
    useState("");
  const [modalAssociationName, setModalAssociationName] = useState("");
  const [modalSigner1Name, setModalSigner1Name] = useState("");
  const [modalSigner1Title, setModalSigner1Title] = useState("");
  const [modalSigner2Name, setModalSigner2Name] = useState("");
  const [modalSigner2Title, setModalSigner2Title] = useState("");

  const getMacroValue = (key, fallback = "") =>
    macros["@" + key] ?? macros["/" + key] ?? fallback;

  const orgName =
    getMacroValue("auditOrgName") || auditOrg?.OrgName || "DIVK e.V.";

  useEffect(() => {
    if (openFrontPageModal) {
      setModalCoopName(getMacroValue("name"));
      setModalRegisteredOffice(getMacroValue("registeredOffice"));
      setModalFiscalYears(getMacroValue("fiscalYears"));
      setModalCertificatePlaceDate(getMacroValue("certificatePlaceDate"));
      setModalAssociationName(getMacroValue("associationName"));
      setModalSigner1Name(getMacroValue("signer1Name"));
      setModalSigner1Title(getMacroValue("signer1Title"));
      setModalSigner2Name(getMacroValue("signer2Name"));
      setModalSigner2Title(getMacroValue("signer2Title"));
    }
  }, [openFrontPageModal, macros]);

  const handleSaveFrontPage = () => {
    const nextMacros = { ...macros };

    const updates = {
      name: modalCoopName,
      registeredOffice: modalRegisteredOffice,
      fiscalYears: modalFiscalYears,
      certificatePlaceDate: modalCertificatePlaceDate,
      associationName: modalAssociationName,
      signer1Name: modalSigner1Name,
      signer1Title: modalSigner1Title,
      signer2Name: modalSigner2Name,
      signer2Title: modalSigner2Title,
      signer1: `${modalSigner1Name} – ${modalSigner1Title}`,
      signer2: `${modalSigner2Name} – ${modalSigner2Title}`,
    };

    Object.entries(updates).forEach(([key, val]) => {
      nextMacros["@" + key] = val;
      nextMacros["/" + key] = val;
    });

    setMacros(nextMacros);
    setCompiledHtml(compileReport(markdown, nextMacros));
    setOpenFrontPageModal(false);
    toast.success("Front page data updated!");
  };

  // New state variables for LaTeX-style PDF Viewer UI
  const [currentPage, setCurrentPage] = useState(1);
  const [pageInputVal, setPageInputVal] = useState("1");
  const [showRecompileDropdown, setShowRecompileDropdown] = useState(false);
  const [syncPreview, setSyncPreview] = useState(true);
  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== "undefined") {
      return document.documentElement.classList.contains("dark");
    }
    return false;
  });

  const previewScrollContainerRef = useRef(null);
  const pageInputRef = useRef(null);
  const isSyncScrollingRef = useRef(false);
  const onEditorScrollRef = useRef(null);
  const recompileDropdownRef = useRef(null);
  const handleCtrlSRef = useRef(null);

  const editorRef = useRef(null);
  const viewRef = useRef(null);
  const macroDropdownRef = useRef(null);
  const toolbarMacroDropdownRef = useRef(null);
  const autocompleteDropdownRef = useRef(null);
  const hiddenContainerRef = useRef(null);
  const [editorLoaded, setEditorLoaded] = useState(false);
  const CodeMirrorRefs = useRef(null);

  const [leftWidth, setLeftWidth] = useState(650); // Default width in pixels

  useEffect(() => {
    function handleClickOutside(event) {
      if (
        macroDropdownRef.current &&
        !macroDropdownRef.current.contains(event.target)
      ) {
        setShowMacroDropdown(false);
      }
      if (
        toolbarMacroDropdownRef.current &&
        !toolbarMacroDropdownRef.current.contains(event.target)
      ) {
        setShowToolbarMacroDropdown(false);
      }
      if (
        headingDropdownRef.current &&
        !headingDropdownRef.current.contains(event.target)
      ) {
        setShowHeadingDropdown(false);
      }
      if (
        listDropdownRef.current &&
        !listDropdownRef.current.contains(event.target)
      ) {
        setShowListDropdown(false);
      }
      if (
        autocompleteDropdownRef.current &&
        !autocompleteDropdownRef.current.contains(event.target)
      ) {
        setShowAutocomplete(false);
        setAutocompleteTrigger("");
      }
      if (
        recompileDropdownRef.current &&
        !recompileDropdownRef.current.contains(event.target)
      ) {
        setShowRecompileDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Sync scroll listener logic ref
  useEffect(() => {
    onEditorScrollRef.current = (e) => {
      if (!syncPreview) return;
      if (isSyncScrollingRef.current) {
        isSyncScrollingRef.current = false;
        return;
      }
      const editorEl = e.target;
      const previewEl = previewScrollContainerRef.current;
      if (!editorEl || !previewEl) return;

      const scrollPercent =
        editorEl.scrollTop / (editorEl.scrollHeight - editorEl.clientHeight);
      isSyncScrollingRef.current = true;
      previewEl.scrollTop =
        scrollPercent * (previewEl.scrollHeight - previewEl.clientHeight);
    };
  }, [syncPreview]);

  // Sync pageInputVal with currentPage unless focused
  useEffect(() => {
    if (
      pageInputRef.current &&
      document.activeElement !== pageInputRef.current
    ) {
      setPageInputVal(String(currentPage));
    }
  }, [currentPage]);

  // Toggle app light/dark mode theme globally
  const toggleTheme = () => {
    const nextDark = !isDark;
    setIsDark(nextDark);
    if (typeof window !== "undefined") {
      document.documentElement.classList.toggle("dark", nextDark);
      localStorage.setItem("theme", nextDark ? "dark" : "light");
    }
  };

  // Scroll to specific preview page smoothly
  const scrollToPage = (index) => {
    const previewEl = previewScrollContainerRef.current;
    if (!previewEl) return;
    const pageElements = previewEl.querySelectorAll(
      ".preview-page-container-el",
    );
    const targetPage = pageElements[index];
    if (targetPage) {
      targetPage.scrollIntoView({ behavior: "smooth", block: "start" });
      setCurrentPage(index + 1);
    }
  };

  // Submit page navigation from input box
  const handlePageSubmit = () => {
    const pageNum = parseInt(pageInputVal, 10);
    if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= compiledPages.length) {
      scrollToPage(pageNum - 1);
    } else {
      setPageInputVal(String(currentPage));
    }
  };

  // Handle scroll events in the preview container
  const handlePreviewScroll = (e) => {
    const previewEl = e.target;

    // 1. Synchronize scroll to editor if enabled
    if (syncPreview) {
      if (isSyncScrollingRef.current) {
        isSyncScrollingRef.current = false;
      } else {
        const view = viewRef.current;
        const editorEl = view ? view.scrollDOM : null;
        if (editorEl) {
          const scrollPercent =
            previewEl.scrollTop /
            (previewEl.scrollHeight - previewEl.clientHeight);
          isSyncScrollingRef.current = true;
          editorEl.scrollTop =
            scrollPercent * (editorEl.scrollHeight - editorEl.clientHeight);
        }
      }
    }

    // 2. Detect which page occupies the most vertical space in view
    const pageElements = previewEl.querySelectorAll(
      ".preview-page-container-el",
    );
    if (!pageElements.length) return;

    const containerRect = previewEl.getBoundingClientRect();
    let activeIndex = 0;
    let maxVisibleHeight = 0;

    pageElements.forEach((pageEl, idx) => {
      const rect = pageEl.getBoundingClientRect();
      const visibleTop = Math.max(rect.top, containerRect.top);
      const visibleBottom = Math.min(rect.bottom, containerRect.bottom);
      const visibleHeight = Math.max(0, visibleBottom - visibleTop);

      if (visibleHeight > maxVisibleHeight) {
        maxVisibleHeight = visibleHeight;
        activeIndex = idx;
      }
    });

    setCurrentPage(activeIndex + 1);
  };

  // Sync compilation Ctrl+S ref closure
  useEffect(() => {
    handleCtrlSRef.current = () => {
      handleCompile();
      handleSaveProgress();
    };
  }, [markdown, macros]);

  // Global Ctrl+S keyboard listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        if (handleCtrlSRef.current) {
          handleCtrlSRef.current();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const isResizingRef = useRef(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("easycoop_report_editor_width");
      if (saved) {
        setLeftWidth(Number(saved));
      }
    }
  }, []);

  const handleMouseMove = useCallback((e) => {
    if (!isResizingRef.current) return;
    const newWidth = Math.max(
      320,
      Math.min(e.clientX, window.innerWidth - 450),
    );
    setLeftWidth(newWidth);
    localStorage.setItem("easycoop_report_editor_width", String(newWidth));
  }, []);

  const handleMouseUp = useCallback(() => {
    isResizingRef.current = false;
    document.removeEventListener("mousemove", handleMouseMove);
    document.removeEventListener("mouseup", handleMouseUp);
    document.body.style.cursor = "";
    document.body.style.userSelect = "";
  }, [handleMouseMove]);

  const startResizing = useCallback(
    (e) => {
      e.preventDefault();
      isResizingRef.current = true;
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    },
    [handleMouseMove, handleMouseUp],
  );

  useEffect(() => {
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);

  // Dynamic load CodeMirror on client-side only (Next.js SSR safe)
  useEffect(() => {
    const initCodeMirror = async () => {
      try {
        const [stateMod, viewMod, langMod, cmdMod] = await Promise.all([
          import("@codemirror/state"),
          import("@codemirror/view"),
          import("@codemirror/lang-markdown"),
          import("@codemirror/commands"),
        ]);

        CodeMirrorRefs.current = {
          EditorState: stateMod.EditorState,
          EditorView: viewMod.EditorView,
          keymap: viewMod.keymap,
          placeholder: viewMod.placeholder,
          Decoration: viewMod.Decoration,
          ViewPlugin: viewMod.ViewPlugin,
          lineWrapping: viewMod.EditorView.lineWrapping,
          lineNumbers: viewMod.lineNumbers,
          codemirrorMarkdown: langMod.markdown,
          defaultKeymap: cmdMod.defaultKeymap,
          history: cmdMod.history,
          historyKeymap: cmdMod.historyKeymap,
        };
        setEditorLoaded(true);
      } catch (err) {
        console.error("Failed to load CodeMirror dynamically", err);
      }
    };

    initCodeMirror();
  }, []);

  const resolveMacroContext = (doc, coopData, auditOrgData) => {
    let resolved = {};

    if (doc?.macros) {
      try {
        const macrosArr =
          typeof doc.macros === "string" ? JSON.parse(doc.macros) : doc.macros;
        if (Array.isArray(macrosArr)) {
          macrosArr.forEach((m) => {
            if (m.key) {
              const baseKey = m.key.replace(/^[@/]/, "");
              resolved["@" + baseKey] = m.value;
              resolved["/" + baseKey] = m.value;
            }
          });
        } else if (typeof macrosArr === "object") {
          Object.entries(macrosArr).forEach(([k, v]) => {
            const baseKey = k.replace(/^[@/]/, "");
            resolved["@" + baseKey] = v;
            resolved["/" + baseKey] = v;
          });
        }
      } catch (e) {
        console.error("Failed to parse macros:", e);
      }
    }

    let qJson = {};
    if (doc?.auditJson) {
      try {
        qJson =
          typeof doc.auditJson === "string"
            ? JSON.parse(doc.auditJson)
            : doc.auditJson;
      } catch (e) {
        console.error("Failed to parse auditJson:", e);
      }
    }

    const basic = qJson?.generalInfo?.basic || {};
    const membership = qJson?.generalInfo?.membership || {};
    const organs = qJson?.generalInfo?.organs || {};

    const defaults = {
      "@registeredOffice": coopData?.location || coopData?.state || "Frankfurt",
      "@logo?w=100&h=100": `![Logo](${coopData?.logo})` || "",
      "@fiscalYears": basic.fiscalYear || new Date().getFullYear().toString(),
      "@accountingYears":
        basic.fiscalYear ||
        `${new Date().getFullYear() - 1} - ${new Date().getFullYear()}`,
      "@certificatePlaceDate": `${auditOrgData?.City || coopData?.location || "Hildesheim"}, ${new Date().toLocaleDateString("de-DE")}`,
      "@associationName":
        auditOrgData?.OrgName ||
        "Deutscher Interessenverband der Kleingenossenschaften e.V. (DIVK)",
      "@engagementLetterDate": doc?.createdAt
        ? new Date(doc.createdAt).toLocaleDateString("de-DE")
        : new Date().toLocaleDateString("de-DE"),
      "@legalPurposeText":
        qJson.legalRepresentation ||
        "Zweck der Genossenschaft ist die Mitgliederförderung.",
      "@membersCount": membership.numMembers || "10",
      "@boardMember1": organs.board?.chairman || "Vorstandmitglied A",
      "@boardMember2": organs.board?.deputy || "Vorstandmitglied B",
      "@generalAssemblyRepresentative":
        organs.assemblyRep?.representative || "Vertreter",
      "@shareAmount": coopData?.sharePrice
        ? `${coopData.sharePrice} EUR`
        : "100 EUR",
      "@noticePeriod": "24 Monate",
      "@liabilityClause": "ausgeschlossen",
      "@promotionSummary": "Die Mitgliederförderung wurde nachgewiesen.",
      "@promotionVerb": "gefördert wurden",
      "@promotionDetails":
        "Gemeinschaftlicher Geschäftsbetrieb und Förderung der Mitgliederinteressen.",
      "@noDoubtsClause":
        "Es bestehen keine Zweifel an der satzungsgemäßen Mitgliederförderung.",
      "@businessOperationsText":
        coopData?.about || "ist tätig im Bereich der Genossenschaftsförderung.",
      "@profitYearIntro": `im Jahr ${new Date().getFullYear() - 1}`,
      "@profitText": "konnte ein positives Jahresergebnis erzielt werden.",
      "@memberLoans": qJson.hasAcceptedLoans === "true" ? "einige" : "keine",
      "@bookkeepingDeficiencyWord": "keinen",
      "@membershipStatus": `${membership.numMembers || "10"} ordentlichen Mitgliedern`,
      "@membershipGrowthText": `${membership.newMembers || "0"} neuen Mitgliedern.`,
      "@membershipSharesText": `${membership.numMembers ? membership.numMembers * 5 : "50"} Geschäftsanteilen.`,
      "@briefingDate": new Date().toLocaleDateString("de-DE"),
      "@closingPlaceDate": `${coopData?.location || "Hildesheim"}, den ${new Date().toLocaleDateString("de-DE")}`,

      "@signer1Name": "Björn Erhard",
      "@signer1Title": "Vorstand",
      "@signer2Name": "Götz René Turnier",
      "@signer2Title": "Vorstand",
      "@signer1": "Björn Erhard – Vorstand",
      "@signer2": "Götz René Turnier – Vorstand",
      "@auditOrgName": auditOrgData?.OrgName || "DIVK e.V.",
      "@streetAddress": auditOrgData?.street || "Peiner Landstraße 217",
      "@postalCode": auditOrgData?.postCode || "31135",
      "@city": auditOrgData?.City || "Hildesheim",
      "@website": auditOrgData?.website || "www.divk.de",
    };

    const finalMacros = {};
    Object.entries(resolved).forEach(([k, v]) => {
      finalMacros[k] = v;
    });
    Object.entries(defaults).forEach(([k, v]) => {
      const baseKey = k.replace(/^[@/]/, "");
      if (finalMacros["@" + baseKey] === undefined) {
        finalMacros["@" + baseKey] = v;
        finalMacros["/" + baseKey] = v;
      }
    });

    finalMacros["@name"] = coopData?.name || "Cooperative";
    finalMacros["/name"] = coopData?.name || "Cooperative";

    return finalMacros;
  };

  const PAGE_FORMATS = {
    A4: {
      name: "DIN A4",
      widthMm: 210,
      heightMm: 297,
      contentWidthMm: 170,
      baseLimitMm: 257,
      page2LimitMm: 222,
    },
    A3: {
      name: "DIN A3",
      widthMm: 297,
      heightMm: 420,
      contentWidthMm: 257,
      baseLimitMm: 380,
      page2LimitMm: 345,
    },
    A5: {
      name: "DIN A5",
      widthMm: 148,
      heightMm: 210,
      contentWidthMm: 108,
      baseLimitMm: 170,
      page2LimitMm: 135,
    },
    B4: {
      name: "DIN B4",
      widthMm: 250,
      heightMm: 353,
      contentWidthMm: 210,
      baseLimitMm: 313,
      page2LimitMm: 278,
    },
    B5: {
      name: "DIN B5",
      widthMm: 176,
      heightMm: 250,
      contentWidthMm: 136,
      baseLimitMm: 210,
      page2LimitMm: 175,
    },
    C4: {
      name: "DIN C4",
      widthMm: 229,
      heightMm: 324,
      contentWidthMm: 189,
      baseLimitMm: 284,
      page2LimitMm: 249,
    },
    C5: {
      name: "DIN C5",
      widthMm: 162,
      heightMm: 229,
      contentWidthMm: 122,
      baseLimitMm: 189,
      page2LimitMm: 154,
    },
    Letter: {
      name: "US Letter",
      widthMm: 215.9,
      heightMm: 279.4,
      contentWidthMm: 175.9,
      baseLimitMm: 239.4,
      page2LimitMm: 204.4,
    },
  };

  // Compile report markdown to HTML
  const compileReport = (text, macroContext) => {
    if (!text) return "";
    let temp = text;
    const logoBlocks = [];

    // Handle dynamic @logo sizing macros (e.g. {{@logo?w=20&h=23}} or {{/logo}})
    const logoUrl = cooperative?.logo || "";
    if (logoUrl) {
      temp = temp.replace(
        /\{\{([@/]logo)(?:\?([^}]+))?\}\}/gi,
        (match, prefix, queryStr) => {
          let width = "";
          let height = "";

          if (queryStr) {
            const wMatch = queryStr.match(/\bw=(\d+)/i);
            const hMatch = queryStr.match(/\bh=(\d+)/i);

            if (wMatch) width = wMatch[1];
            if (hMatch) height = hMatch[1];
          } else {
            // Default fallback size if no query parameters are provided at all
            width = "100";
            height = "100";
          }

          const style = [
            width ? `width: ${width}px;` : "",
            height ? `height: ${height}px;` : "",
            "max-width: 100%;",
            "margin-left: auto;",
            "margin-right: auto;",
            "display: block;",
          ]
            .filter(Boolean)
            .join(" ");

          const imgHtml = `<img src="${logoUrl}" style="${style}" alt="Cooperative Logo" class="my-1.5 rounded-lg" />`;
          logoBlocks.push(imgHtml);
          return `\x01LOGO_${logoBlocks.length - 1}\x01`;
        },
      );
    } else {
      temp = temp.replace(/\{\{([@/]logo)(?:\?[^}]+)?\}\}/gi, "");
    }

    // Replace macro tokens: {{ ... }}
    Object.entries(macroContext).forEach(([key, val]) => {
      const placeholders = [key];
      if (key.startsWith("@")) {
        placeholders.push("/" + key.slice(1));
      } else if (key.startsWith("/")) {
        placeholders.push("@" + key.slice(1));
      }

      placeholders.forEach((placeholderKey) => {
        const placeholder = `{{${placeholderKey}}}`;
        const regex = new RegExp(
          placeholder.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
          "g",
        );
        temp = temp.replace(regex, val || "");
      });
    });

    // 1. Extract fenced code blocks
    const codeBlocks = [];
    temp = temp.replace(
      /```(\w*)\r?\n([\s\S]*?)\r?\n```/g,
      (match, lang, code) => {
        const escapedCode = code
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;");
        const blockHtml = `<pre class="bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-800 p-4 rounded-lg my-4 overflow-x-auto text-xs font-mono text-gray-800 dark:text-slate-200"><code class="block font-mono select-text">${escapedCode}</code></pre>`;
        codeBlocks.push(blockHtml);
        return `\n\x02CODEBLOCK_${codeBlocks.length - 1}\x02\n`;
      },
    );

    // 2. Extract block math $$ ... $$
    const mathBlocks = [];
    temp = temp.replace(/\$\$([\s\S]*?)\$\$/g, (match, mathContent) => {
      const trimmedMath = mathContent.trim();
      const blockHtml = `<div class="my-4 text-center font-serif italic text-indigo-700 dark:text-indigo-300 bg-indigo-50/20 dark:bg-indigo-950/20 py-3 px-4 rounded-lg border border-indigo-150/40 dark:border-indigo-900/30 text-sm select-text">${trimmedMath}</div>`;
      mathBlocks.push(blockHtml);
      return `\n\x02MATHBLOCK_${mathBlocks.length - 1}\x02\n`;
    });

    const parseInline = (str) => {
      if (!str) return "";
      let html = str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");

      const inlineCodes = [];
      html = html.replace(/`([^`\n]+?)`/g, (match, code) => {
        inlineCodes.push(
          `<code class="bg-gray-100 dark:bg-slate-850 text-rose-600 dark:text-rose-400 px-1 py-0.5 rounded font-mono text-[11px] border border-gray-200 dark:border-slate-800 select-text">${code}</code>`,
        );
        return `\x01INLINECODE_${inlineCodes.length - 1}\x01`;
      });

      const inlineMaths = [];
      html = html.replace(/\$([^\$\n]+?)\$/g, (match, math) => {
        inlineMaths.push(
          `<span class="font-serif italic text-indigo-700 dark:text-indigo-300 bg-indigo-50/30 dark:bg-indigo-950/20 px-1 py-0.5 rounded text-xs select-text">${math}</span>`,
        );
        return `\x01INLINEMATH_${inlineMaths.length - 1}\x01`;
      });

      const images = [];
      html = html.replace(/!\[(.*?)\]\((.*?)\)/g, (match, alt, url) => {
        const trimmedUrl = url ? url.trim() : "";
        if (
          !trimmedUrl ||
          trimmedUrl === "null" ||
          trimmedUrl === "undefined" ||
          trimmedUrl.includes("/audit/report/")
        ) {
          images.push(
            `<span class="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs text-gray-500 bg-gray-100 border border-gray-200 rounded dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400 font-mono">[Image: ${alt || "Empty Source"}]</span>`,
          );
        } else {
          images.push(
            `<img src="${trimmedUrl}" alt="${alt}" class="max-w-full h-auto my-1.5 mx-auto rounded-lg border border-gray-200 dark:border-slate-800" />`,
          );
        }
        return `\x01IMAGE_${images.length - 1}\x01`;
      });

      const links = [];
      html = html.replace(/\[(.*?)\]\((.*?)\)/g, (match, label, url) => {
        links.push(
          `<a href="${url}" target="_blank" rel="noopener noreferrer" class="text-indigo-650 hover:text-indigo-850 dark:text-indigo-400 dark:hover:text-indigo-300 underline font-medium select-text">${label}</a>`,
        );
        return `\x01LINK_${links.length - 1}\x01`;
      });

      const footnotes = [];
      html = html.replace(/\[\^([^\]\n]+?)\]/g, (match, fnLabel) => {
        footnotes.push(
          `<sup><a href="#fn-${fnLabel}" class="text-indigo-650 dark:text-indigo-400 font-bold hover:underline select-none">${fnLabel}</a></sup>`,
        );
        return `\x01FOOTNOTE_${footnotes.length - 1}\x01`;
      });

      // Space-separated bold, italic, strikethrough (supporting single or multiple characters)
      html = html
        .replace(
          /\*\*([^\*\n]+?)\*\*/g,
          '<strong class="font-bold text-gray-900 dark:text-white">$1</strong>',
        )
        .replace(
          /__([^_\n]+?)__/g,
          '<strong class="font-bold text-gray-900 dark:text-white">$1</strong>',
        )
        .replace(
          /(?<=^|\s|[()\[\]{}'"`])\*([^\s\*](?:[^*]*?[^\s\*])?)\*(?=\s|$|[.,;:!?()\[\]{}'"`])/g,
          '<em class="italic text-gray-900 dark:text-slate-100">$1</em>',
        )
        .replace(
          /(?<=^|\s|[()\[\]{}'"`])_([^\s_](?:[^_]*?[^\s_])?)_(?=\s|$|[.,;:!?()\[\]{}'"`])/g,
          '<em class="italic text-gray-900 dark:text-slate-100">$1</em>',
        )
        .replace(
          /~~([^~\n]+?)~~/g,
          '<del class="line-through text-gray-400 dark:text-slate-500" style="text-decoration: line-through;">$1</del>',
        );

      // Restore placeholders
      html = html.replace(
        /\x01FOOTNOTE_(\d+)\x01/g,
        (m, idx) => footnotes[idx],
      );
      html = html.replace(/\x01LINK_(\d+)\x01/g, (m, idx) => links[idx]);
      html = html.replace(/\x01IMAGE_(\d+)\x01/g, (m, idx) => images[idx]);
      html = html.replace(
        /\x01INLINEMATH_(\d+)\x01/g,
        (m, idx) => inlineMaths[idx],
      );
      html = html.replace(
        /\x01INLINECODE_(\d+)\x01/g,
        (m, idx) => inlineCodes[idx],
      );
      html = html.replace(/\x01LOGO_(\d+)\x01/g, (m, idx) => logoBlocks[idx]);

      return html;
    };

    const lines = temp.split(/\r?\n/);
    const compiledBlocks = [];

    let currentParagraphLines = [];
    let currentListItems = [];
    let currentBlockquoteLines = [];
    let currentTableRows = [];

    const compileList = (listLines) => {
      if (listLines.length === 0) return "";

      let html = "";
      const stack = []; // keeps track of open tags and their indents: { tag, indent }

      for (let i = 0; i < listLines.length; i++) {
        const item = listLines[i];

        // Find if we need to close nested lists
        while (
          stack.length > 0 &&
          stack[stack.length - 1].indent > item.indent
        ) {
          const closed = stack.pop();
          html += `</li></${closed.tag}>`;
        }

        if (stack.length === 0) {
          // Open new root list
          stack.push({ tag: item.type, indent: item.indent });
          const listClass =
            item.type === "ol"
              ? "list-decimal pl-6 mb-3"
              : "list-disc pl-6 mb-3";
          html += `<${item.type} class="${listClass}">`;
        } else if (item.indent > stack[stack.length - 1].indent) {
          // Open nested list inside the current list item
          stack.push({ tag: item.type, indent: item.indent });
          const listClass =
            item.type === "ol"
              ? "list-decimal pl-5 my-1"
              : "list-disc pl-5 my-1";
          html += `<${item.type} class="${listClass}">`;
        } else if (
          item.indent === stack[stack.length - 1].indent &&
          item.type !== stack[stack.length - 1].tag
        ) {
          // Same indent level but different list type
          const closed = stack.pop();
          html += `</li></${closed.tag}>`;

          stack.push({ tag: item.type, indent: item.indent });
          const listClass =
            item.type === "ol"
              ? "list-decimal pl-6 mb-3"
              : "list-disc pl-6 mb-3";
          html += `<${item.type} class="${listClass}">`;
        } else {
          // Same indent, same list type. Just close the previous list item
          html += `</li>`;
        }

        // Now render the current list item
        let itemContent = "";
        if (item.isTask) {
          const checkEl = item.checked
            ? `<span class="pdf-checkmark-span">✓</span>`
            : `<span class="pdf-checkbox-unchecked-span"></span>`;
          itemContent = `${checkEl}<span class="select-text">${parseInline(item.text)}</span>`;
        } else {
          itemContent = `<span class="select-text">${parseInline(item.text)}</span>`;
        }

        const liClass = item.isTask
          ? "flex items-start mb-1 text-sm list-none text-left"
          : "mb-1 text-sm text-gray-700 dark:text-slate-350 text-left";
        html += `<li class="${liClass}">${itemContent}`;
      }

      // Close any remaining open lists on the stack
      while (stack.length > 0) {
        const closed = stack.pop();
        html += `</li></${closed.tag}>`;
      }

      return html;
    };

    const flushParagraph = () => {
      if (currentParagraphLines.length > 0) {
        const parsedLines = currentParagraphLines.map((line) =>
          parseInline(line),
        );
        const text = parsedLines.join("<br />");
        compiledBlocks.push(
          `<p class="mb-3 leading-relaxed text-justify text-gray-700 dark:text-slate-350 text-sm select-text">${text}</p>`,
        );
        currentParagraphLines = [];
      }
    };

    const flushList = () => {
      if (currentListItems.length > 0) {
        const listHtml = compileList(currentListItems);
        compiledBlocks.push(listHtml);
        currentListItems = [];
      }
    };

    const flushBlockquote = () => {
      if (currentBlockquoteLines.length > 0) {
        const parsedLines = currentBlockquoteLines.map((line) =>
          parseInline(line),
        );
        const content = parsedLines.join("<br />");
        compiledBlocks.push(
          `<blockquote class="border-l-4 border-indigo-500 dark:border-indigo-400 bg-gray-100/70 dark:bg-slate-900/60 py-2.5 pr-4 pl-4 italic my-4 text-gray-600 dark:text-slate-400 rounded-r-lg select-text text-left">${content}</blockquote>`,
        );
        currentBlockquoteLines = [];
      }
    };

    const flushTable = () => {
      if (currentTableRows.length > 0) {
        const parsedRows = currentTableRows.map((rowStr) => {
          let cleaned = rowStr.trim();
          if (cleaned.startsWith("|")) cleaned = cleaned.slice(1);
          if (cleaned.endsWith("|")) cleaned = cleaned.slice(0, -1);
          return cleaned.split("|").map((cell) => cell.trim());
        });

        let hasHeader = false;
        let startIndex = 0;
        let headerRow = [];

        if (parsedRows.length > 1) {
          const secondRow = parsedRows[1];
          const isSeparator = secondRow.every((cell) => /^:?-+:?$/.test(cell));
          if (isSeparator) {
            hasHeader = true;
            headerRow = parsedRows[0];
            startIndex = 2;
          }
        }

        let tableHtml = `<table class="min-w-full divide-y divide-gray-200 dark:divide-slate-800 border border-gray-200 dark:border-slate-800 my-4 text-xs select-text">`;
        if (hasHeader) {
          tableHtml += `<thead class="bg-gray-50 dark:bg-slate-900"><tr>`;
          headerRow.forEach((cell) => {
            tableHtml += `<th class="px-4 py-2 text-left font-bold text-gray-900 dark:text-slate-100 border-b border-gray-200 dark:border-slate-800">${parseInline(cell)}</th>`;
          });
          tableHtml += `</tr></thead>`;
        }

        tableHtml += `<tbody class="divide-y divide-gray-150 dark:divide-slate-850 bg-white dark:bg-slate-950/40">`;
        for (let i = startIndex; i < parsedRows.length; i++) {
          tableHtml += `<tr>`;
          parsedRows[i].forEach((cell) => {
            tableHtml += `<td class="px-4 py-2 text-gray-700 dark:text-slate-350 border-b border-gray-150 dark:border-slate-850/80">${parseInline(cell)}</td>`;
          });
          tableHtml += `</tr>`;
        }
        tableHtml += `</tbody></table>`;
        compiledBlocks.push(tableHtml);
        currentTableRows = [];
      }
    };

    const flushAll = () => {
      flushParagraph();
      flushList();
      flushBlockquote();
      flushTable();
    };

    let consecutiveNewlines = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();

      const codeBlockMatch = trimmed.match(/^\x02CODEBLOCK_(\d+)\x02$/);
      const mathBlockMatch = trimmed.match(/^\x02MATHBLOCK_(\d+)\x02$/);

      if (codeBlockMatch) {
        flushAll();
        const idx = parseInt(codeBlockMatch[1], 10);
        compiledBlocks.push(codeBlocks[idx]);
        consecutiveNewlines = 0;
        continue;
      }

      if (mathBlockMatch) {
        flushAll();
        const idx = parseInt(mathBlockMatch[1], 10);
        compiledBlocks.push(mathBlocks[idx]);
        consecutiveNewlines = 0;
        continue;
      }

      if (trimmed === "") {
        consecutiveNewlines++;
        flushAll();
        if (consecutiveNewlines === 1) {
          compiledBlocks.push('<div class="h-2"></div>');
        }
        continue;
      }

      consecutiveNewlines = 0;

      // check if this is a list item continuation line
      if (
        currentListItems.length > 0 &&
        line.match(/^\s/) && // Must have some indentation to continue a list item
        !trimmed.match(/^[-*+]\s+/) &&
        !trimmed.match(/^\d+\.\s+/) &&
        !trimmed.match(/^#/) &&
        !trimmed.match(/^(?:---|[*]{3}|_{3})$/) &&
        !trimmed.match(/^>/) &&
        !trimmed.match(/^\|/) &&
        !trimmed.match(/^\[\^([^\]\n]+)\]:/)
      ) {
        const lastItem = currentListItems[currentListItems.length - 1];
        lastItem.text += " " + trimmed;
        continue;
      }

      // 1. Manual Page Break
      if (trimmed === "---") {
        flushAll();
        compiledBlocks.push('<div data-page-break="true"></div>');
        continue;
      }

      // 2. Horizontal Rules
      if (trimmed === "***" || trimmed === "___") {
        flushAll();
        compiledBlocks.push(
          '<hr class="my-6 border-t border-gray-200 dark:border-slate-800" />',
        );
        continue;
      }

      // 3. Headings
      const headingMatch = line.match(/^([#]{1,6})\s+(.+)$/);
      if (headingMatch) {
        flushAll();
        const level = headingMatch[1].length;
        const headingText = headingMatch[2];

        let alignment = "left";
        let cleanHeadingText = headingText;
        const alignMatch = headingText.match(
          /^\[(left|center|right)\]\s*(.*)$/i,
        );
        if (alignMatch) {
          alignment = alignMatch[1].toLowerCase();
          cleanHeadingText = alignMatch[2];
        }

        const headingClass =
          level === 1
            ? `!text-3xl font-bold text-gray-900 dark:text-gray-900 mt-6 mb-4 text-${alignment}`
            : level === 2
              ? `!text-2xl font-bold text-gray-800 dark:text-gray-800 mt-5 mb-3 text-${alignment}`
              : level === 3
                ? `!text-xl font-semibold text-gray-700 dark:text-gray-700 mt-4 mb-2 text-${alignment}`
                : level === 4
                  ? `!text-lg font-semibold text-gray-700 dark:text-gray-700 mt-3 mb-2 text-${alignment}`
                  : level === 5
                    ? `!text-base font-semibold text-gray-650 dark:text-gray-650 mt-2 mb-1 text-${alignment}`
                    : `!text-sm font-semibold text-gray-600 dark:text-gray-600 mt-2 mb-1 text-${alignment}`;

        compiledBlocks.push(
          `<h${level} class="${headingClass} select-text">${parseInline(cleanHeadingText)}</h${level}>`,
        );
        continue;
      }

      // 4. Blockquotes
      const blockquoteMatch = line.match(/^>\s*(.*)$/);
      if (blockquoteMatch) {
        flushParagraph();
        flushList();
        flushTable();
        currentBlockquoteLines.push(blockquoteMatch[1]);
        continue;
      }

      // 5. Tables
      if (trimmed.startsWith("|")) {
        flushParagraph();
        flushList();
        flushBlockquote();
        currentTableRows.push(line);
        continue;
      }

      // 6. Footnote Definition
      const footnoteDefMatch = line.match(/^\[\^([^\]\n]+)\]:\s+(.*)$/);
      if (footnoteDefMatch) {
        flushAll();
        const label = footnoteDefMatch[1];
        const content = footnoteDefMatch[2];
        compiledBlocks.push(
          `<div id="fn-${label}" class="text-xs text-gray-500 dark:text-slate-450 mt-3 pl-4 border-l border-indigo-200 dark:border-indigo-850 select-text"><sup>${label}</sup> ${parseInline(content)}</div>`,
        );
        continue;
      }

      // 7. Unordered Lists
      const ulMatch = line.match(/^(\s*)[-*+]\s+(.*)$/);
      if (ulMatch) {
        flushParagraph();
        flushBlockquote();
        flushTable();

        const indentStr = ulMatch[1] || "";
        const indent = indentStr.replace(/\t/g, "    ").length;

        const text = ulMatch[2];
        const taskMatch = text.match(/^\[([ xX])\]\s*(.*)$/);
        const isTask = !!taskMatch;
        const checked = isTask && taskMatch[1].toLowerCase() === "x";
        const cleanText = isTask ? taskMatch[2] : text;

        currentListItems.push({
          indent,
          type: "ul",
          isTask,
          checked,
          text: cleanText,
        });
        continue;
      }

      // 8. Ordered Lists
      const olMatch = line.match(/^(\s*)\d+\.\s+(.*)$/);
      if (olMatch) {
        flushParagraph();
        flushBlockquote();
        flushTable();

        const indentStr = olMatch[1] || "";
        const indent = indentStr.replace(/\t/g, "    ").length;

        const text = olMatch[2];
        const taskMatch = text.match(/^\[([ xX])\]\s*(.*)$/);
        const isTask = !!taskMatch;
        const checked = isTask && taskMatch[1].toLowerCase() === "x";
        const cleanText = isTask ? taskMatch[2] : text;

        currentListItems.push({
          indent,
          type: "ol",
          isTask,
          checked,
          text: cleanText,
        });
        continue;
      }

      // 9. Plain Paragraph line
      flushList();
      flushBlockquote();
      flushTable();
      currentParagraphLines.push(trimmed);
    }

    flushAll();

    return compiledBlocks.join("\n");
  };

  // Load page data
  useEffect(() => {
    if (!coopId || !auditId) return;

    const loadData = async () => {
      setLoading(true);
      try {
        let auditOrgData = null;
        try {
          auditOrgData = await fetchAuditorAuditOrg();
          console.log("audit org data", auditOrgData?.auditOrg);
          setAuditOrg(auditOrgData.auditOrg);
        } catch (e) {
          console.error("Failed to fetch audit organization: ", e);
        }

        const [coopData, auditHistory] = await Promise.all([
          getCoopById(coopId),
          getAuditHistoryById(auditId),
        ]);

        setCooperative(coopData);
        setAuditDoc(auditHistory);

        const macroCtx = resolveMacroContext(
          auditHistory,
          coopData,
          auditOrgData,
        );
        setMacros(macroCtx);

        if (auditHistory.rawReportData) {
          const cleanedText = cleanMarkdown(auditHistory.rawReportData);
          setMarkdown(cleanedText);
          setCompiledHtml(compileReport(cleanedText, macroCtx));
        } else {
          const cleanedText = cleanMarkdown(DEFAULT_TEMPLATE);
          setMarkdown(cleanedText);
          setCompiledHtml(compileReport(cleanedText, macroCtx));
        }
      } catch (err) {
        console.error(err);
        toast.error("Failed to load report workspace data.");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [coopId, auditId]);

  // Helper to copy attributes from source element to target element
  const copyAttributes = (source, target) => {
    Array.from(source.attributes).forEach((attr) => {
      target.setAttribute(attr.name, attr.value);
    });
  };

  // Helper to split OL/UL list elements when they overflow the page limit
  const splitListElement = (
    originalList,
    targetPage,
    limit,
    isFirstElementOnPage,
  ) => {
    const targetList = document.createElement(originalList.tagName);
    copyAttributes(originalList, targetList);
    targetPage.appendChild(targetList);

    const listChildren = Array.from(originalList.children);
    let addedAny = false;

    for (let j = 0; j < listChildren.length; j++) {
      const child = listChildren[j];

      if (child.tagName === "UL" || child.tagName === "OL") {
        const splitResult = splitListElement(
          child,
          targetPage,
          limit,
          isFirstElementOnPage && !addedAny,
        );
        if (splitResult.addedAny) {
          addedAny = true;
        }

        if (splitResult.hasRemaining) {
          const remainingList = document.createElement(originalList.tagName);
          copyAttributes(originalList, remainingList);

          if (originalList.tagName === "OL") {
            const originalStart = parseInt(
              originalList.getAttribute("start") || "1",
              10,
            );
            const numItemsOnPage = Array.from(targetList.children).filter(
              (c) => c.tagName === "LI",
            ).length;
            remainingList.setAttribute(
              "start",
              String(originalStart + numItemsOnPage),
            );
          }

          remainingList.appendChild(splitResult.remainingElement);

          for (let k = j + 1; k < listChildren.length; k++) {
            remainingList.appendChild(listChildren[k]);
          }

          return {
            addedAny,
            hasRemaining: true,
            remainingElement: remainingList,
          };
        }
      } else {
        targetList.appendChild(child);
        const currentHeight = targetPage.offsetHeight;

        if (
          currentHeight <= limit ||
          (j === 0 && isFirstElementOnPage && !addedAny)
        ) {
          addedAny = true;
        } else {
          targetList.removeChild(child);

          const remainingList = document.createElement(originalList.tagName);
          copyAttributes(originalList, remainingList);

          if (originalList.tagName === "OL") {
            const originalStart = parseInt(
              originalList.getAttribute("start") || "1",
              10,
            );
            const numItemsOnPage = Array.from(targetList.children).filter(
              (c) => c.tagName === "LI",
            ).length;
            remainingList.setAttribute(
              "start",
              String(originalStart + numItemsOnPage),
            );
          }

          for (let k = j; k < listChildren.length; k++) {
            remainingList.appendChild(listChildren[k]);
          }

          if (targetList.children.length === 0) {
            targetPage.removeChild(targetList);
          }

          return {
            addedAny,
            hasRemaining: true,
            remainingElement: remainingList,
          };
        }
      }
    }

    return {
      addedAny,
      hasRemaining: false,
      remainingElement: null,
    };
  };

  // Client-side DOM-splitting pagination hook
  useEffect(() => {
    const container = hiddenContainerRef.current;
    if (!container || !compiledHtml) {
      setCompiledPages([]);
      return;
    }

    const runPagination = () => {
      container.innerHTML = "";

      const sourceEl = document.createElement("div");
      sourceEl.innerHTML = compiledHtml;

      const elementsQueue = Array.from(sourceEl.children);
      const pages = [];
      const format = PAGE_FORMATS[pageFormat] || PAGE_FORMATS.A4;

      while (elementsQueue.length > 0) {
        const pageIndex = pages.length;
        // Deduct 24mm to account for Letterhead header (16mm) and Footer (8mm) heights on body pages.
        const limit = (format.baseLimitMm - 24) * 3.77953;

        const targetPage = document.createElement("div");
        targetPage.className =
          "pb-8 leading-relaxed prose-sm prose text-gray-800 break-words max-w-none";
        targetPage.style.width = `${format.contentWidthMm}mm`;
        container.appendChild(targetPage);

        let isFirstElementOnPage = true;

        while (elementsQueue.length > 0) {
          const el = elementsQueue[0];

          if (el.getAttribute("data-page-break") === "true") {
            elementsQueue.shift();
            break;
          }

          targetPage.appendChild(el);
          const height = targetPage.offsetHeight;

          if (height <= limit) {
            elementsQueue.shift();
            isFirstElementOnPage = false;
          } else {
            targetPage.removeChild(el);

            if (el.tagName === "UL" || el.tagName === "OL") {
              const splitResult = splitListElement(
                el,
                targetPage,
                limit,
                isFirstElementOnPage,
              );
              if (splitResult.hasRemaining) {
                elementsQueue[0] = splitResult.remainingElement;
              } else {
                elementsQueue.shift();
              }
              break;
            } else if (el.tagName === "TABLE") {
              const thead = el.querySelector("thead");
              const tbody = el.querySelector("tbody");
              const rows = tbody ? Array.from(tbody.rows) : [];

              if (rows.length === 0) {
                if (isFirstElementOnPage) {
                  targetPage.appendChild(el);
                  elementsQueue.shift();
                }
                break;
              }

              const targetTable = document.createElement("table");
              copyAttributes(el, targetTable);
              if (thead) {
                targetTable.appendChild(thead.cloneNode(true));
              }
              const targetTbody = document.createElement("tbody");
              targetTable.appendChild(targetTbody);
              targetPage.appendChild(targetTable);

              let tableHeaderHeight = targetPage.offsetHeight;
              if (tableHeaderHeight > limit && !isFirstElementOnPage) {
                targetPage.removeChild(targetTable);
                break;
              }

              let addedAnyRow = false;
              for (let j = 0; j < rows.length; j++) {
                const row = rows[j];
                targetTbody.appendChild(row);

                const currentHeight = targetPage.offsetHeight;
                if (
                  currentHeight <= limit ||
                  (j === 0 && isFirstElementOnPage)
                ) {
                  addedAnyRow = true;
                } else {
                  targetTbody.removeChild(row);

                  const remainingTable = document.createElement("table");
                  copyAttributes(el, remainingTable);
                  if (thead) {
                    remainingTable.appendChild(thead.cloneNode(true));
                  }
                  const remainingTbody = document.createElement("tbody");
                  remainingTable.appendChild(remainingTbody);

                  for (let k = j; k < rows.length; k++) {
                    remainingTbody.appendChild(rows[k]);
                  }

                  elementsQueue[0] = remainingTable;
                  break;
                }
              }

              if (!addedAnyRow) {
                targetPage.removeChild(targetTable);
                if (isFirstElementOnPage) {
                  const forcedTable = document.createElement("table");
                  copyAttributes(el, forcedTable);
                  if (thead) forcedTable.appendChild(thead.cloneNode(true));
                  const forcedTbody = document.createElement("tbody");
                  forcedTbody.appendChild(rows[0]);
                  forcedTable.appendChild(forcedTbody);
                  targetPage.appendChild(forcedTable);

                  const remainingTable = document.createElement("table");
                  copyAttributes(el, remainingTable);
                  if (thead) remainingTable.appendChild(thead.cloneNode(true));
                  const remainingTbody = document.createElement("tbody");
                  for (let k = 1; k < rows.length; k++) {
                    remainingTbody.appendChild(rows[k]);
                  }
                  remainingTable.appendChild(remainingTbody);
                  elementsQueue[0] = remainingTable;
                }
              }
              break;
            } else {
              if (isFirstElementOnPage) {
                targetPage.appendChild(el);
                elementsQueue.shift();
              }
              break;
            }
          }
        }

        pages.push(targetPage.innerHTML);
        container.removeChild(targetPage);
      }

      setCompiledPages(pages);
    };

    runPagination();
  }, [compiledHtml, pageFormat]);

  // Initialize CodeMirror editor instance once dynamic imports load
  useEffect(() => {
    if (!editorLoaded || !editorRef.current || !CodeMirrorRefs.current) return;

    const {
      EditorState,
      EditorView,
      keymap,
      placeholder,
      Decoration,
      ViewPlugin,
      lineWrapping,
      lineNumbers,
      codemirrorMarkdown,
      defaultKeymap,
      history,
      historyKeymap,
    } = CodeMirrorRefs.current;

    // Macro and Markdown syntax highlighter decoration plugin
    const macroDecorator = ViewPlugin.fromClass(
      class {
        constructor(view) {
          this.decorations = this.getDecorations(view);
        }
        update(update) {
          if (update.docChanged || update.viewportChanged) {
            this.decorations = this.getDecorations(update.view);
          }
        }
        getDecorations(view) {
          const builder = [];
          const text = view.state.doc.toString();
          const covered = [];

          const addDecoration = (from, to, className) => {
            if (from >= to) return;
            // Check for overlaps with already covered ranges
            for (let i = 0; i < covered.length; i++) {
              if (from < covered[i].to && to > covered[i].from) {
                return; // Overlap, skip
              }
            }
            builder.push(
              Decoration.mark({
                class: className,
              }).range(from, to),
            );
            covered.push({ from, to });
          };

          const matchAndDecorate = (regex, className) => {
            let match;
            regex.lastIndex = 0;
            while ((match = regex.exec(text)) !== null) {
              const from = match.index;
              const to = from + match[0].length;
              if (from === to) {
                regex.lastIndex++;
                continue;
              }
              addDecoration(from, to, className);
            }
          };

          // 1. Code blocks (highest priority)
          matchAndDecorate(/```[\s\S]*?```/g, "cm-codeblock-token");

          // 2. Math blocks
          matchAndDecorate(/\$\$[\s\S]*?\$\$/g, "cm-math-token");

          // 3. Tables
          matchAndDecorate(/^\|.+\|$/gm, "cm-table-token");

          // 4. Macros: {{ ... }}
          matchAndDecorate(/\{\{[^{\s}]+\}\}/g, "cm-macro-token");

          // 5. Images
          matchAndDecorate(/!\[.*?\]\(.*?\)/g, "cm-image-token");

          // 6. Links
          matchAndDecorate(/(?<!\!)\[.*?\]\(.*?\)/g, "cm-link-token");

          // 7. Inline Code
          matchAndDecorate(/`([^`\n]+?)`/g, "cm-inlinecode-token");

          // 8. Inline Math
          matchAndDecorate(/\$[^\$\n]+?\$/g, "cm-math-token");

          // 9. Footnotes Inline Ref
          matchAndDecorate(/\[\^[^\]\n]+\]/g, "cm-footnote-token");

          // 10. Horizontal Rules (Dividers)
          matchAndDecorate(/^(?:---|[*]{3}|_{3})$/gm, "cm-pagebreak-token");

          // 11. Section headers (H1 to H6)
          matchAndDecorate(/^#+\s+.+$/gm, "cm-header-token");

          // 12. Bold (space-separated)
          matchAndDecorate(/\*\*([^\*\n]+?)\*\*/g, "cm-bold-token");
          matchAndDecorate(/__([^_\n]+?)__/g, "cm-bold-token");

          // 13. Italic (space-separated)
          matchAndDecorate(
            /(?<=^|\s|[()\[\]{}'"`])\*([^\s\*](?:[^*]*?[^\s\*])?)\*(?=\s|$|[.,;:!?()\[\]{}'"`])/g,
            "cm-italic-token",
          );
          matchAndDecorate(
            /(?<=^|\s|[()\[\]{}'"`])_([^\s_](?:[^_]*?[^\s_])?)_(?=\s|$|[.,;:!?()\[\]{}'"`])/g,
            "cm-italic-token",
          );

          // 14. Strikethrough (space-separated)
          matchAndDecorate(/~~([^~\n]+?)~~/g, "cm-strikethrough-token");

          // 15. List markers (e.g. * or - or 1.)
          matchAndDecorate(/^\s*(?:[-*+]|\d+\.)(?=\s)/gm, "cm-list-token");

          // 16. Blockquotes (e.g. > text)
          matchAndDecorate(/^\s*>.+$/gm, "cm-blockquote-token");

          builder.sort((a, b) => a.from - b.from);
          return Decoration.set(builder);
        }
      },
      {
        decorations: (v) => v.decorations,
      },
    );

    const customTheme = EditorView.theme({
      "&": {
        height: "100%",
        width: "100%",
        maxWidth: "100%",
        minWidth: "0 !important",
        backgroundColor: "transparent",
        color: "#1e293b", // Slate 800
      },
      "&.cm-focused": {
        outline: "none",
      },
      ".dark &": {
        color: "#f1f5f9", // Slate 100
      },
      ".cm-cursor, .cm-dropCursor": {
        borderLeftColor: "#1e293b",
      },
      ".dark & .cm-cursor, .dark & .cm-dropCursor": {
        borderLeftColor: "#ffffff !important",
      },
      ".cm-scroller": {
        overflow: "auto",
        fontFamily: "var(--font-mono, monospace)",
      },
      ".cm-content": {
        padding: "16px",
        fontFamily: "var(--font-mono, monospace)",
        lineHeight: "1.6",
        color: "inherit",
        whiteSpace: "pre-wrap !important",
        overflowWrap: "break-word !important",
        wordBreak: "break-word !important",
        caretColor: "#1e293b",
      },
      ".dark & .cm-content": {
        caretColor: "#ffffff !important",
      },
      ".cm-selectionBackground": {
        backgroundColor: "rgba(99, 102, 241, 0.2) !important",
      },
      ".cm-gutters": {
        backgroundColor: "#f8fafc",
        color: "#64748b",
        borderRight: "1px solid #e2e8f0",
      },
      ".dark & .cm-gutters": {
        backgroundColor: "#020617",
        color: "#475569",
        borderRight: "1px solid #1e293b",
      },
      ".cm-activeLine": {
        backgroundColor: "rgba(241, 245, 249, 0.4)",
      },
      ".dark & .cm-activeLine": {
        backgroundColor: "rgba(30, 41, 59, 0.3)",
      },
      ".cm-activeLineGutter": {
        backgroundColor: "rgba(241, 245, 249, 0.7)",
      },
      ".dark & .cm-activeLineGutter": {
        backgroundColor: "rgba(30, 41, 59, 0.5)",
      },
      ".cm-macro-token": {
        backgroundColor: "rgba(224, 231, 255, 0.9)",
        color: "#4338ca",
        border: "1px solid #c7d2fe",
        borderRadius: "4px",
        padding: "1px 4px",
        fontWeight: "bold",
        fontSize: "11px",
      },
      ".dark & .cm-macro-token": {
        backgroundColor: "rgba(49, 46, 129, 0.6)",
        color: "#a5b4fc",
        borderColor: "rgba(67, 56, 202, 0.4)",
      },
      ".cm-pagebreak-token": {
        color: "#6366f1",
        fontWeight: "bold",
        borderBottom: "1px dashed #818cf8",
        padding: "0 2px",
      },
      ".dark & .cm-pagebreak-token": {
        color: "#818cf8",
        borderBottomColor: "#4f46e5",
      },
      ".cm-bold-token": {
        fontWeight: "bold",
        color: "#d97706",
      },
      ".dark & .cm-bold-token": {
        color: "#fbbf24",
      },
      ".cm-italic-token": {
        fontStyle: "italic",
        color: "#059669",
      },
      ".dark & .cm-italic-token": {
        color: "#34d399",
      },
      ".cm-strikethrough-token": {
        textDecoration: "line-through",
        color: "#94a3b8",
      },
      ".dark & .cm-strikethrough-token": {
        color: "#64748b",
      },
      ".cm-header-token": {
        fontWeight: "bold",
        color: "#4f46e5",
      },
      ".dark & .cm-header-token": {
        color: "#818cf8",
      },
      ".cm-list-token": {
        fontWeight: 600,
        color: "#2563eb",
      },
      ".dark & .cm-list-token": {
        color: "#60a5fa",
      },
      ".cm-blockquote-token": {
        fontStyle: "italic",
        color: "#4b5563",
        borderLeft: "4px solid #6366f1",
        backgroundColor: "rgba(243, 244, 246, 0.6)",
        paddingLeft: "16px",
        paddingRight: "8px",
        paddingTop: "4px",
        paddingBottom: "4px",
        borderTopRightRadius: "4px",
        borderBottomRightRadius: "4px",
        display: "inline-block",
        width: "100%",
      },
      ".dark & .cm-blockquote-token": {
        color: "#94a3b8",
        borderLeftColor: "#818cf8",
        backgroundColor: "rgba(30, 41, 59, 0.4)",
      },
      ".cm-link-token": {
        color: "#2563eb",
        textDecoration: "underline",
      },
      ".dark & .cm-link-token": {
        color: "#60a5fa",
      },
      ".cm-image-token": {
        color: "#059669",
        fontWeight: "bold",
      },
      ".dark & .cm-image-token": {
        color: "#34d399",
      },
      ".cm-footnote-token": {
        color: "#7c3aed",
      },
      ".dark & .cm-footnote-token": {
        color: "#a78bfa",
      },
      ".cm-inlinecode-token": {
        fontFamily: "var(--font-mono, monospace)",
        backgroundColor: "#f1f5f9",
        color: "#e11d48",
        padding: "1px 3px",
        borderRadius: "3px",
        border: "1px solid #e2e8f0",
      },
      ".dark & .cm-inlinecode-token": {
        backgroundColor: "#1e293b",
        color: "#fda4af",
        borderColor: "#334155",
      },
      ".cm-codeblock-token": {
        fontFamily: "var(--font-mono, monospace)",
        backgroundColor: "#f1f5f9",
        color: "#0f172a",
        border: "1px solid #e2e8f0",
        borderRadius: "4px",
        padding: "2px 4px",
      },
      ".dark & .cm-codeblock-token": {
        backgroundColor: "#0f172a",
        color: "#cbd5e1",
        borderColor: "#1e293b",
      },
      ".cm-math-token": {
        fontFamily: "serif",
        fontStyle: "italic",
        color: "#4f46e5",
        backgroundColor: "rgba(238, 242, 255, 0.4)",
      },
      ".dark & .cm-math-token": {
        color: "#a5b4fc",
        backgroundColor: "rgba(49, 46, 129, 0.2)",
      },
      ".cm-table-token": {
        fontFamily: "var(--font-mono, monospace)",
        color: "#0284c7",
        backgroundColor: "rgba(240, 249, 255, 0.3)",
      },
      ".dark & .cm-table-token": {
        color: "#38bdf8",
        backgroundColor: "rgba(7, 89, 133, 0.1)",
      },
    });

    const state = EditorState.create({
      doc: markdown || "",
      extensions: [
        codemirrorMarkdown(),
        lineNumbers(),
        lineWrapping,
        history(),
        keymap.of([
          ...defaultKeymap,
          ...historyKeymap,
          {
            key: "Mod-s",
            run: () => {
              if (handleCtrlSRef.current) {
                handleCtrlSRef.current();
              }
              return true;
            },
          },
        ]),
        macroDecorator,
        customTheme,
        placeholder("Schreibe deinen Bericht hier..."),
        ...(auditDoc?.auditReportUrl
          ? [EditorState.readOnly.of(true), EditorView.editable.of(false)]
          : []),
        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            const val = update.state.doc.toString();
            setMarkdown(val);
          }

          if (update.docChanged || update.selectionSet) {
            const text = update.state.doc.toString();
            const head = update.state.selection.main.head;

            const threeCharsBefore =
              head >= 3 ? text.substring(head - 3, head) : "";
            if (threeCharsBefore === "{{/" || threeCharsBefore === "{{@") {
              const trigger = threeCharsBefore.endsWith("/") ? "/" : "@";
              setShowAutocomplete(true);
              setAutocompleteTrigger(trigger);
              setAutocompleteQuery("");

              const coords = update.view.coordsAtPos(head);
              if (coords) {
                const rect = editorRef.current?.getBoundingClientRect();
                if (rect) {
                  setAutocompleteCoords({
                    top: coords.bottom - rect.top + 4,
                    left: Math.min(coords.left - rect.left, rect.width - 280),
                  });
                }
              }
            } else if (showAutocomplete) {
              const beforeCursor = text.substring(0, head);
              const lastTriggerIdx = Math.max(
                beforeCursor.lastIndexOf("/"),
                beforeCursor.lastIndexOf("@"),
              );
              if (lastTriggerIdx === -1) {
                setShowAutocomplete(false);
                setAutocompleteTrigger("");
              } else {
                const triggerPrefix =
                  lastTriggerIdx >= 2
                    ? beforeCursor.substring(
                        lastTriggerIdx - 2,
                        lastTriggerIdx + 1,
                      )
                    : "";
                const afterTriggerText = beforeCursor.substring(
                  lastTriggerIdx + 1,
                );
                if (
                  (triggerPrefix !== "{{/" && triggerPrefix !== "{{@") ||
                  /\s/.test(afterTriggerText)
                ) {
                  setShowAutocomplete(false);
                  setAutocompleteTrigger("");
                } else {
                  setAutocompleteQuery(afterTriggerText);
                  const trigger = triggerPrefix.endsWith("/") ? "/" : "@";
                  setAutocompleteTrigger(trigger);
                }
              }
            }
          }
        }),
      ],
    });

    const view = new EditorView({
      state,
      parent: editorRef.current,
    });

    viewRef.current = view;

    const editorScrollDOM = view.scrollDOM;
    const scrollListener = (e) => {
      if (onEditorScrollRef.current) {
        onEditorScrollRef.current(e);
      }
    };
    if (editorScrollDOM) {
      editorScrollDOM.addEventListener("scroll", scrollListener);
    }

    return () => {
      if (editorScrollDOM) {
        editorScrollDOM.removeEventListener("scroll", scrollListener);
      }
      view.destroy();
    };
  }, [editorLoaded, loading, auditDoc?.auditReportUrl]);

  // Sync state change from outside (like loading from DB)
  useEffect(() => {
    const view = viewRef.current;
    if (view && markdown !== view.state.doc.toString()) {
      view.dispatch({
        changes: { from: 0, to: view.state.doc.length, insert: markdown || "" },
      });
    }
  }, [markdown]);

  const canGenerateReport =
    auditDoc?.status === "APPROVED" || auditDoc?.status === "REJECTED";

  // Debounced auto-save effect
  useEffect(() => {
    if (
      !markdown ||
      !auditId ||
      loading ||
      auditDoc?.auditReportUrl ||
      !canGenerateReport
    )
      return;

    const timer = setTimeout(async () => {
      setSaving(true);
      try {
        const res = await fetch(
          `/api/auditServices/auditHistory/byId/${auditId}`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              rawReportData: markdown,
              macros: JSON.stringify(macros),
            }),
          },
        );
        const result = await res.json();
        if (result.success) {
          setLastSavedTime(new Date().toLocaleTimeString());
        }
      } catch (err) {
        console.error("Auto-save failed:", err);
      } finally {
        setSaving(false);
      }
    }, 1500);

    return () => clearTimeout(timer);
  }, [
    markdown,
    macros,
    auditId,
    loading,
    auditDoc?.auditReportUrl,
    canGenerateReport,
  ]);

  // Manual save progress
  const handleSaveProgress = async () => {
    if (auditDoc?.auditReportUrl) {
      toast.error(
        "This report has already been generated. Editing is disabled.",
      );
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(
        `/api/auditServices/auditHistory/byId/${auditId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            rawReportData: markdown,
            macros: JSON.stringify(macros),
          }),
        },
      );
      const result = await res.json();
      if (result.success) {
        setLastSavedTime(new Date().toLocaleTimeString());
        toast.success("Progress saved successfully!");
      } else {
        toast.error("Failed to save progress.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to save progress.");
    } finally {
      setSaving(false);
    }
  };

  const handleCompile = () => {
    setCompiledHtml(compileReport(markdown, macros));
    toast.success("Compiled successfully!");
  };

  // Compile DOM elements to a single PDF using pageFormat via Puppeteer API
  const compilePdf = async () => {
    const pages = document.querySelectorAll(
      ".preview-page-container .preview-page-wrapper-el",
    );
    if (!pages.length) {
      throw new Error("No preview pages to render. Click 'Compile' first.");
    }

    // Extract the inner HTML from all rendered A4 page wrappers
    const pagesHtml = Array.from(pages).map((page) => page.innerHTML);

    try {
      const response = await fetch("/api/auditServices/generatePdf", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          pagesHtml,
          pageFormat,
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(
          errData.error || "Failed to generate PDF on the server.",
        );
      }

      const pdfBlob = await response.blob();
      return pdfBlob;
    } catch (e) {
      console.error("PDF Compilation error:", e);
      throw e;
    }
  };

  const handleDownloadPdf = async () => {
    try {
      toast.loading("Compiling PDF for download...", { id: "pdf" });
      const pdfBlob = await compilePdf();

      const url = window.URL.createObjectURL(pdfBlob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `Pruefungsbericht_${cooperative?.name || "Report"}.pdf`,
      );
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success("PDF downloaded successfully!", { id: "pdf" });
    } catch (e) {
      console.error(e);
      toast.error(e.message || "Failed to download PDF.", { id: "pdf" });
    }
  };

  const handleSubmitReport = async () => {
    if (auditDoc?.auditReportUrl) {
      toast.error(
        "This report has already been generated. Editing is disabled.",
      );
      return;
    }
    setSubmitting(true);
    toast.loading("Compiling and uploading report PDF...", { id: "submit" });
    try {
      const pdfBlob = await compilePdf();

      const fileWrapper = new File(
        [pdfBlob],
        `Pruefungsbericht_${cooperative.name.replace(/[^a-zA-Z0-9]/g, "_")}.pdf`,
        {
          type: "application/pdf",
        },
      );

      const formData = new FormData();
      formData.append("file", fileWrapper);

      const uploadRes = await fetch("/api/auditServices/upload", {
        method: "POST",
        body: formData,
      });

      const uploadResult = await uploadRes.json();
      if (!uploadResult.success) {
        throw new Error(uploadResult.error || "Failed to upload PDF.");
      }

      const fileUrl = uploadResult.fileUrl;

      const patchRes = await fetch(
        `/api/auditServices/auditHistory/byId/${auditId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            rawReportData: markdown,
            macros: JSON.stringify(macros),
            auditReportUrl: fileUrl,
            submit: true,
            coopId: coopId,
            coopName: cooperative.name,
            fiscalYear:
              macros["@fiscalYears"] || new Date().getFullYear().toString(),
            userEmail: user?.email || "auditor@easycoop.de",
          }),
        },
      );

      const patchResult = await patchRes.json();
      if (patchResult.success) {
        toast.success("Report submitted and published successfully!", {
          id: "submit",
        });
        setAuditDoc((prev) => ({ ...prev, auditReportUrl: fileUrl }));
      } else {
        throw new Error(
          patchResult.error || "Failed to save submission metadata.",
        );
      }
    } catch (e) {
      console.error(e);
      toast.error(e.message || "Failed to submit report.", { id: "submit" });
    } finally {
      setSubmitting(false);
    }
  };

  // Suggestion inserting using CodeMirror transactions
  const insertToken = (tokenValue) => {
    const view = viewRef.current;
    if (!view) return;

    const head = view.state.selection.main.head;
    const text = view.state.doc.toString();
    const beforeCursor = text.substring(0, head);

    let isAutocompleteActive = false;
    let triggerIndex = -1;

    if (showAutocomplete) {
      const lastSlashIdx = beforeCursor.lastIndexOf("{{/");
      const lastAtIdx = beforeCursor.lastIndexOf("{{@");
      const activeTriggerStart = Math.max(lastSlashIdx, lastAtIdx);
      if (activeTriggerStart !== -1) {
        triggerIndex = activeTriggerStart + 2;
        const queryText = beforeCursor.substring(triggerIndex + 1);
        if (!/\s/.test(queryText)) {
          isAutocompleteActive = true;
        }
      }
    }

    if (isAutocompleteActive) {
      view.dispatch({
        changes: {
          from: triggerIndex,
          to: head,
          insert: `${tokenValue}}}`,
        },
        selection: {
          anchor: triggerIndex + tokenValue.length + 2,
        },
      });
    } else {
      view.dispatch({
        changes: {
          from: head,
          to: head,
          insert: `{{${tokenValue}}}`,
        },
        selection: {
          anchor: head + tokenValue.length + 4,
        },
      });
    }
    view.focus();
    setShowAutocomplete(false);
    setAutocompleteTrigger("");
  };

  // Insert markdown styling markup using CodeMirror transactions
  const insertStyleMarkup = (prefix, suffix = "") => {
    if (auditDoc?.auditReportUrl) return;
    const view = viewRef.current;
    if (!view) return;

    const { from, to } = view.state.selection.main;
    const selText = view.state.sliceDoc(from, to);

    const bulletRegex = /^\s*[-*+]\s+/;
    const orderedRegex = /^\s*\d+\.\s+/;

    if (prefix === "- " || prefix === "1. ") {
      const isBulletBtn = prefix === "- ";

      if (from !== to && selText.length > 0) {
        // Selection block
        const lines = selText.split("\n");
        const nonSubmittableLines = lines.filter((line) => line.trim() !== "");

        // Determine if we should unlist or format/convert
        const allAreTarget =
          nonSubmittableLines.length > 0 &&
          nonSubmittableLines.every((line) =>
            isBulletBtn ? bulletRegex.test(line) : orderedRegex.test(line),
          );

        let listIndex = 1;
        const mappedLines = lines.map((line) => {
          if (line.trim() === "") return line;

          if (allAreTarget) {
            // Unlist
            return line.replace(
              isBulletBtn ? /^(\s*)[-*+]\s+/ : /^(\s*)\d+\.\s+/,
              "$1",
            );
          } else {
            // List / Convert
            if (isBulletBtn) {
              if (bulletRegex.test(line)) {
                return line;
              } else if (orderedRegex.test(line)) {
                return line.replace(/^(\s*)\d+\.\s+/, "$1- ");
              } else {
                const indentMatch = line.match(/^(\s+)(.*)$/);
                if (indentMatch) return indentMatch[1] + "- " + indentMatch[2];
                return "- " + line;
              }
            } else {
              // Ordered list
              if (orderedRegex.test(line)) {
                const indentMatch = line.match(/^(\s*)\d+\.\s+(.*)$/);
                return indentMatch[1] + `${listIndex++}. ` + indentMatch[2];
              } else if (bulletRegex.test(line)) {
                const indentMatch = line.match(/^(\s*)[-*+]\s+(.*)$/);
                return indentMatch[1] + `${listIndex++}. ` + indentMatch[2];
              } else {
                const indentMatch = line.match(/^(\s+)(.*)$/);
                if (indentMatch)
                  return indentMatch[1] + `${listIndex++}. ` + indentMatch[2];
                return `${listIndex++}. ` + line;
              }
            }
          }
        });

        const replacement = mappedLines.join("\n");
        view.dispatch({
          changes: { from, to, insert: replacement },
          selection: { anchor: from, head: from + replacement.length },
        });
      } else {
        // Collapsed cursor selection
        const lineObj = view.state.doc.lineAt(from);
        const lineText = lineObj.text;

        let newlineText;
        let newPos;

        if (isBulletBtn) {
          if (bulletRegex.test(lineText)) {
            // Unlist
            newlineText = lineText.replace(/^(\s*)[-*+]\s+/, "$1");
            const diff = newlineText.length - lineText.length;
            newPos = Math.max(lineObj.from, from + diff);
          } else if (orderedRegex.test(lineText)) {
            // Convert
            newlineText = lineText.replace(/^(\s*)\d+\.\s+/, "$1- ");
            const diff = newlineText.length - lineText.length;
            newPos = Math.max(lineObj.from, from + diff);
          } else {
            // List
            const indentMatch = lineText.match(/^(\s+)(.*)$/);
            if (indentMatch) {
              newlineText = indentMatch[1] + "- " + indentMatch[2];
            } else {
              newlineText = "- " + lineText;
            }
            newPos = from + 2;
          }
        } else {
          // Numbered list button clicked
          if (orderedRegex.test(lineText)) {
            // Unlist
            newlineText = lineText.replace(/^(\s*)\d+\.\s+/, "$1");
            const diff = newlineText.length - lineText.length;
            newPos = Math.max(lineObj.from, from + diff);
          } else if (bulletRegex.test(lineText)) {
            // Convert
            newlineText = lineText.replace(/^(\s*)[-*+]\s+/, "$11. ");
            const diff = newlineText.length - lineText.length;
            newPos = Math.max(lineObj.from, from + diff);
          } else {
            // List
            const indentMatch = lineText.match(/^(\s+)(.*)$/);
            if (indentMatch) {
              newlineText = indentMatch[1] + "1. " + indentMatch[2];
            } else {
              newlineText = "1. " + lineText;
            }
            newPos = from + 3;
          }
        }

        view.dispatch({
          changes: { from: lineObj.from, to: lineObj.to, insert: newlineText },
          selection: { anchor: newPos, head: newPos },
        });
      }
    } else {
      // General markdown styling (Bold, Italic, Headings, Page Break)
      const replacement = prefix + selText + suffix;
      view.dispatch({
        changes: {
          from,
          to,
          insert: replacement,
        },
        selection: {
          anchor: from + prefix.length,
          head: from + prefix.length + selText.length,
        },
      });
    }
    view.focus();
  };

  const handleSetHeadingAlignment = (alignment) => {
    if (auditDoc?.auditReportUrl) return;
    const view = viewRef.current;
    if (!view) return;

    const { from } = view.state.selection.main;
    const lineObj = view.state.doc.lineAt(from);
    const lineText = lineObj.text;

    // Check if the current line is a heading
    const headingMatch = lineText.match(/^([#]{1,6})\s+(.*)$/);
    if (!headingMatch) {
      toast.error("Cursor must be on a heading line to align it.");
      return;
    }

    const hashes = headingMatch[1];
    let content = headingMatch[2];

    // Strip existing alignment tags if any
    content = content.replace(/^\[(left|center|right)\]\s*/i, "");

    // Prepend new alignment tag if not left (left is default, so we can omit it)
    const newPrefix = alignment === "left" ? "" : `[${alignment}] `;
    const newLineText = `${hashes} ${newPrefix}${content}`;

    view.dispatch({
      changes: {
        from: lineObj.from,
        to: lineObj.to,
        insert: newLineText,
      },
      selection: {
        anchor: Math.min(
          lineObj.from + newLineText.length,
          lineObj.from + (from - lineObj.from) + newPrefix.length,
        ),
      },
    });
    view.focus();
  };

  const filteredMacros = Object.keys(macros).filter((key) => {
    if (autocompleteTrigger) {
      if (!key.startsWith(autocompleteTrigger)) return false;
      const keyWithoutTrigger = key.slice(1);
      return keyWithoutTrigger
        .toLowerCase()
        .includes(autocompleteQuery.toLowerCase());
    }
    return key.toLowerCase().includes(autocompleteQuery.toLowerCase());
  });

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen text-gray-500 bg-gray-50 dark:bg-slate-900 dark:text-slate-400">
        <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
        <p className="mt-4 text-sm font-medium">
          Loading report generator workspace...
        </p>
      </div>
    );
  }

  const logoUrl = cooperative?.logo;
  const hasValidLogo = !!(
    logoUrl &&
    typeof logoUrl === "string" &&
    logoUrl.trim() !== "" &&
    logoUrl !== "null" &&
    logoUrl !== "undefined" &&
    !logoUrl.includes("/audit/report/") &&
    (logoUrl.startsWith("http://") ||
      logoUrl.startsWith("https://") ||
      logoUrl.startsWith("/") ||
      logoUrl.startsWith("data:"))
  );
  const allPages = [
    generateCoverPageHtml(macros, auditOrg),
    generateCertificatePageHtml(macros, auditOrg),
    ...compiledPages,
  ];

  return (
    <div className="flex flex-col h-screen font-sans text-gray-900 bg-gray-50 dark:bg-slate-900 dark:text-slate-100">
      {/* Header bar */}
      <header className="z-30 flex items-center justify-between px-6 py-4 bg-white border-b border-gray-200 shadow-sm dark:bg-slate-950 dark:border-slate-800">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push(`/dashboard?tab=coops&coopId=${coopId}`)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg dark:bg-indigo-950/40 dark:text-indigo-400 dark:hover:bg-indigo-900/40 transition-all border border-indigo-100 dark:border-indigo-900/30"
          >
            <ArrowLeft size={14} />
            Back to Cooperative
          </button>
          <div className="w-px h-5 bg-gray-200 dark:bg-slate-800"></div>
          {cooperative && (
            <div className="flex items-center gap-3">
              {hasValidLogo ? (
                <img
                  src={logoUrl}
                  alt={cooperative.name}
                  className="object-cover w-8 h-8 border border-gray-200 rounded dark:border-slate-800"
                />
              ) : (
                <div className="flex items-center justify-center w-8 h-8 text-xs font-bold border border-gray-200 rounded select-none bg-indigo-50 dark:border-slate-800 dark:bg-indigo-950/40 text-indigo-650 dark:text-indigo-400">
                  {cooperative.name
                    ? cooperative.name.slice(0, 2).toUpperCase()
                    : "CO"}
                </div>
              )}
              <div>
                <h1 className="text-sm font-bold truncate max-w-[200px] sm:max-w-xs">
                  {cooperative.name}
                </h1>
                <p className="text-[10px] text-gray-400 font-medium">
                  Audit report generator workspace
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Auto-save & Status badges */}
        <div className="flex items-center gap-4">
          <div className="text-xs">
            {auditDoc?.auditReportUrl ? (
              <span className="flex items-center gap-1.5 text-rose-600 bg-rose-50 dark:bg-rose-950/20 px-2.5 py-1 rounded-lg border border-rose-200 dark:border-rose-900/30 font-semibold select-none">
                Locked (View Only)
              </span>
            ) : saving ? (
              <span className="flex items-center gap-1.5 text-amber-500 bg-amber-50 dark:bg-amber-950/20 px-2.5 py-1 rounded-lg border border-amber-200 dark:border-amber-900/30">
                <Loader2 size={12} className="animate-spin" /> Auto-saving...
              </span>
            ) : lastSavedTime ? (
              <span className="flex items-center gap-1.5 text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20 px-2.5 py-1 rounded-lg border border-emerald-200 dark:border-emerald-900/30">
                <Check size={12} /> Auto-saved ({lastSavedTime})
              </span>
            ) : null}
          </div>

          {auditDoc?.auditReportUrl && (
            <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900/30">
              <CheckCircle2 size={12} /> Published
            </span>
          )}
        </div>
      </header>

      {/* Editor & Preview dual workspace */}
      <div className="relative flex flex-col flex-1 overflow-hidden lg:flex-row">
        {/* Left Column: Markdown Editor */}
        <div
          style={
            editorLoaded &&
            typeof window !== "undefined" &&
            window.innerWidth >= 1024
              ? { width: `${leftWidth}px`, flexShrink: 0 }
              : {}
          }
          className="relative flex flex-col flex-1 overflow-hidden border-r border-gray-200 lg:flex-none bg-gray-50 dark:bg-slate-950/40 dark:border-slate-800/60"
        >
          {/* Format controls toolbar */}
          <div
            className={`flex flex-wrap items-center justify-between gap-2 px-4 py-2 text-gray-700 bg-white border-b border-gray-200 select-none dark:bg-slate-950 dark:border-slate-800 dark:text-slate-200 ${
              auditDoc?.auditReportUrl
                ? "pointer-events-none opacity-50 select-none"
                : ""
            }`}
          >
            <div className="flex flex-wrap items-center gap-2">
              {/* Edit Front Page Modal Trigger */}
              <button
                onClick={() => setOpenFrontPageModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-indigo-650 hover:bg-indigo-755 rounded-md transition-all active:scale-95 shadow-sm bg-indigo-600 hover:bg-indigo-700"
              >
                <FileText size={13} />
                Edit Front Page
              </button>

              <div className="w-px h-4 bg-gray-300 dark:bg-slate-700"></div>

              {/* Heading Dropdown Button Group */}
              <div
                className="relative flex items-center p-0 rounded-md bg-gray-50 dark:border-slate-700 dark:bg-slate-800"
                ref={headingDropdownRef}
              >
                <button
                  onClick={() =>
                    insertStyleMarkup("#".repeat(activeHeadingLevel) + " ", "")
                  }
                  title={`Heading ${activeHeadingLevel}`}
                  className="flex items-center justify-center p-1 transition-colors rounded-l hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-650 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white"
                >
                  <HeadingIcon level={activeHeadingLevel} />
                </button>
                <div className="w-px h-4 bg-gray-300 dark:bg-slate-700"></div>
                <button
                  onClick={() => setShowHeadingDropdown(!showHeadingDropdown)}
                  title="Select Heading Level"
                  className="flex items-center justify-center p-1 text-gray-400 transition-colors rounded-r dark:text-slate-400 hover:bg-gray-200 dark:hover:bg-slate-700 hover:text-gray-900 dark:hover:text-white"
                >
                  <ChevronDown size={12} />
                </button>

                {showHeadingDropdown && (
                  <div className="absolute left-0 top-full mt-1.5 z-50 flex flex-col bg-white border border-gray-200 rounded-lg shadow-xl py-1 w-36 dark:bg-slate-900 dark:border-slate-800">
                    {[1, 2, 3, 4, 5, 6].map((level) => (
                      <button
                        key={level}
                        onClick={() => {
                          setActiveHeadingLevel(level);
                          insertStyleMarkup("#".repeat(level) + " ", "");
                          setShowHeadingDropdown(false);
                        }}
                        className={`flex items-center gap-2 w-full px-3 py-1.5 text-xs hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors text-left ${activeHeadingLevel === level ? "text-indigo-650 dark:text-indigo-400 font-semibold bg-gray-50 dark:bg-slate-850" : "text-gray-700 dark:text-slate-300"}`}
                      >
                        <HeadingIcon level={level} size={14} />
                        <span>Heading {level}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Text Style Group */}
              <div className="flex items-center overflow-hidden rounded-md bg-gray-50 dark:bg-slate-800">
                <button
                  onClick={() => insertStyleMarkup("**", "**")}
                  title="Bold"
                  className="p-1.5 hover:bg-gray-200 dark:hover:bg-slate-700 rounded transition-colors text-gray-650 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white"
                >
                  <Bold size={12} />
                </button>
                <button
                  onClick={() => insertStyleMarkup("*", "*")}
                  title="Italic"
                  className="p-1.5 hover:bg-gray-200 dark:hover:bg-slate-700 rounded transition-colors text-gray-650 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white"
                >
                  <Italic size={12} />
                </button>
                <button
                  onClick={() => insertStyleMarkup("~~", "~~")}
                  title="Strikethrough"
                  className="p-1.5 hover:bg-gray-200 dark:hover:bg-slate-700 rounded transition-colors text-gray-650 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white"
                >
                  <Strikethrough size={12} />
                </button>
              </div>

              {/* Align Group for Heading Tags */}
              <div className="flex items-center overflow-hidden rounded-md bg-gray-50 dark:bg-slate-800">
                <button
                  onClick={() => handleSetHeadingAlignment("left")}
                  title="Align Left"
                  className="p-1.5 hover:bg-gray-200 dark:hover:bg-slate-700 rounded transition-colors text-gray-650 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white"
                >
                  <svg
                    className="w-3.5 h-3.5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                  >
                    <path d="M17 18H3M21 14H3M17 10H3M21 6H3" />
                  </svg>
                </button>
                <button
                  onClick={() => handleSetHeadingAlignment("center")}
                  title="Align Center"
                  className="p-1.5 hover:bg-gray-200 dark:hover:bg-slate-700 rounded transition-colors text-gray-650 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white"
                >
                  <svg
                    className="w-3.5 h-3.5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                  >
                    <path d="M19 18H5M21 14H3M19 10H5M21 6H3" />
                  </svg>
                </button>
                <button
                  onClick={() => handleSetHeadingAlignment("right")}
                  title="Align Right"
                  className="p-1.5 hover:bg-gray-200 dark:hover:bg-slate-700 rounded transition-colors text-gray-650 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white"
                >
                  <svg
                    className="w-3.5 h-3.5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                  >
                    <path d="M21 18H7M21 14H3M21 10H7M21 6H3" />
                  </svg>
                </button>
              </div>

              {/* Insert Elements Group */}
              <div className="flex items-center overflow-hidden rounded-md bg-gray-50 dark:bg-slate-800">
                <button
                  onClick={() => insertStyleMarkup("> ", "")}
                  title="Blockquote"
                  className="p-1.5 hover:bg-gray-200 dark:hover:bg-slate-700 rounded transition-colors text-gray-650 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white"
                >
                  <Quote size={12} />
                </button>
                <button
                  onClick={() =>
                    insertStyleMarkup("[", "](https://example.com)")
                  }
                  title="Link"
                  className="p-1.5 hover:bg-gray-200 dark:hover:bg-slate-700 rounded transition-colors text-gray-650 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white"
                >
                  <Link size={12} />
                </button>
                <button
                  onClick={() =>
                    insertStyleMarkup("![", "](https://example.com/image.png)")
                  }
                  title="Image Placeholder"
                  className="p-1.5 hover:bg-gray-200 dark:hover:bg-slate-700 rounded transition-colors text-gray-650 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white"
                >
                  <Image size={12} />
                </button>
              </div>

              {/* Lists Dropdown Button Group */}
              <div
                className="relative flex items-center rounded-md bg-gray-50 dark:bg-slate-800"
                ref={listDropdownRef}
              >
                <button
                  onClick={() =>
                    insertStyleMarkup(
                      activeListType === "bullet" ? "- " : "1. ",
                      "",
                    )
                  }
                  title={
                    activeListType === "bullet"
                      ? "Bullet List"
                      : "Numbered List"
                  }
                  className="p-1.5 hover:bg-gray-200 dark:hover:bg-slate-700 rounded-l transition-colors text-gray-650 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white flex items-center justify-center"
                >
                  {activeListType === "bullet" ? (
                    <List size={12} />
                  ) : (
                    <ListOrdered size={12} />
                  )}
                </button>
                <div className="w-px h-4 bg-gray-300 dark:bg-slate-700"></div>
                <button
                  onClick={() => setShowListDropdown(!showListDropdown)}
                  title="Select List Style"
                  className="p-1 text-gray-400 transition-colors rounded-r dark:text-slate-400 hover:bg-gray-200 dark:hover:bg-slate-700 hover:text-gray-900 dark:hover:text-white"
                >
                  <ChevronDown size={12} />
                </button>

                {showListDropdown && (
                  <div className="absolute left-0 top-full mt-1.5 z-50 flex flex-col bg-white border border-gray-200 rounded-lg shadow-xl py-1 w-40 dark:bg-slate-900 dark:border-slate-800">
                    <button
                      onClick={() => {
                        setActiveListType("bullet");
                        insertStyleMarkup("- ", "");
                        setShowListDropdown(false);
                      }}
                      className={`flex items-center gap-2 w-full px-3 py-1.5 text-xs hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors text-left ${activeListType === "bullet" ? "text-indigo-650 dark:text-indigo-400 font-semibold bg-gray-50 dark:bg-slate-800" : "text-gray-700 dark:text-slate-300"}`}
                    >
                      <List size={14} />
                      <span>Bullet List</span>
                    </button>
                    <button
                      onClick={() => {
                        setActiveListType("numbered");
                        insertStyleMarkup("1. ", "");
                        setShowListDropdown(false);
                      }}
                      className={`flex items-center gap-2 w-full px-3 py-1.5 text-xs hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors text-left ${activeListType === "numbered" ? "text-indigo-650 dark:text-indigo-400 font-semibold bg-gray-50 dark:bg-slate-800" : "text-gray-700 dark:text-slate-300"}`}
                    >
                      <ListOrdered size={14} />
                      <span>Numbered List</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Action Group */}
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => insertStyleMarkup("\n---\n", "")}
                  title="Page Break"
                  className="flex items-center gap-1 p-1 text-xs font-medium text-gray-700 transition-colors rounded-md hover:bg-gray-100 dark:hover:bg-slate-700 bg-gray-50 dark:bg-slate-800 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white"
                >
                  <FileCode size={12} />
                  Page Break
                </button>

                {/* Macro Dropdown in Toolbar */}
                <div className="relative" ref={toolbarMacroDropdownRef}>
                  <button
                    onClick={() => {
                      setShowToolbarMacroDropdown(!showToolbarMacroDropdown);
                      setToolbarMacroSearch("");
                    }}
                    title="Insert Macro"
                    className="flex items-center gap-1 p-1 text-xs font-medium text-gray-700 transition-colors rounded-md hover:bg-gray-100 dark:hover:bg-slate-700 bg-gray-50 dark:bg-slate-800 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white"
                  >
                    <Sparkles
                      size={12}
                      className="text-indigo-600 dark:text-indigo-400"
                    />
                    Macro
                    <ChevronDown
                      size={12}
                      className="text-gray-400 dark:text-slate-400"
                    />
                  </button>
                  {showToolbarMacroDropdown && (
                    <div className="absolute left-0 z-50 flex flex-col mt-2 overflow-hidden bg-white border border-gray-200 rounded-lg shadow-xl dark:bg-slate-900 dark:border-slate-800 w-72 max-h-80">
                      <div className="p-2 border-b border-gray-150 dark:border-slate-800">
                        <input
                          type="text"
                          placeholder="Search macros..."
                          value={toolbarMacroSearch}
                          onChange={(e) =>
                            setToolbarMacroSearch(e.target.value)
                          }
                          className="w-full px-2.5 py-1.5 text-xs bg-gray-50 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500 text-gray-900 dark:bg-slate-950 dark:border-slate-700 dark:text-white"
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                      <div className="flex-1 p-1 overflow-y-auto divide-y divide-gray-100 dark:divide-slate-800 max-h-60">
                        {Object.entries(macros)
                          .filter(([k]) =>
                            k
                              .toLowerCase()
                              .includes(toolbarMacroSearch.toLowerCase()),
                          )
                          .map(([k, val]) => (
                            <button
                              key={k}
                              type="button"
                              onClick={() => {
                                insertToken(k);
                                setShowToolbarMacroDropdown(false);
                              }}
                              className="w-full text-left px-2.5 py-2 text-xs hover:bg-gray-100 dark:hover:bg-slate-800 rounded transition-colors flex flex-col gap-0.5"
                            >
                              <span className="font-mono font-semibold text-indigo-600 truncate dark:text-indigo-400">
                                {k}
                              </span>
                              <span className="text-gray-500 dark:text-slate-400 truncate text-[10px]">
                                {String(val || "Empty")}
                              </span>
                            </button>
                          ))}
                        {Object.keys(macros).filter((k) =>
                          k
                            .toLowerCase()
                            .includes(toolbarMacroSearch.toLowerCase()),
                        ).length === 0 && (
                          <div className="p-3 text-xs text-center text-gray-400 select-none dark:text-slate-500">
                            No macros match search
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* <span className="text-[10px] text-gray-500 dark:text-slate-400 font-medium hidden lg:inline">
              Type{" "}
              <code className="text-indigo-600 dark:text-indigo-400 bg-gray-100 dark:bg-slate-800 px-1 py-0.5 rounded border border-gray-250 dark:border-slate-700">
                /
              </code>{" "}
              or{" "}
              <code className="text-indigo-600 dark:text-indigo-400 bg-gray-100 dark:bg-slate-800 px-1 py-0.5 rounded border border-gray-250 dark:border-slate-700">
                @
              </code>{" "}
              to autocomplete macros
            </span> */}
          </div>

          {/* Autocomplete suggestion popup card */}
          {showAutocomplete && (
            <div
              ref={autocompleteDropdownRef}
              className="absolute z-50 overflow-y-auto bg-white border border-gray-200 divide-y shadow-2xl w-72 max-h-56 dark:bg-slate-950 dark:border-slate-850 divide-gray-150 dark:divide-slate-850"
              style={{
                top: autocompleteCoords.top + 45,
                left: autocompleteCoords.left,
              }}
            >
              <div className="sticky top-0 flex justify-between p-2 text-xs font-semibold text-gray-400 select-none bg-gray-50 dark:bg-slate-900">
                <span>Insert Macro Token</span>
                <span>{filteredMacros.length} found</span>
              </div>
              {filteredMacros.map((key) => (
                <button
                  key={key}
                  onClick={() => insertToken(key)}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-indigo-900/40 transition-colors flex flex-col gap-0.5 group"
                >
                  <span className="font-mono text-xs font-semibold text-indigo-600 dark:text-indigo-400 group-hover:text-indigo-700 dark:group-hover:text-indigo-200">
                    {key}
                  </span>
                  <span className="w-full text-xs text-gray-500 truncate dark:text-slate-400">
                    {macros[key] || "Empty"}
                  </span>
                </button>
              ))}
              {filteredMacros.length === 0 && (
                <div className="p-3 text-xs text-center text-gray-400 select-none">
                  No macros match filter
                </div>
              )}
            </div>
          )}

          {/* CodeMirror 6 Editor Container */}
          <div className="relative flex flex-col flex-1 min-w-0 overflow-hidden bg-white text-slate-800 dark:text-slate-100 dark:bg-slate-900">
            <div
              ref={editorRef}
              className="flex-1 w-full h-full min-w-0 overflow-hidden"
            />
          </div>
        </div>

        {/* Resizable Divider bar */}
        <div
          onMouseDown={startResizing}
          className="hidden lg:flex w-1.5 hover:w-2 hover:bg-indigo-500/80 cursor-col-resize active:bg-indigo-600 transition-all z-20 flex-shrink-0 bg-gray-200 dark:bg-slate-800 relative group items-center justify-center"
        >
          <div className="w-0.5 h-8 bg-gray-400 dark:bg-slate-600 group-hover:bg-indigo-200 rounded transition-colors" />
        </div>

        {/* Right Column: Multi-page A4 Preview */}
        <div className="relative flex flex-col flex-1 h-full min-w-0 overflow-hidden border-t border-gray-200 bg-slate-100 dark:bg-slate-900 lg:border-t-0 dark:border-slate-800/80">
          <style>{`
            /* Lists and bullet spacing inside print preview cards */
            .preview-page-wrapper-el ul {
              list-style-type: disc !important;
              padding-left: 20px !important;
              margin-top: 8px !important;
              margin-bottom: 12px !important;
            }
            .preview-page-wrapper-el ol {
              list-style-type: decimal !important;
              padding-left: 20px !important;
              margin-top: 8px !important;
              margin-bottom: 12px !important;
            }
            .preview-page-wrapper-el li {
              margin-bottom: 4px !important;
              font-size: 14px !important;
              color: #374151 !important;
            }

            /* Force light mode styles inside PDF preview page cards, even when global app theme is dark */
            .dark .preview-page-wrapper-el {
              background-color: #ffffff !important;
              color: #1f2937 !important; /* text-gray-800 */
              border-color: #e5e7eb !important; /* border-gray-200 */
            }
            .dark .preview-page-wrapper-el h1,
            .dark .preview-page-wrapper-el h2,
            .dark .preview-page-wrapper-el h3,
            .dark .preview-page-wrapper-el h4,
            .dark .preview-page-wrapper-el h5,
            .dark .preview-page-wrapper-el h6 {
              color: #111827 !important; /* text-gray-900 */
            }
            .dark .preview-page-wrapper-el p,
            .dark .preview-page-wrapper-el li,
            .dark .preview-page-wrapper-el span {
              color: #374151 !important; /* text-gray-700 */
            }
            .dark .preview-page-wrapper-el table {
              border-color: #e5e7eb !important;
              background-color: #ffffff !important;
            }
            .dark .preview-page-wrapper-el table thead,
            .dark .preview-page-wrapper-el table thead tr,
            .dark .preview-page-wrapper-el table th {
              background-color: #f9fafb !important;
              color: #111827 !important;
              border-color: #e5e7eb !important;
            }
            .dark .preview-page-wrapper-el table tbody,
            .dark .preview-page-wrapper-el table tbody tr,
            .dark .preview-page-wrapper-el table td {
              background-color: #ffffff !important;
              color: #374151 !important;
              border-color: #e5e7eb !important;
            }
            .dark .preview-page-wrapper-el blockquote {
              color: #4b5563 !important;
              border-left-color: #c7d2fe !important;
              background-color: rgba(243, 244, 246, 0.6) !important;
            }
            .dark .preview-page-wrapper-el .text-indigo-900\\/60 {
              color: rgba(49, 46, 129, 0.6) !important;
            }
            .dark .preview-page-wrapper-el .text-gray-400 {
              color: #9ca3af !important;
            }
            .dark .preview-page-wrapper-el .bg-slate-50\\/50 {
              background-color: rgba(248, 250, 252, 0.5) !important;
            }
            .dark .preview-page-wrapper-el .border-slate-200 {
              border-color: #e2e8f0 !important;
            }
            .dark .preview-page-wrapper-el .text-gray-900 {
              color: #111827 !important;
            }
            .dark .preview-page-wrapper-el .text-gray-600 {
              color: #4b5563 !important;
            }
            .dark .preview-page-wrapper-el code {
              color: #e11d48 !important; /* rose-600 */
              background-color: #f1f5f9 !important; /* gray-100 */
              border-color: #e2e8f0 !important;
            }
            .dark .preview-page-wrapper-el pre {
              background-color: #f9fafb !important; /* gray-50 */
              border-color: #e5e7eb !important;
              color: #1f2937 !important;
            }
            .dark .preview-page-wrapper-el pre code {
              color: #1f2937 !important;
              background-color: transparent !important;
            }
            .pdf-checkmark-span {
              position: absolute !important;
              left: 0 !important;
              top: 3.5px !important;
              display: block !important;
              width: 14px !important;
              height: 14px !important;
              border-radius: 3px !important;
              background-color: #4f46e5 !important; /* bg-indigo-600 */
              color: #ffffff !important;
              border: 1px solid #4f46e5 !important;
              font-size: 9px !important;
              font-weight: bold !important;
              text-align: center !important;
              line-height: 12px !important;
              margin-top: 0 !important;
              margin-right: 0 !important;
              flex-shrink: 0 !important;
              box-sizing: border-box !important;
            }
            .pdf-checkbox-unchecked-span {
              position: absolute !important;
              left: 0 !important;
              top: 3.5px !important;
              display: block !important;
              width: 14px !important;
              height: 14px !important;
              border-radius: 3px !important;
              background-color: #ffffff !important;
              border: 1px solid #d1d5db !important; /* border-gray-300 */
              margin-top: 0 !important;
              margin-right: 0 !important;
              flex-shrink: 0 !important;
              box-sizing: border-box !important;
            }
            .preview-page-wrapper-el li.flex.items-start {
              display: block !important;
              position: relative !important;
              padding-left: 22px !important;
              list-style-type: none !important;
            }
            .preview-page-wrapper-el :not(pre) > code {
              display: inline !important;
              padding: 2px 4px !important;
              margin: 0 2px !important;
              font-size: 11px !important;
              border-radius: 4px !important;
              white-space: break-spaces !important;
              background-color: #f1f5f9 !important; /* bg-slate-100 */
              color: #e11d48 !important; /* text-rose-600 */
              border: 1px solid #e2e8f0 !important; /* border-slate-200 */
            }
            .preview-page-wrapper-el del.line-through,
            .preview-page-wrapper-el span.line-through {
              text-decoration: none !important;
              position: relative !important;
              display: inline !important;
            }
            .preview-page-wrapper-el del.line-through::after,
            .preview-page-wrapper-el span.line-through::after {
              content: "" !important;
              position: absolute !important;
              left: 0 !important;
              right: 0 !important;
              top: 50% !important;
              height: 1px !important;
              background-color: currentColor !important;
            }
          `}</style>

          {/* Top Preview Toolbar (Fixed) - LaTeX-style Dark Theme */}
          <div className="z-10 flex flex-wrap items-center justify-center gap-3 px-4 py-2.5 border-b shadow-sm select-none bg-white border-gray-200 text-gray-700 dark:bg-slate-950 dark:border-slate-800 dark:text-slate-200">
            <div className="flex items-center justify-center w-full gap-3">
              {/* Recompile Button (Green, with Chevron dropdown) */}
              <div
                ref={recompileDropdownRef}
                className="relative flex items-center"
              >
                <button
                  onClick={handleCompile}
                  disabled={submitting}
                  className="p-1.5 bg-emerald-650 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-l-2xl text-xs font-semibold flex items-center gap-1.5 transition-all active:scale-95 bg-emerald-600 border-r border-emerald-700"
                >
                  <Eye size={13} />
                  Recompile
                </button>
                <button
                  onClick={() => setShowRecompileDropdown((prev) => !prev)}
                  className="p-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-r-2xl text-xs font-semibold flex items-center transition-all active:scale-95 h-[28px]"
                  title="Compile Options"
                >
                  <ChevronDown size={13} />
                </button>

                {showRecompileDropdown && (
                  <div className="absolute left-0 top-full mt-1.5 w-56 bg-white border border-gray-255 rounded-md shadow-lg py-1 z-30 text-xs text-gray-700 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-200">
                    <button
                      onClick={() => {
                        handleCompile();
                        setShowRecompileDropdown(false);
                      }}
                      className="w-full px-3 py-2 text-left transition-colors hover:bg-gray-100 dark:hover:bg-slate-800 hover:text-gray-900 dark:hover:text-white"
                    >
                      Compile HTML Preview
                    </button>
                    <button
                      onClick={() => {
                        if (
                          confirm(
                            "Möchtest du das Dokument wirklich auf das Standard-Template zurücksetzen?",
                          )
                        ) {
                          setMarkdown(DEFAULT_TEMPLATE);
                          setCompiledHtml(
                            compileReport(DEFAULT_TEMPLATE, macros),
                          );
                        }
                        setShowRecompileDropdown(false);
                      }}
                      className="w-full px-3 py-2 text-left transition-colors border-t hover:bg-gray-100 dark:hover:bg-slate-800 text-rose-650 hover:text-rose-455 border-gray-150 dark:border-slate-800"
                    >
                      Reset to Default Template
                    </button>
                  </div>
                )}
              </div>

              <div className="w-px h-4 bg-gray-200 dark:bg-slate-850"></div>

              {/* Download PDF Icon-only Button */}
              <button
                onClick={handleDownloadPdf}
                disabled={submitting}
                className="p-1.5 hover:bg-gray-150 dark:hover:bg-slate-800 hover:bg-slate-200/70 disabled:opacity-30 rounded transition-colors text-gray-500 dark:text-slate-400 hover:text-gray-800 dark:hover:text-white"
                title="Download PDF"
              >
                <Download size={15} />
              </button>

              <div className="w-px h-4 bg-gray-200 dark:bg-slate-850"></div>

              {/* Save Button */}
              {/* <button
                onClick={handleSaveProgress}
                disabled={saving || submitting}
                className="px-3 py-1.5 bg-slate-850 border border-slate-800 hover:bg-slate-800 disabled:opacity-50 text-slate-200 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all"
              >
                <Save size={13} />
                {saving ? "Saving..." : "Save"}
              </button> */}

              {/* Paper Format select */}
              <select
                value={pageFormat}
                onChange={(e) => setPageFormat(e.target.value)}
                className="px-2 py-0.5 text-xs font-semibold border border-gray-300 rounded bg-white text-gray-700 focus:outline-none dark:border-slate-750 dark:bg-slate-900 dark:text-slate-300"
              >
                <option value="A4">DIN A4</option>
                <option value="A3">DIN A3</option>
                <option value="A5">DIN A5</option>
                <option value="B4">DIN B4</option>
                <option value="B5">DIN B5</option>
                <option value="C4">DIN C4</option>
                <option value="C5">DIN C5</option>
                <option value="Letter">US Letter</option>
              </select>

              <div className="w-px h-4 bg-gray-200 dark:bg-slate-850"></div>

              {/* Publish Button */}
              <button
                onClick={handleSubmitReport}
                disabled={submitting || !!auditDoc?.auditReportUrl}
                className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm active:scale-95"
              >
                {submitting ? (
                  <>
                    <Loader2 size={13} className="animate-spin" />
                    Publishing...
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={13} />
                    Publish
                  </>
                )}
              </button>
            </div>

            {/* Right Side Controls */}
            <div className="flex items-center justify-center w-full gap-3 animate-fadeIn">
              {/* Sync Preview Checkbox */}
              <label className="flex items-center gap-1.5 text-xs text-gray-650 dark:text-slate-300 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={syncPreview}
                  onChange={(e) => setSyncPreview(e.target.checked)}
                  className="w-3.5 h-3.5 m-0 rounded border-gray-300 bg-white text-indigo-600 focus:ring-indigo-500 focus:ring-offset-white focus:ring-2 dark:border-slate-700 dark:bg-slate-800 dark:text-indigo-500 dark:focus:ring-offset-slate-900"
                />
                <span>Sync Preview</span>
              </label>

              <div className="w-px h-4 bg-gray-200 dark:bg-slate-850"></div>

              {/* Theme Toggle */}
              <button
                onClick={toggleTheme}
                className="p-1.5 hover:bg-gray-150 dark:hover:bg-slate-800 rounded transition-colors text-gray-500 dark:text-slate-400 hover:text-gray-800 hover:bg-slate-200/70 dark:hover:text-white"
                title={isDark ? "Light Mode" : "Dark Mode"}
              >
                {isDark ? <Sun size={15} /> : <Moon size={15} />}
              </button>

              <div className="w-px h-4 bg-gray-200 dark:bg-slate-850"></div>

              {/* Page Navigation */}
              <div className="flex">
                <div className="flex items-center gap-0.5">
                  <button
                    onClick={() => scrollToPage(currentPage - 2)}
                    disabled={currentPage <= 1}
                    className="p-1.5 hover:bg-gray-150 dark:hover:bg-slate-800 disabled:opacity-30 rounded transition-colors text-gray-500 dark:text-slate-400 hover:bg-slate-200/70 hover:text-gray-800 dark:hover:text-white"
                    title="Previous Page"
                  >
                    <ChevronUp size={15} />
                  </button>
                  <button
                    onClick={() => scrollToPage(currentPage)}
                    disabled={currentPage >= allPages.length}
                    className="p-1.5 hover:bg-gray-150 dark:hover:bg-slate-800 disabled:opacity-30 rounded transition-colors text-gray-500 dark:text-slate-400 hover:bg-slate-200/70 hover:text-gray-800 dark:hover:text-white"
                    title="Next Page"
                  >
                    <ChevronDown size={15} />
                  </button>
                </div>

                {/* Page Number Input Box */}
                <div className="flex items-center gap-1 text-xs text-gray-650 dark:text-slate-300">
                  <input
                    ref={pageInputRef}
                    type="text"
                    value={pageInputVal}
                    onChange={(e) => setPageInputVal(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handlePageSubmit()}
                    onBlur={handlePageSubmit}
                    className="w-8 py-0.5 text-center bg-white border border-gray-300 rounded text-xs font-semibold text-gray-800 focus:outline-none focus:border-indigo-500 dark:bg-slate-950 dark:border-slate-700 dark:text-white"
                  />
                  <span className="text-gray-400 dark:text-slate-500">
                    / {allPages.length}
                  </span>
                </div>
              </div>

              <div className="w-px h-4 bg-gray-200 dark:bg-slate-850"></div>

              {/* Zoom controls */}
              <div className="flex items-center gap-1">
                <button
                  onClick={() =>
                    setZoom((prev) =>
                      Math.max(0.4, Number((prev - 0.1).toFixed(1))),
                    )
                  }
                  className="p-1.5 hover:bg-gray-150 dark:hover:bg-slate-800 rounded transition-colors text-gray-500 dark:text-slate-400 hover:text-gray-800 hover:bg-slate-200/70 dark:hover:text-white"
                  title="Zoom Out"
                >
                  <Minus size={15} />
                </button>
                <span className="text-xs font-semibold text-gray-650 dark:text-slate-300 min-w-[36px] text-center">
                  {Math.round(zoom * 100)}%
                </span>
                <button
                  onClick={() =>
                    setZoom((prev) =>
                      Math.min(1.5, Number((prev + 0.1).toFixed(1))),
                    )
                  }
                  className="p-1.5 hover:bg-gray-150 dark:hover:bg-slate-800 rounded transition-colors text-gray-500 dark:text-slate-400 hover:text-gray-800 hover:bg-slate-200/70 dark:hover:text-white"
                  title="Zoom In"
                >
                  <Plus size={15} />
                </button>
              </div>
            </div>
          </div>

          {/* Scrollable Preview document body */}
          <div
            ref={previewScrollContainerRef}
            onScroll={handlePreviewScroll}
            className="flex flex-col items-center flex-1 p-6 overflow-y-auto"
          >
            <div className="flex flex-col items-center w-full gap-6 pb-12 preview-page-container">
              {allPages.map((pageHtml, index) => {
                const format = PAGE_FORMATS[pageFormat] || PAGE_FORMATS.A4;
                // Determine page category text for letterhead header
                let categoryText = "PRÜFUNGSBERICHT";
                if (index === 0) {
                  categoryText = "PRÜFUNGSBERICHT";
                } else if (index === 1) {
                  categoryText = "PRÜFUNGSBESCHEINIGUNG";
                } else {
                  categoryText = `PRÜFUNGSBERICHT: ${getMacroValue("name", "Genossenschaft")}`;
                }

                return (
                  <div
                    key={index}
                    className="flex-shrink-0 preview-page-container-el"
                    style={{
                      width: `${format.widthMm * zoom}mm`,
                      height: `${format.heightMm * zoom}mm`,
                      position: "relative",
                    }}
                  >
                    <div
                      data-page-index={index}
                      className="preview-page-wrapper-el bg-white text-gray-800 px-[14mm] py-[7mm] shadow-xl rounded-sm overflow-hidden select-text border border-gray-200"
                      style={{
                        width: `${format.widthMm}mm`,
                        height: `${format.heightMm}mm`,
                        transform: `scale(${zoom})`,
                        transformOrigin: "top left",
                        position: "absolute",
                        top: 0,
                        left: 0,
                        boxSizing: "border-box",
                        fontFamily: "'Outfit', 'Inter', sans-serif",
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "space-between",
                      }}
                    >
                      {/* Page Border Overlay */}
                      {showBorder && (
                        <div
                          className="absolute border border-gray-300 pointer-events-none dark:border-slate-700"
                          style={{
                            top: "10mm",
                            left: "10mm",
                            right: "10mm",
                            bottom: "10mm",
                            boxSizing: "border-box",
                            zIndex: 40,
                          }}
                        />
                      )}

                      {/* Letterhead Header on top of EVERY page */}
                      <div className="flex items-start justify-between w-full pb-2 mb-1 font-sans border-b border-gray-200 select-none">
                        <div className="text-[9px] text-gray-400 self-end font-bold tracking-widest uppercase">
                          {categoryText}
                        </div>
                        <div className="flex items-start gap-3">
                          {auditOrg?.letterhead_url ? (
                            <img
                              src={auditOrg?.letterhead_url}
                              alt="Logo"
                              className="object-contain h-16 ml-2 w-30 opacity-70"
                            />
                          ) : (
                            <div className="flex items-center justify-center w-8 h-8 ml-2 text-xs font-bold text-indigo-700 border border-indigo-100 rounded select-none bg-indigo-50">
                              {orgName.slice(0, 2).toUpperCase()}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Rendered HTML Body Content */}
                      <div
                        className="flex-1 leading-relaxed prose-sm prose text-justify text-gray-800 break-words select-text max-w-none"
                        dangerouslySetInnerHTML={{
                          __html: sanitizeReportHtml(pageHtml),
                        }}
                      />

                      {/* Page Footer */}
                      {index === 0 ? (
                        /* Cover Page Footer */
                        <div className="absolute bottom-6 left-[20mm] right-[20mm] border-t border-gray-200 pt-3 text-center text-[9px] text-gray-500 select-none">
                          <p
                            className="font-bold text-center text-gray-700"
                            style={{ textAlign: "center" }}
                          >
                            {getMacroValue("associationName") ||
                              "Deutscher Interessenverband der Kleingenossenschaften e.V."}
                          </p>
                          <p
                            className="text-gray-400 text-[8px] text-center"
                            style={{ textAlign: "center" }}
                          >
                            Hauptgeschäftsstelle:{" "}
                            {getMacroValue("streetAddress") ||
                              "Peiner Landstraße 217"}{" "}
                            &nbsp; {getMacroValue("postalCode") || "31135"}{" "}
                            {getMacroValue("city") || "Hildesheim"}
                          </p>
                        </div>
                      ) : index ===
                        1 /* Certificate Page Footer - No printed footer text needed as signatures are in bottom body */ ? null : (
                        /* Body Page Footer */
                        <div className="absolute bottom-6 left-[20mm] right-[20mm] border-t border-gray-200 pt-3 flex justify-between items-center text-[9px] text-gray-400 select-none font-medium">
                          <span>
                            Gutachterliche Äußerung gemäß § 11 Abs. 2 Nr. 3 GenG
                          </span>
                          <span className="font-bold text-slate-500">
                            Seite {index + 1} von {allPages.length}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              {compiledPages.length === 0 && (
                <div className="w-full max-w-sm p-12 mt-12 text-center text-gray-400 bg-white border border-gray-300 border-dashed shadow-sm dark:bg-slate-900 dark:border-slate-800 rounded-2xl dark:text-slate-500">
                  <FileCode className="w-12 h-12 mx-auto mb-3 text-gray-400 dark:text-slate-600" />
                  <p className="text-sm font-medium">
                    Click "Recompile" to compile and render your body pages
                    (Page 3 onwards)
                  </p>
                </div>
                // <div className="text-[8px] text-gray-500 leading-tight text-right">
                //   <p className="font-bold text-gray-700 uppercase tracking-wide text-[8px]">
                //     {orgName}
                //   </p>
                //   <p>
                //     {getMacroValue("streetAddress") ||
                //       auditOrg?.street ||
                //       "Peiner Landstraße 217"}
                //   </p>
                //   <p>
                //     {getMacroValue("postalCode") ||
                //       auditOrg?.postCode ||
                //       "31135"}{" "}
                //     {getMacroValue("city") || auditOrg?.City || "Hildesheim"}
                //   </p>
                //   <p>
                //     {getMacroValue("website") ||
                //       auditOrg?.website ||
                //       "www.divk.de"}
                //   </p>
                // </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Hidden container for client-side pagination height measurement */}
      <div
        ref={hiddenContainerRef}
        style={{
          position: "absolute",
          left: "-9999px",
          top: "-9999px",
          visibility: "hidden",
          height: "auto",
        }}
      />

      {/* Edit Front Page Modal */}
      {openFrontPageModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto text-gray-800 bg-black/60 backdrop-blur-sm dark:text-gray-200">
          <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-slate-850 bg-gray-50 dark:bg-slate-950/20">
              <div>
                <h3 className="text-base font-bold text-gray-900 dark:text-white">
                  Edit Front Page Metadata
                </h3>
                <p className="text-xs font-medium text-gray-400">
                  Update cover sheet and certificate parameters
                </p>
              </div>
              <button
                onClick={() => setOpenFrontPageModal(false)}
                className="text-gray-400 transition-colors hover:text-gray-650 dark:hover:text-gray-200"
              >
                ✕
              </button>
            </div>

            {/* Form Fields */}
            <div className="flex-1 p-6 space-y-4 overflow-y-auto">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5 dark:text-slate-400">
                  Cooperative Name
                </label>
                <input
                  type="text"
                  value={modalCoopName}
                  onChange={(e) => setModalCoopName(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-950 dark:bg-slate-950 dark:border-slate-700 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5 dark:text-slate-400">
                    Registered Office (Location)
                  </label>
                  <input
                    type="text"
                    value={modalRegisteredOffice}
                    onChange={(e) => setModalRegisteredOffice(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-950 dark:bg-slate-950 dark:border-slate-700 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5 dark:text-slate-400">
                    Fiscal Year
                  </label>
                  <input
                    type="text"
                    value={modalFiscalYears}
                    onChange={(e) => setModalFiscalYears(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-950 dark:bg-slate-950 dark:border-slate-700 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5 dark:text-slate-400">
                    Certificate Place & Date
                  </label>
                  <input
                    type="text"
                    value={modalCertificatePlaceDate}
                    onChange={(e) =>
                      setModalCertificatePlaceDate(e.target.value)
                    }
                    className="w-full px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-950 dark:bg-slate-950 dark:border-slate-700 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5 dark:text-slate-400">
                    Association Name
                  </label>
                  <input
                    type="text"
                    value={modalAssociationName}
                    onChange={(e) => setModalAssociationName(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-950 dark:bg-slate-950 dark:border-slate-700 dark:text-white"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-gray-150 dark:border-slate-800">
                <h4 className="mb-3 text-xs font-bold tracking-wider text-indigo-600 uppercase dark:text-indigo-400">
                  Signers (Page 2 bottom signatures)
                </h4>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1 dark:text-slate-500">
                        Signer 1 Name
                      </label>
                      <input
                        type="text"
                        value={modalSigner1Name}
                        onChange={(e) => setModalSigner1Name(e.target.value)}
                        className="w-full px-3 py-1.5 text-xs bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-950 dark:bg-slate-950 dark:border-slate-700 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1 dark:text-slate-500">
                        Signer 1 Title
                      </label>
                      <input
                        type="text"
                        value={modalSigner1Title}
                        onChange={(e) => setModalSigner1Title(e.target.value)}
                        className="w-full px-3 py-1.5 text-xs bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-950 dark:bg-slate-950 dark:border-slate-700 dark:text-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1 dark:text-slate-500">
                        Signer 2 Name
                      </label>
                      <input
                        type="text"
                        value={modalSigner2Name}
                        onChange={(e) => setModalSigner2Name(e.target.value)}
                        className="w-full px-3 py-1.5 text-xs bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-950 dark:bg-slate-950 dark:border-slate-700 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1 dark:text-slate-500">
                        Signer 2 Title
                      </label>
                      <input
                        type="text"
                        value={modalSigner2Title}
                        onChange={(e) => setModalSigner2Title(e.target.value)}
                        className="w-full px-3 py-1.5 text-xs bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-950 dark:bg-slate-950 dark:border-slate-700 dark:text-white"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-250 dark:border-slate-800 bg-gray-50 dark:bg-slate-950/40">
              <button
                type="button"
                onClick={() => setOpenFrontPageModal(false)}
                className="px-4 py-2 text-xs font-semibold text-gray-700 transition-colors rounded-lg hover:bg-gray-150 hover:bg-slate-200/50 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveFrontPage}
                className="px-4 py-2 text-xs font-semibold text-white transition-all bg-indigo-600 rounded-lg shadow-md bg-indigo-650 hover:bg-indigo-755 hover:bg-indigo-700 active:scale-95"
              >
                Save changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
