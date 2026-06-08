'use client';

import { useEffect, useState } from 'react';
import { Link } from '@/i18n/routing';
import { useTranslations } from 'next-intl';
import { Sparkles, Compass, Trophy, ArrowRight } from 'lucide-react';

function safeT(t: any, key: string, fb: string): string {
  try { const v = t(key); if (v && typeof v === 'string' && v !== key) return v; } catch {}
  return fb;
}

/**
 * Empty state altamente atrativo para /aprender/percursos quando ainda não há percursos
 * publicados. Sem menções a IA — copy neutro.
 */
export function PathsEmptyState() {
  const t = useTranslations();
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const i = setInterval(() => setTick((tt) => tt + 1), 100);
    return () => clearInterval(i);
  }, []);

  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-violet-50 via-fuchsia-50 to-amber-50 rounded-3xl p-8 sm:p-12">
      <div className="absolute -top-20 -left-20 h-72 w-72 rounded-full bg-violet-300/40 blur-3xl animate-pulse" />
      <div className="absolute -bottom-20 -right-20 h-72 w-72 rounded-full bg-fuchsia-300/40 blur-3xl animate-pulse" style={{ animationDelay: '700ms' }} />
      <div className="absolute top-1/2 right-1/4 h-40 w-40 rounded-full bg-amber-300/40 blur-2xl animate-pulse" style={{ animationDelay: '1400ms' }} />

      <div className="relative z-10 max-w-2xl mx-auto text-center">
        <div className="inline-block mb-6">
          <svg width="120" height="120" viewBox="0 0 120 120" className="drop-shadow-xl">
            <defs>
              <linearGradient id="compassGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#a855f7" />
                <stop offset="100%" stopColor="#ec4899" />
              </linearGradient>
            </defs>
            <circle cx="60" cy="60" r="54" fill="white" stroke="url(#compassGrad)" strokeWidth="3" />
            <circle cx="60" cy="60" r="46" fill="none" stroke="#f3e8ff" strokeWidth="1" strokeDasharray="2 3" />
            <g style={{ transform: `rotate(${(tick * 3) % 360}deg)`, transformOrigin: '60px 60px', transition: 'transform 100ms linear' }}>
              <polygon points="60,18 66,60 60,55 54,60" fill="#a855f7" />
              <polygon points="60,102 54,60 60,65 66,60" fill="#94a3b8" />
              <circle cx="60" cy="60" r="5" fill="#1e293b" />
            </g>
            <text x="60" y="14" textAnchor="middle" className="text-[10px] font-bold fill-slate-600">N</text>
            <text x="60" y="113" textAnchor="middle" className="text-[10px] font-bold fill-slate-600">S</text>
            <text x="14" y="64" textAnchor="middle" className="text-[10px] font-bold fill-slate-600">O</text>
            <text x="106" y="64" textAnchor="middle" className="text-[10px] font-bold fill-slate-600">E</text>
          </svg>
        </div>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/80 backdrop-blur-sm border border-violet-200 rounded-full text-xs font-semibold text-violet-700 mb-4">
          <Sparkles className="h-3 w-3" /> {safeT(t, 'paths.empty.eyebrow', 'Percursos guiados')}
        </div>

        <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight text-balance">
          {safeT(t, 'paths.empty.title', 'Novos percursos a caminho')}
        </h2>
        <p className="mt-3 text-base text-slate-600 leading-relaxed text-pretty max-w-lg mx-auto">
          {safeT(t, 'paths.empty.description', 'Cada percurso combina cursos para te levarem do zero ao domínio de uma área inteira. Os primeiros chegam em breve.')}
        </p>

        <div className="mt-8 grid sm:grid-cols-3 gap-3">
          {[
            { icon: Compass, labelKey: 'paths.empty.card_career', fb: 'Carreira', accent: 'from-violet-500 to-indigo-600' },
            { icon: Sparkles, labelKey: 'paths.empty.card_specialization', fb: 'Especialização', accent: 'from-emerald-500 to-teal-600' },
            { icon: Trophy, labelKey: 'paths.empty.card_mastery', fb: 'Mestria', accent: 'from-amber-500 to-orange-600' },
          ].map(({ icon: Icon, labelKey, fb, accent }, i) => (
            <div key={fb} className="bg-white/70 backdrop-blur-sm border border-white/40 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5" style={{ animationDelay: `${i * 150}ms` }}>
              <div className={`inline-flex h-10 w-10 rounded-xl bg-gradient-to-br ${accent} text-white items-center justify-center shadow-md mb-2`}>
                <Icon className="h-5 w-5" />
              </div>
              <div className="text-sm font-bold text-slate-900">{safeT(t, labelKey, fb)}</div>
              <div className="text-[11px] text-slate-500 mt-0.5">{safeT(t, 'paths.empty.coming_soon', 'Em breve')}</div>
            </div>
          ))}
        </div>

        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href={'/cursos' as any}
            className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold rounded-xl shadow-sm transition-all hover:scale-105">
            {safeT(t, 'paths.empty.cta_catalog', 'Explorar catálogo')} <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href={'/essentials' as any}
            className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-white/80 hover:bg-white backdrop-blur-sm border border-slate-200 text-slate-900 text-sm font-semibold rounded-xl transition-all">
            {safeT(t, 'paths.empty.cta_essentials', 'Ver essentials')}
          </Link>
        </div>
      </div>
    </div>
  );
}
