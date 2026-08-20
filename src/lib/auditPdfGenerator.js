import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const formatAnswerForPDF = (field) => {
  const isEmpty =
    field.answer === undefined ||
    field.answer === null ||
    field.answer === "" ||
    (Array.isArray(field.answer) && field.answer.length === 0);

  if (isEmpty) return "— No response provided —";

  switch (field.componentType) {
    case "checkbox":
    case "toggle":
      return field.answer ? "Yes" : "No";

    case "checkbox_group":
    case "multi_select":
    case "multiple_choice":
      const arr = Array.isArray(field.answer) ? field.answer : [field.answer];
      return arr.join(", ");

    case "file":
    case "doc_upload":
    case "file_upload":
      const files = Array.isArray(field.answer) ? field.answer : [field.answer];
      return files
        .map((f) => {
          const name = f.fileName || "Attached Document";
          const url = f.url || f.fileUrl;
          return url ? `${name} (Click to view)` : name;
        })
        .join("\n");

    default:
      return String(field.answer);
  }
};

export const generateAuditPDF = async (
  auditData,
  cooperativeName = "Audit Report",
) => {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;

  const PRIMARY_COLOR = [79, 70, 229]; 
  const SECONDARY_COLOR = [100, 116, 139]; 
  const TEXT_COLOR = [15, 23, 42]; 

  let yPosition = margin;

  const drawHeader = () => {
    doc.setFillColor(...PRIMARY_COLOR);
    doc.rect(0, 0, pageWidth, 4, "F");

    doc.setFontSize(10);
    doc.setFont(undefined, "bold");
    doc.setTextColor(...SECONDARY_COLOR);
    doc.text("OFFICIAL AUDIT REPORT", margin, 14);
    doc.setDrawColor(226, 232, 240);
    doc.line(margin, 18, pageWidth - margin, 18);

    yPosition = 28;
  };

  drawHeader();

  doc.setFontSize(22);
  doc.setFont(undefined, "bold");
  doc.setTextColor(...TEXT_COLOR);

  const docTitle = auditData?.title || "Audit Document";
  doc.text(docTitle, margin, yPosition);
  yPosition += 8;

  doc.setFontSize(11);
  doc.setFont(undefined, "normal");
  doc.setTextColor(...SECONDARY_COLOR);
  doc.text(`Cooperative: ${cooperativeName}`, margin, yPosition);
  yPosition += 6;

  const dateStr = auditData?.completedAt
    ? new Date(auditData.completedAt).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : new Date().toLocaleDateString("en-US");

  doc.text(
    `Submitted By: ${auditData?.submittedBy || "Unknown"}  |  Date: ${dateStr}`,
    margin,
    yPosition,
  );
  yPosition += 12;

  if (auditData?.phases && Array.isArray(auditData.phases)) {
    auditData.phases.forEach((phase, index) => {
      if (index > 0) yPosition += 5;

      const visibleFields = (phase.fields || []).filter(
        (f) => f.wasVisible !== false,
      );

      if (visibleFields.length === 0) return; 

      doc.setFillColor(238, 242, 255); 
      doc.rect(margin, yPosition, pageWidth - margin * 2, 10, "F");

      doc.setFontSize(11);
      doc.setFont(undefined, "bold");
      doc.setTextColor(...PRIMARY_COLOR);
      doc.text(
        `SECTION ${index + 1}: ${phase.title.toUpperCase()}`,
        margin + 4,
        yPosition + 6.5,
      );

      yPosition += 12;

      const tableBody = visibleFields.map((field, fieldIndex) => {
        return [`${fieldIndex + 1}.`, field.label, formatAnswerForPDF(field)];
      });

      autoTable(doc, {
        startY: yPosition,
        body: tableBody,
        theme: "plain",
        styles: {
          fontSize: 9,
          cellPadding: 4,
          overflow: "linebreak",
        },
        columnStyles: {
          0: { cellWidth: 10, fontStyle: "bold", textColor: SECONDARY_COLOR }, 
          1: { cellWidth: 80, fontStyle: "bold", textColor: [51, 65, 85] }, 
          2: { fontStyle: "normal", textColor: TEXT_COLOR }, 
        },
        alternateRowStyles: {
          fillColor: [248, 250, 252], 
        },
        willDrawCell: function (data) {
          if (data.column.index === 2 && data.cell.section === "body" && visibleFields[data.row.index]) {
            const field = visibleFields[data.row.index];
            if (["file", "doc_upload", "file_upload"].includes(field.componentType)) {
              doc.setTextColor(37, 99, 235); // Blue color for links
            }
          }
        },
        didDrawCell: function (data) {
          if (data.column.index === 2 && data.cell.section === "body" && visibleFields[data.row.index]) {
            const field = visibleFields[data.row.index];
            if (["file", "doc_upload", "file_upload"].includes(field.componentType)) {
              const files = Array.isArray(field.answer) ? field.answer : [field.answer];
              if (files.length > 0) {
                const url = files[0].url || files[0].fileUrl;
                if (url) {
                  // Add a clickable link area over the entire cell
                  doc.link(data.cell.x, data.cell.y, data.cell.width, data.cell.height, { url: url });
                }
              }
            }
          }
        },
        didDrawPage: function (data) {
          if (
            data.pageNumber > 1 &&
            data.cursor.y === data.settings.margin.top
          ) {
            drawHeader();
            data.settings.startY = 25; 
          }
        },
        margin: { left: margin, right: margin, top: 25, bottom: 25 },
      });

      yPosition = doc.lastAutoTable.finalY + 10;
    });
  } else {
    doc.setFontSize(12);
    doc.text("No audit questionnaire data found.", margin, yPosition);
  }

  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);

    doc.setDrawColor(226, 232, 240);
    doc.line(margin, pageHeight - 15, pageWidth - margin, pageHeight - 15);

    doc.setFontSize(8);
    doc.setFont(undefined, "normal");
    doc.setTextColor(...SECONDARY_COLOR);

    doc.text(
      `Generated securely by Coop-Pilot System`,
      margin,
      pageHeight - 10,
    );

    doc.text(`Page ${i} of ${pageCount}`, pageWidth - margin, pageHeight - 10, {
      align: "right",
    });
  }

  const safeName = cooperativeName.replace(/[^a-zA-Z0-9]/g, "_");
  doc.save(
    `Audit_Report_${safeName}_${new Date().toISOString().split("T")[0]}.pdf`,
  );
};
