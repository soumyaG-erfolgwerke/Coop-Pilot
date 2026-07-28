"use client";
import React, { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { getDocumentsofCoop } from '@/lib/coopService';
import { AnimatePresence, motion } from "framer-motion";
import { X, Eye, Download, Folder, ChevronDown, ChevronRight, FileText } from "lucide-react";
import DocumentCard from '../ui/DocumentCard';
import dynamic from "next/dynamic";
import { getViewUrl } from "@/lib/fileUrlService";
import toast from 'react-hot-toast';

const ViewerContent = dynamic(() => import("@/components/fileViewer"), { 
    ssr: false,
    loading: () => (
        <div className="flex items-center justify-center p-12 w-full h-full min-h-[300px]">
            <div className="w-8 h-8 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin"></div>
        </div>
    )
});

const Card = ({ children, className }) => (
    <div className={`bg-white rounded-lg shadow-md p-6 sm:p-8 ${className}`}>{children}</div>
);

const renderText = (label, value) => (
    <div className="mb-4">
        <p className="text-sm text-gray-600 font-semibold mb-1">{label}</p>
        <p className="text-gray-900">{value || '—'}</p>
    </div>
);

const renderDate = (label, dateStr) => {
    const formatted = dateStr ? new Date(dateStr).toLocaleDateString() : '—';
    return renderText(label, formatted);
};

const renderRadio = (label, value, trueLabel = 'Yes', falseLabel = 'No') => (
    renderText(label, value === 'yes' ? trueLabel : value === 'no' ? falseLabel : '—')
);

const FilePreview = ({ label, fileName }) => (
    <div className="mb-4">
        <p className="text-sm text-gray-600 font-semibold mb-1 line-clamp-1" title={label}>{label}</p>
        {fileName ? (
            <div className="flex flex-col xl:flex-row xl:items-center justify-between bg-gray-50 p-3 rounded border border-gray-200 gap-3">
                <div className="flex items-center gap-2 min-w-0">
                    <FileText className="w-4 h-4 text-gray-400 shrink-0" />
                    <span className="text-sm text-gray-900 truncate" title={fileName.name || fileName}>
                        {fileName.name || fileName}
                    </span>
                </div>
                <div className="flex gap-2 shrink-0">
                    <a
                        href={typeof fileName === 'string' ? fileName : URL.createObjectURL(fileName)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 bg-white border border-gray-300 text-gray-700 hover:bg-gray-100 px-3 py-1.5 rounded text-sm font-medium transition-colors"
                    >
                        <Eye className="w-3.5 h-3.5" /> View
                    </a>
                    <a
                        href={typeof fileName === 'string' ? fileName : URL.createObjectURL(fileName)}
                        download
                        className="flex items-center gap-1.5 bg-blue-600 text-white hover:bg-blue-700 px-3 py-1.5 rounded text-sm font-medium transition-colors"
                    >
                        <Download className="w-3.5 h-3.5" /> Save
                    </a>
                </div>
            </div>
        ) : (
            <div className="bg-gray-50 p-3 rounded border border-gray-200 border-dashed">
                <p className="text-gray-500 text-sm italic">No file uploaded</p>
            </div>
        )}
    </div>
);

const Step5_KeepingTheBooks = ({ formData }) => {
    const { user } = useAuth();
    const [repoDocs, setRepoDocs] = useState({});
    const [viewingDoc, setViewingDoc] = useState(null);
    const [openCategory, setOpenCategory] = useState(null);
    const [isLoadingRepo, setIsLoadingRepo] = useState(false);

    const toggleCategory = (cat) => {
        setOpenCategory(openCategory === cat ? null : cat);
    };

    useEffect(() => {
        if (!formData?.repoAdded || !formData?.cooperativeId) return;

        const fetchRepoDocs = async () => {
            setIsLoadingRepo(true);
            try {
                const coopRes = await getDocumentsofCoop(formData.cooperativeId, user.$id);

                if (coopRes?.success) {
                    const normalized = coopRes.documents.map((d) => ({
                        ...d,
                        fileUrl: `/api/fileServices/view?fileId=${d.fileId}`,
                    }));

                    const groupedDocs = processDocs(normalized);
                    setRepoDocs(groupedDocs);
                }
            } catch (err) {
                console.error("Repo docs fetch failed:", err);
            } finally {
                setIsLoadingRepo(false);
            }
        };

        fetchRepoDocs();
    }, [formData?.repoAdded, formData?.cooperativeId]);

    const processDocs = (docs) => {
        const grouped = {};
        docs.forEach((doc) => {
            const category = doc.category || "OTHER";
            if (!grouped[category]) {
                grouped[category] = [];
            }
            grouped[category].push(doc);
        });
        return grouped;
    };

    const handleDownload = (doc) => {
        if (!doc.downloadAllowed) {
            toast.error("Download not allowed");
            return;
        }
        const fileUrl = getViewUrl(doc.fileId);
        if (fileUrl.includes("/view")) {
            window.open(fileUrl.replace("/view", "/download"));
            toast.success("File downloaded successfully");
        } else {
            window.open(fileUrl);
            toast.success("File downloaded successfully");
        }
    };

    const renderDocuments = () => (
        <>
            <h3 className="text-xl font-semibold text-gray-800 mb-6">1. Documents</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                <FilePreview label="[210] - Annual financial statements" fileName={formData.part2?.documents?.annualFinancialStatements} />
                <FilePreview label="[220] - SuSa" fileName={formData.part2?.documents?.susa} />
                <FilePreview label="[230] - General ledger accounts" fileName={formData.part2?.documents?.generalLedger} />
                <FilePreview label="[240] - Tax assessment" fileName={formData.part2?.documents?.taxAssessment} />
                <FilePreview label="[250] - Disclosure of annual statements" fileName={formData.part2?.documents?.disclosure} />
                <FilePreview label="[260] - BWA" fileName={formData.part2?.documents?.bwa} />
            </div>

            {formData?.repoAdded && (
                <div className="mt-8 pt-8 border-t border-gray-200">
                    <h3 className="text-xl font-semibold text-gray-800 mb-6">
                        Repository Documents
                    </h3>

                    {isLoadingRepo ? (
                        <div className="flex flex-col items-center justify-center py-10 bg-gray-50 border border-gray-200 rounded-lg">
                            <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-3"></div>
                            <p className="text-sm font-medium text-gray-500">Loading repository documents...</p>
                        </div>
                    ) : Object.keys(repoDocs).length === 0 ? (
                        <div className="p-6 bg-gray-50 border border-gray-200 rounded-lg text-center">
                            <p className="text-sm text-gray-500 italic">No repository documents found.</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {Object.entries(repoDocs).map(([category, docs]) => {
                                const isOpen = openCategory === category;

                                return (
                                    <div key={category} className="bg-white border border-gray-200 rounded-lg overflow-hidden transition-all duration-200">
                                        <button
                                            onClick={() => toggleCategory(category)}
                                            className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors focus:outline-none"
                                        >
                                            <div className="flex items-center gap-3">
                                                <Folder className="w-5 h-5 text-blue-500" />
                                                <span className="font-semibold text-gray-800">{category}</span>
                                                <span className="bg-gray-200 text-gray-700 text-xs font-bold px-2.5 py-0.5 rounded-full">
                                                    {docs.length}
                                                </span>
                                            </div>
                                            <div className="text-gray-500">
                                                {isOpen ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                                            </div>
                                        </button>

                                        <AnimatePresence initial={false}>
                                            {isOpen && (
                                                <motion.div
                                                    initial={{ height: 0, opacity: 0 }}
                                                    animate={{ height: "auto", opacity: 1 }}
                                                    exit={{ height: 0, opacity: 0 }}
                                                    transition={{ duration: 0.2 }}
                                                >
                                                    <div className="border-t border-gray-200 p-4 sm:p-5 bg-white">
                                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                                                            {docs.map((doc) => (
                                                                <DocumentCard
                                                                    key={`${doc.$id}-${doc.version || ""}`}
                                                                    doc={doc}
                                                                    isMember={false}
                                                                    onView={(d) => setViewingDoc(d)}
                                                                />
                                                            ))}
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}

            <AnimatePresence>
                {viewingDoc && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm"
                            onClick={() => setViewingDoc(null)}
                        />

                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="relative w-full max-w-5xl h-[85vh] bg-white dark:bg-slate-900 rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-gray-200 dark:border-slate-800"
                        >
                            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-slate-800 bg-gray-50/80 dark:bg-slate-900/80 z-20 shrink-0">
                                <div className="flex items-center gap-3 overflow-hidden">
                                    <div className="p-2.5 bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded-xl shrink-0">
                                        <FileText className="w-5 h-5" />
                                    </div>
                                    <div className="truncate">
                                        <h3 className="text-base font-bold text-gray-900 dark:text-white truncate">
                                            {viewingDoc.fileName}
                                        </h3>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 shrink-0">
                                    <button
                                        onClick={() => {
                                            const link = document.createElement("a");
                                            link.href = viewingDoc.fileUrl;
                                            link.download = viewingDoc.fileName;
                                            link.click();
                                        }}
                                        className="p-2.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-800 dark:hover:text-blue-400 rounded-xl transition-colors"
                                        title="Download File"
                                    >
                                        <Download size={20} />
                                    </button>
                                    <button
                                        onClick={() => setViewingDoc(null)}
                                        className="p-2.5 text-gray-400 hover:text-gray-900 hover:bg-gray-200 dark:hover:bg-slate-800 dark:hover:text-white rounded-xl transition-colors bg-gray-100 dark:bg-slate-800/50"
                                        title="Close Viewer"
                                    >
                                        <X size={20} />
                                    </button>
                                </div>
                            </div>

                            <div className="flex-1 min-h-0 relative w-full h-full overflow-hidden bg-gray-100 dark:bg-slate-950">
                                <ViewerContent
                                    doc={viewingDoc}
                                    onDownload={(doc) => {
                                        const link = document.createElement("a");
                                        link.href = doc.fileUrl;
                                        link.download = doc.fileName;
                                        link.click();
                                    }}
                                />
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </>
    );

    const renderFinancialStatements = () => (
        <>
            <h3 className="text-xl font-semibold text-gray-800 mb-6">2. Annual financial statements</h3>
            {renderRadio("Were financial statements prepared?", formData.part2?.financials?.preparedDuringAudit)}
            {formData.part2?.financials?.preparedDuringAudit === 'yes' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-l-2 border-blue-200 pl-4">
                    {renderDate("Annual financial statements", formData.part2?.financials?.statementDate)}
                    {renderDate("Installed on", formData.part2?.financials?.installedOnDate)}
                    {renderDate("Protocol is available", formData.part2?.financials?.protocolDate)}
                </div>
            )}
            {renderRadio("Statements prepared by", formData.part2?.financials?.preparedBy, 'Tax advisor', 'Cooperative')}
            {formData.part2?.financials?.preparedBy === 'advisor' && (
                <div className="border-l-2 border-blue-200 pl-4">
                    {renderText("Tax advisor details", formData.part2?.financials?.advisorDetails)}
                </div>
            )}
            {renderRadio("No significant changes in balance sheet", formData.part2?.financials?.noSignificantChanges)}
        </>
    );

    const renderTaxReturns = () => (
        <>
            <h3 className="text-xl font-semibold text-gray-800 mb-6">3. Tax returns, tax assessments & audits</h3>
            {renderDate("Tax returns submitted by", formData.part2?.tax?.submittedByDate)}
            {renderDate("Tax assessments available until", formData.part2?.tax?.assessmentsUntilDate)}
            {renderRadio("Tax returns prepared by", formData.part2?.tax?.preparedBy, 'Tax advisor', 'Cooperative')}
            {formData.part2?.tax?.preparedBy === 'advisor' && (
                <div className="border-l-2 border-blue-200 pl-4">
                    {renderRadio("Advisor has multiple mandates", formData.part2?.tax?.advisorMultipleMandates)}
                </div>
            )}
            {renderRadio("Tax audits conducted", formData.part2?.tax?.taxAudits)}
            {renderRadio("No complaints from authorities", formData.part2?.tax?.noComplaints)}
            {formData.part2?.tax?.noComplaints === 'no' && (
                <div className="border-l-2 border-blue-200 pl-4">
                    {renderText("Complaints or inquiries", formData.part2?.tax?.complaintsDetails)}
                </div>
            )}
        </>
    );

    return (
        <div className="bg-gray-50 p-4 sm:p-8">
            <div className="max-w-6xl mx-auto">
                <div className="text-center mb-8">
                    <h2 className="text-2xl sm:text-3xl font-bold text-gray-800">Part 2 - Statement on bookkeeping and financial position</h2>
                    <p className="text-gray-500">according to §§ 53 ff GenG</p>
                </div>

                <Card>{renderDocuments()}</Card>
                <Card className="mt-8">{renderFinancialStatements()}</Card>
                <Card className="mt-8">{renderTaxReturns()}</Card>
            </div>
        </div>
    );
};

export default Step5_KeepingTheBooks;