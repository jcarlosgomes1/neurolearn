'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useTranslations, useLocale } from 'next-intl';
import { toast } from 'sonner';
import { Camera, Loader2, Trash2, Check, X, ZoomIn } from 'lucide-react';
import { UserAvatar } from '@/components/account/UserAvatar';

type Lang = 'pt' | 'en' | 'es' | 'fr';
const L: Record<string, Record<Lang, string>> = {
  adjust: { pt: 'Ajusta o enquadramento', en: 'Adjust the framing', es: 'Ajusta el encuadre', fr: 'Ajuste le cadrage' },
  drag: { pt: 'Arrasta para mover · usa o cursor para aproximar', en: 'Drag to move · use the slider to zoom', es: 'Arrastra para mover · usa el control para acercar', fr: 'Glisse pour déplacer · utilise le curseur pour zoomer' },
  confirm: { pt: 'Guardar foto', en: 'Save photo', es: 'Guardar foto', fr: 'Enregistrer' },
  cancel: { pt: 'Cancelar', en: 'Cancel', es: 'Cancelar', fr: 'Annuler' },
};
const VP = 256;

export function AvatarUploader() {
  const t = useTranslations('profile');
  const locale = (useLocale() as Lang) || 'pt';
  const tl = (k: string) => L[k]?.[locale] ?? L[k]?.pt ?? k;

  const [url, setUrl] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [uid, setUid] = useState('');
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const [editing, setEditing] = useState(false);
  const imgElRef = useRef<HTMLImageElement | null>(null);
  const [imgSrc, setImgSrc] = useState('');
  const [nat, setNat] = useState<{ w: number; h: number }>({ w: 0, h: 0 });
  const [zoom, setZoom] = useState(1);
  const [off, setOff] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const drag = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null);

  useEffect(() => {
    (async () => {
      const sb = createClient();
      const { data: { user } } = await sb.auth.getUser();
      if (!user) return;
      setUid(user.id);
      const { data } = await sb.from('nl_profiles').select('avatar_url, name').eq('id', user.id).single();
      if (data) { setUrl((data as { avatar_url?: string }).avatar_url || null); setName((data as { name?: string }).name || ''); }
    })();
  }, []);

  const coverScale = nat.w && nat.h ? VP / Math.min(nat.w, nat.h) : 1;
  const dispW = nat.w * coverScale * zoom;
  const dispH = nat.h * coverScale * zoom;

  const clamp = useCallback((o: { x: number; y: number }) => {
    const minX = VP - dispW, minY = VP - dispH;
    return { x: Math.min(0, Math.max(minX, o.x)), y: Math.min(0, Math.max(minY, o.y)) };
  }, [dispW, dispH]);

  useEffect(() => { setOff((o) => clamp(o)); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [zoom]);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return;
    const dataUrl = await new Promise<string>((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result as string); r.onerror = rej; r.readAsDataURL(file); });
    const img = new Image();
    await new Promise((res, rej) => { img.onload = res as () => void; img.onerror = rej; img.src = dataUrl; });
    imgElRef.current = img;
    setImgSrc(dataUrl);
    setNat({ w: img.naturalWidth, h: img.naturalHeight });
    const cs = VP / Math.min(img.naturalWidth, img.naturalHeight);
    let z = 1, cx = img.naturalWidth / 2, cy = img.naturalHeight / 2;
    try {
      // @ts-expect-error FaceDetector is experimental (Chromium/Android)
      if (typeof window !== 'undefined' && 'FaceDetector' in window) {
        // @ts-expect-error experimental constructor
        const fd = new window.FaceDetector({ fastMode: true, maxDetectedFaces: 1 });
        const faces = await fd.detect(img);
        if (faces && faces[0]) {
          const b = faces[0].boundingBox;
          cx = b.x + b.width / 2; cy = b.y + b.height / 2;
          z = Math.min(3, Math.max(1, Math.min(img.naturalWidth, img.naturalHeight) / (Math.max(b.width, b.height) * 1.7)));
        }
      }
    } catch { /* face detection optional */ }
    setZoom(z);
    const dW = img.naturalWidth * cs * z, dH = img.naturalHeight * cs * z;
    const minX = VP - dW, minY = VP - dH;
    setOff({ x: Math.min(0, Math.max(minX, VP / 2 - cx * cs * z)), y: Math.min(0, Math.max(minY, VP / 2 - cy * cs * z)) });
    setEditing(true);
    if (inputRef.current) inputRef.current.value = '';
  }

  function onPointerDown(e: React.PointerEvent) { (e.target as Element).setPointerCapture?.(e.pointerId); drag.current = { x: e.clientX, y: e.clientY, ox: off.x, oy: off.y }; }
  function onPointerMove(e: React.PointerEvent) { if (!drag.current) return; setOff(clamp({ x: drag.current.ox + (e.clientX - drag.current.x), y: drag.current.oy + (e.clientY - drag.current.y) })); }
  function onPointerUp() { drag.current = null; }

  async function confirmCrop() {
    const img = imgElRef.current; if (!img) return;
    setBusy(true);
    try {
      const scale = coverScale * zoom;
      const sx = -off.x / scale, sy = -off.y / scale, sSize = VP / scale;
      const out = document.createElement('canvas'); out.width = 512; out.height = 512;
      const ctx = out.getContext('2d')!; ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, sx, sy, sSize, sSize, 0, 0, 512, 512);
      const blob = await new Promise<Blob>((res) => out.toBlob((b) => res(b as Blob), 'image/jpeg', 0.85));
      const sb = createClient();
      const { data: { user } } = await sb.auth.getUser();
      if (!user) throw new Error('unauthenticated');
      const path = `avatars/${user.id}-${Date.now()}.jpg`;
      const { error: upErr } = await sb.storage.from('app').upload(path, blob, { upsert: true, contentType: 'image/jpeg' });
      if (upErr) throw upErr;
      const pub = sb.storage.from('app').getPublicUrl(path).data.publicUrl;
      const { data, error } = await sb.rpc('nl_set_avatar', { p_url: pub });
      if (error) throw error;
      if (!(data as { ok?: boolean })?.ok) throw new Error('failed');
      setUrl(pub); setEditing(false); setImgSrc(''); toast.success(t('photo_saved'));
    } catch (err) { toast.error(err instanceof Error ? err.message : 'Erro'); }
    finally { setBusy(false); }
  }

  async function remove() {
    setBusy(true);
    try { const sb = createClient(); await sb.rpc('nl_set_avatar', { p_url: '' }); setUrl(null); toast.success(t('photo_removed')); }
    catch { toast.error('Erro'); } finally { setBusy(false); }
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 mb-6">
      {editing ? (
        <div className="flex flex-col items-center gap-3">
          <div className="text-sm font-semibold text-slate-900">{tl('adjust')}</div>
          <div className="relative rounded-full overflow-hidden border border-slate-200 bg-slate-100 touch-none select-none"
            style={{ width: VP, height: VP }}
            onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerCancel={onPointerUp}>
            {imgSrc && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={imgSrc} alt="" draggable={false} style={{ position: 'absolute', left: off.x, top: off.y, width: dispW, height: dispH, maxWidth: 'none' }} />
            )}
            <div className="pointer-events-none absolute inset-0 rounded-full ring-1 ring-inset ring-black/10" />
          </div>
          <div className="flex items-center gap-2 w-full max-w-[256px]">
            <ZoomIn className="h-4 w-4 text-slate-400 shrink-0" />
            <input type="range" min={1} max={3} step={0.01} value={zoom} onChange={(e) => setZoom(parseFloat(e.target.value))} className="w-full accent-violet-600" />
          </div>
          <p className="text-xs text-slate-500">{tl('drag')}</p>
          <div className="flex gap-2">
            <button onClick={confirmCrop} disabled={busy} className="inline-flex items-center gap-1.5 rounded-lg bg-violet-600 text-white px-4 py-2 text-sm font-semibold hover:bg-violet-700 disabled:opacity-50">
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} {tl('confirm')}
            </button>
            <button onClick={() => { setEditing(false); setImgSrc(''); }} disabled={busy} className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 text-slate-600 px-4 py-2 text-sm font-semibold hover:bg-slate-200 disabled:opacity-50">
              <X className="h-4 w-4" /> {tl('cancel')}
            </button>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-5">
          <div className="shrink-0">
            {url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={url} alt="" className="h-20 w-20 rounded-full object-cover border border-slate-200" />
            ) : (
              <UserAvatar seed={uid || name} name={name} size={80} className="border border-slate-200" />
            )}
          </div>
          <div className="min-w-0">
            <div className="text-sm font-semibold text-slate-900">{t('photo_label')}</div>
            <p className="text-xs text-slate-500 mt-0.5 mb-2">{t('photo_hint')}</p>
            <div className="flex flex-wrap gap-2">
              <button onClick={() => inputRef.current?.click()} disabled={busy} className="inline-flex items-center gap-1.5 rounded-lg bg-violet-600 text-white px-3 py-1.5 text-xs font-semibold hover:bg-violet-700 disabled:opacity-50">
                {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Camera className="h-3.5 w-3.5" />} {t('photo_upload')}
              </button>
              {url && <button onClick={remove} disabled={busy} className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 text-slate-600 px-3 py-1.5 text-xs font-semibold hover:bg-slate-200 disabled:opacity-50"><Trash2 className="h-3.5 w-3.5" /> {t('photo_remove')}</button>}
            </div>
            <input ref={inputRef} type="file" accept="image/*" capture="user" onChange={onFile} className="hidden" />
          </div>
        </div>
      )}
    </div>
  );
}
