'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from '@/i18n/routing';
import { toast } from 'sonner';
import { Check, Loader2, ExternalLink, Eye, Sparkles, Layers } from 'lucide-react';

interface Direction { id: string; name: string; tagline: string; file: string; accent: string; sort_order: number; motion: boolean; surface: string; }

const SURFACE_PRESETS: { id: string; label: string }[] = [
  { id: 'flat', label: 'Plano' },
  { id: 'soft', label: 'Suave' },
  { id: 'linkedin', label: 'LinkedIn' },
  { id: 'strong', label: 'Forte' },
];

export function DesignClient({ initialActive, directions }: { initialActive: string; directions: Direction[] }) {
  const router = useRouter();
  const [active, setActive] = useState(initialActive);
  const [saving, setSaving] = useState<string | null>(null);
  const [motion, setMotion] = useState<Record<string, boolean>>(
    () => Object.fromEntries(directions.map((d) => [d.id, d.motion !== false]))
  );
  const [togglingMotion, setTogglingMotion] = useState<string | null>(null);
  const [surf, setSurf] = useState<Record<string, string>>(
    () => Object.fromEntries(directions.map((d) => [d.id, d.surface || 'soft']))
  );
  const [settingSurf, setSettingSurf] = useState<string | null>(null);

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

  async function toggleMotion(id: string) {
    const next = !(motion[id] ?? true);
    setTogglingMotion(id);
    try {
      const sb = createClient();
      const { data, error } = await sb.rpc('nl_design_set_motion', { p_id: id, p_on: next });
      if (error) throw error;
      if (!data?.ok) throw new Error(data?.error === 'forbidden' ? 'Sem permissão' : 'Direção inválida');
      setMotion((m) => ({ ...m, [id]: next }));
      toast.success(`${directions.find((d) => d.id === id)?.name ?? id}: movimento ${next ? 'ligado' : 'desligado'}`);
      if (id === active) router.refresh();
    } catch (e: any) {
      toast.error(e?.message || 'Erro');
    } finally {
      setTogglingMotion(null);
    }
  }

  async function setSurface(id: string, preset: string) {
    if ((surf[id] || 'soft') === preset) return;
    setSettingSurf(id);
    try {
      const sb = createClient();
      const { data, error } = await sb.rpc('nl_design_set_surface', { p_id: id, p_preset: preset });
      if (error) throw error;
      if (!data?.ok) throw new Error(data?.error === 'forbidden' ? 'Sem permissão' : 'Inválido');
      setSurf((s) => ({ ...s, [id]: preset }));
      toast.success(`${directions.find((d) => d.id === id)?.name ?? id}: relevo ${SURFACE_PRESETS.find((p) => p.id === preset)?.label ?? preset}`);
      if (id === active) router.refresh();
    } catch (e: any) {
      toast.error(e?.message || 'Erro');
    } finally {
      setSettingSurf(null);
    }
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {directions.map((d) => {
        const isActive = d.id === active;
        const isSaving = saving === d.id;
        const motionOn = motion[d.id] ?? true;
        const surfSel = surf[d.id] || 'soft';
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

              <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100">
                <span className="inline-flex items-center gap-1.5 text-sm text-slate-600">
                  <Sparkles className="h-4 w-4 text-slate-400" /> Movimento {motionOn ? 'ligado' : 'desligado'}
                </span>
                <button
                  onClick={() => toggleMotion(d.id)}
                  disabled={togglingMotion === d.id}
                  role="switch"
                  aria-checked={motionOn ? 'true' : 'false'}
                  aria-label="Ligar ou desligar o movimento desta direção"
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors disabled:opacity-60 ${motionOn ? '' : 'bg-slate-300'}`}
                  style={motionOn ? { background: d.accent } : undefined}
                >
                  {togglingMotion === d.id ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-white mx-auto" />
                  ) : (
                    <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${motionOn ? 'translate-x-5' : 'translate-x-0.5'}`} />
                  )}
                </button>
              </div>

              <div className="mt-3 pt-3 border-t border-slate-100">
                <div className="flex items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1.5 text-sm text-slate-600">
                    <Layers className="h-4 w-4 text-slate-400" /> Relevo dos cartões
                  </span>
                  {settingSurf === d.id && <Loader2 className="h-3.5 w-3.5 animate-spin text-slate-400" />}
                </div>
                <div className="mt-2 grid grid-cols-4 gap-1 rounded-xl bg-slate-100 p-1">
                  {SURFACE_PRESETS.map((p) => {
                    const sel = surfSel === p.id;
                    return (
                      <button
                        key={p.id}
                        onClick={() => setSurface(d.id, p.id)}
                        disabled={settingSurf === d.id}
                        className={`text-xs font-semibold py-1.5 rounded-lg transition-all disabled:opacity-60 ${sel ? 'bg-white text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
                        style={sel ? { boxShadow: '0 1px 2px rgba(15,23,42,.14)' } : undefined}
                      >
                        {p.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
