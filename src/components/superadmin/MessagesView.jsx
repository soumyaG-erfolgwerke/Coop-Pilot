"use client";
import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, CheckCircle2, AlertCircle, Loader2, X, Users, ShieldCheck, ClipboardList } from 'lucide-react';
import { notifyAllAdmins, notifyAllAuditers, notifyAllUsers, notifyAllMembers } from '../../lib/notificationService';
// ^ assumes the earlier helper uses account.get() and createNotification with createdFor=email

const RECIPIENT_OPTIONS = [
  { value: 'members', label: 'All Members', icon: Users },
  { value: 'admins', label: 'All Admins', icon: ShieldCheck },
  { value: 'auditers', label: 'All Auditors', icon: ClipboardList },
  { value: 'users', label: 'All Users', icon: Users },
];

const callMap = {
  admins: notifyAllAdmins,
  auditers: notifyAllAuditers,
  users: notifyAllUsers,
  members: notifyAllMembers,
};

function clsx(...args) {
  return args.filter(Boolean).join(' ');
}

const Field = ({ id, label, children, required }) => (
  <label htmlFor={id} className="block">
    <span className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
      {label}{required && <span className="text-red-500"> *</span>}
    </span>
    {children}
  </label>
);

const Select = ({ id, value, onChange, options }) => (
  <select
    id={id}
    value={value}
    onChange={onChange}
    className="mt-1 block w-full py-2.5 px-3 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary sm:text-sm"
  >
    {options.map(opt => (
      <option key={opt.value} value={opt.value}>{opt.label}</option>
    ))}
  </select>
);

export default function MessagesView() {
  const [recipient, setRecipient] = useState('members');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null); // {total, success, failed:[], items:[...]}
  const [error, setError] = useState('');

  const Icon = useMemo(
    () => RECIPIENT_OPTIONS.find(o => o.value === recipient)?.icon ?? Users,
    [recipient]
  );

  const combinedPreview = useMemo(() => {
    const title = subject?.trim();
    const body = message?.trim();
    if (title && body) return `${title} — ${body}`;
    return title || body || '';
  }, [subject, message]);

  const charCount = combinedPreview.length;

  async function handleSend() {
    setError('');
    setResult(null);

    // Validation
    if (!subject.trim()) {
      setError('Subject is required.');
      return;
    }
    if (!message.trim()) {
      setError('Message is required.');
      return;
    }

    const api = callMap[recipient];
    if (!api) {
      setError('Unknown recipient group.');
      return;
    }

    setLoading(true);
    try {
      // Pass the message as a string (API doesn't support function callbacks)
      const messageText = `${subject.trim()} — ${message.trim()}`;
      const items = await api(messageText);
      

      const total = items.length;
      const success = items.filter(i => i.ok).length;
      const failedItems = items.filter(i => !i.ok);

      setResult({
        total,
        success,
        failed: failedItems.map(i => ({
          email: i.email,
          name: i.name,
          error: i.error || 'Unknown error',
        })),
        items,
      });

      // Optional: clear inputs on success
      if (total > 0 && success > 0) {
        setSubject('');
        setMessage('');
      }
    } catch (e) {
      console.error(e);
      setError(e?.message || 'Broadcast failed.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-4 sm:p-6 animate-fadeIn">
      <div className="flex items-center gap-3 mb-6">
        <div className="inline-flex items-center justify-center w-10 h-10 text-blue-700 rounded-xl bg-blue-600/10 dark:text-blue-300">
          <Icon size={20} />
        </div>
        <h2 className="text-2xl font-semibold text-gray-800 dark:text-white">System Messages</h2>
      </div>

      <div className="p-4 bg-white border shadow-lg dark:bg-slate-800 sm:p-6 rounded-2xl border-slate-100 dark:border-slate-700">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field id="recipients" label="Recipients" required>
            <Select
              id="recipients"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              options={RECIPIENT_OPTIONS}
            />
          </Field>

          <Field id="subject" label="Subject" required>
            <input
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g., Maintenance Window Tonight"
              className="mt-1 block w-full py-2.5 px-3 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary sm:text-sm"
            />
          </Field>

          <div className="sm:col-span-2">
            <Field id="sys-message" label="Message" required>
              <textarea
                id="sys-message"
                rows={6}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Write the announcement you want to broadcast..."
                className="mt-1 block w-full py-2.5 px-3 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary sm:text-sm"
              />
            </Field>
            <div className="flex items-center justify-between mt-2 text-xs text-gray-500 dark:text-gray-400">
              <span>Preview chars: {charCount}</span>
              <span className="truncate max-w-[70%]">
                <span className="font-medium">Preview: </span>
                <span className="opacity-80">{combinedPreview || '—'}</span>
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3 mt-6 sm:flex-row sm:justify-end">
          <button
            onClick={handleSend}
            disabled={loading}
            className={clsx(
              "inline-flex items-center justify-center px-4 py-2.5 rounded-xl text-white text-sm font-medium shadow-md transition-colors",
              loading ? "bg-primary/80 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"
            )}
          >
            {loading ? <Loader2 className="mr-2 animate-spin" size={16} /> : <Send className="mr-2" size={16} />}
            {loading ? "Sending..." : "Send Broadcast"}
          </button>
        </div>

        {/* Inline error */}
        <AnimatePresence>
          {error && (
            <motion.div
              className="flex items-start gap-2 px-4 py-3 mt-4 text-sm text-red-700 border rounded-xl border-red-300/40 bg-red-50 dark:bg-red-900/20 dark:text-red-200"
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
            >
              <AlertCircle size={18} className="mt-0.5 shrink-0" />
              <div>{error}</div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Result panel */}
        <AnimatePresence>
          {result && (
            <motion.div
              className="px-4 py-4 mt-4 border rounded-2xl border-emerald-300/40 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-800 dark:text-emerald-100"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 6 }}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="shrink-0 mt-0.5" size={20} />
                  <div>
                    <div className="font-semibold">Broadcast completed</div>
                    <div className="text-sm mt-0.5">
                      Total recipients: <strong>{result.total}</strong> · Successful:{" "}
                      <strong>{result.success}</strong> · Failed:{" "}
                      <strong>{result.failed.length}</strong>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setResult(null)}
                  className="text-emerald-700/70 dark:text-emerald-200/70 hover:opacity-100"
                  aria-label="Dismiss results"
                >
                  <X size={18} />
                </button>
              </div>

              {result.failed.length > 0 && (
                <div className="mt-3">
                  <details className="text-sm">
                    <summary className="cursor-pointer underline-offset-2 hover:underline">
                      View failed recipients
                    </summary>
                    <ul className="pr-1 mt-2 space-y-1 overflow-auto max-h-48">
                      {result.failed.map((f, idx) => (
                        <li key={idx} className="flex items-center justify-between gap-3">
                          <span className="truncate">{f.name || f.email}</span>
                          <span className="text-red-600 dark:text-red-300/90 truncate max-w-[50%]">{f.error}</span>
                        </li>
                      ))}
                    </ul>
                  </details>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
