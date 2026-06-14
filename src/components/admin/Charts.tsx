'use client';

// Gráficos em SVG puro — sem dependências, controlo total, zero risco de build.

export function FunnelChart({ data }: { data: Array<{ label: string; count: number; color: string; monetized?: boolean }> }) {
  const max = Math.max(1, ...data.map((d) => d.count));
  return (
    <div className="space-y-2">
      {data.map((d, i) => {
        const pct = Math.round((d.count / max) * 100);
        const widthPct = Math.max(8, pct); // largura minima para legibilidade
        return (
          <div key={i} className="flex items-center gap-3">
            <div className="w-24 text-right text-xs text-slate-500 flex-shrink-0">{d.label}</div>
            <div className="flex-1 h-8 bg-slate-50 rounded-lg overflow-hidden relative">
              <div className="h-full rounded-lg flex items-center justify-end px-2 transition-all duration-700"
                style={{ width: `${widthPct}%`, background: d.color }}>
                <span className="text-xs font-bold text-white">{d.count}</span>
              </div>
              {d.monetized && <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px]">💰</span>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function Sparkline({ points, color = '#6366f1', height = 48, label }: { points: number[]; color?: string; height?: number; label?: string }) {
  if (!points.length) return <div className="text-xs text-slate-300 py-4">sem dados</div>;
  const max = Math.max(1, ...points);
  const min = Math.min(0, ...points);
  const range = max - min || 1;
  const w = 100;
  const step = points.length > 1 ? w / (points.length - 1) : w;
  const coords = points.map((p, i) => `${(i * step).toFixed(1)},${(height - ((p - min) / range) * height).toFixed(1)}`);
  const path = `M ${coords.join(' L ')}`;
  const area = `${path} L ${w},${height} L 0,${height} Z`;
  return (
    <svg viewBox={`0 0 ${w} ${height}`} preserveAspectRatio="none" className="w-full" style={{ height }}>
      <defs>
        <linearGradient id={`grad-${color.replace('#','')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#grad-${color.replace('#','')})`} />
      <path d={path} fill="none" stroke={color} strokeWidth="2" vectorEffect="non-scaling-stroke" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

export function ForecastBar({ current, forecast, color = '#6366f1' }: { current: number; forecast: number; color?: string }) {
  const max = Math.max(1, current, forecast);
  return (
    <div className="space-y-1.5 mt-2">
      <div className="flex items-center gap-2">
        <span className="w-16 text-[10px] text-slate-400">atual/sem</span>
        <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
          <div className="h-full rounded-full" style={{ width: `${(current / max) * 100}%`, background: '#cbd5e1' }} />
        </div>
        <span className="text-[10px] tabular-nums text-slate-500 w-12 text-right">{current}</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="w-16 text-[10px] text-slate-400">previsão</span>
        <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
          <div className="h-full rounded-full transition-all duration-700" style={{ width: `${(forecast / max) * 100}%`, background: color }} />
        </div>
        <span className="text-[10px] tabular-nums font-semibold w-12 text-right" style={{ color }}>{forecast}</span>
      </div>
    </div>
  );
}
