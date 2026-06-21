'use client';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { AgentSuggestionsRail } from '@/components/primitives/AgentSuggestionsRail';

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
  id: string; action: string; reason: string | null; params: Record<string, unknown>;
  status: string; created_at: string; expires_at: string | null;
}

interface BlogTranslation {
  lang: string; title: string; excerpt: string | null;
  content_md: string; reading_time_minutes: number | null;
}

interface BlogPostInfo {
  id: string; slug: string; category: string | null; requires_factcheck?: boolean; factcheck_notes?: string | null;
}

interface SocialPostInfo {
  id: string; platform: string; variant: string; lang: string;
  content: string; hashtags: string[]; cta: string | null;
}

interface ApprovalDetail {
  kind: 'blog_post' | 'social_posts' | 'course' | 'instructor_application' | 'other';
  approval: Approval;
  post?: BlogPostInfo; translations?: BlogTranslation[];
  social_posts?: SocialPostInfo[];
  source_post?: { slug: string };
}

interface Topic {
  id: string; title: string; description: string | null; category: string | null;
  priority: number; status: string; tags: string[] | null; created_at: string;
}

interface BlogPost {
  id: string; slug: string; status: string; category: string | null;
  published_at: string | null; view_count: number | null; created_at: string;
  requires_factcheck?: boolean; factcheck_notes?: string | null;
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

async function adminOps<T>(action: string, payload: Record<string, unknown> = {}): Promise<T | null> {
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
      adminOps<{ ok: boolean; posts: BlogPost[] }>('list_blog_posts', { limit: 30, status: 'pending_review' }),
      sb.from('nl_blog_posts').select('id, status, requires_factcheck').then(r => r.data || []),
      sb.from('nl_social_posts').select('id, status').then(r => r.data || []),
      sb.from('nl_blog_topics').select('id, created_at').gte('created_at', new Date(Date.now() - 7 * 86400000).toISOString()).then(r => r.data || []),
    ]);
    setApprovals(aps?.rows || []);
    setTopics(tps?.topics || []);
    setPosts(ps?.posts || []);
    const approvalsList = aps?.rows || [];
    setKpis({
      blog_total: blogs.length,
      blog_published: blogs.filter((b) => (b as { status: string }).status === 'published').length,
      blog_drafts: blogs.filter((b) => (b as { status: string }).status === 'pending_review').length,
      social_pending: social.filter((s) => (s as { status: string }).status === 'pending_review').length,
      social_approved: social.filter((s) => (s as { status: string }).status === 'approved').length,
      social_published: social.filter((s) => (s as { status: string }).status === 'published').length,
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

  async function openBlogPostForEdit(postId: string) {
    const sb = createClient();
    const { data: post } = await sb.from('nl_blog_posts').select('id, slug, category, requires_factcheck, factcheck_notes').eq('id', postId).single();
    const { data: translations } = await sb.from('nl_blog_post_translations').select('lang, title, excerpt, content_md, reading_time_minutes').eq('post_id', postId);
    if (!post) { toast.error(t('mkt.toast_open_fail')); return; }
    // Synthetic approval detail (no approval needed, just edit)
    setSelected({
      kind: 'blog_post',
      approval: { id: 'edit:' + postId, action: 'edit_blog_post', reason: null, params: {}, status: 'editing', created_at: new Date().toISOString(), expires_at: null },
      post: post as BlogPostInfo,
      translations: (translations as BlogTranslation[]) || [],
    });
  }

  async function decide(id: string, decision: 'approved' | 'rejected') {
    if (busy.has(id) || id.startsWith('edit:')) return;
    setBusy((s) => new Set([...s, id]));
    const r = await adminOps<{ ok: boolean; error?: string }>('decide_approval', { approval_id: id, decision });
    if (r?.ok) {
      toast.success(decision === 'approved' ? t('mkt.toast_approved') : t('mkt.toast_rejected'));
      setSelected(null);
      await loadAll();
    } else {
      toast.error(r?.error || t('mkt.toast_fail'));
    }
    setBusy((s) => { const n = new Set(s); n.delete(id); return n; });
  }

  async function saveBlogEdits(postId: string, factcheckOK: boolean, translations: BlogTranslation[]) {
    const sb = createClient();
    // Update each translation
    for (const tr of translations) {
      const { error } = await sb.from('nl_blog_post_translations').update({
        title: tr.title, excerpt: tr.excerpt, content_md: tr.content_md, reading_time_minutes: tr.reading_time_minutes,
      }).eq('post_id', postId).eq('lang', tr.lang);
      if (error) { toast.error(error.message); return false; }
    }
    if (factcheckOK) {
      const { error } = await sb.from('nl_blog_posts').update({ requires_factcheck: false, factcheck_notes: null }).eq('id', postId);
      if (error) { toast.error(error.message); return false; }
    }
    toast.success(t('mkt.toast_saved'));
    await loadAll();
    return true;
  }

  async function saveSocialEdits(socialPosts: SocialPostInfo[]) {
    const sb = createClient();
    for (const sp of socialPosts) {
      const { error } = await sb.from('nl_social_posts').update({
        content: sp.content, hashtags: sp.hashtags, cta: sp.cta,
      }).eq('id', sp.id);
      if (error) { toast.error(error.message); return false; }
    }
    toast.success(t('mkt.toast_saved'));
    await loadAll();
    return true;
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
      <AdminPageHeader
        emoji="📢"
        title={t('mkt.title')}
        description={t('mkt.subtitle')}
        actions={
          <div className="flex gap-2 flex-wrap">
            <button onClick={triggerScout} className="text-sm bg-white border border-slate-200 hover:border-slate-300 px-3 py-2 rounded-lg font-medium">{t('mkt.btn_scout')}</button>
            <button onClick={loadAll} className="text-sm bg-white border border-slate-200 hover:border-slate-300 px-3 py-2 rounded-lg">{t('mkt.btn_reload')}</button>
          </div>
        }
      />
      <div className="mb-5">
        <AgentSuggestionsRail surface="blog" />
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
                    <button onClick={() => openApproval(ap.id)} className="text-sm bg-white border border-slate-200 hover:border-slate-300 px-3 py-2 rounded-lg flex-1 sm:flex-none">{t('mkt.btn_view_edit')}</button>
                    <button onClick={() => decide(ap.id, 'rejected')} disabled={busy.has(ap.id)} className="text-sm bg-white border border-rose-200 hover:bg-rose-50 text-rose-700 px-3 py-2 rounded-lg disabled:opacity-40 flex-1 sm:flex-none">{t('mkt.btn_reject')}</button>
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
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm font-semibold text-slate-900 truncate">{p.slug}</h3>
                      {p.requires_factcheck && (
                        <span className="text-[10px] font-bold uppercase tracking-wider bg-rose-100 text-rose-700 px-1.5 py-0.5 rounded-full">⚠ {t('mkt.factcheck_needed')}</span>
                      )}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">{p.category} · {t('mkt.ago', { t: fmtRelative(p.created_at) })}</div>
                  </div>
                  <button onClick={() => openBlogPostForEdit(p.id)} className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 px-2.5 py-1.5 rounded-md font-medium flex-shrink-0">✎ {t('mkt.btn_edit')}</button>
                  <button onClick={() => generateSocialFromPost(p.id)} className="text-xs bg-brand-600 hover:bg-brand-700 text-white px-2.5 py-1.5 rounded-md font-medium flex-shrink-0">{t('mkt.btn_to_social')}</button>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {selected && <DetailModal detail={selected} onClose={() => setSelected(null)} onDecide={decide} onSaveBlog={saveBlogEdits} onSaveSocial={saveSocialEdits} busy={busy.has(selected.approval.id)} t={t} />}
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

interface DetailModalProps {
  detail: ApprovalDetail;
  onClose: () => void;
  onDecide: (id: string, d: 'approved'|'rejected') => void;
  onSaveBlog: (postId: string, factcheckOK: boolean, translations: BlogTranslation[]) => Promise<boolean>;
  onSaveSocial: (sp: SocialPostInfo[]) => Promise<boolean>;
  busy: boolean;
  t: ReturnType<typeof useTranslations>;
}

function DetailModal({ detail, onClose, onDecide, onSaveBlog, onSaveSocial, busy, t }: DetailModalProps) {
  const isEditMode = detail.approval.id.startsWith('edit:');
  const titleKey = detail.kind === 'blog_post' ? 'mkt.modal_blog' : detail.kind === 'social_posts' ? 'mkt.modal_social' : 'mkt.modal_other';
  const [translations, setTranslations] = useState<BlogTranslation[]>(detail.translations || []);
  const [socials, setSocials] = useState<SocialPostInfo[]>(detail.social_posts || []);
  const [factcheckOK, setFactcheckOK] = useState(!detail.post?.requires_factcheck);
  const [saving, setSaving] = useState(false);

  async function handleSaveAndApprove(approvalId: string) {
    setSaving(true);
    if (detail.kind === 'blog_post' && detail.post) {
      const ok = await onSaveBlog(detail.post.id, factcheckOK, translations);
      if (ok && !isEditMode) onDecide(approvalId, 'approved');
      if (ok && isEditMode) onClose();
    } else if (detail.kind === 'social_posts') {
      const ok = await onSaveSocial(socials);
      if (ok && !isEditMode) onDecide(approvalId, 'approved');
      if (ok && isEditMode) onClose();
    }
    setSaving(false);
  }

  function updateTranslation(lang: string, field: keyof BlogTranslation, value: unknown) {
    setTranslations((prev) => prev.map((tr) => tr.lang === lang ? { ...tr, [field]: value } : tr));
  }
  function updateSocial(idx: number, field: keyof SocialPostInfo, value: unknown) {
    setSocials((prev) => prev.map((sp, i) => i === idx ? { ...sp, [field]: value } : sp));
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto" onClick={onClose}>
      <div className="bg-white w-full sm:max-w-4xl sm:rounded-2xl shadow-2xl max-h-[95vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-slate-100 flex-shrink-0">
          <div className="min-w-0">
            <h2 className="font-bold text-slate-900 text-lg">{t(titleKey)}</h2>
            <p className="text-xs text-slate-500 truncate">{detail.approval.reason || (isEditMode ? t('mkt.edit_mode') : '')}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 text-3xl leading-none w-9 h-9 flex items-center justify-center flex-shrink-0">×</button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Factcheck warning banner */}
          {detail.post?.requires_factcheck && (
            <div className="bg-rose-50 border-2 border-rose-200 rounded-xl p-4">
              <div className="flex items-start gap-2">
                <span className="text-rose-700 text-lg">⚠</span>
                <div className="flex-1">
                  <div className="font-bold text-rose-900 text-sm">{t('mkt.factcheck_banner_title')}</div>
                  <p className="text-xs text-rose-700 mt-1 leading-relaxed">{t('mkt.factcheck_banner_desc')}</p>
                  {detail.post.factcheck_notes && <p className="text-xs text-rose-600 mt-2 italic">{detail.post.factcheck_notes}</p>}
                </div>
              </div>
              <label className="mt-3 flex items-center gap-2 text-sm font-medium text-rose-900 cursor-pointer">
                <input type="checkbox" checked={factcheckOK} onChange={(e) => setFactcheckOK(e.target.checked)} className="rounded border-rose-300" />
                {t('mkt.factcheck_confirm')}
              </label>
            </div>
          )}

          {detail.kind === 'blog_post' && detail.post && (
            <>
              <div className="text-xs text-slate-500">
                <span className="font-semibold uppercase tracking-wider">{t('mkt.slug_label')}</span> <code className="text-slate-900">{detail.post.slug}</code>
                {detail.post.category && <span className="ml-3 inline-block text-xs bg-brand-50 text-brand-700 px-2 py-0.5 rounded-full">{detail.post.category}</span>}
              </div>
              {translations.map((tr) => (
                <div key={tr.lang} className="border border-slate-200 rounded-lg p-4 bg-slate-50">
                  <div className="text-[10px] uppercase tracking-wider text-slate-500 font-bold mb-3">🌐 {tr.lang.toUpperCase()}</div>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">{t('mkt.field_title')}</label>
                      <input type="text" value={tr.title} onChange={(e) => updateTranslation(tr.lang, 'title', e.target.value)}
                        className="w-full text-sm p-2 bg-white border border-slate-200 rounded-lg focus:border-brand-400 focus:outline-none" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">{t('mkt.field_excerpt')}</label>
                      <textarea value={tr.excerpt || ''} onChange={(e) => updateTranslation(tr.lang, 'excerpt', e.target.value)} rows={2}
                        className="w-full text-sm p-2 bg-white border border-slate-200 rounded-lg focus:border-brand-400 focus:outline-none" />
                    </div>
                    <div>
                      <label className="flex items-center justify-between text-xs font-semibold text-slate-700 mb-1">
                        <span>{t('mkt.field_content')}</span>
                        <span className="text-slate-400 font-normal">{tr.content_md.length} chars</span>
                      </label>
                      <textarea value={tr.content_md} onChange={(e) => updateTranslation(tr.lang, 'content_md', e.target.value)} rows={14}
                        className="w-full font-mono text-xs p-3 bg-white border border-slate-200 rounded-lg focus:border-brand-400 focus:outline-none" spellCheck={false} />
                      <p className="text-[10px] text-slate-400 mt-1">Markdown · ## títulos · **negrito** · *itálico* · [link](url) · - listas</p>
                    </div>
                  </div>
                </div>
              ))}
            </>
          )}

          {detail.kind === 'social_posts' && socials.length > 0 && (
            <>
              {detail.source_post && (
                <div className="text-xs text-slate-500">{t('mkt.for_post')} <span className="font-mono">{detail.source_post.slug}</span></div>
              )}
              {socials.map((sp, idx) => (
                <div key={sp.id} className="border border-slate-200 rounded-lg p-4 bg-slate-50">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                      {PLATFORM_EMOJI[sp.platform] || '•'} {sp.platform}
                    </span>
                    <span className="text-[10px] text-slate-400">{sp.variant} · {sp.lang}</span>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <label className="flex items-center justify-between text-xs font-semibold text-slate-700 mb-1">
                        <span>{t('mkt.field_content')}</span>
                        <span className="text-slate-400 font-normal">{sp.content.length} chars</span>
                      </label>
                      <textarea value={sp.content} onChange={(e) => updateSocial(idx, 'content', e.target.value)} rows={5}
                        className="w-full text-sm p-2 bg-white border border-slate-200 rounded-lg focus:border-brand-400 focus:outline-none" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">{t('mkt.field_hashtags')}</label>
                      <input type="text" value={sp.hashtags.join(', ')} onChange={(e) => updateSocial(idx, 'hashtags', e.target.value.split(',').map(h => h.trim()).filter(Boolean))}
                        placeholder="ia, automacao, pme"
                        className="w-full text-sm p-2 bg-white border border-slate-200 rounded-lg focus:border-brand-400 focus:outline-none" />
                      <p className="text-[10px] text-slate-400 mt-1">{t('mkt.hashtags_hint')}</p>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">{t('mkt.field_cta')}</label>
                      <input type="text" value={sp.cta || ''} onChange={(e) => updateSocial(idx, 'cta', e.target.value)}
                        className="w-full text-sm p-2 bg-white border border-slate-200 rounded-lg focus:border-brand-400 focus:outline-none" />
                    </div>
                  </div>
                </div>
              ))}
            </>
          )}

          {detail.kind === 'other' && (
            <pre className="text-xs text-slate-600 bg-slate-50 p-3 rounded overflow-x-auto">{JSON.stringify(detail.approval.params, null, 2)}</pre>
          )}
        </div>

        <div className="border-t border-slate-200 p-5 bg-slate-50 flex gap-2 flex-shrink-0">
          {!isEditMode && (
            <button onClick={() => onDecide(detail.approval.id, 'rejected')} disabled={busy || saving}
              className="flex-1 bg-white border-2 border-rose-200 hover:bg-rose-50 text-rose-700 text-sm font-semibold py-2.5 rounded-lg disabled:opacity-40">
              {t('mkt.modal_reject')}
            </button>
          )}
          <button onClick={() => handleSaveAndApprove(detail.approval.id)} 
            disabled={busy || saving || (detail.post?.requires_factcheck && !factcheckOK)}
            className="flex-1 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-sm font-semibold py-2.5 rounded-lg shadow">
            {saving ? t('mkt.modal_saving') : isEditMode ? t('mkt.modal_save_only') : t('mkt.modal_save_and_approve')}
          </button>
        </div>
      </div>
    </div>
  );
}
