'use client';

import { useEffect, useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { Camera, Loader2, Trash2 } from 'lucide-react';

export function AvatarUploader() {
  const t = useTranslations('profile');
  const [url, setUrl] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    (async () => {
      const sb = createClient();
      const { data: { user } } = await sb.auth.getUser();
      if (!user) return;
      const { data } = await sb.from('nl_profiles').select('avatar_url, name').eq('id', user.id).single();
      if (data) { setUrl((data as { avatar_url?: string }).avatar_url || null); setName((data as { name?: string }).name || ''); }
    })();
  }, []);

  async function resize(file: File): Promise<Blob> {
    const img = document.createElement('img');
    const dataUrl = await new Promise<string>((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result as string); r.onerror = rej; r.readAsDataURL(file); });
    await new Promise((res, rej) => { img.onload = res as () => void; img.onerror = rej; img.src = dataUrl; });
    const max = 512; let width = img.width; let height = img.height;
    if (width > height && width > max) { height = Math.round(height * max / width); width = max; }
    else if (height > max) { width = Math.round(width * max / height); height = max; }
    const canvas = document.createElement('canvas'); canvas.width = width; canvas.height = height;
    canvas.getContext('2d')!.drawImage(img, 0, 0, width, height);
    return await new Promise<Blob>((res) => canvas.toBlob((b) => res(b as Blob), 'image/jpeg', 0.85));
  }

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return;
    setBusy(true);
    try {
      const sb = createClient();
      const { data: { user } } = await sb.auth.getUser();
      if (!user) throw new Error('unauthenticated');
      const blob = await resize(file);
      const path = `avatars/${user.id}-${Date.now()}.jpg`;
      const { error: upErr } = await sb.storage.from('app').upload(path, blob, { upsert: true, contentType: 'image/jpeg' });
      if (upErr) throw upErr;
      const pub = sb.storage.from('app').getPublicUrl(path).data.publicUrl;
      const { data, error } = await sb.rpc('nl_set_avatar', { p_url: pub });
      if (error) throw error;
      if (!(data as { ok?: boolean })?.ok) throw new Error('failed');
      setUrl(pub); toast.success(t('photo_saved'));
    } catch (err) { toast.error(err instanceof Error ? err.message : 'Erro'); }
    finally { setBusy(false); if (inputRef.current) inputRef.current.value = ''; }
  }

  async function remove() {
    setBusy(true);
    try { const sb = createClient(); await sb.rpc('nl_set_avatar', { p_url: '' }); setUrl(null); toast.success(t('photo_removed')); }
    catch { toast.error('Erro'); } finally { setBusy(false); }
  }

  const initials = (name || '?').trim().charAt(0).toUpperCase();

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 mb-6 flex items-center gap-5">
      <div className="shrink-0">
        {url ? (
          <img src={url} alt="" className="h-20 w-20 rounded-full object-cover border border-slate-200" />
        ) : (
          <div className="h-20 w-20 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 text-white flex items-center justify-center text-2xl font-bold">{initials}</div>
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
  );
}
