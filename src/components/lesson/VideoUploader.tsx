'use client';

import { useState, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { SUPABASE_URL } from '@/lib/supabase/config';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

interface Props {
  courseId: string;
  moduleIndex: number;
  lessonIndex: number;
  lessonTitle: string;
  existingUpload?: { id: string; mux_status?: string | null; mux_playback_id?: string | null; video_thumbnail_url?: string | null };
  onUploaded?: () => void;
}

export function VideoUploader({ courseId, moduleIndex, lessonIndex, lessonTitle, existingUpload, onUploaded }: Props) {
  const t = useTranslations('vu');
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    if (!file) return;
    if (!file.type.startsWith('video/')) { toast.error(t('err_not_video')); return; }
    if (file.size > 5 * 1024 * 1024 * 1024) { toast.error(t('err_too_large')); return; }

    setUploading(true); setProgress(0);
    try {
      const sb = createClient();
      const { data: { session } } = await sb.auth.getSession();
      if (!session) { toast.error(t('err_no_session')); setUploading(false); return; }

      const createRes = await fetch(`${SUPABASE_URL}/functions/v1/mux-upload`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({
          action: 'create_upload',
          course_id: courseId, module_index: moduleIndex, lesson_index: lessonIndex,
          title: lessonTitle,
        }),
      });
      const createData = await createRes.json();
      if (!createData.ok) {
        if (createData.error === 'mux_not_configured') {
          toast.error(t('err_mux_not_configured'));
        } else { toast.error(createData.error || t('err_create_failed')); }
        setUploading(false); return;
      }

      const xhr = new XMLHttpRequest();
      xhr.open('PUT', createData.upload_url);
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) setProgress(Math.round((e.loaded / e.total) * 100));
      };
      xhr.onload = () => {
        setUploading(false);
        if (xhr.status >= 200 && xhr.status < 300) {
          toast.success(t('toast_uploaded'));
          onUploaded?.();
        } else {
          toast.error(t('err_upload_http', { n: xhr.status }));
        }
      };
      xhr.onerror = () => { toast.error(t('err_network')); setUploading(false); };
      xhr.send(file);
    } catch (e: any) {
      toast.error(e.message || t('err_upload_generic'));
      setUploading(false);
    }
  }

  const status = existingUpload?.mux_status;
  const hasVideo = status === 'ready' && existingUpload?.mux_playback_id;

  return (
    <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl p-5">
      <input ref={fileInputRef} type="file" accept="video/*" onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} className="hidden" />

      {hasVideo ? (
        <div className="flex items-center gap-3 flex-wrap">
          {existingUpload?.video_thumbnail_url && (
            <img src={existingUpload.video_thumbnail_url} alt="" className="w-32 h-18 object-cover rounded-lg flex-shrink-0" />
          )}
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold text-emerald-700">{t('ready')}</div>
            <div className="text-xs text-slate-500 mt-0.5 font-mono truncate">{existingUpload?.mux_playback_id}</div>
          </div>
          <button onClick={() => fileInputRef.current?.click()} disabled={uploading} className="text-xs bg-white border border-slate-200 hover:border-slate-300 px-3 py-1.5 rounded-md">
            {t('replace')}
          </button>
        </div>
      ) : uploading ? (
        <div className="text-center">
          <div className="text-sm font-semibold text-slate-700">{t('uploading')}</div>
          <div className="text-xs text-slate-500 mt-1">{progress}%</div>
          <div className="mt-3 h-2 bg-slate-200 rounded-full overflow-hidden">
            <div className="h-full bg-brand-500 transition-all" style={{ width: `${progress}%` }} />
          </div>
        </div>
      ) : status === 'preparing' || status === 'waiting' ? (
        <div className="text-center text-sm text-amber-700">
          {t('processing')} <button onClick={() => onUploaded?.()} className="text-xs underline ml-2">{t('check')}</button>
        </div>
      ) : status === 'errored' ? (
        <div className="text-center">
          <div className="text-sm text-rose-700">{t('failed')}</div>
          <button onClick={() => fileInputRef.current?.click()} className="mt-2 text-xs bg-rose-50 hover:bg-rose-100 text-rose-700 px-3 py-1.5 rounded-md">{t('retry')}</button>
        </div>
      ) : (
        <button onClick={() => fileInputRef.current?.click()} className="w-full py-6 text-center text-slate-500 hover:text-slate-700">
          <div className="text-3xl mb-2">🎥</div>
          <div className="text-sm font-semibold">{t('add_video')}</div>
          <div className="text-xs mt-1">{t('formats_hint')}</div>
        </button>
      )}
    </div>
  );
}
