"use client";

import { AlertTriangle, Bell, CheckCheck, Lightbulb, Sparkles, Wrench, X } from "lucide-react";

const typeStyles = {
  New: { icon: Sparkles, className: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-900" },
  Improvement: { icon: Lightbulb, className: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-900" },
  Fixed: { icon: Wrench, className: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-900" },
  Important: { icon: AlertTriangle, className: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-900" },
};

export default function WhatsNewPanel({ open, onClose, announcements, unreadCount, onMarkAllRead }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[60] overflow-hidden">
      <button type="button" aria-label="Close announcements" onClick={onClose} className="absolute inset-0 h-full w-full bg-slate-950/40 backdrop-blur-sm" />
      <aside className="absolute inset-y-0 right-0 flex w-full max-w-md flex-col border-l border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900" aria-label="What's new announcements">
        <header className="flex items-center justify-between border-b border-slate-200 px-5 py-4 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <span className="rounded-xl bg-rose-50 p-2 text-rose-600 dark:bg-rose-950/50 dark:text-rose-300"><Bell size={21} /></span>
            <div><h2 className="text-lg font-bold text-slate-900 dark:text-white">What&apos;s new</h2><p className="text-xs text-slate-500">Recent CoopPilot announcements</p></div>
          </div>
          <button type="button" onClick={onClose} className="rounded-full p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800" aria-label="Close"><X size={20}/></button>
        </header>
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3 dark:border-slate-800">
          <span className="text-sm text-slate-500">{unreadCount ? `${unreadCount} unread` : "You're all caught up"}</span>
          <button type="button" disabled={!unreadCount} onClick={onMarkAllRead} className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold text-blue-600 hover:bg-blue-50 disabled:cursor-default disabled:opacity-40 dark:text-blue-400 dark:hover:bg-blue-950/40"><CheckCheck size={16}/>Mark all as read</button>
        </div>
        <div className="flex-1 space-y-4 overflow-y-auto p-5">
          {!announcements.length && <div className="py-16 text-center"><Bell className="mx-auto text-slate-300" size={34}/><p className="mt-3 text-sm text-slate-500">No announcements yet.</p></div>}
          {announcements.map((item) => {
            const style = typeStyles[item.type] || typeStyles.New;
            const Icon = style.icon;
            return <article key={item._id} className="rounded-2xl border border-slate-200 p-5 shadow-sm dark:border-slate-800 dark:bg-slate-800/40">
              <div className="flex items-center justify-between gap-3"><span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${style.className}`}><Icon size={13}/>{item.type}</span><time className="text-xs text-slate-400">{new Date(item.publishedAt).toLocaleDateString()}</time></div>
              <h3 className="mt-4 text-base font-bold text-slate-900 dark:text-white">{item.title}</h3>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600 dark:text-slate-300">{item.message}</p>
            </article>;
          })}
        </div>
      </aside>
    </div>
  );
}
