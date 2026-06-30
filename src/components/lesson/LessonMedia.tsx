'use client';

import { useEffect, useRef, useState } from 'react';
import { LessonTranscript, type TranscriptSegment } from './LessonTranscript';

interface Caption {
  lang: string;
  label: string;
  src: string;
}

interface Props {
  src: string;
  poster?: string | null;
  title?: string;
  captions?: Caption[];
  segments: TranscriptSegment[];
  status?: string;
  available?: string[];
  lang?: string;
  onLangChange?: (lang: string) => void;
}

const HLS_SRC = 'https://cdn.jsdelivr.net/npm/hls.js@1.5.13/dist/hls.min.js';

function vttStamp(s: number): string {
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), ss = Math.floor(s % 60), ms = Math.round((s % 1) * 1000);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(ss).padStart(2, '0')}.${String(ms).padStart(3, '0')}`;
}
function buildVttDataUrl(segs: TranscriptSegment[]): string {
  const vtt = 'WEBVTT\n\n' + segs.map((s, i) => `${i + 1}\n${vttStamp(s.start)} --> ${vttStamp(s.end)}\n${s.text}`).join('\n\n');
  return 'data:text/vtt;charset=utf-8,' + encodeURIComponent(vtt);
}

export function LessonMedia({ src, poster, title, captions = [], segments, status, available = [], lang, onLangChange }: Props) {
  const ref = useRef<HTMLVideoElement>(null);
  const [now, setNow] = useState(0);
  const isHls = /\.m3u8($|\?)/i.test(src);

  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    if (!isHls) { v.src = src; return; }
    if (v.canPlayType('application/vnd.apple.mpegurl')) { v.src = src; return; }
    let cancelled = false;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let hls: any = null;
    (async () => {
      const w = window as unknown as { Hls?: any };
      if (!w.Hls) {
        await new Promise<void>((resolve) => {
          const s = document.createElement('script');
          s.src = HLS_SRC; s.async = true;
          s.onload = () => resolve(); s.onerror = () => resolve();
          document.head.appendChild(s);
        });
      }
      if (cancelled) return;
      const Hls = w.Hls;
      if (Hls && Hls.isSupported()) {
        hls = new Hls({ enableWorker: true });
        hls.loadSource(src);
        hls.attachMedia(v);
      } else {
        v.src = src;
      }
    })();
    return () => { cancelled = true; if (hls) { try { hls.destroy(); } catch { /* noop */ } } };
  }, [src, isHls]);

  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    const h = () => setNow(v.currentTime);
    v.addEventListener('timeupdate', h);
    return () => v.removeEventListener('timeupdate', h);
  }, []);

  function seek(s: number) {
    const v = ref.current;
    if (!v) return;
    v.currentTime = s;
    const p = v.play?.();
    if (p) void p.catch(() => { /* autoplay may be blocked; ignore */ });
  }

  // Se não vierem legendas explícitas, gera-as a partir dos segmentos (mesmo texto da transcrição).
  const autoCaptions: Caption[] = captions.length
    ? captions
    : (segments.length ? [{ lang: lang || 'pt', label: (lang || 'pt').toUpperCase(), src: buildVttDataUrl(segments) }] : []);
  const needsCors = autoCaptions.some((c) => /^https?:/i.test(c.src));

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
      <div className="relative rounded-2xl overflow-hidden bg-black aspect-video">
        <video
          ref={ref}
          controls
          preload="metadata"
          playsInline
          poster={poster || undefined}
          title={title}
          crossOrigin={needsCors ? 'anonymous' : undefined}
          className="absolute inset-0 w-full h-full"
        >
          {autoCaptions.map((c, i) => (
            <track key={c.lang} kind="subtitles" src={c.src} srcLang={c.lang} label={c.label} default={i === 0} />
          ))}
        </video>
      </div>
      <LessonTranscript
        segments={segments}
        activeTime={now}
        status={status}
        available={available}
        lang={lang}
        onLangChange={onLangChange}
        onSeek={seek}
      />
    </div>
  );
}
