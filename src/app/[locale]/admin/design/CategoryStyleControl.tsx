'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from '@/i18n/routing';
import { toast } from 'sonner';
import { Loader2, Check, Code, BarChart3 } from 'lucide-react';
import { CategoryCard, type CategoryVariant } from '@/components/sections/CategoryCard';

const VARIANTS: { id: CategoryVariant; label: string }[] = [
  { id: 'icon-tl-brand', label: 'A · Ícone topo-esq (marca)' },
  { id: 'icon-tl-neutral', label: 'B · Ícone topo-esq (neutro)' },
  { id: 'inline', label: 'C · Ícone em linha' },
  { id: 'corner', label: 'D · Ícone no canto' },
  { id: 'circle', label: 'E · Ícone em círculo' },
  { id: 'typographic', label: 'F · Tipográfico (sem ícone)' },
  { id: 'brand-tile', label: 'Azulejo de marca' },
  { id: 'multicolor', label: 'Azulejo multicolor (antigo)' },
];

export function CategoryStyleControl({ initialVariant, initialArrow }: { initialVariant: string; initialArrow: boolean }) {
  const router = useRouter();
  const [variant, setVariant] = useState<CategoryVariant>((initialVariant as CategoryVariant) || 'icon-tl-brand');
  const [arrow, setArrow] = useState<boolean>(initialArrow !== false);
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    try {
      const sb = createClient();
      const { error } = await sb.rpc('nl_admin_platform_config_set', {
        p_key: 'category_card_style',
        p_value: JSON.stringify({ variant, arrow_on_clickable: arrow }),
        p_description: 'Estilo dos cartoes de categoria (home).',
      });
      if (error) throw error;
      toast.success('Estilo dos cartões guardado');
      router.refresh();
    } catch (e: any) {
      toast.error(e?.message || 'Erro ao guardar');
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="mt-12 rounded-2xl border border-slate-200 bg-white p-6">
      <h2 className="t-h3 text-slate-900">Cartões de categoria</h2>
      <p className="mt-1 text-sm text-slate-600">Estilo dos cartões de categoria na página inicial. A seta aparece apenas em cartões com link.</p>
      <div className="mt-5 grid sm:grid-cols-2 gap-6">
        <div className="space-y-4">
          <label className="block">
            <span className="text-sm font-medium text-slate-700">Estilo</span>
            <select value={variant} onChange={(e) => setVariant(e.target.value as CategoryVariant)} className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-brand-500">
              {VARIANTS.map((v) => <option key={v.id} value={v.id}>{v.label}</option>)}
            </select>
          </label>
          <label className="flex items-center gap-2.5 cursor-pointer">
            <input type="checkbox" checked={arrow} onChange={(e) => setArrow(e.target.checked)} className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500" />
            <span className="text-sm text-slate-700">Mostrar seta nos cartões clicáveis</span>
          </label>
          <button onClick={save} disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-brand-700 disabled:opacity-60">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} Guardar
          </button>
        </div>
        <div>
          <span className="text-xs uppercase tracking-wider font-semibold text-slate-500">Pré-visualização</span>
          <div className="mt-2 grid grid-cols-2 gap-3">
            <CategoryCard name="Programação" count="54+ cursos" Icon={Code} cls="from-violet-500 to-indigo-600" variant={variant} arrow={arrow} />
            <CategoryCard name="Data & Analytics" count="38+ cursos" Icon={BarChart3} cls="from-blue-500 to-cyan-600" variant={variant} arrow={arrow} />
          </div>
        </div>
      </div>
    </section>
  );
}
