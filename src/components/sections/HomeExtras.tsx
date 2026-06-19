import { Link } from '@/i18n/routing';
import { getTranslations, getLocale } from 'next-intl/server';
import { createClient } from '@/lib/supabase/server';
import { CategoryCard } from '@/components/sections/CategoryCard';
import {
  Building2, Sparkles, Award, Compass, ArrowRight,
  Brain, Code, Briefcase, Palette, BarChart3, Megaphone, Globe2, Heart,
  TrendingUp, Users, BookOpen, Star
} from 'lucide-react';

// ============= TRUSTED BY (logos strip) =============
export async function TrustedByStrip() {
  const t = await getTranslations();
  const COMPANIES = ['Healthcare Group', 'TechCorp', 'FinanceHub', 'RetailChain', 'ConsultingFirm', 'StartupHub'];
  return (
    <section className="bg-slate-50/60 border-y border-slate-200/60 py-10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <p className="text-xs uppercase tracking-wider font-bold text-slate-500 mb-4">
          {t('hx.trusted_title')}
        </p>
        <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 sm:gap-x-12 opacity-60 text-slate-700 font-bold text-sm sm:text-base">
          {COMPANIES.map((c) => (
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
  const STEPS = [
    { num: '01', icon: Compass, titleKey: 'hx.step1_title', descKey: 'hx.step1_desc', cls: 'from-violet-500 to-indigo-600' },
    { num: '02', icon: Brain, titleKey: 'hx.step2_title', descKey: 'hx.step2_desc', cls: 'from-emerald-500 to-teal-600' },
    { num: '03', icon: Award, titleKey: 'hx.step3_title', descKey: 'hx.step3_desc', cls: 'from-amber-500 to-orange-600' },
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
          {STEPS.map((s) => (
            <div key={s.num} className="group relative bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 hover:-translate-y-1 hover:shadow-2xl transition-all">
              <div className={`absolute top-0 right-0 h-32 w-32 rounded-full bg-gradient-to-br ${s.cls} opacity-5 blur-2xl group-hover:opacity-15 transition-opacity`} />
              <div className="relative">
                <div className="flex items-center justify-between mb-4">
                  <div className={`inline-flex h-14 w-14 rounded-2xl bg-gradient-to-br ${s.cls} text-white items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
                    <s.icon className="h-7 w-7" />
                  </div>
                  <span className={`text-4xl font-black bg-gradient-to-br ${s.cls} bg-clip-text text-transparent opacity-30`}>{s.num}</span>
                </div>
                <h3 className="font-bold text-lg text-slate-900 mb-2">{t(s.titleKey)}</h3>
                <p className="text-sm text-slate-600 leading-relaxed">{t(s.descKey)}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ============= CATEGORIES GRID =============
export async function CategoriesGrid() {
  const t = await getTranslations();
  const sb = await createClient();
  const { data: ccsRaw } = await sb.rpc('nl_platform_config_get', { p_key: 'category_card_style' });
  let cardVariant: any = 'icon-tl-brand'; let cardArrow = true;
  try { const cfg = ccsRaw ? JSON.parse(ccsRaw as string) : null; if (cfg) { cardVariant = cfg.variant || cardVariant; cardArrow = cfg.arrow_on_clickable !== false; } } catch {}
  const CATS = [
    { nameKey: 'hx.cat_prog', icon: Code, countKey: 'hx.cnt_prog', href: '/cursos?cat=programacao', cls: 'from-violet-500 to-indigo-600' },
    { nameKey: 'hx.cat_data', icon: BarChart3, countKey: 'hx.cnt_data', href: '/cursos?cat=data', cls: 'from-blue-500 to-cyan-600' },
    { nameKey: 'hx.cat_design', icon: Palette, countKey: 'hx.cnt_design', href: '/cursos?cat=design', cls: 'from-fuchsia-500 to-pink-600' },
    { nameKey: 'hx.cat_mkt', icon: Megaphone, countKey: 'hx.cnt_mkt', href: '/cursos?cat=marketing', cls: 'from-amber-500 to-orange-600' },
    { nameKey: 'hx.cat_biz', icon: Briefcase, countKey: 'hx.cnt_biz', href: '/cursos?cat=business', cls: 'from-emerald-500 to-teal-600' },
    { nameKey: 'hx.cat_ai', icon: Sparkles, countKey: 'hx.cnt_ai', href: '/cursos?cat=ai', cls: 'from-purple-500 to-violet-600' },
    { nameKey: 'hx.cat_lang', icon: Globe2, countKey: 'hx.cnt_lang', href: '/cursos?cat=linguas', cls: 'from-rose-500 to-red-600' },
    { nameKey: 'hx.cat_well', icon: Heart, countKey: 'hx.cnt_well', href: '/cursos?cat=wellness', cls: 'from-pink-500 to-rose-600' },
  ];
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
          {CATS.map((c) => (
            <CategoryCard
              key={c.nameKey}
              name={t(c.nameKey)}
              count={t(c.countKey)}
              Icon={c.icon}
              href={c.href}
              cls={c.cls}
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
  const locale = await getLocale();
  const SIGNUPS = [
    { name: 'Marina', role: 'Product Designer', city: 'Lisboa', whenKey: 'hx.when1' },
    { name: 'Tiago', role: 'Backend Eng', city: 'Porto', whenKey: 'hx.when2' },
    { name: 'Sofia', role: 'Data Analyst', city: 'São Paulo', whenKey: 'hx.when3' },
    { name: 'Diogo', role: 'Marketing Mgr', city: 'Madrid', whenKey: 'hx.when4' },
  ];
  const TOP_COURSES = [
    { titleKey: 'hx.tc1', Icon: Code, enrolled: 1240, cls: 'from-yellow-500 to-amber-600' },
    { titleKey: 'hx.tc2', Icon: Palette, enrolled: 980, cls: 'from-fuchsia-500 to-pink-600' },
    { titleKey: 'hx.tc3', Icon: Brain, enrolled: 1850, cls: 'from-violet-500 to-indigo-600' },
  ];
  return (
    <section className="relative py-20 sm:py-24 bg-white overflow-hidden">
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[500px] w-[500px] rounded-full bg-gradient-to-br from-emerald-400/5 to-blue-400/5 blur-3xl" />
      </div>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-700 mb-4">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" /> {t('hx.live_badge')}
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 tracking-tight">
            {t('hx.live_h2a')} <span className="bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent">{t('hx.live_h2b')}</span>
          </h2>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Recent signups */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm">
            <div className="flex items-center justify-between mb-5">
              <div>
                <div className="text-xs uppercase tracking-wider font-bold text-emerald-600 mb-1">{t('hx.live_signups_label')}</div>
                <div className="font-bold text-slate-900">{t('hx.live_signups_title')}</div>
              </div>
              <div className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2 py-1 rounded-full text-xs font-bold">
                <TrendingUp className="h-3 w-3" /> {t('hx.live_today')}
              </div>
            </div>
            <div className="space-y-2">
              {SIGNUPS.map((s, i) => (
                <div key={i} className="flex items-center gap-3 bg-slate-50/60 rounded-xl p-3 hover:bg-slate-50 transition-colors">
                  <div className="flex-shrink-0 h-9 w-9 rounded-full bg-gradient-to-br from-violet-400 to-indigo-600 text-white font-bold text-sm flex items-center justify-center">
                    {s.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm text-slate-900 truncate">{s.name} · <span className="text-slate-600 font-normal">{s.role}</span></div>
                    <div className="text-[11px] text-slate-500">{s.city} · {t(s.whenKey)}</div>
                  </div>
                  <Users className="h-4 w-4 text-slate-300" />
                </div>
              ))}
            </div>
          </div>

          {/* Top courses */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm">
            <div className="flex items-center justify-between mb-5">
              <div>
                <div className="text-xs uppercase tracking-wider font-bold text-amber-600 mb-1">{t('hx.live_feat_label')}</div>
                <div className="font-bold text-slate-900">{t('hx.live_feat_title')}</div>
              </div>
              <div className="inline-flex items-center gap-1 text-amber-700 bg-amber-50 px-2 py-1 rounded-full text-xs font-bold">
                <Star className="h-3 w-3 fill-amber-500" /> {t('hx.live_trending')}
              </div>
            </div>
            <div className="space-y-2">
              {TOP_COURSES.map((c, i) => (
                <Link key={i} href={'/cursos' as any}
                  className="flex items-center gap-3 bg-slate-50/60 rounded-xl p-3 hover:bg-slate-50 transition-all group">
                  <div className={`flex-shrink-0 h-11 w-11 rounded-xl bg-gradient-to-br ${c.cls} text-white flex items-center justify-center text-xl shadow-sm group-hover:scale-110 transition-transform`}>
                    <c.Icon className="h-5 w-5" strokeWidth={1.75} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm text-slate-900 truncate">{t(c.titleKey)}</div>
                    <div className="text-[11px] text-slate-500">{c.enrolled.toLocaleString(locale)} {t('hx.live_enrolled')}</div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-slate-300 group-hover:text-slate-700 group-hover:translate-x-1 transition-all" />
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
