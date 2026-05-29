import { Link } from '@/i18n/routing';

interface StatProps {
  icon: string;
  label: string;
  value: string | number;
  accent?: 'brand' | 'emerald' | 'amber' | 'purple' | 'rose' | 'slate';
  href?: string;
}

const COLORS: Record<string, string> = {
  brand: 'bg-brand-100 text-brand-700',
  emerald: 'bg-emerald-100 text-emerald-700',
  amber: 'bg-amber-100 text-amber-700',
  purple: 'bg-purple-100 text-purple-700',
  rose: 'bg-rose-100 text-rose-700',
  slate: 'bg-slate-100 text-slate-600',
};

export function Stat({ icon, label, value, accent = 'brand', href }: StatProps) {
  const inner = (
    <>
      <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center text-base sm:text-lg flex-shrink-0 ${COLORS[accent]}`}>{icon}</div>
      <div className="min-w-0 flex-1">
        <div className="text-xl sm:text-2xl font-bold tabular-nums text-slate-900 truncate leading-tight">{value}</div>
        <div className="text-[11px] sm:text-xs text-slate-500 truncate">{label}</div>
      </div>
    </>
  );
  if (href) {
    return (
      <Link href={href as any} className="bg-white rounded-xl border border-slate-200 p-3 sm:p-4 flex items-center gap-2 sm:gap-3 hover:border-brand-300 hover:shadow-md transition-all group active:scale-[0.98] touch-manipulation">
        {inner}
        <span className="hidden sm:inline ml-auto text-slate-300 group-hover:text-brand-500 transition-colors text-sm">→</span>
      </Link>
    );
  }
  return <div className="bg-white rounded-xl border border-slate-200 p-3 sm:p-4 flex items-center gap-2 sm:gap-3">{inner}</div>;
}
