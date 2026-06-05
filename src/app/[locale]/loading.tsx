export default function Loading() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-4">
      <div className="h-8 w-1/3 bg-slate-200 rounded animate-pulse" />
      <div className="space-y-2">
        <div className="h-4 w-full bg-slate-200 rounded animate-pulse" />
        <div className="h-4 w-5/6 bg-slate-200 rounded animate-pulse" />
        <div className="h-4 w-4/6 bg-slate-200 rounded animate-pulse" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-6">
        <div className="h-32 bg-slate-100 rounded-xl animate-pulse" />
        <div className="h-32 bg-slate-100 rounded-xl animate-pulse" />
        <div className="h-32 bg-slate-100 rounded-xl animate-pulse" />
        <div className="h-32 bg-slate-100 rounded-xl animate-pulse" />
      </div>
    </div>
  );
}
