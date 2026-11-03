import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bell, CalendarDays, CheckCheck, CheckCircle2, FileText, Search, ShieldCheck, Trash2, Loader2, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { notificationService } from '../../services/notificationService';

// Sample data is clearly labeled and never written to Supabase.
const samples = [
  { id: 'demo-1', type: 'APPOINTMENT', title: 'Appointment reminder', message: 'Demo: Your consultation with Dr. Mehta is scheduled for tomorrow at 10:30 AM.', time: 'Today, 9:30 AM', read: false, link: '/patient/book-appointment' },
  { id: 'demo-2', type: 'DOCUMENT', title: 'Lab report available', message: 'Demo: A new laboratory report is ready to view in Medical Records.', time: 'Today, 8:15 AM', read: false, link: '/patient/records' },
  { id: 'demo-3', type: 'APPOINTMENT', title: 'Appointment confirmed', message: 'Demo: Your recent appointment request has been confirmed.', time: 'Yesterday, 4:20 PM', read: false, link: '/patient/book-appointment' },
  { id: 'demo-4', type: 'SYSTEM', title: 'Welcome to MediConnect Cloud', message: 'Explore your patient dashboard, manage your records and book appointments.', time: 'Yesterday, 11:00 AM', read: true, link: '/patient/dashboard' },
  { id: 'demo-5', type: 'DOCUMENT', title: 'Medical records updated', message: 'Demo: A document has been added to your medical records.', time: 'Monday, 2:45 PM', read: true, link: '/patient/records' },
  { id: 'demo-6', type: 'SYSTEM', title: 'Profile reminder', message: 'Demo: Keep your contact details up to date for important updates.', time: 'Monday, 10:00 AM', read: true, link: '/patient/profile' }
];
const styles = {
  APPOINTMENT: { Icon: CalendarDays, label: 'Appointments', color: 'text-blue-700 bg-blue-50' },
  DOCUMENT: { Icon: FileText, label: 'Medical records', color: 'text-violet-700 bg-violet-50' },
  SYSTEM: { Icon: ShieldCheck, label: 'Account update', color: 'text-teal-700 bg-teal-50' }
};
const keyFor = id => `mediconnect-demo-notifications-${id}`;
export default function PatientNotifications() {
  const { user } = useAuth();
  const [live, setLive] = useState([]);
  const [demo, setDemo] = useState(samples);
  const [showDemo, setShowDemo] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => {
    let active = true;
    setLoading(true); setError(''); setLive([]); setShowDemo(true);
    try { const saved = JSON.parse(localStorage.getItem(keyFor(user?.id || 'guest')) || 'null'); setDemo(Array.isArray(saved) ? saved : samples); }
    catch { setDemo(samples); }
    if (!user?.id) { setLoading(false); return () => { active = false; }; }
    notificationService.getUserNotifications(user.id)
      .then(data => { if (active) setLive(Array.isArray(data) ? data : []); })
      .catch(err => { console.error(err); if (active) setError('Could not load live notifications. Demo items are still available.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [user?.id]);
  const updateDemo = change => setDemo(prev => {
    const next = change(prev);
    try { localStorage.setItem(keyFor(user?.id || 'guest'), JSON.stringify(next)); } catch (err) { console.warn(err); }
    return next;
  });
  const items = useMemo(() => [...live.map(n => ({ ...n, demo: false })), ...(showDemo ? demo.map(n => ({ ...n, demo: true })) : [])], [live, demo, showDemo]);
  const unread = items.filter(n => !n.read).length;
  const visible = items.filter(n => (filter === 'all' || (filter === 'unread' ? !n.read : String(n.type).toUpperCase() === filter)) && `${n.title} ${n.message}`.toLowerCase().includes(search.toLowerCase()));
  const run = async fn => { if (busy) return; setBusy(true); setError(''); try { await fn(); } catch (err) { console.error(err); setError('Could not update notifications. Please try again.'); } finally { setBusy(false); } };
  const markOne = item => run(async () => {
    if (item.demo) updateDemo(prev => prev.map(n => n.id === item.id ? { ...n, read: true } : n));
    else { await notificationService.markAsRead(item.id); setLive(prev => prev.map(n => n.id === item.id ? { ...n, read: true } : n)); }
  });
  const removeOne = item => run(async () => {
    if (item.demo) updateDemo(prev => prev.filter(n => n.id !== item.id));
    else { await notificationService.deleteOne(item.id); setLive(prev => prev.filter(n => n.id !== item.id)); }
  });
  const markAll = () => run(async () => {
    if (user?.id && live.some(n => !n.read)) { await notificationService.markAllAsRead(user.id); setLive(prev => prev.map(n => ({ ...n, read: true }))); }
    if (showDemo) updateDemo(prev => prev.map(n => ({ ...n, read: true })));
  });
  const clearAll = () => {
    if (!window.confirm('Delete all displayed notifications? Live notifications will be permanently deleted.')) return;
    run(async () => {
      if (user?.id && live.length) { await notificationService.clearAll(user.id); setLive([]); }
      if (showDemo) updateDemo(() => []);
    });
  };
  return <div className="mx-auto max-w-6xl space-y-6 py-6 pb-12">
    <header className="rounded-3xl bg-gradient-to-br from-teal-700 via-teal-800 to-slate-900 p-7 text-white shadow-lg md:p-9">
      <div className="flex flex-wrap items-center justify-between gap-6">
        <div><span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-bold"><Bell className="h-4 w-4" /> PATIENT ACTIVITY CENTER</span>
          <h1 className="mt-4 text-3xl font-extrabold md:text-4xl">Notifications</h1>
          <p className="mt-2 max-w-xl text-sm text-teal-100">Your appointments, medical record updates and account alerts in one place.</p></div>
        <div className="flex items-center gap-4 rounded-2xl border border-white/20 bg-white/10 px-5 py-4"><Bell className="h-7 w-7" /><div><div className="text-3xl font-extrabold">{unread}</div><div className="text-xs text-teal-100">Unread alerts</div></div></div>
      </div>
    </header>
    <div className="grid gap-4 sm:grid-cols-3">{[
      ['Total notifications', items.length, Bell, 'bg-teal-50 text-teal-700'],
      ['Unread notifications', unread, CalendarDays, 'bg-amber-50 text-amber-700'],
      ['Read notifications', items.length - unread, CheckCircle2, 'bg-emerald-50 text-emerald-700']
    ].map(([label, value, Icon, color]) => <div key={label} className="flex min-h-28 items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><span className={`rounded-xl p-3 ${color}`}><Icon className="h-6 w-6" /></span><div><p className="text-xs font-semibold text-slate-500">{label}</p><p className="mt-1 text-2xl font-extrabold text-slate-900">{value}</p></div></div>)}</div>
    <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      <div className="space-y-5 border-b border-slate-100 p-5 md:p-7">
        <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-lg font-extrabold text-slate-900">Activity inbox</h2><p className="mt-1 text-xs text-slate-500">Review and manage your latest updates</p></div>
          <div className="flex flex-wrap gap-2"><button disabled={busy || !unread} onClick={markAll} className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40"><CheckCheck className="h-4 w-4" /> Mark all read</button>
          <button disabled={busy || !items.length} onClick={clearAll} className="flex items-center gap-2 rounded-xl border border-red-100 px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-50 disabled:opacity-40"><Trash2 className="h-4 w-4" /> Clear all</button></div></div>
        <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-center"><div className="flex flex-wrap gap-2">{[['all','All'],['unread','Unread'],['APPOINTMENT','Appointments'],['DOCUMENT','Medical records']].map(([value,label]) => <button key={value} onClick={() => setFilter(value)} className={`rounded-xl px-3.5 py-2 text-xs font-bold ${filter === value ? 'bg-teal-700 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>{label}</button>)}</div>
          <label className="relative block w-full lg:max-w-xs"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search notifications..." className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-3 text-sm outline-none focus:border-teal-500" /></label></div>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 bg-slate-50 px-5 py-3 text-xs text-slate-600 md:px-7"><span>Sample notifications are labeled <strong>DEMO</strong> and are not real medical events.</span><div className="flex gap-3">{showDemo && <button onClick={() => updateDemo(() => samples.map(n => ({ ...n })))} className="font-bold text-teal-700 hover:underline">Reset demo</button>}<button onClick={() => setShowDemo(v => !v)} className="rounded-lg border bg-white px-3 py-1.5 font-bold">{showDemo ? 'Hide demo' : 'Show demo'}</button></div></div>
      {error && <div role="alert" className="mx-5 mt-4 flex items-center gap-2 rounded-xl bg-red-50 p-3 text-xs text-red-700"><AlertCircle className="h-4 w-4" />{error}</div>}
      {loading ? <div className="py-20 text-center"><Loader2 className="mx-auto h-7 w-7 animate-spin text-teal-600" /><p className="mt-3 text-sm text-slate-500">Loading notifications...</p></div> : !visible.length ? <div className="py-20 text-center"><CheckCircle2 className="mx-auto h-10 w-10 text-teal-500" /><h3 className="mt-3 font-bold text-slate-900">All caught up!</h3><p className="mt-1 text-sm text-slate-500">No notifications match your filters.</p></div> : <div className="divide-y divide-slate-100">{visible.map(item => {
        const style = styles[String(item.type).toUpperCase()] || styles.SYSTEM; const Icon = style.Icon;
        return <article key={`${item.demo ? 'demo' : 'live'}-${item.id}`} className={`flex flex-col gap-4 px-5 py-5 hover:bg-slate-50 sm:flex-row sm:items-start md:px-7 ${item.read ? '' : 'bg-teal-50/30'}`}>
          <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${style.color}`}><Icon className="h-5 w-5" /></span>
          <div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h3 className="text-sm font-extrabold text-slate-900">{item.title}</h3>{!item.read && <span className="h-2 w-2 rounded-full bg-teal-500" />}{item.demo && <span className="rounded bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800">DEMO</span>}</div><p className="mt-1.5 text-sm leading-relaxed text-slate-600">{item.message}</p><div className="mt-3 flex flex-wrap items-center gap-2"><span className={`rounded-lg px-2.5 py-1 text-[11px] font-bold ${style.color}`}>{style.label}</span><span className="text-xs text-slate-400">{item.time}</span></div></div>
          <div className="flex shrink-0 flex-wrap items-center gap-2">{!item.read && <button disabled={busy} onClick={() => markOne(item)} className="rounded-lg px-2 py-2 text-xs font-bold text-teal-700 hover:bg-teal-50 disabled:opacity-40">Mark read</button>}{item.link && <Link to={item.link} className="rounded-lg px-2 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100">View details</Link>}<button disabled={busy} onClick={() => removeOne(item)} title="Delete notification" aria-label={`Delete ${item.title}`} className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-40"><Trash2 className="h-4 w-4" /></button></div>
        </article>;
      })}</div>}
      <footer className="border-t border-slate-100 px-5 py-4 text-xs text-slate-400 md:px-7">Showing {visible.length} of {items.length} notifications</footer>
    </section>
  </div>;
}
