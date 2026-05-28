export function DashboardSkeleton({ stats = 5 }: { stats?: number }) {
  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      <div className="h-8 w-64 rounded-lg bg-slate-200 animate-pulse" />
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {Array.from({ length: stats }).map((_, i) => (
          <div key={i} className="h-20 rounded-xl bg-slate-200 animate-pulse" />
        ))}
      </div>
      <div className="h-64 rounded-xl bg-slate-200 animate-pulse" />
    </div>
  );
}
