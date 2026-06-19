'use client';

import { useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';

interface Props { url: string; title?: string }

function parseUrl(url: string): { type: 'youtube' | 'vimeo' | 'hls' | 'mp4' | 'iframe'; embedUrl: string } | null {
  try {
    const u = new URL(url);
    if (u.hostname.includes('youtube.com') || u.hostname.includes('youtu.be')) {
      let id: string | null = null;
      if (u.hostname.includes('youtu.be')) id = u.pathname.slice(1);
      else if (u.searchParams.get('v')) id = u.searchParams.get('v');
      else if (u.pathname.startsWith('/embed/')) id = u.pathname.replace('/embed/', '');
      if (id) return { type: 'youtube', embedUrl: `https://www.youtube.com/embed/${id}?rel=0&modestbranding=1` };
    }
    if (u.hostname.includes('vimeo.com')) {
      const id = u.pathname.replace(/^\//, '').split('/')[0];
      if (id) return { type: 'vimeo', embedUrl: `https://player.vimeo.com/video/${id}?byline=0&portrait=0` };
    }
    // Mux / HLS — streaming adaptativo (.m3u8). stream.mux.com/{id}.m3u8 ou qualquer HLS.
    if (u.hostname.includes('mux.com') || /\.m3u8($|\?)/i.test(u.pathname)) {
      return { type: 'hls', embedUrl: url };
    }
    if (/\.(mp4|webm|ogv)$/i.test(u.pathname)) return { type: 'mp4', embedUrl: url };
    return { type: 'iframe', embedUrl: url };
  } catch { return null; }
}

// Reprodutor HLS: nativo no Safari/iOS; hls.js (via CDN, sem dependencia npm) no Chrome/Firefox/Edge.
function HlsPlayer({ src, title }: { src: string; title?: string }) {
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = src;
      return;
    }
    let cancelled = false;
    let hls: any = null;
    (async () => {
      const w = window as any;
      if (!w.Hls) {
        await new Promise<void>((resolve) => {
          const s = document.createElement('script');
          s.src = 'https://cdn.jsdelivr.net/npm/hls.js@1.5.13/dist/hls.min.js';
          s.async = true;
          s.onload = () => resolve();
          s.onerror = () => resolve();
          document.head.appendChild(s);
        });
      }
      if (cancelled) return;
      const Hls = w.Hls;
      if (Hls && Hls.isSupported()) {
        hls = new Hls({ enableWorker: true });
        hls.loadSource(src);
        hls.attachMedia(video);
      } else {
        video.src = src;
      }
    })();
    return () => { cancelled = true; if (hls) { try { hls.destroy(); } catch { /* noop */ } } };
  }, [src]);
  return (
    <div className="relative rounded-xl overflow-hidden bg-black aspect-video">
      <video ref={ref} controls preload="metadata" playsInline className="absolute inset-0 w-full h-full" title={title} />
    </div>
  );
}

export function VideoEmbed({ url, title }: Props) {
  const t = useTranslations('vembed');
  const parsed = parseUrl(url);
  if (!parsed) {
    return (
      <div className="rounded-xl bg-slate-100 p-6 text-sm text-slate-500 text-center">
        {t('invalid_url')} <a href={url} className="text-brand-600 underline" target="_blank" rel="noopener noreferrer">{t('open_new_window')}</a>
      </div>
    );
  }

  if (parsed.type === 'hls') return <HlsPlayer src={parsed.embedUrl} title={title} />;

  if (parsed.type === 'mp4') {
    return (
      <div className="relative rounded-xl overflow-hidden bg-black aspect-video">
        <video src={parsed.embedUrl} controls preload="metadata" playsInline className="absolute inset-0 w-full h-full" title={title} />
      </div>
    );
  }

  return (
    <div className="relative rounded-xl overflow-hidden bg-black aspect-video">
      <iframe
        src={parsed.embedUrl}
        title={title || t('lesson_video')}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
        loading="lazy"
        className="absolute inset-0 w-full h-full border-0"
      />
    </div>
  );
}
