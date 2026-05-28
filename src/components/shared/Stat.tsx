interface StatProps {
  icon: string;
  label: string;
  value: string | number;
  accent?: 'brand' | 'emerald' | 'amber' | 'purple' | 'rose' | 'slate';
}

const COLORS: Record<string, string> = {
  brand: 'bg-brand-100 text-brand-700',
  emerald: 'bg-emerald-100 text-emerald-700',
  amber: 'bg-amber-100 text-amber-700',
  purple: 'bg-purple-100 text-purple-700',
  rose: 'bg-rose-100 text-rose-700',
  slate: 'bg-slate-100 text-slate-600',
};

export function Stat({ icon, label, value, accent = 'brand' }: StatProps) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-3">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg ${COLORS[accent]}`}>
        {icon}
      </div>
      <div className="min-w-0">
        <div className="text-2xl font-bold tabular-nums text-slate-900 truncate">{value}</div>
        <div className="text-xs text-slate-500">{label}</div>
      </div>
    </div>
  );
}
