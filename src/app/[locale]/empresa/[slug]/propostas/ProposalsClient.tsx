'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter, Link } from '@/i18n/routing';
import { toast } from 'sonner';
import { CheckCircle, XCircle, Clock, Loader2, Sparkles, Eye, BookOpen, AlertCircle, ChevronRight, FileText } from 'lucide-react';

interface Proposal {
  id: string;
  org_id: string;
  requested_by: string;
  content_ids: string[];
  target_audience: string | null;
  difficulty: string;
  source_lang: string;
  status: string;
  proposal: any | null;
  error_message: string | null;
  generated_course_id: string | null;
  created_at: string;
}

const STATUS_META: Record<string, { label: string; icon: any; cls: string; ring: string }> = {
  pending:    { label: 'Pendente',       icon: Clock,       cls: 'bg-amber-50 text-amber-700 border-amber-200',    ring: 'ring-amber-200' },
  processing: { label: 'A gerar',        icon: Loader2,     cls: 'bg-blue-50 text-blue-700 border-blue-200',       ring: 'ring-blue-200' },
  ready:      { label: 'Pronta',         icon: Sparkles,    cls: 'bg-violet-50 text-violet-700 border-violet-200', ring: 'ring-violet-300' },
  approved:   { label: 'Aprovada',       icon: CheckCircle, cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', ring: 'ring-emerald-200' },
  rejected:   { label: 'Rejeitada',      icon: XCircle,     cls: 'bg-slate-50 text-slate-500 border-slate-200',    ring: 'ring-slate-200' },
  failed:     { label: 'Falhou',         icon: XCircle,     cls: 'bg-rose-50 text-rose-700 border-rose-200',       ring: 'ring-rose-200' },
};

export function ProposalsClient({ orgId, orgSlug, isOrgAdmin, proposals: initialProposals }: {
  orgId: string; orgSlug: string; isOrgAdmin: boolean; proposals: Proposal[];
}) {
  const router = useRouter();
  const [proposals, setProposals] = useState<Proposal[]>(initialProposals);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function refresh() {
    const sb = createClient();
    const { data } = await sb.rpc('nl_org_proposals_list', { p_org_id: orgId });
    setProposals(Array.isArray(data) ? data : []);
    router.refresh();
  }

  async function approve(id: string) {
    if (!confirm('Aprovar esta proposta? Vai criar o curso e ficará disponível para a equipa.')) return;
    setBusy(true);
    try {
      const sb = createClient();
      const { error } = await sb.rpc('nl_org_proposal_approve', { p_proposal_id: id });
      if (error) throw error;
      toast.success('Proposta aprovada · curso criado');
      await refresh();
    } catch (e: any) { toast.error(e?.message || 'Erro'); }
    finally { setBusy(false); }
  }

  async function reject(id: string) {
    const reason = prompt('Razão da rejeição (opcional):');
    if (reason === null) return;
    setBusy(true);
    try {
      const sb = createClient();
      const { error } = await sb.rpc('nl_org_proposal_reject', { p_proposal_id: id, p_reason: reason || null });
      if (error) throw error;
      toast.success('Proposta rejeitada');
      await refresh();
    } catch (e: any) { toast.error(e?.message || 'Erro'); }
    finally { setBusy(false); }
  }

  if (proposals.length === 0) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center">
        <Sparkles className="h-10 w-10 text-violet-300 mx-auto mb-2" />
        <p className="text-sm text-slate-600 font-medium">Sem propostas ainda.</p>
        <p className="text-xs text-slate-500 mt-1 mb-4">Vai a Documentos, selecciona conteúdos e gera a primeira proposta.</p>
        <Link href={{ pathname: '/empresa/[slug]/conteudo', params: { slug: orgSlug } } as any}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-br from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white text-sm font-semibold rounded-lg shadow-sm">
          <FileText className="h-4 w-4" /> Ir para Documentos
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {proposals.map((p) => {
        const meta = STATUS_META[p.status] || STATUS_META.pending;
        const Icon = meta.icon;
        const isExpanded = expanded === p.id;
        const courseTitle: string = p.proposal?.title || p.proposal?.name || `Proposta de ${new Date(p.created_at).toLocaleDateString('pt-PT')}`;
        const courseSummary: string = p.proposal?.summary || p.proposal?.description || '';
        const modules: any[] = Array.isArray(p.proposal?.modules) ? p.proposal.modules : [];

        return (
          <div key={p.id} className={`bg-white rounded-2xl border-2 overflow-hidden transition-all ${isExpanded ? `${meta.ring} ring-2` : 'border-slate-200'}`}>
            <button onClick={() => setExpanded(isExpanded ? null : p.id)}
              className="w-full p-4 flex items-center gap-3 text-left hover:bg-slate-50/40">
              <div className={`h-11 w-11 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm ${meta.cls}`}>
                <Icon className={`h-5 w-5 ${p.status === 'processing' ? 'animate-spin' : ''}`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-sm text-slate-900 truncate">{courseTitle}</span>
                  <span className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full border font-bold uppercase tracking-wider ${meta.cls}`}>
                    {meta.label}
                  </span>
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  {p.content_ids?.length || 0} documento(s) · {p.difficulty} · {p.source_lang.toUpperCase()} · {new Date(p.created_at).toLocaleDateString('pt-PT')}
                </div>
              </div>
              <ChevronRight className={`h-4 w-4 text-slate-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
            </button>

            {isExpanded && (
              <div className="px-4 pb-4 border-t border-slate-100 pt-3 space-y-3">
                {courseSummary && (
                  <p className="text-sm text-slate-600 leading-relaxed">{courseSummary}</p>
                )}

                {modules.length > 0 && (
                  <div>
                    <div className="text-[10px] uppercase font-bold text-slate-500 mb-2">Módulos propostos ({modules.length})</div>
                    <div className="space-y-1.5">
                      {modules.map((m: any, i: number) => (
                        <div key={i} className="flex items-start gap-2 text-xs">
                          <div className="h-5 w-5 rounded bg-violet-100 text-violet-700 flex items-center justify-center font-bold text-[10px] flex-shrink-0">
                            {i + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold text-slate-800">{m.title || m.name || `Módulo ${i + 1}`}</div>
                            {Array.isArray(m.lessons) && m.lessons.length > 0 && (
                              <div className="text-[10px] text-slate-500 mt-0.5">{m.lessons.length} aulas</div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {p.error_message && (
                  <div className="bg-rose-50 border border-rose-200 rounded p-2 flex items-start gap-1.5 text-[11px] text-rose-800">
                    <AlertCircle className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
                    <span>{p.error_message}</span>
                  </div>
                )}

                {p.status === 'approved' && p.generated_course_id && (
                  <Link href={{ pathname: '/curso/[id]', params: { id: p.generated_course_id } } as any}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 text-xs font-semibold rounded-lg">
                    <BookOpen className="h-3.5 w-3.5" /> Ver curso criado
                  </Link>
                )}

                {isOrgAdmin && p.status === 'ready' && (
                  <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100">
                    <button onClick={() => approve(p.id)} disabled={busy}
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-br from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-sm font-semibold rounded-lg shadow-sm disabled:opacity-50">
                      {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle className="h-3.5 w-3.5" />} Aprovar e criar curso
                    </button>
                    <button onClick={() => reject(p.id)} disabled={busy}
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-white border border-slate-200 hover:bg-rose-50 hover:border-rose-300 hover:text-rose-700 text-slate-700 text-sm font-semibold rounded-lg disabled:opacity-50">
                      <XCircle className="h-3.5 w-3.5" /> Rejeitar
                    </button>
                  </div>
                )}

                {p.status === 'processing' && (
                  <div className="bg-blue-50 border border-blue-200 rounded p-2 flex items-center gap-2 text-xs text-blue-800">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    A processar — em breve será marcada como Pronta para revisão. Atualiza esta página em alguns minutos.
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
