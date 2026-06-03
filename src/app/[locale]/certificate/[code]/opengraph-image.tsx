import { ImageResponse } from 'next/og';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'edge';
export const alt = 'NeuroLearn Certificate';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image({ params }: { params: { code: string; locale: string } }) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
  const { data } = await supabase.rpc('nl_verify_certificate', { p_code: params.code });

  if (!data?.ok) {
    return new ImageResponse(
      (
        <div style={{
          background: '#f8fafc', width: '100%', height: '100%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'system-ui, sans-serif',
        }}>
          <div style={{ fontSize: 48, color: '#64748b' }}>Certificado · NeuroLearn</div>
        </div>
      ),
      { ...size },
    );
  }

  const date = new Date(data.issued_at).toLocaleDateString(params.locale, {
    year: 'numeric', month: 'long', day: 'numeric',
  });

  return new ImageResponse(
    (
      <div style={{
        background: 'linear-gradient(135deg, #4f46e5 0%, #9333ea 100%)',
        width: '100%', height: '100%',
        display: 'flex', flexDirection: 'column',
        padding: 60, color: 'white',
        fontFamily: 'system-ui, sans-serif',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: 36, fontWeight: 700, display: 'flex' }}>🧠 NeuroLearn</div>
          <div style={{ fontSize: 16, opacity: 0.8, fontFamily: 'monospace' }}>{data.certificate_number}</div>
        </div>

        <div style={{
          flex: 1, display: 'flex', flexDirection: 'column',
          justifyContent: 'center', marginTop: 20,
        }}>
          <div style={{
            fontSize: 18, opacity: 0.85, marginBottom: 14,
            letterSpacing: 4, textTransform: 'uppercase',
            display: 'flex',
          }}>
            Certificado de Conclusão
          </div>
          <div style={{
            fontSize: 68, fontWeight: 700, marginBottom: 24,
            lineHeight: 1.05, display: 'flex',
          }}>
            {data.student_name}
          </div>
          <div style={{ fontSize: 20, opacity: 0.85, marginBottom: 10, display: 'flex' }}>
            concluiu com sucesso
          </div>
          <div style={{
            fontSize: 36, fontWeight: 600, opacity: 0.95,
            lineHeight: 1.2, display: 'flex',
          }}>
            &ldquo;{data.course_title}&rdquo;
          </div>
        </div>

        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          borderTop: '1px solid rgba(255,255,255,0.3)', paddingTop: 20,
        }}>
          <div style={{ fontSize: 16, opacity: 0.9, display: 'flex' }}>
            ✓ Verificável · neurolearn-rosy.vercel.app
          </div>
          <div style={{ fontSize: 16, opacity: 0.9, display: 'flex' }}>{date}</div>
        </div>
      </div>
    ),
    { ...size },
  );
}
