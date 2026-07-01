'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { Check, Archive, Plus } from 'lucide-react';

type Cand = { source_type: string; source_id: string; rating: number; quote: string; author_name?: string; consent?: boolean };
type Item = { id: string; quote: string; author_name?: string; author_role?: string; author_org?: string; rating?: number; is_real: boolean; consent: boolean; publish_mode?: string; status: string; sort_order: number };
type Pub = { n: string; r: string; t: string; av: string; rating: number };

export function OrgProvaSocialClient({ orgId, lang }: { orgId: string; lang: string }) {
  const sb = createClient();
  const [cands, setCands] = useState<Cand[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [pub, setPub] = useState<Pub[]>([]);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const [c, l, p] = await Promise.all([
      sb.rpc('nl_org_social_proof_candidates', { p_org: orgId, p_min_rating: 4 }),
      sb.rpc('nl_org_social_proof_list', { p_org: orgId, p_status: null }),
      sb.rpc('nl_social_proof_public', { p_org: orgId, p_lang: lang }),
    ]);
    setCands((c.data as { items?: Cand[] })?.items || []);
    setItems((l.data as { items?: Item[] })?.items || []);
    setPub((p.data as { items?: Pub[] })?.items || []);
  }, [orgId, lang]);
  useEffect(() => { load(); }, [load]);

  async function promote(cn: Cand) {
    setBusy(true);
    const { data } = await sb.rpc('nl_org_social_proof_add_from_review', { p_org: orgId, p_source_type: cn.source_type, p_source_id: cn.source_id });
    if ((data as { ok?: boolean })?.ok) { toast.success('Promovido'); await load(); } else toast.error((data as { error?: string })?.error || 'Erro');
    setBusy(false);
  }
  function patch(id: string, k: keyof Item, v: unknown) { setItems((p) => p.map((it) => it.id === id ? { ...it, [k]: v } : it)); }
  async function save(it: Item) {
    setBusy(true);
    const { data } = await sb.rpc('nl_org_social_proof_upsert', { p_org: orgId, p: { id: it.id || undefined, quote: it.quote, author_name: it.author_name, author_role: it.author_role, author_org: it.author_org, rating: it.rating ?? null, is_real: it.is_real, consent: it.consent, publish_mode: it.publish_mode || 'identified', sort_order: it.sort_order } });
    if ((data as { ok?: boolean })?.ok) { toast.success('Guardado'); await load(); } else toast.error('Erro');
    setBusy(false);
  }
  async function setStatus(it: Item, status: string) {
    setBusy(true);
    const { data } = await sb.rpc('nl_org_social_proof_set_status', { p_org: orgId, p_id: it.id, p_status: status });
    if ((data as { ok?: boolean })?.ok) { toast.success(status === 'approved' ? 'Aprovado' : 'Arquivado'); await load(); } else toast.error('Erro — verifica real/consentimento');
    setBusy(false);
  }
  function addManual() {
    setItems((p) => [{ id: '', quote: '', author_name: '', author_role: '', author_org: '', rating: 5, is_real: true, consent: false, publish_mode: 'identified', status: 'proposed', sort_order: 0 }, ...p]);
  }

  return (
    <div className="space-y-8">
      <section>
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-3">Candidatos (avaliações reais ≥4★)</h2>
        {cands.length === 0 ? <p className="text-sm text-slate-400">Sem candidatos por agora.</p> : (
          <div className="space-y-2">
            {cands.map((c) => (
              <div key={c.source_type + c.source_id} className="flex items-start gap-3 bg-white border border-slate-200 rounded-xl p-3">
                <div className="text-amber-500 text-sm shrink-0">{'★'.repeat(c.rating)}</div>
                <div className="flex-1 min-w-0"><p className="text-sm text-slate-700 line-clamp-2">{c.quote}</p><p className="text-xs text-slate-400 mt-0.5">{c.author_name || 'Aluno'}{c.consent ? ' · consentiu' : ''}</p></div>
                <button onClick={() => promote(c)} disabled={busy} className="shrink-0 inline-flex items-center gap-1 rounded-lg bg-brand-600 text-white px-2.5 py-1.5 text-xs font-semibold hover:bg-brand-700 disabled:opacity-50"><Plus className="h-3.5 w-3.5" /> Promover</button>
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500">Curadoria</h2>
          <button onClick={addManual} className="inline-flex items-center gap-1 text-xs font-semibold text-brand-700 hover:underline"><Plus className="h-3.5 w-3.5" /> Adicionar manual</button>
        </div>
        {items.length === 0 ? <p className="text-sm text-slate-400">Ainda sem itens.</p> : (
          <div className="space-y-3">
            {items.map((it) => (
              <div key={it.id || 'new'} className="bg-white border border-slate-200 rounded-xl p-4 space-y-2">
                <textarea value={it.quote} onChange={(e) => patch(it.id, 'quote', e.target.value)} rows={2} placeholder="Citação" className="w-full text-sm border border-slate-200 rounded-lg p-2" />
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  <input value={it.author_name || ''} onChange={(e) => patch(it.id, 'author_name', e.target.value)} placeholder="Nome" className="text-sm border border-slate-200 rounded-lg px-2 py-1.5" />
                  <input value={it.author_role || ''} onChange={(e) => patch(it.id, 'author_role', e.target.value)} placeholder="Cargo" className="text-sm border border-slate-200 rounded-lg px-2 py-1.5" />
                  <input value={it.author_org || ''} onChange={(e) => patch(it.id, 'author_org', e.target.value)} placeholder="Organização" className="text-sm border border-slate-200 rounded-lg px-2 py-1.5" />
                </div>
                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600">
                  <select value={it.publish_mode || 'identified'} onChange={(e) => patch(it.id, 'publish_mode', e.target.value)} className="rounded-lg border border-slate-200 px-2 py-1.5"><option value="identified">identificado</option><option value="anonymized">anonimizado</option></select>
                  <label className="inline-flex items-center gap-1"><input type="checkbox" checked={it.is_real} onChange={(e) => patch(it.id, 'is_real', e.target.checked)} /> real</label>
                  <label className="inline-flex items-center gap-1"><input type="checkbox" checked={it.consent} onChange={(e) => patch(it.id, 'consent', e.target.checked)} /> consentimento</label>
                  <span className="ml-auto rounded-full bg-slate-100 px-2 py-0.5">{it.status}</span>
                </div>
                <div className="flex flex-wrap gap-2 pt-1">
                  <button onClick={() => save(it)} disabled={busy} className="rounded-lg bg-slate-900 text-white px-3 py-1.5 text-xs font-semibold disabled:opacity-50">Guardar</button>
                  {it.id && it.status !== 'approved' && <button onClick={() => setStatus(it, 'approved')} disabled={busy} className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 text-white px-3 py-1.5 text-xs font-semibold disabled:opacity-50"><Check className="h-3.5 w-3.5" /> Aprovar</button>}
                  {it.id && it.status !== 'archived' && <button onClick={() => setStatus(it, 'archived')} disabled={busy} className="inline-flex items-center gap-1 rounded-lg bg-slate-100 text-slate-600 px-3 py-1.5 text-xs font-semibold disabled:opacity-50"><Archive className="h-3.5 w-3.5" /> Arquivar</button>}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-3">Pré-visualização pública</h2>
        {pub.length === 0 ? <p className="text-sm text-slate-400">Nada aprovado ainda. Aprova itens reais (e com consentimento, se identificados) para aparecerem aqui.</p> : (
          <div className="grid sm:grid-cols-2 gap-3">
            {pub.map((p, i) => (
              <div key={i} className="bg-white border border-slate-200 rounded-xl p-4">
                <div className="text-amber-500 text-sm">{'★'.repeat(p.rating)}</div>
                <p className="text-sm text-slate-700 mt-1.5">“{p.t}”</p>
                <div className="flex items-center gap-2 mt-3">
                  <div className="h-8 w-8 rounded-full bg-gradient-to-br from-brand-500 to-brand-600 text-white flex items-center justify-center text-xs font-bold">{p.av}</div>
                  <div className="text-xs"><div className="font-semibold text-slate-900">{p.n}</div><div className="text-slate-500">{p.r}</div></div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
