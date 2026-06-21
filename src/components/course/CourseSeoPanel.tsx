'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { Loader2, Save } from 'lucide-react';

const LANGS = ['pt', 'en', 'es', 'fr'];
type Row = { meta_title: string; meta_description: string };

/** Aba SEO: meta título/descrição por idioma para este curso. Reutiliza nl_admin_seo_overview + nl_seo_apply_fix. */
export function CourseSeoPanel({ courseId }: { courseId: string }) {
  const t = useTranslations();
  const [lang, setLang] = useState('pt');
  const [byLang, setByLang] = useState<Record<string, Row>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const sb = createClient();
      const { data } = await sb.rpc('nl_admin_seo_overview');
      const d = data as { ok?: boolean; overrides?: Array<{ page_type: string; page_id: string | null; lang: string; meta_title: string | null; meta_description: string | null }> };
      const map: Record<string, Row> = {};
      (d?.overrides || []).filter((o) => o.page_type === 'course' && o.page_id === courseId).forEach((o) => { map[o.lang] = { meta_title: o.meta_title || '', meta_description: o.meta_description || '' }; });
      setByLang(map);
    } catch { setByLang({}); }
    finally { setLoading(false); }
  }, [courseId]);
  useEffect(() => { load(); }, [load]);

  const cur = byLang[lang] || { meta_title: '', meta_description: '' };
  const setCur = (patch: Partial<Row>) => setByLang((m) => ({ ...m, [lang]: { ...cur, ...patch } }));

  async function save() {
    setSaving(true);
    try {
      const sb = createClient();
      const { data, error } = await sb.rpc('nl_seo_apply_fix', { p_page_type: 'course', p_page_id: courseId, p_lang: lang, p_meta_title: cur.meta_title || null, p_meta_description: cur.meta_description || null });
      if (error || !(data as { ok?: boolean })?.ok) throw error || new Error('fail');
      toast.success(t('seo.saved'));
    } catch { toast.error(t('seo.error')); }
    finally { setSaving(false); }
  }

  if (loading) return <div className="flex items-center justify-center py-12 text-slate-400"><Loader2 className="w-5 h-5 animate-spin" /></div>;

  return (
    <div className="max-w-2xl space-y-3">
      <div className="inline-flex rounded-lg border border-slate-200 bg-white p-0.5">
        {LANGS.map((l) => (<button key={l} onClick={() => setLang(l)} className={`text-xs font-medium px-2.5 py-1.5 rounded-md uppercase ${lang === l ? 'bg-slate-900 text-white' : 'text-slate-600 hover:text-slate-900'}`}>{l}</button>))}
      </div>
      <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-2">
        <label className="block text-xs font-medium text-slate-500">{t('seo.meta_title')}</label>
        <input value={cur.meta_title} onChange={(e) => setCur({ meta_title: e.target.value })} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
        <label className="block text-xs font-medium text-slate-500 mt-2">{t('seo.meta_desc')}</label>
        <textarea value={cur.meta_description} onChange={(e) => setCur({ meta_description: e.target.value })} rows={3} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm resize-none" />
        <button onClick={save} disabled={saving} className="mt-1 inline-flex items-center gap-1.5 rounded-lg bg-violet-600 text-white text-sm font-medium px-4 py-2 disabled:opacity-50 hover:bg-violet-700">{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}{t('seo.save')}</button>
      </div>
      <p className="text-[11px] text-slate-400">{t('course_ws.seo_hint')}</p>
    </div>
  );
}
