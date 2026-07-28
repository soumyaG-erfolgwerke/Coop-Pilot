"use client";
import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";

const Step2_ChecklistAndDocs = ({ formData, setFormData }) => {
  const [activeTab, setActiveTab] = useState("checklist");

  const checklistItems = [
    {
      id: "1.0",
      title: "Declaration of audit and completeness",
      desc: "Form for §53 ff GenG",
      section: "Generally",
    },
    {
      id: "1.1",
      title: "Statutes",
      desc: "Current statutes",
      section: "Generally",
    },
    {
      id: "1.2",
      title: "Business registration",
      desc: "Current or updated",
      section: "Generally",
    },
    {
      id: "1.3",
      title: "Register extract",
      desc: "Cooperative register extract",
      section: "Generally",
    },
    {
      id: "1.4",
      title: "Real estate & corporate investments",
      desc: ">25% holdings form",
      section: "Generally",
    },
    {
      id: "1.5",
      title: "Member loans",
      desc: "Loan form",
      section: "Generally",
    },
    {
      id: "2.0",
      title: "Bookkeeping declaration",
      desc: "Form for §53 ff GenG",
      section: "Accounting",
    },
    {
      id: "2.1",
      title: "Annual financial statements",
      desc: "Full set for audit period",
      section: "Accounting",
    },
    {
      id: "2.2",
      title: "Summary and balance lists",
      desc: "Matches financials",
      section: "Accounting",
    },
    {
      id: "2.3",
      title: "General ledger accounts",
      desc: "Matches financials",
      section: "Accounting",
    },
    {
      id: "2.4",
      title: "Tax assessments",
      desc: "Matches financials",
      section: "Accounting",
    },
    {
      id: "2.5",
      title: "Disclosure proof",
      desc: "Federal Gazette proof",
      section: "Accounting",
    },
    {
      id: "2.6",
      title: "Current BWA",
      desc: "Max 3 months old",
      section: "Accounting",
    },
    {
      id: "3.0",
      title: "Membership list declaration",
      desc: "Form for §53 ff GenG",
      section: "Member list",
    },
    {
      id: "3.1",
      title: "Current member list",
      desc: "With incoming/outgoing items",
      section: "Member list",
    },
    {
      id: "3.2",
      title: "Year-end member list",
      desc: "With annual changes",
      section: "Member list",
    },
    {
      id: "4.0",
      title: "General meeting basics",
      desc: "Form for §53 ff GenG",
      section: "Meetings",
    },
    {
      id: "4.1",
      title: "Rules of procedure",
      desc: "GA, Board, Supervisory Board",
      section: "Meetings",
    },
    {
      id: "4.2",
      title: "Board meeting minutes",
      desc: "Including attachments",
      section: "Meetings",
    },
    {
      id: "4.3",
      title: "General meeting minutes",
      desc: "During audit period",
      section: "Meetings",
    },
  ];

  const documentCheckItems = [
    {
      id: "doc_decl",
      title: "Declaration of audit and completeness",
      desc: "Required for audit",
    },
    {
      id: "doc_minutes",
      title: "Meeting Minutes",
      desc: "Board + assembly records",
    },
    {
      id: "doc_membership",
      title: "Membership Records",
      desc: "Updated list + status",
    },
    {
      id: "doc_bylaws",
      title: "Bylaws and Policies",
      desc: "Latest approved version",
    },
  ];

  // ✅ Toggle logic
  const toggleItem = (key, id) => {
    const current = formData[key] || [];
    const updated = current.includes(id)
      ? current.filter((i) => i !== id)
      : [...current, id];
    setFormData({ ...formData, [key]: updated });
  };

  const TabButton = ({ label, value }) => (
    <button
      onClick={() => setActiveTab(value)}
      className={`w-1/2 py-2 text-sm font-semibold rounded-md transition ${
        activeTab === value
          ? "bg-white text-blue-700 shadow"
          : "text-gray-500 hover:bg-gray-200"
      }`}
    >
      {label}
    </button>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="w-full max-w-4xl p-4 mx-auto sm:p-6"
    >
      <h1 className="text-2xl font-bold text-gray-900">
        Checklist & Document Check
      </h1>
      <p className="mt-1 text-sm text-gray-600">
        Required documents for audit according to §§ 53 ff GenG.
      </p>

      <div className="flex w-full max-w-md p-1 mx-auto mt-6 mb-6 space-x-1 bg-gray-100 rounded-lg">
        <TabButton label="Checklist" value="checklist" />
        <TabButton label="Document Check" value="documentCheck" />
      </div>

      {activeTab === "checklist" && (
        <div className="overflow-hidden bg-white border rounded-lg shadow-sm">
          <table className="w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-xs font-medium text-left text-gray-500 uppercase">
                  No.
                </th>
                <th className="px-4 py-3 text-xs font-medium text-left text-gray-500 uppercase">
                  Title & Description
                </th>
                <th className="px-4 py-3 text-xs font-medium text-left text-gray-500 uppercase">
                  Section
                </th>
                <th className="px-4 py-3 text-xs font-medium text-center text-gray-500 uppercase">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {checklistItems.map((item) => (
                <tr key={item.id}>
                  <td className="px-4 py-3 text-sm text-gray-500">{item.id}</td>
                  <td className="px-4 py-3">
                    <div className="text-sm font-medium text-gray-900">
                      {item.title}
                    </div>
                    <div className="text-sm text-gray-500">{item.desc}</div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {item.section}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <input
                      type="checkbox"
                      checked={formData?.checklist?.includes(item.id)}
                      onChange={() => toggleItem("checklist", item.id)}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === "documentCheck" && (
        <div className="p-4 space-y-4 bg-white border rounded-lg shadow-sm">
          {documentCheckItems.map((item) => (
            <label
              key={item.id}
              className="flex items-start p-4 bg-white border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50"
            >
              <input
                type="checkbox"
                checked={formData?.documentChecks?.includes(item.id)}
                onChange={() => toggleItem("documentChecks", item.id)}
                className="w-5 h-5 mt-1 text-blue-600 border-gray-300 rounded focus:ring-primary"
              />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-900">
                  {item.title}
                </p>
                <p className="text-sm text-gray-500">{item.desc}</p>
              </div>
            </label>
          ))}
        </div>
      )}
    </motion.div>
  );
};

export default Step2_ChecklistAndDocs;
