'use client';

import { useEffect, useState, useMemo } from 'react';
import { useLocale } from 'next-intl';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { Loader2, Plus, Save, Pencil, Trash2, Calendar } from 'lucide-react';

const MODES = ['online', 'presencial', 'hybrid'];
const STATUSES = ['draft', 'published', 'cancelled'];
const LANGS = ['pt', 'en', 'es', 'fr'];

type Ev = {
  id: string; title: string; description: string; type: string; host: string; url: string; cover: string;
  mode: string; location: string; capacity: number | null; status: string; language: string;
  starts_at: string; duration_min: number; rsvp_count: number;
};

const EMPTY = {
  id: null as string | null, title: '', description: '', type: 'webinar', host: '', url: '', cover: '',
  mode: 'online', location: '', capacity: '' as string | number, status: 'draft', language: 'en',
  starts_at: '', duration_min: 60,
};

function toLocalInput(iso: string): string {
  const d = new Date(iso);
  const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
}

export function EventsAdmin() {
  const supabase = useMemo(() => createClient(), []);
  const locale = useLocale();
  const [rows, setRows] = useState<Ev[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ ...EMPTY });

  async function load() {
    setLoading(true);
    try {
      const { data } = await supabase.rpc('nl_admin_events_list');
      const d = data as { ok?: boolean; events?: Ev[] };
      if (d?.ok && Array.isArray(d.events)) setRows(d.events);
    } catch { /* noop */ }
    finally { setLoading(false); }
  }
  useEffect(() => { load(); }, []);

  function startCreate() {
    const now = new Date(Date.now() + 24 * 3600 * 1000);
    setForm({ ...EMPTY, starts_at: toLocalInput(now.toISOString()) });
    setOpen(true);
  }
  function startEdit(e: Ev) {
    setForm({
      id: e.id, title: e.title, description: e.description || '', type: e.type || 'webinar', host: e.host || '',
      url: e.url || '', cover: e.cover || '', mode: e.mode, location: e.location || '',
      capacity: e.capacity ?? '', status: e.status, language: e.language,
      starts_at: toLocalInput(e.starts_at), duration_min: e.duration_min || 60,
    });
    setOpen(true);
  }

  async function save() {
    if (!form.title.trim()) { toast.error('Título obrigatório'); return; }
    if (!form.starts_at) { toast.error('Data/hora obrigatória'); return; }
    setSaving(true);
    try {
      const { data, error } = await supabase.rpc('nl_admin_event_upsert', {
        p_id: form.id, p_title: form.title.trim(), p_description: form.description, p_type: form.type,
        p_host: form.host, p_url: form.url, p_cover: form.cover, p_mode: form.mode, p_location: form.location,
        p_capacity: form.capacity === '' ? null : Number(form.capacity), p_status: form.status, p_language: form.language,
        p_starts_at: new Date(form.starts_at).toISOString(), p_duration_min: Number(form.duration_min) || 60,
      });
      if (error || !(data as { ok?: boolean })?.ok) throw error || new Error('fail');
      toast.success(form.id ? 'Evento atualizado' : 'Evento criado');
      setOpen(false); setForm({ ...EMPTY });
      await load();
    } catch { toast.error('Erro ao guardar'); }
    finally { setSaving(false); }
  }

  async function remove(e: Ev) {
    if (!confirm(`Eliminar "${e.title}"?`)) return;
    const { data, error } = await supabase.rpc('nl_admin_event_delete', { p_id: e.id });
    if (error || !(data as { ok?: boolean })?.ok) { toast.error('Erro ao eliminar'); return; }
    toast.success('Eliminado');
    setRows((r) => r.filter((x) => x.id !== e.id));
  }

  const fieldCls = 'rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-violet-400';

  if (loading) return <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-slate-400" /></div>;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-4">
      {!open ? (
        <button onClick={startCreate} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-violet-600 text-white text-sm font-medium hover:bg-violet-700">
          <Plus className="h-4 w-4" /> Novo evento
        </button>
      ) : (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3">
          <input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="Título" className={fieldCls + ' w-full font-medium'} />
          <textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder="Descrição" rows={2} className={fieldCls + ' w-full resize-none'} />
          <div className="grid grid-cols-2 gap-2">
            <input value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))} placeholder="Tipo (webinar, AMA…)" className={fieldCls} />
            <input value={form.host} onChange={(e) => setForm((f) => ({ ...f, host: e.target.value }))} placeholder="Anfitrião" className={fieldCls} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <select value={form.mode} onChange={(e) => setForm((f) => ({ ...f, mode: e.target.value }))} className={fieldCls}>{MODES.map((m) => <option key={m} value={m}>{m}</option>)}</select>
            <input value={form.location} onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))} placeholder="Local (se presencial)" className={fieldCls} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <label className="text-xs text-slate-500">Início (teu fuso)<input type="datetime-local" value={form.starts_at} onChange={(e) => setForm((f) => ({ ...f, starts_at: e.target.value }))} className={fieldCls + ' w-full mt-1'} /></label>
            <label className="text-xs text-slate-500">Duração (min)<input type="number" value={form.duration_min} onChange={(e) => setForm((f) => ({ ...f, duration_min: Number(e.target.value) }))} className={fieldCls + ' w-full mt-1'} /></label>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <select value={form.language} onChange={(e) => setForm((f) => ({ ...f, language: e.target.value }))} className={fieldCls}>{LANGS.map((l) => <option key={l} value={l}>{l.toUpperCase()}</option>)}</select>
            <select value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))} className={fieldCls}>{STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}</select>
            <input type="number" value={form.capacity} onChange={(e) => setForm((f) => ({ ...f, capacity: e.target.value }))} placeholder="Lotação" className={fieldCls} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <input value={form.url} onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))} placeholder="Link (Zoom, Meet…)" className={fieldCls} />
            <input value={form.cover} onChange={(e) => setForm((f) => ({ ...f, cover: e.target.value }))} placeholder="Imagem de capa (URL)" className={fieldCls} />
          </div>
          <div className="flex gap-2">
            <button onClick={save} disabled={saving} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-violet-600 text-white text-sm font-medium disabled:opacity-50">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Guardar
            </button>
            <button onClick={() => { setOpen(false); setForm({ ...EMPTY }); }} className="px-4 py-2 rounded-lg border border-slate-200 text-sm text-slate-600">Cancelar</button>
          </div>
        </div>
      )}

      {rows.length === 0 ? (
        <div className="text-center py-12 text-slate-400 text-sm">Sem eventos ainda. Cria o primeiro.</div>
      ) : rows.map((e) => (
        <div key={e.id} className="bg-white border border-slate-200 rounded-2xl p-4 flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center flex-shrink-0"><Calendar className="h-4 w-4 text-indigo-600" /></div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-slate-900 truncate">{e.title}</span>
              <span className="text-[10px] uppercase font-bold text-slate-400">{e.language}</span>
              <span className={'text-[10px] uppercase font-bold rounded-full px-2 py-0.5 ' + (e.status === 'published' ? 'bg-emerald-100 text-emerald-700' : e.status === 'cancelled' ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-500')}>{e.status}</span>
            </div>
            <div className="text-xs text-slate-500 mt-1" suppressHydrationWarning>
              {new Date(e.starts_at).toLocaleString(locale, { dateStyle: 'medium', timeStyle: 'short' })} · {e.type} · {e.rsvp_count} RSVP
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => startEdit(e)} className="text-slate-500 hover:text-violet-600"><Pencil className="h-4 w-4" /></button>
            <button onClick={() => remove(e)} className="text-slate-400 hover:text-rose-600"><Trash2 className="h-4 w-4" /></button>
          </div>
        </div>
      ))}
    </div>
  );
}
