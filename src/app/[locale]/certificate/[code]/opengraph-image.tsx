import { ImageResponse } from 'next/og';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '@/lib/supabase/config';

export const runtime = 'edge';
export const alt = 'NeuroLearn Certificate';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

interface Cert { ok: boolean; certificate_number?: string; student_name?: string; course_title?: string; issued_at?: string; instructor_name?: string }

export default async function Image({ params }: { params: { code: string } }) {
  let cert: Cert = { ok: false };
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/nl_verify_certificate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` },
      body: JSON.stringify({ p_code: params.code }),
    });
    if (res.ok) cert = await res.json();
  } catch {}

  const studentName = cert.ok ? cert.student_name : 'Certificado';
  const courseTitle = cert.ok ? cert.course_title : 'NeuroLearn';
  const issuedAt = cert.ok && cert.issued_at ? new Date(cert.issued_at).toLocaleDateString('pt-PT', { day: 'numeric', month: 'long', year: 'numeric' }) : '';
  const certNum = cert.ok ? cert.certificate_number : '';
  const instructor = cert.ok ? cert.instructor_name : '';

  return new ImageResponse(
    (
      <div style={{
        height: '100%', width: '100%', display: 'flex', flexDirection: 'column',
        background: 'linear-gradient(135deg, #f8fafc 0%, #ede9fe 100%)',
        fontFamily: 'sans-serif', padding: '60px',
      }}>
        {/* Top accent bar */}
        <div style={{ height: '8px', background: 'linear-gradient(90deg, #7c3aed 0%, #6366f1 50%, #a855f7 100%)', borderRadius: '4px', marginBottom: '40px', display: 'flex' }} />

        {/* Header row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div style={{ fontSize: '24px', fontWeight: 700, color: '#7c3aed', letterSpacing: '2px', display: 'flex' }}>NEUROLEARN</div>
          <div style={{ fontSize: '14px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '3px', fontWeight: 600, display: 'flex' }}>✓ VERIFICADO</div>
        </div>

        {/* Certificate title */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '30px' }}>
          <div style={{ fontSize: '20px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '6px', fontWeight: 600, display: 'flex' }}>Certificado de</div>
          <div style={{ fontSize: '52px', color: '#1e293b', fontWeight: 700, fontStyle: 'italic', marginTop: '8px', display: 'flex' }}>Conclusão</div>
        </div>

        {/* Student name */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '40px' }}>
          <div style={{ fontSize: '16px', color: '#64748b', display: 'flex' }}>concedido a</div>
          <div style={{ fontSize: '64px', color: '#0f172a', fontWeight: 800, marginTop: '8px', textAlign: 'center', maxWidth: '1000px', display: 'flex' }}>{studentName}</div>
        </div>

        {/* Course title */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '30px' }}>
          <div style={{ fontSize: '16px', color: '#64748b', display: 'flex' }}>por concluir</div>
          <div style={{ fontSize: '32px', color: '#334155', fontWeight: 600, marginTop: '8px', textAlign: 'center', maxWidth: '1000px', display: 'flex' }}>{courseTitle}</div>
        </div>

        {/* Footer */}
        <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', fontSize: '14px', color: '#64748b' }}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ textTransform: 'uppercase', letterSpacing: '2px', fontWeight: 600, fontSize: '11px', display: 'flex' }}>Data</div>
            <div style={{ fontSize: '16px', color: '#1e293b', fontWeight: 600, marginTop: '4px', display: 'flex' }}>{issuedAt}</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ textTransform: 'uppercase', letterSpacing: '2px', fontWeight: 600, fontSize: '11px', display: 'flex' }}>Instrutor</div>
            <div style={{ fontSize: '16px', color: '#1e293b', fontWeight: 600, marginTop: '4px', display: 'flex' }}>{instructor}</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
            <div style={{ textTransform: 'uppercase', letterSpacing: '2px', fontWeight: 600, fontSize: '11px', display: 'flex' }}>Nº Certificado</div>
            <div style={{ fontSize: '14px', color: '#1e293b', fontFamily: 'monospace', marginTop: '4px', display: 'flex' }}>{certNum}</div>
          </div>
        </div>
      </div>
    ),
    size,
  );
}
