"use client";
import React, { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import {
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  Loader,
} from "lucide-react";
import Page1 from "@/components/orgadminSignup/page1";
import Page2 from "@/components/orgadminSignup/page2";
import Page2a from "@/components/orgadminSignup/page2a";
import Page3 from "@/components/orgadminSignup/page3";
import Page4 from "@/components/orgadminSignup/page4";
import { createOrgAdmin } from "@/lib/orgAdminService";
import { isValidIBAN } from "ibantools";
import { validateIBAN } from "@/lib/ibanService";

// Step indicator (re-usable and matches AddCoopAdmin pattern)
const StepIndicator = ({ currentStep, totalSteps }) => {
  const percentage = Math.min(Math.max(Math.round((currentStep / totalSteps) * 100), 0), 100);

  return (
    <div className="flex items-center justify-center pt-6 mb-8 w-full max-w-xl mx-auto font-inter">
      {[...Array(totalSteps)].map((_, i) => {
        const stepNumber = i + 1;
        const isActive = stepNumber === currentStep;
        const isCompleted = stepNumber < currentStep;
        return (
          <React.Fragment key={stepNumber}>
            {/* Step Dot Container */}
            <div className="relative flex items-center justify-center shrink-0">
              {/* Percentage tooltip above the active step */}
              {isActive && (
                <div className="absolute bottom-full mb-2.5 left-1/2 -translate-x-1/2 whitespace-nowrap animate-fadeIn z-10">
                  <span className="text-[10px] sm:text-xs font-bold text-white bg-blue-600 px-2 py-0.5 rounded shadow-md">
                    {percentage}% Completed
                  </span>
                  {/* Tooltip arrow */}
                  <div className="w-1.5 h-1.5 bg-blue-600 rotate-45 mx-auto -mt-1" />
                </div>
              )}

              {/* Circle */}
              {isCompleted ? (
                <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-green-500 text-white flex items-center justify-center transition-all duration-300 shadow-sm">
                  <CheckCircle size={20} />
                </div>
              ) : isActive ? (
                <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full border-2 border-blue-600 flex items-center justify-center bg-white dark:bg-slate-800 scale-110 shadow-md transition-all duration-300">
                  <div className="w-3 h-3 rounded-full bg-blue-600 animate-pulse" />
                </div>
              ) : (
                <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full border border-gray-300 dark:border-slate-600 flex items-center justify-center bg-white dark:bg-slate-800 transition-all duration-300">
                  <div className="w-2 h-2 rounded-full bg-gray-300 dark:bg-slate-600" />
                </div>
              )}
            </div>

            {/* Connecting Line */}
            {stepNumber < totalSteps && (
              <div
                className={`flex-1 h-0.5 mx-1 sm:mx-2 transition-colors duration-300 ${isCompleted ? "bg-green-500" : "bg-gray-200 dark:bg-slate-700"
                  }`}
              ></div>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

const AddOrgAdmin = () => {
  const totalSteps = 5;
  const [currentStep, setCurrentStep] = useState(1);

  const [formData, setFormData] = useState({
    // Step1 — Account Setup
    email: "",
    title: "",
    firstName: "",
    lastName: "",
    phoneCountryCode: "+49",
    phoneNumber: "",
    password: "",
    confirmPassword: "",
    captchaToken: "",
    // Step2 — Organisation Profile
    organisationName: "",
    abbreviation: "",
    street: "",
    city: "",
    postcode: "",
    state: "",
    zulassungNumber: "",
    sectorFocus: "",
    website: "",
    // Step3 — Branding & Document Identity (optional)
    logoFile: null,
    stampFile: null,
    step3Skipped: false,
    // Step4a — IBAN verification fields
    iban: "",
    ibanAccountHolder: "",
    bic: "",
    // Step4 — Review & Confirm (activation requirements)
    ibanVerified: false,
    avvDeclaration: false,
    avvFile: null,
  });

  const isDeployment = process.env.NEXT_PUBLIC_NODE_ENV === "production";

  const [isVerifyingIban, setIsVerifyingIban] = useState(false);

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const continueBtnRef = useRef(null);

  // keyboard: Enter triggers Continue (when not submitting)
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.key === "Enter" && !isSubmitting) {
        if (e.target.tagName === "TEXTAREA") return;
        e.preventDefault();
        if (continueBtnRef.current) continueBtnRef.current.click();
      }
    };
    document.addEventListener("keydown", handleKeyPress);
    return () => document.removeEventListener("keydown", handleKeyPress);
  }, [isSubmitting]);

  useEffect(() => {
    // Attempt to pre-fill fields from URL params (optional integration hook)
    try {
      const params = new URLSearchParams(window.location.search);
      const email = params.get("email");
      const org = params.get("orgName");
      const zul = params.get("zulassung");
      setFormData((prev) => ({
        ...prev,
        email: email || prev.email,
        organisationName: org || prev.organisationName,
        zulassungNumber: zul || prev.zulassungNumber,
      }));
    } catch (e) {
      // ignore in non-browser environments
    }
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;

    // Build next state to validate against (handles cross-field checks)
    const next = { ...formData, [name]: value };
    if (["iban", "ibanAccountHolder", "bic"].includes(name)) {
      next.ibanVerified = false;
    }
    setFormData(next);

    // Validate this field live and keep the errors map in sync
    const err = validateField(name, value, next);
    setErrors((prev) => {
      const copy = { ...prev };
      if (err) copy[name] = err;
      else delete copy[name];

      if (["iban", "ibanAccountHolder", "bic"].includes(name)) {
        delete copy.ibanVerification;
      }

      // If password changed, re-validate confirmPassword too
      if (name === "password" && next.confirmPassword) {
        const cErr = validateField(
          "confirmPassword",
          next.confirmPassword,
          next,
        );
        if (cErr) copy.confirmPassword = cErr;
        else delete copy.confirmPassword;
      }

      return copy;
    });
  };

  const handleCaptchaChange = (captchaToken) => {
    setFormData((prev) => ({
      ...prev,
      captchaToken: captchaToken
    }))
  }

  const validateFile = (file, { maxSizeMb, allowPngOnly }) => {
    if (!file) return "";
    if (allowPngOnly && file.type !== "image/png") return "PNG files only";
    const maxBytes = maxSizeMb * 1024 * 1024;
    if (file.size > maxBytes) return `Max ${maxSizeMb}MB`;
    return "";
  };

  const handleFileChange = (e) => {
    const { name, files } = e.target;
    const file = files && files[0] ? files[0] : null;

    const rules =
      name === "stampFile"
        ? { maxSizeMb: 2, allowPngOnly: true }
        : { maxSizeMb: 2, allowPngOnly: true };

    const err = validateFile(file, rules);

    // Always update errors map. Only accept (store) the file when it passes validation.
    setErrors((prev) => {
      const copy = { ...prev };
      if (err) copy[name] = err;
      else delete copy[name];
      return copy;
    });

    // If the file is valid, save it to form state. Do not overwrite existing valid files
    // when the new (dropped) file is invalid — this prevents drag/drop from accepting
    // unsupported types or oversized files.
    if (!err && file) {
      setFormData((prev) => ({ ...prev, [name]: file }));
    }
  };

  const handleRemoveFile = (fieldName) => {
    setFormData((prev) => ({
      ...prev,
      [fieldName]: null,
    }));

    setErrors((prev) => {
      const copy = { ...prev };
      delete copy[fieldName];
      return copy;
    });
  };

  const handleVerifyIban = async () => {
    const ibanErrors = {};
    const sanitizedIban = (formData.iban || "")
      .replace(/\s+/g, "")
      .toUpperCase();

    if (!sanitizedIban) {
      ibanErrors.iban = "IBAN is required";
    } else if (!isValidIBAN(sanitizedIban)) {
      ibanErrors.iban = "Please enter a valid IBAN";
    }

    if (!formData.ibanAccountHolder) {
      ibanErrors.ibanAccountHolder = "Account holder name is required";
    } else if (formData.ibanAccountHolder.length > 255) {
      ibanErrors.ibanAccountHolder = "Max 255 characters";
    }

    setErrors((prev) => {
      const copy = { ...prev };
      ["iban", "ibanAccountHolder", "bic"].forEach((key) => {
        if (ibanErrors[key]) copy[key] = ibanErrors[key];
        else delete copy[key];
      });
      delete copy.ibanVerification;
      return copy;
    });

    if (Object.keys(ibanErrors).length > 0) return false;

    setIsVerifyingIban(true);
    try {
      const data = await validateIBAN(sanitizedIban);

      if (!data?.valid) {
        setErrors((prev) => {
          const copy = {
            ...prev,
            ibanVerification: "IBAN validation failed against the registry.",
          };
          return copy;
        });
        toast.error("IBAN validation failed");
        return false;
      }

      const bankData = data.bankData || {};
      const nextBic = bankData.bic || "";

      setFormData((prev) => ({
        ...prev,
        iban: sanitizedIban,
        ibanVerified: true,
        bic: nextBic,
      }));

      setErrors((prev) => {
        const copy = { ...prev };
        delete copy.ibanVerification;

        if (!nextBic) {
          copy.bic = "BIC could not be retrieved. Please enter it manually.";
        } else {
          delete copy.bic;
        }

        return copy;
      });

      if (nextBic) toast.success("IBAN verified and BIC auto-filled");
      else
        toast.success(
          "IBAN verified. BIC was not returned and can be entered manually.",
        );

      return true;
    } catch (e) {
      setErrors((prev) => ({
        ...prev,
        ibanVerification:
          "Registry lookup failed. Please check your IBAN or try again.",
      }));
      toast.error("IBAN verification failed");
      return false;
    } finally {
      setIsVerifyingIban(false);
    }
  };

  // Validate a single field. Accepts an optional `data` object to allow
  // validating against the prospective form state (useful during onChange).
  const validateField = (name, value, data = formData) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    switch (name) {
      case "email":
        if (!value) return "Email is required";
        if (!emailRegex.test(value))
          return "Please enter a valid email address";
        return "";
      case "firstName":
        if (!value) return "First name is required";
        if (value.length > 100) return "Max 100 characters";
        return "";
      case "lastName":
        if (!value) return "Last name is required";
        if (value.length > 100) return "Max 100 characters";
        return "";
      case "phoneCountryCode": {
        if (!value) return "Country code is required";
        return "";
      }
      case "phoneNumber": {
        const phoneRegex = /^[0-9\-\s]{7,20}$/;
        if (!value) return "Phone number is required";
        if (!phoneRegex.test(value)) return "Please enter a valid phone number";
        return "";
      }
      case "password": {
        const pwdRegex =
          /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{10,}$/;
        if (!value) return "Password is required";
        if (!pwdRegex.test(value))
          return "Password must be min 10 chars, include uppercase, number and special char";
        return "";
      }
      case "confirmPassword":
        if (!value) return "Please confirm your password";
        if (value !== data.password) return "Passwords do not match";
        return "";
      case "organisationName":
        if (!value) return "Organisation name is required";
        return "";
      case "street":
        if (!value) return "Street & house number is required";
        if (value.length > 255) return "Max 255 characters";
        return "";
      case "city":
        if (!value) return "City is required";
        if (value.length > 100) return "Max 100 characters";
        return "";
      case "postcode": {
        const postcodeRegex = /^[0-9]{5}$/;
        if (!value) return "Postcode is required";
        if (!postcodeRegex.test(value)) return "Postcode must be 5 digits";
        return "";
      }
      case "zulassungNumber":
        if (!value) return "Zulassung number is required";
        return "";
      case "abbreviation":
        if (value && value.length > 20) return "Max 20 characters";
        return "";
      case "website":
        if (value) {
          try {
            const urlStr = value.trim();
            const normalized = urlStr.startsWith("http")
              ? urlStr
              : `https://${urlStr}`;
            new URL(normalized);
            return "";
          } catch (e) {
            return "Please enter a valid URL (include protocol)";
          }
        }
        return "";
      case "iban": {
        const v = (value || "").replace(/\s+/g, "").toUpperCase();
        if (!v) return "IBAN is required";
        if (!isValidIBAN(v)) return "Please enter a valid IBAN";
        return "";
      }
      case "ibanAccountHolder": {
        if (!value) return "Account holder name is required";
        if (value.length > 255) return "Max 255 characters";
        return "";
      }
      case "bic": {
        if (!value) return "BIC is required";
        const bicRe = /^[A-Za-z]{6}[A-Za-z0-9]{2}([A-Za-z0-9]{3})?$/;
        if (!bicRe.test(value)) return "Please enter a valid BIC";
        return "";
      }
      default:
        return "";
    }
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    const err = validateField(name, value);
    setErrors((prev) => {
      const copy = { ...prev };
      if (err) copy[name] = err;
      else delete copy[name];
      return copy;
    });
  };

  // Validators (return error maps)
  const validateStep1 = () => {
    const newErrors = {};
    if (!formData.email) newErrors.email = "Email is required";
    if (!formData.firstName) newErrors.firstName = "First name is required";
    else if (formData.firstName.length > 100)
      newErrors.firstName = "Max 100 characters";
    if (!formData.lastName) newErrors.lastName = "Last name is required";
    else if (formData.lastName.length > 100)
      newErrors.lastName = "Max 100 characters";

    if (!formData.phoneCountryCode)
      newErrors.phoneCountryCode = "Country code is required";
    const phoneRegex = /^[0-9\-\s]{7,20}$/;
    if (!formData.phoneNumber)
      newErrors.phoneNumber = "Phone number is required";
    else if (!phoneRegex.test(formData.phoneNumber))
      newErrors.phoneNumber = "Please enter a valid phone number";

    const pwdRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{10,}$/;
    if (!formData.password) newErrors.password = "Password is required";
    else if (!pwdRegex.test(formData.password))
      newErrors.password =
        "Password must be min 10 chars, include uppercase, number and special char";

    if (!formData.confirmPassword)
      newErrors.confirmPassword = "Please confirm your password";
    else if (formData.password !== formData.confirmPassword)
      newErrors.confirmPassword = "Passwords do not match";

    if (isDeployment && formData.captchaToken.trim() === "") {
      newErrors.captchaToken = "Captcha token is required";
    }

    return newErrors;
  };

  const validateStep2 = () => {
    const newErrors = {};
    if (!formData.organisationName)
      newErrors.organisationName = "Organisation name is required";
    if (!formData.street)
      newErrors.street = "Street & house number is required";
    else if (formData.street.length > 255)
      newErrors.street = "Max 255 characters";
    if (!formData.city) newErrors.city = "City is required";
    else if (formData.city.length > 100) newErrors.city = "Max 100 characters";
    const postcodeRegex = /^[0-9]{5}$/;
    if (!formData.postcode) newErrors.postcode = "Postcode is required";
    else if (!postcodeRegex.test(formData.postcode))
      newErrors.postcode = "Postcode must be 5 digits";
    if (!formData.zulassungNumber)
      newErrors.zulassungNumber = "Zulassung number is required";
    if (formData.abbreviation && formData.abbreviation.length > 20)
      newErrors.abbreviation = "Max 20 characters";
    if (formData.website) {
      try {
        // quick URL sanity check
        const urlStr = formData.website.trim();
        const normalized = urlStr.startsWith("http")
          ? urlStr
          : `https://${urlStr}`;
        new URL(normalized);
      } catch (e) {
        newErrors.website = "Please enter a valid URL (include protocol)";
      }
    }
    return newErrors;
  };

  // Step2a — IBAN entry & verification
  const validateStep2a = () => {
    const newErrors = {};
    const ibanVal = formData.iban ? formData.iban.replace(/\s+/g, "") : "";

    if (!ibanVal) newErrors.iban = "IBAN is required";

    if (!formData.ibanAccountHolder)
      newErrors.ibanAccountHolder = "Account holder name is required";
    else if (formData.ibanAccountHolder.length > 255)
      newErrors.ibanAccountHolder = "Max 255 characters";

    const bicRe = /^[A-Za-z]{6}[A-Za-z0-9]{2}([A-Za-z0-9]{3})?$/;
    if (!formData.bic) newErrors.bic = "BIC is required";
    else if (!bicRe.test(formData.bic))
      newErrors.bic = "Please enter a valid BIC";

    return newErrors;
  };

  const validateStep3 = () => {
    const newErrors = {};
    const logoErr = validateFile(formData.logoFile, {
      maxSizeMb: 2,
      allowPngOnly: true,
    });
    const stampErr = validateFile(formData.stampFile, {
      maxSizeMb: 2,
      allowPngOnly: true,
    });
    if (logoErr) newErrors.logoFile = logoErr;
    if (stampErr) newErrors.stampFile = stampErr;
    return newErrors;
  };

  const validateStep4 = () => {
    const newErrors = {};
    if (!formData.ibanVerified) newErrors.ibanVerified = "IBAN not verified";
    if (!formData.avvDeclaration)
      newErrors.avvDeclaration = "You must accept the AVV agreement";
    if (!formData.avvFile)
      newErrors.avvFile = "AVV PDF is missing. Please reopen the declaration.";
    return newErrors;
  };

  const validateCurrentStep = () => {
    let stepErrors = {};
    if (currentStep === 1) stepErrors = validateStep1();
    if (currentStep === 2) stepErrors = validateStep2();
    if (currentStep === 3) stepErrors = validateStep2a();
    if (currentStep === 4) stepErrors = validateStep3();
    if (currentStep === 5) stepErrors = validateStep4();
    setErrors(stepErrors);
    return Object.keys(stepErrors).length === 0;
  };

  // non-mutating checks for disabling the Continue button
  const isStep1Valid = () => {
    const errs = validateStep1();
    // Email is read-only and expected to be pre-filled by super admin; don't block Continue if it's empty
    if (!formData.email) delete errs.email;
    return Object.keys(errs).length === 0;
  };
  const isStep2Valid = () => Object.keys(validateStep2()).length === 0;
  const isStep2aValid = () => Object.keys(validateStep2a()).length === 0;
  const isStep3Valid = () => Object.keys(validateStep3()).length === 0;
  const isStep4Valid = () => Object.keys(validateStep4()).length === 0;

  const canActivateAccount = formData.ibanVerified;

  const nextStep = () => {
    if (currentStep < totalSteps) {
      if (validateCurrentStep()) {
        setCurrentStep((s) => s + 1);
        setErrors({});
        if (currentStep === 1) toast.success("Account information filled");
        if (currentStep === 2) toast.success("Organisation profile filled");
        if (currentStep === 3) toast.success("IBAN verification ready");
        if (currentStep === 4) {
          if (
            formData.step3Skipped ||
            (!formData.logoFile && !formData.stampFile)
          )
            toast.success("Branding step skipped");
          else toast.success("Branding step saved");
        }
        window.scrollTo(0, 0);
      } else {
        toast.error("Please fill in all required fields correctly");
      }
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep((s) => s - 1);
      window.scrollTo(0, 0);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // final action on last step: frontend-only flow -> notify and stop
    if (currentStep === totalSteps) {
      if (!canActivateAccount) {
        if (!formData.ibanVerified) {
          toast.error("Your bank account has not been verified yet");
        }
        return;
      }
      if (!validateCurrentStep()) {
        toast.error("Please fill in all required fields correctly");
        return;
      }
      setIsSubmitting(true);
      try {
        const response = await createOrgAdmin(formData);
        if (response.success) {
          toast.success("Account activated — onboarding complete");
          setTimeout(() => {
            window.location.href = "/dashboard";
          }, 1000);
        } else {
          handleCaptchaChange("");
          toast.error(
            response.error?.message ||
            "Failed to activate account. Please try again.",
          );
          setErrors({
            form: response.error?.message || "Failed to activate account.",
          });
        }
      } catch (error) {
        handleCaptchaChange("");
        toast.error("Failed to activate account. Please try again.");
        setErrors({ form: "Failed to activate account. Please try again." });
      } finally {
        setIsSubmitting(false);
      }
    } else {
      nextStep();
    }
  };

  const handleSkipStep3 = () => {
    setFormData((prev) => ({ ...prev, step3Skipped: true }));
    toast.success("Branding step skipped — you can complete it later");
    setCurrentStep(5);
    window.scrollTo(0, 0);
  };

  return (
    <div className="min-h-screen px-4 py-8 pt-24 bg-gray-100 dark:bg-slate-900 sm:py-12 sm:pt-28 font-inter">
      <div className="max-w-3xl mx-auto">
        {currentStep > 0 && (
          <StepIndicator currentStep={currentStep} totalSteps={totalSteps} />
        )}

        <form
          onSubmit={handleSubmit}
          className="p-6 bg-white shadow-2xl dark:bg-slate-800 sm:p-10 rounded-xl"
        >
          {currentStep === 1 && (
            <Page1
              formData={formData}
              handleChange={handleChange}
              handleBlur={handleBlur}
              errors={errors}
              continueBtnRef={continueBtnRef}
              isSubmitting={isSubmitting}
              handleCaptchaChange={handleCaptchaChange}
            />
          )}

          {currentStep === 2 && (
            <Page2
              formData={formData}
              handleChange={handleChange}
              handleBlur={handleBlur}
              errors={errors}
            />
          )}

          {currentStep === 3 && (
            <Page2a
              formData={formData}
              handleChange={handleChange}
              handleBlur={handleBlur}
              errors={errors}
              isVerifying={isVerifyingIban}
              onVerify={handleVerifyIban}
            />
          )}

          {currentStep === 4 && (
            <Page3
              formData={formData}
              handleFileChange={handleFileChange}
              handleRemoveFile={handleRemoveFile}
              errors={errors}
              onSkip={handleSkipStep3}
            />
          )}

          {currentStep === 5 && (
            <Page4
              formData={formData}
              canActivateAccount={canActivateAccount}
              setFormData={setFormData}
              errors={errors}
              setErrors={setErrors}
            />
          )}

          {errors.form && (
            <p className="flex items-center justify-center mt-4 text-sm text-center text-red-500">
              <AlertCircle size={14} className="mr-2" />
              {errors.form}
            </p>
          )}

          <div className="flex items-center justify-between mt-10">
            <div className="" onClick={prevStep}>
              <button
                type="button"
                disabled={isSubmitting || currentStep === 1}
                className="px-6 py-2.5 border border-gray-300 dark:border-slate-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-slate-700 hover:bg-gray-50 dark:hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center group"
              >
                <ChevronLeft
                  size={18}
                  className="mr-1.5 transition-transform duration-200 group-hover:-translate-x-1"
                />{" "}
                Back
              </button>
            </div>

            {currentStep < totalSteps ? (
              <div onClick={nextStep}>
                <button
                  type="button"
                  ref={continueBtnRef}
                  disabled={
                    isSubmitting ||
                    (currentStep === 1
                      ? !isStep1Valid()
                      : currentStep === 2
                        ? !isStep2Valid()
                        : currentStep === 3
                          ? !isStep2aValid() || !formData.ibanVerified
                          : !isStep3Valid())
                  }
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center group"
                >
                  {currentStep === 2 && isVerifyingIban ? (
                    <>
                      <Loader
                        size={16}
                        className="mr-2 text-white animate-spin"
                      />
                      Verifying...
                    </>
                  ) : (
                    <>
                      Continue
                      <ChevronRight
                        size={18}
                        className="ml-1.5 transition-transform duration-200 group-hover:translate-x-1"
                      />
                    </>
                  )}
                </button>
              </div>
            ) : (
              <button
                type="submit"
                ref={continueBtnRef}
                disabled={isSubmitting || !isStep4Valid()}
                className="px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center group"
              >
                {isSubmitting ? (
                  <>
                    <Loader
                      size={20}
                      className="mr-3 -ml-1 text-white animate-spin"
                    />
                    Processing...
                  </>
                ) : (
                  <>
                    Confirm & Activate Account
                    <CheckCircle
                      size={18}
                      className="ml-1.5 transition-transform duration-200 group-hover:scale-110"
                    />
                  </>
                )}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddOrgAdmin;
