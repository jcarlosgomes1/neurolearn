'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { Layers, Plus, Pencil, Trash2, Check, X, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';

interface Card {
  id: string; course_id: string; course_title?: string | null;
  module_index: number; lesson_index: number;
  front: string; back: string; hint?: string | null; enabled: boolean; origin: string;
}

const groupKeyOf = (c: Card) => c.course_id + '|' + c.module_index + '|' + c.lesson_index;

export function FlashcardsAdmin() {
  const [cards, setCards] = useState<Card[] | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [edit, setEdit] = useState<{ id: string; front: string; back: string; hint: string } | null>(null);
  const [addKey, setAddKey] = useState<string | null>(null);
  const [draft, setDraft] = useState({ front: '', back: '', hint: '' });
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const sb = createClient();
      const { data, error } = await sb.rpc('nl_flashcards_admin_list_all');
      if (error) throw error;
      const r = data as { ok?: boolean; cards?: Card[] };
      if (!r?.ok) throw new Error('forbidden');
      setCards(r.cards || []);
      setErr(null);
    } catch (e) { setErr(e instanceof Error ? e.message : 'error'); }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function rpc(fn: string, args: Record<string, unknown>) {
    const sb = createClient();
    const { data, error } = await sb.rpc(fn, args);
    if (error) throw error;
    const r = data as { ok?: boolean; error?: string };
    if (!r?.ok) throw new Error(r?.error || 'error');
    return r;
  }

  async function saveEdit() {
    if (!edit) return;
    setBusy(true);
    try {
      await rpc('nl_flashcard_upsert', { p_id: edit.id, p_course_id: '', p_m: null, p_l: null, p_front: edit.front, p_back: edit.back, p_hint: edit.hint });
      toast.success('Cartão guardado');
      setEdit(null);
      await load();
    } catch (e) { toast.error(e instanceof Error ? e.message : 'Erro'); } finally { setBusy(false); }
  }

  async function addCard(sample: Card) {
    if (!draft.front.trim() || !draft.back.trim()) { toast.error('Frente e verso obrigatórios'); return; }
    setBusy(true);
    try {
      await rpc('nl_flashcard_upsert', { p_id: null, p_course_id: sample.course_id, p_m: sample.module_index, p_l: sample.lesson_index, p_front: draft.front, p_back: draft.back, p_hint: draft.hint });
      toast.success('Cartão adicionado');
      setAddKey(null); setDraft({ front: '', back: '', hint: '' });
      await load();
    } catch (e) { toast.error(e instanceof Error ? e.message : 'Erro'); } finally { setBusy(false); }
  }

  async function toggle(c: Card) {
    try { await rpc('nl_flashcard_toggle', { p_id: c.id, p_enabled: !c.enabled }); await load(); }
    catch (e) { toast.error(e instanceof Error ? e.message : 'Erro'); }
  }

  async function remove(c: Card) {
    if (!confirm('Eliminar este cartão?')) return;
    try { await rpc('nl_flashcard_delete', { p_id: c.id }); toast.success('Cartão eliminado'); await load(); }
    catch (e) { toast.error(e instanceof Error ? e.message : 'Erro'); }
  }

  const groups: { key: string; sample: Card; items: Card[] }[] = [];
  if (cards) {
    const map = new Map<string, Card[]>();
    for (const c of cards) {
      const k = groupKeyOf(c);
      if (!map.has(k)) map.set(k, []);
      map.get(k)!.push(c);
    }
    for (const [key, items] of map) groups.push({ key, sample: items[0], items });
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <AdminPageHeader
        backHref="/admin"
        eyebrow="Estúdio"
        title="Flashcards"
        description="Reveja, edite, ative ou crie cartões de estudo por aula. A geração automática é uma tarefa do agente de formação."
        icon={Layers}
      />

      {err && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {err === 'forbidden' ? 'Sem acesso. Esta área é exclusiva de administradores.' : 'Não foi possível carregar os cartões.'}
        </div>
      )}

      {!cards && !err && <div className="text-sm text-slate-400 py-10 text-center">A carregar…</div>}

      {cards && cards.length === 0 && !err && (
        <div className="rounded-2xl border border-slate-200 bg-white px-6 py-12 text-center text-slate-500">
          Ainda não existem flashcards. Serão criados pela geração do Estúdio ou manualmente nas aulas.
        </div>
      )}

      <div className="space-y-6">
        {groups.map((g) => (
          <section key={g.key} className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
            <header className="flex items-center justify-between gap-3 px-5 py-3.5 border-b border-slate-100 bg-slate-50/60">
              <div className="min-w-0">
                <p className="font-display text-base font-bold text-slate-900 truncate">{g.sample.course_title || g.sample.course_id}</p>
                <p className="text-xs text-slate-500">Módulo {g.sample.module_index + 1} · Aula {g.sample.lesson_index + 1} · {g.items.length} cartões</p>
              </div>
              <button
                onClick={() => { setAddKey(addKey === g.key ? null : g.key); setDraft({ front: '', back: '', hint: '' }); }}
                className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-slate-900 text-white text-xs font-semibold px-3 py-2 hover:bg-slate-800">
                <Plus className="h-3.5 w-3.5" /> Cartão
              </button>
            </header>

            {addKey === g.key && (
              <div className="px-5 py-4 border-b border-slate-100 bg-brand-50/40 space-y-2">
                <input value={draft.front} onChange={(e) => setDraft({ ...draft, front: e.target.value })} placeholder="Frente (pergunta)" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
                <textarea value={draft.back} onChange={(e) => setDraft({ ...draft, back: e.target.value })} placeholder="Verso (resposta)" rows={2} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
                <input value={draft.hint} onChange={(e) => setDraft({ ...draft, hint: e.target.value })} placeholder="Pista (opcional)" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
                <div className="flex gap-2 justify-end">
                  <button onClick={() => setAddKey(null)} className="rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-500 hover:bg-slate-100">Cancelar</button>
                  <button disabled={busy} onClick={() => addCard(g.sample)} className="rounded-lg bg-brand-600 text-white px-3 py-1.5 text-xs font-semibold hover:bg-brand-700 disabled:opacity-50">Adicionar</button>
                </div>
              </div>
            )}

            <ul className="divide-y divide-slate-100">
              {g.items.map((c) => (
                <li key={c.id} className="px-5 py-3.5">
                  {edit && edit.id === c.id ? (
                    <div className="space-y-2">
                      <input value={edit.front} onChange={(e) => setEdit({ ...edit, front: e.target.value })} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium" />
                      <textarea value={edit.back} onChange={(e) => setEdit({ ...edit, back: e.target.value })} rows={2} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
                      <input value={edit.hint} onChange={(e) => setEdit({ ...edit, hint: e.target.value })} placeholder="Pista (opcional)" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
                      <div className="flex gap-2 justify-end">
                        <button onClick={() => setEdit(null)} className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-500 hover:bg-slate-100"><X className="h-3.5 w-3.5" /> Cancelar</button>
                        <button disabled={busy} onClick={saveEdit} className="inline-flex items-center gap-1 rounded-lg bg-brand-600 text-white px-3 py-1.5 text-xs font-semibold hover:bg-brand-700 disabled:opacity-50"><Check className="h-3.5 w-3.5" /> Guardar</button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start gap-3">
                      <div className={'flex-1 min-w-0 ' + (c.enabled ? '' : 'opacity-50')}>
                        <p className="text-sm font-medium text-slate-900">{c.front}</p>
                        <p className="text-sm text-slate-600 mt-0.5">{c.back}</p>
                        {c.hint && <p className="text-xs text-slate-400 mt-1">Pista: {c.hint}</p>}
                        <span className="inline-block mt-1.5 text-[10px] font-semibold uppercase tracking-wide text-slate-400">{c.origin === 'generated' ? 'Gerado' : 'Manual'}</span>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button title={c.enabled ? 'Desativar' : 'Ativar'} onClick={() => toggle(c)} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700">{c.enabled ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}</button>
                        <button title="Editar" onClick={() => setEdit({ id: c.id, front: c.front, back: c.back, hint: c.hint || '' })} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700"><Pencil className="h-4 w-4" /></button>
                        <button title="Eliminar" onClick={() => remove(c)} className="p-1.5 rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-600"><Trash2 className="h-4 w-4" /></button>
                      </div>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
