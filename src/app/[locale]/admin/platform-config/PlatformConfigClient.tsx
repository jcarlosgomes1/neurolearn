'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from '@/i18n/routing';
import { toast } from 'sonner';
import { Save, Loader2, Search, Mail, Building2, Settings, Star } from 'lucide-react';

interface ConfigRow { key: string; value: string | null; description: string | null; }

const HIGHLIGHTED = ['contact_email', 'company_name', 'company_email', 'support_email', 'gdpr_dpo_email', 'company_address', 'vat_number', 'supported_currencies'];

export function PlatformConfigClient({ initial }: { initial: ConfigRow[] }) {
  const router = useRouter();
  const [rows, setRows] = useState<ConfigRow[]>(initial);
  const [search, setSearch] = useState('');
  const [dirty, setDirty] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState<Set<string>>(new Set());

  function updateValue(key: string, value: string) {
    setRows((prev) => prev.map((r) => (r.key === key ? { ...r, value } : r)));
    setDirty((prev) => new Set(prev).add(key));
  }

  async function save(key: string) {
    const row = rows.find((r) => r.key === key);
    if (!row) return;
    setSaving((prev) => new Set(prev).add(key));
    try {
      const sb = createClient();
      const { error } = await sb.from('nl_platform_config').upsert({ key, value: row.value, updated_at: new Date().toISOString() });
      if (error) throw error;
      toast.success(`${key} guardado`);
      setDirty((prev) => { const n = new Set(prev); n.delete(key); return n; });
      router.refresh();
    } catch (e: any) {
      toast.error(e?.message || 'Erro');
    } finally {
      setSaving((prev) => { const n = new Set(prev); n.delete(key); return n; });
    }
  }

  const filtered = rows.filter((r) =>
    !search || r.key.toLowerCase().includes(search.toLowerCase()) || (r.description || '').toLowerCase().includes(search.toLowerCase())
  );
  const featured = filtered.filter((r) => HIGHLIGHTED.includes(r.key));
  const others = filtered.filter((r) => !HIGHLIGHTED.includes(r.key));

  return (
    <div className="space-y-5">
      {/* Highlighted: Contact Email */}
      {featured.find((r) => r.key === 'contact_email') && (
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <Mail className="h-4 w-4 text-blue-700" />
            <div className="text-[10px] uppercase tracking-wider font-bold text-blue-700">Email de contacto único</div>
            <Star className="h-3 w-3 text-amber-500 fill-amber-500" />
          </div>
          <p className="text-xs text-slate-600 mb-3">Este é o único email mostrado no site público (formulário /contacto, footer, etc). Mudar aqui actualiza em todo o lado em &lt;5min.</p>
          {(() => {
            const row = featured.find((r) => r.key === 'contact_email')!;
            const isDirty = dirty.has('contact_email');
            const isSaving = saving.has('contact_email');
            return (
              <div className="flex gap-2">
                <input type="email" value={row.value || ''} onChange={(e) => updateValue('contact_email', e.target.value)}
                  className={`flex-1 px-3 py-2.5 border-2 rounded-lg text-sm font-mono ${isDirty ? 'border-amber-400' : 'border-blue-200'} bg-white focus:border-blue-500 outline-none`} />
                <button onClick={() => save('contact_email')} disabled={isSaving || !isDirty}
                  className="px-4 py-2.5 bg-gradient-to-br from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 text-white text-sm font-semibold rounded-lg inline-flex items-center gap-1.5">
                  {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Guardar
                </button>
              </div>
            );
          })()}
        </div>
      )}

      {/* Search */}
      <div className="bg-white border border-slate-200 rounded-xl p-3 flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="h-4 w-4 absolute left-3 top-2.5 text-slate-400" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Procurar key ou descrição..."
            className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:border-slate-400 outline-none" />
        </div>
        <div className="text-xs text-slate-500">{filtered.length} keys</div>
      </div>

      {/* Featured (other) */}
      {featured.filter((r) => r.key !== 'contact_email').length > 0 && (
        <section className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <header className="px-5 py-3 border-b border-slate-100 flex items-center gap-2 bg-slate-50/60">
            <Building2 className="h-4 w-4 text-slate-600" />
            <h2 className="font-semibold text-sm text-slate-900">Configurações principais</h2>
          </header>
          <div className="divide-y divide-slate-100">
            {featured.filter((r) => r.key !== 'contact_email').map((row) => renderRow(row))}
          </div>
        </section>
      )}

      {/* Others */}
      <section className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <header className="px-5 py-3 border-b border-slate-100 flex items-center gap-2">
          <Settings className="h-4 w-4 text-slate-600" />
          <h2 className="font-semibold text-sm text-slate-900">Outras chaves ({others.length})</h2>
        </header>
        <div className="divide-y divide-slate-100">
          {others.map((row) => renderRow(row))}
          {others.length === 0 && <div className="p-10 text-center text-sm text-slate-500">Sem mais keys.</div>}
        </div>
      </section>
    </div>
  );

  function renderRow(row: ConfigRow) {
    const isDirty = dirty.has(row.key);
    const isSaving = saving.has(row.key);
    return (
      <div key={row.key} className="p-4 hover:bg-slate-50/40">
        <div className="flex items-center gap-2 mb-1">
          <code className="text-[11px] font-mono font-bold text-slate-900 bg-slate-100 px-1.5 py-0.5 rounded">{row.key}</code>
          {isDirty && <span className="text-[9px] uppercase tracking-wider font-bold text-amber-700 bg-amber-100 px-1.5 rounded">por guardar</span>}
        </div>
        {row.description && <div className="text-[11px] text-slate-500 mb-2 leading-relaxed">{row.description}</div>}
        <div className="flex gap-2">
          <input type="text" value={row.value || ''} onChange={(e) => updateValue(row.key, e.target.value)}
            className={`flex-1 px-2.5 py-2 border ${isDirty ? 'border-amber-300' : 'border-slate-200'} rounded-lg text-sm font-mono focus:border-slate-400 outline-none`} />
          {isDirty && (
            <button onClick={() => save(row.key)} disabled={isSaving}
              className="px-3 py-2 bg-slate-900 hover:bg-slate-700 disabled:opacity-50 text-white text-xs font-semibold rounded-lg inline-flex items-center gap-1">
              {isSaving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />} Guardar
            </button>
          )}
        </div>
      </div>
    );
  }
}
