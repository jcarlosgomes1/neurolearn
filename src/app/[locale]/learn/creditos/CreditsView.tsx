'use client';

import { useEffect, useState } from 'react';
import { Link } from '@/i18n/routing';
import { createClient } from '@/lib/supabase/client';

interface Credits { balance: number; monthly_allowance: number; days_until_reset: number; role: string }
interface EventRow { id: number; event_type: string; payload: any; occurred_at: string }

const PURPOSE_LABEL: Record<string, { emoji: string; label: string }> = {
  lesson: { emoji: '📖', label: 'Iniciar aula' },
  quiz: { emoji: '🎯', label: 'Quiz da aula' },
  tutor: { emoji: '🧠', label: 'Pergunta ao tutor' },
  search: { emoji: '🔍', label: 'Pesquisa' },
};

function fmtDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('pt-PT', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}

export function CreditsView() {
  const [credits, setCredits] = useState<Credits | null>(null);
  const [history, setHistory] = useState<EventRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const sb = createClient();
      const { data: { user } } = await sb.auth.getUser();
      if (!user) return;
      const [creditsRes, eventsRes] = await Promise.all([
        sb.rpc('nl_my_credits'),
        sb.from('nl_events').select('id, event_type, payload, occurred_at')
          .eq('actor_id', user.id)
          .in('event_type', ['credits_spent', 'credits_denied'])
          .order('occurred_at', { ascending: false }).limit(30),
      ]);
      const row = (creditsRes.data as Credits[] | null)?.[0];
      if (row) setCredits(row);
      setHistory((eventsRes.data as EventRow[]) || []);
      setLoading(false);
    })();
  }, []);

  if (loading) return <div className="max-w-3xl mx-auto px-4 py-16 text-center text-slate-500">A carregar...</div>;

  const isUnlimited = credits && ['admin','super_admin','instructor'].includes(credits.role);

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
      <Link href={'/learn' as any} className="text-sm text-brand-600 hover:underline">← Os meus cursos</Link>

      <div className="mt-4 mb-8">
        <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">💎 Os meus créditos</h1>
        <p className="mt-2 text-slate-600">Cada aula que inicias consome 1 crédito. Os créditos voltam todos os meses automaticamente.</p>
      </div>

      {isUnlimited ? (
        <div className="bg-gradient-to-br from-purple-500 to-brand-600 text-white rounded-2xl p-6 sm:p-8">
          <div className="text-5xl mb-3">∞</div>
          <h2 className="text-xl font-bold">Créditos ilimitados</h2>
          <p className="text-sm opacity-90 mt-1">Como {credits!.role === 'instructor' ? 'instrutor' : 'admin'}, tens acesso ilimitado à plataforma.</p>
        </div>
      ) : credits ? (
        <>
          <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm">
            <div className="flex items-end gap-4 flex-wrap">
              <div className="flex-1 min-w-[140px]">
                <div className="text-xs uppercase tracking-wider text-slate-500 font-semibold">Saldo actual</div>
                <div className="text-5xl sm:text-6xl font-bold tabular-nums mt-1">
                  <span className={credits.balance <= 5 ? 'text-rose-600' : credits.balance <= 10 ? 'text-amber-600' : 'text-emerald-600'}>{credits.balance}</span>
                  <span className="text-slate-300 text-3xl sm:text-4xl font-medium"> / {credits.monthly_allowance}</span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs uppercase tracking-wider text-slate-500 font-semibold">Reset</div>
                <div className="text-2xl font-bold text-slate-900 tabular-nums">{credits.days_until_reset}<span className="text-base text-slate-400 font-medium ml-1">dia{credits.days_until_reset !== 1 ? 's' : ''}</span></div>
              </div>
            </div>
            <div className="mt-4 h-2 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-brand-500 to-purple-500 transition-all" style={{ width: `${Math.max(0, Math.min(100, (credits.balance / credits.monthly_allowance) * 100))}%` }} />
            </div>
            {credits.balance <= 5 && (
              <div className="mt-4 bg-rose-50 border border-rose-200 rounded-xl p-3 text-sm text-rose-800">
                ⚠️ Estás com poucos créditos. Volta amanhã se reset estiver perto ou contacta-nos para upgrade.
              </div>
            )}
          </div>

          <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              ['Iniciar aula', '📖', '1 crédito'],
              ['Quiz da aula', '🎯', 'Grátis'],
              ['Tutor AI', '🧠', '1 crédito'],
              ['Ver cursos', '🔍', 'Grátis'],
            ].map(([label, emoji, cost]) => (
              <div key={label} className="bg-white rounded-xl border border-slate-200 p-3 text-center">
                <div className="text-2xl">{emoji}</div>
                <div className="text-xs text-slate-700 font-semibold mt-1">{label}</div>
                <div className="text-[10px] text-slate-500 uppercase tracking-wide mt-0.5">{cost}</div>
              </div>
            ))}
          </div>
        </>
      ) : null}

      {/* Histórico */}
      {history.length > 0 && (
        <div className="mt-10">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-3">📋 Histórico ({history.length})</h2>
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            {history.map((ev) => {
              const purpose = ev.payload?.purpose || 'lesson';
              const meta = PURPOSE_LABEL[purpose] || { emoji: '•', label: purpose };
              const denied = ev.event_type === 'credits_denied';
              return (
                <div key={ev.id} className="px-4 py-3 border-b border-slate-100 last:border-0 flex items-center gap-3">
                  <span className="text-xl">{meta.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-slate-900 font-medium">{meta.label}</div>
                    <div className="text-xs text-slate-500">{fmtDate(ev.occurred_at)}</div>
                  </div>
                  <span className={`text-sm font-semibold tabular-nums ${denied ? 'text-rose-500 line-through' : 'text-slate-700'}`}>
                    -{ev.payload?.cost || 1}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
