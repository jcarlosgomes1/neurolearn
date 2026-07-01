'use client';

import { useState, useRef } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { createClient } from '@/lib/supabase/client';
import { useRouter, Link } from '@/i18n/routing';
import { toast } from 'sonner';
import { Upload, FileText, Trash2, Sparkles, Loader2, CheckCircle, Clock, AlertCircle, Building2 } from 'lucide-react';
import { SUPABASE_URL } from '@/lib/supabase/config';

const STATUS: Record<string, { labelKey: string; cls: string; icon: any }> = {
  pending: { labelKey: 'org.cc.st_pending', cls: 'bg-amber-50 text-amber-700 border-amber-200', icon: Clock },
  processing: { labelKey: 'org.cc.st_processing', cls: 'bg-blue-50 text-blue-700 border-blue-200', icon: Loader2 },
  completed: { labelKey: 'org.cc.st_completed', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: CheckCircle },
  failed: { labelKey: 'org.cc.st_failed', cls: 'bg-rose-50 text-rose-700 border-rose-200', icon: AlertCircle },
};
const PROP_STATUS: Record<string, { labelKey: string; cls: string }> = {
  pending: { labelKey: 'org.cc.ps_pending', cls: 'bg-brand-50 text-brand-700' },
  processing: { labelKey: 'org.cc.ps_processing', cls: 'bg-blue-50 text-blue-700' },
  approved: { labelKey: 'org.cc.ps_approved', cls: 'bg-emerald-50 text-emerald-700' },
  completed: { labelKey: 'org.cc.ps_completed', cls: 'bg-emerald-100 text-emerald-800' },
  failed: { labelKey: 'org.cc.ps_failed', cls: 'bg-rose-50 text-rose-700' },
  rejected: { labelKey: 'org.cc.ps_rejected', cls: 'bg-slate-100 text-slate-600' },
};

export function ConteudoClient({ orgs, activeOrgId, content, proposals }: {
  orgs: any[]; activeOrgId: string; content: any[]; proposals: any[];
}) {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const fileRef = useRef<HTMLInputElement>(null);

  function toggleOrg(orgId: string) {
    router.push({ pathname: '/empresa/conteudo', query: { org: orgId } } as any);
  }
  function toggleSel(id: string) {
    setSelected((prev) => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  }

  async function uploadFiles(files: FileList) {
    if (!files.length) return;
    setBusy(true);
    try {
      const sb = createClient();
      for (const file of Array.from(files)) {
        if (file.size > 104857600) {
          toast.error(t('org.cc.too_big', { name: file.name }));
          continue;
        }
        const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
        const path = `${activeOrgId}/${Date.now()}_${safeName}`;
        const { error: upErr } = await sb.storage.from('org-content').upload(path, file, {
          contentType: file.type || 'application/octet-stream', upsert: false,
        });
        if (upErr) throw upErr;
        const { data: contentId, error: regErr } = await sb.rpc('nl_org_content_register', {
          p_org_id: activeOrgId, p_storage_path: path, p_original_name: file.name,
          p_mime_type: file.type, p_file_size_bytes: file.size, p_source_type: 'upload',
        });
        if (regErr) throw regErr;
        try {
          const { data: { session } } = await sb.auth.getSession();
          fetch(`${SUPABASE_URL}/functions/v1/org-content-ingest`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token || ''}` },
            body: JSON.stringify({ content_id: contentId, org_id: activeOrgId }),
          }).catch(() => {});
        } catch {}
      }
      toast.success(t('org.cc.uploaded', { count: files.length }));
      router.refresh();
    } catch (e: any) {
      toast.error(e?.message || t('org.cc.upload_error'));
    } finally {
      setBusy(false);
    }
  }

  async function createProposal() {
    if (selected.size === 0) {
      toast.error(t('org.cc.select_min'));
      return;
    }
    setBusy(true);
    try {
      const sb = createClient();
      const { data: propId, error } = await sb.rpc('nl_org_proposal_create', {
        p_org_id: activeOrgId, p_content_ids: Array.from(selected),
        p_target_audience: 'Colaboradores', p_difficulty: 'beginner', p_source_lang: 'pt',
      });
      if (error) throw error;
      try {
        const { data: { session } } = await sb.auth.getSession();
        fetch(`${SUPABASE_URL}/functions/v1/propose-course-from-content`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token || ''}` },
          body: JSON.stringify({ proposal_id: propId, org_id: activeOrgId }),
        }).catch(() => {});
      } catch {}
      toast.success(t('org.cc.proposal_created'));
      setSelected(new Set());
      router.refresh();
    } catch (e: any) {
      toast.error(e?.message || t('tea.error'));
    } finally {
      setBusy(false);
    }
  }

  async function archive(id: string) {
    if (!confirm(t('org.cnt.archive_confirm'))) return;
    try {
      const sb = createClient();
      const { data } = await sb.rpc('nl_org_content_archive', { p_content_id: id });
      if (data?.storage_path) {
        await sb.storage.from('org-content').remove([data.storage_path]).catch(() => {});
      }
      toast.success(t('org.cnt.archived'));
      router.refresh();
    } catch (e: any) {
      toast.error(e?.message || t('tea.error'));
    }
  }

  return (
    <div className="space-y-6">
      {orgs.length > 1 && (
        <div className="flex items-center gap-2">
          <Building2 className="h-4 w-4 text-slate-400" />
          <select
            value={activeOrgId}
            onChange={(e) => toggleOrg(e.target.value)}
            className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm font-medium outline-none focus:border-emerald-500">
            {orgs.map((o) => <option key={o.org_id} value={o.org_id}>{o.name} ({o.role})</option>)}
          </select>
        </div>
      )}

      <div
        onClick={() => fileRef.current?.click()}
        className="relative bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 border-2 border-dashed border-emerald-200 rounded-2xl p-8 sm:p-10 text-center cursor-pointer hover:border-emerald-400 hover:from-emerald-100 transition-all group">
        <div className="inline-flex h-14 w-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white items-center justify-center shadow-lg mb-3 group-hover:scale-110 transition-transform">
          {busy ? <Loader2 className="h-7 w-7 animate-spin" /> : <Upload className="h-7 w-7" />}
        </div>
        <h3 className="font-bold text-slate-900 text-lg">{t('org.cc.drop_hint')}</h3>
        <p className="text-sm text-slate-600 mt-1">{t('org.cc.drop_formats')}</p>
        <input
          ref={fileRef} type="file" multiple
          accept=".pdf,.doc,.docx,.md,.txt"
          className="hidden"
          onChange={(e) => e.target.files && uploadFiles(e.target.files)}
        />
      </div>

      {selected.size > 0 && (
        <div className="bg-white border border-brand-200 rounded-xl p-3 flex items-center justify-between shadow-sm sticky top-4 z-10">
          <div className="text-sm">
            <span className="font-semibold text-brand-700">{t('org.cc.selected_count', { count: selected.size })}</span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setSelected(new Set())} className="text-xs text-slate-500 hover:text-slate-900 px-2">{t('org.cnt.clear')}</button>
            <button
              onClick={createProposal}
              disabled={busy}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-br from-brand-600 to-brand-600 hover:from-brand-700 hover:to-brand-700 text-white text-sm font-semibold rounded-lg shadow-sm disabled:opacity-50">
              <Sparkles className="h-3.5 w-3.5" />
              {busy ? t('org.cc.creating') : t('org.cc.propose_btn')}
            </button>
          </div>
        </div>
      )}

      <section>
        <h2 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
          <FileText className="h-4 w-4" /> {t('org.cc.docs_h', { count: content.length })}
        </h2>
        {content.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center text-sm text-slate-500">
            {t('org.cc.empty_docs')}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden divide-y divide-slate-100">
            {content.map((c) => {
              const st = STATUS[c.extraction_status] || STATUS.pending;
              const SIcon = st.icon;
              const isSel = selected.has(c.id);
              return (
                <div key={c.id} className={`p-3 flex items-center gap-3 group ${isSel ? 'bg-brand-50/50' : 'hover:bg-slate-50/60'}`}>
                  <input
                    type="checkbox"
                    checked={isSel}
                    onChange={() => toggleSel(c.id)}
                    disabled={c.extraction_status !== 'completed'}
                    className="h-4 w-4 rounded text-brand-600 disabled:opacity-30" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium text-slate-900 truncate">{c.original_name}</span>
                      <span className={`inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded font-semibold uppercase tracking-wider ${st.cls}`}>
                        <SIcon className={`h-2.5 w-2.5 ${c.extraction_status === 'processing' ? 'animate-spin' : ''}`} /> {t(st.labelKey)}
                      </span>
                    </div>
                    {c.summary && <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">{c.summary}</p>}
                    {c.detected_topics?.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {c.detected_topics.slice(0, 5).map((tt: string) => (
                          <span key={tt} className="text-[9px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">{tt}</span>
                        ))}
                      </div>
                    )}
                  </div>
                  <button onClick={() => archive(c.id)} className="p-1.5 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg opacity-0 group-hover:opacity-100">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {proposals.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-brand-500" /> {t('org.cc.props_h', { count: proposals.length })}
          </h2>
          <div className="grid sm:grid-cols-2 gap-3">
            {proposals.map((p) => {
              const ps = PROP_STATUS[p.status] || PROP_STATUS.pending;
              const proposal = p.proposal || {};
              return (
                <div key={p.id} className="bg-white rounded-2xl border border-slate-200 p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold uppercase tracking-wider ${ps.cls}`}>{t(ps.labelKey)}</span>
                    <span className="text-[10px] text-slate-400">{new Date(p.created_at).toLocaleDateString(locale)}</span>
                  </div>
                  <h3 className="font-bold text-slate-900 text-sm leading-snug">{proposal.title || t('org.cc.planning_title')}</h3>
                  {proposal.description && <p className="text-xs text-slate-500 mt-1.5 line-clamp-3 leading-relaxed">{proposal.description}</p>}
                  {proposal.modules?.length > 0 && (
                    <div className="mt-2 text-[10px] text-slate-400">{t('org.cc.mod_les', { mods: proposal.modules.length, lessons: (proposal.lessons_count || proposal.modules.reduce((a: number, m: any) => a + (m.lessons?.length || 0), 0)) })}</div>
                  )}
                  {p.generated_course_id && (
                    <Link href={`/curso/${p.generated_course_id}`} className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:text-emerald-900">
                      {t('org.cc.open_course')}
                    </Link>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
