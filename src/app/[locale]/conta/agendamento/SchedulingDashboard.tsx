'use client';

import { useMemo, useState } from 'react';
import { useLocale } from 'next-intl';
import { createClient } from '@/lib/supabase/client';
import { AppPageHeader } from '@/components/layout/AppPageHeader';
import {
  Clock, Globe2, Plus, Trash2, Pencil, Copy, Check, Calendar, Video, Phone,
  MapPin, Eye, EyeOff, Link2, X, Loader2, CalendarDays, Hourglass, UserRound,
} from 'lucide-react';

type Lang = 'pt' | 'en' | 'es' | 'fr';
const STR: Record<string, Record<Lang, string>> = {
  title: { pt: 'Agendamento', en: 'Scheduling', es: 'Agenda', fr: 'Planification' },
  subtitle: {
    pt: 'A tua disponibilidade, tipos de sessão e reservas — num só sítio.',
    en: 'Your availability, session types and bookings — in one place.',
    es: 'Tu disponibilidad, tipos de sesión y reservas — en un solo lugar.',
    fr: 'Ta disponibilité, types de séance et réservations — au même endroit.',
  },
  active: { pt: 'Disponível para marcações', en: 'Available for bookings', es: 'Disponible para reservas', fr: 'Disponible aux réservations' },
  active_hint: { pt: 'Gera horários reserváveis a partir da tua disponibilidade.', en: 'Generates bookable slots from your availability.', es: 'Genera horarios reservables desde tu disponibilidad.', fr: 'Génère des créneaux réservables.' },
  mentor_badge: { pt: 'Mentor', en: 'Mentor', es: 'Mentor', fr: 'Mentor' },
  directory: { pt: 'Aparecer no diretório de mentores', en: 'Appear in the mentor directory', es: 'Aparecer en el directorio de mentores', fr: 'Apparaître dans l’annuaire des mentors' },
  directory_hint: { pt: 'Quem procura mentoria pode encontrar-te e marcar diretamente.', en: 'People looking for mentoring can find you and book directly.', es: 'Quienes buscan mentoría pueden encontrarte y reservar directamente.', fr: 'Les personnes en quête de mentorat peuvent te trouver et réserver directement.' },
  public_link: { pt: 'A tua página', en: 'Your page', es: 'Tu página', fr: 'Ta page' },
  copy: { pt: 'Copiar', en: 'Copy', es: 'Copiar', fr: 'Copier' },
  copied: { pt: 'Copiado', en: 'Copied', es: 'Copiado', fr: 'Copié' },
  public_profile: { pt: 'Perfil público', en: 'Public profile', es: 'Perfil público', fr: 'Profil public' },
  profile_hint: { pt: 'Aparece na tua página pública de marcação.', en: 'Shown on your public booking page.', es: 'Aparece en tu página pública de reservas.', fr: 'Affiché sur ta page publique de réservation.' },
  headline: { pt: 'Título curto', en: 'Headline', es: 'Título', fr: 'Titre' },
  headline_ph: { pt: 'Ex.: Engenheiro de software · 10 anos', en: 'e.g. Software engineer · 10 yrs', es: 'Ej.: Ingeniero de software · 10 años', fr: 'Ex. : Ingénieur logiciel · 10 ans' },
  bio_label: { pt: 'Bio', en: 'Bio', es: 'Bio', fr: 'Bio' },
  bio_ph: { pt: 'Apresenta-te a quem te vai marcar…', en: 'Introduce yourself to people booking you…', es: 'Preséntate a quien te reserve…', fr: 'Présente-toi aux personnes qui réservent…' },
  availability: { pt: 'Disponibilidade semanal', en: 'Weekly availability', es: 'Disponibilidad semanal', fr: 'Disponibilité hebdomadaire' },
  add_window: { pt: 'Adicionar intervalo', en: 'Add window', es: 'Añadir intervalo', fr: 'Ajouter un créneau' },
  unavailable: { pt: 'Indisponível', en: 'Unavailable', es: 'No disponible', fr: 'Indisponible' },
  timezone: { pt: 'Fuso horário', en: 'Time zone', es: 'Zona horaria', fr: 'Fuseau horaire' },
  buffer: { pt: 'Intervalo entre sessões (min)', en: 'Buffer between sessions (min)', es: 'Margen entre sesiones (min)', fr: 'Marge entre séances (min)' },
  min_notice: { pt: 'Antecedência mínima (h)', en: 'Minimum notice (h)', es: 'Antelación mínima (h)', fr: 'Préavis minimum (h)' },
  max_advance: { pt: 'Janela máxima (dias)', en: 'Booking window (days)', es: 'Ventana máxima (días)', fr: 'Fenêtre max (jours)' },
  save: { pt: 'Guardar', en: 'Save', es: 'Guardar', fr: 'Enregistrer' },
  saved: { pt: 'Guardado', en: 'Saved', es: 'Guardado', fr: 'Enregistré' },
  session_types: { pt: 'Tipos de sessão', en: 'Session types', es: 'Tipos de sesión', fr: 'Types de séance' },
  new_type: { pt: 'Novo tipo', en: 'New type', es: 'Nuevo tipo', fr: 'Nouveau type' },
  no_types: { pt: 'Ainda não tens tipos de sessão. Cria o primeiro.', en: 'No session types yet. Create your first.', es: 'Aún no tienes tipos de sesión.', fr: 'Aucun type de séance pour instant.' },
  free: { pt: 'Gratuita', en: 'Free', es: 'Gratuita', fr: 'Gratuite' },
  visible: { pt: 'Visível na tua página', en: 'Visible on your page', es: 'Visible en tu página', fr: 'Visible sur ta page' },
  visible_short: { pt: 'Visível', en: 'Visible', es: 'Visible', fr: 'Visible' },
  hidden: { pt: 'Oculto', en: 'Hidden', es: 'Oculto', fr: 'Masqué' },
  edit: { pt: 'Editar', en: 'Edit', es: 'Editar', fr: 'Modifier' },
  del: { pt: 'Eliminar', en: 'Delete', es: 'Eliminar', fr: 'Supprimer' },
  ttl: { pt: 'Título', en: 'Title', es: 'Título', fr: 'Titre' },
  slug: { pt: 'Identificador (URL)', en: 'Slug (URL)', es: 'Identificador (URL)', fr: 'Identifiant (URL)' },
  desc: { pt: 'Descrição', en: 'Description', es: 'Descripción', fr: 'Description' },
  duration: { pt: 'Duração (min)', en: 'Duration (min)', es: 'Duración (min)', fr: 'Durée (min)' },
  price: { pt: 'Preço (cêntimos, 0 = grátis)', en: 'Price (cents, 0 = free)', es: 'Precio (céntimos, 0 = gratis)', fr: 'Prix (centimes, 0 = gratuit)' },
  location: { pt: 'Local', en: 'Location', es: 'Ubicación', fr: 'Lieu' },
  purpose: { pt: 'Propósito', en: 'Purpose', es: 'Propósito', fr: 'Objet' },
  cancel: { pt: 'Cancelar', en: 'Cancel', es: 'Cancelar', fr: 'Annuler' },
  bookings: { pt: 'Reservas', en: 'Bookings', es: 'Reservas', fr: 'Réservations' },
  upcoming: { pt: 'Próximas', en: 'Upcoming', es: 'Próximas', fr: 'À venir' },
  past: { pt: 'Anteriores', en: 'Past', es: 'Anteriores', fr: 'Passées' },
  no_bookings: { pt: 'Sem reservas ainda.', en: 'No bookings yet.', es: 'Sin reservas aún.', fr: 'Aucune réservation.' },
};

const PURPOSES = ['mentoring', 'office_hours', 'consultation', 'other'] as const;
const PURPOSE_LABEL: Record<string, Record<Lang, string>> = {
  mentoring: { pt: 'Mentoria', en: 'Mentoring', es: 'Mentoría', fr: 'Mentorat' },
  office_hours: { pt: 'Horário de dúvidas', en: 'Office hours', es: 'Horario de consultas', fr: 'Permanence' },
  consultation: { pt: 'Consultoria', en: 'Consultation', es: 'Consultoría', fr: 'Consultation' },
  other: { pt: 'Outro', en: 'Other', es: 'Otro', fr: 'Autre' },
};
const LOCATIONS = ['video', 'phone', 'in_person'] as const;
const LOC_LABEL: Record<string, Record<Lang, string>> = {
  video: { pt: 'Vídeo', en: 'Video', es: 'Vídeo', fr: 'Vidéo' },
  phone: { pt: 'Telefone', en: 'Phone', es: 'Teléfono', fr: 'Téléphone' },
  in_person: { pt: 'Presencial', en: 'In person', es: 'Presencial', fr: 'En personne' },
};
const LOC_ICON: Record<string, any> = { video: Video, phone: Phone, in_person: MapPin };
const TZS = ['Europe/Lisbon', 'Europe/London', 'Europe/Madrid', 'Europe/Paris', 'Europe/Berlin', 'UTC', 'America/New_York', 'America/Sao_Paulo'];
const DOW: { key: string; label: Record<Lang, string> }[] = [
  { key: '1', label: { pt: 'Seg', en: 'Mon', es: 'Lun', fr: 'Lun' } },
  { key: '2', label: { pt: 'Ter', en: 'Tue', es: 'Mar', fr: 'Mar' } },
  { key: '3', label: { pt: 'Qua', en: 'Wed', es: 'Mié', fr: 'Mer' } },
  { key: '4', label: { pt: 'Qui', en: 'Thu', es: 'Jue', fr: 'Jeu' } },
  { key: '5', label: { pt: 'Sex', en: 'Fri', es: 'Vie', fr: 'Ven' } },
  { key: '6', label: { pt: 'Sáb', en: 'Sat', es: 'Sáb', fr: 'Sam' } },
  { key: '0', label: { pt: 'Dom', en: 'Sun', es: 'Dom', fr: 'Dim' } },
];

const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(' ');

function Toggle({ on, onChange, disabled }: { on: boolean; onChange: () => void; disabled?: boolean }) {
  return (
    <button type="button" disabled={disabled} onClick={onChange}
      className={cx('relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors',
        disabled ? 'bg-slate-200 cursor-not-allowed' : on ? 'bg-gradient-to-r from-violet-500 to-indigo-600' : 'bg-slate-300')}>
      <span className={cx('inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform', on ? 'translate-x-5' : 'translate-x-0.5')} />
    </button>
  );
}
function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cx('rounded-3xl border border-slate-200 bg-white/80 backdrop-blur p-5 sm:p-6', className)}>{children}</div>;
}

export function SchedulingDashboard({ initial }: { initial: any }) {
  const locale = (useLocale() as Lang) || 'pt';
  const t = (k: string) => STR[k]?.[locale] ?? STR[k]?.pt ?? k;
  const sb = useMemo(() => createClient(), []);

  const [data, setData] = useState<any>(initial || {});
  const cal = data?.calendar || {};
  const isMentor = !!data?.is_mentor;
  const handle = data?.handle as string | undefined;

  const [tz, setTz] = useState<string>(cal.timezone || 'Europe/Lisbon');
  const [weekly, setWeekly] = useState<Record<string, [string, string][]>>(cal.weekly_availability || {});
  const [buffer, setBuffer] = useState<number>(cal.buffer_minutes ?? 0);
  const [minNotice, setMinNotice] = useState<number>(cal.min_notice_hours ?? 12);
  const [maxAdvance, setMaxAdvance] = useState<number>(cal.max_advance_days ?? 30);
  const [active, setActive] = useState<boolean>(cal.enabled ?? true);
  const [headline, setHeadline] = useState<string>(cal.headline || '');
  const [bio, setBio] = useState<string>(cal.bio || '');
  const [listDir, setListDir] = useState<boolean>(cal.list_in_directory ?? false);

  const [savingCal, setSavingCal] = useState(false);
  const [savedCal, setSavedCal] = useState(false);
  const [copied, setCopied] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [busy, setBusy] = useState(false);

  const links: any[] = data?.links || [];
  const upcoming: any[] = data?.upcoming_bookings || [];
  const past: any[] = data?.past_bookings || [];

  async function refresh() {
    const { data: d } = await sb.rpc('nl_scheduling_my_dashboard');
    if (d) setData(d);
  }

  async function saveCalendar(extra?: Partial<{ active: boolean; listInDir: boolean }>) {
    setSavingCal(true);
    const payload = {
      p_timezone: tz, p_weekly_availability: weekly, p_buffer_minutes: buffer,
      p_min_notice_hours: minNotice, p_max_advance_days: maxAdvance,
      p_enabled: extra?.active ?? active, p_list_in_directory: extra?.listInDir ?? listDir, p_headline: headline, p_bio: bio,
    };
    await sb.rpc('nl_scheduling_update_calendar', payload as any);
    setSavingCal(false);
    setSavedCal(true);
    setTimeout(() => setSavedCal(false), 1800);
    refresh();
  }

  function setDayWindows(day: string, windows: [string, string][]) {
    setWeekly((w) => ({ ...w, [day]: windows }));
  }
  function copyLink() {
    if (!handle) return;
    const url = `${window.location.origin}/${locale}/agendar/${handle}`;
    navigator.clipboard?.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  }

  async function saveLink(form: any) {
    setBusy(true);
    const { data: res } = await sb.rpc('nl_scheduling_upsert_link', {
      p_id: form.id || null, p_slug: form.slug, p_title: form.title, p_description: form.description || '',
      p_duration_min: Number(form.duration_min) || 30, p_price_cents: Number(form.price_cents) || 0,
      p_currency: 'EUR', p_location_type: form.location_type || 'video', p_location_details: form.location_details || '',
      p_visible: form.visible ?? true, p_purpose: form.purpose || 'mentoring',
    } as any);
    setBusy(false);
    if ((res as any)?.ok) { setEditing(null); refresh(); }
  }
  async function deleteLink(id: string) {
    setBusy(true);
    await sb.rpc('nl_scheduling_delete_link', { p_id: id } as any);
    setBusy(false);
    refresh();
  }

  return (
    <div className="space-y-6">
      <AppPageHeader backHref="/conta" title={`📅 ${t('title')}`} description={t('subtitle')} />

      <div className="grid gap-3 sm:grid-cols-2">
        <Card className="!p-4 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
              <Calendar className="h-4 w-4 text-violet-600 shrink-0" />{t('active')}
              {isMentor && <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-violet-100 text-violet-700">{t('mentor_badge')}</span>}
            </div>
            <p className="text-xs text-slate-500 mt-0.5 leading-snug">{t('active_hint')}</p>
          </div>
          <Toggle on={active} onChange={() => { const v = !active; setActive(v); saveCalendar({ active: v }); }} />
        </Card>

        {isMentor && (
          <Card className="!p-4 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                <UserRound className="h-4 w-4 text-violet-600 shrink-0" />{t('directory')}
              </div>
              <p className="text-xs text-slate-500 mt-0.5 leading-snug">{t('directory_hint')}</p>
            </div>
            <Toggle on={listDir} onChange={() => { const v = !listDir; setListDir(v); saveCalendar({ listInDir: v }); }} />
          </Card>
        )}

        <Card className="!p-4 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-900"><Link2 className="h-4 w-4 text-violet-600 shrink-0" />{t('public_link')}</div>
            <p className="text-xs text-slate-500 mt-0.5 truncate">/agendar/{handle || '—'}</p>
          </div>
          <button onClick={copyLink} disabled={!handle}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-violet-700 bg-violet-50 hover:bg-violet-100 disabled:opacity-50 rounded-full px-3 py-1.5 transition-colors shrink-0">
            {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}{copied ? t('copied') : t('copy')}
          </button>
        </Card>
      </div>

      <Card>
        <div className="flex items-center justify-between mb-3 gap-3">
          <div className="min-w-0">
            <h2 className="font-display text-lg font-bold text-slate-900 flex items-center gap-2"><UserRound className="h-5 w-5 text-violet-600 shrink-0" />{t('public_profile')}</h2>
            <p className="text-xs text-slate-500 mt-0.5">{t('profile_hint')}</p>
          </div>
          <button onClick={() => saveCalendar()} disabled={savingCal}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-white bg-gradient-to-r from-violet-600 to-indigo-600 hover:opacity-90 rounded-full px-4 py-1.5 transition-opacity disabled:opacity-60 shrink-0">
            {savingCal ? <Loader2 className="h-4 w-4 animate-spin" /> : savedCal ? <Check className="h-4 w-4" /> : null}{savedCal ? t('saved') : t('save')}
          </button>
        </div>
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">{t('headline')}</label>
            <input value={headline} onChange={(e) => setHeadline(e.target.value)} placeholder={t('headline_ph')} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:ring-2 focus:ring-violet-300 outline-none" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">{t('bio_label')}</label>
            <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={3} placeholder={t('bio_ph')} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:ring-2 focus:ring-violet-300 outline-none resize-none" />
          </div>
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <div className="flex items-center justify-between mb-4 gap-3">
            <h2 className="font-display text-lg font-bold text-slate-900 flex items-center gap-2 min-w-0"><Clock className="h-5 w-5 text-violet-600 shrink-0" /><span className="truncate">{t('availability')}</span></h2>
            <button onClick={() => saveCalendar()} disabled={savingCal}
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-white bg-gradient-to-r from-violet-600 to-indigo-600 hover:opacity-90 rounded-full px-4 py-1.5 transition-opacity disabled:opacity-60 shrink-0">
              {savingCal ? <Loader2 className="h-4 w-4 animate-spin" /> : savedCal ? <Check className="h-4 w-4" /> : null}{savedCal ? t('saved') : t('save')}
            </button>
          </div>

          <div className="space-y-2">
            {DOW.map((d) => {
              const windows = weekly[d.key] || [];
              const on = windows.length > 0;
              return (
                <div key={d.key} className="rounded-2xl border border-slate-100 p-3">
                  <div className="flex items-center gap-2.5">
                    <Toggle on={on} onChange={() => setDayWindows(d.key, on ? [] : [['09:00', '17:00']])} />
                    <span className="text-sm font-semibold text-slate-700 w-9">{d.label[locale]}</span>
                    {!on && <span className="text-xs text-slate-400">{t('unavailable')}</span>}
                  </div>
                  {on && (
                    <div className="space-y-2 mt-2">
                      {windows.map((win, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <input type="time" value={win[0]} onChange={(e) => { const n = [...windows] as [string, string][]; n[i] = [e.target.value, n[i][1]]; setDayWindows(d.key, n); }}
                            className="flex-1 min-w-0 rounded-lg border border-slate-200 px-2 py-1.5 text-sm focus:ring-2 focus:ring-violet-300 outline-none" />
                          <span className="text-slate-400 shrink-0">–</span>
                          <input type="time" value={win[1]} onChange={(e) => { const n = [...windows] as [string, string][]; n[i] = [n[i][0], e.target.value]; setDayWindows(d.key, n); }}
                            className="flex-1 min-w-0 rounded-lg border border-slate-200 px-2 py-1.5 text-sm focus:ring-2 focus:ring-violet-300 outline-none" />
                          <button onClick={() => setDayWindows(d.key, windows.filter((_, j) => j !== i))} className="shrink-0 p-1 text-slate-300 hover:text-rose-500"><X className="h-4 w-4" /></button>
                        </div>
                      ))}
                      <button onClick={() => setDayWindows(d.key, [...windows, ['09:00', '17:00']])} className="inline-flex items-center gap-1 text-xs font-medium text-violet-600 hover:text-violet-800">
                        <Plus className="h-3.5 w-3.5" />{t('add_window')}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="grid grid-cols-2 gap-3 mt-5 pt-5 border-t border-slate-100">
            <label className="text-xs font-medium text-slate-500 col-span-2 sm:col-span-1">
              <span className="flex items-center gap-1.5 mb-1"><Globe2 className="h-3.5 w-3.5" />{t('timezone')}</span>
              <select value={tz} onChange={(e) => setTz(e.target.value)} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:ring-2 focus:ring-violet-300 outline-none">
                {(TZS.includes(tz) ? TZS : [tz, ...TZS]).map((z) => <option key={z} value={z}>{z}</option>)}
              </select>
            </label>
            <label className="text-xs font-medium text-slate-500">
              <span className="block mb-1 leading-tight">{t('buffer')}</span>
              <input type="number" min={0} value={buffer} onChange={(e) => setBuffer(+e.target.value)} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:ring-2 focus:ring-violet-300 outline-none" />
            </label>
            <label className="text-xs font-medium text-slate-500">
              <span className="block mb-1 leading-tight">{t('min_notice')}</span>
              <input type="number" min={0} value={minNotice} onChange={(e) => setMinNotice(+e.target.value)} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:ring-2 focus:ring-violet-300 outline-none" />
            </label>
            <label className="text-xs font-medium text-slate-500">
              <span className="block mb-1 leading-tight">{t('max_advance')}</span>
              <input type="number" min={1} value={maxAdvance} onChange={(e) => setMaxAdvance(+e.target.value)} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:ring-2 focus:ring-violet-300 outline-none" />
            </label>
          </div>
        </Card>

        <div className="lg:col-span-2 space-y-6">
          <Card>
            <div className="flex items-center justify-between mb-4 gap-3">
              <h2 className="font-display text-lg font-bold text-slate-900 flex items-center gap-2 min-w-0"><Video className="h-5 w-5 text-violet-600 shrink-0" /><span className="truncate">{t('session_types')}</span></h2>
              <button onClick={() => setEditing({ purpose: 'mentoring', location_type: 'video', visible: true, duration_min: 30, price_cents: 0 })}
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-violet-700 bg-violet-50 hover:bg-violet-100 rounded-full px-3 py-1.5 transition-colors shrink-0">
                <Plus className="h-4 w-4" />{t('new_type')}
              </button>
            </div>
            {links.length === 0 ? (
              <p className="text-sm text-slate-400 py-4 text-center">{t('no_types')}</p>
            ) : (
              <div className="space-y-2">
                {links.map((l) => {
                  const Icon = LOC_ICON[l.location_type] || Video;
                  return (
                    <div key={l.id} className="rounded-2xl border border-slate-100 p-3 hover:border-violet-200 transition-colors">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="font-semibold text-slate-900 text-sm truncate">{l.title}</div>
                          <div className="flex items-center gap-2 mt-1 text-xs text-slate-500 flex-wrap">
                            <span className="inline-flex items-center gap-1"><Hourglass className="h-3 w-3" />{l.duration_min}m</span>
                            <span className="inline-flex items-center gap-1"><Icon className="h-3 w-3" />{LOC_LABEL[l.location_type]?.[locale] || l.location_type}</span>
                            <span className={l.price_cents > 0 ? 'text-slate-700 font-semibold' : 'text-emerald-700 font-semibold'}>{l.price_cents > 0 ? `${(l.price_cents / 100).toFixed(2)} €` : t('free')}</span>
                            <span className="text-violet-600">{PURPOSE_LABEL[l.purpose]?.[locale] || l.purpose}</span>
                          </div>
                          <div className="mt-1.5">
                            <span className={cx('text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full inline-flex items-center gap-1', l.visible ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500')}>
                              {l.visible ? <Eye className="h-2.5 w-2.5" /> : <EyeOff className="h-2.5 w-2.5" />}{l.visible ? t('visible_short') : t('hidden')}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button onClick={() => setEditing({ ...l })} className="p-1.5 text-slate-400 hover:text-violet-600 rounded-lg hover:bg-violet-50"><Pencil className="h-4 w-4" /></button>
                          <button onClick={() => deleteLink(l.id)} className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50"><Trash2 className="h-4 w-4" /></button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>

          <Card>
            <h2 className="font-display text-lg font-bold text-slate-900 flex items-center gap-2 mb-3"><CalendarDays className="h-5 w-5 text-violet-600 shrink-0" />{t('bookings')}</h2>
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">{t('upcoming')}</div>
            {upcoming.length === 0 ? <p className="text-sm text-slate-400">{t('no_bookings')}</p> : (
              <div className="space-y-2">
                {upcoming.map((b) => (
                  <div key={b.id} className="flex items-center gap-3 rounded-2xl border border-slate-100 p-3">
                    <div className="h-9 w-9 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 text-white text-sm font-bold flex items-center justify-center shrink-0">{(b.guest_name || '?')[0]?.toUpperCase()}</div>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-semibold text-slate-900 truncate">{b.guest_name}</div>
                      <div className="text-xs text-slate-500">{new Date(b.scheduled_at).toLocaleString(locale)} · {b.duration_min}m</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {past.length > 0 && (
              <>
                <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mt-4 mb-2">{t('past')}</div>
                <div className="space-y-1.5">
                  {past.slice(0, 5).map((b) => (
                    <div key={b.id} className="flex items-center justify-between text-xs text-slate-500 px-1">
                      <span className="truncate">{b.guest_name}</span>
                      <span className="shrink-0 ml-2">{new Date(b.scheduled_at).toLocaleDateString(locale)}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </Card>
        </div>
      </div>

      {editing && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/40 backdrop-blur-sm p-0 sm:p-4" onClick={() => !busy && setEditing(null)}>
          <div className="bg-white w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 max-h-[92vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display text-lg font-bold text-slate-900">{editing.id ? t('edit') : t('new_type')}</h3>
              <button onClick={() => setEditing(null)} className="text-slate-400 hover:text-slate-700"><X className="h-5 w-5" /></button>
            </div>
            <div className="space-y-3">
              <Field label={t('ttl')}><input value={editing.title || ''} onChange={(e) => setEditing({ ...editing, title: e.target.value })} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:ring-2 focus:ring-violet-300 outline-none" /></Field>
              <Field label={t('slug')}><input value={editing.slug || ''} onChange={(e) => setEditing({ ...editing, slug: e.target.value })} placeholder="mentoria-30min" className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:ring-2 focus:ring-violet-300 outline-none" /></Field>
              <Field label={t('desc')}><textarea value={editing.description || ''} onChange={(e) => setEditing({ ...editing, description: e.target.value })} rows={2} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:ring-2 focus:ring-violet-300 outline-none resize-none" /></Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label={t('duration')}><input type="number" value={editing.duration_min ?? 30} onChange={(e) => setEditing({ ...editing, duration_min: +e.target.value })} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:ring-2 focus:ring-violet-300 outline-none" /></Field>
                <Field label={t('price')}><input type="number" value={editing.price_cents ?? 0} onChange={(e) => setEditing({ ...editing, price_cents: +e.target.value })} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:ring-2 focus:ring-violet-300 outline-none" /></Field>
                <Field label={t('location')}>
                  <select value={editing.location_type || 'video'} onChange={(e) => setEditing({ ...editing, location_type: e.target.value })} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:ring-2 focus:ring-violet-300 outline-none">
                    {LOCATIONS.map((l) => <option key={l} value={l}>{LOC_LABEL[l][locale]}</option>)}
                  </select>
                </Field>
                <Field label={t('purpose')}>
                  <select value={editing.purpose || 'mentoring'} onChange={(e) => setEditing({ ...editing, purpose: e.target.value })} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:ring-2 focus:ring-violet-300 outline-none">
                    {PURPOSES.map((p) => <option key={p} value={p}>{PURPOSE_LABEL[p][locale]}</option>)}
                  </select>
                </Field>
              </div>
              <label className="flex items-center gap-2 text-sm text-slate-700 pt-1"><Toggle on={editing.visible ?? true} onChange={() => setEditing({ ...editing, visible: !(editing.visible ?? true) })} />{t('visible')}</label>
            </div>
            <div className="flex items-center justify-end gap-2 mt-5">
              <button onClick={() => setEditing(null)} className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900">{t('cancel')}</button>
              <button onClick={() => saveLink(editing)} disabled={busy} className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-violet-600 to-indigo-600 rounded-full hover:opacity-90 disabled:opacity-60">
                {busy && <Loader2 className="h-4 w-4 animate-spin" />}{t('save')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block text-xs font-medium text-slate-500"><span className="block mb-1">{label}</span>{children}</label>;
}
