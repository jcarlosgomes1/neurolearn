'use client';

import { useState, useTransition } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { browseMarketplaceCoursesAction, subscribeCourseAction } from '../../marketplace-actions';
import { Search, BookOpen, Star, Users, X, Loader2, AlertCircle, CheckCircle, ShoppingCart } from 'lucide-react';

function fmt(cents: number, locale: string, currency: string) {
  return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(cents / 100);
}

export function MarketplaceCursosClient({ orgId, orgName, orgSlug, memberRole, featureEnabled, maxSeats, locale, initial }: {
  orgId: string; orgName: string; orgSlug: string; memberRole: string;
  featureEnabled: boolean; maxSeats: number; locale: string; initial: { total: number; courses: any[] };
}) {
  const t = useTranslations();
  const [courses, setCourses] = useState(initial.courses);
  const [total, setTotal] = useState(initial.total);
  const [search, setSearch] = useState('');
  const [pending, startTransition] = useTransition();
  const [subscribingCourse, setSubscribingCourse] = useState<any | null>(null);
  const canAct = ['owner','admin','manager'].includes(memberRole);

  function applyFilters() {
    startTransition(async () => {
      const r = await browseMarketplaceCoursesAction({ search });
      if (r.ok) { setCourses(r.courses); setTotal(r.total); }
    });
  }

  if (!featureEnabled) {
    return (
      <main className="bg-slate-50 min-h-screen">
        <div className="max-w-4xl mx-auto px-4 py-12">
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-8 text-center">
            <AlertCircle className="h-12 w-12 text-amber-500 mx-auto mb-3" />
            <h2 className="font-bold text-slate-900 text-lg mb-1">{t('org.mc.unavailable_h')}</h2>
            <p className="text-sm text-slate-600 mb-4">{t('org.mc.unavailable_p', { org: orgName })}</p>
            <Link href={`/empresa/${orgSlug}` as any} className="px-4 py-2 bg-slate-900 text-white text-sm rounded-lg inline-block">{t('btn.back')}</Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="bg-slate-50 min-h-screen">
      <section className="bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center gap-2 mb-2">
            <BookOpen className="h-6 w-6 text-brand-600" />
            <h1 className="text-2xl font-bold text-slate-900">{t('org.mc.title')}</h1>
          </div>
          <p className="text-sm text-slate-500">{t('org.mc.subtitle')}</p>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="bg-white border border-slate-200 rounded-xl p-4 mb-4 flex gap-3 items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
              placeholder={t('org.mc.search_ph')}
              className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm" />
          </div>
          <button onClick={applyFilters} disabled={pending}
            className="px-4 py-2 bg-slate-900 text-white text-sm font-medium rounded-lg disabled:opacity-50">
            {pending ? '…' : `${total}`}
          </button>
        </div>

        {courses.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
            <BookOpen className="h-12 w-12 text-slate-300 mx-auto mb-3" />
            <h3 className="font-semibold text-slate-900 mb-1">{t('org.mc.empty_h')}</h3>
            <p className="text-sm text-slate-500">{t('org.mc.empty_p')}</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {courses.map((c) => (
              <div key={c.id} className="bg-white border border-slate-200 rounded-xl overflow-hidden flex flex-col hover:shadow-md transition-shadow">
                <div className="aspect-video bg-gradient-to-br from-brand-100 to-violet-100 flex items-center justify-center text-5xl">
                  {c.cover_url ? <img src={c.cover_url} alt={c.title} className="w-full h-full object-cover" /> : (c.emoji || '📘')}
                </div>
                <div className="p-4 flex-1 flex flex-col">
                  <h3 className="font-bold text-slate-900 mb-1 line-clamp-2">{c.title}</h3>
                  {c.subtitle && <p className="text-xs text-slate-500 line-clamp-2 mb-2">{c.subtitle}</p>}
                  <div className="flex items-center gap-2 text-xs text-slate-500 mb-2">
                    {c.instructor_name && <span>{c.instructor_name}</span>}
                    {c.rating_avg && (<>
                      <span>·</span>
                      <span className="flex items-center gap-0.5"><Star className="h-3 w-3 fill-amber-400 text-amber-400" />{Number(c.rating_avg).toFixed(1)}</span>
                    </>)}
                    {c.enrollments_count > 0 && (<>
                      <span>·</span>
                      <span className="flex items-center gap-0.5"><Users className="h-3 w-3" />{c.enrollments_count}</span>
                    </>)}
                  </div>
                  <div className="mt-auto pt-3 border-t border-slate-100 flex items-center justify-between">
                    <div className="text-lg font-bold text-slate-900">{fmt(c.price_cents, locale, c.currency)}</div>
                    {canAct && (
                      <button onClick={() => setSubscribingCourse(c)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium rounded-lg">
                        <ShoppingCart className="h-3.5 w-3.5" /> {t('org.mc.subscribe_btn')}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {subscribingCourse && (
        <SubscribeModal course={subscribingCourse} orgId={orgId} orgSlug={orgSlug} maxSeats={maxSeats} locale={locale}
          onClose={() => setSubscribingCourse(null)} />
      )}
    </main>
  );
}

function SubscribeModal({ course, orgId, orgSlug, maxSeats, locale, onClose }: { course: any; orgId: string; orgSlug: string; maxSeats: number; locale: string; onClose: () => void }) {
  const t = useTranslations();
  const [pricingModel, setPricingModel] = useState<'per_seat'|'flat_fee'|'unlimited'>('per_seat');
  const [seats, setSeats] = useState(10);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<any | null>(null);

  const estimatedTotal = pricingModel === 'per_seat' ? course.price_cents * seats
    : pricingModel === 'flat_fee' ? course.price_cents * 10
    : course.price_cents * 50;

  function submit() {
    setError(null);
    if (pricingModel === 'per_seat' && (!seats || seats < 1)) return setError(t('org.mc.err_seats'));
    if (pricingModel === 'per_seat' && maxSeats > 0 && seats > maxSeats) return setError(t('org.mc.err_max', { max: maxSeats }));
    startTransition(async () => {
      const r = await subscribeCourseAction(orgId, course.id, pricingModel, pricingModel === 'per_seat' ? seats : undefined);
      if (r.ok) setSuccess(r);
      else setError(r.error || t('tea.error'));
    });
  }

  if (success) {
    return (
      <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
        <div className="bg-white max-w-md rounded-2xl p-6 text-center">
          <CheckCircle className="h-12 w-12 text-emerald-500 mx-auto mb-3" />
          <h3 className="font-bold text-slate-900 mb-1">{t('org.mc.success_h')}</h3>
          <p className="text-sm text-slate-600 mb-3">{t('org.mc.success_total', { total: fmt(success.total_cents, locale, course.currency) })}</p>
          <Link href={`/empresa/${orgSlug}/cursos-subscritos` as any} className="text-sm text-brand-600 hover:underline">
            {t('org.mc.manage_subs')}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl">
        <div className="border-b border-slate-100 p-4 flex items-center justify-between">
          <h2 className="font-semibold text-slate-900">{t('org.mc.modal_title')}</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-lg"><X className="h-4 w-4" /></button>
        </div>
        <div className="p-4 space-y-4">
          <div className="flex items-center gap-3">
            <div className="text-3xl">{course.emoji || '📘'}</div>
            <div>
              <h3 className="font-bold text-slate-900">{course.title}</h3>
              <p className="text-xs text-slate-500">{t('org.mc.base_price', { price: fmt(course.price_cents, locale, course.currency) })}</p>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">{t('org.mc.model_label')}</label>
            <div className="space-y-2">
              {[
                ['per_seat', t('org.mc.m_per_seat'), t('org.mc.m_per_seat_d')],
                ['flat_fee', t('org.mc.m_flat'), t('org.mc.m_flat_d')],
                ['unlimited', t('org.mc.m_unlimited'), t('org.mc.m_unlimited_d')],
              ].map(([k, label, desc]) => (
                <label key={k as string} className={`block p-3 rounded-lg border-2 cursor-pointer ${pricingModel === k ? 'border-brand-500 bg-brand-50' : 'border-slate-200'}`}>
                  <input type="radio" checked={pricingModel === k} onChange={() => setPricingModel(k as any)} className="hidden" />
                  <div className="font-medium text-slate-900 text-sm">{label as string}</div>
                  <div className="text-xs text-slate-500">{desc as string}</div>
                </label>
              ))}
            </div>
          </div>
          
          {pricingModel === 'per_seat' && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">{t('org.mc.seats_label')} {maxSeats > 0 && t('org.mc.seats_max', { max: maxSeats })}</label>
              <input type="number" value={seats} onChange={(e) => setSeats(parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg" min="1" />
            </div>
          )}
          
          <div className="p-3 bg-slate-50 rounded-lg">
            <div className="text-xs text-slate-500">{t('org.mc.est_total')}</div>
            <div className="text-2xl font-bold text-slate-900">{fmt(estimatedTotal, locale, course.currency)}</div>
            <div className="text-xs text-slate-500 mt-1">
              {t('org.mc.split', { instructor: fmt(estimatedTotal * 0.70, locale, course.currency), platform: fmt(estimatedTotal * 0.30, locale, course.currency) })}
            </div>
          </div>
          
          {error && <div className="p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">{error}</div>}
        </div>
        <div className="border-t border-slate-100 p-4 flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg text-sm">{t('btn.cancel')}</button>
          <button onClick={submit} disabled={pending}
            className="inline-flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-sm font-medium disabled:opacity-50">
            {pending && <Loader2 className="h-4 w-4 animate-spin" />}
            {t('org.mc.confirm_btn')}
          </button>
        </div>
      </div>
    </div>
  );
}
