interface StatsData {
  items: { l: string; v: string }[];
}

export function Stats({ data }: { data: StatsData }) {
  if (!data?.items?.length) return null;
  return (
    <section className="bg-white border-y border-slate-200">
      <div className="max-w-6xl mx-auto px-4 py-10">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
          {data.items.map((item, i) => (
            <div key={i} className="text-center">
              <div className="text-3xl sm:text-4xl font-bold text-brand-700 tabular-nums">{item.v}</div>
              <div className="text-sm text-slate-500 mt-1">{item.l}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
