'use client';

import { AppPageHeader } from '@/components/layout/AppPageHeader';
import { useEffect, useState, useCallback, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useTranslations, useLocale } from 'next-intl';
import { toast } from 'sonner';
import { Loader2, Video, Calendar, Users, ArrowLeft, PlayCircle, LogIn } from 'lucide-react';

type Sess = {
  id: string; title: string; description: string | null; session_kind: string; visibility: string; status: string;
  starts_at: string | null; ends_at: string | null; attendees_count: number | null; attendees_max: number | null;
  is_recorded: boolean; recording_available: boolean; recording_url: string | null; course_id: string | null; instructor: string;
};

type HlsCtor = { isSupported: () => boolean; new (): { loadSource: (s: string) => void; attachMedia: (v: HTMLVideoElement) => void; destroy: () => void } };

function MuxLivePlayer({ src }: { src: string }) {
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const video = ref.current; if (!video) return;
    let destroyed = false;
    let hlsInstance: { destroy: () => void } | null = null;
    const getHls = (): HlsCtor | undefined => (window as unknown as { Hls?: HlsCtor }).Hls;
    const init = () => {
      if (destroyed) return;
      const H = getHls();
      if (H && H.isSupported()) { const h = new H(); h.loadSource(src); h.attachMedia(video); hlsInstance = h; }
      else { video.src = src; }
    };
    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = src;
    } else if (getHls()) {
      init();
    } else {
      const sc = document.createElement('script');
      sc.src = 'https://cdn.jsdelivr.net/npm/hls.js@1';
      sc.onload = init;
      sc.onerror = () => { video.src = src; };
      document.body.appendChild(sc);
    }
    return () => { destroyed = true; if (hlsInstance) hlsInstance.destroy(); };
  }, [src]);
  return <video ref={ref} controls autoPlay playsInline className="w-full h-full bg-black" />;
}

export function SessionRoom({ sessionId }: { sessionId: string }) {
  const t = useTranslations();
  const locale = useLocale();
  const [sess, setSess] = useState<Sess | null>(null);
  const [registered, setRegistered] = useState(false);
  const [authed, setAuthed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [room, setRoom] = useState<{ url: string; provider: string } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const sb = createClient();
      const { data } = await sb.rpc('nl_live_session_get', { p_session_id: sessionId });
      const res = data as { ok: boolean; session?: Sess; registered?: boolean; authenticated?: boolean };
      if (res?.ok && res.session) { setSess(res.session); setRegistered(!!res.registered); setAuthed(!!res.authenticated); }
    } catch { /* noop */ }
    finally { setLoading(false); }
  }, [sessionId]);

  useEffect(() => { load(); }, [load]);

  async function register() {
    try {
      const sb = createClient();
      const { data, error } = await sb.rpc('nl_live_session_register', { p_session_id: sessionId });
      if (error) throw error;
      if ((data as { ok: boolean })?.ok) { setRegistered(true); toast.success(t('learn.session.registered')); }
    } catch { toast.error(t('learn.session.error')); }
  }

  async function join() {
    setJoining(true);
    try {
      const sb = createClient();
      const { data, error } = await sb.rpc('nl_live_session_join', { p_session_id: sessionId });
      if (error) throw error;
      const res = data as { ok: boolean; url?: string; provider?: string; error?: string };
      if (!res?.ok) {
        if (res?.error === 'not_enrolled') toast.error(t('learn.session.not_enrolled'));
        else if (res?.error === 'unauthenticated') toast.error(t('learn.session.login_required'));
        else toast.error(t('learn.session.error'));
        return;
      }
      if (res.url) setRoom({ url: res.url, provider: res.provider || 'daily' });
    } catch { toast.error(t('learn.session.error')); }
    finally { setJoining(false); }
  }

  if (loading) return <div className="flex justify-center py-24"><Loader2 className="w-6 h-6 animate-spin text-neutral-400" /></div>;
  if (!sess) return <div className="py-16 text-center text-neutral-500">{t('learn.session.error')}</div>;

  const isHls = !!room && (room.provider === 'mux_live' || room.url.endsWith('.m3u8'));

  if (room && (room.provider === 'daily' || isHls)) {
    return (
      <div className="fixed inset-0 z-40 bg-black flex flex-col">
        <div className="flex items-center justify-between px-4 py-2 bg-neutral-900 text-white">
          <span className="text-sm font-medium truncate">{sess.title}</span>
          <button onClick={() => setRoom(null)} className="text-xs text-neutral-300 hover:text-white inline-flex items-center gap-1"><ArrowLeft className="w-4 h-4" /> {t('learn.session.back')}</button>
        </div>
        {isHls ? (
          <div className="flex-1 min-h-0"><MuxLivePlayer src={room.url} /></div>
        ) : (
          <iframe src={room.url} className="flex-1 w-full border-0" allow="camera; microphone; fullscreen; speaker; display-capture; autoplay; clipboard-write" />
        )}
      </div>
    );
  }

  const fmt = (iso: string | null) => iso ? new Date(iso).toLocaleString(locale, { dateStyle: 'full', timeStyle: 'short' }) : '—';

  return (
    <div className="py-8">
      <a href={`/${locale}/learn`} className="inline-flex items-center gap-1.5 text-sm text-neutral-500 hover:text-neutral-800 mb-4"><ArrowLeft className="w-4 h-4" /> {t('learn.session.back')}</a>
      <div className="rounded-2xl border border-neutral-200 bg-white overflow-hidden">
        <AppPageHeader title={sess.title} description={sess.instructor || undefined} />
        <div className="p-6 space-y-4">
          {sess.description && <p className="text-neutral-600 text-sm whitespace-pre-wrap">{sess.description}</p>}
          <div className="flex items-center gap-4 text-sm text-neutral-500 flex-wrap">
            <span className="inline-flex items-center gap-1.5"><Calendar className="w-4 h-4" /> {t('learn.session.starts')}: {fmt(sess.starts_at)}</span>
            <span className="inline-flex items-center gap-1.5"><Users className="w-4 h-4" /> {sess.attendees_count || 0}{sess.attendees_max ? `/${sess.attendees_max}` : ''}</span>
          </div>

          {!authed ? (
            <a href={`/${locale}/login`} className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-neutral-900 text-white px-4 py-3 text-sm font-medium hover:bg-neutral-800"><LogIn className="w-4 h-4" /> {t('learn.session.login_required')}</a>
          ) : (
            <div className="flex flex-col gap-2">
              {(sess.visibility !== 'enrolled' && !registered) && (
                <button onClick={register} className="w-full rounded-xl border border-neutral-300 px-4 py-3 text-sm font-medium hover:border-neutral-400">{t('learn.session.register')}</button>
              )}
              <button onClick={join} disabled={joining} className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-neutral-900 text-white px-4 py-3 text-sm font-medium hover:bg-neutral-800 disabled:opacity-50">
                {joining ? <Loader2 className="w-4 h-4 animate-spin" /> : <Video className="w-4 h-4" />} {joining ? t('learn.session.joining') : t('learn.session.join')}
              </button>
            </div>
          )}

          {sess.recording_available && sess.recording_url && (
            <a href={sess.recording_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-sm text-blue-700 hover:underline"><PlayCircle className="w-4 h-4" /> {t('learn.session.recording')}</a>
          )}
        </div>
      </div>
    </div>
  );
}
