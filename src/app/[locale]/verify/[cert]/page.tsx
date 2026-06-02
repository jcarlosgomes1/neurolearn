import { Header } from '@/components/layout/Header';
import { Link } from '@/i18n/routing';
import { fmtDate } from '@/lib/utils/cn';
import { SUPABASE_URL } from '@/lib/supabase/config';
import { getTranslations } from 'next-intl/server';

export const dynamic = 'force-dynamic';

export async function generateMetadata() {
  const t = await getTranslations();
  return { title: t('verify.meta_title') };
}

export default async function VerifyPage({ params }: { params: Promise<{ cert: string }> }) {
  const { cert } = await params;
  const t = await getTranslations();
  let result: any = null;
  try {
    const res = await fetch(`${SUPABASE_URL}/functions/v1/agent-ops`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'verify_certificate', payload: { certificate_number: cert } }),
      cache: 'no-store',
    });
    result = await res.json();
  } catch { result = { ok: false }; }

  const valid = result?.valid && result?.certificate;

  return (
    <>
      <Header />
      <main className="min-h-[80vh] flex items-center justify-center bg-slate-50 p-4">
        <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200 shadow-sm p-8 text-center animate-fade-in">
          {valid ? (
            <>
              <div className="text-6xl mb-3">✅</div>
              <h1 className="text-2xl font-bold text-emerald-700">{t('verify.title_valid')}</h1>
              <div className="mt-6 space-y-3 text-left bg-slate-50 rounded-lg p-4">
                <Row label={t('verify.row_number')} value={result.certificate.certificate_number} mono />
                <Row label={t('verify.row_recipient')} value={result.certificate.recipient_name} />
                <Row label={t('verify.row_course')} value={result.certificate.course_title} />
                <Row label={t('verify.row_issued')} value={fmtDate(result.certificate.issued_at)} />
              </div>
              <p className="mt-6 text-xs text-slate-500">{t('verify.issued_by')}</p>
            </>
          ) : (
            <>
              <div className="text-6xl mb-3">❌</div>
              <h1 className="text-2xl font-bold text-rose-700">{t('verify.title_invalid')}</h1>
              <p className="mt-3 text-sm text-slate-600">{t('verify.not_found_pre')} <span className="font-mono">{cert}</span> {t('verify.not_found_post')}</p>
            </>
          )}
          <Link href="/" className="mt-8 inline-block text-sm text-brand-600 hover:underline">{t('verify.back_home')}</Link>
        </div>
      </main>
    </>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <div className="text-xs text-slate-500">{label}</div>
      <div className={mono ? 'font-mono text-sm font-semibold' : 'font-medium'}>{value}</div>
    </div>
  );
}
