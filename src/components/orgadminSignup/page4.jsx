"use client";
import React, { useMemo, useState } from "react";
import { CheckCircle, ChevronDown } from "lucide-react";
import jsPDF from "jspdf";
import AvvModal from "@/components/avv";

const StatusBadge = ({ status }) => {
  const styles = {
    complete: "bg-green-100 text-green-700",
    incomplete: "bg-amber-100 text-amber-700",
    required: "bg-red-100 text-red-700",
  };
  const label = status === "complete" ? "Complete" : status === "required" ? "Required" : "Incomplete";
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${styles[status]}`}>{label}</span>
  );
};

const Page4 = ({ formData, canActivateAccount, setFormData, errors, setErrors }) => {
  const [openSections, setOpenSections] = useState({
    step1: true,
    step2: false,
    step2a: false,
    step3: false
  });
  const [isAvvModalOpen, setIsAvvModalOpen] = useState(false);

  const handleAvvAccept = (avvDetails) => {
    const doc = new jsPDF();

    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text("Allgemeine Geschäftsbedingungen (AVV)", 20, 20);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(12);

    const textOptions = {
      maxWidth: 170,
      align: "left",
    };

    let y = 30;

    const terms = [
      {
        title: "1. Geltungsbereich",
        text: "Diese Allgemeinen Vertragsbedingungen (AVV) gelten für alle Mitgliedschaften und die damit verbundenen Rechte und Pflichten innerhalb der Genossenschaft.",
      },
      {
        title: "2. Mitgliedschaft",
        text: "Die Mitgliedschaft bedarf der Unterzeichnung dieser Erklärung und der Bestätigung durch den Vorstand. Jedes Mitglied verpflichtet sich, die Satzung der Genossenschaft anzuerkennen und danach zu handeln.",
      },
      {
        title: "3. Datenschutz",
        text: "Wir verarbeiten Ihre personenbezogenen Daten im Einklang mit den geltenden Datenschutzgesetzen (DSGVO). Ihre Daten werden ausschließlich für Zwecke der Mitgliederverwaltung verwendet.",
      },
      {
        title: "4. Haftung",
        text: "Die Genossenschaft haftet nur bei Vorsatz oder grober Fahrlässigkeit. Eine weitergehende Haftung ist ausgeschlossen.",
      },
    ];

    terms.forEach((term) => {
      doc.setFont("helvetica", "bold");
      doc.text(term.title, 20, y);
      y += 8;

      doc.setFont("helvetica", "normal");
      const textLines = doc.splitTextToSize(term.text, textOptions.maxWidth);
      doc.text(textLines, 20, y);
      y += textLines.length * 7 + 5;
    });

    y += 10;
    doc.setFont("helvetica", "bold");
    doc.text("Confirmation Details:", 20, y);

    y += 10;
    doc.setFont("helvetica", "normal");
    doc.text(`Name: ${avvDetails.name}`, 20, y);
    y += 8;
    doc.text(`Place: ${avvDetails.place}`, 20, y);
    y += 8;
    doc.text(`Date & Time: ${avvDetails.date}`, 20, y);

    const pdfBlob = doc.output("blob");
    const pdfFile = new File(
      [pdfBlob],
      `AVV_${avvDetails.name.replace(/\s+/g, "_")}.pdf`,
      {
        type: "application/pdf",
      },
    );

    if (setFormData) {
      setFormData((prev) => ({
        ...prev,
        avvDeclaration: true,
        avvFile: pdfFile,
      }));
    }

    setIsAvvModalOpen(false);

    if (errors?.avvDeclaration) {
      setErrors((prev) => ({
        ...prev,
        avvDeclaration: "",
      }));
    }
  };

  const sections = useMemo(() => {
    const phone = formData.phoneNumber
      ? `${formData.phoneCountryCode} ${formData.phoneNumber}`
      : "Incomplete";

    const step1Complete =
      !!formData.firstName && !!formData.lastName && !!formData.email && !!formData.phoneNumber;

    const step2Complete =
      !!formData.organisationName &&
      !!formData.street &&
      !!formData.city &&
      !!formData.postcode &&
      !!formData.zulassungNumber;

    const step2aComplete =
      !!formData.iban &&
      !!formData.ibanAccountHolder &&
      !!formData.bic &&
      !!formData.ibanVerified;

    const ibanDisplay = formData.iban
      ? formData.iban.replace(/\s+/g, "").replace(/(.{4})/g, "$1 ").trim()
      : "Incomplete";

    const step3HasLogo = !!formData.logoFile;
    const step3HasStamp = !!formData.stampFile;

    return [
      {
        id: "step1",
        title: "Step 1 — Account Setup",
        status: step1Complete ? "complete" : "required",
        items: [
          `Name: ${formData.firstName || "Incomplete"} ${formData.lastName || ""}`.trim(),
          `Email: ${formData.email || "Incomplete"}`,
          `Phone: ${phone}`,
        ],
      },
      {
        id: "step2",
        title: "Step 2 — Organisation Profile",
        status: step2Complete ? "complete" : "required",
        items: [
          `Organisation name: ${formData.organisationName || "Incomplete"}`,
          `Address: ${formData.street ? `${formData.street}, ${formData.postcode} ${formData.city}` : "Incomplete"}`,
          `Zulassung number: ${formData.zulassungNumber || "Incomplete"}`,
        ],
      },
      {
        id: "step2a",
        title: "Step 2A — IBAN Verification",
        status: step2aComplete ? "complete" : "required",
        items: [
          `IBAN: ${ibanDisplay}`,
          `Account holder: ${formData.ibanAccountHolder || "Incomplete"}`,
          `BIC: ${formData.bic || "Incomplete"}`,
          `IBAN verified: ${formData.ibanVerified ? "Yes" : "No"}`,
        ],
      },
      {
        id: "step3",
        title: "Step 3 — Branding & Signature",
        status: step3HasLogo ? "complete" : "incomplete",
        items: [
          `Logo uploaded: ${step3HasLogo ? "Yes" : "No"}`,
          "Letterhead: Incomplete",
          "QES certificate: Incomplete",
          `Official stamp: ${step3HasStamp ? "Yes" : "No"}`,
        ],
      },
    ];
  }, [formData]);

  const toggleSection = (id) => {
    setOpenSections((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="mb-6 text-center">
        <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-tint rounded-full dark:bg-primary-dark-900/30">
          <CheckCircle size={32} className="text-blue-600 dark:text-primary/80" />
        </div>
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Review Your Setup</h2>
        <p className="mt-1 text-sm text-gray-500">Einrichtung uberprufen</p>
        <p className="mt-3 text-sm text-gray-600 dark:text-gray-400">
          Please review everything below before activating your account. You can go back to any step
          to make changes. Steps marked Incomplete can be finished later from your dashboard.
        </p>
      </div>

      <div className="space-y-4">
        {sections.map((section) => (
          <div key={section.id} className="border border-gray-200 dark:border-slate-700 rounded-lg">
            <button
              type="button"
              onClick={() => toggleSection(section.id)}
              className="w-full flex items-center justify-between px-4 py-3 text-left"
            >
              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                  {section.title}
                </span>
                <StatusBadge status={section.status} />
              </div>
              <ChevronDown
                size={18}
                className={`text-gray-500 transition-transform ${
                  openSections[section.id] ? "rotate-180" : ""
                }`}
              />
            </button>
            {openSections[section.id] && (
              <div className="px-4 pb-4 text-sm text-gray-600 dark:text-gray-300">
                <ul className="space-y-1">
                  {section.items.map((item, idx) => (
                    <li key={`${section.id}-${idx}`}>{item}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="flex items-start pt-4 border-t border-gray-200 dark:border-slate-700 animate-fadeInUp">
        <input
          id="avvDeclaration"
          name="avvDeclaration"
          type="checkbox"
          checked={formData.avvDeclaration || false}
          readOnly
          onClick={(e) => {
            e.preventDefault();
            setIsAvvModalOpen(true);
          }}
          className="h-5 w-5 text-blue-600 border-gray-300 dark:border-slate-500 rounded focus:ring-primary mt-0.5 cursor-pointer"
        />

        <div className="ml-3 text-sm">
          <label
            htmlFor="avvDeclaration"
            className="font-medium text-gray-700 dark:text-gray-300"
          >
            I have read and accept the{" "}
            <span
              className="text-blue-600 cursor-pointer hover:underline"
              onClick={() => setIsAvvModalOpen(true)}
            >
              AVV (Privacy Policies and Terms)
            </span>
            . <span className="text-red-500">*</span>
          </label>

          {errors?.avvDeclaration && (
            <p className="mt-1 text-xs text-red-500">{errors.avvDeclaration}</p>
          )}

          {errors?.avvFile && (
            <p className="mt-1 text-xs text-red-500">{errors.avvFile}</p>
          )}
        </div>
      </div>

      {!canActivateAccount && (
        <div className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-3 py-2">
          Activation is blocked until IBAN is verified.
        </div>
      )}

      <AvvModal
        isOpen={isAvvModalOpen}
        onClose={() => setIsAvvModalOpen(false)}
        onAccept={handleAvvAccept}
      />
    </div>
  );
};

export default Page4;
