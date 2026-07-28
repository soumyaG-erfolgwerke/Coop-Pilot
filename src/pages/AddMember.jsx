"use client";
import React, { useState, useEffect } from 'react';
import { ChevronRight, ChevronLeft, CheckCircle, AlertCircle, X, Loader2, Landmark, CreditCard, Search, Check, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { createMember } from '@/lib/addMemberService';
import { jsPDF } from 'jspdf';
import AvvModal from '@/components/avv';
import { isValidIBAN } from 'ibantools';
import { validateIBAN } from '@/lib/ibanService';


// --- InputField Component ---
const InputField = ({ id, label, type = 'text', value, onChange, error, placeholder, required, colSpan = 'sm:col-span-1', children, note, disabled }) => (
  <div className={`${colSpan} animate-fadeInUp group`}>
    <label htmlFor={id} className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    <div className="relative">
      {type === 'select' ? (
        <select
          id={id}
          name={id}
          value={value}
          onChange={onChange}
          disabled={disabled}
          className={`mt-1 block w-full py-2.5 px-3 border ${error ? 'border-red-500' : 'border-gray-300 dark:border-slate-600'} ${disabled ? 'bg-gray-100 dark:bg-slate-800 text-gray-500 cursor-not-allowed' : 'bg-white dark:bg-slate-700'} rounded-md shadow-sm focus:outline-none focus:ring-2 ${error ? 'focus:ring-red-500' : 'focus:ring-primary dark:focus:ring-primary/80'} sm:text-sm transition-all duration-200`}
        >
          {children}
        </select>
      ) : (
        <input
          type={type}
          id={id}
          name={id}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          className={`mt-1 block w-full py-2.5 px-3 border ${error ? 'border-red-500' : 'border-gray-300 dark:border-slate-600'} ${disabled ? 'bg-gray-100 dark:bg-slate-800 text-gray-500 cursor-not-allowed' : 'bg-white dark:bg-slate-700'} rounded-md shadow-sm focus:outline-none focus:ring-2 ${error ? 'focus:ring-red-500' : 'focus:ring-primary dark:focus:ring-primary/80'} sm:text-sm transition-all duration-200`}
        />
      )}
    </div>
    {error && <p className="flex items-center mt-1 text-xs text-red-500"><AlertCircle size={14} className="mr-1" />{error}</p>}
    {note && !error && <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{note}</p>}
  </div>
);

// --- StepIndicator Component ---
const StepIndicator = ({ currentStep, totalSteps }) => (
  <div className="flex items-center justify-center mb-8 space-x-2 sm:space-x-4">
    {[...Array(totalSteps)].map((_, i) => {
      const stepNumber = i + 1;
      const isActive = stepNumber === currentStep;
      const isCompleted = stepNumber < currentStep;
      return (
        <React.Fragment key={stepNumber}>
          <div className="flex flex-col items-center">
            <div
              className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-semibold text-sm sm:text-base transition-all duration-300
                ${isActive ? 'bg-blue-600 text-white scale-110 shadow-lg' : isCompleted ? 'bg-green-500 text-white' : 'bg-gray-200 dark:bg-slate-700 text-gray-600 dark:text-gray-300'}`}
            >
              {isCompleted ? <CheckCircle size={18} /> : stepNumber}
            </div>
            <span className={`mt-2 text-xs sm:text-sm font-medium ${isActive ? 'text-blue-600 dark:text-primary/80' : 'text-gray-500 dark:text-gray-400'}`}>
              STEP {stepNumber}
            </span>
          </div>
          {stepNumber < totalSteps && (
            <div className={`flex-1 h-1 rounded-full mt-[-1.25rem] sm:mt-[-1.5rem] transition-colors duration-300 ${isCompleted ? 'bg-green-500' : 'bg-gray-200 dark:bg-slate-700'}`}></div>
          )}
        </React.Fragment>
      );
    })}
  </div>
);

// --- PersonalDataStep Component ---
const PersonalDataStep = ({ formData, handleChange, errors, handleIbanBlur, ibanLoading, manualBankDetails }) => {
  const days = Array.from({ length: 31 }, (_, i) => i + 1);
  const months = Array.from({ length: 12 }, (_, i) => i + 1);
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 100 }, (_, i) => currentYear - 18 - i);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Personal Data</h2>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          Please enter your personal information here. Your information will be forwarded to Member Services for your membership application.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
        <InputField id="salutation" label="Salutation" type="select" value={formData.salutation} onChange={handleChange} error={errors.salutation} required>
          <option value="">Select...</option>
          <option value="Mr.">Mister</option>
          <option value="Mrs.">Mrs.</option>
          <option value="Ms.">Ms.</option>
          <option value="Diverse">Diverse</option>
        </InputField>
        <InputField id="title" label="Title" value={formData.title} onChange={handleChange} error={errors.title} placeholder="e.g. Dr." />
        <InputField id="firstName" label="First Name" value={formData.firstName} onChange={handleChange} error={errors.firstName} required placeholder="Wolf" />
        <InputField id="lastName" label="Last Name" value={formData.lastName} onChange={handleChange} error={errors.lastName} required placeholder="Mustermann" />
        <InputField id="street" label="Street" value={formData.street} onChange={handleChange} error={errors.street} required placeholder="Knesheckerstrasse" colSpan="sm:col-span-1" />
        <div className="grid grid-cols-2 gap-x-4">
          <InputField id="houseNumber" label="House Number" value={formData.houseNumber} onChange={handleChange} error={errors.houseNumber} required placeholder="62" />
          <InputField id="noAddition" label="No. Addition" value={formData.noAddition} onChange={handleChange} error={errors.noAddition} placeholder="e.g. Apt B" />
        </div>
        <InputField id="postalCode" label="Postal Code" value={formData.postalCode} onChange={handleChange} error={errors.postalCode} required placeholder="01965" />
        <InputField id="location" label="Location" value={formData.location} onChange={handleChange} error={errors.location} required placeholder="Dresden" />
      </div>

      <InputField id="taxId" label="Tax Identification Number" value={formData.taxId} onChange={handleChange} error={errors.taxId} placeholder="12345678910" note="Can be submitted later." />

      <div>
        <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">Birth Date {<span className="text-red-500">*</span>}</label>
        <div className="grid grid-cols-3 gap-x-4">
          <InputField id="birthDay" label="" type="select" value={formData.birthDay} onChange={handleChange} error={errors.birthDay} required>
            <option value="">Day</option>
            {days.map(d => <option key={d} value={d}>{d}</option>)}
          </InputField>
          <InputField id="birthMonth" label="" type="select" value={formData.birthMonth} onChange={handleChange} error={errors.birthMonth} required>
            <option value="">Month</option>
            {months.map(m => <option key={m} value={m}>{m}</option>)}
          </InputField>
          <InputField id="birthYear" label="" type="select" value={formData.birthYear} onChange={handleChange} error={errors.birthYear} required>
            <option value="">Year</option>
            {years.map(y => <option key={y} value={y}>{y}</option>)}
          </InputField>
        </div>
        {errors.birthDate && <p className="flex items-center mt-1 text-xs text-red-500"><AlertCircle size={14} className="mr-1" />{errors.birthDate}</p>}
      </div>

      <div className="pt-4 border-t border-gray-200 dark:border-slate-700">
        <p className="mb-3 text-sm text-gray-600 dark:text-gray-400">
          For questions regarding your membership request and to contact us during your membership:
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
          <InputField id="email" label="E-Mail" type="email" value={formData.email} onChange={handleChange} error={errors.email} required placeholder="m.kwolf@gmail.com" />
          <InputField id="repeatEmail" label="Repeat E-Mail" type="email" value={formData.repeatEmail} onChange={handleChange} error={errors.repeatEmail} required placeholder="m.kwolf@gmail.com" />
          <InputField id="telephone" label="Telephone Number" type="tel" value={formData.telephone} onChange={handleChange} error={errors.telephone} placeholder="017656789875" />
        </div>
      </div>

      <div className="pt-4 border-t border-gray-200 dark:border-slate-700">
        <InputField id="howDidYouHear" label="Where did you hear about us?" type="select" value={formData.howDidYouHear} onChange={handleChange} error={errors.howDidYouHear} required colSpan="sm:col-span-2">
          <option value="">Select an option...</option>
          <option value="SCM">Social Media (Facebook, Instagram, etc.)</option>
          <option value="FAF">Friend or Family Member</option>
          <option value="NAR">News Article or Blog</option>
          <option value="ONS">Online Search (Google, etc.)</option>
          <option value="EVT">Event or Conference</option>
          <option value="OTH">Other</option>
        </InputField>
      </div>
    </div>
  );
};

// --- BankAccountStep Component ---
const BankAccountStep = ({ formData, handleChange, errors }) => {
  const [loadingBankData, setLoadingBankData] = useState(false);
  const [lookupError, setLookupError] = useState("");
  const [manualEntryNotice, setManualEntryNotice] = useState("");
  const [allowManualEntry, setAllowManualEntry] = useState(false);
  const [showBankDetails, setShowBankDetails] = useState(!!formData.bic && !!formData.iban);
  const [ibanValidated, setIbanValidated] = useState(!!formData.bic && !!formData.iban);

  const handleIbanChange = (e) => {
    setAllowManualEntry(false);
    const value = e.target.value.replace(/\s+/g, "").toUpperCase();

    // Update IBAN in form
    handleChange({ target: { name: "iban", value } });

    // Reset states immediately so old data fields are hidden
    setLookupError("");
    setManualEntryNotice("");
    setIbanValidated(false);
    setShowBankDetails(false);

    // Clear old bank data from form so it isn't accidentally submitted
    if (formData.bic || formData.bankName || formData.bankCity) {
      handleChange({ target: { name: "bic", value: "" } });
      handleChange({ target: { name: "bankName", value: "" } });
      handleChange({ target: { name: "bankCity", value: "" } });
    }
  };

  const verifyIban = async () => {
    setLookupError("");
    setManualEntryNotice("");
    setIbanValidated(false);
    setShowBankDetails(false);

    const iban = formData.iban?.replace(/\s+/g, "");

    if (!iban) {
      setLookupError("Please enter an IBAN first.");
      return;
    }

    const validIBAN = isValidIBAN(iban);

    if (!validIBAN) {
      setLookupError("Invalid IBAN format detected.");
      return;
    }

    try {
      setLoadingBankData(true);

      const data = await validateIBAN(iban);

      if (!data.valid) {
        setLookupError("IBAN validation failed against the registry.");
        return;
      }

      const bankData = data.bankData || {};
      const hasFullBankData = Boolean(
        bankData.bic && bankData.name && bankData.city,
      );

      // Auto-fill bank details in the parent state
      handleChange({
        target: { name: "bic", value: bankData.bic || "" },
      });
      handleChange({
        target: { name: "bankName", value: bankData.name || "" },
      });
      handleChange({
        target: { name: "bankCity", value: bankData.city || "" },
      });

      setIbanValidated(true);
      setShowBankDetails(true);

      if (!hasFullBankData) {
        setAllowManualEntry(true);
        setManualEntryNotice(
          "IBAN validated, but bank details were not returned. Please enter bank name, BIC, and registered city.",
        );
      }
    } catch (error) {
      console.error(error);
      setLookupError(
        "Registry lookup failed. Please enter bank details manually.",
      );

      setAllowManualEntry(true);
      setShowBankDetails(true);
    } finally {
      setLoadingBankData(false);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div>
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
          Bank Account Details
        </h2>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          Claims from the cooperative (e.g. dividends, payments) must be transferred to the following account:
        </p>
      </div>

      <div className="space-y-6">
        {/* Account Holder Name */}
        <div className="p-6 bg-slate-50/50 dark:bg-slate-800/30 border border-gray-200 dark:border-slate-700 rounded-2xl animate-fadeInUp">
          <InputField
            id="accountHolder"
            label="Account Holder Name"
            value={formData.accountHolder || ""}
            onChange={handleChange}
            error={errors.accountHolder}
            required
            placeholder="Wolf Mustermann"
            colSpan="sm:col-span-2"
          />
        </div>

        {/* IBAN INPUT + BUTTON */}
        <div className="p-6 bg-slate-50/50 dark:bg-slate-800/30 border border-gray-200 dark:border-slate-700 rounded-2xl animate-fadeInUp">
          <label
            htmlFor="iban"
            className="block mb-2 text-xs font-bold tracking-widest uppercase text-slate-700 dark:text-slate-300"
          >
            International Bank Account Number (IBAN){" "}
            <span className="text-rose-500">*</span>
          </label>

          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                <CreditCard size={18} className="text-slate-400" />
              </div>
              <input
                type="text"
                id="iban"
                name="iban"
                value={formData.iban || ""}
                onChange={handleIbanChange}
                placeholder="DE89 3704 0044 0532 0130 00"
                className={`w-full h-12 pl-11 pr-4 bg-white dark:bg-slate-700 border rounded-xl text-sm font-medium transition-all focus:outline-none focus:ring-2 dark:text-white uppercase ${errors.iban || lookupError
                  ? "border-rose-300 focus:ring-rose-500/50 focus:border-rose-500 dark:border-rose-700"
                  : ibanValidated
                    ? "border-emerald-300 focus:ring-emerald-500/50 focus:border-emerald-500 dark:border-emerald-700"
                    : "border-gray-200 dark:border-slate-600 focus:ring-blue-500/50 focus:border-blue-500"
                  }`}
              />
            </div>

            <button
              type="button"
              onClick={verifyIban}
              disabled={loadingBankData || !String(formData.iban || "").trim()}
              className="flex items-center justify-center h-12 gap-2 px-6 text-sm font-bold text-white transition-all bg-blue-600 shadow-sm hover:bg-blue-700 rounded-xl shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
            >
              {loadingBankData ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Verifying
                </>
              ) : ibanValidated ? (
                <>
                  <Check className="w-4 h-4" /> Verified
                </>
              ) : (
                <>
                  <Search className="w-4 h-4" /> Proceed
                </>
              )}
            </button>
          </div>

          <div className="mt-1 flex flex-col gap-1.5">
            {!formData.iban &&
              !lookupError &&
              !ibanValidated &&
              !loadingBankData && (
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  Please enter the correct IBAN.
                </p>
              )}

            {(errors.iban || lookupError) && (
              <p className="text-xs font-bold text-rose-500 flex items-center gap-1.5 animate-fadeIn">
                <AlertCircle className="w-3.5 h-3.5" />{" "}
                {errors.iban || lookupError}
              </p>
            )}

            {ibanValidated && (
              <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 animate-fadeIn">
                <CheckCircle2 className="w-3.5 h-3.5" /> IBAN validated
                successfully.
                {!allowManualEntry && " Bank details auto-filled."}
              </p>
            )}

            {manualEntryNotice && (
              <p className="text-xs font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1.5 animate-fadeIn">
                <AlertCircle className="w-3.5 h-3.5" /> {manualEntryNotice}
              </p>
            )}
          </div>
        </div>

        {/* STRICTLY AUTO-FILLED FIELDS */}
        {showBankDetails && (
          <div className="space-y-6 animate-fadeIn">
            <div className="grid grid-cols-1 gap-5 p-6 bg-slate-50/50 dark:bg-slate-800/30 border border-gray-200 dark:border-slate-700 sm:grid-cols-2 rounded-2xl animate-fadeInUp">
              {/* Bank Name */}
              <div className="sm:col-span-2">
                <label className="block mb-2 text-xs font-bold tracking-widest uppercase text-slate-700 dark:text-slate-300">
                  Bank Name
                </label>
                <input
                  type="text"
                  value={formData.bankName || ""}
                  onChange={(e) =>
                    handleChange({
                      target: {
                        name: "bankName",
                        value: e.target.value,
                      },
                    })
                  }
                  readOnly={!allowManualEntry}
                  className={`w-full px-4 py-3 bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl text-sm font-medium text-gray-800 dark:text-slate-200 ${!allowManualEntry ? "cursor-not-allowed bg-gray-100 dark:bg-slate-800 text-gray-500" : ""} focus:outline-none`}
                />
                {errors.bankName && (
                  <p className="mt-2 text-[11px] font-bold text-rose-500">
                    {errors.bankName}
                  </p>
                )}
              </div>

              {/* BIC */}
              <div>
                <label className="block mb-2 text-xs font-bold tracking-widest uppercase text-slate-700 dark:text-slate-300">
                  BIC
                </label>
                <input
                  type="text"
                  value={formData.bic || ""}
                  onChange={(e) =>
                    handleChange({
                      target: {
                        name: "bic",
                        value: e.target.value,
                      },
                    })
                  }
                  readOnly={!allowManualEntry}
                  className={`w-full px-4 py-3 bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl text-sm font-medium text-gray-800 dark:text-slate-200 ${!allowManualEntry ? "cursor-not-allowed bg-gray-100 dark:bg-slate-800 text-gray-500" : ""} focus:outline-none uppercase`}
                />
                {errors.bic && (
                  <p className="mt-2 text-[11px] font-bold text-rose-500">
                    {errors.bic}
                  </p>
                )}
              </div>

              {/* Registered City */}
              {(formData.bankCity || allowManualEntry) && (
                <div>
                  <label className="block mb-2 text-xs font-bold tracking-widest uppercase text-slate-700 dark:text-slate-300">
                    Registered City
                  </label>

                  <input
                    type="text"
                    value={formData.bankCity || ""}
                    readOnly={!allowManualEntry}
                    onChange={(e) =>
                      handleChange({
                        target: {
                          name: "bankCity",
                          value: e.target.value,
                        },
                      })
                    }
                    className={`w-full px-4 py-3 bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl text-sm font-medium text-gray-800 dark:text-slate-200 focus:outline-none ${!allowManualEntry ? "cursor-not-allowed bg-gray-100 dark:bg-slate-800 text-gray-500" : ""
                      }`}
                  />
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// --- StepTwo Component ---
const StepTwo = ({ formData, handleChange, errors }) => (
  <div className="space-y-6 animate-fadeIn">
    <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Investment Experience</h2>
    <p className="text-gray-600 dark:text-gray-400">Please provide some details about your investment background.</p>

    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        Do you have prior experience investing in a cooperative? {<span className="text-red-500">*</span>}
      </label>
      <div className="flex flex-col mt-2 space-y-2 sm:flex-row sm:space-x-4 sm:space-y-0">
        <label className={`flex items-center p-3 w-full border rounded-md cursor-pointer transition-all duration-200 ${formData.investedBefore === 'Yes' ? 'bg-blue-50 dark:bg-primary-dark-900/50 border-primary ring-2 ring-primary' : 'bg-white dark:bg-slate-700 border-gray-300 dark:border-slate-600'}`}>
          <input
            type="radio"
            name="investedBefore"
            value="Yes"
            checked={formData.investedBefore === 'Yes'}
            onChange={handleChange}
            className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-primary"
          />
          <span className="ml-3 text-sm font-medium text-gray-800 dark:text-gray-200">Yes</span>
        </label>
        <label className={`flex items-center p-3 w-full border rounded-md cursor-pointer transition-all duration-200 ${formData.investedBefore === 'No' ? 'bg-blue-50 dark:bg-primary-dark-900/50 border-primary ring-2 ring-primary' : 'bg-white dark:bg-slate-700 border-gray-300 dark:border-slate-600'}`}>
          <input
            type="radio"
            name="investedBefore"
            value="No"
            checked={formData.investedBefore === 'No'}
            onChange={handleChange}
            className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-primary"
          />
          <span className="ml-3 text-sm font-medium text-gray-800 dark:text-gray-200">No</span>
        </label>
      </div>
      {errors.investedBefore && <p className="flex items-center mt-1 text-xs text-red-500"><AlertCircle size={14} className="mr-1" />{errors.investedBefore}</p>}
    </div>
  </div>
);

const DOCUMENT_TYPES = [
  { value: 'Personalausweis', label: 'Personalausweis' },
  { value: 'Reisepass', label: 'Reisepass' },
  { value: 'Aufenthaltstitel', label: 'Aufenthaltstitel' },
];

// --- StepThree Component (Confirmation & Declaration) ---
const StepThree = ({ formData, handleChange, errors, openAvvModal }) => (
  <div className="space-y-6 animate-fadeIn">
    <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Confirmation & Declaration</h2>
    <p className="text-gray-600 dark:text-gray-400">Please set your account password, make the final declarations, and submit your application.</p>
    <div className="pt-4 border-t border-gray-200 dark:border-slate-700">
      <p className="mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
        Set Your Account Password {<span className="text-red-500">*</span>}
      </p>
      <ul className="mb-3 text-xs text-gray-500 list-disc list-inside dark:text-gray-400">
        <li>Minimum 8 characters</li>
        <li>At least one uppercase letter (A-Z)</li>
        <li>At least one lowercase letter (a-z)</li>
        <li>At least one number (0-9)</li>
        <li>At least one special character (e.g., !@#$%^&*)</li>
      </ul>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
        <InputField
          id="password"
          label="Password"
          type="password"
          value={formData.password}
          onChange={handleChange}
          error={errors.password}
          required
          placeholder="••••••••"
        />
        <InputField
          id="confirmPassword"
          label="Confirm Password"
          type="password"
          value={formData.confirmPassword}
          onChange={handleChange}
          error={errors.confirmPassword}
          required
          placeholder="••••••••"
        />
      </div>
    </div>

    <div className="p-3.5 border border-gray-200 dark:border-slate-700 rounded-lg bg-gray-50/50 dark:bg-slate-800/30 text-sm text-gray-600 dark:text-gray-400 leading-relaxed animate-fadeInUp">
      Easycoop partners with <span className="font-semibold text-gray-800 dark:text-slate-200">Stripe</span> for secure payment processing. Please review the and our internal guidelines before continuing.
    </div>

    <div className="flex items-start pt-6 mt-6 border-t border-gray-200 dark:border-slate-700">
      <input
        id="declaration"
        name="declaration"
        type="checkbox"
        checked={formData.declaration}
        readOnly
        onClick={(e) => { e.preventDefault(); openAvvModal(); }}
        className="h-5 w-5 text-blue-600 border-gray-300 dark:border-slate-500 rounded focus:ring-primary mt-0.5 cursor-pointer"
      />
      <div className="ml-3 text-sm">
        <label htmlFor="declaration" className="font-medium text-gray-700 dark:text-gray-300">
          I have read and accept the <span className="text-blue-600 cursor-pointer hover:underline" onClick={openAvvModal}>AVV (Privacy Policies and Terms)</span> and the <a
        href="https://stripe.com/legal/ssa"
        target="_blank"
        rel="noopener noreferrer"
        className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
      >
        Stripe Services Agreement
      </a>. {<span className="text-red-500">*</span>}
        </label>
        {errors.declaration && <p className="mt-1 text-xs text-red-500">{errors.declaration}</p>}
      </div>
    </div>
  </div>
);

// --- AddMember Component (Main Logic) ---
const AddMember = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 4;
  const [formData, setFormData] = useState({
    salutation: '', title: '', firstName: '', lastName: '',
    street: '', houseNumber: '', noAddition: '', postalCode: '', location: '',
    accountHolder: '', iban: '', bic: '', bankName: '', bankCity: '', taxId: '',
    birthDay: '', birthMonth: '', birthYear: '',
    email: '', repeatEmail: '', telephone: '',
    howDidYouHear: '',
    investedBefore: '',
    password: '',
    confirmPassword: '',
    declaration: false,
    avvFile: null,
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionStatus, setSubmissionStatus] = useState(null);
  const [isAvvModalOpen, setIsAvvModalOpen] = useState(false);

  const handleAvvAccept = (avvDetails) => {
    // Generate PDF
    const doc = new jsPDF();
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text("Allgemeine Geschäftsbedingungen (AVV)", 20, 20);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(12);

    const textOptions = { maxWidth: 170, align: "left" };
    let y = 30;

    const terms = [
      { title: "1. Geltungsbereich", text: "Diese Allgemeinen Vertragsbedingungen (AVV) gelten für alle Mitgliedschaften und die damit verbundenen Rechte und Pflichten innerhalb der Genossenschaft." },
      { title: "2. Mitgliedschaft", text: "Die Mitgliedschaft bedarf der Unterzeichnung dieser Erklärung und der Bestätigung durch den Vorstand. Jedes Mitglied verpflichtet sich, die Satzung der Genossenschaft anzuerkennen und danach zu handeln." },
      { title: "3. Datenschutz", text: "Wir verarbeiten Ihre personenbezogenen Daten im Einklang mit den geltenden Datenschutzgesetzen (DSGVO). Ihre Daten werden ausschließlich für Zwecke der Mitgliederverwaltung verwendet." },
      { title: "4. Haftung", text: "Die Genossenschaft haftet nur bei Vorsatz oder grober Fahrlässigkeit. Eine weitergehende Haftung ist ausgeschlossen." }
    ];

    terms.forEach((term) => {
      doc.setFont("helvetica", "bold");
      doc.text(term.title, 20, y);
      y += 8;

      doc.setFont("helvetica", "normal");
      const textLines = doc.splitTextToSize(term.text, textOptions.maxWidth);
      doc.text(textLines, 20, y);
      y += (textLines.length * 7) + 5; // Adjust vertical spacing based on number of lines
    });

    y += 10;
    doc.setFont("helvetica", "bold");
    doc.text("Confirmation Details:", 20, y);
    doc.setFont("helvetica", "normal");
    y += 10;

    doc.text(`Name: ${avvDetails.name}`, 20, y);
    y += 8;
    doc.text(`Place: ${avvDetails.place}`, 20, y);
    y += 8;
    doc.text(`Date & Time: ${avvDetails.date}`, 20, y);

    // Output Blob
    const pdfBlob = doc.output('blob');
    const pdfFile = new File([pdfBlob], `AVV_${avvDetails.name.replace(/\s+/g, '_')}.pdf`, { type: 'application/pdf' });

    setFormData(prev => ({ ...prev, declaration: true, avvFile: pdfFile }));
    setIsAvvModalOpen(false);

    // Clear declaration error
    if (errors.declaration) {
      setErrors(prev => ({ ...prev, declaration: '' }));
    }
  };

  const handleChange = (e) => {
    let { name, value, type, checked } = e.target;
    if (name === 'telephone') {
      value = value.replace(/[^0-9\s\-()+]/g, "");
    }
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    // Clear error for the field being changed
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
    // If email changes, and repeatEmail had an error due to mismatch, clear it if they now match
    if (name === 'email' && errors.repeatEmail && value === formData.repeatEmail) {
      setErrors(prev => ({ ...prev, repeatEmail: '' }));
    }
    // If repeatEmail changes, and it had an error due to mismatch, clear it if they now match
    if (name === 'repeatEmail' && errors.repeatEmail && value === formData.email) {
      setErrors(prev => ({ ...prev, repeatEmail: '' }));
    }
    // If password changes, and confirmPassword had an error due to mismatch, clear it if they now match
    if (name === 'password' && errors.confirmPassword && value === formData.confirmPassword) {
      setErrors(prev => ({ ...prev, confirmPassword: '' }));
    }
    // If confirmPassword changes, and it had an error due to mismatch, clear it if they now match
    if (name === 'confirmPassword' && errors.confirmPassword && value === formData.password) {
      setErrors(prev => ({ ...prev, confirmPassword: '' }));
    }
  };


  // Validation for Step 1
  const validateStep1 = () => {
    const newErrors = {};
    if (!formData.salutation) newErrors.salutation = 'Salutation is required.';
    if (formData.title && formData.title.trim().length > 15) {
      newErrors.title = 'Title must be 15 characters or less.';
    }
    if (!formData.firstName.trim()) newErrors.firstName = 'First name is required.';
    if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required.';
    if (!formData.street.trim()) newErrors.street = 'Street is required.';
    if (!formData.houseNumber.trim()) newErrors.houseNumber = 'House number is required.';
    if (!formData.postalCode.trim()) newErrors.postalCode = 'Postal code is required.';
    if (formData.postalCode.trim() && formData.postalCode.trim().length !== 5) {
      newErrors.postalCode = 'Postal code must be 5 digits.';
    }
    if (!formData.location.trim()) newErrors.location = 'Location is required.';
    if (!formData.birthDay || !formData.birthMonth || !formData.birthYear) newErrors.birthDate = 'Complete birth date is required.';

    if (!formData.email.trim()) newErrors.email = 'Email is required.';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Invalid email format.';

    if (!formData.repeatEmail.trim()) newErrors.repeatEmail = 'Please repeat your email.';
    else if (formData.email.trim() !== formData.repeatEmail.trim()) newErrors.repeatEmail = 'Emails do not match.';

    if (formData.telephone && formData.telephone.trim()) {
      const cleanedPhone = formData.telephone.replace(/[\s\-\(\)\+]+/g, "");
      if (!/^\d{6,15}$/.test(cleanedPhone)) {
        newErrors.telephone = "Phone number must contain 6-15 digits.";
      }
    }

    if (!formData.howDidYouHear) newErrors.howDidYouHear = 'Please select an option.';

    setErrors(prevErrors => ({ ...prevErrors, ...newErrors }));
    return Object.keys(newErrors).length === 0;
  };

  // Validation for Step 2 (Bank Account Details)
  const validateStep2 = () => {
    const newErrors = {};
    if (!formData.accountHolder?.trim()) newErrors.accountHolder = 'Account holder is required.';
    if (!formData.iban?.trim()) {
      newErrors.iban = 'IBAN is required.';
    } else if (!isValidIBAN(formData.iban.replace(/\s+/g, "").toUpperCase())) {
      newErrors.iban = "Invalid IBAN";
    }
    if (!formData.bic?.trim()) newErrors.bic = 'BIC is required.';
    if (!formData.bankName?.trim()) newErrors.bankName = 'Bank Name is required.';

    setErrors(prevErrors => ({ ...prevErrors, ...newErrors }));
    return Object.keys(newErrors).length === 0;
  };

  // Validation for Step 3
  const validateStep3 = () => {
    const newErrors = {};
    if (!formData.investedBefore) newErrors.investedBefore = 'Please select an answer.';
    setErrors(prevErrors => ({ ...prevErrors, ...newErrors }));
    return Object.keys(newErrors).length === 0;
  };

  // Validation for Step 4 (Confirmation, Password, Declaration)
  const validateStep4 = () => {
    const newErrors = {};
    const password = formData.password;
    if (!password) {
      newErrors.password = 'Password is required.';
    } else {
      if (password.length < 8) newErrors.password = 'Password must be at least 8 characters. ';
      if (!/[a-z]/.test(password)) newErrors.password = (newErrors.password || '') + 'Include a lowercase letter. ';
      if (!/[A-Z]/.test(password)) newErrors.password = (newErrors.password || '') + 'Include an uppercase letter. ';
      if (!/\d/.test(password)) newErrors.password = (newErrors.password || '') + 'Include a number. ';
      if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) newErrors.password = (newErrors.password || '') + 'Include a special character. ';

      if (newErrors.password) newErrors.password = newErrors.password.trim(); // Trim trailing space
    }

    if (!formData.confirmPassword) newErrors.confirmPassword = 'Please confirm your password.';
    else if (password !== formData.confirmPassword) newErrors.confirmPassword = 'Passwords do not match.';

    if (!formData.declaration) newErrors.declaration = 'You must agree to the declaration.';

    setErrors(prevErrors => ({ ...prevErrors, ...newErrors }));
    return Object.keys(newErrors).length === 0;
  };

  const validateCurrentStep = () => {
    if (currentStep === 1) return validateStep1();
    if (currentStep === 2) return validateStep2();
    if (currentStep === 3) return validateStep3();
    if (currentStep === 4) return validateStep4();
    return true;
  };

  const nextStep = () => {
    // Clear previous errors for the current step before validating again
    let errorsToClear = {};
    if (currentStep === 1) errorsToClear = { salutation: '', firstName: '', lastName: '', street: '', houseNumber: '', postalCode: '', location: '', birthDate: '', email: '', repeatEmail: '', howDidYouHear: '' };
    if (currentStep === 2) errorsToClear = { accountHolder: '', iban: '', bic: '', bankName: '' };
    if (currentStep === 3) errorsToClear = { investedBefore: '' };
    if (currentStep === 4) errorsToClear = { password: '', confirmPassword: '', declaration: '' };
    setErrors(prev => ({ ...prev, ...errorsToClear }));

    if (validateCurrentStep()) {
      if (currentStep < totalSteps) setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setErrors({}); // Clear all previous errors before final validation

    // Perform all validations again before submission
    const isStep1Valid = validateStep1();
    const isStep2Valid = validateStep2();
    const isStep3Valid = validateStep3();
    const isStep4Valid = validateStep4();

    // Explicit final check for email match, as it's crucial
    if (formData.email.trim() !== formData.repeatEmail.trim()) {
      setErrors(prev => ({ ...prev, repeatEmail: 'Emails do not match.', email: 'Emails do not match.' }));
      setCurrentStep(1); // Navigate to where email fields are
      setIsSubmitting(false);
      return;
    }

    if (!isStep1Valid || !isStep2Valid || !isStep3Valid || !isStep4Valid) {
      // Determine which step has the first error and navigate to it
      if (!isStep1Valid) setCurrentStep(1);
      else if (!isStep2Valid) setCurrentStep(2);
      else if (!isStep3Valid) setCurrentStep(3);
      else if (!isStep4Valid) setCurrentStep(4);

      setErrors(prev => ({ ...prev, form: "Please complete all required fields correctly." }));
      setIsSubmitting(false);
      return;
    }

    setIsSubmitting(true);
    setSubmissionStatus(null);

    //Start uploading data
    try {
      // Create user and add profile data and upload document file.
      const result = await createMember(formData);

      if (!result.success) {
        const message = result?.error?.message || "Member creation failed";

        const newErrors = {};
        //error catching
        if (message.toLowerCase().includes("email")) {
          newErrors.email = message;
          setCurrentStep(1);
        } else if (message.toLowerCase().includes("password")) {
          newErrors.password = message;
          setCurrentStep(4);
        } else if (message.toLocaleLowerCase().includes("file")) {
          newErrors.documentFile = message;
          setCurrentStep(4);
        } else {
          newErrors.form = message;
        }

        toast.error(message);
        setErrors(prev => ({ ...prev, ...newErrors }));
        setSubmissionStatus("error");
        return;
      }

      setSubmissionStatus("success");
      toast.success("Application submitted successfully!");

      if (formData.avvFile) {
        const url = URL.createObjectURL(formData.avvFile);
        const link = document.createElement('a');
        link.href = url;
        link.download = formData.avvFile.name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      }

    } catch (error) {
      console.error("Submission Error:", error);

      toast.error("Something went wrong. Please try again.");
      setSubmissionStatus("error");

    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [currentStep]);

  if (submissionStatus === 'success') {
    return (
      <div className="max-w-2xl p-6 mx-auto my-10 mt-40 text-center bg-white shadow-2xl sm:p-8 dark:bg-slate-800 rounded-xl animate-fadeIn">
        <CheckCircle size={64} className="mx-auto mb-4 text-green-500" />
        <h2 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white">Application Submitted!</h2>
        <p className="mb-6 text-gray-600 dark:text-gray-400">Thank you for applying to become a member.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 py-8 bg-gray-100 dark:bg-slate-900 sm:py-12 font-inter">
      <div className="max-w-3xl mx-auto mt-20">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Become a Member</h1>
        </div>

        <StepIndicator currentStep={currentStep} totalSteps={totalSteps} />

        <form onSubmit={currentStep === 4 ? handleSubmit : (e) => { e.preventDefault(); nextStep(); }} className="p-6 bg-white shadow-2xl dark:bg-slate-800 sm:p-10 rounded-xl">
          {currentStep === 1 && <PersonalDataStep formData={formData} handleChange={handleChange} errors={errors} />}
          {currentStep === 2 && <BankAccountStep formData={formData} handleChange={handleChange} errors={errors} />}
          {currentStep === 3 && <StepTwo formData={formData} handleChange={handleChange} errors={errors} />}
          {currentStep === 4 && <StepThree formData={formData} handleChange={handleChange} errors={errors} openAvvModal={() => setIsAvvModalOpen(true)} />}

          {errors.form && <p className="flex items-center justify-center mt-4 text-sm text-center text-red-500"><AlertCircle size={14} className="mr-2" />{errors.form}</p>}
          {submissionStatus === 'error' && !errors.form && <p className="mt-4 text-sm text-center text-red-500">Submission failed. Please check your details and try again.</p>}

          <div className="flex items-center justify-between mt-10">
            <button
              type="button"
              onClick={prevStep}
              disabled={currentStep === 1 || isSubmitting}
              className="px-6 py-2.5 border border-gray-300 dark:border-slate-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-slate-700 hover:bg-gray-50 dark:hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center group"
            >
              <ChevronLeft size={18} className="mr-1.5 transition-transform duration-200 group-hover:-translate-x-1" /> Back
            </button>
            {currentStep < totalSteps ? (
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  nextStep()
                }}
                disabled={isSubmitting}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center group"
              >
                Further <ChevronRight size={18} className="ml-1.5 transition-transform duration-200 group-hover:translate-x-1" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={isSubmitting || !formData.declaration}
                className="px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center group"
              >
                {isSubmitting ? (
                  <>
                    <svg className="w-5 h-5 mr-3 -ml-1 text-white animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Submitting...
                  </>
                ) : (
                  <>Submit Application <CheckCircle size={18} className="ml-1.5 transition-transform duration-200 group-hover:scale-110" /></>
                )}
              </button>
            )}
          </div>
        </form>
        <div className="mt-8 space-x-4 text-xs text-center text-gray-500 dark:text-gray-400">
          <a href="#" className="hover:underline">Imprint</a>
          <a href="#" className="hover:underline">Privacy Policy</a>
          <a href="#" className="hover:underline">Privacy Policy WirMachen Energie eG</a>
        </div>
      </div>
      <AvvModal isOpen={isAvvModalOpen} onClose={() => setIsAvvModalOpen(false)} onAccept={handleAvvAccept} />
    </div>
  );
};

export default AddMember;