"use client";
import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getAllContactUs } from '../../lib/contactUsService';

/**
 * ContactUsTable
 * - Fetches Contact Us docs and displays a table: name, email, truncated text
 * - Click row to open a modal with full details
 * - Basic pagination + optional search
 *
 * Props:
 *  - pageSize?: number (default 10)
 *  - fetcher?: (opts) => Promise<{documents: any[], total: number}> (defaults to getAllContactUs)
 */
export default function ContactUsTable({ pageSize = 10, fetcher = getAllContactUs }) {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selected, setSelected] = useState(null);

  const offset = useMemo(() => page * pageSize, [page, pageSize]);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetcher({ limit: pageSize, offset, search: query || undefined });
      setItems(res.documents || []);
      setTotal(res.total || 0);
    } catch (e) {
      setError(e?.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, pageSize]);

  const handleSearch = async (e) => {
    e.preventDefault();
    setPage(0);
    await load();
  };

  const pages = Math.max(1, Math.ceil(total / pageSize));

  const truncate = (s, n = 64) => {
    if (!s) return '';
    return s.length > n ? s.slice(0, n - 1) + '…' : s;
  };

  return (
    <div className="w-full py-6">
      <div className="mx-auto max-w-6xl">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">Contact Messages</h2>
          <form onSubmit={handleSearch} className="flex w-full gap-2 sm:w-auto">
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search message text…"
              className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none transition focus:border-transparent focus:ring-2 focus:ring-indigo-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 sm:w-64"
            />
            <button
              className="rounded-xl bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-300 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
              type="submit"
              disabled={loading}
            >
              Search
            </button>
          </form>
        </div>

        <div className="overflow-hidden rounded-2xl border border-zinc-200/70 bg-white/70 shadow-xl backdrop-blur dark:border-zinc-800 dark:bg-zinc-900/70">
          <div className="pointer-events-none h-1 w-full bg-gradient-to-r from-indigo-500 via-sky-500 to-teal-500" />

          <div className="relative overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-zinc-50 text-zinc-700 dark:bg-zinc-800/60 dark:text-zinc-300">
                <tr>
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Email</th>
                  <th className="px-4 py-3 font-medium">Message</th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr>
                    <td className="px-4 py-6 text-zinc-500 dark:text-zinc-400" colSpan={3}>Loading…</td>
                  </tr>
                )}
                {error && !loading && (
                  <tr>
                    <td className="px-4 py-6 text-rose-500" colSpan={3}>{error}</td>
                  </tr>
                )}
                {!loading && !error && items.length === 0 && (
                  <tr>
                    <td className="px-4 py-6 text-zinc-500 dark:text-zinc-400" colSpan={3}>No results</td>
                  </tr>
                )}
                {!loading && !error && items.map((it) => (
                  <tr
                    key={it.$id}
                    onClick={() => setSelected(it)}
                    className="cursor-pointer border-t border-zinc-100/70 hover:bg-zinc-50/80 dark:border-zinc-800 dark:hover:bg-zinc-800/50"
                  >
                    <td className="px-4 py-3"><span className="font-medium text-zinc-900 dark:text-zinc-100">{it.name}</span></td>
                    <td className="px-4 py-3"><span className="text-zinc-700 dark:text-zinc-300">{it.email}</span></td>
                    <td className="px-4 py-3"><span className="text-zinc-600 dark:text-zinc-400">{truncate(it.text, 80)}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between gap-3 border-t border-zinc-200/70 px-4 py-3 text-sm dark:border-zinc-800">
            <span className="text-zinc-600 dark:text-zinc-400">
              Page {pages === 0 ? 0 : page + 1} of {pages}
            </span>
            <div className="flex items-center gap-2">
              <button
                className="rounded-xl border border-zinc-300 px-3 py-1.5 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0 || loading}
              >
                Prev
              </button>
              <button
                className="rounded-xl border border-zinc-300 px-3 py-1.5 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
                onClick={() => setPage((p) => (p + 1 < pages ? p + 1 : p))}
                disabled={page + 1 >= pages || loading}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal */}
      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
            onClick={() => setSelected(null)}
          >
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 20, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 24 }}
              className="relative w-full max-w-2xl overflow-hidden rounded-2xl border border-zinc-200/70 bg-white p-6 shadow-2xl dark:border-zinc-800 dark:bg-zinc-900"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-indigo-500 via-sky-500 to-teal-500" />

              <div className="mb-4 flex items-start justify-between gap-4">
                <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Message Details</h3>
                <button
                  onClick={() => setSelected(null)}
                  className="rounded-lg border border-zinc-300 px-2.5 py-1 text-sm text-zinc-700 transition hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
                >
                  Close
                </button>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-xs uppercase tracking-wide text-zinc-500 dark:text-zinc-400">Name</p>
                  <p className="mt-1 font-medium text-zinc-900 dark:text-zinc-100">{selected.name}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-zinc-500 dark:text-zinc-400">Email</p>
                  <p className="mt-1 text-zinc-900 dark:text-zinc-100">{selected.email}</p>
                </div>
                {selected.contactNumber && (
                  <div>
                    <p className="text-xs uppercase tracking-wide text-zinc-500 dark:text-zinc-400">Contact Number</p>
                    <p className="mt-1 text-zinc-900 dark:text-zinc-100">{selected.contactNumber}</p>
                  </div>
                )}
                <div>
                  <p className="text-xs uppercase tracking-wide text-zinc-500 dark:text-zinc-400">Created</p>
                  <p className="mt-1 text-zinc-900 dark:text-zinc-100">{new Date(selected.$createdAt || selected.createdAt).toLocaleString()}</p>
                </div>
              </div>

              <div className="mt-4">
                <p className="text-xs uppercase tracking-wide text-zinc-500 dark:text-zinc-400">Message</p>
                <div className="mt-2 max-h-72 overflow-auto rounded-xl border border-zinc-200 p-3 text-sm leading-relaxed text-zinc-800 dark:border-zinc-800 dark:text-zinc-200">
                  {selected.text}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
