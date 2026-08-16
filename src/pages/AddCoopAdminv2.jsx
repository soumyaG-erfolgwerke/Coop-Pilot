"use client";
import React, { useState, useEffect, useRef } from "react";
import toast from "react-hot-toast";
import {
  AlertCircle,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import SuccessSignUp from "@/components/coopadminSignupv2/succussSignUp";
import {
  searchExistingUser,
  createCoopAdminNew,
  checkCoopExists,
} from "@/lib/coopAdminSignUpServicesNew";
import { getAllSectorService } from "@/lib/sectorsService";
import Page1 from "@/components/coopadminSignupv2/page1";
import Page2 from "@/components/coopadminSignupv2/page2";
import Page3 from "@/components/coopadminSignupv2/page3";
import Page4 from "@/components/coopadminSignupv2/page4";
import Page5 from "@/components/coopadminSignupv2/page5";
import Page6 from "@/components/coopadminSignupv2/page6";
import Page7 from "@/components/coopadminSignupv2/page7";
import Page9 from "@/components/coopadminSignupv2/page9";
import Page10 from "@/components/coopadminSignupv2/page10";
import Page11 from "@/components/coopadminSignupv2/page11";
import Page8 from "@/components/coopadminSignupv2/page8";

// --- StepIndicator Component ---
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

// --- Main AddCoopAdmin Component ---
const AddCoopAdminv2 = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 11;
  const [sectors, setSectors] = useState([]);
  const [selectedCooperative, setSelectedCooperative] = useState(null);
  const [auditOrgs, setAuditOrgs] = useState([]);
  const [auditOrgLoading, setAuditOrgLoading] = useState(true);
  const [coopAlreadyExists, setCoopAlreadyExists] = useState(false);
  const [formData, setFormData] = useState({
    // Step 1
    email: "",
    // step 2 -> Step 3
    country: "Germany",
    state: "",
    registryNumber: "",
    companyId: "",
    businessName: "",
    registeredBusinessName: "",
    courtName: "",
    directorName: "",
    legalForm: "eG",
    incorporatedAt: "",
    boardMembers: [],
    maxShares: "",
    memberNumberFormat: "",
    sharePrice: "",
    // Step 4
    businessSector: "",
    size: "",
    businessDescription: "",
    satzungFile: null,
    // Step 5
    auditOrg: null,
    iban: "",
    countryOfResidence: "Germany",
    nationality: "Germany",
    fullLegalFirstMiddleName: "",
    fullLegalLastName: "",
    phoneCountryCode: "+49",
    phoneNumber: "",
    dateOfBirth: "",
    // step 6
    address: {
      street: "",
      houseNo: "",
      postalCode: "",
      city: "",
    },
    street: "",
    houseNo: "",
    postalCode: "",
    location: "",
    // Step 7
    password: "",
    confirmPassword: "",

    captchaToken: "",

    avvDeclaration: false,
    avvFile: null,
    bic: "",
    bankName: "",
    bankCity: "",
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [submissionStatus, setSubmissionStatus] = useState(null);
  const continueBtnRef = useRef(null);
  const [existingCoopModal, setExistingCoopModal] = useState({
    open: false,
    adminEmail: "",
    coopName: "",
  });

  const isDeployment = process.env.NODE_ENV === "production";

  useEffect(() => {
    const fetchAuditOrgs = async () => {
      try {
        setAuditOrgLoading(true);

        const response = await fetch("/api/coopAdminSignUpV2/auditOrgs");

        const data = await response.json();
        console.log(data);

        if (!response.ok) {
          throw new Error(data.error || "Failed to fetch audit organizations");
        }

        setAuditOrgs(data.documents || []);
      } catch (error) {
        console.error(error);
      } finally {
        setAuditOrgLoading(false);
      }
    };

    fetchAuditOrgs();
  }, []);

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
        // Steps 3-11: Continue/Submit button (Step 2 has no continue button)
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
      // const coopRegistry = await getCoopRegistry();
      // setCoopRegistry(coopRegistry);

      const sectorsData = await getAllSectorService();
      setSectors(sectorsData);

      toast.success("Email verified successfully!");
      setCurrentStep(2);
      setErrors({});
    } catch (err) {
      toast.error(
        err.message || "Email verification failed. Please try again.",
      );
      setErrors({ email: "Email verification failed. Please try again." });
    } finally {
      setIsVerifying(false);
    }
  };

  // Validation functions for each step
  const validateStep2 = () => {
    const newErrors = {};

    if (!selectedCooperative) {
      newErrors.businessName = "Please search and select your cooperative";
    }

    if (!formData.businessName?.trim()) {
      newErrors.businessName = "Cooperative name is required";
    }

    if (!formData.companyId?.trim()) {
      newErrors.businessName =
        "Please select a valid cooperative from the registry";
    }

    return newErrors;
  };

  const validateStep3 = () => {
    const newErrors = {};

    const maxShares = Number(formData.maxShares);

    if (!String(formData.maxShares || "").trim()) {
      newErrors.maxShares = "Maximum shares is required";
    } else if (!Number.isInteger(maxShares) || maxShares <= 0) {
      newErrors.maxShares = "Maximum shares must be a positive whole number";
    }

    const sharePrice = Number(formData.sharePrice);

    if (!String(formData.sharePrice || "").trim()) {
      newErrors.sharePrice = "Share price is required";
    } else if (Number.isNaN(sharePrice) || sharePrice <= 0) {
      newErrors.sharePrice = "Share price must be greater than 0";
    }

    if (!formData.memberNumberFormat?.trim()) {
      newErrors.memberNumberFormat = "Member number format is required";
    } else if (!/^[A-Z0-9]+$/.test(formData.memberNumberFormat.trim())) {
      newErrors.memberNumberFormat = "Only letters and numbers are allowed";
    }

    return newErrors;
  };

  const validateStep4 = () => {
    const newErrors = {};

    if (!formData.country?.trim()) {
      newErrors.country = "Country is required";
    }

    if (!formData.businessName?.trim()) {
      newErrors.businessName = "Company name is required";
    }

    if (!formData.registeredBusinessName?.trim()) {
      newErrors.registeredBusinessName = "Registered business name is required";
    }

    if (!formData.courtName?.trim()) {
      newErrors.courtName = "Registered court name is required";
    }

    if (!formData.registryNumber?.trim()) {
      newErrors.registrationNumber = "Registration number is required";
    } else if (!/^GnR\s?\d+$/i.test(formData.registryNumber.trim())) {
      newErrors.registrationNumber =
        'Registration number must be in format "GnR 1234"';
    }

    if (!formData.directorName?.trim()) {
      newErrors.directorName = "Please select a director";
    }

    const isDirectorValid = formData.boardMembers?.some(
      (member) => member.name === formData.directorName,
    );

    if (formData.directorName && !isDirectorValid) {
      newErrors.directorName = "Selected director is invalid";
    }

    return newErrors;
  };

  const validateStep5 = () => {
    const newErrors = {};

    if (!formData.businessSector) {
      newErrors.businessSector = "Please select a business sector";
    }

    const validSector = sectors?.some(
      (sector) => sector.key === formData.businessSector,
    );

    if (formData.businessSector && !validSector) {
      newErrors.businessSector = "Selected business sector is invalid";
    }

    if (!formData.size) {
      newErrors.size = "Please select company size";
    }

    const validSizes = [1, 2, 3, 4];

    if (formData.size && !validSizes.includes(Number(formData.size))) {
      newErrors.size = "Selected company size is invalid";
    }

    if (!formData.businessDescription?.trim()) {
      newErrors.businessDescription = "Business description is required";
    } else if (formData.businessDescription.trim().length < 50) {
      newErrors.businessDescription =
        "Description must contain at least 50 characters";
    } else if (formData.businessDescription.trim().length > 2000) {
      newErrors.businessDescription =
        "Description cannot exceed 2000 characters";
    }

    return newErrors;
  };

  const validateStep6 = () => {
    const newErrors = {};

    if (!formData.satzungFile) {
      newErrors.satzungFile = "Please upload the Satzung document";

      return newErrors;
    }

    const allowedTypes = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];

    if (
      formData.satzungFile?.type &&
      !allowedTypes.includes(formData.satzungFile.type)
    ) {
      newErrors.satzungFile = "Only PDF or DOCX files are allowed";
    }

    const maxSize = 25 * 1024 * 1024;

    if (formData.satzungFile?.size && formData.satzungFile.size > maxSize) {
      newErrors.satzungFile = "File size must be less than 25MB";
    }

    return newErrors;
  };

  const validateStep7 = () => {
    const newErrors = {};

    if (!formData.auditOrg?.data?.$id) {
      newErrors.auditOrg = "Please select an auditor";

      return newErrors;
    }

    // OTHER
    if (formData.auditOrg.data.$id === "OTHER") {
      if (!formData.auditOrg.data.name?.trim()) {
        newErrors.auditOrg = "Please enter the auditor organization name";
      } else if (formData.auditOrg.data.name.trim().length < 3) {
        newErrors.auditOrg = "Auditor organization name is too short";
      } else if (formData.auditOrg.data.name.trim().length > 120) {
        newErrors.auditOrg = "Auditor organization name is too long";
      }
    }

    // NONE
    if (formData.auditOrg.data.$id === "NONE") {
      if (formData.auditOrg.data.name !== "No Audit Partner") {
        newErrors.auditOrg = "Invalid auditor selection";
      }
    }

    // LINKED AUDITOR
    if (formData.auditOrg.type === "linked") {
      const validAuditor = auditOrgs?.some(
        (auditor) => auditor.$id === formData.auditOrg.data.$id,
      );

      if (!validAuditor) {
        newErrors.auditOrg = "Selected auditor is invalid";
      }
    }

    return newErrors;
  };

  const validateStep8 = () => {
    const newErrors = {};

    // Country
    if (!formData.countryOfResidence?.trim()) {
      newErrors.countryOfResidence = "Country of residence is required";
    }

    // Nationality
    if (!formData.nationality?.trim()) {
      newErrors.nationality = "Nationality is required";
    }

    // First + Middle Name
    if (!formData.fullLegalFirstMiddleName?.trim()) {
      newErrors.fullLegalFirstMiddleName = "First and middle name is required";
    } else if (formData.fullLegalFirstMiddleName.trim().length < 2) {
      newErrors.fullLegalFirstMiddleName = "Name is too short";
    } else if (
      !/^[a-zA-ZÀ-ÿ\s'-]+$/.test(formData.fullLegalFirstMiddleName.trim())
    ) {
      newErrors.fullLegalFirstMiddleName = "Invalid characters in name";
    }

    // Last Name
    if (!formData.fullLegalLastName?.trim()) {
      newErrors.fullLegalLastName = "Last name is required";
    } else if (formData.fullLegalLastName.trim().length < 2) {
      newErrors.fullLegalLastName = "Last name is too short";
    } else if (!/^[a-zA-ZÀ-ÿ\s'-]+$/.test(formData.fullLegalLastName.trim())) {
      newErrors.fullLegalLastName = "Invalid characters in last name";
    }

    // Phone Country Code
    if (!formData.phoneCountryCode?.trim()) {
      newErrors.phoneCountryCode = "Country code is required";
    }

    // Phone Number
    const cleanedPhone = formData.phoneNumber?.replace(/[\s\-\(\)\+]+/g, "") || "";

    if (!cleanedPhone) {
      newErrors.phoneNumber = "Phone number is required";
    } else if (!/^\d{6,15}$/.test(cleanedPhone)) {
      newErrors.phoneNumber = "Phone number must contain 6-15 digits";
    }

    // Date of Birth
    if (!formData.dateOfBirth) {
      newErrors.dateOfBirth = "Date of birth is required";
    } else {
      const birthDate = new Date(formData.dateOfBirth);

      const today = new Date();

      let age = today.getFullYear() - birthDate.getFullYear();

      const monthDiff = today.getMonth() - birthDate.getMonth();

      if (
        monthDiff < 0 ||
        (monthDiff === 0 && today.getDate() < birthDate.getDate())
      ) {
        age--;
      }

      if (age < 18) {
        newErrors.dateOfBirth = "You must be at least 18 years old";
      }

      if (birthDate > today) {
        newErrors.dateOfBirth = "Date of birth cannot be in the future";
      }
    }

    return newErrors;
  };

  const validateStep9 = () => {
    const newErrors = {};

    // Street
    if (!formData.address?.street?.trim()) {
      newErrors.street = "Street is required";
    } else if (formData.address.street.trim().length < 2) {
      newErrors.street = "Street name is too short";
    } else if (formData.address.street.trim().length > 120) {
      newErrors.street = "Street name is too long";
    }

    // House Number
    if (!formData.address?.houseNo?.trim()) {
      newErrors.houseNo = "House number is required";
    } else if (!/^[a-zA-Z0-9\s\-\/]+$/.test(formData.address.houseNo.trim())) {
      newErrors.houseNo = "Invalid house number";
    }

    // Postal Code
    if (!formData.address?.postalCode?.trim()) {
      newErrors.postalCode = "Postal code is required";
    } else if (!/^\d{4,10}$/.test(formData.address.postalCode.trim())) {
      newErrors.postalCode = "Postal code must contain 4-10 digits";
    }

    // City
    if (!formData.address?.city?.trim()) {
      newErrors.city = "City is required";
    } else if (formData.address.city.trim().length < 2) {
      newErrors.city = "City name is too short";
    } else if (!/^[a-zA-ZÀ-ÿ\s'-]+$/.test(formData.address.city.trim())) {
      newErrors.city = "Invalid city name";
    }

    return newErrors;
  };

  const validateStep10 = () => {
    const newErrors = {};

    const iban = formData.iban?.replace(/\s+/g, "") || "";

    // IBAN
    if (!iban) {
      newErrors.iban = "IBAN is required";
    }

    // Bank Name
    if (!formData.bankName?.trim()) {
      newErrors.bankName = "Bank name could not be verified";
    } else if (formData.bankName.trim().length < 2) {
      newErrors.bankName = "Invalid bank name";
    }

    // BIC
    if (!formData.bic?.trim()) {
      newErrors.bic = "BIC could not be verified";
    } else if (
      !/^[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?$/.test(formData.bic.trim())
    ) {
      newErrors.bic = "Invalid BIC format";
    }

    // Bank City (optional but validate if exists)
    if (
      formData.bankCity &&
      !/^[a-zA-ZÀ-ÿ\s'-]+$/.test(formData.bankCity.trim())
    ) {
      newErrors.bankCity = "Invalid bank city";
    }

    return newErrors;
  };

  const validateStep11 = () => {
    const newErrors = {};

    // Password
    if (!formData.password) {
      newErrors.password = "Password is required";
    } else {
      if (formData.password.length < 8) {
        newErrors.password = "Password must be at least 8 characters";
      } else if (!/[A-Z]/.test(formData.password)) {
        newErrors.password =
          "Password must contain at least one uppercase letter";
      } else if (!/[a-z]/.test(formData.password)) {
        newErrors.password =
          "Password must contain at least one lowercase letter";
      } else if (!/[0-9]/.test(formData.password)) {
        newErrors.password = "Password must contain at least one number";
      } else if (
        !/[!@#$%^&*(),.?":{}|<>_\-\\[\]/+=~`]/.test(formData.password)
      ) {
        newErrors.password =
          "Password must contain at least one special character";
      }
    }

    // Confirm Password
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password";
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    // AVV Declaration
    if (!formData.avvDeclaration) {
      newErrors.avvDeclaration = "You must accept the AVV agreement";
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

      case 8:
        stepErrors = validateStep8();
        break;

      case 9:
        stepErrors = validateStep9();
        break;

      case 10:
        stepErrors = validateStep10();
        break;

      case 11:
        stepErrors = validateStep11();
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

    // Only allow form submission on the final step (step 11)
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

      if (response.success) {
        if (formData.avvFile) {
          const url = URL.createObjectURL(formData.avvFile);
          const link = document.createElement("a");
          link.href = url;
          link.download = formData.avvFile.name;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          setTimeout(() => {
            URL.revokeObjectURL(url);
          }, 1000);
        }
      }
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

        // BUSINESS
        businessName: selectedCooperative.name || "",
        registeredBusinessName: selectedCooperative.name || "",
        registryNumber: selectedCooperative.registerNumber || "",
        courtName: selectedCooperative.registerCourt || "",
        legalForm: selectedCooperative.legalForm || "eG",
        state: selectedCooperative.state || "",
        country: selectedCooperative.address?.country || "Germany",
        street: selectedCooperative.address?.street || "",
        postalCode: selectedCooperative.address?.postalCode || "",
        location: selectedCooperative.address?.city || "",
        incorporatedAt: selectedCooperative.incorporatedAt || "",
        boardMembers: selectedCooperative.boardMembers || [],
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
              onSelectBusiness={async (business) => {
                try {
                  setSelectedCooperative(business);
                  const data = await checkCoopExists(business.registerNumber);

                  console.log(data);
                  if (data.exists) {
                    setExistingCoopModal({
                      open: true,
                      adminEmail: data.coop.adminEmail,
                      coopName: data.coop.name,
                    });
                    setCoopAlreadyExists(true);

                    return;
                  }

                  setCoopAlreadyExists(false);
                  setCurrentStep(3);
                } catch (error) {
                  console.error(error);

                  toast.error("Failed to verify cooperative registration.");
                }
              }}
              selectedCooperative={selectedCooperative}
              disableContinue={coopAlreadyExists}
              onSearchInput={() => setCoopAlreadyExists(false)}
            />
          )}
          {currentStep === 3 && (
            <Page3
              formData={formData}
              handleChange={handleChange}
              errors={errors}
            />
          )}
          {currentStep === 4 && (
            <Page4
              formData={formData}
              handleChange={handleChange}
              errors={errors}
              selectedCooperative={selectedCooperative}
            />
          )}
          {currentStep === 5 && (
            <Page5
              formData={formData}
              handleChange={handleChange}
              errors={errors}
              selectedCooperative={selectedCooperative}
              sectors={sectors}
            />
          )}
          {currentStep === 6 && (
            <Page6
              formData={formData}
              handleChange={handleChange}
              errors={errors}
              selectedCooperative={selectedCooperative}
            />
          )}
          {currentStep === 7 && (
            <Page7
              formData={formData}
              handleChange={handleChange}
              errors={errors}
              selectedCooperative={selectedCooperative}
              auditOrgs={auditOrgs}
              loading={auditOrgLoading}
            />
          )}
          {currentStep === 8 && (
            <Page8
              formData={formData}
              handleChange={handleChange}
              errors={errors}
              selectedCooperative={selectedCooperative}
            />
          )}
          {currentStep === 9 && (
            <Page9
              formData={formData}
              handleChange={handleChange}
              errors={errors}
            />
          )}
          {currentStep === 10 && (
            <Page10
              formData={formData}
              handleChange={handleChange}
              errors={errors}
            />
          )}
          {currentStep === 11 && (
            <Page11
              formData={formData}
              handleChange={handleChange}
              handleCaptchaChange={handleCaptchaChange}
              errors={errors}
              setErrors={setErrors}
              setFormData={setFormData}
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

export default AddCoopAdminv2;
