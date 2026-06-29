import { seoMetadata } from '@/lib/seo';
import { Link } from '@/i18n/routing';
import { getTranslations } from 'next-intl/server';
import { PageHero } from '@/components/shared/PageHero';
import { PageWidth } from '@/components/shared/PageWidth';
import { getHomeBlocks } from '@/lib/api/home-blocks';
import { GraduationCap, Globe2, Sparkles, Users, BarChart3, ArrowRight, Briefcase } from 'lucide-react';

export const revalidate = 600;

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return seoMetadata('marketing', 'para-instrutores', locale, { title: 'Para instrutores · NeuroLearn' });
}

const STATS = [
  { value: '4', lKey: 'pi.stat2_label' },
  { value: '€0', lKey: 'pi.stat3_label' },
  { value: '24h', lKey: 'pi.stat4_label' },
];

const FEATURES = [
  { icon: Globe2, tKey: 'pi.feat.translate_t', dKey: 'pi.feat.translate_d', fam: 'denim' },
  { icon: Sparkles, tKey: 'pi.feat.gen_t', dKey: 'pi.feat.gen_d', fam: 'plum' },
  { icon: BarChart3, tKey: 'pi.feat.analytics_t', dKey: 'pi.feat.analytics_d', fam: 'saffron' },
  { icon: Briefcase, tKey: 'pi.feat.talent_t', dKey: 'pi.feat.talent_d', fam: 'terra' },
  { icon: Users, tKey: 'pi.feat.marketing_t', dKey: 'pi.feat.marketing_d', fam: 'teal' },
];

const COMPARE = [
  { fKey: 'pi.cmp.translate', neuro: 'pi.cmp.v_4idiomas', udemy: 'pi.no', coursera: 'pi.cmp.v_limitada', teachable: 'pi.no' },
  { fKey: 'pi.cmp.gen', neuro: 'pi.yes', udemy: 'pi.no', coursera: 'pi.no', teachable: 'pi.no' },
  { fKey: 'pi.cmp.talent', neuro: 'pi.cmp.v_royalties', udemy: 'pi.no', coursera: 'pi.no', teachable: 'pi.no' },
  { fKey: 'pi.cmp.nofees', neuro: 'pi.yes', udemy: 'pi.yes', coursera: 'pi.yes', teachable: 'pi.cmp.v_mensal' },
  { fKey: 'pi.cmp.payments', neuro: 'pi.cmp.v_24h', udemy: 'pi.cmp.v_30d', coursera: 'pi.cmp.v_60d', teachable: 'pi.cmp.v_30d' },
];

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations();
  const blocks = await getHomeBlocks(locale);
  return (
    <main className="min-h-screen" style={{ background: 'var(--paper)' }}>
      <PageHero
        icon={GraduationCap} badge={t('pi.badge')}
        title={t('pi.h1_pre')}
        titleAccent={t('pi.h1_accent')}
        subtitle={t('pi.hero_desc')}
      >
        <Link href={'/candidatar' as any} className="inline-flex items-center gap-2 px-6 py-3 text-white hover:scale-105 transition-all font-bold rounded-xl shadow-lg" style={{ background: 'linear-gradient(135deg, var(--accent), var(--accent-bright))' }}>
          {t('pi.cta_apply')} <ArrowRight className="h-4 w-4" />
        </Link>
      </PageHero>

      <section className="py-10 border-b" style={{ borderColor: 'var(--line)' }}>
        <PageWidth>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {STATS.map((s, i) => (
              <div key={i} className="rounded-2xl p-4 text-center" style={{ background: 'var(--card)', border: '1px solid var(--line)', boxShadow: 'var(--nl-surface-shadow)' }}>
                <div className="text-3xl sm:text-4xl font-bold" style={{ color: 'var(--accent)' }}>{s.value}</div>
                <div className="text-xs mt-1" style={{ color: 'var(--ink-2)' }}>{t(s.lKey)}</div>
              </div>
            ))}
          </div>
        </PageWidth>
      </section>

      <PageWidth py="py-20">
        <div className="text-center mb-12">
          <h2 className="t-h2" style={{ color: 'var(--ink)' }}>{t('pi.features_title')}</h2>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {FEATURES.map((f, i) => (
            <div key={i} className="group rounded-2xl p-6 transition-all hover:-translate-y-1" style={{ background: 'var(--card)', border: '1px solid var(--line)', boxShadow: 'var(--nl-surface-shadow)' }}>
              <div className="inline-flex h-12 w-12 rounded-xl text-white items-center justify-center mb-4 shadow-md group-hover:scale-110 transition-transform" style={{ background: `linear-gradient(135deg, var(--${f.fam}-base), var(--${f.fam}-deep))` }}>
                <f.icon className="h-6 w-6" />
              </div>
              <h3 className="t-h3 mb-1.5" style={{ color: 'var(--ink)' }}>{t(f.tKey)}</h3>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--ink-2)' }}>{t(f.dKey)}</p>
            </div>
          ))}
        </div>
      </PageWidth>

      <section className="py-20 border-y" style={{ background: 'color-mix(in srgb, var(--paper) 60%, var(--card))', borderColor: 'var(--line)' }}>
        <PageWidth>
          <div className="text-center mb-10">
            <h2 className="t-h2" style={{ color: 'var(--ink)' }}>{t('pi.compare_title')}</h2>
            <p className="mt-3" style={{ color: 'var(--ink-2)' }}>{t('pi.compare_sub')}</p>
          </div>
          <div className="overflow-x-auto rounded-3xl" style={{ background: 'var(--card)', border: '1px solid var(--line)', boxShadow: 'var(--nl-surface-shadow)' }}>
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: 'var(--accent-tint)', borderBottom: '1px solid var(--line)' }}>
                  <th className="text-left p-4 font-bold" style={{ color: 'var(--ink-2)' }}>{t('pi.col_feature')}</th>
                  <th className="p-4 font-bold" style={{ color: 'var(--accent)' }}>NeuroLearn</th>
                  <th className="p-4 font-bold" style={{ color: 'var(--ink-3)' }}>Udemy</th>
                  <th className="p-4 font-bold" style={{ color: 'var(--ink-3)' }}>Coursera</th>
                  <th className="p-4 font-bold" style={{ color: 'var(--ink-3)' }}>Teachable</th>
                </tr>
              </thead>
              <tbody>
                {COMPARE.map((r, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid var(--line)' }}>
                    <td className="p-4 font-semibold" style={{ color: 'var(--ink)' }}>{t(r.fKey)}</td>
                    <td className="p-4 text-center font-bold" style={{ color: 'var(--accent)', background: 'var(--accent-tint)' }}>{t(r.neuro)}</td>
                    <td className="p-4 text-center" style={{ color: 'var(--ink-2)' }}>{t(r.udemy)}</td>
                    <td className="p-4 text-center" style={{ color: 'var(--ink-2)' }}>{t(r.coursera)}</td>
                    <td className="p-4 text-center" style={{ color: 'var(--ink-2)' }}>{t(r.teachable)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </PageWidth>
      </section>

      <PageWidth py="py-20">
        <div className="relative overflow-hidden rounded-3xl p-10 sm:p-14 shadow-2xl text-center text-white" style={{ background: 'linear-gradient(135deg, var(--accent), var(--accent-bright))' }}>
          <h2 className="t-h2">{t('pi.cta_title')}</h2>
          <p className="mt-4 text-lg text-white/90 max-w-2xl mx-auto">{t('pi.cta_desc')}</p>
          <Link href={'/candidatar' as any} className="inline-flex items-center gap-2 px-8 py-3.5 mt-8 bg-white hover:scale-105 transition-all font-bold rounded-xl shadow-lg text-base" style={{ color: 'var(--accent)' }}>
            {t('pi.cta_apply2')} <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </PageWidth>
    </main>
  );
}
