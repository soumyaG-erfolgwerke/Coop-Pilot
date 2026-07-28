"use client";
import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle, Circle, ArrowLeft, ArrowRight, ChevronDown, ChevronUp, Upload, X } from 'lucide-react';
import { RadioGroup, FileUploader, Input, Textarea, Button, Card } from './AuditUi';

// --- Step Components ---
const Step1_Overview = () => {
    const sections = [
        { title: 'Preparation', description: 'Gather essential documents and prepare for the audit process.' },
        { title: 'Requirements', description: 'Complete the audit requirements questionnaire.' },
        { title: 'General Audit Information', description: 'Complete basic audit information and registration details.' },
        { title: 'Document Checklist', description: 'Review and confirm all required documentation.' },
        { title: 'Financial Review', description: 'Review financial statements and records.' },
        { title: 'Governance Check', description: 'Verify compliance with co-op governance requirements.' },
        { title: 'Member Records', description: 'Update and verify member information and participation records.' },
    ];
    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <h1 className="text-3xl font-bold text-gray-800">Co-op Audit Guide</h1>
            <p className="mt-2 text-gray-600">Complete your audit with confidence, one step at a time.</p>
            <div className="mt-8 space-y-4">
                {sections.map(section => (
                    <Card key={section.title} className="p-6">
                        <h2 className="text-xl font-semibold text-gray-800">{section.title}</h2>
                        <p className="mt-2 text-gray-600">{section.description}</p>
                    </Card>
                ))}
            </div>
        </motion.div>
    );
};

export default Step1_Overview;