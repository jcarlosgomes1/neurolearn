'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from '@/i18n/routing';
import { toast } from 'sonner';
import { Check, Loader2, ExternalLink, Eye } from 'lucide-react';

interface Direction { id: string; name: string; tagline: string; file: string; accent: string; sort_order: number; }

export function DesignClient({ initialActive, directions }: { initialActive: string; directions: Direction[] }) {
  const router = useRouter();
  const [active, setActive] = useState(initialActive);
  const [saving, setSaving] = useState<string | null>(null);

  async function activate(id: string) {
    if (id === active) return;
    setSaving(id);
    try {
      const sb = createClient();
      const { data, error } = await sb.rpc('nl_design_set_active', { p_id: id });
      if (error) throw error;
      if (!data?.ok) throw new Error(data?.error === 'forbidden' ? 'Sem permissão' : 'Direção inválida');
      setActive(id);
      toast.success(`Direção ativa: ${directions.find((d) => d.id === id)?.name ?? id}`);
      router.refresh();
    } catch (e: any) {
      toast.error(e?.message || 'Erro');
    } finally {
      setSaving(null);
    }
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {directions.map((d) => {
        const isActive = d.id === active;
        const isSaving = saving === d.id;
        return (
          <div
            key={d.id}
            className={`relative rounded-2xl border bg-white overflow-hidden transition-all ${
              isActive ? 'border-transparent ring-2 ring-offset-2 shadow-lg' : 'border-slate-200 hover:shadow-md'
            }`}
            style={isActive ? ({ ['--tw-ring-color' as any]: d.accent }) : undefined}
          >
            <div className="h-1.5 w-full" style={{ background: d.accent }} />
            <div className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">{d.id}</span>
                    {isActive && (
                      <span
                        className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full text-white"
                        style={{ background: d.accent }}
                      >
                        <Check className="h-3 w-3" /> Ativa
                      </span>
                    )}
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 mt-1">{d.name}</h3>
                </div>
                <span className="h-9 w-9 rounded-full flex-shrink-0 border border-slate-200" style={{ background: d.accent }} />
              </div>
              <p className="text-sm text-slate-600 mt-2 leading-relaxed">{d.tagline}</p>

              <div className="flex items-center gap-2 mt-4">
                <a
                  href={`/design/${d.file}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm font-medium px-3 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  <Eye className="h-4 w-4" /> Pré-visualizar <ExternalLink className="h-3 w-3 opacity-60" />
                </a>
                <button
                  onClick={() => activate(d.id)}
                  disabled={isActive || isSaving}
                  className={`inline-flex items-center gap-1.5 text-sm font-semibold px-3 py-2 rounded-xl text-white transition-all disabled:opacity-100 ${
                    isActive ? 'cursor-default' : 'hover:brightness-110'
                  }`}
                  style={{ background: isActive ? '#94a3b8' : d.accent }}
                >
                  {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : isActive ? <Check className="h-4 w-4" /> : null}
                  {isActive ? 'É a ativa' : 'Definir como ativa'}
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
