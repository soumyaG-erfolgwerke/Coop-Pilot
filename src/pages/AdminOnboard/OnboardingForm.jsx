"use client";
import React, { useState, useEffect, useRef } from "react";
import toast from "react-hot-toast";
import {
  AlertCircle,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from "lucide-react";
import SuccessSignUp from "@/components/coopadminSignupv2/succussSignUp";
import OnboardingPage1 from "@/components/Onboarding/Coopadmin/OnboardingPage1";
import OnboardingPage2 from "@/components/Onboarding/Coopadmin/OnboardingPage2";
import OnboardingPage3 from "@/components/Onboarding/Coopadmin/OnboardingPage3";
import OnboardingPage4 from "@/components/Onboarding/Coopadmin/OnboardingPage4";
import OnboardingPage5 from "@/components/Onboarding/Coopadmin/OnboardingPage5";
import OnboardingPage5_5 from "@/components/Onboarding/Coopadmin/OnboardingPage5_5";
import OnboardingPage6 from "@/components/Onboarding/Coopadmin/OnboardingPage6";
import { getInvitedCoopsByAdminEmail } from "@/services/onboardingServices/coopadmin/CoopHelpers";
import { checkCoopExists } from "@/lib/coopAdminSignUpServicesNew";

const StepIndicator = ({ currentStep, totalSteps }) => {
  const percentage = Math.min(
    Math.max(Math.round((currentStep / totalSteps) * 100), 0),
    100,
  );

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
                className={`flex-1 h-0.5 mx-1 sm:mx-2 transition-colors duration-300 ${
                  isCompleted ? "bg-green-500" : "bg-gray-200 dark:bg-slate-700"
                }`}
              ></div>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

const OnboardingForm = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [isExistingCoopAdmin, setIsExistingCoopAdmin] = useState(false);
  const totalSteps = isExistingCoopAdmin ? 4 : 7;

  const [allCoopsData, setAllCoopsData] = useState([]);
  const [selectedCooperative, setSelectedCooperative] = useState(null);
  const [coopAlreadyExists, setCoopAlreadyExists] = useState(false);

  const isDeployment = process.env.NEXT_PUBLIC_NODE_ENV === "production";

  const [formData, setFormData] = useState({
    email: "",
    // Step 2
    businessName: "",
    registryNumber: "",
    courtName: "",
    country: "Germany",
    legalForm: "eG",
    companyId: "",
    // Step 3 (Personal Details)
    countryOfResidence: "Germany",
    nationality: "Germany",
    fullLegalFirstMiddleName: "",
    fullLegalLastName: "",
    phoneCountryCode: "+49",
    phoneNumber: "",
    dateOfBirth: "",
    // Step 4 (Address)
    address: {
      street: "",
      houseNo: "",
      postalCode: "",
      city: "",
    },
    // Step 5 (Bank Details)
    iban: "",
    bic: "",
    bankName: "",
    bankCity: "",
    isIbanVerified: false,
    // Step 7 (Password)
    password: "",
    confirmPassword: "",
    captchaToken: "",
    avvDeclaration: false,
    avvFile: null,
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [hasNoInvites, setHasNoInvites] = useState(false);
  const [submissionStatus, setSubmissionStatus] = useState(null);
  const continueBtnRef = useRef(null);
  const [existingCoopModal, setExistingCoopModal] = useState({
    open: false,
    adminEmail: "",
    coopName: "",
  });

  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.key === "Enter" && !isSubmitting && !isVerifying) {
        if (e.target.tagName === "TEXTAREA" || e.target.tagName === "SELECT") {
          return;
        }
        e.preventDefault();
        if (continueBtnRef.current) {
          continueBtnRef.current.click();
        }
      }
    };
    document.addEventListener("keydown", handleKeyPress);
    return () => document.removeEventListener("keydown", handleKeyPress);
  }, [isSubmitting, isVerifying]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    // Support nested object update (e.g. for address)
    if (name.includes(".")) {
      const parts = name.split(".");
      setFormData((prev) => ({
        ...prev,
        [parts[0]]: {
          ...prev[parts[0]],
          [parts[1]]: type === "checkbox" ? checked : value,
        },
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: type === "checkbox" ? checked : value,
      }));
    }

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }

    if (name === "email") {
      setHasNoInvites(false);
    }
  };

  const handleCaptchaChange = (captchaToken) => {
    setFormData((prev) => ({
      ...prev,
      captchaToken: captchaToken,
    }));
  };

  const handleVerifyEmail = async () => {
    if (!formData.email) {
      toast.error("Email is required");
      return;
    }

    setIsVerifying(true);
    try {
      const invitedCoops = await getInvitedCoopsByAdminEmail(formData.email);

      if (!invitedCoops.coops || invitedCoops.coops.length === 0) {
        setHasNoInvites(true);
        return;
      }

      setHasNoInvites(false);

      setAllCoopsData(invitedCoops.coops || []);

      if (invitedCoops.inviteFullName) {
        const nameParts = invitedCoops.inviteFullName.trim().split(" ");
        const lastName = nameParts.length > 1 ? nameParts.pop() : "";
        const firstName = nameParts.join(" ");
        setFormData((prev) => ({
          ...prev,
          fullLegalFirstMiddleName: firstName || invitedCoops.inviteFullName,
          fullLegalLastName: lastName,
        }));
      }

      // Check if user is existing admin
      const profileCheckResponse = await fetch(
        `/api/onboardAdmin/checkProfile?email=${encodeURIComponent(formData.email)}`,
      );
      if (profileCheckResponse.ok) {
        const { exists } = await profileCheckResponse.json();
        setIsExistingCoopAdmin(exists);
      }

      toast.success("Email verified successfully!");
      setCurrentStep(2);
      setErrors({});
    } catch (err) {
      toast.error(err.message || "Email verification failed.");
      setErrors({ email: "Email verification failed." });
    } finally {
      setIsVerifying(false);
    }
  };

  const validateStep = (step) => {
    const newErrors = {};
    if (isExistingCoopAdmin) {
      if (step === 2) {
        if (!selectedCooperative)
          newErrors.businessName = "Please select your cooperative";
      } else if (step === 3) {
        if (!formData.iban) newErrors.iban = "IBAN is required";
      }
    } else {
      if (step === 2) {
        if (!selectedCooperative)
          newErrors.businessName = "Please select your cooperative";
      } else if (step === 3) {
        if (!formData.fullLegalFirstMiddleName)
          newErrors.fullLegalFirstMiddleName = "Name is required";
        if (!formData.fullLegalLastName)
          newErrors.fullLegalLastName = "Last name is required";
        if (!formData.phoneNumber) newErrors.phoneNumber = "Phone is required";
        if (!formData.dateOfBirth) newErrors.dateOfBirth = "DOB is required";
      } else if (step === 4) {
        if (!formData.address?.street) newErrors.street = "Street is required";
        if (!formData.address?.houseNo)
          newErrors.houseNo = "House number is required";
        if (!formData.address?.city) newErrors.city = "City is required";
      } else if (step === 5) {
        if (!formData.iban) newErrors.iban = "IBAN is required";
        else if (!formData.isIbanVerified)
          newErrors.iban = "Please verify the IBAN by clicking Proceed";

        if (!formData.bankName) newErrors.bankName = "Bank Name is required";
        if (!formData.bic) newErrors.bic = "BIC is required";
      } else if (step === 7) {
        if (!formData.password) {
          newErrors.password = "Password is required";
        } else if (formData.password.length < 8) {
          newErrors.password = "Password must be at least 8 characters long";
        } else if (formData.password.length > 256) {
          newErrors.password = "Password must be at most 256 characters long";
        }
        if (formData.password !== formData.confirmPassword)
          newErrors.confirmPassword = "Passwords do not match";

        if (
          isDeployment &&
          formData.captchaToken.trim() === ""
        ) {
          newErrors.captchaToken = "Captcha token is required";
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = () => {
    if (currentStep === 1) return;

    if (isExistingCoopAdmin && currentStep === 4) {
      // Auto-submit after verification for existing admins
      handleSubmit(new Event("submit"));
      return;
    }

    if (validateStep(currentStep)) {
      if (currentStep < totalSteps) {
        setCurrentStep((prev) => prev + 1);
        setErrors({});
        window.scrollTo(0, 0);
      }
    } else {
      toast.error("Please fill in all required fields");
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      if (currentStep === 7 && !isExistingCoopAdmin) {
        // Skip OnboardingPage5_5 when going back from step 7
        setCurrentStep((prev) => prev - 2);
      } else {
        setCurrentStep((prev) => prev - 1);
      }
      window.scrollTo(0, 0);
    }
  };

  const handleSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!validateStep(currentStep)) {
      toast.error("Please fill in all required fields correctly");
      return;
    }

    setIsSubmitting(true);
    setSubmissionStatus(null);

    try {
      const response = await fetch("/api/onboardAdmin/submitOnboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          formData,
          isExistingCoopAdmin,
          coopId: selectedCooperative?.$id || selectedCooperative?.id,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        handleCaptchaChange("");
        throw new Error(data.error || "Submission failed");
      }

      setSubmissionStatus("success");
      toast.success("Account onboarded successfully!");
    } catch (error) {
      handleCaptchaChange("");
      setSubmissionStatus("error");
      toast.error(error.message || "Failed to submit. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    window.scrollTo(0, 0);
    setErrors({});
  }, [currentStep]);

  if (submissionStatus === "success") {
    return <SuccessSignUp />;
  }

  return (
    <div className="min-h-screen px-4 py-8 pt-24 bg-gray-100 dark:bg-slate-900 sm:py-12 sm:pt-28 font-inter">
      <div className="max-w-3xl mx-auto">
        {currentStep > 1 && (
          <StepIndicator currentStep={currentStep} totalSteps={totalSteps} />
        )}

        {existingCoopModal.open && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/50 backdrop-blur-sm">
            <div className="w-full max-w-md p-6 bg-white shadow-2xl dark:bg-slate-800 rounded-2xl animate-fadeIn">
              <div className="flex items-center justify-center w-16 h-16 mx-auto bg-red-100 rounded-full dark:bg-red-900/30">
                <AlertCircle className="w-8 h-8 text-red-600" />
              </div>
              <h2 className="mt-5 text-2xl font-bold text-center text-slate-900 dark:text-white">
                Cooperative Already Registered
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-center text-slate-600 dark:text-slate-300">
                The cooperative
                <span className="font-semibold">
                  {" "}
                  {existingCoopModal.coopName}
                </span>{" "}
                is already registered on the platform.
              </p>
              <div className="p-4 mt-5 rounded-xl bg-slate-100 dark:bg-slate-700/50">
                <p className="text-xs font-bold tracking-wider uppercase text-slate-500 dark:text-slate-400">
                  Contact Cooperative Admin
                </p>
                <p className="mt-1 text-sm font-semibold break-all text-slate-900 dark:text-white">
                  {existingCoopModal.adminEmail}
                </p>
              </div>
              <button
                type="button"
                onClick={() =>
                  setExistingCoopModal({
                    open: false,
                    adminEmail: "",
                    coopName: "",
                  })
                }
                className="w-full py-3 mt-6 font-semibold text-white transition-all bg-blue-600 rounded-xl hover:bg-blue-700"
              >
                Close
              </button>
            </div>
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="p-6 bg-white shadow-2xl dark:bg-slate-800 sm:p-10 rounded-xl"
        >
          {currentStep === 1 && (
            <OnboardingPage1
              formData={formData}
              handleChange={handleChange}
              errors={errors}
              onVerifyEmail={handleVerifyEmail}
              isVerifying={isVerifying}
              hasNoInvites={hasNoInvites}
              setHasNoInvites={setHasNoInvites}
              continueBtnRef={continueBtnRef}
            />
          )}

          {currentStep === 2 && (
            <OnboardingPage2
              formData={formData}
              handleChange={handleChange}
              errors={errors}
              onSelectBusiness={async (business) => {
                setSelectedCooperative(business);
                setCurrentStep(3);
              }}
              selectedCooperative={selectedCooperative}
              allCoopsData={allCoopsData}
              disableContinue={coopAlreadyExists}
            />
          )}

          {!isExistingCoopAdmin ? (
            <>
              {currentStep === 3 && (
                <OnboardingPage3
                  formData={formData}
                  handleChange={handleChange}
                  errors={errors}
                />
              )}
              {currentStep === 4 && (
                <OnboardingPage4
                  formData={formData}
                  handleChange={handleChange}
                  errors={errors}
                />
              )}
              {currentStep === 5 && (
                <OnboardingPage5
                  formData={formData}
                  handleChange={handleChange}
                  errors={errors}
                />
              )}
              {currentStep === 6 && <OnboardingPage5_5 onSuccess={nextStep} />}
              {currentStep === 7 && (
                <OnboardingPage6
                  formData={formData}
                  handleChange={handleChange}
                  handleCaptchaChange={handleCaptchaChange}
                  errors={errors}
                  setFormData={setFormData}
                  setErrors={setErrors}
                />
              )}
            </>
          ) : (
            <>
              {currentStep === 3 && (
                <OnboardingPage5
                  formData={formData}
                  handleChange={handleChange}
                  errors={errors}
                />
              )}
              {currentStep === 4 && <OnboardingPage5_5 onSuccess={nextStep} />}
            </>
          )}

          {errors.form && (
            <p className="flex items-center justify-center mt-4 text-sm text-center text-red-500">
              <AlertCircle size={14} className="mr-2" />
              {errors.form}
            </p>
          )}

          {currentStep > 1 && (
            <div className="flex items-center justify-between mt-10">
              <div onClick={prevStep}>
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
                currentStep !== (isExistingCoopAdmin ? 4 : 6) && (
                  <div onClick={nextStep}>
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
                      <Loader2 size={18} className="mr-2 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      Submit{" "}
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

export default OnboardingForm;
