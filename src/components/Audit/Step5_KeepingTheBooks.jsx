"use client";
import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Upload, Calendar, X, Database } from 'lucide-react';
import { FileUploader } from './AuditUi';

const Card = ({ children, className }) => (
    <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
        {children}
    </div>
);

const Button = ({ children, variant = 'primary', ...props }) => {
    const baseClasses = "px-4 py-2 rounded-md font-semibold focus:outline-none focus:ring-2 focus:ring-offset-2";
    const variantClasses = {
        primary: "bg-blue-600 text-white hover:bg-blue-700 focus:ring-primary",
        secondary: "bg-gray-200 text-gray-800 hover:bg-gray-300 focus:ring-gray-400"
    };
    return <button className={`${baseClasses} ${variantClasses[variant]}`} {...props}>{children}</button>;
};

const Input = React.forwardRef(({ className, value, ...props }, ref) => (
    <input
        ref={ref}
        value={value || ""}
        className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary ${className}`}
        {...props}
    />
));

const Textarea = React.forwardRef(({ className, value, ...props }, ref) => (
    <textarea
        ref={ref}
        value={value || ""}
        className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary ${className}`}
        {...props}
    />
));

const RadioGroup = ({ label, options, selected, onChange, name }) => (
    <div className="mb-4">
        {label && <p className="font-semibold text-gray-700 mb-2">{label}</p>}
        <div className="flex items-center space-x-4">
            {options.map(option => (
                <label key={option.value} className="flex items-center cursor-pointer">
                    <input
                        type="radio"
                        name={name}
                        value={option.value}
                        checked={selected === option.value}
                        onChange={(e) => onChange(e.target.value)}
                        className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-primary"
                    />
                    <span className="ml-2 text-gray-700">{option.label}</span>
                </label>
            ))}
        </div>
    </div>
);

const DatePicker = ({ label, selected, onChange }) => (
    <div className="mb-4">
        <p className="font-semibold text-gray-700 mb-2">{label}</p>
        <div className="relative">
            <Input
                type="date"
                value={selected}
                onChange={(e) => onChange(e.target.value)}
                className="pr-10"
            />
            <Calendar className="absolute top-1/2 right-3 -translate-y-1/2 w-5 h-5 text-gray-400" />
        </div>
    </div>
);

const Step5_KeepingTheBooks = ({ formData, setFormData }) => {
    const [activeTab, setActiveTab] = useState('documents');

    const handleStateChange = (part, field, value) => {
        setFormData(prev => ({
            ...prev,
            part2: {
                ...prev.part2,
                [part]: {
                    ...prev.part2?.[part],
                    [field]: value
                }
            }
        }));
    };

    const handleFileChange = (part, field, file) => {
        handleStateChange(part, field, file ? file : null);
    };

    const toggleRepoAdded = () => {
        setFormData(prev => ({
            ...prev,
            repoAdded: !prev.repoAdded
        }));
    };

    const renderDocuments = () => (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <h3 className="text-xl font-semibold text-gray-800">1. Documents</h3>
                {/* <label className="flex items-center gap-3 cursor-pointer group bg-gray-50 hover:bg-gray-100 px-4 py-2 rounded-lg border border-gray-200 transition-colors">
                    <div className="flex items-center gap-2">
                        <Database className={`w-4 h-4 transition-colors ${formData.repoAdded ? 'text-blue-600' : 'text-gray-400'}`} />
                        <span className="text-sm font-semibold text-gray-700 group-hover:text-blue-600 transition-colors select-none">
                            Include Repository Docs
                        </span>
                    </div>
                    <div className="relative flex items-center ml-2">
                        <input 
                            type="checkbox" 
                            className="sr-only" 
                            checked={formData.repoAdded || false} 
                            onChange={toggleRepoAdded} 
                        />
                        <div className={`block w-10 h-5 rounded-full transition-colors duration-300 shadow-inner ${
                            formData.repoAdded ? 'bg-blue-600' : 'bg-gray-300'
                        }`}></div>
                        <div className={`absolute left-1 top-1 w-3 h-3 rounded-full transition-transform duration-300 shadow-sm ${
                            formData.repoAdded ? 'translate-x-5 bg-white' : 'translate-x-0 bg-white'
                        }`}></div>
                    </div>
                </label> */}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                <FileUploader
                    label="[210] - Annual financial statements"
                    fileName={formData.part2?.documents?.annualFinancialStatements}
                    onFileSelect={(file) => handleFileChange('documents', 'annualFinancialStatements', file)}
                    onDelete={() => handleFileChange('documents', 'annualFinancialStatements', null)}
                />

                <FileUploader
                    label="[220] - SuSa"
                    fileName={formData.part2?.documents?.susa}
                    onFileSelect={(file) => handleFileChange('documents', 'susa', file)}
                    onDelete={() => handleFileChange('documents', 'susa', null)}
                />

                <FileUploader
                    label="[230] - General ledger accounts"
                    fileName={formData.part2?.documents?.generalLedger}
                    onFileSelect={(file) => handleFileChange('documents', 'generalLedger', file)}
                    onDelete={() => handleFileChange('documents', 'generalLedger', null)}
                />

                <FileUploader
                    label="[240] - Tax assessment"
                    fileName={formData.part2?.documents?.taxAssessment}
                    onFileSelect={(file) => handleFileChange('documents', 'taxAssessment', file)}
                    onDelete={() => handleFileChange('documents', 'taxAssessment', null)}
                />

                <FileUploader
                    label="[250] - Disclosure of annual financial statements"
                    fileName={formData.part2?.documents?.disclosure}
                    onFileSelect={(file) => handleFileChange('documents', 'disclosure', file)}
                    onDelete={() => handleFileChange('documents', 'disclosure', null)}
                />

                <FileUploader
                    label="[260] - BWA"
                    fileName={formData.part2?.documents?.bwa}
                    onFileSelect={(file) => handleFileChange('documents', 'bwa', file)}
                    onDelete={() => handleFileChange('documents', 'bwa', null)}
                />
            </div>
        </motion.div>
    );

    const renderFinancialStatements = () => (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
            <h3 className="text-xl font-semibold text-gray-800 mb-6">2. Annual financial statements</h3>
            <div className="space-y-6">
                <RadioGroup
                    label="Did the annual financial statements were prepared during the relevant audit period?"
                    name="preparedDuringAudit"
                    options={[{ label: 'Yes', value: 'yes' }, { label: 'No', value: 'no' }]}
                    selected={formData.part2?.financials?.preparedDuringAudit}
                    onChange={(value) => handleStateChange('financials', 'preparedDuringAudit', value)}
                />

                {formData.part2?.financials?.preparedDuringAudit === 'yes' && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="pl-6 border-l-2 border-blue-200">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <DatePicker label="Annual financial statements" selected={formData.part2?.financials?.statementDate} onChange={v => handleStateChange('financials', 'statementDate', v)} />
                            <DatePicker label="Installed on" selected={formData.part2?.financials?.installedOnDate} onChange={v => handleStateChange('financials', 'installedOnDate', v)} />
                            <DatePicker label="Protocol is available" selected={formData.part2?.financials?.protocolDate} onChange={v => handleStateChange('financials', 'protocolDate', v)} />
                        </div>
                    </motion.div>
                )}

                <RadioGroup
                    label="The annual financial statements were prepared by:"
                    name="preparedBy"
                    options={[{ label: 'The cooperative itself', value: 'cooperative' }, { label: 'By a tax advisor', value: 'advisor' }]}
                    selected={formData.part2?.financials?.preparedBy}
                    onChange={(value) => handleStateChange('financials', 'preparedBy', value)}
                />
                {formData.part2?.financials?.preparedBy === 'advisor' && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="pl-6 border-l-2 border-blue-200">
                        <Textarea placeholder="Tax advisor (name, address, contact person, telephone number, email)" value={formData.part2?.financials?.advisorDetails} onChange={e => handleStateChange('financials', 'advisorDetails', e.target.value)} />
                    </motion.div>
                )}

                <RadioGroup
                    label="There were no significant changes that impact the comparability of the balance sheet and income statement (or: individual items) over time?"
                    name="noSignificantChanges"
                    options={[{ label: 'Yes', value: 'yes' }, { label: 'No', value: 'no' }]}
                    selected={formData.part2?.financials?.noSignificantChanges}
                    onChange={(value) => handleStateChange('financials', 'noSignificantChanges', value)}
                />
                {/* You can continue adding the rest of the questions from the image here following the same pattern */}
            </div>
        </motion.div>
    );

    const renderTaxReturns = () => (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
            <h3 className="text-xl font-semibold text-gray-800 mb-6">3. Tax returns, tax assessments & audits</h3>
            <div className="space-y-6">
                <DatePicker label="Tax returns were submitted by" selected={formData.part2?.tax?.submittedByDate} onChange={v => handleStateChange('tax', 'submittedByDate', v)} />
                <DatePicker label="Tax assessments are available until" selected={formData.part2?.tax?.assessmentsUntilDate} onChange={v => handleStateChange('tax', 'assessmentsUntilDate', v)} />
                <RadioGroup
                    label="The tax returns were prepared by:"
                    name="taxPreparedBy"
                    options={[{ label: 'The cooperative itself', value: 'cooperative' }, { label: 'By a tax advisor', value: 'advisor' }]}
                    selected={formData.part2?.tax?.preparedBy}
                    onChange={(value) => handleStateChange('tax', 'preparedBy', value)}
                />
                {formData.part2?.tax?.preparedBy === 'advisor' && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="pl-6 border-l-2 border-blue-200 space-y-4">
                        <RadioGroup
                            label="Does the tax advisor have more than one cooperative mandate?"
                            name="advisorMultipleMandates"
                            options={[{ label: 'Yes', value: 'yes' }, { label: 'No', value: 'no' }]}
                            selected={formData.part2?.tax?.advisorMultipleMandates}
                            onChange={(value) => handleStateChange('tax', 'advisorMultipleMandates', value)}
                        />
                    </motion.div>
                )}
                <RadioGroup
                    label="Did the tax office conduct any tax audits during the relevant audit period?"
                    name="taxAudits"
                    options={[{ label: 'Yes, and the following (notices must be attached)', value: 'yes' }, { label: 'No', value: 'no' }]}
                    selected={formData.part2?.tax?.taxAudits}
                    onChange={(value) => handleStateChange('tax', 'taxAudits', value)}
                />
                <RadioGroup
                    label="No instructions, complaints or inquiries from supervisory authorities relating to the financial statements or relevant to the audit were issued during the relevant audit period"
                    name="noComplaints"
                    options={[{ label: 'Yes', value: 'yes' }, { label: 'No, they were as follows:', value: 'no' }]}
                    selected={formData.part2?.tax?.noComplaints}
                    onChange={(value) => handleStateChange('tax', 'noComplaints', value)}
                />
                {formData.part2?.tax?.noComplaints === 'no' && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="pl-6 border-l-2 border-blue-200">
                        <Textarea placeholder="Describe the complaints or inquiries..." value={formData.part2?.tax?.complaintsDetails} onChange={e => handleStateChange('tax', 'complaintsDetails', e.target.value)} />
                    </motion.div>
                )}
            </div>
        </motion.div>
    );



    const tabs = [
        { id: 'documents', label: '1. Documents', content: renderDocuments() },
        { id: 'financials', label: '2. Annual financial statements', content: renderFinancialStatements() },
        { id: 'tax', label: '3. Tax returns', content: renderTaxReturns() },
    ];

    return (
        <div className="bg-gray-50 p-4 sm:p-8">
            <div className="max-w-6xl mx-auto">

                <div className="mb-8">
                    <div className="flex justify-center border-b border-gray-200">
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`px-4 py-3 text-sm font-medium ${activeTab === tab.id
                                        ? 'border-b-2 border-blue-600 text-blue-600'
                                        : 'text-gray-500'
                                    }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>

                <Card>
                    <AnimatePresence mode="wait">
                        {React.cloneElement(
                            tabs.find(tab => tab.id === activeTab)?.content,
                            { key: activeTab }
                        )}
                    </AnimatePresence>
                </Card>

            </div>
        </div>
    );
};

export default Step5_KeepingTheBooks;