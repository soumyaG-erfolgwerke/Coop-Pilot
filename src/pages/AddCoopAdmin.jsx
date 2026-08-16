"use client";
import React, { useState, useEffect, useRef } from "react";
import toast from "react-hot-toast";
import {
  AlertCircle,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import Page1 from "@/components/coopadminSignup/page1";
import Page2 from "@/components/coopadminSignup/page2";
import Page3 from "@/components/coopadminSignup/page3";
import Page4 from "@/components/coopadminSignup/page4";
import Page5 from "@/components/coopadminSignup/page5";
import Page6 from "@/components/coopadminSignup/page6";
import Page7 from "@/components/coopadminSignup/page7";
import SuccessSignUp from "@/components/coopadminSignup/succussSignUp";

import {
  searchExistingUser,
  getCoopRegistry,
  createCoopAdminNew,
} from "@/lib/coopAdminSignUpServices";

import { getAllSectorService } from "@/lib/sectorsService";

// --- StepIndicator Component ---
const StepIndicator = ({ currentStep, totalSteps }) => {
  const percentage = Math.min(Math.max(Math.round((currentStep / totalSteps) * 100), 0), 100);

  return (
    <div className="flex items-center justify-center w-full max-w-xl pt-6 mx-auto mb-8 font-inter">
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
                <div className="flex items-center justify-center w-10 h-10 text-white transition-all duration-300 bg-green-500 rounded-full shadow-sm sm:w-11 sm:h-11">
                  <CheckCircle size={20} />
                </div>
              ) : isActive ? (
                <div className="flex items-center justify-center w-10 h-10 transition-all duration-300 scale-110 bg-white border-2 border-blue-600 rounded-full shadow-md sm:w-11 sm:h-11 dark:bg-slate-800">
                  <div className="w-3 h-3 bg-blue-600 rounded-full animate-pulse" />
                </div>
              ) : (
                <div className="flex items-center justify-center w-10 h-10 transition-all duration-300 bg-white border border-gray-300 rounded-full sm:w-11 sm:h-11 dark:border-slate-600 dark:bg-slate-800">
                  <div className="w-2 h-2 bg-gray-300 rounded-full dark:bg-slate-600" />
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

// --- Main AddCoopAdmin Component ---
const AddCoopAdmin = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 7;
  const [coopRegistry, setCoopRegistry] = useState([]);
  const [sectors, setSectors] = useState([]);
  const [selectedCooperative, setSelectedCooperative] = useState(null);
  const [formData, setFormData] = useState({
    // Step 1
    email: "",
    // step 2 -> Step 3
    country: "Germany",
    state: "",
    registryNumber: "",
    businessName: "",
    registeredBusinessName: "",
    courtName: "",
    directorName: "",
    // Step 4
    businessSector: "",
    size: "",
    businessDescription: "",
    // Step 5
    countryOfResidence: "Germany",
    nationality: "Germany",
    fullLegalFirstMiddleName: "",
    fullLegalLastName: "",
    phoneCountryCode: "+49",
    phoneNumber: "",
    dateOfBirth: "",
    // step 6
    street: "",
    houseNo: "",
    postalCode: "",
    location: "",
    // Step 7
    password: "",
    confirmPassword: "",
    captchaToken: ""
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [submissionStatus, setSubmissionStatus] = useState(null);
  const continueBtnRef = useRef(null);

  const isDeployment = process.env.NODE_ENV === "production";

  useEffect(() => {
    const handleKeyPress = (e) => {
      // Only trigger on Enter key and when not already submitting
      if (e.key === "Enter" && !isSubmitting && !isVerifying) {
        // Don't trigger if user is in a textarea
        if (e.target.tagName === "TEXTAREA") {
          return;
        }

        e.preventDefault();

        // Step 1: Verify email button
        if (currentStep === 1 && continueBtnRef.current) {
          continueBtnRef.current.click();
        }
        // Steps 3-7: Continue/Submit button (Step 2 has no continue button)
        else if (currentStep > 2 && continueBtnRef.current) {
          continueBtnRef.current.click();
        }
      }
    };

    // Add listener to document to catch Enter from any input field
    document.addEventListener("keydown", handleKeyPress);

    return () => document.removeEventListener("keydown", handleKeyPress);
  }, [currentStep, isSubmitting, isVerifying]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));

    // Clear error for the field being changed
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleCaptchaChange = (captchaToken) => {
    setFormData((prev) => ({
      ...prev,
      captchaToken: captchaToken
    }))
  }

  // Email verification handler with mock data validation
  const handleVerifyEmail = async () => {
    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    // TODO: rmv commented gmail after testing
    const freeEmailProviders = [
      "gmail.com",
      "yahoo.com",
      "yahoo.co.de",
      "hotmail.com",
      "outlook.com",
      "aol.com",
    ];

    if (!formData.email) {
      toast.error("Email is required");
      setErrors({ email: "Email is required" });
      return;
    }

    if (!emailRegex.test(formData.email)) {
      toast.error("Please enter a valid email address");
      setErrors({ email: "Please enter a valid email address" });
      return;
    }

    // Check if email is from a free provider (not company email)
    const emailDomain = formData.email.split("@")[1]?.toLowerCase();
    if (freeEmailProviders.includes(emailDomain)) {
      toast.error("Please use a company email address");
      setErrors({ email: "Company email required " });
      return;
    }

    setIsVerifying(true);
    try {
      // await new Promise((resolve) => setTimeout(resolve, 500));
      // Check if email already exists in data
      const emailExists = await searchExistingUser(formData.email);

      if (emailExists) {
        toast.error("This email is already registered.", { duration: 5000 });
        setErrors({ email: "Email already exists" });
        return;
      }

      // If successful, move to next step
      const coopRegistry = await getCoopRegistry();
      setCoopRegistry(coopRegistry);

      const sectorsData = await getAllSectorService();
      setSectors(sectorsData);

      toast.success("Email verified successfully!");
      setCurrentStep(2);
      setErrors({});
    } catch (err) {
      toast.error(
        err.message || "Email verification failed. Please try again."
      );
      setErrors({ email: "Email verification failed. Please try again." });
    } finally {
      setIsVerifying(false);
    }
  };

  // Validation functions for each step
  const validateStep2 = () => {
    const newErrors = {};
    if (!formData.fullLegalName)
      newErrors.fullLegalName = "Full legal name is required";
    if (!formData.businessName)
      newErrors.businessName = "Business name is required";
    if (!formData.businessSector)
      newErrors.businessSector = "Business sector is required";
    if (!formData.operateYourBusiness)
      newErrors.operateYourBusiness =
        "Please select how you operate your business";
    if (!formData.size) newErrors.size = "Business size is required";
    return newErrors;
  };

  const validateStep3 = () => {
    const newErrors = {};
    if (!formData.country) newErrors.country = "Country is required";
    if (!formData.businessName)
      newErrors.businessName = "Company name is required";
    if (!formData.registeredBusinessName)
      newErrors.registeredBusinessName = "Registered business name is required";
    if (!formData.registrationNumber && !formData.registryNumber)
      newErrors.registrationNumber = "Registration number is required";
    if (!formData.directorName)
      newErrors.directorName = "Please select a director";
    return newErrors;
  };

  const validateStep4 = () => {
    const newErrors = {};
    if (!formData.businessSector)
      newErrors.businessSector = "Business sector is required";
    if (!formData.size) newErrors.size = "Company size is required";
    if (
      formData.businessDescription &&
      formData.businessDescription.length < 50
    )
      newErrors.businessDescription =
        "Description must be at least 50 characters";
    return newErrors;
  };

  const validateStep5 = () => {
    const newErrors = {};
    // Country of Residence is disabled and defaults to "Germany", so we don't validate it
    // if (!formData.countryOfResidence)
    //   newErrors.countryOfResidence = "Country of residence is required";
    if (!formData.fullLegalFirstMiddleName)
      newErrors.fullLegalFirstMiddleName = "First and middle name is required";
    if (!formData.fullLegalLastName)
      newErrors.fullLegalLastName = "Last name is required";
    if (!formData.phoneNumber)
      newErrors.phoneNumber = "Phone number is required";
    if (!formData.dateOfBirth)
      newErrors.dateOfBirth = "Date of birth is required";
    return newErrors;
  };

  const validateStep6 = () => {
    const newErrors = {};
    if (!formData.street) newErrors.street = "Street is required";
    if (!formData.houseNo) newErrors.houseNo = "House number is required";
    if (!formData.postalCode) newErrors.postalCode = "Postal code is required";
    if (!formData.location) newErrors.location = "Location is required";
    return newErrors;
  };

  const validateStep7 = () => {
    const newErrors = {};
    const passwordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (!passwordRegex.test(formData.password)) {
      newErrors.password = "Password must meet all requirements";
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password";
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    if (isDeployment && formData.captchaToken.trim() === "") {
      newErrors.captchaToken = "Captcha token is required";
    }
    return newErrors;
  };

  const validateCurrentStep = () => {
    let stepErrors = {};

    switch (currentStep) {
      case 2:
        stepErrors = validateStep2();
        break;
      case 3:
        stepErrors = validateStep3();
        break;
      case 4:
        stepErrors = validateStep4();
        break;
      case 5:
        stepErrors = validateStep5();
        break;
      case 6:
        stepErrors = validateStep6();
        break;
      case 7:
        stepErrors = validateStep7();
        break;
      default:
        break;
    }

    setErrors(stepErrors);
    return Object.keys(stepErrors).length === 0;
  };

  const nextStep = () => {
    if (currentStep === 1) {
      // Step 1 uses the verify email button
      return;
    }

    if (validateCurrentStep()) {
      if (currentStep < totalSteps) {
        setCurrentStep((prev) => prev + 1);
        // Clear errors when moving to next step
        setErrors({});
        window.scrollTo(0, 0);
      }
    } else {
      toast.error("Please fill in all required fields correctly");
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
      window.scrollTo(0, 0);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Only allow form submission on the final step (step 7)
    if (currentStep !== totalSteps) {
      // Prevent any action on non-final steps when Enter is pressed
      return;
    }

    if (!validateCurrentStep()) {
      toast.error("Please fill in all required fields correctly");
      return;
    }

    setIsSubmitting(true);
    setSubmissionStatus(null);

    try {
      // await new Promise((resolve) => setTimeout(resolve, 2000));

      // console.log("Form submitted:", formData);

      const response = await createCoopAdminNew(formData);

      setSubmissionStatus(response.success ? "success" : "error");
      if (!response.success) {
        handleCaptchaChange("");
        throw response.error;
      }
      toast.success("Account created successfully!");
    } catch (error) {
      // console.error("Submission error:", error);
      handleCaptchaChange("");
      setSubmissionStatus("error");
      if (error?.type === "user_already_exists" || error?.code === 409) {
        toast.error("Duplicate user found");
        setErrors({ form: "Duplicate user found" });
      } else {
        toast.error("Failed to create account. Please try again.");
        setErrors({ form: "Failed to create account. Please try again." });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    window.scrollTo(0, 0);

    // Clear errors when moving to a new step
    setErrors({});

    // Set default values for disabled fields on Page 5
    if (currentStep === 5) {
      setFormData((prev) => ({
        ...prev,
        // Set countryOfResidence->Page5 to "Germany" if not already set
        countryOfResidence: prev.countryOfResidence || "Germany",
        // Ensure nationality has default value
        nationality: prev.nationality || "Germany",
        // Ensure phone country code has default value
        phoneCountryCode: prev.phoneCountryCode || "+49",
      }));
    }
  }, [currentStep]);

  // Prefill courtName when cooperative is selected
  useEffect(() => {
    if (selectedCooperative) {
      setFormData((prev) => ({
        ...prev,
        state: selectedCooperative.state || "Berlin", // Added default state
        courtName: selectedCooperative.CourtName || "Berlin District Court",
        businessName: selectedCooperative.name || prev.businessName,
        registryNumber: selectedCooperative.RegNumber || prev.registryNumber,
      }));
    }
  }, [selectedCooperative]);

  // Show success screen
  if (submissionStatus === "success") {
    return <SuccessSignUp />;
  }

  return (
    <div className="min-h-screen px-4 py-8 pt-24 bg-gray-100 dark:bg-slate-900 sm:py-12 sm:pt-28 font-inter">
      <div className="max-w-3xl mx-auto">
        {currentStep > 1 && (
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
              errors={errors}
              onVerifyEmail={handleVerifyEmail}
              isVerifying={isVerifying}
              continueBtnRef={continueBtnRef}
            />
          )}
          {currentStep === 2 && (
            <Page2
              formData={formData}
              handleChange={handleChange}
              errors={errors}
              onSelectBusiness={(business) => {
                // Save selected cooperative
                setSelectedCooperative(business);
                // Move to next step after business selection
                setCurrentStep(3);
              }}
              cooperatives={coopRegistry}
            />
          )}
          {currentStep === 3 && (
            <Page3
              formData={formData}
              handleChange={handleChange}
              errors={errors}
              selectedCooperative={selectedCooperative}
            />
          )}
          {currentStep === 4 && (
            <Page4
              formData={formData}
              handleChange={handleChange}
              errors={errors}
              selectedCooperative={selectedCooperative}
              sectors={sectors}
            />
          )}
          {currentStep === 5 && (
            <Page5
              formData={formData}
              handleChange={handleChange}
              errors={errors}
              selectedCooperative={selectedCooperative}
            />
          )}
          {currentStep === 6 && (
            <Page6
              formData={formData}
              handleChange={handleChange}
              errors={errors}
            />
          )}
          {currentStep === 7 && (
            <Page7
              formData={formData}
              handleChange={handleChange}
              handleCaptchaChange={handleCaptchaChange}
              errors={errors}
            />
          )}

          {errors.form && (
            <p className="flex items-center justify-center mt-4 text-sm text-center text-red-500">
              <AlertCircle size={14} className="mr-2" />
              {errors.form}
            </p>
          )}

          {currentStep > 1 && (
            <div className="flex items-center justify-between mt-10">
              <div className="" onClick={prevStep}>
                <button
                  type="button"
                  disabled={isSubmitting}
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
                currentStep !== 2 && (
                  <div className="" onClick={nextStep}>
                    <button
                      type="button"
                      ref={continueBtnRef}
                      disabled={isSubmitting}
                      className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center group"
                    >
                      Continue{" "}
                      <ChevronRight
                        size={18}
                        className="ml-1.5 transition-transform duration-200 group-hover:translate-x-1"
                      />
                    </button>
                  </div>
                )
              ) : (
                <button
                  type="submit"
                  ref={continueBtnRef}
                  disabled={isSubmitting}
                  className="px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center group"
                >
                  {isSubmitting ? (
                    <>
                      <svg
                        className="w-5 h-5 mr-3 -ml-1 text-white animate-spin"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Creating Account...
                    </>
                  ) : (
                    <>
                      Create Account{" "}
                      <CheckCircle
                        size={18}
                        className="ml-1.5 transition-transform duration-200 group-hover:scale-110"
                      />
                    </>
                  )}
                </button>
              )}
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default AddCoopAdmin;
