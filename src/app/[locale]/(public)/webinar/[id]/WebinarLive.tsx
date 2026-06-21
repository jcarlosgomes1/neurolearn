'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useTranslations, useLocale } from 'next-intl';
import { toast } from 'sonner';
import { Loader2, Radio, Calendar, Users, PlayCircle, CheckCircle2 } from 'lucide-react';

type Sess = {
  id: string; title: string; description: string | null; status: string; starts_at: string | null; ends_at: string | null;
  attendees_count: number | null; attendees_max: number | null; has_stream: boolean; is_recorded: boolean;
  recording_available: boolean; recording_url: string | null; host: string;
};

type HlsCtor = { isSupported: () => boolean; new (): { loadSource: (s: string) => void; attachMedia: (v: HTMLVideoElement) => void; destroy: () => void } };

function HlsPlayer({ src }: { src: string }) {
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const video = ref.current; if (!video) return;
    let destroyed = false; let inst: { destroy: () => void } | null = null;
    const getHls = (): HlsCtor | undefined => (window as unknown as { Hls?: HlsCtor }).Hls;
    const init = () => { if (destroyed) return; const H = getHls(); if (H && H.isSupported()) { const h = new H(); h.loadSource(src); h.attachMedia(video); inst = h; } else { video.src = src; } };
    if (video.canPlayType('application/vnd.apple.mpegurl')) video.src = src;
    else if (getHls()) init();
    else { const sc = document.createElement('script'); sc.src = 'https://cdn.jsdelivr.net/npm/hls.js@1'; sc.onload = init; sc.onerror = () => { video.src = src; }; document.body.appendChild(sc); }
    return () => { destroyed = true; if (inst) inst.destroy(); };
  }, [src]);
  return <video ref={ref} controls autoPlay playsInline className="w-full aspect-video bg-black rounded-2xl" />;
}

export function WebinarLive({ sessionId }: { sessionId: string }) {
  const t = useTranslations();
  const locale = useLocale();
  const [sess, setSess] = useState<Sess | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [registering, setRegistering] = useState(false);
  const [registered, setRegistered] = useState(false);
  const [playback, setPlayback] = useState<string | null>(null);

  const doRegister = useCallback(async (mail: string, nm: string | null, silent: boolean) => {
    const sb = createClient();
    const { data, error } = await sb.rpc('nl_webinar_register_guest', { p_session_id: sessionId, p_email: mail, p_name: nm, p_lang: locale });
    if (error) { if (!silent) toast.error(t('webinar.error')); return false; }
    const res = data as { ok: boolean; playback_url?: string | null };
    if (!res?.ok) { if (!silent) toast.error(t('webinar.error')); return false; }
    setRegistered(true);
    if (res.playback_url) setPlayback(res.playback_url);
    return true;
  }, [sessionId, locale, t]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const sb = createClient();
      const { data } = await sb.rpc('nl_webinar_public_get', { p_session_id: sessionId });
      const res = data as { ok: boolean; session?: Sess };
      if (res?.ok && res.session) setSess(res.session); else setNotFound(true);
    } catch { setNotFound(true); }
    finally { setLoading(false); }
  }, [sessionId]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    let mail = '';
    try { mail = localStorage.getItem('webinar_email_' + sessionId) || ''; } catch { mail = ''; }
    if (mail) { doRegister(mail, null, true); }
  }, [sessionId, doRegister]);

  async function onSubmit() {
    if (!email || email.indexOf('@') < 1) { toast.error(t('webinar.invalid_email')); return; }
    setRegistering(true);
    const ok = await doRegister(email.trim().toLowerCase(), name.trim() || null, false);
    if (ok) { try { localStorage.setItem('webinar_email_' + sessionId, email.trim().toLowerCase()); } catch { /* noop */ } }
    setRegistering(false);
  }

  if (loading) return <div className="flex justify-center py-24"><Loader2 className="w-6 h-6 animate-spin text-neutral-400" /></div>;
  if (notFound || !sess) return <div className="max-w-2xl mx-auto px-4 py-24 text-center text-neutral-500">{t('webinar.not_found')}</div>;

  const fmt = (iso: string | null) => iso ? new Date(iso).toLocaleString(locale, { dateStyle: 'full', timeStyle: 'short' }) : '';

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <div className="rounded-3xl border border-neutral-200 bg-white overflow-hidden shadow-sm">
        <div className="bg-gradient-to-br from-violet-700 via-violet-600 to-indigo-600 p-8 text-white">
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-white/15 mb-4"><Radio className="w-3.5 h-3.5" /> {t('webinar.live_badge')}</div>
          <h1 className="text-3xl font-display font-semibold leading-tight">{sess.title}</h1>
          {sess.host && <p className="text-white/80 text-sm mt-2">{t('webinar.by')} {sess.host}</p>}
          <div className="flex items-center gap-4 text-sm text-white/80 mt-4 flex-wrap">
            {sess.starts_at && <span className="inline-flex items-center gap-1.5"><Calendar className="w-4 h-4" /> {fmt(sess.starts_at)}</span>}
            <span className="inline-flex items-center gap-1.5"><Users className="w-4 h-4" /> {sess.attendees_count || 0} {t('webinar.attendees')}</span>
          </div>
        </div>

        <div className="p-8 space-y-5">
          {sess.description && <p className="text-neutral-600 whitespace-pre-wrap">{sess.description}</p>}

          {registered && playback ? (
            <div className="space-y-3">
              <HlsPlayer src={playback} />
              <p className="text-xs text-neutral-400">{t('webinar.watch_now')}</p>
            </div>
          ) : registered ? (
            <div className="rounded-2xl bg-emerald-50 border border-emerald-100 p-5 text-center">
              <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
              <h3 className="font-semibold text-emerald-900">{t('webinar.registered_title')}</h3>
              <p className="text-sm text-emerald-700 mt-1">{t('webinar.registered_msg')}</p>
            </div>
          ) : (
            <div className="rounded-2xl border border-neutral-200 p-5">
              <h3 className="font-semibold text-neutral-900 mb-3">{t('webinar.register_title')}</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-neutral-600 mb-1">{t('webinar.name')}</label>
                  <input value={name} onChange={(e) => setName(e.target.value)} className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-600 mb-1">{t('webinar.email')}</label>
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm" />
                </div>
                <button onClick={onSubmit} disabled={registering} className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-neutral-900 text-white px-4 py-3 text-sm font-medium hover:bg-neutral-800 disabled:opacity-50">
                  {registering ? <Loader2 className="w-4 h-4 animate-spin" /> : <PlayCircle className="w-4 h-4" />} {t('webinar.register_cta')}
                </button>
              </div>
            </div>
          )}

          {sess.recording_available && sess.recording_url && (
            <a href={sess.recording_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-sm text-violet-700 hover:underline"><PlayCircle className="w-4 h-4" /> {t('webinar.recording')}</a>
          )}
        </div>
      </div>
    </div>
  );
}
