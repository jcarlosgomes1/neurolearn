import { Link } from '@/i18n/routing';
import { getTranslations, getLocale } from 'next-intl/server';
import { createClient } from '@/lib/supabase/server';
import { CategoryCard } from '@/components/sections/CategoryCard';
import { categoryIcon } from '@/lib/category-icons';
import { getIconPalette } from '@/lib/ui/icon-palette';
import {
  Building2, Sparkles, Award, Compass, ArrowRight,
  Brain, Code, Briefcase, Palette, BarChart3, Megaphone, Globe2, Heart,
  TrendingUp, Users, BookOpen, Star
} from 'lucide-react';

// ============= TRUSTED BY (logos strip) =============
export async function TrustedByStrip() {
  const sb = await createClient();
  const locale = await getLocale();
  const { data: capsRaw } = await sb.rpc('nl_home_capabilities', { p_lang: locale });
  const caps: any = capsRaw || {};
  const items: string[] = Array.isArray(caps.items) ? caps.items : [];
  if (items.length === 0) return null;
  return (
    <section className="bg-slate-50/60 border-y border-slate-200/60 py-10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {caps.heading && (
          <p className="text-xs uppercase tracking-wider font-bold text-slate-500 mb-4">
            {caps.heading}
          </p>
        )}
        <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 sm:gap-x-12 opacity-60 text-slate-700 font-bold text-sm sm:text-base">
          {items.map((c) => (
            <span key={c} className="inline-flex items-center gap-1.5 hover:opacity-100 transition-opacity">
              <span className="h-2 w-2 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600" />
              {c}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

// ============= HOW IT WORKS (3 steps) =============
export async function HowItWorksSection() {
  const t = await getTranslations();
  const palette = await getIconPalette();
  const STEPS = [
    { num: '01', icon: Compass, titleKey: 'hx.step1_title', descKey: 'hx.step1_desc' },
    { num: '02', icon: Brain, titleKey: 'hx.step2_title', descKey: 'hx.step2_desc' },
    { num: '03', icon: Award, titleKey: 'hx.step3_title', descKey: 'hx.step3_desc' },
  ];
  return (
    <section className="relative py-20 sm:py-24 bg-white overflow-hidden">
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-20 -left-20 h-80 w-80 rounded-full bg-violet-400/5 blur-3xl" />
        <div className="absolute bottom-20 -right-20 h-80 w-80 rounded-full bg-emerald-400/5 blur-3xl" />
      </div>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-violet-50 border border-violet-200 text-xs font-semibold text-violet-700 mb-4">
            <Sparkles className="h-3.5 w-3.5" /> {t('hx.how_badge')}
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 tracking-tight">
            {t('hx.how_h2a')} <span className="bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">{t('hx.how_h2b')}</span>
          </h2>
          <p className="mt-3 text-slate-600 max-w-2xl mx-auto">{t('hx.how_sub')}</p>
        </div>
        <div className="grid sm:grid-cols-3 gap-4 sm:gap-6">
          {STEPS.map((s, i) => { const g = palette[i % palette.length]; return (
            <div key={s.num} className="group relative bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 hover:-translate-y-1 hover:shadow-2xl transition-all">
              <div className="absolute top-0 right-0 h-32 w-32 rounded-full opacity-5 blur-2xl group-hover:opacity-15 transition-opacity" style={{ backgroundImage: `linear-gradient(to bottom right, ${g.from}, ${g.to})` }} />
              <div className="relative">
                <div className="flex items-center justify-between mb-4">
                  <div className="inline-flex h-14 w-14 rounded-2xl text-white items-center justify-center shadow-lg group-hover:scale-110 transition-transform" style={{ backgroundImage: `linear-gradient(to bottom right, ${g.from}, ${g.to})` }}>
                    <s.icon className="h-7 w-7" />
                  </div>
                  <span className="text-4xl font-black text-transparent opacity-30" style={{ backgroundImage: `linear-gradient(to bottom right, ${g.from}, ${g.to})`, WebkitBackgroundClip: 'text', backgroundClip: 'text' }}>{s.num}</span>
                </div>
                <h3 className="font-bold text-lg text-slate-900 mb-2">{t(s.titleKey)}</h3>
                <p className="text-sm text-slate-600 leading-relaxed">{t(s.descKey)}</p>
              </div>
            </div>
          ); })}
        </div>
      </div>
    </section>
  );
}

// ============= CATEGORIES GRID =============
export async function CategoriesGrid() {
  const t = await getTranslations();
  const sb = await createClient();
  const locale = await getLocale();
  const { data: ccsRaw } = await sb.rpc('nl_platform_config_get', { p_key: 'category_card_style' });
  let cardVariant: any = 'icon-tl-brand'; let cardArrow = true;
  try { const cfg = ccsRaw ? JSON.parse(ccsRaw as string) : null; if (cfg) { cardVariant = cfg.variant || cardVariant; cardArrow = cfg.arrow_on_clickable !== false; } } catch {}
  const { data: catsRaw } = await sb.rpc('nl_course_categories_with_counts', { p_lang: locale, p_b2c: true });
  const cats: { slug: string; icon: string; name: string; count: number; href: string }[] = Array.isArray(catsRaw) ? catsRaw : [];
  return (
    <section className="bg-slate-50 py-20 sm:py-24 border-y border-slate-200/60">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-slate-200 text-xs font-semibold text-slate-700 mb-4 shadow-sm">
            <BookOpen className="h-3.5 w-3.5" /> {t('hx.cat_badge')}
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 tracking-tight">
            {t('hx.cat_h2a')} <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">{t('hx.cat_h2b')}</span>
          </h2>
          <p className="mt-3 text-slate-600 max-w-2xl mx-auto">{t('hx.cat_sub')}</p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {cats.map((c) => (
            <CategoryCard
              key={c.slug}
              name={c.name}
              count={t('hx.cat_count', { n: c.count })}
              Icon={categoryIcon(c.icon)}
              href={c.href}
              variant={cardVariant}
              arrow={cardArrow}
            />
          ))}
        </div>
        <div className="text-center mt-8">
          <Link href={'/cursos' as any} className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-900 hover:gap-2.5 transition-all">
            {t('hx.cat_explore')} <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}

// ============= LIVE MOMENTUM =============
export async function LiveMomentumSection() {
  const t = await getTranslations();
  const sb = await createClient();
  const locale = await getLocale();
  const cntRes = await sb.rpc('nl_platform_config_get', { p_key: 'home_featured_count' });
  let lim = 6;
  try { const n = parseInt((cntRes.data as string) || '6', 10); if (!Number.isNaN(n) && n > 0) lim = n; } catch {}
  const { data: fcRaw } = await sb.rpc('nl_home_featured_courses', { p_lang: locale, p_limit: lim });
  const fc: any = fcRaw || {};
  const items: any[] = Array.isArray(fc.items) ? fc.items : [];
  const enrollMin: number = typeof fc.enroll_min === 'number' ? fc.enroll_min : 25;
  if (items.length === 0) return null;
  return (
    <section className="relative py-20 sm:py-24 bg-white overflow-hidden">
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[500px] w-[500px] rounded-full bg-gradient-to-br from-amber-400/5 to-orange-400/5 blur-3xl" />
      </div>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-xs font-semibold text-amber-700 mb-4">
            <Star className="h-3.5 w-3.5 fill-amber-500" /> {t('hx.feat_badge')}
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 tracking-tight">
            {t('hx.feat_h2a')} <span className="bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">{t('hx.feat_h2b')}</span>
          </h2>
          <p className="mt-3 text-slate-600 max-w-2xl mx-auto">{t('hx.feat_sub')}</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((c: any) => {
            const Icon = categoryIcon(c.icon);
            const showCount = typeof c.enrolled === 'number' && c.enrolled >= enrollMin;
            return (
              <Link key={c.id} href={`/curso/${c.id}` as any}
                className="group flex items-center gap-4 bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-xl hover:-translate-y-0.5 transition-all">
                <div className="flex-shrink-0 h-12 w-12 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 text-white flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                  <Icon className="h-5 w-5" strokeWidth={1.75} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[11px] uppercase tracking-wider font-bold text-slate-400 mb-0.5 truncate">{c.cat}</div>
                  <div className="font-semibold text-slate-900 truncate group-hover:text-violet-700 transition-colors">{c.title}</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    {showCount ? `${Number(c.enrolled).toLocaleString(locale)} ${t('hx.live_enrolled')}` : t('hx.feat_new')}
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-slate-300 group-hover:text-slate-700 group-hover:translate-x-1 transition-all" />
              </Link>
            );
          })}
        </div>
        <div className="text-center mt-8">
          <Link href={'/cursos' as any} className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-900 hover:gap-2.5 transition-all">
            {t('hx.feat_explore')} <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
