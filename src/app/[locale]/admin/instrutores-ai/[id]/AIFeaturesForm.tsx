'use client';

import { useEffect, useState } from 'react';
import { Link, useRouter } from '@/i18n/routing';
import { callAgentOps } from '@/lib/api/client';
import { DashboardSkeleton } from '@/components/shared/DashboardSkeleton';
import { toast } from 'sonner';

interface Features {
  can_generate_lessons: boolean;
  can_generate_full_courses: boolean;
  can_use_ai_tutor: boolean;
  can_use_pricing_advisor: boolean;
  monthly_ai_credits: number;
  credits_used_this_month?: number;
}

interface Instructor {
  id: string;
  display_name: string;
  avatar_url: string | null;
  profile_picture_url: string | null;
  status: string;
}

const FEATURE_OPTIONS = [
  {
    key: 'can_generate_lessons' as const,
    emoji: '📝',
    title: 'Gerar conteúdo de aulas',
    desc: 'Botão "✨ Gerar com IA" no editor de aulas. Cria parágrafos, key points, código, quiz.',
    credits: 1,
  },
  {
    key: 'can_generate_full_courses' as const,
    emoji: '🚀',
    title: 'Gerar cursos completos',
    desc: 'Acesso ao gerador modular (módulos + aulas + conteúdo de uma vez). Caro em créditos.',
    credits: 30,
  },
  {
    key: 'can_use_ai_tutor' as const,
    emoji: '🧠',
    title: 'Tutor AI pedagógico',
    desc: 'Sugestões sobre estrutura, questionários, duração ideal, melhorias ao conteúdo.',
    credits: 1,
  },
  {
    key: 'can_use_pricing_advisor' as const,
    emoji: '💰',
    title: 'Sugestor de preço',
    desc: 'Análise inteligente do valor do curso baseado em conteúdo, qualidade e mercado.',
    credits: 5,
  },
];

const CREDIT_PRESETS = [0, 50, 100, 250, 500, 1000];

export function AIFeaturesForm({ instructorId }: { instructorId: string }) {
  const router = useRouter();
  const [instructor, setInstructor] = useState<Instructor | null>(null);
  const [features, setFeatures] = useState<Features | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    callAgentOps<{ features: Features; instructor: Instructor }>('admin_get_instructor_ai_features', { instructor_id: instructorId })
      .then((r) => { setFeatures(r.features); setInstructor(r.instructor); })
      .catch((e) => setErr(e.message));
  }, [instructorId]);

  function toggle(key: keyof Features) {
    if (!features) return;
    setFeatures({ ...features, [key]: !features[key] });
    setDirty(true);
  }

  function setCredits(n: number) {
    if (!features) return;
    setFeatures({ ...features, monthly_ai_credits: Math.max(0, n) });
    setDirty(true);
  }

  async function save() {
    if (!features) return;
    setSaving(true);
    try {
      await callAgentOps('admin_set_instructor_ai_features', {
        instructor_id: instructorId,
        features: {
          can_generate_lessons: features.can_generate_lessons,
          can_generate_full_courses: features.can_generate_full_courses,
          can_use_ai_tutor: features.can_use_ai_tutor,
          can_use_pricing_advisor: features.can_use_pricing_advisor,
          monthly_ai_credits: features.monthly_ai_credits,
        },
      });
      toast.success('Features guardadas');
      setDirty(false);
    } catch (e: any) { toast.error(e.message); } finally { setSaving(false); }
  }

  function revokeAll() {
    if (!features) return;
    if (!confirm('Revogar TODAS as features AI deste instrutor?')) return;
    setFeatures({
      ...features,
      can_generate_lessons: false,
      can_generate_full_courses: false,
      can_use_ai_tutor: false,
      can_use_pricing_advisor: false,
      monthly_ai_credits: 0,
    });
    setDirty(true);
  }

  if (err) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <p className="text-slate-700 font-medium">{err}</p>
        <Link href={'/admin/instrutores-ai' as any} className="btn-primary mt-6 inline-flex">← Voltar</Link>
      </div>
    );
  }
  if (!features || !instructor) return <DashboardSkeleton stats={2} />;

  const pic = instructor.profile_picture_url || instructor.avatar_url;
  const activeCount = [features.can_generate_lessons, features.can_generate_full_courses, features.can_use_ai_tutor, features.can_use_pricing_advisor].filter(Boolean).length;
  const used = features.credits_used_this_month || 0;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-5 animate-fade-in">
      <Link href={'/admin/instrutores-ai' as any} className="text-sm text-brand-600 hover:underline">← Todos os instrutores</Link>

      {/* Cabeçalho instrutor */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 sm:p-6 flex items-center gap-4">
        {pic ? (
          <img src={pic} alt={instructor.display_name} className="w-16 h-16 rounded-full object-cover flex-shrink-0" />
        ) : (
          <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center text-2xl text-slate-400 flex-shrink-0">{instructor.display_name.charAt(0).toUpperCase()}</div>
        )}
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 truncate">{instructor.display_name}</h1>
          <div className="text-sm text-slate-500 mt-0.5">{activeCount} {activeCount === 1 ? 'feature activa' : 'features activas'}</div>
        </div>
      </div>

      {/* Features */}
      <section className="bg-white rounded-xl border border-slate-200 p-5 sm:p-6 space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Funcionalidades AI</h2>
        {FEATURE_OPTIONS.map((opt) => {
          const enabled = features[opt.key];
          return (
            <label key={opt.key} className={`flex items-start gap-3 p-3 sm:p-4 rounded-lg border cursor-pointer transition-all ${enabled ? 'border-brand-300 bg-brand-50/40' : 'border-slate-200 hover:border-slate-300'}`}>
              <input type="checkbox" checked={enabled} onChange={() => toggle(opt.key)} className="mt-1 w-5 h-5 accent-brand-600 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-lg">{opt.emoji}</span>
                  <span className="font-semibold text-slate-900">{opt.title}</span>
                  <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-full">{opt.credits} crédito{opt.credits > 1 ? 's' : ''}/uso</span>
                </div>
                <p className="text-sm text-slate-600 mt-1 leading-relaxed">{opt.desc}</p>
              </div>
            </label>
          );
        })}
      </section>

      {/* Créditos */}
      <section className="bg-white rounded-xl border border-slate-200 p-5 sm:p-6 space-y-4">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Créditos mensais</h2>
          <p className="text-xs text-slate-500 mt-1">Limite de operações AI por mês. Reseta automaticamente.</p>
        </div>
        <div className="bg-slate-50 rounded-lg p-4">
          <div className="flex items-baseline justify-between gap-3 mb-3">
            <div>
              <div className="text-3xl font-bold text-slate-900 tabular-nums">{features.monthly_ai_credits}</div>
              <div className="text-xs text-slate-500">créditos/mês</div>
            </div>
            {features.monthly_ai_credits > 0 && (
              <div className="text-right">
                <div className="text-sm font-semibold text-slate-900 tabular-nums">{used} usados</div>
                <div className="text-xs text-slate-500">{Math.max(0, features.monthly_ai_credits - used)} restantes</div>
              </div>
            )}
          </div>
          {features.monthly_ai_credits > 0 && (
            <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
              <div className="h-full bg-brand-500 transition-all" style={{ width: `${Math.min(100, (used / features.monthly_ai_credits) * 100)}%` }} />
            </div>
          )}
        </div>
        <div>
          <label className="label">Preset rápido</label>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            {CREDIT_PRESETS.map((n) => (
              <button key={n} type="button" onClick={() => setCredits(n)} className={`py-2 rounded-lg text-sm font-medium transition-colors ${features.monthly_ai_credits === n ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}>{n === 0 ? 'Off' : n}</button>
            ))}
          </div>
        </div>
        <div>
          <label className="label" htmlFor="credits-custom">Ou valor customizado</label>
          <input id="credits-custom" type="number" min="0" step="50" className="input" value={features.monthly_ai_credits} onChange={(e) => setCredits(parseInt(e.target.value) || 0)} />
        </div>
      </section>

      {/* Action bar */}
      <div className="sticky bottom-4 z-10">
        <div className="bg-white rounded-xl border border-slate-200 shadow-lg p-3 flex flex-wrap gap-2">
          <button onClick={revokeAll} className="px-4 py-2.5 rounded-lg border border-slate-300 text-slate-700 text-sm font-medium hover:bg-slate-50">Revogar tudo</button>
          <button onClick={save} disabled={saving || !dirty} className="flex-1 min-w-[140px] px-5 py-2.5 rounded-lg bg-emerald-600 text-white font-semibold hover:bg-emerald-700 disabled:opacity-50">{saving ? 'A guardar...' : dirty ? 'Guardar alterações' : 'Sem alterações'}</button>
        </div>
      </div>
    </div>
  );
}
