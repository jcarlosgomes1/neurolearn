export function ContentSkeleton() {
  return (
    <div className="space-y-6">
      <style>{'@keyframes nlShimmer{100%{transform:translateX(100%)}}.nl-sk{position:relative;overflow:hidden;background:#e8edf2;border-radius:.6rem}.nl-sk::after{content:"";position:absolute;inset:0;transform:translateX(-100%);background:linear-gradient(90deg,transparent,rgba(255,255,255,.65),transparent);animation:nlShimmer 1.4s infinite}'}</style>
      <div className="space-y-3">
        <div className="nl-sk h-7 w-2/5" />
        <div className="nl-sk h-4 w-3/5" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-slate-200 bg-white p-5 space-y-3">
            <div className="nl-sk h-5 w-1/2" />
            <div className="nl-sk h-3 w-full" />
            <div className="nl-sk h-3 w-4/5" />
            <div className="nl-sk h-24 w-full !rounded-xl" />
          </div>
        ))}
      </div>
    </div>
  );
}
