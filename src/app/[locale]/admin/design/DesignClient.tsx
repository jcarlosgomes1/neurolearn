'use client';

import { useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from '@/i18n/routing';
import { toast } from 'sonner';
import { Check, Loader2, ExternalLink, Eye, Sparkles, Layers } from 'lucide-react';

interface Surface { depth: number; emboss: boolean; }
interface Direction { id: string; name: string; tagline: string; file: string; accent: string; sort_order: number; motion: boolean; surface: Surface; }

function shadowFor(depth: number, emboss: boolean) {
  const f = Math.max(0, Math.min(100, depth)) / 100;
  const base = `0 ${Math.round(1 + f * 5)}px ${Math.round(2 + f * 22)}px rgba(15,23,42,${(0.05 + f * 0.1).toFixed(3)}),0 1px 2px rgba(15,23,42,0.04)`;
  return emboss ? `inset 0 1px 0 rgba(255,255,255,.85),${base}` : base;
}

export function DesignClient({ initialActive, directions }: { initialActive: string; directions: Direction[] }) {
  const router = useRouter();
  const [active, setActive] = useState(initialActive);
  const [saving, setSaving] = useState<string | null>(null);
  const [motion, setMotion] = useState<Record<string, boolean>>(
    () => Object.fromEntries(directions.map((d) => [d.id, d.motion !== false]))
  );
  const [togglingMotion, setTogglingMotion] = useState<string | null>(null);
  const [depth, setDepth] = useState<Record<string, number>>(
    () => Object.fromEntries(directions.map((d) => [d.id, d.surface?.depth ?? 35]))
  );
  const [emboss, setEmboss] = useState<Record<string, boolean>>(
    () => Object.fromEntries(directions.map((d) => [d.id, d.surface?.emboss !== false]))
  );
  const [savingSurf, setSavingSurf] = useState<string | null>(null);
  const timers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

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

  async function saveSurface(id: string, d: number, e: boolean) {
    setSavingSurf(id);
    try {
      const sb = createClient();
      const { data, error } = await sb.rpc('nl_design_set_surface', { p_id: id, p_depth: d, p_emboss: e });
      if (error) throw error;
      if (!data?.ok) throw new Error(data?.error === 'forbidden' ? 'Sem permissão' : 'Inválido');
      if (id === active) router.refresh();
    } catch (err: any) {
      toast.error(err?.message || 'Erro');
    } finally {
      setSavingSurf(null);
    }
  }

  function onDepth(id: string, value: number) {
    setDepth((s) => ({ ...s, [id]: value }));
    if (timers.current[id]) clearTimeout(timers.current[id]);
    timers.current[id] = setTimeout(() => saveSurface(id, value, emboss[id] !== false), 450);
  }

  function onEmboss(id: string, value: boolean) {
    setEmboss((s) => ({ ...s, [id]: value }));
    saveSurface(id, depth[id] ?? 35, value);
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {directions.map((d) => {
        const isActive = d.id === active;
        const isSaving = saving === d.id;
        const motionOn = motion[d.id] ?? true;
        const dDepth = depth[d.id] ?? 35;
        const dEmboss = emboss[d.id] !== false;
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
                  {savingSurf === d.id && <Loader2 className="h-3.5 w-3.5 animate-spin text-slate-400" />}
                </div>
                <div className="mt-3 flex items-center gap-4">
                  <div
                    className="h-14 w-20 flex-shrink-0 rounded-xl bg-white border border-slate-200/70"
                    style={{ boxShadow: shadowFor(dDepth, dEmboss) }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span>Profundidade</span>
                      <span className="font-mono">{dDepth}</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      step={1}
                      value={dDepth}
                      onChange={(ev) => onDepth(d.id, Number(ev.target.value))}
                      className="w-full mt-1"
                      style={{ accentColor: d.accent }}
                    />
                    <label className="mt-2 inline-flex items-center gap-2 text-xs text-slate-600 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={dEmboss}
                        onChange={(ev) => onEmboss(d.id, ev.target.checked)}
                        className="h-3.5 w-3.5 rounded"
                        style={{ accentColor: d.accent }}
                      />
                      Brilho no topo (alto-relevo)
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
