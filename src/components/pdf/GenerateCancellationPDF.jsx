import jsPDF from "jspdf";
import toast from "react-hot-toast";

const GenerateCancellationPDF = async ({
  payout,
  profile,
  coopName,
}) => {
  const formatDate = (dateString) => {
    if (!dateString) return "—";
    try {
      const d = new Date(dateString);
      if (isNaN(d.getTime())) return dateString;
      return d.toLocaleDateString("de-DE");
    } catch {
      return dateString;
    }
  };

  try {
    const doc = new jsPDF();
    const left = 14;
    const col2 = 105;
    let y = 20;

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

    // Accent line at the very top
    doc.setFillColor(79, 70, 229); // Indigo top accent
    doc.rect(0, 0, 210, 3, "F");

    doc.setFontSize(18);
    doc.setFont(undefined, "bold");
    doc.text(coopName || "Cooperative", left, y);

    y += 12;

    doc.setFontSize(16);
    doc.setFont(undefined, "bold");
    doc.text("MEMBERSHIP CANCELLATION ACKNOWLEDGMENT", 105, y, { align: "center" });

    y += 5;
    doc.setFontSize(9);
    doc.setFont(undefined, "normal");
    doc.setTextColor(120, 120, 120);
    doc.text(`Generated on: ${new Date().toLocaleDateString("de-DE")}`, 105, y, { align: "center" });
    doc.setTextColor(0, 0, 0);

    y += 10;

    sectionHeader("1. Member Details");

    const fullName = [
      profile?.salutation,
      profile?.title,
      profile?.FirstName || profile?.firstName,
      profile?.LastName || profile?.lastName,
    ].filter(Boolean).join(" ");

    field("Full Name:", fullName || "—", left);
    field("Member No:", payout.memberId || profile?.memberNumber || "—", col2);
    y += 7;

    field("Email:", profile?.contactEmail || profile?.email || "—", left);
    field("Phone:", profile?.telephoneNo || "—", col2);
    y += 10;

    sectionHeader("2. Cancellation & Payout Details");

    field("Shares Cancelled:", String(payout.shares || "—"), left);
    field("Payout Amount:", payout.price ? `€${parseFloat(payout.price).toLocaleString("de-DE", { minimumFractionDigits: 2 })}` : "—", col2);
    y += 7;

    field("Exit Date:", formatDate(payout.exitDate), left);
    field("Submission Date:", formatDate(payout.submissionDate), col2);
    y += 7;

    field("Payment Status:", payout.isPayPending ? "Pending" : "Paid", left);
    field("Transaction ID:", payout.TransactionId || "—", col2);
    y += 10;

    sectionHeader("3. Bank Details for Payout");

    field("Account Holder:", profile?.accountHolder || "—", left);
    field("IBAN:", profile?.ibanNo || "—", col2);
    y += 12;

    sectionHeader("4. Acknowledgment Statement");

    doc.setFont(undefined, "normal");
    const statementText = `This document serves as formal acknowledgment of the membership cancellation request submitted on ${formatDate(payout.submissionDate)}. The cooperative hereby registers the cancellation of ${payout.shares || 0} shares, with a corresponding payout value of €${parseFloat(payout.price || 0).toLocaleString("de-DE", { minimumFractionDigits: 2 })}, scheduled for release around ${formatDate(payout.exitDate)}.`;
    const splitText = doc.splitTextToSize(statementText, 182);
    doc.text(splitText, left, y);

    y += 25;

    doc.setFont(undefined, "normal");
    doc.setFontSize(10);
    doc.text(new Date().toLocaleDateString("de-DE"), left, y - 2);

    doc.setFont(undefined, "italic");
    doc.setFontSize(9);
    doc.text("this is a computer-generated document", col2, y - 2);

    doc.setFont(undefined, "normal");
    doc.setDrawColor(150);
    doc.line(left, y, 90, y);
    doc.line(col2, y, 196, y);
    y += 5;
    doc.setFontSize(9);
    doc.text("Place, Date", left, y);
    doc.text("Authorized Signature (Cooperative)", col2, y);

    const pageHeight = doc.internal.pageSize.height;
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);

    doc.text(`${coopName || "Cooperative"}`, 105, pageHeight - 15, { align: "center" });
    doc.text(`This document is system-generated and valid without signature.`, 105, pageHeight - 11, { align: "center" });

    doc.save(`Cancellation_Acknowledgment_${coopName.replace(/\s+/g, "_")}_${payout.memberId || "member"}.pdf`);
    toast.success("Cancellation acknowledgment PDF generated successfully!");
  } catch (err) {
    console.error("PDF Generation Error: ", err);
    toast.error("Failed to generate PDF. Please try again.");
  }
};

export default GenerateCancellationPDF;
