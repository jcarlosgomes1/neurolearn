'use client';

import { useEffect, useMemo, useState } from 'react';
import { useLocale } from 'next-intl';
import { createClient } from '@/lib/supabase/client';
import {
  Clock, Video, Phone, MapPin, Globe2, Check, ChevronLeft, Loader2,
  CheckCircle2, CalendarDays, Mail,
} from 'lucide-react';

type Lang = 'pt' | 'en' | 'es' | 'fr';
const S: Record<string, Record<Lang, string>> = {
  pick_date: { pt: 'Escolhe o dia', en: 'Pick a day', es: 'Elige el día', fr: 'Choisis le jour' },
  pick_time: { pt: 'Escolhe a hora', en: 'Pick a time', es: 'Elige la hora', fr: 'Choisis l’heure' },
  times_in: { pt: 'Horários em', en: 'Times in', es: 'Horarios en', fr: 'Heures en' },
  no_slots: { pt: 'Sem horários disponíveis nos próximos dias.', en: 'No available times in the coming days.', es: 'Sin horarios disponibles próximamente.', fr: 'Aucun créneau disponible prochainement.' },
  your_details: { pt: 'Os teus dados', en: 'Your details', es: 'Tus datos', fr: 'Tes coordonnées' },
  name: { pt: 'Nome', en: 'Name', es: 'Nombre', fr: 'Nom' },
  email: { pt: 'Email', en: 'Email', es: 'Email', fr: 'E-mail' },
  phone: { pt: 'Telefone', en: 'Phone', es: 'Teléfono', fr: 'Téléphone' },
  notes: { pt: 'Notas', en: 'Notes', es: 'Notas', fr: 'Notes' },
  optional: { pt: 'opcional', en: 'optional', es: 'opcional', fr: 'optionnel' },
  back: { pt: 'Voltar', en: 'Back', es: 'Volver', fr: 'Retour' },
  confirm: { pt: 'Confirmar reserva', en: 'Confirm booking', es: 'Confirmar reserva', fr: 'Confirmer la réservation' },
  free: { pt: 'Gratuita', en: 'Free', es: 'Gratuita', fr: 'Gratuite' },
  confirmed_title: { pt: 'Reserva confirmada!', en: 'Booking confirmed!', es: '¡Reserva confirmada!', fr: 'Réservation confirmée !' },
  confirmed_sub: { pt: 'Enviámos os detalhes para o teu email.', en: 'We sent the details to your email.', es: 'Enviamos los detalles a tu email.', fr: 'Nous avons envoyé les détails par e-mail.' },
  with: { pt: 'com', en: 'with', es: 'con', fr: 'avec' },
  err_slot_taken: { pt: 'Esse horário acabou de ficar ocupado. Escolhe outro.', en: 'That time was just taken. Pick another.', es: 'Ese horario se acaba de ocupar. Elige otro.', fr: 'Ce créneau vient d’être pris. Choisis-en un autre.' },
  err_generic: { pt: 'Não foi possível concluir. Tenta novamente.', en: 'Could not complete. Please try again.', es: 'No se pudo completar. Inténtalo de nuevo.', fr: 'Impossible de finaliser. Réessaie.' },
  err_email: { pt: 'Indica um email válido.', en: 'Enter a valid email.', es: 'Introduce un email válido.', fr: 'Saisis un e-mail valide.' },
  err_name: { pt: 'Indica o teu nome.', en: 'Enter your name.', es: 'Introduce tu nombre.', fr: 'Saisis ton nom.' },
  pay_note: { pt: 'O pagamento será solicitado a seguir.', en: 'Payment will be requested next.', es: 'El pago se solicitará a continuación.', fr: 'Le paiement sera demandé ensuite.' },
};
const LOC: Record<string, Record<Lang, string>> = {
  video: { pt: 'Videochamada', en: 'Video call', es: 'Videollamada', fr: 'Appel vidéo' },
  phone: { pt: 'Telefone', en: 'Phone', es: 'Teléfono', fr: 'Téléphone' },
  in_person: { pt: 'Presencial', en: 'In person', es: 'Presencial', fr: 'En personne' },
};
const LOC_ICON: Record<string, any> = { video: Video, phone: Phone, in_person: MapPin };
const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(' ');

export function BookingForm({ host, link }: { host: any; link: any }) {
  const locale = (useLocale() as Lang) || 'pt';
  const t = (k: string) => S[k]?.[locale] ?? S[k]?.pt ?? k;
  const sb = useMemo(() => createClient(), []);
  const tz = host?.timezone || 'Europe/Lisbon';
  const LocIcon = LOC_ICON[link?.location_type] || Video;

  const [slots, setSlots] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [slot, setSlot] = useState<any | null>(null);
  const [step, setStep] = useState<'pick' | 'details' | 'done'>('pick');
  const [form, setForm] = useState({ name: '', email: '', phone: '', notes: '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data } = await sb.rpc('nl_scheduling_available_slots', { p_link_id: link.id });
      const s = ((data as any)?.slots) || [];
      setSlots(s);
      const firstDate = s[0]?.date || null;
      setSelectedDate(firstDate);
      setLoading(false);
    })();
  }, [link.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const dates = useMemo(() => Array.from(new Set(slots.map((s) => s.date))), [slots]);
  const daySlots = useMemo(() => slots.filter((s) => s.date === selectedDate), [slots, selectedDate]);

  function fmtDayChip(dateStr: string) {
    const d = new Date(dateStr + 'T12:00:00');
    return {
      wd: d.toLocaleDateString(locale, { weekday: 'short' }),
      dm: d.toLocaleDateString(locale, { day: 'numeric', month: 'short' }),
    };
  }
  const priceLabel = link.price_cents > 0 ? `${(link.price_cents / 100).toFixed(2)} ${link.currency || 'EUR'}` : t('free');

  async function submit() {
    setError(null);
    if (!form.name || form.name.trim().length < 2) { setError(t('err_name')); return; }
    if (!form.email || !/^.+@.+\..+$/.test(form.email)) { setError(t('err_email')); return; }
    setSubmitting(true);
    const { data, error: rpcErr } = await sb.rpc('nl_scheduling_create_booking', {
      p_link_id: link.id, p_slot_iso: slot.start, p_guest_name: form.name,
      p_guest_email: form.email, p_guest_phone: form.phone || null, p_guest_notes: form.notes || null,
    } as any);
    setSubmitting(false);
    const res = data as any;
    if (rpcErr || !res?.ok) {
      setError(res?.error === 'slot_taken' ? t('err_slot_taken') : t('err_generic'));
      return;
    }
    setStep('done');
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      <div className="grid gap-6 md:grid-cols-[330px_1fr]">
        {/* summary */}
        <aside className="md:sticky md:top-8 self-start">
          <div className="rounded-3xl border border-slate-200 bg-white p-6">
            <div className="flex items-center gap-3">
              {host.avatar_url
                ? <img src={host.avatar_url} alt={host.name} className="w-14 h-14 rounded-full object-cover" />
                : <div className="w-14 h-14 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 text-white text-lg font-bold flex items-center justify-center">{host.name?.[0]?.toUpperCase() || '?'}</div>}
              <div className="min-w-0">
                <p className="text-xs text-slate-500">{t('with')}</p>
                <p className="font-semibold text-slate-900 truncate">{host.name}</p>
              </div>
            </div>
            <h1 className="font-display text-xl font-bold text-slate-900 mt-5">{link.title}</h1>
            {link.description && <p className="text-sm text-slate-600 mt-2 leading-relaxed">{link.description}</p>}
            <div className="mt-4 space-y-2 text-sm text-slate-600">
              <div className="flex items-center gap-2"><Clock className="h-4 w-4 text-violet-600 shrink-0" />{link.duration_min} min</div>
              <div className="flex items-center gap-2"><LocIcon className="h-4 w-4 text-violet-600 shrink-0" />{LOC[link.location_type]?.[locale] || link.location_type}</div>
              <div className="flex items-center gap-2"><span className={cx('h-4 w-4 shrink-0 inline-flex items-center justify-center font-bold', link.price_cents > 0 ? 'text-slate-700' : 'text-emerald-600')}>€</span><span className={link.price_cents > 0 ? 'text-slate-800 font-semibold' : 'text-emerald-700 font-semibold'}>{priceLabel}</span></div>
              <div className="flex items-center gap-2"><Globe2 className="h-4 w-4 text-violet-600 shrink-0" /><span className="text-xs">{t('times_in')} {tz}</span></div>
            </div>
          </div>
        </aside>

        {/* main */}
        <div>
          {step === 'done' ? (
            <div className="rounded-3xl border border-emerald-200 bg-emerald-50/50 p-8 text-center">
              <CheckCircle2 className="h-14 w-14 text-emerald-500 mx-auto" />
              <h2 className="font-display text-2xl font-bold text-slate-900 mt-4">{t('confirmed_title')}</h2>
              <p className="text-slate-600 mt-1">{t('confirmed_sub')}</p>
              <div className="mt-6 inline-block text-left bg-white rounded-2xl border border-slate-200 p-5">
                <div className="flex items-center gap-2 text-slate-900 font-semibold"><CalendarDays className="h-4 w-4 text-violet-600" />
                  {new Date(slot.start).toLocaleString(locale, { dateStyle: 'full', timeStyle: 'short', timeZone: tz } as any)}
                </div>
                <div className="mt-2 text-sm text-slate-600">{link.title} · {link.duration_min} min · {t('with')} {host.name}</div>
                <div className="mt-1 text-sm text-slate-500 flex items-center gap-1.5"><Mail className="h-3.5 w-3.5" />{form.email}</div>
              </div>
            </div>
          ) : step === 'details' ? (
            <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-7">
              <button onClick={() => setStep('pick')} className="inline-flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-slate-800 mb-4"><ChevronLeft className="h-4 w-4" />{t('back')}</button>
              <div className="rounded-2xl bg-violet-50 text-violet-800 px-4 py-3 text-sm font-semibold mb-5 flex items-center gap-2">
                <CalendarDays className="h-4 w-4" />{new Date(slot.start).toLocaleString(locale, { dateStyle: 'long', timeStyle: 'short', timeZone: tz } as any)}
              </div>
              <h2 className="font-display text-lg font-bold text-slate-900 mb-4">{t('your_details')}</h2>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">{t('name')}</label>
                  <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:ring-2 focus:ring-violet-300 outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">{t('email')}</label>
                  <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:ring-2 focus:ring-violet-300 outline-none" />
                </div>
                <div className="grid sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">{t('phone')} <span className="text-slate-400">({t('optional')})</span></label>
                    <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:ring-2 focus:ring-violet-300 outline-none" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">{t('notes')} <span className="text-slate-400">({t('optional')})</span></label>
                  <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={3} className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:ring-2 focus:ring-violet-300 outline-none resize-none" />
                </div>
              </div>
              {link.price_cents > 0 && <p className="text-xs text-amber-700 bg-amber-50 rounded-lg px-3 py-2 mt-3">{t('pay_note')}</p>}
              {error && <p className="text-sm text-rose-600 mt-3">{error}</p>}
              <button onClick={submit} disabled={submitting}
                className="w-full mt-5 inline-flex items-center justify-center gap-2 text-sm font-semibold text-white bg-gradient-to-r from-violet-600 to-indigo-600 hover:opacity-90 rounded-full px-5 py-3 transition-opacity disabled:opacity-60">
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}{t('confirm')} · {priceLabel}
              </button>
            </div>
          ) : (
            <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-7">
              {loading ? (
                <div className="space-y-4">
                  <div className="h-5 w-32 bg-slate-100 rounded animate-pulse" />
                  <div className="flex gap-2">{[0, 1, 2, 3].map((i) => <div key={i} className="h-16 w-20 bg-slate-100 rounded-2xl animate-pulse" />)}</div>
                  <div className="grid grid-cols-3 gap-2">{[0, 1, 2, 3, 4, 5].map((i) => <div key={i} className="h-10 bg-slate-100 rounded-xl animate-pulse" />)}</div>
                </div>
              ) : dates.length === 0 ? (
                <p className="text-sm text-slate-500 py-10 text-center">{t('no_slots')}</p>
              ) : (
                <>
                  <h2 className="font-display text-lg font-bold text-slate-900 mb-3">{t('pick_date')}</h2>
                  <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1">
                    {dates.map((d) => {
                      const c = fmtDayChip(d);
                      const on = d === selectedDate;
                      return (
                        <button key={d} onClick={() => setSelectedDate(d)}
                          className={cx('shrink-0 w-[4.75rem] rounded-2xl border px-2 py-2.5 text-center transition-all',
                            on ? 'border-violet-500 bg-violet-50 ring-2 ring-violet-200' : 'border-slate-200 hover:border-violet-300')}>
                          <div className={cx('text-[11px] font-semibold uppercase tracking-wide', on ? 'text-violet-700' : 'text-slate-400')}>{c.wd}</div>
                          <div className={cx('text-sm font-bold mt-0.5', on ? 'text-violet-800' : 'text-slate-700')}>{c.dm}</div>
                        </button>
                      );
                    })}
                  </div>
                  <h2 className="font-display text-lg font-bold text-slate-900 mt-5 mb-1">{t('pick_time')}</h2>
                  <p className="text-xs text-slate-400 mb-3">{t('times_in')} {tz}</p>
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {daySlots.map((s, i) => (
                      <button key={i} onClick={() => { setSlot(s); setStep('details'); }}
                        className="rounded-xl border border-slate-200 hover:border-violet-500 hover:bg-violet-50 text-sm font-semibold text-slate-700 hover:text-violet-700 py-2.5 transition-all">
                        {s.time}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
