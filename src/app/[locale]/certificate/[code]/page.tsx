import { createClient } from '@supabase/supabase-js';
import { getTranslations } from 'next-intl/server';
import type { Metadata } from 'next';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '@/lib/supabase/config';
import { getPlatformBrand } from '@/lib/platform-brand';
import ShareButtons from './ShareButtons';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

type VerifyResult = {
  ok: boolean;
  error?: string;
  certificate_number?: string;
  verification_code?: string;
  student_name?: string;
  course_title?: string;
  course_slug?: string;
  instructor_name?: string;
  course_level?: string;
  issued_at?: string;
  verified_count?: number;
  skills?: string[];
  grade?: number | null;
  revoked_at?: string;
};

function getSupabase() {
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

async function verifyCert(code: string): Promise<VerifyResult | null> {
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase.rpc('nl_verify_certificate', { p_code: code });
    if (error) {
      console.error('verify_cert error:', error.message);
      return null;
    }
    return data as VerifyResult;
  } catch (err) {
    console.error('verify_cert exception:', err);
    return null;
  }
}

export async function generateMetadata({ params }: { params: { code: string; locale: string } }): Promise<Metadata> {
  const brand = await getPlatformBrand();
  const data = await verifyCert(params.code);
  if (!data?.ok) {
    return { title: `Certificado · ${brand.name}` };
  }
  const dateStr = new Date(data.issued_at!).toLocaleDateString(params.locale);
  const title = `${data.student_name} · ${data.course_title} · ${brand.name}`;
  const description = `${data.student_name} concluiu "${data.course_title}" na ${brand.name} em ${dateStr}.`;
  return {
    title,
    description,
    openGraph: { title, description, type: 'website', siteName: brand.name },
    twitter: { card: 'summary_large_image', title, description },
    robots: { index: true, follow: true },
  };
}

export default async function CertificatePage({ params }: { params: { code: string; locale: string } }) {
  const t = await getTranslations({ locale: params.locale });
  const brand = await getPlatformBrand();
  const data = await verifyCert(params.code);

  if (!data?.ok) {
    const errKey = data?.error === 'revoked' ? 'cert.revoked' : data?.error === 'private' ? 'cert.private' : 'cert.not_found_desc';
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 px-4">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">{t('cert.not_found')}</h1>
          <p className="text-slate-600">{t(errKey as any)}</p>
          <code className="block mt-4 text-xs text-slate-400 font-mono">{params.code}</code>
        </div>
      </div>
    );
  }

  const issuedDate = new Date(data.issued_at!);
  const dateStr = issuedDate.toLocaleDateString(params.locale, {
    year: 'numeric', month: 'long', day: 'numeric',
  });
  const domain = brand.url.replace(/^https?:\/\//, '').replace(/\/$/, '');

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-amber-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border-4 border-indigo-100">
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-8 py-6 text-white">
            <div className="flex items-center justify-between">
              <div className="text-2xl md:text-3xl font-bold tracking-tight">🧠 {brand.name}</div>
              <div className="text-[10px] md:text-xs uppercase tracking-widest opacity-80 font-mono">
                {data.certificate_number}
              </div>
            </div>
          </div>

          <div className="px-6 md:px-12 py-12 text-center">
            <div className="text-xs md:text-sm uppercase tracking-widest text-slate-500 mb-2">
              {t('cert.title_completion')}
            </div>
            <div className="text-sm md:text-base text-slate-600 mb-6">{t('cert.awarded_to')}</div>

            <h1 className="text-3xl md:text-5xl font-serif font-bold text-slate-900 mb-8 leading-tight">
              {data.student_name}
            </h1>

            <div className="text-sm md:text-base text-slate-600 mb-2">{t('cert.for_completion')}</div>

            <h2 className="text-xl md:text-3xl font-semibold text-indigo-700 mb-8 leading-snug">
              &ldquo;{data.course_title}&rdquo;
            </h2>

            {(data.skills?.length ?? 0) > 0 && (
              <div className="flex flex-wrap justify-center gap-2 mb-8">
                {data.skills!.map((s: string) => (
                  <span key={s} className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-xs md:text-sm font-medium">
                    {s}
                  </span>
                ))}
              </div>
            )}

            <div className="border-t border-slate-200 pt-6 mt-8 grid grid-cols-3 gap-4 text-xs md:text-sm">
              <div>
                <div className="text-slate-400 text-[10px] md:text-xs uppercase tracking-wide mb-1">{t('cert.issued')}</div>
                <div className="text-slate-900 font-medium">{dateStr}</div>
              </div>
              <div>
                <div className="text-slate-400 text-[10px] md:text-xs uppercase tracking-wide mb-1">{t('cert.level')}</div>
                <div className="text-slate-900 font-medium capitalize">{data.course_level ?? '—'}</div>
              </div>
              <div>
                <div className="text-slate-400 text-[10px] md:text-xs uppercase tracking-wide mb-1">{t('cert.verifications')}</div>
                <div className="text-slate-900 font-medium">{data.verified_count ?? 0}</div>
              </div>
            </div>
          </div>

          <div className="bg-slate-50 px-6 md:px-8 py-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-2">
            <div className="text-[10px] md:text-xs text-slate-500 break-all">
              {t('cert.verify_at')} <span className="font-mono">{domain}/certificate/{data.verification_code}</span>
            </div>
            <div className="text-xs text-slate-600 font-medium whitespace-nowrap">
              {t('cert.authenticated')}
            </div>
          </div>
        </div>

        <div className="mt-8">
          <ShareButtons
            code={data.verification_code!}
            courseTitle={data.course_title!}
            studentName={data.student_name!}
            shareText={t('cert.share_text')}
            title={t('cert.share_title')}
            copyLabel={t('cert.share_copy_link')}
            copiedLabel={t('cert.share_copied')}
          />
        </div>
      </div>
    </div>
  );
}
