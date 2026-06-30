'use client';

import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { createClient } from '@/lib/supabase/client';
import { SUPABASE_URL } from '@/lib/supabase/config';
import { toast } from 'sonner';
import { Teleprompter } from '@/components/course-editor/Teleprompter';
import { VideoTrimmer } from '@/components/course-editor/VideoTrimmer';

type Source = 'screen' | 'camera' | 'slides';
type Phase = 'idle' | 'preview' | 'recording' | 'recorded' | 'uploading';

type ThemeKey = 'indigo' | 'charcoal' | 'emerald' | 'ocean';
interface SlideTheme { bg: [string, string, string]; accent: string; title: string; text: string; bulletDot: string; bulletText: string; codeBg: string; codeBase: string; codeKeyword: string; codeString: string; codeComment: string; codeNumber: string; footer: string; }
const SLIDE_THEMES: Record<ThemeKey, SlideTheme> = {
  indigo:   { bg: ['#0b1024', '#1e1b4b', '#312e81'], accent: '#818cf8', title: '#ffffff', text: '#e9edff', bulletDot: '#a5b4fc', bulletText: '#e9edff', codeBg: 'rgba(2,6,23,0.7)', codeBase: '#e2e8f0', codeKeyword: '#c4b5fd', codeString: '#86efac', codeComment: '#64748b', codeNumber: '#fbbf24', footer: 'rgba(255,255,255,0.4)' },
  charcoal: { bg: ['#0a0a0a', '#171717', '#262626'], accent: '#f59e0b', title: '#fafafa', text: '#e5e5e5', bulletDot: '#f59e0b', bulletText: '#e5e5e5', codeBg: 'rgba(0,0,0,0.6)',  codeBase: '#e5e5e5', codeKeyword: '#fcd34d', codeString: '#86efac', codeComment: '#737373', codeNumber: '#f59e0b', footer: 'rgba(255,255,255,0.35)' },
  emerald:  { bg: ['#022c22', '#064e3b', '#065f46'], accent: '#34d399', title: '#ecfdf5', text: '#d1fae5', bulletDot: '#6ee7b7', bulletText: '#d1fae5', codeBg: 'rgba(2,20,15,0.7)', codeBase: '#d1fae5', codeKeyword: '#5eead4', codeString: '#fde68a', codeComment: '#4b7d6a', codeNumber: '#fbbf24', footer: 'rgba(255,255,255,0.4)' },
  ocean:    { bg: ['#0c1a2b', '#0e2a47', '#0e7490'], accent: '#22d3ee', title: '#ecfeff', text: '#cffafe', bulletDot: '#67e8f9', bulletText: '#cffafe', codeBg: 'rgba(2,12,23,0.7)', codeBase: '#cffafe', codeKeyword: '#7dd3fc', codeString: '#86efac', codeComment: '#5b7a8c', codeNumber: '#fbbf24', footer: 'rgba(255,255,255,0.4)' },
};
const CODE_KW = /^(const|let|var|function|return|if|else|for|while|do|switch|case|break|continue|import|export|default|from|class|async|await|new|try|catch|finally|throw|typeof|instanceof|interface|type|enum|public|private|protected|readonly|extends|implements|null|undefined|true|false|void|of|in|this|super|yield|static|get|set)$/;
const CODE_TOKEN = /(\s+)|("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`)|(\b\d+(?:\.\d+)?\b)|([A-Za-z_$][A-Za-z0-9_$]*)|([^\sA-Za-z0-9_$"\'`]+)/g;
function drawCodeLine(ctx: CanvasRenderingContext2D, raw: string, x0: number, y: number, th: SlideTheme) {
  const line = raw.slice(0, 60);
  const cIdx = line.indexOf('//');
  const codePart = cIdx >= 0 ? line.slice(0, cIdx) : line;
  const commentPart = cIdx >= 0 ? line.slice(cIdx) : '';
  let x = x0; let m: RegExpExecArray | null;
  CODE_TOKEN.lastIndex = 0;
  while ((m = CODE_TOKEN.exec(codePart)) !== null) {
    const tok = m[0];
    let color = th.codeBase;
    if (m[2]) color = th.codeString;
    else if (m[3]) color = th.codeNumber;
    else if (m[4]) color = CODE_KW.test(tok) ? th.codeKeyword : th.codeBase;
    ctx.fillStyle = color; ctx.fillText(tok, x, y); x += ctx.measureText(tok).width;
  }
  if (commentPart) { ctx.fillStyle = th.codeComment; ctx.fillText(commentPart, x, y); }
}

interface Slide {
  kind: 'generated' | 'image';
  title?: string;
  bullets?: string[];
  code?: string;
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
  // Opcionais: se presentes, o vídeo vai para o Mux (streaming de topo) quando configurado; senão, Storage.
  courseId?: string;
  moduleIndex?: number;
  lessonIndex?: number;
}

// Estúdio de autoria: slides nativos (gerados do conteúdo) ou imagens + webcam overlay,
// ou ecrã + webcam, compostos num canvas → WebM → Storage.
export function LessonStudioRecorder({ onUploaded, currentUrl, lessonTitle, content, courseId, moduleIndex, lessonIndex }: Props) {
  const t = useTranslations('studio');
  const [source, setSource] = useState<Source>('slides');
  const [phase, setPhase] = useState<Phase>('idle');
  const [seconds, setSeconds] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [withCam, setWithCam] = useState(true);
  const [paused, setPaused] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [pipPos, setPipPos] = useState<'tl' | 'tr' | 'bl' | 'br'>('br');
  const [pipSize, setPipSize] = useState<'s' | 'm' | 'l'>('m');
  const [pipShape, setPipShape] = useState<'circle' | 'rect'>('circle');
  const cfgCountdown = useRef(3);
  const pipPosRef = useRef(pipPos);
  const pipSizeRef = useRef(pipSize);
  const pipShapeRef = useRef(pipShape);
  const [slides, setSlides] = useState<Slide[]>([]);
  const [slideIdx, setSlideIdx] = useState(0);
  const [theme, setTheme] = useState<ThemeKey>('indigo');

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const camVideoRef = useRef<HTMLVideoElement | null>(null);
  const screenVideoRef = useRef<HTMLVideoElement | null>(null);
  const slideIdxRef = useRef(0);
  const themeRef = useRef<ThemeKey>('indigo');
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
      const sentences = para.replace(/([.!?])\s+/g, '$1\u0001').split('\u0001').filter(Boolean);
      out.push({ kind: 'generated', title: `${i + 1}`, bullets: sentences.slice(0, 4) });
    });
    if (content?.code) out.push({ kind: 'generated', title: t('slide_code_title'), code: content.code });
    if (content?.tip) out.push({ kind: 'generated', title: '💡', bullets: [content.tip] });
    return out;
  }, [lessonTitle, content]);

  useEffect(() => { slideIdxRef.current = slideIdx; }, [slideIdx]);
  useEffect(() => { themeRef.current = theme; }, [theme]);
  useEffect(() => { slidesRef.current = slides; }, [slides]);
  useEffect(() => { pipPosRef.current = pipPos; }, [pipPos]);
  useEffect(() => { pipSizeRef.current = pipSize; }, [pipSize]);
  useEffect(() => { pipShapeRef.current = pipShape; }, [pipShape]);
  useEffect(() => {
    (async () => {
      try {
        const sb = createClient();
        const { data } = await sb.rpc('nl_platform_config_get', { p_key: 'studio_config' });
        if (data) {
          const c = typeof data === 'string' ? JSON.parse(data) : data;
          if (c && c.pip_position) setPipPos(c.pip_position);
          if (c && c.pip_size) setPipSize(c.pip_size);
          if (c && c.pip_shape) setPipShape(c.pip_shape);
          if (c && typeof c.countdown_seconds === 'number') cfgCountdown.current = c.countdown_seconds;
        }
      } catch { /* mantem defaults */ }
    })();
  }, []);

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
      const img = document.createElement('img');
      img.src = url;
      await new Promise<void>((res) => { img.onload = () => res(); });
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

  function drawSlide(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, slide: Slide | undefined, idx: number, total: number) {
    const W = canvas.width, H = canvas.height;
    const th = SLIDE_THEMES[themeRef.current] || SLIDE_THEMES.indigo;
    // Fundo premium: gradiente diagonal profundo + leve vinheta
    const g = ctx.createLinearGradient(0, 0, W, H);
    g.addColorStop(0, th.bg[0]); g.addColorStop(0.55, th.bg[1]); g.addColorStop(1, th.bg[2]);
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    const vg = ctx.createRadialGradient(W * 0.5, H * 0.4, H * 0.2, W * 0.5, H * 0.5, H * 0.95);
    vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,0.35)');
    ctx.fillStyle = vg; ctx.fillRect(0, 0, W, H);

    if (!slide) {
      ctx.fillStyle = 'rgba(255,255,255,0.45)';
      ctx.font = '500 34px system-ui, sans-serif'; ctx.textAlign = 'center';
      ctx.fillText(t('no_slides_hint'), W / 2, H / 2); ctx.textAlign = 'left';
      return;
    }
    if (slide.kind === 'image' && slide._img) {
      const img = slide._img;
      const ar = img.width / img.height, car = W / H;
      let dw = W, dh = H, dx = 0, dy = 0;
      if (ar > car) { dh = W / ar; dy = (H - dh) / 2; } else { dw = H * ar; dx = (W - dw) / 2; }
      ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
      ctx.drawImage(img, dx, dy, dw, dh);
      return;
    }
    const pad = 110;
    // Barra de marca (accent) à esquerda do título
    const isCode = !!slide.code;
    if (slide.title) {
      ctx.fillStyle = th.accent;
      ctx.fillRect(pad, 120, 8, 64);
      ctx.fillStyle = th.title;
      ctx.font = '800 60px system-ui, sans-serif';
      const titleLines = wrapText(ctx, slide.title, W - pad * 2 - 30);
      titleLines.slice(0, 2).forEach((ln, i) => ctx.fillText(ln, pad + 32, 170 + i * 70));
    }
    let y = (slide.title ? 170 + 70 : 160) + 48;
    if (isCode && slide.code) {
      // Bloco de código com fundo
      ctx.font = '400 30px ui-monospace, Menlo, monospace';
      const codeLines = slide.code.split('\n').slice(0, 12);
      const boxX = pad, boxY = y - 20, boxW = W - pad * 2;
      const boxH = Math.min(codeLines.length * 40 + 40, H - boxY - 80);
      ctx.fillStyle = th.codeBg;
      ctx.beginPath(); (ctx as any).roundRect?.(boxX, boxY, boxW, boxH, 16); ctx.fill();
      codeLines.forEach((ln, i) => drawCodeLine(ctx, ln, boxX + 28, boxY + 50 + i * 40, th));
    } else {
      ctx.font = '400 38px system-ui, sans-serif';
      (slide.bullets || []).slice(0, 6).forEach((b) => {
        const lines = wrapText(ctx, b, W - pad * 2 - 56);
        ctx.fillStyle = th.bulletDot; ctx.beginPath(); ctx.arc(pad + 8, y - 12, 7, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = th.bulletText;
        lines.forEach((ln, i) => ctx.fillText(ln, pad + 40, y + i * 50));
        y += lines.length * 50 + 30;
      });
    }
    // Rodapé: marca + número de slide
    ctx.fillStyle = th.footer;
    ctx.font = '600 24px system-ui, sans-serif';
    ctx.fillText('NeuroLearn', pad, H - 56);
    ctx.textAlign = 'right';
    ctx.fillText(`${idx + 1} / ${total}`, W - pad, H - 56);
    ctx.textAlign = 'left';
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
      drawSlide(ctx, canvas, slidesRef.current[slideIdxRef.current], slideIdxRef.current, slidesRef.current.length);
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
        const sf = pipSizeRef.current === 's' ? 0.18 : pipSizeRef.current === 'l' ? 0.34 : 0.26;
        const margin = 32;
        const pos = pipPosRef.current;
        if (pipShapeRef.current === 'rect') {
          const w = Math.round(canvas.width * (sf * 0.95));
          const h = Math.round((w * 9) / 16);
          const x = pos === 'tl' || pos === 'bl' ? margin : canvas.width - w - margin;
          const y = pos === 'tl' || pos === 'tr' ? margin : canvas.height - h - margin;
          const car = w / h, ar = camV.videoWidth / camV.videoHeight;
          let sw = camV.videoWidth, sh = camV.videoHeight, sx = 0, sy = 0;
          if (ar > car) { sw = camV.videoHeight * car; sx = (camV.videoWidth - sw) / 2; }
          else { sh = camV.videoWidth / car; sy = (camV.videoHeight - sh) / 2; }
          ctx.save();
          ctx.beginPath(); (ctx as any).roundRect?.(x, y, w, h, 18); ctx.clip();
          ctx.drawImage(camV, sx, sy, sw, sh, x, y, w, h);
          ctx.restore();
          ctx.beginPath(); (ctx as any).roundRect?.(x, y, w, h, 18);
          ctx.strokeStyle = 'rgba(255,255,255,0.9)'; ctx.lineWidth = 4; ctx.stroke();
        } else {
          const d = Math.round(canvas.height * sf);
          const x = pos === 'tl' || pos === 'bl' ? margin : canvas.width - d - margin;
          const y = pos === 'tl' || pos === 'tr' ? margin : canvas.height - d - margin;
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
    const canvasStream = (canvas as any).captureStream(30) as MediaStream;
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
    setPaused(false);
    timerId.current = setInterval(() => setSeconds((s) => s + 1), 1000);
    setPhase('recording');
  }

  function beginCountdown() {
    const n = Math.max(0, cfgCountdown.current ?? 3);
    if (n === 0) { startRecording(); return; }
    setCountdown(n);
    let cur = n;
    const iv = setInterval(() => {
      cur -= 1;
      if (cur <= 0) { clearInterval(iv); setCountdown(null); startRecording(); }
      else setCountdown(cur);
    }, 800);
  }

  function pauseRecording() {
    if (recorder.current && recorder.current.state === 'recording') {
      recorder.current.pause();
      if (timerId.current) clearInterval(timerId.current);
      setPaused(true);
    }
  }

  function resumeRecording() {
    if (recorder.current && recorder.current.state === 'paused') {
      recorder.current.resume();
      timerId.current = setInterval(() => setSeconds((s) => s + 1), 1000);
      setPaused(false);
    }
  }

  function stopRecording() {
    if (recorder.current && recorder.current.state !== 'inactive') recorder.current.stop();
    if (timerId.current) clearInterval(timerId.current);
    if (rafId.current) cancelAnimationFrame(rafId.current);
    setPaused(false);
    [screenStream, camStream].forEach((s) => s.current?.getTracks().forEach((tr) => tr.stop()));
  }

  function discard() {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPaused(false);
    recordedBlob.current = null; setPreviewUrl(null); setSeconds(0); setPhase('idle');
  }

  function nextSlide() { setSlideIdx((i) => Math.min(i + 1, slides.length - 1)); }
  function prevSlide() { setSlideIdx((i) => Math.max(i - 1, 0)); }

  // Storage: caminho imediato, funciona sempre.
  async function uploadToStorage(): Promise<string> {
    const sb = createClient();
    const { data: { user } } = await sb.auth.getUser();
    if (!user) throw new Error('not_auth');
    const path = `${user.id}/${Date.now()}.webm`;
    const { error } = await sb.storage.from('lesson-media').upload(path, recordedBlob.current!, { contentType: 'video/webm', upsert: false });
    if (error) throw error;
    const { data: pub } = sb.storage.from('lesson-media').getPublicUrl(path);
    return pub.publicUrl;
  }

  // Mux: streaming de topo. Só quando configurado E temos IDs da aula. Cai para Storage em qualquer falha.
  async function tryUploadToMux(): Promise<string | null> {
    if (courseId === undefined || moduleIndex === undefined || lessonIndex === undefined) return null;
    const sb = createClient();
    const { data: { session } } = await sb.auth.getSession();
    const token = session?.access_token;
    if (!token) return null;
    const fnUrl = `${SUPABASE_URL}/functions/v1/mux-upload`;
    // 1) criar upload direto (devolve 503 se Mux não configurado → cai para Storage)
    const createRes = await fetch(fnUrl, {
      method: 'POST', headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'create_upload', course_id: courseId, module_index: moduleIndex, lesson_index: lessonIndex, title: lessonTitle || 'Aula' }),
    });
    if (!createRes.ok) return null; // 503 mux_not_configured ou outro → Storage
    const created = await createRes.json();
    if (!created?.ok || !created?.upload_url) return null;
    // 2) PUT do WebM para a URL de upload do Mux
    const put = await fetch(created.upload_url, { method: 'PUT', headers: { 'Content-Type': 'video/webm' }, body: recordedBlob.current! });
    if (!put.ok) return null;
    // 3) Mux processa de forma assíncrona (webhook preenche mux_playback_id). Guardamos também a cópia Storage
    //    como fonte imediata para o player até o Mux ficar pronto.
    return await uploadToStorage();
  }

  async function upload() {
    if (!recordedBlob.current) return;
    setPhase('uploading');
    try {
      let url: string | null = null;
      try { url = await tryUploadToMux(); } catch { url = null; }
      if (!url) url = await uploadToStorage();
      onUploaded(url);
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
          <span className={`inline-flex items-center gap-2 text-sm font-medium ${paused ? 'text-amber-600' : 'text-rose-600'}`}>
            <span className={`w-2.5 h-2.5 rounded-full ${paused ? 'bg-amber-500' : 'bg-rose-600 animate-pulse'}`} /> {paused ? `${t('paused')} ${mmss}` : mmss}
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
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-slate-600">{t('theme')}</span>
                <select value={theme} onChange={(e) => setTheme(e.target.value as ThemeKey)} className="text-sm rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-slate-700">
                  <option value="indigo">{t('theme_indigo')}</option>
                  <option value="charcoal">{t('theme_charcoal')}</option>
                  <option value="emerald">{t('theme_emerald')}</option>
                  <option value="ocean">{t('theme_ocean')}</option>
                </select>
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
        <div className="relative rounded-2xl overflow-hidden ring-1 ring-slate-800 bg-gradient-to-b from-slate-900 to-slate-950 p-1.5 shadow-xl">
          <canvas ref={canvasRef} className="w-full rounded-xl bg-slate-900 aspect-video block" />
          {phase === 'recording' && (
            <span className={`absolute top-3 left-3 inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full text-white ${paused ? 'bg-amber-500/90' : 'bg-rose-600/90'}`}>
              <span className={`w-2 h-2 rounded-full bg-white ${paused ? '' : 'animate-pulse'}`} /> {paused ? t('paused') : 'REC'} {mmss}
            </span>
          )}
          {countdown !== null && (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-950/55">
              <span key={countdown} className="text-white text-8xl font-black tabular-nums drop-shadow-lg">{countdown}</span>
            </div>
          )}
        </div>
        {source !== 'camera' && withCam && (
          <div className="flex items-center gap-2 flex-wrap text-xs">
            <span className="font-medium text-slate-500 mr-1">{t('cam_layout')}</span>
            <div className="inline-flex rounded-lg border border-slate-200 overflow-hidden">
              {(['tl', 'tr', 'bl', 'br'] as const).map((p) => (
                <button key={p} type="button" onClick={() => setPipPos(p)} aria-label={p} className={`px-2 py-1.5 text-sm ${pipPos === p ? 'bg-brand-600 text-white' : 'bg-white text-slate-500 hover:bg-slate-50'}`}>
                  {p === 'tl' ? '◰' : p === 'tr' ? '◳' : p === 'bl' ? '◱' : '◲'}
                </button>
              ))}
            </div>
            <div className="inline-flex rounded-lg border border-slate-200 overflow-hidden">
              {(['s', 'm', 'l'] as const).map((s) => (
                <button key={s} type="button" onClick={() => setPipSize(s)} className={`px-2.5 py-1.5 font-semibold ${pipSize === s ? 'bg-brand-600 text-white' : 'bg-white text-slate-500 hover:bg-slate-50'}`}>
                  {s.toUpperCase()}
                </button>
              ))}
            </div>
            <div className="inline-flex rounded-lg border border-slate-200 overflow-hidden">
              {(['circle', 'rect'] as const).map((sh) => (
                <button key={sh} type="button" onClick={() => setPipShape(sh)} aria-label={sh} className={`px-2.5 py-1.5 text-sm ${pipShape === sh ? 'bg-brand-600 text-white' : 'bg-white text-slate-500 hover:bg-slate-50'}`}>
                  {sh === 'circle' ? '●' : '▭'}
                </button>
              ))}
            </div>
          </div>
        )}
        <Teleprompter paragraphs={content?.p || []} />
        {source === 'slides' && slides.length > 0 && (
          <div className="flex items-center justify-center gap-3">
            <button onClick={prevSlide} disabled={slideIdx === 0} className="px-4 py-2 rounded-lg border border-slate-200 disabled:opacity-40 text-slate-700">‹</button>
            <span className="text-sm text-slate-500 tabular-nums">{slideIdx + 1} / {slides.length}</span>
            <button onClick={nextSlide} disabled={slideIdx >= slides.length - 1} className="px-4 py-2 rounded-lg border border-slate-200 disabled:opacity-40 text-slate-700">›</button>
          </div>
        )}
        <div className="flex gap-2">
          {phase === 'preview' && <button onClick={beginCountdown} className="btn-primary flex-1">⏺ {t('start')}</button>}
          {phase === 'recording' && !paused && <button onClick={pauseRecording} className="px-4 py-2.5 rounded-lg border border-amber-300 bg-amber-50 text-amber-700 font-semibold text-sm">⏸ {t('pause')}</button>}
          {phase === 'recording' && paused && <button onClick={resumeRecording} className="px-4 py-2.5 rounded-lg border border-emerald-300 bg-emerald-50 text-emerald-700 font-semibold text-sm">⏵ {t('resume')}</button>}
          {phase === 'recording' && <button onClick={stopRecording} className="flex-1 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-lg py-2.5">⏹ {t('stop')}</button>}
          {phase === 'preview' && <button onClick={() => { stopAll(); setPhase('idle'); }} className="px-4 py-2.5 rounded-lg border border-slate-200 text-slate-600 text-sm">{t('cancel')}</button>}
        </div>
      </div>

      {(phase === 'recorded' || phase === 'uploading') && previewUrl && (
        <div className="space-y-3">
          <video src={previewUrl} controls className="w-full rounded-lg bg-black aspect-video" />
          {phase === 'recorded' && (
            <VideoTrimmer blob={recordedBlob.current} onTrimmed={(b, u) => { recordedBlob.current = b; setPreviewUrl(u); }} />
          )}
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
