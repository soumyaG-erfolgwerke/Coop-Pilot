"use client";

import React, { useState } from "react";
import { Lock, Eye, EyeOff } from "lucide-react";
import AvvModal from "@/components/avv";
import jsPDF from "jspdf";
import TrustcaptchaComponent from "@/components/shared/TrustCaptchaWrapper";


const OnboardingPage6 = ({
  formData,
  handleChange,
  errors,
  setFormData,
  setErrors,
  handleCaptchaChange
}) => {
  const [isAvvModalOpen, setIsAvvModalOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const isDeployment = process.env.NEXT_PUBLIC_NODE_ENV === "production";

  // const handleAvvAccept = () => {
  //   handleChange({
  //     target: {
  //       name: "avvDeclaration",
  //       value: true,
  //     },
  //   });

  //   setIsAvvModalOpen(false);

  //   if (errors.avvDeclaration) {
  //     setErrors((prev) => ({
  //       ...prev,
  //       avvDeclaration: "",
  //     }));
  //   }
  // };

  const handleAvvAccept = (avvDetails) => {
    const doc = new jsPDF();

    // Title
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

    // Generate Blob
    const pdfBlob = doc.output("blob");

    // Create File
    const pdfFile = new File(
      [pdfBlob],
      `AVV_${avvDetails.name.replace(/\s+/g, "_")}.pdf`,
      {
        type: "application/pdf",
      },
    );

    handleChange({
      target: {
        name: "avvDeclaration",
        value: true,
      },
    });

    handleChange({
      target: {
        name: "avvFile",
        value: pdfFile,
      },
    });

    setIsAvvModalOpen(false);

    // Clear error
    if (errors.avvDeclaration) {
      setErrors((prev) => ({
        ...prev,
        avvDeclaration: "",
      }));
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="mb-6 text-center">
        <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-teal-100 rounded-full dark:bg-teal-900/30">
          <Lock size={32} className="text-teal-600 dark:text-teal-400" />
        </div>

        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
          Set Password
        </h2>

        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          Create a secure password for your account
        </p>
      </div>

      <div className="space-y-6">
        <div className="p-4 border border-blue-200 rounded-lg bg-blue-50 dark:bg-primary-dark-900/20 dark:border-blue-800 animate-fadeInUp">
          <p className="mb-2 text-sm font-medium text-blue-primary dark:text-blue-200">
            Password Requirements:
          </p>

          <ul className="space-y-1 text-xs text-blue-700 list-disc list-inside dark:text-blue-300">
            <li>Minimum 8 characters</li>
            <li>At least one uppercase letter (A-Z)</li>
            <li>At least one lowercase letter (a-z)</li>
            <li>At least one number (0-9)</li>
            <li>At least one special character (e.g., !@#$%^&*)</li>
          </ul>
        </div>

        <div className="animate-fadeInUp">
          <label
            htmlFor="password"
            className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Password <span className="text-red-500">*</span>
          </label>

          <div className="relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <Lock size={18} className="text-gray-400" />
            </div>

            <input
              type={showPassword ? "text" : "password"}
              id="password"
              name="password"
              value={formData.password || ""}
              onChange={handleChange}
              placeholder="••••••••"
              className={`mt-1 block w-full pl-10 py-2.5 pr-10 border ${errors.password
                  ? "border-red-500"
                  : "border-gray-300 dark:border-slate-600"
                } bg-white dark:bg-slate-700 rounded-md shadow-sm focus:outline-none focus:ring-2 ${errors.password
                  ? "focus:ring-red-500"
                  : "focus:ring-primary dark:focus:ring-primary/80"
                } sm:text-sm transition-all duration-200`}
            />

            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 focus:outline-none mt-1"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          {errors.password && (
            <p className="mt-1 text-xs text-red-500">{errors.password}</p>
          )}
        </div>

        <div className="animate-fadeInUp">
          <label
            htmlFor="confirmPassword"
            className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Confirm Password <span className="text-red-500">*</span>
          </label>

          <div className="relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <Lock size={18} className="text-gray-400" />
            </div>

            <input
              type={showConfirmPassword ? "text" : "password"}
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword || ""}
              onChange={handleChange}
              placeholder="••••••••"
              className={`mt-1 block w-full pl-10 py-2.5 pr-10 border ${errors.confirmPassword
                  ? "border-red-500"
                  : "border-gray-300 dark:border-slate-600"
                } bg-white dark:bg-slate-700 rounded-md shadow-sm focus:outline-none focus:ring-2 ${errors.confirmPassword
                  ? "focus:ring-red-500"
                  : "focus:ring-primary dark:focus:ring-primary/80"
                } sm:text-sm transition-all duration-200`}
            />

            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 focus:outline-none mt-1"
            >
              {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          {errors.confirmPassword && (
            <p className="mt-1 text-xs text-red-500">
              {errors.confirmPassword}
            </p>
          )}
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

            {errors.avvDeclaration && (
              <p className="mt-1 text-xs text-red-500">
                {errors.avvDeclaration}
              </p>
            )}
          </div>
        </div>

        <div className="mt-4">
          {isDeployment && (
            <>
              {/* TrustCaptcha temporarily disabled.
                  Google reCAPTCHA is currently the active provider.
                  Existing implementation retained for future use.
              <TrustcaptchaComponent
                sitekey={process.env.NEXT_PUBLIC_TRUST_CAPTCHA_SITE_KEY}
                onCaptchaSolved={(event) => {
                  handleCaptchaChange(event.detail);
                }}
                onCaptchaFailed={() => {
                  handleCaptchaChange("");
                }}
              />
              */}
              <TrustcaptchaComponent
                captchaToken={formData.captchaToken}
                onCaptchaSolved={(event) => {
                  handleCaptchaChange(event.detail);
                }}
                onCaptchaFailed={() => {
                  handleCaptchaChange("");
                }}
              />
            </>
          )}
        </div>
      </div>


      <AvvModal
        isOpen={isAvvModalOpen}
        onClose={() => setIsAvvModalOpen(false)}
        onAccept={handleAvvAccept}
        userName={
          formData.fullLegalFirstMiddleName
            ? `${formData.fullLegalFirstMiddleName} ${formData.fullLegalLastName || ""}`.trim()
            : ""
        }
      />
    </div>
  );
};

export default OnboardingPage6;
