"use client";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { Download, X, FileText, Save, Loader2 } from "lucide-react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import {
  saveCooperativeReportData,
  fetchCooperativeReportData,
} from "../../lib/addCoopService";
import FadePopUp from "../FadePopUp";
import { createPortal } from "react-dom";

// Fetch audit report JSON for a cooperative
async function fetchReportByCoopId(coopId) {
  if (!coopId) throw new Error("coopId is required");
  try {
    const report = await fetchCooperativeReportData(coopId);
    console.log("Fetched report");
    return report ?? null; // return null if empty
  } catch (err) {
    console.error(`Failed to fetch report for coopId ${coopId}:`, err);
    return null;
  }
}

// Save audit report JSON for a cooperative
async function saveReportByCoopId(coopId, data) {
  if (!coopId) throw new Error("coopId is required");
  try {
    const saved = await saveCooperativeReportData(coopId, data);
    console.log("Audit report saved for coopId");
    return saved ?? null; // return null if empty
  } catch (err) {
    console.error(`Failed to save report for coopId ${coopId}:`, err);
    throw err;
  }
}
/**
 * AuditReportModal – self-contained, stateful, fetches by coopId
 *
 * Props:
 *   - coopId: string  // the only prop
 *
 * Behavior:
 *   - Internally loads/saves a JSON document for this coopId (swap localStorage impl with your API).
 *   - Uses meaningful, human-readable JSON keys (camelCase).
 *   - All contentEditable fields bind to those keys.
 */

// ---- Default content with meaningful keys ----
const DEFAULT_REPORT = {
  coopName: "ABC cooperative MindTime eG",
  registeredOffice: "Frankfurt",
  fiscalYears: "2023–2024",

  certificatePlaceDate: "Hildesheim, 06.09.2024",
  associationName: "Deutscher Interessenverband der Kleingenossenschaften e.V.",

  engagementLetterDate: "16.06.2025",

  legalPurposeText:
    "Zweck der Genossenschaft ist die Förderung des Erwerbs, der Wirtschaft der Mitglieder und deren soziale und kulturellen Belange mittels gemeinschaftlichen Geschäftsbetriebes.",

  membersCount: "10",
  boardMember1: "Peter San",
  boardMember2: "Henry Alex",
  generalAssemblyRepresentative: "Luis Lane",
  shareAmount: "200 EUR",
  noticePeriod: "",
  liabilityClause: "ausgeschlossen",

  promotionSummary:
    "Die Mitgliederförderung wurde durchgeführt und dem Prüfungsverband durch Einreichung eines Förderberichts belegt.",
  promotionVerb: "gefördert wurden",
  promotionDetails:
    "Die Genossenschaft stellt ihren Mitgliedern Mitgliederfahrzeuge zur Verfügung; des Weiteren wurden mehrere Mitgliederreisen organisiert...",
  noDoubtsClause:
    "Es sind uns keine Hinweise und Tatsachen bekannt geworden, die die Ausrichtung der Genossenschaft auf einen Förderzweck i.S.d. § 1 Abs. 1 Genossenschaftsgesetz in Zweifel ziehen.",

  businessOperationsText:
    "agiert als SAP- und IT-Unternehmensberater. Sie erbringt Dienstleistungen im SAP Finance & Controlling, Sales & Distribution und fungiert in den Bereichen Customizing und Entwicklung...",

  accountingYears: "2023 - 2024",
  profitYearIntro: "im Jahr 2022",
  profitText:
    "ein Jahresüberschuss in Höhe von 31.211,81 €. Für das Jahr 2023 ergibt sich ein Jahresüberschuss in Höhe von 6.316,29 €.",
  memberLoans: "keine",
  bookkeepingDeficiencyWord: "keinen",

  membershipStatus: "10 ordentlichen Mitgliedern",
  membershipGrowthText:
    "Zuwachs von 9 ordentlichen Mitgliedern zu verzeichnen.",
  membershipSharesText: "559 Mitgliedsanteile zu je 100€",

  briefingDate: "19.08.2024",
  closingPlaceDate: "Hildesheim, 06.09.2024",
  signer1: "Björn Erhap – Vorstand",
  signer2: "Götz René Turnier – Vorstand",
};

// Utility to read text from a contentEditable event target
const readEditable = (e) => (e?.target?.innerText ?? "").replace(/ /g, " ");

function InlineEditable({ k, value, onChange, className = "" }) {
  return (
    <span
      contentEditable
      suppressContentEditableWarning
      className={`editable editable-inline text-blue-600 ${className}`}
      onInput={(e) => onChange(k, readEditable(e))}
      onBlur={(e) => onChange(k, readEditable(e))}
    >
      {value}
    </span>
  );
}

function BlockEditable({ k, value, onChange, className = "" }) {
  return (
    <div
      contentEditable
      suppressContentEditableWarning
      className={`editable editable-block ${className}`}
      onInput={(e) => onChange(k, readEditable(e))}
      onBlur={(e) => onChange(k, readEditable(e))}
    >
      {value}
    </div>
  );
}

export default function AuditReportModal({ coopId }) {
  const [open, setOpen] = useState(false);
  const [data, setData] = useState(null);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const contentRef = useRef(null);

  // ---- caret-stable, UNCONTROLLED contentEditable components ----
  // We only commit on blur; no parent state updates while typing.
  // This avoids React re-renders interfering with the caret and fixes the
  // "one letter deletes then focus lost" issue.
  const sanitize = (t) => (t ?? "").replace(/\u00A0/g, " ");

  const InlineCE = React.memo(
    function InlineCE({ k, initial, onCommit, className = "" }) {
      const ref = useRef(null);

      // Set initial text when it changes from the outside (e.g., after fetch or coop switch)
      useEffect(() => {
        if (!ref.current) return;
        const cur = sanitize(ref.current.innerText);
        const next = sanitize(initial ?? "");
        if (cur !== next) ref.current.innerText = next;
      }, [initial]);

      const commit = useCallback(() => {
        if (!ref.current) return;
        const text = sanitize(ref.current.innerText);
        onCommit(k, text);
      }, [k, onCommit]);

      return (
        <span
          ref={ref}
          contentEditable
          suppressContentEditableWarning
          className={`editable editable-inline text-blue-600 ${className}`}
          spellCheck={false}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              commit();
              e.currentTarget.blur();
            }
          }}
          onPaste={(e) => {
            e.preventDefault();
            const text = e.clipboardData.getData("text/plain");
            document.execCommand("insertText", false, text);
          }}
        />
      );
    },
    (a, b) => a.k === b.k && a.initial === b.initial,
  );

  const BlockCE = React.memo(
    function BlockCE({ k, initial, onCommit, className = "" }) {
      const ref = useRef(null);

      useEffect(() => {
        if (!ref.current) return;
        const cur = sanitize(ref.current.innerText);
        const next = sanitize(initial ?? "");
        if (cur !== next) ref.current.innerText = next;
      }, [initial]);

      const commit = useCallback(() => {
        if (!ref.current) return;
        const text = sanitize(ref.current.innerText);
        onCommit(k, text);
      }, [k, onCommit]);

      return (
        <div
          ref={ref}
          contentEditable
          suppressContentEditableWarning
          className={`editable editable-block ${className}`}
          spellCheck={false}
          onBlur={commit}
          onKeyDown={(e) => {
            // Allow Enter to create new line but commit on Ctrl/Cmd+Enter
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
              e.preventDefault();
              commit();
              e.currentTarget.blur();
            }
          }}
          onPaste={(e) => {
            e.preventDefault();
            const text = e.clipboardData.getData("text/plain");
            document.execCommand("insertText", false, text);
          }}
        />
      );
    },
    (a, b) => a.k === b.k && a.initial === b.initial,
  );

  // Load for coopId on mount/when it changes
  useEffect(() => {
    let alive = true;
    (async () => {
      const fromBackend = await fetchReportByCoopId(coopId);
      let parsed = null;
      if (fromBackend) {
        if (typeof fromBackend === "string") {
          try {
            parsed = JSON.parse(fromBackend);
          } catch (e) {
            console.error("Failed to parse reportData string:", e);
          }
        } else if (typeof fromBackend === "object") {
          parsed = fromBackend;
        }
      }
      // console.log("from backend", parsed, typeof parsed);
      console.log("from backend");
      if (!alive) return;
      console.log("alive");
      setData({ ...DEFAULT_REPORT, ...(parsed ?? {}) });
      setDirty(false);
    })();
    return () => {
      alive = false;
    };
  }, [coopId]);

  const updateField = useCallback((key, value) => {
    setData((prev) => ({ ...(prev ?? {}), [key]: value }));
    setDirty(true);
  }, []);

  const handleSave = useCallback(async () => {
    if (!data) return;
    // Flush currently focused field before saving
    const ae = document.activeElement;
    if (ae && typeof ae.blur === "function") ae.blur();

    setSaving(true);
    try {
      console.log("Saving report");
      await saveReportByCoopId(coopId, data);
      setDirty(false);
    } finally {
      setSaving(false);
    }
  }, [coopId, data]);

  const v = (k) => data?.[k] ?? DEFAULT_REPORT[k] ?? "";

  /** PDF export identical to your previous version */
  const downloadPdf = useCallback(async () => {
    if (!contentRef.current) return;
    
    // We send the inner HTML of the content container to generate PDF on the server side
    const htmlContent = contentRef.current.innerHTML;

    try {
      const response = await fetch("/api/auditServices/generatePdf", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          htmlContent,
          pageFormat: "A4",
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to generate PDF on the server.");
      }

      const pdfBlob = await response.blob();
      
      const url = window.URL.createObjectURL(pdfBlob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "Pruefungsbericht.pdf");
      document.body.appendChild(link);
      link.click();
      
      // Delay cleanup slightly to ensure the browser initiates the download successfully
      setTimeout(() => {
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }, 100);
      
    } catch (e) {
      console.error(e);
      alert(e.message || "Failed to download PDF.");
    }
  }, []);

  return (
    <div className="w-full sm:w-auto inline-block">
      {/* Outside-only button */}
      <button
        onClick={() => setOpen(true)}
        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm transition-all hover:bg-gray-50 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-700 dark:focus:ring-offset-gray-900"
      >
        <FileText className="w-4 h-4 text-gray-500" /> Report Review{" "}
        {dirty && (
          <span className="text-[10px] ml-1 px-1.5 py-0.5 rounded-sm bg-yellow-100 text-yellow-800 border border-yellow-200">
            unsaved
          </span>
        )}
      </button>

      {/* Modal */}
      {createPortal(
        <FadePopUp
          isOpen={open}
          onClose={() => setOpen(false)}
          className="rounded-2xl"
          overlayClassName="bg-black/50 backdrop-blur-sm"
        >
          {/* Dialog */}
          <div className="relative z-10 mx-auto mt-6 mb-6 w-full max-w-5xl max-h-[92vh] bg-white rounded-xl shadow-xl border border-gray-200 flex flex-col">
            {/* Header (sticky) */}
            <div className="sticky top-0 z-20 flex items-center justify-between gap-2 px-4 py-3 bg-white border-b border-gray-200 rounded-xl">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span className="font-semibold">PRÜFUNGSBERICHT</span>
                <span className="hidden sm:inline">– Vorschau</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={downloadPdf}
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border border-gray-300 bg-white hover:bg-gray-50 text-gray-900 text-sm"
                >
                  <Download className="w-4 h-4" /> Als PDF speichern
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border border-emerald-600 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 disabled:opacity-60 text-sm"
                  aria-label="Speichern"
                >
                  {saving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}{" "}
                  Speichern
                </button>
                <button
                  onClick={() => setOpen(false)}
                  className="inline-flex items-center justify-center w-8 h-8 border border-gray-300 rounded-xl hover:bg-gray-50"
                  aria-label="Schließen"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Body (scrollable) */}
            <div className="flex-1 p-4 overflow-y-auto" id="modal-scroll-body">
              <div ref={contentRef}>
                <div className="container mx-auto max-w-[840px]">
                  <style>{`
                    :root { --fg:#0f172a; --muted:#475569; --accent:#111827; --border:#e5e7eb; --bg:#ffffff; }
                    .container { margin:24px auto 96px; padding:0 16px; color:var(--fg); background:var(--bg); }
                    header { border-bottom:2px solid var(--border); padding-bottom:16px; margin-bottom:24px; }
                    h1 { font-size:1.9rem; margin:0 0 8px; letter-spacing:.2px; }
                    h2 { font-size:1.25rem; margin:28px 0 8px; }
                    h3 { font-size:1.05rem; margin:20px 0 6px; color:var(--accent); }
                    p { margin:8px 0 12px; }
                    .muted { color:var(--muted); }
                    .cert { border:1px solid var(--border); border-radius:12px; padding:16px; background:#fafafa; }
                    .meta { display:grid; grid-template-columns: 1fr auto; gap:8px; }
                    .badge { display:inline-block; border:1px solid var(--border); border-radius:999px; padding:.15rem .6rem; font-size:.85rem; }
                    ul { margin:8px 0 16px 1.2rem; list-style-type: disc !important; }
                    ol { margin:8px 0 16px 1.2rem; list-style-type: decimal !important; }
                    li { margin:4px 0; }
                    .signature-block { display:flex; gap:24px; flex-wrap:wrap; margin-top:16px; }
                    .sign { border-top:1px solid var(--border); padding-top:6px; min-width:220px; }
                    hr { border:none; border-top:1px solid var(--border); margin:28px 0; }
                    details { border:1px dashed var(--border); border-radius:10px; padding:12px 14px; background:#fcfcfc; }
                    summary { cursor:pointer; font-weight:600; }
                    .editable { outline:none; }
                    .editable-inline { border-bottom:1px dashed #cbd5e1; padding:0 2px; }
                    .editable-block { border:1px dashed #cbd5e1; border-radius:8px; padding:8px; background:#ffffff; }
                  `}</style>

                  <header>
                    <div className="badge">
                      Deutscher Interessenverband der Kleingenossenschaften e.
                      V. (DIVK)
                    </div>
                    <h1>PRÜFUNGSBERICHT nach § 53 Genossenschaftsgesetz</h1>
                    <p className="muted">
                      für{" "}
                      <strong>
                        <InlineCE
                          k="coopName"
                          initial={v("coopName")}
                          onCommit={updateField}
                        />
                      </strong>
                      , Sitz in{" "}
                      <strong>
                        <InlineCE
                          k="registeredOffice"
                          initial={v("registeredOffice")}
                          onCommit={updateField}
                        />
                      </strong>{" "}
                      • Prüfungszeitraum: Geschäftsjahre{" "}
                      <strong>
                        <InlineCE
                          k="fiscalYears"
                          initial={v("fiscalYears")}
                          onCommit={updateField}
                        />
                      </strong>
                    </p>
                  </header>

                  <section className="cert">
                    <h2>Prüfungsbescheinigung</h2>
                    <p>
                      Hiermit bescheinigen wir der{" "}
                      <strong>
                        <InlineCE
                          k="coopName"
                          initial={v("coopName")}
                          onCommit={updateField}
                        />
                      </strong>{" "}
                      mit Sitz in{" "}
                      <strong>
                        <InlineCE
                          k="registeredOffice"
                          initial={v("registeredOffice")}
                          onCommit={updateField}
                        />
                      </strong>{" "}
                      die Durchführung der Prüfung gemäß § 53 Abs. 1
                      Genossenschaftsgesetz. Die Prüfung wurde durchgeführt für
                      die Geschäftsjahre{" "}
                      <InlineCE
                        k="fiscalYears"
                        initial={v("fiscalYears")}
                        onCommit={updateField}
                      />
                      .
                    </p>
                    <div className="meta">
                      <p>
                        <strong>
                          <InlineCE
                            k="certificatePlaceDate"
                            initial={v("certificatePlaceDate")}
                            onCommit={updateField}
                          />
                        </strong>
                      </p>
                      <p className="muted">
                        <InlineCE
                          k="associationName"
                          initial={v("associationName")}
                          onCommit={updateField}
                        />
                      </p>
                    </div>
                    <div className="signature-block">
                      <div className="sign">Vorstand</div>
                      <div className="sign">Vorstand</div>
                    </div>
                  </section>

                  <h2>I. Auftrag und Auftragsdurchführung der Prüfung</h2>
                  <p>
                    Der Deutsche Interessenverband der Kleingenossenschaften
                    e.V. – im weiteren „Verband“ – führte bei der Genossenschaft
                    die Prüfung nach den geltenden Vorschriften (§ 53 GenG)
                    durch.
                  </p>
                  <p>
                    Gegenstand unserer Prüfung gemäß § 53 Abs. 1 GenG zwecks
                    Feststellung der wirtschaftlichen Verhältnisse und der
                    Ordnungsmäßigkeit der Geschäftsführung waren die
                    Einrichtungen, die Vermögenslage sowie die Geschäftsführung
                    der Genossenschaft.{" "}
                    <em>Die Prüfung der Jahresabschlüsse</em> zum{" "}
                    <InlineCE
                      k="fiscalYears"
                      initial={v("fiscalYears")}
                      onCommit={updateField}
                    />{" "}
                    war nicht Gegenstand unserer Tätigkeit.
                  </p>
                  <p>
                    Die Geschäftsführung, Buchführung, das
                    rechnungslegungsbezogene interne Kontrollsystem, das
                    Risikofrüherkennungssystem und die Aufstellung der
                    Jahresabschlüsse nach den deutschen handelsrechtlichen
                    Vorschriften liegen in der Verantwortung des Vorstandes der
                    Genossenschaft. Die Prüfung der Jahresabschlüsse liegt in
                    der Verantwortung der Generalversammlung.
                  </p>
                  <p>
                    Der Vorstand der Genossenschaft hat uns mit Schreiben vom{" "}
                    <InlineCE
                      k="engagementLetterDate"
                      initial={v("engagementLetterDate")}
                      onCommit={updateField}
                    />{" "}
                    beauftragt, die Prüfung gemäß § 53 GenG durchzuführen. Die
                    Prüfung wurde durch interne Verbandsprüfer vorgenommen.
                  </p>
                  <p>
                    <strong>
                      Erklärung nach § 55 Abs. 2 GenG (Befangenheit):
                    </strong>{" "}
                    Keiner der gesetzlichen Vertreter, Mitarbeiter oder Prüfer
                    des Verbandes ist zugleich Mitarbeiter, Mitglied, Mitglied
                    des Vorstandes oder Aufsichtsrates der zu prüfenden
                    Genossenschaft. Ebenfalls sind keine Tätigkeiten oder
                    Dienstleistungen nach § 55 Abs. 2 Nr. 3 erbracht oder
                    durchgeführt worden. Eine Befangenheit ist demnach nicht
                    gegeben.
                  </p>

                  <h2>II. Unterlagen zum Prüfungsbericht</h2>
                  <p>
                    Als Grundlage für die Erstellung unseres Prüfungsberichts
                    lagen uns u. a. vor:
                  </p>
                  <ul>
                    <li>
                      Protokolle der Generalversammlungen im Prüfungszeitraum
                    </li>
                    <li>Beschlossene Satzung sowie etwaige Änderungen</li>
                    <li>
                      Auszug aus dem Genossenschaftsregister und die
                      Gewerbeanmeldung
                    </li>
                    <li>
                      Aktuelle Mitgliederliste sowie Mitgliederlisten am Ende
                      jedes Prüfungsjahres
                    </li>
                    <li>
                      Jahresabschlüsse zum Ende eines jeden Prüfungsjahres sowie
                      die aktuelle BWA
                    </li>
                    <li>Summen- und Saldenlisten sowie Sachkonten</li>
                    <li>
                      Steuerbescheide und Nachweise der Offenlegung im
                      Bundesanzeiger
                    </li>
                    <li>Verträge von besonderer Bedeutung</li>
                    <li>Offenlegung von Mitgliederdarlehen</li>
                  </ul>
                  <p>
                    Die Einholung ggf. erforderlicher rechtlicher oder sonstiger
                    Genehmigungen oder die Einhaltung behördlicher Auflagen
                    waren nicht Gegenstand unserer Prüfung. Besonders wurde
                    geprüft, ob eine Förderung der Mitglieder gemäß § 1 GenG
                    erfolgte.
                  </p>
                  <p>
                    Auskunftsperson der Genossenschaft bei der Prüfung war der
                    gewählte Vorstand der Genossenschaft. Uns wurden alle
                    verlangten Aufklärungen und Nachweise bereitwillig erbracht.
                    Die Durchführung der Prüfung richtet sich nach den
                    „Allgemeinen Auftragsbedingungen“ des Verbandes in der
                    aktuellen Fassung.
                  </p>

                  <h2>III. Rechtliche Grundlagen</h2>
                  <BlockCE
                    k="legalPurposeText"
                    initial={v("legalPurposeText")}
                    onCommit={updateField}
                  />
                  <p>
                    Gegenstand des Unternehmens ist die Erbringung von
                    Dienstleistungen und Handelsgeschäften als
                    Produktivgenossenschaft, insbesondere:
                  </p>
                  <ul>
                    <li>
                      Beratung und Betreuung (Projektleitung,
                      Interimsmanagement, Sanierung, Vertriebsunterstützung,
                      Backoffice, Personalführung/-bindung, Online‑Marketing,
                      Restrukturierung, Krisenbewältigung, Projektentwicklung)
                    </li>
                    <li>
                      IT, Digitalisierung, Qualitätssicherung, Optimierung von
                      Geschäftsprozessen und strukturellen Ausrichtung
                    </li>
                    <li>
                      Aus‑, Fort‑ und Weiterbildung sowie Coachings (Praktische
                      Emotionale Kompetenz, Mimik‑Resonanz, Physiognomie)
                    </li>
                    <li>
                      Softwareentwicklung und Pflege von Softwareprodukten
                      (mobile Geräte, Windows/Mac‑OS, Datenbankanwendungen)
                    </li>
                    <li>
                      Handel und Dienstleistungen im Bereich Elektrik und
                      Elektrotechnik
                    </li>
                    <li>
                      Bündelung der Beratungsleistungen der Mitglieder;
                      Schaffung von Arbeitsplätzen
                    </li>
                    <li>
                      Errichtung und Betrieb von Gemeinschaftsanlagen,
                      Folgeeinrichtungen sowie sozialer, wirtschaftlicher und
                      kultureller Einrichtungen
                    </li>
                    <li>
                      Gemeinschaftlicher Einkauf von Waren, Gütern,
                      Betriebsbedarf, Versicherungen, Fahrzeugen und beweglichen
                      Wirtschaftsgütern
                    </li>
                  </ul>
                  <p>
                    Die Genossenschaft ist berechtigt, alle Maßnahmen zu
                    treffen, die geeignet sind, den Gesellschaftszweck zu
                    fördern, sich an anderen Unternehmen zu beteiligen,
                    Zweigniederlassungen und andere Unternehmen zu gründen oder
                    zu erwerben bzw. als Komplementärin zu fungieren, sich
                    sachverständiger Dritter zu bedienen,
                    Inhaberschuldverschreibungen auszugeben sowie Genussrechte
                    und stille Beteiligungen zu gewähren. Teile des
                    Genossenschaftskapitals können in rentierliche Geld‑ und
                    Kapitalmarktpapiere angelegt werden.
                  </p>
                  <p>
                    Jedes Mitglied ist verpflichtet, mindestens einen
                    Geschäftsanteil zu übernehmen und sofort einzuzahlen.
                  </p>
                  <p>
                    Hinsichtlich der gemäß § 9 GenG vorgeschriebenen Organe
                    besteht die Genossenschaft aus Vorstand und Aufsichtsrat.
                    Zum Zeitpunkt der Prüfung hat die Genossenschaft{" "}
                    <strong>
                      <InlineCE
                        k="membersCount"
                        initial={v("membersCount")}
                        onCommit={updateField}
                      />
                    </strong>{" "}
                    Mitglieder. Bis zur Aufnahme des 21. Mitglieds nimmt eine/r
                    Bevollmächtigte/r der Generalversammlung die Aufgaben des
                    Aufsichtsrats wahr. Der Vorstand ist satzungsgemäß besetzt
                    und besteht aus Herrn{" "}
                    <strong>
                      <InlineCE
                        k="boardMember1"
                        initial={v("boardMember1")}
                        onCommit={updateField}
                      />
                    </strong>{" "}
                    und Frau{" "}
                    <strong>
                      <InlineCE
                        k="boardMember2"
                        initial={v("boardMember2")}
                        onCommit={updateField}
                      />
                    </strong>
                    . Bevollmächtigter der Generalversammlung ist{" "}
                    <strong>
                      <InlineCE
                        k="generalAssemblyRepresentative"
                        initial={v("generalAssemblyRepresentative")}
                        onCommit={updateField}
                      />
                    </strong>
                    .
                  </p>
                  <ul>
                    <li>
                      Höhe des Geschäftsanteils:{" "}
                      <strong>
                        <InlineCE
                          k="shareAmount"
                          initial={v("shareAmount")}
                          onCommit={updateField}
                        />
                      </strong>
                    </li>
                    <li>
                      Kündigungsfrist:{" "}
                      <strong>
                        <InlineCE
                          k="noticePeriod"
                          initial={v("noticePeriod")}
                          onCommit={updateField}
                        />
                      </strong>
                    </li>
                    <li>
                      Nachschusspflicht der Mitglieder:{" "}
                      <strong>
                        <InlineCE
                          k="liabilityClause"
                          initial={v("liabilityClause")}
                          onCommit={updateField}
                        />
                      </strong>
                    </li>
                  </ul>

                  <h2>IV. Mitgliederförderung</h2>
                  <BlockCE
                    k="promotionSummary"
                    initial={v("promotionSummary")}
                    onCommit={updateField}
                  />
                  <p>
                    Aus dem Förderbericht ergibt sich, dass die Mitglieder in
                    folgender Weise{" "}
                    <InlineCE
                      k="promotionVerb"
                      initial={v("promotionVerb")}
                      onCommit={updateField}
                    />
                    :
                  </p>
                  <BlockCE
                    k="promotionDetails"
                    initial={v("promotionDetails")}
                    onCommit={updateField}
                  />
                  <p>
                    <InlineCE
                      k="noDoubtsClause"
                      initial={v("noDoubtsClause")}
                      onCommit={updateField}
                    />
                  </p>

                  <h2>V. Geschäftsbetrieb</h2>
                  <p>
                    Die Genossenschaft{" "}
                    <InlineCE
                      k="businessOperationsText"
                      initial={v("businessOperationsText")}
                      onCommit={updateField}
                    />
                  </p>

                  <h2>VI. Rechnungslegung und wirtschaftliche Verhältnisse</h2>
                  <p>
                    Für die Geschäftsjahre{" "}
                    <InlineCE
                      k="accountingYears"
                      initial={v("accountingYears")}
                      onCommit={updateField}
                    />{" "}
                    wurden dem Prüfungsverband die Jahresabschlüsse vorgelegt.
                    Aus den vorgelegten Jahresabschlüssen ergibt sich{" "}
                    <InlineCE
                      k="profitYearIntro"
                      initial={v("profitYearIntro")}
                      onCommit={updateField}
                    />{" "}
                    <InlineCE
                      k="profitText"
                      initial={v("profitText")}
                      onCommit={updateField}
                    />
                  </p>
                  <p>
                    Im Prüfungszeitraum wurden{" "}
                    <InlineCE
                      k="memberLoans"
                      initial={v("memberLoans")}
                      onCommit={updateField}
                    />{" "}
                    Mitgliederdarlehen aufgenommen.
                  </p>
                  <p>
                    Des Weiteren wurde dem Prüfungsverband die Bescheinigung
                    über die Veröffentlichung der Jahresabschlüsse im
                    Bundesanzeiger übergeben.
                  </p>
                  <p>
                    Die eingereichten Unterlagen lassen{" "}
                    <InlineCE
                      k="bookkeepingDeficiencyWord"
                      initial={v("bookkeepingDeficiencyWord")}
                      onCommit={updateField}
                    />{" "}
                    Mangel an der Buchführung oder dem unternehmerischen Handeln
                    des Vorstands erkennen. Eine Gefährdung der Belange der
                    Mitglieder ist nicht zu besorgen.
                  </p>

                  <h2>VII. Mitglieder</h2>
                  <p>
                    Die Genossenschaft besteht zum Ende des Prüfungszeitraumes
                    aus{" "}
                    <InlineCE
                      k="membershipStatus"
                      initial={v("membershipStatus")}
                      onCommit={updateField}
                    />{" "}
                    . Zum Beginn des Prüfungszeitraumes bestand die
                    Genossenschaft aus lediglich einem{" "}
                    <InlineCE
                      k="membershipGrowthText"
                      initial={v("membershipGrowthText")}
                      onCommit={updateField}
                    />
                    Der Prüfungsverband begrüßt diese Entwicklung. Die 10
                    ordentlichen Mitglieder haben zurzeit insgesamt{" "}
                    <InlineCE
                      k="membershipSharesText"
                      initial={v("membershipSharesText")}
                      onCommit={updateField}
                    />
                  </p>

                  <h2>VIII. Fazit</h2>
                  <p>
                    Nach der Prüfung gemäß § 53 Abs. 1 GenG (Feststellung der
                    wirtschaftlichen Verhältnisse, Ordnungsmäßigkeit der
                    Geschäftsführung, Einrichtungen sowie Vermögenslage)
                    bestätigen wir auf Grundlage der vorgelegten Unterlagen und
                    erteilten Auskünfte:
                  </p>
                  <ul>
                    <li>
                      Die Satzung entspricht den Vorschriften des
                      Genossenschaftsgesetzes.
                    </li>
                    <li>Die wirtschaftlichen Verhältnisse sind geordnet.</li>
                    <li>Die Geschäftsführung ist ordnungsgemäß.</li>
                    <li>
                      Eine Gefährdung der Belange der Mitglieder oder der
                      Gläubiger der Genossenschaft ist unter Berücksichtigung
                      der vorgenannten Hinweise aktuell nicht zu besorgen.
                    </li>
                  </ul>

                  <h2>IX. Weiteres Vorgehen</h2>
                  <p>
                    Am{" "}
                    <InlineCE
                      k="briefingDate"
                      initial={v("briefingDate")}
                      onCommit={updateField}
                    />{" "}
                    wurden Vorstand und Bevollmächtigte der Generalversammlung
                    über die wesentlichen Feststellungen der Prüfung
                    unterrichtet.
                  </p>
                  <p>
                    Das Prüfungsergebnis ist in allen Teilen durchzuarbeiten.
                  </p>
                  <p>
                    Nach § 59 Abs. 1 GenG hat der Vorstand den Prüfungsbericht
                    bei Einberufung der nächsten Generalversammlung als
                    Gegenstand der Beratung und möglichen Beschlussfassung
                    anzukündigen.
                  </p>
                  <p>
                    Nach § 59 Abs. 2 GenG hat sich die Bevollmächtigte der
                    Generalversammlung in dieser Versammlung über wesentliche
                    Feststellungen oder Beanstandungen der Prüfung zu erklären.
                  </p>
                  <p>
                    <InlineCE
                      k="closingPlaceDate"
                      initial={v("closingPlaceDate")}
                      onCommit={updateField}
                    />
                  </p>
                  <br />
                  <div className="signature-block">
                    <div className="sign">
                      <InlineCE
                        k="signer1"
                        initial={v("signer1")}
                        onCommit={updateField}
                      />
                    </div>
                    <div className="sign">
                      <InlineCE
                        k="signer2"
                        initial={v("signer2")}
                        onCommit={updateField}
                      />
                    </div>
                  </div>

                  <hr />
                  <p className="muted">
                    Hinweis: Diese HTML-Fassung ist eine textgetreue
                    Aufbereitung zur Bildschirm‑ und Druckansicht. Layout und
                    Logos der Original-PDF wurden bewusst vereinfacht; Text
                    bleibt vollständig auswähl- und durchsuchbar.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </FadePopUp>,
        document.body,
      )}
    </div>
  );
}
