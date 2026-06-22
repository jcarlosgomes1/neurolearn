'use client';

import { useState, useTransition } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { enrollUserInCourseAction, listOrgSubscriptionsAction } from '../marketplace-actions';
import { BookOpen, Users, UserPlus, Loader2, X, ShoppingCart } from 'lucide-react';

function fmt(cents: number, locale: string, currency: string) {
  return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(cents / 100);
}

const SUB_STATUS_KEY: Record<string,string> = { active: 'org.sub.st_active', expired: 'org.sub.st_expired' };

export function CursosSubscritosClient({ orgId, orgSlug, memberRole, members, locale, subscriptions: initial }: {
  orgId: string; orgSlug: string; memberRole: string; members: any[]; locale: string; subscriptions: any[];
}) {
  const t = useTranslations();
  const [subs, setSubs] = useState(initial);
  const [enrolling, setEnrolling] = useState<any | null>(null);
  const canAct = ['owner','admin','manager'].includes(memberRole);

  async function reload() {
    const r = await listOrgSubscriptionsAction(orgId);
    if (r.ok) setSubs(r.subscriptions);
  }

  return (
    <main className="bg-slate-50 min-h-screen">
      <section className="bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 py-6 flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <BookOpen className="h-6 w-6 text-brand-600" />
              <h1 className="font-display text-2xl font-bold text-slate-900">{t('org.sub.title')}</h1>
            </div>
            <p className="text-sm text-slate-500">{t('org.sub.subtitle')}</p>
          </div>
          <Link href={`/empresa/${orgSlug}/marketplace/cursos` as any}
            className="inline-flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium rounded-lg">
            <ShoppingCart className="h-4 w-4" /> {t('org.sub.browse')}
          </Link>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 py-6">
        {subs.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
            <BookOpen className="h-12 w-12 text-slate-300 mx-auto mb-3" />
            <h3 className="font-semibold text-slate-900 mb-1">{t('org.sub.empty_h')}</h3>
            <p className="text-sm text-slate-500 mb-4">{t('org.sub.empty_p')}</p>
            <Link href={`/empresa/${orgSlug}/marketplace/cursos` as any} className="inline-flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium rounded-lg">
              <ShoppingCart className="h-4 w-4" /> {t('org.sub.browse')}
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {subs.map((s) => (
              <div key={s.id} className="bg-white border border-slate-200 rounded-xl p-5">
                <div className="flex items-start justify-between gap-3 flex-wrap mb-3">
                  <div className="flex items-center gap-3">
                    <div className="text-3xl">{s.course_emoji || '📘'}</div>
                    <div>
                      <h3 className="font-bold text-slate-900">{s.course_title}</h3>
                      <p className="text-xs text-slate-500">{s.instructor_name} · {s.pricing_model}</p>
                    </div>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                    s.status === 'active' ? 'bg-emerald-100 text-emerald-800' :
                    s.status === 'expired' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-600'
                  }`}>{SUB_STATUS_KEY[s.status] ? t(SUB_STATUS_KEY[s.status]) : s.status}</span>
                </div>
                
                <div className="grid grid-cols-3 gap-3 mb-3 text-sm">
                  <div><div className="text-xs text-slate-500">{t('org.sub.total')}</div><div className="font-semibold">{fmt(s.total_price_cents, locale, s.currency)}</div></div>
                  <div><div className="text-xs text-slate-500">{t('org.sub.seats')}</div><div className="font-semibold">{s.seats_used} / {s.seats_purchased || '∞'}</div></div>
                  <div><div className="text-xs text-slate-500">{t('org.sub.instructor')}</div><div className="font-semibold">{fmt(s.instructor_payout_cents, locale, s.currency)}</div></div>
                </div>
                
                {canAct && s.status === 'active' && (s.pricing_model === 'unlimited' || s.seats_used < s.seats_purchased) && (
                  <div className="pt-3 border-t border-slate-100">
                    <button onClick={() => setEnrolling(s)}
                      className="inline-flex items-center gap-2 px-3 py-1.5 bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium rounded-lg">
                      <UserPlus className="h-4 w-4" /> {t('org.sub.enrol_user')}
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {enrolling && (
        <EnrollModal subscription={enrolling} members={members}
          onClose={() => setEnrolling(null)} onEnrolled={() => { setEnrolling(null); reload(); }} />
      )}
    </main>
  );
}

function EnrollModal({ subscription, members, onClose, onEnrolled }: { subscription: any; members: any[]; onClose: () => void; onEnrolled: () => void }) {
  const t = useTranslations();
  const [selectedUser, setSelectedUser] = useState('');
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function submit() {
    setError(null);
    if (!selectedUser) return setError(t('org.sub.pick_member'));
    startTransition(async () => {
      const r = await enrollUserInCourseAction(subscription.id, selectedUser);
      if (r.ok) onEnrolled();
      else setError(r.error || t('tea.error'));
    });
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl">
        <div className="border-b border-slate-100 p-4 flex items-center justify-between">
          <h2 className="font-semibold text-slate-900">{t('org.sub.enrol_user')}</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-lg"><X className="h-4 w-4" /></button>
        </div>
        <div className="p-4 space-y-3">
          <p className="text-sm text-slate-600">{t('org.sub.course_label')} <strong>{subscription.course_title}</strong></p>
          <select value={selectedUser} onChange={(e) => setSelectedUser(e.target.value)}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white">
            <option value="">{t('org.sub.pick_placeholder')}</option>
            {members.map((m) => (
              <option key={m.user_id} value={m.user_id}>{m.name || m.user_id}</option>
            ))}
          </select>
          {error && <div className="p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">{error}</div>}
        </div>
        <div className="border-t border-slate-100 p-4 flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg text-sm">{t('btn.cancel')}</button>
          <button onClick={submit} disabled={pending}
            className="inline-flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-sm font-medium disabled:opacity-50">
            {pending && <Loader2 className="h-4 w-4 animate-spin" />}
            {t('org.sub.enrol_btn')}
          </button>
        </div>
      </div>
    </div>
  );
}
