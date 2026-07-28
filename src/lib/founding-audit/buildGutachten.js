import { displayOrDash } from "@/lib/reports/utils/formatters";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const LETTERHEAD_HEIGHT = 35;
const LOGO_HEIGHT = 15;

const formatGermanDateOnly = (isoDate) => {
  if (!isoDate) return "—";
  try {
    return new Intl.DateTimeFormat("de-DE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      timeZone: "Europe/Berlin",
    }).format(new Date(isoDate));
  } catch (error) {
    return "—";
  }
};

const fetchImageAsDataUri = async (url) => {
  const response = await fetch(url);
  if (!response.ok)
    throw new Error(`Failed to fetch image: ${response.statusText}`);

  const arrayBuffer = await response.arrayBuffer();
  const base64 = Buffer.from(arrayBuffer).toString("base64");

  const mimeType = response.headers.get("content-type") || "image/png";
  const format =
    mimeType.includes("jpeg") || mimeType.includes("jpg") ? "JPEG" : "PNG";

  return { dataUri: `data:${mimeType};base64,${base64}`, format };
};

const DESIGN = {
  COLORS: {
    PRIMARY: [31, 41, 55], // Charcoal/Dark Gray for a formal legal look
    ACCENT: [79, 70, 229], // Indigo accent details
    BG_ALT_ROW: [249, 250, 251], // Gray 50
    TEXT_MAIN: 17,
    TEXT_MUTED: 75,
    TEXT_LIGHT: 140,
    BORDER_LIGHT: 220,
  },
  FONTS: {
    TITLE: 15,
    SUBTITLE: 11,
    SECTION: 10.5,
    BODY: 9.5,
    TABLE: 8.5,
    FOOTER: 8,
  },
  LAYOUT: { MARGIN: 15, LINE_HEIGHT: 5.5 },
};

/**
 * Server-Side Document Engine: Compiles the visual PDF for the Gründungsgutachten (§11 GenG).
 * Implements the 10 legally prescribed sections sequentially and returns a Node-ready binary Buffer.
 */
export const buildGutachtenPdf = async (payload) => {
  if (!payload)
    throw new Error("Gutachten payload data contract context is required");

  const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "p" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const usableWidth = pageWidth - DESIGN.LAYOUT.MARGIN * 2;

  let cursorY = DESIGN.LAYOUT.MARGIN;

  // Global dynamic page break checking mechanism to maintain structural layout balance
  const enforcePageBreakThreshold = (requiredSpaceMm) => {
    if (cursorY + requiredSpaceMm <= pageHeight - DESIGN.LAYOUT.MARGIN) return;
    doc.addPage();
    cursorY = DESIGN.LAYOUT.MARGIN + 5;
  };

  const renderWrappedText = (
    text,
    x,
    width,
    color = DESIGN.COLORS.TEXT_MUTED,
  ) => {
    const safeText = displayOrDash(text);
    const lines = doc.splitTextToSize(safeText, width);
    const blockHeight = lines.length * DESIGN.LAYOUT.LINE_HEIGHT;

    // Dynamically check page break based on the ACTUAL height of the wrapped text
    enforcePageBreakThreshold(blockHeight + 5);

    // FIX: Safely unpack RGB arrays, otherwise pass the single grayscale integer
    if (Array.isArray(color)) {
      doc.setTextColor(color[0], color[1], color[2]);
    } else {
      doc.setTextColor(color);
    }

    doc.text(lines, x, cursorY);
    cursorY += blockHeight + 2;
  };

  const renderSectionHeader = (titleGerman, titleEnglish) => {
    enforcePageBreakThreshold(15);
    cursorY += 4;
    doc.setFontSize(DESIGN.FONTS.SECTION);
    doc.setFont(undefined, "bold");
    doc.setTextColor(
      DESIGN.COLORS.PRIMARY[0],
      DESIGN.COLORS.PRIMARY[1],
      DESIGN.COLORS.PRIMARY[2],
    );
    doc.text(titleGerman, DESIGN.LAYOUT.MARGIN, cursorY);

    cursorY += 3.5;
    doc.setFontSize(DESIGN.FONTS.FOOTER);
    doc.setFont(undefined, "italic");
    doc.setTextColor(DESIGN.COLORS.TEXT_LIGHT);
    doc.text(titleEnglish, DESIGN.LAYOUT.MARGIN, cursorY);

    // Draw minimalist subsection line rule marker
    cursorY += 2;
    doc.setDrawColor(DESIGN.COLORS.BORDER_LIGHT);
    doc.setLineWidth(0.2);
    doc.line(
      DESIGN.LAYOUT.MARGIN,
      cursorY,
      pageWidth - DESIGN.LAYOUT.MARGIN,
      cursorY,
    );
    cursorY += 5;
  };

  cursorY = DESIGN.LAYOUT.MARGIN;
  const hasBrandImages = !!(
    payload.meta.auditOrgLetterheadUrl || payload.meta.auditOrgLogoUrl
  );

  // Inject Organization Images
  if (payload.meta.auditOrgLetterheadUrl) {
    const { dataUri, format } = await fetchImageAsDataUri(
      payload.meta.auditOrgLetterheadUrl,
    );
    doc.addImage(dataUri, format, 0, 0, pageWidth, LETTERHEAD_HEIGHT);
    cursorY = LETTERHEAD_HEIGHT + 5;
  }

  if (payload.meta.auditOrgLogoUrl) {
    const { dataUri, format } = await fetchImageAsDataUri(
      payload.meta.auditOrgLogoUrl,
    );

    const logoX = pageWidth - DESIGN.LAYOUT.MARGIN - 5;

    doc.addImage(
      dataUri,
      format,
      logoX,
      cursorY,
      LOGO_HEIGHT,
      LOGO_HEIGHT,
    );

    cursorY += 5;
  } else {
    cursorY += 15;
  }

  // =========================================================================
  // SECTION 1: HEADER & CERTIFICATION TITLE BLOCK
  // =========================================================================
  // Document formal title designation block
  doc.setFontSize(DESIGN.FONTS.TITLE);
  doc.setFont(undefined, "bold");
  doc.setTextColor(
    DESIGN.COLORS.PRIMARY[0],
    DESIGN.COLORS.PRIMARY[1],
    DESIGN.COLORS.PRIMARY[2],
  );
  doc.text(
    payload.meta.title || "GRÜNDUNGSGUTACHTEN",
    pageWidth / 2,
    cursorY + 5,
    { align: "center" },
  );

  cursorY += 13;
  doc.setFontSize(DESIGN.FONTS.BODY);
  doc.setTextColor(DESIGN.COLORS.TEXT_MAIN);

  const initialMetaGrid = [
    [
      "Gutachten vom / Date of Report:",
      formatGermanDateOnly(payload.meta.certificationDate),
    ],
    [
      "Zuständiger Prüfer / Auditor Name:",
      displayOrDash(payload.meta.auditorName),
    ],
    [
      "Prüfungsverband / Audit Association:",
      displayOrDash(payload.signature.auditOrgName),
    ],
  ];

  doc.setFont(undefined, "normal");
  for (const [label, textValue] of initialMetaGrid) {
    doc.setFont(undefined, "bold");
    doc.text(label, DESIGN.LAYOUT.MARGIN, cursorY);
    doc.setFont(undefined, "normal");
    doc.text(String(textValue), DESIGN.LAYOUT.MARGIN + 65, cursorY);
    cursorY += DESIGN.LAYOUT.LINE_HEIGHT;
  }

  // =========================================================================
  // SECTION 2: COOPERATIVE IDENTIFICATION PROFILE
  // =========================================================================
  renderSectionHeader(
    "1. Identifikation der Neugründung",
    "Cooperative Identification Profile",
  );

  doc.setFontSize(DESIGN.FONTS.BODY);
  doc.setTextColor(DESIGN.COLORS.TEXT_MAIN);
  const identityGrid = [
    [
      "Geplante Firma / Planned Name:",
      displayOrDash(payload.cooperativeDetails.name),
    ],
    [
      "Geplanter Sitz / Proposed Seat:",
      displayOrDash(payload.cooperativeDetails.proposedSeat),
    ],
    [
      "Sektor / Operational Sector:",
      displayOrDash(payload.cooperativeDetails.sector),
    ],
    [
      "Hauptansprechpartner / Contact Person:",
      displayOrDash(payload.cooperativeDetails.contactPerson),
    ],
  ];

  for (const [label, textValue] of identityGrid) {
    doc.setFont(undefined, "bold");
    doc.text(label, DESIGN.LAYOUT.MARGIN, cursorY);
    doc.setFont(undefined, "normal");
    doc.text(String(textValue), DESIGN.LAYOUT.MARGIN + 65, cursorY);
    cursorY += DESIGN.LAYOUT.LINE_HEIGHT;
  }

  // =========================================================================
  // SECTION 3: MANDATE CONTEXT & INDEPENDENCE ASSURANCE
  // =========================================================================
  renderSectionHeader(
    "2. Prüfungsauftrag & Unabhängigkeit",
    "Audit Mandate Section & Independence Profile",
  );

  const mandateGrid = [
    [
      "Datum der Beauftragung / Mandate Date:",
      formatGermanDateOnly(payload.mandateDetails.mandateDate),
    ],
    [
      "Beauftragung erfolgt durch / Issued By:",
      displayOrDash(payload.mandateDetails.mandateIssuedBy),
    ],
    [
      "Prüfungszeitraum von / Period From:",
      formatGermanDateOnly(payload.mandateDetails.auditPeriodFrom),
    ],
    [
      "Prüfungszeitraum bis / Period To:",
      formatGermanDateOnly(payload.mandateDetails.auditPeriodTo),
    ],
  ];

  for (const [label, textValue] of mandateGrid) {
    doc.setFont(undefined, "bold");
    doc.text(label, DESIGN.LAYOUT.MARGIN, cursorY);
    doc.setFont(undefined, "normal");
    doc.text(String(textValue), DESIGN.LAYOUT.MARGIN + 65, cursorY);
    cursorY += DESIGN.LAYOUT.LINE_HEIGHT;
  }

  cursorY += 2;
  doc.setFont(undefined, "bold");
  doc.text(
    "Unabhängigkeitserklärung / Conflict of Interest Check:",
    DESIGN.LAYOUT.MARGIN,
    cursorY,
  );
  cursorY += 4.5;
  doc.setFont(undefined, "normal");
  doc.setFontSize(DESIGN.FONTS.TABLE);
  doc.setTextColor(DESIGN.COLORS.TEXT_MUTED);

  const standardDeclarationStatement =
    "Es wird hiermit formell bestätigt, dass gemäß §55 GenG keine persönlichen, wirtschaftlichen oder geschäftlichen Befangenheiten oder Verflechtungen zwischen dem Prüferteam des Verbandes und der in Gründung befindlichen Genossenschaft vorliegen.";
  const wrappedDeclarationLines = doc.splitTextToSize(
    standardDeclarationStatement,
    usableWidth,
  );
  doc.text(wrappedDeclarationLines, DESIGN.LAYOUT.MARGIN, cursorY);
  cursorY += wrappedDeclarationLines.length * 4 + 2;

  // =========================================================================
  // SECTION 4: DOCUMENTS REVIEWED LEDGER
  // =========================================================================
  renderSectionHeader(
    "3. Geprüfte Gründungsunterlagen",
    " Ledger of Documents Uploaded and Checked",
  );

  const formattedDocRows = (payload.documentsChecked || []).map((docItem) => [
    displayOrDash(docItem.id),
    docItem.verified ? "Vorhanden / Checked" : "Nicht vorhanden / Open",
  ]);

  autoTable(doc, {
    startY: cursorY,
    head: [
      ["Dokumenten-ID / Document Key", "Prüfungsstatus / Verification Status"],
    ],
    body: formattedDocRows,
    theme: "grid",
    styles: {
      fontSize: DESIGN.FONTS.TABLE,
      cellPadding: 2.5,
      valign: "middle",
    },
    headStyles: {
      fillColor: DESIGN.COLORS.PRIMARY,
      textColor: 255,
      fontStyle: "bold",
    },
    alternateRowStyles: { fillColor: DESIGN.COLORS.BG_ALT_ROW },
    tableWidth: usableWidth,
    margin: { left: DESIGN.LAYOUT.MARGIN, right: DESIGN.LAYOUT.MARGIN },
  });

  cursorY = doc.lastAutoTable.finalY + 4;

  // =========================================================================
  // SECTION 5: STATUTES ASSESSMENT REPORT SUMMARY
  // =========================================================================
  renderSectionHeader(
    "4. Ergebnisse der Satzungsprüfung",
    "Statutes Assessment Report Summary (§6 GenG)",
  );

  doc.setFontSize(DESIGN.FONTS.BODY);
  doc.setTextColor(DESIGN.COLORS.TEXT_MAIN);

  doc.setFont(undefined, "bold");
  doc.text("Gesamtbewertung Satzung:", DESIGN.LAYOUT.MARGIN, cursorY);
  doc.setFont(undefined, "normal");
  doc.text(
    displayOrDash(payload.statutesAssessment.overall),
    DESIGN.LAYOUT.MARGIN + 65,
    cursorY,
  );
  cursorY += DESIGN.LAYOUT.LINE_HEIGHT + 2;

  if (payload.statutesAssessment.notes) {
    doc.setFont(undefined, "bold");
    doc.text(
      "Anmerkungen zur Satzung / Statutes Commentary:",
      DESIGN.LAYOUT.MARGIN,
      cursorY,
    );
    cursorY += 4.5;
    doc.setFont(undefined, "normal");
    doc.setTextColor(DESIGN.COLORS.TEXT_MUTED);

    renderWrappedText(
      payload.statutesAssessment.notes,
      DESIGN.LAYOUT.MARGIN,
      usableWidth,
      DESIGN.COLORS.TEXT_MUTED,
    );
  }

  // =========================================================================
  // SECTION 6: MANAGEMENT ORGANS PERSONAL SUITABILITY MATRIX
  // =========================================================================
  renderSectionHeader(
    "5. Eignungsbeurteilung der Organmitglieder",
    "Management Organs Suitability Matrix (§11 GenG)",
  );

  const organTableRows = (payload.organsSuitability || []).map((organ) => [
    displayOrDash(organ.name),
    displayOrDash(organ.type),
    displayOrDash(organ.result),
    displayOrDash(organ.commentary),
  ]);

  autoTable(doc, {
    startY: cursorY,
    head: [
      [
        "Name / Identity",
        "Organ / Board Type",
        "Ergebnis / Result",
        "Beurteilung / Commentary",
      ],
    ],
    body: organTableRows,
    theme: "grid",
    styles: { fontSize: DESIGN.FONTS.TABLE, cellPadding: 2.5, valign: "top" },
    headStyles: {
      fillColor: DESIGN.COLORS.PRIMARY,
      textColor: 255,
      fontStyle: "bold",
    },
    alternateRowStyles: { fillColor: DESIGN.COLORS.BG_ALT_ROW },
    columnStyles: {
      0: { cellWidth: usableWidth * 0.22 },
      1: { cellWidth: usableWidth * 0.18 },
      2: { cellWidth: usableWidth * 0.2 },
      3: { cellWidth: usableWidth * 0.4 },
    },
    tableWidth: usableWidth,
    margin: { left: DESIGN.LAYOUT.MARGIN, right: DESIGN.LAYOUT.MARGIN },
  });

  cursorY = doc.lastAutoTable.finalY + 4;

  // =========================================================================
  // SECTION 7: ECONOMIC VIABILITY BALANCING ANALYSIS
  // =========================================================================
  renderSectionHeader(
    "6. Wirtschaftliche Tragfähigkeit",
    "Economic Viability & Financial Assessment",
  );

  if (payload.economicAssessment) {
    doc.setFontSize(DESIGN.FONTS.BODY);
    doc.setFont(undefined, "normal");
    doc.setTextColor(DESIGN.COLORS.TEXT_MUTED);

    renderWrappedText(
      payload.economicAssessment,
      DESIGN.LAYOUT.MARGIN,
      usableWidth,
      DESIGN.COLORS.TEXT_MUTED,
    );
  }

  // =========================================================================
  // SECTION 8: COOPERATIVE PURPOSE DISCRETIONARY ASSESSMENT
  // =========================================================================
  renderSectionHeader(
    "7. Genossenschaftlicher Förderzweck",
    "Cooperative Purpose Assessment (§1 GenG)",
  );

  if (payload.purposeAssessment) {
    doc.setFontSize(DESIGN.FONTS.BODY);
    doc.setFont(undefined, "normal");
    doc.setTextColor(DESIGN.COLORS.TEXT_MUTED);

    renderWrappedText(
      payload.purposeAssessment,
      DESIGN.LAYOUT.MARGIN,
      usableWidth,
      DESIGN.COLORS.TEXT_MUTED,
    );
  }

  // =========================================================================
  // SECTION 9: CONCLUSION & LEGISLATION STATUTORY PROVISIONS
  // =========================================================================
  renderSectionHeader(
    "8. Abschließendes Prüfungsergebnis & Gutachten",
    "Audit Conclusion & Formal Opinion Statement",
  );

  doc.setFontSize(DESIGN.FONTS.BODY);
  doc.setTextColor(DESIGN.COLORS.TEXT_MAIN);

  // Render the legally mandated hardcoded text string pass directly onto the template
  doc.setFont(undefined, "bold");
  doc.text(
    "Gesetzliche Formulierung / Prescribed Legal Statement:",
    DESIGN.LAYOUT.MARGIN,
    cursorY,
  );
  cursorY += 5;

  doc.setFont(undefined, "normal");
  doc.setTextColor(
    DESIGN.COLORS.PRIMARY[0],
    DESIGN.COLORS.PRIMARY[1],
    DESIGN.COLORS.PRIMARY[2],
  );

  renderWrappedText(
    payload.conclusion.legalText,
    DESIGN.LAYOUT.MARGIN,
    usableWidth,
    DESIGN.COLORS.PRIMARY,
  );

  if (payload.conclusion.conditions) {
    doc.setFont(undefined, "bold");
    doc.setTextColor(DESIGN.COLORS.TEXT_MAIN);
    doc.text(
      "Auflagen und Bedingungen / Stated Conditions:",
      DESIGN.LAYOUT.MARGIN,
      cursorY,
    );
    cursorY += 4.5;
    doc.setFont(undefined, "normal");
    doc.setTextColor(DESIGN.COLORS.TEXT_MUTED);

    renderWrappedText(
      payload.conclusion.conditions,
      DESIGN.LAYOUT.MARGIN,
      usableWidth,
      DESIGN.COLORS.TEXT_MUTED,
    );
  }

  doc.setFont(undefined, "bold");
  doc.setTextColor(DESIGN.COLORS.TEXT_MAIN);
  doc.text(
    "Begründung des Ergebnisses / Reasoning Commentary:",
    DESIGN.LAYOUT.MARGIN,
    cursorY,
  );
  cursorY += 4.5;
  doc.setFont(undefined, "normal");
  doc.setTextColor(DESIGN.COLORS.TEXT_MUTED);

  renderWrappedText(
    payload.conclusion.reasoning,
    DESIGN.LAYOUT.MARGIN,
    usableWidth,
    DESIGN.COLORS.TEXT_MUTED,
  );

  // =========================================================================
  // SECTION 10: SIGNATURE BLOCK & QES CRYPTOGRAPHIC EMBED ANCHOR
  // =========================================================================
  renderSectionHeader(
    "9. Unterzeichnung & Bestätigung",
    "Signature Block & Certification Endorsement",
  );

  enforcePageBreakThreshold(45);
  doc.setFontSize(DESIGN.FONTS.BODY);
  doc.setTextColor(DESIGN.COLORS.TEXT_MAIN);
  doc.setFont(undefined, "normal");
  doc.text(
    `Ort, Datum / City, Date: ${displayOrDash(payload.signature.city)}, ${formatGermanDateOnly(payload.signature.gutachtenSignedAt)}`,
    DESIGN.LAYOUT.MARGIN,
    cursorY,
  );

  cursorY += 6;
  doc.setFont(undefined, "bold");
  doc.text(
    `Ausstellender Prüfungsverband: ${payload.signature.auditOrgName}`,
    DESIGN.LAYOUT.MARGIN,
    cursorY,
  );

  cursorY += 6;
  doc.setFont(undefined, "normal");
  doc.text(
    "Berücksichtigte Vorstandsmitglieder / Executive Board Directors:",
    DESIGN.LAYOUT.MARGIN,
    cursorY,
  );
  cursorY += 4.5;
  doc.setFont(undefined, "bold");
  const boardNamesString = (payload.signature.vorstandNames || []).join(", ");
  doc.text(displayOrDash(boardNamesString), DESIGN.LAYOUT.MARGIN, cursorY);

  // Structural boundary mapping placeholder block for the eventual automated backend QES signature stamping
  cursorY += 15;
  doc.setDrawColor(
    DESIGN.COLORS.PRIMARY[0],
    DESIGN.COLORS.PRIMARY[1],
    DESIGN.COLORS.PRIMARY[2],
  );
  doc.setLineWidth(0.3);

  // 1. Auditor Wet Signature Line
  enforcePageBreakThreshold(25);
  doc.line(DESIGN.LAYOUT.MARGIN, cursorY, DESIGN.LAYOUT.MARGIN + 65, cursorY);
  doc.setFontSize(DESIGN.FONTS.FOOTER);
  doc.text(
    "Prüfungsverband / Prüfer (Unterschrift)",
    DESIGN.LAYOUT.MARGIN,
    cursorY + 4,
  );

  // =========================================================================
  // GLOBAL RUNNING HEADER/FOOTER PAGINATION GENERATOR PASS
  // =========================================================================
  const totalDocumentPages = doc.internal.getNumberOfPages();
  for (let pageIndex = 1; pageIndex <= totalDocumentPages; pageIndex += 1) {
    doc.setPage(pageIndex);

    // Draw running document header line
    if (pageIndex > 1 || !hasBrandImages) {
      doc.setFontSize(DESIGN.FONTS.FOOTER - 0.5);
      doc.setTextColor(DESIGN.COLORS.TEXT_LIGHT);
      doc.text(
        `CoopPilot Gründungsprüfung Gutachten | Fall-Referenz: ${payload.signature.auditOrgName}`,
        DESIGN.LAYOUT.MARGIN,
        8,
      );
      doc.line(
        DESIGN.LAYOUT.MARGIN,
        9.5,
        pageWidth - DESIGN.LAYOUT.MARGIN,
        9.5,
      );
    }

    // Draw symmetrical footer elements
    doc.text(
      `Ausgestellt durch: ${payload.signature.auditOrgName}`,
      DESIGN.LAYOUT.MARGIN,
      pageHeight - 8,
    );
    doc.text(
      `Seite ${pageIndex} von ${totalDocumentPages}`,
      pageWidth - DESIGN.LAYOUT.MARGIN,
      pageHeight - 8,
      { align: "right" },
    );
  }

  // Compile directly to raw ArrayBuffer Node-ready storage chunk matching the specifications
  return Buffer.from(doc.output("arraybuffer"));
};
