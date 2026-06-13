'use client';

import { useEffect, useState, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { Loader2, Plus, Save, GraduationCap, Users, BookOpen } from 'lucide-react';

type Skill = { id: string; code: string; source: string; label_key: string; category: string | null; status: string; courses: number; holders: number };

export function SkillsAdmin() {
  const supabase = useMemo(() => createClient(), []);
  const [rows, setRows] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [draft, setDraft] = useState({ code: '', source: 'custom', label: '', category: '' });

  async function load() {
    setLoading(true);
    try {
      const { data } = await supabase.rpc('nl_admin_skills_list');
      const d = data as { ok?: boolean; skills?: Skill[] };
      if (d?.ok && Array.isArray(d.skills)) setRows(d.skills);
    } catch { /* noop */ }
    finally { setLoading(false); }
  }
  useEffect(() => { load(); }, []);

  async function create() {
    if (!draft.code.trim() || !draft.label.trim()) { toast.error('Código e nome obrigatórios'); return; }
    setSaving(true);
    try {
      const { data, error } = await supabase.rpc('nl_admin_skill_upsert', {
        p_id: null, p_code: draft.code, p_source: draft.source, p_label: draft.label,
        p_category: draft.category || null, p_status: 'active',
      });
      if (error || !(data as { ok?: boolean })?.ok) throw error || new Error('fail');
      toast.success('Competência criada');
      setCreating(false);
      setDraft({ code: '', source: 'custom', label: '', category: '' });
      await load();
    } catch { toast.error('Erro ao criar'); }
    finally { setSaving(false); }
  }

  if (loading) return <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-slate-400" /></div>;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-4">
      {!creating ? (
        <button onClick={() => setCreating(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-violet-600 text-white text-sm font-medium hover:bg-violet-700">
          <Plus className="h-4 w-4" /> Nova competência
        </button>
      ) : (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <input value={draft.code} onChange={(e) => setDraft((d) => ({ ...d, code: e.target.value }))} placeholder="código (ex: custom:prompt-eng)"
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-mono" />
            <select value={draft.source} onChange={(e) => setDraft((d) => ({ ...d, source: e.target.value }))}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm">
              <option value="custom">custom</option><option value="esco">esco</option>
            </select>
          </div>
          <input value={draft.label} onChange={(e) => setDraft((d) => ({ ...d, label: e.target.value }))} placeholder="Nome da competência"
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
          <input value={draft.category} onChange={(e) => setDraft((d) => ({ ...d, category: e.target.value }))} placeholder="Categoria (opcional)"
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
          <div className="flex gap-2">
            <button onClick={create} disabled={saving}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-violet-600 text-white text-sm font-medium disabled:opacity-50">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Criar
            </button>
            <button onClick={() => setCreating(false)} className="px-4 py-2 rounded-lg border border-slate-200 text-sm text-slate-600">Cancelar</button>
          </div>
        </div>
      )}

      {rows.length === 0 ? (
        <div className="text-center py-12 text-slate-400 text-sm">Sem competências ainda. Cria a primeira.</div>
      ) : rows.map((s) => (
        <div key={s.id} className="bg-white border border-slate-200 rounded-2xl p-4 flex items-start gap-3">
          <div className="w-9 h-9 rounded-lg bg-violet-50 flex items-center justify-center flex-shrink-0">
            <GraduationCap className="h-4 w-4 text-violet-600" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono text-xs bg-slate-100 px-1.5 py-0.5 rounded">{s.code}</span>
              <span className="text-[10px] uppercase font-bold text-slate-400">{s.source}</span>
              {s.status !== 'active' && <span className="text-[10px] uppercase text-amber-600">{s.status}</span>}
            </div>
            <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-400">
              <span className="flex items-center gap-1"><BookOpen className="h-3 w-3" /> {s.courses}</span>
              <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {s.holders}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
