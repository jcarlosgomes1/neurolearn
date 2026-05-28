import { Header } from '@/components/layout/Header';
import { Link } from '@/i18n/routing';
import { fmtDate } from '@/lib/utils/cn';
import { SUPABASE_URL } from '@/lib/supabase/config';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Verificar certificado' };

export default async function VerifyPage({ params }: { params: Promise<{ cert: string }> }) {
  const { cert } = await params;
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
              <div className="text-6xl mb-3">\u2705</div>
              <h1 className="text-2xl font-bold text-emerald-700">Certificado v\u00e1lido</h1>
              <div className="mt-6 space-y-3 text-left bg-slate-50 rounded-lg p-4">
                <Row label="N\u00famero" value={result.certificate.certificate_number} mono />
                <Row label="Atribu\u00eddo a" value={result.certificate.recipient_name} />
                <Row label="Curso" value={result.certificate.course_title} />
                <Row label="Emitido em" value={fmtDate(result.certificate.issued_at)} />
              </div>
              <p className="mt-6 text-xs text-slate-500">\u{1F9E0} Emitido por NeuroLearn</p>
            </>
          ) : (
            <>
              <div className="text-6xl mb-3">\u274C</div>
              <h1 className="text-2xl font-bold text-rose-700">Certificado n\u00e3o encontrado</h1>
              <p className="mt-3 text-sm text-slate-600">O n\u00famero <span className="font-mono">{cert}</span> n\u00e3o corresponde a nenhum certificado emitido.</p>
            </>
          )}
          <Link href="/" className="mt-8 inline-block text-sm text-brand-600 hover:underline">\u2190 Voltar \u00e0 p\u00e1gina inicial</Link>
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
