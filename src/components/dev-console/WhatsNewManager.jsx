"use client";

import { useCallback, useEffect, useState } from "react";
import { Archive, Edit3, FileText, Megaphone, Send } from "lucide-react";

const ROLE_OPTIONS = [
  ["all", "All authenticated roles"],
  ["coopadmin", "Cooperative administrators"],
  ["member", "Members"],
  ["org_admin", "Audit organisation administrators"],
  ["auditer", "Lead auditors"],
  ["aud_E", "Sub-auditors"],
  ["superuser", "Superusers"],
  ["superadmin", "Superadmins"],
];
const EMPTY_FORM = { title: "", message: "", type: "New", targetRoles: ["coopadmin"] };

async function request(path, options) {
  const response = await fetch(path, { ...options, headers: { "content-type": "application/json", ...(options?.headers || {}) } });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error || `Request failed (${response.status})`);
  return payload;
}

export default function WhatsNewManager() {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      const payload = await request("/api/dev-console/whats-new");
      setItems(payload.announcements || []);
    } catch (caught) { setError(caught.message); }
  }, []);
  useEffect(() => { load(); }, [load]);

  function toggleRole(role) {
    setForm((current) => {
      if (role === "all") return { ...current, targetRoles: ["all"] };
      const withoutAll = current.targetRoles.filter((item) => item !== "all");
      const targetRoles = withoutAll.includes(role) ? withoutAll.filter((item) => item !== role) : [...withoutAll, role];
      return { ...current, targetRoles };
    });
  }

  async function save(status) {
    setBusy(true); setError("");
    try {
      const body = { ...form, status };
      if (editingId) await request(`/api/dev-console/whats-new/${editingId}`, { method: "PATCH", body: JSON.stringify(body) });
      else await request("/api/dev-console/whats-new", { method: "POST", body: JSON.stringify(body) });
      setForm(EMPTY_FORM); setEditingId(null); await load();
    } catch (caught) { setError(caught.message); }
    finally { setBusy(false); }
  }

  function edit(item) {
    setEditingId(item._id);
    setForm({ title: item.title, message: item.message, type: item.type, targetRoles: item.targetRoles });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function changeStatus(item, status) {
    setBusy(true); setError("");
    try { await request(`/api/dev-console/whats-new/${item._id}`, { method: "PATCH", body: JSON.stringify({ status }) }); await load(); }
    catch (caught) { setError(caught.message); }
    finally { setBusy(false); }
  }

  const valid = form.title.trim() && form.message.trim() && form.targetRoles.length;
  return <section className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
    <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
      <div className="flex items-center gap-3"><span className="rounded-lg bg-cyan-950 p-2 text-cyan-300"><Megaphone size={20}/></span><div><h2 className="font-semibold">{editingId ? "Edit announcement" : "New announcement"}</h2><p className="text-sm text-slate-400">Publish to the separate bell in the application header.</p></div></div>
      {error && <p className="mt-4 rounded-lg border border-rose-900 bg-rose-950/30 p-3 text-sm text-rose-300">{error}</p>}
      <label className="mt-5 block text-sm text-slate-300">Title<input maxLength={120} value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-slate-100 caret-cyan-400 placeholder:text-slate-600 outline-none focus:border-cyan-500" /></label>
      <label className="mt-4 block text-sm text-slate-300">Type<select value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value })} className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-slate-100 [color-scheme:dark]"><option>New</option><option>Improvement</option><option>Fixed</option><option>Important</option></select></label>
      <label className="mt-4 block text-sm text-slate-300">Message<textarea maxLength={2000} rows={7} value={form.message} onChange={(event) => setForm({ ...form, message: event.target.value })} className="mt-2 w-full resize-y rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-slate-100 caret-cyan-400 placeholder:text-slate-600 leading-6 outline-none focus:border-cyan-500" /><span className="mt-1 block text-right text-xs text-slate-500">{form.message.length}/2000</span></label>
      <fieldset className="mt-4"><legend className="text-sm text-slate-300">Show to roles</legend><div className="mt-2 grid gap-2 sm:grid-cols-2">{ROLE_OPTIONS.map(([value, label]) => <label key={value} className="flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-950/60 px-3 py-2 text-sm text-slate-300"><input type="checkbox" checked={form.targetRoles.includes(value)} onChange={() => toggleRole(value)} className="h-4 w-4 accent-cyan-500" />{label}</label>)}</div></fieldset>
      <div className="mt-5 flex flex-wrap gap-3"><button disabled={!valid || busy} onClick={() => save("Draft")} className="inline-flex items-center gap-2 rounded-lg border border-slate-700 px-4 py-2.5 text-sm font-medium disabled:opacity-40"><FileText size={16}/>Save draft</button><button disabled={!valid || busy} onClick={() => save("Published")} className="inline-flex items-center gap-2 rounded-lg bg-cyan-500 px-4 py-2.5 text-sm font-semibold text-slate-950 disabled:opacity-40"><Send size={16}/>{editingId ? "Save and publish" : "Publish now"}</button>{editingId && <button onClick={() => { setEditingId(null); setForm(EMPTY_FORM); }} className="px-3 py-2 text-sm text-slate-400">Cancel</button>}</div>
    </div>
    <div className="rounded-xl border border-slate-800 bg-slate-900 p-6"><h2 className="font-semibold">Announcement history</h2><p className="mt-1 text-sm text-slate-400">Published items stay in history; archive instead of deleting.</p><div className="mt-5 space-y-3">{items.map((item) => <article key={item._id} className="rounded-xl border border-slate-800 bg-slate-950/60 p-4"><div className="flex flex-wrap items-center justify-between gap-2"><div className="flex gap-2"><span className="rounded-full bg-slate-800 px-2.5 py-1 text-xs">{item.type}</span><span className={`rounded-full px-2.5 py-1 text-xs ${item.status === "Published" ? "bg-emerald-950 text-emerald-300" : item.status === "Archived" ? "bg-slate-800 text-slate-400" : "bg-amber-950 text-amber-300"}`}>{item.status}</span></div><span className="text-xs text-slate-500">{new Date(item.publishedAt || item.createdAt).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}</span></div><h3 className="mt-3 font-semibold">{item.title}</h3><p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-slate-400">{item.message}</p><p className="mt-3 text-xs text-slate-500">Roles: {item.targetRoles.join(", ")}</p><div className="mt-3 flex flex-wrap gap-2"><button disabled={busy} onClick={() => edit(item)} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 px-3 py-2 text-xs"><Edit3 size={14}/>Edit</button>{item.status !== "Published" && <button disabled={busy} onClick={() => changeStatus(item, "Published")} className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-700 px-3 py-2 text-xs"><Send size={14}/>Publish</button>}{item.status === "Published" && <button disabled={busy} onClick={() => changeStatus(item, "Archived")} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 px-3 py-2 text-xs"><Archive size={14}/>Archive</button>}</div></article>)}{!items.length && <p className="py-12 text-center text-sm text-slate-500">No bell announcements yet.</p>}</div></div>
  </section>;
}
