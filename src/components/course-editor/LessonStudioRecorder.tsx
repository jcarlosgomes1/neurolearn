'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

type Source = 'screen' | 'camera' | 'screen_camera';
type Phase = 'idle' | 'preview' | 'recording' | 'recorded' | 'uploading';

interface Props {
  onUploaded: (url: string) => void;
  currentUrl?: string | null;
}

// Estúdio de autoria: grava ecrã + webcam (overlay) compostos num canvas → WebM → Storage.
export function LessonStudioRecorder({ onUploaded, currentUrl }: Props) {
  const t = useTranslations('studio');
  const [source, setSource] = useState<Source>('screen_camera');
  const [phase, setPhase] = useState<Phase>('idle');
  const [seconds, setSeconds] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const camVideoRef = useRef<HTMLVideoElement | null>(null);
  const screenVideoRef = useRef<HTMLVideoElement | null>(null);
  const previewRef = useRef<HTMLVideoElement | null>(null);

  const screenStream = useRef<MediaStream | null>(null);
  const camStream = useRef<MediaStream | null>(null);
  const mixedStream = useRef<MediaStream | null>(null);
  const recorder = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);
  const rafId = useRef<number | null>(null);
  const timerId = useRef<ReturnType<typeof setInterval> | null>(null);
  const recordedBlob = useRef<Blob | null>(null);

  const stopAll = useCallback(() => {
    if (rafId.current) cancelAnimationFrame(rafId.current);
    if (timerId.current) clearInterval(timerId.current);
    [screenStream, camStream, mixedStream].forEach((s) => {
      s.current?.getTracks().forEach((tr) => tr.stop());
      s.current = null;
    });
  }, []);

  useEffect(() => () => stopAll(), [stopAll]);

  function drawLoop() {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    const screenV = screenVideoRef.current;
    const camV = camVideoRef.current;

    if (source !== 'camera' && screenV && screenV.videoWidth) {
      ctx.drawImage(screenV, 0, 0, canvas.width, canvas.height);
    } else {
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    // Webcam "bolinha" no canto inferior direito
    if ((source === 'camera' || source === 'screen_camera') && camV && camV.videoWidth) {
      if (source === 'camera') {
        ctx.drawImage(camV, 0, 0, canvas.width, canvas.height);
      } else {
        const d = Math.round(canvas.height * 0.28);
        const x = canvas.width - d - 24;
        const y = canvas.height - d - 24;
        ctx.save();
        ctx.beginPath();
        ctx.arc(x + d / 2, y + d / 2, d / 2, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();
        const ar = camV.videoWidth / camV.videoHeight;
        let sw = camV.videoWidth, sh = camV.videoHeight;
        if (ar > 1) { sw = camV.videoHeight; } else { sh = camV.videoWidth; }
        const sx = (camV.videoWidth - sw) / 2, sy = (camV.videoHeight - sh) / 2;
        ctx.drawImage(camV, sx, sy, sw, sh, x, y, d, d);
        ctx.restore();
        ctx.beginPath();
        ctx.arc(x + d / 2, y + d / 2, d / 2, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(255,255,255,0.9)';
        ctx.lineWidth = 4;
        ctx.stroke();
      }
    }
    rafId.current = requestAnimationFrame(drawLoop);
  }

  async function startPreview() {
    try {
      const canvas = canvasRef.current!;
      canvas.width = 1280; canvas.height = 720;

      if (source !== 'camera') {
        screenStream.current = await navigator.mediaDevices.getDisplayMedia({ video: { frameRate: 30 }, audio: true });
        const sv = screenVideoRef.current!;
        sv.srcObject = screenStream.current; await sv.play();
        screenStream.current.getVideoTracks()[0].addEventListener('ended', () => { if (phase === 'recording') stopRecording(); });
      }
      if (source !== 'screen') {
        camStream.current = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 }, audio: true });
        const cv = camVideoRef.current!;
        cv.srcObject = camStream.current; await cv.play();
      }
      setPhase('preview');
      drawLoop();
    } catch (e: any) {
      toast.error(t('permission_denied'));
      stopAll();
      setPhase('idle');
    }
  }

  function startRecording() {
    const canvas = canvasRef.current!;
    const canvasStream = canvas.captureStream(30);
    const mixed = new MediaStream();
    canvasStream.getVideoTracks().forEach((tr) => mixed.addTrack(tr));
    // Áudio: preferir microfone (câmara); senão áudio do ecrã
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
      const url = URL.createObjectURL(blob);
      setPreviewUrl(url);
      setPhase('recorded');
    };
    rec.start(1000);
    recorder.current = rec;
    setSeconds(0);
    timerId.current = setInterval(() => setSeconds((s) => s + 1), 1000);
    setPhase('recording');
  }

  function stopRecording() {
    recorder.current?.stop();
    if (timerId.current) clearInterval(timerId.current);
    if (rafId.current) cancelAnimationFrame(rafId.current);
    [screenStream, camStream].forEach((s) => { s.current?.getTracks().forEach((tr) => tr.stop()); });
  }

  function discard() {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    recordedBlob.current = null;
    setPreviewUrl(null);
    setSeconds(0);
    setPhase('idle');
  }

  async function upload() {
    if (!recordedBlob.current) return;
    setPhase('uploading');
    try {
      const sb = createClient();
      const { data: { user } } = await sb.auth.getUser();
      if (!user) throw new Error('not_auth');
      const path = `${user.id}/${Date.now()}.webm`;
      const { error } = await sb.storage.from('lesson-media').upload(path, recordedBlob.current, {
        contentType: 'video/webm', upsert: false,
      });
      if (error) throw error;
      const { data: pub } = sb.storage.from('lesson-media').getPublicUrl(path);
      onUploaded(pub.publicUrl);
      toast.success(t('uploaded'));
      discard();
    } catch (e: any) {
      toast.error(t('upload_failed'));
      setPhase('recorded');
    }
  }

  const mmss = `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;

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
              { v: 'screen' as const, emoji: '🖥️', label: t('src_screen') },
              { v: 'screen_camera' as const, emoji: '🖥️＋📷', label: t('src_both') },
              { v: 'camera' as const, emoji: '📷', label: t('src_camera') },
            ]).map((o) => (
              <button key={o.v} type="button" onClick={() => setSource(o.v)}
                className={`px-2 py-3 rounded-lg border text-xs font-medium transition-all ${source === o.v ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-slate-200 hover:border-slate-300 text-slate-600'}`}>
                <div className="text-lg mb-1">{o.emoji}</div>{o.label}
              </button>
            ))}
          </div>
          <button onClick={startPreview} className="btn-primary w-full">{t('prepare')}</button>
        </>
      )}

      <div className={phase === 'preview' || phase === 'recording' ? 'block' : 'hidden'}>
        <canvas ref={canvasRef} className="w-full rounded-lg bg-slate-900 aspect-video" />
        <div className="mt-3 flex gap-2">
          {phase === 'preview' && <button onClick={startRecording} className="btn-primary flex-1">⏺ {t('start')}</button>}
          {phase === 'recording' && <button onClick={stopRecording} className="flex-1 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-lg py-2.5">⏹ {t('stop')}</button>}
          {phase === 'preview' && <button onClick={() => { stopAll(); setPhase('idle'); }} className="px-4 py-2.5 rounded-lg border border-slate-200 text-slate-600 text-sm">{t('cancel')}</button>}
        </div>
      </div>

      {(phase === 'recorded' || phase === 'uploading') && previewUrl && (
        <div className="space-y-3">
          <video ref={previewRef} src={previewUrl} controls className="w-full rounded-lg bg-black aspect-video" />
          <div className="flex gap-2">
            <button onClick={upload} disabled={phase === 'uploading'} className="btn-primary flex-1 disabled:opacity-50">
              {phase === 'uploading' ? t('uploading') : t('use_video')}
            </button>
            <button onClick={discard} disabled={phase === 'uploading'} className="px-4 py-2.5 rounded-lg border border-slate-200 text-slate-600 text-sm disabled:opacity-50">{t('discard')}</button>
          </div>
        </div>
      )}

      {/* elementos-fonte ocultos */}
      <video ref={screenVideoRef} className="hidden" muted playsInline />
      <video ref={camVideoRef} className="hidden" muted playsInline />
    </div>
  );
}
