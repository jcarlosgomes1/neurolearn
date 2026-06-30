'use client';

import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';

// Teleponto reutilizável: rolagem automática com velocidade e tamanho de letra ajustáveis,
// guião editável. NÃO é gravado no vídeo — é um apoio de leitura para quem apresenta.
export function Teleprompter({ paragraphs, defaultOpen = false }: { paragraphs: string[]; defaultOpen?: boolean }) {
  const t = useTranslations('studio');
  const [open, setOpen] = useState(defaultOpen);
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState((paragraphs || []).join('\n\n'));
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(45); // px/segundo
  const [font, setFont] = useState(24); // px

  const scrollRef = useRef<HTMLDivElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const lastTs = useRef<number | null>(null);
  const acc = useRef(0);

  useEffect(() => {
    if (!playing) {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null; lastTs.current = null;
      return;
    }
    const step = (ts: number) => {
      const el = scrollRef.current;
      if (el) {
        if (lastTs.current != null) {
          const dt = (ts - lastTs.current) / 1000;
          acc.current += speed * dt;
          const whole = Math.floor(acc.current);
          if (whole > 0) { el.scrollTop += whole; acc.current -= whole; }
          if (el.scrollTop + el.clientHeight >= el.scrollHeight - 1) { setPlaying(false); return; }
        }
        lastTs.current = ts;
      }
      rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [playing, speed]);

  function restart() {
    const el = scrollRef.current;
    if (el) el.scrollTop = 0;
    acc.current = 0; lastTs.current = null;
  }

  const blocks = text.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)}
        className="w-full inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-medium text-slate-600 hover:border-slate-300 transition-all">
        📜 {t('tp_open')}
      </button>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-700 bg-slate-900 overflow-hidden shadow-xl">
      <div className="flex items-center gap-2 flex-wrap px-3 py-2 bg-slate-800/90 border-b border-slate-700">
        <button type="button" onClick={() => setPlaying((p) => !p)}
          className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${playing ? 'bg-amber-500/90 text-white hover:bg-amber-500' : 'bg-emerald-500/90 text-white hover:bg-emerald-500'}`}>
          {playing ? <>⏸ {t('tp_pause')}</> : <>▶ {t('tp_play')}</>}
        </button>
        <button type="button" onClick={restart}
          className="inline-flex items-center gap-1 rounded-lg border border-slate-600 px-2.5 py-1.5 text-xs font-medium text-slate-200 hover:bg-slate-700">
          ↺ {t('tp_restart')}
        </button>
        <label className="inline-flex items-center gap-1.5 text-xs text-slate-300">
          {t('tp_speed')}
          <input type="range" min={12} max={130} value={speed} onChange={(e) => setSpeed(Number(e.target.value))} className="accent-brand-500 w-24" />
        </label>
        <div className="inline-flex rounded-lg border border-slate-600 overflow-hidden">
          <button type="button" aria-label="A-" onClick={() => setFont((f) => Math.max(14, f - 2))} className="px-2 py-1.5 text-xs font-semibold text-slate-200 hover:bg-slate-700">A−</button>
          <button type="button" aria-label="A+" onClick={() => setFont((f) => Math.min(52, f + 2))} className="px-2 py-1.5 text-sm font-semibold text-slate-200 hover:bg-slate-700 border-l border-slate-600">A+</button>
        </div>
        <button type="button" onClick={() => setEditing((e) => !e)}
          className="inline-flex items-center gap-1 rounded-lg border border-slate-600 px-2.5 py-1.5 text-xs font-medium text-slate-200 hover:bg-slate-700">
          {editing ? <>✓ {t('tp_done')}</> : <>✎ {t('tp_edit')}</>}
        </button>
        <button type="button" onClick={() => { setOpen(false); setPlaying(false); }} aria-label={t('tp_close')}
          className="ml-auto rounded-lg px-2 py-1.5 text-slate-400 hover:text-white hover:bg-slate-700">✕</button>
      </div>

      {editing ? (
        <textarea value={text} onChange={(e) => setText(e.target.value)} placeholder={t('tp_placeholder')}
          className="w-full h-48 resize-none bg-slate-900 text-slate-100 placeholder:text-slate-500 px-4 py-3 text-[15px] leading-relaxed outline-none" />
      ) : (
        <div ref={scrollRef} className="max-h-60 overflow-y-auto px-5 py-5" style={{ scrollBehavior: 'auto' }}>
          {blocks.length > 0 ? (
            <div className="mx-auto max-w-2xl text-center text-slate-50 font-medium" style={{ fontSize: `${font}px`, lineHeight: 1.75 }}>
              {blocks.map((p, i) => <p key={i} className="mb-5 whitespace-pre-wrap">{p}</p>)}
              <div aria-hidden className="h-40" />
            </div>
          ) : (
            <p className="text-center text-slate-500 text-sm py-6">{t('tp_empty')}</p>
          )}
        </div>
      )}

      <p className="px-4 py-2 text-[11px] text-slate-400 bg-slate-800/60 border-t border-slate-700">{t('tp_hint')}</p>
    </div>
  );
}
