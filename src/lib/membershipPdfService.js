import { jsPDF } from "jspdf";
import { Query } from "node-appwrite";
import {
  createAdminClient,
  DATABASE_ID,
  COLLECTION_ID_COOPERATIVES,
  COLLECTION_ID_USERTEXTFORM,
} from "@/lib/appwrite-server";
import { maskValue } from "@/helpers/maskValue";

const HOW_HEARD_MAP = {
  SCM: "Social Media",
  FAF: "Friend or Family Member",
  NAR: "News Article or Blog",
  ONS: "Online Search",
  EVT: "Event or Conference",
  OTH: "Other",
};

const formatDateDE = (dateString) => {
  if (!dateString) return "—";
  if (/^\d{2}\.\d{2}\.\d{4}$/.test(dateString)) return dateString;

  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;

  return new Intl.DateTimeFormat("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
};

export async function generateMembershipPdf({ coop, profile, member, newMembershipId, entryDateRaw }) {
  let coopDoc = coop || {};
  if (coop && (coop.$id || coop.coopId || member?.coopId)) {
    try {
      const { databases } = createAdminClient();
      const fetchedCoop = await databases.getDocument(
        DATABASE_ID,
        COLLECTION_ID_COOPERATIVES,
        coop.$id || coop.coopId || member.coopId
      );
      if (fetchedCoop) {
        coopDoc = fetchedCoop;
      }
    } catch (err) {
      console.error("Failed to fetch full coop details in PDF service:", err);
    }
  }

  let sign = "";
  let place = "";
  const finalUserId = member?.userId || profile?.userId;
  const finalCoopId = member?.coopId || coopDoc?.$id || coopDoc?.coopId || coop?.$id || coop?.coopId;

  if (finalUserId && finalCoopId) {
    try {
      const { databases } = createAdminClient();
      const textFormResult = await databases.listDocuments(
        DATABASE_ID,
        COLLECTION_ID_USERTEXTFORM,
        [
          Query.equal("userId", finalUserId),
          Query.equal("coopId", finalCoopId)
        ]
      );
      if (textFormResult.documents.length > 0) {
        const doc = textFormResult.documents[0];
        sign = doc.sign || "";
        place = doc.place || "";
      }
    } catch (err) {
      console.error("Failed to fetch user text form in PDF service:", err);
    }
  }

  // Fetch logo and convert to base64
  let logoBase64 = null;
  if (coopDoc.logo) {
    try {
      const logoRes = await fetch(coopDoc.logo);
      if (logoRes.ok) {
        const contentType = logoRes.headers.get("content-type") || "image/png";
        const extension = contentType.split("/")[1]?.toUpperCase() || "PNG";
        const logoFormat = (extension === "JPEG" || extension === "JPG") ? "JPEG" : "PNG";

        const arrayBuffer = await logoRes.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        logoBase64 = {
          data: `data:${contentType};base64,${buffer.toString("base64")}`,
          format: logoFormat
        };
      }
    } catch (e) {
      console.error("Logo load failed on server:", e);
    }
  }

  const doc = new jsPDF();
  const left = 14;
  const col2 = 105;
  let y = 20;

  const sectionHeader = (title) => {
    doc.setFillColor(240, 240, 240); // Light gray background
    doc.rect(left, y, 182, 8, "F");
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(40, 40, 40);
    doc.text(title, left + 2, y + 5.5);
    doc.setTextColor(0, 0, 0); // Reset text color
    doc.setFontSize(10);
    y += 12;
  };

  const field = (label, value, xOffset = left) => {
    doc.setFont("helvetica", "bold");
    doc.text(label, xOffset, y);
    doc.setFont("helvetica", "normal");
    doc.text(String(value || "—"), xOffset + 35, y);
  };

  // Accent line at the very top
  doc.setFillColor(100, 100, 100);
  doc.rect(0, 0, 210, 3, "F");

  if (logoBase64) {
    doc.addImage(logoBase64.data, logoBase64.format, 160, 12, 35, 18, undefined, 'FAST');
  }

  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text(coopDoc.name || "Cooperative", left, y);

  y += 6;
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(80, 80, 80);

  if (coopDoc.sector) {
    doc.text(coopDoc.sector, left, y);
    y += 5;
  }

  doc.text(`Registered Office: ${coopDoc.state || "—"}, ${coopDoc.country || ""}`, left, y);
  y += 5;
  doc.text(`Reg No: ${coopDoc.RegNumber || coopDoc.regNumber || "—"} | Court: ${coopDoc.CourtName || coopDoc.courtName || "—"}`, left, y);

  doc.setTextColor(0, 0, 0);
  y += 12;

  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("MEMBERSHIP APPLICATION", 105, y, { align: "center" });

  y += 5;
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(120, 120, 120);
  doc.text(`Generated on: ${new Date().toLocaleDateString("de-DE")}`, 105, y, { align: "center" });
  doc.setTextColor(0, 0, 0);

  y += 10;

  const fullName = [
    profile.salutation,
    profile.title,
    profile.FirstName,
    profile.LastName
  ].filter(Boolean).join(" ") || "Unknown Member";

  sectionHeader("1. Member Information");

  field("Full Name:", fullName, left);
  field("Member No:", newMembershipId, col2);
  y += 7;

  field("Date of Birth:", formatDateDE(profile.bday), left);
  const entryDateFormatted = formatDateDE(entryDateRaw || member?.$createdAt || new Date());
  field("Entry Date:", entryDateFormatted, col2);
  y += 7;

  field("Status:", "Active", left);
  y += 10;

  sectionHeader("2. Contact & Address");
  doc.setFont("helvetica", "bold");
  doc.text("Residential Address:", left, y);
  doc.text("Contact Details:", col2, y);
  doc.setFont("helvetica", "normal");
  y += 6;

  let addressY = y;
  const address1 = `${profile.street || ""} ${profile.houseNo || ""}`.trim();
  const address2 = `${profile.postalCode || ""} ${profile.location || ""}`.trim();
  if (address1) { doc.text(address1, left, addressY); addressY += 5; }
  if (address2) { doc.text(address2, left, addressY); addressY += 5; }
  if (profile.add) { doc.text(profile.add, left, addressY); addressY += 5; }

  let contactY = y;
  const email = profile.contactEmail || profile.email || "—";
  const telephoneNo = profile.telephoneNo || "—";
  doc.text(`Email: ${email}`, col2, contactY); contactY += 5;
  doc.text(`Phone: ${telephoneNo}`, col2, contactY); contactY += 5;

  y = Math.max(addressY, contactY) + 6;
  sectionHeader("3. Membership Details");

  field("Role:", profile.wantToBe || profile.role || "Member", left);
  field("Share Price:", `€${coopDoc.sharePrice ? coopDoc.sharePrice : "—"}`, col2);
  y += 10;

  sectionHeader("4. Bank Details");

  field("Account Holder:", maskValue(profile.accountHolder) || "—", left);
  field("IBAN:", maskValue(profile.ibanNo) || "—", col2);
  y += 12;

  sectionHeader("5. Declaration");

  doc.setFont("helvetica", "normal");
  const declarationText = "I hereby apply for membership in the above-mentioned cooperative and confirm that all information provided is accurate and complete. I agree to abide by the statutes and regulations of the cooperative.";
  const splitText = doc.splitTextToSize(declarationText, 182);
  doc.text(splitText, left, y);

  y += 25;

  // Draw signature and place if available
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  if (place) {
    const placeAndDateText = `${place}, ${new Date().toLocaleDateString("de-DE")}`;
    doc.text(placeAndDateText, left, y - 2);
  } else {
    doc.text(new Date().toLocaleDateString("de-DE"), left, y - 2);
  }

  if (sign) {
    doc.setFont("helvetica", "italic");
    doc.text(sign, col2, y - 2);
    doc.setFont("helvetica", "normal");
  }

  doc.setDrawColor(150);
  doc.line(left, y, 90, y);
  doc.line(col2, y, 196, y);
  y += 5;
  doc.setFontSize(9);
  doc.text("Place, Date", left, y);
  doc.text("Signature", col2, y);

  const pageHeight = doc.internal.pageSize.height;
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);

  doc.text(`${coopDoc.name || "Cooperative"} | Reg No: ${coopDoc.RegNumber || coopDoc.regNumber || "—"}`, 105, pageHeight - 15, { align: "center" });
  doc.text(`This document is system-generated and valid without signature.`, 105, pageHeight - 11, { align: "center" });

  const pdfArrayBuffer = doc.output("arraybuffer");
  return Buffer.from(pdfArrayBuffer);
}
