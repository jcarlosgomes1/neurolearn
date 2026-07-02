'use client';

import { useEffect, useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { Link, useRouter } from '@/i18n/routing';
import { callAgentOps } from '@/lib/api/client';
import { assertNotPeekClient } from '@/lib/peek-client';
import { DashboardSkeleton } from '@/components/shared/DashboardSkeleton';
import { fmtCents } from '@/lib/utils/cn';
import { toast } from 'sonner';
import { ModulesEditor, type Module } from './ModulesEditor';
import { CourseTranslationManager } from './CourseTranslationManager';
import { CourseMaterials } from './CourseMaterials';
import { CourseStudioPanel } from '@/components/studio/CourseStudioPanel';
import { createClient } from '@/lib/supabase/client';

interface Course {
  id: string;
  title: string;
  subtitle: string | null;
  description: string | null;
  emoji: string | null;
  level: string | null;
  category: string | null;
  price_cents: number;
  currency: string | null;
  published: boolean;
  archived?: boolean;
  hero_image_url?: string | null;
  approval_status: string | null;
  course_type?: string | null;
  modules: Module[] | null;
  topics: string[] | null;
}

interface Props {
  courseId: string;
  backHref?: string;
  mode?: 'instructor' | 'admin';
}

export function CourseEditor({ courseId, backHref, mode = 'instructor' }: Props) {
  const t = useTranslations('course_editor');
  const isAdmin = mode === 'admin';
  const DETAIL_ACTION = isAdmin ? 'admin_course_detail' : 'teach_course_detail';
  const UPDATE_ACTION = isAdmin ? 'admin_update_course' : 'teach_update_course';

  const router = useRouter();
  const [course, setCourse] = useState<Course | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [tab, setTab] = useState<'info' | 'modules' | 'materials' | 'estudio' | 'publish'>('info');
  const [canStudio, setCanStudio] = useState(false);

  useEffect(() => {
    callAgentOps<{ course: Course }>(DETAIL_ACTION, { course_id: courseId })
      .then((r) => setCourse({ ...r.course, modules: Array.isArray(r.course.modules) ? r.course.modules : [], topics: Array.isArray(r.course.topics) ? r.course.topics : [] }))
      .catch((e) => setErr(e.message));
  }, [courseId, DETAIL_ACTION]);

  useEffect(() => {
    createClient().rpc('nl_studio_can_use', { p_course_id: courseId }).then(({ data }) => setCanStudio(!!data));
  }, [courseId]);

  const update = useCallback((patch: Partial<Course>) => {
    setCourse((c) => (c ? { ...c, ...patch } : c));
    setDirty(true);
  }, []);

  async function save() {
    if (!course) return;
    setSaving(true);
    try {
      assertNotPeekClient();
      await callAgentOps(UPDATE_ACTION, {
        course_id: course.id, title: course.title, subtitle: course.subtitle, description: course.description,
        emoji: course.emoji, level: course.level, category: course.category, price_cents: course.price_cents,
        modules: course.modules, topics: course.topics,
      });
      // hero_image_url persistido por update direto (RLS admin/dono); handler agent-ops não o inclui
      await createClient().from('nl_courses').update({ hero_image_url: course.hero_image_url || null }).eq('id', course.id);
      toast.success(t('saved'));
      setDirty(false);
    } catch (e: any) { toast.error(e.message); } finally { setSaving(false); }
  }

  async function submitForReview() {
    if (!course) return;
    if (dirty) { toast.error(t('save_first')); return; }
    if (!confirm(t('confirm_submit'))) return;
    try {
      assertNotPeekClient();
      await callAgentOps('teach_submit_course_for_review', { course_id: course.id });
      toast.success(t('submitted'));
      router.push(backHref as any);
    } catch (e: any) { toast.error(e.message); }
  }

  async function toggleArchived() {
    if (!course) return;
    const next = !course.archived;
    if (!confirm(next ? t('confirm_archive') : t('confirm_unarchive'))) return;
    try {
      assertNotPeekClient();
      const { data, error } = await createClient().rpc('nl_course_set_archived', { p_course_id: course.id, p_archived: next });
      if (error || !(data as any)?.ok) throw new Error((data as any)?.error || error?.message || 'error');
      toast.success(next ? t('archived_toast') : t('unarchived_toast'));
      setCourse((c) => c ? { ...c, archived: next, published: next ? false : c.published } : c);
    } catch (e: any) { toast.error(e.message); }
  }

  async function togglePublished() {
    if (!course) return;
    if (!confirm(course.published ? t('confirm_unpublish') : t('confirm_publish'))) return;
    try {
      assertNotPeekClient();
      await callAgentOps('admin_update_course', { course_id: course.id, published: !course.published });
      toast.success(course.published ? t('unpublished') : t('published_toast'));
      setCourse((c) => c ? { ...c, published: !c.published } : c);
      setDirty(false);
    } catch (e: any) { toast.error(e.message); }
  }

  if (err) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <p className="text-slate-700 font-medium">{err === 'not_owner_or_not_found' ? t('err_not_owner') : err === 'admin_required' ? t('err_admin') : err}</p>
        <Link href={backHref as any} className="btn-primary mt-6 inline-flex">{t('back')}</Link>
      </div>
    );
  }
  if (!course) return <DashboardSkeleton stats={3} />;

  const lessonCount = (course.modules || []).reduce((s, m) => s + (m.lessons?.length || 0), 0);
  const generatedCount = (course.modules || []).reduce((s, m) => s + (m.lessons?.filter((l) => l.content?.p?.length).length || 0), 0);

  return (
    <div className="max-w-7xl mx-auto px-6 lg:px-8 py-8 space-y-6 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-3">
        {!isAdmin ? (
          <div className="min-w-0">
            <Link href={backHref as any} className="text-sm text-brand-600 hover:underline">{t('back')}</Link>
            <h1 className="text-2xl font-bold text-slate-900 mt-1 truncate">{course.emoji || '📘'} {course.title || t('untitled')}</h1>
            <div className="text-sm text-slate-500 mt-1 flex flex-wrap items-center gap-2">
              <span className={`px-2 py-0.5 rounded-full text-xs ${course.published ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>{course.published ? t('published') : (course.approval_status || t('draft'))}</span>
              {course.course_type && <><span>·</span><span className="text-xs">{course.course_type}</span></>}
              <span>·</span><span>{t('modules', { n: (course.modules || []).length })}</span>
              <span>·</span><span>{t('lessons', { n: lessonCount })}</span>
              {lessonCount > 0 && <><span>·</span><span>{t('with_content_count', { done: generatedCount, total: lessonCount })}</span></>}
            </div>
          </div>
        ) : (
          <div className="text-sm text-slate-500 flex flex-wrap items-center gap-2">
            <span>{t('modules', { n: (course.modules || []).length })}</span>
            <span>·</span><span>{t('lessons', { n: lessonCount })}</span>
            {lessonCount > 0 && <><span>·</span><span>{t('with_content_count', { done: generatedCount, total: lessonCount })}</span></>}
          </div>
        )}
        <div className="flex gap-2 flex-shrink-0 items-center ml-auto">
          {dirty && <span className="text-xs text-amber-600">{t('dirty')}</span>}
          {isAdmin && (
            <button onClick={togglePublished} className={course.published ? 'btn-secondary' : 'bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-5 py-2.5 rounded-lg text-sm'}>
              {course.published ? t('unpublish_btn') : t('publish_now')}
            </button>
          )}
          <button onClick={save} disabled={saving || !dirty} className="btn-primary disabled:opacity-50">{saving ? t('saving') : t('save')}</button>
        </div>
      </div>

      <div className="border-b border-slate-200">
        <nav className="flex gap-1 -mb-px overflow-x-auto">
          {((canStudio ? ['info','modules','materials','estudio','publish'] : ['info','modules','materials','publish']) as Array<'info'|'modules'|'materials'|'estudio'|'publish'>).map((tk) => (
            <button key={tk} onClick={() => setTab(tk)} className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${tab === tk ? 'border-brand-600 text-brand-700' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
              {tk === 'info' ? t('tab_info') : tk === 'modules' ? t('tab_modules', { n: lessonCount }) : tk === 'materials' ? t('tab_materials') : tk === 'estudio' ? t('tab_studio') : t('tab_publish')}
            </button>
          ))}
        </nav>
      </div>

      {tab === 'info' && (
        <div className="space-y-4 max-w-3xl">
          <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
            <div className="grid sm:grid-cols-[80px_1fr] gap-4 items-start">
              <div>
                <label className="label">{t('emoji')}</label>
                <input className="input text-2xl text-center" value={course.emoji || ''} onChange={(e) => update({ emoji: e.target.value })} maxLength={2} />
              </div>
              <div>
                <label className="label">{t('title_required')}</label>
                <input className="input" value={course.title} onChange={(e) => update({ title: e.target.value })} />
              </div>
            </div>
            <div>
              <label className="label">{t('subtitle')}</label>
              <input className="input" value={course.subtitle || ''} onChange={(e) => update({ subtitle: e.target.value })} placeholder={t('subtitle_ph')} />
            </div>
            <div>
              <label className="label">{t('description')}</label>
              <textarea className="input min-h-[120px]" value={course.description || ''} onChange={(e) => update({ description: e.target.value })} />
            </div>
            <div>
              <label className="label">{t('hero_image')}</label>
              <div className="flex gap-4 items-start">
                <div className="w-40 shrink-0 aspect-[16/10] rounded-lg overflow-hidden border border-slate-200 bg-slate-50 flex items-center justify-center">
                  {course.hero_image_url
                    ? <img src={course.hero_image_url} alt="" className="w-full h-full object-cover" />
                    : <span className="text-3xl">{course.emoji || '📘'}</span>}
                </div>
                <div className="flex-1">
                  <input className="input" value={course.hero_image_url || ''} onChange={(e) => update({ hero_image_url: e.target.value })} placeholder={t('hero_image_ph')} />
                  <p className="text-xs text-slate-500 mt-1">{t('hero_image_hint')}</p>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="label">{t('level_label')}</label>
                <select className="input" value={course.level || 'beginner'} onChange={(e) => update({ level: e.target.value })}>
                  <option value="beginner">{t('level.beginner')}</option>
                  <option value="intermediate">{t('level.intermediate')}</option>
                  <option value="advanced">{t('level.advanced')}</option>
                </select>
              </div>
              <div>
                <label className="label">{t('category')}</label>
                <input className="input" value={course.category || ''} onChange={(e) => update({ category: e.target.value })} placeholder="ai" />
              </div>
              <div>
                <label className="label">{t('price_eur')}</label>
                <input type="number" min="0" step="1" className="input" value={(course.price_cents / 100).toFixed(0)} onChange={(e) => update({ price_cents: Math.round(parseFloat(e.target.value || '0') * 100) })} />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <label className="label">{t('topics_label')}</label>
            <p className="text-xs text-slate-500 mb-3">{t('topics_hint')}</p>
            <textarea className="input min-h-[140px]" value={(course.topics || []).join('\n')} onChange={(e) => update({ topics: e.target.value.split('\n').filter(Boolean) })} placeholder={t('topics_ph')} />
          </div>
        </div>
      )}

      {tab === 'modules' && (
        <ModulesEditor course={{ id: course.id, title: course.title, level: course.level || 'beginner' }} modules={course.modules || []} onChange={(modules) => update({ modules })} />
      )}

      {tab === 'materials' && course && (
        <CourseMaterials courseId={course.id} />
      )}

      {tab === 'estudio' && course && (
        <CourseStudioPanel courseId={course.id} />
      )}

      {tab === 'publish' && (
        <div className="max-w-2xl space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h2 className="font-semibold text-slate-900 mb-3">{t('current_state')}</h2>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center justify-between"><span>{t('s_published')}</span>{course.published ? <span className="text-emerald-600">{t('s_yes')}</span> : <span className="text-slate-400">{t('s_no')}</span>}</li>
              <li className="flex items-center justify-between"><span>{t('s_approval')}</span><span className="font-mono text-xs">{course.approval_status || 'draft'}</span></li>
              <li className="flex items-center justify-between"><span>{t('s_modules')}</span><span className="font-semibold">{(course.modules || []).length}</span></li>
              <li className="flex items-center justify-between"><span>{t('s_lessons')}</span><span className="font-semibold">{lessonCount}</span></li>
              <li className="flex items-center justify-between"><span>{t('s_lessons_with')}</span><span className="font-semibold">{generatedCount}/{lessonCount}</span></li>
              <li className="flex items-center justify-between"><span>{t('s_price')}</span><span className="font-semibold">{fmtCents(course.price_cents, course.currency || 'EUR')}</span></li>
            </ul>
          </div>
          {!isAdmin ? (
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <h2 className="font-semibold text-slate-900 mb-3">{t('submit_title')}</h2>
              <p className="text-sm text-slate-600 mb-4">{t('submit_desc')}</p>
              <button onClick={submitForReview} disabled={dirty || course.approval_status === 'submitted' || course.published} className="btn-primary disabled:opacity-50">
                {course.published ? t('already_published') : course.approval_status === 'submitted' ? t('awaiting_review') : t('submit_btn')}
              </button>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <h2 className="font-semibold text-slate-900 mb-3">{t('admin_publish_title')}</h2>
              <p className="text-sm text-slate-600 mb-4">{t('admin_publish_desc')}</p>
              <button onClick={togglePublished} className={course.published ? 'btn-secondary' : 'bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-5 py-2.5 rounded-lg text-sm'}>
                {course.published ? t('unpublish_course') : t('publish_now')}
              </button>
            </div>
          )}
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h2 className="font-semibold text-slate-900 mb-1">{course.archived ? t('archived_title') : t('archive_title')}</h2>
            <p className="text-sm text-slate-600 mb-4">{t('archive_desc')}</p>
            <button onClick={toggleArchived} className="btn-secondary">
              {course.archived ? t('unarchive_btn') : t('archive_btn')}
            </button>
          </div>
          <CourseTranslationManager courseId={course.id} />
        </div>
      )}
    </div>
  );
}
