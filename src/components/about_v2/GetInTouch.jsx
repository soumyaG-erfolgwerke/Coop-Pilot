"use client";
import React, { useState } from "react";
import SectionWrapper from "./components/SectionWrapper";
import {
  TextInputField,
  TextAreaField,
} from "@/components/ui/input/InputFields";
import { ButtonFlippedReveal } from "@/components/ui/Buttons";
import { Send, SendHorizonal } from "lucide-react";
import { addContactUs } from "@/lib/contactUsService";
import toast from "react-hot-toast";
import { useLanguage } from "@/contexts/LanguageContext";

const GetInTouch = () => {
  const { language } = useLanguage();
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    message: "",
  });

  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("Form data submitted:", formData);
    setIsSubmitting(true);

    try {
      // Backend integration calling Appwrite database service
      await addContactUs({
        name: `${formData.firstName} ${formData.lastName}`.trim(),
        email: formData.email,
        text: formData.message,
        contactNumber: formData.phone || undefined,
      });

      setIsSubmitting(false);
      setSubmitted(true);

      // Keep success message visible for 3 seconds before resetting
      setTimeout(() => {
        setSubmitted(false);
        setFormData({
          firstName: "",
          lastName: "",
          email: "",
          phone: "",
          message: "",
        });
      }, 3000);
    } catch (error) {
      console.error("Error submitting contact form:", error);
      setIsSubmitting(false);
      toast.error(
        error.message || (language === "de" 
          ? "Fehler beim Absenden des Kontaktformulars. Bitte versuchen Sie es erneut."
          : "Failed to submit contact form. Please try again.")
      );
    }
  };

  return (
    <SectionWrapper
      wrapperClassName="bg-[#fef2ec] py-16 md:py-24"
      className="px-6 md:px-12 lg:px-16"
      padding={false}
    >
      <div className="w-full max-w-5xl p-8 mx-auto bg-white shadow-md rounded-xl sm:p-10 md:p-12">
        {/* Header */}
        <div className="flex flex-col gap-2 mb-8 text-left">
          <h2 className="text-3xl sm:text-4xl font-medium text-[#043e44] font-abhaya">
            {language === "de" ? "Kontakt aufnehmen" : "Get in Touch"}
          </h2>
          <p className="text-sm text-gray-500 sm:text-base font-dmsans">
            {language === "de" 
              ? "Unser Team ist für Sie da, um Ihre Fragen zu beantworten."
              : "Our team is here to answer your questions."}
          </p>
        </div>

        {isSubmitting ? (
          <div className="flex flex-col items-center justify-center gap-4 py-12 text-center">
            <div className="w-12 h-12 border-4 border-[#facc15] border-t-transparent rounded-full animate-spin" />
            <h3 className="text-xl font-medium text-[#043e44] font-abhaya">
              {language === "de" ? "Ihre Nachricht wird gesendet..." : "Sending your message..."}
            </h3>
          </div>
        ) : submitted ? (
          <div className="flex flex-col items-center justify-center gap-4 py-12 text-center">
            <div className="flex items-center justify-center w-16 h-16 text-3xl text-green-600 bg-green-100 rounded-full">
              ✓
            </div>
            <h3 className="text-2xl font-medium text-[#043e44] font-abhaya">
              {language === "de" ? "Vielen Dank!" : "Thank you!"}
            </h3>
            <p className="text-gray-600 font-dmsans">
              {language === "de"
                ? "Ihre Nachricht wurde erfolgreich gesendet. Wir melden uns in Kürze bei Ihnen."
                : "Your message has been sent successfully. We'll get back to you soon."}
            </p>
          </div>
        ) : (
          /* Form */
          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            <div className="grid w-full grid-cols-1 gap-6 sm:grid-cols-2">
              {/* First Name */}
              <TextInputField
                label={language === "de" ? "Vorname" : "First name"}
                value={formData.firstName}
                onChange={(val) =>
                  setFormData((prev) => ({ ...prev, firstName: val }))
                }
                placeholder={language === "de" ? "Max" : "John"}
                isRequired
              />

              {/* Last Name */}
              <TextInputField
                label={language === "de" ? "Nachname" : "Last name"}
                value={formData.lastName}
                onChange={(val) =>
                  setFormData((prev) => ({ ...prev, lastName: val }))
                }
                placeholder={language === "de" ? "Mustermann" : "Doe"}
                isRequired
              />
            </div>

            <div className="grid w-full grid-cols-1 gap-6 sm:grid-cols-2">
              {/* Email */}
              <TextInputField
                label={language === "de" ? "E-Mail" : "Email"}
                type="email"
                value={formData.email}
                onChange={(val) =>
                  setFormData((prev) => ({ ...prev, email: val }))
                }
                placeholder="max@example.com"
                isRequired
              />

              {/* Phone */}
              <TextInputField
                label={language === "de" ? "Telefonnummer" : "Phone No."}
                type="tel"
                value={formData.phone}
                onChange={(val) =>
                  setFormData((prev) => ({ ...prev, phone: val }))
                }
                placeholder="+49 (0) 123 456789"
                isRequired={false}
              />
            </div>

            {/* Message */}
            <TextAreaField
              label={language === "de" ? "Nachricht" : "Message"}
              value={formData.message}
              onChange={(val) =>
                setFormData((prev) => ({ ...prev, message: val }))
              }
              placeholder={language === "de" ? "Schreiben Sie Ihre Nachricht hier..." : "Write your message here..."}
              rows={4}
              isRequired
            />

            {/* Submit Button */}
            <div className="flex justify-start mt-2">
              <ButtonFlippedReveal
                type="submit"
                variant="contained"
                className="flex items-center justify-center gap-2 px-8 py-3 text-sm font-bold text-slate-900 capitalize bg-[#facc15] hover:bg-[#e2b80d] !rounded-full sm:w-auto"
                isBorder={false}
                rounded="full"
                isshadow={false}
                icon={<SendHorizonal />}
                hoverIcon={<Send />}
              >
                {language === "de" ? "Absenden" : "Submit"}
              </ButtonFlippedReveal>
            </div>
          </form>
        )}
      </div>
    </SectionWrapper>
  );
};

export default GetInTouch;
