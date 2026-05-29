'use client';

import { useEffect, useState } from 'react';
import { Link, useRouter } from '@/i18n/routing';
import { callAgentOps } from '@/lib/api/client';
import { DashboardSkeleton } from '@/components/shared/DashboardSkeleton';
import { Markdown } from '@/components/shared/Markdown';
import { relTime } from '@/lib/utils/cn';
import { toast } from 'sonner';

const PLATFORM_ICONS: Record<string, string> = {
  linkedin: '💼', twitter: '🐦', instagram: '📷', facebook: '👥', tiktok: '🎵', youtube: '▶️',
};

export function ApprovalDetail({ approvalId }: { approvalId: string }) {
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
    if (decision === 'rejected' && !confirm('Tens a certeza que queres rejeitar?')) return;
    setDeciding(true);
    try {
      await callAgentOps('decide_approval', { approval_id: approvalId, decision });
      toast.success(decision === 'approved' ? 'Aprovado e publicado' : 'Rejeitado');
      router.push('/admin' as any);
      router.refresh();
    } catch (e: any) { toast.error(e.message); } finally { setDeciding(false); }
  }

  if (err) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <p className="text-slate-700 font-medium">{err === 'admin_required' || err === 'unauthorized' ? 'Acesso restrito a administradores.' : err}</p>
        <Link href={'/admin' as any} className="btn-primary mt-6 inline-flex">← Cockpit</Link>
      </div>
    );
  }
  if (!data) return <DashboardSkeleton stats={2} />;

  const { approval, kind } = data;
  const isPending = approval.status === 'pending';

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-5 animate-fade-in">
      <div>
        <Link href={'/admin#aprovacoes' as any} className="text-sm text-brand-600 hover:underline">← Cockpit</Link>
        <div className="flex items-start justify-between gap-3 mt-2 flex-wrap">
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900">{kind === 'blog_post' ? '📝 Proposta de artigo de blog' : kind === 'social_posts' ? '📣 Proposta de posts sociais' : kind === 'course' ? '📚 Proposta de curso' : kind === 'instructor_application' ? '👨‍🏫 Candidatura de instrutor' : '✋ Proposta para revisão'}</h1>
            <p className="text-sm text-slate-500 mt-1">{approval.reason || approval.action} · {relTime(approval.created_at)}</p>
          </div>
          <span className={`px-2.5 py-1 rounded-full text-xs font-medium flex-shrink-0 ${approval.status === 'pending' ? 'bg-amber-100 text-amber-700' : approval.status === 'approved' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>{approval.status}</span>
        </div>
      </div>

      {/* Blog post: vê todas as traduções, escolhe língua, vê título+excerpt+content_md */}
      {kind === 'blog_post' && data.post && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          {data.translations && data.translations.length > 1 && (
            <div className="border-b border-slate-100 px-4 sm:px-6 pt-4 flex flex-wrap gap-1">
              {data.translations.map((t: any) => (
                <button key={t.lang} onClick={() => setSelectedLang(t.lang)} className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${selectedLang === t.lang ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>{t.lang.toUpperCase()}</button>
              ))}
            </div>
          )}
          {(() => {
            const t = data.translations?.find((x: any) => x.lang === selectedLang) || data.translations?.[0];
            if (!t) return <p className="p-6 text-sm text-slate-500">Sem traduções disponíveis.</p>;
            return (
              <article className="p-4 sm:p-6">
                {data.post.category && <span className="inline-block text-xs font-medium text-brand-700 bg-brand-50 px-2 py-0.5 rounded-full mb-3">{data.post.category}</span>}
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 leading-tight">{t.title}</h2>
                <div className="mt-2 text-xs text-slate-500 flex flex-wrap gap-2">
                  <span>📝 {data.post.author_name || 'NeuroLearn AI'}</span>
                  {t.reading_time_minutes && <><span>·</span><span>{t.reading_time_minutes} min</span></>}
                  <span>·</span><span className="font-mono text-[10px] bg-slate-100 px-1.5 py-0.5 rounded">slug: {data.post.slug}</span>
                </div>
                {t.excerpt && <p className="mt-4 text-base sm:text-lg text-slate-600 leading-relaxed italic">{t.excerpt}</p>}
                <div className="mt-5 prose prose-slate max-w-none prose-sm sm:prose-base"><Markdown source={t.content_md || ''} /></div>
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

      {/* Social posts: lista variantes */}
      {kind === 'social_posts' && (
        <div className="space-y-3">
          {data.source_post && (
            <div className="bg-brand-50 border border-brand-100 rounded-lg p-3 text-sm">
              <span className="text-brand-700 font-medium">Posts gerados a partir do artigo:</span>{' '}
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
                <span className="text-[11px] text-slate-400">{(sp.content || '').length} caracteres</span>
              </div>
              <p className="text-sm text-slate-700 whitespace-pre-line leading-relaxed">{sp.content}</p>
              {sp.hashtags && sp.hashtags.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {sp.hashtags.map((h: string) => <span key={h} className="text-xs text-brand-700 bg-brand-50 px-2 py-0.5 rounded-full">{h.startsWith('#') ? h : '#' + h}</span>)}
                </div>
              )}
              {sp.cta && <p className="mt-3 text-xs italic text-slate-500">CTA: {sp.cta}</p>}
            </div>
          ))}
        </div>
      )}

      {/* Curso */}
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
            <div className="bg-slate-50 rounded p-2"><span className="text-slate-500">Nível</span><div className="font-medium">{data.course.level}</div></div>
            <div className="bg-slate-50 rounded p-2"><span className="text-slate-500">Módulos</span><div className="font-medium">{(data.course.modules || []).length}</div></div>
            <div className="bg-slate-50 rounded p-2"><span className="text-slate-500">Preço</span><div className="font-medium">{data.course.price_cents > 0 ? `€${(data.course.price_cents/100).toFixed(0)}` : 'Grátis'}</div></div>
            <div className="bg-slate-50 rounded p-2"><span className="text-slate-500">Tipo</span><div className="font-medium">{data.course.course_type}</div></div>
          </div>
          <Link href={`/admin/curso/${data.course.id}/editar` as any} className="mt-5 inline-flex text-sm text-brand-600 hover:underline">Abrir no editor →</Link>
        </div>
      )}

      {/* Candidatura instrutor */}
      {kind === 'instructor_application' && data.application && (
        <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-6 space-y-3">
          <h2 className="text-lg font-semibold text-slate-900">{data.application.name || data.application.email}</h2>
          {data.application.ai_summary && <p className="text-sm text-slate-700">{data.application.ai_summary}</p>}
          {data.application.ai_score_total && <p className="text-sm">Score IA: <strong>{data.application.ai_score_total}/100</strong></p>}
          {data.application.ai_strengths && <div><h3 className="text-xs font-semibold uppercase text-slate-500">Pontos fortes</h3><p className="text-sm text-slate-700">{Array.isArray(data.application.ai_strengths) ? data.application.ai_strengths.join(', ') : data.application.ai_strengths}</p></div>}
          {data.application.ai_red_flags && <div><h3 className="text-xs font-semibold uppercase text-rose-600">Red flags</h3><p className="text-sm text-slate-700">{Array.isArray(data.application.ai_red_flags) ? data.application.ai_red_flags.join(', ') : data.application.ai_red_flags}</p></div>}
        </div>
      )}

      {kind === 'other' && (
        <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-6">
          <p className="text-sm text-slate-500">Detalhe específico não disponível para este tipo. Conteúdo bruto:</p>
          <pre className="mt-3 text-xs bg-slate-50 p-3 rounded overflow-auto">{JSON.stringify(approval.params, null, 2)}</pre>
        </div>
      )}

      {/* Sticky action bar mobile-friendly */}
      {isPending && (
        <div className="sticky bottom-4 z-10">
          <div className="bg-white rounded-xl border border-slate-200 shadow-lg p-3 flex gap-2">
            <button onClick={() => decide('rejected')} disabled={deciding} className="flex-1 px-4 py-2.5 rounded-lg border border-slate-300 text-slate-700 font-medium hover:bg-slate-50 disabled:opacity-50">{deciding ? '...' : 'Rejeitar'}</button>
            <button onClick={() => decide('approved')} disabled={deciding} className="flex-1 px-4 py-2.5 rounded-lg bg-emerald-600 text-white font-medium hover:bg-emerald-700 disabled:opacity-50">{deciding ? '...' : '✓ Aprovar e publicar'}</button>
          </div>
        </div>
      )}
    </div>
  );
}
