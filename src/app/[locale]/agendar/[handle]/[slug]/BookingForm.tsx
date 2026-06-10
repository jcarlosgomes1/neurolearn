'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from '@/i18n/routing';
import { useTranslations, useLocale } from 'next-intl';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { ChevronLeft, ChevronRight, Clock, MapPin, Loader2 } from 'lucide-react';

interface Host { id: string; name: string; handle: string; avatar_url: string | null; bio: string | null; timezone: string; role: string }
interface Link { id: string; slug: string; title: string; description: string | null; duration_min: number; price_cents: number; currency: string; location_type: string }
interface Slot { start: string; end: string; date: string; time: string }

function startOfWeek(d: Date): Date { const x = new Date(d); const day = x.getDay(); x.setDate(x.getDate() - day); x.setHours(0,0,0,0); return x; }
function addDays(d: Date, n: number): Date { const x = new Date(d); x.setDate(x.getDate() + n); return x; }
function fmtDay(d: Date): string { return d.toISOString().slice(0, 10); }
function fmtDayLabel(d: Date, locale: string): string { return d.toLocaleDateString(locale, { weekday: 'short', day: 'numeric', month: 'short' }); }

export function BookingForm({ host, link }: { host: Host; link: Link }) {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()));
  const [slotsByDay, setSlotsByDay] = useState<Record<string, Slot[]>>({});
  const [loading, setLoading] = useState(true);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const days = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)), [weekStart]);

  useEffect(() => {
    setLoading(true);
    (async () => {
      try {
        const sb = createClient();
        const from = fmtDay(weekStart);
        const to = fmtDay(addDays(weekStart, 6));
        const { data, error } = await sb.rpc('nl_scheduling_available_slots', {
          p_link_id: link.id, p_from_date: from, p_to_date: to,
        });
        if (error || !(data as any)?.ok) { setSlotsByDay({}); return; }
        const grouped: Record<string, Slot[]> = {};
        ((data as any).slots as Slot[]).forEach((s) => {
          if (!grouped[s.date]) grouped[s.date] = [];
          grouped[s.date].push(s);
        });
        setSlotsByDay(grouped);
      } finally { setLoading(false); }
    })();
  }, [weekStart, link.id]);

  async function submit() {
    if (submitting || !selectedSlot) return;
    if (!name.trim() || !email.includes('@')) { toast.error(t('sched.err_name_email')); return; }
    setSubmitting(true);
    try {
      const sb = createClient();
      const { data, error } = await sb.rpc('nl_scheduling_create_booking', {
        p_link_id: link.id, p_slot_iso: selectedSlot.start,
        p_guest_name: name.trim(), p_guest_email: email.trim().toLowerCase(),
        p_guest_phone: phone.trim() || null, p_guest_notes: notes.trim() || null,
      });
      if (error || !(data as any)?.ok) {
        toast.error(error?.message || (data as any)?.error || t('sched.err_create_booking'));
        setSubmitting(false);
        return;
      }
      // Email confirmação é enviado pelo trigger BD automaticamente
      const token = (data as any).manage_token;
      router.push(`/agendar/sucesso/${token}` as any);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t('sched.err'));
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      {/* Host card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 mb-4">
        <div className="flex items-start gap-4">
          {host.avatar_url ? (
            <img src={host.avatar_url} alt={host.name} className="w-14 h-14 rounded-full object-cover" />
          ) : (
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-brand-500 to-violet-600 text-white text-lg font-bold flex items-center justify-center flex-shrink-0">
              {host.name?.[0]?.toUpperCase() || '?'}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <div className="text-xs uppercase tracking-wider text-slate-500 font-semibold">{t('sched.public.with')}</div>
            <h1 className="font-bold text-slate-900 text-lg leading-tight">{host.name}</h1>
            {host.bio && <p className="text-sm text-slate-600 mt-1.5 line-clamp-2">{host.bio}</p>}
          </div>
        </div>

        <div className="mt-5 pt-5 border-t border-slate-100">
          <h2 className="font-bold text-slate-900">{link.title}</h2>
          {link.description && <p className="text-sm text-slate-600 mt-1">{link.description}</p>}
          <div className="mt-3 flex flex-wrap gap-2 text-xs">
            <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-700 px-2 py-1 rounded-full">
              <Clock className="h-3 w-3" /> {link.duration_min} min
            </span>
            <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-700 px-2 py-1 rounded-full">
              <MapPin className="h-3 w-3" /> {link.location_type === 'video' ? t('sched.loc_video') : link.location_type === 'phone' ? t('sched.loc_phone') : t('sched.loc_inperson')}
            </span>
            <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full font-semibold">
              {link.price_cents > 0 ? `${(link.price_cents/100).toFixed(2)} ${link.currency}` : t('sched.link.free')}
            </span>
          </div>
        </div>
      </div>

      {/* Pick slot */}
      {!selectedSlot ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6">
          <h2 className="font-bold text-slate-900 mb-4">{t('sched.public.pick_slot')}</h2>
          <div className="flex items-center justify-between mb-4">
            <button onClick={() => setWeekStart(addDays(weekStart, -7))} className="p-2 rounded-lg hover:bg-slate-100"><ChevronLeft className="h-4 w-4" /></button>
            <div className="text-sm font-medium text-slate-700">
              {weekStart.toLocaleDateString(locale, { day: 'numeric', month: 'short' })} — {addDays(weekStart, 6).toLocaleDateString(locale, { day: 'numeric', month: 'short', year: 'numeric' })}
            </div>
            <button onClick={() => setWeekStart(addDays(weekStart, 7))} className="p-2 rounded-lg hover:bg-slate-100"><ChevronRight className="h-4 w-4" /></button>
          </div>

          {loading ? (
            <div className="py-10 flex items-center justify-center text-slate-400"><Loader2 className="h-5 w-5 animate-spin" /></div>
          ) : (
            <div className="space-y-3">
              {days.map((d) => {
                const key = fmtDay(d);
                const slots = slotsByDay[key] || [];
                return (
                  <div key={key} className="border-b border-slate-100 pb-3 last:border-0">
                    <div className="text-xs font-semibold text-slate-700 uppercase tracking-wide mb-2">{fmtDayLabel(d, locale)}</div>
                    {slots.length === 0 ? (
                      <div className="text-xs text-slate-400 italic">{t('sched.public.no_slots')}</div>
                    ) : (
                      <div className="flex flex-wrap gap-1.5">
                        {slots.map((s) => (
                          <button key={s.start} onClick={() => setSelectedSlot(s)}
                            className="text-sm px-3 py-2 rounded-lg border-2 border-slate-200 hover:border-brand-500 hover:bg-brand-50 text-slate-700 font-medium transition-colors">
                            {s.time}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6">
          <button onClick={() => setSelectedSlot(null)} className="text-sm text-slate-500 hover:text-slate-700 mb-4 inline-flex items-center gap-1">
            <ChevronLeft className="h-4 w-4" /> {t('btn.back')}
          </button>
          <h2 className="font-bold text-slate-900 mb-1">{t('sched.public.your_info')}</h2>
          <div className="text-sm text-brand-700 font-medium mb-4">
            {new Date(selectedSlot.start).toLocaleString(locale, { dateStyle: 'full', timeStyle: 'short' })}
          </div>
          <div className="space-y-3">
            <div><label className="label">{t('sched.f_name')}</label><input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder={t('sched.f_name_ph')} /></div>
            <div><label className="label">{t('sched.f_email')}</label><input type="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@exemplo.com" /></div>
            <div><label className="label">{t('sched.f_phone')}</label><input type="tel" className="input" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+351 912 345 678" /></div>
            <div><label className="label">{t('sched.public.notes_label')}</label><textarea className="input min-h-[100px]" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder={t('sched.public.notes_ph')} /></div>
          </div>
          <button onClick={submit} disabled={submitting} className="mt-5 w-full bg-gradient-to-r from-brand-600 to-violet-600 hover:opacity-90 text-white font-semibold py-3 rounded-lg shadow disabled:opacity-50">
            {submitting ? '…' : t('sched.public.confirm')}
          </button>
        </div>
      )}
    </div>
  );
}
