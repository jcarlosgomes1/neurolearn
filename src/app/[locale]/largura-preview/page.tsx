import { getTranslations } from 'next-intl/server';
import { Compass, Briefcase, Award, Brain, Target, MessageCircle, ArrowRight } from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = { robots: { index: false, follow: false } };

const FEATURES = [
  { icon: Compass, tKey: 'ps.feat.guided_t', dKey: 'ps.feat.guided_d', fam: 'denim' },
  { icon: Brain, tKey: 'ps.feat.tutor_t', dKey: 'ps.feat.tutor_d', fam: 'plum' },
  { icon: Award, tKey: 'ps.feat.certs_t', dKey: 'ps.feat.certs_d', fam: 'saffron' },
  { icon: Briefcase, tKey: 'ps.feat.jobs_t', dKey: 'ps.feat.jobs_d', fam: 'sage' },
  { icon: Target, tKey: 'ps.feat.projects_t', dKey: 'ps.feat.projects_d', fam: 'terra' },
  { icon: MessageCircle, tKey: 'ps.feat.community_t', dKey: 'ps.feat.community_d', fam: 'teal' },
];

function Block({ t, maxw, label }: { t: any; maxw: string; label: string }) {
  return (
    <div style={{ background: 'var(--paper)' }} className="pb-16">
      {/* faixa de largura */}
      <div className="sticky top-0 z-10 py-2 text-center text-xs font-bold uppercase tracking-widest text-white" style={{ background: 'var(--accent)' }}>{label}</div>
      {/* Hero */}
      <section className="relative overflow-hidden border-b" style={{ background: 'linear-gradient(135deg, var(--brand-50, #faf0eb), var(--card), var(--brand-100, #f5ded5))', borderColor: 'var(--line)' }}>
        <div className={`${maxw} mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-14 sm:py-20`}>
          <div className="inline-flex items-center gap-2 mb-4" style={{ color: 'var(--accent)' }}>
            <Compass className="h-4 w-4" /><span className="text-xs font-semibold uppercase tracking-[0.18em]">{t('ps.badge')}</span>
          </div>
          {/* titulo largo, texto contido */}
          <h1 className="t-h1 text-balance" style={{ color: 'var(--ink)' }}>{t('ps.h1_pre')} <span style={{ color: 'var(--accent)' }}>{t('ps.h1_accent')}</span></h1>
          <p className="mt-5 text-lg max-w-2xl leading-relaxed" style={{ color: 'var(--ink-2)' }}>{t('ps.hero_desc')}</p>
          <div className="mt-7 flex flex-wrap gap-3">
            <span className="inline-flex items-center gap-2 px-6 py-3 text-white font-bold rounded-xl shadow-lg" style={{ background: 'linear-gradient(135deg, var(--accent), var(--accent-bright))' }}>{t('ps.cta_start')} <ArrowRight className="h-4 w-4" /></span>
            <span className="inline-flex items-center gap-2 px-6 py-3 font-bold rounded-xl" style={{ border: '1px solid var(--line)', color: 'var(--ink)', background: 'var(--card)' }}>{t('ps.cta_catalog')}</span>
          </div>
        </div>
      </section>
      {/* Features grid — usa a largura toda */}
      <section className={`${maxw} mx-auto px-4 sm:px-6 lg:px-8 py-16`}>
        <div className="text-center mb-10 mx-auto max-w-2xl">
          <h2 className="t-h2" style={{ color: 'var(--ink)' }}>{t('ps.features_title')}</h2>
          <p className="mt-3" style={{ color: 'var(--ink-2)' }}>{t('ps.features_sub')}</p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {FEATURES.map((f, i) => (
            <div key={i} className="rounded-2xl p-6" style={{ background: 'var(--card)', border: '1px solid var(--line)', boxShadow: 'var(--nl-surface-shadow)' }}>
              <div className="inline-flex h-12 w-12 rounded-xl text-white items-center justify-center mb-4 shadow-md" style={{ background: `linear-gradient(135deg, var(--${f.fam}-base), var(--${f.fam}-deep))` }}>
                <f.icon className="h-6 w-6" />
              </div>
              <h3 className="t-h3 mb-1.5" style={{ color: 'var(--ink)' }}>{t(f.tKey)}</h3>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--ink-2)' }}>{t(f.dKey)}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

export default async function Page() {
  const t = await getTranslations();
  return (
    <div>
      <Block t={t} maxw="max-w-6xl" label="A · largura atual 6xl (1152px)" />
      <Block t={t} maxw="max-w-7xl" label="B · largura ampla 7xl (1280px) — texto contido a 2xl" />
    </div>
  );
}
