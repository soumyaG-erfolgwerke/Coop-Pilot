"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ChevronLeft,
  MapPin,
  Globe,
  DollarSign,
  Gavel,
  Briefcase,
  Info,
  X,
  ArrowRight,
  Banknote,
  ShieldCheck,
  CheckCircle,
  Plus,
  Minus,
  FileText,
} from "lucide-react";
import { getCoopById } from "../lib/getCoopsService";
import { useAuth } from "../hooks/useAuth";
import { EditCoopModal } from "../components/superadmin/modals";
import {
  addTransaction,
  getTransactionsByMemberId,
} from "../lib/transactionService";
import { fetchCooperativeSettings } from "../lib/cooperativeSettingsService";
import toast from "react-hot-toast";
import HistoryTimeline from "../components/HistoryTimeline";
import { getDocumentsofCoop } from "../lib/coopService";
import { getViewUrl } from "../lib/fileUrlService";
import { stripeService } from "@/services/payment/stripeService";

// --- HELPER COMPONENT for displaying details ---
const DetailItem = ({ icon: Icon, label, value, className = "" }) => (
  <div
    className={`flex items-start space-x-3 p-4 border-b border-gray-100 ${className}`}
  >
    <Icon className="flex-shrink-0 w-5 h-5 mt-1 text-gray-400" />
    <div className="flex-grow">
      <p className="text-sm text-gray-500">{label}</p>
      <p className="font-semibold text-gray-800 text-md">{value || "N/A"}</p>
    </div>
  </div>
);

// --- CREATIVE SHARE STEPPER COMPONENT ---
const ShareStepper = ({
  value,
  onChange,
  min = 1,
  max = Number.MAX_SAFE_INTEGER,
}) => {
  const handleIncrement = () => onChange(value + 1);
  const handleDecrement = () => onChange(Math.max(min, value - 1));

  return (
    <div>
      <label
        htmlFor="shareCount"
        className="block text-sm font-medium text-gray-700 dark:text-gray-300"
      >
        Number of Shares
      </label>
      <div className="flex items-center justify-center gap-4 p-2 mt-1 bg-gray-100 rounded-lg dark:bg-slate-700">
        <button
          type="button"
          onClick={handleDecrement}
          disabled={value <= min}
          className="p-2 text-gray-600 transition-colors bg-white rounded-full shadow dark:bg-slate-600 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-slate-500"
          aria-label="Decrease share count"
        >
          <Minus className="w-5 h-5" />
        </button>
        <span
          id="shareCount"
          className="w-16 text-2xl font-bold text-center text-gray-900 dark:text-white"
        >
          {value}
        </span>
        <button
          type="button"
          onClick={handleIncrement}
          disabled={value >= max}
          className="p-2 text-gray-600 transition-colors bg-white rounded-full shadow dark:bg-slate-600 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-slate-500"
          aria-label="Increase share count"
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

// --- VIEW STATUS MODAL COMPONENT ---
const ViewStatusModal = ({
  isOpen,
  onClose,
  transaction,
  cooperative,
  triggerReload,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !transaction) return null;

  const isSubmitted = true;
  const isApproved = transaction.isAdminApproved === true;
  const isPaymentMade = transaction.havePaid === true;
  const isPaymentFailed = transaction.paymentStatus === "payment_failed";
  const isPaymentProcessing = transaction.paymentStatus === "payment_processing";

  const handleConfirmPayment = async () => {
    if (!transaction || !transaction.shares) {
      toast.error("Invalid transaction details. Please reload.");
      return;
    }

    console.log("Initiating payment for transaction:", transaction);

    setIsSubmitting(true);

    const checkoutPromise = async () => {
      // Pass the coopId, shares, and transaction ID to generate the Stripe session
      const data = await stripeService.buyShares(
        transaction.coopId,
        transaction.shares,
        transaction.$id
      );

      if (!data.url) {
        throw new Error("No URL returned from payment gateway.");
      }

      window.location.href = data.url;
      return data;
    };

    try {
      await toast.promise(checkoutPromise(), {
        loading: "Preparing secure checkout...",
        success: "Success! Redirecting to Stripe...",
        error: (err) => `ERROR: ${err.message}`,
      });
    } catch (error) {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="relative flex flex-col w-full max-w-lg p-6 bg-white shadow-2xl dark:bg-slate-800 rounded-2xl">
        <button
          onClick={onClose}
          className="absolute p-2 text-gray-500 rounded-full top-4 right-4 hover:bg-gray-100 dark:hover:bg-slate-700"
        >
          <X size={20} />
        </button>

        <h3 className="mb-4 text-xl font-bold text-center text-gray-900 dark:text-white">
          Application Status
        </h3>

        <div className="flex items-center justify-between mx-4 mb-8 space-x-2 text-xs">
          <div className="flex flex-col items-center flex-1">
            <div
              className={`flex items-center justify-center w-8 h-8 rounded-full ${isSubmitted ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-400"}`}
            >
              1
            </div>
            <span className="mt-2 font-medium text-gray-900 dark:text-gray-200">
              Submitted
            </span>
          </div>
          <div
            className={`w-12 h-1 ${isApproved ? "bg-blue-600" : "bg-gray-200 dark:bg-slate-600"}`}
          ></div>
          <div className="flex flex-col items-center flex-1">
            <div
              className={`flex items-center justify-center w-8 h-8 rounded-full ${isApproved ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-400"}`}
            >
              2
            </div>
            <span className="mt-2 font-medium text-gray-900 dark:text-gray-200">
              Approved
            </span>
          </div>
          <div
            className={`w-12 h-1 ${isPaymentMade ? "bg-blue-600" : "bg-gray-200 dark:bg-slate-600"}`}
          ></div>
          <div className="flex flex-col items-center flex-1">
            <div
              className={`flex items-center justify-center w-8 h-8 rounded-full ${isPaymentMade ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-400"}`}
            >
              3
            </div>
            <span className="mt-2 font-medium text-center text-gray-900 dark:text-gray-200">
              Payment
              <br />
              Made
            </span>
          </div>
        </div>

        {/* Cant pay yet */}
        {!isApproved && (
          <div className="p-4 text-center text-yellow-800 border border-yellow-200 rounded-lg bg-yellow-50 dark:bg-yellow-900/30 dark:text-yellow-200 dark:border-yellow-800">
            <p>
              Your application is currently under review by the administrators.
              Please check back later.
            </p>
          </div>
        )}

        {/* Payment not yet made */}
        {isApproved && !isPaymentMade && !isPaymentProcessing && !isPaymentFailed && (
          <div className="space-y-4">
            <div className="p-4 text-center bg-gray-100 rounded-lg dark:bg-slate-700">
              <h4 className="mb-2 font-semibold text-gray-800 dark:text-gray-200">
                Make your Payment
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Please make a payment of{" "}
                <strong>€{transaction.price.toLocaleString()}</strong> for your
                shares.
              </p>
            </div>

            <button
              onClick={handleConfirmPayment}
              disabled={isSubmitting}
              className="w-full px-4 py-2 mt-4 font-semibold text-white transition-colors bg-blue-600 rounded-md shadow-sm hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Processing Payment..." : "Make Payment"}
            </button>
          </div>
        )}

        {/* Payment Failed */}
        {isApproved && isPaymentFailed && (
          <div className="space-y-4">
            <div className="p-4 text-center text-red-800 border border-red-200 rounded-lg bg-red-50 dark:bg-red-900/30 dark:text-red-200 dark:border-red-800">
              <h4 className="mb-2 font-semibold">Payment Failed</h4>
              <p className="text-sm">
                Your previous payment attempt was declined or failed to process.
                Please try making the payment again.
              </p>
            </div>
            <button
              onClick={handleConfirmPayment}
              disabled={isSubmitting}
              className="w-full px-4 py-2 mt-4 font-semibold text-white transition-colors bg-blue-600 rounded-md shadow-sm hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Redirecting..." : "Retry Payment"}
            </button>
          </div>
        )}

        {/* Payment done but still processing(SEPA) */}
        {isApproved && !isPaymentMade && isPaymentProcessing && (
          <div className="space-y-4">
            <div className="p-4 text-center bg-gray-100 rounded-lg dark:bg-slate-700">
              <h4 className="mb-2 font-semibold text-gray-800 dark:text-gray-200">
                Payment Required
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Please make a payment of <strong>€{transaction.price.toLocaleString()}</strong> for your shares.
                <br/><span className="text-xs italic opacity-75">(If you just paid via SEPA, this will update automatically once funds clear).</span>
              </p>
            </div>

            <button
              onClick={handleConfirmPayment}
              disabled={isSubmitting}
              className="w-full px-4 py-2 mt-4 font-semibold text-white transition-colors bg-blue-600 rounded-md shadow-sm hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Processing..." : "Make Payment"}
            </button>
          </div>
        )}

        {/* State 5: All Complete */}
        {isApproved && isPaymentMade && (
          <div className="flex flex-col items-center justify-center p-4 text-center text-green-800 border border-green-200 rounded-lg bg-green-50 dark:bg-green-900/30 dark:text-green-200 dark:border-green-800">
            <ShieldCheck className="w-8 h-8 mb-2 text-green-600 dark:text-green-400" />
            <p className="font-medium">Your payment has been verified.</p>
            <p className="mt-1 text-sm opacity-90">Your membership and shares are now fully activated.</p>
          </div>
        )}
      </div>
    </div>
  );
};

// --- BUY SHARE MODAL COMPONENT ---
const BuyShareModal = ({ isOpen, onClose, cooperative, membership }) => {
  const [step, setStep] = useState(1);
  const [shareCount, setShareCount] = useState(1);
  const [purchaseType, setPurchaseType] = useState("own");
  const [message, setMessage] = useState("");
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [file, setFile] = useState(null);
  const [documentType, setDocumentType] = useState("Personalausweis");
  const [isSubmittingKYC, setIsSubmittingKYC] = useState(false);
  const [totalPrice, setTotalPrice] = useState(0);
  const [legalSettings, setLegalSettings] = useState(null);
  const [validationError, setValidationError] = useState("");
  const { user } = useAuth();

  // Declaration states
  const [declarationChecked, setDeclarationChecked] = useState(false);
  const [signatureName, setSignatureName] = useState("");
  const [signaturePlace, setSignaturePlace] = useState("");
  const [isSubmittingDeclaration, setIsSubmittingDeclaration] = useState(false);
  const [satzungRead, setSatzungRead] = useState(false);

  const coopBankDetails = {
    iban: cooperative.iban || "DE25100500001091562525",
    bic: cooperative.bic || "BELADEBEXXX",
  };

  useEffect(() => {
    const loadLegalSettings = async () => {
      if (!cooperative?.id) return;
      try {
        const settings = await fetchCooperativeSettings(cooperative.id);
        setLegalSettings(settings);
      } catch {
        setLegalSettings(null);
      }
    };

    loadLegalSettings();
  }, [cooperative?.id]);

  useEffect(() => {
    if (!legalSettings) return;
    setShareCount((prev) => {
      if (prev < legalSettings.min_shares) return legalSettings.min_shares;
      if (prev > legalSettings.max_shares) return legalSettings.max_shares;
      return prev;
    });
  }, [legalSettings]);

  useEffect(() => {
    if (cooperative) {
      const effectiveSharePrice = legalSettings?.share_price_cents
        ? legalSettings.share_price_cents / 100
        : cooperative.sharePrice;
      setTotalPrice(shareCount * effectiveSharePrice);
      // console.log(user);
    }
  }, [shareCount, cooperative, legalSettings?.share_price_cents]);

  const handleProceed = async () => {
    const minShares = legalSettings?.min_shares || 1;
    const maxShares = legalSettings?.max_shares || Number.MAX_SAFE_INTEGER;
    if (shareCount < minShares || shareCount > maxShares) {
      setValidationError(
        `Shares must be between ${minShares} and ${maxShares}.`,
      );
      return;
    }

    setValidationError("");

    // If the membership is already active, we don't need KYC, we just submit the transaction.
    const isMemberActive =
      membership?.status &&
      ["active", "noticegiven"].includes(membership.status.toLowerCase());
    if (isMemberActive) {
      setIsSubmittingKYC(true); // Re-use this for loading indicator
      try {
        const trandata = {
          coopId: cooperative.id,
          memberId: user.userId,
          shares: shareCount,
          price: totalPrice,
          buyFor: purchaseType,
          metadata: message,
          verificationStatus: "pending",
          transactionType: "purchase",
          time: new Date().toISOString(),
          isAdminApproved: false,
          havePaid: false,
        };
        const transactionRes = await addTransaction(trandata);
        const transactionId =
          transactionRes?.$id || transactionRes?.transaction?.$id;

        const formData = new FormData();
        formData.append("userId", user.userId);
        formData.append("coopId", cooperative.id);
        formData.append("transactionId", transactionId);

        await fetch("/api/coop-r-member", {
          method: "POST",
          body: formData,
        });

        setStep(4); // Go straight to success (which is now step 4)
      } catch (err) {
        console.error(err);
        toast.error(err.message || "Failed to submit request.");
      } finally {
        setIsSubmittingKYC(false);
      }
    } else {
      // Need KYC
      setStep(2);
    }
  };

  const handleOpenSatzung = async () => {
    try {
      const docs = await getDocumentsofCoop(cooperative.id);
      const docList = docs.documents || [];
      const satzungDoc = docList.find(
        (doc) => doc.category === "SATZUNG" && doc.isCurrent === true,
      );

      if (!satzungDoc) {
        toast.error("Sutzung not found");
        return;
      }

      const fileUrl = getViewUrl(satzungDoc.fileId);
      window.open(fileUrl, "_blank");
      setSatzungRead(true);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load Satzung");
    }
  };

  const submitDeclaration = async () => {
    if (!satzungRead) {
      toast.error("Please open and read the Satzung first.");
      return;
    }
    if (!declarationChecked) {
      toast.error("Please read and understand the Satzung to proceed.");
      return;
    }
    if (!signatureName.trim()) {
      toast.error("Signature name is required.");
      return;
    }
    if (!file) {
      toast.error("Please upload an identity document first.");
      setStep(2);
      return;
    }

    setIsSubmittingDeclaration(true);
    try {
      // 1. Create the transaction
      const trandata = {
        coopId: cooperative.id,
        memberId: user.userId,
        shares: shareCount,
        price: totalPrice,
        buyFor: purchaseType,
        metadata: message,
        verificationStatus: "pending",
        transactionType: "purchase",
        time: new Date().toISOString(),
        isAdminApproved: false,
        havePaid: false,
      };

      const transactionRes = await addTransaction(trandata);
      const transactionId =
        transactionRes?.$id || transactionRes?.transaction?.$id;

      // 2. Now create KYC / coopXmember and upload document
      const formData = new FormData();
      formData.append("userId", user.userId);
      formData.append("coopId", cooperative.id);
      formData.append("transactionId", transactionId);
      formData.append("file", file);
      formData.append("documentType", documentType);

      const res = await fetch("/api/coop-r-member", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || "Failed to submit KYC");
      }

      // 3. Save declaration form details to userTextForm
      const resForm = await fetch("/api/coop-r-member/user-text-form", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: user.userId,
          coopId: cooperative.id,
          sign: signatureName,
          place: signaturePlace || null,
        }),
      });

      const dataForm = await resForm.json();
      if (!dataForm.success) {
        throw new Error(dataForm.error || "Failed to submit declaration");
      }

      setStep(4);
    } catch (err) {
      console.error(err);
      toast.error(
        err.message || "Application submission failed. Please try again.",
      );
    } finally {
      setIsSubmittingDeclaration(false);
    }
  };

  const handleClose = () => {
    setStep(1);
    setShareCount(1);
    setPurchaseType("own");
    setMessage("");
    setIsConfirmed(false);
    setDeclarationChecked(false);
    setSignatureName("");
    setSignaturePlace("");
    setSatzungRead(false);
    onClose();
  };

  if (!isOpen) return null;

  const renderStepContent = () => {
    switch (step) {
      case 1:
        return (
          <>
            <div className="mb-4 text-center">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                Purchase Shares in {cooperative.name}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Complete the details below to initiate your purchase.
              </p>
            </div>
            <div className="space-y-4">
              <ShareStepper
                value={shareCount}
                onChange={setShareCount}
                min={legalSettings?.min_shares || 1}
                max={legalSettings?.max_shares || Number.MAX_SAFE_INTEGER}
              />
              {legalSettings && (
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Allowed shares: {legalSettings.min_shares} -{" "}
                  {legalSettings.max_shares} | Legal share price: EUR{" "}
                  {(legalSettings.share_price_cents / 100).toFixed(2)}
                </p>
              )}
              <div className="p-3 text-center rounded-lg bg-blue-50 dark:bg-primary-dark-900/50">
                <p className="text-sm text-blue-primary dark:text-blue-300">
                  Total Price
                </p>
                <p className="text-2xl font-bold text-blue-600 dark:text-primary/80">
                  €{totalPrice.toLocaleString()}
                </p>
              </div>
              {validationError && (
                <p className="text-sm text-red-600 dark:text-red-300">
                  {validationError}
                </p>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  This purchase is for:
                </label>
                <div className="mt-2 space-y-2">
                  {["own", "child", "organization"].map((type) => (
                    <label key={type} className="flex items-center">
                      <input
                        type="radio"
                        name="purchaseType"
                        value={type}
                        checked={purchaseType === type}
                        onChange={(e) => setPurchaseType(e.target.value)}
                        className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-primary"
                      />
                      <span className="block ml-3 text-sm text-gray-700 capitalize dark:text-gray-300">
                        {type === "own" ? "Myself" : `A ${type}`}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label
                  htmlFor="message"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Message (Optional)
                </label>
                <textarea
                  id="message"
                  rows="3"
                  maxLength="300"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="block w-full px-3 py-2 mt-1 bg-white border border-gray-300 rounded-md shadow-sm dark:border-slate-600 dark:bg-slate-700 focus:outline-none focus:ring-primary sm:text-sm"
                  placeholder="Add any relevant information..."
                ></textarea>
                <p className="mt-1 text-xs text-right text-gray-400">
                  {message.length}/300
                </p>
              </div>
            </div>
            <div className="mt-6">
              <button
                onClick={handleProceed}
                disabled={
                  (!!legalSettings &&
                    (shareCount < legalSettings.min_shares ||
                      shareCount > legalSettings.max_shares)) ||
                  isSubmittingKYC
                }
                className="inline-flex items-center justify-center w-full px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:bg-blue-400"
              >
                {isSubmittingKYC ? "Processing..." : "Proceed"}{" "}
                <ArrowRight className="w-4 h-4 ml-2" />
              </button>
            </div>
          </>
        );
      case 2:
        return (
          <div className="py-4 text-left">
            <h3 className="mb-2 text-xl font-semibold text-gray-900 dark:text-white">
              Identity Verification (KYC)
            </h3>
            <p className="mb-4 text-sm text-gray-600 dark:text-gray-300">
              Please upload a valid identity document to complete your
              membership application.
            </p>

            <div className="mb-4">
              <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
                Document Type
              </label>
              <select
                value={documentType}
                onChange={(e) => setDocumentType(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md dark:border-slate-600 dark:bg-slate-700 focus:outline-none focus:ring-primary sm:text-sm"
              >
                <option value="Personalausweis">
                  Personalausweis (ID Card)
                </option>
                <option value="Reisepass">Reisepass (Passport)</option>
                <option value="Aufenthaltstitel">
                  Aufenthaltstitel (Residence Permit)
                </option>
              </select>
            </div>

            <div className="mb-6">
              <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
                Upload Document (1KB - 5MB)
              </label>
              <input
                type="file"
                accept=".jpg,.jpeg,.png,.pdf"
                onChange={(e) => setFile(e.target.files[0])}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
              {file && (
                <p className="mt-2 text-xs text-green-600">
                  Selected: {file.name}
                </p>
              )}
            </div>

            <button
              onClick={() => {
                if (!file) {
                  toast.error("Please select a file to upload.");
                  return;
                }
                if (file.size > 10 * 1024 * 1024) {
                  toast.error("File exceeds 10MB limit.");
                  return;
                }
                setStep(3);
              }}
              disabled={!file}
              className="inline-flex items-center justify-center w-full px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md shadow-sm hover:bg-green-700 disabled:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2"
            >
              Proceed to Declaration
            </button>
          </div>
        );
      case 3:
        return (
          <div className="py-4 text-left">
            <h3 className="mb-2 text-xl font-semibold text-gray-900 dark:text-white">
              Declaration
            </h3>
            <p className="mb-4 text-sm text-gray-600 dark:text-gray-300">
              Please read the Satzung of{" "}
              <strong>{cooperative?.name || "the cooperative"}</strong> and sign
              the declaration below.
            </p>

            <div className="p-4 mb-6 border rounded-lg bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700">
              <p className="mb-3 text-sm font-medium text-slate-700 dark:text-slate-300">
                Read the Satzung of {cooperative?.name || "the cooperative"}
              </p>
              <button
                type="button"
                onClick={handleOpenSatzung}
                className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-blue-600 transition-colors border border-blue-200 rounded-md bg-blue-50 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800 hover:bg-blue-100"
              >
                Open Latest Satzung
              </button>
            </div>

            <div className="mb-6">
              <label className="flex items-start cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={declarationChecked}
                  onChange={(e) => setDeclarationChecked(e.target.checked)}
                  className="w-4 h-4 mt-1 text-blue-600 border-gray-300 rounded focus:ring-primary dark:border-slate-600 dark:bg-slate-700"
                />
                <span className="block ml-3 text-sm text-gray-700 dark:text-gray-300">
                  i have complete read and understood the Stuzung
                </span>
              </label>
            </div>

            <div className="grid grid-cols-1 gap-4 mb-6 md:grid-cols-2">
              <div>
                <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
                  Sign
                </label>
                <input
                  type="text"
                  placeholder="name"
                  value={signatureName}
                  onChange={(e) => setSignatureName(e.target.value)}
                  className="w-full px-3 py-2 text-gray-900 bg-white border border-gray-300 rounded-md dark:border-slate-600 dark:bg-slate-700 focus:outline-none focus:ring-primary sm:text-sm dark:text-white"
                />
              </div>
              <div>
                <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
                  place
                </label>
                <input
                  type="text"
                  placeholder="Place"
                  value={signaturePlace}
                  onChange={(e) => setSignaturePlace(e.target.value)}
                  className="w-full px-3 py-2 text-gray-900 bg-white border border-gray-300 rounded-md dark:border-slate-600 dark:bg-slate-700 focus:outline-none focus:ring-primary sm:text-sm dark:text-white"
                />
              </div>
            </div>

            <button
              onClick={submitDeclaration}
              disabled={
                !declarationChecked ||
                !signatureName.trim() ||
                isSubmittingDeclaration ||
                !satzungRead
              }
              className="inline-flex items-center justify-center w-full px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md shadow-sm hover:bg-green-700 disabled:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2"
            >
              {isSubmittingDeclaration ? "Submitting..." : "Submit & Complete"}
            </button>
          </div>
        );
      case 4:
        return (
          <div className="py-8 text-center">
            <CheckCircle className="w-16 h-16 mx-auto text-green-500" />
            <h3 className="mt-4 text-xl font-semibold text-gray-900 dark:text-white">
              Application Submitted
            </h3>
            <p className="mt-2 text-gray-600 text-md dark:text-gray-300">
              Your share purchase and application is currently under review by
              the administrators. You can check the status on the cooperative
              page.
            </p>
            <div className="mt-8">
              <button
                onClick={handleClose}
                className="inline-flex items-center justify-center w-full px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
              >
                Close
              </button>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-lg flex flex-col max-h-[95vh] relative">
        <button
          onClick={handleClose}
          className="absolute p-2 text-gray-500 rounded-full top-4 right-4 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-700"
        >
          <X size={20} />
        </button>
        <div className="p-6 overflow-y-auto">{renderStepContent()}</div>
      </div>
    </div>
  );
};

// --- MAIN COMPONENT ---
export default function CooperativeDetailPage() {
  const params = useParams();
  const id = params?.id || "coop123"; // Get 'id' from URL, default to 'coop123' for demonstration
  const { user } = useAuth();
  const router = useRouter();
  const [cooperative, setCooperative] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isBuyShareModalOpen, setIsBuyShareModalOpen] = useState(false);
  const [isViewStatusModalOpen, setIsViewStatusModalOpen] = useState(false);
  const [reloadkey, setReloadKey] = useState(0);

  const [latestTransaction, setLatestTransaction] = useState(null);
  const [membership, setMembership] = useState(null);
  const [statusLoading, setStatusLoading] = useState(true);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }

    const fetchCooperative = async () => {
      setLoading(true);
      const data = await getCoopById(id);
      // console.log("coop:", data);
      setCooperative(data);
      setLoading(false);
    };

    fetchCooperative();
  }, [id, reloadkey]);

  useEffect(() => {
    if (!id || !user?.userId) {
      setStatusLoading(false);
      return;
    }
    const fetchStatusData = async () => {
      setStatusLoading(true);
      try {
        const [txRes, memRes] = await Promise.all([
          fetch(
            `/api/transaction/status?userId=${user.userId}&coopId=${id}`,
          ).then((r) => r.json()),
          fetch(`/api/coop-r-member?userId=${user.userId}&coopId=${id}`).then(
            (r) => r.json(),
          ),
        ]);

        if (txRes.success) setLatestTransaction(txRes.transaction);
        if (memRes.success && memRes.membership.length > 0) {
          setMembership(memRes.membership[0]);
        }
      } catch (e) {
        console.error("Failed to fetch status", e);
      } finally {
        setStatusLoading(false);
      }
    };
    fetchStatusData();
  }, [id, user?.userId, reloadkey]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <p className="text-gray-500">Loading Cooperative Details...</p>
      </div>
    );
  }

  if (!cooperative) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <h2 className="mb-2 text-2xl font-bold text-red-500">
            Cooperative Not Found
          </h2>
          <p className="text-gray-600">
            The requested cooperative could not be found or failed to load.
          </p>
          <button
            onClick={() => router.back()}
            className="inline-flex items-center px-4 py-2 mt-6 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
          >
            <ChevronLeft className="w-5 h-5 mr-2 -ml-1" />
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const handleBuyShare = () => setIsBuyShareModalOpen(true);

  //   const handleEditCooperative = () => {
  //     // TODO: Implement edit cooperative logic
  //     console.log("Editing cooperative...");
  //   };

  const handleViewTransactions = () => {
    // TODO: Implement view transactions logic
    console.log("Viewing transactions...");
  };

  const isCoopAdmin = (userId, coopId) => {
    // TODO: Implement logic to check if the user is admin of the coop
    // console.log(`Checking if user ${userId} is admin of coop ${coopId}`);
    return true; // Change this based on real logic
  };

  const openEditModal = () => {
    // TODO: Implement modal opening logic
    console.log("Opening edit modal...");
    setIsEditModalOpen(true);
  };

  const renderBuyShareAction = () => {
    if (statusLoading) {
      return (
        <button
          disabled
          className="w-full px-6 py-2.5 bg-gray-300 text-gray-500 font-semibold rounded-lg cursor-not-allowed"
        >
          Checking status...
        </button>
      );
    }

    if (membership?.status?.toLowerCase() === "noticegiven") {
      return (
        <button
          disabled
          className="w-full px-6 py-2.5 bg-gray-300 text-gray-500 dark:bg-slate-700 dark:text-gray-400 font-semibold rounded-lg cursor-not-allowed"
        >
          Can't buy more Shares
        </button>
      );
    }

    const activeTransactionStates = ["pending"];

    const isVerificationPending =
      (latestTransaction && activeTransactionStates.includes(latestTransaction.verificationStatus)) ||
      membership?.status === "pending";

    if (isVerificationPending && latestTransaction) {
      return (
        <button
          onClick={() => setIsViewStatusModalOpen(true)}
          className="w-full px-6 py-2.5 bg-blue-100 text-blue-700 dark:bg-slate-700 dark:text-blue-300 font-semibold rounded-lg shadow-sm hover:bg-blue-200 dark:hover:bg-slate-600 transition duration-300 border border-blue-200 dark:border-slate-500"
        >
          View Status
        </button>
      );
    }

    return (
      <button
        onClick={handleBuyShare}
        className="w-full px-6 py-2.5 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 transition duration-300"
      >
        Buy Share
      </button>
    );
  };

  const bannerUrl =
    cooperative.banner ||
    `https://placehold.co/1200x400/EAEAEA/BDBDBD?text=${cooperative.name.replace(
      /\s/g,
      "+",
    )}`;

  return (
    <div className="min-h-screen bg-gray-50">
      {isEditModalOpen && (
        <EditCoopModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          coop={cooperative}
          triggerReload={setReloadKey}
        />
      )}
      {isBuyShareModalOpen && (
        <BuyShareModal
          isOpen={isBuyShareModalOpen}
          onClose={() => {
            setIsBuyShareModalOpen(false);
            setReloadKey((prev) => prev + 1);
          }}
          cooperative={cooperative}
          membership={membership}
        />
      )}
      <div className="mx-auto max-w-7xl">
        <div className="px-4 pt-8 sm:px-6 lg:px-8">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <ChevronLeft className="w-5 h-5 mr-2 -ml-1" />
            Back to List
          </button>
        </div>

        <main className="p-4 sm:p-6 lg:p-8">
          <div className="overflow-hidden bg-white shadow-lg rounded-2xl">
            <div
              className="h-48 bg-center bg-cover md:h-64"
              style={{ backgroundImage: `url(${bannerUrl})` }}
            ></div>

            <div className="px-6 py-4 md:px-8 md:py-6">
              <div className="flex flex-col items-start -mt-16 sm:flex-row sm:items-end sm:space-x-6 sm:-mt-20">
                <img
                  src={cooperative.logo}
                  alt={`${cooperative.name} logo`}
                  className="w-24 h-24 bg-white border-4 border-white rounded-full shadow-md sm:w-32 sm:h-32"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = `https://placehold.co/100x100/CCCCCC/FFFFFF?text=Error`;
                  }}
                />
                <div className="flex-grow mt-4 sm:mt-0">
                  <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl">
                    {cooperative.name}
                  </h1>
                  <div className="flex items-center mt-2 space-x-4 text-gray-500">
                    <div className="flex items-center">
                      <Briefcase className="w-4 h-4 mr-1.5" />
                      <span>{cooperative.sector}</span>
                    </div>
                    <div className="flex items-center">
                      <MapPin className="w-4 h-4 mr-1.5" />
                      <span>
                        {cooperative.state}, {cooperative.country}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="mt-4 sm:mt-0">
                  {user ? (
                    <>
                      {user.role === "superuser" ? (
                        <div className="flex flex-row gap-2">
                          <button
                            onClick={openEditModal}
                            className="w-full px-6 py-2.5 bg-purple-600 text-white font-semibold rounded-lg shadow-md hover:bg-purple-700 transition duration-300"
                          >
                            Edit Cooperative
                          </button>
                          <button
                            onClick={handleViewTransactions}
                            className="w-full px-6 py-2.5 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 transition duration-300"
                          >
                            View Transactions
                          </button>
                        </div>
                      ) : user.role === "coopadmin" ? (
                        isCoopAdmin(user.id, cooperative.id) ? (
                          <button
                            onClick={openEditModal}
                            className="w-full px-6 py-2.5 bg-yellow-600 text-white font-semibold rounded-lg shadow-md hover:bg-yellow-700 transition duration-300"
                          >
                            Edit Cooperative
                          </button>
                        ) : null
                      ) : user.role === "member" ? (
                        renderBuyShareAction()
                      ) : null}
                    </>
                  ) : (
                    <div className="text-center sm:text-left">
                      <button
                        disabled
                        className="w-full px-6 py-2.5 bg-gray-300 text-gray-500 font-semibold rounded-lg cursor-not-allowed"
                      >
                        Login to Buy Share
                      </button>
                      <p className="mt-1 text-xs text-gray-400">
                        You must be logged in to purchase shares.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-8 px-6 py-8 border-t border-gray-200 lg:grid-cols-3 md:px-8">
              <div className="lg:col-span-2">
                <h2 className="mb-4 text-xl font-bold text-gray-800">
                  About the Cooperative
                </h2>
                <p className="leading-relaxed text-gray-600">
                  {cooperative.description}
                </p>
                <HistoryTimeline membership={membership} />
              </div>
              <div className="lg:col-span-1">
                <div className="border bg-gray-50/70 rounded-xl border-gray-200/80">
                  <h3 className="px-4 py-3 text-lg font-semibold text-gray-800 border-b border-gray-200/80">
                    Key Information
                  </h3>
                  <div className="divide-y divide-gray-200/60">
                    <DetailItem
                      icon={DollarSign}
                      label="Share Price"
                      value={`€${cooperative.sharePrice.toLocaleString()}`}
                    />
                    <DetailItem
                      icon={Info}
                      label="Registration Number"
                      value={cooperative.regNumber}
                    />
                    <DetailItem
                      icon={Gavel}
                      label="Court of Registration"
                      value={cooperative.CourtName}
                    />
                    <DetailItem
                      icon={MapPin}
                      label="State"
                      value={cooperative.state}
                    />
                    <DetailItem
                      icon={Globe}
                      label="Country"
                      value={cooperative.country}
                      className="border-b-0"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      {isViewStatusModalOpen && (
        <ViewStatusModal
          isOpen={isViewStatusModalOpen}
          onClose={() => setIsViewStatusModalOpen(false)}
          transaction={latestTransaction}
          cooperative={cooperative}
          triggerReload={setReloadKey}
        />
      )}
    </div>
  );
}
