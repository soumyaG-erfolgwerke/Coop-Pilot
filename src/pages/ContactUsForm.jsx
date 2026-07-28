"use client";
import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { addContactUs } from '../lib/contactUsService';

/**
 * ContactUsForm
 * - Tailwind CSS, responsive, light/dark-aware (inherits theme from parent)
 * - Validates inputs, shows inline errors, loading state, success toast
 * - Calls addContactUs(payload) on submit
 *
 * Props:
 *  - onSuccess?: (doc) => void  // optional callback with created document
 */
export default function ContactUsForm({ onSuccess }) {
  const [values, setValues] = useState({
    name: '',
    email: '',
    contactNumber: '',
    text: '',
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState(null); // { type: 'success'|'error', message: string }

  const remaining = useMemo(() => 10000 - (values.text?.length || 0), [values.text]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setValues((v) => ({ ...v, [name]: value }));
  };

  const validate = () => {
    const newErr = {};
    if (!values.name.trim()) newErr.name = 'Name is required';
    if (!values.email.trim()) newErr.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(values.email)) newErr.email = 'Enter a valid email';

    if (values.contactNumber && !/^[0-9+\-()\s]{7,15}$/.test(values.contactNumber)) {
      newErr.contactNumber = 'Enter a valid phone number (7–15 chars)';
    }
    if (!values.text.trim()) newErr.text = 'Message is required';
    if (values.text.length > 10000) newErr.text = 'Message too long';

    setErrors(newErr);
    return Object.keys(newErr).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus(null);
    if (!validate()) return;

    try {
      setSubmitting(true);
      const doc = await addContactUs({
        name: values.name.trim(),
        email: values.email.trim(),
        contactNumber: values.contactNumber.trim() || undefined,
        text: values.text.trim(),
      });
      setValues({ name: '', email: '', contactNumber: '', text: '' });
      setStatus({ type: 'success', message: 'Thanks! Your message has been sent.' });
      onSuccess?.(doc);
    } catch (err) {
      const msg = err?.message || 'Something went wrong. Please try again.';
      setStatus({ type: 'error', message: msg });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full py-8">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="mx-auto max-w-3xl"
      >
        {/* Card */}
        <div className="relative overflow-hidden rounded-2xl border border-zinc-200/70 bg-white/70 p-6 shadow-xl backdrop-blur dark:border-zinc-800 dark:bg-zinc-900/70">
          {/* Accent gradient strip */}
          <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-indigo-500 via-sky-500 to-teal-500" />

          <div className="mb-6">
            <h2 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
              Contact Us
            </h2>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              Have a question or idea? Send us a note and we’ll get back to you.
            </p>
          </div>

          {status && (
            <div
              role="alert"
              className={[
                'mb-4 rounded-xl px-4 py-3 text-sm',
                status.type === 'success'
                  ? 'bg-emerald-50 text-emerald-900 ring-1 ring-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-200 dark:ring-emerald-900'
                  : 'bg-rose-50 text-rose-900 ring-1 ring-rose-200 dark:bg-rose-950/40 dark:text-rose-200 dark:ring-rose-900',
              ].join(' ')}
            >
              {status.message}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {/* Name */}
              <div className="flex flex-col">
                <label htmlFor="name" className="mb-1 text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Name <span className="text-rose-500">*</span>
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  required
                  value={values.name}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-zinc-900 outline-none ring-0 transition focus:border-transparent focus:ring-2 focus:ring-indigo-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                  placeholder="Ada Lovelace"
                />
                {errors.name && (
                  <span className="mt-1 text-xs text-rose-500">{errors.name}</span>
                )}
              </div>

              {/* Email */}
              <div className="flex flex-col">
                <label htmlFor="email" className="mb-1 text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Email <span className="text-rose-500">*</span>
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={values.email}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-zinc-900 outline-none transition focus:border-transparent focus:ring-2 focus:ring-indigo-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                  placeholder="ada@example.com"
                />
                {errors.email && (
                  <span className="mt-1 text-xs text-rose-500">{errors.email}</span>
                )}
              </div>

              {/* Phone */}
              <div className="flex flex-col md:col-span-2">
                <label htmlFor="contactNumber" className="mb-1 text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Contact number <span className="text-zinc-400">(optional)</span>
                </label>
                <input
                  id="contactNumber"
                  name="contactNumber"
                  type="tel"
                  inputMode="tel"
                  maxLength={15}
                  value={values.contactNumber}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-zinc-900 outline-none transition focus:border-transparent focus:ring-2 focus:ring-indigo-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                  placeholder="e.g., +91 98765 43210"
                />
                {errors.contactNumber && (
                  <span className="mt-1 text-xs text-rose-500">{errors.contactNumber}</span>
                )}
              </div>

              {/* Message */}
              <div className="flex flex-col md:col-span-2">
                <label htmlFor="text" className="mb-1 text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Message <span className="text-rose-500">*</span>
                </label>
                <textarea
                  id="text"
                  name="text"
                  required
                  rows={6}
                  maxLength={10000}
                  value={values.text}
                  onChange={handleChange}
                  className="w-full resize-y rounded-xl border border-zinc-300 bg-white px-3 py-2 leading-relaxed text-zinc-900 outline-none transition focus:border-transparent focus:ring-2 focus:ring-indigo-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                  placeholder="Tell us a bit about what you need…"
                />
                <div className="mt-1 flex items-center justify-between text-xs">
                  {errors.text ? (
                    <span className="text-rose-500">{errors.text}</span>
                  ) : (
                    <span className="text-zinc-500 dark:text-zinc-400">We usually reply within 1–2 business days.</span>
                  )}
                  <span className="tabular-nums text-zinc-500 dark:text-zinc-400">{remaining} left</span>
                </div>
              </div>
            </div>

            <div className="mt-6 flex items-center gap-3">
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center justify-center rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white shadow-lg shadow-indigo-600/20 transition hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-indigo-500 dark:hover:bg-indigo-400"
              >
                {submitting ? (
                  <span className="inline-flex items-center gap-2">
                    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" aria-hidden="true">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" opacity="0.25" />
                      <path d="M22 12a10 10 0 0 1-10 10" fill="none" stroke="currentColor" strokeWidth="4" />
                    </svg>
                    Sending…
                  </span>
                ) : (
                  'Send message'
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  setValues({ name: '', email: '', contactNumber: '', text: '' });
                  setErrors({});
                  setStatus(null);
                }}
                className="rounded-xl border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-zinc-300 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
              >
                Reset
              </button>
            </div>
          </form>
        </div>

        {/* Footer note */}
        <p className="mx-auto mt-4 max-w-2xl text-center text-xs text-zinc-500 dark:text-zinc-400">
          By sending this form you consent to us storing your details for the purpose of replying to your inquiry.
        </p>
      </motion.div>
    </div>
  );
}
