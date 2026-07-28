"use client";
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Building, 
  Calendar, 
  Hash, 
  Tag, 
  User, 
  Clock, 
  FileText, 
  Euro,
  PieChart
} from 'lucide-react';


const StatusPill = ({ status }) => {
  const s = (status || "").toLowerCase();
  let style = "bg-gray-50 text-gray-700 border-gray-200";

  if (s === "verified" || s === "approved") {
    style = "bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-900/50";
  } else if (s === "pending") {
    style = "bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-900/50";
  } else if (s === "cancelled" || s === "rejected") {
    style = "bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-900/50";
  }

  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border capitalize ${style}`}>
      {status || "Unknown"}
    </span>
  );
};

const DetailRow = ({ icon: Icon, label, value, className = '' }) => (
  <div className={`flex justify-between items-center py-3 border-b border-gray-100 dark:border-slate-700/50 last:border-0 ${className}`}>
    <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
      {Icon && <Icon className="w-4 h-4" />}
      <dt className="text-sm font-medium">{label}</dt>
    </div>
    <dd className="text-sm font-medium text-right text-gray-900 dark:text-gray-100">{value}</dd>
  </div>
);

const formatCurrency = (value) => {
  if (!value) return "€0";
  return `€${Number(value)}`;
};

const formatDate = (dateString) => {
  if (!dateString) return "—";
  const d = new Date(dateString);
  if (isNaN(d)) return "—";
  return d.toLocaleDateString();
};

const TransactionDetailModal = ({ transaction, onClose }) => {
  if (!transaction) return null;

  const pricePerShare = transaction.shares > 0 ? transaction.price / transaction.shares : 0;

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
        aria-labelledby="modal-title"
        role="dialog"
        aria-modal="true"
      >
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 bg-slate-900/40 dark:bg-slate-900/60 backdrop-blur-sm"
          onClick={onClose}
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="relative w-full max-w-lg overflow-hidden bg-white shadow-2xl dark:bg-slate-800 rounded-2xl flex flex-col max-h-[90vh]"
        >
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-slate-700 bg-gray-50/50 dark:bg-slate-800/50 shrink-0">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <h3 id="modal-title" className="text-lg font-bold text-gray-900 dark:text-white">
                Transaction Receipt
              </h3>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-gray-400 transition-colors rounded-full hover:bg-gray-200 hover:text-gray-600 dark:hover:bg-slate-700 dark:hover:text-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <X size={20} />
            </button>
          </div>

          <div className="p-6 overflow-y-auto custom-scrollbar">
            
            <div className="flex items-center gap-4 mb-2 p-4 bg-gray-50 dark:bg-slate-900/50 rounded-xl border border-gray-100 dark:border-slate-700">
                <div className="flex items-center justify-center w-16 h-16 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg shrink-0">
                  <Building className="w-8 h-8" />
                </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-lg font-bold text-gray-900 dark:text-white truncate">
                  {transaction.coopName}
                </h4>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    ID: {transaction.coopId || "N/A"}
                  </span>
                </div>
              </div>
              <div className="shrink-0">
                <StatusPill status={transaction.verificationStatus} />
              </div>
            </div>

            <div className="mb-5 p-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl text-white shadow-md">
              <div className="text-indigo-100 text-sm font-medium mb-1 uppercase tracking-wider">Total Amount</div>
              <div className="text-4xl font-bold mb-4">
                {formatCurrency(transaction.price)}
              </div>
              <div className="flex items-center justify-between pt-4 border-t border-indigo-400/30 text-sm">
                <div className="flex flex-col">
                  <span className="text-indigo-200">Shares</span>
                  <span className="font-semibold">{transaction.shares.toLocaleString()}</span>
                </div>
                <div className="flex flex-col text-right">
                  <span className="text-indigo-200">Price per Share</span>
                  <span className="font-semibold">{formatCurrency(pricePerShare)}</span>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              
              <div>
                <h5 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2 px-1">
                  Transaction Details
                </h5>
                <dl className="bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 px-4">
                  <DetailRow 
                    icon={Calendar} 
                    label="Date & Time" 
                    value={formatDate(transaction.time || transaction.$createdAt)} 
                  />
                  <DetailRow 
                    icon={Tag} 
                    label="Type" 
                    value={<span className="capitalize">{transaction.transactionType}</span>} 
                  />
                  <DetailRow 
                    icon={User} 
                    label="Purchased For" 
                    value={<span className="capitalize">{transaction.buyFor || "Self"}</span>} 
                  />
                </dl>
              </div>

              <div>
                <h5 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2 px-1">
                  System Details
                </h5>
                <dl className="bg-gray-50 dark:bg-slate-900/30 rounded-xl border border-gray-100 dark:border-slate-700 px-4">
                  <DetailRow 
                    icon={Hash} 
                    label="Transaction ID" 
                    value={<span className="font-mono text-xs text-gray-600 dark:text-gray-400">{transaction.$id}</span>} 
                  />
                  <DetailRow 
                    icon={User} 
                    label="Member ID" 
                    value={<span className="font-mono text-xs text-gray-600 dark:text-gray-400">{transaction.memberId}</span>} 
                  />
                  <DetailRow 
                    icon={Clock} 
                    label="Record Created" 
                    value={<span className="text-xs text-gray-600 dark:text-gray-400">{formatDate(transaction.$createdAt)}</span>} 
                  />
                </dl>
              </div>

            </div>
          </div>

        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default TransactionDetailModal;