'use client';

import { useLocale } from 'next-intl';
import { Eye, GraduationCap, Presentation } from 'lucide-react';

/**
 * Controlo super-admin para entrar em modo "espreitar" (peek) — vista
 * so-leitura de aluno ou instrutor. Navega para a rota server /api/peek/start
 * (ancora <a>, nao Link, porque e um redirect server que define o cookie).
 */
export function PeekLauncher() {
  const locale = useLocale();
  return (
    <div className="mb-8 rounded-2xl border border-violet-200 bg-gradient-to-br from-violet-50 to-indigo-50 p-5">
      <div className="flex items-center gap-2 mb-2">
        <Eye className="w-5 h-5 text-violet-600" />
        <h2 className="text-sm font-semibold text-slate-800">Ver plataforma como</h2>
      </div>
      <p className="text-xs text-slate-500 mb-4">
        Entra numa vista so-leitura de aluno ou instrutor. As escritas ficam bloqueadas enquanto espreitas. Sessao de 1 hora.
      </p>
      <div className="flex flex-wrap gap-3">
        <a
          href={`/api/peek/start?as=aluno&locale=${locale}`}
          className="inline-flex items-center gap-2 rounded-xl bg-white border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:scale-110 hover:shadow-xl"
        >
          <GraduationCap className="w-4 h-4 text-emerald-600" /> Ver como Aluno
        </a>
        <a
          href={`/api/peek/start?as=instrutor&locale=${locale}`}
          className="inline-flex items-center gap-2 rounded-xl bg-white border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:scale-110 hover:shadow-xl"
        >
          <Presentation className="w-4 h-4 text-violet-600" /> Ver como Instrutor
        </a>
      </div>
    </div>
  );
}
