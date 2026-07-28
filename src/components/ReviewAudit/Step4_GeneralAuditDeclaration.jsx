import React from 'react';
import { motion } from 'framer-motion';

const Card = ({ children, className }) => (
    <div className={`bg-white shadow-md rounded-lg p-6 mb-6 ${className || ''}`}>
        {children}
    </div>
);

const FilePreview = ({ label, fileName }) => (
    <div className="mb-4">
        <label className="block text-black text-sm font-bold mb-2">{label}</label>
        {fileName ? (
            <div className="flex items-center justify-between bg-gray-100 p-3 rounded border">
                <span className="text-sm text-black truncate max-w-xs">{fileName.name || fileName}</span>
                <div className="flex gap-2">
                    <a
                        href={typeof fileName === 'string' ? fileName : URL.createObjectURL(fileName)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-primary text-white px-3 py-1 rounded text-sm"
                    >
                        Preview
                    </a>
                    <a
                        href={typeof fileName === 'string' ? fileName : URL.createObjectURL(fileName)}
                        download
                        className="bg-green-500 text-white px-3 py-1 rounded text-sm"
                    >
                        Download
                    </a>
                </div>
            </div>
        ) : (
            <p className="text-gray-500 text-sm italic">No file uploaded</p>
        )}
    </div>
);

const formatDate = (dateStr) => dateStr ? new Date(dateStr).toLocaleDateString() : '—';
const renderText = (label, value) => (
    <div className="mb-4">
        <label className="block text-black text-sm font-bold mb-1">{label}</label>
        <p className="text-gray-800">{value || '—'}</p>
    </div>
);

const renderRadio = (label, value, trueLabel = 'Yes', falseLabel = 'No') => (
    <div className="mb-4">
        <label className="block text-black text-sm font-bold mb-1">{label}</label>
        <p className="text-gray-800">{value === 'true' ? trueLabel : value === 'false' ? falseLabel : '—'}</p>
    </div>
);

const Step4_GeneralAuditDeclaration = ({ formData }) => {
    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>

            <Card>
                <h1 className="text-2xl font-bold mb-4 text-black">Declaration of audit and completeness</h1>
                {renderText('Name of the cooperative', formData.companyName)}
                {renderText('Legal representation', formData.legalRepresentation)}
                {renderText('Examination period start', formatDate(formData.examinationPeriodStart))}
                {renderText('Examination period end', formatDate(formData.examinationPeriodEnd))}
                <FilePreview label="Statutes" fileName={formData.statutesFile} />
                <FilePreview label="Business Registration" fileName={formData.businessRegistrationFile} />
                <FilePreview label="Register Extract" fileName={formData.registerExtractFile} />
            </Card>

            <Card>
                <h2 className="text-xl font-bold mb-6 text-black">1. Examination and application requirements</h2>
                {renderText('Annual financial statements as of (start)', formatDate(formData.annualFinancialStatementsAsOfStart))}
                {renderText('Annual financial statements as of (end)', formatDate(formData.annualFinancialStatementsAsOfEnd))}
                {renderText('Sales revenue in EURO', formData.salesRevenue)}
                {renderText('Investment volume in EURO', formData.investmentVolume)}
                {renderRadio('Obligation to make additional contributions', formData.statutesProvideForObligation)}
                {renderRadio('Loans accepted or investments offered', formData.hasAcceptedLoans)}
                {formData.hasAcceptedLoans === 'false' && <FilePreview label="Upload evidence" fileName={formData.loanEvidenceFile} />}
            </Card>

            <Card>
                <h2 className="text-xl font-bold mb-6 text-black">2. Statutes</h2>
                {renderRadio('No changes to the statutes', formData.statutesChanged)}
                {renderRadio('No new business activities', formData.newBusinessActivities)}
                {renderRadio('Business policy congruent', formData.businessPolicyCongruent)}
                {formData.businessPolicyCongruent === 'false' && <FilePreview label="Business Policy" fileName={formData.businessPolicyFile} />}
            </Card>

            <Card>
                <h2 className="text-xl font-bold mb-6 text-black">3. Employees</h2>
                {renderRadio('No employees during audit period', formData.hasEmployees)}
                {formData.hasEmployees === 'false' && renderText('Average number of employees', formData.employeeAverageNumber)}
                {renderRadio('No legal disputes on employment', formData.employmentLegalDisputes)}
                {formData.employmentLegalDisputes === 'false' && <FilePreview label="Employment Disputes" fileName={formData.employmentDisputesFile} />}
            </Card>

            <Card>
                <h2 className="text-xl font-bold mb-6 text-black">4. Funding success and realization of purpose</h2>
                {renderRadio('In-kind support provided', formData.inKindSupportTaken)}
                {(formData.inKindSupportTaken === 'true' && (formData.inKindSupportRows || []).length > 0) && (
                    <table className="w-full text-sm border">
                        <thead>
                            <tr className="bg-gray-100">
                                <th className="border px-4 py-2">No.</th>
                                <th className="border px-4 py-2">Year</th>
                                <th className="border px-4 py-2">Description</th>
                                <th className="border px-4 py-2">Percent</th>
                            </tr>
                        </thead>
                        <tbody>
                            {formData.inKindSupportRows.map((row, index) => (
                                <tr key={index}>
                                    <td className="border px-4 py-2">{row.id}</td>
                                    <td className="border px-4 py-2">{row.year}</td>
                                    <td className="border px-4 py-2">{row.description}</td>
                                    <td className="border px-4 py-2">{row.percent}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
                {renderRadio('Support offered to all members', formData.supportOfferedToAll)}
                {renderRadio('Members satisfied with funding', formData.membersSatisfiedWithFunding)}
                {formData.membersSatisfiedWithFunding === 'true' && <FilePreview label="Funding Plan" fileName={formData.fundingPlanFile} />}
            </Card>

            <Card>
                <h2 className="text-xl font-bold mb-6 text-black">5. Legal disputes</h2>
                {renderRadio('No legal disputes initiated or concluded', formData.legalDisputesInitiated)}
                {formData.legalDisputesInitiated === 'false' && <FilePreview label="Legal Disputes Details" fileName={formData.legalDisputesDetailsFile} />}
            </Card>

            <Card>
                <h2 className="text-xl font-bold mb-6 text-black">6. Financial instruments and contingent liabilities</h2>
                {renderRadio('Derivative financial instruments held', formData.holdsDerivatives)}
                {renderRadio('Day trading engaged', formData.engagedInDayTrading)}
                {renderRadio('Cryptocurrencies traded', formData.tradedCryptocurrencies)}
                {formData.tradedCryptocurrencies === 'false' && <FilePreview label="Crypto" fileName={formData.cryptoFile} />}
            </Card>

            <Card>
                <h2 className="text-xl font-bold mb-6 text-black">7. Investments</h2>
                {renderRadio('Shareholdings exist', formData.hasShareholdings)}
                {renderRadio('Investments serve statutory purpose', formData.investmentsServePurpose)}
                {renderRadio('No significant investment contracts', formData.significantInvestmentContracts)}
                {formData.significantInvestmentContracts === 'false' && <FilePreview label="Real Estate Investments" fileName={formData.realEstateInvestmentsFile} />}
            </Card>

            <Card>
                <h2 className="text-xl font-bold mb-6 text-black">8. General questions</h2>
                {renderRadio('Section 21b GenG observed', formData.section21bObserved)}
                {renderRadio('No bearer bonds issued', formData.bearerBondsIssued)}
                {renderRadio('Registered in transparency register', formData.isRegisteredInTransparencyRegister)}
                {formData.isRegisteredInTransparencyRegister === 'true' && renderText('Registration Date', formatDate(formData.registrationDate))}
                {renderRadio('Business liability insurance', formData.hasBusinessLiabilityInsurance)}
                {renderRadio('D&O insurance in place', formData.hasDandOInsurance)}
                {renderRadio('Financial loss liability insurance', formData.hasFinancialLossLiabilityInsurance)}
                {renderRadio('Bad debt insurance', formData.hasBadDebtInsurance)}
                {renderRadio('Buildings adequately insured', formData.buildingsAdequatelyInsured)}
                {renderRadio('Buildings insured against natural hazards', formData.buildingsInsuredAgainstNaturalHazards)}
                {renderRadio('Electronic data processing carried out', formData.isEdpCarriedOut)}
                {renderRadio('IT hardware monitored by provider', formData.isHardwareMonitored)}
                {renderRadio('Software is cloud-based', formData.isSoftwareCloudBased)}
                {renderRadio('Daily backups performed', formData.areDailyBackupsPerformed)}
                {renderRadio('Data protection policy in place', formData.hasDataProtectionPolicy)}
                {renderRadio('GDPR compliance', formData.isGdprCompliant)}
            </Card>
        </motion.div>
    );
};

export default Step4_GeneralAuditDeclaration;
