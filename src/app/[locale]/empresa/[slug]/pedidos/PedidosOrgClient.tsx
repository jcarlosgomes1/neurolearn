'use client';

import { useState, useTransition } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { acceptInquiryAction, listInquiriesForOrgAction } from '../corporate-actions';
import { Inbox, Clock, CheckCircle, XCircle, Send, Loader2, Calendar, Briefcase, AlertCircle } from 'lucide-react';
import { AppPageHeader } from '@/components/layout/AppPageHeader';

const STATUS_BADGES: Record<string, { labelKey: string; className: string; icon: any }> = {
  pending: { labelKey: 'org.ped.st_pending', className: 'bg-amber-100 text-amber-800', icon: Clock },
  quoted: { labelKey: 'org.ped.st_quoted', className: 'bg-blue-100 text-blue-800', icon: AlertCircle },
  accepted: { labelKey: 'org.ped.st_accepted', className: 'bg-emerald-100 text-emerald-800', icon: CheckCircle },
  scheduled: { labelKey: 'org.ped.st_scheduled', className: 'bg-brand-100 text-brand-800', icon: Calendar },
  in_delivery: { labelKey: 'org.ped.st_in_delivery', className: 'bg-brand-100 text-brand-800', icon: Calendar },
  completed: { labelKey: 'org.ped.st_completed', className: 'bg-slate-100 text-slate-700', icon: CheckCircle },
  cancelled: { labelKey: 'org.ped.st_cancelled', className: 'bg-slate-100 text-slate-500', icon: XCircle },
  rejected: { labelKey: 'org.ped.st_rejected', className: 'bg-red-100 text-red-700', icon: XCircle },
};

function fmt(cents: number | null | undefined, locale: string, currency = 'EUR') {
  if (cents == null) return '—';
  return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(cents / 100);
}

export function PedidosOrgClient({ orgId, orgName, orgSlug, memberRole, locale, inquiries: initial }: {
  orgId: string; orgName: string; orgSlug: string; memberRole: string; locale: string; inquiries: any[];
}) {
  const t = useTranslations();
  const [inquiries, setInquiries] = useState(initial);
  const [filter, setFilter] = useState('');
  const [pending, startTransition] = useTransition();

  const filtered = filter ? inquiries.filter(i => i.status === filter) : inquiries;
  const canAct = ['owner', 'admin', 'manager'].includes(memberRole);

  async function reload() {
    const r = await listInquiriesForOrgAction(orgId, filter || undefined);
    if (r.ok) setInquiries(r.inquiries);
  }

  async function handleAccept(id: string, priceCents: number, currency: string) {
    if (!confirm(t('org.ped.accept_confirm', { amount: fmt(priceCents, locale, currency) }))) return;
    startTransition(async () => {
      const r = await acceptInquiryAction(id);
      if (r.ok) reload();
      else alert(t('org.cl.error_generic', { error: r.error || 'unknown' }));
    });
  }

  const FILTERS: Array<[string, string]> = [['', 'org.ped.f_all'], ['pending', 'org.ped.f_pending'], ['quoted', 'org.ped.f_quoted'], ['accepted', 'org.ped.f_accepted'], ['completed', 'org.ped.f_completed']];

  return (
    <main className="bg-slate-50 min-h-screen">
      <div className="max-w-6xl mx-auto px-4 pt-6">
        <AppPageHeader title={t('org.ped.title')} description={t('org.ped.subtitle')} actions={
          <Link href={`/empresa/${orgSlug}/marketplace/instrutores` as any}
            className="inline-flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium rounded-lg">
            <Briefcase className="h-4 w-4" /> {t('org.ped.browse')}
          </Link>
        } />
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
          {FILTERS.map(([k, label]) => (
            <button key={k} onClick={() => { setFilter(k); }}
              className={`px-3 py-1.5 text-sm font-medium rounded-lg whitespace-nowrap ${filter === k ? 'bg-slate-900 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
              {t(label)}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
            <Inbox className="h-12 w-12 text-slate-300 mx-auto mb-3" />
            <h3 className="font-semibold text-slate-900 mb-1">{t('org.ped.empty_h')}</h3>
            <p className="text-sm text-slate-500 mb-4">{t('org.ped.empty_p')}</p>
            <Link href={`/empresa/${orgSlug}/marketplace/instrutores` as any}
              className="inline-flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium rounded-lg">
              <Briefcase className="h-4 w-4" /> {t('org.ped.browse')}
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((i) => {
              const badge = STATUS_BADGES[i.status] || STATUS_BADGES.pending;
              const Icon = badge.icon;
              return (
                <div key={i.id} className="bg-white border border-slate-200 rounded-xl p-5">
                  <div className="flex items-start justify-between gap-3 flex-wrap mb-3">
                    <div className="flex items-center gap-3">
                      {i.instructor_avatar ? (
                        <img src={i.instructor_avatar} alt={i.instructor_name} className="h-10 w-10 rounded-full object-cover" />
                      ) : (
                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-brand-500 to-brand-600 text-white flex items-center justify-center font-bold text-sm">
                          {i.instructor_name?.charAt(0)?.toUpperCase() || '?'}
                        </div>
                      )}
                      <div>
                        <div className="font-semibold text-slate-900">{i.instructor_name}</div>
                        {i.service_title && <div className="text-xs text-slate-500">{i.service_title}</div>}
                      </div>
                    </div>
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${badge.className}`}>
                      <Icon className="h-3 w-3" /> {t(badge.labelKey)}
                    </span>
                  </div>
                  
                  <p className="text-sm text-slate-700 mb-3 whitespace-pre-wrap line-clamp-3">{i.message}</p>
                  
                  {i.quoted_price_cents && (
                    <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 mb-3">
                      <div className="font-bold text-blue-900 text-lg">{fmt(i.quoted_price_cents, locale, i.quoted_currency)}</div>
                      {i.quoted_notes && <div className="text-sm text-blue-700 mt-1">{i.quoted_notes}</div>}
                      {i.quoted_valid_until && (
                        <div className="text-xs text-blue-600 mt-2">{t('org.ped.valid_until', { date: new Date(i.quoted_valid_until).toLocaleDateString(locale) })}</div>
                      )}
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between text-xs text-slate-500 pt-3 border-t border-slate-100">
                    <span>{t('org.ped.created', { date: new Date(i.created_at).toLocaleDateString(locale) })}</span>
                    {i.status === 'quoted' && canAct && (
                      <button onClick={() => handleAccept(i.id, i.quoted_price_cents, i.quoted_currency)} disabled={pending}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg disabled:opacity-50">
                        <CheckCircle className="h-4 w-4" /> {t('org.ped.accept_btn')}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
