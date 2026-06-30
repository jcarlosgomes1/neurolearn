'use client';

import { useState, useMemo, useEffect } from 'react';
import { useLocale } from 'next-intl';
import { createClient } from '@/lib/supabase/client';
import { AppPageHeader } from '@/components/layout/AppPageHeader';
import { CalendarDays, Check, Copy, Lock, Eye, RefreshCw } from 'lucide-react';

type Lang = 'pt' | 'en' | 'es' | 'fr';
const STR: Record<string, Record<Lang, string>> = {
  title: { pt: 'Calendário', en: 'Calendar', es: 'Calendario', fr: 'Agenda' },
  subtitle: {
    pt: 'Liga o teu calendário para teres as tuas sessões em todo o lado e evitares sobreposições.',
    en: 'Connect your calendar to have your sessions everywhere and avoid overlaps.',
    es: 'Conecta tu calendario para tener tus sesiones en todas partes y evitar solapamientos.',
    fr: 'Connecte ton agenda pour retrouver tes séances partout et éviter les chevauchements.',
  },
  gcal_title: { pt: 'Google Calendar', en: 'Google Calendar', es: 'Google Calendar', fr: 'Google Calendar' },
  gcal_hint: { pt: 'Sincroniza automaticamente as tuas sessões com o teu Google Calendar.', en: 'Automatically sync your sessions with your Google Calendar.', es: 'Sincroniza automáticamente tus sesiones con tu Google Calendar.', fr: 'Synchronise automatiquement tes séances avec ton Google Calendar.' },
  mscal_title: { pt: 'Outlook / Microsoft 365', en: 'Outlook / Microsoft 365', es: 'Outlook / Microsoft 365', fr: 'Outlook / Microsoft 365' },
  mscal_hint: { pt: 'Sincroniza as tuas sessões com o teu calendário Outlook.', en: 'Sync your sessions with your Outlook calendar.', es: 'Sincroniza tus sesiones con tu calendario Outlook.', fr: 'Synchronise tes séances avec ton calendrier Outlook.' },
  ics_title: { pt: 'Outro calendário (Apple, etc.)', en: 'Other calendar (Apple, etc.)', es: 'Otro calendario (Apple, etc.)', fr: 'Autre agenda (Apple, etc.)' },
  ics_hint: { pt: 'Subscreve este link no Apple Calendar, Outlook ou qualquer app \u2014 atualiza sozinho.', en: 'Subscribe to this link in Apple Calendar, Outlook or any app \u2014 it stays in sync.', es: 'Suscribe este enlace en Apple Calendar, Outlook o cualquier app \u2014 se actualiza solo.', fr: 'Abonne-toi \u00e0 ce lien dans Apple Calendar, Outlook ou toute app \u2014 il se met \u00e0 jour seul.' },
  ics_get: { pt: 'Obter link de subscri\u00e7\u00e3o', en: 'Get subscription link', es: 'Obtener enlace de suscripci\u00f3n', fr: 'Obtenir le lien d\u2019abonnement' },
  ics_copy: { pt: 'Copiar link', en: 'Copy link', es: 'Copiar enlace', fr: 'Copier le lien' },
  connect: { pt: 'Ligar', en: 'Connect', es: 'Conectar', fr: 'Connecter' },
  connected: { pt: 'Ligado', en: 'Connected', es: 'Conectado', fr: 'Connect\u00e9' },
  disconnect: { pt: 'Desligar', en: 'Disconnect', es: 'Desconectar', fr: 'D\u00e9connecter' },
  copied: { pt: 'Copiado', en: 'Copied', es: 'Copiado', fr: 'Copi\u00e9' },
  pull_title: { pt: 'Importar o meu calend\u00e1rio', en: 'Import my calendar', es: 'Importar mi calendario', fr: 'Importer mon agenda' },
  pull_hint: { pt: 'A NeuroLearn passa a conhecer os teus eventos externos e evita marca\u00e7\u00f5es sobrepostas.', en: 'NeuroLearn learns your external events and avoids double-booking.', es: 'NeuroLearn conoce tus eventos externos y evita solapamientos.', fr: 'NeuroLearn conna\u00eet tes \u00e9v\u00e9nements externes et \u00e9vite les chevauchements.' },
  pull_locked: { pt: 'Liga a conta acima para poderes importar.', en: 'Connect the account above to import.', es: 'Conecta la cuenta arriba para importar.', fr: 'Connecte le compte ci-dessus pour importer.' },
  privacy_level: { pt: 'O que a NeuroLearn v\u00ea', en: 'What NeuroLearn sees', es: 'Lo que NeuroLearn ve', fr: 'Ce que NeuroLearn voit' },
  privacy_busy: { pt: 'S\u00f3 ocupa\u00e7\u00e3o', en: 'Busy only', es: 'Solo ocupaci\u00f3n', fr: 'Occup\u00e9 seulement' },
  privacy_busy_hint: { pt: 'Apenas que est\u00e1s ocupado. Privado.', en: 'Only that you are busy. Private.', es: 'Solo que est\u00e1s ocupado. Privado.', fr: 'Seulement que tu es occup\u00e9. Priv\u00e9.' },
  privacy_full: { pt: 'Detalhes completos', en: 'Full details', es: 'Detalles completos', fr: 'D\u00e9tails complets' },
  privacy_full_hint: { pt: 'T\u00edtulo, local e notas dos eventos.', en: 'Event title, location and notes.', es: 'T\u00edtulo, lugar y notas.', fr: 'Titre, lieu et notes.' },
  pull_last_sync: { pt: 'Sincronizado', en: 'Synced', es: 'Sincronizado', fr: 'Synchronis\u00e9' },
  pull_never: { pt: 'A preparar a primeira sincroniza\u00e7\u00e3o\u2026', en: 'Preparing first sync\u2026', es: 'Preparando la primera sincronizaci\u00f3n\u2026', fr: 'Pr\u00e9paration de la premi\u00e8re synchro\u2026' },
  pull_realtime: { pt: 'Tempo real ativo', en: 'Real-time active', es: 'Tiempo real activo', fr: 'Temps r\u00e9el actif' },
};

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

function PullControls({ provider, connected, st, onSet, t }: { provider: string; connected: boolean; st: any; onSet: (p: string, e: boolean, d: string) => void; t: (k: string) => string }) {
  const enabled = !!st?.pull_enabled;
  const detail = st?.detail_level || 'busy';
  return (
    <div className="mt-3 pt-3 border-t border-slate-100">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className={cx('text-sm font-medium', connected ? 'text-slate-800' : 'text-slate-400')}>{t('pull_title')}</div>
          <p className="text-xs text-slate-500 mt-0.5 leading-snug">{connected ? t('pull_hint') : t('pull_locked')}</p>
        </div>
        <Toggle on={enabled} disabled={!connected} onChange={() => onSet(provider, !enabled, detail)} />
      </div>
      {connected && enabled && (
        <div className="mt-3">
          <div className="text-xs font-medium text-slate-500 mb-1.5">{t('privacy_level')}</div>
          <div className="grid grid-cols-2 gap-2">
            <button onClick={() => onSet(provider, true, 'busy')}
              className={cx('text-left rounded-xl border p-2.5 transition-colors', detail === 'busy' ? 'border-violet-400 bg-violet-50 ring-1 ring-violet-200' : 'border-slate-200 hover:border-slate-300')}>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800"><Lock className="h-3.5 w-3.5" />{t('privacy_busy')}</div>
              <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">{t('privacy_busy_hint')}</p>
            </button>
            <button onClick={() => onSet(provider, true, 'full')}
              className={cx('text-left rounded-xl border p-2.5 transition-colors', detail === 'full' ? 'border-violet-400 bg-violet-50 ring-1 ring-violet-200' : 'border-slate-200 hover:border-slate-300')}>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800"><Eye className="h-3.5 w-3.5" />{t('privacy_full')}</div>
              <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">{t('privacy_full_hint')}</p>
            </button>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-2">
            {st?.webhook_ok ? <span className="inline-flex items-center gap-1.5 text-emerald-600"><RefreshCw className="h-3 w-3" />{t('pull_realtime')}</span> : <span>{st?.last_pull_at ? t('pull_last_sync') : t('pull_never')}</span>}
          </div>
        </div>
      )}
    </div>
  );
}

export function CalendarConnectionsClient() {
  const locale = (useLocale() as Lang) || 'pt';
  const t = (k: string) => STR[k]?.[locale] ?? STR[k]?.pt ?? k;
  const sb = useMemo(() => createClient(), []);

  const [gcal, setGcal] = useState<{ connected: boolean; email?: string } | null>(null);
  const [mscal, setMscal] = useState<{ connected: boolean; email?: string } | null>(null);
  const [pull, setPull] = useState<Record<string, any>>({});
  const [icsUrl, setIcsUrl] = useState<string>('');
  const [icsCopied, setIcsCopied] = useState(false);

  useEffect(() => {
    (async () => {
      try { const { data } = await sb.rpc('nl_scheduling_oauth_status_all'); if (data) { setGcal(data.google); setMscal(data.microsoft); } } catch {}
      try { const { data } = await sb.rpc('nl_calendar_pull_status'); if (data) setPull(data); } catch {}
    })();
  }, [sb]);

  async function connectGoogle() {
    try { const { data } = await sb.rpc('nl_google_calendar_connect_url', { p_locale: locale }); if (data?.ok && data.auth_url) window.location.href = data.auth_url; } catch {}
  }
  async function disconnectGoogle() {
    try { await sb.rpc('nl_scheduling_oauth_disconnect', { p_provider: 'google' }); setGcal({ connected: false }); } catch {}
  }
  async function connectMicrosoft() {
    try {
      const { data } = await sb.rpc('nl_microsoft_calendar_connect_url', { p_locale: locale });
      if (data?.ok && data.auth_url) window.location.href = data.auth_url;
      else if (data?.error === 'oauth_not_configured') alert('Microsoft OAuth ainda n\u00e3o configurado.');
    } catch {}
  }
  async function disconnectMicrosoft() {
    try { await sb.rpc('nl_scheduling_oauth_disconnect', { p_provider: 'microsoft' }); setMscal({ connected: false }); } catch {}
  }
  async function setPullState(provider: string, enabled: boolean, detail: string) {
    setPull((p) => ({ ...p, [provider]: { ...(p[provider] || {}), pull_enabled: enabled, detail_level: detail, connected: true } }));
    try { await sb.rpc('nl_calendar_pull_set', { p_provider: provider, p_enabled: enabled, p_detail_level: detail }); } catch {}
  }
  async function getIcsLink() {
    try { const { data } = await sb.rpc('nl_calendar_ics_token'); if (data?.ok && data.token) setIcsUrl('https://obpezocujzdaznrdgwoo.supabase.co/functions/v1/calendar-ics?token=' + data.token); } catch {}
  }
  function copyIcs() {
    if (!icsUrl) return;
    navigator.clipboard?.writeText(icsUrl);
    setIcsCopied(true); setTimeout(() => setIcsCopied(false), 1600);
  }

  return (
    <div className="space-y-6">
      <AppPageHeader backHref="/conta" title={`\ud83d\udcc5 ${t('title')}`} description={t('subtitle')} />

      <div className="grid gap-3 sm:grid-cols-2">
        {/* Google */}
        <Card className="!p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                <CalendarDays className="h-4 w-4 text-violet-600 shrink-0" />{t('gcal_title')}
                {gcal?.connected && <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700">{t('connected')}</span>}
              </div>
              <p className="text-xs text-slate-500 mt-0.5 leading-snug">{gcal?.connected && gcal.email ? gcal.email : t('gcal_hint')}</p>
            </div>
            {gcal?.connected ? (
              <button onClick={disconnectGoogle} className="text-xs font-semibold text-slate-500 hover:text-rose-600 px-3 py-1.5 rounded-lg border border-slate-200">{t('disconnect')}</button>
            ) : (
              <button onClick={connectGoogle} className="text-xs font-semibold text-white bg-violet-600 hover:bg-violet-700 px-3 py-1.5 rounded-lg">{t('connect')}</button>
            )}
          </div>
          <PullControls provider="google" connected={!!gcal?.connected} st={pull.google} onSet={setPullState} t={t} />
        </Card>

        {/* Outlook */}
        <Card className="!p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                <CalendarDays className="h-4 w-4 text-violet-600 shrink-0" />{t('mscal_title')}
                {mscal?.connected && <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700">{t('connected')}</span>}
              </div>
              <p className="text-xs text-slate-500 mt-0.5 leading-snug">{mscal?.connected && mscal.email ? mscal.email : t('mscal_hint')}</p>
            </div>
            {mscal?.connected ? (
              <button onClick={disconnectMicrosoft} className="text-xs font-semibold text-slate-500 hover:text-rose-600 px-3 py-1.5 rounded-lg border border-slate-200">{t('disconnect')}</button>
            ) : (
              <button onClick={connectMicrosoft} className="text-xs font-semibold text-white bg-violet-600 hover:bg-violet-700 px-3 py-1.5 rounded-lg">{t('connect')}</button>
            )}
          </div>
          <PullControls provider="microsoft" connected={!!mscal?.connected} st={pull.microsoft} onSet={setPullState} t={t} />
        </Card>

        {/* ICS */}
        <Card className="!p-4 sm:col-span-2">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-900"><CalendarDays className="h-4 w-4 text-violet-600 shrink-0" />{t('ics_title')}</div>
              <p className="text-xs text-slate-500 mt-0.5 leading-snug">{t('ics_hint')}</p>
            </div>
            {!icsUrl && <button onClick={getIcsLink} className="text-xs font-semibold text-white bg-violet-600 hover:bg-violet-700 px-3 py-1.5 rounded-lg shrink-0">{t('ics_get')}</button>}
          </div>
          {icsUrl && (
            <div className="flex items-center gap-2 mt-3">
              <input readOnly value={icsUrl} className="flex-1 min-w-0 rounded-lg border border-slate-200 px-2 py-1.5 text-xs text-slate-600 bg-slate-50" />
              <button onClick={copyIcs} className="inline-flex items-center gap-1.5 text-xs font-semibold text-violet-700 bg-violet-50 hover:bg-violet-100 rounded-lg px-3 py-1.5 shrink-0">
                {icsCopied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}{icsCopied ? t('copied') : t('ics_copy')}
              </button>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
