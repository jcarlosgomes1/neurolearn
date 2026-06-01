'use client';

import { useEffect, useState, useCallback } from 'react';
import { Link } from '@/i18n/routing';
import { SUPABASE_URL } from '@/lib/supabase/config';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';

interface KPIs {
  blog_total: number; blog_published: number; blog_drafts: number;
  social_pending: number; social_approved: number; social_published: number;
  topics_total: number; topics_new_7d: number;
  approvals_pending: number; approvals_expired: number;
}

interface Approval {
  id: string; action: string; reason: string | null; params: Record<string, any>;
  status: string; created_at: string; expires_at: string | null;
}

interface ApprovalDetail {
  kind: 'blog_post' | 'social_posts' | 'course' | 'instructor_application' | 'other';
  approval: Approval;
  post?: any; translations?: any[];
  social_posts?: Array<{ id: string; platform: string; variant: string; lang: string; content: string; hashtags: string[]; cta: string | null }>;
  source_post?: any; course?: any; application?: any;
}

interface Topic {
  id: string; title: string; description: string | null; category: string | null;
  priority: number; status: string; tags: string[] | null; created_at: string;
}

interface BlogPost {
  id: string; slug: string; status: string; category: string | null;
  published_at: string | null; view_count: number | null; created_at: string;
}

const ACTION_META: Record<string, { emoji: string; labelKey: string; color: string }> = {
  publish_blog_post: { emoji: '📝', labelKey: 'mkt.modal_blog', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  publish_social_posts: { emoji: '📣', labelKey: 'mkt.modal_social', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  approve_course: { emoji: '🎓', labelKey: 'mkt.modal_other', color: 'bg-purple-50 text-purple-700 border-purple-200' },
};

const PLATFORM_EMOJI: Record<string, string> = {
  linkedin: '💼', twitter: '🐦', facebook: '📘', instagram: '📸',
};

function fmtRelative(iso: string): string {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return `${Math.floor(diff)}s`;
  if (diff < 3600) return `${Math.floor(diff/60)}m`;
  if (diff < 86400) return `${Math.floor(diff/3600)}h`;
  return `${Math.floor(diff/86400)}d`;
}
function isExpired(iso: string | null): boolean {
  return !!iso && new Date(iso).getTime() < Date.now();
}

async function adminOps<T>(action: string, payload: Record<string, any> = {}): Promise<T | null> {
  const sb = createClient();
  const { data: { session } } = await sb.auth.getSession();
  if (!session) return null;
  const resp = await fetch(`${SUPABASE_URL}/functions/v1/agent-ops`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
    body: JSON.stringify({ action, payload }),
  });
  return await resp.json();
}

export function MarketingView() {
  const t = useTranslations();
  const [kpis, setKpis] = useState<KPIs | null>(null);
  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<ApprovalDetail | null>(null);
  const [busy, setBusy] = useState<Set<string>>(new Set());

  const loadAll = useCallback(async () => {
    setLoading(true);
    const sb = createClient();
    const [aps, tps, ps, blogs, social, sevenDay] = await Promise.all([
      adminOps<{ ok: boolean; rows: Approval[] }>('list_pending_approvals'),
      adminOps<{ ok: boolean; topics: Topic[] }>('list_topics', { limit: 50 }),
      adminOps<{ ok: boolean; posts: BlogPost[] }>('list_blog_posts', { limit: 30, status: 'draft' }),
      sb.from('nl_blog_posts').select('id, status').then(r => r.data || []),
      sb.from('nl_social_posts').select('id, status').then(r => r.data || []),
      sb.from('nl_blog_topics').select('id, created_at').gte('created_at', new Date(Date.now() - 7 * 86400000).toISOString()).then(r => r.data || []),
    ]);
    setApprovals(aps?.rows || []);
    setTopics(tps?.topics || []);
    setPosts(ps?.posts || []);
    const approvalsList = aps?.rows || [];
    setKpis({
      blog_total: blogs.length,
      blog_published: blogs.filter((b: any) => b.status === 'published').length,
      blog_drafts: blogs.filter((b: any) => b.status === 'draft').length,
      social_pending: social.filter((s: any) => s.status === 'pending_review').length,
      social_approved: social.filter((s: any) => s.status === 'approved').length,
      social_published: social.filter((s: any) => s.status === 'published').length,
      topics_total: tps?.topics?.length || 0,
      topics_new_7d: sevenDay.length,
      approvals_pending: approvalsList.length,
      approvals_expired: approvalsList.filter(a => isExpired(a.expires_at)).length,
    });
    setLoading(false);
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  async function openApproval(id: string) {
    const detail = await adminOps<ApprovalDetail & { ok: boolean }>('admin_approval_detail', { approval_id: id });
    if (detail?.ok) setSelected(detail);
    else toast.error(t('mkt.toast_open_fail'));
  }

  async function decide(id: string, decision: 'approved' | 'rejected', note?: string) {
    if (busy.has(id)) return;
    setBusy((s) => new Set([...s, id]));
    const r = await adminOps<{ ok: boolean; error?: string }>('decide_approval', { approval_id: id, decision, note });
    if (r?.ok) {
      toast.success(decision === 'approved' ? t('mkt.toast_approved') : t('mkt.toast_rejected'));
      setSelected(null);
      await loadAll();
    } else {
      toast.error(r?.error || t('mkt.toast_fail'));
    }
    setBusy((s) => { const n = new Set(s); n.delete(id); return n; });
  }

  async function triggerScout() {
    toast.info(t('mkt.toast_scout_started'));
    const sb = createClient();
    const { data: { session } } = await sb.auth.getSession();
    fetch(`${SUPABASE_URL}/functions/v1/scout-topics`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token}` },
      body: JSON.stringify({ limit: 5 }),
    }).then(() => { setTimeout(loadAll, 8000); });
  }

  async function generateBlogFromTopic(topicId: string) {
    toast.info(t('mkt.toast_blog_gen'));
    const sb = createClient();
    const { data: { session } } = await sb.auth.getSession();
    fetch(`${SUPABASE_URL}/functions/v1/generate-blog-post`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token}` },
      body: JSON.stringify({ topic_id: topicId }),
    }).then(() => { setTimeout(loadAll, 10000); });
  }

  async function generateSocialFromPost(postId: string) {
    toast.info(t('mkt.toast_social_gen'));
    const sb = createClient();
    const { data: { session } } = await sb.auth.getSession();
    fetch(`${SUPABASE_URL}/functions/v1/generate-social-posts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token}` },
      body: JSON.stringify({ post_id: postId }),
    }).then(() => { setTimeout(loadAll, 8000); });
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <Link href={'/admin' as any} className="text-sm text-brand-600 hover:underline">{t('mkt.back')}</Link>
      <div className="mt-3 flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">{t('mkt.title')}</h1>
          <p className="text-sm text-slate-500 mt-1">{t('mkt.subtitle')}</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button onClick={triggerScout} className="text-sm bg-white border border-slate-200 hover:border-slate-300 px-3 py-2 rounded-lg font-medium">{t('mkt.btn_scout')}</button>
          <button onClick={loadAll} className="text-sm bg-white border border-slate-200 hover:border-slate-300 px-3 py-2 rounded-lg">{t('mkt.btn_reload')}</button>
        </div>
      </div>

      {kpis && (
        <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Kpi label={t('mkt.kpi_approvals')} value={kpis.approvals_pending} sub={kpis.approvals_expired > 0 ? t('mkt.kpi_expired_count', { n: kpis.approvals_expired }) : t('mkt.kpi_all_active')} highlight={kpis.approvals_pending > 0} warning={kpis.approvals_expired > 0} />
          <Kpi label={t('mkt.kpi_blog')} value={kpis.blog_published} sub={t('mkt.kpi_blog_sub', { drafts: kpis.blog_drafts, total: kpis.blog_total })} />
          <Kpi label={t('mkt.kpi_social')} value={kpis.social_pending} sub={t('mkt.kpi_social_sub', { approved: kpis.social_approved, published: kpis.social_published })} />
          <Kpi label={t('mkt.kpi_topics')} value={kpis.topics_total} sub={t('mkt.kpi_topics_sub', { n: kpis.topics_new_7d })} />
        </div>
      )}

      <section className="mt-8">
        <h2 className="text-lg font-bold text-slate-900 mb-3 flex items-center gap-2">
          {t('mkt.approvals_title')}
          {kpis && kpis.approvals_pending > 0 && <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-semibold">{kpis.approvals_pending}</span>}
        </h2>
        {loading ? (
          <div className="text-center py-12 text-slate-400">{t('events.loading')}</div>
        ) : approvals.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-slate-200">
            <div className="text-3xl mb-2">✨</div>
            <p className="text-slate-700 font-medium">{t('mkt.empty_pending_title')}</p>
            <p className="text-sm text-slate-500">{t('mkt.empty_pending_hint')}</p>
          </div>
        ) : (
          <div className="grid gap-3">
            {approvals.map((ap) => {
              const meta = ACTION_META[ap.action] || { emoji: '•', labelKey: 'mkt.modal_other', color: 'bg-slate-50 text-slate-700 border-slate-200' };
              const expired = isExpired(ap.expires_at);
              return (
                <div key={ap.id} className={`bg-white border-2 ${expired ? 'border-rose-200 bg-rose-50/30' : 'border-slate-200'} rounded-xl p-4 sm:p-5 flex items-start gap-4 flex-wrap`}>
                  <span className={`flex-shrink-0 inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${meta.color}`}>
                    {meta.emoji} {t(meta.labelKey)}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-800 font-medium">{ap.reason || ap.action}</p>
                    <div className="text-xs text-slate-500 mt-1 flex flex-wrap gap-x-3">
                      <span>{t('mkt.ago', { t: fmtRelative(ap.created_at) })}</span>
                      {ap.expires_at && (
                        <span className={expired ? 'text-rose-600 font-semibold' : ''}>
                          {expired ? t('mkt.expired_ago', { t: fmtRelative(ap.expires_at) }) : t('mkt.expires_in', { t: fmtRelative(ap.expires_at) })}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2 flex-shrink-0 w-full sm:w-auto">
                    <button onClick={() => openApproval(ap.id)} className="text-sm bg-white border border-slate-200 hover:border-slate-300 px-3 py-2 rounded-lg flex-1 sm:flex-none">{t('mkt.btn_view')}</button>
                    <button onClick={() => decide(ap.id, 'rejected')} disabled={busy.has(ap.id)} className="text-sm bg-white border border-rose-200 hover:bg-rose-50 text-rose-700 px-3 py-2 rounded-lg disabled:opacity-40 flex-1 sm:flex-none">{t('mkt.btn_reject')}</button>
                    <button onClick={() => decide(ap.id, 'approved')} disabled={busy.has(ap.id)} className="text-sm bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white px-3 py-2 rounded-lg font-semibold flex-1 sm:flex-none">{busy.has(ap.id) ? '...' : t('mkt.btn_approve')}</button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <div className="mt-10 grid lg:grid-cols-2 gap-6">
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold text-slate-900">{t('mkt.topics_title', { n: topics.length })}</h2>
            <button onClick={triggerScout} className="text-xs text-brand-600 hover:underline">{t('mkt.scout_more')}</button>
          </div>
          {topics.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-6 text-center text-sm text-slate-500">{t('mkt.no_topics')}</div>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden divide-y divide-slate-100">
              {topics.slice(0, 10).map((tp) => (
                <div key={tp.id} className="p-3 hover:bg-slate-50 flex items-start gap-3">
                  <span className="flex-shrink-0 w-7 h-7 rounded-full bg-amber-100 text-amber-700 text-xs font-bold flex items-center justify-center">{tp.priority}</span>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-slate-900 truncate">{tp.title}</h3>
                    {tp.description && <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{tp.description}</p>}
                    <div className="text-[10px] text-slate-400 mt-1">{tp.category} · {tp.status}</div>
                  </div>
                  <button onClick={() => generateBlogFromTopic(tp.id)} className="text-xs bg-brand-600 hover:bg-brand-700 text-white px-2.5 py-1.5 rounded-md font-medium flex-shrink-0">{t('mkt.btn_to_blog')}</button>
                </div>
              ))}
            </div>
          )}
        </section>

        <section>
          <h2 className="text-lg font-bold text-slate-900 mb-3">{t('mkt.drafts_title', { n: posts.length })}</h2>
          {posts.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-6 text-center text-sm text-slate-500">{t('mkt.no_drafts')}</div>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden divide-y divide-slate-100">
              {posts.slice(0, 10).map((p) => (
                <div key={p.id} className="p-3 hover:bg-slate-50 flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-slate-900 truncate">{p.slug}</h3>
                    <div className="text-[10px] text-slate-400 mt-0.5">{p.category} · {t('mkt.ago', { t: fmtRelative(p.created_at) })}</div>
                  </div>
                  <button onClick={() => generateSocialFromPost(p.id)} className="text-xs bg-brand-600 hover:bg-brand-700 text-white px-2.5 py-1.5 rounded-md font-medium flex-shrink-0">{t('mkt.btn_to_social')}</button>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {selected && <DetailModal detail={selected} onClose={() => setSelected(null)} onDecide={decide} busy={busy.has(selected.approval.id)} t={t} />}
    </div>
  );
}

interface KpiProps { label: string; value: number; sub?: string; highlight?: boolean; warning?: boolean }
function Kpi({ label, value, sub, highlight, warning }: KpiProps) {
  const valueColor = warning ? 'text-rose-600' : highlight ? 'text-amber-600' : 'text-slate-900';
  return (
    <div className={`bg-white rounded-xl border-2 ${warning ? 'border-rose-200' : highlight ? 'border-amber-200' : 'border-slate-200'} p-4`}>
      <div className="text-xs uppercase tracking-wider text-slate-500 font-semibold">{label}</div>
      <div className={`text-3xl font-bold tabular-nums mt-1 ${valueColor}`}>{value}</div>
      {sub && <div className="text-[11px] text-slate-500 mt-1">{sub}</div>}
    </div>
  );
}

interface DetailModalProps { detail: ApprovalDetail; onClose: () => void; onDecide: (id: string, d: 'approved'|'rejected') => void; busy: boolean; t: (k: string, p?: any) => string }
function DetailModal({ detail, onClose, onDecide, busy, t }: DetailModalProps) {
  const titleKey = detail.kind === 'blog_post' ? 'mkt.modal_blog' : detail.kind === 'social_posts' ? 'mkt.modal_social' : 'mkt.modal_other';
  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto" onClick={onClose}>
      <div className="bg-white w-full sm:max-w-3xl sm:rounded-2xl shadow-2xl max-h-[95vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-slate-100 flex-shrink-0">
          <div>
            <h2 className="font-bold text-slate-900 text-lg">{t(titleKey)}</h2>
            <p className="text-xs text-slate-500">{detail.approval.reason}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 text-3xl leading-none w-9 h-9 flex items-center justify-center">×</button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {detail.kind === 'blog_post' && detail.post && (
            <>
              <div>
                <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">{t('mkt.slug_label')}</div>
                <div className="text-sm text-slate-900 font-mono">{detail.post.slug}</div>
              </div>
              {detail.post.category && (
                <div><span className="inline-block text-xs bg-brand-50 text-brand-700 px-2 py-0.5 rounded-full">{detail.post.category}</span></div>
              )}
              {(detail.translations || []).map((tr: any) => (
                <div key={tr.lang} className="border-l-2 border-slate-200 pl-3">
                  <div className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold mb-1">{tr.lang}</div>
                  <h3 className="font-bold text-slate-900">{tr.title}</h3>
                  {tr.excerpt && <p className="text-sm text-slate-600 mt-1">{tr.excerpt}</p>}
                  {tr.reading_time_minutes && <div className="text-xs text-slate-500 mt-1">{t('mkt.reading_min', { n: tr.reading_time_minutes })}</div>}
                  {tr.content_md && (
                    <details className="mt-2">
                      <summary className="text-xs text-brand-600 cursor-pointer hover:underline">{t('mkt.see_full_content', { n: tr.content_md.length })}</summary>
                      <pre className="mt-2 text-xs text-slate-700 bg-slate-50 p-3 rounded whitespace-pre-wrap font-sans">{tr.content_md}</pre>
                    </details>
                  )}
                </div>
              ))}
            </>
          )}

          {detail.kind === 'social_posts' && detail.social_posts && (
            <>
              {detail.source_post && (
                <div className="text-xs text-slate-500">{t('mkt.for_post')} <span className="font-mono">{detail.source_post.slug}</span></div>
              )}
              <div className="space-y-3">
                {detail.social_posts.map((sp) => (
                  <div key={sp.id} className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                    <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-700">{PLATFORM_EMOJI[sp.platform] || '•'} {sp.platform}</span>
                      <span className="text-[10px] text-slate-400">{sp.variant} · {sp.lang}</span>
                    </div>
                    <p className="text-sm text-slate-800 whitespace-pre-wrap">{sp.content}</p>
                    {sp.hashtags && sp.hashtags.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {sp.hashtags.map((h, i) => <span key={i} className="text-xs text-brand-600">#{h.replace(/^#/, '')}</span>)}
                      </div>
                    )}
                    {sp.cta && <div className="mt-2 text-xs text-slate-500 italic">{t('mkt.cta_label')} {sp.cta}</div>}
                  </div>
                ))}
              </div>
            </>
          )}

          {detail.kind === 'other' && (
            <pre className="text-xs text-slate-600 bg-slate-50 p-3 rounded overflow-x-auto">{JSON.stringify(detail.approval.params, null, 2)}</pre>
          )}
        </div>

        <div className="border-t border-slate-200 p-5 bg-slate-50 flex gap-2 flex-shrink-0">
          <button onClick={() => onDecide(detail.approval.id, 'rejected')} disabled={busy} className="flex-1 bg-white border-2 border-rose-200 hover:bg-rose-50 text-rose-700 text-sm font-semibold py-2.5 rounded-lg disabled:opacity-40">{t('mkt.modal_reject')}</button>
          <button onClick={() => onDecide(detail.approval.id, 'approved')} disabled={busy} className="flex-1 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-sm font-semibold py-2.5 rounded-lg shadow">{busy ? t('mkt.modal_processing') : t('mkt.modal_approve_publish')}</button>
        </div>
      </div>
    </div>
  );
}
