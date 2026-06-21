'use client';

import { useEffect, useState } from 'react';
import { Link, useRouter } from '@/i18n/routing';
import { callAgentOps } from '@/lib/api/client';
import { DashboardSkeleton } from '@/components/shared/DashboardSkeleton';
import { Markdown } from '@/components/shared/Markdown';
import { relTime } from '@/lib/utils/cn';
import { toast } from 'sonner';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { useTranslations } from 'next-intl';
import { ProposalDossier } from '@/components/admin/ProposalDossier';

const PLATFORM_ICONS: Record<string, string> = {
  linkedin: '💼', twitter: '🐦', instagram: '📷', facebook: '👥', tiktok: '🎵', youtube: '▶️',
};

export function ApprovalDetail({ approvalId }: { approvalId: string }) {
  const t = useTranslations();
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [err, setErr] = useState<string | null>(null);
  const [deciding, setDeciding] = useState(false);
  const [selectedLang, setSelectedLang] = useState<string>('pt');

  useEffect(() => {
    callAgentOps<any>('admin_approval_detail', { approval_id: approvalId })
      .then((r) => setData(r))
      .catch((e) => setErr(e.message));
  }, [approvalId]);

  async function decide(decision: 'approved' | 'rejected') {
    if (decision === 'rejected' && !confirm(t('approval.confirm_reject'))) return;
    setDeciding(true);
    try {
      await callAgentOps('decide_approval', { approval_id: approvalId, decision });
      toast.success(decision === 'approved' ? t('approval.toast_approved') : t('approval.toast_rejected'));
      router.push('/admin' as any);
      router.refresh();
    } catch (e: any) { toast.error(e.message); } finally { setDeciding(false); }
  }

  if (err) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <p className="text-slate-700 font-medium">{err === 'admin_required' || err === 'unauthorized' ? t('approval.err_admin') : err}</p>
        <Link href={'/admin' as any} className="btn-primary mt-6 inline-flex">{t('approval.back_cockpit')}</Link>
      </div>
    );
  }
  if (!data) return <DashboardSkeleton stats={2} />;

  const { approval, kind } = data;
  const isPending = approval.status === 'pending';
  const titleKey = kind === 'blog_post' ? 'approval.title.blog' : kind === 'social_posts' ? 'approval.title.social' : kind === 'course' ? 'approval.title.course' : kind === 'instructor_application' ? 'approval.title.instr' : approval.action === 'generate_course_concept' ? 'approval.title.course_concept' : 'approval.title.other';

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-5 animate-fade-in">
      <AdminPageHeader
        backHref="/admin/overview"
        backLabel={t('approval.back_cockpit')}
        title={t(titleKey)}
        description={`${approval.reason || approval.action} · ${relTime(approval.created_at)}`}
        related={[
          { href: '/admin/candidaturas', label: 'Candidaturas', emoji: '🎓' },
          { href: '/admin/instrutores', label: 'Instrutores', emoji: '👨‍🏫' },
        ]}
        actions={
          <span className={`px-2.5 py-1 rounded-full text-xs font-medium flex-shrink-0 ${approval.status === 'pending' ? 'bg-amber-100 text-amber-700' : approval.status === 'approved' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>{approval.status}</span>
        }
      />

      {kind === 'blog_post' && data.post && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          {data.translations && data.translations.length > 1 && (
            <div className="border-b border-slate-100 px-4 sm:px-6 pt-4 flex flex-wrap gap-1">
              {data.translations.map((tr: any) => (
                <button key={tr.lang} onClick={() => setSelectedLang(tr.lang)} className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${selectedLang === tr.lang ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>{tr.lang.toUpperCase()}</button>
              ))}
            </div>
          )}
          {(() => {
            const tr = data.translations?.find((x: any) => x.lang === selectedLang) || data.translations?.[0];
            if (!tr) return <p className="p-6 text-sm text-slate-500">{t('approval.no_translations')}</p>;
            return (
              <article className="p-4 sm:p-6">
                {data.post.category && <span className="inline-block text-xs font-medium text-brand-700 bg-brand-50 px-2 py-0.5 rounded-full mb-3">{data.post.category}</span>}
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 leading-tight">{tr.title}</h2>
                <div className="mt-2 text-xs text-slate-500 flex flex-wrap gap-2">
                  <span>📝 {data.post.author_name || 'NeuroLearn AI'}</span>
                  {tr.reading_time_minutes && <><span>·</span><span>{tr.reading_time_minutes} {t('approval.min')}</span></>}
                  <span>·</span><span className="font-mono text-[10px] bg-slate-100 px-1.5 py-0.5 rounded">slug: {data.post.slug}</span>
                </div>
                {tr.excerpt && <p className="mt-4 text-base sm:text-lg text-slate-600 leading-relaxed italic">{tr.excerpt}</p>}
                <div className="mt-5 prose prose-slate max-w-none prose-sm sm:prose-base"><Markdown source={tr.content_md || ''} /></div>
                {data.post.tags && data.post.tags.length > 0 && (
                  <div className="mt-5 pt-4 border-t border-slate-100 flex flex-wrap gap-1.5">
                    {data.post.tags.map((tag: string) => <span key={tag} className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">{tag}</span>)}
                  </div>
                )}
              </article>
            );
          })()}
        </div>
      )}

      {kind === 'social_posts' && (
        <div className="space-y-3">
          {data.source_post && (
            <div className="bg-brand-50 border border-brand-100 rounded-lg p-3 text-sm">
              <span className="text-brand-700 font-medium">{t('approval.from_article')}</span>{' '}
              <Link href={`/blog/${data.source_post.slug}` as any} className="text-brand-700 underline">/blog/{data.source_post.slug}</Link>
            </div>
          )}
          {data.social_posts?.map((sp: any) => (
            <div key={sp.id} className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5">
              <div className="flex items-center justify-between gap-2 mb-3 flex-wrap">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-lg">{PLATFORM_ICONS[sp.platform] || '📱'}</span>
                  <span className="font-medium text-slate-900 capitalize">{sp.platform}</span>
                  {sp.variant && sp.variant !== 'default' && <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">{sp.variant}</span>}
                  <span className="text-xs text-slate-400 uppercase">{sp.lang}</span>
                </div>
                <span className="text-[11px] text-slate-400">{t('approval.chars', { n: (sp.content || '').length })}</span>
              </div>
              <p className="text-sm text-slate-700 whitespace-pre-line leading-relaxed">{sp.content}</p>
              {sp.hashtags && sp.hashtags.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {sp.hashtags.map((h: string) => <span key={h} className="text-xs text-brand-700 bg-brand-50 px-2 py-0.5 rounded-full">{h.startsWith('#') ? h : '#' + h}</span>)}
                </div>
              )}
              {sp.cta && <p className="mt-3 text-xs italic text-slate-500">{t('approval.cta', { t: sp.cta })}</p>}
            </div>
          ))}
        </div>
      )}

      {kind === 'course' && data.course && (
        <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-6">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-3xl">{data.course.emoji || '📚'}</span>
            <div>
              <h2 className="text-xl font-bold text-slate-900">{data.course.title}</h2>
              {data.course.subtitle && <p className="text-sm text-slate-500">{data.course.subtitle}</p>}
            </div>
          </div>
          {data.course.description && <p className="text-sm text-slate-700 leading-relaxed">{data.course.description}</p>}
          <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            <div className="bg-slate-50 rounded p-2"><span className="text-slate-500">{t('approval.level')}</span><div className="font-medium">{data.course.level}</div></div>
            <div className="bg-slate-50 rounded p-2"><span className="text-slate-500">{t('approval.modules')}</span><div className="font-medium">{(data.course.modules || []).length}</div></div>
            <div className="bg-slate-50 rounded p-2"><span className="text-slate-500">{t('approval.price')}</span><div className="font-medium">{data.course.price_cents > 0 ? `€${(data.course.price_cents/100).toFixed(0)}` : t('approval.free')}</div></div>
            <div className="bg-slate-50 rounded p-2"><span className="text-slate-500">{t('approval.type')}</span><div className="font-medium">{data.course.course_type}</div></div>
          </div>
          <Link href={`/admin/curso/${data.course.id}/editar` as any} className="mt-5 inline-flex text-sm text-brand-600 hover:underline">{t('approval.open_editor')}</Link>
        </div>
      )}

      {kind === 'instructor_application' && data.application && (
        <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-6 space-y-3">
          <h2 className="text-lg font-semibold text-slate-900">{data.application.name || data.application.email}</h2>
          {data.application.ai_summary && <p className="text-sm text-slate-700">{data.application.ai_summary}</p>}
          {data.application.ai_score_total && <p className="text-sm">{t('approval.ai_score', { s: data.application.ai_score_total })}</p>}
          {data.application.ai_strengths && <div><h3 className="text-xs font-semibold uppercase text-slate-500">{t('approval.strengths')}</h3><p className="text-sm text-slate-700">{Array.isArray(data.application.ai_strengths) ? data.application.ai_strengths.join(', ') : data.application.ai_strengths}</p></div>}
          {data.application.ai_red_flags && <div><h3 className="text-xs font-semibold uppercase text-rose-600">{t('approval.red_flags')}</h3><p className="text-sm text-slate-700">{Array.isArray(data.application.ai_red_flags) ? data.application.ai_red_flags.join(', ') : data.application.ai_red_flags}</p></div>}
        </div>
      )}

      {approval.action === 'generate_course_concept' && (
        <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-6 space-y-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900">{(approval.params as any)?.suggested_title}</h2>
            {(approval.params as any)?.suggested_description && <p className="mt-1 text-sm text-slate-700 leading-relaxed">{(approval.params as any).suggested_description}</p>}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
            <div className="bg-slate-50 rounded p-2"><span className="text-slate-500">{t('approval.cc_path')}</span><div className="font-medium">{(approval.params as any)?.path_title || '—'}</div></div>
            <div className="bg-slate-50 rounded p-2"><span className="text-slate-500">{t('approval.cc_position')}</span><div className="font-medium">{(approval.params as any)?.position_in_path ?? '—'}</div></div>
            <div className="bg-slate-50 rounded p-2"><span className="text-slate-500">{t('approval.level')}</span><div className="font-medium">{(approval.params as any)?.suggested_level || '—'}</div></div>
          </div>
          {Array.isArray((approval.params as any)?.suggested_topics) && (approval.params as any).suggested_topics.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold uppercase text-slate-500 mb-1.5">{t('approval.cc_topics')}</h3>
              <div className="flex flex-wrap gap-1.5">{(approval.params as any).suggested_topics.map((tp: string) => <span key={tp} className="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full">{tp}</span>)}</div>
            </div>
          )}
          <ProposalDossier approvalId={approvalId} />
        </div>
      )}

      {kind === 'other' && approval.action !== 'generate_course_concept' && (
        <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-6">
          <p className="text-sm text-slate-500">{t('approval.other_detail')}</p>
          <pre className="mt-3 text-xs bg-slate-50 p-3 rounded overflow-auto">{JSON.stringify(approval.params, null, 2)}</pre>
        </div>
      )}

      {isPending && (
        <div className="sticky bottom-4 z-10">
          <div className="bg-white rounded-xl border border-slate-200 shadow-lg p-3 flex gap-2">
            <button onClick={() => decide('rejected')} disabled={deciding} className="flex-1 px-4 py-2.5 rounded-lg border border-slate-300 text-slate-700 font-medium hover:bg-slate-50 disabled:opacity-50">{deciding ? '...' : t('approval.reject')}</button>
            <button onClick={() => decide('approved')} disabled={deciding} className="flex-1 px-4 py-2.5 rounded-lg bg-emerald-600 text-white font-medium hover:bg-emerald-700 disabled:opacity-50">{deciding ? '...' : t('approval.approve_publish')}</button>
          </div>
        </div>
      )}
    </div>
  );
}
