'use client';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';

import { useEffect, useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import { Link } from '@/i18n/routing';
import { SUPABASE_URL } from '@/lib/supabase/config';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

interface Connection {
  id: string; provider: string; external_username: string | null; external_display_name: string | null;
  scope: string | null; expires_at: string | null; is_active: boolean; connected_at: string; last_used_at: string | null;
}
interface PublishLog {
  id: number; provider: string; external_post_url: string | null; status: string;
  error_message: string | null; created_at: string;
}
interface SocialPost {
  id: string; platform: string; variant: string | null; lang: string;
  content: string; hashtags: string[] | null; cta: string | null;
  status: string; created_at: string; image_url: string | null;
  scheduled_at: string | null;
}

const PROVIDER_META: Record<string, { label: string; emoji: string; color: string }> = {
  linkedin: { label: 'LinkedIn', emoji: '💼', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  twitter: { label: 'Twitter / X', emoji: '🐦', color: 'bg-slate-50 text-slate-700 border-slate-200' },
  facebook: { label: 'Facebook', emoji: '📘', color: 'bg-blue-50 text-blue-700 border-blue-200' },
};

const LOCALE_MAP: Record<string, string> = { pt: 'pt-PT', en: 'en-US', es: 'es-ES', fr: 'fr-FR' };

function toLocalDatetimeValue(iso: string): string {
  const d = new Date(iso);
  const off = d.getTimezoneOffset();
  return new Date(d.getTime() - off * 60_000).toISOString().slice(0, 16);
}

export function SocialView() {
  const t = useTranslations('social');
  const locale = useLocale();
  const intlLocale = LOCALE_MAP[locale] || 'pt-PT';
  const searchParams = useSearchParams();
  const supabase = createClient();
  const [connections, setConnections] = useState<Connection[]>([]);
  const [logs, setLogs] = useState<PublishLog[]>([]);
  const [pendingPosts, setPendingPosts] = useState<SocialPost[]>([]);
  const [linkedinConfigured, setLinkedinConfigured] = useState(false);
  const [twitterConfigured, setTwitterConfigured] = useState(false);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState<string | null>(null);
  const [publishing, setPublishing] = useState<string | null>(null);
  const [schedulingId, setSchedulingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<{ content: string; hashtags: string; cta: string }>({ content: '', hashtags: '', cta: '' });
  const [scheduleInputs, setScheduleInputs] = useState<Record<string, string>>({});
  const [savingSchedule, setSavingSchedule] = useState<string | null>(null);
  const [savingEdit, setSavingEdit] = useState<string | null>(null);

  useEffect(() => {
    const connected = searchParams.get('connected');
    const error = searchParams.get('error');
    if (connected) toast.success(t('toast_connected', { p: connected }));
    if (error) toast.error(t('toast_oauth_err', { err: error }));
  }, [searchParams, t]);

  async function callApi(endpoint: string, body: Record<string, unknown>) {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error(t('err_no_session'));
    const res = await fetch(`${SUPABASE_URL}/functions/v1/${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
      body: JSON.stringify(body),
    });
    return res.json();
  }

  async function load() {
    try {
      const data = await callApi('social-oauth', { action: 'list' });
      if (!data.ok) throw new Error(data.error);
      setConnections(data.connections || []);
      setLinkedinConfigured(data.linkedin_configured);
      setTwitterConfigured(data.twitter_configured);

      const [logsRes, postsRes] = await Promise.all([
        supabase.from('nl_social_publish_logs')
          .select('id, provider, external_post_url, status, error_message, created_at')
          .order('created_at', { ascending: false }).limit(20),
        supabase.from('nl_social_posts')
          .select('id, platform, variant, lang, content, hashtags, cta, status, created_at, image_url, scheduled_at')
          .in('status', ['approved', 'draft', 'pending', 'pending_review', 'publishing'])
          .order('created_at', { ascending: false }).limit(30),
      ]);
      setLogs((logsRes.data as PublishLog[]) || []);
      setPendingPosts((postsRes.data as SocialPost[]) || []);
    } catch (e) { toast.error(e instanceof Error ? e.message : String(e)); }
    finally { setLoading(false); }
  }
  useEffect(() => { load(); }, []);

  async function connect(provider: string) {
    setConnecting(provider);
    try {
      const data = await callApi('social-oauth', { action: 'start', provider });
      if (!data.ok) {
        if (data.error?.includes('_not_configured')) {
          toast.error(t('toast_not_configured', { label: PROVIDER_META[provider]?.label || provider, pUpper: provider.toUpperCase() }));
        } else { toast.error(data.error); }
        setConnecting(null); return;
      }
      window.location.href = data.auth_url;
    } catch (e) { toast.error(e instanceof Error ? e.message : String(e)); setConnecting(null); }
  }

  async function disconnect(id: string) {
    if (!confirm(t('confirm_disconnect'))) return;
    try {
      await callApi('social-oauth', { action: 'disconnect', connection_id: id });
      toast.success(t('toast_disconnected'));
      load();
    } catch (e) { toast.error(e instanceof Error ? e.message : String(e)); }
  }

  async function publishPost(postId: string) {
    setPublishing(postId);
    try {
      const data = await callApi('social-publish', { social_post_id: postId });
      if (!data.ok) {
        if (data.error === 'no_active_connection') { toast.error(t('err_no_connection', { p: data.provider })); }
        else if (data.error === 'already_published') { toast.error(t('err_already_published')); }
        else { toast.error(data.detail || data.error); }
        return;
      }
      toast.success(t('toast_published'));
      window.open(data.external_url, '_blank');
      load();
    } catch (e) { toast.error(e instanceof Error ? e.message : String(e)); }
    finally { setPublishing(null); }
  }

  async function schedulePost(postId: string) {
    const localValue = scheduleInputs[postId];
    if (!localValue) { toast.error(t('sched.err_no_date')); return; }
    const iso = new Date(localValue).toISOString();
    if (new Date(iso) <= new Date()) { toast.error(t('sched.err_past')); return; }
    setSavingSchedule(postId);
    const { error } = await supabase.from('nl_social_posts').update({ scheduled_at: iso, status: 'approved' }).eq('id', postId);
    if (error) toast.error(error.message);
    else {
      toast.success(t('sched.toast_scheduled'));
      setSchedulingId(null);
      setPendingPosts((prev) => prev.map((p) => p.id === postId ? { ...p, scheduled_at: iso, status: 'approved' } : p));
    }
    setSavingSchedule(null);
  }

  async function unschedulePost(postId: string) {
    setSavingSchedule(postId);
    const { error } = await supabase.from('nl_social_posts').update({ scheduled_at: null }).eq('id', postId);
    if (error) toast.error(error.message);
    else {
      toast.success(t('sched.toast_unscheduled'));
      setPendingPosts((prev) => prev.map((p) => p.id === postId ? { ...p, scheduled_at: null } : p));
    }
    setSavingSchedule(null);
  }

  function startEdit(post: SocialPost) {
    setEditingId(post.id);
    setEditDraft({
      content: post.content,
      hashtags: (post.hashtags || []).join(', '),
      cta: post.cta || '',
    });
  }

  async function saveEdit(postId: string) {
    setSavingEdit(postId);
    const hashtags = editDraft.hashtags.split(',').map(h => h.trim()).filter(Boolean);
    const { error } = await supabase.from('nl_social_posts').update({
      content: editDraft.content,
      hashtags,
      cta: editDraft.cta || null,
    }).eq('id', postId);
    if (error) toast.error(error.message);
    else {
      toast.success(t('edit.toast_saved'));
      setPendingPosts((prev) => prev.map((p) => p.id === postId ? { ...p, content: editDraft.content, hashtags, cta: editDraft.cta || null } : p));
      setEditingId(null);
    }
    setSavingEdit(null);
  }

  async function approvePost(postId: string) {
    const { error } = await supabase.from('nl_social_posts').update({ status: 'approved' }).eq('id', postId);
    if (error) toast.error(error.message);
    else {
      toast.success(t('edit.toast_approved'));
      setPendingPosts((prev) => prev.map((p) => p.id === postId ? { ...p, status: 'approved' } : p));
    }
  }

  async function rejectPost(postId: string) {
    if (!confirm(t('edit.confirm_reject'))) return;
    const { error } = await supabase.from('nl_social_posts').update({ status: 'rejected' }).eq('id', postId);
    if (error) toast.error(error.message);
    else {
      toast.success(t('edit.toast_rejected'));
      setPendingPosts((prev) => prev.filter((p) => p.id !== postId));
    }
  }

  const activeConnections = connections.filter(c => c.is_active);
  const activeByProvider = activeConnections.reduce((acc, c) => { acc[c.provider] = c; return acc; }, {} as Record<string, Connection>);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <AdminPageHeader
        emoji="📣"
        title={t('title')}
        description={t('subtitle')}
      />

      {loading ? (
        <div className="mt-8 text-center text-slate-400 py-10">{t('loading')}</div>
      ) : (
        <>
          <section className="mt-6 grid sm:grid-cols-2 gap-4">
            {(['linkedin', 'twitter'] as const).map(provider => {
              const meta = PROVIDER_META[provider];
              const configured = provider === 'linkedin' ? linkedinConfigured : twitterConfigured;
              const conn = activeByProvider[provider];
              return (
                <div key={provider} className={`rounded-xl border p-5 ${conn ? 'bg-emerald-50 border-emerald-200' : configured ? 'bg-white border-slate-200' : 'bg-amber-50 border-amber-200'}`}>
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-3xl">{meta.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-slate-900">{meta.label}</div>
                      <div className="text-xs text-slate-500">
                        {conn ? `✓ ${conn.external_display_name || conn.external_username || t('connected_default')}` 
                          : configured ? t('no_account')
                          : t('secrets_missing', { pUpper: provider.toUpperCase() })}
                      </div>
                    </div>
                  </div>
                  {conn ? (
                    <div className="space-y-2 text-xs">
                      <div className="text-slate-600">{t('connected_at', { date: new Date(conn.connected_at).toLocaleDateString(intlLocale) })}</div>
                      {conn.last_used_at && <div className="text-slate-600">{t('last_published', { date: new Date(conn.last_used_at).toLocaleString(intlLocale) })}</div>}
                      <button onClick={() => disconnect(conn.id)} className="mt-2 text-xs bg-white border border-rose-200 hover:bg-rose-50 text-rose-700 font-medium px-3 py-1.5 rounded-md">
                        {t('disconnect')}
                      </button>
                    </div>
                  ) : configured ? (
                    <button onClick={() => connect(provider)} disabled={connecting === provider}
                      className="mt-2 text-sm bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white font-medium px-4 py-2 rounded-md">
                      {connecting === provider ? t('opening') : t('connect_btn', { label: meta.label })}
                    </button>
                  ) : (
                    <div className="mt-2 text-xs text-amber-800">
                      {t('create_app_at', { site: provider === 'linkedin' ? 'linkedin.com/developers' : 'developer.twitter.com', pUpper: provider.toUpperCase() })}
                    </div>
                  )}
                </div>
              );
            })}
          </section>

          {pendingPosts.length > 0 && (
            <section className="mt-8">
              <h2 className="text-lg font-bold text-slate-900 mb-3">{t('pending_section')} <span className="text-sm font-normal text-slate-500">({pendingPosts.length})</span></h2>
              <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100">
                {pendingPosts.map(post => {
                  const platMeta = PROVIDER_META[post.platform] || { label: post.platform, emoji: '📣', color: '' };
                  const hasConn = !!activeByProvider[post.platform];
                  const isPublishing = publishing === post.id;
                  const isScheduling = schedulingId === post.id;
                  const isEditing = editingId === post.id;
                  const isSaving = savingSchedule === post.id || savingEdit === post.id;
                  const isScheduled = !!post.scheduled_at;
                  return (
                    <div key={post.id} className="p-4">
                      <div className="flex items-start gap-3">
                        <span className="text-2xl flex-shrink-0">{platMeta.emoji}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <span className="text-sm font-semibold text-slate-900">{platMeta.label}</span>
                            <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded-full">{post.status}</span>
                            {post.variant && <span className="text-[10px] text-slate-400">{post.variant}</span>}
                            <span className="text-[10px] text-slate-400">{post.lang}</span>
                            {isScheduled && (
                              <span className="text-[10px] font-semibold bg-violet-100 text-violet-700 px-1.5 py-0.5 rounded-full">
                                📅 {new Date(post.scheduled_at!).toLocaleString(intlLocale)}
                              </span>
                            )}
                          </div>

                          {isEditing ? (
                            <div className="mt-2 space-y-2 bg-slate-50 p-3 rounded-lg">
                              <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1">{t('edit.content')} <span className="text-slate-400 font-normal">({editDraft.content.length} chars)</span></label>
                                <textarea value={editDraft.content} onChange={(e) => setEditDraft({ ...editDraft, content: e.target.value })} rows={5}
                                  className="w-full text-sm p-2 bg-white border border-slate-200 rounded focus:border-brand-400 focus:outline-none" />
                              </div>
                              <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1">{t('edit.hashtags')}</label>
                                <input type="text" value={editDraft.hashtags} onChange={(e) => setEditDraft({ ...editDraft, hashtags: e.target.value })}
                                  placeholder="ia, automacao, pme"
                                  className="w-full text-sm p-2 bg-white border border-slate-200 rounded focus:border-brand-400 focus:outline-none" />
                                <p className="text-[10px] text-slate-400 mt-0.5">{t('edit.hashtags_hint')}</p>
                              </div>
                              <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1">{t('edit.cta')}</label>
                                <input type="text" value={editDraft.cta} onChange={(e) => setEditDraft({ ...editDraft, cta: e.target.value })}
                                  className="w-full text-sm p-2 bg-white border border-slate-200 rounded focus:border-brand-400 focus:outline-none" />
                              </div>
                              <div className="flex gap-2 pt-1">
                                <button onClick={() => saveEdit(post.id)} disabled={isSaving}
                                  className="text-xs bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white font-medium px-3 py-2 rounded-md">
                                  {isSaving ? t('edit.saving') : t('edit.save')}
                                </button>
                                <button onClick={() => setEditingId(null)}
                                  className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium px-3 py-2 rounded-md">
                                  {t('edit.cancel')}
                                </button>
                              </div>
                            </div>
                          ) : (
                            <>
                              <p className="text-sm text-slate-700 whitespace-pre-wrap line-clamp-4">{post.content}</p>
                              {post.hashtags && post.hashtags.length > 0 && (
                                <div className="mt-1.5 flex flex-wrap gap-1">
                                  {post.hashtags.slice(0, 6).map(tag => (
                                    <span key={tag} className="text-[10px] bg-brand-50 text-brand-700 px-1.5 py-0.5 rounded">#{tag.replace('#', '')}</span>
                                  ))}
                                </div>
                              )}
                              {post.cta && <div className="text-xs text-purple-700 mt-1.5 italic">{t('cta_label', { cta: post.cta })}</div>}
                            </>
                          )}

                          {isScheduling && (
                            <div className="mt-3 p-3 bg-slate-50 rounded-lg flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
                              <input type="datetime-local"
                                value={scheduleInputs[post.id] || (post.scheduled_at ? toLocalDatetimeValue(post.scheduled_at) : '')}
                                onChange={(e) => setScheduleInputs((s) => ({ ...s, [post.id]: e.target.value }))}
                                className="input text-sm flex-1" />
                              <div className="flex gap-2">
                                <button onClick={() => schedulePost(post.id)} disabled={isSaving}
                                  className="text-xs bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white font-medium px-3 py-2 rounded-md">
                                  {isSaving ? t('sched.saving') : t('sched.save')}
                                </button>
                                <button onClick={() => setSchedulingId(null)}
                                  className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium px-3 py-2 rounded-md">
                                  {t('sched.cancel')}
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                        {!isEditing && (
                          <div className="flex flex-col gap-1.5 flex-shrink-0">
                            <button onClick={() => startEdit(post)} disabled={isSaving}
                              className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium px-3 py-2 rounded-md whitespace-nowrap">
                              ✎ {t('edit.btn_edit')}
                            </button>
                            {post.status === 'pending_review' && (
                              <button onClick={() => approvePost(post.id)} disabled={isSaving}
                                className="text-xs bg-amber-100 hover:bg-amber-200 text-amber-700 font-medium px-3 py-2 rounded-md whitespace-nowrap">
                                ✓ {t('edit.btn_approve')}
                              </button>
                            )}
                            <button onClick={() => publishPost(post.id)} disabled={!hasConn || isPublishing || post.status === 'published'}
                              className="text-xs bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-medium px-3 py-2 rounded-md whitespace-nowrap">
                              {isPublishing ? t('publishing') : !hasConn ? t('no_link') : t('publish_now')}
                            </button>
                            {!isScheduled ? (
                              <button onClick={() => setSchedulingId(isScheduling ? null : post.id)} disabled={!hasConn}
                                className="text-xs bg-violet-100 hover:bg-violet-200 text-violet-700 font-medium px-3 py-2 rounded-md whitespace-nowrap disabled:opacity-40">
                                📅 {t('sched.schedule')}
                              </button>
                            ) : (
                              <button onClick={() => unschedulePost(post.id)} disabled={isSaving}
                                className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium px-3 py-2 rounded-md whitespace-nowrap disabled:opacity-50">
                                {t('sched.unschedule')}
                              </button>
                            )}
                            <button onClick={() => rejectPost(post.id)} disabled={isSaving}
                              className="text-xs bg-white border border-rose-200 hover:bg-rose-50 text-rose-700 font-medium px-3 py-2 rounded-md whitespace-nowrap">
                              {t('edit.btn_reject')}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          <section className="mt-8 bg-blue-50 border border-blue-200 rounded-xl p-5">
            <h3 className="font-bold text-slate-900 mb-3">{t('setup_title')}</h3>
            <div className="space-y-3 text-sm text-slate-700">
              <details className="bg-white rounded-lg p-3">
                <summary className="cursor-pointer font-semibold">💼 LinkedIn</summary>
                <ol className="mt-3 space-y-1.5 text-xs">
                  <li>1. {t('linkedin_step1')}</li>
                  <li>2. {t('linkedin_step2')}</li>
                  <li>3. {t('linkedin_step3')}<br/><code className="text-[10px] bg-slate-100 px-1 rounded break-all">{SUPABASE_URL}/functions/v1/social-oauth?action=callback</code></li>
                  <li>4. {t('linkedin_step4')}</li>
                  <li>5. {t('linkedin_step5')}</li>
                  <li>6. {t('linkedin_step6')}</li>
                </ol>
              </details>
              <details className="bg-white rounded-lg p-3">
                <summary className="cursor-pointer font-semibold">🐦 Twitter / X</summary>
                <ol className="mt-3 space-y-1.5 text-xs">
                  <li>1. {t('twitter_step1')}</li>
                  <li>2. {t('twitter_step2')}</li>
                  <li>3. {t('twitter_step3')}</li>
                  <li>4. {t('twitter_step4')} <code className="text-[10px] bg-slate-100 px-1 rounded break-all">{SUPABASE_URL}/functions/v1/social-oauth?action=callback</code></li>
                  <li>5. {t('twitter_step5')}</li>
                </ol>
              </details>
            </div>
          </section>

          {logs.length > 0 && (
            <section className="mt-8">
              <h2 className="text-lg font-bold text-slate-900 mb-3">{t('history_title')}</h2>
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden divide-y divide-slate-100">
                {logs.map(log => {
                  const meta = PROVIDER_META[log.provider] || { label: log.provider, emoji: '📣', color: '' };
                  return (
                    <div key={log.id} className="p-3 flex items-center gap-3">
                      <span className="text-xl flex-shrink-0">{meta.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${log.status === 'published' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                            {log.status}
                          </span>
                          <span className="text-sm font-medium text-slate-900">{meta.label}</span>
                          <span className="text-xs text-slate-400">{new Date(log.created_at).toLocaleString(intlLocale)}</span>
                        </div>
                        {log.error_message && <div className="text-xs text-rose-600 mt-1 truncate">{log.error_message}</div>}
                      </div>
                      {log.external_post_url && (
                        <a href={log.external_post_url} target="_blank" rel="noopener" className="text-xs bg-slate-50 hover:bg-slate-100 text-slate-700 px-3 py-1.5 rounded-md font-medium whitespace-nowrap">
                          {t('view_post')}
                        </a>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
