'use client';

import { useState, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { Plus, Loader2, Calendar, Users, X, UserPlus, Clock, Video, Repeat } from 'lucide-react';

type Cohort = { id: string; name: string; description: string | null; status: string; start_date: string | null; end_date: string | null; max_seats: number | null; members: number; target_title: string | null };
type Member = { user_id: string; name: string | null; email: string };

export function CohortsClient({ orgId, cohorts: initial, members }: { orgId: string; cohorts: Cohort[]; members: Member[] }) {
  const t = useTranslations();
  const supabase = useMemo(() => createClient(), []);
  const [cohorts, setCohorts] = useState<Cohort[]>(initial);
  const [creating, setCreating] = useState(false);
  const [busy, setBusy] = useState(false);
  const [name, setName] = useState('');
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [seats, setSeats] = useState('');
  const [manageId, setManageId] = useState<string | null>(null);
  // F4: horario sincrono (opcional)
  const [sync, setSync] = useState(false);
  const [days, setDays] = useState<string[]>([]);
  const [startTime, setStartTime] = useState('18:00');
  const [durationMin, setDurationMin] = useState('60');
  const [joinUrl, setJoinUrl] = useState('');
  const WEEKDAYS: { key: string; label: string }[] = [
    { key: 'MO', label: t('empresa.cohorts.dow_mo') }, { key: 'TU', label: t('empresa.cohorts.dow_tu') },
    { key: 'WE', label: t('empresa.cohorts.dow_we') }, { key: 'TH', label: t('empresa.cohorts.dow_th') },
    { key: 'FR', label: t('empresa.cohorts.dow_fr') }, { key: 'SA', label: t('empresa.cohorts.dow_sa') },
    { key: 'SU', label: t('empresa.cohorts.dow_su') },
  ];
  function toggleDay(d: string) { setDays((ds) => ds.includes(d) ? ds.filter((x) => x !== d) : [...ds, d]); }
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Europe/Lisbon';

  async function create() {
    if (!name.trim()) return;
    setBusy(true);
    try {
      const rrule = sync && days.length > 0 ? `FREQ=WEEKLY;BYDAY=${days.join(',')}` : null;
      const { data, error } = await supabase.rpc('nl_cohort_create', {
        p_org_id: orgId, p_name: name, p_start: start || null, p_end: end || null,
        p_max_seats: seats ? Number(seats) : null,
        p_schedule_rrule: rrule, p_session_start_time: sync ? startTime : null,
        p_session_duration_min: sync ? Number(durationMin) || 60 : null,
        p_timezone: tz, p_join_url: sync ? (joinUrl || null) : null,
      });
      if (error || !(data as { ok?: boolean })?.ok) throw error || new Error('fail');
      const id = (data as { cohort_id: string }).cohort_id;
      setCohorts((c) => [{ id, name, description: null, status: 'open', start_date: start || null, end_date: end || null, max_seats: seats ? Number(seats) : null, members: 0, target_title: null }, ...c]);
      setName(''); setStart(''); setEnd(''); setSeats(''); setSync(false); setDays([]); setStartTime('18:00'); setDurationMin('60'); setJoinUrl(''); setCreating(false);
      toast.success(t('empresa.cohorts.created'));
    } catch { toast.error(t('empresa.cohorts.error')); }
    finally { setBusy(false); }
  }

  async function addMember(cohortId: string, userId: string) {
    try {
      const { data, error } = await supabase.rpc('nl_cohort_member_add', { p_cohort_id: cohortId, p_user_id: userId });
      if (error) throw error;
      if (!(data as { ok?: boolean })?.ok) { toast.error(t('empresa.cohorts.full')); return; }
      setCohorts((cs) => cs.map((c) => c.id === cohortId ? { ...c, members: c.members + 1 } : c));
      toast.success(t('empresa.cohorts.member_added'));
    } catch { toast.error(t('empresa.cohorts.error')); }
  }

  const STATUS_COLOR: Record<string, string> = {
    open: 'bg-blue-100 text-blue-700', active: 'bg-emerald-100 text-emerald-700',
    completed: 'bg-slate-100 text-slate-600', archived: 'bg-slate-100 text-slate-400',
  };

  return (
    <div className="space-y-4">
      {!creating ? (
        <button onClick={() => setCreating(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-600 text-white text-sm font-medium hover:bg-brand-700">
          <Plus className="h-4 w-4" /> {t('empresa.cohorts.new')}
        </button>
      ) : (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder={t('empresa.cohorts.name_ph')}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-brand-400 outline-none" />
          <div className="grid grid-cols-2 gap-3">
            <label className="text-xs text-slate-500">{t('empresa.cohorts.start')}<input type="date" value={start} onChange={(e) => setStart(e.target.value)} className="w-full mt-1 rounded-lg border border-slate-200 px-3 py-2 text-sm" /></label>
            <label className="text-xs text-slate-500">{t('empresa.cohorts.end')}<input type="date" value={end} onChange={(e) => setEnd(e.target.value)} className="w-full mt-1 rounded-lg border border-slate-200 px-3 py-2 text-sm" /></label>
          </div>
          <input type="number" value={seats} onChange={(e) => setSeats(e.target.value)} placeholder={t('empresa.cohorts.max_seats')}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />

          {/* F4: horario sincrono */}
          <div className="rounded-xl border border-slate-200 p-3">
            <label className="flex items-center justify-between gap-2 cursor-pointer">
              <span className="flex items-center gap-2 text-sm font-medium text-slate-800">
                <Repeat className="h-4 w-4 text-brand-600" /> {t('empresa.cohorts.sync_toggle')}
              </span>
              <input type="checkbox" checked={sync} onChange={(e) => setSync(e.target.checked)} className="h-4 w-4 accent-brand-600" />
            </label>
            <p className="text-xs text-slate-500 mt-1">{t('empresa.cohorts.sync_hint')}</p>
            {sync && (
              <div className="mt-3 space-y-3">
                <div>
                  <div className="text-xs text-slate-500 mb-1.5">{t('empresa.cohorts.sync_days')}</div>
                  <div className="flex flex-wrap gap-1.5">
                    {WEEKDAYS.map((d) => (
                      <button key={d.key} type="button" onClick={() => toggleDay(d.key)}
                        className={`text-xs font-medium px-2.5 py-1.5 rounded-lg border transition-colors ${days.includes(d.key) ? 'bg-brand-600 text-white border-brand-600' : 'border-slate-200 text-slate-600 hover:border-brand-300'}`}>
                        {d.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <label className="text-xs text-slate-500">{t('empresa.cohorts.sync_time')}
                    <div className="flex items-center gap-1.5 mt-1"><Clock className="h-3.5 w-3.5 text-slate-400" />
                      <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className="w-full rounded-lg border border-slate-200 px-2 py-2 text-sm" /></div>
                  </label>
                  <label className="text-xs text-slate-500">{t('empresa.cohorts.sync_duration')}
                    <input type="number" value={durationMin} onChange={(e) => setDurationMin(e.target.value)} min="15" step="15"
                      className="w-full mt-1 rounded-lg border border-slate-200 px-3 py-2 text-sm" /></label>
                </div>
                <label className="text-xs text-slate-500 block">{t('empresa.cohorts.sync_join_url')}
                  <div className="flex items-center gap-1.5 mt-1"><Video className="h-3.5 w-3.5 text-slate-400" />
                    <input value={joinUrl} onChange={(e) => setJoinUrl(e.target.value)} placeholder="https://meet…"
                      className="w-full rounded-lg border border-slate-200 px-2 py-2 text-sm" /></div>
                </label>
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <button onClick={create} disabled={busy || !name.trim()}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-brand-600 text-white text-sm font-medium disabled:opacity-50">
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} {t('empresa.cohorts.create')}
            </button>
            <button onClick={() => setCreating(false)} className="px-4 py-2 rounded-lg border border-slate-200 text-sm text-slate-600">{t('empresa.cohorts.cancel')}</button>
          </div>
        </div>
      )}

      {cohorts.length === 0 ? (
        <div className="text-center py-12 text-slate-400 text-sm">{t('empresa.cohorts.empty')}</div>
      ) : cohorts.map((c) => (
        <div key={c.id} className="bg-white border border-slate-200 rounded-2xl p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-bold text-slate-900">{c.name}</h3>
                <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${STATUS_COLOR[c.status]}`}>{t('empresa.cohorts.status_' + c.status)}</span>
              </div>
              {c.target_title && <div className="text-xs text-slate-500 mt-0.5">{c.target_title}</div>}
              <div className="flex items-center gap-3 mt-2 text-xs text-slate-500">
                {c.start_date && <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {c.start_date}{c.end_date ? ` → ${c.end_date}` : ''}</span>}
                <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {c.members}{c.max_seats ? `/${c.max_seats}` : ''}</span>
              </div>
            </div>
            <button onClick={() => setManageId(manageId === c.id ? null : c.id)}
              className="inline-flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-lg bg-brand-50 text-brand-700 hover:bg-brand-100">
              <UserPlus className="h-3.5 w-3.5" /> {t('empresa.cohorts.manage')}
            </button>
          </div>
          {manageId === c.id && (
            <div className="mt-4 pt-4 border-t border-slate-100">
              <div className="text-xs font-medium text-slate-500 mb-2">{t('empresa.cohorts.add_members')}</div>
              <div className="flex flex-wrap gap-2">
                {members.map((m) => (
                  <button key={m.user_id} onClick={() => addMember(c.id, m.user_id)}
                    className="text-xs px-2.5 py-1 rounded-full border border-slate-200 hover:border-brand-300 hover:bg-brand-50 text-slate-700">
                    {m.name || m.email}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
