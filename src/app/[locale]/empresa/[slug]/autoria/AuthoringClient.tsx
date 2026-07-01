'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { Loader2, PenLine, UserPlus, CheckCircle2, Send, Sparkles, Award, Globe, Check, X } from 'lucide-react';

type Item = { id: string; title: string; brief: string | null; status: string; course_id: string | null; assignee_id?: string; assignee_name?: string | null; org_id?: string; org_name?: string | null; created_at: string; marketplace_status?: string };
type Member = { user_id: string; name: string | null; role: string };

const STATUS: Record<string, { label: string; cls: string }> = {
  assigned: { label: 'Atribuído', cls: 'bg-slate-100 text-slate-600' },
  in_progress: { label: 'Em curso', cls: 'bg-amber-100 text-amber-700' },
  submitted: { label: 'Submetido', cls: 'bg-blue-100 text-blue-700' },
  published: { label: 'Publicado', cls: 'bg-emerald-100 text-emerald-700' },
};

export function AuthoringClient({ orgId, orgSlug, isAdmin }: { orgId: string; orgSlug: string; isAdmin: boolean }) {
  const t = useTranslations();
  const [mine, setMine] = useState<Item[]>([]);
  const [orgItems, setOrgItems] = useState<Item[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [isPlatAdmin, setIsPlatAdmin] = useState(false);
  const [bridgeEnabled, setBridgeEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [brief, setBrief] = useState('');
  const [assignee, setAssignee] = useState('');

  function safeT(key: string, fb: string): string {
    try { const v = t(key as never); if (v && typeof v === 'string' && v !== key) return v; } catch { /* */ }
    return fb;
  }

  const load = useCallback(async () => {
    const sb = createClient();
    try {
      const { data: m } = await sb.rpc('nl_academy_authoring_mine');
      setMine(((m as { items?: Item[] })?.items) || []);
      if (isAdmin) {
        const { data: o } = await sb.rpc('nl_academy_authoring_for_org', { p_org_id: orgId });
        const r = o as { items?: Item[]; members?: Member[]; is_platform_admin?: boolean; marketplace_bridge_enabled?: boolean };
        setOrgItems(r?.items || []); setMembers(r?.members || []); setIsPlatAdmin(!!r?.is_platform_admin); setBridgeEnabled(!!r?.marketplace_bridge_enabled);
      }
    } catch { /* */ } finally { setLoading(false); }
  }, [orgId, isAdmin]);
  useEffect(() => { load(); }, [load]);

  async function convene() {
    if (!title.trim() || !assignee) { toast.error(safeT('academy.authoring.need_fields', 'Indica título e especialista.')); return; }
    setBusy('create');
    try {
      const sb = createClient();
      const { error } = await sb.rpc('nl_academy_authoring_create', { p_org_id: orgId, p_title: title.trim(), p_brief: brief.trim() || null, p_assignee_id: assignee, p_skill_id: null });
      if (error) throw error;
      toast.success(safeT('academy.authoring.convened', 'Especialista convocado.'));
      setTitle(''); setBrief(''); setAssignee(''); load();
    } catch (e) { toast.error(e instanceof Error ? e.message : 'Erro'); } finally { setBusy(null); }
  }

  async function update(id: string, course_id: string | null, status: string | null) {
    setBusy(id);
    try {
      const sb = createClient();
      const { error } = await sb.rpc('nl_academy_authoring_update', { p_id: id, p_course_id: course_id, p_status: status });
      if (error) throw error;
      load();
    } catch (e) { toast.error(e instanceof Error ? e.message : 'Erro'); } finally { setBusy(null); }
  }

  async function approve(id: string) {
    setBusy(id);
    try {
      const sb = createClient();
      const { error } = await sb.rpc('nl_academy_authoring_approve', { p_id: id });
      if (error) throw error;
      toast.success(safeT('academy.authoring.approved', 'Autoria reconhecida e publicada.'));
      load();
    } catch (e) { toast.error(e instanceof Error ? e.message : 'Erro'); } finally { setBusy(null); }
  }

  async function proposeMarket(id: string) {
    setBusy(id);
    try {
      const sb = createClient();
      const { error } = await sb.rpc('nl_academy_submit_to_marketplace', { p_id: id });
      if (error) throw error;
      toast.success(safeT('academy.authoring.mkt_proposed', 'Proposta enviada para revisão da plataforma.'));
      load();
    } catch (e) { toast.error(e instanceof Error ? e.message : 'Erro'); } finally { setBusy(null); }
  }

  async function decideMarket(id: string, approve: boolean) {
    setBusy(id);
    try {
      const sb = createClient();
      const { error } = await sb.rpc('nl_academy_marketplace_decide', { p_id: id, p_approve: approve, p_reason: null });
      if (error) throw error;
      toast.success(approve ? safeT('academy.authoring.mkt_approved', 'Curso publicado no marketplace.') : safeT('academy.authoring.mkt_rejected', 'Proposta rejeitada.'));
      load();
    } catch (e) { toast.error(e instanceof Error ? e.message : 'Erro'); } finally { setBusy(null); }
  }

  if (loading) return <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-slate-400" /></div>;

  return (
    <div className="space-y-8">
      {isAdmin && (
        <section className="rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="font-semibold text-slate-800 flex items-center gap-2 mb-3"><UserPlus className="h-4 w-4 text-brand-500" />{safeT('academy.authoring.convene_title', 'Convocar especialista')}</h2>
          <div className="space-y-2.5">
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder={safeT('academy.authoring.title_ph', 'Tema do curso (ex.: Onboarding de Vendas)')} className="w-full text-sm rounded-lg border border-slate-200 px-3 py-2" />
            <textarea value={brief} onChange={(e) => setBrief(e.target.value)} placeholder={safeT('academy.authoring.brief_ph', 'Briefing: objetivos, público, pontos a cobrir…')} rows={3} className="w-full text-sm rounded-lg border border-slate-200 px-3 py-2" />
            <select value={assignee} onChange={(e) => setAssignee(e.target.value)} className="w-full text-sm rounded-lg border border-slate-200 px-3 py-2 bg-white">
              <option value="">{safeT('academy.authoring.pick_member', 'Escolher especialista…')}</option>
              {members.map((m) => <option key={m.user_id} value={m.user_id}>{m.name || m.user_id} · {m.role}</option>)}
            </select>
            <button onClick={convene} disabled={busy === 'create'} className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 text-white text-sm font-medium px-4 py-2 hover:bg-brand-700 disabled:opacity-50">
              {busy === 'create' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}{safeT('academy.authoring.convene_btn', 'Convocar')}
            </button>
          </div>

          {orgItems.length > 0 && (
            <div className="mt-5 space-y-2.5">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">{safeT('academy.authoring.org_list', 'Autorias da organização')}</h3>
              {orgItems.map((it) => (
                <div key={it.id} className="flex items-center gap-3 rounded-xl border border-slate-200 p-3">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm text-slate-800 truncate">{it.title}</div>
                    <div className="text-xs text-slate-400">{it.assignee_name || '—'}</div>
                  </div>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${STATUS[it.status]?.cls || 'bg-slate-100 text-slate-600'}`}>{STATUS[it.status]?.label || it.status}</span>
                  {it.status === 'submitted' && (
                    <button onClick={() => approve(it.id)} disabled={busy === it.id} className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 text-white text-xs font-medium px-2.5 py-1.5 hover:bg-emerald-700 disabled:opacity-50">
                      {busy === it.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Award className="h-3 w-3" />}{safeT('academy.authoring.approve_btn', 'Reconhecer')}
                    </button>
                  )}
                  {bridgeEnabled && it.status === 'published' && (it.marketplace_status || 'internal') === 'internal' && (
                    <button onClick={() => proposeMarket(it.id)} disabled={busy === it.id} className="inline-flex items-center gap-1 rounded-lg bg-brand-50 text-brand-700 text-xs font-medium px-2.5 py-1.5 hover:bg-brand-100 disabled:opacity-50">
                      {busy === it.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Globe className="h-3 w-3" />}{safeT('academy.authoring.mkt_propose', 'Propor ao marketplace')}
                    </button>
                  )}
                  {bridgeEnabled && it.marketplace_status === 'submitted' && !isPlatAdmin && (
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">{safeT('academy.authoring.mkt_submitted', 'Em revisão')}</span>
                  )}
                  {bridgeEnabled && it.marketplace_status === 'submitted' && isPlatAdmin && (
                    <span className="inline-flex items-center gap-1">
                      <button onClick={() => decideMarket(it.id, true)} disabled={busy === it.id} className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 text-white text-xs font-medium px-2 py-1.5 hover:bg-emerald-700 disabled:opacity-50"><Check className="h-3 w-3" />{safeT('academy.authoring.mkt_approve', 'Aprovar')}</button>
                      <button onClick={() => decideMarket(it.id, false)} disabled={busy === it.id} className="inline-flex items-center gap-1 rounded-lg bg-slate-100 text-slate-600 text-xs font-medium px-2 py-1.5 hover:bg-slate-200 disabled:opacity-50"><X className="h-3 w-3" />{safeT('academy.authoring.mkt_reject', 'Rejeitar')}</button>
                    </span>
                  )}
                  {bridgeEnabled && it.marketplace_status === 'published' && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700"><Globe className="h-3 w-3" />{safeT('academy.authoring.mkt_published', 'No marketplace')}</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      <section>
        <h2 className="font-semibold text-slate-800 flex items-center gap-2 mb-3"><PenLine className="h-4 w-4 text-brand-500" />{safeT('academy.authoring.mine_title', 'As minhas autorias')}</h2>
        {mine.length === 0 ? (
          <p className="text-sm text-slate-500">{safeT('academy.authoring.mine_empty', 'Ainda não foste convocado para autoria.')}</p>
        ) : (
          <div className="space-y-3">
            {mine.map((it) => (
              <div key={it.id} className="rounded-2xl border border-slate-200 bg-white p-4">
                <div className="flex items-center justify-between gap-2">
                  <div className="font-semibold text-slate-800">{it.title}</div>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${STATUS[it.status]?.cls || 'bg-slate-100 text-slate-600'}`}>{STATUS[it.status]?.label || it.status}</span>
                </div>
                {it.brief && <p className="text-xs text-slate-500 mt-1 whitespace-pre-line">{it.brief}</p>}
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <Link href={'/teach/curso/novo' as never} className="inline-flex items-center gap-1 rounded-lg bg-brand-50 text-brand-700 text-xs font-medium px-2.5 py-1.5 hover:bg-brand-100">
                    <Sparkles className="h-3.5 w-3.5" />{safeT('academy.authoring.assist', 'Criar com assistência')}
                  </Link>
                  {it.status !== 'published' && (
                    <>
                      <input defaultValue={it.course_id || ''} onBlur={(e) => { if (e.target.value && e.target.value !== it.course_id) update(it.id, e.target.value, 'in_progress'); }}
                        placeholder={safeT('academy.authoring.link_course', 'ID do curso criado')} className="text-xs rounded-lg border border-slate-200 px-2 py-1.5 flex-1 min-w-[140px]" />
                      {it.course_id && it.status !== 'submitted' && (
                        <button onClick={() => update(it.id, null, 'submitted')} disabled={busy === it.id} className="inline-flex items-center gap-1 rounded-lg bg-blue-600 text-white text-xs font-medium px-2.5 py-1.5 hover:bg-blue-700 disabled:opacity-50">
                          {busy === it.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />}{safeT('academy.authoring.submit', 'Submeter')}
                        </button>
                      )}
                    </>
                  )}
                  {it.status === 'published' && <span className="inline-flex items-center gap-1 text-xs text-emerald-600 font-medium"><CheckCircle2 className="h-3.5 w-3.5" />{safeT('academy.authoring.recognized', 'Reconhecido')}</span>}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
