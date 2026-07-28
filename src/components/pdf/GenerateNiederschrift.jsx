import jsPDF from "jspdf";

export const generateNiederschriftPDF = async ({
  assembly,
  agendaData,
  chair,
  secretary,
  cooperativeName,
  coopData,
}) => {
  const doc = new jsPDF();

  let y = 20;
  const marginLeft = 15;
  const contentWidth = 180;
  const pageHeight = doc.internal.pageSize.height;

  const getBase64Image = (url) => {
    return new Promise((resolve) => {
      if (!url) return resolve(null);
      const img = new window.Image();
      img.crossOrigin = "Anonymous";
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL("image/png"));
      };
      img.onerror = () => {
        console.warn("Failed to load logo for PDF generation.");
        resolve(null);
      };
      img.src = url;
    });
  };

  const logoBase64 = coopData?.logo
    ? await getBase64Image(coopData.logo)
    : null;
  const stampBase64 = await getBase64Image("images/stamp.png");

  const date = new Date(
    assembly?.startDateTime || assembly?.$createdAt || Date.now(),
  ).toLocaleString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const location =
    assembly?.format === "virtual" || assembly?.format === "virtuell"
      ? assembly?.platformUrl || "Virtuell"
      : assembly?.location || "Vor Ort";

  const format =
    assembly?.format === "virtual" || assembly?.format === "virtuell"
      ? "VIRTUELL"
      : "PRÄSENZ";

  let attendance = {
    totalMembers: 0,
    totalShares: 0,
    presentMembers: 0,
    proxyMembers: 0,
    representedMembers: 0,
    presentShares: 0,
    proxyShares: 0,
    representedShares: 0,
  };

  try {
    if (assembly?.attendanceSummary) {
      attendance = assembly.attendanceSummary;
    } else if (assembly?.attendanceSummaryJson) {
      attendance = JSON.parse(assembly.attendanceSummaryJson);
    }
  } catch (err) {
    console.error("Attendance parse failed:", err);
  }

  const presentMembers = attendance.presentMembers || 0;
  const proxyMembers = attendance.proxyMembers || 0;
  const representedMembers = attendance.representedMembers || 0;
  const presentShares = attendance.presentShares || 0;
  const proxyShares = attendance.proxyShares || 0;
  const representedShares = attendance.representedShares || 0;

  const quorumPercentage = assembly?.quorum ?? 0;
  const quorumMet = assembly?.quorumMet ?? false;
  const finalisedAtUTC = new Date().toISOString();

  const checkPageBreak = (spaceRequired) => {
    if (y + spaceRequired > pageHeight - 25) {
      doc.addPage();
      y = 20;
    }
  };

  const addTextWithPagination = (text, x, startY, maxWidth) => {
    const lines = doc.splitTextToSize(text || "-", maxWidth);
    let currentY = startY;

    lines.forEach((line) => {
      if (currentY > pageHeight - 25) {
        doc.addPage();
        currentY = 20;
      }
      doc.text(line, x, currentY);
      currentY += 5.5;
    });
    return currentY;
  };

  doc.setFillColor(50, 65, 80);
  doc.rect(0, 0, 210, 4, "F");

  if (logoBase64) {
    doc.addImage(logoBase64, "PNG", 175, 12, 20, 20, undefined, "FAST");
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("Niederschrift der ordentlichen Generalversammlung", marginLeft, y);

  y += 8;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(80, 80, 80);
  doc.text(
    coopData?.name || cooperativeName || "Genossenschaft",
    marginLeft,
    y,
  );

  y += 5;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(120, 120, 120);

  const regText = coopData?.regNumber
    ? ` | Reg.-Nr.: ${coopData.regNumber}`
    : "";
  const courtText = coopData?.CourtName
    ? ` | Registergericht: ${coopData.CourtName}`
    : "";

  doc.text(
    `Erstellt gemäß §47 Genossenschaftsgesetz (GenG)${regText}${courtText}`,
    marginLeft,
    y,
  );

  y += 6;
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.5);
  doc.line(marginLeft, y, 195, y);

  y += 8;

  const col1X = marginLeft + 4;
  const col1ValX = marginLeft + 35;
  const col2X = 105;
  const col2ValX = 142;
  const maxTextWidth = 45;

  const chairLines = doc.splitTextToSize(chair || "-", maxTextWidth);
  const locationLines = doc.splitTextToSize(location || "-", maxTextWidth);
  const gridHeight =
    20 + Math.max(chairLines.length, locationLines.length) * 5.5;

  doc.setFillColor(248, 249, 250);
  doc.rect(marginLeft, y, contentWidth, gridHeight, "F");

  let metaY = y + 7;
  doc.setFontSize(9);

  doc.setFont("helvetica", "bold");
  doc.setTextColor(100, 100, 100);
  doc.text("Meeting Format:", col1X, metaY);
  doc.text("Date / Time:", col2X, metaY);

  doc.setFont("helvetica", "normal");
  doc.setTextColor(0, 0, 0);
  doc.text(format, col1ValX, metaY);
  doc.text(date, col2ValX, metaY);

  metaY += 7;

  doc.setFont("helvetica", "bold");
  doc.setTextColor(100, 100, 100);
  doc.text("Meeting Chair:", col1X, metaY);
  doc.text("Location / Platform:", col2X, metaY);

  doc.setFont("helvetica", "normal");
  doc.setTextColor(0, 0, 0);
  doc.text(chairLines, col1ValX, metaY);
  doc.text(locationLines, col2ValX, metaY);

  metaY += Math.max(chairLines.length, locationLines.length) * 5.5;

  doc.setFont("helvetica", "bold");
  doc.setTextColor(100, 100, 100);
  doc.text("Secretary:", col1X, metaY);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(0, 0, 0);
  doc.text(secretary || "-", col1ValX, metaY);

  y = metaY + 10;

  checkPageBreak(35);

  doc.setDrawColor(220, 225, 230);
  doc.setLineWidth(0.3);
  doc.setFillColor(255, 255, 255);
  doc.rect(marginLeft, y, contentWidth, 24, "FD");

  y += 7;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("Determination of Attendance and Voting Rights", marginLeft + 4, y);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(
    `Members Present: ${presentMembers} (by proxy: ${proxyMembers}, represented: ${representedMembers})`,
    marginLeft + 4,
    y + 6,
  );
  doc.text(
    `Represented Shares: ${presentShares} (by proxy: ${proxyShares}, represented: ${representedShares})`,
    marginLeft + 4,
    y + 11,
  );

  y += 20;
  doc.setFont("helvetica", "bold");
  doc.text("Feststellung der Beschlussfähigkeit:", marginLeft + 4, y);

  if (quorumMet) {
    doc.setTextColor(20, 140, 70);
    doc.text("Die Beschlussfähigkeit wurde festgestellt.", marginLeft + 62, y);
    doc.setFont("helvetica", "normal");
    doc.text(
      `Erforderliches Quorum: ${quorumPercentage}%`,
      marginLeft + 62,
      y + 5,
    );
  } else {
    doc.setTextColor(210, 50, 50);
    doc.text(
      `Nicht gegeben — Quorum nicht erreicht (${quorumPercentage}%)`,
      marginLeft + 62,
      y,
    );
  }

  doc.setTextColor(0, 0, 0);

  y += 14;

  agendaData?.forEach((item, index) => {
    checkPageBreak(45);

    doc.setFillColor(60, 75, 90);
    doc.rect(marginLeft, y, contentWidth, 9, "F");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(255, 255, 255);
    doc.text(`TOP ${index + 1}: ${item.title}`, marginLeft + 4, y + 6);
    doc.setTextColor(0, 0, 0);
    y += 14;

    if (item.discussion && item.discussion.trim() !== "") {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.text("Zusammenfassung der Aussprache:", marginLeft, y);
      y += 6;

      doc.setFont("helvetica", "normal");
      y = addTextWithPagination(item.discussion, marginLeft, y, contentWidth);
      y += 4;
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text("Beschlusstext:", marginLeft, y);
    y += 6;

    doc.setFont("helvetica", "normal");
    y = addTextWithPagination(
      item.resolution || "Kein Beschlusstext hinterlegt.",
      marginLeft,
      y,
      contentWidth,
    );
    y += 6;

    checkPageBreak(25);

    doc.setFillColor(248, 249, 250);
    doc.setDrawColor(230, 230, 230);
    doc.rect(marginLeft, y, contentWidth, 18, "FD");

    const passed = item.yes >= item.no;

    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text("VOTING:", marginLeft + 4, y + 10);

    doc.setFont("helvetica", "normal");
    doc.text(`YES: ${item.yes}`, marginLeft + 24, y + 10); 
    doc.text(`NO: ${item.no}`, marginLeft + 44, y + 10); 
    doc.text(`ABSTENTIONS: ${item.abstain}`, marginLeft + 64, y + 10);

    doc.setFont("helvetica", "bold");
    if (passed) {
      doc.setTextColor(20, 140, 70);
      doc.text("STATUS: PASSED", 138, y + 10); 
    } else {
      doc.setTextColor(210, 50, 50);
      doc.text("STATUS: REJECTED", 138, y + 10); 
    }

    doc.setTextColor(0, 0, 0);
    y += 20;
  });

  checkPageBreak(75);

  y += 15;

  doc.setFont("helvetica", "italic");

  doc.setFontSize(9);

  doc.setTextColor(120, 120, 120);

  doc.text(
    "Vorstehende Niederschrift wurde ordnungsgemäß erstellt und elektronisch freigegeben.",
    marginLeft,
    y - 8,
  );

  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.3);

  doc.line(marginLeft, y, marginLeft + 70, y);
  doc.line(125, y, 195, y);

  y += 5;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);

  doc.text(`Versammlungsleiter`, marginLeft, y);
  doc.text(`Schriftführer`, 125, y);

  y += 5;
  doc.setFont("helvetica", "bold");
  doc.setTextColor(0, 0, 0);
  doc.text(chair || "-", marginLeft, y);
  doc.text(secretary || "-", 125, y);

  y += 18;

  if (stampBase64) {
    const stampW = 40;
    const stampH = 40;

    const stampX = 145;
    const stampY = y + 5;

    doc.setFont("helvetica", "italic");
    doc.setFontSize(8);
    doc.setTextColor(130, 130, 130);

    doc.text("Digitally approved", stampX + 6, stampY - 3);

    doc.saveGraphicsState();

    doc.setGState(
      new doc.GState({
        opacity: 0.55,
      }),
    );

    doc.addImage(
      stampBase64,
      "PNG",
      stampX,
      stampY,
      stampW,
      stampH,
      undefined,
      "FAST",
      30, 
    );

    y = stampY + stampH + 10;
  }

  doc.setTextColor(0, 0, 0);

  const pageCount = doc.internal.getNumberOfPages();

  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);

    doc.setDrawColor(220, 220, 220);
    doc.setLineWidth(0.5);
    doc.line(marginLeft, pageHeight - 15, 195, pageHeight - 15);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);

    doc.text(
      `System-Referenz: Dokument kryptografisch geschlossen am (UTC) ${finalisedAtUTC}`,
      marginLeft,
      pageHeight - 9,
    );
    doc.text(`Seite ${i} von ${pageCount}`, 195, pageHeight - 9, {
      align: "right",
    });
  }

  return doc.output("blob");
};
