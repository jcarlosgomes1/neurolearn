'use client';

import { useState } from 'react';
import { Link, useRouter } from '@/i18n/routing';
import { callAgentOps } from '@/lib/api/client';
import { toast } from 'sonner';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { useTranslations } from 'next-intl';

const EMOJIS = ['📚','🤖','🧠','💡','📊','🎨','⚙️','🚀','📈','🔬','💬','🎯'];
const TYPES: { v: string; labelKey: string; descKey: string }[] = [
  { v: 'essential', labelKey: 'ness.type_essential', descKey: 'ness.type_essential_desc' },
  { v: 'track', labelKey: 'ness.type_track', descKey: 'ness.type_track_desc' },
  { v: 'ai_generated', labelKey: 'ness.type_ai_gen', descKey: 'ness.type_ai_gen_desc' },
];

export function NewEssentialForm() {
  const t = useTranslations();
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [type, setType] = useState('essential');
  const [emoji, setEmoji] = useState('📚');
  const [level, setLevel] = useState('beginner');
  const [loading, setLoading] = useState(false);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) { toast.error(t('ness.toast_title_required')); return; }
    setLoading(true);
    try {
      const r = await callAgentOps<{ course_id: string }>('admin_create_course', {
        title: title.trim(), subtitle, course_type: type, emoji, level, category: 'ai',
      });
      toast.success(t('ness.toast_created'));
      router.push(`/admin/curso/${r.course_id}/editar` as any);
    } catch (err: any) {
      toast.error(err.message === 'admin_required' ? t('acom.access_restricted') : err.message);
    } finally { setLoading(false); }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 animate-fade-in">
      <AdminPageHeader
        backHref="/admin/cursos"
        backLabel={t('ness.back_courses')}
        title={t('ness.title')}
        description={t('ness.subtitle')}
        related={[
          { href: '/admin/cursos', label: 'Cursos', emoji: '📚' },
          { href: '/admin/curso-ia/novo', label: 'Gerar curso', emoji: '✨' },
          { href: '/admin/learning-paths', label: 'Percursos', emoji: '🛤️' },
        ]}
      />

      <form onSubmit={handleCreate} className="space-y-5 bg-white rounded-xl border border-slate-200 p-6">
        <div>
          <label className="label">{t('ness.field_type')}</label>
          <div className="space-y-2">
            {TYPES.map((ty) => (
              <button key={ty.v} type="button" onClick={() => setType(ty.v)} className={`w-full text-left p-3 rounded-lg border transition-all ${type === ty.v ? 'border-brand-500 bg-brand-50' : 'border-slate-200 hover:border-slate-300'}`}>
                <div className="font-medium text-slate-900">{t(ty.labelKey)}</div>
                <div className="text-xs text-slate-500 mt-0.5">{t(ty.descKey)}</div>
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="label">{t('ness.field_emoji')}</label>
          <div className="flex flex-wrap gap-2">
            {EMOJIS.map((em) => (
              <button key={em} type="button" onClick={() => setEmoji(em)} className={`w-10 h-10 rounded-lg text-xl flex items-center justify-center border transition-all ${emoji === em ? 'border-brand-500 bg-brand-50 scale-110' : 'border-slate-200 hover:border-slate-300'}`}>{em}</button>
            ))}
          </div>
        </div>
        <div>
          <label className="label" htmlFor="title">{t('ness.field_title')}</label>
          <input id="title" className="input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder={t('ness.field_title_ph')} required />
        </div>
        <div>
          <label className="label" htmlFor="subtitle">{t('ness.field_subtitle')}</label>
          <input id="subtitle" className="input" value={subtitle} onChange={(e) => setSubtitle(e.target.value)} placeholder={t('ness.field_subtitle_ph')} />
        </div>
        <div>
          <label className="label" htmlFor="level">{t('ness.field_level')}</label>
          <select id="level" className="input" value={level} onChange={(e) => setLevel(e.target.value)}>
            <option value="beginner">{t('ness.level_beginner')}</option>
            <option value="intermediate">{t('ness.level_intermediate')}</option>
            <option value="advanced">{t('ness.level_advanced')}</option>
          </select>
        </div>
        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading ? t('ness.btn_creating') : t('ness.btn_create')}
        </button>
      </form>
    </div>
  );
}
