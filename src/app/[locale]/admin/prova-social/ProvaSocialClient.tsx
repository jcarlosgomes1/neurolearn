'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { BadgeCheck, Star, Plus, Check, Archive, Trash2, Save, Upload } from 'lucide-react';
import { toast } from 'sonner';

interface Candidate { source_type: string; source_id: string; rating: number; quote: string; author_name?: string; course_id?: string; consent?: boolean }
interface Item { id: string; source_type: string; quote: string; author_name?: string; author_role?: string; author_org?: string; avatar?: string; rating?: number; surfaces: string[]; lang: string; is_real: boolean; consent: boolean; publish_mode?: string; status: string; sort_order: number }

const LANGS = ['pt', 'en', 'es', 'fr'];
const SURFACES = ['home', 'b2b', 'talent'];

async function rpc(fn: string, args: Record<string, unknown>) {
  const sb = createClient();
  const { data, error } = await sb.rpc(fn, args);
  if (error) throw error;
  const r = data as { ok?: boolean; error?: string };
  if (!r?.ok) throw new Error(r?.error || 'error');
  return r as Record<string, unknown>;
}

export function ProvaSocialClient() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [c, l] = await Promise.all([rpc('nl_social_proof_candidates', { p_min_rating: 4 }), rpc('nl_social_proof_list', { p_status: null })]);
      setCandidates((c.items as Candidate[]) || []);
      setItems((l.items as Item[]) || []);
    } catch (e) { toast.error(e instanceof Error ? e.message : 'Erro'); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  async function promote(c: Candidate) {
    setBusy(true);
    try { await rpc('nl_social_proof_add_from_review', { p_source_type: c.source_type, p_source_id: c.source_id }); toast.success('Adicionado à curadoria'); await load(); }
    catch (e) { toast.error(e instanceof Error ? e.message : 'Erro'); } finally { setBusy(false); }
  }

  function patch(id: string, k: keyof Item, v: unknown) {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, [k]: v } : it)));
  }
  function toggleSurface(id: string, s: string) {
    setItems((prev) => prev.map((it) => it.id === id ? { ...it, surfaces: it.surfaces.includes(s) ? it.surfaces.filter((x) => x !== s) : [...it.surfaces, s] } : it));
  }

  async function save(it: Item) {
    if (!it.quote?.trim()) { toast.error('Citação obrigatória'); return; }
    setBusy(true);
    try {
      await rpc('nl_social_proof_upsert', { p: { id: it.id || undefined, quote: it.quote, author_name: it.author_name, author_role: it.author_role, author_org: it.author_org, avatar: it.avatar, rating: it.rating ?? null, surfaces: it.surfaces, lang: it.lang, is_real: it.is_real, consent: it.consent, publish_mode: it.publish_mode || 'identified', sort_order: it.sort_order } });
      toast.success('Guardado'); await load();
    } catch (e) { toast.error(e instanceof Error ? e.message : 'Erro'); } finally { setBusy(false); }
  }
  async function setStatus(id: string, status: string) {
    if (!id) return; setBusy(true);
    try { await rpc('nl_social_proof_set_status', { p_id: id, p_status: status }); await load(); }
    catch (e) { toast.error(e instanceof Error ? e.message : 'Erro'); } finally { setBusy(false); }
  }
  async function del(id: string) {
    if (!id) { setItems((p) => p.filter((x) => x.id !== '')); return; }
    if (!confirm('Eliminar este item?')) return;
    setBusy(true);
    try { await rpc('nl_social_proof_delete', { p_id: id }); await load(); }
    catch (e) { toast.error(e instanceof Error ? e.message : 'Erro'); } finally { setBusy(false); }
  }
  async function publish(lang: string) {
    if (!confirm('Publicar na homepage (' + lang.toUpperCase() + ')? Isto substitui os testemunhos atuais por todos os aprovados marcados para "home" nesta língua.')) return;
    setBusy(true);
    try { const r = await rpc('nl_social_proof_publish', { p_surface: 'home', p_lang: lang }); toast.success('Publicado: ' + (r.published as number) + ' (' + lang + ')'); }
    catch (e) { toast.error(e instanceof Error ? (e.message === 'no_approved_items' ? 'Sem itens aprovados para esta língua' : e.message) : 'Erro'); } finally { setBusy(false); }
  }
  function addManual() {
    if (items.some((i) => i.id === '')) return;
    setItems((p) => [{ id: '', source_type: 'manual', quote: '', author_name: '', author_role: '', author_org: '', rating: 5, surfaces: ['home'], lang: 'pt', is_real: false, consent: false, publish_mode: 'identified', status: 'proposed', sort_order: 0 }, ...p]);
  }

  const badge = (s: string) => s === 'approved' ? 'bg-emerald-100 text-emerald-700' : s === 'archived' ? 'bg-slate-200 text-slate-500' : 'bg-amber-100 text-amber-700';

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <AdminPageHeader eyebrow="Marketing" title="Prova social" description="Promove avaliações reais e consentidas a testemunhos. Aprovas, e publicas nos blocos da homepage. O B2B só mostra reais." icon={BadgeCheck} />

      <div className="rounded-2xl border border-slate-200 bg-white p-4 mb-6 flex flex-wrap items-center gap-3">
        <span className="text-sm font-medium text-slate-700 inline-flex items-center gap-1.5"><Upload className="h-4 w-4 text-brand-500" /> Publicar aprovados na homepage:</span>
        {LANGS.map((l) => (
          <button key={l} disabled={busy} onClick={() => publish(l)} className="rounded-lg bg-brand-600 text-white px-3 py-1.5 text-xs font-semibold hover:bg-brand-700 disabled:opacity-50 uppercase">{l}</button>
        ))}
      </div>

      {loading ? <div className="text-sm text-slate-400 py-10 text-center">A carregar…</div> : (
        <>
          <section className="mb-8">
            <h2 className="font-display text-lg font-bold text-slate-900 mb-3">Candidatos reais ({candidates.length})</h2>
            {candidates.length === 0 ? (
              <p className="text-sm text-slate-500 rounded-xl border border-slate-200 bg-white p-4">Sem avaliações reais elegíveis de momento (rating ≥ 4, não curadas).</p>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {candidates.map((c) => (
                  <div key={c.source_type + c.source_id} className="rounded-xl border border-slate-200 bg-white p-4">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="inline-flex text-amber-400 text-xs">{Array.from({ length: c.rating || 5 }).map((_, i) => <Star key={i} className="h-3.5 w-3.5 fill-current" />)}</span>
                      {c.consent ? <span className="text-[10px] font-semibold rounded-full bg-emerald-100 text-emerald-700 px-2 py-0.5">consentido</span> : <span className="text-[10px] font-semibold rounded-full bg-slate-100 text-slate-500 px-2 py-0.5">sem consentimento</span>}
                    </div>
                    <p className="text-sm text-slate-700 line-clamp-3">{c.quote}</p>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-xs text-slate-500">{c.author_name || '—'}</span>
                      <button disabled={busy} onClick={() => promote(c)} className="rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 px-2.5 py-1.5 text-xs font-semibold inline-flex items-center gap-1 disabled:opacity-50"><Plus className="h-3.5 w-3.5" /> Promover</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-display text-lg font-bold text-slate-900">Em curadoria ({items.length})</h2>
              <button onClick={addManual} className="rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 text-xs font-semibold inline-flex items-center gap-1"><Plus className="h-3.5 w-3.5" /> Adicionar manual</button>
            </div>
            <div className="space-y-3">
              {items.map((it) => (
                <div key={it.id || 'new'} className="rounded-xl border border-slate-200 bg-white p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={'text-[10px] font-semibold rounded-full px-2 py-0.5 ' + badge(it.status)}>{it.status}</span>
                    <span className={'text-[10px] font-semibold rounded-full px-2 py-0.5 ' + (it.is_real ? 'bg-sky-100 text-sky-700' : 'bg-fuchsia-100 text-fuchsia-700')}>{it.is_real ? 'real' : 'editorial'}</span>
                    {it.source_type !== 'manual' && <span className="text-[10px] text-slate-400">{it.source_type}</span>}
                  </div>
                  <textarea value={it.quote} onChange={(e) => patch(it.id, 'quote', e.target.value)} rows={2} placeholder="Citação" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm mb-2" />
                  <div className="grid sm:grid-cols-3 gap-2 mb-2">
                    <input value={it.author_name || ''} onChange={(e) => patch(it.id, 'author_name', e.target.value)} placeholder="Nome" className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-sm" />
                    <input value={it.author_role || ''} onChange={(e) => patch(it.id, 'author_role', e.target.value)} placeholder="Cargo" className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-sm" />
                    <input value={it.author_org || ''} onChange={(e) => patch(it.id, 'author_org', e.target.value)} placeholder="Empresa" className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-sm" />
                  </div>
                  <div className="flex flex-wrap items-center gap-3 mb-2 text-xs">
                    <select value={it.lang} onChange={(e) => patch(it.id, 'lang', e.target.value)} className="rounded-lg border border-slate-200 px-2 py-1.5">{LANGS.map((l) => <option key={l} value={l}>{l.toUpperCase()}</option>)}</select>
                    <span className="text-slate-400">Superfícies:</span>
                    {SURFACES.map((s) => (
                      <label key={s} className="inline-flex items-center gap-1 cursor-pointer"><input type="checkbox" checked={it.surfaces.includes(s)} onChange={() => toggleSurface(it.id, s)} /> {s}</label>
                    ))}
                    <select value={it.publish_mode || 'identified'} onChange={(e) => patch(it.id, 'publish_mode', e.target.value)} className="rounded-lg border border-slate-200 px-2 py-1.5"><option value="identified">identificado</option><option value="anonymized">anonimizado</option></select>
                    <label className="inline-flex items-center gap-1 cursor-pointer"><input type="checkbox" checked={it.is_real} onChange={(e) => patch(it.id, 'is_real', e.target.checked)} /> real</label>
                    <label className="inline-flex items-center gap-1 cursor-pointer"><input type="checkbox" checked={it.consent} onChange={(e) => patch(it.id, 'consent', e.target.checked)} /> consentido</label>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button disabled={busy} onClick={() => save(it)} className="rounded-lg bg-brand-600 text-white px-3 py-1.5 text-xs font-semibold hover:bg-brand-700 disabled:opacity-50 inline-flex items-center gap-1"><Save className="h-3.5 w-3.5" /> Guardar</button>
                    {it.id && it.status !== 'approved' && <button disabled={busy} onClick={() => setStatus(it.id, 'approved')} className="rounded-lg bg-emerald-600 text-white px-3 py-1.5 text-xs font-semibold hover:bg-emerald-700 disabled:opacity-50 inline-flex items-center gap-1"><Check className="h-3.5 w-3.5" /> Aprovar</button>}
                    {it.id && it.status !== 'archived' && <button disabled={busy} onClick={() => setStatus(it.id, 'archived')} className="rounded-lg bg-slate-100 text-slate-700 px-3 py-1.5 text-xs font-semibold hover:bg-slate-200 disabled:opacity-50 inline-flex items-center gap-1"><Archive className="h-3.5 w-3.5" /> Arquivar</button>}
                    <button disabled={busy} onClick={() => del(it.id)} className="rounded-lg bg-rose-50 text-rose-600 px-3 py-1.5 text-xs font-semibold hover:bg-rose-100 disabled:opacity-50 inline-flex items-center gap-1"><Trash2 className="h-3.5 w-3.5" /> Eliminar</button>
                  </div>
                </div>
              ))}
              {items.length === 0 && <p className="text-sm text-slate-500 rounded-xl border border-slate-200 bg-white p-4">Ainda sem itens. Promove um candidato ou adiciona manual.</p>}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
