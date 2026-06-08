'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from '@/i18n/routing';
import { toast } from 'sonner';
import { Sparkles, Check, X, Plus, Wand2, Loader2 } from 'lucide-react';
import { SUPABASE_URL } from '@/lib/supabase/config';

export function GapsClient({ pathId, gaps, existingCount }: { pathId: string; gaps: any[]; existingCount: number }) {
  const router = useRouter();
  const [creating, setCreating] = useState(false);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', level: 'intermediate', lang: 'pt', topics: '' });

  async function addGap() {
    if (!form.title) { toast.error('Título obrigatório'); return; }
    setBusy(true);
    try {
      const sb = createClient();
      const topics = form.topics.split(',').map((t) => t.trim()).filter(Boolean);
      const { error } = await sb.rpc('nl_admin_path_gap_create', {
        p_path_id: pathId, p_title: form.title, p_description: form.description || null,
        p_topics: topics.length ? topics : null, p_level: form.level, p_lang: form.lang,
        p_position: gaps.length + existingCount,
      });
      if (error) throw error;
      toast.success('Lacuna registada');
      setCreating(false);
      setForm({ title: '', description: '', level: 'intermediate', lang: 'pt', topics: '' });
      router.refresh();
    } catch (e: any) {
      toast.error(e?.message || 'Erro');
    } finally { setBusy(false); }
  }

  async function decide(gap: any, decision: 'accepted' | 'rejected') {
    setBusy(true);
    try {
      const sb = createClient();
      await sb.rpc('nl_admin_path_gap_decide', { p_id: gap.id, p_decision: decision });
      toast.success(decision === 'accepted' ? 'Aceite' : 'Rejeitado');
      router.refresh();
    } catch (e: any) {
      toast.error(e?.message || 'Erro');
    } finally { setBusy(false); }
  }

  async function generateCourse(gap: any) {
    if (!confirm(`Gerar curso "${gap.suggested_title}" via IA? Vai criar estrutura completa de módulos e lições.`)) return;
    setBusy(true);
    try {
      const sb = createClient();
      const { data: { session } } = await sb.auth.getSession();
      const resp = await fetch(`${SUPABASE_URL}/functions/v1/generate-full-course`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token || ''}` },
        body: JSON.stringify({
          title: gap.suggested_title,
          description: gap.suggested_description,
          topics: gap.suggested_topics || [],
          level: gap.suggested_level,
          language: gap.suggested_lang,
          source: 'path_gap', path_gap_id: gap.id, path_id: pathId,
        }),
      });
      const data = await resp.json();
      if (!resp.ok || !data.ok) throw new Error(data.error || 'Falhou');
      await sb.rpc('nl_admin_path_gap_decide', {
        p_id: gap.id, p_decision: 'generated',
        p_generated_course_id: data.course_id || null,
      });
      toast.success('Curso gerado · a abrir editor');
      router.refresh();
    } catch (e: any) {
      toast.error(e?.message || 'Erro na geração');
    } finally { setBusy(false); }
  }

  return (
    <div className="space-y-5">
      <div className="bg-gradient-to-br from-violet-50 to-indigo-50 border border-violet-200 rounded-2xl p-4 flex items-start gap-3">
        <Wand2 className="h-5 w-5 text-violet-600 flex-shrink-0 mt-0.5" />
        <div className="flex-1 text-sm">
          <div className="font-semibold text-violet-900">Como funciona</div>
          <p className="text-violet-700/80 text-xs leading-relaxed mt-1">
            Adiciona o título e descrição do curso que falta. A IA gera estrutura, lições, exercícios e quiz quando aprovares.
          </p>
        </div>
        {!creating && (
          <button onClick={() => setCreating(true)} className="inline-flex items-center gap-1 px-3 py-1.5 bg-violet-600 hover:bg-violet-700 text-white text-xs font-semibold rounded-lg shadow-sm">
            <Plus className="h-3.5 w-3.5" /> Nova lacuna
          </button>
        )}
      </div>

      {creating && (
        <div className="bg-white rounded-2xl border border-violet-200 p-5 space-y-3 shadow-sm">
          <input
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            placeholder="Título do curso (ex: Fundamentos de RAG)"
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-base font-semibold outline-none focus:border-violet-500" />
          <textarea
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            placeholder="Para quem é? Que problema resolve?"
            rows={3}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-violet-500" />
          <input
            value={form.topics}
            onChange={(e) => setForm((f) => ({ ...f, topics: e.target.value }))}
            placeholder="Tópicos (vírgula): vector search, embeddings, retrieval, …"
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-violet-500" />
          <div className="grid grid-cols-2 gap-3">
            <select value={form.level} onChange={(e) => setForm((f) => ({ ...f, level: e.target.value }))} className="px-3 py-2 border border-slate-200 rounded-lg text-sm">
              <option value="beginner">Iniciante</option>
              <option value="intermediate">Intermédio</option>
              <option value="advanced">Avançado</option>
            </select>
            <select value={form.lang} onChange={(e) => setForm((f) => ({ ...f, lang: e.target.value }))} className="px-3 py-2 border border-slate-200 rounded-lg text-sm">
              <option value="pt">Português</option>
              <option value="en">English</option>
              <option value="es">Español</option>
              <option value="fr">Français</option>
            </select>
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <button onClick={() => setCreating(false)} className="px-3 py-1.5 text-sm text-slate-600 hover:text-slate-900">Cancelar</button>
            <button onClick={addGap} disabled={busy} className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold rounded-lg disabled:opacity-50">
              <Plus className="h-3.5 w-3.5" /> Adicionar
            </button>
          </div>
        </div>
      )}

      {gaps.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center">
          <Sparkles className="h-10 w-10 text-slate-300 mx-auto mb-3" />
          <h3 className="font-semibold text-slate-900 text-sm">Nenhuma lacuna identificada</h3>
          <p className="text-xs text-slate-500 mt-1.5 max-w-md mx-auto leading-relaxed">
            Quando o percurso precisar de cursos que não existem, regista-os aqui e a IA cria-os por ti.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {gaps.map((g) => (
            <div key={g.id} className="bg-white rounded-2xl border border-slate-200 p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <h3 className="font-bold text-slate-900 text-base">{g.suggested_title}</h3>
                  {g.suggested_description && <p className="text-sm text-slate-600 mt-1 leading-relaxed">{g.suggested_description}</p>}
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-semibold uppercase tracking-wider">{g.suggested_level}</span>
                    <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-semibold uppercase tracking-wider">{g.suggested_lang}</span>
                    {(g.suggested_topics || []).slice(0, 6).map((t: string) => (
                      <span key={t} className="text-[10px] bg-violet-50 text-violet-700 px-1.5 py-0.5 rounded">{t}</span>
                    ))}
                  </div>
                </div>
              </div>
              <div className="mt-4 flex items-center justify-end gap-2 border-t border-slate-100 pt-3">
                <button onClick={() => decide(g, 'rejected')} disabled={busy} className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded-lg">
                  <X className="h-3.5 w-3.5" /> Rejeitar
                </button>
                <button onClick={() => decide(g, 'accepted')} disabled={busy} className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-emerald-700 hover:bg-emerald-50 rounded-lg">
                  <Check className="h-3.5 w-3.5" /> Aceitar
                </button>
                <button onClick={() => generateCourse(g)} disabled={busy} className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-gradient-to-br from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white text-xs font-semibold rounded-lg shadow-sm disabled:opacity-50">
                  {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />} Gerar com IA
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
