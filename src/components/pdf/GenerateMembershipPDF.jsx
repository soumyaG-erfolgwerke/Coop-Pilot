import jsPDF from "jspdf";
import toast from "react-hot-toast";
import { maskValue } from "@/helpers/maskValue";

const GenerateMembershipPDF = async ({
  formData,
  coopData,
  coops,
  formatDateDE,
  setIsGeneratingPdf,
  signatureDetails,
}) => {
  try {
    setIsGeneratingPdf(true);

    const doc = new jsPDF();
    const left = 14;
    const col2 = 105;
    let y = 20;

    const coop = coopData || coops?.[0] || {};
    const sign = signatureDetails?.sign || "";
    const place = signatureDetails?.place || "";

    const sectionHeader = (title) => {
      doc.setFillColor(240, 240, 240); // Light gray background
      doc.rect(left, y, 182, 8, "F");
      doc.setFontSize(11);
      doc.setFont(undefined, "bold");
      doc.setTextColor(40, 40, 40);
      doc.text(title, left + 2, y + 5.5);
      doc.setTextColor(0, 0, 0); // Reset text color
      doc.setFontSize(10);
      y += 12;
    };
    const field = (label, value, xOffset = left) => {
      doc.setFont(undefined, "bold");
      doc.text(label, xOffset, y);
      doc.setFont(undefined, "normal");
      doc.text(value || "—", xOffset + 35, y);
    };

    const getBase64FromUrl = (url) => {
      return new Promise((resolve, reject) => {
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
        img.onerror = () => reject(new Error("Image failed to load due to CORS or broken URL"));
        img.src = url;
      });
    };
    let logoBase64 = null;
    if (coop.logo) {
      try {
        logoBase64 = await getBase64FromUrl(coop.logo);
      } catch (e) {
        console.error("Logo load failed:", e);
      }
    }

    const fullName = [
      formData.salutation,
      formData.title,
      formData.FirstName,
      formData.LastName,
    ].filter(Boolean).join(" ");

    const address1 = `${formData.street || ""} ${formData.houseNo || ""}`.trim();
    const address2 = `${formData.postalCode || ""} ${formData.location || ""}`.trim();

    const HOW_HEARD_MAP = {
      SCM: "Social Media",
      FAF: "Friend or Family Member",
      NAR: "News Article or Blog",
      ONS: "Online Search",
      EVT: "Event or Conference",
      OTH: "Other",
    };

    // Accent line at the very top
    doc.setFillColor(100, 100, 100);
    doc.rect(0, 0, 210, 3, "F");

    if (logoBase64) {
      doc.addImage(logoBase64, "PNG", 160, 12, 35, 18, undefined, 'FAST');
    }
    doc.setFontSize(18);
    doc.setFont(undefined, "bold");
    doc.text(coop.name || "Cooperative", left, y);

    y += 6;
    doc.setFontSize(10);
    doc.setFont(undefined, "normal");
    doc.setTextColor(80, 80, 80);

    if (coop.sector) {
      doc.text(coop.sector, left, y);
      y += 5;
    }

    doc.text(`Registered Office: ${coop.state || "—"}, ${coop.country || ""}`, left, y);
    y += 5;
    doc.text(`Reg No: ${coop.regNumber || "—"} | Court: ${coop.CourtName || "—"}`, left, y);

    doc.setTextColor(0, 0, 0);
    y += 12;

    doc.setFontSize(16);
    doc.setFont(undefined, "bold");
    doc.text("MEMBERSHIP APPLICATION", 105, y, { align: "center" });

    y += 5;
    doc.setFontSize(9);
    doc.setFont(undefined, "normal");
    doc.setTextColor(120, 120, 120);
    doc.text(`Generated on: ${new Date().toLocaleDateString("de-DE")}`, 105, y, { align: "center" });
    doc.setTextColor(0, 0, 0);

    y += 10;

    sectionHeader("1. Member Information");

    field("Full Name:", fullName, left);
    field("Member No:", formData.memberNumber, col2);
    y += 7;

    field("Date of Birth:", formatDateDE(formData.dateOfBirth), left);
    field("Entry Date:", formatDateDE(formData.entryDate), col2);
    y += 7;

    field("Status:", formData.status, left);
    y += 10;

    sectionHeader("2. Contact & Address");
    doc.setFont(undefined, "bold");
    doc.text("Residential Address:", left, y);
    doc.text("Contact Details:", col2, y);
    doc.setFont(undefined, "normal");
    y += 6;

    let addressY = y;
    if (address1) { doc.text(address1, left, addressY); addressY += 5; }
    if (address2) { doc.text(address2, left, addressY); addressY += 5; }
    if (formData.add) { doc.text(formData.add, left, addressY); addressY += 5; }

    let contactY = y;
    doc.text(`Email: ${formData.email || "—"}`, col2, contactY); contactY += 5;
    doc.text(`Phone: ${formData.telephoneNo || "—"}`, col2, contactY); contactY += 5;

    y = Math.max(addressY, contactY) + 6;
    sectionHeader("3. Membership Details");

    field("Role:", formData.wantToBe || formData.role || "Member", left);
    field("Share Price:", `€${coop.sharePrice ? coop.sharePrice : "—"}`, col2);

    y += 10;

    sectionHeader("4. Bank Details");

    field("Account Holder:", maskValue(formData.accountHolder) || "—", left);
    field("IBAN:", maskValue(formData.ibanNo) || "—", col2);
    y += 12;

    sectionHeader("5. Declaration");

    doc.setFont(undefined, "normal");
    const declarationText = "I hereby apply for membership in the above-mentioned cooperative and confirm that all information provided is accurate and complete. I agree to abide by the statutes and regulations of the cooperative.";
    const splitText = doc.splitTextToSize(declarationText, 182);
    doc.text(splitText, left, y);

    y += 25;

    // Draw signature and place if available
    doc.setFont(undefined, "normal");
    doc.setFontSize(10);
    if (place) {
      const placeAndDateText = `${place}, ${new Date().toLocaleDateString("de-DE")}`;
      doc.text(placeAndDateText, left, y - 2);
    } else {
      doc.text(new Date().toLocaleDateString("de-DE"), left, y - 2);
    }

    if (sign) {
      doc.setFont(undefined, "italic");
      doc.text(sign, col2, y - 2);
      doc.setFont(undefined, "normal");
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

    doc.text(`${coop.name || "Cooperative"} | Reg No: ${coop.regNumber || "—"}`, 105, pageHeight - 15, { align: "center" });
    doc.text(`This document is system-generated and valid without signature.`, 105, pageHeight - 11, { align: "center" });

    doc.save(`Membership_${coop.name}_${formData.memberNumber || "user"}.pdf`);
    toast.success("PDF generated successfully!");
  } catch (err) {
    console.error("PDF Generation Error: ", err);
    toast.error("Failed to generate PDF. Please try again.");
  } finally {
    setIsGeneratingPdf(false);
  }
}

export default GenerateMembershipPDF;