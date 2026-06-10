'use client';

import { useState, useEffect, useMemo } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { Calendar as CalIcon, CreditCard, Video, ChevronLeft, ChevronRight, Loader2, Check, X } from 'lucide-react';

interface Booking {
  id: string; guest_name: string; guest_email: string;
  scheduled_at: string; duration_min: number; status: string;
  link_title: string; location_type: string; location_details: string | null;
  meeting_url: string | null; host_name: string; host_handle: string;
  price_cents: number; currency: string; paid_at: string | null;
  cancelled_at: string | null; cancelled_reason: string | null;
}
interface Slot { start: string; end: string; date: string; time: string }

function addDays(d: Date, n: number) { const x = new Date(d); x.setDate(x.getDate() + n); return x; }
function startOfWeek(d: Date) { const x = new Date(d); x.setDate(x.getDate() - x.getDay()); x.setHours(0,0,0,0); return x; }
function fmtDay(d: Date) { return d.toISOString().slice(0, 10); }
function fmtDayLabel(d: Date, locale: string) { return d.toLocaleDateString(locale, { weekday: 'short', day: 'numeric', month: 'short' }); }

export function SuccessClient({ booking: initial, token, initialAction }: { booking: Booking; token: string; initialAction: 'pay' | 'paid_redirect' | null }) {
  const t = useTranslations();
  const locale = useLocale();
  const [booking, setBooking] = useState(initial);
  const [mode, setMode] = useState<'view' | 'reschedule'>('view');
  const [paying, setPaying] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [linkId, setLinkId] = useState<string | null>(null);

  // Reschedule state
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()));
  const [slotsByDay, setSlotsByDay] = useState<Record<string, Slot[]>>({});
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const days = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)), [weekStart]);

  const cancelled = booking.status === 'cancelled';
  const requiresPayment = booking.price_cents > 0 && !booking.paid_at && !cancelled;

  useEffect(() => {
    if (initialAction === 'pay' && requiresPayment) startPayment();
    if (initialAction === 'paid_redirect') {
      // Forçar refresh do booking pelo token
      setTimeout(() => refresh(), 1500);
    }
  }, []);

  useEffect(() => {
    if (mode !== 'reschedule' || !linkId) return;
    setLoadingSlots(true);
    (async () => {
      try {
        const sb = createClient();
        const { data } = await sb.rpc('nl_scheduling_available_slots', {
          p_link_id: linkId, p_from_date: fmtDay(weekStart), p_to_date: fmtDay(addDays(weekStart, 6)),
        });
        const grouped: Record<string, Slot[]> = {};
        ((data as any)?.slots || []).forEach((s: Slot) => { (grouped[s.date] ||= []).push(s); });
        setSlotsByDay(grouped);
      } finally { setLoadingSlots(false); }
    })();
  }, [mode, weekStart, linkId]);

  async function refresh() {
    const sb = createClient();
    const { data } = await sb.rpc('nl_scheduling_booking_by_token', { p_token: token });
    if ((data as any)?.ok) setBooking((data as any).booking);
  }

  async function startPayment() {
    if (paying) return;
    setPaying(true);
    try {
      const sb = createClient();
      const { data, error } = await sb.functions.invoke('payments', { body: { action: 'create_booking_checkout', booking_id: booking.id, manage_token: token } });
      if (error || !(data as any)?.ok) {
        if ((data as any)?.error === 'stripe_not_configured') {
          toast.error(t('sched.pay_soon'));
        } else {
          toast.error(error?.message || (data as any)?.error || t('sched.pay_err'));
        }
        return;
      }
      window.location.href = (data as any).checkout_url;
    } finally { setPaying(false); }
  }

  async function cancel() {
    if (!confirm(t('sched.public.cancel_btn') + '?')) return;
    setCancelling(true);
    try {
      const sb = createClient();
      const { data, error } = await sb.rpc('nl_scheduling_cancel_booking', { p_booking_id: booking.id, p_token: token, p_reason: 'cancelled_by_guest' });
      if (error || !(data as any)?.ok) { toast.error(error?.message || t('sched.err')); return; }
      toast.success(t('sched.public.cancelled'));
      await refresh();
    } finally { setCancelling(false); }
  }

  async function startReschedule() {
    // Precisamos do link_id — pegar via booking_by_token return ou fazer extra fetch
    const sb = createClient();
    // O booking_by_token não devolve link_id, vamos buscar pelo título
    const { data: links } = await sb.from('nl_scheduling_links').select('id, title').limit(50);
    const match = (links || []).find((l: any) => l.title === booking.link_title);
    if (!match) { toast.error(t('sched.link_not_found')); return; }
    setLinkId(match.id);
    setMode('reschedule');
  }

  async function confirmReschedule(slot: Slot) {
    if (submitting) return;
    if (!confirm(t('sched.reschedule_confirm', { date: new Date(slot.start).toLocaleString(locale, { dateStyle: 'full', timeStyle: 'short' }) }))) return;
    setSubmitting(true);
    try {
      const sb = createClient();
      const { data, error } = await sb.rpc('nl_scheduling_reschedule_booking', { p_booking_id: booking.id, p_token: token, p_new_slot_iso: slot.start });
      if (error || !(data as any)?.ok) {
        toast.error(error?.message || (data as any)?.error || t('sched.err'));
        return;
      }
      toast.success(t('sched.rescheduled'));
      setMode('view');
      await refresh();
    } finally { setSubmitting(false); }
  }

  if (mode === 'reschedule') {
    return (
      <div className="max-w-md mx-auto px-4 sm:px-6 py-10">
        <button onClick={() => setMode('view')} className="text-sm text-slate-500 hover:text-slate-700 mb-4 inline-flex items-center gap-1">
          <ChevronLeft className="h-4 w-4" /> {t('btn.back')}
        </button>
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <h2 className="font-bold text-slate-900 mb-1">{t('sched.public.reschedule_title')}</h2>
          <p className="text-xs text-slate-500 mb-4">{t('sched.current_label')} {new Date(booking.scheduled_at).toLocaleString(locale, { dateStyle: 'medium', timeStyle: 'short' })}</p>
          <div className="flex items-center justify-between mb-4">
            <button onClick={() => setWeekStart(addDays(weekStart, -7))} className="p-2 rounded-lg hover:bg-slate-100"><ChevronLeft className="h-4 w-4" /></button>
            <div className="text-sm font-medium text-slate-700">
              {weekStart.toLocaleDateString(locale, { day: 'numeric', month: 'short' })} — {addDays(weekStart, 6).toLocaleDateString(locale, { day: 'numeric', month: 'short' })}
            </div>
            <button onClick={() => setWeekStart(addDays(weekStart, 7))} className="p-2 rounded-lg hover:bg-slate-100"><ChevronRight className="h-4 w-4" /></button>
          </div>
          {loadingSlots ? (
            <div className="py-10 flex items-center justify-center text-slate-400"><Loader2 className="h-5 w-5 animate-spin" /></div>
          ) : (
            <div className="space-y-3">
              {days.map((d) => {
                const key = fmtDay(d);
                const slots = slotsByDay[key] || [];
                if (slots.length === 0) return null;
                return (
                  <div key={key} className="border-b border-slate-100 pb-3 last:border-0">
                    <div className="text-xs font-semibold text-slate-700 uppercase tracking-wide mb-2">{fmtDayLabel(d, locale)}</div>
                    <div className="flex flex-wrap gap-1.5">
                      {slots.map((s) => (
                        <button key={s.start} disabled={submitting} onClick={() => confirmReschedule(s)}
                          className="text-sm px-3 py-2 rounded-lg border-2 border-slate-200 hover:border-brand-500 hover:bg-brand-50 text-slate-700 font-medium transition-colors disabled:opacity-50">
                          {s.time}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto px-4 sm:px-6 py-10 sm:py-16">
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 text-center">
        {cancelled ? (
          <>
            <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-slate-100 flex items-center justify-center"><X className="h-8 w-8 text-slate-400" /></div>
            <h1 className="text-2xl font-bold text-slate-900">{t('sched.public.cancelled')}</h1>
          </>
        ) : (
          <>
            <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-emerald-100 flex items-center justify-center"><Check className="h-8 w-8 text-emerald-600" /></div>
            <h1 className="text-2xl font-bold text-slate-900">{t('sched.public.success_title')}</h1>
            <p className="text-slate-600 mt-2 text-sm">{t('sched.public.success_body')}</p>
          </>
        )}

        <div className="mt-6 p-4 bg-slate-50 rounded-lg text-left space-y-2 text-sm">
          <div className="text-xs text-slate-500">{t('sched.public.with')}</div>
          <div className="font-semibold text-slate-900">{booking.host_name}</div>
          <div className="text-xs text-slate-500 mt-2">{booking.link_title}</div>
          <div className={`font-semibold text-slate-900 ${cancelled ? 'line-through' : ''}`}>
            {new Date(booking.scheduled_at).toLocaleString(locale, { dateStyle: 'full', timeStyle: 'short' })}
          </div>
          <div className="text-xs text-slate-500">{booking.duration_min} min</div>
          {booking.price_cents > 0 && (
            <div className="flex items-center gap-2 pt-2 border-t border-slate-200">
              <CreditCard className="h-3.5 w-3.5 text-slate-400" />
              <span className="text-sm">{(booking.price_cents/100).toFixed(2)} {booking.currency}</span>
              {booking.paid_at ? (
                <span className="ml-auto inline-flex items-center gap-1 text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-semibold">
                  <Check className="h-3 w-3" /> {t('sched.public.paid')}
                </span>
              ) : !cancelled && (
                <span className="ml-auto text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-semibold">{t('sched.public.payment_required')}</span>
              )}
            </div>
          )}
        </div>

        {!cancelled && booking.meeting_url && (
          <a href={booking.meeting_url} target="_blank" rel="noreferrer" className="mt-5 w-full bg-gradient-to-r from-brand-600 to-violet-600 hover:opacity-90 text-white font-semibold py-3 rounded-lg shadow inline-flex items-center justify-center gap-2">
            <Video className="h-4 w-4" /> {t('sched.public.join_meeting')}
          </a>
        )}

        {requiresPayment && (
          <button onClick={startPayment} disabled={paying} className="mt-3 w-full bg-amber-500 hover:bg-amber-600 text-white font-semibold py-3 rounded-lg shadow disabled:opacity-50 inline-flex items-center justify-center gap-2">
            <CreditCard className="h-4 w-4" /> {paying ? '…' : `${t('sched.public.pay_btn')} ${(booking.price_cents/100).toFixed(2)} ${booking.currency}`}
          </button>
        )}

        {!cancelled && (
          <div className="mt-4 flex gap-2 justify-center">
            <button onClick={startReschedule} className="text-xs px-3 py-1.5 rounded-md border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium inline-flex items-center gap-1">
              <CalIcon className="h-3.5 w-3.5" /> {t('sched.public.reschedule_btn')}
            </button>
            <button onClick={cancel} disabled={cancelling} className="text-xs text-red-600 hover:text-red-700 font-medium disabled:opacity-50 px-3 py-1.5">
              {cancelling ? '…' : t('sched.public.cancel_btn')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
