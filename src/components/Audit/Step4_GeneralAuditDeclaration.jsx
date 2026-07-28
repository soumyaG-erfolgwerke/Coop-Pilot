"use client";
import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { FileUploader } from "./AuditUi";

// --- Mock UI Components ---
// These components are defined here to make this file self-contained and runnable.
// In a real app, they would be imported from a UI library or separate files.

const Card = ({ children, className }) => (
  <div className={`bg-white shadow-md rounded-lg p-6 mb-6 ${className || ""}`}>
    {children}
  </div>
);

const Input = ({
  label,
  placeholder,
  type = "text",
  value,
  onChange,
  name,
  className,
}) => (
  <div className="mb-4">
    {label && (
      <label className="block mb-2 text-sm font-bold text-black">{label}</label>
    )}
    <input
      type={type}
      placeholder={placeholder}
      value={value || ""}
      onChange={onChange}
      name={name}
      className={`shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline ${
        className || ""
      }`}
    />
  </div>
);

const Textarea = ({ label, placeholder, value, onChange, name }) => (
  <div className="mb-4">
    {label && (
      <label className="block mb-2 text-sm font-bold text-black">{label}</label>
    )}
    <textarea
      placeholder={placeholder}
      value={value || ""}
      onChange={onChange}
      name={name}
      className="w-full h-24 px-3 py-2 leading-tight text-gray-700 border rounded shadow appearance-none focus:outline-none focus:shadow-outline"
    ></textarea>
  </div>
);

const RadioGroup = ({
  label,
  name,
  options,
  value,
  onChange,
  isSubLabel = false,
}) => (
  <div className="mb-4">
    <label
      className={`block text-black ${
        isSubLabel ? "text-sm mb-2" : "text-sm font-bold mb-2"
      }`}
    >
      {label}
    </label>
    <div className="flex items-center space-x-4">
      {options.map((option) => (
        <label key={option.value} className="inline-flex items-center">
          <input
            type="radio"
            className="form-radio"
            name={name}
            value={option.value}
            checked={value === option.value}
            onChange={onChange}
          />
          <span className="ml-2 text-black">{option.label}</span>
        </label>
      ))}
    </div>
  </div>
);

const Button = ({
  children,
  onClick,
  type = "button",
  primary = false,
  className,
}) => (
  <button
    type={type}
    onClick={onClick}
    className={`font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline ${
      primary
        ? "bg-primary hover:bg-blue-700 text-white"
        : "bg-gray-200 hover:bg-gray-300 text-black"
    } ${className || ""}`}
  >
    {children}
  </button>
);

const DatePicker = ({ label, selected, onChange, name }) => (
  <div className="mb-4">
    {label && (
      <label className="block mb-2 text-sm font-bold text-black">{label}</label>
    )}
    <input
      type="date"
      value={selected || ""}
      onChange={onChange}
      name={name}
      className="w-full px-3 py-2 leading-tight text-gray-700 border rounded shadow appearance-none focus:outline-none focus:shadow-outline"
    />
  </div>
);

const Table = ({ children }) => (
  <table className="w-full text-left table-auto">{children}</table>
);
const TableHeader = ({ children }) => <thead>{children}</thead>;
const TableRow = ({ children, className }) => (
  <tr className={`border-b ${className || ""}`}>{children}</tr>
);
const TableHead = ({ children }) => (
  <th className="px-4 py-2 font-bold text-black">{children}</th>
);
const TableBody = ({ children }) => <tbody>{children}</tbody>;
const TableCell = ({ children, className }) => (
  <td className={`px-4 py-2 ${className || ""}`}>{children}</td>
);

const Step4_GeneralAuditDeclaration = ({ formData, setFormData }) => {
  // Generic handler for text inputs, textareas
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Handler for radio buttons
  const handleRadioChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Handler for date pickers
  const handleDateChange = (name, date) => {
    setFormData((prev) => ({ ...prev, [name]: date }));
  };

  // Handler for file uploads
  const handleFileChange = (name, file) => {
    setFormData((prev) => ({ ...prev, [name]: file }));
  };

  // Handler for the dynamic "in-kind support" table
  const handleInKindSupportChange = (index, field, value) => {
    const updatedRows = [...(formData.inKindSupportRows || [])];
    updatedRows[index] = { ...updatedRows[index], [field]: value };
    setFormData((prev) => ({ ...prev, inKindSupportRows: updatedRows }));
  };

  // Adds a new row to the "in-kind support" table
  const addInKindSupportRow = () => {
    const rows = formData.inKindSupportRows || [];
    const newRow = {
      id: rows.length + 1,
      year: "",
      description: "",
      percent: "",
    };
    setFormData((prev) => ({
      ...prev,
      inKindSupportRows: [...rows, newRow],
    }));
  };

  // Placeholder for form submission
  const handleSubmit = () => {
    console.log("Submitting Form Data:");
  };

  // Placeholder for sending the form
  const handleSend = () => {
    console.log("Sending Form Data:");
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card>
        <h1 className="mb-4 text-2xl font-bold text-black">
          Declaration of audit and completeness
        </h1>
        <p className="mb-6 text-black">
          The undersigned, in their capacity as a member of the board of
          directors or the supervisory board, makes false statements in
          statements or evidence that must be given to an auditor of the
          cooperative in accordance with the provisions of §§ 53 ff. GenG. The
          submission of an incorrect declaration of completeness will be
          punished with a fine or with imprisonment of up to three years (or a
          fine).
        </p>
        <p className="mb-6 text-black">
          The declaration of audit and completeness is submitted as part of the
          audit pursuant to Section 53 et seq. Regulation on the Cooperative
          Business Act (GenG). Among other things, we reviewed the annual
          financial statements prepared during this period. The purpose of the
          audit is to assess the cooperative's financial situation, the proper
          conduct of its business, and compliance with its promotional purposes.
        </p>
        <p className="mb-6 text-black">
          As a law-abiding member of the cooperative, the auditors confirm the
          following to the best of our knowledge and belief, without prejudice
          to their statutory duty to provide information.
        </p>

        <Textarea
          name="companyName"
          label="Name of the cooperative"
          value={formData.companyName || ""}
          onChange={handleChange}
        />
        <Input
          name="legalRepresentation"
          label="Legal representation"
          value={formData.legalRepresentation || ""}
          onChange={handleChange}
        />

        <div className="grid items-end grid-cols-1 gap-4 mb-4 md:grid-cols-2">
          <DatePicker
            name="examinationPeriodStart"
            label="Examination period"
            selected={formData.examinationPeriodStart}
            onChange={(e) =>
              handleDateChange("examinationPeriodStart", e.target.value)
            }
          />
          <DatePicker
            name="examinationPeriodEnd"
            label=" "
            selected={formData.examinationPeriodEnd}
            onChange={(e) =>
              handleDateChange("examinationPeriodEnd", e.target.value)
            }
          />
        </div>

        <FileUploader
          onDelete={(file) => handleFileChange("statutesFile", null)}
          name="statutesFile"
          label="Statutes"
          fileName={formData.statutesFile}
          onFileSelect={(file) => handleFileChange("statutesFile", file)}
        />

        <FileUploader
          onDelete={(file) =>
            handleFileChange("businessRegistrationFile", null)
          }
          name="businessRegistrationFile"
          label="Business Registration"
          fileName={formData.businessRegistrationFile}
          onFileSelect={(file) =>
            handleFileChange("businessRegistrationFile", file)
          }
        />

        <FileUploader
          onDelete={(file) => handleFileChange("registerExtractFile", null)}
          name="registerExtractFile"
          label="Register Extract"
          fileName={formData.registerExtractFile}
          onFileSelect={(file) => handleFileChange("registerExtractFile", file)}
        />
      </Card>

      <Card>
        <h2 className="mb-6 text-xl font-bold text-black">
          1. Examination and application requirements
        </h2>
        <div className="grid items-end grid-cols-1 gap-4 mb-4 md:grid-cols-2">
          <DatePicker
            name="annualFinancialStatementsAsOfStart"
            label="Annual financial statements as of:"
            selected={formData.annualFinancialStatementsAsOfStart}
            onChange={(e) =>
              handleDateChange(
                "annualFinancialStatementsAsOfStart",
                e.target.value
              )
            }
          />
          <DatePicker
            name="annualFinancialStatementsAsOfEnd"
            label=" "
            selected={formData.annualFinancialStatementsAsOfEnd}
            onChange={(e) =>
              handleDateChange(
                "annualFinancialStatementsAsOfEnd",
                e.target.value
              )
            }
          />
        </div>
        <div className="grid grid-cols-1 gap-4 mb-4 md:grid-cols-2">
          <Input
            name="salesRevenue"
            label="Sales revenue in EURO"
            value={formData.salesRevenue || ""}
            onChange={handleChange}
          />
          <Input
            name="investmentVolume"
            label="Investment volume in EURO"
            value={formData.investmentVolume || ""}
            onChange={handleChange}
          />
        </div>
        <RadioGroup
          name="statutesProvideForObligation"
          label="The current statutes *do not* provide for an obligation to make additional contributions."
          options={[
            { label: "Yes right", value: "true" },
            {
              label: "Yes, there is an obligation to make additional payments",
              value: "false",
            },
          ]}
          value={formData.statutesProvideForObligation}
          onChange={handleRadioChange}
        />
        <RadioGroup
          name="hasAcceptedLoans"
          label="The cooperative has not accepted any loans (Section 21b of the Cooperative Society Act) from its members and has not offered any investments exclusively to members."
          options={[
            { label: "Yes right", value: "true" },
            {
              label:
                "Yes, loans were accepted (§21b GenG) and investments were offered exclusively to members",
              value: "false",
            },
          ]}
          value={formData.hasAcceptedLoans}
          onChange={handleRadioChange}
        />
        {formData.hasAcceptedLoans === "false" && (
          <FileUploader
            onDelete={(file) => handleFileChange("loanEvidenceFile", null)}
            name="loanEvidenceFile"
            label="Upload evidence"
            fileName={formData.loanEvidenceFile}
            onFileSelect={(file) => handleFileChange("loanEvidenceFile", file)}
          />
        )}
      </Card>

      <Card>
        <h2 className="mb-6 text-xl font-bold text-black">2. Statutes</h2>
        <RadioGroup
          name="statutesChanged"
          label="No changes to the statutes were made during the relevant audit period."
          options={[
            { label: "Yes right", value: "true" },
            { label: "No, namely", value: "false" },
          ]}
          value={formData.statutesChanged}
          onChange={handleRadioChange}
        />
        <RadioGroup
          name="newBusinessActivities"
          label="No new business activities were commenced during the relevant audit period."
          options={[
            { label: "Yes right", value: "true" },
            { label: "No, namely", value: "false" },
          ]}
          value={formData.newBusinessActivities}
          onChange={handleRadioChange}
        />
        <RadioGroup
          name="businessPolicyCongruent"
          label="The business policy conducted by the cooperative (including any new business activities) during the audit period are congruent with the company's purpose as set out in its articles of association."
          options={[
            { label: "Yes right", value: "true" },
            { label: "No", value: "false" },
          ]}
          value={formData.businessPolicyCongruent}
          onChange={handleRadioChange}
        />
        {formData.businessPolicyCongruent === "false" && (
          <FileUploader
            onDelete={(file) => handleFileChange("businessPolicyFile", null)}
            name="businessPolicyFile"
            label="Business Policy"
            fileName={formData.businessPolicyFile}
            onFileSelect={(file) =>
              handleFileChange("businessPolicyFile", file)
            }
          />
        )}
      </Card>

      <Card>
        <h2 className="mb-6 text-xl font-bold text-black">3. Employees</h2>
        <RadioGroup
          name="hasEmployees"
          label="The cooperative had no employees during the relevant audit period?"
          options={[
            { label: "Yes right", value: "true" },
            { label: "No, namely (average number)", value: "false" },
          ]}
          value={formData.hasEmployees}
          onChange={handleRadioChange}
        />
        {formData.hasEmployees === "false" && (
          <Input
            name="employeeAverageNumber"
            placeholder="Average number"
            value={formData.employeeAverageNumber || ""}
            onChange={handleChange}
          />
        )}
        <RadioGroup
          name="employmentLegalDisputes"
          label="There were no legal disputes in connection with employment contracts and relationships?"
          options={[
            { label: "Yes right", value: "true" },
            { label: "No, namely", value: "false" },
          ]}
          value={formData.employmentLegalDisputes}
          onChange={handleRadioChange}
        />
        {formData.employmentLegalDisputes === "false" && (
          <FileUploader
            onDelete={(file) =>
              handleFileChange("employmentDisputesFile", null)
            }
            name="employmentDisputesFile"
            label="Employment Disputes"
            fileName={formData.employmentDisputesFile}
            onFileSelect={(file) =>
              handleFileChange("employmentDisputesFile", file)
            }
          />
        )}
      </Card>

      <Card>
        <h2 className="mb-6 text-xl font-bold text-black">
          4. Funding success and realization of purpose
        </h2>
        <RadioGroup
          name="inKindSupportTaken"
          label="In-kind support: During the relevant audit period, member support, particularly in-kind support, took place"
          options={[
            { label: "Yes, namely", value: "true" },
            { label: "No", value: "false" },
          ]}
          value={formData.inKindSupportTaken}
          onChange={handleRadioChange}
        />
        {formData.inKindSupportTaken === "true" && (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>No.</TableHead>
                  <TableHead>Year</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Percent</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(formData.inKindSupportRows || []).map((row, index) => (
                  <TableRow key={row.id}>
                    <TableCell>{row.id}</TableCell>
                    <TableCell>
                      <Input
                        value={row.year || ""}
                        onChange={(e) =>
                          handleInKindSupportChange(
                            index,
                            "year",
                            e.target.value
                          )
                        }
                        className="mb-0"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        value={row.description || ""}
                        onChange={(e) =>
                          handleInKindSupportChange(
                            index,
                            "description",
                            e.target.value
                          )
                        }
                        className="mb-0"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        value={row.percent || ""}
                        onChange={(e) =>
                          handleInKindSupportChange(
                            index,
                            "percent",
                            e.target.value
                          )
                        }
                        className="mb-0"
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <Button
              onClick={addInKindSupportRow}
              className="mt-4 text-primary bg-transparent hover:bg-gray-100"
            >
              + Add another row
            </Button>
          </>
        )}
        <RadioGroup
          name="supportOfferedToAll"
          label="The support services during the relevant audit period were offered to all regular members"
          options={[
            { label: "Yes right.", value: "true" },
            { label: "No", value: "false" },
          ]}
          value={formData.supportOfferedToAll}
          onChange={handleRadioChange}
        />
        <RadioGroup
          name="membersSatisfiedWithFunding"
          label="Are the members satisfied with the cooperative's funding performance during the audit period (if necessary, attach funding balance and funding plan)?"
          options={[
            { label: "Yes right.", value: "true" },
            { label: "No", value: "false" },
          ]}
          value={formData.membersSatisfiedWithFunding}
          onChange={handleRadioChange}
        />
        {formData.membersSatisfiedWithFunding === "true" && (
          <FileUploader
            onDelete={(file) => handleFileChange("fundingPlanFile", null)}
            name="fundingPlanFile"
            label="Funding Plan"
            fileName={formData.fundingPlanFile}
            onFileSelect={(file) => handleFileChange("fundingPlanFile", file)}
          />
        )}
      </Card>

      <Card>
        <h2 className="mb-6 text-xl font-bold text-black">5. Legal disputes</h2>
        <RadioGroup
          name="legalDisputesInitiated"
          label="No legal disputes were initiated or concluded during the reporting period?"
          options={[
            { label: "Yes right.", value: "true" },
            { label: "No, namely", value: "false" },
          ]}
          value={formData.legalDisputesInitiated}
          onChange={handleRadioChange}
        />
        {formData.legalDisputesInitiated === "false" && (
          <FileUploader
            onDelete={(file) =>
              handleFileChange("legalDisputesDetailsFile", null)
            }
            name="legalDisputesDetailsFile"
            label="Legal Disputes Details"
            fileName={formData.legalDisputesDetailsFile}
            onFileSelect={(file) =>
              handleFileChange("legalDisputesDetailsFile", file)
            }
          />
        )}
      </Card>

      <Card>
        <h2 className="mb-6 text-xl font-bold text-black">
          6. Financial instruments and contingent liabilities
        </h2>
        <p className="mb-4 text-black">
          The cooperative does not hold any derivative financial instruments
          (e.g. foreign currency, interest rate, security and index-related
          options and forward contracts, commodity forwards, futures, swaps,
          forward rate agreements and forward deposits), even within the
          framework of structured financial instruments.
        </p>
        <RadioGroup
          name="holdsDerivatives"
          label=""
          options={[
            { label: "Yes right.", value: "true" },
            { label: "No, namely", value: "false" },
          ]}
          value={formData.holdsDerivatives}
          onChange={handleRadioChange}
          isSubLabel={true}
        />
        <RadioGroup
          name="engagedInDayTrading"
          label="During the audit period, the cooperative did not engage in day trading, but only pursued long-term asset protection for the promotional purpose."
          options={[
            { label: "Yes right.", value: "true" },
            { label: "No", value: "false" },
          ]}
          value={formData.engagedInDayTrading}
          onChange={handleRadioChange}
        />
        <RadioGroup
          name="tradedCryptocurrencies"
          label="The cooperative did not trade any cryptocurrencies during the audit period."
          options={[
            { label: "Yes right.", value: "true" },
            { label: "No", value: "false" },
          ]}
          value={formData.tradedCryptocurrencies}
          onChange={handleRadioChange}
        />
        {formData.tradedCryptocurrencies === "false" && (
          <FileUploader
            onDelete={(file) => handleFileChange("cryptoFile", null)}
            name="cryptoFile"
            label="Crypto"
            fileName={formData.cryptoFile}
            onFileSelect={(file) => handleFileChange("cryptoFile", file)}
          />
        )}
      </Card>

      <Card>
        <h2 className="mb-6 text-xl font-bold text-black">7. Investments</h2>
        <RadioGroup
          name="hasShareholdings"
          label="There are no shareholdings/affiliated companies (Section 271 (1) HGB in conjunction with Section 336 (2) Sentence 1 HGB)"
          options={[
            { label: "Yes right", value: "true" },
            { label: "No", value: "false" },
          ]}
          value={formData.hasShareholdings}
          onChange={handleRadioChange}
        />
        <RadioGroup
          name="investmentsServePurpose"
          label="The investments serve exclusively the statutory promotional purpose and promotional mandate of the cooperative"
          options={[
            { label: "Yes, namely", value: "true" },
            { label: "No, namely", value: "false" },
          ]}
          value={formData.investmentsServePurpose}
          onChange={handleRadioChange}
        />
        <RadioGroup
          name="significantInvestmentContracts"
          label="The cooperative has not concluded any significant contracts during the relevant audit period (real estate purchases, company investments >25%)."
          options={[
            { label: "Yes right.", value: "true" },
            {
              label: "No, see form Real Estate and Investments",
              value: "false",
            },
          ]}
          value={formData.significantInvestmentContracts}
          onChange={handleRadioChange}
        />
        {formData.significantInvestmentContracts === "false" && (
          <FileUploader
            onDelete={(file) =>
              handleFileChange("realEstateInvestmentsFile", null)
            }
            name="realEstateInvestmentsFile"
            label="Real Estate Investments"
            fileName={formData.realEstateInvestmentsFile}
            onFileSelect={(file) =>
              handleFileChange("realEstateInvestmentsFile", file)
            }
          />
        )}
      </Card>

      <Card>
        <h2 className="mb-6 text-xl font-bold text-black">
          8. General questions
        </h2>
        <div className="space-y-4">
          <RadioGroup
            name="section21bObserved"
            label="Are the limits of Section 21b GenG observed for member loans?"
            options={[
              { label: "Yes", value: "true" },
              { label: "No", value: "false" },
            ]}
            value={formData.section21bObserved}
            onChange={handleRadioChange}
          />
          <RadioGroup
            name="bearerBondsIssued"
            label="No bearer bonds were issued?"
            options={[
              { label: "Yes", value: "true" },
              { label: "No", value: "false" },
            ]}
            value={formData.bearerBondsIssued}
            onChange={handleRadioChange}
          />
          <RadioGroup
            name="isRegisteredInTransparencyRegister"
            label="Is the cooperative registered in the transparency register?"
            options={[
              { label: "Yes", value: "true" },
              { label: "No", value: "false" },
            ]}
            value={formData.isRegisteredInTransparencyRegister}
            onChange={handleRadioChange}
          />
          {formData.isRegisteredInTransparencyRegister === "true" && (
            <DatePicker
              name="registrationDate"
              label="When was the registration made:"
              selected={formData.registrationDate}
              onChange={(e) =>
                handleDateChange("registrationDate", e.target.value)
              }
            />
          )}
          <RadioGroup
            name="hasBusinessLiabilityInsurance"
            label="Do you have business liability insurance?"
            options={[
              { label: "Yes", value: "true" },
              { label: "No", value: "false" },
            ]}
            value={formData.hasBusinessLiabilityInsurance}
            onChange={handleRadioChange}
          />
          <RadioGroup
            name="hasDandOInsurance"
            label="Is D&O insurance in place?"
            options={[
              { label: "Yes", value: "true" },
              { label: "No", value: "false" },
            ]}
            value={formData.hasDandOInsurance}
            onChange={handleRadioChange}
          />
          <RadioGroup
            name="hasFinancialLossLiabilityInsurance"
            label="Is there financial loss liability insurance?"
            options={[
              { label: "Yes", value: "true" },
              { label: "No", value: "false" },
            ]}
            value={formData.hasFinancialLossLiabilityInsurance}
            onChange={handleRadioChange}
          />
          <RadioGroup
            name="hasBadDebtInsurance"
            label="Is there bad debt insurance?"
            options={[
              { label: "Yes", value: "true" },
              { label: "No", value: "false" },
            ]}
            value={formData.hasBadDebtInsurance}
            onChange={handleRadioChange}
          />
          <RadioGroup
            name="buildingsAdequatelyInsured"
            label="In the case of real estate: Are all buildings adequately insured?"
            options={[
              { label: "Yes", value: "true" },
              { label: "No", value: "false" },
            ]}
            value={formData.buildingsAdequatelyInsured}
            onChange={handleRadioChange}
          />
          <RadioGroup
            name="buildingsInsuredAgainstNaturalHazards"
            label="In the case of real estate: Are all buildings insured against natural hazards?"
            options={[
              { label: "Yes", value: "true" },
              { label: "No", value: "false" },
            ]}
            value={formData.buildingsInsuredAgainstNaturalHazards}
            onChange={handleRadioChange}
          />
          <RadioGroup
            name="isEdpCarriedOut"
            label="Electronic data processing is carried out"
            options={[
              { label: "Yes", value: "true" },
              { label: "No", value: "false" },
            ]}
            value={formData.isEdpCarriedOut}
            onChange={handleRadioChange}
          />
          <RadioGroup
            name="isHardwareMonitored"
            label="The IT hardware is monitored by a service provider"
            options={[
              { label: "Yes", value: "true" },
              { label: "No", value: "false" },
            ]}
            value={formData.isHardwareMonitored}
            onChange={handleRadioChange}
          />
          <RadioGroup
            name="isSoftwareCloudBased"
            label="The IT software is cloud-based (in-house = no)"
            options={[
              { label: "Yes", value: "true" },
              { label: "No", value: "false" },
            ]}
            value={formData.isSoftwareCloudBased}
            onChange={handleRadioChange}
          />
          <RadioGroup
            name="areDailyBackupsPerformed"
            label="Daily data backups are performed"
            options={[
              { label: "Yes", value: "true" },
              { label: "No", value: "false" },
            ]}
            value={formData.areDailyBackupsPerformed}
            onChange={handleRadioChange}
          />
          <RadioGroup
            name="hasDataProtectionPolicy"
            label="The cooperative has a data protection policy"
            options={[
              { label: "Yes", value: "true" },
              { label: "No", value: "false" },
            ]}
            value={formData.hasDataProtectionPolicy}
            onChange={handleRadioChange}
          />
          <RadioGroup
            name="isGdprCompliant"
            label="The GDPR is complied with in all respects regarding the cooperative"
            options={[
              { label: "Yes", value: "true" },
              { label: "No", value: "false" },
            ]}
            value={formData.isGdprCompliant}
            onChange={handleRadioChange}
          />
        </div>
      </Card>
    </motion.div>
  );
};

export default Step4_GeneralAuditDeclaration;

