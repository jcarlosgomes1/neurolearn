import { ImageResponse } from 'next/og';
import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '@/lib/supabase/config';

export const runtime = 'edge';
export const alt = 'Forma a tua equipa, sem fricção.';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

async function getBrand() {
  try {
    const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data } = await sb.from('nl_platform_config').select('key, value').in('key', ['company_name', 'site_url']);
    const m: Record<string, string> = {};
    for (const r of (data || []) as Array<{ key: string; value: string }>) m[r.key] = r.value;
    return {
      name: (m.company_name || 'NeuroLearn').trim(),
      domain: (m.site_url || 'https://neurolearn-rosy.vercel.app').replace(/^https?:\/\//, '').replace(/\/$/, '').trim(),
    };
  } catch {
    return { name: 'NeuroLearn', domain: 'neurolearn-rosy.vercel.app' };
  }
}

export default async function Image() {
  const brand = await getBrand();
  return new ImageResponse(
    (
      <div style={{
        height: '100%', width: '100%', display: 'flex',
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)',
        position: 'relative',
        padding: 60,
      }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 6, background: 'linear-gradient(90deg, #6366f1, #8b5cf6, #ec4899)' }} />
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', width: '100%', height: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <span style={{ fontSize: 72 }}>🧠</span>
            <span style={{ fontSize: 48, fontWeight: 800, color: 'white', letterSpacing: -1 }}>{brand.name}</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ fontSize: 68, fontWeight: 800, color: 'white', lineHeight: 1.05, letterSpacing: -2 }}>
              Forma a tua equipa.<br />
              <span style={{ color: '#a5b4fc' }}>Sem fricção.</span>
            </div>
            <div style={{ fontSize: 24, color: '#94a3b8', maxWidth: 800 }}>
              Gera cursos a partir dos teus manuais internos. Plataforma B2B + B2C + Talent.
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 16 }}>
            <div style={{ fontSize: 18, color: '#64748b' }}>{brand.domain}</div>
            <div style={{ display: 'flex', gap: 8 }}>
              {['B2C', 'B2B', 'LMS', 'Talent'].map((badge) => (
                <span key={badge} style={{
                  padding: '6px 14px', borderRadius: 8, fontSize: 16, fontWeight: 600,
                  background: 'rgba(99, 102, 241, 0.15)', color: '#a5b4fc',
                  border: '1px solid rgba(99, 102, 241, 0.3)',
                }}>{badge}</span>
              ))}
            </div>
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
