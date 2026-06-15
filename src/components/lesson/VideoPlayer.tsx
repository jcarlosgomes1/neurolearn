'use client';

import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';

interface Props {
  playbackId?: string | null;
  videoUrl?: string | null;
  thumbnail?: string | null;
  title?: string;
  aspectRatio?: string | null;
  signedToken?: string;
  onTimeUpdate?: (seconds: number) => void;
  onEnded?: () => void;
}

const HLS_SCRIPT_ID = 'hlsjs-cdn';
const HLS_SRC = 'https://cdn.jsdelivr.net/npm/hls.js@1.5.13/dist/hls.min.js';

declare global {
  interface Window { Hls?: any; }
}

export function VideoPlayer({ playbackId, videoUrl, thumbnail, title, aspectRatio, signedToken, onTimeUpdate, onEnded }: Props) {
  const t = useTranslations('vp');
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  const src = videoUrl || (playbackId 
    ? `https://stream.mux.com/${playbackId}.m3u8${signedToken ? `?token=${signedToken}` : ''}`
    : null);
  // Apenas streams HLS (.m3u8, ex. Mux) passam por HLS.js. Ficheiros diretos
  // (webm/mp4 — ex. gravacoes do estudio guardadas em Storage) tocam nativamente,
  // caso contrario HLS.js tenta interpretar o ficheiro como manifesto e falha.
  const isHls = !!src && src.includes('.m3u8');

  useEffect(() => {
    if (!src || !videoRef.current) return;
    const video = videoRef.current;

    if (!isHls) {
      video.src = src;
      setReady(true);
      return;
    }

    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = src;
      setReady(true);
      return;
    }

    function loadHls() {
      return new Promise<void>((resolve, reject) => {
        if (window.Hls) return resolve();
        const existing = document.getElementById(HLS_SCRIPT_ID) as HTMLScriptElement | null;
        if (existing) {
          existing.addEventListener('load', () => resolve());
          existing.addEventListener('error', () => reject(new Error('HLS.js load failed')));
          return;
        }
        const script = document.createElement('script');
        script.id = HLS_SCRIPT_ID;
        script.src = HLS_SRC;
        script.async = true;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error('HLS.js load failed'));
        document.head.appendChild(script);
      });
    }

    let hls: any = null;
    loadHls().then(() => {
      if (!window.Hls) { setError(t('err_hls_unavailable')); return; }
      if (window.Hls.isSupported()) {
        hls = new window.Hls();
        hls.loadSource(src);
        hls.attachMedia(video);
        hls.on(window.Hls.Events.MANIFEST_PARSED, () => setReady(true));
        hls.on(window.Hls.Events.ERROR, (_e: unknown, data: any) => {
          if (data.fatal) setError(t('err_streaming', { type: data.type }));
        });
      } else {
        setError(t('err_no_hls'));
      }
    }).catch((e) => setError(e.message));

    return () => { if (hls) hls.destroy(); };
  }, [src, isHls, t]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    function handleTime() { onTimeUpdate?.(video!.currentTime); }
    function handleEnded() { onEnded?.(); }
    video.addEventListener('timeupdate', handleTime);
    video.addEventListener('ended', handleEnded);
    return () => {
      video.removeEventListener('timeupdate', handleTime);
      video.removeEventListener('ended', handleEnded);
    };
  }, [onTimeUpdate, onEnded]);

  const ratio = aspectRatio || '16:9';
  const [w, h] = ratio.split(':').map(Number);
  const paddingTop = w && h ? `${(h / w) * 100}%` : '56.25%';

  if (!src) {
    return (
      <div className="bg-slate-100 rounded-xl flex items-center justify-center text-slate-400" style={{ paddingTop, position: 'relative' }}>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-sm">{t('no_video')}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-black rounded-xl overflow-hidden relative" style={{ paddingTop }}>
      <video
        ref={videoRef}
        controls
        playsInline
        poster={thumbnail || undefined}
        preload="metadata"
        className="absolute inset-0 w-full h-full"
        aria-label={title || t('aria_label')}
      >
        {videoRef.current?.canPlayType('application/vnd.apple.mpegurl') && <source src={src} type="application/vnd.apple.mpegurl" />}
      </video>
      {!ready && !error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/30 pointer-events-none">
          <div className="text-white text-sm flex gap-1.5">
            <span className="w-2 h-2 rounded-full bg-white animate-bounce" style={{ animationDelay: '0ms' }} />
            <span className="w-2 h-2 rounded-full bg-white animate-bounce" style={{ animationDelay: '150ms' }} />
            <span className="w-2 h-2 rounded-full bg-white animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
        </div>
      )}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-rose-950/80 text-white text-sm px-4 text-center">
          ⚠ {error}
        </div>
      )}
    </div>
  );
}
