'use client';

import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';

function mmss(s: number): string {
  if (!isFinite(s) || s < 0) s = 0;
  const m = Math.floor(s / 60);
  const ss = Math.floor(s % 60);
  return `${m}:${ss.toString().padStart(2, '0')}`;
}

// Corte de vídeo no browser via ffmpeg.wasm (carregado em lazy, só quando se corta).
// Corte por cópia de fluxo (rápido, sem recodificar) — alinha o início ao keyframe mais próximo.
export function VideoTrimmer({ blob, onTrimmed, defaultOpen = false }: { blob: Blob | null; onTrimmed?: (b: Blob, url: string) => void; defaultOpen?: boolean }) {
  const t = useTranslations('studio');
  const [open, setOpen] = useState(defaultOpen);
  const [url, setUrl] = useState<string | null>(null);
  const [duration, setDuration] = useState(0);
  const [start, setStart] = useState(0);
  const [end, setEnd] = useState(0);
  const [busy, setBusy] = useState(false);
  const [pct, setPct] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    if (!blob) { setUrl(null); return; }
    const u = URL.createObjectURL(blob);
    setUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [blob]);

  function onMeta() {
    const d = videoRef.current?.duration || 0;
    if (isFinite(d) && d > 0) { setDuration(d); setStart(0); setEnd(d); }
  }
  function seekTo(s: number) { if (videoRef.current) videoRef.current.currentTime = Math.min(Math.max(s, 0), duration); }
  function changeStart(v: number) { const s = Math.min(v, end - 0.5); setStart(Math.max(0, s)); seekTo(s); }
  function changeEnd(v: number) { const e = Math.max(v, start + 0.5); setEnd(Math.min(duration, e)); seekTo(e); }
  function reset() { setStart(0); setEnd(duration); setError(null); }

  async function cut() {
    if (!blob || busy) return;
    setBusy(true); setError(null); setPct(null);
    try {
      const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.10/dist/umd';
      const { FFmpeg } = await import('@ffmpeg/ffmpeg');
      const { toBlobURL, fetchFile } = await import('@ffmpeg/util');
      const ffmpeg = new FFmpeg();
      ffmpeg.on('progress', ({ progress }: { progress: number }) => {
        if (isFinite(progress)) setPct(Math.max(0, Math.min(100, Math.round(progress * 100))));
      });
      await ffmpeg.load({
        coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
        wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
      });
      await ffmpeg.writeFile('in.webm', await fetchFile(blob));
      const dur = Math.max(0.1, end - start);
      await ffmpeg.exec(['-ss', start.toFixed(3), '-i', 'in.webm', '-t', dur.toFixed(3), '-c', 'copy', 'out.webm']);
      const data = (await ffmpeg.readFile('out.webm')) as Uint8Array;
      const out = new Blob([data.buffer as ArrayBuffer], { type: 'video/webm' });
      if (out.size < 1024) throw new Error('empty_output');
      const outUrl = URL.createObjectURL(out);
      setUrl(outUrl);
      setDuration(dur); setStart(0); setEnd(dur);
      onTrimmed?.(out, outUrl);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'trim_failed');
    } finally {
      setBusy(false); setPct(null);
    }
  }

  if (!blob) return null;

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)}
        className="w-full inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-medium text-slate-600 hover:border-slate-300 transition-all">
        ✂️ {t('trim_open')}
      </button>
    );
  }

  const selStartPct = duration > 0 ? (start / duration) * 100 : 0;
  const selEndPct = duration > 0 ? (end / duration) * 100 : 100;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2 bg-slate-50 border-b border-slate-200">
        <span className="text-sm font-semibold text-slate-700">✂️ {t('trim_title')}</span>
        <button type="button" onClick={() => setOpen(false)} aria-label={t('tp_close')} className="text-slate-400 hover:text-slate-700 px-1">✕</button>
      </div>
      <div className="p-3 space-y-3">
        {url && <video ref={videoRef} src={url} controls onLoadedMetadata={onMeta} className="w-full rounded-lg bg-black aspect-video" />}

        <div className="relative h-2 rounded-full bg-slate-200">
          <div className="absolute h-2 rounded-full bg-brand-500" style={{ left: `${selStartPct}%`, right: `${100 - selEndPct}%` }} />
        </div>

        <div className="space-y-2">
          <label className="block">
            <div className="flex justify-between text-xs text-slate-500 mb-1"><span>{t('trim_start')}</span><span className="tabular-nums">{mmss(start)}</span></div>
            <input type="range" min={0} max={Math.max(duration, 0.5)} step={0.1} value={start} disabled={busy}
              onChange={(e) => changeStart(Number(e.target.value))} className="w-full accent-brand-600" />
          </label>
          <label className="block">
            <div className="flex justify-between text-xs text-slate-500 mb-1"><span>{t('trim_end')}</span><span className="tabular-nums">{mmss(end)}</span></div>
            <input type="range" min={0} max={Math.max(duration, 0.5)} step={0.1} value={end} disabled={busy}
              onChange={(e) => changeEnd(Number(e.target.value))} className="w-full accent-brand-600" />
          </label>
        </div>

        <div className="flex items-center justify-between text-xs text-slate-500">
          <span className="tabular-nums">{t('trim_selected', { d: mmss(end - start) })}</span>
          <button type="button" onClick={reset} disabled={busy} className="text-slate-500 hover:text-slate-800 disabled:opacity-40">↺ {t('trim_reset')}</button>
        </div>

        {error && <p className="text-xs text-rose-600 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">{t('trim_error')}</p>}

        <button type="button" onClick={cut} disabled={busy || end - start < 0.5}
          className="btn-primary w-full disabled:opacity-50">
          {busy ? (pct != null ? `${t('trim_processing')} ${pct}%` : t('trim_processing')) : `✂️ ${t('trim_cut')}`}
        </button>
        <p className="text-[11px] text-slate-400">{t('trim_hint')}</p>
      </div>
    </div>
  );
}
