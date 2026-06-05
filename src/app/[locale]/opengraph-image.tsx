import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'NeuroLearn — Cursos com IA';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image() {
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
            <span style={{ fontSize: 48, fontWeight: 800, color: 'white', letterSpacing: -1 }}>NeuroLearn</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ fontSize: 68, fontWeight: 800, color: 'white', lineHeight: 1.05, letterSpacing: -2 }}>
              Forma a tua equipa.<br />
              <span style={{ color: '#a5b4fc' }}>Sem fricção.</span>
            </div>
            <div style={{ fontSize: 24, color: '#94a3b8', maxWidth: 800 }}>
              A IA gera cursos a partir dos teus manuais internos. Plataforma B2B + B2C + Talent.
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 16 }}>
            <div style={{ fontSize: 18, color: '#64748b' }}>neurolearn-rosy.vercel.app</div>
            <div style={{ display: 'flex', gap: 8 }}>
              {['IA', 'B2B', 'LMS', 'Talent'].map((badge) => (
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
