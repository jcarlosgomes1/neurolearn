import type { CSSProperties } from 'react';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

interface Accent { base: string; soft: string; deep: string; }

export default async function DesignPreviewPage({ params }: { params: Promise<{ locale: string; id: string }> }) {
  const { id } = await params;
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect('/auth/login?next=/admin/design');
  const { data: profile } = await sb.from('nl_profiles').select('role').eq('id', user.id).single();
  if (!profile || !['admin', 'super_admin'].includes(profile.role)) redirect('/');

  const { data } = await sb.rpc('nl_design_full', { p_id: id });
  if (!data) {
    return (
      <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', fontFamily: 'system-ui,sans-serif', color: '#475569', background: '#f8fafc' }}>
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontSize: 18, fontWeight: 600 }}>Direção não encontrada</p>
          <p style={{ fontSize: 13, marginTop: 6, fontFamily: 'ui-monospace,monospace' }}>{id}</p>
          <a href="/admin/design" style={{ display: 'inline-block', marginTop: 18, fontSize: 14, color: '#2563eb' }}>← Voltar ao gestor de design</a>
        </div>
      </div>
    );
  }

  const name: string = data.name ?? id;
  const mode: string = data.mode ?? 'light';
  const fontImport: string | null = data.font_import ?? null;
  const t: any = data.tokens ?? {};

  const paper = t.paper ?? '#ffffff';
  const ink = t.ink ?? '#0f172a';
  const ink2 = t.ink2 ?? '#475569';
  const ink3 = t.ink3 ?? '#94a3b8';
  const card = t.card ?? '#ffffff';
  const line = t.line ?? 'rgba(15,23,42,.1)';
  const accent = t.accent ?? '#7c3aed';
  const accentTint = t.accentTint ?? 'rgba(124,58,237,.12)';
  const accentBright = t.accentBright ?? accent;
  const fdisplay = t.fdisplay ?? "'Inter',system-ui,sans-serif";
  const fbody = t.fbody ?? "'Inter',system-ui,sans-serif";
  const wDisplay = t.w?.display ?? 700;
  const wH2 = t.w?.h2 ?? 600;
  const shadow = t.surface?.shadow ?? '0 1px 3px rgba(15,23,42,.08),0 1px 2px rgba(15,23,42,.04)';
  const accents: Record<string, Accent> = t.accents ?? {};
  const accentList = Object.entries(accents);

  const cardStyle: CSSProperties = { background: card, border: `1px solid ${line}`, borderRadius: 18, boxShadow: shadow };
  const dispName = fdisplay.split(',')[0].replace(/'/g, '');
  const bodyName = fbody.split(',')[0].replace(/'/g, '');

  return (
    <div style={{ minHeight: '100vh', background: paper, color: ink, fontFamily: fbody }}>
      {fontImport ? <link rel="stylesheet" href={fontImport} /> : null}

      <div style={{ borderBottom: `1px solid ${line}`, padding: '14px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, background: card }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ width: 12, height: 12, borderRadius: 999, background: accent, display: 'inline-block' }} />
          <span style={{ fontWeight: 700, fontFamily: fdisplay }}>{name}</span>
          <span style={{ fontFamily: 'ui-monospace,monospace', fontSize: 11, color: ink3, textTransform: 'uppercase', letterSpacing: '.05em' }}>{id}</span>
        </div>
        <span style={{ fontSize: 12, color: accentBright, background: accentTint, padding: '4px 10px', borderRadius: 999, fontWeight: 600 }}>Pré-visualização · {mode}</span>
      </div>

      <div style={{ maxWidth: 960, margin: '0 auto', padding: '48px 24px 80px' }}>
        <p style={{ color: accentBright, fontWeight: 700, fontSize: 13, letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 14 }}>Amostra de marca</p>
        <h1 style={{ fontFamily: fdisplay, fontWeight: wDisplay, fontSize: 'clamp(34px,6vw,60px)', lineHeight: 1.05, letterSpacing: '-.02em', margin: 0 }}>
          Aprender com profundidade.
        </h1>
        <p style={{ color: ink2, fontSize: 19, lineHeight: 1.55, marginTop: 18, maxWidth: 620 }}>
          Esta página é gerada a partir dos tokens desta direção — tipografia, cor de acento, superfície e paleta refletem exatamente o que verias no site se a tornasses ativa.
        </p>
        <div style={{ display: 'flex', gap: 12, marginTop: 26, flexWrap: 'wrap' }}>
          <span style={{ background: accent, color: '#fff', fontWeight: 600, padding: '12px 22px', borderRadius: 12, boxShadow: shadow }}>Começar agora</span>
          <span style={{ border: `1px solid ${line}`, color: ink, fontWeight: 600, padding: '12px 22px', borderRadius: 12, background: card }}>Ver cursos</span>
        </div>

        <div style={{ marginTop: 56, ...cardStyle, padding: '28px 28px 8px' }}>
          <h2 style={{ fontFamily: fdisplay, fontWeight: wH2, fontSize: 13, color: ink3, textTransform: 'uppercase', letterSpacing: '.06em', margin: 0 }}>Tipografia</h2>
          <h3 style={{ fontFamily: fdisplay, fontSize: 30, margin: '14px 0 0' }}>Display · {dispName}</h3>
          <p style={{ fontSize: 16, color: ink, marginTop: 10, lineHeight: 1.6 }}>Corpo de texto · {bodyName}. O sítio onde se lê uma lição inteira sem cansar a vista, com bom contraste e ritmo de leitura.</p>
          <p style={{ fontSize: 13, color: ink3, marginTop: 10, marginBottom: 24 }}>Texto secundário e legendas usam tons mais suaves do tinteiro.</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 16, marginTop: 24 }}>
          {[['Cursos', 'Trilhos guiados com prática real.'], ['Mentoria', 'Sessões com especialistas.'], ['Certificação', 'Competências validadas.']].map(([ti, de], i) => (
            <div key={i} style={{ ...cardStyle, padding: 22 }}>
              <span style={{ display: 'inline-block', fontSize: 11, fontWeight: 700, color: accentBright, background: accentTint, padding: '3px 9px', borderRadius: 999 }}>0{i + 1}</span>
              <h3 style={{ fontFamily: fdisplay, fontSize: 19, margin: '14px 0 6px' }}>{ti}</h3>
              <p style={{ color: ink2, fontSize: 14, lineHeight: 1.55, margin: 0 }}>{de}</p>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 48 }}>
          <h2 style={{ fontFamily: fdisplay, fontWeight: wH2, fontSize: 13, color: ink3, textTransform: 'uppercase', letterSpacing: '.06em', margin: '0 0 16px' }}>Paleta de acentos</h2>
          {accentList.length === 0 ? (
            <p style={{ color: ink3, fontSize: 14 }}>Sem paleta definida.</p>
          ) : (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
              {accentList.map(([k, c]) => (
                <div key={k} style={{ borderRadius: 14, overflow: 'hidden', border: `1px solid ${line}`, width: 132, boxShadow: shadow }}>
                  <div style={{ height: 54, background: c.base }} />
                  <div style={{ padding: '8px 10px', background: c.soft }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: c.deep, textTransform: 'capitalize' }}>{k}</div>
                    <div style={{ fontFamily: 'ui-monospace,monospace', fontSize: 10, color: c.deep, opacity: 0.85 }}>{c.base}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
