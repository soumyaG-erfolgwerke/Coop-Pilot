"use client";
import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard, PieChart, Vote, ShieldCheck, Users, Bell, FileText, Leaf, Settings,
  LogOut, ChevronLeft, ChevronRight, Edit3, UploadCloud, Search, Filter, Plus, MoreHorizontal,
  CalendarDays, Info, CheckCircle, AlertTriangle, Sun, Moon, AlignLeft, ExternalLink, Download, ThumbsUp, ThumbsDown
} from 'lucide-react';



const mockDocuments = [
    { id: 1, name: 'Annual Report 2023.pdf', category: 'Financial', size: '2.5 MB', uploaded: '2024-03-15', type: 'pdf' },
    { id: 2, name: 'Membership Agreement.docx', category: 'Legal', size: '120 KB', uploaded: '2023-01-10', type: 'doc' },
    { id: 3, name: 'Q1 Meeting Minutes.pdf', category: 'Governance', size: '850 KB', uploaded: '2024-04-05', type: 'pdf' },
    { id: 4, name: 'Sustainability Plan.pptx', category: 'Strategy', size: '5.1 MB', uploaded: '2024-02-20', type: 'ppt' },
];


export default function DocumentsView() {
    const [activeTab, setActiveTab] = useState('All Documents');
    const docCategories = ['All Documents', 'EU Legislation', 'Financial', 'Legal', 'Governance', 'Templates', 'Analytics'];
    // Mock functionality for upload
    const handleFileUpload = (event) => {
        const file = event.target.files[0];
        if (file) {
            console.log("File selected:", file.name);
            // Add logic to handle file upload
        }
    };
    return (
        <div className="p-6 animate-fadeIn">
            <h2 className="text-2xl font-semibold text-gray-800 dark:text-white mb-1">Document Management</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Securely upload, manage, and sign cooperative documents.</p>
            
            <div className="mb-6 border-b border-gray-200 dark:border-slate-700 overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-slate-600 scrollbar-track-gray-100 dark:scrollbar-track-slate-700 pb-px">
                <nav className="flex space-x-4" aria-label="Document Categories">
                {docCategories.map((tab) => (
                    <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`shrink-0 whitespace-nowrap py-2.5 px-3 rounded-t-md font-medium text-sm transition-colors duration-150
                        ${activeTab === tab ? 'bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 border-b-0 text-blue-600 dark:text-primary/80' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-slate-700/50'}`}
                    >
                    {tab}
                    </button>
                ))}
                </nav>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1 bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg h-fit">
                    <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-1">Upload Secure Document</h3>
                    <form className="space-y-4 mt-4">
                        <div>
                            <label htmlFor="file-upload" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Choose file</label>
                            <input id="file-upload" name="file-upload" type="file" onChange={handleFileUpload} className="mt-1 block w-full text-sm text-gray-500 dark:text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 dark:file:bg-blue-900/50 file:text-blue-700 dark:file:text-blue-300 hover:file:bg-tint dark:hover:file:bg-blue-800/50"/>
                        </div>
                        <div>
                            <label htmlFor="docTitle" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Document Title</label>
                            <input type="text" id="docTitle" className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md shadow-sm bg-white dark:bg-slate-700"/>
                        </div>
                        <div>
                            <label htmlFor="docCat" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Select Category</label>
                            <select id="docCat" className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md shadow-sm bg-white dark:bg-slate-700 appearance-none">
                                <option>Financial</option><option>Legal</option><option>Governance</option><option>Meeting Minutes</option>
                            </select>
                        </div>
                        <div className="flex items-center">
                            <input id="publicAccess" type="checkbox" className="h-4 w-4 text-blue-600 border-gray-300 rounded"/>
                            <label htmlFor="publicAccess" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">Make document publicly accessible</label>
                        </div>
                        <button type="button" className="w-full px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium flex items-center justify-center"><UploadCloud size={16} className="mr-2"/> Securely Upload Document</button>
                    </form>
                </div>
                <div className="lg:col-span-2 bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xl font-semibold text-gray-800 dark:text-white">Secure Document Repository</h3>
                        <div className="relative w-full max-w-xs">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
                            <input type="text" placeholder="Search documents..." className="w-full pl-9 pr-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-sm"/>
                        </div>
                    </div>
                    {mockDocuments.length > 0 ? (
                        <ul className="space-y-3">
                            {mockDocuments.map(doc => (
                                <li key={doc.id} className="p-3 bg-gray-50 dark:bg-slate-700/50 rounded-lg flex items-center justify-between hover:shadow-md transition-shadow">
                                    <div className="flex items-center">
                                        <FileText size={20} className="mr-3 text-primary dark:text-primary/80 shrink-0"/>
                                        <div>
                                            <p className="font-medium text-gray-800 dark:text-gray-100">{doc.name}</p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">{doc.category} &bull; {doc.size} &bull; Uploaded: {doc.uploaded}</p>
                                        </div>
                                    </div>
                                    <button className="p-1.5 text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-300 rounded-full hover:bg-gray-100 dark:hover:bg-slate-600"><MoreHorizontal size={18}/></button>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-center py-8 text-gray-500 dark:text-gray-400">No documents in this category.</p>
                    )}
                </div>
            </div>
        </div>
    );
};
