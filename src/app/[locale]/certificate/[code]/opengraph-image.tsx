import { ImageResponse } from 'next/og';
import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '@/lib/supabase/config';

export const runtime = 'edge';
export const alt = 'Certificate';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image({ params }: { params: { code: string; locale: string } }) {
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  let brandName = 'NeuroLearn';
  try {
    const cfg = await supabase.from('nl_platform_config').select('value').eq('key', 'company_name').maybeSingle();
    if (cfg.data?.value) brandName = String(cfg.data.value).trim();
  } catch {}

  let data: any = null;
  try {
    const res = await supabase.rpc('nl_verify_certificate', { p_code: params.code });
    data = res.data;
  } catch {}

  if (!data?.ok) {
    return new ImageResponse(
      (
        <div style={{
          background: '#0f172a', width: '100%', height: '100%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'system-ui, sans-serif',
        }}>
          <div style={{ fontSize: 48, color: '#94a3b8', display: 'flex' }}>Certificado · {brandName}</div>
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
        background: 'radial-gradient(circle at 25% 20%, rgba(168, 85, 247, 0.25) 0%, transparent 50%), linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)',
        width: '100%', height: '100%',
        display: 'flex', flexDirection: 'column',
        padding: '50px 60px', color: 'white',
        fontFamily: 'system-ui, sans-serif',
        position: 'relative',
      }}>
        <div style={{
          position: 'absolute', top: -120, right: -120, width: 360, height: 360,
          borderRadius: '50%', border: '2px solid rgba(251, 191, 36, 0.08)',
          display: 'flex',
        }} />
        <div style={{
          position: 'absolute', top: -60, right: -60, width: 240, height: 240,
          borderRadius: '50%', border: '2px solid rgba(251, 191, 36, 0.12)',
          display: 'flex',
        }} />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ fontSize: 42, display: 'flex' }}>🧠</div>
            <div style={{ fontSize: 28, fontWeight: 700, letterSpacing: -0.5, display: 'flex' }}>{brandName}</div>
          </div>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '8px 16px', borderRadius: 999,
            background: 'rgba(16, 185, 129, 0.15)',
            border: '1px solid rgba(16, 185, 129, 0.4)',
          }}>
            <div style={{ fontSize: 20, display: 'flex', color: '#34d399' }}>✓</div>
            <div style={{ fontSize: 14, fontWeight: 700, letterSpacing: 2, color: '#a7f3d0', display: 'flex' }}>VERIFICADO</div>
          </div>
        </div>

        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 50, marginTop: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <div style={{
              width: 200, height: 200, borderRadius: '50%',
              background: 'radial-gradient(circle at 35% 30%, #fde68a 0%, #f59e0b 50%, #b45309 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 20px 50px rgba(245, 158, 11, 0.35), inset 0 -10px 20px rgba(120, 53, 15, 0.4)',
              border: '4px solid rgba(252, 211, 77, 0.6)',
              position: 'relative',
            }}>
              <div style={{
                position: 'absolute', inset: 14, borderRadius: '50%',
                border: '2px dashed rgba(120, 53, 15, 0.5)', display: 'flex',
              }} />
              <div style={{
                fontSize: 90, display: 'flex',
                textShadow: '0 4px 8px rgba(0,0,0,0.25)',
                color: '#7c2d12',
              }}>★</div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0 }}>
            <div style={{
              fontSize: 14, color: '#fbbf24', letterSpacing: 4,
              textTransform: 'uppercase', marginBottom: 10, display: 'flex',
              fontWeight: 700,
            }}>
              Certificado de Conclusão
            </div>
            <div style={{
              fontSize: 54, fontWeight: 700, lineHeight: 1.05,
              marginBottom: 12, display: 'flex',
              letterSpacing: -1.5,
            }}>
              {data.student_name}
            </div>
            <div style={{ fontSize: 18, color: '#cbd5e1', marginBottom: 8, display: 'flex' }}>
              concluiu com sucesso
            </div>
            <div style={{
              fontSize: 26, fontWeight: 600, lineHeight: 1.2,
              color: '#e0e7ff', display: 'flex',
              maxWidth: 620,
            }}>
              {data.course_title}
            </div>
          </div>
        </div>

        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          paddingTop: 24, marginTop: 20,
          borderTop: '1px solid rgba(255,255,255,0.15)',
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div style={{ fontSize: 12, color: '#94a3b8', letterSpacing: 2, textTransform: 'uppercase', display: 'flex' }}>Nº de certificado</div>
            <div style={{ fontSize: 17, fontWeight: 600, color: 'white', fontFamily: 'monospace', display: 'flex' }}>{data.certificate_number}</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-end' }}>
            <div style={{ fontSize: 12, color: '#94a3b8', letterSpacing: 2, textTransform: 'uppercase', display: 'flex' }}>Emitido</div>
            <div style={{ fontSize: 17, fontWeight: 600, color: 'white', display: 'flex' }}>{date}</div>
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
