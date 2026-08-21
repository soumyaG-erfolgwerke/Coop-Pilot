"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertTriangle, Clock3, Eye, EyeOff, LogOut, Play, RefreshCcw, RefreshCw, ShieldCheck } from "lucide-react";
import WhatsNewManager from "@/components/dev-console/WhatsNewManager";

// Temporary UI switch. Set to true to restore Monitoring, Issues, Reset demo,
// and the pre-monitoring customer rollout confirmation without restoring code.
const DEV_MONITORING_UI_ENABLED = false;
const tabs = [
  "Features",
  "What's new",
  ...(DEV_MONITORING_UI_ENABLED ? ["Monitoring", "Issues", "Reset demo"] : []),
];

async function api(path, options) {
  const response = await fetch(path, { ...options, headers: { "content-type": "application/json", ...(options?.headers || {}) } });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || `Request failed (${response.status})`);
  return data;
}

export default function DevConsolePage() {
  const [authenticated, setAuthenticated] = useState(null);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [activeTab, setActiveTab] = useState("Features");
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [now, setNow] = useState(new Date());
  const [resetConfirmation, setResetConfirmation] = useState("");
  const [resetResult, setResetResult] = useState(null);
  const [showLastLogs, setShowLastLogs] = useState(false);

  const refresh = useCallback(async () => {
    try { setData(await api("/api/dev-console/state")); setAuthenticated(true); }
    catch (caught) { if (/UNAUTHORIZED|401/i.test(caught.message)) setAuthenticated(false); else setError(caught.message); }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);
  useEffect(() => {
    const clock = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(clock);
  }, []);
  useEffect(() => {
    if (!authenticated) return undefined;
    const poll = setInterval(refresh, data?.runtime?.running ? 1000 : 5000);
    return () => clearInterval(poll);
  }, [authenticated, data?.runtime?.running, refresh]);

  const testedFeatures = useMemo(() => new Set(data?.lastRun?.testedFeatureKeys || []), [data?.lastRun]);
  const newFeatures = data?.features?.filter((feature) => !testedFeatures.has(feature.key)) || [];

  async function act(callback) {
    setBusy(true); setError("");
    try { await callback(); await refresh(); } catch (caught) { setError(caught.message); }
    finally { setBusy(false); }
  }

  if (authenticated === null) return <main className="min-h-screen grid place-items-center bg-slate-950 text-white">Loading...</main>;
  if (!authenticated) return (
    <main className="min-h-screen grid place-items-center bg-slate-950 px-4 text-slate-100">
      <form className="w-full max-w-sm rounded-2xl border border-slate-800 bg-slate-900 p-7 shadow-2xl" onSubmit={(event) => { event.preventDefault(); act(async () => { await api('/api/dev-console/auth', { method: 'POST', body: JSON.stringify({ password }) }); setAuthenticated(true); }); }}>
        <ShieldCheck className="mb-4 h-9 w-9 text-cyan-400" />
        <h1 className="text-2xl font-semibold">Development console</h1>
        <p className="mt-2 text-sm text-slate-400">Restricted operational access. Demo users still sign in through the normal application.</p>
        <label className="mt-6 block text-sm text-slate-300">Console password</label>
        <div className="relative mt-2">
          <input autoFocus type={showPassword ? "text" : "password"} value={password} onChange={(event) => setPassword(event.target.value)} className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 pr-11 text-slate-100 caret-cyan-400 outline-none focus:border-cyan-500" />
          <button type="button" onClick={() => setShowPassword((visible) => !visible)} aria-label={showPassword ? "Hide password" : "Show password"} title={showPassword ? "Hide password" : "Show password"} className="absolute inset-y-0 right-0 grid w-11 place-items-center text-slate-400 hover:text-slate-100 focus:outline-none">
            {showPassword ? <EyeOff size={19} /> : <Eye size={19} />}
          </button>
        </div>
        {error && <p className="mt-3 text-sm text-rose-400">{error}</p>}
        <button disabled={busy} className="mt-5 w-full rounded-lg bg-cyan-500 px-4 py-2.5 font-medium text-slate-950 disabled:opacity-50">{busy ? 'Checking...' : 'Open console'}</button>
      </form>
    </main>
  );

  const runtime = data?.runtime || {};
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-6xl px-5 py-8">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div><p className="text-xs font-semibold uppercase tracking-[.25em] text-cyan-400">CoopPilot operations</p><h1 className="mt-1 text-3xl font-semibold">Development console</h1></div>
          <button onClick={() => act(async () => { await api('/api/dev-console/auth', { method: 'DELETE' }); setAuthenticated(false); })} className="flex items-center gap-2 rounded-lg border border-slate-700 px-3 py-2 text-sm"><LogOut size={16}/> Sign out</button>
        </header>
        <nav className="mt-8 flex gap-2 border-b border-slate-800">
          {tabs.map((tab) => <button key={tab} onClick={() => setActiveTab(tab)} className={`px-4 py-3 text-sm font-medium ${activeTab === tab ? 'border-b-2 border-cyan-400 text-white' : 'text-slate-400'}`}>{tab}{tab === 'Issues' && data?.issues?.some((issue) => issue.status === 'Open') ? <span className="ml-2 rounded-full bg-rose-500 px-2 py-0.5 text-xs text-white">{data.issues.filter((issue) => issue.status === 'Open').length}</span> : null}</button>)}
        </nav>
        {error && <div className="mt-5 rounded-lg border border-rose-900 bg-rose-950/40 px-4 py-3 text-sm text-rose-300">{error}</div>}

        {activeTab === 'Features' && <section className="mt-6 overflow-hidden rounded-xl border border-slate-800 bg-slate-900">
          <table className="w-full text-left text-sm"><thead className="bg-slate-900/80 text-slate-400"><tr><th className="px-5 py-4">Feature name</th><th className="px-5 py-4">Added date</th><th className="px-5 py-4 text-center">Demo</th><th className="px-5 py-4 text-right">Customers</th></tr></thead><tbody className="divide-y divide-slate-800">{data?.features?.map((feature) => <tr key={feature.key}><td className="px-5 py-4 font-medium">{feature.name}</td><td className="px-5 py-4 text-slate-300">{feature.addedAt}</td><td className="px-5 py-4"><div className="flex justify-center"><FeatureToggle label={`${feature.name} for demo tenants`} enabled={feature.demoEnabled} disabled={busy} onChange={() => act(() => api(`/api/dev-console/features/${feature.key}`, { method: 'PATCH', body: JSON.stringify({ audience: 'demo', enabled: !feature.demoEnabled }) }))} /></div></td><td className="px-5 py-4"><div className="flex justify-end"><FeatureToggle label={`${feature.name} for customer tenants`} enabled={feature.customerEnabled} disabled={busy} onChange={() => { if (DEV_MONITORING_UI_ENABLED && !feature.customerEnabled && !testedFeatures.has(feature.key) && !window.confirm('This feature has not passed monitoring yet. Turn it on for real customers anyway?')) return; act(() => api(`/api/dev-console/features/${feature.key}`, { method: 'PATCH', body: JSON.stringify({ audience: 'customers', enabled: !feature.customerEnabled }) })); }} /></div></td></tr>)}{data?.features?.length === 0 && <tr><td colSpan="4" className="px-5 py-14 text-center text-slate-500">No new features have been added.</td></tr>}</tbody></table>
        </section>}

        {activeTab === "What's new" && <WhatsNewManager />}

        {DEV_MONITORING_UI_ENABLED && activeTab === 'Monitoring' && <section className="mt-6 space-y-5">
          <div className="grid gap-4 md:grid-cols-3"><Card label="India time" value={new Intl.DateTimeFormat('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true }).format(now)} icon={<Clock3/>}/><Card label="Auto monitoring" value={data?.autoMonitoringEnabled ? 'ON' : 'OFF'} icon={<RefreshCw/>}/><Card label="Open issues" value={String(data?.issues?.filter((issue) => issue.status === 'Open').length || 0)} icon={<AlertTriangle/>}/></div>
          {newFeatures.length > 0 && <div className="rounded-xl border border-amber-800 bg-amber-950/30 p-4"><p className="font-medium text-amber-200">{newFeatures.length} new feature{newFeatures.length === 1 ? '' : 's'} available for monitoring</p><div className="mt-3 flex flex-wrap gap-2">{newFeatures.map((feature) => <button key={feature.key} disabled={runtime.running || busy} onClick={() => act(() => api('/api/dev-console/monitor', { method: 'POST', body: JSON.stringify({ featureKey: feature.key }) }))} className="rounded-lg bg-amber-400 px-3 py-2 text-sm font-medium text-slate-950 disabled:opacity-50">Test {feature.name}</button>)}</div></div>}
          <div className="rounded-xl border border-slate-800 bg-slate-900 p-5"><div className="flex flex-wrap items-end justify-between gap-4"><div className="flex flex-wrap items-end gap-4"><label className="text-sm text-slate-300">Daily run time (IST)<input type="time" value={data?.monitoringTime || '02:00'} onChange={(event) => act(() => api('/api/dev-console/state', { method: 'PATCH', body: JSON.stringify({ enabled: data.autoMonitoringEnabled, time: event.target.value }) }))} className="mt-2 block rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 [color-scheme:dark]" /></label><button onClick={() => act(() => api('/api/dev-console/state', { method: 'PATCH', body: JSON.stringify({ enabled: !data.autoMonitoringEnabled, time: data.monitoringTime }) }))} className="rounded-lg border border-slate-700 px-4 py-2.5 text-sm">Turn auto monitor {data?.autoMonitoringEnabled ? 'OFF' : 'ON'}</button></div><button disabled={runtime.running || busy} onClick={() => act(() => api('/api/dev-console/monitor', { method: 'POST', body: '{}' }))} className="flex items-center gap-2 rounded-lg bg-cyan-500 px-4 py-2.5 font-medium text-slate-950 disabled:opacity-50"><Play size={17}/> Run full now</button></div>
            {runtime.running && <div className="mt-6"><div className="mb-2 flex justify-between text-sm"><span>{runtime.currentTest || 'Preparing demo data...'}</span><span>{runtime.progress}%</span></div><div className="h-2 overflow-hidden rounded-full bg-slate-800"><div className="h-full bg-cyan-400 transition-all" style={{ width: `${runtime.progress}%` }}/></div><div className="mt-4 max-h-64 overflow-auto rounded-lg bg-slate-950 p-3 font-mono text-xs">{runtime.logs?.map((entry, index) => <p key={`${entry.time}-${index}`} className={entry.level === 'error' ? 'text-rose-300' : entry.level === 'success' ? 'text-emerald-300' : 'text-slate-400'}>{new Date(entry.time).toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata' })} {entry.message}</p>)}</div></div>}
          </div>
          {!runtime.running && data?.lastRun && <div className="rounded-xl border border-slate-800 bg-slate-900 p-5"><div className="flex flex-wrap items-center justify-between gap-3"><h2 className="font-semibold">Last run summary</h2><button type="button" onClick={() => setShowLastLogs((visible) => !visible)} className="rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-200 hover:border-slate-600 hover:bg-slate-800">{showLastLogs ? 'Hide logs' : 'Show logs'}</button></div><div className="mt-4 grid gap-3 text-sm sm:grid-cols-5"><Summary label="Time" value={new Date(data.lastRun.completedAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}/><Summary label="Duration" value={`${Math.round(data.lastRun.durationMs / 1000)}s`}/><Summary label="Completed" value={data.lastRun.testsCompleted}/><Summary label="Passed" value={data.lastRun.passed}/><Summary label="Issues" value={data.lastRun.issuesFound}/></div>{showLastLogs && <LogPanel logs={data.lastRun.logs || runtime.logs || []} />}</div>}
        </section>}

        {DEV_MONITORING_UI_ENABLED && activeTab === 'Issues' && <section className="mt-6 overflow-hidden rounded-xl border border-slate-800 bg-slate-900"><table className="w-full text-left text-sm"><thead className="text-slate-400"><tr><th className="px-5 py-4">Issue name</th><th className="px-5 py-4">Time</th><th className="px-5 py-4 text-right">Status</th></tr></thead><tbody className="divide-y divide-slate-800">{data?.issues?.map((issue) => {
          const resolved = issue.status === 'Resolved';
          return <tr key={issue.testKey}><td className="px-5 py-4 font-medium">{issue.name}</td><td className="px-5 py-4 text-slate-300">{new Date(issue.time).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}</td><td className="px-5 py-4"><div className="flex items-center justify-end gap-3"><span className={resolved ? 'text-emerald-300' : 'text-rose-300'}>{issue.status}</span><button type="button" role="switch" aria-checked={resolved} aria-label={`${issue.name}: ${issue.status}`} disabled={resolved || runtime.running || busy} title={resolved ? 'Resolved issues remain in history' : 'Rerun this test and resolve only if it passes'} onClick={() => act(() => api(`/api/dev-console/issues/${issue.testKey}/resolve`, { method: 'POST' }))} className={`relative h-7 w-12 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:cursor-default ${resolved ? 'bg-emerald-500' : 'bg-rose-900'}`}><span className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-transform ${resolved ? 'left-6' : 'left-1'}`} /></button></div></td></tr>;
        })}{!data?.issues?.length && <tr><td colSpan="3" className="px-5 py-12 text-center text-slate-500">No issues recorded.</td></tr>}</tbody></table></section>}

        {DEV_MONITORING_UI_ENABLED && activeTab === 'Reset demo' && <section className="mt-6 max-w-2xl rounded-xl border border-amber-900/70 bg-slate-900 p-6">
          <div className="flex items-start gap-4"><span className="rounded-lg bg-amber-950 p-2 text-amber-300"><RefreshCcw size={22}/></span><div><h2 className="text-lg font-semibold">Reset demo environment</h2><p className="mt-2 text-sm leading-6 text-slate-400">Restore the dedicated demo cooperative, demo audit organisation and all demo accounts to their original test data. Real customer cooperatives are outside the reset allowlist and cannot be changed here.</p></div></div>
          <label className="mt-6 block text-sm text-slate-300">Type <span className="font-semibold text-amber-300">RESET</span> to confirm<input value={resetConfirmation} onChange={(event) => { setResetConfirmation(event.target.value); setResetResult(null); }} autoComplete="off" spellCheck="false" placeholder="RESET" className="mt-2 block w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-slate-100 outline-none focus:border-amber-500" /></label>
          <button type="button" disabled={busy || runtime.running || resetConfirmation !== 'RESET'} onClick={() => act(async () => { const result = await api('/api/dev-console/reset', { method: 'POST', body: JSON.stringify({ confirmation: resetConfirmation }) }); setResetResult(result); setResetConfirmation(''); })} className="mt-4 flex items-center gap-2 rounded-lg bg-amber-400 px-4 py-2.5 font-medium text-slate-950 disabled:cursor-not-allowed disabled:opacity-40"><RefreshCcw size={17}/>{busy ? 'Resetting...' : runtime.running ? 'Monitoring in progress' : 'Reset demo data'}</button>
          {resetResult && <div className="mt-5 rounded-lg border border-emerald-900 bg-emerald-950/30 p-4 text-sm text-emerald-200"><p className="font-medium">Demo environment reset successfully.</p><p className="mt-1 text-emerald-300/80">Baseline {resetResult.baselineVersion}: restored {resetResult.restored} records, removed {resetResult.deleted} temporary records, and refreshed {resetResult.accounts} demo accounts.</p></div>}
        </section>}
      </div>
    </main>
  );
}

function Card({ label, value, icon }) { return <div className="rounded-xl border border-slate-800 bg-slate-900 p-5"><div className="flex items-center justify-between text-slate-400"><span className="text-sm">{label}</span><span className="h-5 w-5">{icon}</span></div><p className="mt-3 text-2xl font-semibold">{value}</p></div>; }
function FeatureToggle({ label, enabled, disabled, onChange }) { return <button type="button" role="switch" aria-checked={enabled} aria-label={label} disabled={disabled} onClick={onChange} className={`relative h-8 w-16 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:opacity-50 ${enabled ? 'bg-emerald-500' : 'bg-slate-700'}`}><span className={`absolute top-1 h-6 w-6 rounded-full bg-white shadow transition-transform ${enabled ? 'left-9' : 'left-1'}`} /><span className={`absolute inset-y-0 text-[9px] font-bold ${enabled ? 'left-2 text-slate-950' : 'right-2 text-slate-300'}`}>{enabled ? 'ON' : 'OFF'}</span></button>; }
function Summary({ label, value }) { return <div><p className="text-slate-500">{label}</p><p className="mt-1 font-medium text-slate-200">{value}</p></div>; }
function LogPanel({ logs }) { return <div className="mt-5 max-h-80 overflow-auto rounded-lg border border-slate-800 bg-slate-950 p-3 font-mono text-xs">{logs.length ? logs.map((entry, index) => <p key={`${entry.time}-${index}`} className={`py-0.5 ${entry.level === 'error' ? 'text-rose-300' : entry.level === 'success' ? 'text-emerald-300' : 'text-slate-400'}`}>{new Date(entry.time).toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata' })} {entry.message}</p>) : <p className="text-slate-500">No logs are available for this run.</p>}</div>; }
