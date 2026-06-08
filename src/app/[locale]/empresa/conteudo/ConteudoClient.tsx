'use client';

import { useState, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from '@/i18n/routing';
import { toast } from 'sonner';
import { Upload, FileText, Trash2, Sparkles, Loader2, CheckCircle, Clock, AlertCircle, ChevronDown, Building2 } from 'lucide-react';
import { SUPABASE_URL } from '@/lib/supabase/config';

const STATUS: Record<string, { label: string; cls: string; icon: any }> = {
  pending: { label: 'A processar', cls: 'bg-amber-50 text-amber-700 border-amber-200', icon: Clock },
  processing: { label: 'A extrair', cls: 'bg-blue-50 text-blue-700 border-blue-200', icon: Loader2 },
  completed: { label: 'Pronto', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: CheckCircle },
  failed: { label: 'Erro', cls: 'bg-rose-50 text-rose-700 border-rose-200', icon: AlertCircle },
};
const PROP_STATUS: Record<string, { label: string; cls: string }> = {
  pending: { label: 'A planear curso', cls: 'bg-violet-50 text-violet-700' },
  processing: { label: 'A gerar lições', cls: 'bg-blue-50 text-blue-700' },
  approved: { label: 'Aprovada', cls: 'bg-emerald-50 text-emerald-700' },
  completed: { label: 'Curso criado', cls: 'bg-emerald-100 text-emerald-800' },
  failed: { label: 'Falhou', cls: 'bg-rose-50 text-rose-700' },
  rejected: { label: 'Rejeitada', cls: 'bg-slate-100 text-slate-600' },
};

export function ConteudoClient({ orgs, activeOrgId, content, proposals }: {
  orgs: any[]; activeOrgId: string; content: any[]; proposals: any[];
}) {
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
          toast.error(`${file.name}: máximo 100 MB`);
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
        // Trigger extraction (fire-and-forget via edge function)
        try {
          const { data: { session } } = await sb.auth.getSession();
          fetch(`${SUPABASE_URL}/functions/v1/org-content-ingest`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token || ''}` },
            body: JSON.stringify({ content_id: contentId, org_id: activeOrgId }),
          }).catch(() => {});
        } catch {}
      }
      toast.success(`${files.length} ${files.length === 1 ? 'ficheiro' : 'ficheiros'} carregados`);
      router.refresh();
    } catch (e: any) {
      toast.error(e?.message || 'Erro no upload');
    } finally {
      setBusy(false);
    }
  }

  async function createProposal() {
    if (selected.size === 0) {
      toast.error('Seleciona pelo menos 1 documento');
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
      toast.success('Proposta criada · IA a planear');
      setSelected(new Set());
      router.refresh();
    } catch (e: any) {
      toast.error(e?.message || 'Erro');
    } finally {
      setBusy(false);
    }
  }

  async function archive(id: string) {
    if (!confirm('Arquivar este documento?')) return;
    try {
      const sb = createClient();
      const { data } = await sb.rpc('nl_org_content_archive', { p_content_id: id });
      if (data?.storage_path) {
        await sb.storage.from('org-content').remove([data.storage_path]).catch(() => {});
      }
      toast.success('Arquivado');
      router.refresh();
    } catch (e: any) {
      toast.error(e?.message || 'Erro');
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

      {/* Upload area */}
      <div
        onClick={() => fileRef.current?.click()}
        className="relative bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 border-2 border-dashed border-emerald-200 rounded-2xl p-8 sm:p-10 text-center cursor-pointer hover:border-emerald-400 hover:from-emerald-100 transition-all group">
        <div className="inline-flex h-14 w-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white items-center justify-center shadow-lg mb-3 group-hover:scale-110 transition-transform">
          {busy ? <Loader2 className="h-7 w-7 animate-spin" /> : <Upload className="h-7 w-7" />}
        </div>
        <h3 className="font-bold text-slate-900 text-lg">Arrasta ficheiros ou clica para escolher</h3>
        <p className="text-sm text-slate-600 mt-1">PDF · DOC · DOCX · MD · TXT — até 100 MB cada</p>
        <input
          ref={fileRef} type="file" multiple
          accept=".pdf,.doc,.docx,.md,.txt"
          className="hidden"
          onChange={(e) => e.target.files && uploadFiles(e.target.files)}
        />
      </div>

      {/* Bulk action: criar proposta */}
      {selected.size > 0 && (
        <div className="bg-white border border-violet-200 rounded-xl p-3 flex items-center justify-between shadow-sm sticky top-4 z-10">
          <div className="text-sm">
            <span className="font-semibold text-violet-700">{selected.size}</span> selecionado{selected.size > 1 ? 's' : ''}
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setSelected(new Set())} className="text-xs text-slate-500 hover:text-slate-900 px-2">Limpar</button>
            <button
              onClick={createProposal}
              disabled={busy}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-br from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white text-sm font-semibold rounded-lg shadow-sm disabled:opacity-50">
              <Sparkles className="h-3.5 w-3.5" />
              {busy ? 'A criar…' : 'Propor curso via IA'}
            </button>
          </div>
        </div>
      )}

      {/* Documentos */}
      <section>
        <h2 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
          <FileText className="h-4 w-4" /> Documentos ({content.length})
        </h2>
        {content.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center text-sm text-slate-500">
            Sem documentos ainda. Faz upload acima.
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden divide-y divide-slate-100">
            {content.map((c) => {
              const st = STATUS[c.extraction_status] || STATUS.pending;
              const SIcon = st.icon;
              const isSel = selected.has(c.id);
              return (
                <div key={c.id} className={`p-3 flex items-center gap-3 group ${isSel ? 'bg-violet-50/50' : 'hover:bg-slate-50/60'}`}>
                  <input
                    type="checkbox"
                    checked={isSel}
                    onChange={() => toggleSel(c.id)}
                    disabled={c.extraction_status !== 'completed'}
                    className="h-4 w-4 rounded text-violet-600 disabled:opacity-30" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium text-slate-900 truncate">{c.original_name}</span>
                      <span className={`inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded font-semibold uppercase tracking-wider ${st.cls}`}>
                        <SIcon className={`h-2.5 w-2.5 ${c.extraction_status === 'processing' ? 'animate-spin' : ''}`} /> {st.label}
                      </span>
                    </div>
                    {c.summary && <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">{c.summary}</p>}
                    {c.detected_topics?.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {c.detected_topics.slice(0, 5).map((t: string) => (
                          <span key={t} className="text-[9px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">{t}</span>
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

      {/* Propostas IA */}
      {proposals.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-violet-500" /> Propostas IA ({proposals.length})
          </h2>
          <div className="grid sm:grid-cols-2 gap-3">
            {proposals.map((p) => {
              const ps = PROP_STATUS[p.status] || PROP_STATUS.pending;
              const proposal = p.proposal || {};
              return (
                <div key={p.id} className="bg-white rounded-2xl border border-slate-200 p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold uppercase tracking-wider ${ps.cls}`}>{ps.label}</span>
                    <span className="text-[10px] text-slate-400">{new Date(p.created_at).toLocaleDateString('pt-PT')}</span>
                  </div>
                  <h3 className="font-bold text-slate-900 text-sm leading-snug">{proposal.title || 'A planear curso…'}</h3>
                  {proposal.description && <p className="text-xs text-slate-500 mt-1.5 line-clamp-3 leading-relaxed">{proposal.description}</p>}
                  {proposal.modules?.length > 0 && (
                    <div className="mt-2 text-[10px] text-slate-400">{proposal.modules.length} módulos · {(proposal.lessons_count || proposal.modules.reduce((a: number, m: any) => a + (m.lessons?.length || 0), 0))} lições</div>
                  )}
                  {p.generated_course_id && (
                    <a href={`/pt/curso/${p.generated_course_id}`} className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:text-emerald-900">
                      Abrir curso →
                    </a>
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
