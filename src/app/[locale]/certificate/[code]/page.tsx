import { notFound } from 'next/navigation';
import { Link } from '@/i18n/routing';
import { getTranslations } from 'next-intl/server';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '@/lib/supabase/config';
import { ShareButtons } from './ShareButtons';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface CertData {
  ok: boolean;
  certificate_number?: string;
  student_name?: string;
  course_title?: string;
  course_slug?: string;
  instructor_name?: string;
  issued_at?: string;
  language?: string;
  grade?: number;
  skills?: string[];
  verified_count?: number;
  error?: string;
}

async function getCert(code: string): Promise<CertData | null> {
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/nl_verify_certificate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({ p_code: code }),
      cache: 'no-store',
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: { params: { code: string; locale: string } }) {
  const cert = await getCert(params.code);
  if (!cert?.ok) return { title: 'Certificado não encontrado · NeuroLearn' };
  const title = `${cert.student_name} concluiu ${cert.course_title} · NeuroLearn`;
  const description = `Certificado verificado emitido pela NeuroLearn em ${cert.issued_at ? new Date(cert.issued_at).toLocaleDateString('pt-PT') : ''}.`;
  return {
    title,
    description,
    openGraph: { title, description, type: 'article', images: ['/api/og/certificate/' + params.code] },
    twitter: { card: 'summary_large_image', title, description },
  };
}

export default async function CertificatePage({ params }: { params: { code: string; locale: string } }) {
  const cert = await getCert(params.code);
  const t = await getTranslations('certificate');

  if (!cert?.ok) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md text-center">
          <div className="text-5xl mb-4">🔒</div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">{t('not_found_title')}</h1>
          <p className="text-slate-600 mb-6">{cert?.error === 'revoked' ? t('revoked_msg') : t('not_found_msg')}</p>
          <Link href={'/' as any} className="text-brand-600 hover:underline text-sm">{t('go_home')}</Link>
        </div>
      </div>
    );
  }

  const issuedDate = cert.issued_at ? new Date(cert.issued_at).toLocaleDateString('pt-PT', { day: 'numeric', month: 'long', year: 'numeric' }) : '';
  const verifyUrl = typeof window === 'undefined' ? `https://neurolearn-rosy.vercel.app/${params.locale}/certificate/${params.code}` : window.location.href;
  const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(verifyUrl)}&margin=10`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-white to-brand-50 py-6 px-4 sm:px-6">
      <div className="max-w-3xl mx-auto">
        {/* Top bar */}
        <div className="flex items-center justify-between mb-6">
          <Link href={'/' as any} className="text-sm text-slate-500 hover:text-brand-600 flex items-center gap-1">
            <span>←</span> NeuroLearn
          </Link>
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-200">
            <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
            {t('verified')}
          </span>
        </div>

        {/* Certificate card */}
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-200">
          {/* Decorative header */}
          <div className="bg-gradient-to-r from-brand-600 via-brand-500 to-purple-600 h-3" />

          <div className="p-6 sm:p-10 text-center relative">
            {/* Watermark logo */}
            <div className="absolute top-6 right-6 text-[10px] uppercase tracking-widest text-slate-400 font-semibold">
              NeuroLearn
            </div>

            <div className="text-xs uppercase tracking-[0.3em] text-slate-500 font-semibold mb-2">{t('header')}</div>
            <h1 className="text-3xl sm:text-4xl font-serif italic text-slate-900 mb-1">{t('certificate_of')}</h1>
            <div className="text-lg text-brand-600 font-semibold mb-8">{t('completion')}</div>

            <div className="text-xs text-slate-500 mb-2">{t('awarded_to')}</div>
            <div className="text-3xl sm:text-4xl font-bold text-slate-900 mb-8 font-serif">{cert.student_name}</div>

            <div className="text-xs text-slate-500 mb-2">{t('for_completing')}</div>
            <div className="text-xl sm:text-2xl font-semibold text-slate-800 mb-6 px-2">{cert.course_title}</div>

            {cert.skills && cert.skills.length > 0 && (
              <div className="flex flex-wrap justify-center gap-1.5 mb-6">
                {cert.skills.map(s => (
                  <span key={s} className="text-[11px] font-medium bg-slate-100 text-slate-700 px-2 py-1 rounded-full">{s}</span>
                ))}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4 mt-8 pt-6 border-t border-slate-200 text-left">
              <div>
                <div className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">{t('issued_on')}</div>
                <div className="text-sm font-semibold text-slate-900 mt-0.5">{issuedDate}</div>
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">{t('instructor')}</div>
                <div className="text-sm font-semibold text-slate-900 mt-0.5">{cert.instructor_name}</div>
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">{t('cert_number')}</div>
                <div className="text-sm font-mono text-slate-900 mt-0.5">{cert.certificate_number}</div>
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">{t('verifications')}</div>
                <div className="text-sm font-semibold text-slate-900 mt-0.5">{cert.verified_count}</div>
              </div>
            </div>

            <div className="mt-6 flex flex-col items-center gap-2">
              <img src={qrSrc} alt="QR code" width={120} height={120} className="rounded-lg border border-slate-200" />
              <div className="text-[10px] text-slate-400 font-mono break-all max-w-xs">{verifyUrl}</div>
            </div>
          </div>
        </div>

        {/* Share */}
        <ShareButtons url={verifyUrl} title={`${cert.student_name} · ${cert.course_title}`} />

        {/* Footer / verification info */}
        <div className="mt-8 bg-white/60 backdrop-blur rounded-xl p-4 text-xs text-slate-600 text-center border border-slate-200">
          <p>{t('verification_explainer')}</p>
        </div>
      </div>
    </div>
  );
}
