'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from '@/i18n/routing';
import { toast } from 'sonner';
import { Plus, Trash2, Users, Search, Loader2, X, Save, Clock, Check } from 'lucide-react';

interface OrgCourse {
  id: string; course_id: string; course_title: string; course_cover_url: string;
  pricing_model: string; total_price_cents: number; currency: string;
  seats_purchased: number; seats_used: number; status: string;
  starts_at: string | null; ends_at: string | null;
}

interface CatalogCourse { id: string; title: string; cover_url: string; level: string }

const STATUS_META: Record<string, { label: string; cls: string }> = {
  active:    { label: 'Activo',     cls: 'bg-emerald-100 text-emerald-700' },
  paused:    { label: 'Em pausa',   cls: 'bg-amber-100 text-amber-700' },
  cancelled: { label: 'Cancelado',  cls: 'bg-slate-100 text-slate-500' },
  pending:   { label: 'Pendente',   cls: 'bg-blue-100 text-blue-700' },
};

export function MarketplaceClient({ orgId, initial, catalog }: { orgId: string; initial: OrgCourse[]; catalog: CatalogCourse[] }) {
  const router = useRouter();
  const [items, setItems] = useState<OrgCourse[]>(initial);
  const [busy, setBusy] = useState(false);
  const [adding, setAdding] = useState(false);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({
    course_id: '', seats_purchased: 10, pricing_model: 'seats',
    total_price_euros: 0, currency: 'EUR', starts_at: '', ends_at: '',
  });

  const existingIds = new Set(items.filter((i) => i.status === 'active').map((i) => i.course_id));
  const filtered = catalog
    .filter((c) => !existingIds.has(c.id))
    .filter((c) => !search || c.title.toLowerCase().includes(search.toLowerCase()));

  async function add() {
    if (!form.course_id) { toast.error('Escolhe um curso'); return; }
    if (form.seats_purchased <= 0) { toast.error('Seats > 0'); return; }
    setBusy(true);
    try {
      const sb = createClient();
      const { error } = await sb.rpc('nl_admin_org_marketplace_add', {
        p_org_id: orgId,
        p_course_id: form.course_id,
        p_seats_purchased: form.seats_purchased,
        p_pricing_model: form.pricing_model,
        p_total_price_cents: Math.round(form.total_price_euros * 100),
        p_currency: form.currency,
        p_starts_at: form.starts_at ? new Date(form.starts_at).toISOString() : null,
        p_ends_at: form.ends_at ? new Date(form.ends_at).toISOString() : null,
      });
      if (error) throw error;
      toast.success('Curso adicionado ao marketplace');
      setAdding(false);
      setForm({ course_id: '', seats_purchased: 10, pricing_model: 'seats', total_price_euros: 0, currency: 'EUR', starts_at: '', ends_at: '' });
      await refresh();
    } catch (e: any) { toast.error(e?.message || 'Erro'); }
    finally { setBusy(false); }
  }

  async function remove(item: OrgCourse) {
    if (!confirm(`Cancelar "${item.course_title}" do marketplace? Os colaboradores já inscritos mantêm acesso.`)) return;
    setBusy(true);
    try {
      const sb = createClient();
      const { error } = await sb.rpc('nl_admin_org_marketplace_remove', { p_id: item.id });
      if (error) throw error;
      toast.success('Cancelado');
      await refresh();
    } catch (e: any) { toast.error(e?.message || 'Erro'); }
    finally { setBusy(false); }
  }

  async function refresh() {
    const sb = createClient();
    const { data } = await sb.rpc('nl_admin_org_marketplace_list', { p_org_id: orgId });
    setItems(Array.isArray(data) ? data : []);
    router.refresh();
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="text-xs text-slate-500">{items.filter((i) => i.status === 'active').length} cursos activos · {items.length} total</div>
        {!adding && (
          <button onClick={() => setAdding(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-br from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-sm font-semibold rounded-lg shadow-sm">
            <Plus className="h-4 w-4" /> Adicionar curso
          </button>
        )}
      </div>

      {adding && (
        <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-sm">Novo curso no marketplace</h3>
            <button onClick={() => setAdding(false)} className="p-1 hover:bg-white rounded"><X className="h-4 w-4" /></button>
          </div>
          <div className="relative">
            <Search className="h-4 w-4 absolute left-3 top-2.5 text-slate-400" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Pesquisar curso…"
              className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-emerald-500" />
          </div>
          <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-lg bg-white">
            {filtered.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-500">{catalog.length === 0 ? 'Sem cursos publicados.' : 'Nada encontrado / já adicionado.'}</div>
            ) : filtered.slice(0, 50).map((c) => (
              <button key={c.id} onClick={() => setForm((p) => ({ ...p, course_id: c.id }))}
                className={`w-full text-left flex items-center gap-2 px-3 py-2 border-b border-slate-100 hover:bg-emerald-50 ${form.course_id === c.id ? 'bg-emerald-100' : ''}`}>
                {c.cover_url ? <img src={c.cover_url} alt="" className="h-8 w-12 object-cover rounded" /> : <div className="h-8 w-12 bg-slate-100 rounded" />}
                <span className="flex-1 text-sm font-medium text-slate-900 truncate">{c.title}</span>
                {c.level && <span className="text-[9px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded uppercase font-bold tracking-wider">{c.level}</span>}
                {form.course_id === c.id && <Check className="h-4 w-4 text-emerald-600" />}
              </button>
            ))}
          </div>
          <div className="grid sm:grid-cols-3 gap-3">
            <div>
              <label className="text-[10px] uppercase font-bold text-slate-500 mb-1 block">Seats</label>
              <input type="number" min="1" value={form.seats_purchased} onChange={(e) => setForm((p) => ({ ...p, seats_purchased: Number(e.target.value) }))}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-emerald-500" />
            </div>
            <div>
              <label className="text-[10px] uppercase font-bold text-slate-500 mb-1 block">Modelo</label>
              <select value={form.pricing_model} onChange={(e) => setForm((p) => ({ ...p, pricing_model: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white outline-none focus:border-emerald-500">
                <option value="seats">Seats</option>
                <option value="subscription">Subscrição</option>
                <option value="bulk">Bulk</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] uppercase font-bold text-slate-500 mb-1 block">Preço total (€)</label>
              <input type="number" min="0" step="0.01" value={form.total_price_euros} onChange={(e) => setForm((p) => ({ ...p, total_price_euros: Number(e.target.value) }))}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-emerald-500" />
            </div>
            <div>
              <label className="text-[10px] uppercase font-bold text-slate-500 mb-1 block">Início (opcional)</label>
              <input type="date" value={form.starts_at} onChange={(e) => setForm((p) => ({ ...p, starts_at: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-emerald-500" />
            </div>
            <div>
              <label className="text-[10px] uppercase font-bold text-slate-500 mb-1 block">Fim (opcional)</label>
              <input type="date" value={form.ends_at} onChange={(e) => setForm((p) => ({ ...p, ends_at: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-emerald-500" />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button onClick={() => setAdding(false)} className="px-3 py-1.5 text-sm text-slate-600 hover:text-slate-900">Cancelar</button>
            <button onClick={add} disabled={busy} className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-lg disabled:opacity-50">
              {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />} Adicionar
            </button>
          </div>
        </div>
      )}

      {items.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <ShoppingBag className="h-10 w-10 text-slate-300 mx-auto mb-3" />
          <h3 className="font-semibold text-slate-900 text-sm">Nenhum curso no marketplace ainda</h3>
          <p className="text-xs text-slate-500 mt-1.5">Adiciona o primeiro acima.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-3">
          {items.map((it) => {
            const status = STATUS_META[it.status] || STATUS_META.pending;
            const seatsAvail = Math.max(0, it.seats_purchased - it.seats_used);
            const pct = it.seats_purchased > 0 ? (it.seats_used / it.seats_purchased) * 100 : 0;
            return (
              <article key={it.id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-md transition-shadow">
                <div className="flex">
                  {it.course_cover_url && <img src={it.course_cover_url} alt="" className="h-24 w-24 object-cover flex-shrink-0" />}
                  <div className="flex-1 p-4 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h3 className="font-bold text-slate-900 text-sm leading-snug line-clamp-2">{it.course_title}</h3>
                      <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider ${status.cls}`}>{status.label}</span>
                    </div>
                    <div className="text-xs text-slate-500">{it.pricing_model} · {(it.total_price_cents / 100).toFixed(2)} {it.currency}</div>
                  </div>
                </div>
                <div className="px-4 pb-3">
                  <div className="flex items-center justify-between text-[11px] mb-1">
                    <span className="flex items-center gap-1 text-slate-600"><Users className="h-3 w-3" /> {it.seats_used} / {it.seats_purchased} seats</span>
                    <span className="text-slate-400">{seatsAvail} livres</span>
                  </div>
                  <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-600" style={{ width: `${pct}%` }} />
                  </div>
                  {it.status === 'active' && (
                    <div className="mt-3 flex justify-end">
                      <button onClick={() => remove(it)} className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] text-slate-500 hover:text-rose-700 hover:bg-rose-50 rounded">
                        <Trash2 className="h-3 w-3" /> Cancelar
                      </button>
                    </div>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}

function ShoppingBag(props: any) { return <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>; }
