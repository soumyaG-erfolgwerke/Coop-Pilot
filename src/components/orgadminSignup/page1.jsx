"use client";
import React from "react";
import { User, Mail, Phone, Lock } from "lucide-react";
import FormBuilder from "./FormBuilder";
import TrustcaptchaComponent from "@/components/shared/TrustCaptchaWrapper";


const titleOptions = [
  { value: "Dr.", label: "Dr." },
  { value: "Prof.", label: "Prof." },
  { value: "Prof.Dr.", label: "Prof.Dr." },
];

const phoneCountryOptions = [
  { value: "+49", label: "🇩🇪 +49", searchValue: "DE Germany +49" },
  { value: "+33", label: "🇫🇷 +33", searchValue: "FR France +33" },
  { value: "+39", label: "🇮🇹 +39", searchValue: "IT Italy +39" },
  { value: "+31", label: "🇳🇱 +31", searchValue: "NL Netherlands +31" },
  { value: "+32", label: "🇧🇪 +32", searchValue: "BE Belgium +32" },
  { value: "+43", label: "🇦🇹 +43", searchValue: "AT Austria +43" },
  { value: "+41", label: "🇨🇭 +41", searchValue: "CH Switzerland +41" },
  { value: "+34", label: "🇪🇸 +34", searchValue: "ES Spain +34" },
  { value: "+351", label: "🇵🇹 +351", searchValue: "PT Portugal +351" },
  { value: "+45", label: "🇩🇰 +45", searchValue: "DK Denmark +45" },
  { value: "+46", label: "🇸🇪 +46", searchValue: "SE Sweden +46" },
  { value: "+47", label: "🇳🇴 +47", searchValue: "NO Norway +47" },
  { value: "+358", label: "🇫🇮 +358", searchValue: "FI Finland +358" },
  { value: "+44", label: "🇬🇧 +44", searchValue: "UK United Kingdom +44" },
];

const Page1 = ({ formData, handleChange, handleBlur, errors, handleCaptchaChange }) => {
  const isDeployment = process.env.NODE_ENV === "production";
  
  const formRows = [
    [
      {
        name: "email",
        type: "text",
        label: "Email",
        required: true,
        placeholder: "e.g. yourname@example.com",
        icon: <Mail size={18} className="text-gray-400" />,
        description: "We'll use this email to sign you in and send important notifications.",
      },
    ],
    [
      {
        name: "title",
        type: "simple-select",
        label: "Title",
        optional: true,
        options: titleOptions,
      },
    ],
    [
      {
        name: "firstName",
        type: "text",
        label: "First Name",
        required: true,
        icon: <User size={18} className="text-gray-400" />,
        placeholder: "e.g. Klaus",
      },
      {
        name: "lastName",
        type: "text",
        label: "Last Name",
        required: true,
        placeholder: "e.g. Müller",
      },
    ],
    [
      {
        name: "phone",
        type: "composite",
        label: "Phone Number",
        required: true,
        description: "Enter your direct phone number including country code.",
        parts: [
          {
            name: "phoneCountryCode",
            comp: "searchable",
            options: phoneCountryOptions,
            placeholder: "Select code",
            width: "w-32",
          },
          {
            name: "phoneNumber",
            comp: "text",
            placeholder: "123 456 7890",
            icon: <Phone size={18} className="text-gray-400" />,
            inputType: "tel",
          },
        ],
      },
    ],
    [
      {
        name: "password",
        type: "text",
        inputType: "password",
        label: "Password",
        required: true,
        icon: <Lock size={18} className="text-gray-400" />,
        description: "Minimum 10 characters, include uppercase, number, and special character.",
      },
      {
        name: "confirmPassword",
        type: "text",
        inputType: "password",
        label: "Confirm Password",
        required: true,
      },
    ],
  ];

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="mb-6 text-center">
        <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-tint rounded-full dark:bg-primary-dark-900/30">
          <User size={32} className="text-blue-600 dark:text-primary/80" />
        </div>
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
          Set Up Your Account
        </h2>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          Welcome to CoopPilot. Please set a secure password and confirm your
          details to get started.
        </p>
      </div>

      <FormBuilder
        fields={formRows}
        formData={formData}
        handleChange={handleChange}
        handleBlur={handleBlur}
        errors={errors}
      />

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

  );
};

export default Page1;
