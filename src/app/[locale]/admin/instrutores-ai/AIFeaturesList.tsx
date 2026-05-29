'use client';

import { useEffect, useState } from 'react';
import { Link } from '@/i18n/routing';
import { callAgentOps } from '@/lib/api/client';
import { DashboardSkeleton } from '@/components/shared/DashboardSkeleton';

interface Row {
  id: string;
  display_name: string;
  avatar_url: string | null;
  profile_picture_url: string | null;
  status: string;
  features: {
    can_generate_lessons?: boolean;
    can_generate_full_courses?: boolean;
    can_use_ai_tutor?: boolean;
    can_use_pricing_advisor?: boolean;
    monthly_ai_credits?: number;
    credits_used_this_month?: number;
  };
  active_features_count: number;
}

const FEATURE_BADGES = [
  { key: 'can_generate_lessons', label: 'Aulas', emoji: '📝' },
  { key: 'can_generate_full_courses', label: 'Cursos', emoji: '🚀' },
  { key: 'can_use_ai_tutor', label: 'Tutor', emoji: '🧠' },
  { key: 'can_use_pricing_advisor', label: 'Preço', emoji: '💰' },
];

export function AIFeaturesList() {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    callAgentOps<{ rows: Row[] }>('admin_list_instructor_ai_features', {})
      .then((r) => setRows(r.rows))
      .catch((e) => setErr(e.message));
  }, []);

  if (err) return <p className="text-rose-600 text-sm">{err}</p>;
  if (!rows) return <DashboardSkeleton stats={3} />;

  if (rows.length === 0) {
    return (
      <div className="bg-white rounded-xl border-2 border-dashed border-slate-200 p-8 text-center">
        <div className="text-3xl mb-2">👨‍🏫</div>
        <p className="text-sm text-slate-500">Sem instrutores aprovados ainda. Quando aprovares candidaturas, vão aparecer aqui.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-3">
      {rows.map((row) => {
        const pic = row.profile_picture_url || row.avatar_url;
        const credits = row.features.monthly_ai_credits || 0;
        const used = row.features.credits_used_this_month || 0;
        return (
          <Link key={row.id} href={`/admin/instrutores-ai/${row.id}` as any}
                className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 flex items-center gap-4 hover:border-brand-300 hover:shadow-md transition-all group">
            {pic ? (
              <img src={pic} alt={row.display_name} className="w-12 h-12 rounded-full object-cover flex-shrink-0" />
            ) : (
              <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 flex-shrink-0">{row.display_name.charAt(0).toUpperCase()}</div>
            )}
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-slate-900 truncate">{row.display_name}</div>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {row.active_features_count === 0 ? (
                  <span className="text-xs text-slate-400">Nenhuma feature activa</span>
                ) : (
                  FEATURE_BADGES.filter((b) => row.features[b.key as keyof typeof row.features]).map((b) => (
                    <span key={b.key} className="text-xs bg-brand-50 text-brand-700 px-2 py-0.5 rounded-full">{b.emoji} {b.label}</span>
                  ))
                )}
              </div>
              {credits > 0 && (
                <div className="mt-1.5 text-xs text-slate-500">
                  Créditos: <strong className="text-slate-900">{used}/{credits}</strong> usados este mês
                </div>
              )}
            </div>
            <span className="text-slate-300 group-hover:text-brand-500 transition-colors text-lg flex-shrink-0">→</span>
          </Link>
        );
      })}
    </div>
  );
}
