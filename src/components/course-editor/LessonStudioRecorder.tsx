'use client';

import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

type Source = 'screen' | 'camera' | 'slides';
type Phase = 'idle' | 'preview' | 'recording' | 'recorded' | 'uploading';

interface Slide {
  kind: 'generated' | 'image';
  title?: string;
  bullets?: string[];
  imageUrl?: string;
  _img?: HTMLImageElement;
}

interface LessonContent {
  p?: string[];
  kp?: string[];
  code?: string;
  tip?: string;
}

interface Props {
  onUploaded: (url: string) => void;
  currentUrl?: string | null;
  lessonTitle?: string;
  content?: LessonContent;
}

// Estúdio de autoria: slides nativos (gerados do conteúdo) ou imagens + webcam overlay,
// ou ecrã + webcam, compostos num canvas → WebM → Storage.
export function LessonStudioRecorder({ onUploaded, currentUrl, lessonTitle, content }: Props) {
  const t = useTranslations('studio');
  const [source, setSource] = useState<Source>('slides');
  const [phase, setPhase] = useState<Phase>('idle');
  const [seconds, setSeconds] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [withCam, setWithCam] = useState(true);
  const [slides, setSlides] = useState<Slide[]>([]);
  const [slideIdx, setSlideIdx] = useState(0);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const camVideoRef = useRef<HTMLVideoElement | null>(null);
  const screenVideoRef = useRef<HTMLVideoElement | null>(null);
  const slideIdxRef = useRef(0);
  const slidesRef = useRef<Slide[]>([]);

  const screenStream = useRef<MediaStream | null>(null);
  const camStream = useRef<MediaStream | null>(null);
  const mixedStream = useRef<MediaStream | null>(null);
  const recorder = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);
  const rafId = useRef<number | null>(null);
  const timerId = useRef<ReturnType<typeof setInterval> | null>(null);
  const recordedBlob = useRef<Blob | null>(null);

  // Gerar slides a partir do conteúdo da lição
  const generatedSlides = useMemo<Slide[]>(() => {
    const out: Slide[] = [];
    if (lessonTitle) out.push({ kind: 'generated', title: lessonTitle, bullets: content?.kp?.slice(0, 5) || [] });
    (content?.p || []).forEach((para, i) => {
      const sentences = para.split(/(?<=[.!?])\s+/).filter(Boolean);
      out.push({ kind: 'generated', title: `${i + 1}`, bullets: sentences.slice(0, 4) });
    });
    if (content?.tip) out.push({ kind: 'generated', title: '💡', bullets: [content.tip] });
    return out;
  }, [lessonTitle, content]);

  useEffect(() => { slideIdxRef.current = slideIdx; }, [slideIdx]);
  useEffect(() => { slidesRef.current = slides; }, [slides]);

  const stopAll = useCallback(() => {
    if (rafId.current) cancelAnimationFrame(rafId.current);
    if (timerId.current) clearInterval(timerId.current);
    [screenStream, camStream, mixedStream].forEach((s) => {
      s.current?.getTracks().forEach((tr) => tr.stop());
      s.current = null;
    });
  }, []);

  useEffect(() => () => stopAll(), [stopAll]);

  function useGenerated() {
    setSlides(generatedSlides);
    setSlideIdx(0);
    toast.success(t('slides_generated', { n: generatedSlides.length }));
  }

  async function addImages(files: FileList | null) {
    if (!files) return;
    const loaded: Slide[] = [];
    for (const f of Array.from(files)) {
      const url = URL.createObjectURL(f);
      const img = new Image();
      img.src = url;
      await new Promise((res) => { img.onload = res; });
      loaded.push({ kind: 'image', imageUrl: url, _img: img });
    }
    setSlides((prev) => [...prev, ...loaded]);
  }

  function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
    const words = text.split(' ');
    const lines: string[] = [];
    let line = '';
    for (const w of words) {
      const test = line ? `${line} ${w}` : w;
      if (ctx.measureText(test).width > maxWidth && line) { lines.push(line); line = w; }
      else line = test;
    }
    if (line) lines.push(line);
    return lines;
  }

  function drawSlide(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, slide: Slide | undefined) {
    // Fundo gradiente
    const g = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    g.addColorStop(0, '#1e1b4b'); g.addColorStop(1, '#4338ca');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    if (!slide) {
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      ctx.font = '500 36px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(t('no_slides_hint'), canvas.width / 2, canvas.height / 2);
      ctx.textAlign = 'left';
      return;
    }
    if (slide.kind === 'image' && slide._img) {
      const img = slide._img;
      const ar = img.width / img.height, car = canvas.width / canvas.height;
      let dw = canvas.width, dh = canvas.height, dx = 0, dy = 0;
      if (ar > car) { dh = canvas.width / ar; dy = (canvas.height - dh) / 2; }
      else { dw = canvas.height * ar; dx = (canvas.width - dw) / 2; }
      ctx.fillStyle = '#000'; ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, dx, dy, dw, dh);
      return;
    }
    // Slide gerado: título + bullets
    const pad = 96;
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'left';
    if (slide.title) {
      ctx.font = '700 64px system-ui, sans-serif';
      const titleLines = wrapText(ctx, slide.title, canvas.width - pad * 2);
      titleLines.forEach((ln, i) => ctx.fillText(ln, pad, 140 + i * 76));
    }
    const startY = 140 + 90;
    ctx.font = '400 40px system-ui, sans-serif';
    let y = startY;
    (slide.bullets || []).forEach((b) => {
      const lines = wrapText(ctx, b, canvas.width - pad * 2 - 50);
      ctx.fillStyle = '#a5b4fc';
      ctx.fillText('•', pad, y);
      ctx.fillStyle = '#e0e7ff';
      lines.forEach((ln, i) => ctx.fillText(ln, pad + 50, y + i * 52));
      y += lines.length * 52 + 28;
    });
  }

  function drawLoop() {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    const screenV = screenVideoRef.current;
    const camV = camVideoRef.current;

    if (source === 'screen' && screenV && screenV.videoWidth) {
      ctx.drawImage(screenV, 0, 0, canvas.width, canvas.height);
    } else if (source === 'slides') {
      drawSlide(ctx, canvas, slidesRef.current[slideIdxRef.current]);
    } else if (source === 'camera') {
      ctx.fillStyle = '#0f172a'; ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    // Webcam "bolinha" (em ecrã/slides com câmara, ou câmara cheia)
    if (camV && camV.videoWidth && (source === 'camera' || withCam)) {
      if (source === 'camera') {
        const ar = camV.videoWidth / camV.videoHeight, car = canvas.width / canvas.height;
        let dw = canvas.width, dh = canvas.height, dx = 0, dy = 0;
        if (ar > car) { dw = canvas.height * ar; dx = (canvas.width - dw) / 2; }
        else { dh = canvas.width / ar; dy = (canvas.height - dh) / 2; }
        ctx.drawImage(camV, dx, dy, dw, dh);
      } else {
        const d = Math.round(canvas.height * 0.26);
        const x = canvas.width - d - 32, y = canvas.height - d - 32;
        ctx.save();
        ctx.beginPath(); ctx.arc(x + d / 2, y + d / 2, d / 2, 0, Math.PI * 2); ctx.closePath(); ctx.clip();
        const side = Math.min(camV.videoWidth, camV.videoHeight);
        const sx = (camV.videoWidth - side) / 2, sy = (camV.videoHeight - side) / 2;
        ctx.drawImage(camV, sx, sy, side, side, x, y, d, d);
        ctx.restore();
        ctx.beginPath(); ctx.arc(x + d / 2, y + d / 2, d / 2, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(255,255,255,0.9)'; ctx.lineWidth = 4; ctx.stroke();
      }
    }
    rafId.current = requestAnimationFrame(drawLoop);
  }

  async function startPreview() {
    try {
      const canvas = canvasRef.current!;
      canvas.width = 1280; canvas.height = 720;
      if (source === 'screen') {
        screenStream.current = await navigator.mediaDevices.getDisplayMedia({ video: { frameRate: 30 }, audio: true });
        const sv = screenVideoRef.current!; sv.srcObject = screenStream.current; await sv.play();
        screenStream.current.getVideoTracks()[0].addEventListener('ended', () => stopRecording());
      }
      if (source === 'camera' || withCam) {
        camStream.current = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 }, audio: true });
        const cv = camVideoRef.current!; cv.srcObject = camStream.current; await cv.play();
      } else {
        camStream.current = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      }
      setPhase('preview');
      drawLoop();
    } catch {
      toast.error(t('permission_denied'));
      stopAll(); setPhase('idle');
    }
  }

  function startRecording() {
    const canvas = canvasRef.current!;
    const canvasStream = canvas.captureStream(30);
    const mixed = new MediaStream();
    canvasStream.getVideoTracks().forEach((tr) => mixed.addTrack(tr));
    const micTrack = camStream.current?.getAudioTracks()[0];
    const sysTrack = screenStream.current?.getAudioTracks()[0];
    if (micTrack) mixed.addTrack(micTrack);
    else if (sysTrack) mixed.addTrack(sysTrack);
    mixedStream.current = mixed;

    const mime = MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus') ? 'video/webm;codecs=vp9,opus'
      : MediaRecorder.isTypeSupported('video/webm;codecs=vp8,opus') ? 'video/webm;codecs=vp8,opus' : 'video/webm';
    chunks.current = [];
    const rec = new MediaRecorder(mixed, { mimeType: mime, videoBitsPerSecond: 4_000_000 });
    rec.ondataavailable = (ev) => { if (ev.data.size > 0) chunks.current.push(ev.data); };
    rec.onstop = () => {
      const blob = new Blob(chunks.current, { type: 'video/webm' });
      recordedBlob.current = blob;
      setPreviewUrl(URL.createObjectURL(blob));
      setPhase('recorded');
    };
    rec.start(1000);
    recorder.current = rec;
    setSeconds(0);
    timerId.current = setInterval(() => setSeconds((s) => s + 1), 1000);
    setPhase('recording');
  }

  function stopRecording() {
    if (recorder.current && recorder.current.state !== 'inactive') recorder.current.stop();
    if (timerId.current) clearInterval(timerId.current);
    if (rafId.current) cancelAnimationFrame(rafId.current);
    [screenStream, camStream].forEach((s) => s.current?.getTracks().forEach((tr) => tr.stop()));
  }

  function discard() {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    recordedBlob.current = null; setPreviewUrl(null); setSeconds(0); setPhase('idle');
  }

  function nextSlide() { setSlideIdx((i) => Math.min(i + 1, slides.length - 1)); }
  function prevSlide() { setSlideIdx((i) => Math.max(i - 1, 0)); }

  async function upload() {
    if (!recordedBlob.current) return;
    setPhase('uploading');
    try {
      const sb = createClient();
      const { data: { user } } = await sb.auth.getUser();
      if (!user) throw new Error('not_auth');
      const path = `${user.id}/${Date.now()}.webm`;
      const { error } = await sb.storage.from('lesson-media').upload(path, recordedBlob.current, { contentType: 'video/webm', upsert: false });
      if (error) throw error;
      const { data: pub } = sb.storage.from('lesson-media').getPublicUrl(path);
      onUploaded(pub.publicUrl);
      toast.success(t('uploaded'));
      discard();
    } catch {
      toast.error(t('upload_failed'));
      setPhase('recorded');
    }
  }

  const mmss = `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
  const hasGen = generatedSlides.length > 0;

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5 space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h3 className="font-semibold text-slate-900 text-base">{t('title')}</h3>
        {phase === 'recording' && (
          <span className="inline-flex items-center gap-2 text-sm font-medium text-rose-600">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-600 animate-pulse" /> {mmss}
          </span>
        )}
      </div>

      {currentUrl && phase === 'idle' && (
        <div className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">{t('has_video')}</div>
      )}

      {phase === 'idle' && (
        <>
          <div className="grid grid-cols-3 gap-2">
            {([
              { v: 'slides' as const, emoji: '🖼️', label: t('src_slides') },
              { v: 'screen' as const, emoji: '🖥️', label: t('src_screen') },
              { v: 'camera' as const, emoji: '📷', label: t('src_camera') },
            ]).map((o) => (
              <button key={o.v} type="button" onClick={() => setSource(o.v)}
                className={`px-2 py-3 rounded-lg border text-xs font-medium transition-all ${source === o.v ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-slate-200 hover:border-slate-300 text-slate-600'}`}>
                <div className="text-lg mb-1">{o.emoji}</div>{o.label}
              </button>
            ))}
          </div>

          {source !== 'camera' && (
            <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
              <input type="checkbox" checked={withCam} onChange={(e) => setWithCam(e.target.checked)} className="rounded" />
              {t('include_webcam')}
            </label>
          )}

          {source === 'slides' && (
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 space-y-3">
              <div className="flex flex-wrap gap-2">
                {hasGen && (
                  <button onClick={useGenerated} className="text-sm px-3 py-2 rounded-lg bg-brand-600 text-white font-medium hover:bg-brand-700">
                    ✨ {t('use_generated')} ({generatedSlides.length})
                  </button>
                )}
                <label className="text-sm px-3 py-2 rounded-lg border border-slate-300 bg-white font-medium text-slate-700 cursor-pointer hover:border-slate-400">
                  🖼️ {t('add_images')}
                  <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => addImages(e.target.files)} />
                </label>
                {slides.length > 0 && (
                  <button onClick={() => { setSlides([]); setSlideIdx(0); }} className="text-sm px-3 py-2 rounded-lg text-rose-600 hover:bg-rose-50">{t('clear_slides')}</button>
                )}
              </div>
              {slides.length > 0
                ? <p className="text-xs text-slate-500">{t('slides_ready', { n: slides.length })}</p>
                : <p className="text-xs text-slate-400">{hasGen ? t('slides_pick_hint') : t('slides_none_hint')}</p>}
            </div>
          )}

          <button onClick={startPreview} disabled={source === 'slides' && slides.length === 0} className="btn-primary w-full disabled:opacity-50">
            {t('prepare')}
          </button>
        </>
      )}

      <div className={phase === 'preview' || phase === 'recording' ? 'block space-y-3' : 'hidden'}>
        <canvas ref={canvasRef} className="w-full rounded-lg bg-slate-900 aspect-video" />
        {source === 'slides' && slides.length > 0 && (
          <div className="flex items-center justify-center gap-3">
            <button onClick={prevSlide} disabled={slideIdx === 0} className="px-4 py-2 rounded-lg border border-slate-200 disabled:opacity-40 text-slate-700">‹</button>
            <span className="text-sm text-slate-500 tabular-nums">{slideIdx + 1} / {slides.length}</span>
            <button onClick={nextSlide} disabled={slideIdx >= slides.length - 1} className="px-4 py-2 rounded-lg border border-slate-200 disabled:opacity-40 text-slate-700">›</button>
          </div>
        )}
        <div className="flex gap-2">
          {phase === 'preview' && <button onClick={startRecording} className="btn-primary flex-1">⏺ {t('start')}</button>}
          {phase === 'recording' && <button onClick={stopRecording} className="flex-1 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-lg py-2.5">⏹ {t('stop')}</button>}
          {phase === 'preview' && <button onClick={() => { stopAll(); setPhase('idle'); }} className="px-4 py-2.5 rounded-lg border border-slate-200 text-slate-600 text-sm">{t('cancel')}</button>}
        </div>
      </div>

      {(phase === 'recorded' || phase === 'uploading') && previewUrl && (
        <div className="space-y-3">
          <video src={previewUrl} controls className="w-full rounded-lg bg-black aspect-video" />
          <div className="flex gap-2">
            <button onClick={upload} disabled={phase === 'uploading'} className="btn-primary flex-1 disabled:opacity-50">
              {phase === 'uploading' ? t('uploading') : t('use_video')}
            </button>
            <button onClick={discard} disabled={phase === 'uploading'} className="px-4 py-2.5 rounded-lg border border-slate-200 text-slate-600 text-sm disabled:opacity-50">{t('discard')}</button>
          </div>
        </div>
      )}

      <video ref={screenVideoRef} className="hidden" muted playsInline />
      <video ref={camVideoRef} className="hidden" muted playsInline />
    </div>
  );
}
