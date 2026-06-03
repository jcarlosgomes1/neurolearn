import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/sections/Footer';
import { createClient } from '@/lib/supabase/server';
import { getHomeBlocks } from '@/lib/api/home-blocks';
import { getTranslations } from 'next-intl/server';
import { CancelBookingButton } from './CancelBookingButton';

export default async function Page({ params }: { params: Promise<{ token: string; locale: string }> }) {
  const { token, locale } = await params;
  const t = await getTranslations();
  const sb = await createClient();
  const blocks = await getHomeBlocks(locale);
  const { data: res } = await sb.rpc('nl_scheduling_booking_by_token', { p_token: token });

  if (!res?.ok) {
    return (
      <>
        <Header />
        <main className="min-h-screen bg-white">
          <div className="max-w-md mx-auto px-4 py-20 text-center">
            <h1 className="text-2xl font-bold text-slate-900">404</h1>
            <p className="mt-3 text-slate-600">Marcação não encontrada.</p>
          </div>
        </main>
        <Footer data={blocks.footer_brand || {}} />
      </>
    );
  }

  const b = res.booking;
  const cancelled = b.status === 'cancelled';

  return (
    <>
      <Header />
      <main className="min-h-screen bg-slate-50">
        <div className="max-w-md mx-auto px-4 sm:px-6 py-10 sm:py-16">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 text-center">
            {cancelled ? (
              <>
                <div className="text-5xl mb-3">⊘</div>
                <h1 className="text-2xl font-bold text-slate-900">{t('sched.public.cancelled')}</h1>
              </>
            ) : (
              <>
                <div className="text-5xl mb-3">✓</div>
                <h1 className="text-2xl font-bold text-slate-900">{t('sched.public.success_title')}</h1>
                <p className="text-slate-600 mt-2 text-sm">{t('sched.public.success_body')}</p>
              </>
            )}

            <div className="mt-6 p-4 bg-slate-50 rounded-lg text-left space-y-2 text-sm">
              <div><span className="text-slate-500">{t('sched.public.with')}:</span> <strong>{b.host_name}</strong></div>
              <div><span className="text-slate-500">{b.link_title}</span></div>
              <div className="font-semibold text-slate-900 pt-2 border-t border-slate-200">
                {new Date(b.scheduled_at).toLocaleString('pt-PT', { dateStyle: 'full', timeStyle: 'short' })}
              </div>
              <div className="text-xs text-slate-500">{b.duration_min} min</div>
              {b.meeting_url && (
                <div className="pt-2 border-t border-slate-200">
                  <a href={b.meeting_url} target="_blank" rel="noreferrer" className="text-brand-700 font-medium hover:underline text-sm">
                    Link da reunião →
                  </a>
                </div>
              )}
            </div>

            {!cancelled && <CancelBookingButton bookingId={b.id} token={token} />}
          </div>
        </div>
      </main>
      <Footer data={blocks.footer_brand || {}} />
    </>
  );
}
